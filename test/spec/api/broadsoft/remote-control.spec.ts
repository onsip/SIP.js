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
  applyHoldAction,
  holdModifier
} from "../../../../lib/api/broadsoft/remote-control.js";
import { parseCallInfoHeader } from "../../../../lib/api/broadsoft/call-info-parser.js";
import { BroadSoftEvent, TalkAction, HoldAction } from "../../../../lib/api/broadsoft/types.js";
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
          getHeader: (name: string) => undefined
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
          getHeader: (name: string) => undefined
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
