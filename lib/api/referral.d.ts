import { IncomingReferRequest, IncomingRequestMessage, NameAddrHeader, ResponseOptions } from "../core";
import { Inviter } from "./inviter";
import { InviterOptions } from "./inviter-options";
import { Session } from "./session";
/**
 * A request to establish a {@link Session} elsewhere (incoming REFER).
 * @public
 */
export declare class Referral {
    private incomingReferRequest;
    private session;
    private inviter;
    /** @internal */
    constructor(incomingReferRequest: IncomingReferRequest, session: Session);
    get referTo(): NameAddrHeader;
    get referredBy(): string | undefined;
    get replaces(): string | undefined;
    /** Incoming REFER request message. */
    get request(): IncomingRequestMessage;
    /** Accept the request. */
    accept(options?: ResponseOptions): Promise<void>;
    /** Reject the request. */
    reject(options?: ResponseOptions): Promise<void>;
    /**
     * Creates an inviter which may be used to send an out of dialog INVITE request.
     *
     * @remarks
     * This a helper method to create an Inviter which will execute the referral
     * of the `Session` which was referred. The appropriate headers are set and
     * the referred `Session` is linked to the new `Session`. Note that only a
     * single instance of the `Inviter` will be created and returned (if called
     * more than once a reference to the same `Inviter` will be returned every time).
     *
     * @param options - Options bucket.
     * @param modifiers - Session description handler modifiers.
     */
    makeInviter(options?: InviterOptions): Inviter;
}
//# sourceMappingURL=referral.d.ts.map