import { IncomingNotifyRequest, IncomingRequestMessage, ResponseOptions } from "../core";
/**
 * A notification of an event (incoming NOTIFY).
 * @public
 */
export declare class Notification {
    private incomingNotifyRequest;
    /** @internal */
    constructor(incomingNotifyRequest: IncomingNotifyRequest);
    /** Incoming NOTIFY request message. */
    get request(): IncomingRequestMessage;
    /** Accept the request. */
    accept(options?: ResponseOptions): Promise<void>;
    /** Reject the request. */
    reject(options?: ResponseOptions): Promise<void>;
}
//# sourceMappingURL=notification.d.ts.map