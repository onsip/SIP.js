import { IncomingResponseMessage, OutgoingRequestMessage } from "../messages";
import { Transport } from "../transport";
import { ClientTransaction } from "./client-transaction";
import { ClientTransactionUser } from "./transaction-user";
/**
 * Non-INVITE Client Transaction.
 * @remarks
 * Non-INVITE transactions do not make use of ACK.
 * They are simple request-response interactions.
 * https://tools.ietf.org/html/rfc3261#section-17.1.2
 * @public
 */
export declare class NonInviteClientTransaction extends ClientTransaction {
    private F;
    private K;
    /**
     * Constructor
     * Upon construction, the outgoing request's Via header is updated by calling `setViaHeader`.
     * Then `toString` is called on the outgoing request and the message is sent via the transport.
     * After construction the transaction will be in the "calling" state and the transaction id
     * will equal the branch parameter set in the Via header of the outgoing request.
     * https://tools.ietf.org/html/rfc3261#section-17.1.2
     * @param request - The outgoing Non-INVITE request.
     * @param transport - The transport.
     * @param user - The transaction user.
     */
    constructor(request: OutgoingRequestMessage, transport: Transport, user: ClientTransactionUser);
    /**
     * Destructor.
     */
    dispose(): void;
    /** Transaction kind. Deprecated. */
    readonly kind: string;
    /**
     * Handler for incoming responses from the transport which match this transaction.
     * @param response - The incoming response.
     */
    receiveResponse(response: IncomingResponseMessage): void;
    /**
     * The client transaction SHOULD inform the TU that a transport failure has occurred,
     * and the client transaction SHOULD transition directly to the "Terminated" state.
     * The TU will handle the fail over mechanisms described in [4].
     * https://tools.ietf.org/html/rfc3261#section-17.1.4
     * @param error - Transport error
     */
    protected onTransportError(error: Error): void;
    /** For logging. */
    protected typeToString(): string;
    /**
     * Execute a state transition.
     * @param newState - New state.
     */
    private stateTransition;
    /**
     * If Timer F fires while the client transaction is still in the
     * "Trying" state, the client transaction SHOULD inform the TU about the
     * timeout, and then it SHOULD enter the "Terminated" state.
     * If timer F fires while in the "Proceeding" state, the TU MUST be informed of
     * a timeout, and the client transaction MUST transition to the terminated state.
     * https://tools.ietf.org/html/rfc3261#section-17.1.2.2
     */
    private timer_F;
    /**
     * If Timer K fires while in this (COMPLETED) state, the client transaction
     * MUST transition to the "Terminated" state.
     * https://tools.ietf.org/html/rfc3261#section-17.1.2.2
     */
    private timer_K;
}
//# sourceMappingURL=non-invite-client-transaction.d.ts.map