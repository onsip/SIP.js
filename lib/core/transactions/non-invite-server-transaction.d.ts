import { IncomingRequestMessage } from "../messages";
import { Transport } from "../transport";
import { ServerTransaction } from "./server-transaction";
import { ServerTransactionUser } from "./transaction-user";
/**
 * Non-INVITE Server Transaction.
 * @remarks
 * https://tools.ietf.org/html/rfc3261#section-17.2.2
 * @public
 */
export declare class NonInviteServerTransaction extends ServerTransaction {
    private lastResponse;
    private J;
    /**
     * Constructor.
     * After construction the transaction will be in the "trying": state and the transaction
     * `id` will equal the branch parameter set in the Via header of the incoming request.
     * https://tools.ietf.org/html/rfc3261#section-17.2.2
     * @param request - Incoming Non-INVITE request from the transport.
     * @param transport - The transport.
     * @param user - The transaction user.
     */
    constructor(request: IncomingRequestMessage, transport: Transport, user: ServerTransactionUser);
    /**
     * Destructor.
     */
    dispose(): void;
    /** Transaction kind. Deprecated. */
    get kind(): string;
    /**
     * Receive requests from transport matching this transaction.
     * @param request - Request matching this transaction.
     */
    receiveRequest(request: IncomingRequestMessage): void;
    /**
     * Receive responses from TU for this transaction.
     * @param statusCode - Status code of response. 101-199 not allowed per RFC 4320.
     * @param response - Response to send.
     */
    receiveResponse(statusCode: number, response: string): void;
    /**
     * First, the procedures in [4] are followed, which attempt to deliver the response to a backup.
     * If those should all fail, based on the definition of failure in [4], the server transaction SHOULD
     * inform the TU that a failure has occurred, and SHOULD transition to the terminated state.
     * https://tools.ietf.org/html/rfc3261#section-17.2.4
     */
    protected onTransportError(error: Error): void;
    /** For logging. */
    protected typeToString(): string;
    private stateTransition;
    /**
     * The server transaction remains in this state until Timer J fires,
     * at which point it MUST transition to the "Terminated" state.
     * https://tools.ietf.org/html/rfc3261#section-17.2.2
     */
    private timerJ;
}
//# sourceMappingURL=non-invite-server-transaction.d.ts.map