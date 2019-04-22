import { IncomingRequest, IncomingResponse } from "./SIPMessage";
import { Transport } from "./Transport";
import { UA } from "./UA";
/**
 * Incoming SIP message sanity check.
 * @function
 * @param {SIP.IncomingMessage} message
 * @param {SIP.UA} ua
 * @param {SIP.Transport} transport
 * @returns {Boolean}
 */
export declare namespace SanityCheck {
    function reply(statusCode: number, message: IncomingRequest, transport: Transport): void;
    function rfc3261_8_2_2_1(message: IncomingRequest, ua: UA, transport: Transport): boolean;
    function rfc3261_16_3_4(message: IncomingRequest, ua: UA, transport: Transport): boolean;
    function rfc3261_18_3_request(message: IncomingRequest, ua: UA, transport: Transport): boolean;
    /**
     * 8.2.2.2 Merged Requests
     *
     * If the request has no tag in the To header field, the UAS core MUST
     * check the request against ongoing transactions.  If the From tag,
     * Call-ID, and CSeq exactly match those associated with an ongoing
     * transaction, but the request does not match that transaction (based
     * on the matching rules in Section 17.2.3), the UAS core SHOULD
     * generate a 482 (Loop Detected) response and pass it to the server
     * transaction.
     *
     *    The same request has arrived at the UAS more than once, following
     *    different paths, most likely due to forking.  The UAS processes
     *    the first such request received and responds with a 482 (Loop
     *    Detected) to the rest of them.
     *
     * @param message Incoming request message.
     * @param ua User agent.
     * @param transport Transport.
     */
    function rfc3261_8_2_2_2(message: IncomingRequest, ua: UA, transport: Transport): boolean;
    function rfc3261_8_1_3_3(message: IncomingResponse, ua: UA): boolean;
    function rfc3261_18_1_2(message: IncomingResponse, ua: UA): boolean;
    function rfc3261_18_3_response(message: IncomingResponse, ua: UA): boolean;
    function minimumHeaders(message: IncomingRequest | IncomingResponse, ua: UA): boolean;
    function sanityCheck(message: IncomingRequest | IncomingResponse, ua: UA, transport: Transport): boolean;
}
