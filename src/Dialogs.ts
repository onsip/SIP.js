import { C } from "./Constants";
import { DialogStatus, SessionStatus, TypeStrings } from "./Enums";
import { Logger } from "./LoggerFactory";
import { RequestSender } from "./RequestSender";
import { InviteClientContext, InviteServerContext } from "./Session";
import { SessionDescriptionHandler } from "./session-description-handler";
import { DTMF } from "./Session/DTMF";
import {
  IncomingRequest,
  IncomingResponse,
  OutgoingRequest
} from "./SIPMessage";
import { Subscription } from "./Subscription";
import {
  InviteClientTransaction,
  NonInviteClientTransaction,
  TransactionState
} from "./Transactions";
import { URI } from "./URI";

/*
 * @augments SIP
 * @class Class creating a SIP dialog. RFC 3261 12.1
 * @param {SIP.RTCSession} owner
 * @param {SIP.IncomingRequest|SIP.IncomingResponse} message
 * @param {Enum} type UAC / UAS
 * @param {Enum} state SIP.Dialog.C.STATUS_EARLY / SIP.Dialog.C.STATUS_CONFIRMED
 */

export class Dialog {
  public static readonly C = DialogStatus;

  public type: TypeStrings;
  public localSeqnum: number;
  public inviteSeqnum: number;
  public localUri: URI;
  public remoteUri: URI;
  public remoteTarget: string;
  public id: {
    callId: string,
    localTag: string,
    remoteTag: string,
    toString: () => string;
  };
  public routeSet: Array<string>;
  public pracked: Array<string> = [];
  public sessionDescriptionHandler: SessionDescriptionHandler | undefined;
  public owner: InviteClientContext | InviteServerContext | Subscription;
  public state: DialogStatus;
  public uacPendingReply: boolean = false;

  // BROKEN TYPING NOTE: error was added to preserve behaviors, but it never gets set (see Session.createDialog)
  public error: any;

  private uasPendingReply: boolean = false;
  private callId: string | undefined;
  private localTag: string | undefined;
  private remoteTag: string | undefined;
  private remoteSeqnum: number | undefined;
  private logger: Logger;

  constructor(
    owner: InviteClientContext | InviteServerContext | Subscription,
    message: IncomingRequest | IncomingResponse,
    type: "UAC" | "UAS",
    state?: DialogStatus
  ) {
    this.type = TypeStrings.Dialog;
    if (!message.hasHeader("contact")) {
      throw new Error("unable to create a Dialog without Contact header field");
    }

    if (message.type  === TypeStrings.IncomingResponse) {
      const statusCode: number | undefined = (message as IncomingResponse).statusCode;
      state = (statusCode && statusCode < 200) ?
        DialogStatus.STATUS_EARLY : DialogStatus.STATUS_CONFIRMED;
    } else {
      // Create confirmed dialog if state is not defined
      state = state || DialogStatus.STATUS_CONFIRMED;
    }

    const contact = message.parseHeader("contact");

    // RFC 3261 12.1.1
    if (type === "UAS" && message.type === TypeStrings.IncomingRequest) {
      this.id = {
        callId: message.callId,
        localTag: message.toTag,
        remoteTag: message.fromTag,
        toString: () => {
          return message.callId + message.toTag + message.fromTag;
        }
      };
      this.state = state;
      this.remoteSeqnum = message.cseq;
      this.localUri = (message.parseHeader("to") || {}).uri;
      this.remoteUri = (message.parseHeader("from") || {}).uri;
      this.remoteTarget = contact.uri;
      this.routeSet = message.getHeaders("record-route");
      this.inviteSeqnum = message.cseq;
      this.localSeqnum = message.cseq;
    } else {// type is UAC, RFC 3261 12.1.2
      this.id = {
        callId: message.callId,
        localTag: message.fromTag,
        remoteTag: message.toTag,
        toString: () => {
          return message.callId + message.fromTag + message.toTag;
        }
      };
      this.state = state;
      this.inviteSeqnum = message.cseq;
      this.localSeqnum = message.cseq;
      this.localUri = message.parseHeader("from").uri;
      this.pracked = [];
      this.remoteUri = message.parseHeader("to").uri;
      this.remoteTarget = contact.uri;
      this.routeSet = message.getHeaders("record-route").reverse();

    }

    this.logger = owner.ua.getLogger("sip.dialog", this.id.toString());
    this.owner = owner;
    owner.ua.dialogs[this.id.toString()] = this;
    this.logger.log("new " + type + " dialog created with status " +
      (this.state === DialogStatus.STATUS_EARLY ? "EARLY" : "CONFIRMED"));
    owner.emit("dialog", this);
  }

  /**
   * @param {SIP.IncomingMessage} message
   * @param {Enum} UAC/UAS
   */
  public update(message: IncomingRequest | IncomingResponse, type: "UAC" | "UAS"): void {
    this.state = DialogStatus.STATUS_CONFIRMED;

    this.logger.log("dialog " + this.id.toString() + "  changed to CONFIRMED state");

    if (type === "UAC") {
      // RFC 3261 13.2.2.4
      this.routeSet = message.getHeaders("record-route").reverse();
    }
  }

  public terminate(): void {
    this.logger.log("dialog " + this.id.toString() + " deleted");
    if (this.sessionDescriptionHandler && this.state !== DialogStatus.STATUS_CONFIRMED) {
      // TODO: This should call .close() on the handler when implemented
      this.sessionDescriptionHandler.close();
    }
    delete this.owner.ua.dialogs[this.id.toString()];
  }

  /**
   * @param {String} method request method
   * @param {Object} extraHeaders extra headers
   * @returns {SIP.OutgoingRequest}
   */
  // RFC 3261 12.2.1.1
  public createRequest(method: string, extraHeaders: Array<string> = [], body: string): OutgoingRequest {
    extraHeaders = extraHeaders.slice();

    if (!this.localSeqnum) { this.localSeqnum = Math.floor(Math.random() * 10000); }

    const cseq = (method === C.CANCEL || method === C.ACK) ? this.inviteSeqnum : this.localSeqnum += 1;

    const request = new OutgoingRequest(
      method,
      this.remoteTarget,
      this.owner.ua, {
        cseq,
        callId: this.id.callId,
        fromUri: this.localUri,
        fromTag: this.id.localTag,
        toIri: this.remoteUri,
        toTag: this.id.remoteTag,
        routeSet: this.routeSet
      }, extraHeaders, body);

    request.dialog = this;

    return request;
  }

  /**
   * @param {SIP.IncomingRequest} request
   * @returns {Boolean}
   */
  // RFC 3261 12.2.2
  public checkInDialogRequest(request: IncomingRequest): boolean {
    if (!this.remoteSeqnum) {
      this.remoteSeqnum = request.cseq;
    } else if (request.cseq < this.remoteSeqnum) {
        // Do not try to reply to an ACK request.
        if (request.method !== C.ACK) {
          request.reply(500);
        }
        return request.cseq === this.inviteSeqnum;
    }

    switch (request.method) {
      // RFC3261 14.2 Modifying an Existing Session -UAS BEHAVIOR-
      case C.INVITE:
        if (this.uacPendingReply === true) {
          request.reply(491);
        } else if (this.uasPendingReply === true && request.cseq > this.remoteSeqnum) {
          const retryAfter = Math.floor((Math.random() * 10)) + 1;
          request.reply(500, undefined, ["Retry-After:" + retryAfter]);
          this.remoteSeqnum = request.cseq;
          return false;
        } else {
          this.uasPendingReply = true;
          const stateChanged: () => void = () => {
            if (request.transaction &&
                (request.transaction.state === TransactionState.Accepted ||
                request.transaction.state === TransactionState.Completed ||
                request.transaction.state === TransactionState.Terminated)) {

              request.transaction.removeListener("stateChanged", stateChanged);
              this.uasPendingReply = false;
            }
          };
          if (request.transaction) {
            request.transaction.on("stateChanged", stateChanged);
          }
        }

        // RFC3261 12.2.2 Replace the dialog`s remote target URI if the request is accepted
        if (request.hasHeader("contact") && request.transaction) {
          request.transaction.on("stateChanged", () => {
            if (request.transaction && request.transaction.state === TransactionState.Accepted) {
              this.remoteTarget = request.parseHeader("contact").uri;
            }
          });
        }
        break;
      case C.NOTIFY:
        // RFC6665 3.2 Replace the dialog`s remote target URI if the request is accepted
        if (request.hasHeader("contact") && request.transaction) {
          request.transaction.on("stateChanged", () => {
            if (request.transaction && request.transaction.state === TransactionState.Completed) {
              this.remoteTarget = request.parseHeader("contact").uri;
            }
          });
        }
        break;
    }

    if (request.cseq > this.remoteSeqnum) {
      this.remoteSeqnum = request.cseq;
    }

    return true;
  }

  public sendRequest(
    applicant: InviteClientContext | Subscription | DTMF,
    method: string,
    options: any = {}
  ): OutgoingRequest {
    const extraHeaders: Array<string> = (options.extraHeaders || []).slice();

    let body: any;
    if (options.body) {
      if (options.body.body) {
        body = options.body;
      } else {
        body = {};
        body.body = options.body;
        if (options.contentType) {
          body.contentType = options.contentType;
        }
      }
    }

    const request = this.createRequest(method, extraHeaders, body);

    const dialogSend: ((reattempt: boolean) => void) = (reattempt: boolean) => {
      const  requestSender: RequestSender = new RequestSender({
        request,
        onRequestTimeout: applicant.onRequestTimeout.bind(applicant),
        onTransportError: applicant.onTransportError.bind(applicant),
        receiveResponse: (response: IncomingResponse): void => {
          // RFC3261 12.2.1.2 408 or 481 is received for a request within a dialog.
          if (response.statusCode === 408 || response.statusCode === 481) {
              applicant.onDialogError(response);
          } else if (response.method === C.INVITE && response.statusCode === 491) {
            if (reattempt) {
              applicant.receiveResponse(response);
            } else {
              request.cseq = this.localSeqnum += 1;
              setTimeout(() => {
                // first check is to determine !Subscription (remove circular dependency)
                if ((this.owner as InviteClientContext | InviteServerContext).status !== undefined &&
                  (this.owner as InviteClientContext | InviteServerContext).status
                    !== SessionStatus.STATUS_TERMINATED) {
                  // RFC3261 14.1 Modifying an Existing Session. UAC Behavior.
                  dialogSend(true);
                }
              }, 1000);
            }
          } else {
            applicant.receiveResponse(response);
          }
        }
      }, this.owner.ua);

      requestSender.send();

      // RFC3261 14.2 Modifying an Existing Session -UAC BEHAVIOR-
      if (!requestSender.clientTransaction) {
        return;
      } else if (request.method === C.INVITE &&
        requestSender.clientTransaction &&
        (requestSender.clientTransaction as InviteClientTransaction | NonInviteClientTransaction).state
          !== TransactionState.Terminated) {
        this.uacPendingReply = true;

        const stateChanged: () => void = () => {
          const state = (requestSender.clientTransaction as InviteClientTransaction | NonInviteClientTransaction).state;

          if (!requestSender.clientTransaction) {
            return;
          } else if (requestSender.clientTransaction &&
              (state === TransactionState.Accepted ||
              state === TransactionState.Completed ||
              state === TransactionState.Terminated)) {

            requestSender.clientTransaction.removeListener("stateChanged", stateChanged);
            this.uacPendingReply = false;
          }
        };
        requestSender.clientTransaction.on("stateChanged", stateChanged);
      }
    };

    dialogSend(false);

    return request;
  }

  /**
   * @param {SIP.IncomingRequest} request
   */
  public receiveRequest(request: IncomingRequest): void {
    // Check in-dialog request
    if (!this.checkInDialogRequest(request)) {
      return;
    }

    this.owner.receiveRequest(request);
  }
}
