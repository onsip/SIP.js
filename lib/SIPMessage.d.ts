import { Dialog } from "./Dialogs";
import { TypeStrings } from "./Enums";
import { NameAddrHeader } from "./NameAddrHeader";
import { ClientTransaction, ServerTransaction } from "./Transactions";
import { Transport } from "./Transport";
import { UA } from "./UA";
import { URI } from "./URI";
export declare const getSupportedHeader: ((request: OutgoingRequest | IncomingRequest) => string);
/**
 * @class Class for outgoing SIP request.
 * @param {String} method request method
 * @param {String} ruri request uri
 * @param {SIP.UA} ua
 * @param {Object} params parameters that will have priority over ua.configuration parameters:
 * <br>
 *  - cseq, callId, fromTag, fromUri, fromDisplayName, toUri, toTag, routeSet
 * @param {Object} [headers] extra headers
 * @param {String} [body]
 */
export declare class OutgoingRequest {
    type: TypeStrings;
    ruri: string | URI;
    ua: UA;
    headers: {
        [name: string]: Array<string>;
    };
    method: string;
    cseq: number;
    body: string | {
        body: string;
        contentType: string;
    } | undefined;
    to: NameAddrHeader | undefined;
    toTag: string | undefined;
    from: NameAddrHeader | undefined;
    fromTag: string;
    extraHeaders: Array<string>;
    callId: string;
    dialog: Dialog | undefined;
    transaction: ClientTransaction | undefined;
    branch: string | undefined;
    private logger;
    private statusCode;
    private reasonPhrase;
    constructor(method: string, ruri: string | URI, ua: UA, params?: any, extraHeaders?: Array<string>, body?: string | {
        body: string;
        contentType: string;
    });
    /**
     * Get the value of the given header name at the given position.
     * @param {String} name header name
     * @returns {String|undefined} Returns the specified header, undefined if header doesn't exist.
     */
    getHeader(name: string): string | undefined;
    /**
     * Get the header/s of the given name.
     * @param {String} name header name
     * @returns {Array} Array with all the headers of the specified name.
     */
    getHeaders(name: string): Array<string>;
    /**
     * Verify the existence of the given header.
     * @param {String} name header name
     * @returns {boolean} true if header with given name exists, false otherwise
     */
    hasHeader(name: string): boolean;
    /**
     * Replace the the given header by the given value.
     * @param {String} name header name
     * @param {String | Array} value header value
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
     * @param branchParameter The branch parameter.
     * @param transport The transport.
     */
    setViaHeader(branch: string, transport: Transport): void;
    /**
     * Cancel this request.
     * If this is not an INVITE request, a no-op.
     * @param reason Reason phrase.
     * @param extraHeaders Extra headers.
     */
    cancel(reason?: string, extraHeaders?: Array<string>): void;
    toString(): string;
}
/**
 * @class Class for incoming SIP message.
 */
export declare class IncomingMessage {
    type: TypeStrings;
    viaBranch: string;
    method: string;
    body: string;
    toTag: string;
    to: NameAddrHeader;
    fromTag: string;
    from: NameAddrHeader;
    callId: string;
    cseq: number;
    via: {
        host: string;
        port: number;
    };
    headers: {
        [name: string]: Array<{
            parsed?: any;
            raw: string;
        }>;
    };
    referTo: string | undefined;
    data: string;
    /**
     * Insert a header of the given name and value into the last position of the
     * header array.
     * @param {String} name header name
     * @param {String} value header value
     */
    addHeader(name: string, value: string): void;
    /**
     * Get the value of the given header name at the given position.
     * @param {String} name header name
     * @returns {String|undefined} Returns the specified header, undefined if header doesn't exist.
     */
    getHeader(name: string): string | undefined;
    /**
     * Get the header/s of the given name.
     * @param {String} name header name
     * @returns {Array} Array with all the headers of the specified name.
     */
    getHeaders(name: string): Array<string>;
    /**
     * Verify the existence of the given header.
     * @param {String} name header name
     * @returns {boolean} true if header with given name exists, false otherwise
     */
    hasHeader(name: string): boolean;
    /**
     * Parse the given header on the given index.
     * @param {String} name header name
     * @param {Number} [idx=0] header index
     * @returns {Object|undefined} Parsed header object, undefined if the
     *   header is not present or in case of a parsing error.
     */
    parseHeader(name: string, idx?: number): any | undefined;
    /**
     * Message Header attribute selector. Alias of parseHeader.
     * @param {String} name header name
     * @param {Number} [idx=0] header index
     * @returns {Object|undefined} Parsed header object, undefined if the
     *   header is not present or in case of a parsing error.
     *
     * @example
     * message.s('via',3).port
     */
    s(name: string, idx?: number): any | undefined;
    /**
     * Replace the value of the given header by the value.
     * @param {String} name header name
     * @param {String} value header value
     */
    setHeader(name: string, value: string): void;
    toString(): string;
}
/**
 * @class Class for incoming SIP request.
 */
export declare class IncomingRequest extends IncomingMessage {
    ua: UA;
    type: TypeStrings;
    ruri: URI | undefined;
    transaction: ServerTransaction | undefined;
    transport: Transport | undefined;
    private logger;
    constructor(ua: UA);
    /**
     * Stateful reply.
     * @param {Number} code status code
     * @param {String} reason reason phrase
     * @param {Object} headers extra headers
     * @param {String} body body
     */
    reply(code: number, reason?: string, extraHeaders?: Array<string>, body?: string | {
        body: string;
        contentType: string;
    }): string;
    /**
     * Stateless reply.
     * @param {Number} code status code
     * @param {String} reason reason phrase
     */
    reply_sl(code: number, reason?: string): string;
}
/**
 * @class Class for incoming SIP response.
 */
export declare class IncomingResponse extends IncomingMessage {
    ua: UA;
    type: TypeStrings;
    statusCode: number | undefined;
    reasonPhrase: string | undefined;
    transaction: ClientTransaction | undefined;
    private logger;
    constructor(ua: UA);
    /**
     * Constructs and sends ACK to 2xx final response. Returns the sent ACK.
     * @param response The 2xx final repsonse the ACK is acknowledging.
     * @param options ACK options; extra headers, body.
     */
    ack(options?: {
        extraHeaders?: Array<string>;
        body?: string | {
            body: string;
            contentType: string;
        };
    }): OutgoingRequest;
}
