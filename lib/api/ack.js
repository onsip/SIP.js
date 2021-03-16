/**
 * A request to confirm a {@link Session} (incoming ACK).
 * @public
 */
export class Ack {
    /** @internal */
    constructor(incomingAckRequest) {
        this.incomingAckRequest = incomingAckRequest;
    }
    /** Incoming ACK request message. */
    get request() {
        return this.incomingAckRequest.message;
    }
}
