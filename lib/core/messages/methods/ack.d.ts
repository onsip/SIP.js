import { IncomingRequestMessage } from "../incoming-request-message";
import { OutgoingRequestMessage } from "../outgoing-request-message";
/**
 * Incoming ACK request.
 * @public
 */
export interface IncomingAckRequest {
    /** The incoming message. */
    readonly message: IncomingRequestMessage;
}
/**
 * Outgoing ACK request.
 * @public
 */
export interface OutgoingAckRequest {
    /** The outgoing message. */
    readonly message: OutgoingRequestMessage;
}
//# sourceMappingURL=ack.d.ts.map