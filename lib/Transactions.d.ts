/// <reference types="node" />
import { EventEmitter } from "events";
import { Exceptions } from "./Exceptions";
import { Logger, LoggerFactory } from "./LoggerFactory";
import { IncomingRequest, IncomingResponse, OutgoingRequest } from "./SIPMessage";
import { Transport } from "./Transport";
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
 * place in a series of independent message exchanges.  Specifically, a
 * SIP transaction consists of a single request and any responses to
 * that request, which include zero or more provisional responses and
 * one or more final responses.  In the case of a transaction where the
 * request was an INVITE (known as an INVITE transaction), the
 * transaction also includes the ACK only if the final response was not
 * a 2xx response.  If the response was a 2xx, the ACK is not considered
 * part of the transaction.
 * https://tools.ietf.org/html/rfc3261#section-17
 */
export declare abstract class Transaction extends EventEmitter {
    private _transport;
    private _user;
    private _id;
    private _state;
    protected logger: Logger;
    protected constructor(_transport: Transport, _user: TransactionUser, _id: string, _state: TransactionState, loggerCategory: string);
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
    /** Transaction id. */
    readonly id: string;
    /** Transaction kind. Deprecated. */
    readonly kind: string;
    /** Transaction state. */
    readonly state: TransactionState;
    /** Transaction transport. */
    readonly transport: Transport;
    /** Subscribe to 'stateChanged' event. */
    on(name: "stateChanged", callback: () => void): this;
    protected logTransportError(error: Exceptions.TransportError, message: string): void;
    protected abstract onTransportError(error: Exceptions.TransportError): void;
    /**
     * Pass message to transport for transmission. If transport fails,
     * the transaction user is notified by callback to onTransportError().
     * @throws {TransportError} If transport fails.
     */
    protected send(message: string): Promise<void>;
    protected setState(state: TransactionState): void;
    private typeToString;
}
/**
 * Client Transaction
 *
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
 */
export declare abstract class ClientTransaction extends Transaction {
    private _request;
    protected user: ClientTransactionUser;
    private static makeId;
    protected constructor(_request: OutgoingRequest, transport: Transport, user: ClientTransactionUser, state: TransactionState, loggerCategory: string);
    /** The outgoing request the transaction handling. */
    readonly request: OutgoingRequest;
    /**
     * Receive incoming responses from the transport which match this transaction.
     * Responses will be delivered to the transaction user as necessary.
     * @param response The incoming response.
     */
    abstract receiveResponse(response: IncomingResponse): void;
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
/**
 * INVITE Client Transaction
 *
 * The INVITE transaction consists of a three-way handshake.  The client
 * transaction sends an INVITE, the server transaction sends responses,
 * and the client transaction sends an ACK.
 * https://tools.ietf.org/html/rfc3261#section-17.1.1
 */
export declare class InviteClientTransaction extends ClientTransaction {
    private B;
    private D;
    private M;
    /**
     * Map of 2xx to-tag => ACK.
     * If value is not undefined, value is the ACK which was sent.
     * If key exists but value is undefined, a 2xx was received but the ACK not yet sent.
     * Otherwise, a 2xx was not (yet) received for this transaction.
     */
    private ackRetransmissionCache;
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
     * Destructor.
     */
    dispose(): void;
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
     * @param ack The outgoing ACK request.
     */
    ackResponse(ack: OutgoingRequest): void;
    /**
     * Handler for incoming responses from the transport which match this transaction.
     * @param response The incoming response.
     */
    receiveResponse(response: IncomingResponse): void;
    /**
     * The client transaction SHOULD inform the TU that a transport failure
     * has occurred, and the client transaction SHOULD transition directly
     * to the "Terminated" state.  The TU will handle the failover
     * mechanisms described in [4].
     * https://tools.ietf.org/html/rfc3261#section-17.1.4
     * @param error The error.
     */
    protected onTransportError(error: Exceptions.TransportError): void;
    private ack;
    /**
     * Execute a state transition.
     * @param newState New state.
     */
    private stateTransition;
    /**
     * When timer A fires, the client transaction MUST retransmit the
     * request by passing it to the transport layer, and MUST reset the
     * timer with a value of 2*T1.
     * When timer A fires 2*T1 seconds later, the request MUST be
     * retransmitted again (assuming the client transaction is still in this
     * state). This process MUST continue so that the request is
     * retransmitted with intervals that double after each transmission.
     * These retransmissions SHOULD only be done while the client
     * transaction is in the "Calling" state.
     * https://tools.ietf.org/html/rfc3261#section-17.1.1.2
     */
    private timer_A;
    /**
     * If the client transaction is still in the "Calling" state when timer
     * B fires, the client transaction SHOULD inform the TU that a timeout
     * has occurred.  The client transaction MUST NOT generate an ACK.
     * https://tools.ietf.org/html/rfc3261#section-17.1.1.2
     */
    private timer_B;
    /**
     * If Timer D fires while the client transaction is in the "Completed" state,
     * the client transaction MUST move to the "Terminated" state.
     * https://tools.ietf.org/html/rfc6026#section-8.4
     */
    private timer_D;
    /**
     * If Timer M fires while the client transaction is in the "Accepted"
     * state, the client transaction MUST move to the "Terminated" state.
     * https://tools.ietf.org/html/rfc6026#section-8.4
     */
    private timer_M;
}
/**
 * Non-INVITE Client Transaction
 *
 * Non-INVITE transactions do not make use of ACK.
 * They are simple request-response interactions.
 * https://tools.ietf.org/html/rfc3261#section-17.1.2
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
     * @param request The outgoing Non-INVITE request.
     * @param transport The transport.
     * @param user The transaction user.
     */
    constructor(request: OutgoingRequest, transport: Transport, user: ClientTransactionUser);
    /**
     * Destructor.
     */
    dispose(): void;
    /**
     * Handler for incoming responses from the transport which match this transaction.
     * @param response The incoming response.
     */
    receiveResponse(response: IncomingResponse): void;
    /**
     * The client transaction SHOULD inform the TU that a transport failure has occurred,
     * and the client transaction SHOULD transition directly to the "Terminated" state.
     * The TU will handle the failover mechanisms described in [4].
     * https://tools.ietf.org/html/rfc3261#section-17.1.4
     * @param error Trasnsport error
     */
    protected onTransportError(error: Error): void;
    /**
     * Execute a state transition.
     * @param newState New state.
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
/**
 * Server Transaction
 * The server transaction is responsible for the delivery of requests to
 * the TU and the reliable transmission of responses.  It accomplishes
 * this through a state machine.  Server transactions are created by the
 * core when a request is received, and transaction handling is desired
 * for that request (this is not always the case).
 * https://tools.ietf.org/html/rfc3261#section-17.2
 */
export declare abstract class ServerTransaction extends Transaction {
    private _request;
    protected user: ServerTransactionUser;
    protected constructor(_request: IncomingRequest, transport: Transport, user: ServerTransactionUser, state: TransactionState, loggerCategory: string);
    /** The incoming request the transaction handling. */
    readonly request: IncomingRequest;
    /**
     * Receive incoming requests from the transport which match this transaction.
     * @param request The incoming request.
     */
    abstract receiveRequest(request: IncomingRequest): void;
    /**
     * Receive outgoing responses to this request from the transaction user.
     * Responses will be delivered to the transport as necessary.
     * @param statusCode Response status code.
     * @param response Response.
     */
    abstract receiveResponse(statusCode: number, response: string): void;
}
/**
 * INVITE Server Transaction
 * https://tools.ietf.org/html/rfc3261#section-17.2.1
 */
export declare class InviteServerTransaction extends ServerTransaction {
    private lastFinalResponse;
    private lastProvisionalResponse;
    private H;
    private I;
    private L;
    /**
     * FIXME: This should not be here. It should be in the UAS.
     *
     * If the UAS desires an extended period of time to answer the INVITE,
     * it will need to ask for an "extension" in order to prevent proxies
     * from canceling the transaction.  A proxy has the option of canceling
     * a transaction when there is a gap of 3 minutes between responses in a
     * transaction.  To prevent cancellation, the UAS MUST send a non-100
     * provisional response at every minute, to handle the possibility of
     * lost provisional responses.
     *
     *   An INVITE transaction can go on for extended durations when the
     *   user is placed on hold, or when interworking with PSTN systems
     *   which allow communications to take place without answering the
     *   call.  The latter is common in Interactive Voice Response (IVR)
     *   systems.
     * https://tools.ietf.org/html/rfc3261#section-13.3.1.1
     */
    private progressExtensionTimer;
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
    /**
     * Destructor.
     */
    dispose(): void;
    /**
     * Receive requests from transport matching this transaction.
     * @param request Request matching this transaction.
     */
    receiveRequest(request: IncomingRequest): void;
    /**
     * Receive responses from TU for this transaction.
     * @param statusCode Status code of response.
     * @param response Response.
     */
    receiveResponse(statusCode: number, response: string): void;
    /**
     * First, the procedures in [4] are followed, which attempt to deliver the response to a backup.
     * If those should all fail, based on the definition of failure in [4], the server transaction SHOULD
     * inform the TU that a failure has occurred, and MUST remain in the current state.
     * https://tools.ietf.org/html/rfc6026#section-8.8
     */
    protected onTransportError(error: Error): void;
    /**
     * Execute a state transition.
     * @param newState New state.
     */
    private stateTransition;
    /**
     * FIXME: UAS Provisional Retransmission Timer. See RFC 3261 Section 13.3.1.1
     * This is in the wrong place. This is not a transaction level thing. It's a UAS level thing.
     */
    private startProgressExtensionTimer;
    /**
     * FIXME: UAS Provisional Retransmission Timer id. See RFC 3261 Section 13.3.1.1
     * This is in the wrong place. This is not a transaction level thing. It's a UAS level thing.
     */
    private stopProgressExtensionTimer;
    /**
     * While in the "Proceeding" state, if the TU passes a response with status code
     * from 300 to 699 to the server transaction, the response MUST be passed to the
     * transport layer for transmission, and the state machine MUST enter the "Completed" state.
     * For unreliable transports, timer G is set to fire in T1 seconds, and is not set to fire for
     * reliable transports. If timer G fires, the response is passed to the transport layer once
     * more for retransmission, and timer G is set to fire in MIN(2*T1, T2) seconds. From then on,
     * when timer G fires, the response is passed to the transport again for transmission, and
     * timer G is reset with a value that doubles, unless that value exceeds T2, in which case
     * it is reset with the value of T2.
     * https://tools.ietf.org/html/rfc3261#section-17.2.1
     */
    private timer_G;
    /**
     * If timer H fires while in the "Completed" state, it implies that the ACK was never received.
     * In this case, the server transaction MUST transition to the "Terminated" state, and MUST
     * indicate to the TU that a transaction failure has occurred.
     * https://tools.ietf.org/html/rfc3261#section-17.2.1
     */
    private timer_H;
    /**
     * Once timer I fires, the server MUST transition to the "Terminated" state.
     * https://tools.ietf.org/html/rfc3261#section-17.2.1
     */
    private timer_I;
    /**
     * When Timer L fires and the state machine is in the "Accepted" state, the machine MUST
     * transition to the "Terminated" state. Once the transaction is in the "Terminated" state,
     * it MUST be destroyed immediately. Timer L reflects the amount of time the server
     * transaction could receive 2xx responses for retransmission from the
     * TU while it is waiting to receive an ACK.
     * https://tools.ietf.org/html/rfc6026#section-7.1
     * https://tools.ietf.org/html/rfc6026#section-8.7
     */
    private timer_L;
}
/**
 * Non-INVITE Server Transaction
 * https://tools.ietf.org/html/rfc3261#section-17.2.2
 */
export declare class NonInviteServerTransaction extends ServerTransaction {
    private lastResponse;
    private J;
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
    /**
     * Destructor.
     */
    dispose(): void;
    /**
     * Receive requests from transport matching this transaction.
     * @param request Request matching this transaction.
     */
    receiveRequest(request: IncomingRequest): void;
    /**
     * Receive responses from TU for this transaction.
     * @param statusCode Status code of repsonse. 101-199 not allowed per RFC 4320.
     * @param response Response to send.
     */
    receiveResponse(statusCode: number, response: string): void;
    /**
     * First, the procedures in [4] are followed, which attempt to deliver the response to a backup.
     * If those should all fail, based on the definition of failure in [4], the server transaction SHOULD
     * inform the TU that a failure has occurred, and SHOULD transition to the terminated state.
     * https://tools.ietf.org/html/rfc3261#section-17.2.4
     */
    protected onTransportError(error: Error): void;
    private stateTransition;
    /**
     * The server transaction remains in this state until Timer J fires,
     * at which point it MUST transition to the "Terminated" state.
     * https://tools.ietf.org/html/rfc3261#section-17.2.2
     */
    private timer_J;
}
/**
 * Transaction User (TU) Interface
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
 * UAS core Transaction User interface.
 */
export interface ServerTransactionUser extends TransactionUser {
}
