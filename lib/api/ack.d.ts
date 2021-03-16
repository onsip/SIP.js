import { IncomingRequestMessage, IncomingAckRequest } from "../core";
/**
 * A request to confirm a {@link Session} (incoming ACK).
 * @public
 */
export declare class Ack {
    private incomingAckRequest;
    /** @internal */
    constructor(incomingAckRequest: IncomingAckRequest);
    /** Incoming ACK request message. */
    get request(): IncomingRequestMessage;
}
//# sourceMappingURL=ack.d.ts.map