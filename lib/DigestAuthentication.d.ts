import { TypeStrings } from "./Enums";
import { OutgoingRequest } from "./SIPMessage";
import { UA } from "./UA";
/**
 * SIP Digest Authentication.
 * @function Digest Authentication
 * @param {SIP.UA} ua
 */
export declare class DigestAuthentication {
    type: TypeStrings;
    stale: boolean | undefined;
    private logger;
    private username;
    private password;
    private cnonce;
    private nc;
    private ncHex;
    private response;
    private algorithm;
    private realm;
    private nonce;
    private opaque;
    private qop;
    private method;
    private uri;
    constructor(ua: UA);
    /**
     * Performs Digest authentication given a SIP request and the challenge
     * received in a response to that request.
     * Returns true if credentials were successfully generated, false otherwise.
     *
     * @param {SIP.OutgoingRequest} request
     * @param {Object} challenge
     */
    authenticate(request: OutgoingRequest, challenge: any, body?: string): boolean;
    /**
     * Return the Proxy-Authorization or WWW-Authorization header value.
     */
    toString(): string;
    /**
     * Generate the 'nc' value as required by Digest in this.ncHex by reading this.nc.
     * @private
     */
    private updateNcHex;
    /**
     * Generate Digest 'response' value.
     * @private
     */
    private calculateResponse;
}
