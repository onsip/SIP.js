import { UserAgentOptions } from "../../../src/api";
import { URI } from "../../../src/core";
import { connectUserFake, makeUserFake, UserFake } from "../../support/api/user-fake";
import { soon } from "../../support/api/utils";

/**
 * TODO:
 * Publication Integration Tests
 */

describe("API Publication", () => {
  let alice: UserFake;
  let bob: UserFake;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let target: URI;

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
    return alice.userAgent.stop()
      .then(() => expect(alice.isShutdown()).toBe(true))
      .then(() => bob.userAgent.stop())
      .then(() => expect(bob.isShutdown()).toBe(true))
      .then(() => jasmine.clock().uninstall());
  });

  describe("Alice exists", () => {
    beforeEach(async () => {
      target = bob.uri;
      await soon();
    });

    it("has a configuration", () => {
      const configuration = alice.userAgent.configuration;
      expect(configuration).toBeDefined();
    });
  });
});
