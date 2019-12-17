import { Body } from "./body";
import { IncomingRequestMessage } from "./incoming-request-message";
/**
 * A SIP message sent from a local server to a remote client.
 * @remarks
 * For indicating the status of a request sent from the client to the server.
 * https://tools.ietf.org/html/rfc3261#section-7.2
 * @public
 */
export interface OutgoingResponse {
    /** The outgoing message. */
    readonly message: string;
}
/**
 * Response options bucket.
 * @public
 */
export interface ResponseOptions {
    /** Status code of the response. */
    statusCode: number;
    /** Reason phrase of the response. */
    reasonPhrase?: string;
    /** To tag of the response. If not provided, one is generated. */
    toTag?: string;
    /** User agent string for User-Agent header. */
    userAgent?: string;
    /** Support options tags for Supported header. */
    supported?: Array<string>;
    /** Extra headers to include in the message. */
    extraHeaders?: Array<string>;
    /** Body to include in the message. */
    body?: Body;
}
/**
 * When a UAS wishes to construct a response to a request, it follows
 * the general procedures detailed in the following subsections.
 * Additional behaviors specific to the response code in question, which
 * are not detailed in this section, may also be required.
 * https://tools.ietf.org/html/rfc3261#section-8.2.6
 * @internal
 */
export declare function constructOutgoingResponse(message: IncomingRequestMessage, options: ResponseOptions): OutgoingResponse;
//# sourceMappingURL=outgoing-response.d.ts.map