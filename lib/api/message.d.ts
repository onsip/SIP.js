import { IncomingMessageRequest, IncomingRequestMessage, ResponseOptions } from "../core";
/**
 * A received message (incoming MESSAGE).
 * @public
 */
export declare class Message {
    private incomingMessageRequest;
    /** @internal */
    constructor(incomingMessageRequest: IncomingMessageRequest);
    /** Incoming MESSAGE request message. */
    get request(): IncomingRequestMessage;
    /** Accept the request. */
    accept(options?: ResponseOptions): Promise<void>;
    /** Reject the request. */
    reject(options?: ResponseOptions): Promise<void>;
}
//# sourceMappingURL=message.d.ts.map