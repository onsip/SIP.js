/**
 * BroadSoft Auto-Answer Tests
 */

import { Invitation } from "../../../../lib/api/invitation.js";
import { IncomingRequestMessage } from "../../../../lib/core/messages/incoming-request-message.js";
import { handleAutoAnswer, shouldAutoAnswer } from "../../../../lib/api/broadsoft/auto-answer.js";
import { AutoAnswerOptions } from "../../../../lib/api/broadsoft/types.js";

/** Build a fake Invitation exposing only what handleAutoAnswer touches. */
function makeInvitation(
  callInfo: string | undefined,
  state = "Initial"
): Invitation & {
  accept: jasmine.Spy;
  fireStateChange: (newState: string) => void;
  setState: (newState: string) => void;
  stateListenerCount: () => number;
} {
  const listeners: Array<(newState: string) => void> = [];
  const invitation = {
    request: {
      getHeaders: (name: string) => {
        if (name === "call-info" && callInfo !== undefined) {
          return [callInfo];
        }
        return [];
      }
    } as unknown as IncomingRequestMessage,
    state,
    accept: jasmine.createSpy("accept").and.returnValue(Promise.resolve()),
    stateChange: {
      addListener: (listener: (newState: string) => void) => listeners.push(listener),
      removeListener: (listener: (newState: string) => void) => {
        const i = listeners.indexOf(listener);
        if (i !== -1) {
          listeners.splice(i, 1);
        }
      }
    },
    setState(newState: string) {
      this.state = newState;
    },
    fireStateChange(newState: string) {
      this.state = newState;
      listeners.slice().forEach((listener) => listener(newState));
    },
    stateListenerCount: () => listeners.length
  };
  return invitation as unknown as ReturnType<typeof makeInvitation>;
}

describe("BroadSoft Auto-Answer", () => {
  describe("shouldAutoAnswer", () => {
    it("should return true when answer-after is present", () => {
      const invitation = makeInvitation("<sip:example.com>; answer-after=1");
      expect(shouldAutoAnswer(invitation)).toBe(true);
    });

    it("should return false when answer-after is not present", () => {
      const invitation = makeInvitation('<sip:example.com>; purpose="icon"');
      expect(shouldAutoAnswer(invitation)).toBe(false);
    });

    it("should return false when no Call-Info headers", () => {
      const invitation = makeInvitation(undefined);
      expect(shouldAutoAnswer(invitation)).toBe(false);
    });
  });

  describe("handleAutoAnswer", () => {
    beforeEach(() => {
      jasmine.clock().install();
    });

    afterEach(() => {
      jasmine.clock().uninstall();
    });

    it("should return false when auto-answer is disabled", () => {
      const invitation = makeInvitation("<sip:example.com>; answer-after=1");
      const result = handleAutoAnswer(invitation, { enabled: false });
      expect(result).toBe(false);
    });

    it("should return false when no answer-after parameter", () => {
      const invitation = makeInvitation('<sip:example.com>; purpose="icon"');
      const result = handleAutoAnswer(invitation, { enabled: true });
      expect(result).toBe(false);
    });

    it("should schedule auto-answer with correct delay", (done) => {
      const invitation = makeInvitation("<sip:example.com>; answer-after=2");
      const result = handleAutoAnswer(invitation, { enabled: true });

      expect(result).not.toBe(false);
      expect(invitation.accept).not.toHaveBeenCalled();

      // Not yet at 2 seconds
      jasmine.clock().tick(1999);
      expect(invitation.accept).not.toHaveBeenCalled();

      // Advance past 2 seconds
      jasmine.clock().tick(2);

      setTimeout(() => {
        expect(invitation.accept).toHaveBeenCalled();
        done();
      }, 0);
      jasmine.clock().tick(1);
    });

    it("should call onBeforeAutoAnswer callback", () => {
      const invitation = makeInvitation("<sip:example.com>; answer-after=1");
      const beforeCallback = jasmine.createSpy("beforeCallback");
      handleAutoAnswer(invitation, { enabled: true, onBeforeAutoAnswer: beforeCallback });
      expect(beforeCallback).toHaveBeenCalledWith(1);
    });

    it("should call onAfterAutoAnswer callback after accepting", (done) => {
      const invitation = makeInvitation("<sip:example.com>; answer-after=0");
      const afterCallback = jasmine.createSpy("afterCallback");
      handleAutoAnswer(invitation, { enabled: true, onAfterAutoAnswer: afterCallback });

      // Answer after=0 means immediate
      jasmine.clock().tick(0);

      Promise.resolve()
        .then(() => Promise.resolve())
        .then(() => {
          expect(afterCallback).toHaveBeenCalled();
          done();
        });

      jasmine.clock().tick(1);
    });

    it("should still schedule when onBeforeAutoAnswer throws", (done) => {
      const invitation = makeInvitation("<sip:example.com>; answer-after=0");
      const options: AutoAnswerOptions = {
        enabled: true,
        onBeforeAutoAnswer: () => {
          throw new Error("callback error");
        }
      };
      const result = handleAutoAnswer(invitation, options);
      expect(result).not.toBe(false);

      jasmine.clock().tick(0);
      setTimeout(() => {
        expect(invitation.accept).toHaveBeenCalled();
        done();
      }, 0);
      jasmine.clock().tick(1);
    });

    it("should use delayOverride when provided", () => {
      const invitation = makeInvitation("<sip:example.com>; answer-after=5");
      const beforeCallback = jasmine.createSpy("beforeCallback");
      handleAutoAnswer(invitation, { enabled: true, delayOverride: 0, onBeforeAutoAnswer: beforeCallback });
      // Should use override delay of 0, not header value of 5
      expect(beforeCallback).toHaveBeenCalledWith(0);
    });

    it("should not accept if session is already terminated", (done) => {
      const invitation = makeInvitation("<sip:example.com>; answer-after=0", "Terminated");
      handleAutoAnswer(invitation, { enabled: true });

      jasmine.clock().tick(0);
      jasmine.clock().tick(1);

      setTimeout(() => {
        expect(invitation.accept).not.toHaveBeenCalled();
        done();
      }, 10);
      jasmine.clock().tick(11);
    });

    it("should ignore malformed answer-after values (1abc, negative, decimal)", () => {
      for (const value of ["1abc", "-5", "1.9", ""]) {
        const invitation = makeInvitation(`<sip:example.com>; answer-after=${value}`);
        expect(handleAutoAnswer(invitation, { enabled: true }))
          .withContext(`answer-after=${value}`)
          .toBe(false);
      }
    });

    it("should reject a negative delayOverride", () => {
      const invitation = makeInvitation("<sip:example.com>; answer-after=1");
      expect(handleAutoAnswer(invitation, { enabled: true, delayOverride: -1 })).toBe(false);
    });

    it("should cap extremely large delays instead of firing immediately", () => {
      // 99999999999999 s in ms overflows the 32-bit timer range; an uncapped
      // setTimeout would fire (effectively) immediately in browsers.
      const invitation = makeInvitation("<sip:example.com>; answer-after=99999999999999");
      const result = handleAutoAnswer(invitation, { enabled: true });
      expect(result).not.toBe(false);

      jasmine.clock().tick(60000);
      expect(invitation.accept).not.toHaveBeenCalled();
    });

    it("should cancel the scheduled answer via the returned handle", () => {
      const invitation = makeInvitation("<sip:example.com>; answer-after=1");
      const result = handleAutoAnswer(invitation, { enabled: true });
      if (result === false) {
        fail("expected a handle");
        return;
      }
      result.cancel();

      jasmine.clock().tick(2000);
      expect(invitation.accept).not.toHaveBeenCalled();
      // Listener cleaned up; cancel is idempotent
      expect(invitation.stateListenerCount()).toBe(0);
      result.cancel();
    });

    it("should cancel automatically when the user answers manually", () => {
      const invitation = makeInvitation("<sip:example.com>; answer-after=2");
      handleAutoAnswer(invitation, { enabled: true });

      // User answers manually: state transitions Initial -> Establishing
      invitation.fireStateChange("Establishing");

      jasmine.clock().tick(3000);
      expect(invitation.accept).not.toHaveBeenCalled();
      expect(invitation.stateListenerCount()).toBe(0);
    });

    it("should cancel automatically on CANCEL/termination before the timer fires", () => {
      const invitation = makeInvitation("<sip:example.com>; answer-after=2");
      handleAutoAnswer(invitation, { enabled: true });

      invitation.fireStateChange("Terminated");

      jasmine.clock().tick(3000);
      expect(invitation.accept).not.toHaveBeenCalled();
    });

    it("should not accept when state changed without notification (defensive timer guard)", (done) => {
      const invitation = makeInvitation("<sip:example.com>; answer-after=0");
      handleAutoAnswer(invitation, { enabled: true });
      // State changes but no stateChange event fires (defensive path)
      invitation.setState("Establishing");

      jasmine.clock().tick(0);
      jasmine.clock().tick(1);
      setTimeout(() => {
        expect(invitation.accept).not.toHaveBeenCalled();
        done();
      }, 0);
      jasmine.clock().tick(1);
    });

    it("should log accept() rejections instead of swallowing them silently", (done) => {
      const invitation = makeInvitation("<sip:example.com>; answer-after=0");
      invitation.accept.and.returnValue(Promise.reject(new Error("Invalid session state")));
      const logger = {
        log: jasmine.createSpy("log"),
        warn: jasmine.createSpy("warn"),
        error: jasmine.createSpy("error")
      };
      handleAutoAnswer(invitation, { enabled: true, logger } as unknown as AutoAnswerOptions);

      jasmine.clock().tick(0);
      jasmine.clock().tick(1);
      Promise.resolve()
        .then(() => Promise.resolve())
        .then(() => {
          expect(logger.error).toHaveBeenCalled();
          done();
        });
      jasmine.clock().tick(1);
    });
  });
});
