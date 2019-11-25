import { OutgoingInfoRequest } from "../core";
import { InfoerInfoOptions } from "./infoer-info-options";
import { InfoerOptions } from "./infoer-options";
import { Session } from "./session";
/**
 * An Infoer sends {@link Info} (outgoing INFO).
 * @remarks
 * Sends an outgoing in dialog INFO request.
 * @public
 */
export declare class Infoer {
    /** The logger. */
    private logger;
    /** The Infoer session. */
    private _session;
    /**
     * Constructs a new instance of the `Infoer` class.
     * @param session - The session the INFO will be sent from. See {@link Session} for details.
     * @param options - An options bucket.
     */
    constructor(session: Session, options?: InfoerOptions);
    /** The Infoer session. */
    readonly session: Session;
    /**
     * Sends the INFO request.
     * @param options - {@link InfoerInfoOptions} options bucket.
     */
    info(options?: InfoerInfoOptions): Promise<OutgoingInfoRequest>;
}
//# sourceMappingURL=infoer.d.ts.map