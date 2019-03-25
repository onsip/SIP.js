import { EventEmitter } from "events";

import { Exceptions } from "./exceptions";
import { LoggerFactory } from "./logger-factory";
import { IncomingRequest, IncomingResponse, OutgoingRequest } from "./sip-message";
import { Transport } from "./transport";
import { UA } from "./ua";

/** Transaction state. */
export declare enum TransactionState {
  Accepted = "Accepted",
  Calling = "Calling",
  Completed = "Completed",
  Confirmed = "Confirmed",
  Proceeding = "Proceeding",
  Terminated = "Terminated",
  Trying = "Trying"
}

/**
 * Transaction
 *
 * SIP is a transactional protocol: interactions between components take
 * place in a series of independent message exchanges. Specifically, a
 * SIP transaction consists of a single request and any responses to
 * that request, which include zero or more provisional responses and
 * one or more final responses. In the case of a transaction where the
 * request was an INVITE (known as an INVITE transaction), the
 * transaction also includes the ACK only if the final response was not
 * a 2xx response. If the response was a 2xx, the ACK is not considered
 * part of the transaction.
 * https://tools.ietf.org/html/rfc3261#section-17
 */
export declare abstract class Transaction extends EventEmitter {
  /** Transaction id. */
  readonly id: string;
  /** Transaction kind. Deprecated. */
  readonly kind: string;
  /** Transaction state. */
  readonly state: TransactionState;
  /** Transaction transport. */
  readonly transport: Transport;
  /**
   * Destructor.
   * Once the transaction is in the "terminated" state, it is destroyed
   * immediately and there is no need to call `dispose`. However, if a
   * transaction needs to be ended prematurely, the transaction user may
   * do so by calling this method (for example, perhaps the UA is shutting down).
   * No state transition will occur upon calling this method, all outstanding
   * transmission timers will be cancelled, and use of the transaction after
   * calling `dispose` is undefined.
   */
  dispose(): void;
}

/**
 * Client Transaction
 *
 * The client transaction provides its functionality through the
 * maintenance of a state machine.
 *
 * The TU communicates with the client transaction through a simple
 * interface. When the TU wishes to initiate a new transaction, it
 * creates a client transaction and passes it the SIP request to send
 * and an IP address, port, and transport to which to send it. The
 * client transaction begins execution of its state machine. Valid
 * responses are passed up to the TU from the client transaction.
 * https://tools.ietf.org/html/rfc3261#section-17.1
 */
export declare abstract class ClientTransaction extends Transaction {
  /** The outgoing request the transaction handling. */
  readonly request: OutgoingRequest;

  /**
   * Receive incoming responses from the transport which match this transaction.
   * Responses will be delivered to the transaction user as necessary.
   * @param response The incoming response.
   */
  receiveResponse(response: IncomingResponse): void;
}

/**
 * INVITE Client Transaction
 *
 * The INVITE transaction consists of a three-way handshake. The client
 * transaction sends an INVITE, the server transaction sends responses,
 * and the client transaction sends an ACK.
 * https://tools.ietf.org/html/rfc3261#section-17.1.1
 */
export declare class InviteClientTransaction extends ClientTransaction {
  /**
   * Constructor.
   * Upon construction, the outgoing request's Via header is updated by calling `setViaHeader`.
   * Then `toString` is called on the outgoing request and the message is sent via the transport.
   * After construction the transaction will be in the "calling" state and the transaction id
   * will equal the branch parameter set in the Via header of the outgoing request.
   * https://tools.ietf.org/html/rfc3261#section-17.1.1
   * @param request The outgoing INVITE request.
   * @param transport The transport.
   * @param user The transaction user.
   */
  constructor(request: OutgoingRequest, transport: Transport, user: ClientTransactionUser);

  /**
   * ACK a 2xx final response.
   *
   * The transaction includes the ACK only if the final response was not a 2xx response (the
   * transaction will generate and send the ACK to the transport automagically). If the
   * final response was a 2xx, the ACK is not considered part of the transaction (the
   * transaction user needs to generate and send the ACK).
   *
   * This library is not strictly RFC compliant with regard to ACK handling for 2xx final
   * responses. Specifically, retransmissions of ACKs to a 2xx final responses is handled
   * by the transaction layer (instead of the UAC core). The "standard" approach is for
   * the UAC core to receive all 2xx responses and manage sending ACK retransmissions to
   * the transport directly. Herein the transaction layer manages sending ACKs to 2xx responses
   * and any retransmissions of those ACKs as needed.
   *
   * @param response The incoming 2xx final response.
   * @param ack The outgoing ACK request.
   */
  public ackResponse(response: IncomingResponse, ack: OutgoingRequest): void;
}

/**
 * Non-INVITE Client Transaction
 *
 * Non-INVITE transactions do not make use of ACK.
 * They are simple request-response interactions.
 * https://tools.ietf.org/html/rfc3261#section-17.1.2
 */
export declare class NonInviteClientTransaction extends ClientTransaction {
  /**
   * Constructor
   * Upon construction, the outgoing request's Via header is updated by calling `setViaHeader`.
   * Then `toString` is called on the outgoing request and the message is sent via the transport.
   * After construction the transaction will be in the "calling" state and the transaction id
   * will equal the branch parameter set in the Via header of the outgoing request.
   * https://tools.ietf.org/html/rfc3261#section-17.1.2
   * @param request The outgoing Non-INVITE request.
   * @param transport The transport.
   * @param user The transaction user.
   */
  constructor(request: OutgoingRequest, transport: Transport, user: ClientTransactionUser);
}

/**
 * Server Transaction
 * The server transaction is responsible for the delivery of requests to
 * the TU and the reliable transmission of responses. It accomplishes
 * this through a state machine. Server transactions are created by the
 * core when a request is received, and transaction handling is desired
 * for that request (this is not always the case).
 * https://tools.ietf.org/html/rfc3261#section-17.2
 */
export declare abstract class ServerTransaction extends Transaction {
  /** The incoming request the transaction handling. */
  readonly request: IncomingRequest;

  /**
   * Receive incoming requests from the transport which match this transaction.
   * @param request The incoming request.
   */
  receiveRequest(request: IncomingRequest): void;

  /**
   * Receive outgoing responses to this request from the transaction user.
   * Responses will be delivered to the transport as necessary.
   * @param statusCode Response status code.
   * @param response Response.
   */
  receiveResponse(statusCode: number, response: string): void;
}

/**
 * INVITE Server Transaction
 * https://tools.ietf.org/html/rfc3261#section-17.2.1
 */
export declare class InviteServerTransaction extends ServerTransaction {
  /**
   * Constructor.
   * Upon construction, a "100 Trying" reply will be immediately sent.
   * After construction the transaction will be in the "proceeding" state and the transaction
   * `id` will equal the branch parameter set in the Via header of the incoming request.
   * https://tools.ietf.org/html/rfc3261#section-17.2.1
   * @param request Incoming INVITE request from the transport.
   * @param transport The transport.
   * @param user The transaction user.
   */
  constructor(request: IncomingRequest, transport: Transport, user: ServerTransactionUser);
}

/**
 * Non-INVITE Server Transaction
 * https://tools.ietf.org/html/rfc3261#section-17.2.2
 */
export declare class NonInviteServerTransaction extends ServerTransaction {
  /**
   * Constructor.
   * After construction the transaction will be in the "trying": state and the transaction
   * `id` will equal the branch parameter set in the Via header of the incoming request.
   * https://tools.ietf.org/html/rfc3261#section-17.2.2
   * @param request Incoming Non-INVITE request from the transport.
   * @param transport The transport.
   * @param user The transaction user.
   */
  constructor(request: IncomingRequest, transport: Transport, user: ServerTransactionUser);
}

/**
 * Transaction User (TU) Inteface
 * The layer of protocol processing that resides above the transaction layer.
 * Transaction users include the UAC core, UAS core, and proxy core.
 * https://tools.ietf.org/html/rfc3261#section-5
 * https://tools.ietf.org/html/rfc3261#section-6
 */
export interface TransactionUser {
  /**
   * Logger factory.
   */
  loggerFactory: LoggerFactory;

  /**
   * Callback for notification of transaction state changes.
   * 
   * Not called when transaction is constructed, so there is
   * no notification of entering the initial transaction state.
   * Otherwise, called once for each transaction state change.
   * State changes adhere to the following RFCs.
   * https://tools.ietf.org/html/rfc3261#section-17
   * https://tools.ietf.org/html/rfc6026
   */
  onStateChange?: (newState: TransactionState) => void;

  /**
   * Callback for notification of a transport error.
   *
   * If a fatal transport error is reported by the transport layer
   * (generally, due to fatal ICMP errors in UDP or connection failures in
   * TCP), the condition MUST be treated as a 503 (Service Unavailable)
   * status code.
   * https://tools.ietf.org/html/rfc3261#section-8.1.3.1
   * https://tools.ietf.org/html/rfc3261#section-17.1.4
   * https://tools.ietf.org/html/rfc3261#section-17.2.4
   * https://tools.ietf.org/html/rfc6026
   */
  onTransportError?: (error: Exceptions.TransportError) => void;
}

/**
 * UAC core Transaction User inteface.
 */
export interface ClientTransactionUser extends TransactionUser {
  /**
   * Callback for request timeout error.
   *
   * When a timeout error is received from the transaction layer, it MUST be
   * treated as if a 408 (Request Timeout) status code has been received.
   * https://tools.ietf.org/html/rfc3261#section-8.1.3.1
   * TU MUST be informed of a timeout.
   * https://tools.ietf.org/html/rfc3261#section-17.1.2.2
   */
  onRequestTimeout?: () => void;

  /**
   * Callback for delegation of valid response handling.
   *
   * Valid responses are passed up to the TU from the client transaction.
   * https://tools.ietf.org/html/rfc3261#section-17.1
   */
  receiveResponse?: (response: IncomingResponse) => void;
}

/**
 * UAS core Transaction User inteface.
 */
export interface ServerTransactionUser extends TransactionUser {
  /**
   * For completeness. Same as `TransactionUser` at this point.
   */
}
