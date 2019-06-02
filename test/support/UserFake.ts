import { C } from "../../src/Constants";
import { URI } from "../../src/core";
import { UA } from "../../src/UA";
import { makeMockSessionDescriptionHandlerFactory } from "./SessionDescriptionHandlerMock";
import { TransportFake } from "./TransportFake";

export interface UserFake {
  user: string;
  domain: string;
  displayName: string;
  transport: TransportFake;
  transportReceiveSpy: jasmine.Spy;
  transportSendSpy: jasmine.Spy;
  uri: URI;
  ua: UA;
  uaConfig: UA.Options;
}

export function makeUserFake(
  user: string,
  domain: string,
  displayName: string
): UserFake {
  const uri = new URI("sip", user, domain);
  const uaConfig: UA.Options = {
    uri: uri.toString(), // FIXME: UA.Options.uri is typed to take a URI, but it crashes
    displayName,
    noAnswerTimeout: 90, // seconds
    register: false,
    rel100: C.supported.SUPPORTED,
    sessionDescriptionHandlerFactory: makeMockSessionDescriptionHandlerFactory(user),
    transportConstructor: TransportFake
  };
  const ua = new UA(uaConfig);
  if (!(ua.transport instanceof TransportFake)) {
    throw new Error("Transport not TransportFake");
  }
  ua.transport.id = displayName;
  return {
    user,
    domain,
    displayName,
    transport: ua.transport,
    transportReceiveSpy: spyOn(ua.transport, "receive").and.callThrough(),
    transportSendSpy: spyOn(ua.transport, "send").and.callThrough(),
    uri,
    ua,
    uaConfig
  };
}

export function connectUserFake(user1: UserFake, user2: UserFake): void {
  user1.transport.addPeer(user2.transport);
  user2.transport.addPeer(user1.transport);
}
