import { IncomingRequest } from "../../SIPMessage";
import { Transport } from "../../Transport";

import { Transaction } from "./transaction";
import { TransactionState } from "./transaction-state";
import { ServerTransactionUser } from "./transaction-user";

/**
 * Server Transaction
 * The server transaction is responsible for the delivery of requests to
 * the TU and the reliable transmission of responses.  It accomplishes
 * this through a state machine.  Server transactions are created by the
 * core when a request is received, and transaction handling is desired
 * for that request (this is not always the case).
 * https://tools.ietf.org/html/rfc3261#section-17.2
 */
export abstract class ServerTransaction extends Transaction {
  protected constructor(
    private _request: IncomingRequest,
    transport: Transport,
    protected user: ServerTransactionUser,
    state: TransactionState,
    loggerCategory: string
  ) {
    super(
      transport,
      user,
      _request.viaBranch,
      state,
      loggerCategory
    );

    // FIXME: Bad hack. Potentially creating circular dependency. SIPMessage needs refactor.
    // Set IncomingRequest's transaction.
    _request.transaction = this;
  }

  /** The incoming request the transaction handling. */
  get request(): IncomingRequest {
    return this._request;
  }

  /**
   * Receive incoming requests from the transport which match this transaction.
   * @param request The incoming request.
   */
  public abstract receiveRequest(request: IncomingRequest): void;

  /**
   * Receive outgoing responses to this request from the transaction user.
   * Responses will be delivered to the transport as necessary.
   * @param statusCode Response status code.
   * @param response Response.
   */
  public abstract receiveResponse(statusCode: number, response: string): void;
}
