import { Registerer, RegistererState } from "../../../lib/api/index.js";
import { EmitterSpy, makeEmitterSpy } from "../../support/api/emitter-spy.js";
import { connectUserFake, makeUserFake, UserFake } from "../../support/api/user-fake.js";
import { soon } from "../../support/api/utils.js";

const SIP_REGISTER = [jasmine.stringMatching(/^REGISTER/)];
const SIP_200 = [jasmine.stringMatching(/^SIP\/2.0 200/)];
const SIP_401 = [jasmine.stringMatching(/^SIP\/2.0 401/)];

/**
 * JWT Authorization - Registration Integration Tests
 */

describe("API Registration JWT Authorization", () => {
  let alice: UserFake;
  let registrar: UserFake;
  let registerer: Registerer;
  let registererStateSpy: EmitterSpy<RegistererState>;

  function resetSpies(): void {
    alice.transportReceiveSpy.calls.reset();
    alice.transportSendSpy.calls.reset();
    registererStateSpy.calls.reset();
  }

  afterEach(async () => {
    return alice.userAgent
      .stop()
      .then(() => registrar.userAgent.stop())
      .then(() => jasmine.clock().uninstall());
  });

  describe("Alice creates a UserAgent with authorizationJwt factory", () => {
    let jwtFactory: jasmine.Spy<() => string>;

    beforeEach(async () => {
      jasmine.clock().install();
      jwtFactory = jasmine.createSpy("jwtFactory").and.returnValue("initial-token");
      alice = await makeUserFake("alice", "example.com", "Alice", {
        authorizationJwt: jwtFactory
      });
      registrar = await makeUserFake(undefined, "example.com", "Registrar");
      connectUserFake(alice, registrar);
      registerer = new Registerer(alice.userAgent);
      registererStateSpy = makeEmitterSpy(registerer.stateChange, alice.userAgent.getLogger("Alice"));
      await soon();
    });

    describe("Alice register(), registrar responds 200", () => {
      let authorizationHeaderValue: string | undefined;

      beforeEach(async () => {
        resetSpies();
        registrar.userAgent.delegate = {
          onRegisterRequest: (request): void => {
            authorizationHeaderValue = request.message.getHeader("authorization");
            const contact = request.message.parseHeader("contact");
            request.accept({ extraHeaders: [`Contact: ${contact}`], statusCode: 200 });
          }
        };
        registerer.register();
        await alice.transport.waitReceived(); // 200
      });

      it("her ua should send a REGISTER", () => {
        expect(alice.transportSendSpy).toHaveBeenCalledTimes(1);
        expect(alice.transportSendSpy.calls.argsFor(0)).toEqual(SIP_REGISTER);
      });

      it("the REGISTER should carry Authorization: Bearer with the token from the factory", () => {
        expect(authorizationHeaderValue).toEqual("Bearer initial-token");
      });

      it("her ua should receive 200", () => {
        expect(alice.transportReceiveSpy).toHaveBeenCalledTimes(1);
        expect(alice.transportReceiveSpy.calls.argsFor(0)).toEqual(SIP_200);
      });

      it("the jwt factory should have been called once", () => {
        expect(jwtFactory).toHaveBeenCalledTimes(1);
      });

      it("her registerer state should transition to 'registered'", () => {
        expect(registererStateSpy).toHaveBeenCalledTimes(1);
        expect(registererStateSpy.calls.argsFor(0)).toEqual([RegistererState.Registered]);
      });
    });

    describe("Alice register(), registrar responds 401 then 200 (token refresh scenario)", () => {
      let requestCount: number;
      let authorizationHeaderOnFirstRequest: string | undefined;
      let authorizationHeaderOnRetry: string | undefined;

      beforeEach(async () => {
        requestCount = 0;
        jwtFactory.and.callFake(() => `token-${requestCount + 1}`);

        registrar.userAgent.delegate = {
          onRegisterRequest: (request): void => {
            requestCount++;
            if (requestCount === 1) {
              // First attempt: capture header, reject with 401
              authorizationHeaderOnFirstRequest = request.message.getHeader("authorization");
              request.reject({
                statusCode: 401,
                extraHeaders: [`WWW-Authenticate: Bearer realm="example.com"`]
              });
            } else {
              // Retry: capture header, accept
              authorizationHeaderOnRetry = request.message.getHeader("authorization");
              const contact = request.message.parseHeader("contact");
              request.accept({ extraHeaders: [`Contact: ${contact}`], statusCode: 200 });
            }
          }
        };

        resetSpies();
        registerer.register();
        await alice.transport.waitReceived(); // 401
        await alice.transport.waitReceived(); // 200
      });

      it("her ua should send two REGISTERs", () => {
        expect(alice.transportSendSpy).toHaveBeenCalledTimes(2);
        expect(alice.transportSendSpy.calls.argsFor(0)).toEqual(SIP_REGISTER);
        expect(alice.transportSendSpy.calls.argsFor(1)).toEqual(SIP_REGISTER);
      });

      it("her ua should receive 401 then 200", () => {
        expect(alice.transportReceiveSpy).toHaveBeenCalledTimes(2);
        expect(alice.transportReceiveSpy.calls.argsFor(0)).toEqual(SIP_401);
        expect(alice.transportReceiveSpy.calls.argsFor(1)).toEqual(SIP_200);
      });

      it("the first REGISTER should carry the initial token", () => {
        expect(authorizationHeaderOnFirstRequest).toEqual("Bearer token-1");
      });

      it("the retry REGISTER should carry a fresh token from the factory", () => {
        expect(authorizationHeaderOnRetry).toEqual("Bearer token-2");
      });

      it("the jwt factory should have been called twice", () => {
        // Once before initial send, once before the retry
        expect(jwtFactory).toHaveBeenCalledTimes(2);
      });

      it("her registerer state should transition to 'registered'", () => {
        expect(registererStateSpy).toHaveBeenCalledTimes(1);
        expect(registererStateSpy.calls.argsFor(0)).toEqual([RegistererState.Registered]);
      });
    });

    describe("Alice register(), registrar always responds 401 (no infinite loop)", () => {
      beforeEach(async () => {
        registrar.userAgent.delegate = {
          onRegisterRequest: (request): void => {
            request.reject({
              statusCode: 401,
              extraHeaders: [`WWW-Authenticate: Bearer realm="example.com"`]
            });
          }
        };

        resetSpies();
        registerer.register();
        await alice.transport.waitReceived(); // first 401
        await alice.transport.waitReceived(); // second 401 — no more retries
      });

      it("her ua should send exactly two REGISTERs and then stop", () => {
        expect(alice.transportSendSpy).toHaveBeenCalledTimes(2);
        expect(alice.transportSendSpy.calls.argsFor(0)).toEqual(SIP_REGISTER);
        expect(alice.transportSendSpy.calls.argsFor(1)).toEqual(SIP_REGISTER);
      });

      it("her ua should receive two 401 responses", () => {
        expect(alice.transportReceiveSpy).toHaveBeenCalledTimes(2);
        expect(alice.transportReceiveSpy.calls.argsFor(0)).toEqual(SIP_401);
        expect(alice.transportReceiveSpy.calls.argsFor(1)).toEqual(SIP_401);
      });

      it("the jwt factory should have been called twice", () => {
        expect(jwtFactory).toHaveBeenCalledTimes(2);
      });

      it("her registerer state should transition to 'unregistered'", () => {
        expect(registererStateSpy).toHaveBeenCalledTimes(1);
        expect(registererStateSpy.calls.argsFor(0)).toEqual([RegistererState.Unregistered]);
      });
    });

    describe("Alice register() without authorizationJwt does NOT send Authorization header", () => {
      // Verify that the feature is opt-in and does not affect users without the option
      let aliceNoJwt: UserFake;
      let authorizationHeaderValue: string | undefined;

      beforeEach(async () => {
        aliceNoJwt = await makeUserFake("alice2", "example.com", "AliceNoJwt");
        const registrar2 = await makeUserFake(undefined, "example.com", "Registrar2");
        connectUserFake(aliceNoJwt, registrar2);
        const registerer2 = new Registerer(aliceNoJwt.userAgent);

        registrar2.userAgent.delegate = {
          onRegisterRequest: (request): void => {
            authorizationHeaderValue = request.message.getHeader("authorization");
            const contact = request.message.parseHeader("contact");
            request.accept({ extraHeaders: [`Contact: ${contact}`], statusCode: 200 });
          }
        };

        registerer2.register();
        await aliceNoJwt.transport.waitReceived();
        await aliceNoJwt.userAgent.stop();
        await registrar2.userAgent.stop();
      });

      it("the REGISTER should not carry an Authorization header", () => {
        expect(authorizationHeaderValue).toBeUndefined();
      });
    });
  });
});
