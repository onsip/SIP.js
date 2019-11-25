import { Body } from "./body";
import { NameAddrHeader } from "./name-addr-header";
import { URI } from "./uri";
/**
 * Outgoing request message options.
 * @public
 */
export interface OutgoingRequestMessageOptions {
    callId?: string;
    callIdPrefix?: string;
    cseq?: number;
    toDisplayName?: string;
    toTag?: string;
    fromDisplayName?: string;
    fromTag?: string;
    forceRport?: boolean;
    hackViaTcp?: boolean;
    optionTags?: Array<string>;
    routeSet?: Array<string>;
    userAgentString?: string;
    viaHost?: string;
}
/**
 * Outgoing SIP request message.
 * @public
 */
export declare class OutgoingRequestMessage {
    /** Get a copy of the default options. */
    private static getDefaultOptions;
    private static makeNameAddrHeader;
    readonly headers: {
        [name: string]: Array<string>;
    };
    readonly method: string;
    readonly ruri: URI;
    readonly from: NameAddrHeader;
    readonly fromTag: string;
    readonly fromURI: URI;
    readonly to: NameAddrHeader;
    readonly toTag: string | undefined;
    readonly toURI: URI;
    branch: string | undefined;
    readonly callId: string;
    cseq: number;
    extraHeaders: Array<string>;
    body: {
        body: string;
        contentType: string;
    } | undefined;
    private options;
    constructor(method: string, ruri: URI, fromURI: URI, toURI: URI, options?: OutgoingRequestMessageOptions, extraHeaders?: Array<string>, body?: Body);
    /**
     * Get the value of the given header name at the given position.
     * @param name - header name
     * @returns Returns the specified header, undefined if header doesn't exist.
     */
    getHeader(name: string): string | undefined;
    /**
     * Get the header/s of the given name.
     * @param name - header name
     * @returns Array with all the headers of the specified name.
     */
    getHeaders(name: string): Array<string>;
    /**
     * Verify the existence of the given header.
     * @param name - header name
     * @returns true if header with given name exists, false otherwise
     */
    hasHeader(name: string): boolean;
    /**
     * Replace the the given header by the given value.
     * @param name - header name
     * @param value - header value
     */
    setHeader(name: string, value: string | Array<string>): void;
    /**
     * The Via header field indicates the transport used for the transaction
     * and identifies the location where the response is to be sent.  A Via
     * header field value is added only after the transport that will be
     * used to reach the next hop has been selected (which may involve the
     * usage of the procedures in [4]).
     *
     * When the UAC creates a request, it MUST insert a Via into that
     * request.  The protocol name and protocol version in the header field
     * MUST be SIP and 2.0, respectively.  The Via header field value MUST
     * contain a branch parameter.  This parameter is used to identify the
     * transaction created by that request.  This parameter is used by both
     * the client and the server.
     * https://tools.ietf.org/html/rfc3261#section-8.1.1.7
     * @param branchParameter - The branch parameter.
     * @param transport - The sent protocol transport.
     */
    setViaHeader(branch: string, transport: string): void;
    toString(): string;
}
//# sourceMappingURL=outgoing-request-message.d.ts.map