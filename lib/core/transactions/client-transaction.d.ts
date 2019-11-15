import { IncomingResponseMessage, OutgoingRequestMessage } from "../messages";
import { Transport } from "../transport";
import { Transaction } from "./transaction";
import { TransactionState } from "./transaction-state";
import { ClientTransactionUser } from "./transaction-user";
/**
 * Client Transaction.
 * @remarks
 * The client transaction provides its functionality through the
 * maintenance of a state machine.
 *
 * The TU communicates with the client transaction through a simple
 * interface.  When the TU wishes to initiate a new transaction, it
 * creates a client transaction and passes it the SIP request to send
 * and an IP address, port, and transport to which to send it.  The
 * client transaction begins execution of its state machine.  Valid
 * responses are passed up to the TU from the client transaction.
 * https://tools.ietf.org/html/rfc3261#section-17.1
 * @public
 */
export declare abstract class ClientTransaction extends Transaction {
    private _request;
    protected user: ClientTransactionUser;
    private static makeId;
    protected constructor(_request: OutgoingRequestMessage, transport: Transport, user: ClientTransactionUser, state: TransactionState, loggerCategory: string);
    /** The outgoing request the transaction handling. */
    readonly request: OutgoingRequestMessage;
    /**
     * Receive incoming responses from the transport which match this transaction.
     * Responses will be delivered to the transaction user as necessary.
     * @param response - The incoming response.
     */
    abstract receiveResponse(response: IncomingResponseMessage): void;
    /**
     * A 408 to non-INVITE will always arrive too late to be useful ([3]),
     * The client already has full knowledge of the timeout. The only
     * information this message would convey is whether or not the server
     * believed the transaction timed out. However, with the current design
     * of the NIT, a client cannot do anything with this knowledge. Thus,
     * the 408 is simply wasting network resources and contributes to the
     * response bombardment illustrated in [3].
     * https://tools.ietf.org/html/rfc4320#section-4.1
     */
    protected onRequestTimeout(): void;
}
//# sourceMappingURL=client-transaction.d.ts.map