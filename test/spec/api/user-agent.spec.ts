import { URI } from "../../../src/core";
import { connectUserFake, makeUserFake, UserFake } from "../../support/api/user-fake";
import { soon } from "../../support/api/utils";

/**
 * UserAgent Integration Tests
 */

describe("UserAgent Class", () => {
  let alice: UserFake;
  let bob: UserFake;
  let target: URI;

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

  describe("Alice exists", () => {
    beforeEach(async () => {
      target = bob.uri;
      await soon();
    });

    it("hello", () => {
      const spy = alice.transportSendSpy;
      expect(spy).toHaveBeenCalledTimes(0);
    });
  });
});
