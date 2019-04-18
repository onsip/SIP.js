import { DigestAuthentication } from "../../DigestAuthentication";
import { LoggerFactory } from "../../LoggerFactory";
import {
  IncomingResponse as IncomingResponseMessage,
  OutgoingRequest as OutgoingRequestMessage
} from "../../SIPMessage";
import { Transport } from "../../Transport";
import { UA } from "../../UA";
import { URI } from "../../URI";

/**
 * This is ported from UA.contact.
 * FIXME: TODO: This is not a great rep for Contact
 * and is used in a kinda hacky way herein.
 */
interface Contact {
  pubGruu: URI | undefined;
  tempGruu: URI | undefined;
  uri: URI;
  toString: (options?: any) => string;
}

/**
 * User agent core configuration.
 */
export interface UserAgentCoreConfiguration {
  /**
   * Address-of-Record (AOR).
   * https://tools.ietf.org/html/rfc3261#section-6
   */
  aor: URI;
  /**
   * Contact.
   * https://tools.ietf.org/html/rfc3261#section-8.1.1.8
   */
  contact: Contact;
  /**
   * Logger factory.
   */
  loggerFactory: LoggerFactory;
  /**
   * User-Agent header field value.
   * https://tools.ietf.org/html/rfc3261#section-20.41
   */
  userAgentHeaderFieldValue: string | undefined;
  /**
   * DEPRECATED
   * Authentication factory function.
   */
  authenticationFactory(): DigestAuthentication | undefined;
  /**
   * DEPRECATED: This is a hack to get around `IncomingResponseMessage`
   * requiring a `UA` for construction. Hopefully that will go away soon.
   * Meanwhile, this method is here to avoid leaking `UA` further than it
   * needs to be. Please remove this when no longer needed here.
   *
   * Returns a "fake" 408 (Request Timeout) response.
   */
  onRequestTimeoutResponseMessageFactory(): IncomingResponseMessage;
  /**
   * DEPRECATED: This is a hack to get around `IncomingResponseMessage`
   * requiring a `UA` for construction. Hopefully that will go away soon.
   * Meanwhile, this method is here to avoid leaking `UA` further than it
   * needs to be. Please remove this when no longer needed here.
   *
   * Returns a "fake" 503 (Service Unavailable) response.
   */
  onTransportErrorResponseMessageFactory(): IncomingResponseMessage;
  /**
   * DEPRECATED: This is a hack to get around `OutgoingRequestMessage`
   * requiring a `UA` for construction. Hopefully that will go away soon.
   * Meanwhile, this method is here to avoid leaking `UA` further than it
   * needs to be. Please remove this when no longer needed here.
   * It's simply a cover function for OutgoingRequestMessage constructor
   *
   * Outgoing request message factory function.
   * @param method Method.
   * @param ruri Request-URI.
   * @param params Various parameters.
   * @param extraHeaders Extra headers to add.
   * @param body Message body.
   */
  outgoingRequestMessageFactory(
    method: string,
    ruri: string | URI,
    params: {
      callId?: string,
      cseq?: number,
      toTag?: string,
      toUri?: URI,
      fromDisplayName?: string,
      fromTag?: string,
      fromUri?: URI,
      routeSet?: string[]
    },
    extraHeaders?: Array<string>,
    body?: string | { body: string, contentType: string }
  ): OutgoingRequestMessage;
  /**
   * DEPRECATED: This is a hack to get around `Transport`
   * requiring the `UA` to start for construction.
   */
  transportAccessor(): Transport | undefined;
}

/**
 * Factory function to generate configuration give a UA.
 * @param ua UA
 */
export function makeUserAgentCoreConfigurationFromUA(ua: UA): UserAgentCoreConfiguration {
  // FIXME: Configuration URI is a bad mix of types currently. It also needs to exist.
  if (!(ua.configuration.uri instanceof URI)) {
    throw new Error("Configuration URI not instance of URI.");
  }

  const configuration: UserAgentCoreConfiguration = {
    aor: ua.configuration.uri,
    contact: ua.contact,
    loggerFactory: ua.getLoggerFactory(),
    userAgentHeaderFieldValue: ua.configuration.userAgentString,
    authenticationFactory: () => {
      if (ua.configuration.authenticationFactory) {
        return ua.configuration.authenticationFactory(ua);
      }
      return undefined;
    },
    onRequestTimeoutResponseMessageFactory: () => {
      const message = new IncomingResponseMessage(ua);
      message.statusCode = 408;
      message.reasonPhrase = "Request Timeout";
      return message;
    },
    onTransportErrorResponseMessageFactory: () => {
      const message = new IncomingResponseMessage(ua);
      message.statusCode = 503;
      message.reasonPhrase = "Service Unavailable";
      return message;
    },
    outgoingRequestMessageFactory: (
      method: string,
      ruri: string | URI,
      params: {
        callId?: string,
        cseq?: number,
        toTag?: string,
        toUri?: URI,
        fromDisplayName?: string,
        fromTag?: string,
        fromUri?: URI,
        routeSet?: string[]
      },
      extraHeaders?: Array<string>,
      body?: string | { body: string, contentType: string }
    ) => new OutgoingRequestMessage(method, ruri, ua, params, extraHeaders, body),
    transportAccessor: () => ua.transport
  };

  return configuration;
}
