import {
  SessionState,
  SignalingState,
  Timers,
  URI
} from "../../src/core";
import { InviteClientContext, InviteServerContext } from "../../src/Session";
import { EventEmitterEmitSpy, makeEventEmitterEmitSpy } from "../support/EventEmitterSpy";
import { connectUserFake, makeUserFake, UserFake } from "../support/UserFake";
import { soon } from "../support/Utils";

const SIP_ACK = [jasmine.stringMatching(/^ACK/)];
const SIP_BYE = [jasmine.stringMatching(/^BYE/)];
const SIP_CANCEL = [jasmine.stringMatching(/^CANCEL/)];
const SIP_INVITE = [jasmine.stringMatching(/^INVITE/)];
const SIP_PRACK = [jasmine.stringMatching(/^PRACK/)];
const SIP_100 = [jasmine.stringMatching(/^SIP\/2.0 100/)];
const SIP_180 = [jasmine.stringMatching(/^SIP\/2.0 180/)];
const SIP_183 = [jasmine.stringMatching(/^SIP\/2.0 183/)];
const SIP_200 = [jasmine.stringMatching(/^SIP\/2.0 200/)];
const SIP_408 = [jasmine.stringMatching(/^SIP\/2.0 408/)];
const SIP_480 = [jasmine.stringMatching(/^SIP\/2.0 480/)];
const SIP_487 = [jasmine.stringMatching(/^SIP\/2.0 487/)];

const EVENT_ACCEPTED_ICC = ["accepted", jasmine.any(Object), jasmine.any(String)];
const EVENT_ACCEPTED_ICS = ["accepted", jasmine.any(String), jasmine.any(String)];
const EVENT_ACK = ["ack", jasmine.any(Object)];
const EVENT_BYE = ["bye", jasmine.any(Object)];
const EVENT_CANCEL = ["cancel"];
const EVENT_CONFIRMED = ["confirmed", jasmine.any(Object)];
const EVENT_FAILED = ["failed", jasmine.any(Object), jasmine.any(String)];
const EVENT_FAILED_ISC = ["failed", jasmine.any(String), jasmine.any(String)];
const EVENT_PROGRESS_ICC = ["progress", jasmine.any(Object)];
const EVENT_PROGRESS_ICS = ["progress", jasmine.any(String), undefined];
const EVENT_REJECTED = ["rejected", jasmine.any(Object), jasmine.any(String)];
const EVENT_REJECTED_ISC = ["rejected", jasmine.any(String), jasmine.any(String)];
const EVENT_SDH = ["SessionDescriptionHandler-created", jasmine.any(Object)];
const EVENT_TERMINATED = ["terminated", jasmine.any(Object), jasmine.any(String)];
const EVENT_TERMINATED_ISC = ["terminated", undefined, undefined];

/**
 * Session Integration Tests
 */

describe("Session Class", () => {
  let alice: UserFake;
  let bob: UserFake;
  let target: URI;
  let inviteClientContext: InviteClientContext;
  let inviteClientContextEmitSpy: EventEmitterEmitSpy;
  let inviteServerContext: InviteServerContext;
  let inviteServerContextEmitSpy: EventEmitterEmitSpy;

  function bobAccept(answerInAck: boolean, answerInOk: boolean, offerInOk: boolean) {

    beforeEach(async () => {
      resetSpies();
      inviteServerContext.accept();
      await inviteServerContextEmitSpy.wait("confirmed");
    });

    it("her ua should send ACK", () => {
      const spy = alice.transportSendSpy;
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.calls.mostRecent().args).toEqual(SIP_ACK);
    });

    it("her ua should receive 200", () => {
      const spy = alice.transportReceiveSpy;
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.calls.mostRecent().args).toEqual(SIP_200);
    });

    if (answerInAck) {
      it("her context should emit 'sdh', 'ack', 'accepted'", () => {
        const spy = inviteClientContextEmitSpy;
        expect(spy).toHaveBeenCalledTimes(3);
        expect(spy.calls.argsFor(0)).toEqual(EVENT_SDH);
        expect(spy.calls.argsFor(1)).toEqual(EVENT_ACK);
        expect(spy.calls.argsFor(2)).toEqual(EVENT_ACCEPTED_ICC);
      });
    } else {
      it("her context should emit ack', 'accepted'", () => {
        const spy = inviteClientContextEmitSpy;
        expect(spy).toHaveBeenCalledTimes(2);
        expect(spy.calls.argsFor(0)).toEqual(EVENT_ACK);
        expect(spy.calls.argsFor(1)).toEqual(EVENT_ACCEPTED_ICC);
      });
    }

    if (answerInOk || offerInOk) {
      it("his context should emit 'sdh', 'accepted', 'confirmed'", () => {
        const spy = inviteServerContextEmitSpy;
        expect(spy).toHaveBeenCalledTimes(3);
        expect(spy.calls.argsFor(0)).toEqual(EVENT_SDH);
        expect(spy.calls.argsFor(1)).toEqual(EVENT_ACCEPTED_ICS);
        expect(spy.calls.argsFor(2)).toEqual(EVENT_CONFIRMED);
      });
    } else {
      it("his context should emit 'accepted', 'confirmed'", () => {
        const spy = inviteServerContextEmitSpy;
        expect(spy).toHaveBeenCalledTimes(2);
        expect(spy.calls.argsFor(0)).toEqual(EVENT_ACCEPTED_ICS);
        expect(spy.calls.argsFor(1)).toEqual(EVENT_CONFIRMED);
      });
    }

    it("her session should be 'confirmed' and 'stable'", () => {
      const session = inviteClientContext.session;
      expect(session && session.sessionState).toBe(SessionState.Confirmed);
      expect(session && session.signalingState).toBe(SignalingState.Stable);
    });

    it("his session should be 'confirmed' and 'stable'", () => {
      const session = inviteServerContext.session;
      expect(session && session.sessionState).toBe(SessionState.Confirmed);
      expect(session && session.signalingState).toBe(SignalingState.Stable);
    });
  }

  function bobAccept2x(answerInAck: boolean, answerInOk: boolean, offerInOk: boolean): void {
    let threw = false;

    beforeEach(async () => {
      resetSpies();
      inviteServerContext.accept();
      try {
        inviteServerContext.accept();
      } catch (e) {
        threw = true;
      }
      await inviteClientContextEmitSpy.wait("accepted");
    });

    it("her ua should send ACK", () => {
      const spy = alice.transportSendSpy;
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.calls.mostRecent().args).toEqual(SIP_ACK);
    });

    it("her ua should receive 200", () => {
      const spy = alice.transportReceiveSpy;
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.calls.mostRecent().args).toEqual(SIP_200);
    });

    it("her context should emit 'ack', 'accepted'", () => {
      const spy = inviteClientContextEmitSpy;
      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy.calls.argsFor(0)).toEqual(EVENT_ACK);
      expect(spy.calls.argsFor(1)).toEqual(EVENT_ACCEPTED_ICC);
    });

    if (answerInAck) {
      it("her context should emit 'sdh', 'ack', 'accepted'", () => {
        const spy = inviteClientContextEmitSpy;
        expect(spy).toHaveBeenCalledTimes(3);
        expect(spy.calls.argsFor(0)).toEqual(EVENT_SDH);
        expect(spy.calls.argsFor(1)).toEqual(EVENT_ACK);
        expect(spy.calls.argsFor(2)).toEqual(EVENT_ACCEPTED_ICC);
      });
    } else {
      it("her context should emit ack', 'accepted'", () => {
        const spy = inviteClientContextEmitSpy;
        expect(spy).toHaveBeenCalledTimes(2);
        expect(spy.calls.argsFor(0)).toEqual(EVENT_ACK);
        expect(spy.calls.argsFor(1)).toEqual(EVENT_ACCEPTED_ICC);
      });
    }

    if (answerInOk || offerInOk) {
      it("his context should emit 'sdh', 'accepted', 'confirmed'", () => {
        const spy = inviteServerContextEmitSpy;
        expect(spy).toHaveBeenCalledTimes(3);
        expect(spy.calls.argsFor(0)).toEqual(EVENT_SDH);
        expect(spy.calls.argsFor(1)).toEqual(EVENT_ACCEPTED_ICS);
        expect(spy.calls.argsFor(2)).toEqual(EVENT_CONFIRMED);
      });
    } else {
      it("his context should emit 'accepted', 'confirmed'", () => {
        const spy = inviteServerContextEmitSpy;
        expect(spy).toHaveBeenCalledTimes(2);
        expect(spy.calls.argsFor(0)).toEqual(EVENT_ACCEPTED_ICS);
        expect(spy.calls.argsFor(1)).toEqual(EVENT_CONFIRMED);
      });
    }

    it("her second accept() threw an error", () => {
      expect(threw).toBe(true);
    });
  }

  function bobAcceptTerminate(answerInAck: boolean, answerInOk: boolean, offerInOk: boolean, dropAcks: boolean): void {
    // The caller's UA MAY send a BYE for either confirmed or early dialogs,
    // and the callee's UA MAY send a BYE on confirmed dialogs, but MUST NOT
    // send a BYE on early dialogs. However, the callee's UA MUST NOT send a
    // BYE on a confirmed dialog until it has received an ACK for its 2xx
    // response or until the server transaction times out.
    // https://tools.ietf.org/html/rfc3261#section-15

    beforeEach(async () => {
      resetSpies();
      if (dropAcks) {
        bob.transportReceiveSpy.and.returnValue(Promise.resolve()); // drop messages
      }
      inviteServerContext.accept();
      await bob.transport.waitSent(); // wait till 2xx sent
      inviteServerContext.terminate(); // must wait for ACK or timeout before sending BYE
      if (dropAcks) {
        await alice.transport.waitSent(); // wait for first ACK sent (it will not be received)
        await soon(Timers.TIMER_L - 2); // transaction timeout waiting for ACK
        await soon(1); // a tick to let the retranmissions get processed after the clock jump
        await soon(1); // and then send the BYE upon transaction timout
      } else {
        await inviteClientContextEmitSpy.wait("terminated");
      }
    });

    if (dropAcks) {
      it("her ua should send ACK (11x), 200", () => {
        const spy = alice.transportSendSpy;
        expect(spy).toHaveBeenCalledTimes(12);
        expect(spy.calls.all()[0].args).toEqual(SIP_ACK);
        expect(spy.calls.all()[1].args).toEqual(SIP_ACK); // ACK retransmissions that get dropped
        expect(spy.calls.all()[2].args).toEqual(SIP_ACK);
        expect(spy.calls.all()[3].args).toEqual(SIP_ACK);
        expect(spy.calls.all()[4].args).toEqual(SIP_ACK);
        expect(spy.calls.all()[5].args).toEqual(SIP_ACK);
        expect(spy.calls.all()[6].args).toEqual(SIP_ACK);
        expect(spy.calls.all()[7].args).toEqual(SIP_ACK);
        expect(spy.calls.all()[8].args).toEqual(SIP_ACK);
        expect(spy.calls.all()[9].args).toEqual(SIP_ACK);
        expect(spy.calls.all()[10].args).toEqual(SIP_ACK);
        expect(spy.calls.all()[11].args).toEqual(SIP_200);
      });

      it("her ua should receive 200 (11x), BYE", () => {
        const spy = alice.transportReceiveSpy;
        expect(spy).toHaveBeenCalledTimes(12);
        expect(spy.calls.all()[0].args).toEqual(SIP_200);
        expect(spy.calls.all()[1].args).toEqual(SIP_200); // 200 retransmissions
        expect(spy.calls.all()[2].args).toEqual(SIP_200);
        expect(spy.calls.all()[3].args).toEqual(SIP_200);
        expect(spy.calls.all()[4].args).toEqual(SIP_200);
        expect(spy.calls.all()[5].args).toEqual(SIP_200);
        expect(spy.calls.all()[6].args).toEqual(SIP_200);
        expect(spy.calls.all()[7].args).toEqual(SIP_200);
        expect(spy.calls.all()[8].args).toEqual(SIP_200);
        expect(spy.calls.all()[9].args).toEqual(SIP_200);
        expect(spy.calls.all()[10].args).toEqual(SIP_200);
        expect(spy.calls.all()[11].args).toEqual(SIP_BYE);
      });
    } else {
      it("her ua should send ACK, 200", () => {
        const spy = alice.transportSendSpy;
        expect(spy).toHaveBeenCalledTimes(2);
        expect(spy.calls.argsFor(0)).toEqual(SIP_ACK);
        expect(spy.calls.argsFor(1)).toEqual(SIP_200);
      });

      it("her ua should receive 200, BYE", () => {
        const spy = alice.transportReceiveSpy;
        expect(spy).toHaveBeenCalledTimes(2);
        expect(spy.calls.argsFor(0)).toEqual(SIP_200);
        expect(spy.calls.argsFor(1)).toEqual(SIP_BYE);
      });
    }

    if (answerInAck) {
      it("her context should emit 'sdh', 'ack', 'accepted', 'bye', 'terminated'", () => {
        const spy = inviteClientContextEmitSpy;
        expect(spy).toHaveBeenCalledTimes(5);
        expect(spy.calls.argsFor(0)).toEqual(EVENT_SDH);
        expect(spy.calls.argsFor(1)).toEqual(EVENT_ACK);
        expect(spy.calls.argsFor(2)).toEqual(EVENT_ACCEPTED_ICC);
        expect(spy.calls.argsFor(3)).toEqual(EVENT_BYE);
        expect(spy.calls.argsFor(4)).toEqual(EVENT_TERMINATED);
      });
    } else {
      it("her context should emit 'ack', 'accepted', 'bye', 'terminated'", () => {
        const spy = inviteClientContextEmitSpy;
        expect(spy).toHaveBeenCalledTimes(4);
        expect(spy.calls.argsFor(0)).toEqual(EVENT_ACK);
        expect(spy.calls.argsFor(1)).toEqual(EVENT_ACCEPTED_ICC);
        expect(spy.calls.argsFor(2)).toEqual(EVENT_BYE);
        expect(spy.calls.argsFor(3)).toEqual(EVENT_TERMINATED);
      });
    }

    if (answerInOk || offerInOk) {
      it("his context should emit 'sdh', 'accepted', 'bye', 'terminated'", () => {
        const spy = inviteServerContextEmitSpy;
        expect(spy).toHaveBeenCalledTimes(5);
        expect(spy.calls.argsFor(0)).toEqual(EVENT_SDH);
        expect(spy.calls.argsFor(1)).toEqual(EVENT_ACCEPTED_ICS);
        expect(spy.calls.argsFor(2)).toEqual(EVENT_BYE);
        expect(spy.calls.argsFor(3)).toEqual(EVENT_TERMINATED_ISC);
        expect(spy.calls.argsFor(4)).toEqual(EVENT_BYE); // seems obviously broken
      });
    } else {
      it("his context should emit 'accepted', 'bye', 'terminated'", () => {
        const spy = inviteServerContextEmitSpy;
        expect(spy).toHaveBeenCalledTimes(4);
        expect(spy.calls.argsFor(0)).toEqual(EVENT_ACCEPTED_ICS);
        expect(spy.calls.argsFor(1)).toEqual(EVENT_BYE);
        expect(spy.calls.argsFor(2)).toEqual(EVENT_TERMINATED_ISC);
        expect(spy.calls.argsFor(3)).toEqual(EVENT_BYE); // seems obviously broken
      });
    }
  }

  function bobProgress(): void {
    beforeEach(async () => {
      resetSpies();
      inviteServerContext.progress();
      await inviteClientContextEmitSpy.wait("progress");
    });

    it("her ua should receive 180", () => {
      const spy = alice.transportReceiveSpy;
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.calls.mostRecent().args).toEqual(SIP_180);
    });

    it("her context should emit 'progress'", () => {
      const spy = inviteClientContextEmitSpy;
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.calls.mostRecent().args).toEqual(EVENT_PROGRESS_ICC);
    });

    it("his context should emit 'progress'", () => {
      const spy = inviteServerContextEmitSpy;
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.calls.mostRecent().args).toEqual(EVENT_PROGRESS_ICS);
    });
  }

  function bobProgress183(): void {
    beforeEach(async () => {
      resetSpies();
      inviteServerContext.progress({
        statusCode: 183,
      });
      await inviteClientContextEmitSpy.wait("progress");
    });

    it("her ua should receive 183", () => {
      const spy = alice.transportReceiveSpy;
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.calls.mostRecent().args).toEqual(SIP_183);
    });

    it("her context should emit 'sdh', 'progress'", () => {
      const spy = inviteClientContextEmitSpy;
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.calls.mostRecent().args).toEqual(EVENT_PROGRESS_ICC);
    });

    it("his context should emit 'progress'", () => {
      const spy = inviteServerContextEmitSpy;
      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy.calls.argsFor(0)).toEqual(EVENT_SDH);
      expect(spy.calls.argsFor(1)).toEqual(EVENT_PROGRESS_ICS);
      expect(spy.calls.mostRecent().args).toEqual(EVENT_PROGRESS_ICS);
    });
  }

  function bobProgress2x(): void {
    beforeEach(async () => {
      resetSpies();
      inviteServerContext.progress();
      inviteServerContext.progress();
      await inviteClientContextEmitSpy.wait("progress");
    });

    it("her ua should receive 180, 180", () => {
      const spy = alice.transportReceiveSpy;
      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy.calls.argsFor(0)).toEqual(SIP_180);
      expect(spy.calls.argsFor(1)).toEqual(SIP_180);
    });

    it("her context should emit 'progress', 'progress'", () => {
      const spy = inviteClientContextEmitSpy;
      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy.calls.argsFor(0)).toEqual(EVENT_PROGRESS_ICC);
      expect(spy.calls.argsFor(1)).toEqual(EVENT_PROGRESS_ICC);
    });

    it("his context should emit 'progress', 'progress;", () => {
      const spy = inviteServerContextEmitSpy;
      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy.calls.argsFor(0)).toEqual(EVENT_PROGRESS_ICS);
      expect(spy.calls.argsFor(1)).toEqual(EVENT_PROGRESS_ICS);
    });
  }

  function bobProgressReliable(answerInProgress: boolean, offerInProgress: boolean): void {
    beforeEach(async () => {
      resetSpies();
      inviteServerContext.progress({ rel100: true });
      await inviteClientContextEmitSpy.wait("progress");
      await bob.transport.waitSent(); // 200 for PRACK
    });

    it("her ua should receive 183", () => {
      const spy = alice.transportReceiveSpy;
      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy.calls.argsFor(0)).toEqual(SIP_183);
      expect(spy.calls.argsFor(1)).toEqual(SIP_200); // PRACK
    });

    it("her ua should send PRACK", () => {
      const spy = alice.transportSendSpy;
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.calls.mostRecent().args).toEqual(SIP_PRACK);
    });

    if (offerInProgress) {
      it("her context should emit 'sdh', 'progress'", () => {
        const spy = inviteClientContextEmitSpy;
        expect(spy).toHaveBeenCalledTimes(2);
        expect(spy.calls.argsFor(0)).toEqual(EVENT_SDH);
        expect(spy.calls.argsFor(1)).toEqual(EVENT_PROGRESS_ICC);
      });
    } else {
      it("her context should emit 'progress'", () => {
        const spy = inviteClientContextEmitSpy;
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy.calls.mostRecent().args).toEqual(EVENT_PROGRESS_ICC);
      });
    }

    if (offerInProgress) {
      it("his context should emit 'sdh', 'progress'", () => {
        const spy = inviteServerContextEmitSpy;
        expect(spy).toHaveBeenCalledTimes(3);
        expect(spy.calls.argsFor(0)).toEqual(EVENT_SDH);
        expect(spy.calls.argsFor(1)).toEqual(EVENT_PROGRESS_ICS);
        expect(spy.calls.argsFor(2)).toEqual(EVENT_SDH); // seems obviously broken
      });
    } else if (answerInProgress) {
      it("his context should emit 'sdh', 'progress'", () => {
        const spy = inviteServerContextEmitSpy;
        expect(spy).toHaveBeenCalledTimes(2);
        expect(spy.calls.argsFor(0)).toEqual(EVENT_SDH);
        expect(spy.calls.argsFor(1)).toEqual(EVENT_PROGRESS_ICS);
      });
    } else {
      it("his context should emit progress'", () => {
        const spy = inviteServerContextEmitSpy;
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy.calls.mostRecent().args).toEqual(EVENT_PROGRESS_ICS);
      });
    }
  }

  function bobProgressReliable2x(answerInProgress: boolean, offerInProgress: boolean): void {
    beforeEach(async () => {
      resetSpies();
      inviteServerContext.progress({ rel100: true });
      inviteServerContext.progress({ rel100: true }); // This one should be ignored as we are waiting on a PRACK.
      await inviteClientContextEmitSpy.wait("progress");
      await bob.transport.waitSent(); // 200 for PRACK
    });

    it("her ua should receive 183", () => {
      const spy = alice.transportReceiveSpy;
      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy.calls.argsFor(0)).toEqual(SIP_183);
      expect(spy.calls.argsFor(1)).toEqual(SIP_200); // PRACK
    });

    it("her ua should send PRACK", () => {
      const spy = alice.transportSendSpy;
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.calls.mostRecent().args).toEqual(SIP_PRACK);
    });

    if (offerInProgress) {
      it("her context should emit 'progress'", () => {
        const spy = inviteClientContextEmitSpy;
        expect(spy).toHaveBeenCalledTimes(2);
        expect(spy.calls.argsFor(0)).toEqual(EVENT_SDH);
        expect(spy.calls.argsFor(1)).toEqual(EVENT_PROGRESS_ICC);
      });
    } else {
      it("her context should emit 'progress'", () => {
        const spy = inviteClientContextEmitSpy;
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy.calls.mostRecent().args).toEqual(EVENT_PROGRESS_ICC);
      });
    }

    if (offerInProgress) {
      it("his context should emit 'sdh', 'progress'", () => {
        const spy = inviteServerContextEmitSpy;
        expect(spy).toHaveBeenCalledTimes(3);
        expect(spy.calls.argsFor(0)).toEqual(EVENT_SDH);
        expect(spy.calls.argsFor(1)).toEqual(EVENT_PROGRESS_ICS);
        expect(spy.calls.argsFor(2)).toEqual(EVENT_SDH); // seems obviously broken
      });
    } else if (answerInProgress) {
      it("his context should emit 'sdh', 'progress'", () => {
        const spy = inviteServerContextEmitSpy;
        expect(spy).toHaveBeenCalledTimes(2);
        expect(spy.calls.argsFor(0)).toEqual(EVENT_SDH);
        expect(spy.calls.argsFor(1)).toEqual(EVENT_PROGRESS_ICS);
      });
    } else {
      it("his context should emit progress'", () => {
        const spy = inviteServerContextEmitSpy;
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy.calls.mostRecent().args).toEqual(EVENT_PROGRESS_ICS);
      });
    }
  }

  function bobReject(): void {
    beforeEach(async () => {
      resetSpies();
      inviteServerContext.reject();
      await inviteClientContextEmitSpy.wait("terminated");
    });

    it("her ua should send ACK", () => {
      const spy = alice.transportSendSpy;
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.calls.mostRecent().args).toEqual(SIP_ACK);
    });

    it("her ua should receive 480", () => {
      const spy = alice.transportReceiveSpy;
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.calls.mostRecent().args).toEqual(SIP_480);
    });

    it("her context should emit 'rejected', 'failed', 'terminated'", () => {
      const spy = inviteClientContextEmitSpy;
      expect(spy).toHaveBeenCalledTimes(3);
      expect(spy.calls.argsFor(0)).toEqual(EVENT_REJECTED);
      expect(spy.calls.argsFor(1)).toEqual(EVENT_FAILED);
      expect(spy.calls.argsFor(2)).toEqual(EVENT_TERMINATED);
    });

    it("his context should emit 'rejected', 'failed', 'terminated'", () => {
      const spy = inviteServerContextEmitSpy;
      expect(spy).toHaveBeenCalledTimes(3);
      expect(spy.calls.argsFor(0)).toEqual(EVENT_REJECTED_ISC);
      expect(spy.calls.argsFor(1)).toEqual(EVENT_FAILED_ISC);
      expect(spy.calls.argsFor(2)).toEqual(EVENT_TERMINATED_ISC);
    });
  }

  function bobReject2x(): void {
    let threw = false;

    beforeEach(async () => {
      resetSpies();
      inviteServerContext.reject();
      try {
        inviteServerContext.reject();
      } catch (e) {
        threw = true;
      }
      await inviteClientContextEmitSpy.wait("terminated");
    });

    it("her ua should send ACK", () => {
      const spy = alice.transportSendSpy;
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.calls.mostRecent().args).toEqual(SIP_ACK);
    });

    it("her ua should receive 480", () => {
      const spy = alice.transportReceiveSpy;
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.calls.mostRecent().args).toEqual(SIP_480);
    });

    it("her context should emit 'rejected', 'failed', 'terminated'", () => {
      const spy = inviteClientContextEmitSpy;
      expect(spy).toHaveBeenCalledTimes(3);
      expect(spy.calls.argsFor(0)).toEqual(EVENT_REJECTED);
      expect(spy.calls.argsFor(1)).toEqual(EVENT_FAILED);
      expect(spy.calls.argsFor(2)).toEqual(EVENT_TERMINATED);
    });

    it("his context should emit 'rejected', 'failed', 'terminated'", () => {
      const spy = inviteServerContextEmitSpy;
      expect(spy).toHaveBeenCalledTimes(3);
      expect(spy.calls.argsFor(0)).toEqual(EVENT_REJECTED_ISC);
      expect(spy.calls.argsFor(1)).toEqual(EVENT_FAILED_ISC);
      expect(spy.calls.argsFor(2)).toEqual(EVENT_TERMINATED_ISC);
    });

    it("her second reject() threw an error", () => {
      expect(threw).toBe(true);
    });
  }

  function bobTerminate(bye = true): void {
    beforeEach(async () => {
      resetSpies();
      inviteServerContext.terminate();
      await inviteClientContextEmitSpy.wait("terminated");
    });

    if (bye) {
      it("her ua should send 200", () => {
        const spy = alice.transportSendSpy;
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy.calls.mostRecent().args).toEqual(SIP_200);
      });

      it("her ua should receive BYE", () => {
        const spy = alice.transportReceiveSpy;
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy.calls.mostRecent().args).toEqual(SIP_BYE);
      });

      it("her context should emit 'bye', 'terminated'", () => {
        const spy = inviteClientContextEmitSpy;
        expect(spy).toHaveBeenCalledTimes(2);
        expect(spy.calls.argsFor(0)).toEqual(EVENT_BYE);
        expect(spy.calls.argsFor(1)).toEqual(EVENT_TERMINATED);
      });

      it("his context should emit 'bye', 'terminated'", () => {
        const spy = inviteServerContextEmitSpy;
        expect(spy).toHaveBeenCalledTimes(2);
        expect(spy.calls.argsFor(0)).toEqual(EVENT_BYE);
        expect(spy.calls.argsFor(1)).toEqual(EVENT_TERMINATED_ISC);
      });
    } else {
      it("her ua should send ACK", () => {
        const spy = alice.transportSendSpy;
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy.calls.mostRecent().args).toEqual(SIP_ACK);
      });

      it("her ua should receive 480", () => {
        const spy = alice.transportReceiveSpy;
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy.calls.mostRecent().args).toEqual(SIP_480);
      });

      it("her context should emit 'rejected', 'failed', 'terminated'", () => {
        const spy = inviteClientContextEmitSpy;
        expect(spy).toHaveBeenCalledTimes(3);
        expect(spy.calls.argsFor(0)).toEqual(EVENT_REJECTED);
        expect(spy.calls.argsFor(1)).toEqual(EVENT_FAILED);
        expect(spy.calls.argsFor(2)).toEqual(EVENT_TERMINATED);
      });

      it("his context should emit 'rejected', 'failed', 'terminated'", () => {
        const spy = inviteServerContextEmitSpy;
        expect(spy).toHaveBeenCalledTimes(3);
        expect(spy.calls.argsFor(0)).toEqual(EVENT_REJECTED_ISC);
        expect(spy.calls.argsFor(1)).toEqual(EVENT_FAILED_ISC);
        expect(spy.calls.argsFor(2)).toEqual(EVENT_TERMINATED_ISC);
      });
    }
  }

  function bobTerminate2x(bye = true): void {
    let threw = false;

    beforeEach(async () => {
      resetSpies();
      inviteServerContext.terminate();
      try {
        inviteServerContext.terminate();
      } catch (e) {
        threw = true;
      }
      await inviteClientContextEmitSpy.wait("terminated");
    });

    if (bye) {
      it("her ua should send 200", () => {
        const spy = alice.transportSendSpy;
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy.calls.mostRecent().args).toEqual(SIP_200);
      });

      it("her ua should receive BYE", () => {
        const spy = alice.transportReceiveSpy;
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy.calls.mostRecent().args).toEqual(SIP_BYE);
      });

      it("her context should emit 'bye', 'terminated'", () => {
        const spy = inviteClientContextEmitSpy;
        expect(spy).toHaveBeenCalledTimes(2);
        expect(spy.calls.argsFor(0)).toEqual(EVENT_BYE);
        expect(spy.calls.argsFor(1)).toEqual(EVENT_TERMINATED);
      });

      it("his context should emit 'bye', 'terminated'", () => {
        const spy = inviteServerContextEmitSpy;
        expect(spy).toHaveBeenCalledTimes(2);
        expect(spy.calls.argsFor(0)).toEqual(EVENT_BYE);
        expect(spy.calls.argsFor(1)).toEqual(EVENT_TERMINATED_ISC);
      });

      it("her second terminate() threw an error", () => {
        expect(threw).toBe(false);
      });
    } else {
      it("her ua should send ACK", () => {
        const spy = alice.transportSendSpy;
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy.calls.mostRecent().args).toEqual(SIP_ACK);
      });

      it("her ua should receive 480", () => {
        const spy = alice.transportReceiveSpy;
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy.calls.mostRecent().args).toEqual(SIP_480);
      });

      it("her context should emit 'rejected', 'failed', 'terminated'", () => {
        const spy = inviteClientContextEmitSpy;
        expect(spy).toHaveBeenCalledTimes(3);
        expect(spy.calls.argsFor(0)).toEqual(EVENT_REJECTED);
        expect(spy.calls.argsFor(1)).toEqual(EVENT_FAILED);
        expect(spy.calls.argsFor(2)).toEqual(EVENT_TERMINATED);
      });

      it("his context should emit 'rejected', 'failed', 'terminated'", () => {
        const spy = inviteServerContextEmitSpy;
        expect(spy).toHaveBeenCalledTimes(3);
        expect(spy.calls.argsFor(0)).toEqual(EVENT_REJECTED_ISC);
        expect(spy.calls.argsFor(1)).toEqual(EVENT_FAILED_ISC);
        expect(spy.calls.argsFor(2)).toEqual(EVENT_TERMINATED_ISC);
      });

      it("her second terminate() threw an error", () => {
        expect(threw).toBe(true);
      });
    }
  }

  function inviteSuite(inviteWithoutSdp: boolean): void {
    it("her ua should send nothing", () => {
      expect(alice.transportSendSpy).not.toHaveBeenCalled();
    });

    it("her context should emit nothing", () => {
      expect(inviteClientContextEmitSpy).not.toHaveBeenCalled();
    });

    describe("Alice invite(), cancel()", () => {
      beforeEach(async () => {
        resetSpies();
        inviteClientContext.invite();
        inviteClientContext.cancel();
        await soon();
      });

      it("her ua should send nothing", () => {
        expect(alice.transportSendSpy).not.toHaveBeenCalled();
      });

      it("her client context should emit 'cancel'", () => {
        const spy = inviteClientContextEmitSpy;
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy.calls.mostRecent().args).toEqual(EVENT_CANCEL);
      });
    });

    describe("Alice invite(), no response - transaction timeout", () => {
      beforeEach(async () => {
        resetSpies();
        bob.transportReceiveSpy.and.returnValue(Promise.resolve()); // drop messages
        inviteClientContext.invite();
        await alice.transport.waitSent();
        await soon(Timers.TIMER_B);
      });

      it("her ua should send INVITE", () => {
        const spy = alice.transportSendSpy;
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy.calls.argsFor(0)).toEqual(SIP_INVITE);
      });

      if (inviteWithoutSdp) {
        it("her context should emit 'rejected', 'failed', 'terminated'", () => {
          const spy = inviteClientContextEmitSpy;
          expect(spy).toHaveBeenCalledTimes(3);
          expect(spy.calls.argsFor(0)).toEqual(EVENT_REJECTED);
          expect(spy.calls.argsFor(1)).toEqual(EVENT_FAILED);
          expect(spy.calls.argsFor(2)).toEqual(EVENT_TERMINATED);
        });
      } else {
        it("her context should emit 'sdh', 'rejected', 'failed', 'terminated'", () => {
          const spy = inviteClientContextEmitSpy;
          expect(spy).toHaveBeenCalledTimes(4);
          expect(spy.calls.argsFor(0)).toEqual(EVENT_SDH);
          expect(spy.calls.argsFor(1)).toEqual(EVENT_REJECTED);
          expect(spy.calls.argsFor(2)).toEqual(EVENT_FAILED);
          expect(spy.calls.argsFor(3)).toEqual(EVENT_TERMINATED);
        });
      }
    });

    describe("Alice invite()", () => {
      beforeEach(async () => {
        resetSpies();
        inviteClientContext.invite();
        await alice.transport.waitSent();
      });

      it("her ua should send INVITE", () => {
        const spy = alice.transportSendSpy;
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy.calls.mostRecent().args).toEqual(SIP_INVITE);
      });

      it("her ua should receive 100, 180", () => {
        const spy = alice.transportReceiveSpy;
        expect(spy).toHaveBeenCalledTimes(2);
        expect(spy.calls.argsFor(0)).toEqual(SIP_100);
        expect(spy.calls.argsFor(1)).toEqual(SIP_180);
      });

      if (inviteWithoutSdp) {
        it("her context should emit, 'progress', 'progress'", () => {
          const spy = inviteClientContextEmitSpy;
          expect(spy).toHaveBeenCalledTimes(2);
          expect(spy.calls.argsFor(0)).toEqual(EVENT_PROGRESS_ICC);
          expect(spy.calls.argsFor(1)).toEqual(EVENT_PROGRESS_ICC);
        });
      } else {
        it("her context should emit 'sdh', 'progress', 'progress'", () => {
          const spy = inviteClientContextEmitSpy;
          expect(spy).toHaveBeenCalledTimes(3);
          expect(spy.calls.argsFor(0)).toEqual(EVENT_SDH);
          expect(spy.calls.argsFor(1)).toEqual(EVENT_PROGRESS_ICC);
          expect(spy.calls.argsFor(2)).toEqual(EVENT_PROGRESS_ICC);
        });
      }

      it("his context should emit nothing", () => {
        const spy = inviteServerContextEmitSpy;
        expect(spy).toHaveBeenCalledTimes(0);
      });

      describe("Alice cancel()", () => {
        beforeEach(async () => {
          resetSpies();
          inviteClientContext.cancel();
          await inviteClientContextEmitSpy.wait("terminated");
        });

        it("her ua should send CANCEL, ACK", () => {
          const spy = alice.transportSendSpy;
          expect(spy).toHaveBeenCalledTimes(2);
          expect(spy.calls.argsFor(0)).toEqual(SIP_CANCEL);
          expect(spy.calls.argsFor(1)).toEqual(SIP_ACK);
        });

        it("her ua should receive 200, 487", () => {
          const spy = alice.transportReceiveSpy;
          expect(spy).toHaveBeenCalledTimes(2);
          expect(spy.calls.argsFor(0)).toEqual(SIP_200);
          expect(spy.calls.argsFor(1)).toEqual(SIP_487);
        });

        it("her context should emit 'cancel', 'rejected', 'failed', 'terminated'",
          () => {
            const spy = inviteClientContextEmitSpy;
            expect(spy).toHaveBeenCalledTimes(4);
            expect(spy.calls.argsFor(0)).toEqual(EVENT_CANCEL);
            expect(spy.calls.argsFor(1)).toEqual(EVENT_REJECTED);
            expect(spy.calls.argsFor(2)).toEqual(EVENT_FAILED);
            expect(spy.calls.argsFor(3)).toEqual(EVENT_TERMINATED);
          }
        );

        it("his context should emit 'sdh', 'cancel', 'rejected', 'failed', 'terminated'", () => {
            const spy = inviteServerContextEmitSpy;
            expect(spy).toHaveBeenCalledTimes(4);
            expect(spy.calls.argsFor(0)).toEqual(EVENT_CANCEL);
            expect(spy.calls.argsFor(1)).toEqual(EVENT_REJECTED);
            expect(spy.calls.argsFor(2)).toEqual(EVENT_FAILED);
            expect(spy.calls.argsFor(3)).toEqual(EVENT_TERMINATED);
          }
        );
      });

      describe("Alice cancel(), Bob accept() - an async race condition (CANCEL wins)", () => {
        beforeEach(async () => {
          resetSpies();
          spyOn(inviteServerContext.logger, "error");
          inviteClientContext.cancel();
          inviteServerContext.accept();
          await inviteClientContextEmitSpy.wait("terminated");
        });

        it("her ua should send CANCEL, ACK", () => {
          const spy = alice.transportSendSpy;
          expect(spy).toHaveBeenCalledTimes(2);
          expect(spy.calls.argsFor(0)).toEqual(SIP_CANCEL);
          expect(spy.calls.argsFor(1)).toEqual(SIP_ACK);
        });

        it("her ua should receive 200, 487", () => {
          const spy = alice.transportReceiveSpy;
          expect(spy).toHaveBeenCalledTimes(2);
          expect(spy.calls.argsFor(0)).toEqual(SIP_200);
          expect(spy.calls.argsFor(1)).toEqual(SIP_487);
        });

        it("her context should emit 'cancel', 'rejected', 'failed', 'terminated'", () => {
          const spy = inviteClientContextEmitSpy;
          expect(spy).toHaveBeenCalledTimes(4);
          expect(spy.calls.argsFor(0)).toEqual(EVENT_CANCEL);
          expect(spy.calls.argsFor(1)).toEqual(EVENT_REJECTED);
          expect(spy.calls.argsFor(2)).toEqual(EVENT_FAILED);
          expect(spy.calls.argsFor(3)).toEqual(EVENT_TERMINATED);
        });

        it("his context should emit 'sdh', 'cancel', 'rejected', 'failed', 'terminated'", () => {
          const spy = inviteServerContextEmitSpy;
          expect(spy).toHaveBeenCalledTimes(5);
          expect(spy.calls.argsFor(0)).toEqual(EVENT_SDH);
          expect(spy.calls.argsFor(1)).toEqual(EVENT_CANCEL);
          expect(spy.calls.argsFor(2)).toEqual(EVENT_REJECTED);
          expect(spy.calls.argsFor(3)).toEqual(EVENT_FAILED);
          expect(spy.calls.argsFor(4)).toEqual(EVENT_TERMINATED);
        });

        it("his context should log an error regarding Bob accept() failure", async () => {
          await soon();
          expect(inviteServerContext.logger.error).toHaveBeenCalled();
        });
      });

      describe("Bob accept(), Alice cancel() - a network glare condition (200 wins)", () => {
        // FIXME: HACK: This test was a pain to make happen, but the case SHOULD be tested.
        // While accept() is called first, cancel() will get a CANCEL out before the 200 makes
        // it out first unless it is delayed. I didn't have a good hook to make it wait on after
        // the accept(), so I gave up after a while and just wrapped the cancel() in promise
        // resolutions until the 200 got sent before the CANCEL. On the flip side, if you wait
        // too long the 200 will get handled before cancel() is called. In any event, this should
        // be reworked so that it is deterministic instead of this fragile promise chain hack....
        beforeEach(async () => {
          resetSpies();
          inviteServerContext.accept();
          if (inviteWithoutSdp) {
            return Promise.resolve().then(() =>
              Promise.resolve().then(() =>
                Promise.resolve().then(() =>
                  Promise.resolve().then(() => inviteClientContext.cancel()))));
          } else {
            return Promise.resolve().then(() =>
              Promise.resolve().then(() =>
                Promise.resolve().then(() =>
                  Promise.resolve().then(() =>
                    Promise.resolve().then(() =>
                      Promise.resolve().then(() => inviteClientContext.cancel()))))));
          }
        });

        it("her ua should send CANCEL, ACK, BYE", async () => {
          const spy = alice.transportSendSpy;
          expect(spy).toHaveBeenCalledTimes(3);
          expect(spy.calls.argsFor(0)).toEqual(SIP_CANCEL);
          expect(spy.calls.argsFor(1)).toEqual(SIP_ACK);
          expect(spy.calls.argsFor(2)).toEqual(SIP_BYE);
        });

        it("her ua should receive 200, 200, 200", () => {
          const spy = alice.transportReceiveSpy;
          expect(spy).toHaveBeenCalledTimes(3);
          expect(spy.calls.argsFor(0)).toEqual(SIP_200); // INVITE
          expect(spy.calls.argsFor(0)).toEqual(SIP_200); // CANCEL
          expect(spy.calls.argsFor(0)).toEqual(SIP_200); // BYE
        });

        it("her context should emit 'cancel', 'ack', 'bye', 'bye'", () => {
          const spy = inviteClientContextEmitSpy;
          expect(spy).toHaveBeenCalledTimes(4);
          expect(spy.calls.argsFor(0)).toEqual(EVENT_CANCEL);
          expect(spy.calls.argsFor(1)).toEqual(EVENT_ACK);
          expect(spy.calls.argsFor(2)).toEqual(EVENT_BYE);
          expect(spy.calls.argsFor(3)).toEqual(EVENT_BYE); // seems obviously broken
        });

        it("his context should emit 'sdh', 'accepted', 'confirmed', 'bye', 'terminated'", () => {
          const spy = inviteServerContextEmitSpy;
          expect(spy).toHaveBeenCalledTimes(5);
          expect(spy.calls.argsFor(0)).toEqual(EVENT_SDH);
          expect(spy.calls.argsFor(1)).toEqual(EVENT_ACCEPTED_ICS);
          expect(spy.calls.argsFor(2)).toEqual(EVENT_CONFIRMED);
          expect(spy.calls.argsFor(3)).toEqual(EVENT_BYE);
          expect(spy.calls.argsFor(4)).toEqual(EVENT_TERMINATED);
        });
      });

      describe("Bob nothing - no answer timeout", () => {
        beforeEach(async () => {
          resetSpies();
          const noAnswerTimeout = 90000;
          if (alice.ua.configuration.noAnswerTimeout !== noAnswerTimeout) {
            throw new Error("Test is assuming UA configured with 90 second no answer timeout");
          }
          await soon(noAnswerTimeout);
        });

        it("her ua should send ACK", async () => {
          const spy = alice.transportSendSpy;
          expect(spy).toHaveBeenCalledTimes(1);
          expect(spy.calls.argsFor(0)).toEqual(SIP_ACK);
        });

        it("her ua should receive 180, 408", () => {
          const spy = alice.transportReceiveSpy;
          expect(spy).toHaveBeenCalledTimes(2);
          expect(spy.calls.argsFor(0)).toEqual(SIP_180); // provisional resend timer generates this at 60 sec
          expect(spy.calls.argsFor(1)).toEqual(SIP_408);
        });

        it("her context should emit 'progress', 'rejected', 'failed', 'terminated'", () => {
          const spy = inviteClientContextEmitSpy;
          expect(spy).toHaveBeenCalledTimes(4);
          expect(spy.calls.argsFor(0)).toEqual(EVENT_PROGRESS_ICC);
          expect(spy.calls.argsFor(1)).toEqual(EVENT_REJECTED);
          expect(spy.calls.argsFor(2)).toEqual(EVENT_FAILED);
          expect(spy.calls.argsFor(3)).toEqual(EVENT_TERMINATED);
        });
      });

      describe("Bob accept()", () => {
        if (inviteWithoutSdp) {
          bobAccept(true, false, true);
        } else {
          bobAccept(false, true, false);
        }

        describe("Bob terminate()", () => {
          bobTerminate();
        });

        describe("Bob terminate(), terminate()", () => {
          bobTerminate2x();
        });
      });

      xdescribe("Bob accept(), accept() // FIXME: Need guard against calling more than once.", () => {
        bobAccept2x(false, true, false);
      });

      describe("Bob progress()", () => {
        bobProgress();

        describe("Bob accept()", () => {
          if (inviteWithoutSdp) {
            bobAccept(true, false, true);
          } else {
            bobAccept(false, true, false);
          }
        });

        describe("Bob reject()", () => {
          bobReject();
        });

        describe("Bob progress()", () => {
          bobProgress();

          describe("Bob accept()", () => {
            if (inviteWithoutSdp) {
              bobAccept(true, false, true);
            } else {
              bobAccept(false, true, false);
            }
          });

          describe("Bob reject()", () => {
            bobReject();
          });
        });
      });

      // Sending offer in unreliable provisional not legal,
      // but should still write test for that case. Punting...
      if (!inviteWithoutSdp) {
        describe("Bob progress(183)", () => {
          bobProgress183();

          describe("Bob accept()", () => {
            bobAccept(false, false, false);
          });

          describe("Bob reject()", () => {
            bobReject();
          });

          describe("Bob progress()", () => {
            bobProgress();

            describe("Bob accept()", () => {
              bobAccept(false, false, false);
            });

            describe("Bob reject()", () => {
              bobReject();
            });
          });
        });
      }

      describe("Bob progress(reliable)", () => {
        if (inviteWithoutSdp) {
          bobProgressReliable(false, true);
        } else {
          bobProgressReliable(true, false);
        }

        describe("Bob accept()", () => {
          bobAccept(false, false, false);
        });

        describe("Bob reject()", () => {
          bobReject();
        });

        describe("Bob progress(reliable) ", () => {
          bobProgressReliable(false, false);

          describe("Bob accept()", () => {
            bobAccept(false, false, false);
          });

          describe("Bob reject()", () => {
            bobReject();
          });
        });

        describe("Bob progress()", () => {
          bobProgress();

          describe("Bob accept()", () => {
            bobAccept(false, false, false);
          });

          describe("Bob reject()", () => {
            bobReject();
          });

          describe("Bob progress(reliable) ", () => {
            bobProgressReliable(false, false);

            describe("Bob accept()", () => {
              bobAccept(false, false, false);
            });

            describe("Bob reject()", () => {
              bobReject();
            });
          });
        });
      });

      describe("Bob progress(), progress()", () => {
        bobProgress2x();
      });

      describe("Bob progress(reliable), progress(reliable)", () => {
        if (inviteWithoutSdp) {
          bobProgressReliable2x(false, true);
        } else {
          bobProgressReliable2x(true, false);
        }
      });

      describe("Bob reject()", () => {
        bobReject();
      });

      describe("Bob reject(), reject()", () => {
        bobReject2x();
      });

      describe("Bob terminate()", () => {
        bobTerminate(false);
      });

      describe("Bob terminate(), terminate()", () => {
        bobTerminate2x(false);
      });

      describe("Bob accept(), terminate()", () => {
        if (inviteWithoutSdp) {
          bobAcceptTerminate(true, false, true, false);
        } else {
          bobAcceptTerminate(false, true, false, false);
        }
      });

      describe("Bob accept(), terminate(), no ACK - transaction timeout", () => {
        if (inviteWithoutSdp) {
          bobAcceptTerminate(true, false, true, true);
        } else {
          bobAcceptTerminate(false, true, false, true);
        }
      });
    });
  }

  function resetSpies(): void {
    alice.transportReceiveSpy.calls.reset();
    alice.transportSendSpy.calls.reset();
    bob.transportReceiveSpy.calls.reset();
    bob.transportSendSpy.calls.reset();
    inviteClientContextEmitSpy.calls.reset();
    if (inviteServerContextEmitSpy) { inviteServerContextEmitSpy.calls.reset(); }
  }

  beforeEach(() => {
    jasmine.clock().install();
    alice = makeUserFake("alice", "example.com", "Alice");
    bob = makeUserFake("bob", "example.com", "Bob");
    connectUserFake(alice, bob);
  });

  afterEach(() => {
    jasmine.clock().uninstall();
    // alice.ua.stop();
    // bob.ua.stop();
  });

  describe("Alice constructs a new INVITE client context targeting Bob with SDP offer", () => {
    beforeEach(async () => {
      target = bob.uri;
      bob.ua.on("invite", (session: InviteServerContext) => {
        inviteServerContext = session;
        inviteServerContextEmitSpy = makeEventEmitterEmitSpy(inviteServerContext, bob.ua.getLogger("Bob"));
      });
      inviteClientContext = new InviteClientContext(alice.ua, target);
      inviteClientContextEmitSpy = makeEventEmitterEmitSpy(inviteClientContext, alice.ua.getLogger("Alice"));
      await soon();
    });

    inviteSuite(false);
  });

  describe("Alice constructs a new INVITE client context targeting Bob without SDP offer", () => {
    beforeEach(async () => {
      target = bob.uri;
      bob.ua.on("invite", (session: InviteServerContext) => {
        inviteServerContext = session;
        inviteServerContextEmitSpy = makeEventEmitterEmitSpy(inviteServerContext, bob.ua.getLogger("Bob"));
      });
      inviteClientContext = new InviteClientContext(alice.ua, target, { inviteWithoutSdp: true });
      inviteClientContextEmitSpy = makeEventEmitterEmitSpy(inviteClientContext, alice.ua.getLogger("Alice"));
      await soon();
    });

    inviteSuite(true);
  });

  describe("Forking...", () => {
    let bob2: UserFake;
    let inviteServerContext2: InviteServerContext;
    let inviteServerContextEmitSpy2: EventEmitterEmitSpy;

    function bobsAccept(answerInAck: boolean, answerInOk: boolean, offerInOk: boolean) {
      const SIP_ACK_OR_BYE = [jasmine.stringMatching(/^ACK|^BYE/)];
      const EVENT_ACCEPTED_OR_BYE = jasmine.stringMatching(/accepted|bye/);

      beforeEach(async () => {
        resetSpies2();
        inviteServerContext.accept();
        inviteServerContext2.accept();
        await inviteClientContextEmitSpy.wait("accepted");
      });

      it("her ua should send ACK, BYE, ACK", () => {
        const spy = alice.transportSendSpy;
        expect(spy).toHaveBeenCalledTimes(3);
        expect(spy.calls.argsFor(0)).toEqual(SIP_ACK_OR_BYE);
        expect(spy.calls.argsFor(1)).toEqual(SIP_ACK_OR_BYE);
        expect(spy.calls.argsFor(2)).toEqual(SIP_ACK_OR_BYE);
      });

      if (answerInAck) {
        it("her context should emit 'sdh', 'ack', 'bye', 'ack', 'accepted'", () => {
          const spy = inviteClientContextEmitSpy;
          expect(spy).toHaveBeenCalledTimes(5);
          expect(spy.calls.argsFor(0)).toEqual(EVENT_SDH);
          expect(spy.calls.argsFor(1)).toEqual(EVENT_ACK);
          expect(spy.calls.argsFor(2)).toEqual(EVENT_BYE);
          expect(spy.calls.argsFor(3)).toEqual(EVENT_ACK);
          expect(spy.calls.argsFor(4)).toEqual(EVENT_ACCEPTED_ICC);
        });
      } else {
        it("her context should emit 'ack', 'bye', 'ack', 'accepted'", () => {
          const spy = inviteClientContextEmitSpy;
          expect(spy).toHaveBeenCalledTimes(4);
          expect(spy.calls.argsFor(0)).toEqual(EVENT_ACK);
          expect(spy.calls.argsFor(1)[0]).toEqual(EVENT_ACCEPTED_OR_BYE);
          expect(spy.calls.argsFor(2)).toEqual(EVENT_ACK);
          expect(spy.calls.argsFor(3)[0]).toEqual(EVENT_ACCEPTED_OR_BYE);
        });
      }

      it("her session should be 'confirmed' and 'stable'", () => {
        const session = inviteClientContext.session;
        expect(session && session.sessionState).toBe(SessionState.Confirmed);
        expect(session && session.signalingState).toBe(SignalingState.Stable);
      });
    }

    function bobsProgressReliable(answerInProgress: boolean, offerInProgress: boolean): void {
      beforeEach(async () => {
        resetSpies2();
        inviteServerContext.progress({ rel100: true });
        inviteServerContext2.progress({ rel100: true });
        await inviteClientContextEmitSpy.wait("progress");
        await bob.transport.waitSent(); // 200 for PRACK
      });

      it("her ua should send PRACK, PRACK", () => {
        const spy = alice.transportSendSpy;
        expect(spy).toHaveBeenCalledTimes(2);
        expect(spy.calls.argsFor(0)).toEqual(SIP_PRACK);
        expect(spy.calls.argsFor(1)).toEqual(SIP_PRACK);
      });

      if (offerInProgress) {
        it("her context should emit 'sdh', 'sdh', 'progress', 'progress'", () => {
          const spy = inviteClientContextEmitSpy;
          expect(spy).toHaveBeenCalledTimes(4);
          expect(spy.calls.argsFor(0)).toEqual(EVENT_SDH);
          expect(spy.calls.argsFor(1)).toEqual(EVENT_SDH);
          expect(spy.calls.argsFor(2)).toEqual(EVENT_PROGRESS_ICC);
          expect(spy.calls.argsFor(3)).toEqual(EVENT_PROGRESS_ICC);
        });
      } else {
        it("her context should emit 'progress', 'progress'", () => {
          const spy = inviteClientContextEmitSpy;
          expect(spy).toHaveBeenCalledTimes(2);
          expect(spy.calls.argsFor(0)).toEqual(EVENT_PROGRESS_ICC);
          expect(spy.calls.argsFor(1)).toEqual(EVENT_PROGRESS_ICC);
        });
      }
    }

    function inviteSuiteFork(inviteWithoutSdp: boolean): void {

      it("her ua should send nothing", () => {
        expect(alice.transportSendSpy).not.toHaveBeenCalled();
      });

      describe("Alice invite() fork", () => {
        beforeEach(async () => {
          resetSpies2();
          inviteClientContext.invite();
          await alice.transport.waitSent();
        });

        it("her ua should send INVITE", () => {
          const spy = alice.transportSendSpy;
          expect(spy).toHaveBeenCalledTimes(1);
          expect(spy.calls.mostRecent().args).toEqual(SIP_INVITE);
        });

        it("her ua should receive 100, 180", () => {
          const spy = alice.transportReceiveSpy;
          expect(spy).toHaveBeenCalledTimes(4);
          expect(spy.calls.argsFor(0)).toEqual(SIP_100);
          expect(spy.calls.argsFor(1)).toEqual(SIP_180);
          expect(spy.calls.argsFor(2)).toEqual(SIP_100);
          expect(spy.calls.argsFor(3)).toEqual(SIP_180);
        });

        if (inviteWithoutSdp) {
          it("her context should emit, 'progress', 'progress'", () => {
            const spy = inviteClientContextEmitSpy;
            expect(spy).toHaveBeenCalledTimes(4);
            expect(spy.calls.argsFor(0)).toEqual(EVENT_PROGRESS_ICC);
            expect(spy.calls.argsFor(1)).toEqual(EVENT_PROGRESS_ICC);
            expect(spy.calls.argsFor(2)).toEqual(EVENT_PROGRESS_ICC);
            expect(spy.calls.argsFor(3)).toEqual(EVENT_PROGRESS_ICC);
          });
        } else {
          it("her context should emit 'sdh', 'progress', 'progress', 'progress', 'progress'", () => {
            const spy = inviteClientContextEmitSpy;
            expect(spy).toHaveBeenCalledTimes(5);
            expect(spy.calls.argsFor(0)).toEqual(EVENT_SDH);
            expect(spy.calls.argsFor(1)).toEqual(EVENT_PROGRESS_ICC);
            expect(spy.calls.argsFor(2)).toEqual(EVENT_PROGRESS_ICC);
            expect(spy.calls.argsFor(3)).toEqual(EVENT_PROGRESS_ICC);
            expect(spy.calls.argsFor(4)).toEqual(EVENT_PROGRESS_ICC);
          });
        }

        describe("Bob & Bob2 accept()", () => {
          if (inviteWithoutSdp) {
            bobsAccept(true, false, true);
          } else {
            bobsAccept(false, true, false);
          }
        });

        describe("Bob & Bob2 progress(reliable)", () => {
          if (inviteWithoutSdp) {
            bobsProgressReliable(false, true);
          } else {
            bobsProgressReliable(true, false);
          }

          describe("Bob & Bob2 accept()", () => {
            bobsAccept(false, false, false);
          });
        });
      });
    }

    function resetSpies2(): void {
      resetSpies();
      bob2.transportReceiveSpy.calls.reset();
      bob2.transportSendSpy.calls.reset();
      if (inviteServerContextEmitSpy2) { inviteServerContextEmitSpy2.calls.reset(); }
    }

    beforeEach(async () => {
      bob2 = makeUserFake("bob", "example.com", "Bob2");
      connectUserFake(alice, bob2);
    });

    describe("Alice constructs a new INVITE client context targeting Bob with SDP offer", () => {
      beforeEach(async () => {
        target = bob.uri;
        bob.ua.on("invite", (session: InviteServerContext) => {
          inviteServerContext = session;
          inviteServerContextEmitSpy = makeEventEmitterEmitSpy(inviteServerContext, bob.ua.getLogger("Bob"));
        });
        bob2.ua.on("invite", (session: InviteServerContext) => {
          inviteServerContext2 = session;
          inviteServerContextEmitSpy2 = makeEventEmitterEmitSpy(inviteServerContext2, bob2.ua.getLogger("Bob2"));
        });
        inviteClientContext = new InviteClientContext(alice.ua, target);
        inviteClientContextEmitSpy = makeEventEmitterEmitSpy(inviteClientContext, alice.ua.getLogger("Alice"));
        await soon();
      });

      inviteSuiteFork(false);
    });

    describe("Alice constructs a new INVITE client context targeting Bob without SDP offer", () => {
      beforeEach(async () => {
        target = bob.uri;
        bob.ua.on("invite", (session: InviteServerContext) => {
          inviteServerContext = session;
          inviteServerContextEmitSpy = makeEventEmitterEmitSpy(inviteServerContext, bob.ua.getLogger("Bob"));
        });
        bob2.ua.on("invite", (session: InviteServerContext) => {
          inviteServerContext2 = session;
          inviteServerContextEmitSpy2 = makeEventEmitterEmitSpy(inviteServerContext2, bob2.ua.getLogger("Bob2"));
        });
        inviteClientContext = new InviteClientContext(alice.ua, target, { inviteWithoutSdp: true });
        inviteClientContextEmitSpy = makeEventEmitterEmitSpy(inviteClientContext, alice.ua.getLogger("Alice"));
        await soon();
      });

      inviteSuiteFork(true);
    });
  });
});
