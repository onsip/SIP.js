import { IncomingByeRequest, IncomingRequestMessage, ResponseOptions } from "../core";
/**
 * A request to end a {@link Session} (incoming BYE).
 * @public
 */
export declare class Bye {
    private incomingByeRequest;
    /** @internal */
    constructor(incomingByeRequest: IncomingByeRequest);
    /** Incoming BYE request message. */
    readonly request: IncomingRequestMessage;
    /** Accept the request. */
    accept(options?: ResponseOptions): Promise<void>;
    /** Reject the request. */
    reject(options?: ResponseOptions): Promise<void>;
}
//# sourceMappingURL=bye.d.ts.map