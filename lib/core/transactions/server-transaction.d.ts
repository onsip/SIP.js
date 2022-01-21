import { IncomingRequestMessage } from "../messages";
import { Transport } from "../transport";
import { Transaction } from "./transaction";
import { TransactionState } from "./transaction-state";
import { ServerTransactionUser } from "./transaction-user";
/**
 * Server Transaction.
 * @remarks
 * The server transaction is responsible for the delivery of requests to
 * the TU and the reliable transmission of responses.  It accomplishes
 * this through a state machine.  Server transactions are created by the
 * core when a request is received, and transaction handling is desired
 * for that request (this is not always the case).
 * https://tools.ietf.org/html/rfc3261#section-17.2
 * @public
 */
export declare abstract class ServerTransaction extends Transaction {
    private _request;
    protected user: ServerTransactionUser;
    protected constructor(_request: IncomingRequestMessage, transport: Transport, user: ServerTransactionUser, state: TransactionState, loggerCategory: string);
    /** The incoming request the transaction handling. */
    get request(): IncomingRequestMessage;
    /**
     * Receive incoming requests from the transport which match this transaction.
     * @param request - The incoming request.
     */
    abstract receiveRequest(request: IncomingRequestMessage): void;
    /**
     * Receive outgoing responses to this request from the transaction user.
     * Responses will be delivered to the transport as necessary.
     * @param statusCode - Response status code.
     * @param response - Response.
     */
    abstract receiveResponse(statusCode: number, response: string): void;
}
//# sourceMappingURL=server-transaction.d.ts.map