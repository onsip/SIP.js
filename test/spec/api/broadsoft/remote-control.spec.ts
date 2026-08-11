/**
 * BroadSoft Remote Control Tests
 */

import { IncomingNotifyRequest } from "../../../../lib/core/messages/methods/notify.js";
import {
  parseEventHeader,
  parseNotifyBody,
  isBroadSoftNotify,
  parseEventHeaderFromNotification,
  parseNotifyBodyFromNotification,
  isBroadSoftNotification,
  handleRemoteControlNotification,
  handleRemoteControlNotify,
  applyTalkAction,
  applyHoldAction,
  holdModifier,
  resumeModifier
} from "../../../../lib/api/broadsoft/remote-control.js";
import { parseCallInfoHeader } from "../../../../lib/api/broadsoft/call-info-parser.js";
import { BroadSoftEvent, TalkAction, HoldAction } from "../../../../lib/api/broadsoft/types.js";
import { Invitation } from "../../../../lib/api/invitation.js";
import { Notification, Session, SessionState } from "../../../../lib/api/index.js";

describe("BroadSoft Remote Control", () => {
  describe("parseEventHeader", () => {
    it("should parse Event: talk header", () => {
      const mockRequest = {
        message: {
          getHeader: (name: string) => {
            if (name === "event") {
              return "talk";
            }
            return undefined;
          }
        }
      } as unknown as IncomingNotifyRequest;

      const result = parseEventHeader(mockRequest);

      expect(result).toBe(BroadSoftEvent.Talk);
    });

    it("should handle Event header with parameters", () => {
      const mockRequest = {
        message: {
          getHeader: (name: string) => {
            if (name === "event") {
              return "talk; id=123";
            }
            return undefined;
          }
        }
      } as unknown as IncomingNotifyRequest;

      const result = parseEventHeader(mockRequest);

      expect(result).toBe(BroadSoftEvent.Talk);
    });

    it("should return undefined for non-BroadSoft events", () => {
      const mockRequest = {
        message: {
          getHeader: (name: string) => {
            if (name === "event") {
              return "presence";
            }
            return undefined;
          }
        }
      } as unknown as IncomingNotifyRequest;

      const result = parseEventHeader(mockRequest);

      expect(result).toBeUndefined();
    });

    it("should return undefined when Event header is missing", () => {
      const mockRequest = {
        message: {
          getHeader: () => undefined
        }
      } as unknown as IncomingNotifyRequest;

      const result = parseEventHeader(mockRequest);

      expect(result).toBeUndefined();
    });

    it("should handle case-insensitive event values", () => {
      const mockRequest = {
        message: {
          getHeader: (name: string) => {
            if (name === "event") {
              return "TALK";
            }
            return undefined;
          }
        }
      } as unknown as IncomingNotifyRequest;

      const result = parseEventHeader(mockRequest);

      expect(result).toBe(BroadSoftEvent.Talk);
    });
  });

  describe("parseNotifyBody", () => {
    it("should parse talk action from body", () => {
      const mockRequest = {
        message: {
          body: "talk"
        }
      } as unknown as IncomingNotifyRequest;

      const result = parseNotifyBody(mockRequest, BroadSoftEvent.Talk);

      expect(result).toBeDefined();
      expect(result?.event).toBe(BroadSoftEvent.Talk);
      expect(result?.action).toBe(TalkAction.Talk);
    });

    it("should parse mute action from body", () => {
      const mockRequest = {
        message: {
          body: "mute"
        }
      } as unknown as IncomingNotifyRequest;

      const result = parseNotifyBody(mockRequest, BroadSoftEvent.Talk);

      expect(result).toBeDefined();
      expect(result?.event).toBe(BroadSoftEvent.Talk);
      expect(result?.action).toBe(TalkAction.Mute);
    });

    it("should handle case-insensitive body", () => {
      const mockRequest = {
        message: {
          body: "MUTE"
        }
      } as unknown as IncomingNotifyRequest;

      const result = parseNotifyBody(mockRequest, BroadSoftEvent.Talk);

      expect(result).toBeDefined();
      expect(result?.action).toBe(TalkAction.Mute);
    });

    it("should handle body with whitespace", () => {
      const mockRequest = {
        message: {
          body: "  talk  "
        }
      } as unknown as IncomingNotifyRequest;

      const result = parseNotifyBody(mockRequest, BroadSoftEvent.Talk);

      expect(result).toBeDefined();
      expect(result?.action).toBe(TalkAction.Talk);
    });

    it("should return undefined for invalid action", () => {
      const mockRequest = {
        message: {
          body: "invalid-action"
        }
      } as unknown as IncomingNotifyRequest;

      const result = parseNotifyBody(mockRequest, BroadSoftEvent.Talk);

      expect(result).toBeUndefined();
    });

    it("should parse empty body for talk event as Talk action", () => {
      const mockRequest = {
        message: {
          body: undefined
        }
      } as unknown as IncomingNotifyRequest;

      const result = parseNotifyBody(mockRequest, BroadSoftEvent.Talk);

      expect(result).toBeDefined();
      expect(result?.event).toBe(BroadSoftEvent.Talk);
      expect(result?.action).toBe(TalkAction.Talk);
    });

    it("should parse empty string body for talk event as Talk action", () => {
      const mockRequest = {
        message: {
          body: ""
        }
      } as unknown as IncomingNotifyRequest;

      const result = parseNotifyBody(mockRequest, BroadSoftEvent.Talk);

      expect(result).toBeDefined();
      expect(result?.event).toBe(BroadSoftEvent.Talk);
      expect(result?.action).toBe(TalkAction.Talk);
    });

    it("should parse whitespace-only body for talk event as Talk action", () => {
      const mockRequest = {
        message: {
          body: "   "
        }
      } as unknown as IncomingNotifyRequest;

      const result = parseNotifyBody(mockRequest, BroadSoftEvent.Talk);

      expect(result).toBeDefined();
      expect(result?.event).toBe(BroadSoftEvent.Talk);
      expect(result?.action).toBe(TalkAction.Talk);
    });
  });

  describe("isBroadSoftNotify", () => {
    it("should return true for talk event", () => {
      const mockRequest = {
        message: {
          getHeader: (name: string) => {
            if (name === "event") {
              return "talk";
            }
            return undefined;
          }
        }
      } as unknown as IncomingNotifyRequest;

      expect(isBroadSoftNotify(mockRequest)).toBe(true);
    });

    it("should return false for non-BroadSoft event", () => {
      const mockRequest = {
        message: {
          getHeader: (name: string) => {
            if (name === "event") {
              return "presence";
            }
            return undefined;
          }
        }
      } as unknown as IncomingNotifyRequest;

      expect(isBroadSoftNotify(mockRequest)).toBe(false);
    });

    it("should return false when no Event header", () => {
      const mockRequest = {
        message: {
          getHeader: () => undefined
        }
      } as unknown as IncomingNotifyRequest;

      expect(isBroadSoftNotify(mockRequest)).toBe(false);
    });
  });
});

describe("BroadSoft Event: hold", () => {
  function makeNotification(eventHeader: string | undefined, body: string): Notification {
    // Same fake shape the talk specs use: only .request.getHeader / .request.body are read.
    return {
      request: {
        getHeader: (name: string) => (name.toLowerCase() === "event" ? eventHeader : undefined),
        body
      }
    } as unknown as Notification;
  }

  it("parseEventHeaderFromNotification returns Hold for 'hold'", () => {
    const n = makeNotification("hold", "");
    expect(parseEventHeaderFromNotification(n)).toBe(BroadSoftEvent.Hold);
  });

  it("parseEventHeaderFromNotification is case-insensitive", () => {
    const n = makeNotification("HOLD", "");
    expect(parseEventHeaderFromNotification(n)).toBe(BroadSoftEvent.Hold);
  });

  it("parseNotifyBodyFromNotification returns hold action for empty body", () => {
    const n = makeNotification("hold", "");
    const parsed = parseNotifyBodyFromNotification(n, BroadSoftEvent.Hold);
    expect(parsed).toEqual({ event: BroadSoftEvent.Hold, action: HoldAction.Hold });
  });

  it("isBroadSoftNotification recognizes hold", () => {
    expect(isBroadSoftNotification(makeNotification("hold", ""))).toBe(true);
  });

  it("handleRemoteControlNotification invokes onHoldEvent and returns true", async () => {
    const n = makeNotification("hold", "");
    let held: HoldAction | undefined;
    const session = { state: "Terminated" } as unknown as Session; // Terminated → applyHoldAction is a no-op
    const handled = await handleRemoteControlNotification(session, n, {
      enabled: true,
      onHoldEvent: (a) => (held = a)
    });
    expect(handled).toBe(true);
    expect(held).toBe(HoldAction.Hold);
  });

  it("applyHoldAction sends re-INVITE with hold modifier only when Established", async () => {
    let invited = false;
    const session = {
      state: SessionState.Established,
      sessionDescriptionHandlerOptions: {},
      invite: (opts: unknown) => {
        invited = true;
        return Promise.resolve(opts);
      }
    } as unknown as Session;
    await applyHoldAction(session);
    expect(invited).toBe(true);

    invited = false;
    const initial = {
      state: SessionState.Initial,
      invite: () => {
        invited = true;
        return Promise.resolve();
      }
    } as unknown as Session;
    await applyHoldAction(initial);
    expect(invited).toBe(false); // hold in RINGING/DIALING must not execute
  });

  it("holdModifier rewrites SDP directions", async () => {
    const desc = { type: "offer" as RTCSdpType, sdp: "v=0\r\na=sendrecv\r\n" };
    const out = await holdModifier(desc);
    expect(out.sdp).toContain("a=sendonly");
    expect(out.sdp).not.toContain("a=sendrecv");
  });
});

describe("Call-Info parameter case-insensitivity", () => {
  it("parses Answer-After=0 (mixed case param name)", () => {
    const parsed = parseCallInfoHeader("<sip:example.com>; Answer-After=0");
    expect(parsed?.params.answerAfter).toBe(0);
  });
  it("parses ANSWER-AFTER=2", () => {
    const parsed = parseCallInfoHeader("<sip:example.com>; ANSWER-AFTER=2");
    expect(parsed?.params.answerAfter).toBe(2);
  });
});

describe("Call-Info malformed answer-after values", () => {
  it("ignores non-conforming values", () => {
    for (const value of ["1abc", "-5", "1.9", "", "abc"]) {
      const parsed = parseCallInfoHeader(`<sip:example.com>; answer-after=${value}`);
      expect(parsed?.params.answerAfter).withContext(`answer-after=${value}`).toBeUndefined();
    }
  });
  it("keeps the last conforming value when the parameter is duplicated", () => {
    const parsed = parseCallInfoHeader("<sip:example.com>; answer-after=5; answer-after=0");
    expect(parsed?.params.answerAfter).toBe(0);
  });
  it("parses very large values (capping happens at scheduling time)", () => {
    const parsed = parseCallInfoHeader("<sip:example.com>; answer-after=99999999999999");
    expect(parsed?.params.answerAfter).toBe(99999999999999);
  });
});

describe("applyTalkAction", () => {
  function makeRingingInvitation(): Invitation & { accept: jasmine.Spy } {
    // applyTalkAction requires an actual Invitation for the accept path
    const invitation = Object.create(Invitation.prototype);
    invitation.accept = jasmine.createSpy("accept").and.returnValue(Promise.resolve());
    Object.defineProperty(invitation, "state", { value: SessionState.Initial });
    return invitation;
  }

  it("accepts a ringing Invitation exactly once", async () => {
    const invitation = makeRingingInvitation();
    await applyTalkAction(invitation, TalkAction.Talk);
    expect(invitation.accept).toHaveBeenCalledTimes(1);
  });

  it("sends a resume re-INVITE when the session is Established", async () => {
    const invite = jasmine.createSpy("invite").and.returnValue(Promise.resolve());
    const session = {
      state: SessionState.Established,
      sessionDescriptionHandlerOptions: {},
      invite
    } as unknown as Session;
    await applyTalkAction(session, TalkAction.Talk);
    expect(invite).toHaveBeenCalledTimes(1);
    const modifiers = invite.calls.mostRecent().args[0].sessionDescriptionHandlerModifiers;
    expect(modifiers).toEqual([resumeModifier]);
  });

  it("does nothing while Establishing", async () => {
    const invite = jasmine.createSpy("invite");
    const accept = jasmine.createSpy("accept");
    const session = { state: SessionState.Establishing, invite, accept } as unknown as Session;
    await applyTalkAction(session, TalkAction.Talk);
    expect(invite).not.toHaveBeenCalled();
    expect(accept).not.toHaveBeenCalled();
  });

  it("does nothing for TalkAction.Mute (callback-only semantics)", async () => {
    const invitation = makeRingingInvitation();
    await applyTalkAction(invitation, TalkAction.Mute);
    expect(invitation.accept).not.toHaveBeenCalled();
  });
});

describe("handleRemoteControlNotify (request variant)", () => {
  function makeRequest(eventHeader: string | undefined, body: string): IncomingNotifyRequest {
    return {
      message: {
        getHeader: (name: string) => (name.toLowerCase() === "event" ? eventHeader : undefined),
        body
      }
    } as unknown as IncomingNotifyRequest;
  }

  it("applies SIP signaling (accepts a ringing Invitation) as documented", async () => {
    const invitation = Object.create(Invitation.prototype);
    invitation.accept = jasmine.createSpy("accept").and.returnValue(Promise.resolve());
    Object.defineProperty(invitation, "state", { value: SessionState.Initial });

    const handled = await handleRemoteControlNotify(invitation, makeRequest("talk", ""), { enabled: true });
    expect(handled).toBe(true);
    expect(invitation.accept).toHaveBeenCalledTimes(1);
  });

  it("applies a hold re-INVITE for Event: hold on an Established session", async () => {
    const invite = jasmine.createSpy("invite").and.returnValue(Promise.resolve());
    const session = {
      state: SessionState.Established,
      sessionDescriptionHandlerOptions: {},
      invite
    } as unknown as Session;
    const handled = await handleRemoteControlNotify(session, makeRequest("hold", ""), { enabled: true });
    expect(handled).toBe(true);
    expect(invite).toHaveBeenCalledTimes(1);
    const modifiers = invite.calls.mostRecent().args[0].sessionDescriptionHandlerModifiers;
    expect(modifiers).toEqual([holdModifier]);
  });

  it("invokes the talk callback exactly once", async () => {
    const onTalkEvent = jasmine.createSpy("onTalkEvent");
    const session = { state: SessionState.Terminated } as unknown as Session;
    await handleRemoteControlNotify(session, makeRequest("talk", ""), { enabled: true, onTalkEvent });
    expect(onTalkEvent).toHaveBeenCalledTimes(1);
    expect(onTalkEvent).toHaveBeenCalledWith(TalkAction.Talk);
  });

  it("returns false and does nothing when disabled", async () => {
    const invitation = Object.create(Invitation.prototype);
    invitation.accept = jasmine.createSpy("accept");
    Object.defineProperty(invitation, "state", { value: SessionState.Initial });
    const handled = await handleRemoteControlNotify(invitation, makeRequest("talk", ""), { enabled: false });
    expect(handled).toBe(false);
    expect(invitation.accept).not.toHaveBeenCalled();
  });

  it("returns false for unrelated NOTIFY events", async () => {
    const session = { state: SessionState.Established } as unknown as Session;
    const handled = await handleRemoteControlNotify(session, makeRequest("presence", ""), { enabled: true });
    expect(handled).toBe(false);
  });

  it("survives a throwing callback and still applies the action", async () => {
    const invitation = Object.create(Invitation.prototype);
    invitation.accept = jasmine.createSpy("accept").and.returnValue(Promise.resolve());
    Object.defineProperty(invitation, "state", { value: SessionState.Initial });
    const handled = await handleRemoteControlNotify(invitation, makeRequest("talk", ""), {
      enabled: true,
      onTalkEvent: () => {
        throw new Error("callback error");
      }
    });
    expect(handled).toBe(true);
    expect(invitation.accept).toHaveBeenCalledTimes(1);
  });
});

describe("SDP modifiers", () => {
  it("holdModifier inserts a=sendonly when no direction attribute is present", async () => {
    const desc = { type: "offer" as RTCSdpType, sdp: "v=0\r\nm=audio 9 RTP/AVP 0\r\n" };
    const out = await holdModifier(desc);
    expect(out.sdp).toBe("v=0\r\nm=audio 9 RTP/AVP 0\r\na=sendonly\r\n");
  });

  it("holdModifier is idempotent (repeated hold)", async () => {
    const desc = { type: "offer" as RTCSdpType, sdp: "v=0\r\nm=audio 9 RTP/AVP 0\r\na=sendrecv\r\n" };
    const once = await holdModifier(desc);
    const twice = await holdModifier(once);
    expect(twice.sdp).toBe(once.sdp);
  });

  it("hold → resume round trip restores directions on multiple m-lines", async () => {
    const desc = {
      type: "offer" as RTCSdpType,
      sdp: "v=0\r\nm=audio 9 RTP/AVP 0\r\na=sendrecv\r\nm=video 9 RTP/AVP 96\r\na=recvonly\r\n"
    };
    const held = await holdModifier(desc);
    expect(held.sdp).toContain("a=sendonly");
    expect(held.sdp).toContain("a=inactive");
    expect(held.sdp).not.toContain("a=sendrecv");
    const resumed = await resumeModifier(held);
    expect(resumed.sdp).toBe(desc.sdp);
  });

  it("resumeModifier is idempotent (repeated talk)", async () => {
    const desc = { type: "offer" as RTCSdpType, sdp: "v=0\r\nm=audio 9 RTP/AVP 0\r\na=sendrecv\r\n" };
    const once = await resumeModifier(desc);
    expect(once.sdp).toBe(desc.sdp);
  });
});
