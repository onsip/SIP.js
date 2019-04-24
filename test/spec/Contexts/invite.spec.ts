import { C } from "../../../src/Constants";
import { IncomingInviteRequest } from "../../../src/Core/messages";
import { SessionState, SignalingState } from "../../../src/Core/session";
import {
  makeUserAgentCoreConfigurationFromUA,
  UserAgentCore,
  UserAgentCoreConfiguration
} from "../../../src/Core/user-agent-core";
import { Exceptions } from "../../../src/Exceptions";
import { IncomingRequest as IncomingRequestMessage } from "../../../src/SIPMessage";
import { Transport } from "../../../src/Transport";
import { UA } from "../../../src/UA";
import { URI } from "../../../src/URI";

import { InviteClientContext } from "../../../src/Session";
import { InviteServerContext } from "../../../src/Session";

import {
  connectTransportToUA,
  connectTransportToUAFork,
  makeMockTransport,
  makeMockUA
} from "../Core/mocks";

import {
  makeMockSessionDescriptionHandlerFactory
} from "./mocks";

describe("Invite Contexts", () => {
  const userAlice = "alice";
  const userBob = "bob";
  const domainAlice = "example.com";
  const domainBob = "example.com";
  const displayNameAlice = "Alice";
  const displayNameBob = "Bob";
  let configurationAlice: UserAgentCoreConfiguration;
  let configurationBob: UserAgentCoreConfiguration;
  let contextAlice: InviteClientContext;
  let contextBob: InviteServerContext;
  let coreAlice: UserAgentCore;
  let coreBob: UserAgentCore;
  let transportAlice: jasmine.SpyObj<Transport>;
  let transportBob: jasmine.SpyObj<Transport>;
  let uaAlice: UA;
  let uaBob: UA;
  let uaBobOnInvite: () => void;

  // Setup Alice's InviteClientContext with transport wired to Bob
  beforeEach(() => {
    transportAlice = makeMockTransport();
    transportBob = makeMockTransport();
    uaAlice = makeMockUA(userAlice, domainAlice, displayNameAlice, transportAlice);
    uaBob = makeMockUA(userBob, domainBob, displayNameBob, transportBob);
    uaAlice.configuration.rel100 = C.supported.SUPPORTED;
    uaBob.configuration.rel100 = C.supported.SUPPORTED;
    uaBobOnInvite = () => { return; };
    connectTransportToUA(transportAlice, uaBob);
    connectTransportToUA(transportBob, uaAlice);
    configurationAlice = makeUserAgentCoreConfigurationFromUA(uaAlice);
    configurationBob = makeUserAgentCoreConfigurationFromUA(uaBob);
    coreAlice = new UserAgentCore(configurationAlice, {});
    coreBob = new UserAgentCore(configurationBob, {
      onInvite: (incomingInviteRequest: IncomingInviteRequest): void => {
        // Automatically send 100 Trying to mirror current UA behavior
        incomingInviteRequest.trying();
        incomingInviteRequest.delegate = {
          onCancel: (cancel: IncomingRequestMessage): void => {
            contextBob.receiveRequest(cancel);
          },
          onTransportError: (error: Exceptions.TransportError): void => {
            contextBob.onTransportError();
          }
        };
        contextBob = new InviteServerContext(uaBob, incomingInviteRequest);
        // Automatically making first call to progress mirrors current UA behavior.
        if (contextBob.autoSendAnInitialProvisionalResponse) {
          contextBob.progress();
        }
        if (uaBobOnInvite) {
          uaBobOnInvite();
        }
      }
    });
    uaAlice.configuration.sessionDescriptionHandlerFactory = makeMockSessionDescriptionHandlerFactory(userAlice);
    uaBob.configuration.sessionDescriptionHandlerFactory = makeMockSessionDescriptionHandlerFactory(userBob);
    uaAlice.userAgentCore = coreAlice;
    uaBob.userAgentCore = coreBob;
  });

  afterEach(() => {
    coreAlice.dispose();
    coreBob.dispose();
    uaBobOnInvite = () => { return; };
  });

  describe("Alice invite Bob with offer.", () => {
    let ruri: URI;

    beforeEach(() => {
      ruri = new URI("sip", userBob, domainBob, undefined);
      uaBob.configuration.noAnswerTimeout = 50;
    });

    describe("Alice sends CANCEL.", () => {
      beforeEach((done) => {
        contextAlice = new InviteClientContext(uaAlice, ruri);
        contextAlice.invite();
        contextAlice.cancel();
        setTimeout(() => done(), 100); // transport calls are async, so give it some time
      });

      it("Alice's UAC sends nothing", () => {
        expect(transportAlice.send).toHaveBeenCalledTimes(0);
      });
    });

    describe("Alice wait (3x) and CANCEL.", () => {
      beforeEach((done) => {
        contextAlice = new InviteClientContext(uaAlice, ruri);
        contextAlice.invite();
        Promise.resolve().then(() =>
          Promise.resolve().then(() =>
            Promise.resolve().then(() => contextAlice.cancel())));
        setTimeout(() => done(), 100); // transport calls are async, so give it some time
      });

      it("Alice's UAC sends INVITE, CANCEL and ACK", () => {
        expect(transportAlice.send).toHaveBeenCalledTimes(3);
        expect(transportAlice.send.calls.all()[0].args[0])
          .toMatch(new RegExp(`^INVITE ${ruri} SIP/2.0`));
        expect(transportAlice.send.calls.all()[1].args[0])
          .toMatch(new RegExp(`^CANCEL ${ruri} SIP/2.0`));
        expect(transportAlice.send.calls.all()[2].args[0])
          .toMatch(new RegExp(`^ACK ${ruri} SIP/2.0`));
      });

      it("Bob's UAS sends 100, 180, 200 and 487", () => {
        expect(transportBob.send).toHaveBeenCalledTimes(4);
        expect(transportBob.send.calls.all()[0].args[0])
          .toMatch(new RegExp(`^SIP/2.0 100 Trying`));
        expect(transportBob.send.calls.all()[1].args[0])
          .toMatch(new RegExp(`^SIP/2.0 180 Ringing`));
        expect(transportBob.send.calls.all()[2].args[0])
          .toMatch(new RegExp(`^SIP/2.0 200 OK`)); // response to the CANCEL
        expect(transportBob.send.calls.all()[3].args[0])
          .toMatch(new RegExp(`^SIP/2.0 487 Request Terminated`));
      });
    });

    describe("Alice wait (8x) and CANCEL. Bob accept. CANCEL wins. (async race)", () => {
      beforeEach((done) => {
        uaBobOnInvite = () => {
          contextBob.accept();
        };
        contextAlice = new InviteClientContext(uaAlice, ruri);
        contextAlice.invite();
        Promise.resolve().then(() =>
          Promise.resolve().then(() =>
            Promise.resolve().then(() =>
              Promise.resolve().then(() =>
                Promise.resolve().then(() =>
                  Promise.resolve().then(() =>
                    Promise.resolve().then(() =>
                      Promise.resolve().then(() => contextAlice.cancel()))))))));
        setTimeout(() => done(), 100); // transport calls are async, so give it some time
      });

      it("Alice's UAC sends INVITE, CANCEL and ACK", () => {
        expect(transportAlice.send).toHaveBeenCalledTimes(3);
        expect(transportAlice.send.calls.all()[0].args[0])
          .toMatch(new RegExp(`^INVITE ${ruri} SIP/2.0`));
        expect(transportAlice.send.calls.all()[1].args[0])
          .toMatch(new RegExp(`^CANCEL ${ruri} SIP/2.0`));
        expect(transportAlice.send.calls.all()[2].args[0])
          .toMatch(new RegExp(`^ACK ${ruri} SIP/2.0`));
      });

      it("Bob's UAS sends 100, 180, 200 and 487", () => {
        expect(transportBob.send).toHaveBeenCalledTimes(4);
        expect(transportBob.send.calls.all()[0].args[0])
          .toMatch(new RegExp(`^SIP/2.0 100 Trying`));
        expect(transportBob.send.calls.all()[1].args[0])
          .toMatch(new RegExp(`^SIP/2.0 180 Ringing`));
        expect(transportBob.send.calls.all()[2].args[0])
          .toMatch(new RegExp(`^SIP/2.0 200 OK`)); // response to the CANCEL
        expect(transportBob.send.calls.all()[3].args[0])
          .toMatch(new RegExp(`^SIP/2.0 487 Request Terminated`));
      });
    });

    describe("Alice wait (10x). Bob accept. Alice CANCEL. Ok wins. (glare)", () => {
      beforeEach((done) => {
        uaBobOnInvite = () => {
          contextBob.accept();
        };
        contextAlice = new InviteClientContext(uaAlice, ruri);
        contextAlice.invite();
        Promise.resolve().then(() =>
          Promise.resolve().then(() =>
            Promise.resolve().then(() =>
              Promise.resolve().then(() =>
                Promise.resolve().then(() =>
                  Promise.resolve().then(() =>
                    Promise.resolve().then(() =>
                      Promise.resolve().then(() =>
                        Promise.resolve().then(() =>
                          Promise.resolve().then(() => contextAlice.cancel()))))))))));
        setTimeout(() => done(), 100); // transport calls are async, so give it some time
      });

      it("Alice's UAC sends INVITE, CANCEL, ACK and BYE", () => {
        expect(transportAlice.send).toHaveBeenCalledTimes(4);
        expect(transportAlice.send.calls.all()[0].args[0])
          .toMatch(new RegExp(`^INVITE ${ruri} SIP/2.0`));
        expect(transportAlice.send.calls.all()[1].args[0])
          .toMatch(new RegExp(`^CANCEL ${ruri} SIP/2.0`));
        expect(transportAlice.send.calls.all()[2].args[0])
          .toMatch(new RegExp(`^ACK ${uaBob.contact.uri.toString()} SIP/2.0`));
        expect(transportAlice.send.calls.all()[3].args[0])
          .toMatch(new RegExp(`^BYE ${uaBob.contact.uri.toString()} SIP/2.0`));
      });

      it("Bob's UAS sends 100, 180, 200, 200 and BYE", () => {
        expect(transportBob.send).toHaveBeenCalledTimes(5);
        expect(transportBob.send.calls.all()[0].args[0])
          .toMatch(new RegExp(`^SIP/2.0 100 Trying`));
        expect(transportBob.send.calls.all()[1].args[0])
          .toMatch(new RegExp(`^SIP/2.0 180 Ringing`));
        expect(transportBob.send.calls.all()[2].args[0])
          .toMatch(new RegExp(`^SIP/2.0 200 OK`)); // response to the INVITE
        expect(transportBob.send.calls.all()[3].args[0])
          .toMatch(new RegExp(`^SIP/2.0 200 OK`)); // response to the CANCEL
        expect(transportBob.send.calls.all()[4].args[0])
          .toMatch(new RegExp(`^SIP/2.0 200 OK`)); // response to the BYE
      });
    });

    describe("Bob times out before responding. (Bob auto responds currently, so...)", () => {
      beforeEach((done) => {
        contextAlice = new InviteClientContext(uaAlice, ruri);
        contextAlice.invite();
        setTimeout(() => done(), 100); // transport calls are async, so give it some time
      });

      it("Alice's UAC sends an INVITE and ACK", () => {
        expect(transportAlice.send).toHaveBeenCalledTimes(2);
        expect(transportAlice.send.calls.all()[0].args[0])
          .toMatch(new RegExp(`^INVITE ${ruri} SIP/2.0`));
        expect(transportAlice.send.calls.all()[1].args[0])
          .toMatch(new RegExp(`^ACK ${ruri} SIP/2.0`));
      });

      it("Bob's UAS sends 100, 180 and 408", () => {
        expect(transportBob.send).toHaveBeenCalledTimes(3);
        expect(transportBob.send.calls.all()[0].args[0])
          .toMatch(new RegExp(`^SIP/2.0 100 Trying`));
        expect(transportBob.send.calls.all()[1].args[0])
          .toMatch(new RegExp(`^SIP/2.0 180 Ringing`));
        expect(transportBob.send.calls.all()[2].args[0])
          .toMatch(new RegExp(`^SIP/2.0 408 Request Timeout`));
      });

      it("Alice's Session is undefined", () => {
        expect(contextAlice.session).toBe(undefined);
      });

      it("Bob's Session to be undefined (but it is defined because of the auto response)", () => {
        expect(contextBob.session).not.toBe(undefined);
      });
    });

    describe("Bob accept.", () => {
      beforeEach((done) => {
        uaBobOnInvite = () => {
          contextBob.accept();
        };
        contextAlice = new InviteClientContext(uaAlice, ruri);
        contextAlice.invite();
        setTimeout(() => done(), 20); // transport calls are async, so give it some time
      });

      it("Alice's UAC sends an INVITE and ACK", () => {
        expect(transportAlice.send).toHaveBeenCalledTimes(2);
        expect(transportAlice.send.calls.all()[0].args[0])
          .toMatch(new RegExp(`^INVITE ${ruri} SIP/2.0`));
        expect(transportAlice.send.calls.all()[1].args[0])
          .toMatch(new RegExp(`^ACK ${uaBob.contact.uri.toString()} SIP/2.0`));
      });

      it("Bob's UAS sends 100, 180 and 200", () => {
        expect(transportBob.send).toHaveBeenCalledTimes(3);
        expect(transportBob.send.calls.all()[0].args[0])
          .toMatch(new RegExp(`^SIP/2.0 100 Trying`));
        expect(transportBob.send.calls.all()[1].args[0])
          .toMatch(new RegExp(`^SIP/2.0 180 Ringing`));
        expect(transportBob.send.calls.all()[2].args[0])
          .toMatch(new RegExp(`^SIP/2.0 200 OK`));
      });

      it("Alice's Session is 'confirmed' and 'stable'", () => {
        expect(contextAlice.session && contextAlice.session.sessionState).toBe(SessionState.Confirmed);
        expect(contextAlice.session && contextAlice.session.signalingState).toBe(SignalingState.Stable);
      });

      it("Bob's Session is 'confirmed' and 'stable'", () => {
        expect(contextBob.session && contextBob.session.sessionState).toBe(SessionState.Confirmed);
        expect(contextBob.session && contextBob.session.signalingState).toBe(SignalingState.Stable);
      });
   });

    describe("Bob wait and accept.", () => {
      beforeEach((done) => {
        uaBobOnInvite = () => {
          Promise.resolve().then(() => contextBob.accept());
        };
        contextAlice = new InviteClientContext(uaAlice, ruri);
        contextAlice.invite();
        setTimeout(() => done(), 20); // transport calls are async, so give it some time
      });

      it("Alice's UAC sends an INVITE and ACK", () => {
        expect(transportAlice.send).toHaveBeenCalledTimes(2);
        expect(transportAlice.send.calls.all()[0].args[0])
          .toMatch(new RegExp(`^INVITE ${ruri} SIP/2.0`));
        expect(transportAlice.send.calls.all()[1].args[0])
          .toMatch(new RegExp(`^ACK ${uaBob.contact.uri.toString()} SIP/2.0`));
      });

      it("Bob's UAS sends 100, 180 and 200", () => {
        expect(transportBob.send).toHaveBeenCalledTimes(3);
        expect(transportBob.send.calls.all()[0].args[0])
          .toMatch(new RegExp(`^SIP/2.0 100 Trying`));
        expect(transportBob.send.calls.all()[1].args[0])
          .toMatch(new RegExp(`^SIP/2.0 180 Ringing`));
        expect(transportBob.send.calls.all()[2].args[0])
          .toMatch(new RegExp(`^SIP/2.0 200 OK`));
      });

      it("Alice's Session is 'confirmed' and 'stable'", () => {
        expect(contextAlice.session && contextAlice.session.sessionState).toBe(SessionState.Confirmed);
        expect(contextAlice.session && contextAlice.session.signalingState).toBe(SignalingState.Stable);
      });

      it("Bob's Session is 'confirmed' and 'stable'", () => {
        expect(contextBob.session && contextBob.session.sessionState).toBe(SessionState.Confirmed);
        expect(contextBob.session && contextBob.session.signalingState).toBe(SignalingState.Stable);
      });
   });

    describe("Bob progress and accept.", () => {
      beforeEach((done) => {
        uaBobOnInvite = () => {
          contextBob.progress();
          contextBob.accept();
        };
        contextAlice = new InviteClientContext(uaAlice, ruri, { inviteWithoutSdp: true });
        contextAlice.invite();
        setTimeout(() => done(), 20); // transport calls are async, so give it some time
      });

      it("Alice's UAC sends an INVITE and ACK", () => {
        expect(transportAlice.send).toHaveBeenCalledTimes(2);
        expect(transportAlice.send.calls.all()[0].args[0])
          .toMatch(new RegExp(`^INVITE ${ruri} SIP/2.0`));
        expect(transportAlice.send.calls.all()[1].args[0])
          .toMatch(new RegExp(`^ACK ${uaBob.contact.uri.toString()} SIP/2.0`));
      });

      it("Bob's UAS sends 100, 180 and 200", () => {
        expect(transportBob.send).toHaveBeenCalledTimes(4);
        expect(transportBob.send.calls.all()[0].args[0])
          .toMatch(new RegExp(`^SIP/2.0 100 Trying`));
        expect(transportBob.send.calls.all()[1].args[0])
          .toMatch(new RegExp(`^SIP/2.0 180 Ringing`));
        expect(transportBob.send.calls.all()[2].args[0])
          .toMatch(new RegExp(`^SIP/2.0 180 Ringing`));
        expect(transportBob.send.calls.all()[3].args[0])
          .toMatch(new RegExp(`^SIP/2.0 200 OK`));
      });

      it("Alice's Session is 'confirmed' and 'stable'", () => {
        expect(contextAlice.session && contextAlice.session.sessionState).toBe(SessionState.Confirmed);
        expect(contextAlice.session && contextAlice.session.signalingState).toBe(SignalingState.Stable);
      });

      it("Bob's Session is 'confirmed' and 'stable'", () => {
        expect(contextBob.session && contextBob.session.sessionState).toBe(SessionState.Confirmed);
        expect(contextBob.session && contextBob.session.signalingState).toBe(SignalingState.Stable);
      });
   });

    describe("Bob wait, progress and accept.", () => {
      beforeEach((done) => {
        uaBobOnInvite = () => {
          Promise.resolve().then(() => {
            contextBob.progress();
            contextBob.accept();
          });
        };
        contextAlice = new InviteClientContext(uaAlice, ruri, { inviteWithoutSdp: true });
        contextAlice.invite();
        setTimeout(() => done(), 20); // transport calls are async, so give it some time
      });

      it("Alice's UAC sends an INVITE and ACK", () => {
        expect(transportAlice.send).toHaveBeenCalledTimes(2);
        expect(transportAlice.send.calls.all()[0].args[0])
          .toMatch(new RegExp(`^INVITE ${ruri} SIP/2.0`));
        expect(transportAlice.send.calls.all()[1].args[0])
          .toMatch(new RegExp(`^ACK ${uaBob.contact.uri.toString()} SIP/2.0`));
      });

      it("Bob's UAS sends 100, 180, 180 and 200", () => {
        expect(transportBob.send).toHaveBeenCalledTimes(4);
        expect(transportBob.send.calls.all()[0].args[0])
          .toMatch(new RegExp(`^SIP/2.0 100 Trying`));
        expect(transportBob.send.calls.all()[1].args[0])
          .toMatch(new RegExp(`^SIP/2.0 180 Ringing`));
        expect(transportBob.send.calls.all()[2].args[0])
          .toMatch(new RegExp(`^SIP/2.0 180 Ringing`));
        expect(transportBob.send.calls.all()[3].args[0])
          .toMatch(new RegExp(`^SIP/2.0 200 OK`));
      });

      it("Alice's Session is 'confirmed' and 'stable'", () => {
        expect(contextAlice.session && contextAlice.session.sessionState).toBe(SessionState.Confirmed);
        expect(contextAlice.session && contextAlice.session.signalingState).toBe(SignalingState.Stable);
      });

      it("Bob's Session is 'confirmed' and 'stable'", () => {
        expect(contextBob.session && contextBob.session.sessionState).toBe(SessionState.Confirmed);
        expect(contextBob.session && contextBob.session.signalingState).toBe(SignalingState.Stable);
      });
    });

    describe("Bob progress, wait and accept.", () => {
      beforeEach((done) => {
        uaBobOnInvite = () => {
          contextBob.progress();
          Promise.resolve().then(() => contextBob.accept());
        };
        contextAlice = new InviteClientContext(uaAlice, ruri, { inviteWithoutSdp: true });
        contextAlice.invite();
        setTimeout(() => done(), 20); // transport calls are async, so give it some time
      });

      it("Alice's UAC sends an INVITE and ACK", () => {
        expect(transportAlice.send).toHaveBeenCalledTimes(2);
        expect(transportAlice.send.calls.all()[0].args[0])
          .toMatch(new RegExp(`^INVITE ${ruri} SIP/2.0`));
        expect(transportAlice.send.calls.all()[1].args[0])
          .toMatch(new RegExp(`^ACK ${uaBob.contact.uri.toString()} SIP/2.0`));
      });

      it("Bob's UAS sends 100, 180, 180 and 200", () => {
        expect(transportBob.send).toHaveBeenCalledTimes(4);
        expect(transportBob.send.calls.all()[0].args[0])
          .toMatch(new RegExp(`^SIP/2.0 100 Trying`));
        expect(transportBob.send.calls.all()[1].args[0])
          .toMatch(new RegExp(`^SIP/2.0 180 Ringing`));
        expect(transportBob.send.calls.all()[2].args[0])
          .toMatch(new RegExp(`^SIP/2.0 180 Ringing`));
        expect(transportBob.send.calls.all()[3].args[0])
          .toMatch(new RegExp(`^SIP/2.0 200 OK`));
      });

      it("Alice's Session is 'confirmed' and 'stable'", () => {
        expect(contextAlice.session && contextAlice.session.sessionState).toBe(SessionState.Confirmed);
        expect(contextAlice.session && contextAlice.session.signalingState).toBe(SignalingState.Stable);
      });

      it("Bob's Session is 'confirmed' and 'stable'", () => {
        expect(contextBob.session && contextBob.session.sessionState).toBe(SessionState.Confirmed);
        expect(contextBob.session && contextBob.session.signalingState).toBe(SignalingState.Stable);
      });
    });

    describe("Bob reliable progress and accept.", () => {
      beforeEach((done) => {
        uaBobOnInvite = () => {
          contextBob.progress({ rel100: true });
          contextBob.accept();
        };
        contextAlice = new InviteClientContext(uaAlice, ruri);
        contextAlice.invite();
        setTimeout(() => done(), 20); // transport calls are async, so give it some time
      });

      it("Alice's UAC sends an INVITE, PRACK and ACK", () => {
        expect(transportAlice.send).toHaveBeenCalledTimes(3);
        expect(transportAlice.send.calls.all()[0].args[0])
          .toMatch(new RegExp(`^INVITE ${ruri} SIP/2.0`));
        expect(transportAlice.send.calls.all()[1].args[0])
          .toMatch(new RegExp(`^PRACK ${uaBob.contact.uri.toString()} SIP/2.0`));
        expect(transportAlice.send.calls.all()[2].args[0])
          .toMatch(new RegExp(`^ACK ${uaBob.contact.uri.toString()} SIP/2.0`));
      });

      it("Bob's UAS sends 100, 180, 183, 200 and 200", () => {
        expect(transportBob.send).toHaveBeenCalledTimes(5);
        expect(transportBob.send.calls.all()[0].args[0])
          .toMatch(new RegExp(`^SIP/2.0 100 Trying`));
        expect(transportBob.send.calls.all()[1].args[0])
          .toMatch(new RegExp(`^SIP/2.0 180 Ringing`));
        expect(transportBob.send.calls.all()[2].args[0])
          .toMatch(new RegExp(`^SIP/2.0 183 Session Progress`));
        expect(transportBob.send.calls.all()[3].args[0])
          .toMatch(new RegExp(`^SIP/2.0 200 OK`));
        expect(transportBob.send.calls.all()[4].args[0])
          .toMatch(new RegExp(`^SIP/2.0 200 OK`));
      });

      it("Alice's Session is 'confirmed' and 'stable'", () => {
        expect(contextAlice.session && contextAlice.session.sessionState).toBe(SessionState.Confirmed);
        expect(contextAlice.session && contextAlice.session.signalingState).toBe(SignalingState.Stable);
      });

      it("Bob's Session is 'confirmed' and 'stable'", () => {
        expect(contextBob.session && contextBob.session.sessionState).toBe(SessionState.Confirmed);
        expect(contextBob.session && contextBob.session.signalingState).toBe(SignalingState.Stable);
      });
    });

    describe("Bob wait, reliable progress and accept.", () => {
      beforeEach((done) => {
        uaBobOnInvite = () => {
          Promise.resolve().then(() => {
            contextBob.progress({ rel100: true });
            contextBob.accept();
          });
        };
        contextAlice = new InviteClientContext(uaAlice, ruri, { inviteWithoutSdp: true });
        contextAlice.invite();
        setTimeout(() => done(), 20); // transport calls are async, so give it some time
      });

      it("Alice's UAC sends an INVITE, PRACK and ACK", () => {
        expect(transportAlice.send).toHaveBeenCalledTimes(3);
        expect(transportAlice.send.calls.all()[0].args[0])
          .toMatch(new RegExp(`^INVITE ${ruri} SIP/2.0`));
        expect(transportAlice.send.calls.all()[1].args[0])
          .toMatch(new RegExp(`^PRACK ${uaBob.contact.uri.toString()} SIP/2.0`));
        expect(transportAlice.send.calls.all()[2].args[0])
          .toMatch(new RegExp(`^ACK ${uaBob.contact.uri.toString()} SIP/2.0`));
      });

      it("Bob's UAS sends 100, 180, 183, 200 and 200", () => {
        expect(transportBob.send).toHaveBeenCalledTimes(5);
        expect(transportBob.send.calls.all()[0].args[0])
          .toMatch(new RegExp(`^SIP/2.0 100 Trying`));
        expect(transportBob.send.calls.all()[1].args[0])
          .toMatch(new RegExp(`^SIP/2.0 180 Ringing`));
        expect(transportBob.send.calls.all()[2].args[0])
          .toMatch(new RegExp(`^SIP/2.0 183 Session Progress`));
        expect(transportBob.send.calls.all()[4].args[0])
          .toMatch(new RegExp(`^SIP/2.0 200 OK`));
      });

      it("Alice's Session is 'confirmed' and 'stable'", () => {
        expect(contextAlice.session && contextAlice.session.sessionState).toBe(SessionState.Confirmed);
        expect(contextAlice.session && contextAlice.session.signalingState).toBe(SignalingState.Stable);
      });

      it("Bob's Session is 'confirmed' and 'stable'", () => {
        expect(contextBob.session && contextBob.session.sessionState).toBe(SessionState.Confirmed);
        expect(contextBob.session && contextBob.session.signalingState).toBe(SignalingState.Stable);
      });
    });

    describe("Bob reliable progress, wait and accept.", () => {
      beforeEach((done) => {
        uaBobOnInvite = () => {
          contextBob.progress({ rel100: true });
          Promise.resolve().then(() => contextBob.accept());
        };
        contextAlice = new InviteClientContext(uaAlice, ruri);
        contextAlice.invite();
        setTimeout(() => done(), 20); // transport calls are async, so give it some time
      });

      it("Alice's UAC sends an INVITE, PRACK and ACK", () => {
        expect(transportAlice.send).toHaveBeenCalledTimes(3);
        expect(transportAlice.send.calls.all()[0].args[0])
          .toMatch(new RegExp(`^INVITE ${ruri} SIP/2.0`));
        expect(transportAlice.send.calls.all()[1].args[0])
          .toMatch(new RegExp(`^PRACK ${uaBob.contact.uri.toString()} SIP/2.0`));
        expect(transportAlice.send.calls.all()[2].args[0])
          .toMatch(new RegExp(`^ACK ${uaBob.contact.uri.toString()} SIP/2.0`));
      });

      it("Bob's UAS sends 100, 180, 183, 200 and 200", () => {
        expect(transportBob.send).toHaveBeenCalledTimes(5);
        expect(transportBob.send.calls.all()[0].args[0])
          .toMatch(new RegExp(`^SIP/2.0 100 Trying`));
        expect(transportBob.send.calls.all()[1].args[0])
          .toMatch(new RegExp(`^SIP/2.0 180 Ringing`));
        expect(transportBob.send.calls.all()[2].args[0])
          .toMatch(new RegExp(`^SIP/2.0 183 Session Progress`));
        expect(transportBob.send.calls.all()[3].args[0])
          .toMatch(new RegExp(`^SIP/2.0 200 OK`));
        expect(transportBob.send.calls.all()[4].args[0])
          .toMatch(new RegExp(`^SIP/2.0 200 OK`));
      });

      it("Alice's Session is 'confirmed' and 'stable'", () => {
        expect(contextAlice.session && contextAlice.session.sessionState).toBe(SessionState.Confirmed);
        expect(contextAlice.session && contextAlice.session.signalingState).toBe(SignalingState.Stable);
      });

      it("Bob's Session is 'confirmed' and 'stable'", () => {
        expect(contextBob.session && contextBob.session.sessionState).toBe(SessionState.Confirmed);
        expect(contextBob.session && contextBob.session.signalingState).toBe(SignalingState.Stable);
      });
    });

    describe("Bob reliable progress (2x) and accept.", () => {
      beforeEach((done) => {
        uaBobOnInvite = () => {
          contextBob.progress({ rel100: true });
          contextBob.progress({ rel100: true });
          contextBob.accept();
        };
        contextAlice = new InviteClientContext(uaAlice, ruri);
        contextAlice.invite();
        setTimeout(() => done(), 20); // transport calls are async, so give it some time
      });

      it("Alice's UAC sends an INVITE, PRACK and ACK", () => {
        expect(transportAlice.send).toHaveBeenCalledTimes(3);
        expect(transportAlice.send.calls.all()[0].args[0])
          .toMatch(new RegExp(`^INVITE ${ruri} SIP/2.0`));
        expect(transportAlice.send.calls.all()[1].args[0])
          .toMatch(new RegExp(`^PRACK ${uaBob.contact.uri.toString()} SIP/2.0`));
        expect(transportAlice.send.calls.all()[2].args[0])
          .toMatch(new RegExp(`^ACK ${uaBob.contact.uri.toString()} SIP/2.0`));
      });

      it("Bob's UAS sends 100, 180, 183, 200 and 200", () => {
        expect(transportBob.send).toHaveBeenCalledTimes(5);
        expect(transportBob.send.calls.all()[0].args[0])
          .toMatch(new RegExp(`^SIP/2.0 100 Trying`));
        expect(transportBob.send.calls.all()[1].args[0])
          .toMatch(new RegExp(`^SIP/2.0 180 Ringing`));
        expect(transportBob.send.calls.all()[2].args[0])
          .toMatch(new RegExp(`^SIP/2.0 183 Session Progress`));
        expect(transportBob.send.calls.all()[3].args[0])
          .toMatch(new RegExp(`^SIP/2.0 200 OK`));
        expect(transportBob.send.calls.all()[4].args[0])
          .toMatch(new RegExp(`^SIP/2.0 200 OK`));
      });

      it("Alice's Session is 'confirmed' and 'stable'", () => {
        expect(contextAlice.session && contextAlice.session.sessionState).toBe(SessionState.Confirmed);
        expect(contextAlice.session && contextAlice.session.signalingState).toBe(SignalingState.Stable);
      });

      it("Bob's Session is 'confirmed' and 'stable'", () => {
        expect(contextBob.session && contextBob.session.sessionState).toBe(SessionState.Confirmed);
        expect(contextBob.session && contextBob.session.signalingState).toBe(SignalingState.Stable);
      });
    });

    describe("Bob 183 progress, 180 progress and accept.", () => {
      beforeEach((done) => {
        uaBobOnInvite = () => {
          contextBob.progress({ statusCode: 183 });
          contextBob.progress();
          contextBob.accept();
        };
        contextAlice = new InviteClientContext(uaAlice, ruri, { inviteWithoutSdp: true });
        contextAlice.invite();
        setTimeout(() => done(), 20); // transport calls are async, so give it some time
      });

      it("Alice's UAC sends an INVITE, PRACK and ACK", () => {
        expect(transportAlice.send).toHaveBeenCalledTimes(2);
        expect(transportAlice.send.calls.all()[0].args[0])
          .toMatch(new RegExp(`^INVITE ${ruri} SIP/2.0`));
        expect(transportAlice.send.calls.all()[1].args[0])
          .toMatch(new RegExp(`^ACK ${uaBob.contact.uri.toString()} SIP/2.0`));
      });

      it("Bob's UAS sends 100, 180, 183, 180 and 200", () => {
        expect(transportBob.send).toHaveBeenCalledTimes(5);
        expect(transportBob.send.calls.all()[0].args[0])
          .toMatch(new RegExp(`^SIP/2.0 100 Trying`));
        expect(transportBob.send.calls.all()[1].args[0])
          .toMatch(new RegExp(`^SIP/2.0 180 Ringing`));
        expect(transportBob.send.calls.all()[2].args[0])
          .toMatch(new RegExp(`^SIP/2.0 183 Session Progress`));
        expect(transportBob.send.calls.all()[3].args[0])
          .toMatch(new RegExp(`^SIP/2.0 180 Ringing`));
        expect(transportBob.send.calls.all()[4].args[0])
          .toMatch(new RegExp(`^SIP/2.0 200 OK`));
      });

      it("Alice's Session is 'confirmed' and 'stable'", () => {
        expect(contextAlice.session && contextAlice.session.sessionState).toBe(SessionState.Confirmed);
        expect(contextAlice.session && contextAlice.session.signalingState).toBe(SignalingState.Stable);
      });

      it("Bob's Session is 'confirmed' and 'stable'", () => {
        expect(contextBob.session && contextBob.session.sessionState).toBe(SessionState.Confirmed);
        expect(contextBob.session && contextBob.session.signalingState).toBe(SignalingState.Stable);
      });
    });
  });

  describe("Alice invite Bob without offer.", () => {
    let ruri: URI;

    beforeEach(() => {
      ruri = new URI("sip", userBob, domainBob, undefined);
      uaBob.configuration.noAnswerTimeout = 90;
    });

    describe("Alice sends CANCEL.", () => {
      beforeEach((done) => {
        contextAlice = new InviteClientContext(uaAlice, ruri, { inviteWithoutSdp: true });
        contextAlice.invite();
        contextAlice.cancel();
        setTimeout(() => done(), 100); // transport calls are async, so give it some time
      });

      it("Alice's UAC sends nothing", () => {
        expect(transportAlice.send).toHaveBeenCalledTimes(0);
      });
    });

    describe("Alice wait (3x) and CANCEL.", () => {
      beforeEach((done) => {
        contextAlice = new InviteClientContext(uaAlice, ruri, { inviteWithoutSdp: true });
        contextAlice.invite();
        Promise.resolve().then(() =>
          Promise.resolve().then(() =>
            Promise.resolve().then(() => contextAlice.cancel())));
        setTimeout(() => done(), 100); // transport calls are async, so give it some time
      });

      it("Alice's UAC sends INVITE, CANCEL and ACK", () => {
        expect(transportAlice.send).toHaveBeenCalledTimes(3);
        expect(transportAlice.send.calls.all()[0].args[0])
          .toMatch(new RegExp(`^INVITE ${ruri} SIP/2.0`));
        expect(transportAlice.send.calls.all()[1].args[0])
          .toMatch(new RegExp(`^CANCEL ${ruri} SIP/2.0`));
        expect(transportAlice.send.calls.all()[2].args[0])
          .toMatch(new RegExp(`^ACK ${ruri} SIP/2.0`));
      });

      it("Bob's UAS sends 100, 180, 200 and 487", () => {
        expect(transportBob.send).toHaveBeenCalledTimes(4);
        expect(transportBob.send.calls.all()[0].args[0])
          .toMatch(new RegExp(`^SIP/2.0 100 Trying`));
        expect(transportBob.send.calls.all()[1].args[0])
          .toMatch(new RegExp(`^SIP/2.0 180 Ringing`));
        expect(transportBob.send.calls.all()[2].args[0])
          .toMatch(new RegExp(`^SIP/2.0 200 OK`)); // response to the CANCEL
        expect(transportBob.send.calls.all()[3].args[0])
          .toMatch(new RegExp(`^SIP/2.0 487 Request Terminated`));
      });
    });

    describe("Alice wait (3x) and CANCEL. Bob accept. CANCEL wins. (async race)", () => {
      beforeEach((done) => {
        uaBobOnInvite = () => {
          contextBob.accept();
        };
        contextAlice = new InviteClientContext(uaAlice, ruri, { inviteWithoutSdp: true });
        contextAlice.invite();
        Promise.resolve().then(() =>
          Promise.resolve().then(() =>
            Promise.resolve().then(() => contextAlice.cancel())));
        setTimeout(() => done(), 100); // transport calls are async, so give it some time
      });

      it("Alice's UAC sends INVITE, CANCEL and ACK", () => {
        expect(transportAlice.send).toHaveBeenCalledTimes(3);
        expect(transportAlice.send.calls.all()[0].args[0])
          .toMatch(new RegExp(`^INVITE ${ruri} SIP/2.0`));
        expect(transportAlice.send.calls.all()[1].args[0])
          .toMatch(new RegExp(`^CANCEL ${ruri} SIP/2.0`));
        expect(transportAlice.send.calls.all()[2].args[0])
          .toMatch(new RegExp(`^ACK ${ruri} SIP/2.0`));
      });

      it("Bob's UAS sends 100, 180, 200 and 487", () => {
        expect(transportBob.send).toHaveBeenCalledTimes(4);
        expect(transportBob.send.calls.all()[0].args[0])
          .toMatch(new RegExp(`^SIP/2.0 100 Trying`));
        expect(transportBob.send.calls.all()[1].args[0])
          .toMatch(new RegExp(`^SIP/2.0 180 Ringing`));
        expect(transportBob.send.calls.all()[2].args[0])
          .toMatch(new RegExp(`^SIP/2.0 200 OK`)); // response to the CANCEL
        expect(transportBob.send.calls.all()[3].args[0])
          .toMatch(new RegExp(`^SIP/2.0 487 Request Terminated`));
      });
    });

    describe("Alice wait (5x). Bob accept. Alice CANCEL. Ok wins. (glare)", () => {
      beforeEach((done) => {
        uaBobOnInvite = () => {
          contextBob.accept();
        };
        contextAlice = new InviteClientContext(uaAlice, ruri, { inviteWithoutSdp: true });
        contextAlice.invite();
        Promise.resolve().then(() =>
          Promise.resolve().then(() =>
            Promise.resolve().then(() =>
              Promise.resolve().then(() =>
                Promise.resolve().then(() => contextAlice.cancel())))));
        setTimeout(() => done(), 100); // transport calls are async, so give it some time
      });

      it("Alice's UAC sends INVITE, CANCEL, ACK and BYE", () => {
        expect(transportAlice.send).toHaveBeenCalledTimes(4);
        expect(transportAlice.send.calls.all()[0].args[0])
          .toMatch(new RegExp(`^INVITE ${ruri} SIP/2.0`));
        expect(transportAlice.send.calls.all()[1].args[0])
          .toMatch(new RegExp(`^CANCEL ${ruri} SIP/2.0`));
        expect(transportAlice.send.calls.all()[2].args[0])
          .toMatch(new RegExp(`^ACK ${uaBob.contact.uri.toString()} SIP/2.0`));
        expect(transportAlice.send.calls.all()[3].args[0])
          .toMatch(new RegExp(`^BYE ${uaBob.contact.uri.toString()} SIP/2.0`));
      });

      it("Bob's UAS sends 100, 180, 200, 200 and BYE", () => {
        expect(transportBob.send).toHaveBeenCalledTimes(5);
        expect(transportBob.send.calls.all()[0].args[0])
          .toMatch(new RegExp(`^SIP/2.0 100 Trying`));
        expect(transportBob.send.calls.all()[1].args[0])
          .toMatch(new RegExp(`^SIP/2.0 180 Ringing`));
        expect(transportBob.send.calls.all()[2].args[0])
          .toMatch(new RegExp(`^SIP/2.0 200 OK`)); // response to the INVITE
        expect(transportBob.send.calls.all()[3].args[0])
          .toMatch(new RegExp(`^SIP/2.0 200 OK`)); // response to the CANCEL
        expect(transportBob.send.calls.all()[4].args[0])
          .toMatch(new RegExp(`^SIP/2.0 200 OK`)); // response to the BYE
      });
    });

    describe("Bob times out before responding. (Bob auto responds currently, so...)", () => {
      beforeEach((done) => {
        contextAlice = new InviteClientContext(uaAlice, ruri, { inviteWithoutSdp: true });
        contextAlice.invite();
        setTimeout(() => done(), 100); // transport calls are async, so give it some time
      });

      it("Alice's UAC sends an INVITE and ACK", () => {
        expect(transportAlice.send).toHaveBeenCalledTimes(2);
        expect(transportAlice.send.calls.all()[0].args[0])
          .toMatch(new RegExp(`^INVITE ${ruri} SIP/2.0`));
        expect(transportAlice.send.calls.all()[1].args[0])
          .toMatch(new RegExp(`^ACK ${ruri} SIP/2.0`));
      });

      it("Bob's UAS sends 100, 180 and 408", () => {
        expect(transportBob.send).toHaveBeenCalledTimes(3);
        expect(transportBob.send.calls.all()[0].args[0])
          .toMatch(new RegExp(`^SIP/2.0 100 Trying`));
        expect(transportBob.send.calls.all()[1].args[0])
          .toMatch(new RegExp(`^SIP/2.0 180 Ringing`));
        expect(transportBob.send.calls.all()[2].args[0])
          .toMatch(new RegExp(`^SIP/2.0 408 Request Timeout`));
      });

      it("Alice's Session to be undefined", () => {
        expect(contextAlice.session).toBe(undefined);
      });

      it("Bob's Session to be undefined (but it is defined because of the auto response)", () => {
        expect(contextBob.session).not.toBe(undefined);
      });
    });

    describe("Bob accept.", () => {
      beforeEach((done) => {
        uaBobOnInvite = () => {
          contextBob.accept();
        };
        contextAlice = new InviteClientContext(uaAlice, ruri, { inviteWithoutSdp: true });
        contextAlice.invite();
        setTimeout(() => done(), 20); // transport calls are async, so give it some time
      });

      it("Alice's UAC sends an INVITE and ACK", () => {
        expect(transportAlice.send).toHaveBeenCalledTimes(2);
        expect(transportAlice.send.calls.all()[0].args[0])
          .toMatch(new RegExp(`^INVITE ${ruri} SIP/2.0`));
        expect(transportAlice.send.calls.all()[1].args[0])
          .toMatch(new RegExp(`^ACK ${uaBob.contact.uri.toString()} SIP/2.0`));
      });

      it("Bob's UAS sends 100, 180 and 200", () => {
        expect(transportBob.send).toHaveBeenCalledTimes(3);
        expect(transportBob.send.calls.all()[0].args[0])
          .toMatch(new RegExp(`^SIP/2.0 100 Trying`));
        expect(transportBob.send.calls.all()[1].args[0])
          .toMatch(new RegExp(`^SIP/2.0 180 Ringing`));
        expect(transportBob.send.calls.all()[2].args[0])
          .toMatch(new RegExp(`^SIP/2.0 200 OK`));
      });

      it("Alice's Session is 'confirmed' and 'stable'", () => {
        expect(contextAlice.session && contextAlice.session.sessionState).toBe(SessionState.Confirmed);
        expect(contextAlice.session && contextAlice.session.signalingState).toBe(SignalingState.Stable);
      });

      it("Bob's Session is 'confirmed' and 'stable'", () => {
        expect(contextBob.session && contextBob.session.sessionState).toBe(SessionState.Confirmed);
        expect(contextBob.session && contextBob.session.signalingState).toBe(SignalingState.Stable);
      });
    });

    describe("Bob wait and accept.", () => {
      beforeEach((done) => {
        uaBobOnInvite = () => {
          Promise.resolve().then(() => contextBob.accept());
        };
        contextAlice = new InviteClientContext(uaAlice, ruri, { inviteWithoutSdp: true });
        contextAlice.invite();
        setTimeout(() => done(), 20); // transport calls are async, so give it some time
      });

      it("Alice's UAC sends an INVITE and ACK", () => {
        expect(transportAlice.send).toHaveBeenCalledTimes(2);
        expect(transportAlice.send.calls.all()[0].args[0])
          .toMatch(new RegExp(`^INVITE ${ruri} SIP/2.0`));
        expect(transportAlice.send.calls.all()[1].args[0])
          .toMatch(new RegExp(`^ACK ${uaBob.contact.uri.toString()} SIP/2.0`));
      });

      it("Bob's UAS sends 100, 180, 180 and 200", () => {
        expect(transportBob.send).toHaveBeenCalledTimes(3);
        expect(transportBob.send.calls.all()[0].args[0])
          .toMatch(new RegExp(`^SIP/2.0 100 Trying`));
        expect(transportBob.send.calls.all()[1].args[0])
          .toMatch(new RegExp(`^SIP/2.0 180 Ringing`));
        expect(transportBob.send.calls.all()[2].args[0])
          .toMatch(new RegExp(`^SIP/2.0 200 OK`));
      });

      it("Alice's Session is 'confirmed' and 'stable'", () => {
        expect(contextAlice.session && contextAlice.session.sessionState).toBe(SessionState.Confirmed);
        expect(contextAlice.session && contextAlice.session.signalingState).toBe(SignalingState.Stable);
      });

      it("Bob's Session is 'confirmed' and 'stable'", () => {
        expect(contextBob.session && contextBob.session.sessionState).toBe(SessionState.Confirmed);
        expect(contextBob.session && contextBob.session.signalingState).toBe(SignalingState.Stable);
      });
    });

    describe("Bob progress and accept.", () => {
      beforeEach((done) => {
        uaBobOnInvite = () => {
          contextBob.progress();
          contextBob.accept();
        };
        contextAlice = new InviteClientContext(uaAlice, ruri, { inviteWithoutSdp: true });
        contextAlice.invite();
        setTimeout(() => done(), 20); // transport calls are async, so give it some time
      });

      it("Alice's UAC sends an INVITE and ACK", () => {
        expect(transportAlice.send).toHaveBeenCalledTimes(2);
        expect(transportAlice.send.calls.all()[0].args[0])
          .toMatch(new RegExp(`^INVITE ${ruri} SIP/2.0`));
        expect(transportAlice.send.calls.all()[1].args[0])
          .toMatch(new RegExp(`^ACK ${uaBob.contact.uri.toString()} SIP/2.0`));
      });

      it("Bob's UAS sends 100, 180, 180 and 200", () => {
        expect(transportBob.send).toHaveBeenCalledTimes(4);
        expect(transportBob.send.calls.all()[0].args[0])
          .toMatch(new RegExp(`^SIP/2.0 100 Trying`));
        expect(transportBob.send.calls.all()[1].args[0])
          .toMatch(new RegExp(`^SIP/2.0 180 Ringing`));
        expect(transportBob.send.calls.all()[2].args[0])
          .toMatch(new RegExp(`^SIP/2.0 180 Ringing`));
        expect(transportBob.send.calls.all()[3].args[0])
          .toMatch(new RegExp(`^SIP/2.0 200 OK`));
      });

      it("Alice's Session is 'confirmed' and 'stable'", () => {
        expect(contextAlice.session && contextAlice.session.sessionState).toBe(SessionState.Confirmed);
        expect(contextAlice.session && contextAlice.session.signalingState).toBe(SignalingState.Stable);
      });

      it("Bob's Session is 'confirmed' and 'stable'", () => {
        expect(contextBob.session && contextBob.session.sessionState).toBe(SessionState.Confirmed);
        expect(contextBob.session && contextBob.session.signalingState).toBe(SignalingState.Stable);
      });
    });

    describe("Bob wait, progress and accept.", () => {
      beforeEach((done) => {
        uaBobOnInvite = () => {
          Promise.resolve().then(() => {
            contextBob.progress();
            contextBob.accept();
          });
        };
        contextAlice = new InviteClientContext(uaAlice, ruri, { inviteWithoutSdp: true });
        contextAlice.invite();
        setTimeout(() => done(), 20); // transport calls are async, so give it some time
      });

      it("Alice's UAC sends an INVITE and ACK", () => {
        expect(transportAlice.send).toHaveBeenCalledTimes(2);
        expect(transportAlice.send.calls.all()[0].args[0])
          .toMatch(new RegExp(`^INVITE ${ruri} SIP/2.0`));
        expect(transportAlice.send.calls.all()[1].args[0])
          .toMatch(new RegExp(`^ACK ${uaBob.contact.uri.toString()} SIP/2.0`));
      });

      it("Bob's UAS sends 100, 180, 180 and 200", () => {
        expect(transportBob.send).toHaveBeenCalledTimes(4);
        expect(transportBob.send.calls.all()[0].args[0])
          .toMatch(new RegExp(`^SIP/2.0 100 Trying`));
        expect(transportBob.send.calls.all()[1].args[0])
          .toMatch(new RegExp(`^SIP/2.0 180 Ringing`));
        expect(transportBob.send.calls.all()[2].args[0])
          .toMatch(new RegExp(`^SIP/2.0 180 Ringing`));
        expect(transportBob.send.calls.all()[3].args[0])
          .toMatch(new RegExp(`^SIP/2.0 200 OK`));
      });

      it("Alice's Session is 'confirmed' and 'stable'", () => {
        expect(contextAlice.session && contextAlice.session.sessionState).toBe(SessionState.Confirmed);
        expect(contextAlice.session && contextAlice.session.signalingState).toBe(SignalingState.Stable);
      });

      it("Bob's Session is 'confirmed' and 'stable'", () => {
        expect(contextBob.session && contextBob.session.sessionState).toBe(SessionState.Confirmed);
        expect(contextBob.session && contextBob.session.signalingState).toBe(SignalingState.Stable);
      });
    });

    describe("Bob progress, wait and accept.", () => {
      beforeEach((done) => {
        uaBobOnInvite = () => {
          contextBob.progress();
          Promise.resolve().then(() => contextBob.accept());
        };
        contextAlice = new InviteClientContext(uaAlice, ruri, { inviteWithoutSdp: true });
        contextAlice.invite();
        setTimeout(() => done(), 20); // transport calls are async, so give it some time
      });

      it("Alice's UAC sends an INVITE and ACK", () => {
        expect(transportAlice.send).toHaveBeenCalledTimes(2);
        expect(transportAlice.send.calls.all()[0].args[0])
          .toMatch(new RegExp(`^INVITE ${ruri} SIP/2.0`));
        expect(transportAlice.send.calls.all()[1].args[0])
          .toMatch(new RegExp(`^ACK ${uaBob.contact.uri.toString()} SIP/2.0`));
      });

      it("Bob's UAS sends 100, 180, 180 and 200", () => {
        expect(transportBob.send).toHaveBeenCalledTimes(4);
        expect(transportBob.send.calls.all()[0].args[0])
          .toMatch(new RegExp(`^SIP/2.0 100 Trying`));
        expect(transportBob.send.calls.all()[1].args[0])
          .toMatch(new RegExp(`^SIP/2.0 180 Ringing`));
        expect(transportBob.send.calls.all()[2].args[0])
          .toMatch(new RegExp(`^SIP/2.0 180 Ringing`));
        expect(transportBob.send.calls.all()[3].args[0])
          .toMatch(new RegExp(`^SIP/2.0 200 OK`));
      });

      it("Alice's Session is 'confirmed' and 'stable'", () => {
        expect(contextAlice.session && contextAlice.session.sessionState).toBe(SessionState.Confirmed);
        expect(contextAlice.session && contextAlice.session.signalingState).toBe(SignalingState.Stable);
      });

      it("Bob's Session is 'confirmed' and 'stable'", () => {
        expect(contextBob.session && contextBob.session.sessionState).toBe(SessionState.Confirmed);
        expect(contextBob.session && contextBob.session.signalingState).toBe(SignalingState.Stable);
      });
    });

    describe("Bob reliable progress and accept.", () => {
      beforeEach((done) => {
        uaBobOnInvite = () => {
          contextBob.progress({ rel100: true });
          contextBob.accept();
        };
        contextAlice = new InviteClientContext(uaAlice, ruri, { inviteWithoutSdp: true });
        contextAlice.invite();
        setTimeout(() => done(), 20); // transport calls are async, so give it some time
      });

      it("Alice's UAC sends an INVITE, PRACK, and ACK", () => {
        expect(transportAlice.send).toHaveBeenCalledTimes(3);
        expect(transportAlice.send.calls.all()[0].args[0])
          .toMatch(new RegExp(`^INVITE ${ruri} SIP/2.0`));
        expect(transportAlice.send.calls.all()[1].args[0])
          .toMatch(new RegExp(`^PRACK ${uaBob.contact.uri.toString()} SIP/2.0`));
        expect(transportAlice.send.calls.all()[2].args[0])
          .toMatch(new RegExp(`^ACK ${uaBob.contact.uri.toString()} SIP/2.0`));
      });

      it("Bob's UAS sends 100, 180, 183, 200 and 200", () => {
        expect(transportBob.send).toHaveBeenCalledTimes(5);
        expect(transportBob.send.calls.all()[0].args[0])
          .toMatch(new RegExp(`^SIP/2.0 100 Trying`));
        expect(transportBob.send.calls.all()[1].args[0])
          .toMatch(new RegExp(`^SIP/2.0 180 Ringing`));
        expect(transportBob.send.calls.all()[2].args[0])
          .toMatch(new RegExp(`^SIP/2.0 183 Session Progress`));
        expect(transportBob.send.calls.all()[3].args[0])
          .toMatch(new RegExp(`^SIP/2.0 200 OK`));
        expect(transportBob.send.calls.all()[4].args[0])
          .toMatch(new RegExp(`^SIP/2.0 200 OK`));
      });

      it("Alice's Session is 'confirmed' and 'stable'", () => {
        expect(contextAlice.session && contextAlice.session.sessionState).toBe(SessionState.Confirmed);
        expect(contextAlice.session && contextAlice.session.signalingState).toBe(SignalingState.Stable);
      });

      it("Bob's Session is 'confirmed' and 'stable'", () => {
        expect(contextBob.session && contextBob.session.sessionState).toBe(SessionState.Confirmed);
        expect(contextBob.session && contextBob.session.signalingState).toBe(SignalingState.Stable);
      });
    });

    describe("Bob wait, reliable progress and accept.", () => {
      beforeEach((done) => {
        uaBobOnInvite = () => {
          Promise.resolve().then(() => {
            contextBob.progress({ rel100: true });
            contextBob.accept();
          });
        };
        contextAlice = new InviteClientContext(uaAlice, ruri, { inviteWithoutSdp: true });
        contextAlice.invite();
        setTimeout(() => done(), 20); // transport calls are async, so give it some time
      });

      it("Alice's UAC sends an INVITE, PRACK and ACK", () => {
        expect(transportAlice.send).toHaveBeenCalledTimes(3);
        expect(transportAlice.send.calls.all()[0].args[0])
          .toMatch(new RegExp(`^INVITE ${ruri} SIP/2.0`));
        expect(transportAlice.send.calls.all()[1].args[0])
          .toMatch(new RegExp(`^PRACK ${uaBob.contact.uri.toString()} SIP/2.0`));
        expect(transportAlice.send.calls.all()[2].args[0])
          .toMatch(new RegExp(`^ACK ${uaBob.contact.uri.toString()} SIP/2.0`));
      });

      it("Bob's UAS sends 100, 180, 183, 200 and 200", () => {
        expect(transportBob.send).toHaveBeenCalledTimes(5);
        expect(transportBob.send.calls.all()[0].args[0])
          .toMatch(new RegExp(`^SIP/2.0 100 Trying`));
        expect(transportBob.send.calls.all()[1].args[0])
          .toMatch(new RegExp(`^SIP/2.0 180 Ringing`));
        expect(transportBob.send.calls.all()[2].args[0])
          .toMatch(new RegExp(`^SIP/2.0 183 Session Progress`));
        expect(transportBob.send.calls.all()[4].args[0])
          .toMatch(new RegExp(`^SIP/2.0 200 OK`));
      });

      it("Alice's Session is 'confirmed' and 'stable'", () => {
        expect(contextAlice.session && contextAlice.session.sessionState).toBe(SessionState.Confirmed);
        expect(contextAlice.session && contextAlice.session.signalingState).toBe(SignalingState.Stable);
      });

      it("Bob's Session is 'confirmed' and 'stable'", () => {
        expect(contextBob.session && contextBob.session.sessionState).toBe(SessionState.Confirmed);
        expect(contextBob.session && contextBob.session.signalingState).toBe(SignalingState.Stable);
      });
    });

    describe("Bob reliable progress, wait and accept.", () => {
      beforeEach((done) => {
        uaBobOnInvite = () => {
          contextBob.progress({ rel100: true });
          Promise.resolve().then(() => contextBob.accept());
        };
        contextAlice = new InviteClientContext(uaAlice, ruri, { inviteWithoutSdp: true });
        contextAlice.invite();
        setTimeout(() => done(), 20); // transport calls are async, so give it some time
      });

      it("Alice's UAC sends an INVITE, PRACK and ACK", () => {
        expect(transportAlice.send).toHaveBeenCalledTimes(3);
        expect(transportAlice.send.calls.all()[0].args[0])
          .toMatch(new RegExp(`^INVITE ${ruri} SIP/2.0`));
        expect(transportAlice.send.calls.all()[1].args[0])
          .toMatch(new RegExp(`^PRACK ${uaBob.contact.uri.toString()} SIP/2.0`));
        expect(transportAlice.send.calls.all()[2].args[0])
          .toMatch(new RegExp(`^ACK ${uaBob.contact.uri.toString()} SIP/2.0`));
      });

      it("Bob's UAS sends 100, 180, 183, 200 and 200", () => {
        expect(transportBob.send).toHaveBeenCalledTimes(5);
        expect(transportBob.send.calls.all()[0].args[0])
          .toMatch(new RegExp(`^SIP/2.0 100 Trying`));
        expect(transportBob.send.calls.all()[1].args[0])
          .toMatch(new RegExp(`^SIP/2.0 180 Ringing`));
        expect(transportBob.send.calls.all()[2].args[0])
          .toMatch(new RegExp(`^SIP/2.0 183 Session Progress`));
        expect(transportBob.send.calls.all()[4].args[0])
          .toMatch(new RegExp(`^SIP/2.0 200 OK`));
      });

      it("Alice's Session is 'confirmed' and 'stable'", () => {
        expect(contextAlice.session && contextAlice.session.sessionState).toBe(SessionState.Confirmed);
        expect(contextAlice.session && contextAlice.session.signalingState).toBe(SignalingState.Stable);
      });

      it("Bob's Session is 'confirmed' and 'stable'", () => {
        expect(contextBob.session && contextBob.session.sessionState).toBe(SessionState.Confirmed);
        expect(contextBob.session && contextBob.session.signalingState).toBe(SignalingState.Stable);
      });
    });

    describe("Bob reliable progress (2x) and accept.", () => {
      beforeEach((done) => {
        uaBobOnInvite = () => {
          contextBob.progress({ rel100: true });
          contextBob.progress({ rel100: true });
          contextBob.accept();
        };
        contextAlice = new InviteClientContext(uaAlice, ruri, { inviteWithoutSdp: true });
        contextAlice.invite();
        setTimeout(() => done(), 20); // transport calls are async, so give it some time
      });

      it("Alice's UAC sends an INVITE, PRACK and ACK", () => {
        expect(transportAlice.send).toHaveBeenCalledTimes(3);
        expect(transportAlice.send.calls.all()[0].args[0])
          .toMatch(new RegExp(`^INVITE ${ruri} SIP/2.0`));
        expect(transportAlice.send.calls.all()[1].args[0])
          .toMatch(new RegExp(`^PRACK ${uaBob.contact.uri.toString()} SIP/2.0`));
        expect(transportAlice.send.calls.all()[2].args[0])
          .toMatch(new RegExp(`^ACK ${uaBob.contact.uri.toString()} SIP/2.0`));
      });

      it("Bob's UAS sends 100, 180, 183, 200 and 200", () => {
        expect(transportBob.send).toHaveBeenCalledTimes(5);
        expect(transportBob.send.calls.all()[0].args[0])
          .toMatch(new RegExp(`^SIP/2.0 100 Trying`));
        expect(transportBob.send.calls.all()[1].args[0])
          .toMatch(new RegExp(`^SIP/2.0 180 Ringing`));
        expect(transportBob.send.calls.all()[2].args[0])
          .toMatch(new RegExp(`^SIP/2.0 183 Session Progress`));
        expect(transportBob.send.calls.all()[3].args[0])
          .toMatch(new RegExp(`^SIP/2.0 200 OK`));
        expect(transportBob.send.calls.all()[4].args[0])
          .toMatch(new RegExp(`^SIP/2.0 200 OK`));
      });

      it("Alice's Session is 'confirmed' and 'stable'", () => {
        expect(contextAlice.session && contextAlice.session.sessionState).toBe(SessionState.Confirmed);
        expect(contextAlice.session && contextAlice.session.signalingState).toBe(SignalingState.Stable);
      });

      it("Bob's Session is 'confirmed' and 'stable'", () => {
        expect(contextBob.session && contextBob.session.sessionState).toBe(SessionState.Confirmed);
        expect(contextBob.session && contextBob.session.signalingState).toBe(SignalingState.Stable);
      });
    });

    describe("Bob 183 progress, 180 progress and accept.", () => {
      beforeEach((done) => {
        uaBobOnInvite = () => {
          contextBob.progress({ statusCode: 183 });
          contextBob.progress();
          contextBob.accept();
        };
        contextAlice = new InviteClientContext(uaAlice, ruri, { inviteWithoutSdp: true });
        contextAlice.invite();
        setTimeout(() => done(), 20); // transport calls are async, so give it some time
      });

      it("Alice's UAC sends an INVITE, PRACK and ACK", () => {
        expect(transportAlice.send).toHaveBeenCalledTimes(2);
        expect(transportAlice.send.calls.all()[0].args[0])
          .toMatch(new RegExp(`^INVITE ${ruri} SIP/2.0`));
        expect(transportAlice.send.calls.all()[1].args[0])
          .toMatch(new RegExp(`^ACK ${uaBob.contact.uri.toString()} SIP/2.0`));
      });

      it("Bob's UAS sends 100, 180, 183, 180 and 200", () => {
        expect(transportBob.send).toHaveBeenCalledTimes(5);
        expect(transportBob.send.calls.all()[0].args[0])
          .toMatch(new RegExp(`^SIP/2.0 100 Trying`));
        expect(transportBob.send.calls.all()[1].args[0])
          .toMatch(new RegExp(`^SIP/2.0 180 Ringing`));
        expect(transportBob.send.calls.all()[2].args[0])
          .toMatch(new RegExp(`^SIP/2.0 183 Session Progress`));
        expect(transportBob.send.calls.all()[3].args[0])
          .toMatch(new RegExp(`^SIP/2.0 180 Ringing`));
        expect(transportBob.send.calls.all()[4].args[0])
          .toMatch(new RegExp(`^SIP/2.0 200 OK`));
      });

      it("Alice's Session is 'confirmed' and 'stable'", () => {
        expect(contextAlice.session && contextAlice.session.sessionState).toBe(SessionState.Confirmed);
        expect(contextAlice.session && contextAlice.session.signalingState).toBe(SignalingState.Stable);
      });

      it("Bob's Session is 'confirmed' and 'stable'", () => {
        expect(contextBob.session && contextBob.session.sessionState).toBe(SessionState.Confirmed);
        expect(contextBob.session && contextBob.session.signalingState).toBe(SignalingState.Stable);
      });
    });
  });

  describe("Forking...", () => {
    let configurationBob2: UserAgentCoreConfiguration;
    let contextBob2: InviteServerContext;
    let coreBob2: UserAgentCore;
    let transportBob2: jasmine.SpyObj<Transport>;
    let uaBob2: UA;
    let uaBob2OnInvite: () => void;

    // Setup Alice's InviteClientContext with transport wired to Bob and Bob2
    beforeEach(() => {
      transportBob2 = makeMockTransport();
      uaBob2 = makeMockUA(userBob, domainBob, displayNameBob + "2", transportBob2);
      uaBob2OnInvite = () => { return; };
      connectTransportToUAFork(transportAlice, uaBob, uaBob2);
      connectTransportToUA(transportBob2, uaAlice);
      configurationBob2 = makeUserAgentCoreConfigurationFromUA(uaBob2);
      coreBob2 = new UserAgentCore(configurationBob2, {
        onInvite: (incomingInviteRequest: IncomingInviteRequest): void => {
          // Automatically send 100 Trying to mirror current UA behavior
          incomingInviteRequest.trying();
          incomingInviteRequest.delegate = {
            onCancel: (cancel: IncomingRequestMessage): void => {
              contextBob2.receiveRequest(cancel);
            },
            onTransportError: (error: Exceptions.TransportError): void => {
              contextBob2.onTransportError();
            }
          };
          contextBob2 = new InviteServerContext(uaBob2, incomingInviteRequest);
          // Automatically making first call to progress mirrors current UA behavior.
          if (contextBob2.autoSendAnInitialProvisionalResponse) {
            contextBob2.progress();
          }
          if (uaBob2OnInvite) {
            uaBob2OnInvite();
          }
        }
      });
      uaBob2.configuration.sessionDescriptionHandlerFactory = makeMockSessionDescriptionHandlerFactory(userBob + "2");
      uaBob2.userAgentCore = coreBob2;
    });

    afterEach(() => {
      coreBob2.dispose();
      uaBob2OnInvite = () => { return; };
    });

    describe("Alice invite Bob with offer.", () => {
      let ruri: URI;

      beforeEach(() => {
        ruri = new URI("sip", userBob, domainBob, undefined);
        uaBob.configuration.noAnswerTimeout = 90;
      });

      describe("Bob & Bob2 accept.", () => {
        beforeEach((done) => {
          uaBobOnInvite = () => {
            contextBob.accept();
          };
          uaBob2OnInvite = () => {
            contextBob2.accept();
          };
          contextAlice = new InviteClientContext(uaAlice, ruri);
          contextAlice.invite();
          setTimeout(() => done(), 100); // transport calls are async, so give it some time
        });

        it("Alice's UAC sends an INVITE, ACK, BYE and ACK", () => {
          expect(transportAlice.send).toHaveBeenCalledTimes(4);
          expect(transportAlice.send.calls.all()[0].args[0])
            .toMatch(new RegExp(`^INVITE ${ruri} SIP/2.0`));
          expect(transportAlice.send.calls.all()[1].args[0])
            .toMatch(new RegExp(`^ACK ${uaBob2.contact.uri.toString()} SIP/2.0`));
          expect(transportAlice.send.calls.all()[2].args[0])
            .toMatch(new RegExp(`^BYE ${uaBob2.contact.uri.toString()} SIP/2.0`));
          expect(transportAlice.send.calls.all()[3].args[0])
            .toMatch(new RegExp(`^ACK ${uaBob.contact.uri.toString()} SIP/2.0`));
        });

        it("Bob's UAS sends 100, 180 and 200", () => {
          expect(transportBob.send).toHaveBeenCalledTimes(3);
          expect(transportBob.send.calls.all()[0].args[0])
            .toMatch(new RegExp(`^SIP/2.0 100 Trying`));
          expect(transportBob.send.calls.all()[1].args[0])
            .toMatch(new RegExp(`^SIP/2.0 180 Ringing`));
          expect(transportBob.send.calls.all()[2].args[0])
            .toMatch(new RegExp(`^SIP/2.0 200 OK`));
        });

        it("Bob2's UAS sends 100, 180, 200 and 200", () => {
          expect(transportBob2.send).toHaveBeenCalledTimes(4);
          expect(transportBob2.send.calls.all()[0].args[0])
            .toMatch(new RegExp(`^SIP/2.0 100 Trying`));
          expect(transportBob.send.calls.all()[1].args[0])
            .toMatch(new RegExp(`^SIP/2.0 180 Ringing`));
          expect(transportBob2.send.calls.all()[2].args[0])
            .toMatch(new RegExp(`^SIP/2.0 200 OK`));
          expect(transportBob2.send.calls.all()[3].args[0])
            .toMatch(new RegExp(`^SIP/2.0 200 OK`));
        });

        it("Alice's Session is 'confirmed' and 'stable'", () => {
          expect(contextAlice.session && contextAlice.session.sessionState).toBe(SessionState.Confirmed);
          expect(contextAlice.session && contextAlice.session.signalingState).toBe(SignalingState.Stable);
        });

        it("Bob's Session is 'confirmed' and 'stable'", () => {
          expect(contextBob.session && contextBob.session.sessionState).toBe(SessionState.Confirmed);
          expect(contextBob.session && contextBob.session.signalingState).toBe(SignalingState.Stable);
        });

        it("Bob2's Session is 'terminated' and 'closed'", () => {
          expect(contextBob2.session && contextBob2.session.sessionState).toBe(SessionState.Terminated);
          expect(contextBob2.session && contextBob2.session.signalingState).toBe(SignalingState.Closed);
        });
      });

      describe("Bob & Bob2 wait, reliable progress and accept.", () => {
        beforeEach((done) => {
          uaBobOnInvite = () => {
            Promise.resolve().then(() => {
              contextBob.progress({ rel100: true });
              contextBob.accept();
            });
          };
          uaBob2OnInvite = () => {
            Promise.resolve().then(() => {
              contextBob2.progress({ rel100: true });
              contextBob2.accept();
            });
          };
          contextAlice = new InviteClientContext(uaAlice, ruri);
          contextAlice.invite();
          setTimeout(() => done(), 100); // transport calls are async, so give it some time
        });

        it("Alice's UAC sends an INVITE, PRACK, PRACK, ACK, BYE and ACK", () => {
          expect(transportAlice.send).toHaveBeenCalledTimes(6);
          expect(transportAlice.send.calls.all()[0].args[0])
            .toMatch(new RegExp(`^INVITE ${ruri} SIP/2.0`));
          expect(transportAlice.send.calls.all()[1].args[0])
            .toMatch(new RegExp(`^PRACK ${uaBob.contact.uri.toString()} SIP/2.0`));
          expect(transportAlice.send.calls.all()[2].args[0])
            .toMatch(new RegExp(`^PRACK ${uaBob2.contact.uri.toString()} SIP/2.0`));
          expect(transportAlice.send.calls.all()[3].args[0])
            .toMatch(new RegExp(`^ACK ${uaBob2.contact.uri.toString()} SIP/2.0`));
          expect(transportAlice.send.calls.all()[4].args[0])
            .toMatch(new RegExp(`^BYE ${uaBob2.contact.uri.toString()} SIP/2.0`));
          expect(transportAlice.send.calls.all()[5].args[0])
            .toMatch(new RegExp(`^ACK ${uaBob.contact.uri.toString()} SIP/2.0`));
        });

        it("Bob's UAS sends 100, 180, 183, 200 and 200", () => {
          expect(transportBob.send).toHaveBeenCalledTimes(5);
          expect(transportBob.send.calls.all()[0].args[0])
            .toMatch(new RegExp(`^SIP/2.0 100 Trying`));
          expect(transportBob.send.calls.all()[1].args[0])
            .toMatch(new RegExp(`^SIP/2.0 180 Ringing`));
          expect(transportBob.send.calls.all()[2].args[0])
            .toMatch(new RegExp(`^SIP/2.0 183 Session Progress`));
          expect(transportBob.send.calls.all()[3].args[0])
            .toMatch(new RegExp(`^SIP/2.0 200 OK`));
          expect(transportBob.send.calls.all()[4].args[0])
            .toMatch(new RegExp(`^SIP/2.0 200 OK`));
        });

        it("Bob2's UAS sends 100, 180, 183, 200, 200 and 200", () => {
          expect(transportBob2.send).toHaveBeenCalledTimes(6);
          expect(transportBob2.send.calls.all()[0].args[0])
            .toMatch(new RegExp(`^SIP/2.0 100 Trying`));
          expect(transportBob2.send.calls.all()[1].args[0])
            .toMatch(new RegExp(`^SIP/2.0 180 Ringing`));
          expect(transportBob2.send.calls.all()[2].args[0])
            .toMatch(new RegExp(`^SIP/2.0 183 Session Progress`));
          expect(transportBob2.send.calls.all()[3].args[0])
            .toMatch(new RegExp(`^SIP/2.0 200 OK`));
          expect(transportBob2.send.calls.all()[4].args[0])
            .toMatch(new RegExp(`^SIP/2.0 200 OK`));
          expect(transportBob2.send.calls.all()[5].args[0])
            .toMatch(new RegExp(`^SIP/2.0 200 OK`));
        });

        it("Alice's Session is 'confirmed' and 'stable'", () => {
          expect(contextAlice.session && contextAlice.session.sessionState).toBe(SessionState.Confirmed);
          expect(contextAlice.session && contextAlice.session.signalingState).toBe(SignalingState.Stable);
        });

        it("Bob's Session is 'confirmed' and 'stable'", () => {
          expect(contextBob.session && contextBob.session.sessionState).toBe(SessionState.Confirmed);
          expect(contextBob.session && contextBob.session.signalingState).toBe(SignalingState.Stable);
        });

        it("Bob2's Session is 'terminated' and 'closed'", () => {
          expect(contextBob2.session && contextBob2.session.sessionState).toBe(SessionState.Terminated);
          expect(contextBob2.session && contextBob2.session.signalingState).toBe(SignalingState.Closed);
        });
      });
    });

    describe("Alice invite Bob without offer.", () => {
      let ruri: URI;

      beforeEach(() => {
        ruri = new URI("sip", userBob, domainBob, undefined);
        uaBob.configuration.noAnswerTimeout = 90;
      });

      describe("Bob & Bob2 accept.", () => {
        beforeEach((done) => {
          uaBobOnInvite = () => {
            contextBob.accept();
          };
          uaBob2OnInvite = () => {
            contextBob2.accept();
          };
          contextAlice = new InviteClientContext(uaAlice, ruri, { inviteWithoutSdp: true });
          contextAlice.invite();
          setTimeout(() => done(), 100); // transport calls are async, so give it some time
        });

        it("Alice's UAC sends an INVITE, ACK, BYE and ACK", () => {
          expect(transportAlice.send).toHaveBeenCalledTimes(4);
          expect(transportAlice.send.calls.all()[0].args[0])
            .toMatch(new RegExp(`^INVITE ${ruri} SIP/2.0`));
          expect(transportAlice.send.calls.all()[1].args[0])
            .toMatch(new RegExp(`^ACK ${uaBob2.contact.uri.toString()} SIP/2.0`));
          expect(transportAlice.send.calls.all()[2].args[0])
            .toMatch(new RegExp(`^BYE ${uaBob2.contact.uri.toString()} SIP/2.0`));
          expect(transportAlice.send.calls.all()[3].args[0])
            .toMatch(new RegExp(`^ACK ${uaBob.contact.uri.toString()} SIP/2.0`));
        });

        it("Bob's UAS sends 100, 180 and 200", () => {
          expect(transportBob.send).toHaveBeenCalledTimes(3);
          expect(transportBob.send.calls.all()[0].args[0])
            .toMatch(new RegExp(`^SIP/2.0 100 Trying`));
          expect(transportBob.send.calls.all()[1].args[0])
            .toMatch(new RegExp(`^SIP/2.0 180 Ringing`));
          expect(transportBob.send.calls.all()[2].args[0])
            .toMatch(new RegExp(`^SIP/2.0 200 OK`));
        });

        it("Bob2's UAS sends 100, 180, 200 and 200", () => {
          expect(transportBob2.send).toHaveBeenCalledTimes(4);
          expect(transportBob2.send.calls.all()[0].args[0])
            .toMatch(new RegExp(`^SIP/2.0 100 Trying`));
          expect(transportBob.send.calls.all()[1].args[0])
            .toMatch(new RegExp(`^SIP/2.0 180 Ringing`));
          expect(transportBob2.send.calls.all()[2].args[0])
            .toMatch(new RegExp(`^SIP/2.0 200 OK`));
          expect(transportBob2.send.calls.all()[3].args[0])
            .toMatch(new RegExp(`^SIP/2.0 200 OK`));
        });

        it("Alice's Session is 'confirmed' and 'stable'", () => {
          expect(contextAlice.session && contextAlice.session.sessionState).toBe(SessionState.Confirmed);
          expect(contextAlice.session && contextAlice.session.signalingState).toBe(SignalingState.Stable);
        });

        it("Bob's Session is 'confirmed' and 'stable'", () => {
          expect(contextBob.session && contextBob.session.sessionState).toBe(SessionState.Confirmed);
          expect(contextBob.session && contextBob.session.signalingState).toBe(SignalingState.Stable);
        });

        it("Bob2's Session is 'terminated' and 'closed'", () => {
          expect(contextBob2.session && contextBob2.session.sessionState).toBe(SessionState.Terminated);
          expect(contextBob2.session && contextBob2.session.signalingState).toBe(SignalingState.Closed);
        });
      });

      describe("Bob & Bob2 wait, reliable progress and accept.", () => {
        beforeEach((done) => {
          uaBobOnInvite = () => {
            Promise.resolve().then(() => {
              contextBob.progress({ rel100: true });
              contextBob.accept();
            });
          };
          uaBob2OnInvite = () => {
            Promise.resolve().then(() => {
              contextBob2.progress({ rel100: true });
              contextBob2.accept();
            });
          };
          contextAlice = new InviteClientContext(uaAlice, ruri, { inviteWithoutSdp: true });
          contextAlice.invite();
          setTimeout(() => done(), 100); // transport calls are async, so give it some time
        });

        it("Alice's UAC sends an INVITE, PRACK, PRACK, ACK, ACK and BYE", () => {
          expect(transportAlice.send).toHaveBeenCalledTimes(6);
          expect(transportAlice.send.calls.all()[0].args[0])
            .toMatch(new RegExp(`^INVITE ${ruri} SIP/2.0`));
          expect(transportAlice.send.calls.all()[1].args[0])
            .toMatch(new RegExp(`^PRACK ${uaBob.contact.uri.toString()} SIP/2.0`));
          expect(transportAlice.send.calls.all()[2].args[0])
            .toMatch(new RegExp(`^PRACK ${uaBob2.contact.uri.toString()} SIP/2.0`));
          expect(transportAlice.send.calls.all()[3].args[0])
            .toMatch(new RegExp(`^ACK ${uaBob.contact.uri.toString()} SIP/2.0`));
          expect(transportAlice.send.calls.all()[4].args[0])
            .toMatch(new RegExp(`^ACK ${uaBob2.contact.uri.toString()} SIP/2.0`));
          expect(transportAlice.send.calls.all()[5].args[0])
            .toMatch(new RegExp(`^BYE ${uaBob2.contact.uri.toString()} SIP/2.0`));
        });

        it("Bob's UAS sends 100, 180, 183, 200 and 200", () => {
          expect(transportBob.send).toHaveBeenCalledTimes(5);
          expect(transportBob.send.calls.all()[0].args[0])
            .toMatch(new RegExp(`^SIP/2.0 100 Trying`));
          expect(transportBob.send.calls.all()[1].args[0])
            .toMatch(new RegExp(`^SIP/2.0 180 Ringing`));
          expect(transportBob.send.calls.all()[2].args[0])
            .toMatch(new RegExp(`^SIP/2.0 183 Session Progress`));
          expect(transportBob.send.calls.all()[3].args[0])
            .toMatch(new RegExp(`^SIP/2.0 200 OK`));
          expect(transportBob.send.calls.all()[4].args[0])
            .toMatch(new RegExp(`^SIP/2.0 200 OK`));
        });

        it("Bob2's UAS sends 100, 180, 183, 200, 200 and 200", () => {
          expect(transportBob2.send).toHaveBeenCalledTimes(6);
          expect(transportBob2.send.calls.all()[0].args[0])
            .toMatch(new RegExp(`^SIP/2.0 100 Trying`));
          expect(transportBob2.send.calls.all()[1].args[0])
            .toMatch(new RegExp(`^SIP/2.0 180 Ringing`));
          expect(transportBob2.send.calls.all()[2].args[0])
            .toMatch(new RegExp(`^SIP/2.0 183 Session Progress`));
          expect(transportBob2.send.calls.all()[3].args[0])
            .toMatch(new RegExp(`^SIP/2.0 200 OK`));
          expect(transportBob2.send.calls.all()[4].args[0])
            .toMatch(new RegExp(`^SIP/2.0 200 OK`));
          expect(transportBob2.send.calls.all()[5].args[0])
            .toMatch(new RegExp(`^SIP/2.0 200 OK`));
        });

        it("Alice's Session is 'confirmed' and 'stable'", () => {
          expect(contextAlice.session && contextAlice.session.sessionState).toBe(SessionState.Confirmed);
          expect(contextAlice.session && contextAlice.session.signalingState).toBe(SignalingState.Stable);
        });

        it("Bob's Session is 'confirmed' and 'stable'", () => {
          expect(contextBob.session && contextBob.session.sessionState).toBe(SessionState.Confirmed);
          expect(contextBob.session && contextBob.session.signalingState).toBe(SignalingState.Stable);
        });

        it("Bob2's Session is 'terminated' and 'closed'", () => {
          expect(contextBob2.session && contextBob2.session.sessionState).toBe(SessionState.Terminated);
          expect(contextBob2.session && contextBob2.session.signalingState).toBe(SignalingState.Closed);
        });
      });
    });
  });

});
