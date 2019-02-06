import { EventEmitter } from "events";

import { Logger } from "../types/logger-factory";
import { RequestSender } from "../types/request-sender";
import {
  IncomingRequest,
  IncomingResponse,
  OutgoingRequest as OutgoingRequestType
} from "../types/sip-message";
import {
  AckClientTransaction as AckClientTransactionDefinition,
  InviteClientTransaction as InviteClientTransactionDefinition,
  InviteServerTransaction as InviteServerTransactionDefinition,
  NonInviteClientTransaction as NonInviteClientTransactionDefinition,
  NonInviteServerTransaction as NonInviteServerTransactionDefinition
} from "../types/transactions";
import { Transport } from "../types/transport";
import { UA } from "../types/ua";
import { URI } from "../types/uri";

import { C as SIPConstants } from "./Constants";
import { TransactionStatus, TypeStrings } from "./Enums";
import { OutgoingRequest } from "./SIPMessage";
import { Timers } from "./Timers";

// SIP Transactions module.

const C: any = {
  // Transaction states
  STATUS_TRYING:     1,
  STATUS_PROCEEDING: 2,
  STATUS_CALLING:    3,
  STATUS_ACCEPTED:   4,
  STATUS_COMPLETED:  5,
  STATUS_TERMINATED: 6,
  STATUS_CONFIRMED:  7,

  // Transaction types
  NON_INVITE_CLIENT: "nict",
  NON_INVITE_SERVER: "nist",
  INVITE_CLIENT: "ict",
  INVITE_SERVER: "ist"
};

const buildViaHeader: ((ua: UA, t: Transport, id: string) => string) =
(ua: UA, transport: Transport, id: string): string => {
  let via: string = "SIP/2.0/" + (ua.configuration.hackViaTcp ? "TCP" : transport.server.scheme);
  via += " " + ua.configuration.viaHost + ";branch=" + id;

  if (ua.configuration.forceRport) {
    via += ";rport";
  }
  return via;
};

/**
 * @class Non Invite Client Transaction
 * @param {SIP.RequestSender} request_sender
 * @param {SIP.OutgoingRequest} request
 * @param {SIP.Transport} transport
 */
export class NonInviteClientTransaction extends EventEmitter implements NonInviteClientTransactionDefinition {
  public type: TypeStrings;
  public state: TransactionStatus | undefined;
  public transport: Transport;
  public kind: string = C.NON_INVITE_CLIENT;
  public id: string;
  private requestSender: RequestSender;
  private request: OutgoingRequestType;
  private logger: Logger;
  private F: any | undefined;
  private K: any | undefined;

  constructor(requestSender: RequestSender, request: OutgoingRequestType, transport: Transport) {
    super();
    this.type = TypeStrings.NonInviteClientTransaction;
    this.transport = transport;
    this.id = "z9hG4bK" + Math.floor(Math.random() * 10000000);
    this.requestSender = requestSender;
    this.request = request;

    this.logger = requestSender.ua.getLogger("sip.transaction.nict", this.id);

    const via: string = buildViaHeader(requestSender.ua, transport, this.id);
    this.request.setHeader("via", via);

    this.requestSender.ua.newTransaction(this);
  }

  public stateChanged(state: TransactionStatus): void {
    this.state = state;
    this.emit("stateChanged");
  }

  public send(): void {
    this.stateChanged(TransactionStatus.STATUS_TRYING);
    this.F = setTimeout(() => this.timer_F(), Timers.TIMER_F);

    this.transport.send(this.request).catch(() => this.onTransportError());
  }

  public receiveResponse(response: IncomingResponse): void {
    const statusCode: number = response.statusCode || 0;

    if (statusCode < 200) {
      switch (this.state) {
        case TransactionStatus.STATUS_TRYING:
        case TransactionStatus.STATUS_PROCEEDING:
          this.stateChanged(TransactionStatus.STATUS_PROCEEDING);
          this.requestSender.receiveResponse(response);
          break;
      }
    } else {
      switch (this.state) {
        case TransactionStatus.STATUS_TRYING:
        case TransactionStatus.STATUS_PROCEEDING:
          this.stateChanged(TransactionStatus.STATUS_COMPLETED);
          if (this.F) {
            clearTimeout(this.F);
          }

          if (statusCode === 408) {
            this.requestSender.onRequestTimeout();
          } else {
            this.requestSender.receiveResponse(response);
          }

          this.K = setTimeout(() => this.timer_K(), Timers.TIMER_K);
          break;
        case TransactionStatus.STATUS_COMPLETED:
          break;
      }
    }
  }

  private onTransportError(): void {
    this.logger.log("transport error occurred, deleting non-INVITE client transaction " + this.id);
    if (this.F) {
      clearTimeout(this.F);
      this.F = undefined;
    }
    if (this.K) {
      clearTimeout(this.K);
      this.K = undefined;
    }
    this.stateChanged(TransactionStatus.STATUS_TERMINATED);
    this.requestSender.ua.destroyTransaction(this);
    this.requestSender.onTransportError();
  }

  private timer_F(): void {
    this.logger.debug("Timer F expired for non-INVITE client transaction " + this.id);
    this.stateChanged(TransactionStatus.STATUS_TERMINATED);
    this.requestSender.ua.destroyTransaction(this);
    this.requestSender.onRequestTimeout();
  }

  private timer_K(): void {
    this.stateChanged(TransactionStatus.STATUS_TERMINATED);
    this.requestSender.ua.destroyTransaction(this);
  }
}

/**
 * @class Invite Client Transaction
 * @param {SIP.RequestSender} request_sender
 * @param {SIP.OutgoingRequest} request
 * @param {SIP.Transport} transport
 */
// tslint:disable-next-line:max-classes-per-file
export class InviteClientTransaction extends EventEmitter implements InviteClientTransactionDefinition {
  public type: TypeStrings;
  public state: TransactionStatus | undefined;
  public transport: Transport;
  public kind: string = C.INVITE_CLIENT;
  public id: string;
  private requestSender: RequestSender;
  private request: OutgoingRequestType;
  private response: IncomingResponse | undefined;
  private logger: Logger;
  private ackSender: InviteClientTransaction | NonInviteClientTransaction | AckClientTransaction | undefined;
  private B: any | undefined;
  private D: any | undefined;
  private M: any | undefined;
  private cancel: string | undefined;

  constructor(requestSender: RequestSender, request: OutgoingRequestType, transport: Transport) {
    super();

    this.type = TypeStrings.InviteClientTransaction;
    this.transport = transport;
    this.id = "z9hG4bK" + Math.floor(Math.random() * 10000000);
    this.requestSender = requestSender;
    this.request = request;

    this.logger = requestSender.ua.getLogger("sip.transaction.ict", this.id);

    const via: string = buildViaHeader(requestSender.ua, transport, this.id);
    this.request.setHeader("via", via);

    this.requestSender.ua.newTransaction(this);

    // Add the cancel property to the request.
    // Will be called from the request instance, not the transaction itself.
    this.request.cancel = (reason: string, extraHeaders: Array<string>) => {
      extraHeaders = (extraHeaders || []).slice();
      let extraHeadersString: string = "";

      for (const extraHeader of extraHeaders) {
        extraHeadersString +=  extraHeader.trim() + "\r\n";
      }

      this.cancelRequest(this, reason, extraHeadersString);
    };
  }

  public stateChanged(state: TransactionStatus): void {
    this.state = state;
    this.emit("stateChanged");
  }

  public send(): void {
    this.stateChanged(TransactionStatus.STATUS_CALLING);
    this.B = setTimeout(() => this.timer_B(), Timers.TIMER_B);

    this.transport.send(this.request).catch(() => this.onTransportError());
  }

  public receiveResponse(response: IncomingResponse): void {
    const statusCode: number = response.statusCode || 0;

    // This may create a circular dependency...
    response.transaction = this;

    if (this.response &&
        this.response.statusCode === response.statusCode &&
        this.response.cseq === response.cseq) {
      this.logger.debug("ICT Received a retransmission for cseq: " + response.cseq);
      if (this.ackSender) {
        this.ackSender.send();
      }
      return;
    }
    this.response = response;

    if (statusCode >= 100 && statusCode <= 199) {
      switch (this.state) {
        case TransactionStatus.STATUS_CALLING:
          this.stateChanged(TransactionStatus.STATUS_PROCEEDING);
          this.requestSender.receiveResponse(response);
          if (this.cancel) {
            this.transport.send(this.cancel);
          }
          break;
        case TransactionStatus.STATUS_PROCEEDING:
          this.requestSender.receiveResponse(response);
          break;
      }
    } else if (statusCode >= 200 && statusCode <= 299) {
      switch (this.state) {
        case TransactionStatus.STATUS_CALLING:
        case TransactionStatus.STATUS_PROCEEDING:
          this.stateChanged(TransactionStatus.STATUS_ACCEPTED);
          this.M = setTimeout(() => this.timer_M(), Timers.TIMER_M);
          this.requestSender.receiveResponse(response);
          break;
        case C.STATUS_ACCEPTED:
          this.requestSender.receiveResponse(response);
          break;
      }
    } else if (statusCode >= 300 && statusCode <= 699) {
      switch (this.state) {
        case TransactionStatus.STATUS_CALLING:
        case TransactionStatus.STATUS_PROCEEDING:
          this.stateChanged(TransactionStatus.STATUS_COMPLETED);
          this.sendACK();
          this.requestSender.receiveResponse(response);
          break;
        case TransactionStatus.STATUS_COMPLETED:
          this.sendACK();
          break;
      }
    }
  }

  public sendACK(options: any = {}): OutgoingRequestType | undefined {
    // TODO: Move PRACK stuff into the transaction layer. That is really where it should be
    let ruri: string | URI;
    if (this.response && this.response.getHeader("contact")) {
      ruri = this.response.parseHeader("contact").uri;
    } else {
      ruri = this.request.ruri;
    }

    if (this.response) {
      const ack: OutgoingRequestType = new OutgoingRequest(
        "ACK",
        ruri.toString(),
        this.request.ua,
        {
          cseq: this.response.cseq,
          callId: this.response.callId,
          fromUri: this.response.from.uri,
          fromTag: this.response.fromTag,
          toUri: this.response.to.uri,
          toTag: this.response.toTag,
          routeSet: this.response.getHeaders("record-route").reverse()
        },
        options.extraHeaders || [],
        options.body
      );

      if (!ack.ua.transport) {
        throw new Error("No transport to make transaction");
      }
      this.ackSender = new AckClientTransaction({
        onTransportError: this.requestSender.applicant ?
        this.requestSender.applicant.onTransportError.bind(this.requestSender.applicant) :
        () => {
          this.logger.warn("ACK Request had a transport error");
        },
        ua: ack.ua
      }, ack, ack.ua.transport);
      this.ackSender.send();

      return ack;
    }
  }

  private onTransportError(): void {
    this.logger.log("transport error occurred, deleting INVITE client transaction " + this.id);
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

    this.stateChanged(TransactionStatus.STATUS_TERMINATED);
    this.requestSender.ua.destroyTransaction(this);

    if (this.state !== TransactionStatus.STATUS_ACCEPTED) {
      this.requestSender.onTransportError();
    }
  }

  // RFC 6026 7.2
  private timer_M(): void {
    this.logger.debug("Timer M expired for INVITE client transaction " + this.id);

    if (this.state === TransactionStatus.STATUS_ACCEPTED) {
      if (this.B) {
        clearTimeout(this.B);
        this.B = undefined;
      }
      this.stateChanged(TransactionStatus.STATUS_TERMINATED);
      this.requestSender.ua.destroyTransaction(this);
    }
  }

  // RFC 3261 17.1.1
  private timer_B(): void {
    this.logger.debug("Timer B expired for INVITE client transaction " + this.id);
    if (this.state === TransactionStatus.STATUS_CALLING) {
      this.stateChanged(TransactionStatus.STATUS_TERMINATED);
      this.requestSender.ua.destroyTransaction(this);
      this.requestSender.onRequestTimeout();
    }
  }

  private timer_D(): void {
    this.logger.debug("Timer D expired for INVITE client transaction " + this.id);
    if (this.B) {
      clearTimeout(this.B);
      this.B = undefined;
    }
    this.stateChanged(TransactionStatus.STATUS_TERMINATED);
    this.requestSender.ua.destroyTransaction(this);
  }

  private cancelRequest(tr: InviteClientTransaction, reason: string, extraHeaders: string): void {
    const request: OutgoingRequestType = tr.request;

    this.cancel = SIPConstants.CANCEL + " " + request.ruri + " SIP/2.0\r\n";
    this.cancel += "Via: " + request.headers.Via.toString() + "\r\n";

    if (this.request.headers.Route) {
      this.cancel += "Route: " + request.headers.Route.toString() + "\r\n";
    }

    this.cancel += "To: " + request.headers.To.toString() + "\r\n";
    this.cancel += "From: " + request.headers.From.toString() + "\r\n";
    this.cancel += "Call-ID: " + request.headers["Call-ID"].toString() + "\r\n";
    // a constant in UA.C, removed for circular dependency
    this.cancel += "Max-Forwards: " + 70 + "\r\n";
    this.cancel += "CSeq: " + request.headers.CSeq.toString().split(" ")[0] +
    " CANCEL\r\n";

    if (reason) {
      this.cancel += "Reason: " + reason + "\r\n";
    }

    if (extraHeaders) {
      this.cancel += extraHeaders;
    }

    this.cancel += "Content-Length: 0\r\n\r\n";

    // Send only if a provisional response (>100) has been received.
    if (this.state === TransactionStatus.STATUS_PROCEEDING) {
      this.transport.send(this.cancel);
    }
  }
}

/**
 * @class ACK Client Transaction
 * @param {SIP.RequestSender} request_sender
 * @param {SIP.OutgoingRequest} request
 * @param {SIP.Transport} transport
 */
// tslint:disable-next-line:max-classes-per-file
export class AckClientTransaction extends EventEmitter implements AckClientTransactionDefinition {
  public type: TypeStrings;
  public transport: Transport;
  public id: string;
  private requestSender: RequestSender | {
    onTransportError: () => void,
    ua: UA
  };
  private request: OutgoingRequestType;
  private logger: Logger;

  constructor(
    requestSender: RequestSender | { onTransportError: () => void, ua: UA },
    request: OutgoingRequestType,
    transport: Transport
  ) {
    super();
    this.type = TypeStrings.AckClientTransaction;
    this.transport = transport;
    this.id = "z9hG4bK" + Math.floor(Math.random() * 10000000);
    this.requestSender = requestSender;
    this.request = request;

    this.logger = requestSender.ua.getLogger("sip.transaction.nict", this.id);

    const via: string = buildViaHeader(requestSender.ua, transport, this.id);
    this.request.setHeader("via", via);
  }

  public send(): void {
    this.transport.send(this.request).catch(() => {
      this.logger.log("transport error occurred, for an ACK client transaction " + this.id);
      this.requestSender.onTransportError();
    });
  }
}

/**
 * @class Non Invite Server Transaction
 * @param {SIP.IncomingRequest} request
 * @param {SIP.UA} ua
 */
// tslint:disable-next-line:max-classes-per-file
export class NonInviteServerTransaction extends EventEmitter implements NonInviteServerTransactionDefinition {
  public type: TypeStrings;
  public state: TransactionStatus | undefined;
  public transport: Transport | undefined;
  public kind: string = C.NON_INVITE_SERVER;
  public lastResponse: string;
  public id: string;
  public request: IncomingRequest;
  private logger: Logger;
  private ua: UA;
  private J: any | undefined;
  private transportError: boolean;

  constructor(request: IncomingRequest, ua: UA) {
    super();
    this.type = TypeStrings.NonInviteServerTransaction;
    this.id = request.viaBranch;
    this.request = request;
    this.transport = ua.transport;
    this.ua = ua;
    this.lastResponse = "";
    this.transportError = false;
    request.serverTransaction = this;

    this.logger = ua.getLogger("sip.transaction.nist", this.id);

    this.state = TransactionStatus.STATUS_TRYING;

    ua.newTransaction(this);
  }

  public stateChanged(state: TransactionStatus): void {
    this.state = state;
    this.emit("stateChanged");
  }

  public receiveResponse(statusCode: number, response: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (statusCode === 100) {
        /* RFC 4320 4.1
         * 'A SIP element MUST NOT
         * send any provisional response with a
         * Status-Code other than 100 to a non-INVITE request.'
         */
        switch (this.state) {
          case TransactionStatus.STATUS_TRYING:
            this.stateChanged(C.STATUS_PROCEEDING);
            if (this.transport) {
              this.transport.send(response).catch(() => this.onTransportError());
            }
            break;
          case TransactionStatus.STATUS_PROCEEDING:
            this.lastResponse = response;
            if (this.transport) {
              this.transport.send(response).then(resolve).catch(() => {
                this.onTransportError();
                reject();
              });
            }
            break;
        }
      } else if (statusCode >= 200 && statusCode <= 699) {
        switch (this.state) {
          case TransactionStatus.STATUS_TRYING:
          case TransactionStatus.STATUS_PROCEEDING:
            this.stateChanged(C.STATUS_COMPLETED);
            this.lastResponse = response;
            this.J = setTimeout(() => {
              this.logger.debug("Timer J expired for non-INVITE server transaction " + this.id);
              this.stateChanged(C.STATUS_TERMINATED);
              this.ua.destroyTransaction(this);
            }, Timers.TIMER_J);
            if (this.transport) {
              this.transport.send(response).then(resolve).catch(() => {
                this.onTransportError();
                reject();
              });
            }
            break;
          case TransactionStatus.STATUS_COMPLETED:
            break;
        }
      }
    });
  }

  private onTransportError(): void {
    if (!this.transportError) {
      this.transportError = true;

      this.logger.log("transport error occurred, deleting non-INVITE server transaction " + this.id);

      if (this.J) {
        clearTimeout(this.J);
        this.J = undefined;
      }
      this.stateChanged(C.STATUS_TERMINATED);
      this.ua.destroyTransaction(this);
    }
  }
}

/**
 * @class Invite Server Transaction
 * @param {SIP.IncomingRequest} request
 * @param {SIP.UA} ua
 */
// tslint:disable-next-line:max-classes-per-file
export class InviteServerTransaction extends EventEmitter implements InviteServerTransactionDefinition {
  public type: TypeStrings;
  public state: TransactionStatus | undefined;
  public transport: Transport | undefined;
  public kind: string = C.INVITE_SERVER;
  public lastResponse: string;
  public I: any | undefined;
  public id: string;
  public request: IncomingRequest;
  private ua: UA;
  private logger: Logger;
  private L: any | undefined;
  private H: any | undefined;
  private resendProvisionalTimer: any | undefined;
  private transportError: boolean;

  constructor(request: IncomingRequest, ua: UA) {
    super();
    this.type = TypeStrings.InviteServerTransaction;
    this.id = request.viaBranch;
    this.request = request;
    this.transport = ua.transport;
    this.ua = ua;
    this.lastResponse = "";
    this.transportError = false;
    request.serverTransaction = this;

    this.logger = ua.getLogger("sip.transaction.ist", this.id);

    this.state = TransactionStatus.STATUS_PROCEEDING;

    ua.newTransaction(this);

    request.reply(100);
  }

  public stateChanged(state: TransactionStatus): void {
    this.state = state;
    this.emit("stateChanged");
  }

  public timer_I(): void {
    this.stateChanged(TransactionStatus.STATUS_TERMINATED);
    this.ua.destroyTransaction(this);
  }

  // INVITE Server Transaction RFC 3261 17.2.1
  public receiveResponse(statusCode: number, response: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (statusCode >= 100 && statusCode <= 199 && this.state === TransactionStatus.STATUS_PROCEEDING) {
        // PLEASE FIX: this condition leads to a hanging promise. I'm leaving it to preserve behavior as I clean up
        if (this.transport) {
          this.transport.send(response).catch(() => this.onTransportError());
        }
        this.lastResponse = response;
        // this 100 split is carry-over from old logic, I have no explanation
        if (statusCode > 100) {
          // Trigger the resendProvisionalTimer only for the first non 100 provisional response.
          if (this.resendProvisionalTimer === undefined) {
            this.resendProvisionalTimer = setInterval(() => {
              if (this.transport) {
                this.transport.send(response).catch(() => this.onTransportError());
              }
            }, Timers.PROVISIONAL_RESPONSE_INTERVAL);
          }
        }
      } else if (statusCode >= 200 && statusCode <= 299) {
        switch (this.state) {
          case TransactionStatus.STATUS_PROCEEDING:
            this.stateChanged(C.STATUS_ACCEPTED);
            this.lastResponse = response;
            this.L = setTimeout(() => this.timer_L(), Timers.TIMER_L);

            if (this.resendProvisionalTimer !== undefined) {
              clearInterval(this.resendProvisionalTimer);
              this.resendProvisionalTimer = undefined;
            }
            /* falls through */
            case TransactionStatus.STATUS_ACCEPTED:
              // Note that this point will be reached for proceeding this.state also.
              if (this.transport) {
                this.transport.send(response).then(resolve).catch((error: any) => {
                  this.logger.error(error);
                  this.onTransportError();
                  reject();
                });
              }
              break;
        }
      } else if (statusCode >= 300 && statusCode <= 699) {
        switch (this.state) {
          case TransactionStatus.STATUS_PROCEEDING:
            if (this.resendProvisionalTimer !== undefined) {
              clearInterval(this.resendProvisionalTimer);
              this.resendProvisionalTimer = undefined;
            }
            if (this.transport) {
              this.transport.send(response).then(() => {
                this.stateChanged(TransactionStatus.STATUS_COMPLETED);
                this.H = setTimeout(() => this.timer_H(), Timers.TIMER_H);
                resolve();
              }).catch((error: any) => {
                this.logger.error(error);
                this.onTransportError();
                reject();
              });
            }
            break;
        }
      }
    });
  }

  private timer_H(): void {
    this.logger.debug("Timer H expired for INVITE server transaction " + this.id);

    if (this.state === TransactionStatus.STATUS_COMPLETED) {
      this.logger.warn("transactions: ACK for INVITE server transaction was never received, call will be terminated");
    }

    this.stateChanged(TransactionStatus.STATUS_TERMINATED);
    this.ua.destroyTransaction(this);
  }

  // RFC 6026 7.1
  private timer_L(): void  {
    this.logger.debug("Timer L expired for INVITE server transaction " + this.id);

    if (this.state === TransactionStatus.STATUS_ACCEPTED) {
      this.stateChanged(TransactionStatus.STATUS_TERMINATED);
      this.ua.destroyTransaction(this);
    }
  }

  private onTransportError(): void {
    if (!this.transportError) {
      this.transportError = true;

      this.logger.log("transport error occurred, deleting INVITE server transaction " + this.id);

      if (this.resendProvisionalTimer !== undefined) {
        clearInterval(this.resendProvisionalTimer);
        this.resendProvisionalTimer = undefined;
      }

      if (this.L) {
        clearTimeout(this.L);
        this.L = undefined;
      }
      if (this.H) {
        clearTimeout(this.H);
        this.H = undefined;
      }
      if (this.I) {
        clearTimeout(this.I);
        this.I = undefined;
      }

      this.stateChanged(TransactionStatus.STATUS_TERMINATED);
      this.ua.destroyTransaction(this);
    }
  }
}

/**
 * @function
 * @param {SIP.UA} ua
 * @param {SIP.IncomingRequest} request
 *
 * @return {boolean}
 * INVITE:
 *  _true_ if retransmission
 *  _false_ new request
 *
 * ACK:
 *  _true_  ACK to non2xx response
 *  _false_ ACK must be passed to TU (accepted state)
 *          ACK to 2xx response
 *
 * CANCEL:
 *  _true_  no matching invite transaction
 *  _false_ matching invite transaction and no final response sent
 *
 * OTHER:
 *  _true_  retransmission
 *  _false_ new request
 */
export function checkTransaction(ua: UA, request: IncomingRequest): boolean {
  const inviteServertr: InviteServerTransactionDefinition | undefined = ua.transactions.ist[request.viaBranch];
  switch (request.method) {
    case SIPConstants.INVITE:
      if (inviteServertr) {
        switch (inviteServertr.state) {
          case TransactionStatus.STATUS_PROCEEDING:
            if (inviteServertr.transport) {
              inviteServertr.transport.send(inviteServertr.lastResponse);
            }
            break;

            // RFC 6026 7.1 Invite retransmission
            // received while in C.STATUS_ACCEPTED state. Absorb it.
          case TransactionStatus.STATUS_ACCEPTED:
            break;
        }
        return true;
      }
      break;
    case SIPConstants.ACK:
      // RFC 6026 7.1
      if (inviteServertr) {
        if (inviteServertr.state === TransactionStatus.STATUS_ACCEPTED) {
          return false;
        } else if (inviteServertr.state === TransactionStatus.STATUS_COMPLETED) {
          inviteServertr.stateChanged(TransactionStatus.STATUS_CONFIRMED);
          inviteServertr.I = setTimeout(inviteServertr.timer_I.bind(inviteServertr), Timers.TIMER_I);
          return true;
        }
      } else { // ACK to 2XX Response.
        return false;
      }
      break;
    case SIPConstants.CANCEL:
      if (inviteServertr) {
        request.reply_sl(200);
        if (inviteServertr.state === TransactionStatus.STATUS_PROCEEDING) {
          return false;
        } else {
          return true;
        }
      } else {
        request.reply_sl(481);
        return true;
      }
    default:
      // Non-INVITE Server Transaction RFC 3261 17.2.2
      const nist: NonInviteServerTransactionDefinition | undefined = ua.transactions.nist[request.viaBranch];
      if (nist) {
        switch (nist.state) {
          case TransactionStatus.STATUS_TRYING:
            break;
          case TransactionStatus.STATUS_PROCEEDING:
          case TransactionStatus.STATUS_COMPLETED:
            if (nist.transport) {
              nist.transport.send(nist.lastResponse);
            }
            break;
        }
        return true;
      }
      break;
  }
  return false;
}
