import { OutgoingReferRequest, URI } from "../core";
import { ReferrerDelegate } from "./referrer-delegate";
import { ReferrerOptions } from "./referrer-options";
import { ReferrerReferOptions } from "./referrer-refer-options";
import { Session } from "./session";
/**
 * A referrer sends a {@link Referral} (outgoing REFER).
 * @remarks
 * Sends an outgoing in dialog REFER request.
 * @public
 */
export declare class Referrer {
    /** The referrer delegate. */
    delegate: ReferrerDelegate | undefined;
    /** The logger. */
    private logger;
    /** The referTo. */
    private _referTo;
    /** The referrer session. */
    private _session;
    /**
     * Constructs a new instance of the `Referrer` class.
     * @param session - The session the REFER will be sent from. See {@link Session} for details.
     * @param referTo - The referral target. If a `Session`, a REFER w/Replaces is sent.
     * @param options - An options bucket. See {@link ReferrerOptions} for details.
     */
    constructor(session: Session, referTo: URI | Session, options?: ReferrerOptions);
    /** The referrer session. */
    readonly session: Session;
    /**
     * Sends the REFER request.
     * @param options - An options bucket.
     */
    refer(options?: ReferrerReferOptions): Promise<OutgoingReferRequest>;
    private extraHeaders;
    private referToString;
}
//# sourceMappingURL=referrer.d.ts.map