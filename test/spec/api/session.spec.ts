import { Timers, URI } from "../../../src";
import { Invitation, Inviter, Session, SessionDescriptionHandler, SessionState } from "../../../src/api";
import { SessionState as SessionDialogState, SignalingState } from "../../../src/core";
import { EmitterSpy, makeEmitterSpy } from "../../support/api/emitter-spy";
import { EventEmitterEmitSpy, makeEventEmitterEmitSpy } from "../../support/api/event-emitter-spy";
import { connectUserFake, makeUserFake, UserFake } from "../../support/api/user-fake";
import { soon } from "../../support/api/utils";

const SIP_ACK = [jasmine.stringMatching(/^ACK/)];
const SIP_BYE = [jasmine.stringMatching(/^BYE/)];
const SIP_CANCEL = [jasmine.stringMatching(/^CANCEL/)];
const SIP_INVITE = [jasmine.stringMatching(/^INVITE/)];
const SIP_PRACK = [jasmine.stringMatching(/^PRACK/)];
const SIP_100 = [jasmine.stringMatching(/^SIP\/2.0 100/)];
const SIP_180 = [jasmine.stringMatching(/^SIP\/2.0 180/)];
const SIP_183 = [jasmine.stringMatching(/^SIP\/2.0 183/)];
const SIP_200 = [jasmine.stringMatching(/^SIP\/2.0 200/)];
const SIP_404 = [jasmine.stringMatching(/^SIP\/2.0 404/)];
const SIP_408 = [jasmine.stringMatching(/^SIP\/2.0 408/)];
const SIP_480 = [jasmine.stringMatching(/^SIP\/2.0 480/)];
const SIP_481 = [jasmine.stringMatching(/^SIP\/2.0 481/)];
const SIP_487 = [jasmine.stringMatching(/^SIP\/2.0 487/)];
const SIP_488 = [jasmine.stringMatching(/^SIP\/2.0 488/)];

const EVENT_ACK = ["ack", jasmine.any(Object)];
const EVENT_BYE = ["bye", jasmine.any(Object)];
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

function terminate(invitation: Invitation): Promise<void> {
  const session = invitation;
  switch (session.state) {
    case SessionState.Initial:
    case SessionState.Establishing:
      return session.reject();
    case SessionState.Established:
      return session.bye().then(() => { return; });
    case SessionState.Terminating:
    case SessionState.Terminated:
    default:
      return Promise.reject();
  }
}

/**
 * Session Integration Tests
 */

describe("Session Class New", () => {
  let alice: UserFake;
  let bob: UserFake;
  let target: URI;
  let inviter: Inviter;
  let inviterEmitSpy: EventEmitterEmitSpy;
  let inviterStateSpy: EmitterSpy<SessionState>;
  let invitation: Invitation;
  let invitationEmitSpy: EventEmitterEmitSpy;
  let invitationStateSpy: EmitterSpy<SessionState>;

  function bobAccept(answerInAck: boolean, answerInOk: boolean, offerInOk: boolean) {

    beforeEach(async () => {
      resetSpies();
      invitation.accept();
      await invitationEmitSpy.wait("confirmed");
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
      it("her context should emit 'sdh'", () => {
        const spy = inviterEmitSpy;
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy.calls.argsFor(0)).toEqual(EVENT_SDH);
      });
    } else {
      it("her context should emit nothing", () => {
        const spy = inviterEmitSpy;
        expect(spy).toHaveBeenCalledTimes(0);
      });
    }

    if (answerInOk || offerInOk) {
      it("his context should emit 'sdh', 'confirmed'", () => {
        const spy = invitationEmitSpy;
        expect(spy).toHaveBeenCalledTimes(2);
        expect(spy.calls.argsFor(0)).toEqual(EVENT_SDH);
        expect(spy.calls.argsFor(1)).toEqual(EVENT_CONFIRMED);
      });
    } else {
      it("his context should emit 'confirmed'", () => {
        const spy = invitationEmitSpy;
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy.calls.argsFor(0)).toEqual(EVENT_CONFIRMED);
      });
    }

    it("her session should be 'established'", () => {
      const spy = inviterStateSpy;
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.calls.argsFor(0)).toEqual([SessionState.Established]);
    });

    it("his session should be 'establishing', 'established'", () => {
      const spy = invitationStateSpy;
      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy.calls.argsFor(0)).toEqual([SessionState.Establishing]);
      expect(spy.calls.argsFor(1)).toEqual([SessionState.Established]);
    });

    it("her dialog should be 'confirmed' and 'stable'", () => {
      const session = inviter.dialog;
      expect(session && session.sessionState).toBe(SessionDialogState.Confirmed);
      expect(session && session.signalingState).toBe(SignalingState.Stable);
    });

    it("his dialog should be 'confirmed' and 'stable'", () => {
      const session = invitation.dialog;
      expect(session && session.sessionState).toBe(SessionDialogState.Confirmed);
      expect(session && session.signalingState).toBe(SignalingState.Stable);
    });
  }

  function bobAccept2x(answerInAck: boolean, answerInOk: boolean, offerInOk: boolean): void {
    let threw = false;

    beforeEach(async () => {
      resetSpies();
      invitation.accept();
      try {
        invitation.accept();
      } catch (e) {
        threw = true;
      }
      await inviterStateSpy.wait(SessionState.Established);
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

    it("her context should emit nothing", () => {
      const spy = inviterEmitSpy;
      expect(spy).toHaveBeenCalledTimes(0);
    });

    if (answerInAck) {
      it("her context should emit 'sdh'", () => {
        const spy = inviterEmitSpy;
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy.calls.argsFor(0)).toEqual(EVENT_SDH);
      });
    } else {
      it("her context should emit nothing", () => {
        const spy = inviterEmitSpy;
        expect(spy).toHaveBeenCalledTimes(0);
      });
    }

    if (answerInOk || offerInOk) {
      it("his context should emit 'sdh', 'confirmed'", () => {
        const spy = invitationEmitSpy;
        expect(spy).toHaveBeenCalledTimes(2);
        expect(spy.calls.argsFor(0)).toEqual(EVENT_SDH);
        expect(spy.calls.argsFor(1)).toEqual(EVENT_CONFIRMED);
      });
    } else {
      it("his context should emit 'confirmed'", () => {
        const spy = invitationEmitSpy;
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy.calls.argsFor(0)).toEqual(EVENT_CONFIRMED);
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
      invitation.accept();
      await bob.transport.waitSent(); // wait till 2xx sent
      terminate(invitation); // must wait for ACK or timeout before sending BYE
      if (dropAcks) {
        await alice.transport.waitSent(); // wait for first ACK sent (it will not be received)
        await soon(Timers.TIMER_L - 2); // transaction timeout waiting for ACK
        await soon(1); // a tick to let the retranmissions get processed after the clock jump
        await soon(1); // and then send the BYE upon transaction timout
      } else {
        await inviterEmitSpy.wait("terminated");
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
      it("her context should emit 'sdh', 'bye', 'terminated'", () => {
        const spy = inviterEmitSpy;
        expect(spy).toHaveBeenCalledTimes(3);
        expect(spy.calls.argsFor(0)).toEqual(EVENT_SDH);
        expect(spy.calls.argsFor(1)).toEqual(EVENT_BYE);
        expect(spy.calls.argsFor(2)).toEqual(EVENT_TERMINATED);
      });
    } else {
      it("her context should emit 'bye', 'terminated'", () => {
        const spy = inviterEmitSpy;
        expect(spy).toHaveBeenCalledTimes(2);
        expect(spy.calls.argsFor(0)).toEqual(EVENT_BYE);
        expect(spy.calls.argsFor(1)).toEqual(EVENT_TERMINATED);
      });
    }

    if (answerInOk || offerInOk) {
      it("his context should emit 'sdh', 'bye', 'terminated'", () => {
        const spy = invitationEmitSpy;
        expect(spy).toHaveBeenCalledTimes(4);
        expect(spy.calls.argsFor(0)).toEqual(EVENT_SDH);
        expect(spy.calls.argsFor(1)).toEqual(EVENT_BYE);
        expect(spy.calls.argsFor(2)).toEqual(EVENT_TERMINATED_ISC);
        expect(spy.calls.argsFor(3)).toEqual(EVENT_BYE); // seems obviously broken
      });
    } else {
      it("his context should emit 'bye', 'terminated'", () => {
        const spy = invitationEmitSpy;
        expect(spy).toHaveBeenCalledTimes(3);
        expect(spy.calls.argsFor(0)).toEqual(EVENT_BYE);
        expect(spy.calls.argsFor(1)).toEqual(EVENT_TERMINATED_ISC);
        expect(spy.calls.argsFor(2)).toEqual(EVENT_BYE); // seems obviously broken
      });
    }
  }

  function bobProgress(): void {
    beforeEach(async () => {
      resetSpies();
      invitation.progress();
      await inviterEmitSpy.wait("progress");
    });

    it("her ua should receive 180", () => {
      const spy = alice.transportReceiveSpy;
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.calls.mostRecent().args).toEqual(SIP_180);
    });

    it("her context should emit 'progress'", () => {
      const spy = inviterEmitSpy;
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.calls.mostRecent().args).toEqual(EVENT_PROGRESS_ICC);
    });

    it("his context should emit 'progress'", () => {
      const spy = invitationEmitSpy;
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.calls.mostRecent().args).toEqual(EVENT_PROGRESS_ICS);
    });
  }

  function bobProgress183(): void {
    beforeEach(async () => {
      resetSpies();
      invitation.progress({
        statusCode: 183,
      });
      await inviterEmitSpy.wait("progress");
    });

    it("her ua should receive 183", () => {
      const spy = alice.transportReceiveSpy;
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.calls.mostRecent().args).toEqual(SIP_183);
    });

    it("her context should emit 'sdh', 'progress'", () => {
      const spy = inviterEmitSpy;
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.calls.mostRecent().args).toEqual(EVENT_PROGRESS_ICC);
    });

    it("his context should emit 'progress'", () => {
      const spy = invitationEmitSpy;
      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy.calls.argsFor(0)).toEqual(EVENT_SDH);
      expect(spy.calls.argsFor(1)).toEqual(EVENT_PROGRESS_ICS);
      expect(spy.calls.mostRecent().args).toEqual(EVENT_PROGRESS_ICS);
    });
  }

  function bobProgress2x(): void {
    beforeEach(async () => {
      resetSpies();
      invitation.progress();
      invitation.progress();
      await inviterEmitSpy.wait("progress");
    });

    it("her ua should receive 180, 180", () => {
      const spy = alice.transportReceiveSpy;
      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy.calls.argsFor(0)).toEqual(SIP_180);
      expect(spy.calls.argsFor(1)).toEqual(SIP_180);
    });

    it("her context should emit 'progress', 'progress'", () => {
      const spy = inviterEmitSpy;
      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy.calls.argsFor(0)).toEqual(EVENT_PROGRESS_ICC);
      expect(spy.calls.argsFor(1)).toEqual(EVENT_PROGRESS_ICC);
    });

    it("his context should emit 'progress', 'progress;", () => {
      const spy = invitationEmitSpy;
      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy.calls.argsFor(0)).toEqual(EVENT_PROGRESS_ICS);
      expect(spy.calls.argsFor(1)).toEqual(EVENT_PROGRESS_ICS);
    });
  }

  function bobProgressReliable(answerInProgress: boolean, offerInProgress: boolean): void {
    beforeEach(async () => {
      resetSpies();
      invitation.progress({ rel100: true });
      await inviterEmitSpy.wait("progress");
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
        const spy = inviterEmitSpy;
        expect(spy).toHaveBeenCalledTimes(2);
        expect(spy.calls.argsFor(0)).toEqual(EVENT_SDH);
        expect(spy.calls.argsFor(1)).toEqual(EVENT_PROGRESS_ICC);
      });
    } else {
      it("her context should emit 'progress'", () => {
        const spy = inviterEmitSpy;
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy.calls.mostRecent().args).toEqual(EVENT_PROGRESS_ICC);
      });
    }

    if (offerInProgress) {
      it("his context should emit 'sdh', 'progress'", () => {
        const spy = invitationEmitSpy;
        expect(spy).toHaveBeenCalledTimes(2);
        expect(spy.calls.argsFor(0)).toEqual(EVENT_SDH);
        expect(spy.calls.argsFor(1)).toEqual(EVENT_PROGRESS_ICS);
      });
    } else if (answerInProgress) {
      it("his context should emit 'sdh', 'progress'", () => {
        const spy = invitationEmitSpy;
        expect(spy).toHaveBeenCalledTimes(2);
        expect(spy.calls.argsFor(0)).toEqual(EVENT_SDH);
        expect(spy.calls.argsFor(1)).toEqual(EVENT_PROGRESS_ICS);
      });
    } else {
      it("his context should emit progress'", () => {
        const spy = invitationEmitSpy;
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy.calls.mostRecent().args).toEqual(EVENT_PROGRESS_ICS);
      });
    }
  }

  function bobProgressReliable2x(answerInProgress: boolean, offerInProgress: boolean): void {
    beforeEach(async () => {
      resetSpies();
      invitation.progress({ rel100: true });
      invitation.progress({ rel100: true }); // This one should be ignored as we are waiting on a PRACK.
      await inviterEmitSpy.wait("progress");
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
        const spy = inviterEmitSpy;
        expect(spy).toHaveBeenCalledTimes(2);
        expect(spy.calls.argsFor(0)).toEqual(EVENT_SDH);
        expect(spy.calls.argsFor(1)).toEqual(EVENT_PROGRESS_ICC);
      });
    } else {
      it("her context should emit 'progress'", () => {
        const spy = inviterEmitSpy;
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy.calls.mostRecent().args).toEqual(EVENT_PROGRESS_ICC);
      });
    }

    if (offerInProgress) {
      it("his context should emit 'sdh', 'progress'", () => {
        const spy = invitationEmitSpy;
        expect(spy).toHaveBeenCalledTimes(2);
        expect(spy.calls.argsFor(0)).toEqual(EVENT_SDH);
        expect(spy.calls.argsFor(1)).toEqual(EVENT_PROGRESS_ICS);
      });
    } else if (answerInProgress) {
      it("his context should emit 'sdh', 'progress'", () => {
        const spy = invitationEmitSpy;
        expect(spy).toHaveBeenCalledTimes(2);
        expect(spy.calls.argsFor(0)).toEqual(EVENT_SDH);
        expect(spy.calls.argsFor(1)).toEqual(EVENT_PROGRESS_ICS);
      });
    } else {
      it("his context should emit progress'", () => {
        const spy = invitationEmitSpy;
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy.calls.mostRecent().args).toEqual(EVENT_PROGRESS_ICS);
      });
    }
  }

  function bobReject(): void {
    beforeEach(async () => {
      resetSpies();
      invitation.reject();
      await inviterEmitSpy.wait("terminated");
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
      const spy = inviterEmitSpy;
      expect(spy).toHaveBeenCalledTimes(3);
      expect(spy.calls.argsFor(0)).toEqual(EVENT_REJECTED);
      expect(spy.calls.argsFor(1)).toEqual(EVENT_FAILED);
      expect(spy.calls.argsFor(2)).toEqual(EVENT_TERMINATED);
    });

    it("his context should emit 'rejected', 'failed', 'terminated'", () => {
      const spy = invitationEmitSpy;
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
      invitation.reject();
      invitation.reject()
        .catch((error) => {
          threw = true;
        });
      await inviterEmitSpy.wait("terminated");
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
      const spy = inviterEmitSpy;
      expect(spy).toHaveBeenCalledTimes(3);
      expect(spy.calls.argsFor(0)).toEqual(EVENT_REJECTED);
      expect(spy.calls.argsFor(1)).toEqual(EVENT_FAILED);
      expect(spy.calls.argsFor(2)).toEqual(EVENT_TERMINATED);
    });

    it("his context should emit 'rejected', 'failed', 'terminated'", () => {
      const spy = invitationEmitSpy;
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
      terminate(invitation);
      await inviterEmitSpy.wait("terminated");
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
        const spy = inviterEmitSpy;
        expect(spy).toHaveBeenCalledTimes(2);
        expect(spy.calls.argsFor(0)).toEqual(EVENT_BYE);
        expect(spy.calls.argsFor(1)).toEqual(EVENT_TERMINATED);
      });

      it("his context should emit 'bye', 'terminated'", () => {
        const spy = invitationEmitSpy;
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
        const spy = inviterEmitSpy;
        expect(spy).toHaveBeenCalledTimes(3);
        expect(spy.calls.argsFor(0)).toEqual(EVENT_REJECTED);
        expect(spy.calls.argsFor(1)).toEqual(EVENT_FAILED);
        expect(spy.calls.argsFor(2)).toEqual(EVENT_TERMINATED);
      });

      it("his context should emit 'rejected', 'failed', 'terminated'", () => {
        const spy = invitationEmitSpy;
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
      terminate(invitation);
      terminate(invitation)
        .catch((error) => {
          threw = true;
        });
      await inviterEmitSpy.wait("terminated");
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
        const spy = inviterEmitSpy;
        expect(spy).toHaveBeenCalledTimes(2);
        expect(spy.calls.argsFor(0)).toEqual(EVENT_BYE);
        expect(spy.calls.argsFor(1)).toEqual(EVENT_TERMINATED);
      });

      it("his context should emit 'bye', 'terminated'", () => {
        const spy = invitationEmitSpy;
        expect(spy).toHaveBeenCalledTimes(2);
        expect(spy.calls.argsFor(0)).toEqual(EVENT_BYE);
        expect(spy.calls.argsFor(1)).toEqual(EVENT_TERMINATED_ISC);
      });

      it("her second terminate() threw an error", () => {
        expect(threw).toBe(true);
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
        const spy = inviterEmitSpy;
        expect(spy).toHaveBeenCalledTimes(3);
        expect(spy.calls.argsFor(0)).toEqual(EVENT_REJECTED);
        expect(spy.calls.argsFor(1)).toEqual(EVENT_FAILED);
        expect(spy.calls.argsFor(2)).toEqual(EVENT_TERMINATED);
      });

      it("his context should emit 'rejected', 'failed', 'terminated'", () => {
        const spy = invitationEmitSpy;
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
    it("her state should not change", () => {
      expect(inviter.state).toBe(SessionState.Initial);
      expect(inviterStateSpy).not.toHaveBeenCalled();
    });

    it("her ua should send nothing", () => {
      expect(alice.transportSendSpy).not.toHaveBeenCalled();
    });

    it("her context should emit nothing", () => {
      expect(inviterEmitSpy).not.toHaveBeenCalled();
    });

    describe("Alice invite(), cancel()", () => {
      beforeEach(async () => {
        resetSpies();
        inviter.invite()
          .catch((error) => { return; });
        inviter.cancel();
        await soon();
        await soon(); // need an extra promise resolution for tests to play out
      });

      if (inviteWithoutSdp) {
        it("her ua should send INVITE, CANCEL, ACK", () => {
          const spy = alice.transportSendSpy;
          expect(spy).toHaveBeenCalledTimes(3);
          expect(spy.calls.argsFor(0)).toEqual(SIP_INVITE);
          expect(spy.calls.argsFor(1)).toEqual(SIP_CANCEL);
          expect(spy.calls.argsFor(2)).toEqual(SIP_ACK);
        });

        it("her ua should receive 100, 180, 200, 487", () => {
          const spy = alice.transportReceiveSpy;
          expect(spy).toHaveBeenCalledTimes(4);
          expect(spy.calls.argsFor(0)).toEqual(SIP_100);
          expect(spy.calls.argsFor(1)).toEqual(SIP_180);
          expect(spy.calls.argsFor(2)).toEqual(SIP_200);
          expect(spy.calls.argsFor(3)).toEqual(SIP_487);
        });
      } else {
        it("her ua should send nothing", () => {
          expect(alice.transportSendSpy).not.toHaveBeenCalled();
        });
      }

      if (inviteWithoutSdp) {
        it("her session should transition 'establishing', 'terminating', 'terminated'", () => {
          const spy = inviterStateSpy;
          expect(spy).toHaveBeenCalledTimes(3);
          expect(spy.calls.argsFor(0)).toEqual([SessionState.Establishing]);
          expect(spy.calls.argsFor(1)).toEqual([SessionState.Terminating]);
          expect(spy.calls.argsFor(2)).toEqual([SessionState.Terminated]);
        });
      } else {
        it("her session should transition 'terminating', 'terminated'", () => {
          const spy = inviterStateSpy;
          expect(spy).toHaveBeenCalledTimes(2);
          expect(spy.calls.argsFor(0)).toEqual([SessionState.Terminating]);
          expect(spy.calls.argsFor(1)).toEqual([SessionState.Terminated]);
        });
      }
    });

    describe("Alice invite(), no response - transaction timeout", () => {
      beforeEach(async () => {
        resetSpies();
        bob.transportReceiveSpy.and.returnValue(Promise.resolve()); // drop messages
        inviter.invite();
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
          const spy = inviterEmitSpy;
          expect(spy).toHaveBeenCalledTimes(3);
          expect(spy.calls.argsFor(0)).toEqual(EVENT_REJECTED);
          expect(spy.calls.argsFor(1)).toEqual(EVENT_FAILED);
          expect(spy.calls.argsFor(2)).toEqual(EVENT_TERMINATED);
        });
      } else {
        it("her context should emit 'sdh', 'rejected', 'failed', 'terminated'", () => {
          const spy = inviterEmitSpy;
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
        inviter.invite();
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

      it("her state should transition 'establishing'", () => {
        const spy = inviterStateSpy;
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy.calls.argsFor(0)).toEqual([SessionState.Establishing]);
      });

      if (inviteWithoutSdp) {
        it("her context should emit, 'progress', 'progress'", () => {
          const spy = inviterEmitSpy;
          expect(spy).toHaveBeenCalledTimes(2);
          expect(spy.calls.argsFor(0)).toEqual(EVENT_PROGRESS_ICC);
          expect(spy.calls.argsFor(1)).toEqual(EVENT_PROGRESS_ICC);
        });
      } else {
        it("her context should emit 'sdh', 'progress', 'progress'", () => {
          const spy = inviterEmitSpy;
          expect(spy).toHaveBeenCalledTimes(3);
          expect(spy.calls.argsFor(0)).toEqual(EVENT_SDH);
          expect(spy.calls.argsFor(1)).toEqual(EVENT_PROGRESS_ICC);
          expect(spy.calls.argsFor(2)).toEqual(EVENT_PROGRESS_ICC);
        });
      }

      it("his context should emit nothing", () => {
        const spy = invitationEmitSpy;
        expect(spy).toHaveBeenCalledTimes(0);
      });

      describe("Alice cancel()", () => {
        beforeEach(async () => {
          resetSpies();
          inviter.cancel();
          await inviterEmitSpy.wait("terminated");
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

        it("her session should transition 'terminating', 'terminated'", () => {
          const spy = inviterStateSpy;
          expect(spy).toHaveBeenCalledTimes(2);
          expect(spy.calls.argsFor(0)).toEqual([SessionState.Terminating]);
          expect(spy.calls.argsFor(1)).toEqual([SessionState.Terminated]);
        });

        it("his session should transition 'terminated'", () => {
          const spy = invitationStateSpy;
          expect(spy).toHaveBeenCalledTimes(1);
          expect(spy.calls.argsFor(0)).toEqual([SessionState.Terminated]);
        });
      });

      describe("Alice cancel(), Bob accept() - an async race condition (CANCEL wins)", () => {
        beforeEach(async () => {
          resetSpies();
          spyOn(invitation.logger, "error").and.callThrough();
          inviter.cancel();
          invitation.accept();
          await inviterEmitSpy.wait("terminated");
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

        it("her session should transition 'terminating', 'terminated'", () => {
          const spy = inviterStateSpy;
          expect(spy).toHaveBeenCalledTimes(2);
          expect(spy.calls.argsFor(0)).toEqual([SessionState.Terminating]);
          expect(spy.calls.argsFor(1)).toEqual([SessionState.Terminated]);
        });

        it("his session should transition 'establishing', 'terminated'", () => {
          const spy = invitationStateSpy;
          expect(spy).toHaveBeenCalledTimes(2);
          expect(spy.calls.argsFor(0)).toEqual([SessionState.Establishing]);
          expect(spy.calls.argsFor(1)).toEqual([SessionState.Terminated]);
        });

        it("his context should log an error regarding Bob accept() failure", async () => {
          await soon();
          expect(invitation.logger.error).toHaveBeenCalled();
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
          invitation.accept();
          if (inviteWithoutSdp) {
            return Promise.resolve().then(() =>
              Promise.resolve().then(() =>
                Promise.resolve().then(() =>
                  Promise.resolve().then(() => inviter.cancel()))));
          } else {
            return Promise.resolve().then(() =>
              Promise.resolve().then(() =>
                Promise.resolve().then(() =>
                  Promise.resolve().then(() =>
                    Promise.resolve().then(() =>
                      Promise.resolve().then(() => inviter.cancel()))))));
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

        it("her session should transition 'terminating', 'terminated'", () => {
          const spy = inviterStateSpy;
          expect(spy).toHaveBeenCalledTimes(2);
          expect(spy.calls.argsFor(0)).toEqual([SessionState.Terminating]);
          expect(spy.calls.argsFor(1)).toEqual([SessionState.Terminated]);
        });

        it("his session should transition 'establishing', 'established', 'terminated'", () => {
          const spy = invitationStateSpy;
          expect(spy).toHaveBeenCalledTimes(3);
          expect(spy.calls.argsFor(0)).toEqual([SessionState.Establishing]);
          expect(spy.calls.argsFor(1)).toEqual([SessionState.Established]);
          expect(spy.calls.argsFor(2)).toEqual([SessionState.Terminated]);
        });
      });

      describe("Bob accept(), Bob never receives ACK - a network failure condition", () => {
        beforeEach(async () => {
          resetSpies();
          alice.transportReceiveSpy.and.returnValue(Promise.resolve()); // drop messages
          return invitation.accept()
            .then(() => soon(Timers.TIMER_L));
        });

        it("his ua should send 200, BYE", async () => {
          const spy = bob.transportSendSpy;
          expect(spy).toHaveBeenCalledTimes(12); // 10 retransmissions of the 200
          expect(spy.calls.argsFor(0)).toEqual(SIP_200);
          expect(spy.calls.argsFor(11)).toEqual(SIP_BYE);
        });

        it("his session should transition 'establishing', 'established', 'terminated'", () => {
          const spy = invitationStateSpy;
          expect(spy).toHaveBeenCalledTimes(3);
          expect(spy.calls.argsFor(0)).toEqual([SessionState.Establishing]);
          expect(spy.calls.argsFor(1)).toEqual([SessionState.Established]);
          expect(spy.calls.argsFor(2)).toEqual([SessionState.Terminated]);
        });
      });

      describe("Bob nothing - no answer timeout", () => {
        beforeEach(async () => {
          resetSpies();
          const noAnswerTimeout = 90000;
          if (alice.userAgent.configuration.noAnswerTimeout * 1000 !== noAnswerTimeout) {
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
          const spy = inviterEmitSpy;
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
    inviterEmitSpy.calls.reset();
    if (invitationEmitSpy) { invitationEmitSpy.calls.reset(); }
    inviterStateSpy.calls.reset();
    if (invitationStateSpy) { invitationStateSpy.calls.reset(); }
  }

  beforeEach(() => {
    jasmine.clock().install();
    alice = makeUserFake("alice", "example.com", "Alice");
    bob = makeUserFake("bob", "example.com", "Bob");
    connectUserFake(alice, bob);
    return alice.userAgent.start().then(() => bob.userAgent.start());
  });

  afterEach(async () => {
    return alice.userAgent.stop()
      .then(() => expect(alice.isShutdown()).toBe(true))
      .then(() => bob.userAgent.stop())
      .then(() => expect(bob.isShutdown()).toBe(true))
      .then(() => jasmine.clock().uninstall());
  });

  describe("Alice constructs a new INVITE targeting Bob with SDP offer", () => {
    beforeEach(async () => {
      target = bob.uri;
      bob.userAgent.delegate = {
        onInvite: (session) => {
          invitation = session;
          invitationEmitSpy = makeEventEmitterEmitSpy(invitation, bob.userAgent.getLogger("Bob"));
          invitationStateSpy = makeEmitterSpy(invitation.stateChange, bob.userAgent.getLogger("Bob"));
        }
      };
      inviter = new Inviter(alice.userAgent, target);
      inviterEmitSpy = makeEventEmitterEmitSpy(inviter, alice.userAgent.getLogger("Alice"));
      inviterStateSpy = makeEmitterSpy(inviter.stateChange, alice.userAgent.getLogger("Alice"));
      await soon();
    });

    inviteSuite(false);
  });

  describe("Alice constructs a new INVITE targeting Bob without SDP offer", () => {
    beforeEach(async () => {
      target = bob.uri;
      bob.userAgent.delegate = {
        onInvite: (session) => {
          invitation = session;
          invitationEmitSpy = makeEventEmitterEmitSpy(invitation, bob.userAgent.getLogger("Bob"));
          invitationStateSpy = makeEmitterSpy(invitation.stateChange, bob.userAgent.getLogger("Bob"));
        }
      };
      inviter = new Inviter(alice.userAgent, target, { inviteWithoutSdp: true });
      inviterEmitSpy = makeEventEmitterEmitSpy(inviter, alice.userAgent.getLogger("Alice"));
      inviterStateSpy = makeEmitterSpy(inviter.stateChange, alice.userAgent.getLogger("Alice"));
      await soon();
    });

    inviteSuite(true);
  });

  describe("Early Media Disabled...", () => {
    beforeEach(async () => {
      target = bob.uri;
      bob.userAgent.delegate = {
        onInvite: (session) => {
          invitation = session;
          invitationEmitSpy = makeEventEmitterEmitSpy(invitation, bob.userAgent.getLogger("Bob"));
          invitationStateSpy = makeEmitterSpy(invitation.stateChange, bob.userAgent.getLogger("Bob"));
        }
      };
      inviter = new Inviter(alice.userAgent, target, { earlyMedia: false });
      inviterEmitSpy = makeEventEmitterEmitSpy(inviter, alice.userAgent.getLogger("Alice"));
      inviterStateSpy = makeEmitterSpy(inviter.stateChange, alice.userAgent.getLogger("Alice"));
      await soon();
    });

    describe("Alice invite()", () => {
      beforeEach(() => {
        resetSpies();
        return inviter.invite()
          .then(() => bob.transport.waitSent());
      });

      it("her inviter sdh should have called get description once", () => {
        const sdh = inviter.sessionDescriptionHandler;
        if (!sdh) {
          fail("Inviter SDH undefined.");
          return;
        }
        expect(sdh.getDescription).toHaveBeenCalledTimes(1);
        expect(sdh.setDescription).toHaveBeenCalledTimes(0);
      });

      describe("Bob progress(183)", () => {
        beforeEach(() => {
          resetSpies();
          return invitation.progress({ statusCode: 183 });
        });

        it("her inviter sdh should have called get description once", () => {
          const sdh = inviter.sessionDescriptionHandler;
          if (!sdh) {
            fail("Inviter SDH undefined.");
            return;
          }
          expect(sdh.getDescription).toHaveBeenCalledTimes(1);
          expect(sdh.setDescription).toHaveBeenCalledTimes(0);
        });

        describe("Bob accept()", () => {
          beforeEach(() => {
            resetSpies();
            return invitation.accept();
          });

          it("her inviter sdh should have called get & set description once", () => {
            const sdh = inviter.sessionDescriptionHandler;
            if (!sdh) {
              fail("Inviter SDH undefined.");
              return;
            }
            expect(sdh.getDescription).toHaveBeenCalledTimes(1);
            expect(sdh.setDescription).toHaveBeenCalledTimes(1);
          });
        });

        describe("Bob progress(183)", () => {
          beforeEach(() => {
            resetSpies();
            return invitation.progress({ statusCode: 183 });
          });

          it("her inviter sdh should have called get description once", () => {
            const sdh = inviter.sessionDescriptionHandler;
            if (!sdh) {
              fail("Inviter SDH undefined.");
              return;
            }
            expect(sdh.getDescription).toHaveBeenCalledTimes(1);
            expect(sdh.setDescription).toHaveBeenCalledTimes(0);
          });

          describe("Bob accept()", () => {
            beforeEach(() => {
              resetSpies();
              return invitation.accept();
            });

            it("her inviter sdh should have called get & set description once", () => {
              const sdh = inviter.sessionDescriptionHandler;
              if (!sdh) {
                fail("Inviter SDH undefined.");
                return;
              }
              expect(sdh.getDescription).toHaveBeenCalledTimes(1);
              expect(sdh.setDescription).toHaveBeenCalledTimes(1);
            });
          });
        });
      });
    });
  });

  describe("Early Media Enabled...", () => {
    beforeEach(async () => {
      target = bob.uri;
      bob.userAgent.delegate = {
        onInvite: (session) => {
          invitation = session;
          invitationEmitSpy = makeEventEmitterEmitSpy(invitation, bob.userAgent.getLogger("Bob"));
          invitationStateSpy = makeEmitterSpy(invitation.stateChange, bob.userAgent.getLogger("Bob"));
        }
      };
      inviter = new Inviter(alice.userAgent, target, { earlyMedia: true });
      inviterEmitSpy = makeEventEmitterEmitSpy(inviter, alice.userAgent.getLogger("Alice"));
      inviterStateSpy = makeEmitterSpy(inviter.stateChange, alice.userAgent.getLogger("Alice"));
      await soon();
    });

    describe("Alice invite()", () => {
      beforeEach(() => {
        resetSpies();
        return inviter.invite()
          .then(() => bob.transport.waitSent());
      });

      it("her inviter sdh should have called get description once", () => {
        const sdh = inviter.sessionDescriptionHandler;
        if (!sdh) {
          fail("Inviter SDH undefined.");
          return;
        }
        expect(sdh.getDescription).toHaveBeenCalledTimes(1);
        expect(sdh.setDescription).toHaveBeenCalledTimes(0);
      });

      describe("Bob progress(183)", () => {
        beforeEach(() => {
          resetSpies();
          return invitation.progress({ statusCode: 183 });
        });

        it("her inviter sdh should have called get & set description once", () => {
          const sdh = inviter.sessionDescriptionHandler;
          if (!sdh) {
            fail("Inviter SDH undefined.");
            return;
          }
          expect(sdh.getDescription).toHaveBeenCalledTimes(1);
          expect(sdh.setDescription).toHaveBeenCalledTimes(1);
        });

        describe("Bob accept()", () => {
          beforeEach(() => {
            resetSpies();
            return invitation.accept();
          });

          it("her inviter sdh should have called get & set description once", () => {
            const sdh = inviter.sessionDescriptionHandler;
            if (!sdh) {
              fail("Inviter SDH undefined.");
              return;
            }
            expect(sdh.getDescription).toHaveBeenCalledTimes(1);
            expect(sdh.setDescription).toHaveBeenCalledTimes(1);
          });
        });

        describe("Bob progress(183)", () => {
          beforeEach(() => {
            resetSpies();
            return invitation.progress({ statusCode: 183 });
          });

          it("her inviter sdh should have called get & set description once", () => {
            const sdh = inviter.sessionDescriptionHandler;
            if (!sdh) {
              fail("Inviter SDH undefined.");
              return;
            }
            expect(sdh.getDescription).toHaveBeenCalledTimes(1);
            expect(sdh.setDescription).toHaveBeenCalledTimes(1);
          });

          describe("Bob accept()", () => {
            beforeEach(() => {
              resetSpies();
              return invitation.accept();
            });

            it("her inviter sdh should have called get & set description once", () => {
              const sdh = inviter.sessionDescriptionHandler;
              if (!sdh) {
                fail("Inviter SDH undefined.");
                return;
              }
              expect(sdh.getDescription).toHaveBeenCalledTimes(1);
              expect(sdh.setDescription).toHaveBeenCalledTimes(1);
            });
          });
        });
      });
    });
  });

  describe("Forking...", () => {
    let bob2: UserFake;
    let invitation2: Invitation;
    let invitationEmitSpy2: EventEmitterEmitSpy;
    let invitationStateSpy2: EmitterSpy<SessionState>;

    function bobsAccept(answerInAck: boolean, answerInOk: boolean, offerInOk: boolean) {
      const SIP_ACK_OR_BYE = [jasmine.stringMatching(/^ACK|^BYE/)];
      const EVENT_ACCEPTED_OR_BYE = jasmine.stringMatching(/accepted|bye/);

      beforeEach(async () => {
        resetSpies2();
        invitation.accept();
        invitation2.accept();
        await inviterStateSpy.wait(SessionState.Established);
      });

      it("her ua should send ACK, BYE, ACK", () => {
        const spy = alice.transportSendSpy;
        expect(spy).toHaveBeenCalledTimes(3);
        expect(spy.calls.argsFor(0)).toEqual(SIP_ACK_OR_BYE);
        expect(spy.calls.argsFor(1)).toEqual(SIP_ACK_OR_BYE);
        expect(spy.calls.argsFor(2)).toEqual(SIP_ACK_OR_BYE);
      });

      if (answerInAck) {
        it("her context should emit 'sdh', 'bye'", () => {
          const spy = inviterEmitSpy;
          expect(spy).toHaveBeenCalledTimes(2);
          expect(spy.calls.argsFor(0)).toEqual(EVENT_SDH);
          expect(spy.calls.argsFor(1)).toEqual(EVENT_BYE);
        });
      } else {
        it("her context should emit 'bye'", () => {
          const spy = inviterEmitSpy;
          expect(spy).toHaveBeenCalledTimes(1);
          expect(spy.calls.argsFor(0)).toEqual(EVENT_BYE);
        });
      }

      it("her session should be 'confirmed' and 'stable'", () => {
        const session = inviter.dialog;
        expect(session && session.sessionState).toBe(SessionDialogState.Confirmed);
        expect(session && session.signalingState).toBe(SignalingState.Stable);
      });
    }

    function bobsProgressReliable(answerInProgress: boolean, offerInProgress: boolean): void {
      beforeEach(async () => {
        resetSpies2();
        invitation.progress({ rel100: true });
        invitation2.progress({ rel100: true });
        await inviterEmitSpy.wait("progress");
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
          const spy = inviterEmitSpy;
          expect(spy).toHaveBeenCalledTimes(4);
          expect(spy.calls.argsFor(0)).toEqual(EVENT_SDH);
          expect(spy.calls.argsFor(1)).toEqual(EVENT_SDH);
          expect(spy.calls.argsFor(2)).toEqual(EVENT_PROGRESS_ICC);
          expect(spy.calls.argsFor(3)).toEqual(EVENT_PROGRESS_ICC);
        });
      } else {
        it("her context should emit 'progress', 'progress'", () => {
          const spy = inviterEmitSpy;
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
          inviter.invite();
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
            const spy = inviterEmitSpy;
            expect(spy).toHaveBeenCalledTimes(4);
            expect(spy.calls.argsFor(0)).toEqual(EVENT_PROGRESS_ICC);
            expect(spy.calls.argsFor(1)).toEqual(EVENT_PROGRESS_ICC);
            expect(spy.calls.argsFor(2)).toEqual(EVENT_PROGRESS_ICC);
            expect(spy.calls.argsFor(3)).toEqual(EVENT_PROGRESS_ICC);
          });
        } else {
          it("her context should emit 'sdh', 'progress', 'progress', 'progress', 'progress'", () => {
            const spy = inviterEmitSpy;
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
      if (invitationEmitSpy2) { invitationEmitSpy2.calls.reset(); }
      if (invitationStateSpy2) { invitationStateSpy2.calls.reset(); }
    }

    beforeEach(async () => {
      bob2 = makeUserFake("bob", "example.com", "Bob2");
      connectUserFake(alice, bob2);
    });

    afterEach(async () => {
      return bob2.userAgent.stop()
        .then(() => expect(bob2.isShutdown()).toBe(true));
    });

    describe("Alice constructs a new INVITE client context targeting Bob with SDP offer", () => {
      beforeEach(async () => {
        target = bob.uri;
        bob.userAgent.delegate = {
          onInvite: (session) => {
            invitation = session;
            invitationEmitSpy = makeEventEmitterEmitSpy(invitation, bob.userAgent.getLogger("Bob"));
            invitationStateSpy = makeEmitterSpy(invitation.stateChange, bob.userAgent.getLogger("Bob"));
          }
        };
        bob2.userAgent.delegate = {
          onInvite: (session) => {
            invitation2 = session;
            invitationEmitSpy2 = makeEventEmitterEmitSpy(invitation2, bob2.userAgent.getLogger("Bob2"));
            invitationStateSpy2 = makeEmitterSpy(invitation.stateChange, bob.userAgent.getLogger("Bob2"));
          }
        };
        inviter = new Inviter(alice.userAgent, target);
        inviterEmitSpy = makeEventEmitterEmitSpy(inviter, alice.userAgent.getLogger("Alice"));
        inviterStateSpy = makeEmitterSpy(inviter.stateChange, alice.userAgent.getLogger("Alice"));
        await soon();
      });

      inviteSuiteFork(false);
    });

    describe("Alice constructs a new INVITE client context targeting Bob without SDP offer", () => {
      beforeEach(async () => {
        target = bob.uri;
        bob.userAgent.delegate = {
          onInvite: (session) => {
            invitation = session;
            invitationEmitSpy = makeEventEmitterEmitSpy(invitation, bob.userAgent.getLogger("Bob"));
            invitationStateSpy = makeEmitterSpy(invitation.stateChange, bob.userAgent.getLogger("Bob"));
          }
        };
        bob2.userAgent.delegate = {
          onInvite: (session) => {
            invitation2 = session;
            invitationEmitSpy2 = makeEventEmitterEmitSpy(invitation2, bob2.userAgent.getLogger("Bob2"));
            invitationStateSpy2 = makeEmitterSpy(invitation.stateChange, bob.userAgent.getLogger("Bob2"));
          }
        };
        inviter = new Inviter(alice.userAgent, target, { inviteWithoutSdp: true });
        inviterEmitSpy = makeEventEmitterEmitSpy(inviter, alice.userAgent.getLogger("Alice"));
        inviterStateSpy = makeEmitterSpy(inviter.stateChange, alice.userAgent.getLogger("Alice"));
        await soon();
      });

      inviteSuiteFork(true);
    });
  });

  function reinviteAccepted(withoutSdp: boolean): void {
    beforeEach(async () => {
      resetSpies();
      invitation.delegate = undefined;
      return inviter.invite({ withoutSdp })
        .then(() => alice.transport.waitSent()); // ACK
    });

    it("her ua should send INVITE, ACK", () => {
      const spy = alice.transportSendSpy;
      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy.calls.argsFor(0)).toEqual(SIP_INVITE);
      expect(spy.calls.argsFor(1)).toEqual(SIP_ACK);
    });

    it("her ua should receive 200", () => {
      const spy = alice.transportReceiveSpy;
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.calls.argsFor(0)).toEqual(SIP_200);
    });

    it("her signaling should be stable", () => {
      if (!inviter.dialog) {
        fail("Session dialog undefined");
        return;
      }
      expect(inviter.dialog.signalingState).toEqual(SignalingState.Stable);
    });

    it("his signaling should be stable", () => {
      if (!invitation.dialog) {
        fail("Session dialog undefined");
        return;
      }
      expect(invitation.dialog.signalingState).toEqual(SignalingState.Stable);
    });
  }

  function reinviteAcceptedWithoutDescriptionFailure(withoutSdp: boolean): void {
    beforeEach(async () => {
      resetSpies();
      invitation.delegate = { onReinviteTest: () => "acceptWithoutDescription" };
      const session: Session = inviter;
      return session.invite({ withoutSdp })
        .then(() => alice.transport.waitSent()); // ACK
    });

    it("her ua should send INVITE, ACK, BYE", () => {
      const spy = alice.transportSendSpy;
      expect(spy).toHaveBeenCalledTimes(3);
      expect(spy.calls.argsFor(0)).toEqual(SIP_INVITE);
      expect(spy.calls.argsFor(1)).toEqual(SIP_ACK);
      expect(spy.calls.argsFor(2)).toEqual(SIP_BYE);
    });

    it("her ua should receive 200", () => {
      const spy = alice.transportReceiveSpy;
      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy.calls.argsFor(0)).toEqual(SIP_200);
      expect(spy.calls.argsFor(0)).toEqual(SIP_200);
    });

    it("her signaling should be closed", () => {
      if (!inviter.dialog) {
        fail("Session dialog undefined");
        return;
      }
      expect(inviter.dialog.signalingState).toEqual(SignalingState.Closed);
    });

    it("his signaling should be closed", () => {
      if (!invitation.dialog) {
        fail("Session dialog undefined");
        return;
      }
      expect(invitation.dialog.signalingState).toEqual(SignalingState.Closed);
    });

    it("her state should transition 'terminated'", () => {
      const spy = inviterStateSpy;
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.calls.argsFor(0)[0]).toEqual(SessionState.Terminated);
    });

    it("his state should transition 'terminated'", () => {
      const spy = invitationStateSpy;
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.calls.argsFor(0)[0]).toEqual(SessionState.Terminated);
    });

    it("her session should be failed", () => {
      expect(inviter.isFailed).toBe(true);
    });
  }

  function reinviteAcceptedOfferAnswerFailure(withoutSdp: boolean): void {
    beforeEach(async () => {
      resetSpies();
      invitation.delegate = undefined;
      const session: Session = inviter;
      return session.invite({ withoutSdp })
        .then(() => {
          const sessionDescriptionHandler = session.sessionDescriptionHandler;
          if (!sessionDescriptionHandler) {
            throw new Error("Session description handler undefined");
          }
          const sdh = sessionDescriptionHandler as jasmine.SpyObj<Required<SessionDescriptionHandler>>; // assumes a spy
          sdh.getDescription.and.callFake(() => Promise.reject(new Error("Failed to get description.")));
          sdh.setDescription.and.callFake(() => Promise.reject(new Error("Failed to set description.")));
        })
        .then(() => alice.transport.waitSent()); // ACK
    });

    it("her ua should send INVITE, ACK, BYE", () => {
      const spy = alice.transportSendSpy;
      expect(spy).toHaveBeenCalledTimes(3);
      expect(spy.calls.argsFor(0)).toEqual(SIP_INVITE);
      expect(spy.calls.argsFor(1)).toEqual(SIP_ACK);
      expect(spy.calls.argsFor(2)).toEqual(SIP_BYE);
    });

    it("her ua should receive 200", () => {
      const spy = alice.transportReceiveSpy;
      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy.calls.argsFor(0)).toEqual(SIP_200);
      expect(spy.calls.argsFor(0)).toEqual(SIP_200);
    });

    it("her signaling should be closed", () => {
      if (!inviter.dialog) {
        fail("Session dialog undefined");
        return;
      }
      expect(inviter.dialog.signalingState).toEqual(SignalingState.Closed);
    });

    it("his signaling should be closed", () => {
      if (!invitation.dialog) {
        fail("Session dialog undefined");
        return;
      }
      expect(invitation.dialog.signalingState).toEqual(SignalingState.Closed);
    });

    it("her state should transition 'terminated'", () => {
      const spy = inviterStateSpy;
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.calls.argsFor(0)[0]).toEqual(SessionState.Terminated);
    });

    it("his state should transition 'terminated'", () => {
      const spy = invitationStateSpy;
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.calls.argsFor(0)[0]).toEqual(SessionState.Terminated);
    });

    it("her session should be failed", () => {
      expect(inviter.isFailed).toBe(true);
    });
  }

  function reinviteRejected(withoutSdp: boolean): void {
    beforeEach(async () => {
      resetSpies();
      invitation.delegate = { onReinviteTest: () => "reject488" };
      const session: Session = inviter;
      return session.invite({ withoutSdp })
        .then(() => alice.transport.waitSent()); // ACK
    });

    it("her ua should send INVITE, ACK", () => {
      const spy = alice.transportSendSpy;
      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy.calls.argsFor(0)).toEqual(SIP_INVITE);
      expect(spy.calls.argsFor(1)).toEqual(SIP_ACK);
    });

    it("her ua should receive 488", () => {
      const spy = alice.transportReceiveSpy;
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.calls.argsFor(0)).toEqual(SIP_488);
    });

    it("her signaling should be stable", () => {
      if (!inviter.dialog) {
        fail("Session dialog undefined");
        return;
      }
      expect(inviter.dialog.signalingState).toEqual(SignalingState.Stable);
    });

    it("his signaling should be stable", () => {
      if (!invitation.dialog) {
        fail("Session dialog undefined");
        return;
      }
      expect(invitation.dialog.signalingState).toEqual(SignalingState.Stable);
    });
  }

  function reinviteRejectedRollbackFailure(withoutSdp: boolean): void {
    beforeEach(async () => {
      resetSpies();
      invitation.delegate = { onReinviteTest: () => "reject488" };
      const session: Session = inviter;
      return session.invite({ withoutSdp: false }) // Note that rollback on reject this only happens INVITE with SDP
        .then(() => {
          const sessionDescriptionHandler = session.sessionDescriptionHandler;
          if (!sessionDescriptionHandler) {
            throw new Error("Session description handler undefined");
          }
          const sdh = sessionDescriptionHandler as jasmine.SpyObj<Required<SessionDescriptionHandler>>; // assumes a spy
          sdh.rollbackDescription.and.callFake(() => Promise.reject(new Error("Failed to rollback description.")));
        })
        .then(() => alice.transport.waitSent());  // ACK
    });

    it("her ua should send INVITE, ACK, BYE", () => {
      const spy = alice.transportSendSpy;
      expect(spy).toHaveBeenCalledTimes(3);
      expect(spy.calls.argsFor(0)).toEqual(SIP_INVITE);
      expect(spy.calls.argsFor(1)).toEqual(SIP_ACK);
      expect(spy.calls.argsFor(2)).toEqual(SIP_BYE);
    });

    it("her ua should receive 488", () => {
      const spy = alice.transportReceiveSpy;
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.calls.argsFor(0)).toEqual(SIP_488);
    });

    it("her signaling should be closed", () => {
      if (!inviter.dialog) {
        fail("Session dialog undefined");
        return;
      }
      expect(inviter.dialog.signalingState).toEqual(SignalingState.Closed);
    });

    it("his signaling should be closed", () => {
      if (!invitation.dialog) {
        fail("Session dialog undefined");
        return;
      }
      expect(invitation.dialog.signalingState).toEqual(SignalingState.Closed);
    });

    it("her state should transition 'terminated'", () => {
      const spy = inviterStateSpy;
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.calls.argsFor(0)[0]).toEqual(SessionState.Terminated);
    });

    it("his state should transition 'terminated'", () => {
      const spy = invitationStateSpy;
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.calls.argsFor(0)[0]).toEqual(SessionState.Terminated);
    });

    it("her session should be failed", () => {
      expect(inviter.isFailed).toBe(true);
    });
  }

  function reinviteSuite(withoutSdp: boolean): void {
    describe("Alice invite()", () => {
      beforeEach(() => {
        resetSpies();
        return inviter.invite()
          .then(() => bob.transport.waitSent());
      });

      describe("Bob accept()", () => {
        beforeEach(() => {
          resetSpies();
          invitation.delegate = undefined;
          return invitation.accept()
            .then(() => alice.transport.waitSent()); // ACK
        });

        it("her state should be `established`", () => {
          expect(inviter.state).toBe(SessionState.Established);
        });

        it("his state should be `established`", () => {
          expect(invitation.state).toBe(SessionState.Established);
        });

        describe("Alice invite() accepted", () => {
          reinviteAccepted(withoutSdp);

          describe("Alice invite() accepted", () => {
            reinviteAccepted(withoutSdp);
          });
        });

        describe("Alice invite() accepted without description failure", () => {
          reinviteAcceptedWithoutDescriptionFailure(withoutSdp);
        });

        describe("Alice invite() accepted offer/answer failure", () => {
          reinviteAcceptedOfferAnswerFailure(withoutSdp);
        });

        describe("Alice invite() rejected", () => {
          reinviteRejected(withoutSdp);

          describe("Alice invite() accepted", () => {
            reinviteAccepted(withoutSdp);
          });
        });

        describe("Alice invite() rejected rollback failure", () => {
          reinviteRejectedRollbackFailure(withoutSdp);
        });
      });
    });
  }

  describe("In Dialog...", () => {
    beforeEach(async () => {
      target = bob.uri;
      bob.userAgent.delegate = {
        onInvite: (session) => {
          invitation = session;
          invitationEmitSpy = makeEventEmitterEmitSpy(invitation, bob.userAgent.getLogger("Bob"));
          invitationStateSpy = makeEmitterSpy(invitation.stateChange, bob.userAgent.getLogger("Bob"));
        }
      };
      inviter = new Inviter(alice.userAgent, target);
      inviterEmitSpy = makeEventEmitterEmitSpy(inviter, alice.userAgent.getLogger("Alice"));
      inviterStateSpy = makeEmitterSpy(inviter.stateChange, alice.userAgent.getLogger("Alice"));
      await soon();
    });

    describe("Re-INVITE with SDP failure...", () => {
      describe("Alice invite()", () => {
        beforeEach(() => {
          resetSpies();
          return inviter.invite()
            .then(() => bob.transport.waitSent());
        });

        describe("Bob accept()", () => {
          beforeEach(() => {
            resetSpies();
            invitation.delegate = undefined;
            return invitation.accept()
              .then(() => alice.transport.waitSent()); // ACK
          });

          it("her state should be `established`", () => {
            expect(inviter.state).toBe(SessionState.Established);
          });

          it("his state should be `established`", () => {
            expect(invitation.state).toBe(SessionState.Established);
          });

          describe("Alice invite() failure", () => {
            beforeEach(async () => {
              resetSpies();
              const session: Session = inviter;
              const sessionDescriptionHandler = session.sessionDescriptionHandler;
              if (!sessionDescriptionHandler) {
                throw new Error("Session description handler undefined");
              }
              const sdh = sessionDescriptionHandler as jasmine.SpyObj<Required<SessionDescriptionHandler>>;
              sdh.getDescription.and.callFake(() => Promise.reject(new Error("Failed to get description.")));
              return session.invite()
                .catch((error) => {
                  return;
                });
            });

            it("her ua should send nothing", () => {
              const spy = alice.transportSendSpy;
              expect(spy).toHaveBeenCalledTimes(0);
            });

            it("her signaling should be stable", () => {
              if (!inviter.dialog) {
                fail("Session dialog undefined");
                return;
              }
              expect(inviter.dialog.signalingState).toEqual(SignalingState.Stable);
            });

            it("his signaling should be stable", () => {
              if (!invitation.dialog) {
                fail("Session dialog undefined");
                return;
              }
              expect(invitation.dialog.signalingState).toEqual(SignalingState.Stable);
            });
          });
        });
      });
    });

    describe("Re-INVITE with SDP...", () => {
      reinviteSuite(false);
    });

    describe("Re-INVITE without SDP...", () => {
      reinviteSuite(true);
    });

    // This group of tests is probably better covered in conjunction with testing REFER w/Replaces
    describe("INVITE with Replaces...", () => {
      describe("Alice invite()", () => {
        beforeEach(() => {
          resetSpies();
          return inviter.invite()
            .then(() => bob.transport.waitSent());
        });

        describe("Bob accept()", () => {
          beforeEach(() => {
            resetSpies();
            invitation.delegate = undefined;
            return invitation.accept()
              .then(() => alice.transport.waitSent()); // ACK
          });

          it("her state should be `established`", () => {
            expect(inviter.state).toBe(SessionState.Established);
          });

          it("his state should be `established`", () => {
            expect(invitation.state).toBe(SessionState.Established);
          });

          describe("Carol invite() with Replaces to Alice...", () => {
            let carol: UserFake;
            let replacesInviter: Inviter;
            let replacesInvitation: Invitation;
            let replacesInvitationEmitSpy: EventEmitterEmitSpy;
            let replacesInvitationStateSpy: EmitterSpy<SessionState>;

            function resetSpies3(): void {
              resetSpies();
              carol.transportReceiveSpy.calls.reset();
              carol.transportSendSpy.calls.reset();
              if (replacesInvitationEmitSpy) { replacesInvitationEmitSpy.calls.reset(); }
              if (replacesInvitationStateSpy) { replacesInvitationStateSpy.calls.reset(); }
            }

            beforeEach(async () => {
              carol = makeUserFake("carol", "example.com", "Carol");
              connectUserFake(alice, carol);
            });

            describe("Replacing unknown session", () => {
              beforeEach(async () => {
                resetSpies3();
                alice.userAgent.delegate = {
                  onInvite: (session) => {
                    replacesInvitation = session;
                    replacesInvitationEmitSpy
                      = makeEventEmitterEmitSpy(replacesInvitation, alice.userAgent.getLogger("Alice"));
                    replacesInvitationStateSpy
                      = makeEmitterSpy(replacesInvitation.stateChange, alice.userAgent.getLogger("Alice"));
                  }
                };
                const callId = "unknown";
                const remoteTag = invitation.request.fromTag;
                const localTag = invitation.request.toTag;
                const replaces = `${callId};to-tag=${remoteTag};from-tag=${localTag}`;
                const options = {
                  extraHeaders: ["Replaces: " + replaces]
                };
                replacesInviter = new Inviter(carol.userAgent, alice.uri, options);
                return replacesInviter.invite()
                  .catch((error) => {
                    return;
                  });
              });

              it("Carol ua should send INVITE, ACK", () => {
                const spy = carol.transportSendSpy;
                expect(spy).toHaveBeenCalledTimes(2);
                expect(spy.calls.argsFor(0)).toEqual(SIP_INVITE);
                expect(spy.calls.argsFor(1)).toEqual(SIP_ACK);
              });

              it("Carol ua should receive 100, 481", () => {
                const spy = carol.transportReceiveSpy;
                expect(spy).toHaveBeenCalledTimes(2);
                expect(spy.calls.argsFor(0)).toEqual(SIP_100);
                expect(spy.calls.argsFor(1)).toEqual(SIP_481);
              });

              it("Carol state should be `terminated`", () => {
                expect(replacesInviter.state).toBe(SessionState.Terminated);
              });
            });

            describe("Replacing Bob's session", () => {
              beforeEach(async () => {
                resetSpies3();
                alice.userAgent.delegate = {
                  onInvite: (session) => {
                    replacesInvitation = session;
                    replacesInvitationEmitSpy =
                      makeEventEmitterEmitSpy(replacesInvitation, alice.userAgent.getLogger("Alice"));
                    replacesInvitationStateSpy =
                      makeEmitterSpy(replacesInvitation.stateChange, alice.userAgent.getLogger("Alice"));
                  }
                };
                const callId = invitation.request.callId;
                const remoteTag = invitation.request.fromTag;
                const localTag = invitation.request.toTag;
                const replaces = `${callId};to-tag=${remoteTag};from-tag=${localTag}`;
                const options = {
                  extraHeaders: ["Replaces: " + replaces]
                };
                replacesInviter = new Inviter(carol.userAgent, alice.uri, options);
                return replacesInviter.invite()
                  .then(() => alice.transport.waitSent()) // provisional response
                  .catch((error) => {
                    return;
                  });
              });

              it("Carol state should be `establishing`", () => {
                expect(replacesInviter.state).toBe(SessionState.Establishing);
              });

              describe("Alice accept()", () => {
                beforeEach(async () => {
                  return replacesInvitation.accept()
                    .then(() => carol.transport.waitSent()); // ACK
                });

                it("Carol ua should send INVITE, ACK", () => {
                  const spy = carol.transportSendSpy;
                  expect(spy).toHaveBeenCalledTimes(3);
                  expect(spy.calls.argsFor(0)).toEqual(SIP_INVITE);
                  expect(spy.calls.argsFor(1)).toEqual(SIP_404); // To the BYE to Bob, we get a copy
                  expect(spy.calls.argsFor(2)).toEqual(SIP_ACK);
                });

                it("Carol ua should receive 100, 180, 200", () => {
                  const spy = carol.transportReceiveSpy;
                  expect(spy).toHaveBeenCalledTimes(4);
                  expect(spy.calls.argsFor(0)).toEqual(SIP_100);
                  expect(spy.calls.argsFor(1)).toEqual(SIP_180);
                  expect(spy.calls.argsFor(2)).toEqual(SIP_200);
                  expect(spy.calls.argsFor(3)).toEqual(SIP_BYE); // This is to Bob, but we get a copy
                });

                it("Carol state should be established and stable", () => {
                  if (!replacesInviter.dialog) {
                    fail("Session dialog undefined");
                    return;
                  }
                  expect(replacesInviter.state).toBe(SessionState.Established);
                  expect(replacesInviter.dialog.signalingState).toEqual(SignalingState.Stable);
                });

                it("Alice state to be established and stable", () => {
                  if (!replacesInvitation.dialog) {
                    fail("Session dialog undefined");
                    return;
                  }
                  expect(replacesInvitation.state).toBe(SessionState.Established);
                  expect(replacesInvitation.dialog.signalingState).toEqual(SignalingState.Stable);
                });

                it("Alice to Bob state should be terminated", () => {
                  expect(inviter.state).toBe(SessionState.Terminated);
                  expect(invitation.state).toBe(SessionState.Terminated);
                });
              });
            });
          });
        });
      });
    });
  });
});
