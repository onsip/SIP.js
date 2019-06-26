import { IncomingRequestMessage } from "../incoming-request-message";
import { OutgoingRequestMessage } from "../outgoing-request-message";

// Note: As a request with no response, ACK is a special case.

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
