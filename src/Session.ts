import { EventEmitter } from "events";

import { ClientContext } from "./ClientContext";
import { C } from "./Constants";
import { Dialog } from "./Dialogs";
import { SessionStatus, TypeStrings } from "./Enums";
import { Exceptions } from "./Exceptions";
import { Grammar } from "./Grammar";
import { Logger } from "./LoggerFactory";
import { NameAddrHeader } from "./NameAddrHeader";
import { RequestSender } from "./RequestSender";
import { ServerContext } from "./ServerContext";
import {
  BodyObj,
  SessionDescriptionHandler,
  SessionDescriptionHandlerModifier,
  SessionDescriptionHandlerModifiers,
  SessionDescriptionHandlerOptions
} from "./session-description-handler";
import { SessionDescriptionHandlerFactory } from "./session-description-handler-factory";
import { DTMF } from "./Session/DTMF";
import {
  IncomingRequest,
  IncomingResponse,
  OutgoingRequest
} from "./SIPMessage";
import { Timers } from "./Timers";
import {
  InviteServerTransaction,
  NonInviteServerTransaction,
  TransactionState
} from "./Transactions";
import { UA } from "./UA";
import { URI } from "./URI";

import { Utils } from "./Utils";

export namespace Session {
  export interface DtmfOptions {
    extraHeaders?: string[];
    duration?: number;
    interToneGap?: number;
  }
}

/*
 * @param {function returning SIP.sessionDescriptionHandler} [sessionDescriptionHandlerFactory]
 *        (See the documentation for the sessionDescriptionHandlerFactory argument of the UA constructor.)
 */

export abstract class Session extends EventEmitter {
  public static readonly C = SessionStatus;

  // inheritted from (Server/ClientContext)
  public type: TypeStrings;
  public ua!: UA;
  public logger!: Logger;
  public method!: string;
  public body: any;
  public status: SessionStatus;
  public contentType!: string;
  public localIdentity!: NameAddrHeader;
  public remoteIdentity!: NameAddrHeader;
  public data: any = {};
  public assertedIdentity: NameAddrHeader | undefined;
  public id!: string;

  public contact: string | undefined;
  public replacee: InviteClientContext | InviteServerContext | undefined;
  public dialog: Dialog | undefined;
  public localHold: boolean;
  public sessionDescriptionHandler: SessionDescriptionHandler | undefined;
  public startTime: Date | undefined;
  public endTime: Date | undefined;

  protected sessionDescriptionHandlerFactory: SessionDescriptionHandlerFactory;
  protected sessionDescriptionHandlerOptions: any;
  protected rel100: string;

  protected earlySdp: string | undefined;
  protected hasOffer: boolean;
  protected hasAnswer: boolean;

  protected timers: {[name: string]: any};
  protected fromTag: string | undefined;

  protected errorListener!: ((...args: Array<any>) => void);

  protected renderbody: string | undefined;
  protected rendertype: string | undefined;
  protected modifiers: Array<SessionDescriptionHandlerModifier> | undefined;
  protected earlyDialogs: {[name: string]: any};
  protected passedOptions: any;
  protected onInfo: ((request: IncomingRequest) => void) | undefined;

  private tones: any;

  private pendingReinvite: boolean;
  private referContext: ReferClientContext | ReferServerContext | undefined;

  private toTag: string | undefined;
  private originalReceiveRequest: (request: IncomingRequest) => void;

  protected constructor(sessionDescriptionHandlerFactory: SessionDescriptionHandlerFactory) {
    super();
    this.type = TypeStrings.Session;
    if (!sessionDescriptionHandlerFactory) {
      throw new Exceptions.SessionDescriptionHandlerError(
        "A session description handler is required for the session to function"
      );
    }
    this.status = Session.C.STATUS_NULL;
    this.dialog = undefined;
    this.pendingReinvite = false;
    this.earlyDialogs = {};

    this.sessionDescriptionHandlerFactory = sessionDescriptionHandlerFactory;

    this.hasOffer = false;
    this.hasAnswer = false;

    // Session Timers
    this.timers = {
      ackTimer: undefined,
      expiresTimer: undefined,
      invite2xxTimer: undefined,
      userNoAnswerTimer: undefined,
      rel1xxTimer: undefined,
      prackTimer: undefined
    };

    // Session info
    this.startTime = undefined;
    this.endTime = undefined;
    this.tones = undefined;

    // Hold state
    this.localHold = false;

    this.earlySdp = undefined;
    this.rel100 = C.supported.UNSUPPORTED;
    this.originalReceiveRequest = this.receiveRequest;
  }

  public dtmf(tones: string | number, options: Session.DtmfOptions = {}): this {
    // Check Session Status
    if (this.status !== SessionStatus.STATUS_CONFIRMED && this.status !== SessionStatus.STATUS_WAITING_FOR_ACK) {
      throw new Exceptions.InvalidStateError(this.status);
    }

    // Check tones
    if (!tones || !tones.toString().match(/^[0-9A-D#*,]+$/i)) {
      throw new TypeError("Invalid tones: " + tones);
    }

    const sendDTMF: () => void = (): void => {
      if (this.status === SessionStatus.STATUS_TERMINATED || !this.tones || this.tones.length === 0) {
        // Stop sending DTMF
        this.tones = undefined;
        return;
      }

      const dtmf: DTMF = this.tones.shift();
      let timeout: number;

      if (dtmf.tone === ",") {
        timeout = 2000;
      } else {
        dtmf.on("failed", () => { this.tones = undefined; });
        dtmf.send(options);
        timeout = dtmf.duration + dtmf.interToneGap;
      }

      // Set timeout for the next tone
      setTimeout(sendDTMF, timeout);
    };

    tones = tones.toString();
    let dtmfType: string | undefined = this.ua.configuration.dtmfType;
    if (this.sessionDescriptionHandler && dtmfType === C.dtmfType.RTP) {
      const sent: boolean = this.sessionDescriptionHandler.sendDtmf(tones, options);
      if (!sent) {
        this.logger.warn("Attempt to use dtmfType 'RTP' has failed, falling back to INFO packet method");
        dtmfType = C.dtmfType.INFO;
      }
    }
    if (dtmfType === C.dtmfType.INFO) {
      const dtmfs: Array<DTMF> = [];
      const tonesArray: Array<string> = tones.split("");
      while (tonesArray.length > 0) { dtmfs.push(new DTMF(this, tonesArray.shift() as string, options)); }

      if (this.tones) {
        // Tones are already queued, just add to the queue
        this.tones =  this.tones.concat(dtmfs);
        return this;
      }
      this.tones = dtmfs;
      sendDTMF();
    }
    return this;
  }

  public bye(options: any = {}): this {
    // Check Session Status
    if (this.status === SessionStatus.STATUS_TERMINATED) {
      this.logger.error("Error: Attempted to send BYE in a terminated session.");
      return this;
    }
    this.logger.log("terminating Session");

    const statusCode: number = options.statusCode;
    if (statusCode && (statusCode < 200 || statusCode >= 700)) {
      throw new TypeError("Invalid statusCode: " + statusCode);
    }

    options.receiveResponse = () => { /* empty block */ };

    return this.sendRequest(C.BYE, options).terminated();
  }

  public refer(target: string | InviteClientContext | InviteServerContext, options: any = {}): ReferClientContext {
    // Check Session Status
    if (this.status !== SessionStatus.STATUS_CONFIRMED) {
      throw new Exceptions.InvalidStateError(this.status);
    }

    this.referContext = new ReferClientContext(
      this.ua,
      (this as unknown) as InviteClientContext | InviteServerContext,
      target,
      options
    );

    this.emit("referRequested", this.referContext);

    this.referContext.refer(options);

    return this.referContext;
  }

  public sendRequest(method: string, options: any = {}): this {
    options = options || {};

    if (!this.dialog) {
      throw new Error("sending request without a dialog");
    }

    const request = new OutgoingRequest(
      method,
      this.dialog.remoteTarget,
      this.ua,
      {
        cseq: options.cseq || (this.dialog.localSeqnum += 1),
        callId: this.dialog.id.callId,
        fromUri: this.dialog.localUri,
        fromTag: this.dialog.id.localTag,
        ToUri: this.dialog.remoteUri,
        toTag: this.dialog.id.remoteTag,
        routeSet: this.dialog.routeSet,
        statusCode: options.statusCode,
        reasonPhrase: options.reasonPhrase
      },
      options.extraHeaders || [],
      options.body
    );

    new RequestSender({
        request,
        onRequestTimeout: () => this.onRequestTimeout(),
        onTransportError: () => this.onTransportError(),
        receiveResponse: (response: IncomingResponse) =>
          (options.receiveResponse || this.receiveNonInviteResponse.bind(this))(response)
      }, this.ua).send();

    // Emit the request event
    this.emit(method.toLowerCase(), request);

    return this;
  }

  public close(): this {
    if (this.status === SessionStatus.STATUS_TERMINATED) {
      return this;
    }

    this.logger.log("closing INVITE session " + this.id);

    // 1st Step. Terminate media.
    if (this.sessionDescriptionHandler) {
      this.sessionDescriptionHandler.close();
    }

    // 2nd Step. Terminate signaling.

    // Clear session timers
    for (const timer in this.timers) {
      if (this.timers[timer]) {
        clearTimeout(this.timers[timer]);
      }
    }

    // Terminate dialogs
    // Terminate confirmed dialog
    if (this.dialog) {
      this.dialog.terminate();
      delete this.dialog;
    }

    // Terminate early dialogs
    for (const idx in this.earlyDialogs) {
      if (this.earlyDialogs.hasOwnProperty(idx)) {
        this.earlyDialogs[idx].terminate();
        delete this.earlyDialogs[idx];
      }
    }

    this.status = SessionStatus.STATUS_TERMINATED;
    if (this.ua.transport) {
      this.ua.transport.removeListener("transportError", this.errorListener);
    }

    delete this.ua.sessions[this.id];

    return this;
  }

  public createDialog(
    message: IncomingRequest | IncomingResponse,
    type: "UAS" | "UAC",
    early: boolean = false
  ): boolean {
    const localTag: string = message[(type === "UAS") ? "toTag" : "fromTag"];
    const remoteTag: string = message[(type === "UAS") ? "fromTag" : "toTag"];
    const id: string = message.callId + localTag + remoteTag;

    if (early) { // Early Dialog
      if (this.earlyDialogs[id]) {
        return true;
      } else {
        const earlyDialog: Dialog = new Dialog(
          (this as unknown) as InviteClientContext | InviteServerContext,
          message, type, Dialog.C.STATUS_EARLY);

        // Dialog has been successfully created.
        if (earlyDialog.error) {
          this.logger.error(earlyDialog.error);
          this.failed(message, C.causes.INTERNAL_ERROR);
          return false;
        } else {
          this.earlyDialogs[id] = earlyDialog;
          return true;
        }
      }
    } else { // Confirmed Dialog
      // In case the dialog is in _early_ state, update it
      const earlyDialog: Dialog | undefined = this.earlyDialogs[id];
      if (earlyDialog) {
        earlyDialog.update(message, type);
        this.dialog = earlyDialog;
        delete this.earlyDialogs[id];
        for (const idx in this.earlyDialogs) {
          if (this.earlyDialogs.hasOwnProperty(idx)) {
            this.earlyDialogs[idx].terminate();
            delete this.earlyDialogs[idx];
          }
        }
        return true;
      }

      // Otherwise, create a _confirmed_ dialog
      const dialog: Dialog = new Dialog((this as unknown) as InviteClientContext | InviteServerContext, message, type);

      if (dialog.error) {
        this.logger.error(dialog.error);
        this.failed(message, C.causes.INTERNAL_ERROR);
        return false;
      } else {
        this.toTag = message.toTag;
        this.dialog = dialog;
        return true;
      }
    }
  }

  public hold(
    options: SessionDescriptionHandlerOptions = {},
    modifiers: SessionDescriptionHandlerModifiers = []
  ): void {
    if (this.status !== SessionStatus.STATUS_WAITING_FOR_ACK && this.status !== SessionStatus.STATUS_CONFIRMED) {
      throw new Exceptions.InvalidStateError(this.status);
    }

    if (this.localHold) {
      this.logger.log("Session is already on hold, cannot put it on hold again");
      return;
    }

    options.modifiers = modifiers;
    if (this.sessionDescriptionHandler) {
      options.modifiers.push(this.sessionDescriptionHandler.holdModifier);
    }

    this.localHold = true;

    this.sendReinvite(options);
  }

  public unhold(
    options: SessionDescriptionHandlerOptions = {},
    modifiers: SessionDescriptionHandlerModifiers = []
  ): void {

    if (this.status !== SessionStatus.STATUS_WAITING_FOR_ACK && this.status !== SessionStatus.STATUS_CONFIRMED) {
      throw new Exceptions.InvalidStateError(this.status);
    }

    if (!this.localHold) {
      this.logger.log("Session is not on hold, cannot unhold it");
      return;
    }

    options.modifiers = modifiers;

    this.localHold = false;

    this.sendReinvite(options);
  }

  public reinvite(options: any = {}, modifiers: SessionDescriptionHandlerModifiers = []): void {
    options.modifiers = modifiers;

    return this.sendReinvite(options);
  }

  public receiveRequest(request: IncomingRequest): void {
    switch (request.method) { // TODO: This needs a default case
      case C.BYE:
        request.reply(200);
        if (this.status === SessionStatus.STATUS_CONFIRMED) {
          this.emit("bye", request);
          this.terminated(request, C.BYE);
        }
        break;
      case C.INVITE:
        if (this.status === SessionStatus.STATUS_CONFIRMED) {
          this.logger.log("re-INVITE received");
          this.receiveReinvite(request);
        }
        break;
      case C.INFO:
        if (this.status === SessionStatus.STATUS_CONFIRMED || this.status === SessionStatus.STATUS_WAITING_FOR_ACK) {
          if (this.onInfo) {
            return this.onInfo(request);
          }

          const contentType: string | undefined = request.getHeader("content-type");
          if (contentType) {
            if (contentType.match(/^application\/dtmf-relay/i)) {
              if (request.body) {
                const body: Array<string> = request.body.split("\r\n", 2);
                if (body.length === 2) {
                  let tone: string | undefined;
                  let duration: number | undefined;

                  const regTone = /^(Signal\s*?=\s*?)([0-9A-D#*]{1})(\s)?.*/;
                  if (regTone.test(body[0])) {
                    tone = body[0].replace(regTone, "$2");
                  }
                  const regDuration = /^(Duration\s?=\s?)([0-9]{1,4})(\s)?.*/;
                  if (regDuration.test(body[1])) {
                    duration = parseInt(body[1].replace(regDuration, "$2"), 10);
                  }

                  if (tone && duration) {
                    new DTMF(this, tone, {duration }).init_incoming(request);
                  }
                }
              }
            } else {
              request.reply(415, undefined, ["Accept: application/dtmf-relay"]);
            }
          }
        }
        break;
      case C.REFER:
        if (this.status ===  SessionStatus.STATUS_CONFIRMED) {
          this.logger.log("REFER received");
          this.referContext = new ReferServerContext(this.ua, request);
          if (this.listeners("referRequested").length) {
            this.emit("referRequested", this.referContext);
          } else {
            this.logger.log("No referRequested listeners, automatically accepting and following the refer");
            const options: any = {followRefer: true};
            if (this.passedOptions) {
              options.inviteOptions = this.passedOptions;
            }
            this.referContext.accept(options, this.modifiers);
          }
        }
        break;
      case C.NOTIFY:
        if ((this.referContext && this.referContext.type === TypeStrings.ReferClientContext) &&
          request.hasHeader("event") && /^refer(;.*)?$/.test(request.getHeader("event") as string)) {
          (this.referContext as ReferClientContext).receiveNotify(request);
          return;
        }
        request.reply(200, "OK");
        this.emit("notify", request);
        break;
    }
  }

  public terminate(options?: any): this {
    // here for types and to be overridden
    return this;
  }

  public onTransportError(): void {
    if (this.status !== SessionStatus.STATUS_CONFIRMED && this.status !== SessionStatus.STATUS_TERMINATED) {
      this.failed(undefined, C.causes.CONNECTION_ERROR);
    }
  }

  public onRequestTimeout(): void {
    if (this.status === SessionStatus.STATUS_CONFIRMED) {
      this.terminated(undefined, C.causes.REQUEST_TIMEOUT);
    } else if (this.status !== SessionStatus.STATUS_TERMINATED) {
      this.failed(undefined, C.causes.REQUEST_TIMEOUT);
      this.terminated(undefined, C.causes.REQUEST_TIMEOUT);
    }
  }

  public onDialogError(response: IncomingResponse): void {
    if (this.status === SessionStatus.STATUS_CONFIRMED) {
      this.terminated(response, C.causes.DIALOG_ERROR);
    } else if (this.status !== SessionStatus.STATUS_TERMINATED) {
      this.failed(response, C.causes.DIALOG_ERROR);
      this.terminated(response, C.causes.DIALOG_ERROR);
    }
  }

  public on(event: "dtmf", listener: (request: IncomingRequest | OutgoingRequest, dtmf: DTMF) => void): this;
  public on(event: "progress", listener: (response: IncomingRequest, reasonPhrase?: any) => void): this;
  public on(event: "referRequested", listener: (context: ReferServerContext) => void): this;
  public on(
    event:
      "referInviteSent" |
      "referProgress" |
      "referAccepted" |
      "referRejected" |
      "referRequestProgress" |
      "referRequestAccepted" |
      "referRequestRejected" |
      "reinvite" |
      "reinviteAccepted" |
      "reinviteFailed" |
      "replaced",
    listener: (session: Session) => void
  ): this;
  public on(
    event: "SessionDescriptionHandler-created",
    listener: (sessionDescriptionHandler: SessionDescriptionHandler) => void
  ): this;
  public on(event: "accepted", listener: (response: any, cause: C.causes) => void): this;
  public on(
    event:
      "ack" |
      "bye" |
      "confirmed" |
      "connecting" |
      "notify",
    listener: (request: any) => void
  ): this; //  TODO
  public on(event: "dialog", listener: (dialog: any) => void): this;
  public on(event: "renegotiationError", listener: (error: any) => void): this; // TODO
  public on(event: "failed" | "rejected", listener: (response?: any, cause?: C.causes) => void): this;
  public on(event: "terminated", listener: (message?: any, cause?: C.causes) => void): this;
  public on(event: "cancel" | "trackAdded" | "directionChanged", listener: () => void): this;
  public on(name: string, callback: (...args: any[]) => void): this {
    return super.on(name, callback);
  }

  // In dialog INVITE Reception
  protected receiveReinvite(request: IncomingRequest): void {
    // TODO: Should probably check state of the session

    this.emit("reinvite", this, request);

    if (request.hasHeader("P-Asserted-Identity")) {
      this.assertedIdentity = Grammar.nameAddrHeaderParse(request.getHeader("P-Asserted-Identity") as string);
    }

    let promise: Promise<BodyObj>;
    if (!this.sessionDescriptionHandler) {
      this.logger.warn("No SessionDescriptionHandler to reinvite");
      return;
    }
    if (request.getHeader("Content-Length") === "0" && !request.getHeader("Content-Type")) { // Invite w/o SDP
      promise = this.sessionDescriptionHandler.getDescription(
        this.sessionDescriptionHandlerOptions,
        this.modifiers
      );
    } else if (this.sessionDescriptionHandler.hasDescription(request.getHeader("Content-Type") || "")) {
      // Invite w/ SDP
      promise = this.sessionDescriptionHandler.setDescription(
        request.body,
        this.sessionDescriptionHandlerOptions,
        this.modifiers
        ).then(this.sessionDescriptionHandler.getDescription.bind(
            this.sessionDescriptionHandler,
            this.sessionDescriptionHandlerOptions,
            this.modifiers)
        );
    } else { // Bad Packet (should never get hit)
      request.reply(415);
      this.emit("reinviteFailed", this);
      return;
    }

    this.receiveRequest = (incRequest: IncomingRequest): void => {
      if (incRequest.method === C.ACK && this.status === SessionStatus.STATUS_WAITING_FOR_ACK) {
        if (this.sessionDescriptionHandler &&
            this.sessionDescriptionHandler.hasDescription(incRequest.getHeader("Content-Type") || "")) {
          this.hasAnswer = true;
          this.sessionDescriptionHandler.setDescription(
            incRequest.body,
            this.sessionDescriptionHandlerOptions,
            this.modifiers
          ).then(() => {
              clearTimeout(this.timers.ackTimer);
              clearTimeout(this.timers.invite2xxTimer);
              this.status = SessionStatus.STATUS_CONFIRMED;

              this.emit("confirmed", incRequest);
            });
        } else {
          clearTimeout(this.timers.ackTimer);
          clearTimeout(this.timers.invite2xxTimer);
          this.status = SessionStatus.STATUS_CONFIRMED;

          this.emit("confirmed", incRequest);
        }
      } else {
        this.originalReceiveRequest(incRequest);
      }
    };

    promise.catch((e: any) => {
        let statusCode: number;
        if (e.type === TypeStrings.SessionDescriptionHandlerError) {
          statusCode = 500;
        } else if (e.type === TypeStrings.RenegotiationError) {
          this.emit("renegotiationError", e);
          this.logger.warn(e.toString());
          statusCode = 488;
        } else {
          this.logger.error(e);
          statusCode = 488;
        }
        request.reply(statusCode);
        this.emit("reinviteFailed", this);
        // TODO: This could be better
        throw e;
      }).then((description) => {
        const extraHeaders: Array<string> = ["Contact: " + this.contact];
        request.reply(200, undefined, extraHeaders, description);
        this.status = SessionStatus.STATUS_WAITING_FOR_ACK;
        this.setACKTimer();
        this.emit("reinviteAccepted", this);
      });
  }

  protected sendReinvite(options: any = {}): void {
    if (this.pendingReinvite) {
      this.logger.warn("Reinvite in progress. Please wait until complete, then try again.");
      return;
    }
    if (!this.sessionDescriptionHandler) {
      this.logger.warn("No SessionDescriptionHandler, can't reinvite..");
      return;
    }
    this.pendingReinvite = true;
    options.modifiers = options.modifiers || [];

    const extraHeaders: Array<string> = (options.extraHeaders || []).slice();

    extraHeaders.push("Contact: " + this.contact);
    // this is UA.C.ALLOWED_METHODS, removed to get around circular dependency
    extraHeaders.push("Allow: " + [
      "ACK",
      "CANCEL",
      "INVITE",
      "MESSAGE",
      "BYE",
      "OPTIONS",
      "INFO",
      "NOTIFY",
      "REFER"
    ].toString());
    this.sessionDescriptionHandler.getDescription(options.sessionDescriptionHandlerOptions, options.modifiers)
      .then((description: BodyObj) => {
        this.sendRequest(C.INVITE, {
          extraHeaders,
          body: description,
          receiveResponse: (response: IncomingResponse) => this.receiveReinviteResponse(response)
        });
      }).catch((e: any) => {
        if (e.type === TypeStrings.RenegotiationError) {
          this.pendingReinvite = false;
          this.emit("renegotiationError", e);
          this.logger.warn("Renegotiation Error");
          this.logger.warn(e.toString());
          throw e;
        }
        this.logger.error("sessionDescriptionHandler error");
        this.logger.error(e);
        throw e;
      });
  }

  // Reception of Response for in-dialog INVITE
  protected receiveReinviteResponse(response: IncomingResponse): void {
    if (this.status === SessionStatus.STATUS_TERMINATED) {
      this.logger.error("Received reinvite response, but in STATUS_TERMINATED");
      // TODO: Do we need to send a SIP response?
      return;
    }

    if (!this.pendingReinvite) {
      this.logger.error("Received reinvite response, but have no pending reinvite");
      // TODO: Do we need to send a SIP response?
      return;
    }
    const statusCode: string = response && response.statusCode ? response.statusCode.toString() : "";

    switch (true) {
      case /^1[0-9]{2}$/.test(statusCode):
        break;
      case /^2[0-9]{2}$/.test(statusCode):
        this.status = SessionStatus.STATUS_CONFIRMED;

        // 17.1.1.1 - For each final response that is received at the client transaction,
        // the client transaction sends an ACK,
        this.emit("ack", response.ack());
        this.pendingReinvite = false;
        // TODO: All of these timers should move into the Transaction layer
        clearTimeout(this.timers.invite2xxTimer);
        if (
          !this.sessionDescriptionHandler ||
          !this.sessionDescriptionHandler.hasDescription(response.getHeader("Content-Type") || "")
        ) {
          this.logger.error("2XX response received to re-invite but did not have a description");
          this.emit("reinviteFailed", this);
          this.emit(
            "renegotiationError",
            new Exceptions.RenegotiationError("2XX response received to re-invite but did not have a description")
          );
          break;
        }

        this.sessionDescriptionHandler
          .setDescription(response.body, this.sessionDescriptionHandlerOptions, this.modifiers)
          .catch((e: any) => {
            this.logger.error("Could not set the description in 2XX response");
            this.logger.error(e);
            this.emit("reinviteFailed", this);
            this.emit("renegotiationError", e);
            this.sendRequest(C.BYE, {
              extraHeaders: ["Reason: " + Utils.getReasonHeaderValue(488, "Not Acceptable Here")]
            });
            this.terminated(undefined, C.causes.INCOMPATIBLE_SDP);
            throw e;
          })
          .then(() => {
            this.emit("reinviteAccepted", this);
          });
        break;
      default:
        this.pendingReinvite = false;
        this.logger.log("Received a non 1XX or 2XX response to a re-invite");
        this.emit("reinviteFailed", this);
        this.emit("renegotiationError", new Exceptions.RenegotiationError("Invalid response to a re-invite"));
    }
  }

  protected acceptAndTerminate(response: IncomingResponse, statusCode?: number, reasonPhrase?: string): Session {
    const extraHeaders: Array<string> = [];

    if (statusCode) {
      extraHeaders.push("Reason: " + Utils.getReasonHeaderValue(statusCode, reasonPhrase));
    }

    // An error on dialog creation will fire 'failed' event
    if (this.dialog || this.createDialog(response, "UAC")) {
      this.emit("ack", response.ack());
      this.sendRequest(C.BYE, { extraHeaders });
    }

    return this;
  }

  /**
   * RFC3261 13.3.1.4
   * Response retransmissions cannot be accomplished by transaction layer
   *  since it is destroyed when receiving the first 2xx answer
   */
  protected setInvite2xxTimer(request: IncomingRequest, description: string): void {
    let timeout: number = Timers.T1;
    const invite2xxRetransmission = () => {
      if (this.status !== SessionStatus.STATUS_WAITING_FOR_ACK) {
        return;
      }

      this.logger.log("no ACK received, attempting to retransmit OK");

      const extraHeaders: Array<string> = ["Contact: " + this.contact];

      request.reply(200, undefined, extraHeaders, description);

      timeout = Math.min(timeout * 2, Timers.T2);

      this.timers.invite2xxTimer = setTimeout(invite2xxRetransmission, timeout);
    };
    this.timers.invite2xxTimer = setTimeout(invite2xxRetransmission, timeout);
  }

  /**
   * RFC3261 14.2
   * If a UAS generates a 2xx response and never receives an ACK,
   * it SHOULD generate a BYE to terminate the dialog.
   */
  protected setACKTimer(): void {
    this.timers.ackTimer = setTimeout(() => {
      if (this.status === SessionStatus.STATUS_WAITING_FOR_ACK) {
        this.logger.log("no ACK received for an extended period of time, terminating the call");
        clearTimeout(this.timers.invite2xxTimer);
        this.sendRequest(C.BYE);
        this.terminated(undefined, C.causes.NO_ACK);
      }
    }, Timers.TIMER_H);
  }

  protected failed(response: IncomingResponse | IncomingRequest | undefined, cause: string): this {
    if (this.status === SessionStatus.STATUS_TERMINATED) {
      return this;
    }
    this.emit("failed", response, cause);
    return this;
  }

  protected rejected(response: IncomingResponse | IncomingRequest, cause: string): this {
    this.emit("rejected", response, cause);
    return this;
  }

  protected canceled(): this {
    if (this.sessionDescriptionHandler) {
      this.sessionDescriptionHandler.close();
    }
    this.emit("cancel");
    return this;
  }

  protected accepted(response?: IncomingResponse | string, cause?: string): this {
    if (!(response instanceof String)) {
      cause = Utils.getReasonPhrase((response && (response as IncomingResponse).statusCode) || 0, cause);
    }

    this.startTime = new Date();

    if (this.replacee) {
      this.replacee.emit("replaced", this);
      this.replacee.terminate();
    }
    this.emit("accepted", response, cause);
    return this;
  }

  protected terminated(message?: IncomingResponse | IncomingRequest, cause?: string): this {
    if (this.status === SessionStatus.STATUS_TERMINATED) {
      return this;
    }

    this.endTime = new Date();

    this.close();
    this.emit("terminated", message, cause);
    return this;
  }

  protected connecting(request: IncomingRequest): this {
    this.emit("connecting", { request });
    return this;
  }

  protected receiveNonInviteResponse(response: IncomingResponse): void {
    // blank, to be overridden
  }
}

export namespace InviteServerContext {
  export interface Options {  // TODO: This may be incorrect
      /** Array of extra headers added to the INVITE. */
      extraHeaders?: Array<string>;
      /** Options to pass to SessionDescriptionHandler's getDescription() and setDescription(). */
      sessionDescriptionHandlerOptions?: SessionDescriptionHandlerOptions;
      modifiers?: SessionDescriptionHandlerModifiers;
      onInfo?: ((request: IncomingRequest) => void);
      statusCode?: number;
      reasonPhrase?: string;
      body?: any;
      rel100?: boolean;
  }
}

// tslint:disable-next-line:max-classes-per-file
export class InviteServerContext extends Session implements ServerContext {
  public type: TypeStrings;
  public transaction!: InviteServerTransaction | NonInviteServerTransaction;
  public request!: IncomingRequest;

  constructor(ua: UA, request: IncomingRequest) {
    if (!ua.configuration.sessionDescriptionHandlerFactory) {
      ua.logger.warn("Can't build ISC without SDH Factory");
      throw new Error("ISC Constructor Failed");
    }
    super(ua.configuration.sessionDescriptionHandlerFactory);
    ServerContext.initializer(this, ua, request);
    this.type = TypeStrings.InviteServerContext;

    const contentDisp: any = request.parseHeader("Content-Disposition");
    if (contentDisp && contentDisp.type === "render") {
      this.renderbody = request.body;
      this.rendertype = request.getHeader("Content-Type");
    }

    this.status = SessionStatus.STATUS_INVITE_RECEIVED;
    this.fromTag = request.fromTag;
    this.id = request.callId + this.fromTag;
    this.request = request;
    this.contact = this.ua.contact.toString();

    this.receiveNonInviteResponse = () => { /* intentional no-op */ };

    this.logger = ua.getLogger("sip.inviteservercontext", this.id);

    // Save the session into the ua sessions collection.
    this.ua.sessions[this.id] = this;

    // Set 100rel if necessary
    const set100rel: ((h: string, r: string) => void) = (header: string, relSetting: string) => {
      if (request.hasHeader(header) && (request.getHeader(header) as string).toLowerCase().indexOf("100rel") >= 0) {
        this.rel100 = relSetting;
      }
    };
    set100rel("require", C.supported.REQUIRED);
    set100rel("supported", C.supported.SUPPORTED);

    /* Set the toTag before
    * replying a response code that will create a dialog.
    */
    request.toTag = Utils.newTag();

    // An error on dialog creation will fire 'failed' event
    if (!this.createDialog(request, "UAS", true)) {
      request.reply(500, "Missing Contact header field");
      return;
    }

    const options: any = {extraHeaders: ["Contact: " + this.contact]};

    if (this.rel100 !== C.supported.REQUIRED) {
      this.progress(options);
    }
    this.status = SessionStatus.STATUS_WAITING_FOR_ANSWER;

    // Set userNoAnswerTimer
    this.timers.userNoAnswerTimer = setTimeout(() => {
      request.reply(408);
      this.failed(request, C.causes.NO_ANSWER);
      this.terminated(request, C.causes.NO_ANSWER);
    }, this.ua.configuration.noAnswerTimeout || 60);

    /* Set expiresTimer
    * RFC3261 13.3.1
    */
    // Get the Expires header value if exists
    if (request.hasHeader("expires")) {
      const expires: number = Number(request.getHeader("expires") || 0) * 1000;
      this.timers.expiresTimer = setTimeout(() => {
        if (this.status === SessionStatus.STATUS_WAITING_FOR_ANSWER) {
          request.reply(487);
          this.failed(request, C.causes.EXPIRES);
          this.terminated(request, C.causes.EXPIRES);
        }
      }, expires);
    }

    this.errorListener = this.onTransportError.bind(this);
    if (ua.transport) {
      ua.transport.on("transportError", this.errorListener);
    }
  }

  // typing note: this was the only function using its super in ServerContext
  // so the bottom half of this function is copied and paired down from that
  public reject(options: InviteServerContext.Options = {}): this {
    // Check Session Status
    if (this.status === SessionStatus.STATUS_TERMINATED) {
      throw new Exceptions.InvalidStateError(this.status);
    }

    this.logger.log("rejecting RTCSession");

    const statusCode = options.statusCode || 480;

    const reasonPhrase = Utils.getReasonPhrase(statusCode, options.reasonPhrase);
    const extraHeaders = options.extraHeaders || [];

    if (statusCode < 300 || statusCode > 699) {
      throw new TypeError("Invalid statusCode: " + statusCode);
    }
    const response = this.request.reply(statusCode, reasonPhrase, extraHeaders, options.body);
    (["rejected", "failed"]).forEach((event) => {
      this.emit(event, response, reasonPhrase);
    });

    return this.terminated();
  }

  // type hack for servercontext interface
  public reply(options: any = {}): this {
    return this;
  }

  public terminate(options: any = {}): this {

    const extraHeaders: Array<string> = (options.extraHeaders || []).slice();

    if (this.status === SessionStatus.STATUS_WAITING_FOR_ACK &&
        this.request.transaction &&
        this.request.transaction.state !== TransactionState.Terminated) {
      const dialog: Dialog | undefined = this.dialog;

      this.receiveRequest = (request: IncomingRequest): void =>  {
        if (request.method === C.ACK) {
          this.sendRequest(C.BYE, { extraHeaders });
          if (this.dialog) {
            this.dialog.terminate();
          }
        }
      };

      this.request.transaction.on("stateChanged", () => {
        if (this.request.transaction &&
            this.request.transaction.state === TransactionState.Terminated &&
            this.dialog) {
          this.bye();
          this.dialog.terminate();
        }
      });

      this.emit("bye", this.request);
      this.terminated();

      // Restore the dialog into 'ua' so the ACK can reach 'this' session
      this.dialog = dialog;
      if (this.dialog) {
        this.ua.dialogs[this.dialog.id.toString()] = this.dialog;
      }

    } else if (this.status === SessionStatus.STATUS_CONFIRMED) {
      this.bye(options);
    } else {
      this.reject(options);
    }

    return this;
  }

  // @param {Object} [options.sessionDescriptionHandlerOptions]
  // gets passed to SIP.SessionDescriptionHandler.getDescription as options
  public progress(options: InviteServerContext.Options = {}): this {
    const statusCode = options.statusCode || 180;
    const extraHeaders: Array<string> = (options.extraHeaders || []).slice();

    if (statusCode < 100 || statusCode > 199) {
      throw new TypeError("Invalid statusCode: " + statusCode);
    }

    if (this.status === SessionStatus.STATUS_TERMINATED) {
      return this;
    }

    const do100rel: (() => void) = () => {
      const relStatusCode = options.statusCode || 183;

      // Set status and add extra headers
      this.status = SessionStatus.STATUS_WAITING_FOR_PRACK;
      extraHeaders.push("Contact: " + this.contact);
      extraHeaders.push("Require: 100rel");
      extraHeaders.push("RSeq: " + Math.floor(Math.random() * 10000));

      if (!this.sessionDescriptionHandler) {
        this.logger.warn("No SessionDescriptionHandler, can't do 100rel");
        return;
      }
      // Get the session description to add to preaccept with
      this.sessionDescriptionHandler.getDescription(options.sessionDescriptionHandlerOptions, options.modifiers)
      .then((description: any) => {
        if (this.status === SessionStatus.STATUS_TERMINATED) {
          return;
        }

        this.earlySdp = description.body;
        this[this.hasOffer ? "hasAnswer" : "hasOffer"] = true;

        // Retransmit until we get a response or we time out (see prackTimer below)
        let timeout: number = Timers.T1;
        const rel1xxRetransmission: () => void = () => {
          this.request.reply(relStatusCode, undefined, extraHeaders, description);
          timeout *= 2;
          this.timers.rel1xxTimer = setTimeout(rel1xxRetransmission, timeout);
        };

        this.timers.rel1xxTimer = setTimeout(rel1xxRetransmission, timeout);

        // Timeout and reject INVITE if no response
        this.timers.prackTimer = setTimeout(() => {
          if (this.status !== SessionStatus.STATUS_WAITING_FOR_PRACK) {
            return;
          }

          this.logger.log("no PRACK received, rejecting the call");
          clearTimeout(this.timers.rel1xxTimer);
          this.request.reply(504);
          this.terminated(undefined, C.causes.NO_PRACK);
        }, Timers.T1 * 64);

        // Send the initial response
        const response: string = this.request.reply(relStatusCode, options.reasonPhrase, extraHeaders, description);
        this.emit("progress", response, options.reasonPhrase);
      }, () => {
        this.request.reply(480);
        this.failed(undefined, C.causes.WEBRTC_ERROR);
        this.terminated(undefined, C.causes.WEBRTC_ERROR);
      });
    }; // end do100rel

    const normalReply: (() => void) = () => {
      const response: string = this.request.reply(statusCode, options.reasonPhrase, extraHeaders, options.body);
      this.emit("progress", response, options.reasonPhrase);
    };

    if (options.statusCode !== 100 &&
        (this.rel100 === C.supported.REQUIRED ||
         (this.rel100 === C.supported.SUPPORTED && options.rel100) ||
         (this.rel100 === C.supported.SUPPORTED && (this.ua.configuration.rel100 === C.supported.REQUIRED)))) {
      this.sessionDescriptionHandler = this.setupSessionDescriptionHandler();
      this.emit("SessionDescriptionHandler-created", this.sessionDescriptionHandler);
      if (this.sessionDescriptionHandler.hasDescription(this.request.getHeader("Content-Type") || "")) {
        this.hasOffer = true;
        this.sessionDescriptionHandler.setDescription(
          this.request.body,
          options.sessionDescriptionHandlerOptions,
          options.modifiers
        ).then(do100rel)
        .catch((e: any) => {
          this.logger.warn("invalid description");
          this.logger.warn(e);
          this.failed(undefined, C.causes.WEBRTC_ERROR);
          this.terminated(undefined, C.causes.WEBRTC_ERROR);
          throw e;
        });
      } else {
        do100rel();
      }
    } else {
      normalReply();
    }
    return this;
  }

  // @param {Object} [options.sessionDescriptionHandlerOptions] gets passed
  // to SIP.SessionDescriptionHandler.getDescription as options
  public accept(options: InviteServerContext.Options = {}): this {
    this.onInfo = options.onInfo;

    const extraHeaders: Array<string> = (options.extraHeaders || []).slice();
    const descriptionCreationSucceeded: ((description: any) => void) = (description: any) => {
      extraHeaders.push("Contact: " + this.contact);
      // this is UA.C.ALLOWED_METHODS, removed to get around circular dependency
      extraHeaders.push("Allow: " + [
        "ACK",
        "CANCEL",
        "INVITE",
        "MESSAGE",
        "BYE",
        "OPTIONS",
        "INFO",
        "NOTIFY",
        "REFER"
      ].toString());
      if (!this.hasOffer) {
        this.hasOffer = true;
      } else {
        this.hasAnswer = true;
      }
      const response: string = this.request.reply(200, undefined, extraHeaders, description);
      this.status = SessionStatus.STATUS_WAITING_FOR_ACK;
      this.setInvite2xxTimer(this.request, description);
      this.setACKTimer();
      this.accepted(response, Utils.getReasonPhrase(200));
    };
    const descriptionCreationFailed: ((err: any) => void) = (err: any) => {
      if (err.type === TypeStrings.SessionDescriptionHandlerError) {
        this.logger.log(err.message);
        if (err.error) {
          this.logger.log(err.error);
        }
      }
      this.request.reply(480);
      this.failed(undefined, C.causes.WEBRTC_ERROR);
      this.terminated(undefined, C.causes.WEBRTC_ERROR);
      throw err;
    };

    // Check Session Status
    if (this.status === SessionStatus.STATUS_WAITING_FOR_PRACK) {
      this.status = SessionStatus.STATUS_ANSWERED_WAITING_FOR_PRACK;
      return this;
    } else if (this.status === SessionStatus.STATUS_WAITING_FOR_ANSWER) {
      this.status = SessionStatus.STATUS_ANSWERED;
    } else if (this.status !== SessionStatus.STATUS_EARLY_MEDIA) {
      throw new Exceptions.InvalidStateError(this.status);
    }

    // An error on dialog creation will fire 'failed' event
    if (!this.createDialog(this.request, "UAS")) {
      this.request.reply(500, "Missing Contact header field");
      return this;
    }

    clearTimeout(this.timers.userNoAnswerTimer);

    if (this.status === SessionStatus.STATUS_EARLY_MEDIA) {
      descriptionCreationSucceeded({});
    } else {
      this.sessionDescriptionHandler = this.setupSessionDescriptionHandler();
      this.emit("SessionDescriptionHandler-created", this.sessionDescriptionHandler);
      if (this.request.getHeader("Content-Length") === "0" && !this.request.getHeader("Content-Type")) {
        this.sessionDescriptionHandler.getDescription(options.sessionDescriptionHandlerOptions, options.modifiers)
        .catch(descriptionCreationFailed)
        .then(descriptionCreationSucceeded);
      } else if (this.sessionDescriptionHandler.hasDescription(this.request.getHeader("Content-Type") || "")) {
        this.hasOffer = true;
        this.sessionDescriptionHandler.setDescription(
          this.request.body,
          options.sessionDescriptionHandlerOptions,
          options.modifiers
        ).then(() => {
          if (!this.sessionDescriptionHandler) {
            throw new Error("No SDH");
          }
          return this.sessionDescriptionHandler.getDescription(
            options.sessionDescriptionHandlerOptions,
            options.modifiers
          );
        })
        .catch(descriptionCreationFailed)
        .then(descriptionCreationSucceeded);
      } else {
        this.request.reply(415);
        // TODO: Events
        return this;
      }
    }

    return this;
  }

  // ISC RECEIVE REQUEST
  public receiveRequest(request: IncomingRequest): void {
    const confirmSession = () => {
      clearTimeout(this.timers.ackTimer);
      clearTimeout(this.timers.invite2xxTimer);
      this.status = SessionStatus.STATUS_CONFIRMED;

      const contentDisp: any = request.getHeader("Content-Disposition");

      if (contentDisp && contentDisp.type === "render") {
        this.renderbody = request.body;
        this.rendertype = request.getHeader("Content-Type");
      }

      this.emit("confirmed", request);
    };

    switch (request.method) {
      case C.CANCEL:
        /* RFC3261 15 States that a UAS may have accepted an invitation while a CANCEL
        * was in progress and that the UAC MAY continue with the session established by
        * any 2xx response, or MAY terminate with BYE. SIP does continue with the
        * established session. So the CANCEL is processed only if the session is not yet
        * established.
        */

        /*
        * Terminate the whole session in case the user didn't accept (or yet to send the answer) nor reject the
        *request opening the session.
        */
        if (this.status === SessionStatus.STATUS_WAITING_FOR_ANSWER ||
          this.status === SessionStatus.STATUS_WAITING_FOR_PRACK ||
          this.status === SessionStatus.STATUS_ANSWERED_WAITING_FOR_PRACK ||
          this.status === SessionStatus.STATUS_EARLY_MEDIA ||
          this.status === SessionStatus.STATUS_ANSWERED) {

          this.status = SessionStatus.STATUS_CANCELED;
          this.request.reply(487);
          this.canceled();
          this.rejected(request, C.causes.CANCELED);
          this.failed(request, C.causes.CANCELED);
          this.terminated(request, C.causes.CANCELED);
        }
        break;
      case C.ACK:
        if (this.status === SessionStatus.STATUS_WAITING_FOR_ACK) {
          this.status = SessionStatus.STATUS_CONFIRMED;
          if (this.sessionDescriptionHandler &&
              this.sessionDescriptionHandler.hasDescription(request.getHeader("Content-Type") || "")) {
            // ACK contains answer to an INVITE w/o SDP negotiation
            this.hasAnswer = true;
            this.sessionDescriptionHandler.setDescription(
              request.body,
              this.sessionDescriptionHandlerOptions,
              this.modifiers
            ).catch((e: any) => {
              this.logger.warn(e);
              this.terminate({  // TODO: This should be a BYE
                statusCode: "488",
                reasonPhrase: "Bad Media Description"
              });
              this.failed(request, C.causes.BAD_MEDIA_DESCRIPTION);
              this.terminated(request, C.causes.BAD_MEDIA_DESCRIPTION);
              throw e;
            }).then(() => confirmSession());
          } else {
            confirmSession();
          }
        }
        break;
      case C.PRACK:
        if (this.status === SessionStatus.STATUS_WAITING_FOR_PRACK ||
            this.status === SessionStatus.STATUS_ANSWERED_WAITING_FOR_PRACK) {
          if (!this.hasAnswer) {
            this.sessionDescriptionHandler = this.setupSessionDescriptionHandler();
            this.emit("SessionDescriptionHandler-created", this.sessionDescriptionHandler);
            if (this.sessionDescriptionHandler.hasDescription(request.getHeader("Content-Type") || "")) {
              this.hasAnswer = true;
              this.sessionDescriptionHandler.setDescription(
                request.body,
                this.sessionDescriptionHandlerOptions,
                this.modifiers
              ).then(() => {
                clearTimeout(this.timers.rel1xxTimer);
                clearTimeout(this.timers.prackTimer);
                request.reply(200);
                if (this.status === SessionStatus.STATUS_ANSWERED_WAITING_FOR_PRACK) {
                  this.status = SessionStatus.STATUS_EARLY_MEDIA;
                  this.accept();
                }
                this.status = SessionStatus.STATUS_EARLY_MEDIA;
              }, (e: any) => {
                this.logger.warn(e);
                this.terminate({
                  statusCode: "488",
                  reasonPhrase: "Bad Media Description"
                });
                this.failed(request, C.causes.BAD_MEDIA_DESCRIPTION);
                this.terminated(request, C.causes.BAD_MEDIA_DESCRIPTION);
              });
            } else {
              this.terminate({
                statusCode: "488",
                reasonPhrase: "Bad Media Description"
              });
              this.failed(request, C.causes.BAD_MEDIA_DESCRIPTION);
              this.terminated(request, C.causes.BAD_MEDIA_DESCRIPTION);
            }
          } else {
            clearTimeout(this.timers.rel1xxTimer);
            clearTimeout(this.timers.prackTimer);
            request.reply(200);

            if (this.status === SessionStatus.STATUS_ANSWERED_WAITING_FOR_PRACK) {
              this.status = SessionStatus.STATUS_EARLY_MEDIA;
              this.accept();
            }
            this.status = SessionStatus.STATUS_EARLY_MEDIA;
          }
        } else if (this.status === SessionStatus.STATUS_EARLY_MEDIA) {
          request.reply(200);
        }
        break;
      default:
        Session.prototype.receiveRequest.apply(this, [request]);
        break;
    }
  }

  // Internal Function to setup the handler consistently
  private setupSessionDescriptionHandler(): SessionDescriptionHandler {
    if (this.sessionDescriptionHandler) {
      return this.sessionDescriptionHandler;
    }
    return this.sessionDescriptionHandlerFactory(this, this.ua.configuration.sessionDescriptionHandlerFactoryOptions);
  }
}

export namespace InviteClientContext {
  export interface Options {
    /** Array of extra headers added to the INVITE. */
    extraHeaders?: Array<string>;
    /** If true, send INVITE without SDP. */
    inviteWithoutSdp?: boolean;
    /** Deprecated */
    params?: {
      toUri?: string;
      toDisplayName: string;
    };
    /** Options to pass to SessionDescriptionHandler's getDescription() and setDescription(). */
    sessionDescriptionHandlerOptions?: SessionDescriptionHandlerOptions;
  }
}

// tslint:disable-next-line:max-classes-per-file
export class InviteClientContext extends Session implements ClientContext {
  public type: TypeStrings;
  public request!: OutgoingRequest;

  private anonymous: boolean;
  private inviteWithoutSdp: boolean;
  private isCanceled: boolean;
  private received100: boolean;
  private cancelReason: string | undefined;

  constructor(ua: UA, target: string | URI, options: any = {}, modifiers: any = []) {
    if (!ua.configuration.sessionDescriptionHandlerFactory) {
      ua.logger.warn("Can't build ISC without SDH Factory");
      throw new Error("ICC Constructor Failed");
    }

    options.params = options.params || {};

    const anonymous: boolean = options.anonymous || false;
    const fromTag = Utils.newTag();

    options.params.fromTag = fromTag;

    /* Do not add ;ob in initial forming dialog requests if the registration over
    *  the current connection got a GRUU URI.
    */
    const contact = ua.contact.toString({
      anonymous,
      outbound: anonymous ? !ua.contact.tempGruu : !ua.contact.pubGruu
    });

    const extraHeaders: Array<string> = (options.extraHeaders || []).slice();
    if (anonymous && ua.configuration.uri) {
      options.params.from_displayName = "Anonymous";
      options.params.from_uri = "sip:anonymous@anonymous.invalid";

      extraHeaders.push("P-Preferred-Identity: " + ua.configuration.uri.toString());
      extraHeaders.push("Privacy: id");
    }
    extraHeaders.push("Contact: " + contact);
    // this is UA.C.ALLOWED_METHODS, removed to get around circular dependency
    extraHeaders.push("Allow: " + [
      "ACK",
      "CANCEL",
      "INVITE",
      "MESSAGE",
      "BYE",
      "OPTIONS",
      "INFO",
      "NOTIFY",
      "REFER"
    ].toString());

    if (ua.configuration.rel100 === C.supported.REQUIRED) {
      extraHeaders.push("Require: 100rel");
    }
    if (ua.configuration.replaces === C.supported.REQUIRED) {
      extraHeaders.push("Require: replaces");
    }

    options.extraHeaders = extraHeaders;

    super(ua.configuration.sessionDescriptionHandlerFactory);
    ClientContext.initializer(this, ua, C.INVITE, target, options);
    this.type = TypeStrings.InviteClientContext;

    this.passedOptions = options; // Save for later to use with refer

    this.sessionDescriptionHandlerOptions = options.sessionDescriptionHandlerOptions || {};
    this.modifiers = modifiers;

    this.inviteWithoutSdp = options.inviteWithoutSdp || false;

    // Set anonymous property
    this.anonymous = options.anonymous || false;

    // Custom data to be sent either in INVITE or in ACK
    this.renderbody = options.renderbody || undefined;
    this.rendertype = options.rendertype || "text/plain";

    // Session parameter initialization
    this.fromTag = fromTag;

    this.contact = contact;

    // Check Session Status
    if (this.status !== SessionStatus.STATUS_NULL) {
      throw new Exceptions.InvalidStateError(this.status);
    }

    // OutgoingSession specific parameters
    this.isCanceled = false;
    this.received100 = false;

    this.method = C.INVITE;
    this.logger = ua.getLogger("sip.inviteclientcontext");

    ua.applicants[this.toString()] = this;

    this.id = this.request.callId + this.fromTag;

    this.onInfo = options.onInfo;

    this.errorListener = this.onTransportError.bind(this);
    if (ua.transport) {
      ua.transport.on("transportError", this.errorListener);
    }
  }

  public receiveNonInviteResponse(response: IncomingResponse): void {
    this.receiveInviteResponse(response);
  }

  public receiveResponse(response: IncomingResponse): void {
    this.receiveInviteResponse(response);
  }

  // hack for getting around ClientContext interface
  public send(): this {
    const sender: RequestSender = new RequestSender(this, this.ua);
    sender.send();
    return this;
  }

  public invite(): this {
    // Save the session into the ua sessions collection.
    // Note: placing in constructor breaks call to request.cancel on close... User does not need this anyway
    this.ua.sessions[this.id] = this;

    // This should allow the function to return so that listeners can be set up for these events
    Promise.resolve().then(() => {
      if (this.inviteWithoutSdp) {
        // just send an invite with no sdp...
        this.request.body = this.renderbody;
        this.status = SessionStatus.STATUS_INVITE_SENT;
        this.send();
      } else {
        // Initialize Media Session
        this.sessionDescriptionHandler = this.sessionDescriptionHandlerFactory(
          this,
          this.ua.configuration.sessionDescriptionHandlerFactoryOptions || {}
        );
        this.emit("SessionDescriptionHandler-created", this.sessionDescriptionHandler);

        this.sessionDescriptionHandler.getDescription(this.sessionDescriptionHandlerOptions, this.modifiers)
        .then((description: any) => {
          if (this.isCanceled || this.status === SessionStatus.STATUS_TERMINATED) {
            return;
          }
          this.hasOffer = true;
          this.request.body = description;
          this.status = SessionStatus.STATUS_INVITE_SENT;
          this.send();
        }, (err: any) => {
          if (err.type === TypeStrings.SessionDescriptionHandlerError) {
            this.logger.log(err.message);
            if (err.error) {
              this.logger.log(err.error);
            }
          }
          if (this.status === SessionStatus.STATUS_TERMINATED) {
            return;
          }
          this.failed(undefined, C.causes.WEBRTC_ERROR);
          this.terminated(undefined, C.causes.WEBRTC_ERROR);
        });
      }
    });
    return this;
  }

  public receiveInviteResponse(response: IncomingResponse): void {
    if (this.status === SessionStatus.STATUS_TERMINATED || response.method !== C.INVITE) {
      return;
    }

    const id: string = response.callId + response.fromTag + response.toTag;
    const extraHeaders: Array<string> = [];

    if (this.dialog && (response.statusCode && response.statusCode >= 200 && response.statusCode <= 299)) {
      if (id !== this.dialog.id.toString() ) {
        if (!this.createDialog(response, "UAC", true)) {
          return;
        }
        this.emit("ack", response.ack({body: Utils.generateFakeSDP(response.body)}));
        this.earlyDialogs[id].sendRequest(this, C.BYE);

        /* NOTE: This fails because the forking proxy does not recognize that an unanswerable
         * leg (due to peerConnection limitations) has been answered first. If your forking
         * proxy does not hang up all unanswered branches on the first branch answered, remove this.
         */
        if (this.status !== SessionStatus.STATUS_CONFIRMED) {
          this.failed(response, C.causes.WEBRTC_ERROR);
          this.terminated(response, C.causes.WEBRTC_ERROR);
        }
        return;
      } else if (this.status === SessionStatus.STATUS_CONFIRMED) {
        this.emit("ack", response.ack(response));
        return;
      } else if (!this.hasAnswer) {
        // invite w/o sdp is waiting for callback
        // an invite with sdp must go on, and hasAnswer is true
        return;
      }
    }

    const statusCode: number | undefined = response && response.statusCode;

    if (this.dialog && statusCode && statusCode < 200) {
      /*
        Early media has been set up with at least one other different branch,
        but a final 2xx response hasn't been received
      */
      const rseq: string | undefined = response.getHeader("rseq");
      if (rseq && (this.dialog.pracked.indexOf(rseq) !== -1 ||
          (Number(this.dialog.pracked[this.dialog.pracked.length - 1]) >= Number(rseq) &&
          this.dialog.pracked.length > 0))) {
        return;
      }

      if (!this.earlyDialogs[id] && !this.createDialog(response, "UAC", true)) {
        return;
      }

      if (this.earlyDialogs[id].pracked.indexOf(response.getHeader("rseq")) !== -1 ||
          (this.earlyDialogs[id].pracked[this.earlyDialogs[id].pracked.length - 1] >= Number(rseq) &&
          this.earlyDialogs[id].pracked.length > 0)) {
        return;
      }

      extraHeaders.push("RAck: " + response.getHeader("rseq") + " " + response.getHeader("cseq"));
      this.earlyDialogs[id].pracked.push(response.getHeader("rseq"));

      this.earlyDialogs[id].sendRequest(this, C.PRACK, {
        extraHeaders,
        body: Utils.generateFakeSDP(response.body)
      });
      return;
    }

    // Proceed to cancellation if the user requested.
    if (this.isCanceled) {
      if (statusCode && statusCode >= 100 && statusCode < 200) {
        this.request.cancel(this.cancelReason, extraHeaders);
        this.canceled();
      } else if (statusCode && statusCode >= 200 && statusCode < 299) {
        this.acceptAndTerminate(response);
        this.emit("bye", this.request);
      } else if (statusCode && statusCode >= 300) {
        const cause: string = (C.REASON_PHRASE as any)[response.statusCode || 0] || C.causes.CANCELED;
        this.rejected(response, cause);
        this.failed(response, cause);
        this.terminated(response, cause);
      }
      return;
    }

    const codeString = statusCode ? statusCode.toString() : "";

    switch (true) {
      case /^100$/.test(codeString):
        this.received100 = true;
        this.emit("progress", response);
        break;
      case (/^1[0-9]{2}$/.test(codeString)):
        // Do nothing with 1xx responses without To tag.
        if (!response.toTag) {
          this.logger.warn("1xx response received without to tag");
          break;
        }

        // Create Early Dialog if 1XX comes with contact
        if (response.hasHeader("contact")) {
          // An error on dialog creation will fire 'failed' event
          if (!this.createDialog(response, "UAC", true)) {
            break;
          }
        }

        this.status = SessionStatus.STATUS_1XX_RECEIVED;

        if (response.hasHeader("P-Asserted-Identity")) {
          this.assertedIdentity = Grammar.nameAddrHeaderParse(response.getHeader("P-Asserted-Identity") as string);
        }

        if (response.hasHeader("require") &&
            (response.getHeader("require") as string).indexOf("100rel") !== -1) {

          // Do nothing if this.dialog is already confirmed
          if (this.dialog || !this.earlyDialogs[id]) {
            break;
          }

          const rseq: string | undefined = response.getHeader("rseq");
          if (this.earlyDialogs[id].pracked.indexOf(rseq) !== -1 ||
              (this.earlyDialogs[id].pracked[this.earlyDialogs[id].pracked.length - 1] >= Number(rseq) &&
              this.earlyDialogs[id].pracked.length > 0)) {
            return;
          }
          // TODO: This may be broken. It may have to be on the early dialog
          this.sessionDescriptionHandler = this.sessionDescriptionHandlerFactory(
            this,
            this.ua.configuration.sessionDescriptionHandlerFactoryOptions || {}
          );
          this.emit("SessionDescriptionHandler-created", this.sessionDescriptionHandler);
          if (!this.sessionDescriptionHandler.hasDescription(response.getHeader("Content-Type") || "")) {
            extraHeaders.push("RAck: " + response.getHeader("rseq") + " " + response.getHeader("cseq"));
            this.earlyDialogs[id].pracked.push(response.getHeader("rseq"));
            this.earlyDialogs[id].sendRequest(this, C.PRACK, {
              extraHeaders
            });
            this.emit("progress", response);

          } else if (this.hasOffer) {
            if (!this.createDialog(response, "UAC")) {
              break;
            }
            this.hasAnswer = true;
            if (this.dialog !== undefined && rseq) {
              (this.dialog as Dialog).pracked.push(rseq);
            }

            this.sessionDescriptionHandler.setDescription(
              response.body,
              this.sessionDescriptionHandlerOptions,
              this.modifiers
            ).then(() => {
              extraHeaders.push("RAck: " + response.getHeader("rseq") + " " + response.getHeader("cseq"));

              this.sendRequest(C.PRACK, {
                extraHeaders,
                // tslint:disable-next-line:no-empty
                receiveResponse: () => {}
              });
              this.status = SessionStatus.STATUS_EARLY_MEDIA;
              this.emit("progress", response);
            }, (e: any) => {
              this.logger.warn(e);
              this.acceptAndTerminate(response, 488, "Not Acceptable Here");
              this.failed(response, C.causes.BAD_MEDIA_DESCRIPTION);
            });
          } else {
            const earlyDialog: Dialog = this.earlyDialogs[id];
            earlyDialog.sessionDescriptionHandler = this.sessionDescriptionHandlerFactory(
              this,
              this.ua.configuration.sessionDescriptionHandlerFactoryOptions || {}
            );
            this.emit("SessionDescriptionHandler-created", earlyDialog.sessionDescriptionHandler);

            if (rseq) {
              earlyDialog.pracked.push(rseq);
            }

            if (earlyDialog.sessionDescriptionHandler) {
              earlyDialog.sessionDescriptionHandler.setDescription(
                response.body,
                this.sessionDescriptionHandlerOptions,
                this.modifiers
              ).then(() => (earlyDialog.sessionDescriptionHandler as SessionDescriptionHandler).getDescription(
                this.sessionDescriptionHandlerOptions,
                this.modifiers)
              ).then((description: BodyObj) => {
                extraHeaders.push("RAck: " + rseq + " " + response.getHeader("cseq"));
                earlyDialog.sendRequest(this, C.PRACK, {
                  extraHeaders,
                  body: description
                });
                this.status = SessionStatus.STATUS_EARLY_MEDIA;
                this.emit("progress", response);
              }).catch((e: any) => {
                // TODO: This is a bit wonky
                if (rseq && e.type === TypeStrings.SessionDescriptionHandlerError) {
                  earlyDialog.pracked.push(rseq);
                  if (this.status === SessionStatus.STATUS_TERMINATED) {
                    return;
                  }
                  this.failed(undefined, C.causes.WEBRTC_ERROR);
                  this.terminated(undefined, C.causes.WEBRTC_ERROR);
                } else {
                  if (rseq) {
                    earlyDialog.pracked.splice(earlyDialog.pracked.indexOf(rseq), 1);
                  }
                  // Could not set remote description
                  this.logger.warn("invalid description");
                  this.logger.warn(e);
                }
                // FIXME: DON'T EAT UNHANDLED ERRORS!
              });
            }
          }
        } else {
          this.emit("progress", response);
        }
        break;
      case /^2[0-9]{2}$/.test(codeString):
        const cseq: string = this.request.cseq + " " + this.request.method;
        if (cseq !== response.getHeader("cseq")) {
          break;
        }

        if (response.hasHeader("P-Asserted-Identity")) {
          this.assertedIdentity = Grammar.nameAddrHeaderParse(response.getHeader("P-Asserted-Identity") as string);
        }

        if (this.status === SessionStatus.STATUS_EARLY_MEDIA && this.dialog) {
          this.status = SessionStatus.STATUS_CONFIRMED;
          const options: any = {};
          if (this.renderbody) {
            extraHeaders.push("Content-Type: " + this.rendertype);
            options.extraHeaders = extraHeaders;
            options.body = this.renderbody;
          }
          this.emit("ack", response.ack(options));
          this.accepted(response);
          break;
        }
        // Do nothing if this.dialog is already confirmed
        if (this.dialog) {
          break;
        }

        // This is an invite without sdp
        if (!this.hasOffer) {
          if (this.earlyDialogs[id] && this.earlyDialogs[id].sessionDescriptionHandler) {
            // REVISIT
            this.hasOffer = true;
            this.hasAnswer = true;
            this.sessionDescriptionHandler = this.earlyDialogs[id].sessionDescriptionHandler;
            if (!this.createDialog(response, "UAC")) {
              break;
            }
            this.status = SessionStatus.STATUS_CONFIRMED;
            this.emit("ack", response.ack());

            this.accepted(response);
          } else {
            this.sessionDescriptionHandler = this.sessionDescriptionHandlerFactory(
              this,
              this.ua.configuration.sessionDescriptionHandlerFactoryOptions || {}
            );
            this.emit("SessionDescriptionHandler-created", this.sessionDescriptionHandler);

            if (!this.sessionDescriptionHandler.hasDescription(response.getHeader("Content-Type") || "")) {
              this.acceptAndTerminate(response, 400, "Missing session description");
              this.failed(response, C.causes.BAD_MEDIA_DESCRIPTION);
              break;
            }
            if (!this.createDialog(response, "UAC")) {
              break;
            }
            this.hasOffer = true;
            this.sessionDescriptionHandler.setDescription(
              response.body,
              this.sessionDescriptionHandlerOptions,
              this.modifiers
            ).then(() => (this.sessionDescriptionHandler as SessionDescriptionHandler).getDescription(
              this.sessionDescriptionHandlerOptions,
              this.modifiers
            )).then((description: BodyObj) => {
              if (this.isCanceled || this.status === SessionStatus.STATUS_TERMINATED) {
                return;
              }

              this.status = SessionStatus.STATUS_CONFIRMED;
              this.hasAnswer = true;
              this.emit("ack", response.ack({body: description}));
              this.accepted(response);
            }).catch((e: any) => {
              if (e.type === TypeStrings.SessionDescriptionHandlerError) {
                this.logger.warn("invalid description");
                this.logger.warn(e.toString());
                // TODO: This message is inconsistent
                this.acceptAndTerminate(response, 488, "Invalid session description");
                this.failed(response, C.causes.BAD_MEDIA_DESCRIPTION);
              } else {
                throw e;
              }
            });
          }
        } else if (this.hasAnswer) {
          const options: any = {};
          if (this.renderbody) {
            extraHeaders.push("Content-Type: " + this.rendertype);
            options.extraHeaders = extraHeaders;
            options.body = this.renderbody;
          }
          this.emit("ack", response.ack(options));
        } else {
          if (!this.sessionDescriptionHandler ||
            !this.sessionDescriptionHandler.hasDescription(response.getHeader("Content-Type") || "")) {
            this.acceptAndTerminate(response, 400, "Missing session description");
            this.failed(response, C.causes.BAD_MEDIA_DESCRIPTION);
            break;
          }
          if (!this.createDialog(response, "UAC")) {
            break;
          }
          this.hasAnswer = true;
          this.sessionDescriptionHandler.setDescription(
            response.body,
            this.sessionDescriptionHandlerOptions,
            this.modifiers
          ).then(() => {
            const options: any = {};
            this.status = SessionStatus.STATUS_CONFIRMED;
            if (this.renderbody) {
              extraHeaders.push("Content-Type: " + this.rendertype);
              options.extraHeaders = extraHeaders;
              options.body = this.renderbody;
            }
            this.emit("ack", response.ack(options));
            this.accepted(response);
          }, (e: any) => {
            this.logger.warn(e);
            this.acceptAndTerminate(response, 488, "Not Acceptable Here");
            this.failed(response, C.causes.BAD_MEDIA_DESCRIPTION);
            // FIME: DON'T EAT UNHANDLED ERRORS!
          });
        }
        break;
      default:
        const cause: string = Utils.sipErrorCause(statusCode || 0);
        this.rejected(response, cause);
        this.failed(response, cause);
        this.terminated(response, cause);
    }
  }

  public cancel(options: any = {}): this {
    options.extraHeaders = (options.extraHeaders || []).slice();

    if (this.isCanceled) {
      throw new Exceptions.InvalidStateError(SessionStatus.STATUS_CANCELED);
    }

    // Check Session Status
    if (this.status === SessionStatus.STATUS_TERMINATED || this.status === SessionStatus.STATUS_CONFIRMED) {
      throw new Exceptions.InvalidStateError(this.status);
    }

    this.logger.log("canceling RTCSession");

    this.isCanceled = true;

    const cancelReason: string | undefined = Utils.getCancelReason(options.statusCode, options.reasonPhrase);

    // Check Session Status
    if (this.status === SessionStatus.STATUS_NULL ||
        (this.status === SessionStatus.STATUS_INVITE_SENT && !this.received100)) {
      this.cancelReason = cancelReason;
    } else if (this.status === SessionStatus.STATUS_INVITE_SENT ||
               this.status === SessionStatus.STATUS_1XX_RECEIVED ||
               this.status === SessionStatus.STATUS_EARLY_MEDIA) {
      this.request.cancel(cancelReason, options.extraHeaders);
    }

    return this.canceled();
  }

  public terminate(options?: any): this {
    if (this.status === SessionStatus.STATUS_TERMINATED) {
      return this;
    }

    if (this.status === SessionStatus.STATUS_WAITING_FOR_ACK || this.status === SessionStatus.STATUS_CONFIRMED) {
      this.bye(options);
    } else {
      this.cancel(options);
    }

    return this;
  }

  // ICC RECEIVE REQUEST
  public receiveRequest(request: IncomingRequest): void {
    // Reject CANCELs
    if (request.method === C.CANCEL) {
      // TODO; make this a switch when it gets added
    }

    if (request.method === C.ACK && this.status === SessionStatus.STATUS_WAITING_FOR_ACK) {
      clearTimeout(this.timers.ackTimer);
      clearTimeout(this.timers.invite2xxTimer);
      this.status = SessionStatus.STATUS_CONFIRMED;

      this.accepted();
    }

    return super.receiveRequest(request);
  }
}

export namespace ReferServerContext {

  export interface AcceptOptions {
    /** If true, accept REFER request and automatically attempt to follow it. */
    followRefer?: boolean;
    /** If followRefer is true, options to following INVITE request. */
    inviteOptions?: InviteClientContext.Options;
  }

  // tslint:disable-next-line:no-empty-interface
  export interface RejectOptions {
  }
}

// tslint:disable-next-line:max-classes-per-file
export class ReferClientContext extends ClientContext {
  public type: TypeStrings;
  private extraHeaders: Array<string>;
  private options: any;
  private applicant: InviteClientContext | InviteServerContext;
  private target: URI | string;
  private errorListener: (() => void) | undefined;

  constructor(
    ua: UA,
    applicant: InviteClientContext | InviteServerContext,
    target: InviteClientContext | InviteServerContext | string,
    options: any = {}
  ) {
    if (ua === undefined || applicant === undefined || target === undefined) {
      throw new TypeError("Not enough arguments");
    }

    super(ua, C.REFER, applicant.remoteIdentity.uri.toString(), options);
    this.type = TypeStrings.ReferClientContext;

    this.options = options;
    this.extraHeaders = (this.options.extraHeaders || []).slice();
    this.applicant = applicant;

    if (!(typeof target === "string") &&
      (target.type === TypeStrings.InviteServerContext || target.type === TypeStrings.InviteClientContext)) {
      // Attended Transfer (with replaces)
      // All of these fields should be defined based on the check above
      const dialog: Dialog | undefined = (target as any).dialog;
      if (dialog) {
        this.target = '"' + target.remoteIdentity.friendlyName + '" ' +
            "<" + dialog.remoteTarget.toString() +
            "?Replaces=" + encodeURIComponent(dialog.id.callId +
            ";to-tag=" + dialog.id.remoteTag +
            ";from-tag=" + dialog.id.localTag) + ">";
      } else {
        throw new TypeError("Invalid target due to no dialog: " + target);
      }
    } else {
      // Blind Transfer
      // Refer-To: <sip:bob@example.com>

      const targetString: any = Grammar.parse(target as string, "Refer_To");
      this.target = targetString && targetString.uri ? targetString.uri : target;

      // Check target validity
      const targetUri: URI | undefined = this.ua.normalizeTarget(this.target as string);
      if (!targetUri) {
        throw new TypeError("Invalid target: " + target);
      }
      this.target = targetUri;
    }

    if (this.ua) {
      this.extraHeaders.push("Referred-By: <" + this.ua.configuration.uri + ">");
    }
    // TODO: Check that this is correct isc/icc
    this.extraHeaders.push("Contact: " + applicant.contact);
    // this is UA.C.ALLOWED_METHODS, removed to get around circular dependency
    this.extraHeaders.push("Allow: " + [
      "ACK",
      "CANCEL",
      "INVITE",
      "MESSAGE",
      "BYE",
      "OPTIONS",
      "INFO",
      "NOTIFY",
      "REFER"
    ].toString());
    this.extraHeaders.push("Refer-To: " + this.target);

    this.errorListener = this.onTransportError.bind(this);
    if (ua.transport) {
      ua.transport.on("transportError", this.errorListener);
    }
  }

  public refer(options: any = {}): ReferClientContext {
    const extraHeaders: Array<string> = (this.extraHeaders || []).slice();

    if (options.extraHeaders) {
      extraHeaders.concat(options.extraHeaders);
    }

    this.applicant.sendRequest(C.REFER, {
      extraHeaders: this.extraHeaders,
      receiveResponse: (response: IncomingResponse): void => {
        const statusCode: string = response && response.statusCode ? response.statusCode.toString() : "";
        if (/^1[0-9]{2}$/.test(statusCode) ) {
          this.emit("referRequestProgress", this);
        } else if (/^2[0-9]{2}$/.test(statusCode) ) {
          this.emit("referRequestAccepted", this);
        } else if (/^[4-6][0-9]{2}$/.test(statusCode)) {
          this.emit("referRequestRejected", this);
        }
        if (options.receiveResponse) {
          options.receiveResponse(response);
        }
      }
    });
    return this;
  }

  public receiveNotify(request: IncomingRequest): void {
    // If we can correctly handle this, then we need to send a 200 OK!
    const contentType: string | undefined = request.hasHeader("Content-Type") ?
      request.getHeader("Content-Type") : undefined;
    if (contentType && contentType.search(/^message\/sipfrag/) !== -1) {
      const messageBody: any = Grammar.parse(request.body, "sipfrag");
      if (messageBody === -1) {
        request.reply(489, "Bad Event");
        return;
      }
      switch (true) {
        case (/^1[0-9]{2}$/.test(messageBody.status_code)):
          this.emit("referProgress", this);
          break;
        case (/^2[0-9]{2}$/.test(messageBody.status_code)):
          this.emit("referAccepted", this);
          if (!this.options.activeAfterTransfer && this.applicant.terminate) {
            this.applicant.terminate();
          }
          break;
        default:
          this.emit("referRejected", this);
          break;
      }
      request.reply(200);
      this.emit("notify", request);
      return;
    }
    request.reply(489, "Bad Event");
  }
}

// tslint:disable-next-line:max-classes-per-file
export class ReferServerContext extends ServerContext {
  public type: TypeStrings;
  public referTo!: NameAddrHeader;
  public targetSession: InviteClientContext | InviteServerContext | undefined;

  private status: SessionStatus;
  private fromTag: string;
  private fromUri: URI;
  private toUri: URI;
  private toTag: string;
  private routeSet: Array<string>;
  private remoteTarget: string;
  private id: string;
  private callId: string;
  private cseq: number;
  private contact: string;
  private referredBy: string | undefined;
  private referredSession!: InviteClientContext | InviteServerContext | undefined;
  private replaces: string | undefined;
  private errorListener!: (() => void);

  constructor(ua: UA, request: IncomingRequest) {
    super(ua, request);
    this.type = TypeStrings.ReferServerContext;

    this.ua = ua;

    this.status = SessionStatus.STATUS_INVITE_RECEIVED;
    this.fromTag = request.fromTag;
    this.id = request.callId + this.fromTag;
    this.request = request;
    this.contact = this.ua.contact.toString();

    this.logger = ua.getLogger("sip.referservercontext", this.id);

    // Needed to send the NOTIFY's
    this.cseq = Math.floor(Math.random() * 10000);
    this.callId = this.request.callId;
    this.fromUri = this.request.to.uri;
    this.fromTag = this.request.to.parameters.tag;
    this.remoteTarget = this.request.headers.Contact[0].parsed.uri;
    this.toUri = this.request.from.uri;
    this.toTag = this.request.fromTag;
    this.routeSet = this.request.getHeaders("record-route");

    // RFC 3515 2.4.1
    if (!this.request.hasHeader("refer-to")) {
      this.logger.warn("Invalid REFER packet. A refer-to header is required. Rejecting refer.");
      this.reject();
      return;
    }

    this.referTo = this.request.parseHeader("refer-to");

    // TODO: Must set expiration timer and send 202 if there is no response by then
    this.referredSession = this.ua.findSession(request);

    if (this.request.hasHeader("referred-by")) {
      this.referredBy = this.request.getHeader("referred-by");
    }

    if (this.referTo.uri.hasHeader("replaces")) {
      this.replaces = this.referTo.uri.getHeader("replaces");
    }

    this.errorListener = this.onTransportError.bind(this);
    if (ua.transport) {
      ua.transport.on("transportError", this.errorListener);
    }

    this.status = SessionStatus.STATUS_WAITING_FOR_ANSWER;
  }

  public receiveNonInviteResponse(response: IncomingResponse): void { /* intentionally blank */}

  public progress(): void {
    if (this.status !== SessionStatus.STATUS_WAITING_FOR_ANSWER) {
      throw new Exceptions.InvalidStateError(this.status);
    }
    this.request.reply(100);
  }

  public reject(options: ReferServerContext.RejectOptions = {}): void {
    if (this.status  === SessionStatus.STATUS_TERMINATED) {
      throw new Exceptions.InvalidStateError(this.status);
    }
    this.logger.log("Rejecting refer");
    this.status = SessionStatus.STATUS_TERMINATED;
    super.reject(options);
    this.emit("referRequestRejected", this);
  }

  public accept(
    options: ReferServerContext.AcceptOptions = {},
    modifiers?: SessionDescriptionHandlerModifiers
  ): void {
    if (this.status === SessionStatus.STATUS_WAITING_FOR_ANSWER) {
      this.status = SessionStatus.STATUS_ANSWERED;
    } else {
      throw new Exceptions.InvalidStateError(this.status);
    }

    this.request.reply(202, "Accepted");
    this.emit("referRequestAccepted", this);

    if (options.followRefer) {
      this.logger.log("Accepted refer, attempting to automatically follow it");

      const target: URI = this.referTo.uri;
      if (!target.scheme || !target.scheme.match("^sips?$")) {
        this.logger.error("SIP.js can only automatically follow SIP refer target");
        this.reject();
        return;
      }

      const inviteOptions: any = options.inviteOptions || {};
      const extraHeaders: Array<string> = (inviteOptions.extraHeaders || []).slice();
      if (this.replaces) {
        // decodeURIComponent is a holdover from 2c086eb4. Not sure that it is actually necessary
        extraHeaders.push("Replaces: " + decodeURIComponent(this.replaces));
      }

      if (this.referredBy) {
        extraHeaders.push("Referred-By: " + this.referredBy);
      }

      inviteOptions.extraHeaders = extraHeaders;

      target.clearHeaders();

      this.targetSession = this.ua.invite(target.toString(), inviteOptions, modifiers);

      this.emit("referInviteSent", this);

      if (this.targetSession) {
        this.targetSession.once("progress", (response) => {
          const statusCode: number = response.statusCode || 100;
          const reasonPhrase: string = response.reasonPhrase;

          this.sendNotify(("SIP/2.0 " + statusCode + " " + reasonPhrase).trim());
          this.emit("referProgress", this);
          if (this.referredSession) {
            this.referredSession.emit("referProgress", this);
          }
        });
        this.targetSession.once("accepted", () => {
          this.logger.log("Successfully followed the refer");
          this.sendNotify("SIP/2.0 200 OK");
          this.emit("referAccepted", this);
          if (this.referredSession) {
            this.referredSession.emit("referAccepted", this);
          }
        });

        const referFailed: ((response: IncomingResponse) => void) = (response) => {
          if (this.status === SessionStatus.STATUS_TERMINATED) {
            return; // No throw here because it is possible this gets called multiple times
          }
          this.logger.log("Refer was not successful. Resuming session");
          if (response && response.statusCode === 429) {
            this.logger.log("Alerting referrer that identity is required.");
            this.sendNotify("SIP/2.0 429 Provide Referrer Identity");
            return;
          }
          this.sendNotify("SIP/2.0 603 Declined");
          // Must change the status after sending the final Notify or it will not send due to check
          this.status = SessionStatus.STATUS_TERMINATED;
          this.emit("referRejected", this);
          if (this.referredSession) {
            this.referredSession.emit("referRejected");
          }
        };

        this.targetSession.once("rejected", referFailed);
        this.targetSession.once("failed", referFailed);
      }
    } else {
      this.logger.log("Accepted refer, but did not automatically follow it");
      this.sendNotify("SIP/2.0 200 OK");
      this.emit("referAccepted", this);
      if (this.referredSession) {
        this.referredSession.emit("referAccepted", this);
      }
    }
  }

  public sendNotify(body: string): void {
    if (this.status !== SessionStatus.STATUS_ANSWERED) {
      throw new Exceptions.InvalidStateError(this.status);
    }
    if (Grammar.parse(body, "sipfrag") === -1) {
      throw new Error("sipfrag body is required to send notify for refer");
    }

    const request: OutgoingRequest = new OutgoingRequest(
      C.NOTIFY,
      this.remoteTarget,
      this.ua,
      {
        cseq: this.cseq += 1,  // randomly generated then incremented on each additional notify
        callId: this.callId, // refer callId
        fromUri: this.fromUri,
        fromTag: this.fromTag,
        toUri: this.toUri,
        toTag: this.toTag,
        routeSet: this.routeSet
      },
      [
        "Event: refer",
        "Subscription-State: terminated",
        "Content-Type: message/sipfrag"
      ],
      body
    );

    new RequestSender({
      request,
      onRequestTimeout: () => {
        return;
      },
      onTransportError: () => {
        return;
      },
      receiveResponse: () => {
        return;
      }
    }, this.ua).send();
  }

  public on(
    name:
      "referAccepted" |
      "referInviteSent" |
      "referProgress" |
      "referRejected" |
      "referRequestAccepted" |
      "referRequestRejected",
    callback: (referServerContext: ReferServerContext) => void
  ): this;
  public on(name: string, callback: (...args: any[]) => void): this  { return super.on(name, callback); }
}
