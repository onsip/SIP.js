import { URI } from "../../../src";
import { SessionDescriptionHandler, SIPExtension, UserAgent, UserAgentOptions } from "../../../src/api";
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
  userAgent: UserAgent;
  userAgentOptions: UserAgentOptions;
  isShutdown: () => boolean;
}

export function makeUserFake(
  user: string | undefined,
  domain: string,
  displayName: string,
  options: UserAgentOptions = {}
): UserFake {
  const mockSessionDescriptionHandlers: Array<jasmine.SpyObj<SessionDescriptionHandler>> = [];
  const userHack: any = user; // FIXME: this is because grammar/parser produces undefined on no user
  const uri = new URI("sip", userHack, domain);
  const userAgentOptions: UserAgentOptions = {
    ...{
      autoStart: false,
      autoStop: false,
      uri,
      displayName,
      noAnswerTimeout: 90, // seconds
      sipExtension100rel: SIPExtension.Supported,
      sipExtensionReplaces: SIPExtension.Supported,
      sessionDescriptionHandlerFactory: makeMockSessionDescriptionHandlerFactory(
        displayName,
        0,
        mockSessionDescriptionHandlers
      ),
      transportConstructor: TransportFake
    },
    ...options
  };
  const userAgent = new UserAgent(userAgentOptions);
  if (!(userAgent.transport instanceof TransportFake)) {
    throw new Error("Transport not TransportFake");
  }
  userAgent.transport.id = displayName;

  const isShutdown = (): boolean => {
    // TODO: Check user agent state finalized

    // Confirm any and all session description handlers have been closed
    const sdhClosed = mockSessionDescriptionHandlers.every((mock) => {
      // TODO: Currently the API does call close() more than once in various
      // circumstances so we are checking to make sure close() called at least once.
      // But it  would be nice if the api did never called close() more than once...
      if (mock.close.calls.count() === 0) {
        return false;
      }
      return true;
    });

    const shutdown = sdhClosed;

    // console.warn(`${displayName} is shutdown ${shutdown}`);
    return shutdown;
  };

  return {
    user: user ? user : "",
    domain,
    displayName,
    transport: userAgent.transport,
    transportReceiveSpy: spyOn(userAgent.transport, "receive").and.callThrough(),
    transportSendSpy: spyOn(userAgent.transport, "send").and.callThrough(),
    uri,
    userAgent,
    userAgentOptions,
    isShutdown
  };
}

export function connectUserFake(user1: UserFake, user2: UserFake): void {
  user1.transport.addPeer(user2.transport);
  user2.transport.addPeer(user1.transport);
}
