import { IncomingRequestMessage } from "./incoming-request-message";
import { IncomingResponseMessage } from "./incoming-response-message";
import { OutgoingRequestMessage } from "./outgoing-request-message";
/**
 * Message body.
 * @remarks
 * https://tools.ietf.org/html/rfc3261#section-7.4
 * @public
 */
export interface Body {
    /**
     * If the Content-Disposition header field is missing, bodies of
     * Content-Type application/sdp imply the disposition "session", while
     * other content types imply "render".
     * https://tools.ietf.org/html/rfc3261#section-13.2.1
     * For backward-compatibility, if the Content-Disposition header field
     * is missing, the server SHOULD assume bodies of Content-Type
     * application/sdp are the disposition "session", while other content
     * types are "render".
     * https://tools.ietf.org/html/rfc3261#section-20.11
     */
    contentDisposition: string;
    /**
     * The Content-Type header field indicates the media type of the
     * message-body sent to the recipient.  The Content-Type header field
     * MUST be present if the body is not empty.  If the body is empty,
     * and a Content-Type header field is present, it indicates that the body
     * of the specific type has zero length (for example, an empty audio file).
     * https://tools.ietf.org/html/rfc3261#section-20.15
     */
    contentType: string;
    /**
     * Requests, including new requests defined in extensions to this
     * specification, MAY contain message bodies unless otherwise noted.
     * The interpretation of the body depends on the request method.
     * For response messages, the request method and the response status
     * code determine the type and interpretation of any message body.  All
     * responses MAY include a body.
     * https://tools.ietf.org/html/rfc3261#section-7.4
     */
    content: string;
}
/**
 * Create a Body given a legacy body type.
 * @param bodyLegacy - Body Object
 * @internal
 */
export declare function fromBodyLegacy(bodyLegacy: string | {
    body: string;
    contentType: string;
}): Body;
/**
 * Given a message, get a normalized body.
 * The content disposition is inferred if not set.
 * @param message - The message.
 * @internal
 */
export declare function getBody(message: IncomingRequestMessage | IncomingResponseMessage | OutgoingRequestMessage | Body): Body | undefined;
/**
 * User-Defined Type Guard for Body.
 * @param body - Body to check.
 * @internal
 */
export declare function isBody(body: any): body is Body;
//# sourceMappingURL=body.d.ts.map