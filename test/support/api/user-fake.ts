import { C, URI } from "../../../src";
import { SIPExtension, UserAgent, UserAgentOptions } from "../../../src/api";
import { makeMockSessionDescriptionHandlerFactory } from "./session-description-handler-mock";
import { TransportFake } from "./transport-fake";

export interface UserFake {
  user: string;
  domain: string;
  displayName: string;
  transport: TransportFake;
  transportReceiveSpy: jasmine.Spy;
  transportSendSpy: jasmine.Spy;
  uri: URI;
  ua: UserAgent;
  uaConfig: UserAgentOptions;
}
// export interface UserFake {
//   user: string;
//   domain: string;
//   displayName: string;
//   transport: TransportFake;
//   transportReceiveSpy: jasmine.Spy;
//   transportSendSpy: jasmine.Spy;
//   uri: URI;
//   userAgent: UserAgent;
//   userAgentOptions: UserAgentOptions;
// }

export function makeUserFake(
  user: string,
  domain: string,
  displayName: string
): UserFake {
  const uri = new URI("sip", user, domain);
  const uaConfig: UserAgentOptions = {
    uri,
    displayName,
    noAnswerTimeout: 90, // seconds
    sipExtension100rel: SIPExtension.Supported,
    sessionDescriptionHandlerFactory: makeMockSessionDescriptionHandlerFactory(user),
    transportConstructor: TransportFake
  };
  const ua = new UserAgent(uaConfig);
  if (!(ua.transport instanceof TransportFake)) {
    throw new Error("Transport not TransportFake");
  }
  ua.transport.id = displayName;
//   const userAgentOptions: UserAgentOptions = {
//     uri,
//     displayName,
//     noAnswerTimeout: 90, // seconds
//     register: false,
//     sessionDescriptionHandlerFactory: makeMockSessionDescriptionHandlerFactory(user),
//     sipExtension100rel: SIPExtension.Supported,
//     transportConstructor: TransportFake,
//     viaHost: `${user}Host.invalid`
//   };
//   const userAgent = new UserAgent(userAgentOptions);
//   if (!(userAgent.transport instanceof TransportFake)) {
//     throw new Error("Transport not TransportFake");
//   }
//   userAgent.transport.id = displayName;
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
//   return {
//     user,
//     domain,
//     displayName,
//     transport: userAgent.transport,
//     transportReceiveSpy: spyOn(userAgent.transport, "receive").and.callThrough(),
//     transportSendSpy: spyOn(userAgent.transport, "send").and.callThrough(),
//     uri,
//     userAgent,
//     userAgentOptions
//   };
}

export function connectUserFake(user1: UserFake, user2: UserFake): void {
  user1.transport.addPeer(user2.transport);
  user2.transport.addPeer(user1.transport);
}

// import {
//   SIPExtension,
//   UserAgent,
//   UserAgentOptions
// } from "../../../src/api";
// import { URI } from "../../../src/URI";

// import { makeMockSessionDescriptionHandlerFactory } from "./session-description-handler-mock";
// import { TransportFake } from "./transport-fake";

// export interface UserFake {
//   user: string;
//   domain: string;
//   displayName: string;
//   transport: TransportFake;
//   transportReceiveSpy: jasmine.Spy;
//   transportSendSpy: jasmine.Spy;
//   uri: URI;
//   userAgent: UserAgent;
//   userAgentOptions: UserAgentOptions;
// }

// export function makeUserFake(
//   user: string,
//   domain: string,
//   displayName: string
// ): UserFake {
//   const uri = new URI("sip", user, domain);
//   const userAgentOptions: UserAgentOptions = {
//     uri,
//     displayName,
//     noAnswerTimeout: 90, // seconds
//     register: false,
//     sessionDescriptionHandlerFactory: makeMockSessionDescriptionHandlerFactory(user),
//     sipExtension100rel: SIPExtension.Supported,
//     transportConstructor: TransportFake,
//     viaHost: `${user}Host.invalid`
//   };
//   const userAgent = new UserAgent(userAgentOptions);
//   if (!(userAgent.transport instanceof TransportFake)) {
//     throw new Error("Transport not TransportFake");
//   }
//   userAgent.transport.id = displayName;
//   return {
//     user,
//     domain,
//     displayName,
//     transport: userAgent.transport,
//     transportReceiveSpy: spyOn(userAgent.transport, "receive").and.callThrough(),
//     transportSendSpy: spyOn(userAgent.transport, "send").and.callThrough(),
//     uri,
//     userAgent,
//     userAgentOptions
//   };
// }
