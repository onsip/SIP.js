/**
 * Regression tests for the BroadSoft-related core changes:
 *
 * 1. Session.onNotifyRequest keeps the Established-only rule for generic NOTIFY,
 *    with a narrow carve-out for BroadSoft remote control events (Event: talk/hold)
 *    during Initial/Establishing.
 * 2. Invitation early dialogs delegate ONLY NOTIFY, so the core's default responses
 *    for other in-dialog requests (BYE → 200, INFO → 469, MESSAGE → 200,
 *    re-INVITE → 488) remain in effect before the session is Established.
 */

import { IncomingNotifyRequest } from "../../../../lib/core/messages/methods/notify.js";
import { Invitation } from "../../../../lib/api/invitation.js";
import { Session } from "../../../../lib/api/session.js";
import { SessionState } from "../../../../lib/api/session-state.js";

interface OnNotifyRequestCaller {
  onNotifyRequest(request: IncomingNotifyRequest): void;
}

function makeSession(state: SessionState): Session & { delegateNotifications: unknown[] } {
  // Session is abstract with heavyweight construction; onNotifyRequest only touches
  // state, logger, the private REFER hook (undefined here) and the delegate.
  const session = Object.create(Session.prototype);
  session._state = state;
  session.logger = {
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
  session.delegateNotifications = [];
  session.delegate = {
    onNotify: (notification: unknown) => session.delegateNotifications.push(notification)
  };
  return session;
}

function makeNotifyRequest(eventHeader: string | undefined): IncomingNotifyRequest & { accept: jasmine.Spy } {
  return {
    message: {
      getHeader: (name: string) => (name.toLowerCase() === "event" ? eventHeader : undefined),
      body: ""
    },
    accept: jasmine.createSpy("accept"),
    reject: jasmine.createSpy("reject")
  } as unknown as IncomingNotifyRequest & { accept: jasmine.Spy };
}

function dispatch(session: Session, request: IncomingNotifyRequest): void {
  (session as unknown as OnNotifyRequestCaller).onNotifyRequest(request);
}

describe("Session.onNotifyRequest state rule", () => {
  it("dispatches NOTIFY to the delegate when Established (unchanged behavior)", () => {
    const session = makeSession(SessionState.Established);
    dispatch(session, makeNotifyRequest("presence"));
    expect(session.delegateNotifications.length).toBe(1);
  });

  it("auto-accepts an Established NOTIFY when no delegate is set (unchanged behavior)", () => {
    const session = makeSession(SessionState.Established);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (session as any).delegate = undefined;
    const request = makeNotifyRequest("presence");
    dispatch(session, request);
    expect(request.accept).toHaveBeenCalled();
  });

  it("dispatches Event: talk during Initial (BroadSoft carve-out)", () => {
    const session = makeSession(SessionState.Initial);
    dispatch(session, makeNotifyRequest("talk"));
    expect(session.delegateNotifications.length).toBe(1);
  });

  it("dispatches Event: hold during Establishing (BroadSoft carve-out)", () => {
    const session = makeSession(SessionState.Establishing);
    dispatch(session, makeNotifyRequest("hold"));
    expect(session.delegateNotifications.length).toBe(1);
  });

  it("dispatches Event: talk with parameters, case-insensitively", () => {
    const session = makeSession(SessionState.Initial);
    dispatch(session, makeNotifyRequest("Talk; id=123"));
    expect(session.delegateNotifications.length).toBe(1);
  });

  it("drops a non-BroadSoft NOTIFY during Initial (generic rule preserved)", () => {
    const session = makeSession(SessionState.Initial);
    const request = makeNotifyRequest("presence");
    dispatch(session, request);
    expect(session.delegateNotifications.length).toBe(0);
    expect(request.accept).not.toHaveBeenCalled();
  });

  it("drops a NOTIFY without an Event header during Establishing", () => {
    const session = makeSession(SessionState.Establishing);
    const request = makeNotifyRequest(undefined);
    dispatch(session, request);
    expect(session.delegateNotifications.length).toBe(0);
  });

  it("drops Event: talk while Terminating or Terminated", () => {
    for (const state of [SessionState.Terminating, SessionState.Terminated]) {
      const session = makeSession(state);
      dispatch(session, makeNotifyRequest("talk"));
      expect(session.delegateNotifications.length).withContext(state).toBe(0);
    }
  });
});

describe("Invitation early dialog delegate", () => {
  interface EarlyDelegateCaller {
    setupEarlyDialogDelegate(dialog: { delegate?: object }): void;
  }
  interface FullDelegateCaller {
    setupDialogDelegate(dialog: { delegate?: object }): void;
  }

  it("delegates ONLY onNotify so core defaults keep answering other early-dialog requests", () => {
    const invitation = Object.create(Invitation.prototype);
    const dialog: { delegate?: object } = {};
    (invitation as unknown as EarlyDelegateCaller).setupEarlyDialogDelegate(dialog);
    expect(dialog.delegate).toBeDefined();
    // Exactly one handler: onNotify. Anything more re-introduces the regression where
    // early-dialog BYE/INFO/MESSAGE/re-INVITE were dropped without a SIP response.
    expect(Object.keys(dialog.delegate as object)).toEqual(["onNotify"]);
  });

  it("delegates the full request set on confirmed dialogs", () => {
    const invitation = Object.create(Invitation.prototype);
    const dialog: { delegate?: object } = {};
    (invitation as unknown as FullDelegateCaller).setupDialogDelegate(dialog);
    const keys = Object.keys(dialog.delegate as object).sort();
    expect(keys).toEqual([
      "onAck",
      "onAckTimeout",
      "onBye",
      "onInfo",
      "onInvite",
      "onMessage",
      "onNotify",
      "onPrack",
      "onRefer"
    ]);
  });
});
