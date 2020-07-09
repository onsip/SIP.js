import { UserAgentOptions } from "../../../src/api";
import { connectUserFake, makeUserFake, UserFake } from "../../support/api/user-fake";
import { soon } from "../../support/api/utils";

/**
 * TODO:
 * UserAgent Integration Tests
 */

describe("API UserAgent", () => {
  let alice: UserFake;
  let bob: UserFake;

  beforeEach(async () => {
    jasmine.clock().install();
    const options: UserAgentOptions = {
      autoStart: false
    };
    alice = await makeUserFake("alice", "example.com", "Alice", options);
    bob = await makeUserFake("bob", "example.com", "Bob", options);
    connectUserFake(alice, bob);
  });

  afterEach(async () => {
    return alice.userAgent
      .stop()
      .then(() => expect(alice.isShutdown()).toBe(true))
      .then(() => bob.userAgent.stop())
      .then(() => expect(bob.isShutdown()).toBe(true))
      .then(() => jasmine.clock().uninstall());
  });

  describe("Alice exists", () => {
    beforeEach(async () => {
      await soon();
    });

    it("has a configuration", () => {
      const configuration = alice.userAgent.configuration;
      expect(configuration).toBeDefined();
    });
  });
});
