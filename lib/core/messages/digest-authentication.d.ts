import { LoggerFactory } from "../log";
import { OutgoingRequestMessage } from "./outgoing-request-message";
/**
 * Digest Authentication.
 * @internal
 */
export declare class DigestAuthentication {
    stale: boolean | undefined;
    private logger;
    private ha1;
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
    /**
     * Constructor.
     * @param loggerFactory - LoggerFactory.
     * @param username - Username.
     * @param password - Password.
     */
    constructor(loggerFactory: LoggerFactory, ha1: string | undefined, username: string | undefined, password: string | undefined);
    /**
     * Performs Digest authentication given a SIP request and the challenge
     * received in a response to that request.
     * @param request -
     * @param challenge -
     * @returns true if credentials were successfully generated, false otherwise.
     */
    authenticate(request: OutgoingRequestMessage, challenge: any, body?: string): boolean;
    /**
     * Return the Proxy-Authorization or WWW-Authorization header value.
     */
    toString(): string;
    /**
     * Generate the 'nc' value as required by Digest in this.ncHex by reading this.nc.
     */
    private updateNcHex;
    /**
     * Generate Digest 'response' value.
     */
    private calculateResponse;
}
//# sourceMappingURL=digest-authentication.d.ts.map