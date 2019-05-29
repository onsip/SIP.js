import { C } from "../../Constants";
import { DigestAuthentication } from "../../DigestAuthentication";
import { LoggerFactory } from "../../LoggerFactory";
import { Transport } from "../../Transport";
import { UA } from "../../UA";
import { URI } from "../../URI";
import { Utils } from "../../Utils";

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
   * Supported response options.
   */
  supportedResponseOptions: Array<string>;
  /**
   * User-Agent header field value.
   * https://tools.ietf.org/html/rfc3261#section-20.41
   */
  userAgentHeaderFieldValue: string | undefined;

  displayName: string;
  forceRport: boolean;
  hackViaTcp: boolean;
  supportedOptionTags: Array<string>;
  routeSet: Array<string>;
  sipjsId: string;
  viaHost: string;

  /**
   * DEPRECATED
   * Authentication factory function.
   */
  authenticationFactory(): DigestAuthentication | undefined;
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
  const aor = ua.configuration.uri;
  const contact = ua.contact;
  const displayName = ua.configuration.displayName ? ua.configuration.displayName : "";
  const forceRport = ua.configuration.forceRport ? true : false;
  const hackViaTcp = ua.configuration.hackViaTcp ? true : false;
  const routeSet = ua.configuration.usePreloadedRoute && ua.transport ? [ua.transport.server.sipUri] : [];
  const sipjsId = ua.configuration.sipjsId || Utils.createRandomToken(5);

  let supportedOptionTags: Array<string> = [];
  supportedOptionTags.push("outbound"); // TODO: is this really supported?
  if (ua.configuration.rel100 === C.supported.SUPPORTED) {
    supportedOptionTags.push("100rel");
  }
  if (ua.configuration.replaces === C.supported.SUPPORTED) {
    supportedOptionTags.push("replaces");
  }
  if (ua.configuration.extraSupported) {
    supportedOptionTags.push(...ua.configuration.extraSupported);
  }
  if (!ua.configuration.hackAllowUnregisteredOptionTags) {
    supportedOptionTags = supportedOptionTags.filter((optionTag) => C.OPTION_TAGS[optionTag]);
  }
  supportedOptionTags = Array.from(new Set(supportedOptionTags)); // array of unique values

  const userAgentHeaderFieldValue = ua.configuration.userAgentString || "sipjs";

  if (!(ua.configuration.viaHost)) {
    throw new Error("Configuration via host undefined");
  }
  const viaHost = ua.configuration.viaHost;

  const configuration: UserAgentCoreConfiguration = {
    aor,
    contact,
    loggerFactory: ua.getLoggerFactory(),
    supportedResponseOptions: ua.getSupportedResponseOptions(),
    userAgentHeaderFieldValue,
    displayName,
    forceRport,
    hackViaTcp,
    supportedOptionTags,
    routeSet,
    sipjsId,
    viaHost,
    authenticationFactory: () => {
      if (ua.configuration.authenticationFactory) {
        return ua.configuration.authenticationFactory(ua);
      }
      return undefined;
    },
    transportAccessor: () => ua.transport
  };

  return configuration;
}
