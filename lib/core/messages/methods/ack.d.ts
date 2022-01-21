import { IncomingRequestMessage } from "../incoming-request-message";
import { OutgoingRequestMessage } from "../outgoing-request-message";
/** ACK message sent from remote client to local server. */
export interface IncomingAckRequest {
    /** The incoming message. */
    readonly message: IncomingRequestMessage;
}
/** ACK message sent from local client to remote server. */
export interface OutgoingAckRequest {
    /** The outgoing message. */
    readonly message: OutgoingRequestMessage;
}
