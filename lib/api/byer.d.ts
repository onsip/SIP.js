import { OutgoingByeRequest } from "../core";
import { ByerByeOptions } from "./byer-bye-options";
import { ByerOptions } from "./byer-options";
import { Session } from "./session";
/**
 * A byer ends a {@link Session} (outgoing BYE).
 * @remarks
 * Sends an outgoing in dialog BYE request.
 * @public
 */
export declare class Byer {
    /** The logger. */
    private logger;
    /** The byer session. */
    private _session;
    /**
     * Constructs a new instance of the `Byer` class.
     * @param session - The session the BYE will be sent from. See {@link Session} for details.
     * @param options - An options bucket. See {@link ByerOptions} for details.
     */
    constructor(session: Session, options?: ByerOptions);
    /** The byer session. */
    readonly session: Session;
    /**
     * Sends the BYE request.
     * @param options - {@link ByerByeOptions} options bucket.
     */
    bye(options?: ByerByeOptions): Promise<OutgoingByeRequest>;
}
//# sourceMappingURL=byer.d.ts.map