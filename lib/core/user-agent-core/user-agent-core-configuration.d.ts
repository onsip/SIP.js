import { LoggerFactory } from "../log";
import { DigestAuthentication, URI } from "../messages";
import { Transport } from "../transport";
/**
 * User agent contact.
 * @remarks
 * https://tools.ietf.org/html/rfc3261#section-8.1.1.8
 * This is ported from UA.contact.
 * FIXME: TODO: This is not a great rep for Contact
 * and is used in a kinda hacky way herein.
 */
export interface Contact {
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
     * @remarks
     * https://tools.ietf.org/html/rfc3261#section-6
     */
    aor: URI;
    /**
     * Contact.
     * @remarks
     * https://tools.ietf.org/html/rfc3261#section-8.1.1.8
     */
    contact: Contact;
    /**
     * From header display name.
     */
    displayName: string;
    /**
     * Logger factory.
     */
    loggerFactory: LoggerFactory;
    /**
     * Force Via header field transport to TCP.
     */
    hackViaTcp: boolean;
    /**
     * Preloaded route set.
     */
    routeSet: Array<string>;
    /**
     * Unique instance id.
     */
    sipjsId: string;
    /**
     * Option tags of supported SIP extenstions.
     */
    supportedOptionTags: Array<string>;
    /**
     * Option tags of supported SIP extenstions.
     * Used in resposnes.
     * @remarks
     * FIXME: Make this go away.
     */
    supportedOptionTagsResponse: Array<string>;
    /**
     * User-Agent header field value.
     * @remarks
     * https://tools.ietf.org/html/rfc3261#section-20.41
     */
    userAgentHeaderFieldValue: string | undefined;
    /**
     * Force use of "rport" Via header field parameter.
     * @remarks
     * https://www.ietf.org/rfc/rfc3581.txt
     */
    viaForceRport: boolean;
    /**
     * Via header field host name or network address.
     * @remarks
     * The Via header field indicates the path taken by the request so far
     * and indicates the path that should be followed in routing responses.
     */
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
