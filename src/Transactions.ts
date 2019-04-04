import { EventEmitter } from "events";

import { C as SIPConstants } from "./Constants";
import { Exceptions } from "./Exceptions";
import { Logger, LoggerFactory } from "./LoggerFactory";
import {
  IncomingRequest,
  IncomingResponse,
  OutgoingRequest
} from "./SIPMessage";
import { Timers } from "./Timers";
import { Transport } from "./Transport";

// tslint:disable:max-classes-per-file
// tslint:disable:no-empty-interface

// FIXME & TODO Issues
// - Unreliable transports are not supported; timers missing/wrong, IP address/port, other?
// - UAS Provisional Retransmission Timer. See RFC 3261 Section 13.3.1.1. Per spec, should be handled by the UAS.
// - 2xx response and ACK handling is not to spec. It works, but arguably should be handled by UAC.
// - Transaction ID is currently the branch parameter value - not completely sufficient for transaction matching.
// - Relationship between Request/Response/Message Classes and Transaction could be refactored/reworked.

/** Transaction state. */
export enum TransactionState {
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
export abstract class Transaction extends EventEmitter {
  protected logger: Logger;

  protected constructor(
    private _transport: Transport,
    private _user: TransactionUser,
    private _id: string,
    private _state: TransactionState,
    loggerCategory: string,
  ) {
    super();
    this.logger = _user.loggerFactory.getLogger(loggerCategory, _id);
    this.logger.debug(`Constructing ${this.typeToString()} with id ${this.id}.`);
  }

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
  public dispose(): void {
    this.logger.debug(`Destroyed ${this.typeToString()} with id ${this.id}.`);
  }

  /** Transaction id. */
  get id(): string {
    return this._id;
  }

  /** Transaction kind. Deprecated. */
  get kind(): string {
    if (this instanceof InviteClientTransaction) {
      return "ict";
    } else if (this instanceof NonInviteClientTransaction) {
      return "nict";
    } else if (this instanceof InviteServerTransaction) {
      return "ist";
    } else if (this instanceof NonInviteServerTransaction) {
      return "nist";
    }
    throw new Error("Invalid kind.");
  }

  /** Transaction state. */
  get state(): TransactionState {
    return this._state;
  }

  /** Transaction transport. */
  get transport(): Transport {
    return this._transport;
  }

  /** Subscribe to 'stateChanged' event. */
  public on(name: "stateChanged", callback: () => void): this;
  public on(name: string, callback: (...args: any[]) => void): this  { return super.on(name, callback); }

  protected logTransportError(error: Exceptions.TransportError, message: string): void {
    this.logger.error(error.message);
    this.logger.error(`Transport error occurred in ${this.typeToString()} with id ${this.id}.`);
    this.logger.error(message);
  }

  protected abstract onTransportError(error: Exceptions.TransportError): void;

  /**
   * Pass message to transport for transmission. If transport fails,
   * the transaction user is notified by callback to onTransportError().
   * @throws {TransportError} If transport fails.
   */
  protected send(message: string): Promise<void> {
    return this.transport.send(message).catch((error) => {
      // FIXME: Transport is not, yet, typed and it is not clear
      // yet what send() may or may not send our way. So for now,
      // make sure we convert it to a TransportError if need be.
      if (error instanceof Exceptions.TransportError) {
        this.onTransportError(error);
        return;
      }
      let transportError: Exceptions.TransportError;
      if (error && typeof error.message === "string") {
        transportError = new Exceptions.TransportError(error.message);
      } else {
        transportError = new Exceptions.TransportError();
      }
      this.onTransportError(transportError);
      throw transportError;
    });
  }

  protected setState(state: TransactionState): void {
    this.logger.debug(`State change to "${state}" on ${this.typeToString()} with id ${this.id}.`);
    this._state = state;
    if (this._user.onStateChange) {
      this._user.onStateChange(state);
    }
    this.emit("stateChanged");
  }

  private typeToString(): string {
    let type = "UnknownType";
    if (this instanceof InviteClientTransaction) {
      type = "INVITE client transaction";
    } else if (this instanceof NonInviteClientTransaction) {
      type = "non-INVITE client transaction";
    } else if (this instanceof InviteServerTransaction) {
      type = "INVITE server transaction";
    } else if (this instanceof NonInviteServerTransaction) {
      type = "non-INVITE server transaction";
    }
    return type;
  }
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
export abstract class ClientTransaction extends Transaction {
  private static makeId(request: OutgoingRequest): string {
    if (request.method === "CANCEL") {
      if (!request.branch) {
        throw new Error("Outgoing CANCEL request without a branch.");
      }
      return request.branch;
    } else {
      return "z9hG4bK" + Math.floor(Math.random() * 10000000);
    }
  }

  protected constructor(
    private _request: OutgoingRequest,
    transport: Transport,
    protected user: ClientTransactionUser,
    state: TransactionState,
    loggerCategory: string,
  ) {
    super(
      transport,
      user,
      ClientTransaction.makeId(_request),
      state,
      loggerCategory
    );
    // The Via header field indicates the transport used for the transaction
    // and identifies the location where the response is to be sent.  A Via
    // header field value is added only after the transport that will be
    // used to reach the next hop has been selected (which may involve the
    // usage of the procedures in [4]).
    // https://tools.ietf.org/html/rfc3261#section-8.1.1.7
    _request.setViaHeader(this.id, transport);

    // FIXME: Bad hack. Potentially creating circular dependency. SIPMessage needs refactor.
    // Set OutgoingRequest's transaction.
    _request.transaction = this;
  }

  /** The outgoing request the transaction handling. */
  get request(): OutgoingRequest {
    return this._request;
  }

  /**
   * Receive incoming responses from the transport which match this transaction.
   * Responses will be delivered to the transaction user as necessary.
   * @param response The incoming response.
   */
  public abstract receiveResponse(response: IncomingResponse): void;

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
  protected onRequestTimeout(): void {
    if (this.user.onRequestTimeout) {
      this.user.onRequestTimeout();
    }
  }
}

/**
 * INVITE Client Transaction
 *
 * The INVITE transaction consists of a three-way handshake.  The client
 * transaction sends an INVITE, the server transaction sends responses,
 * and the client transaction sends an ACK.
 * https://tools.ietf.org/html/rfc3261#section-17.1.1
 */
export class InviteClientTransaction extends ClientTransaction {
  private B: any | undefined;
  private D: any | undefined;
  private M: any | undefined;

  /**
   * Map of 2xx to-tag => ACK.
   * If value is not undefined, value is the ACK which was sent.
   * If key exists but value is undefined, a 2xx was received but the ACK not yet sent.
   * Otherwise, a 2xx was not (yet) received for this transaction.
   */
  private ackRetransmissionCache: Map<string, OutgoingRequest | undefined> = new Map();

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
  constructor(request: OutgoingRequest, transport: Transport, user: ClientTransactionUser) {
    super(
      request,
      transport,
      user,
      TransactionState.Calling,
      "sip.transaction.ict"
    );
    // FIXME: Timer A for unreliable transport not implemented
    //
    // If an unreliable transport is being used, the client transaction
    // MUST start timer A with a value of T1. If a reliable transport is being used,
    // the client transaction SHOULD NOT start timer A (Timer A controls request retransmissions).
    // For any transport, the client transaction MUST start timer B with a value
    // of 64*T1 seconds (Timer B controls transaction timeouts).
    // https://tools.ietf.org/html/rfc3261#section-17.1.1.2
    //
    // While not spelled out in the RFC, Timer B is the maximum amount of time that a sender
    // will wait for an INVITE message to be acknowledged (a SIP response message is received).
    // So Timer B should be cleared when the transaction state proceeds from "Calling".
    this.B = setTimeout(() => this.timer_B(), Timers.TIMER_B);
    this.send(request.toString()).catch((error: Exceptions.TransportError) => {
      this.logTransportError(error, "Failed to send initial outgoing request.");
    });
  }

  /**
   * Destructor.
   */
  public dispose(): void {
    if (this.B) {
      clearTimeout(this.B);
      this.B = undefined;
    }
    if (this.D) {
      clearTimeout(this.D);
      this.D = undefined;
    }
    if (this.M) {
      clearTimeout(this.M);
      this.M = undefined;
    }
    super.dispose();
  }

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
  public ackResponse(ack: OutgoingRequest): void {
    const toTag = ack.toTag;
    if (!toTag) {
      throw new Error("To tag undefined.");
    }
    const id = "z9hG4bK" + Math.floor(Math.random() * 10000000);
    ack.setViaHeader(id, this.transport);
    this.ackRetransmissionCache.set(toTag, ack); // Add to ACK retransmission cache
    this.send(ack.toString()).catch((error: Exceptions.TransportError) => {
      this.logTransportError(error, "Failed to send ACK to 2xx response.");
    });
  }

  /**
   * Handler for incoming responses from the transport which match this transaction.
   * @param response The incoming response.
   */
  public receiveResponse(response: IncomingResponse): void {
    const statusCode = response.statusCode;
    if (!statusCode || statusCode < 100 || statusCode > 699) {
      throw new Error(`Invalid status code ${statusCode}`);
    }

    switch (this.state) {
      case TransactionState.Calling:
        // If the client transaction receives a provisional response while in
        // the "Calling" state, it transitions to the "Proceeding" state. In the
        // "Proceeding" state, the client transaction SHOULD NOT retransmit the
        // request any longer. Furthermore, the provisional response MUST be
        // passed to the TU.  Any further provisional responses MUST be passed
        // up to the TU while in the "Proceeding" state.
        // https://tools.ietf.org/html/rfc3261#section-17.1.1.2
        if (statusCode >= 100 && statusCode <= 199) {
          this.stateTransition(TransactionState.Proceeding);
          if (this.user.receiveResponse) {
            this.user.receiveResponse(response);
          }
          return;
        }
        // When a 2xx response is received while in either the "Calling" or
        // "Proceeding" states, the client transaction MUST transition to
        // the "Accepted" state... The 2xx response MUST be passed up to the TU.
        // The client transaction MUST NOT generate an ACK to the 2xx response -- its
        // handling is delegated to the TU. A UAC core will send an ACK to
        // the 2xx response using a new transaction.
        // https://tools.ietf.org/html/rfc6026#section-8.4
        if (statusCode >= 200 && statusCode <= 299) {
          this.ackRetransmissionCache.set(response.toTag, undefined); // Prime the ACK cache
          this.stateTransition(TransactionState.Accepted);
          if (this.user.receiveResponse) {
            this.user.receiveResponse(response);
          }
          return;
        }
        // When in either the "Calling" or "Proceeding" states, reception of
        // a response with status code from 300-699 MUST cause the client
        // transaction to transition to "Completed". The client transaction
        // MUST pass the received response up to the TU, and the client
        // transaction MUST generate an ACK request, even if the transport is
        // reliable (guidelines for constructing the ACK from the response
        // are given in Section 17.1.1.3), and then pass the ACK to the
        // transport layer for transmission. The ACK MUST be sent to the
        // same address, port, and transport to which the original request was sent.
        // https://tools.ietf.org/html/rfc6026#section-8.4
        if (statusCode >= 300 && statusCode <= 699) {
          this.stateTransition(TransactionState.Completed);
          this.ack(response);
          if (this.user.receiveResponse) {
            this.user.receiveResponse(response);
          }
          return;
        }
        break;
      case TransactionState.Proceeding:
        // In the "Proceeding" state, the client transaction SHOULD NOT retransmit the
        // request any longer. Furthermore, the provisional response MUST be
        // passed to the TU.  Any further provisional responses MUST be passed
        // up to the TU while in the "Proceeding" state.
        // https://tools.ietf.org/html/rfc3261#section-17.1.1.2
        if (statusCode >= 100 && statusCode <= 199) {
          if (this.user.receiveResponse) {
            this.user.receiveResponse(response);
          }
          return;
        }
        // When a 2xx response is received while in either the "Calling" or "Proceeding" states,
        // the client transaction MUST transition to the "Accepted" state...
        // The 2xx response MUST be passed up to the TU. The client
        // transaction MUST NOT generate an ACK to the 2xx response -- its
        // handling is delegated to the TU. A UAC core will send an ACK to
        // the 2xx response using a new transaction.
        // https://tools.ietf.org/html/rfc6026#section-8.4
        if (statusCode >= 200 && statusCode <= 299) {
          this.ackRetransmissionCache.set(response.toTag, undefined); // Prime the ACK cache
          this.stateTransition(TransactionState.Accepted);
          if (this.user.receiveResponse) {
            this.user.receiveResponse(response);
          }
          return;
        }
        // When in either the "Calling" or "Proceeding" states, reception of
        // a response with status code from 300-699 MUST cause the client
        // transaction to transition to "Completed". The client transaction
        // MUST pass the received response up to the TU, and the client
        // transaction MUST generate an ACK request, even if the transport is
        // reliable (guidelines for constructing the ACK from the response
        // are given in Section 17.1.1.3), and then pass the ACK to the
        // transport layer for transmission. The ACK MUST be sent to the
        // same address, port, and transport to which the original request was sent.
        // https://tools.ietf.org/html/rfc6026#section-8.4
        if (statusCode >= 300 && statusCode <= 699) {
          this.stateTransition(TransactionState.Completed);
          this.ack(response);
          if (this.user.receiveResponse) {
            this.user.receiveResponse(response);
          }
          return;
        }
        break;
      case TransactionState.Accepted:
        // The purpose of the "Accepted" state is to allow the client
        // transaction to continue to exist to receive, and pass to the TU,
        // any retransmissions of the 2xx response and any additional 2xx
        // responses from other branches of the INVITE if it forked
        // downstream. Timer M reflects the amount of time that the
        // transaction user will wait for such messages.
        //
        // Any 2xx responses that match this client transaction and that are
        // received while in the "Accepted" state MUST be passed up to the
        // TU. The client transaction MUST NOT generate an ACK to the 2xx
        // response. The client transaction takes no further action.
        // https://tools.ietf.org/html/rfc6026#section-8.4
        if (statusCode >= 200 && statusCode <= 299) {
          // NOTE: This implementation herein is intentionally not RFC compliant.
          // While the first 2xx response for a given branch is passed up to the TU,
          // retransmissions of 2xx responses are absorbed and the ACK associated
          // with the original response is resent. This approach is taken because
          // our current transaction users are not currently in a good position to
          // deal with 2xx retransmission. This SHOULD NOT cause any compliance issues - ;)
          //
          // If we don't have a cache hit, pass the response to the TU.
          if (!this.ackRetransmissionCache.has(response.toTag)) {
            this.ackRetransmissionCache.set(response.toTag, undefined); // Prime the ACK cache
            if (this.user.receiveResponse) {
              this.user.receiveResponse(response);
            }
            return;
          }
          // If we have a cache hit, try pulling the ACK from cache and retransmitting it.
          const ack = this.ackRetransmissionCache.get(response.toTag);
          if (ack) {
            this.send(ack.toString()).catch((error: Exceptions.TransportError) => {
              this.logTransportError(error, "Failed to send retransmission of ACK to 2xx response.");
            });
            return;
          }
          // If an ACK was not found in cache then we have received a retransmitted 2xx
          // response before the TU responded to the original response (we don't have an ACK yet).
          // So discard this response under the assumption that the TU will eventually
          // get us a ACK for the original response.
          return;
        }
        break;
      case TransactionState.Completed:
        // Any retransmissions of a response with status code 300-699 that
        // are received while in the "Completed" state MUST cause the ACK to
        // be re-passed to the transport layer for retransmission, but the
        // newly received response MUST NOT be passed up to the TU.
        // https://tools.ietf.org/html/rfc6026#section-8.4
        if (statusCode >= 300 && statusCode <= 699) {
          this.ack(response);
          return;
        }
        break;
      case TransactionState.Terminated:
        break;
      default:
        throw new Error(`Invalid state ${this.state}`);
    }

    // Any response received that does not match an existing client
    // transaction state machine is simply dropped. (Implementations are,
    // of course, free to log or do other implementation-specific things
    // with such responses, but the implementer should be sure to consider
    // the impact of large numbers of malicious stray responses.)
    // https://tools.ietf.org/html/rfc6026#section-7.2
    const message = `Received unexpected ${statusCode} response while in state ${this.state}.`;
    this.logger.warn(message);
    return;
  }

  /**
   * The client transaction SHOULD inform the TU that a transport failure
   * has occurred, and the client transaction SHOULD transition directly
   * to the "Terminated" state.  The TU will handle the failover
   * mechanisms described in [4].
   * https://tools.ietf.org/html/rfc3261#section-17.1.4
   * @param error The error.
   */
  protected onTransportError(error: Exceptions.TransportError): void {
    if (this.user.onTransportError) {
      this.user.onTransportError(error);
    }
    this.stateTransition(TransactionState.Terminated, true);
  }

  private ack(response: IncomingResponse): void {
    // The ACK request constructed by the client transaction MUST contain
    // values for the Call-ID, From, and Request-URI that are equal to the
    // values of those header fields in the request passed to the transport
    // by the client transaction (call this the "original request"). The To
    // header field in the ACK MUST equal the To header field in the
    // response being acknowledged, and therefore will usually differ from
    // the To header field in the original request by the addition of the
    // tag parameter. The ACK MUST contain a single Via header field, and
    // this MUST be equal to the top Via header field of the original
    // request. The CSeq header field in the ACK MUST contain the same
    // value for the sequence number as was present in the original request,
    // but the method parameter MUST be equal to "ACK".
    //
    // If the INVITE request whose response is being acknowledged had Route
    // header fields, those header fields MUST appear in the ACK. This is
    // to ensure that the ACK can be routed properly through any downstream
    // stateless proxies.
    // https://tools.ietf.org/html/rfc3261#section-17.1.1.3
    const ruri = this.request.ruri;
    const callId = this.request.callId;
    const cseq = this.request.cseq;
    const from = this.request.getHeader("from");
    const to = response.getHeader("to");
    const via = this.request.getHeader("via");
    const route = this.request.getHeader("route");
    if (!from) {
      throw new Error("From undefined.");
    }
    if (!to) {
      throw new Error("To undefined.");
    }
    if (!via) {
      throw new Error("Via undefined.");
    }

    let ack = `ACK ${ruri} SIP/2.0\r\n`;
    if (route) {
      ack += `Route: ${route}\r\n`;
    }
    ack += `Via: ${via}\r\n`;
    ack += `To: ${to}\r\n`;
    ack += `From: ${from}\r\n`;
    ack += `Call-ID: ${callId}\r\n`;
    ack += `CSeq: ${cseq} ACK\r\n`;
    ack += `Max-Forwards: 70\r\n`;
    ack += `Content-Length: 0\r\n\r\n`;

    // TOOO: "User-Agent" header

    this.send(ack).catch((error: Exceptions.TransportError) => {
      this.logTransportError(error, "Failed to send ACK to non-2xx response.");
    });
    return;
  }

  /**
   * Execute a state transition.
   * @param newState New state.
   */
  private stateTransition(newState: TransactionState, dueToTransportError = false): void {
    // Assert valid state transitions.
    const invalidStateTransition = () => {
      throw new Error(`Invalid state transition from ${this.state} to ${newState}`);
    };

    switch (newState) {
      case TransactionState.Calling:
        invalidStateTransition();
        break;
      case TransactionState.Proceeding:
        if (this.state !== TransactionState.Calling) {
          invalidStateTransition();
        }
        break;
      case TransactionState.Accepted:
      case TransactionState.Completed:
        if (
          this.state !== TransactionState.Calling &&
          this.state !== TransactionState.Proceeding
        ) {
          invalidStateTransition();
        }
        break;
      case TransactionState.Terminated:
        if (
          this.state !== TransactionState.Calling &&
          this.state !== TransactionState.Accepted &&
          this.state !== TransactionState.Completed
        ) {
          if (!dueToTransportError) {
            invalidStateTransition();
          }
        }
        break;
      default:
        invalidStateTransition();
    }

    // While not spelled out in the RFC, Timer B is the maximum amount of time that a sender
    // will wait for an INVITE message to be acknowledged (a SIP response message is received).
    // So Timer B should be cleared when the transaction state proceeds from "Calling".
    if (this.B) {
      clearTimeout(this.B);
      this.B = undefined;
    }

    if (newState === TransactionState.Proceeding) {
      // Timers have no effect on "Proceeding" state.
      // In the "Proceeding" state, the client transaction
      // SHOULD NOT retransmit the request any longer.
      // https://tools.ietf.org/html/rfc3261#section-17.1.1.2
    }

    // The client transaction MUST start Timer D when it enters the "Completed" state
    // for any reason, with a value of at least 32 seconds for unreliable transports,
    // and a value of zero seconds for reliable transports.
    // https://tools.ietf.org/html/rfc6026#section-8.4
    if (newState === TransactionState.Completed) {
      this.D = setTimeout(() => this.timer_D(), Timers.TIMER_D);
    }

    // The client transaction MUST transition to the "Accepted" state,
    // and Timer M MUST be started with a value of 64*T1.
    // https://tools.ietf.org/html/rfc6026#section-8.4
    if (newState === TransactionState.Accepted) {
      this.M = setTimeout(() => this.timer_M(), Timers.TIMER_M);
    }

    // Once the transaction is in the "Terminated" state, it MUST be destroyed immediately.
    // https://tools.ietf.org/html/rfc6026#section-8.7
    if (newState === TransactionState.Terminated) {
      this.dispose();
    }

    // Update state.
    this.setState(newState);
  }

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
  private timer_A(): void {
    // TODO
  }

  /**
   * If the client transaction is still in the "Calling" state when timer
   * B fires, the client transaction SHOULD inform the TU that a timeout
   * has occurred.  The client transaction MUST NOT generate an ACK.
   * https://tools.ietf.org/html/rfc3261#section-17.1.1.2
   */
  private timer_B(): void {
    this.logger.debug(`Timer B expired for INVITE client transaction ${this.id}.`);
    if (this.state === TransactionState.Calling) {
      this.onRequestTimeout();
      this.stateTransition(TransactionState.Terminated);
    }
  }

  /**
   * If Timer D fires while the client transaction is in the "Completed" state,
   * the client transaction MUST move to the "Terminated" state.
   * https://tools.ietf.org/html/rfc6026#section-8.4
   */
  private timer_D(): void {
    this.logger.debug(`Timer D expired for INVITE client transaction ${this.id}.`);
    if (this.state === TransactionState.Completed) {
      this.stateTransition(TransactionState.Terminated);
    }
  }

  /**
   * If Timer M fires while the client transaction is in the "Accepted"
   * state, the client transaction MUST move to the "Terminated" state.
   * https://tools.ietf.org/html/rfc6026#section-8.4
   */
  private timer_M(): void {
    this.logger.debug(`Timer M expired for INVITE client transaction ${this.id}.`);
    if (this.state === TransactionState.Accepted) {
      this.stateTransition(TransactionState.Terminated);
    }
  }
}

/**
 * Non-INVITE Client Transaction
 *
 * Non-INVITE transactions do not make use of ACK.
 * They are simple request-response interactions.
 * https://tools.ietf.org/html/rfc3261#section-17.1.2
 */
export class NonInviteClientTransaction extends ClientTransaction {
  private F: any | undefined;
  private K: any | undefined;

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
  constructor(request: OutgoingRequest, transport: Transport, user: ClientTransactionUser) {
    super(
      request,
      transport,
      user,
      TransactionState.Trying,
      "sip.transaction.nict"
    );
    // FIXME: Timer E for unreliable transports not implemented.
    //
    // The "Trying" state is entered when the TU initiates a new client
    // transaction with a request.  When entering this state, the client
    // transaction SHOULD set timer F to fire in 64*T1 seconds. The request
    // MUST be passed to the transport layer for transmission.
    // https://tools.ietf.org/html/rfc3261#section-17.1.2.2
    this.F = setTimeout(() => this.timer_F(), Timers.TIMER_F);
    this.send(request.toString()).catch((error: Exceptions.TransportError) => {
      this.logTransportError(error, "Failed to send initial outgoing request.");
    });
  }

  /**
   * Destructor.
   */
  public dispose(): void {
    if (this.F) {
      clearTimeout(this.F);
      this.F = undefined;
    }
    if (this.K) {
      clearTimeout(this.K);
      this.K = undefined;
    }
    super.dispose();
  }

  /**
   * Handler for incoming responses from the transport which match this transaction.
   * @param response The incoming response.
   */
  public receiveResponse(response: IncomingResponse): void {
    const statusCode = response.statusCode;
    if (!statusCode || statusCode < 100 || statusCode > 699) {
      throw new Error(`Invalid status code ${statusCode}`);
    }

    switch (this.state) {
      case TransactionState.Trying:
        // If a provisional response is received while in the "Trying" state, the
        // response MUST be passed to the TU, and then the client transaction
        // SHOULD move to the "Proceeding" state.
        // https://tools.ietf.org/html/rfc3261#section-17.1.2.2
        if (statusCode >= 100 && statusCode <= 199) {
          this.stateTransition(TransactionState.Proceeding);
          if (this.user.receiveResponse) {
            this.user.receiveResponse(response);
          }
          return;
        }
        // If a final response (status codes 200-699) is received while in the
        // "Trying" state, the response MUST be passed to the TU, and the
        // client transaction MUST transition to the "Completed" state.
        // https://tools.ietf.org/html/rfc3261#section-17.1.2.2
        if (statusCode >= 200 && statusCode <= 699) {
          this.stateTransition(TransactionState.Completed);
          if (statusCode === 408) {
            this.onRequestTimeout();
            return;
          }
          if (this.user.receiveResponse) {
            this.user.receiveResponse(response);
          }
          return;
        }
        break;
      case TransactionState.Proceeding:
        // If a provisional response is received while in the "Proceeding" state,
        // the response MUST be passed to the TU. (From Figure 6)
        // https://tools.ietf.org/html/rfc3261#section-17.1.2.2
        if (statusCode >= 100 && statusCode <= 199) {
          if (this.user.receiveResponse) {
            return this.user.receiveResponse(response);
          }
        }
        // If a final response (status codes 200-699) is received while in the
        // "Proceeding" state, the response MUST be passed to the TU, and the
        // client transaction MUST transition to the "Completed" state.
        // https://tools.ietf.org/html/rfc3261#section-17.1.2.2
        if (statusCode >= 200 && statusCode <= 699) {
          this.stateTransition(TransactionState.Completed);
          if (statusCode === 408) {
            this.onRequestTimeout();
            return;
          }
          if (this.user.receiveResponse) {
            this.user.receiveResponse(response);
          }
          return;
        }
      case TransactionState.Completed:
        // The "Completed" state exists to buffer any additional response
        // retransmissions that may be received (which is why the client
        // transaction remains there only for unreliable transports).
        // https://tools.ietf.org/html/rfc3261#section-17.1.2.2
        return;
      case TransactionState.Terminated:
        // For good measure just absorb additional response retransmissions.
        return;
      default:
        throw new Error(`Invalid state ${this.state}`);
    }

    const message =
      `Non-INVITE client transaction received unexpected ${statusCode} response while in state ${this.state}.`;
    this.logger.warn(message);
    return;
  }

  /**
   * The client transaction SHOULD inform the TU that a transport failure has occurred,
   * and the client transaction SHOULD transition directly to the "Terminated" state.
   * The TU will handle the failover mechanisms described in [4].
   * https://tools.ietf.org/html/rfc3261#section-17.1.4
   * @param error Trasnsport error
   */
  protected onTransportError(error: Error): void {
    if (this.user.onTransportError) {
      this.user.onTransportError(error);
    }
    this.stateTransition(TransactionState.Terminated, true);
  }

  /**
   * Execute a state transition.
   * @param newState New state.
   */
  private stateTransition(newState: TransactionState, dueToTransportError = false): void {
    // Assert valid state transitions.
    const invalidStateTransition = () => {
      throw new Error(`Invalid state transition from ${this.state} to ${newState}`);
    };

    switch (newState) {
      case TransactionState.Trying:
        invalidStateTransition();
        break;
      case TransactionState.Proceeding:
        if (this.state !== TransactionState.Trying) {
          invalidStateTransition();
        }
        break;
      case TransactionState.Completed:
        if (
          this.state !== TransactionState.Trying &&
          this.state !== TransactionState.Proceeding
        ) {
          invalidStateTransition();
        }
        break;
      case TransactionState.Terminated:
        if (
          this.state !== TransactionState.Trying &&
          this.state !== TransactionState.Proceeding &&
          this.state !== TransactionState.Completed
        ) {
          if (!dueToTransportError) {
            invalidStateTransition();
          }
        }
        break;
      default:
        invalidStateTransition();
    }

    // Once the client transaction enters the "Completed" state, it MUST set
    // Timer K to fire in T4 seconds for unreliable transports, and zero
    // seconds for reliable transports  The "Completed" state exists to
    // buffer any additional response retransmissions that may be received
    // (which is why the client transaction remains there only for unreliable transports).
    // https://tools.ietf.org/html/rfc3261#section-17.1.2.2
    if (newState === TransactionState.Completed) {
      if (this.F) {
        clearTimeout(this.F);
        this.F = undefined;
      }
      this.K = setTimeout(() => this.timer_K(), Timers.TIMER_K);
    }

    // Once the transaction is in the terminated state, it MUST be destroyed immediately.
    // https://tools.ietf.org/html/rfc3261#section-17.1.2.2
    if (newState === TransactionState.Terminated) {
      this.dispose();
    }

    // Update state.
    this.setState(newState);
  }

  /**
   * If Timer F fires while the client transaction is still in the
   * "Trying" state, the client transaction SHOULD inform the TU about the
   * timeout, and then it SHOULD enter the "Terminated" state.
   * If timer F fires while in the "Proceeding" state, the TU MUST be informed of
   * a timeout, and the client transaction MUST transition to the terminated state.
   * https://tools.ietf.org/html/rfc3261#section-17.1.2.2
   */
  private timer_F(): void {
    this.logger.debug(`Timer F expired for non-INVITE client transaction ${this.id}.`);
    if (this.state === TransactionState.Trying || this.state === TransactionState.Proceeding) {
      this.onRequestTimeout();
      this.stateTransition(TransactionState.Terminated);
    }
  }

  /**
   * If Timer K fires while in this (COMPLETED) state, the client transaction
   * MUST transition to the "Terminated" state.
   * https://tools.ietf.org/html/rfc3261#section-17.1.2.2
   */
  private timer_K(): void {
    if (this.state === TransactionState.Completed) {
      this.stateTransition(TransactionState.Terminated);
    }
  }
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

/**
 * INVITE Server Transaction
 * https://tools.ietf.org/html/rfc3261#section-17.2.1
 */
export class InviteServerTransaction extends ServerTransaction {
  private lastFinalResponse: string | undefined;
  private lastProvisionalResponse: string | undefined;
  private H: any | undefined;
  private I: any | undefined;
  private L: any | undefined;

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
  private progressExtensionTimer: any | undefined;

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
  constructor(request: IncomingRequest, transport: Transport, user: ServerTransactionUser) {
    super(
      request,
      transport,
      user,
      TransactionState.Proceeding,
      "sip.transaction.ist"
    );

    // FIXME: This is in the wrong place - UAS should trigger it.
    // Results in this this.receiveResponse() being called.
    // FIXME: Should be configurable. Only required if TU will not respond in 200ms.
    // https://tools.ietf.org/html/rfc3261#section-17.2.1
    request.reply(100);
  }

  /**
   * Destructor.
   */
  public dispose(): void {
    this.stopProgressExtensionTimer();
    if (this.H) {
      clearTimeout(this.H);
      this.H = undefined;
    }
    if (this.I) {
      clearTimeout(this.I);
      this.I = undefined;
    }
    if (this.L) {
      clearTimeout(this.L);
      this.L = undefined;
    }
    super.dispose();
  }

  /**
   * Receive requests from transport matching this transaction.
   * @param request Request matching this transaction.
   */
  public receiveRequest(request: IncomingRequest): void {
    switch (this.state) {
      case TransactionState.Proceeding:
        // If a request retransmission is received while in the "Proceeding" state, the most
        // recent provisional response that was received from the TU MUST be passed to the
        // transport layer for retransmission.
        // https://tools.ietf.org/html/rfc3261#section-17.2.1
        if (request.method === SIPConstants.INVITE) {
          if (this.lastProvisionalResponse) {
            this.send(this.lastProvisionalResponse).catch((error: Exceptions.TransportError) => {
              this.logTransportError(error, "Failed to send retransmission of provisional response.");
            });
          }
          return;
        }
        break;
      case TransactionState.Accepted:
        // While in the "Accepted" state, any retransmissions of the INVITE
        // received will match this transaction state machine and will be
        // absorbed by the machine without changing its state. These
        // retransmissions are not passed onto the TU.
        // https://tools.ietf.org/html/rfc6026#section-7.1
        if (request.method === SIPConstants.INVITE) {
          return;
        }
        break;
      case TransactionState.Completed:
        // Furthermore, while in the "Completed" state, if a request retransmission is
        // received, the server SHOULD pass the response to the transport for retransmission.
        // https://tools.ietf.org/html/rfc3261#section-17.2.1
        if (request.method === SIPConstants.INVITE) {
          if (!this.lastFinalResponse) {
            throw new Error("Last final response undefined.");
          }
          this.send(this.lastFinalResponse).catch((error: Exceptions.TransportError) => {
            this.logTransportError(error, "Failed to send retransmission of final response.");
          });
          return;
        }
        // If an ACK is received while the server transaction is in the "Completed" state,
        // the server transaction MUST transition to the "Confirmed" state.
        // https://tools.ietf.org/html/rfc3261#section-17.2.1
        if (request.method === SIPConstants.ACK) {
          this.stateTransition(TransactionState.Confirmed);
          return;
        }
        break;
      case TransactionState.Confirmed:
        // The purpose of the "Confirmed" state is to absorb any additional ACK messages that arrive,
        // triggered from retransmissions of the final response.
        // https://tools.ietf.org/html/rfc3261#section-17.2.1
        if (request.method === SIPConstants.INVITE || request.method === SIPConstants.ACK) {
          return;
        }
        break;
      case TransactionState.Terminated:
        // For good measure absorb any additional messages that arrive (should not happen).
        if (request.method === SIPConstants.INVITE || request.method === SIPConstants.ACK) {
          return;
        }
        break;
      default:
        throw new Error(`Invalid state ${this.state}`);
    }

    const message =
      `INVITE server transaction received unexpected ${request.method} request while in state ${this.state}.`;
    this.logger.warn(message);
    return;
  }

  /**
   * Receive responses from TU for this transaction.
   * @param statusCode Status code of response.
   * @param response Response.
   */
  public receiveResponse(statusCode: number, response: string): void {
    if (statusCode < 100 || statusCode > 699) {
      throw new Error(`Invalid status code ${statusCode}`);
    }

    switch (this.state) {
      case TransactionState.Proceeding:
        // The TU passes any number of provisional responses to the server
        // transaction. So long as the server transaction is in the
        // "Proceeding" state, each of these MUST be passed to the transport
        // layer for transmission. They are not sent reliably by the
        // transaction layer (they are not retransmitted by it) and do not cause
        // a change in the state of the server transaction.
        // https://tools.ietf.org/html/rfc3261#section-17.2.1
        if (statusCode >= 100 && statusCode <= 199) {
          this.lastProvisionalResponse = response;
          // Start the progress extension timer only for a non-100 provisional response.
          if (statusCode > 100) {
            this.startProgressExtensionTimer(); // FIXME: remove
          }
          this.send(response).catch((error: Exceptions.TransportError) => {
            this.logTransportError(error, "Failed to send 1xx response.");
          });
          return;
        }
        // If, while in the "Proceeding" state, the TU passes a 2xx response
        // to the server transaction, the server transaction MUST pass this
        // response to the transport layer for transmission. It is not
        // retransmitted by the server transaction; retransmissions of 2xx
        // responses are handled by the TU. The server transaction MUST then
        // transition to the "Accepted" state.
        // https://tools.ietf.org/html/rfc6026#section-8.5
        if (statusCode >= 200 && statusCode <= 299) {
          this.lastFinalResponse = response;
          this.stateTransition(TransactionState.Accepted);
          this.send(response).catch((error: Exceptions.TransportError) => {
            this.logTransportError(error, "Failed to send 2xx response.");
          });
          return;
        }
        // While in the "Proceeding" state, if the TU passes a response with
        // status code from 300 to 699 to the server transaction, the response
        // MUST be passed to the transport layer for transmission, and the state
        // machine MUST enter the "Completed" state.
        // https://tools.ietf.org/html/rfc3261#section-17.2.1
        if (statusCode >= 300 && statusCode <= 699) {
          this.lastFinalResponse = response;
          this.stateTransition(TransactionState.Completed);
          this.send(response).catch((error: Exceptions.TransportError) => {
            this.logTransportError(error, "Failed to send non-2xx final response.");
          });
          return;
        }
        break;
      case TransactionState.Accepted:
        // While in the "Accepted" state, if the TU passes a 2xx response,
        // the server transaction MUST pass the response to the transport layer for transmission.
        // https://tools.ietf.org/html/rfc6026#section-8.7
        if (statusCode >= 200 && statusCode <= 299) {
          this.send(response).catch((error: Exceptions.TransportError) => {
            this.logTransportError(error, "Failed to send 2xx response.");
          });
          return;
        }
        break;
      case TransactionState.Completed:
        break;
      case TransactionState.Confirmed:
        break;
      case TransactionState.Terminated:
        break;
      default:
        throw new Error(`Invalid state ${this.state}`);
    }

    const message =
      `INVITE server transaction received unexpected ${statusCode} response from TU while in state ${this.state}.`;
    this.logger.error(message);
    throw new Error(message);
  }

  /**
   * First, the procedures in [4] are followed, which attempt to deliver the response to a backup.
   * If those should all fail, based on the definition of failure in [4], the server transaction SHOULD
   * inform the TU that a failure has occurred, and MUST remain in the current state.
   * https://tools.ietf.org/html/rfc6026#section-8.8
   */
  protected onTransportError(error: Error): void {
    if (this.user.onTransportError) {
      this.user.onTransportError(error);
    }
  }

  /**
   * Execute a state transition.
   * @param newState New state.
   */
  private stateTransition(newState: TransactionState): void {
    // Assert valid state transitions.
    const invalidStateTransition = () => {
      throw new Error(`Invalid state transition from ${this.state} to ${newState}`);
    };

    switch (newState) {
      case TransactionState.Proceeding:
        invalidStateTransition();
        break;
      case TransactionState.Accepted:
      case TransactionState.Completed:
        if (this.state !== TransactionState.Proceeding) {
          invalidStateTransition();
        }
        break;
      case TransactionState.Confirmed:
        if (this.state !== TransactionState.Completed) {
          invalidStateTransition();
        }
        break;
      case TransactionState.Terminated:
        if (
          this.state !== TransactionState.Accepted &&
          this.state !== TransactionState.Completed &&
          this.state !== TransactionState.Confirmed
        ) {
          invalidStateTransition();
        }
        break;
      default:
        invalidStateTransition();
    }

    // On any state transition, stop resending provisonal responses
    this.stopProgressExtensionTimer();

    // The purpose of the "Accepted" state is to absorb retransmissions of an accepted INVITE request.
    // Any such retransmissions are absorbed entirely within the server transaction.
    // They are not passed up to the TU since any downstream UAS cores that accepted the request have
    // taken responsibility for reliability and will already retransmit their 2xx responses if necessary.
    // https://tools.ietf.org/html/rfc6026#section-8.7
    if (newState === TransactionState.Accepted) {
      this.L = setTimeout(() => this.timer_L(), Timers.TIMER_L);
    }

    // When the "Completed" state is entered, timer H MUST be set to fire in 64*T1 seconds for all transports.
    // Timer H determines when the server transaction abandons retransmitting the response.
    // If an ACK is received while the server transaction is in the "Completed" state,
    // the server transaction MUST transition to the "Confirmed" state.
    // https://tools.ietf.org/html/rfc3261#section-17.2.1
    if (newState === TransactionState.Completed) {
      // FIXME: Missing timer G for unreliable transports.
      this.H = setTimeout(() => this.timer_H(), Timers.TIMER_H);
    }

    // The purpose of the "Confirmed" state is to absorb any additional ACK messages that arrive,
    // triggered from retransmissions of the final response. When this state is entered, timer I
    // is set to fire in T4 seconds for unreliable transports, and zero seconds for reliable
    // transports. Once timer I fires, the server MUST transition to the "Terminated" state.
    // https://tools.ietf.org/html/rfc3261#section-17.2.1
    if (newState === TransactionState.Confirmed) {
      // FIXME: This timer is not getting set correctly for unreliable transports.
      this.I = setTimeout(() => this.timer_I(), Timers.TIMER_I);
    }

    // Once the transaction is in the "Terminated" state, it MUST be destroyed immediately.
    // https://tools.ietf.org/html/rfc6026#section-8.7
    if (newState === TransactionState.Terminated) {
      this.dispose();
    }

    // Update state.
    this.setState(newState);
  }

  /**
   * FIXME: UAS Provisional Retransmission Timer. See RFC 3261 Section 13.3.1.1
   * This is in the wrong place. This is not a transaction level thing. It's a UAS level thing.
   */
  private startProgressExtensionTimer(): void {
    // Start the progress extension timer only for the first non-100 provisional response.
    if (this.progressExtensionTimer === undefined) {
      this.progressExtensionTimer = setInterval(() => {
        this.logger.debug(`Progress extension timer expired for INVITE server transaction ${this.id}.`);
        if (!this.lastProvisionalResponse) {
          throw new Error("Last provisional response undefined.");
        }
        this.send(this.lastProvisionalResponse).catch((error: Exceptions.TransportError) => {
          this.logTransportError(error, "Failed to send retransmission of provisional response.");
        });
      }, Timers.PROVISIONAL_RESPONSE_INTERVAL);
    }
  }

  /**
   * FIXME: UAS Provisional Retransmission Timer id. See RFC 3261 Section 13.3.1.1
   * This is in the wrong place. This is not a transaction level thing. It's a UAS level thing.
   */
  private stopProgressExtensionTimer(): void {
    if (this.progressExtensionTimer !== undefined) {
      clearInterval(this.progressExtensionTimer);
      this.progressExtensionTimer = undefined;
    }
  }

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
  private timer_G(): void {
    // TODO
  }

  /**
   * If timer H fires while in the "Completed" state, it implies that the ACK was never received.
   * In this case, the server transaction MUST transition to the "Terminated" state, and MUST
   * indicate to the TU that a transaction failure has occurred.
   * https://tools.ietf.org/html/rfc3261#section-17.2.1
   */
  private timer_H(): void {
    this.logger.debug(`Timer H expired for INVITE server transaction ${this.id}.`);
    if (this.state === TransactionState.Completed) {
      this.logger.warn("ACK to negative final response was never received, terminating transaction.");
      this.stateTransition(TransactionState.Terminated);
    }
  }

  /**
   * Once timer I fires, the server MUST transition to the "Terminated" state.
   * https://tools.ietf.org/html/rfc3261#section-17.2.1
   */
  private timer_I(): void {
    this.logger.debug(`Timer I expired for INVITE server transaction ${this.id}.`);
    this.stateTransition(TransactionState.Terminated);
  }

  /**
   * When Timer L fires and the state machine is in the "Accepted" state, the machine MUST
   * transition to the "Terminated" state. Once the transaction is in the "Terminated" state,
   * it MUST be destroyed immediately. Timer L reflects the amount of time the server
   * transaction could receive 2xx responses for retransmission from the
   * TU while it is waiting to receive an ACK.
   * https://tools.ietf.org/html/rfc6026#section-7.1
   * https://tools.ietf.org/html/rfc6026#section-8.7
   */
  private timer_L(): void {
    this.logger.debug(`Timer L expired for INVITE server transaction ${this.id}.`);
    if (this.state === TransactionState.Accepted) {
      this.stateTransition(TransactionState.Terminated);
    }
  }
}

/**
 * Non-INVITE Server Transaction
 * https://tools.ietf.org/html/rfc3261#section-17.2.2
 */
export class NonInviteServerTransaction extends ServerTransaction {
  private lastResponse: string | undefined;
  private J: any | undefined;

  /**
   * Constructor.
   * After construction the transaction will be in the "trying": state and the transaction
   * `id` will equal the branch parameter set in the Via header of the incoming request.
   * https://tools.ietf.org/html/rfc3261#section-17.2.2
   * @param request Incoming Non-INVITE request from the transport.
   * @param transport The transport.
   * @param user The transaction user.
   */
  constructor(request: IncomingRequest, transport: Transport, user: ServerTransactionUser) {
    super(
      request,
      transport,
      user,
      TransactionState.Trying,
      "sip.transaction.nist"
    );
  }

  /**
   * Destructor.
   */
  public dispose(): void {
    if (this.J) {
      clearTimeout(this.J);
      this.J = undefined;
    }
    super.dispose();
  }

  /**
   * Receive requests from transport matching this transaction.
   * @param request Request matching this transaction.
   */
  public receiveRequest(request: IncomingRequest): void {
    switch (this.state) {
      case TransactionState.Trying:
        // Once in the "Trying" state, any further request retransmissions are discarded.
        // https://tools.ietf.org/html/rfc3261#section-17.2.2
        break;
      case TransactionState.Proceeding:
        // If a retransmission of the request is received while in the "Proceeding" state,
        // the most recently sent provisional response MUST be passed to the transport layer for retransmission.
        // https://tools.ietf.org/html/rfc3261#section-17.2.2
        if (!this.lastResponse) {
          throw new Error("Last response undefined.");
        }
        this.send(this.lastResponse).catch((error: Exceptions.TransportError) => {
          this.logTransportError(error, "Failed to send retransmission of provisional response.");
        });
        break;
      case TransactionState.Completed:
        // While in the "Completed" state, the server transaction MUST pass the final response to the transport
        // layer for retransmission whenever a retransmission of the request is received. Any other final responses
        // passed by the TU to the server transaction MUST be discarded while in the "Completed" state.
        // https://tools.ietf.org/html/rfc3261#section-17.2.2
        if (!this.lastResponse) {
          throw new Error("Last response undefined.");
        }
        this.send(this.lastResponse).catch((error: Exceptions.TransportError) => {
          this.logTransportError(error, "Failed to send retransmission of final response.");
        });
        break;
      case TransactionState.Terminated:
        break;
      default:
        throw new Error(`Invalid state ${this.state}`);
    }
  }

  /**
   * Receive responses from TU for this transaction.
   * @param statusCode Status code of repsonse. 101-199 not allowed per RFC 4320.
   * @param response Response to send.
   */
  public receiveResponse(statusCode: number, response: string): void {
    if (statusCode < 100 || statusCode > 699) {
      throw new Error(`Invalid status code ${statusCode}`);
    }

    // An SIP element MUST NOT send any provisional response with a
    // Status-Code other than 100 to a non-INVITE request.
    // An SIP element MUST NOT respond to a non-INVITE request with a
    // Status-Code of 100 over any unreliable transport, such as UDP,
    // before the amount of time it takes a client transaction's Timer E to be reset to T2.
    // An SIP element MAY respond to a non-INVITE request with a
    // Status-Code of 100 over a reliable transport at any time.
    // https://tools.ietf.org/html/rfc4320#section-4.1
    if (statusCode > 100 && statusCode <= 199) {
      throw new Error("Provisional response other than 100 not allowed.");
    }

    switch (this.state) {
      case TransactionState.Trying:
        // While in the "Trying" state, if the TU passes a provisional response
        // to the server transaction, the server transaction MUST enter the "Proceeding" state.
        // The response MUST be passed to the transport layer for transmission.
        // https://tools.ietf.org/html/rfc3261#section-17.2.2
        this.lastResponse = response;
        if (statusCode >= 100 && statusCode < 200) {
          this.stateTransition(TransactionState.Proceeding);
          this.send(response).catch((error: Exceptions.TransportError) => {
            this.logTransportError(error, "Failed to send provisional response.");
          });
          return;
        }
        if (statusCode >= 200 && statusCode <= 699) {
          this.stateTransition(TransactionState.Completed);
          this.send(response).catch((error: Exceptions.TransportError) => {
            this.logTransportError(error, "Failed to send final response.");
          });
          return;
        }
        break;
      case TransactionState.Proceeding:
        // Any further provisional responses that are received from the TU while
        // in the "Proceeding" state MUST be passed to the transport layer for transmission.
        // If the TU passes a final response (status codes 200-699) to the server while in
        // the "Proceeding" state, the transaction MUST enter the "Completed" state, and
        // the response MUST be passed to the transport layer for transmission.
        // https://tools.ietf.org/html/rfc3261#section-17.2.2
        this.lastResponse = response;
        if (statusCode >= 200 && statusCode <= 699) {
          this.stateTransition(TransactionState.Completed);
          this.send(response).catch((error: Exceptions.TransportError) => {
            this.logTransportError(error, "Failed to send final response.");
          });
          return;
        }
        break;
      case TransactionState.Completed:
        // Any other final responses passed by the TU to the server
        // transaction MUST be discarded while in the "Completed" state.
        // https://tools.ietf.org/html/rfc3261#section-17.2.2
        return;
      case TransactionState.Terminated:
        break;
      default:
        throw new Error(`Invalid state ${this.state}`);
    }

    const message =
      `Non-INVITE server transaction received unexpected ${statusCode} response from TU while in state ${this.state}.`;
    this.logger.error(message);
    throw new Error(message);
  }

  /**
   * First, the procedures in [4] are followed, which attempt to deliver the response to a backup.
   * If those should all fail, based on the definition of failure in [4], the server transaction SHOULD
   * inform the TU that a failure has occurred, and SHOULD transition to the terminated state.
   * https://tools.ietf.org/html/rfc3261#section-17.2.4
   */
  protected onTransportError(error: Error): void {
    if (this.user.onTransportError) {
      this.user.onTransportError(error);
    }
    this.stateTransition(TransactionState.Terminated, true);
  }

  private stateTransition(newState: TransactionState, dueToTransportError = false): void {
    // Assert valid state transitions.
    const invalidStateTransition = () => {
      throw new Error(`Invalid state transition from ${this.state} to ${newState}`);
    };

    switch (newState) {
      case TransactionState.Trying:
        invalidStateTransition();
        break;
      case TransactionState.Proceeding:
        if (this.state !== TransactionState.Trying) {
          invalidStateTransition();
        }
        break;
      case TransactionState.Completed:
        if (this.state !== TransactionState.Trying && this.state !== TransactionState.Proceeding) {
          invalidStateTransition();
        }
        break;
      case TransactionState.Terminated:
        if (this.state !== TransactionState.Proceeding && this.state !== TransactionState.Completed) {
          if (!dueToTransportError) {
            invalidStateTransition();
          }
        }
        break;
      default:
        invalidStateTransition();
    }

    // When the server transaction enters the "Completed" state, it MUST set Timer J to fire
    // in 64*T1 seconds for unreliable transports, and zero seconds for reliable transports.
    // https://tools.ietf.org/html/rfc3261#section-17.2.2
    if (newState === TransactionState.Completed) {
      this.J = setTimeout(() => this.timer_J(), Timers.TIMER_J);
    }

    // The server transaction MUST be destroyed the instant it enters the "Terminated" state.
    // https://tools.ietf.org/html/rfc3261#section-17.2.2
    if (newState === TransactionState.Terminated) {
      this.dispose();
    }

    this.setState(newState);
  }

  /**
   * The server transaction remains in this state until Timer J fires,
   * at which point it MUST transition to the "Terminated" state.
   * https://tools.ietf.org/html/rfc3261#section-17.2.2
   */
  private timer_J(): void {
    this.logger.debug(`Timer J expired for NON-INVITE server transaction ${this.id}.`);
    if (this.state === TransactionState.Completed) {
      this.stateTransition(TransactionState.Terminated);
    }
  }
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
  /**
   * For completeness. Same as `TransactionUser` at this point.
   */
}
