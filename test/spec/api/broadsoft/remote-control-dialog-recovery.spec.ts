/**
 * Regression tests for BroadSoft remote control dialog recovery in UserAgentCore.
 *
 * FreeSWITCH (sofia-sip) reverses the dialog roles after the client sends an in-dialog
 * re-INVITE on a server-originated call — which is exactly what `Event: hold` asks it to
 * do — and thereafter stamps its own identity into the To header of every in-dialog request
 * it generates. The follow-up `Event: talk` then matches no dialog and used to be rejected
 * with a 481, leaving the call stuck on hold.
 *
 * The recovery is deliberately narrow: NOTIFY only, talk/hold only, unambiguous match only.
 * These tests pin both the recovery and the untouched behavior around it.
 */

import { UserAgentCore } from "../../../../lib/core/user-agent-core/user-agent-core.js";

interface ReceiveInsideDialogRequestCaller {
  receiveInsideDialogRequest(message: unknown): void;
}

interface FakeDialog {
  id: string;
  callId: string;
  localTag: string;
  remoteTag: string;
  receiveRequest: jasmine.Spy;
}

interface FakeCore {
  dialogs: Map<string, FakeDialog>;
  replyStateless: jasmine.Spy;
}

function makeDialog(id: string, callId: string, localTag: string, remoteTag: string): FakeDialog {
  return { id, callId, localTag, remoteTag, receiveRequest: jasmine.createSpy("receiveRequest") };
}

/**
 * receiveInsideDialogRequest only touches dialogs, subscribers, the logger and replyStateless,
 * so a prototype-backed stand-in exercises the real routing without a live stack.
 */
function makeCore(dialogs: Array<FakeDialog>): UserAgentCore & FakeCore {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const core: any = Object.create(UserAgentCore.prototype);
  core.dialogs = new Map<string, FakeDialog>();
  dialogs.forEach((dialog) => core.dialogs.set(dialog.callId + dialog.localTag + dialog.remoteTag, dialog));
  core.subscribers = new Map();
  core.logger = {
    log: () => {
      /* noop */
    },
    warn: () => {
      /* noop */
    },
    error: () => {
      /* noop */
    }
  };
  core.replyStateless = jasmine.createSpy("replyStateless");
  return core;
}

function makeRequest(options: {
  method?: string;
  callId: string;
  toTag: string;
  fromTag: string;
  event?: string;
}): unknown {
  return {
    method: options.method ?? "NOTIFY",
    callId: options.callId,
    toTag: options.toTag,
    fromTag: options.fromTag,
    parseHeader: (name: string) =>
      name === "Event" && options.event !== undefined ? { event: options.event } : undefined
  };
}

function dispatch(core: UserAgentCore, message: unknown): void {
  (core as unknown as ReceiveInsideDialogRequestCaller).receiveInsideDialogRequest(message);
}

// The shape FreeSWITCH produces after the hold re-INVITE: To tag is a copy of the From tag.
const CALL_ID = "d7db569e-10a5-1240-84ad-8bfb8f47db98";
const SERVER_TAG = "jZNBSH4FeZgXF";
const CLIENT_TAG = "74qgo4o3p0";

describe("UserAgentCore BroadSoft remote control dialog recovery", () => {
  it("routes a well-formed in-dialog NOTIFY normally", () => {
    const dialog = makeDialog("d1", CALL_ID, CLIENT_TAG, SERVER_TAG);
    const core = makeCore([dialog]);
    dispatch(core, makeRequest({ callId: CALL_ID, toTag: CLIENT_TAG, fromTag: SERVER_TAG, event: "talk" }));
    expect(dialog.receiveRequest).toHaveBeenCalled();
    expect(core.replyStateless).not.toHaveBeenCalled();
  });

  it("recovers Event: talk whose To tag was overwritten with the From tag", () => {
    const dialog = makeDialog("d1", CALL_ID, CLIENT_TAG, SERVER_TAG);
    const core = makeCore([dialog]);
    dispatch(core, makeRequest({ callId: CALL_ID, toTag: SERVER_TAG, fromTag: SERVER_TAG, event: "talk" }));
    expect(dialog.receiveRequest).toHaveBeenCalled();
    expect(core.replyStateless).not.toHaveBeenCalled();
  });

  it("recovers Event: hold the same way, case-insensitively and with parameters", () => {
    const dialog = makeDialog("d1", CALL_ID, CLIENT_TAG, SERVER_TAG);
    const core = makeCore([dialog]);
    dispatch(core, makeRequest({ callId: CALL_ID, toTag: SERVER_TAG, fromTag: SERVER_TAG, event: "Hold" }));
    expect(dialog.receiveRequest).toHaveBeenCalled();
    expect(core.replyStateless).not.toHaveBeenCalled();
  });

  it("still rejects a non-BroadSoft NOTIFY with an unmatched To tag", () => {
    const dialog = makeDialog("d1", CALL_ID, CLIENT_TAG, SERVER_TAG);
    const core = makeCore([dialog]);
    dispatch(core, makeRequest({ callId: CALL_ID, toTag: SERVER_TAG, fromTag: SERVER_TAG, event: "presence" }));
    expect(dialog.receiveRequest).not.toHaveBeenCalled();
    expect(core.replyStateless).toHaveBeenCalledWith(jasmine.anything(), { statusCode: 481 });
  });

  it("still rejects a non-NOTIFY request with an unmatched To tag", () => {
    const dialog = makeDialog("d1", CALL_ID, CLIENT_TAG, SERVER_TAG);
    const core = makeCore([dialog]);
    dispatch(core, makeRequest({ method: "BYE", callId: CALL_ID, toTag: SERVER_TAG, fromTag: SERVER_TAG }));
    expect(dialog.receiveRequest).not.toHaveBeenCalled();
    expect(core.replyStateless).toHaveBeenCalledWith(jasmine.anything(), { statusCode: 481 });
  });

  it("does not reach across calls: a different Call-ID is still rejected", () => {
    const dialog = makeDialog("d1", CALL_ID, CLIENT_TAG, SERVER_TAG);
    const core = makeCore([dialog]);
    dispatch(core, makeRequest({ callId: "other-call-id", toTag: SERVER_TAG, fromTag: SERVER_TAG, event: "talk" }));
    expect(dialog.receiveRequest).not.toHaveBeenCalled();
    expect(core.replyStateless).toHaveBeenCalledWith(jasmine.anything(), { statusCode: 481 });
  });

  it("requires the remote tag to match, so a foreign From tag is still rejected", () => {
    const dialog = makeDialog("d1", CALL_ID, CLIENT_TAG, SERVER_TAG);
    const core = makeCore([dialog]);
    dispatch(core, makeRequest({ callId: CALL_ID, toTag: "zzz", fromTag: "zzz", event: "talk" }));
    expect(dialog.receiveRequest).not.toHaveBeenCalled();
    expect(core.replyStateless).toHaveBeenCalledWith(jasmine.anything(), { statusCode: 481 });
  });

  it("rejects rather than guesses when two dialogs share Call-ID and remote tag", () => {
    const first = makeDialog("d1", CALL_ID, CLIENT_TAG, SERVER_TAG);
    const second = makeDialog("d2", CALL_ID, "other-local-tag", SERVER_TAG);
    const core = makeCore([first, second]);
    dispatch(core, makeRequest({ callId: CALL_ID, toTag: SERVER_TAG, fromTag: SERVER_TAG, event: "talk" }));
    expect(first.receiveRequest).not.toHaveBeenCalled();
    expect(second.receiveRequest).not.toHaveBeenCalled();
    expect(core.replyStateless).toHaveBeenCalledWith(jasmine.anything(), { statusCode: 481 });
  });

  it("still rejects a NOTIFY without an Event header with 489", () => {
    const dialog = makeDialog("d1", CALL_ID, CLIENT_TAG, SERVER_TAG);
    const core = makeCore([dialog]);
    dispatch(core, makeRequest({ callId: CALL_ID, toTag: SERVER_TAG, fromTag: SERVER_TAG }));
    expect(dialog.receiveRequest).not.toHaveBeenCalled();
    expect(core.replyStateless).toHaveBeenCalledWith(jasmine.anything(), { statusCode: 489 });
  });
});
