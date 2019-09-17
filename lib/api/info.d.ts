import { IncomingInfoRequest, IncomingRequestMessage, ResponseOptions } from "../core";
/**
 * An exchange of information (incoming INFO).
 * @public
 */
export declare class Info {
    private incomingInfoRequest;
    /** @internal */
    constructor(incomingInfoRequest: IncomingInfoRequest);
    /** Incoming MESSAGE request message. */
    readonly request: IncomingRequestMessage;
    /** Accept the request. */
    accept(options?: ResponseOptions): Promise<void>;
    /** Reject the request. */
    reject(options?: ResponseOptions): Promise<void>;
}
//# sourceMappingURL=info.d.ts.map