import {
  IncomingInviteRequest,
  OutgoingRequestDelegate,
  OutgoingSubscribeRequestDelegate
} from "../../../src/Core/messages";
import { SessionDelegate } from "../../../src/Core/session";
import { SubscriptionDelegate } from "../../../src/Core/subscription";
import { UserAgentCoreDelegate } from "../../../src/Core/user-agent-core";
import { LoggerFactory } from "../../../src/LoggerFactory";
import { Parser } from "../../../src/Parser";
import {
  IncomingRequest as IncomingRequestMessage,
  IncomingResponse as IncomingResponseMessage,
} from "../../../src/SIPMessage";
import { Transport } from "../../../src/Transport";
import { UA } from "../../../src/UA";
import { URI } from "../../../src/URI";
import { Utils } from "../../../src/Utils";

export function connectTransportToUA(transport: jasmine.SpyObj<Transport>, ua: UA): void {
  transport.send.and.callFake((message: string) => {
    // console.log(`Sending to ${ua.configuration.displayName}...`);
    // console.log(message);
    const incomingMessage = Parser.parseMessage(message, ua.getLogger("sip.parser"));
    Promise.resolve().then(() => {
      if (incomingMessage instanceof IncomingRequestMessage) {
        ua.userAgentCore.receiveIncomingRequestFromTransport(incomingMessage);
      }
      if (incomingMessage instanceof IncomingResponseMessage) {
        ua.userAgentCore.receiveIncomingResponseFromTransport(incomingMessage);
      }
    });
    return Promise.resolve();
  });
}

export function connectTransportToUAFork(transport: jasmine.SpyObj<Transport>, ua1: UA, ua2: UA): void {
  transport.send.and.callFake((message: string) => {
    // console.log(`Sending to ${ua1.configuration.displayName} and ${ua2.configuration.displayName}...`);
    // console.log(message);
    // Fork into two copies of the message.
    const incomingMessage1 = Parser.parseMessage(message, ua1.getLogger("sip.parser"));
    const incomingMessage2 = Parser.parseMessage(message, ua2.getLogger("sip.parser"));

    const requestMatches = (incomingMessage: IncomingRequestMessage, ua: UA): boolean => {
      // FIXME: Configuration URI is a bad mix of tyes currently. It also needs to exist.
      if (!(ua.configuration.uri instanceof URI)) {
        throw new Error("Configuration URI not instance of URI.");
      }
      if (!incomingMessage.ruri) { // FIXME: A request message should always have an ruri
        throw new Error("Request-URI undefined.");
      }
      const ruri = incomingMessage.ruri;
      const ruriMatches = (uri: URI | undefined) => {
        return !!uri && uri.user === ruri.user;
      };
      if (
        !ruriMatches(ua.configuration.uri) &&
        !(
          ruriMatches(ua.contact.uri) ||
          ruriMatches(ua.contact.pubGruu) ||
          ruriMatches(ua.contact.tempGruu)
        )
      ) {
        return false;
      }
      return true;
    };

    Promise.resolve().then(() => {
      if (!ua1.userAgentCore) {
        throw new Error("User agent core undefined.");
      }
      if (incomingMessage1 instanceof IncomingRequestMessage) {
        if (requestMatches(incomingMessage1, ua1)) {
          ua1.userAgentCore.receiveIncomingRequestFromTransport(incomingMessage1);
        }
      }
      // TODO: Responses are not routed to specific UA...
      if (incomingMessage1 instanceof IncomingResponseMessage) {
        ua1.userAgentCore.receiveIncomingResponseFromTransport(incomingMessage1);
      }
    });
    Promise.resolve().then(() => {
      if (!ua2.userAgentCore) {
        throw new Error("User agent core undefined.");
      }
      if (incomingMessage2 instanceof IncomingRequestMessage) {
        if (requestMatches(incomingMessage2, ua2)) {
          ua2.userAgentCore.receiveIncomingRequestFromTransport(incomingMessage2);
        }
      }
      // TODO: Responses are not routed to specific UA...
      if (incomingMessage2 instanceof IncomingResponseMessage) {
        ua2.userAgentCore.receiveIncomingResponseFromTransport(incomingMessage2);
      }
    });
    return Promise.resolve();
  });
}

/** Mocked user agent core delegate factory function. */
export function makeMockOutgoingRequestDelegate(): jasmine.SpyObj<Required<OutgoingRequestDelegate>> {
  const delegate = jasmine.createSpyObj<Required<OutgoingRequestDelegate>>("OutgoingRequestDelegate", [
    "onAccept",
    "onProgress",
    "onRedirect",
    "onReject",
    "onTrying"
  ]);
  return delegate;
}

/** Mocked user agent core delegate factory function. */
export function makeMockOutgoingSubscribeRequestDelegate(): jasmine.SpyObj<Required<OutgoingSubscribeRequestDelegate>> {
  const delegate =
    jasmine.createSpyObj<Required<OutgoingSubscribeRequestDelegate>>("OutgoingSubscribeRequestDelegate", [
      "onAccept",
      "onProgress",
      "onRedirect",
      "onReject",
      "onTrying",
      "onNotify",
      "onNotifyTimeout"
    ]);
  return delegate;
}

/** Mocked session delegate factory function. */
export function makeMockSessionDelegate(): jasmine.SpyObj<Required<SessionDelegate>> {
  const delegate = jasmine.createSpyObj<Required<SessionDelegate>>("SessionDelegate", [
    "onAck",
    "onAckTimeout",
    "onBye",
    "onInfo",
    "onInvite",
    "onNotify",
    "onPrack",
    "onRefer"
  ]);
  return delegate;
}

/** Mocked subscription delegate factory function. */
export function makeMockSubscriptionDelegate(): jasmine.SpyObj<Required<SubscriptionDelegate>> {
  const delegate = jasmine.createSpyObj<Required<SubscriptionDelegate>>("SubscriptionDelegate", [
    "onNotify"
  ]);
  return delegate;
}

/** Mocked transport factory function. */
export function makeMockTransport(): jasmine.SpyObj<Transport> {
  const transport = jasmine.createSpyObj<Transport>("Transport", [
    "connect",
    "disconnect",
    "send",
    "on",
    "once",
    "removeListener"
  ]);
  transport.connect.and.returnValue(Promise.resolve());
  transport.disconnect.and.returnValue(Promise.resolve());
  transport.send.and.returnValue(Promise.resolve());
  return transport;
}

/** Mocked user agent core delegate factory function. */
export function makeMockUserAgentCoreDelegate(): jasmine.SpyObj<Required<UserAgentCoreDelegate>> {
  const delegate = jasmine.createSpyObj<Required<UserAgentCoreDelegate>>("UserAgentCoreDelegate", [
    "onInvite",
    "onMessage",
    "onNotify",
    "onRefer"
  ]);
  delegate.onInvite.and.callFake((incomingRequest: IncomingInviteRequest) => {
    incomingRequest.trying();
  });
  return delegate;
}

/** Mocked UA factory function. */
export function makeMockUA(user: string, domain: string, displayName: string, transport: Transport): UA {
  const log = new LoggerFactory();
  const viaHost = `${user}Host.invalid`;
  const contactURI = new URI("sip", Utils.createRandomToken(8), viaHost, undefined, { transport: "ws" });
  const ua = {
    applicants: {},
    configuration: {
      aor: new URI("sip", user, domain, undefined),
      displayName,
      noAnswerTimeout: 60000, // ms
      sipjsId: Utils.createRandomToken(5),
      uri: new URI("sip", user, domain, undefined),
      userAgentString: `SIP.js/${displayName}`,
      viaHost
    },
    contact: {
      pubGruu: undefined,
      tempGruu: undefined,
      uri: contactURI,
      toString: () => "<" + contactURI.toString() + ">"
    },
    earlySubscriptions: {},
    getLogger: (category: string, label?: string) => log.getLogger(category, label),
    getLoggerFactory: () => log,
    getSupportedResponseOptions: () => ["outbound"],
    logger: log.getLogger("sip.ua"),
    normalizeTarget: (target: string | URI): URI | undefined =>
      Utils.normalizeTarget(target, ua.configuration.hostportParams),
    publishers: {},
    sessions: {},
    subscriptions: {},
    transport
  } as unknown as UA;
  if (!ua.configuration) {
    throw new Error("UA configuration undefined.");
  }
  if (!ua.configuration.uri || !(ua.configuration.uri instanceof URI)) {
    throw new Error("UA configuration uri undefined.");
  }
  const hostportParams = ua.configuration.uri.clone();
  hostportParams.user = undefined;
  ua.configuration.hostportParams = hostportParams.toRaw().replace(/^sip:/i, "");
  return ua;
}
