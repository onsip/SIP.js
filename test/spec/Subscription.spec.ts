import { C } from "../../src/Constants";
import {
  Dialog,
  DialogState,
  IncomingRequestMessage,
  NonInviteClientTransaction,
  ReSubscribeUserAgentServer,
  Timers,
  URI,
  UserAgentClient,
  UserAgentCore
} from "../../src/core";
import { Subscription } from "../../src/Subscription";
import { Utils } from "../../src/Utils";
import { EventEmitterEmitSpy, makeEventEmitterEmitSpy } from "../support/EventEmitterSpy";
import { connectUserFake, makeUserFake, UserFake } from "../support/UserFake";
import { soon } from "../support/Utils";

// tslint:disable-next-line:max-classes-per-file
class NotifierDialog extends Dialog {
  constructor(protected core: UserAgentCore, protected dialogState: DialogState) {
    super(core, dialogState);
  }
}

const SIP_SUBSCRIBE = [jasmine.stringMatching(/^SUBSCRIBE/)];
const SIP_200 = [jasmine.stringMatching(/^SIP\/2.0 200/)];
const SIP_481 = [jasmine.stringMatching(/^SIP\/2.0 481/)];
const SIP_489 = [jasmine.stringMatching(/^SIP\/2.0 489/)];

const acceptedEvent = ["accepted", jasmine.any(Object), jasmine.any(String)];
const failedEvent = ["failed", jasmine.any(Object), jasmine.any(String)];
const rejectedEvent = ["rejected", jasmine.any(Object), jasmine.any(String)];
const terminatedEvent = ["terminated"];
const notifyEvent = ["notify", jasmine.any(Object)];

describe("Subscription Class", () => {
  let alice: UserFake;
  let bob: UserFake;
  let target: URI;
  let subscription: Subscription;
  let subscriptionEmitSpy: EventEmitterEmitSpy;
  const event = "foo";

  function resetSpies(): void {
    alice.transportReceiveSpy.calls.reset();
    alice.transportSendSpy.calls.reset();
    subscriptionEmitSpy.calls.reset();
  }

  beforeEach(() => {
    jasmine.clock().install();
    alice = makeUserFake("alice", "example.com", "Alice");
    bob = makeUserFake("bob", "example.com", "Bob");
    connectUserFake(alice, bob);
    target = bob.uri;
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  describe("Alice constructs a new subscription targeting Bob", () => {

    beforeEach(() => {
      subscription = new Subscription(alice.ua, target, event);
      subscriptionEmitSpy = makeEventEmitterEmitSpy(subscription, alice.ua.getLogger("Alice"));
    });

    it("the subscription should emit nothing", () => {
      const spy = subscriptionEmitSpy;
      expect(spy).not.toHaveBeenCalled();
    });

    describe("Alice calls subscribe() to send a SUBSCRIBE request", () => {
      beforeEach(() => {
        resetSpies();
        subscription.subscribe();
      });

      it("the subscription should emit nothing", () => {
        const spy = subscriptionEmitSpy;
        expect(spy).toHaveBeenCalledTimes(0);
      });

      it("the uac should send a SUBSCRIBE", () => {
        const spy = alice.transportSendSpy;
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy.calls.argsFor(0)).toEqual(SIP_SUBSCRIBE);
      });

      describe("Bob never responds to the request", () => {
        beforeEach(() => {
          resetSpies();
          bob.ua.on("subscribe", (request) => {
            return;
          });
        });

        // Note: There is a potential race condition here between 2 timers which are both 64 * T1
        // - Timer F, non-INVITE transaction timeout, which will trigger a 408 response
        // - Timer N, NOTIFY wait timeout, which will not trigger a response
        // It boils down to an implementation choice to break the race.
        // But it likely doesn't matter outside of testing.

        it("the subscription should emit nothing prior to timeout", async () => {
          await soon(Timers.TIMER_F - 1);
          expect(subscriptionEmitSpy).not.toHaveBeenCalled();
        });

        it("the subscription should emit nothing prior to timeout if subscribe() called twice", async () => {
          subscription.subscribe();
          await soon(Timers.TIMER_F - 1);
          expect(subscriptionEmitSpy).not.toHaveBeenCalled();
        });

        it("*DEPRECATED* the subscription should emit 'terminated' after timeout waiting for NOTIFY", async () => {
          await soon(Timers.TIMER_F + 1);
          const spy = subscriptionEmitSpy;
          if (spy.calls.count() === 1) {
            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy.calls.argsFor(0)).toEqual(terminatedEvent);
          }
        });

        it("the subscription should emit 'terminated', 'failed' and 'rejected' after timeout", async () => {
          await soon(Timers.TIMER_F + 1);
          const spy = subscriptionEmitSpy;
          expect(spy).toHaveBeenCalledTimes(3);
          expect(spy.calls.argsFor(0)).toEqual(terminatedEvent);
          expect(spy.calls.argsFor(1)).toEqual(failedEvent);
          expect(spy.calls.argsFor(2)).toEqual(rejectedEvent);
        });
      });

      describe("Bob demands authentication for the reqeust", () => {
        beforeEach(async () => {
          resetSpies();
          bob.ua.on("subscribe", (request) => {
            // tslint:disable-next-line:max-line-length
            const extraHeaders = [`Proxy-Authenticate: Digest realm="example.com", nonce="5cc8bf5800003e0181297d67d3a2e41aa964192a05e30fc4", qop="auth"`];
            request.reject({ statusCode: 407, extraHeaders });
          });
          await subscriptionEmitSpy.wait();
        });

        it("the subscription should emit 'terminated', 'failed' and 'rejected'", async () => {
          const spy = subscriptionEmitSpy;
          expect(spy).toHaveBeenCalledTimes(3);
          expect(spy.calls.argsFor(0)).toEqual(terminatedEvent);
          expect(spy.calls.argsFor(1)).toEqual(failedEvent);
          expect(spy.calls.argsFor(2)).toEqual(rejectedEvent);
        });

        it("the uac should send an SUBSCRIBE", () => {
          const spy = alice.transportSendSpy;
          expect(spy).toHaveBeenCalledTimes(1);
          expect(spy.calls.argsFor(0)).toEqual(SIP_SUBSCRIBE);
        });
      });

      describe("Bob rejects the request", () => {
        beforeEach(async () => {
          resetSpies();
          bob.ua.on("subscribe", (request) => {
            request.reject();
          });
          await subscriptionEmitSpy.wait();
        });

        it("the subscription should emit 'terminated', 'failed' and 'rejected'", async () => {
          const spy = subscriptionEmitSpy;
          expect(spy).toHaveBeenCalledTimes(3);
          expect(spy.calls.argsFor(0)).toEqual(terminatedEvent);
          expect(spy.calls.argsFor(1)).toEqual(failedEvent);
          expect(spy.calls.argsFor(2)).toEqual(rejectedEvent);
        });

        it("the uac should send nothing", () => {
          const spy = alice.transportSendSpy;
          expect(spy).not.toHaveBeenCalled();
        });
      });

      describe("Bob sends initial NOTIFY before responding to the request", () => {
        let notifierDialog: Dialog;
        let receivedEvent: string;
        let receivedExpires: number;

        beforeEach(async () => {
          resetSpies();
          bob.ua.on("subscribe", (request) => {
            receivedEvent = request.message.parseHeader("Event").event;
            if (!receivedEvent || receivedEvent !== event) {
              request.reject({ statusCode: 489 });
              return;
            }
            if (!request.message.hasHeader("Expires")) {
              request.reject({ statusCode: 489 });
              return;
            }
            receivedExpires = Number(request.message.getHeader("Expires"));
            if (receivedExpires < 0 || isNaN(receivedExpires)) {
              request.reject({ statusCode: 489 });
              return;
            }
            const statusCode = 200;
            const toTag = Utils.newTag();
            const extraHeaders = new Array<string>();
            extraHeaders.push(`Event: ${receivedEvent}`);
            // Don't send a 200...
            // request.accept({ statusCode, toTag, extraHeaders });

            const dialogState = Dialog.initialDialogStateForUserAgentServer(request.message, toTag);
            notifierDialog = new NotifierDialog(bob.ua.userAgentCore, dialogState);

            extraHeaders.push(`Subscription-State: active;expires=${receivedExpires}`);
            extraHeaders.push(`Contact: ${bob.ua.contact.uri.toString()}`);
            const message = notifierDialog.createOutgoingRequestMessage(C.NOTIFY, { extraHeaders });
            const uac = new UserAgentClient(NonInviteClientTransaction, notifierDialog.userAgentCore, message);
          });
          await subscriptionEmitSpy.wait();
        });

        it("the subscription should emit a 'notify' event", () => {
          const spy = subscriptionEmitSpy;
          expect(spy).toHaveBeenCalledTimes(1);
          expect(spy.calls.argsFor(0)).toEqual(notifyEvent);
        });

        it("the uac should send a 200 to the NOTIFY", () => {
          const spy = alice.transportSendSpy;
          expect(spy).toHaveBeenCalledTimes(1);
          expect(spy.calls.argsFor(0)).toEqual(SIP_200);
        });
      });

      describe("Bob accepts the request", () => {
        let notifierDialog: Dialog;
        let receivedEvent: string;
        let receivedExpires: number;

        beforeEach(async () => {
          resetSpies();
          bob.ua.on("subscribe", (request) => {
            receivedEvent = request.message.parseHeader("Event").event;
            if (!receivedEvent || receivedEvent !== event) {
              request.reject({ statusCode: 489 });
              return;
            }
            if (!request.message.hasHeader("Expires")) {
              request.reject({ statusCode: 489 });
              return;
            }
            receivedExpires = Number(request.message.getHeader("Expires"));
            if (receivedExpires < 0 || isNaN(receivedExpires)) {
              request.reject({ statusCode: 489 });
              return;
            }
            const statusCode = 200;
            const toTag = Utils.newTag();
            const extraHeaders = new Array<string>();
            extraHeaders.push(`Event: ${receivedEvent}`);
            extraHeaders.push(`Expires: ${receivedExpires}`);
            extraHeaders.push(`Contact: ${bob.ua.contact.uri.toString()}`);
            request.accept({ statusCode, toTag, extraHeaders });

            const dialogState = Dialog.initialDialogStateForUserAgentServer(request.message, toTag);
            notifierDialog = new NotifierDialog(bob.ua.userAgentCore, dialogState);
            // FIXME: As we don't currently have a real notifiation dialog, hack in what we need for these test
            // TODO: Should just write a proper one
            const receiveRequestOriginal = notifierDialog.receiveRequest;
            notifierDialog.receiveRequest = (message: IncomingRequestMessage): void => {
              receiveRequestOriginal.call(notifierDialog, message);
              if (message.method === C.SUBSCRIBE) {
                const uas = new ReSubscribeUserAgentServer(notifierDialog, message);
                const expires = Number(message.getHeader("Expires"));
                const resubHeaders: Array<string> = [];
                if (expires === 0) {
                  resubHeaders.push("Subscription-State: terminated");
                } else {
                  resubHeaders.push("Expires: " + expires);
                  resubHeaders.push("Subscription-State: active");
                }
                uas.accept({
                  statusCode: 200,
                  extraHeaders: resubHeaders
                });
              }
            };
          });
          await subscriptionEmitSpy.wait();
        });

        it("the subscription should emit an 'accepted' event", async () => {
          const spy = subscriptionEmitSpy;
          expect(spy).toHaveBeenCalledTimes(1);
          expect(spy.calls.argsFor(0)).toEqual(acceptedEvent);
        });

        it("the uac should send nothing", () => {
          const spy = alice.transportSendSpy;
          expect(spy).not.toHaveBeenCalled();
        });

        describe("Bob never sends an initial NOTIFY request", () => {
          beforeEach(async () => {
            resetSpies();
          });

          it("the subscription should emit 'terminated' after timeout waiting for NOTIFY", async () => {
            await soon(Timers.TIMER_N + 1);
            const spy = subscriptionEmitSpy;
            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy.calls.argsFor(0)).toEqual(terminatedEvent);
          });

          it("the uac should send nothing", () => {
            const spy = alice.transportSendSpy;
            expect(spy).not.toHaveBeenCalled();
          });
        });

        describe("Bob sends an initial NOTIFY with incorrect Event header", () => {
          beforeEach(async () => {
            resetSpies();
            const extraHeaders = new Array<string>();
            extraHeaders.push(`Event: not${receivedEvent}`);
            extraHeaders.push(`Subscription-State: terminated`);
            extraHeaders.push(`Contact: ${bob.ua.contact.uri.toString()}`);
            const message = notifierDialog.createOutgoingRequestMessage(C.NOTIFY, { extraHeaders });
            const uac = new UserAgentClient(NonInviteClientTransaction, notifierDialog.userAgentCore, message);
            await alice.transport.waitReceived();
          });

          it("the subscription should emit 'terminated' after timeout waiting for NOTIFY", async () => {
            await soon(Timers.TIMER_N + 1);
            const spy = subscriptionEmitSpy;
            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy.calls.argsFor(0)).toEqual(terminatedEvent);
          });

          it("the uac should send a 481 to the NOTIFY", () => {
            const spy = alice.transportSendSpy;
            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy.calls.argsFor(0)).toEqual(SIP_481);
          });
        });

        describe("Bob sends an initial NOTIFY with missing Event header", () => {
          beforeEach(async () => {
            resetSpies();
            const extraHeaders = new Array<string>();
            extraHeaders.push(`Subscription-State: terminated`);
            extraHeaders.push(`Contact: ${bob.ua.contact.uri.toString()}`);
            const message = notifierDialog.createOutgoingRequestMessage(C.NOTIFY, { extraHeaders });
            const uac = new UserAgentClient(NonInviteClientTransaction, notifierDialog.userAgentCore, message);
            await alice.transport.waitReceived();
          });

          it("the subscription should emit 'terminated' after timeout waiting for NOTIFY", async () => {
            await soon(Timers.TIMER_N + 1);
            const spy = subscriptionEmitSpy;
            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy.calls.argsFor(0)).toEqual(terminatedEvent);
          });

          it("the uac should send a 489 to the NOTIFY", () => {
            const spy = alice.transportSendSpy;
            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy.calls.argsFor(0)).toEqual(SIP_489);
          });
        });

        describe("Bob sends an initial NOTIFY with missing Subscription-State header", () => {
          beforeEach(async () => {
            resetSpies();
            const extraHeaders = new Array<string>();
            extraHeaders.push(`Event: ${receivedEvent}`);
            extraHeaders.push(`Contact: ${bob.ua.contact.uri.toString()}`);
            const message = notifierDialog.createOutgoingRequestMessage(C.NOTIFY, { extraHeaders });
            const uac = new UserAgentClient(NonInviteClientTransaction, notifierDialog.userAgentCore, message);
            await alice.transport.waitReceived();
          });

          it("the subscription should emit 'terminated' after timeout waiting for NOTIFY", async () => {
            await soon(Timers.TIMER_N + 1);
            const spy = subscriptionEmitSpy;
            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy.calls.argsFor(0)).toEqual(terminatedEvent);
          });

          it("the uac should send a 489 to the NOTIFY", () => {
            const spy = alice.transportSendSpy;
            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy.calls.argsFor(0)).toEqual(SIP_489);
          });
        });

        describe("Bob sends an initial NOTIFY with subscription state 'terminated'", () => {
          beforeEach(async () => {
            resetSpies();
            const extraHeaders = new Array<string>();
            extraHeaders.push(`Event: ${receivedEvent}`);
            extraHeaders.push(`Subscription-State: terminated`);
            const message = notifierDialog.createOutgoingRequestMessage(C.NOTIFY, { extraHeaders });
            const uac = new UserAgentClient(NonInviteClientTransaction, notifierDialog.userAgentCore, message);
            await alice.transport.waitReceived();
          });

          it("the subscription should emit a 'notify' and 'terminated' event", () => {
            const spy = subscriptionEmitSpy;
            expect(spy).toHaveBeenCalledTimes(2);
            expect(spy.calls.argsFor(0)).toEqual(notifyEvent);
            expect(spy.calls.argsFor(1)).toEqual(terminatedEvent);
          });

          it("the uac should send a 200 to the NOTIFY", () => {
            const spy = alice.transportSendSpy;
            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy.calls.argsFor(0)).toEqual(SIP_200);
          });
        });

        describe("Bob sends an initial NOTIFY with subscription state 'pending'", () => {
          beforeEach(async () => {
            resetSpies();
            const extraHeaders = new Array<string>();
            extraHeaders.push(`Event: ${receivedEvent}`);
            extraHeaders.push(`Subscription-State: pending;expires=${receivedExpires}`);
            extraHeaders.push(`Contact: ${bob.ua.contact.uri.toString()}`);
            const message = notifierDialog.createOutgoingRequestMessage(C.NOTIFY, { extraHeaders });
            const uac = new UserAgentClient(NonInviteClientTransaction, notifierDialog.userAgentCore, message);
            await subscriptionEmitSpy.wait();
          });

          it("the subscription should emit a 'notify' event", () => {
            const spy = subscriptionEmitSpy;
            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy.calls.argsFor(0)).toEqual(notifyEvent);
          });

          it("the uac should send a 200 to the NOTIFY", () => {
            const spy = alice.transportSendSpy;
            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy.calls.argsFor(0)).toEqual(SIP_200);
          });

          describe("Alice refreshes", () => {
            beforeEach(async () => {
              resetSpies();
              subscription.refresh();
              await soon();
            });

            it("the subscription should emit nothing", () => {
              expect(subscriptionEmitSpy).not.toHaveBeenCalled();
            });

            it("the uac should send nothing", () => {
              expect(alice.transportSendSpy).not.toHaveBeenCalled();
            });
          });
        });

        describe("Bob sends an initial NOTIFY with subscription state 'active'", () => {
          beforeEach(async () => {
            resetSpies();
            const extraHeaders = new Array<string>();
            extraHeaders.push(`Event: ${receivedEvent}`);
            extraHeaders.push(`Subscription-State: active;expires=${receivedExpires}`);
            extraHeaders.push(`Contact: ${bob.ua.contact.uri.toString()}`);
            const message = notifierDialog.createOutgoingRequestMessage(C.NOTIFY, { extraHeaders });
            const uac = new UserAgentClient(NonInviteClientTransaction, notifierDialog.userAgentCore, message);
            await subscriptionEmitSpy.wait();
          });

          it("the subscription should emit a 'notify' event", () => {
            const spy = subscriptionEmitSpy;
            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy.calls.argsFor(0)).toEqual(notifyEvent);
          });

          it("the uac should send a 200 to the NOTIFY", () => {
            const spy = alice.transportSendSpy;
            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy.calls.argsFor(0)).toEqual(SIP_200);
          });

          describe("Alice refreshes", () => {
            beforeEach(async () => {
              resetSpies();
              subscription.refresh();
              await alice.transport.waitReceived();
            });

            it("the subscription should emit a 'notify' event", () => {
              const spy = subscriptionEmitSpy;
              expect(spy).toHaveBeenCalledTimes(1);
              expect(spy.calls.argsFor(0)).toEqual(acceptedEvent);
            });

            it("the uac should send an SUBSCRIBE", () => {
              const spy = alice.transportSendSpy;
              expect(spy).toHaveBeenCalledTimes(1);
              expect(spy.calls.argsFor(0)).toEqual(SIP_SUBSCRIBE);
            });
          });

          describe("Alice unsubscribes", () => {
            beforeEach(async () => {
              resetSpies();
              subscription.unsubscribe();
              await alice.transport.waitReceived();
            });

            it("the subscription should emit a 'terminated' event", () => {
              const spy = subscriptionEmitSpy;
              expect(spy).toHaveBeenCalledTimes(1);
              expect(spy.calls.argsFor(0)).toEqual(terminatedEvent);
            });

            it("the uac should send an un-SUBSCRIBE", () => {
              const spy = alice.transportSendSpy;
              expect(spy).toHaveBeenCalledTimes(1);
              expect(spy.calls.argsFor(0)).toEqual(SIP_SUBSCRIBE);
            });
          });

          describe("Alice closes", () => {
            beforeEach(async () => {
              resetSpies();
              subscription.close();
              await alice.transport.waitReceived();
            });

            it("the subscription should emit a 'terminated' event", () => {
              const spy = subscriptionEmitSpy;
              expect(spy).toHaveBeenCalledTimes(1);
              expect(spy.calls.argsFor(0)).toEqual(terminatedEvent);
            });

            it("the uac should send an un-SUBSCRIBE", () => {
              const spy = alice.transportSendSpy;
              expect(spy).toHaveBeenCalledTimes(1);
              expect(spy.calls.argsFor(0)).toEqual(SIP_SUBSCRIBE);
            });
          });

          describe("Bob terminates with no reason code", () => {
            beforeEach(async () => {
              resetSpies();
              const extraHeaders = new Array<string>();
              extraHeaders.push(`Event: ${receivedEvent}`);
              extraHeaders.push(`Subscription-State: terminated`);
              const message = notifierDialog.createOutgoingRequestMessage(C.NOTIFY, { extraHeaders });
              const uac = new UserAgentClient(NonInviteClientTransaction, notifierDialog.userAgentCore, message);
              await subscriptionEmitSpy.wait();
              await soon(10);
            });

            it("the subscription should emit a 'notify' and 'terminated' event", () => {
              const spy = subscriptionEmitSpy;
              expect(spy).toHaveBeenCalledTimes(2);
              expect(spy.calls.argsFor(0)).toEqual(notifyEvent);
              expect(spy.calls.argsFor(1)).toEqual(terminatedEvent);
            });

            it("the uac should send a 200 to the NOTIFY", () => {
              const spy = alice.transportSendSpy;
              expect(spy).toHaveBeenCalledTimes(1);
              expect(spy.calls.argsFor(0)).toEqual(SIP_200);
            });
          });

          describe("Bob terminates with timeout reason code", () => {
            beforeEach(async () => {
              resetSpies();
              const extraHeaders = new Array<string>();
              extraHeaders.push(`Event: ${receivedEvent}`);
              extraHeaders.push(`Subscription-State: terminated;reason=timeout`);
              const message = notifierDialog.createOutgoingRequestMessage(C.NOTIFY, { extraHeaders });
              const uac = new UserAgentClient(NonInviteClientTransaction, notifierDialog.userAgentCore, message);
              await subscriptionEmitSpy.wait();
              await soon(10);
            });

            it("the subscription should emit a 'notify' and 'accepted' event", () => {
              const spy = subscriptionEmitSpy;
              expect(spy).toHaveBeenCalledTimes(2);
              expect(spy.calls.argsFor(0)).toEqual(notifyEvent);
              expect(spy.calls.argsFor(1)).toEqual(acceptedEvent);
            });

            it("the uac should send a 200 to the NOTIFY and then a SUBSCRIBE", () => {
              const spy = alice.transportSendSpy;
              expect(spy).toHaveBeenCalledTimes(2);
              expect(spy.calls.argsFor(0)).toEqual(SIP_200);
              expect(spy.calls.argsFor(1)).toEqual(SIP_SUBSCRIBE);
            });
          });

          describe("Prior to subscription expiration, ", () => {
            beforeEach(async () => {
              resetSpies();
              await soon(3600 * 900);
            });

            it("the subscription should emit an 'accepted' event", () => {
              const spy = subscriptionEmitSpy;
              expect(spy).toHaveBeenCalledTimes(1);
              expect(spy.calls.argsFor(0)).toEqual(acceptedEvent);
            });

            it("the uac should send a re-SUBSCRIBE", () => {
              const spy = alice.transportSendSpy;
              expect(spy).toHaveBeenCalledTimes(1);
              expect(spy.calls.argsFor(0)).toEqual(SIP_SUBSCRIBE);
            });
          });
        });
      });
    });
  });
});
