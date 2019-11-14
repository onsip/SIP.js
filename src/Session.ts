import { EventEmitter } from "events";

import { ClientContext } from "./ClientContext";
import { C } from "./Constants";
import {
  AckableIncomingResponseWithSession,
  Body,
  Exception,
  fromBodyLegacy,
  getBody,
  Grammar,
  IncomingAckRequest,
  IncomingInviteRequest,
  IncomingPrackRequest,
  IncomingRequest,
  IncomingRequestMessage,
  IncomingResponse,
  IncomingResponseMessage,
  InviteServerTransaction,
  Logger,
  NameAddrHeader,
  NonInviteServerTransaction,
  OutgoingInviteRequest,
  OutgoingInviteRequestDelegate,
  OutgoingRequest,
  OutgoingRequestDelegate,
  OutgoingRequestMessage,
  OutgoingResponse,
  OutgoingResponseWithSession,
  PrackableIncomingResponseWithSession,
  RequestOptions,
  Session as SessionCore,
  SessionState,
  SignalingState,
  Timers,
  URI
} from "./core";
import { SessionStatus, TypeStrings } from "./Enums";
import { Exceptions } from "./Exceptions";
import {
  ReferClientContext,
  ReferServerContext
} from "./ReferContext";
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
import { DTMFValidator } from "./Session/DTMFValidator";
import { UA } from "./UA";
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
  public localHold: boolean;
  public sessionDescriptionHandler: SessionDescriptionHandler | undefined;
  public startTime: Date | undefined;
  public endTime: Date | undefined;

  public session: SessionCore | undefined;

  protected sessionDescriptionHandlerFactory: SessionDescriptionHandlerFactory;
  protected sessionDescriptionHandlerOptions: any;
  protected rel100: string;

  protected earlySdp: string | undefined; // FIXME: Needs review. Appears to be unused.
  protected hasOffer: boolean;
  protected hasAnswer: boolean;

  protected timers: {[name: string]: any};
  protected fromTag: string | undefined;

  protected errorListener!: ((...args: Array<any>) => void);

  protected renderbody: string | undefined;
  protected rendertype: string | undefined;
  protected modifiers: Array<SessionDescriptionHandlerModifier> | undefined;
  protected passedOptions: any;
  protected onInfo: ((request: IncomingRequestMessage) => void) | undefined;

  private tones: any;

  private pendingReinvite: boolean;
  private referContext: ReferClientContext | ReferServerContext | undefined;

  protected constructor(sessionDescriptionHandlerFactory: SessionDescriptionHandlerFactory) {
    super();
    this.type = TypeStrings.Session;
    if (!sessionDescriptionHandlerFactory) {
      throw new Exceptions.SessionDescriptionHandlerError(
        "A session description handler is required for the session to function"
      );
    }
    this.status = Session.C.STATUS_NULL;
    this.pendingReinvite = false;

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
  }

  public dtmf(tones: string | number, options: Session.DtmfOptions = {}): this {
    // Check Session Status
    if (this.status !== SessionStatus.STATUS_CONFIRMED && this.status !== SessionStatus.STATUS_WAITING_FOR_ACK) {
      throw new Exceptions.InvalidStateError(this.status);
    }

    // Check tones' validity
    DTMFValidator.validate(tones);

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

  /**
   * Sends in dialog request.
   * @param method Request method.
   * @param options Options bucket.
   */
  public sendRequest(method: string, options: any = {}): this {
    if (!this.session) {
      throw new Error("Session undefined.");
    }

    // Convert any "body" option to a Body.
    if (options.body) {
      options.body = Utils.fromBodyObj(options.body);
    }

    // Convert any "receiveResponse" callback option passed to an OutgoingRequestDelegate.
    let delegate: OutgoingRequestDelegate | undefined;
    const callback: ((message: IncomingResponseMessage) => void) | undefined = options.receiveResponse;
    if (callback) {
      delegate = {
        onAccept: (response: IncomingResponse): void => callback(response.message),
        onProgress: (response: IncomingResponse): void => callback(response.message),
        onRedirect: (response: IncomingResponse): void => callback(response.message),
        onReject: (response: IncomingResponse): void => callback(response.message),
        onTrying: (response: IncomingResponse): void => callback(response.message)
      };
    }

    let request: OutgoingRequest;
    const requestOptions: RequestOptions = options;

    switch (method) {
      case C.BYE:
        request = this.session.bye(delegate, requestOptions);
        break;
      case C.INVITE:
        request = this.session.invite(delegate, requestOptions);
        break;
      case C.REFER:
        request = this.session.refer(delegate, requestOptions);
        break;
      default:
        throw new Error(`Unexpected ${method}. Method not implemented by user agent core.`);
    }

    // Ported - Emit the request event
    this.emit(method.toLowerCase(), request.message);

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

    this.status = SessionStatus.STATUS_TERMINATED;
    if (this.ua.transport) {
      this.ua.transport.removeListener("transportError", this.errorListener);
    }

    delete this.ua.sessions[this.id];

    return this;
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

  public onDialogError(response: IncomingResponseMessage): void {
    if (this.status === SessionStatus.STATUS_CONFIRMED) {
      this.terminated(response, C.causes.DIALOG_ERROR);
    } else if (this.status !== SessionStatus.STATUS_TERMINATED) {
      this.failed(response, C.causes.DIALOG_ERROR);
      this.terminated(response, C.causes.DIALOG_ERROR);
    }
  }

  public on(
    event: "dtmf", listener: (request: IncomingRequestMessage | OutgoingRequestMessage, dtmf: DTMF) => void
  ): this;
  public on(
    event: "progress", listener: (response: IncomingResponseMessage | string, reasonPhrase?: any) => void
  ): this;
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

  protected onAck(incomingRequest: IncomingAckRequest): void {
    const confirmSession = () => {
      clearTimeout(this.timers.ackTimer);
      clearTimeout(this.timers.invite2xxTimer);
      this.status = SessionStatus.STATUS_CONFIRMED;

      const contentDisp: any = incomingRequest.message.getHeader("Content-Disposition");
      if (contentDisp && contentDisp.type === "render") {
        this.renderbody = incomingRequest.message.body;
        this.rendertype = incomingRequest.message.getHeader("Content-Type");
      }

      this.emit("confirmed", incomingRequest.message);
    };

    if (this.status === SessionStatus.STATUS_WAITING_FOR_ACK) {
      if (this.sessionDescriptionHandler &&
          this.sessionDescriptionHandler.hasDescription(incomingRequest.message.getHeader("Content-Type") || "")) {
        this.hasAnswer = true;
        this.sessionDescriptionHandler.setDescription(
          incomingRequest.message.body,
          this.sessionDescriptionHandlerOptions,
          this.modifiers
        ).catch((e: any) => {
          this.logger.warn(e);
          this.terminate({
            statusCode: "488",
            reasonPhrase: "Bad Media Description"
          });
          this.failed(incomingRequest.message, C.causes.BAD_MEDIA_DESCRIPTION);
          this.terminated(incomingRequest.message, C.causes.BAD_MEDIA_DESCRIPTION);
          throw e;
        }).then(() => confirmSession());
      } else {
        confirmSession();
      }
    }
  }

  protected receiveRequest(incomingRequest: IncomingRequest): void {
    switch (incomingRequest.message.method) { // TODO: This needs a default case
      case C.BYE:
        incomingRequest.accept();
        if (this.status === SessionStatus.STATUS_CONFIRMED) {
          this.emit("bye", incomingRequest.message);
          this.terminated(incomingRequest.message, C.BYE);
        }
        break;
      case C.INVITE:
        if (this.status === SessionStatus.STATUS_CONFIRMED) {
          this.logger.log("re-INVITE received");
          this.receiveReinvite(incomingRequest);
        }
        break;
      case C.INFO:
        if (this.status === SessionStatus.STATUS_CONFIRMED || this.status === SessionStatus.STATUS_WAITING_FOR_ACK) {
          if (this.onInfo) {
            return this.onInfo(incomingRequest.message);
          }

          const contentType: string | undefined = incomingRequest.message.getHeader("content-type");
          if (contentType) {
            if (contentType.match(/^application\/dtmf-relay/i)) {
              if (incomingRequest.message.body) {
                const body: Array<string> = incomingRequest.message.body.split("\r\n", 2);
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
                    new DTMF(this, tone, { duration }).init_incoming(incomingRequest);
                  }
                }
              }
            } else {
              incomingRequest.reject({
                statusCode: 415,
                extraHeaders: ["Accept: application/dtmf-relay"]
              });
            }
          }
        }
        break;
      case C.REFER:
        if (this.status === SessionStatus.STATUS_CONFIRMED) {
          this.logger.log("REFER received");
          this.referContext = new ReferServerContext(this.ua, incomingRequest, this.session);
          if (this.listeners("referRequested").length) {
            this.emit("referRequested", this.referContext);
          } else {
            this.logger.log("No referRequested listeners, automatically accepting and following the refer");
            const options: any = { followRefer: true };
            if (this.passedOptions) {
              options.inviteOptions = this.passedOptions;
            }
            this.referContext.accept(options, this.modifiers);
          }
        }
        break;
      case C.NOTIFY:
        if (
          this.referContext &&
          this.referContext.type === TypeStrings.ReferClientContext &&
          incomingRequest.message.hasHeader("event") &&
          /^refer(;.*)?$/.test(incomingRequest.message.getHeader("event") as string)
        ) {
          (this.referContext as ReferClientContext).receiveNotify(incomingRequest);
          return;
        }
        incomingRequest.accept();
        this.emit("notify", incomingRequest.message);
        break;
    }
  }

  // In dialog INVITE Reception
  protected receiveReinvite(incomingRequest: IncomingRequest): void {
    // TODO: Should probably check state of the session

    this.emit("reinvite", this, incomingRequest.message);

    if (incomingRequest.message.hasHeader("P-Asserted-Identity")) {
      this.assertedIdentity =
        Grammar.nameAddrHeaderParse(incomingRequest.message.getHeader("P-Asserted-Identity") as string);
    }

    let promise: Promise<BodyObj>;
    if (!this.sessionDescriptionHandler) {
      this.logger.warn("No SessionDescriptionHandler to reinvite");
      return;
    }
    if (
      incomingRequest.message.getHeader("Content-Length") === "0" &&
      !incomingRequest.message.getHeader("Content-Type")
    ) { // Invite w/o SDP
      promise = this.sessionDescriptionHandler.getDescription(
        this.sessionDescriptionHandlerOptions,
        this.modifiers
      );
    } else if (this.sessionDescriptionHandler.hasDescription(incomingRequest.message.getHeader("Content-Type") || "")) {
      // Invite w/ SDP
      promise = this.sessionDescriptionHandler.setDescription(
        incomingRequest.message.body,
        this.sessionDescriptionHandlerOptions,
        this.modifiers
        ).then(this.sessionDescriptionHandler.getDescription.bind(
            this.sessionDescriptionHandler,
            this.sessionDescriptionHandlerOptions,
            this.modifiers)
        );
    } else { // Bad Packet (should never get hit)
      incomingRequest.reject({ statusCode: 415 });
      this.emit("reinviteFailed", this);
      return;
    }

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
        incomingRequest.reject({ statusCode });
        this.emit("reinviteFailed", this);
        // TODO: This could be better
        throw e;
      }).then((description) => {
        const extraHeaders: Array<string> = ["Contact: " + this.contact];
        incomingRequest.accept({
          statusCode: 200,
          extraHeaders,
          body: Utils.fromBodyObj(description)
        });
        this.status = SessionStatus.STATUS_WAITING_FOR_ACK;
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
        if (!this.session) {
          throw new Error("Session undefined.");
        }

        const delegate: OutgoingInviteRequestDelegate = {
          onAccept: (response): void => {
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

            // FIXME: Why is this set here?
            this.status = SessionStatus.STATUS_CONFIRMED;

            // 17.1.1.1 - For each final response that is received at the client transaction,
            // the client transaction sends an ACK,
            this.emit("ack", response.ack());
            this.pendingReinvite = false;
            // TODO: All of these timers should move into the Transaction layer
            clearTimeout(this.timers.invite2xxTimer);
            if (
              !this.sessionDescriptionHandler ||
              !this.sessionDescriptionHandler.hasDescription(response.message.getHeader("Content-Type") || "")
            ) {
              this.logger.error("2XX response received to re-invite but did not have a description");
              this.emit("reinviteFailed", this);
              this.emit(
                "renegotiationError",
                new Exceptions.RenegotiationError("2XX response received to re-invite but did not have a description")
              );
              return;
            }
            this.sessionDescriptionHandler
              .setDescription(response.message.body, this.sessionDescriptionHandlerOptions, this.modifiers)
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
          },
          onProgress: (response): void => {
            return;
          },
          onRedirect: (response): void => {
            // FIXME: Does ACK need to be sent?
            this.pendingReinvite = false;
            this.logger.log("Received a non 1XX or 2XX response to a re-invite");
            this.emit("reinviteFailed", this);
            this.emit(
              "renegotiationError",
              new Exceptions.RenegotiationError("Invalid response to a re-invite")
            );
          },
          onReject: (response): void => {
            // FIXME: Does ACK need to be sent?
            this.pendingReinvite = false;
            this.logger.log("Received a non 1XX or 2XX response to a re-invite");
            this.emit("reinviteFailed", this);
            this.emit(
              "renegotiationError",
              new Exceptions.RenegotiationError("Invalid response to a re-invite")
            );
          },
          onTrying: (response): void => {
            return;
          }
        };

        const requestOptions: RequestOptions = {
          extraHeaders,
          body: Utils.fromBodyObj(description)
        };

        this.session.invite(delegate, requestOptions);

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

  protected failed(response: IncomingResponseMessage | IncomingRequestMessage | undefined, cause: string): this {
    if (this.status === SessionStatus.STATUS_TERMINATED) {
      return this;
    }
    this.emit("failed", response, cause);
    return this;
  }

  protected rejected(response: IncomingResponseMessage | IncomingRequestMessage, cause: string): this {
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

  protected accepted(response?: IncomingResponseMessage | string, cause?: string): this {
    if (!(response instanceof String)) {
      cause = Utils.getReasonPhrase((response && (response as IncomingResponseMessage).statusCode) || 0, cause);
    }

    this.startTime = new Date();

    if (this.replacee) {
      this.replacee.emit("replaced", this);
      this.replacee.terminate();
    }
    this.emit("accepted", response, cause);
    return this;
  }

  protected terminated(message?: IncomingResponseMessage | IncomingRequestMessage, cause?: string): this {
    if (this.status === SessionStatus.STATUS_TERMINATED) {
      return this;
    }

    this.endTime = new Date();

    this.close();
    this.emit("terminated", message, cause);
    return this;
  }

  protected connecting(request: IncomingRequestMessage): this {
    this.emit("connecting", { request });
    return this;
  }
}

export namespace InviteServerContext {
  export interface Options {  // TODO: This may be incorrect
      /** Array of extra headers added to the INVITE. */
      extraHeaders?: Array<string>;
      /** Options to pass to SessionDescriptionHandler's getDescription() and setDescription(). */
      sessionDescriptionHandlerOptions?: SessionDescriptionHandlerOptions;
      modifiers?: SessionDescriptionHandlerModifiers;
      onInfo?: ((request: IncomingRequestMessage) => void);
      statusCode?: number;
      reasonPhrase?: string;
      body?: any;
      rel100?: boolean;
  }
}

type ResolveFunction = () => void;
type RejectFunction = (reason: Error) => void;

// tslint:disable-next-line:max-classes-per-file
export class InviteServerContext extends Session implements ServerContext {
  public type: TypeStrings;
  public transaction!: InviteServerTransaction | NonInviteServerTransaction;
  public request!: IncomingRequestMessage;
  public incomingRequest!: IncomingInviteRequest;

  /**
   * FIXME: TODO:
   * Used to squelch throwing of errors due to async race condition.
   * We have an internal race between calling `accept()` and handling
   * an incoming CANCEL request. As there is no good way currently to
   * delegate the handling of this async errors to the caller of
   * `accept()`, we are squelching the throwing ALL errors when
   * they occur after receiving a CANCEL to catch the ONE we know
   * is a "normal" exceptional condition. While this is a completely
   * reasonable appraoch, the decision should be left up to the library user.
   */
  private _canceled: boolean;

  private rseq: number;

  private waitingForPrackPromise: Promise<void> | undefined;
  private waitingForPrackResolve: ResolveFunction | undefined;
  private waitingForPrackReject: RejectFunction | undefined;

  constructor(ua: UA, incomingInviteRequest: IncomingInviteRequest) {
    if (!ua.configuration.sessionDescriptionHandlerFactory) {
      ua.logger.warn("Can't build ISC without SDH Factory");
      throw new Error("ISC Constructor Failed");
    }
    super(ua.configuration.sessionDescriptionHandlerFactory);

    this._canceled = false;
    this.rseq = Math.floor(Math.random() * 10000);
    this.incomingRequest = incomingInviteRequest;

    const request = incomingInviteRequest.message;
    ServerContext.initializer(this, ua, incomingInviteRequest);
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

    // Set the toTag on the incoming request to the toTag which
    // will be used in the response to the incoming request!!!
    // FIXME: HACK: This is a hack to port an existing behavior.
    // The behavior being ported appears to be a hack itself,
    // so this is a hack to port a hack. At least one test spec
    // relies on it (which is yet another hack).
    this.request.toTag = (incomingInviteRequest as any).toTag;

    this.status = SessionStatus.STATUS_WAITING_FOR_ANSWER;

    // Set userNoAnswerTimer
    this.timers.userNoAnswerTimer = setTimeout(() => {
      incomingInviteRequest.reject({ statusCode: 408 });
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
          incomingInviteRequest.reject({ statusCode: 487 });
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

  /**
   * If true, a first provisional response after the 100 Trying
   * will be sent automatically. This is false it the UAC required
   * reliable provisional responses (100rel in Require header),
   * otherwise it is true. The provisional is sent by calling
   * `progress()` without any options.
   *
   * FIXME: TODO: It seems reasonable that the ISC user should
   * be able to optionally disable this behavior. As the provisional
   * is sent prior to the "invite" event being emitted, it's a known
   * issue that the ISC user cannot register listeners or do any other
   * setup prior to the call to `progress()`. As an example why this is
   * an issue, setting `ua.configuration.rel100` to REQUIRED will result
   * in an attempt by `progress()` to send a 183 with SDP produced by
   * calling `getDescription()` on a session description handler, but
   * the ISC user cannot perform any potentially required session description
   * handler initialization (thus preventing the utilization of setting
   * `ua.configuration.rel100` to REQUIRED). That begs the question of
   * why this behavior is disabled when the UAC requires 100rel but not
   * when the UAS requires 100rel? But ignoring that, it's just one example
   * of a class of cases where the ISC user needs to do something prior
   * to the first call to `progress()` and is unable to do so.
   */
  get autoSendAnInitialProvisionalResponse(): boolean {
    return this.rel100 === C.supported.REQUIRED ? false : true;
  }

  // type hack for servercontext interface
  public reply(options: any = {}): this {
    return this;
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

    const body = options.body ? fromBodyLegacy(options.body) : undefined;

    // FIXME: Need to redirect to someplae
    const response = statusCode < 400 ?
      this.incomingRequest.redirect([], { statusCode, reasonPhrase, extraHeaders, body }) :
      this.incomingRequest.reject({ statusCode, reasonPhrase, extraHeaders, body });

    (["rejected", "failed"]).forEach((event) => {
      this.emit(event, response.message, reasonPhrase);
    });

    return this.terminated();
  }

  /**
   * Accept the incoming INVITE request to start a Session.
   * Replies to the INVITE request with a 200 Ok response.
   * @param options Options bucket.
   */
  public accept(options: InviteServerContext.Options = {}): this {
    // FIXME: Need guard against calling more than once.
    this._accept(options)
      .then(({ message, session }) => {
        session.delegate = {
          onAck: (ackRequest): void => this.onAck(ackRequest),
          onAckTimeout: (): void => this.onAckTimeout(),
          onBye: (byeRequest): void => this.receiveRequest(byeRequest),
          onInfo: (infoRequest): void => this.receiveRequest(infoRequest),
          onInvite: (inviteRequest): void => this.receiveRequest(inviteRequest),
          onNotify: (notifyRequest): void => this.receiveRequest(notifyRequest),
          onPrack: (prackRequest): void => this.receiveRequest(prackRequest),
          onRefer: (referRequest): void => this.receiveRequest(referRequest)
        };
        this.session = session;
        this.status = SessionStatus.STATUS_WAITING_FOR_ACK;
        this.accepted(message, Utils.getReasonPhrase(200));
      })
      .catch((error) => {
        this.onContextError(error);
        // FIXME: Assuming error due to async race on CANCEL and eating error.
        if (!this._canceled) {
          throw error;
        }
      });
    return this;
  }

  /**
   * Report progress to the the caller.
   * Replies to the INVITE request with a 1xx provisional response.
   * @param options Options bucket.
   */
  public progress(options: InviteServerContext.Options = {}): this {
    // Ported
    const statusCode = options.statusCode || 180;
    if (statusCode < 100 || statusCode > 199) {
      throw new TypeError("Invalid statusCode: " + statusCode);
    }
    // Ported
    if (this.status === SessionStatus.STATUS_TERMINATED) {
      this.logger.warn("Unexpected call for progress while terminated, ignoring");
      return this;
    }
    // Added
    if (this.status === SessionStatus.STATUS_ANSWERED) {
      this.logger.warn("Unexpected call for progress while answered, ignoring");
      return this;
    }
    // Added
    if (this.status === SessionStatus.STATUS_ANSWERED_WAITING_FOR_PRACK) {
      this.logger.warn("Unexpected call for progress while answered (waiting for prack), ignoring");
      return this;
    }
    // After the first reliable provisional response for a request has been
    // acknowledged, the UAS MAY send additional reliable provisional
    // responses.  The UAS MUST NOT send a second reliable provisional
    // response until the first is acknowledged.  After the first, it is
    // RECOMMENDED that the UAS not send an additional reliable provisional
    // response until the previous is acknowledged.  The first reliable
    // provisional response receives special treatment because it conveys
    // the initial sequence number.  If additional reliable provisional
    // responses were sent before the first was acknowledged, the UAS could
    // not be certain these were received in order.
    // https://tools.ietf.org/html/rfc3262#section-3
    if (this.status ===  SessionStatus.STATUS_WAITING_FOR_PRACK) {
      this.logger.warn("Unexpected call for progress while waiting for prack, ignoring");
      return this;
    }

    // Ported
    if (options.statusCode === 100) {
      try {
        this.incomingRequest.trying();
      } catch (error) {
        this.onContextError(error);
        // FIXME: Assuming error due to async race on CANCEL and eating error.
        if (!this._canceled) {
          throw error;
        }
      }
      return this;
    }

    // Standard provisional response.
    if (
      !(this.rel100 === C.supported.REQUIRED) &&
      !(this.rel100 === C.supported.SUPPORTED && options.rel100) &&
      !(this.rel100 === C.supported.SUPPORTED && this.ua.configuration.rel100 === C.supported.REQUIRED)
    ) {
      this._progress(options)
        .catch((error) => {
          this.onContextError(error);
          // FIXME: Assuming error due to async race on CANCEL and eating error.
          if (!this._canceled) {
            throw error;
          }
        });
      return this;
    }

    // Reliable provisional response.
    this._reliableProgressWaitForPrack(options)
      .catch((error) => {
        this.onContextError(error);
        // FIXME: Assuming error due to async race on CANCEL and eating error.
        if (!this._canceled) {
          throw error;
        }
      });

    return this;
  }

  /**
   * Reject an unaccepted incoming INVITE request or send BYE if established session.
   * @param options Options bucket. FIXME: This options bucket needs to be typed.
   */
  public terminate(options: any = {}): this {
    // The caller's UA MAY send a BYE for either confirmed or early dialogs,
    // and the callee's UA MAY send a BYE on confirmed dialogs, but MUST NOT
    // send a BYE on early dialogs. However, the callee's UA MUST NOT send a
    // BYE on a confirmed dialog until it has received an ACK for its 2xx
    // response or until the server transaction times out.
    // https://tools.ietf.org/html/rfc3261#section-15

    // We don't yet have a dialog, so reject request.
    if (!this.session) {
      this.reject(options);
      return this;
    }

    switch (this.session.sessionState) {
      case SessionState.Initial:
        this.reject(options);
        return this;
      case SessionState.Early:
        this.reject(options);
        return this;
      case SessionState.AckWait:
        this.session.delegate = {
          // When ACK shows up, say BYE.
          onAck: (): void => {
            this.sendRequest(C.BYE, options);
          },
          // Or the server transaction times out before the ACK arrives.
          onAckTimeout: (): void => {
            this.sendRequest(C.BYE, options);
          }
        };
        // Ported
        this.emit("bye", this.request);
        this.terminated();
        return this;
      case SessionState.Confirmed:
        this.bye(options);
        return this;
      case SessionState.Terminated:
        return this;
      default:
        return this;
    }
  }

  public onCancel(message: IncomingRequestMessage): void {
        if (this.status === SessionStatus.STATUS_WAITING_FOR_ANSWER ||
          this.status === SessionStatus.STATUS_WAITING_FOR_PRACK ||
          this.status === SessionStatus.STATUS_ANSWERED_WAITING_FOR_PRACK ||
          this.status === SessionStatus.STATUS_EARLY_MEDIA ||
          this.status === SessionStatus.STATUS_ANSWERED) {
          this.status = SessionStatus.STATUS_CANCELED;
          this.incomingRequest.reject({ statusCode: 487 });
          this.canceled();
          this.rejected(message, C.causes.CANCELED);
          this.failed(message, C.causes.CANCELED);
          this.terminated(message, C.causes.CANCELED);
          }
        }

  protected receiveRequest(incomingRequest: IncomingRequest): void {
    switch (incomingRequest.message.method) {
      case C.PRACK:
        if (this.status === SessionStatus.STATUS_WAITING_FOR_PRACK ||
            this.status === SessionStatus.STATUS_ANSWERED_WAITING_FOR_PRACK) {
          if (!this.hasAnswer) {
            this.sessionDescriptionHandler = this.setupSessionDescriptionHandler();
            this.emit("SessionDescriptionHandler-created", this.sessionDescriptionHandler);
            if (
              this.sessionDescriptionHandler.hasDescription(incomingRequest.message.getHeader("Content-Type") || "")
            ) {
              this.hasAnswer = true;
              this.sessionDescriptionHandler.setDescription(
                incomingRequest.message.body,
                this.sessionDescriptionHandlerOptions,
                this.modifiers
              ).then(() => {
                clearTimeout(this.timers.rel1xxTimer);
                clearTimeout(this.timers.prackTimer);
                incomingRequest.accept();
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
                this.failed(incomingRequest.message, C.causes.BAD_MEDIA_DESCRIPTION);
                this.terminated(incomingRequest.message, C.causes.BAD_MEDIA_DESCRIPTION);
              });
            } else {
              this.terminate({
                statusCode: "488",
                reasonPhrase: "Bad Media Description"
              });
              this.failed(incomingRequest.message, C.causes.BAD_MEDIA_DESCRIPTION);
              this.terminated(incomingRequest.message, C.causes.BAD_MEDIA_DESCRIPTION);
            }
          } else {
            clearTimeout(this.timers.rel1xxTimer);
            clearTimeout(this.timers.prackTimer);
            incomingRequest.accept();

            if (this.status === SessionStatus.STATUS_ANSWERED_WAITING_FOR_PRACK) {
              this.status = SessionStatus.STATUS_EARLY_MEDIA;
              this.accept();
            }
            this.status = SessionStatus.STATUS_EARLY_MEDIA;
          }
        } else if (this.status === SessionStatus.STATUS_EARLY_MEDIA) {
          incomingRequest.accept();
        }
        break;
      default:
        super.receiveRequest(incomingRequest);
        break;
    }
  }

  // Internal Function to setup the handler consistently
  protected setupSessionDescriptionHandler(): SessionDescriptionHandler {
    if (this.sessionDescriptionHandler) {
      return this.sessionDescriptionHandler;
    }
    return this.sessionDescriptionHandlerFactory(this, this.ua.configuration.sessionDescriptionHandlerFactoryOptions);
  }

  protected generateResponseOfferAnswer(
    options: {
      sessionDescriptionHandlerOptions?: SessionDescriptionHandlerOptions,
      modifiers?: SessionDescriptionHandlerModifiers
    }
  ): Promise<Body | undefined> {
    if (!this.session) {
      const body = getBody(this.incomingRequest.message);
      if (!body || body.contentDisposition !== "session") {
        return this.getOffer(options);
      } else {
        return this.setOfferAndGetAnswer(body, options);
      }
    } else {

      switch (this.session.signalingState) {
        case SignalingState.Initial:
          return this.getOffer(options);
        case SignalingState.Stable:
          return Promise.resolve(undefined);
        case SignalingState.HaveLocalOffer:
          // o  Once the UAS has sent or received an answer to the initial
          // offer, it MUST NOT generate subsequent offers in any responses
          // to the initial INVITE.  This means that a UAS based on this
          // specification alone can never generate subsequent offers until
          // completion of the initial transaction.
          // https://tools.ietf.org/html/rfc3261#section-13.2.1
          return Promise.resolve(undefined);
        case SignalingState.HaveRemoteOffer:
          if (!this.session.offer) {
            throw new Error("Session offer undefined");
          }
          return this.setOfferAndGetAnswer(this.session.offer, options);
        case SignalingState.Closed:
          throw new Error(`Invalid signaling state ${this.session.signalingState}.`);
        default:
          throw new Error(`Invalid signaling state ${this.session.signalingState}.`);
      }
    }
  }

  protected handlePrackOfferAnswer(
    request: IncomingPrackRequest,
    options: {
      sessionDescriptionHandlerOptions?: SessionDescriptionHandlerOptions,
      modifiers?: SessionDescriptionHandlerModifiers
    }
  ): Promise<Body | undefined> {
    if (!this.session) {
      throw new Error("Session undefined.");
    }

    // If the PRACK doesn't have an offer/answer, nothing to be done.
    const body = getBody(request.message);
    if (!body || body.contentDisposition !== "session") {
      return Promise.resolve(undefined);
    }

    // If the UAC receives a reliable provisional response with an offer
    // (this would occur if the UAC sent an INVITE without an offer, in
    // which case the first reliable provisional response will contain the
    // offer), it MUST generate an answer in the PRACK.  If the UAC receives
    // a reliable provisional response with an answer, it MAY generate an
    // additional offer in the PRACK.  If the UAS receives a PRACK with an
    // offer, it MUST place the answer in the 2xx to the PRACK.
    // https://tools.ietf.org/html/rfc3262#section-5
    switch (this.session.signalingState) {
      case SignalingState.Initial:
        // State should never be reached as first reliable provisional response must have answer/offer.
        throw new Error(`Invalid signaling state ${this.session.signalingState}.`);
      case SignalingState.Stable:
        // Receved answer.
        return this.setAnswer(body, options).then(() => undefined);
      case SignalingState.HaveLocalOffer:
        // State should never be reached as local offer would be answered by this PRACK
        throw new Error(`Invalid signaling state ${this.session.signalingState}.`);
      case SignalingState.HaveRemoteOffer:
        // Receved offer, generate answer.
        return this.setOfferAndGetAnswer(body, options);
      case SignalingState.Closed:
        throw new Error(`Invalid signaling state ${this.session.signalingState}.`);
      default:
        throw new Error(`Invalid signaling state ${this.session.signalingState}.`);
    }
  }

  /**
   * Called when session canceled.
   */
  protected canceled(): this {
    this._canceled = true;
    return super.canceled();
  }

  /**
   * Called when session terminated.
   * Using it here just for the PRACK timeout.
   */
  protected terminated(message?: IncomingResponseMessage | IncomingRequestMessage, cause?: string): this {
    this.prackNeverArrived();
    return super.terminated(message, cause);
  }

  /**
   * A version of `accept` which resolves a session when the 200 Ok response is sent.
   * @param options Options bucket.
   * @throws {ClosedSessionDescriptionHandlerError} The session description handler closed before method completed.
   * @throws {TransactionStateError} The transaction state does not allow for `accept()` to be called.
   *                                 Note that the transaction state can change while this call is in progress.
   */
  private _accept(options: InviteServerContext.Options = {}): Promise<OutgoingResponseWithSession> {
    // FIXME: Ported - callback for in dialog INFO requests.
    // Turns out accept() can be called more than once if we are waiting
    // for a PRACK in which case "options" get completely tossed away.
    // So this is broken in that case (and potentially other uses of options).
    // Tempted to just try to fix it now, but leaving it broken for the moment.
    this.onInfo = options.onInfo;

    // The UAS MAY send a final response to the initial request before
    // having received PRACKs for all unacknowledged reliable provisional
    // responses, unless the final response is 2xx and any of the
    // unacknowledged reliable provisional responses contained a session
    // description.  In that case, it MUST NOT send a final response until
    // those provisional responses are acknowledged.  If the UAS does send a
    // final response when reliable responses are still unacknowledged, it
    // SHOULD NOT continue to retransmit the unacknowledged reliable
    // provisional responses, but it MUST be prepared to process PRACK
    // requests for those outstanding responses.  A UAS MUST NOT send new
    // reliable provisional responses (as opposed to retransmissions of
    // unacknowledged ones) after sending a final response to a request.
    // https://tools.ietf.org/html/rfc3262#section-3
    if (this.status === SessionStatus.STATUS_WAITING_FOR_PRACK) {
      this.status = SessionStatus.STATUS_ANSWERED_WAITING_FOR_PRACK;
      return this.waitForArrivalOfPrack()
        .then(() => {
          this.status = SessionStatus.STATUS_ANSWERED;
          clearTimeout(this.timers.userNoAnswerTimer); // Ported
        })
        .then(() => this.generateResponseOfferAnswer(options))
        .then((body) => this.incomingRequest.accept({ statusCode: 200, body }));
    }

    // Ported
    if (this.status === SessionStatus.STATUS_WAITING_FOR_ANSWER) {
      this.status = SessionStatus.STATUS_ANSWERED;
    } else {
      return Promise.reject(new Exceptions.InvalidStateError(this.status));
    }

    this.status = SessionStatus.STATUS_ANSWERED;
    clearTimeout(this.timers.userNoAnswerTimer); // Ported
    return this.generateResponseOfferAnswer(options)
      .then((body) => this.incomingRequest.accept({ statusCode: 200, body }));
  }

  /**
   * A version of `progress` which resolves when the provisional response is sent.
   * @param options Options bucket.
   * @throws {ClosedSessionDescriptionHandlerError} The session description handler closed before method completed.
   * @throws {TransactionStateError} The transaction state does not allow for `progress()` to be called.
   *                                 Note that the transaction state can change while this call is in progress.
   */
  private _progress(options: InviteServerContext.Options = {}): Promise<OutgoingResponseWithSession> {
    // Ported
    const statusCode = options.statusCode || 180;
    const reasonPhrase = options.reasonPhrase;
    const extraHeaders: Array<string> = (options.extraHeaders || []).slice();
    const body = options.body ? fromBodyLegacy(options.body) : undefined;

    // The 183 (Session Progress) response is used to convey information
    // about the progress of the call that is not otherwise classified.  The
    // Reason-Phrase, header fields, or message body MAY be used to convey
    // more details about the call progress.
    // https://tools.ietf.org/html/rfc3261#section-21.1.5

    // It is the de facto industry standard to utilize 183 with SDP to provide "early media".
    // While it is unlikely someone would want to send a 183 without SDP, so it should be an option.
    if (statusCode === 183 && !body) {
      return this._progressWithSDP(options);
    }

    try {
      const progressResponse = this.incomingRequest.progress({ statusCode, reasonPhrase, extraHeaders, body });
      this.emit("progress", progressResponse.message, reasonPhrase); // Ported
      this.session = progressResponse.session;
      return Promise.resolve(progressResponse);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * A version of `progress` which resolves when the provisional response with sdp is sent.
   * @param options Options bucket.
   * @throws {ClosedSessionDescriptionHandlerError} The session description handler closed before method completed.
   * @throws {TransactionStateError} The transaction state does not allow for `progress()` to be called.
   *                                 Note that the transaction state can change while this call is in progress.
   */
  private _progressWithSDP(options: InviteServerContext.Options = {}): Promise<OutgoingResponseWithSession> {
    const statusCode = options.statusCode || 183;
    const reasonPhrase = options.reasonPhrase;
    const extraHeaders: Array<string> = (options.extraHeaders || []).slice();

    // Get an offer/answer and send a reply.
    return this.generateResponseOfferAnswer(options)
      .then((body) => this.incomingRequest.progress({ statusCode, reasonPhrase, extraHeaders, body }))
      .then((progressResponse) => {
        this.emit("progress", progressResponse.message, reasonPhrase); // Ported
        this.session = progressResponse.session;
        return progressResponse;
      });
  }

  /**
   * A version of `progress` which resolves when the reliable provisional response is sent.
   * @param options Options bucket.
   * @throws {ClosedSessionDescriptionHandlerError} The session description handler closed before method completed.
   * @throws {TransactionStateError} The transaction state does not allow for `progress()` to be called.
   *                                 Note that the transaction state can change while this call is in progress.
   */
  private _reliableProgress(options: InviteServerContext.Options = {}): Promise<OutgoingResponseWithSession> {
    const statusCode = options.statusCode || 183;
    const reasonPhrase = options.reasonPhrase;
    const extraHeaders: Array<string> = (options.extraHeaders || []).slice();
    extraHeaders.push("Require: 100rel");
    extraHeaders.push("RSeq: " + Math.floor(Math.random() * 10000));

    // Get an offer/answer and send a reply.
    return this.generateResponseOfferAnswer(options)
      .then((body) => this.incomingRequest.progress({ statusCode, reasonPhrase, extraHeaders, body }))
      .then((progressResponse) => {
        this.emit("progress", progressResponse.message, reasonPhrase); // Ported
        this.session = progressResponse.session;
        return progressResponse;
      });
  }

  /**
   * A version of `progress` which resolves when the reliable provisional response is acknowledged.
   * @param options Options bucket.
   * @throws {ClosedSessionDescriptionHandlerError} The session description handler closed before method completed.
   * @throws {TransactionStateError} The transaction state does not allow for `progress()` to be called.
   *                                 Note that the transaction state can change while this call is in progress.
   */
  private _reliableProgressWaitForPrack(options: InviteServerContext.Options = {}): Promise<{
    prackRequest: IncomingPrackRequest,
    prackResponse: OutgoingResponse,
    progressResponse: OutgoingResponseWithSession,
  }> {
    const statusCode = options.statusCode || 183;
    const reasonPhrase = options.reasonPhrase;
    const extraHeaders: Array<string> = (options.extraHeaders || []).slice();
    extraHeaders.push("Require: 100rel");
    extraHeaders.push("RSeq: " + this.rseq++);
    let body: Body | undefined;

    // Ported - set status.
    this.status = SessionStatus.STATUS_WAITING_FOR_PRACK;

    return new Promise((resolve, reject) => {
      let waitingForPrack = true;
      return this.generateResponseOfferAnswer(options)
        .then((offerAnswer) => {
          body = offerAnswer;
          return this.incomingRequest.progress({ statusCode, reasonPhrase, extraHeaders, body });
        })
        .then((progressResponse) => {
          this.emit("progress", progressResponse.message, reasonPhrase); // Ported
          this.session = progressResponse.session;

          let prackRequest: IncomingPrackRequest;
          let prackResponse: OutgoingResponse;
          progressResponse.session.delegate = {
            onPrack: (request): void => {
              prackRequest = request;
              clearTimeout(prackWaitTimeoutTimer);
              clearTimeout(rel1xxRetransmissionTimer);
              if (!waitingForPrack) {
                return;
              }
              waitingForPrack = false;
              this.handlePrackOfferAnswer(prackRequest, options)
                .then((prackResponseBody) => {
                  try {
                    prackResponse = prackRequest.accept({ statusCode: 200, body: prackResponseBody });
                    // Ported - set status.
                    if (this.status === SessionStatus.STATUS_WAITING_FOR_PRACK) {
                      this.status = SessionStatus.STATUS_WAITING_FOR_ANSWER;
                    }
                    this.prackArrived();
                    resolve({ prackRequest, prackResponse, progressResponse });
                  } catch (error) {
                    reject(error);
                  }
                });
            }
          };

          // https://tools.ietf.org/html/rfc3262#section-3
          const prackWaitTimeout = () => {
            if (!waitingForPrack) {
              return;
            }
            waitingForPrack = false;
            this.logger.warn("No PRACK received, rejecting INVITE.");
            clearTimeout(rel1xxRetransmissionTimer);
            try {
              this.incomingRequest.reject({ statusCode: 504 });
              this.terminated(undefined, C.causes.NO_PRACK);
              reject(new Exceptions.TerminatedSessionError());
            } catch (error) {
              reject(error);
            }
          };
          const prackWaitTimeoutTimer = setTimeout(prackWaitTimeout, Timers.T1 * 64);

          // https://tools.ietf.org/html/rfc3262#section-3
          const rel1xxRetransmission = () => {
            try {
              this.incomingRequest.progress({ statusCode, reasonPhrase, extraHeaders, body });
            } catch (error) {
              waitingForPrack = false;
              reject(error);
              return;
            }
            rel1xxRetransmissionTimer = setTimeout(rel1xxRetransmission, timeout *= 2);
          };
          let timeout = Timers.T1;
          let rel1xxRetransmissionTimer = setTimeout(rel1xxRetransmission, timeout);
        });
    });
  }

  /**
   * Callback for when ACK for a 2xx response is never received.
   * @param session Session the ACK never arrived for
   */
  private onAckTimeout(): void {
    if (this.status === SessionStatus.STATUS_WAITING_FOR_ACK) {
      this.logger.log("no ACK received for an extended period of time, terminating the call");
      if (!this.session) {
        throw new Error("Session undefined.");
      }
      this.session.bye();
      this.terminated(undefined, C.causes.NO_ACK);
    }
  }

  /**
   * FIXME: TODO: The current library interface presents async methods without a
   * proper async error handling mechanism. Arguably a promise based interface
   * would be an improvement over the pattern of returning `this`. The approach has
   * been generally along the lines of log a error and terminate.
   */
  private onContextError(error: Error): void {
    let statusCode = 480;
    if (error instanceof Exception) { // There might be interest in catching these Exceptions.
      if (error instanceof Exceptions.SessionDescriptionHandlerError) {
        this.logger.error(error.message);
        if (error.error) {
          this.logger.error(error.error);
        }
      } else if (error instanceof Exceptions.TerminatedSessionError) {
        // PRACK never arrived, so we timed out waiting for it.
        this.logger.warn("Incoming session terminated while waiting for PRACK.");
      } else if (error instanceof Exceptions.UnsupportedSessionDescriptionContentTypeError) {
        statusCode = 415;
      } else if (error instanceof Exception) {
        this.logger.error(error.message);
      }
    } else if (error instanceof Error) { // Other Errors hould go uncaught.
      this.logger.error(error.message);
    } else {
      // We don't actually know what a session description handler implementation might throw
      // our way, so as a last resort, just assume we are getting an "any" and log it.
      this.logger.error("An error occurred in the session description handler.");
      this.logger.error(error as any);
    }
    try {
      this.incomingRequest.reject({ statusCode }); // "Temporarily Unavailable"
      this.failed(this.incomingRequest.message, error.message);
      this.terminated(this.incomingRequest.message, error.message);
    } catch (error) {
      return;
    }
  }

  private prackArrived(): void {
    if (this.waitingForPrackResolve) {
      this.waitingForPrackResolve();
    }
    this.waitingForPrackPromise = undefined;
    this.waitingForPrackResolve = undefined;
    this.waitingForPrackReject = undefined;
  }

  private prackNeverArrived(): void {
    if (this.waitingForPrackReject) {
      this.waitingForPrackReject(new Exceptions.TerminatedSessionError());
    }
    this.waitingForPrackPromise = undefined;
    this.waitingForPrackResolve = undefined;
    this.waitingForPrackReject = undefined;
  }

  /**
   * @throws {Exceptions.TerminatedSessionError} The session terminated before being accepted (i.e. cancel arrived).
   */
  private waitForArrivalOfPrack(): Promise<void> {
    if (this.waitingForPrackPromise) {
      throw new Error("Already waiting for PRACK");
    }
    this.waitingForPrackPromise = new Promise<void>((resolve, reject) => {
      this.waitingForPrackResolve = resolve;
      this.waitingForPrackReject = reject;
    });
    return this.waitingForPrackPromise;
  }

  private getOffer(options: {
    sessionDescriptionHandlerOptions?: SessionDescriptionHandlerOptions,
    modifiers?: SessionDescriptionHandlerModifiers
  }): Promise<Body> {
    this.hasOffer = true;
    const sdh = this.getSessionDescriptionHandler();
    return sdh
      .getDescription(options.sessionDescriptionHandlerOptions, options.modifiers)
      .then((bodyObj) => Utils.fromBodyObj(bodyObj));
  }

  private setAnswer(answer: Body, options: {
    sessionDescriptionHandlerOptions?: SessionDescriptionHandlerOptions,
    modifiers?: SessionDescriptionHandlerModifiers
  }): Promise<void> {
    this.hasAnswer = true;
    const sdh = this.getSessionDescriptionHandler();
    if (!sdh.hasDescription(answer.contentType)) {
      return Promise.reject(new Exceptions.UnsupportedSessionDescriptionContentTypeError());
    }
    return sdh
      .setDescription(answer.content, options.sessionDescriptionHandlerOptions, options.modifiers);
  }

  private setOfferAndGetAnswer(offer: Body, options: {
    sessionDescriptionHandlerOptions?: SessionDescriptionHandlerOptions,
    modifiers?: SessionDescriptionHandlerModifiers
  }): Promise<Body> {
    this.hasOffer = true;
    this.hasAnswer = true;
    const sdh = this.getSessionDescriptionHandler();
    if (!sdh.hasDescription(offer.contentType)) {
      return Promise.reject(new Exceptions.UnsupportedSessionDescriptionContentTypeError());
    }
    return sdh
      .setDescription(offer.content, options.sessionDescriptionHandlerOptions, options.modifiers)
      .then(() => sdh.getDescription(options.sessionDescriptionHandlerOptions, options.modifiers))
      .then((bodyObj) => Utils.fromBodyObj(bodyObj));
  }

  private getSessionDescriptionHandler(): SessionDescriptionHandler {
    // Create our session description handler if not already done so...
    const sdh = this.sessionDescriptionHandler = this.setupSessionDescriptionHandler();
    // FIXME: Ported - this can get emitted multiple times even when only created once... don't we care?
    this.emit("SessionDescriptionHandler-created", this.sessionDescriptionHandler);
    // Return.
    return sdh;
  }
}

export namespace InviteClientContext {
  export interface Options {
    /** Anonymous call if true. */
    anonymous?: boolean;
    /** Deprecated. */
    body?: string;
    /** Deprecated. */
    contentType?: string;
    /** Array of extra headers added to the INVITE. */
    extraHeaders?: Array<string>;
    /** If true, send INVITE without SDP. */
    inviteWithoutSdp?: boolean;
    /** Deprecated. */
    onInfo?: any;
    /** Deprecated. */
    params?: {
      fromDisplayName?: string;
      fromTag?: string;
      fromUri?: string | URI;
      toDisplayName?: string;
      toUri?: string | URI;
    };
    /** Deprecated. */
    renderbody?: string;
    /** Deprecated. */
    rendertype?: string;
    /** Options to pass to SessionDescriptionHandler's getDescription() and setDescription(). */
    sessionDescriptionHandlerOptions?: SessionDescriptionHandlerOptions;
  }
}

// tslint:disable-next-line:max-classes-per-file
export class InviteClientContext extends Session implements ClientContext {
  public type: TypeStrings;
  public request!: OutgoingRequestMessage;

  protected anonymous: boolean;
  protected inviteWithoutSdp: boolean;
  protected isCanceled: boolean;
  protected received100: boolean;

  private earlyMediaSessionDescriptionHandlers: Map<string, SessionDescriptionHandler>;
  private outgoingInviteRequest: OutgoingInviteRequest | undefined;

  constructor(
    ua: UA,
    target: string | URI,
    options: InviteClientContext.Options = {},
    modifiers: SessionDescriptionHandlerModifiers = []
  ) {
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
      options.params.fromDisplayName = "Anonymous";
      options.params.fromUri = "sip:anonymous@anonymous.invalid";

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

    this.earlyMediaSessionDescriptionHandlers = new Map<string, SessionDescriptionHandler>();

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

  public receiveResponse(response: IncomingResponseMessage): void {
    throw new Error("Unimplemented.");
  }

  // hack for getting around ClientContext interface
  public send(): this {
    this.sendInvite();
    return this;
  }

  public invite(): this {
    // Save the session into the ua sessions collection.
    // Note: placing in constructor breaks call to request.cancel on close... User does not need this anyway
    this.ua.sessions[this.id] = this;

    // This should allow the function to return so that listeners can be set up for these events
    Promise.resolve().then(() => {
      // FIXME: There is a race condition where cancel (or terminate) can be called synchronously after invite.
      if (this.isCanceled || this.status === SessionStatus.STATUS_TERMINATED) {
        return;
      }
      if (this.inviteWithoutSdp) {
        // just send an invite with no sdp...
        if (this.renderbody && this.rendertype) {
          this.request.body = {
            body: this.renderbody,
            contentType: this.rendertype
          };
        }
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
        .then((description) => {
          // FIXME: There is a race condition where cancel (or terminate) can be called (a)synchronously after invite.
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

  public cancel(options: any = {}): this {
    // Check Session Status
    if (this.status === SessionStatus.STATUS_TERMINATED || this.status === SessionStatus.STATUS_CONFIRMED) {
      throw new Exceptions.InvalidStateError(this.status);
    }
    if (this.isCanceled) {
      throw new Exceptions.InvalidStateError(SessionStatus.STATUS_CANCELED);
    }
    this.isCanceled = true;

    this.logger.log("Canceling session");

    const cancelReason: string | undefined = Utils.getCancelReason(options.statusCode, options.reasonPhrase);

    options.extraHeaders = (options.extraHeaders || []).slice();

    if (this.outgoingInviteRequest) {
      this.logger.warn("Canceling session before it was created");
      this.outgoingInviteRequest.cancel(cancelReason, options);
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

  /**
   * 13.2.1 Creating the Initial INVITE
   *
   * Since the initial INVITE represents a request outside of a dialog,
   * its construction follows the procedures of Section 8.1.1.  Additional
   * processing is required for the specific case of INVITE.
   *
   * An Allow header field (Section 20.5) SHOULD be present in the INVITE.
   * It indicates what methods can be invoked within a dialog, on the UA
   * sending the INVITE, for the duration of the dialog.  For example, a
   * UA capable of receiving INFO requests within a dialog [34] SHOULD
   * include an Allow header field listing the INFO method.
   *
   * A Supported header field (Section 20.37) SHOULD be present in the
   * INVITE.  It enumerates all the extensions understood by the UAC.
   *
   * An Accept (Section 20.1) header field MAY be present in the INVITE.
   * It indicates which Content-Types are acceptable to the UA, in both
   * the response received by it, and in any subsequent requests sent to
   * it within dialogs established by the INVITE.  The Accept header field
   * is especially useful for indicating support of various session
   * description formats.
   *
   * The UAC MAY add an Expires header field (Section 20.19) to limit the
   * validity of the invitation.  If the time indicated in the Expires
   * header field is reached and no final answer for the INVITE has been
   * received, the UAC core SHOULD generate a CANCEL request for the
   * INVITE, as per Section 9.
   *
   * A UAC MAY also find it useful to add, among others, Subject (Section
   * 20.36), Organization (Section 20.25) and User-Agent (Section 20.41)
   * header fields.  They all contain information related to the INVITE.
   *
   * The UAC MAY choose to add a message body to the INVITE.  Section
   * 8.1.1.10 deals with how to construct the header fields -- Content-
   * Type among others -- needed to describe the message body.
   *
   * https://tools.ietf.org/html/rfc3261#section-13.2.1
   */
  private sendInvite(): void {
    //    There are special rules for message bodies that contain a session
    //    description - their corresponding Content-Disposition is "session".
    //    SIP uses an offer/answer model where one UA sends a session
    //    description, called the offer, which contains a proposed description
    //    of the session.  The offer indicates the desired communications means
    //    (audio, video, games), parameters of those means (such as codec
    //    types) and addresses for receiving media from the answerer.  The
    //    other UA responds with another session description, called the
    //    answer, which indicates which communications means are accepted, the
    //    parameters that apply to those means, and addresses for receiving
    //    media from the offerer. An offer/answer exchange is within the
    //    context of a dialog, so that if a SIP INVITE results in multiple
    //    dialogs, each is a separate offer/answer exchange.  The offer/answer
    //    model defines restrictions on when offers and answers can be made
    //    (for example, you cannot make a new offer while one is in progress).
    //    This results in restrictions on where the offers and answers can
    //    appear in SIP messages.  In this specification, offers and answers
    //    can only appear in INVITE requests and responses, and ACK.  The usage
    //    of offers and answers is further restricted.  For the initial INVITE
    //    transaction, the rules are:
    //
    //       o  The initial offer MUST be in either an INVITE or, if not there,
    //          in the first reliable non-failure message from the UAS back to
    //          the UAC.  In this specification, that is the final 2xx
    //          response.
    //
    //       o  If the initial offer is in an INVITE, the answer MUST be in a
    //          reliable non-failure message from UAS back to UAC which is
    //          correlated to that INVITE.  For this specification, that is
    //          only the final 2xx response to that INVITE.  That same exact
    //          answer MAY also be placed in any provisional responses sent
    //          prior to the answer.  The UAC MUST treat the first session
    //          description it receives as the answer, and MUST ignore any
    //          session descriptions in subsequent responses to the initial
    //          INVITE.
    //
    //       o  If the initial offer is in the first reliable non-failure
    //          message from the UAS back to UAC, the answer MUST be in the
    //          acknowledgement for that message (in this specification, ACK
    //          for a 2xx response).
    //
    //       o  After having sent or received an answer to the first offer, the
    //          UAC MAY generate subsequent offers in requests based on rules
    //          specified for that method, but only if it has received answers
    //          to any previous offers, and has not sent any offers to which it
    //          hasn't gotten an answer.
    //
    //       o  Once the UAS has sent or received an answer to the initial
    //          offer, it MUST NOT generate subsequent offers in any responses
    //          to the initial INVITE.  This means that a UAS based on this
    //          specification alone can never generate subsequent offers until
    //          completion of the initial transaction.
    //
    // https://tools.ietf.org/html/rfc3261#section-13.2.1

    // 5 The Offer/Answer Model and PRACK
    //
    //    RFC 3261 describes guidelines for the sets of messages in which
    //    offers and answers [3] can appear.  Based on those guidelines, this
    //    extension provides additional opportunities for offer/answer
    //    exchanges.

    //    If the INVITE contained an offer, the UAS MAY generate an answer in a
    //    reliable provisional response (assuming these are supported by the
    //    UAC).  That results in the establishment of the session before
    //    completion of the call.  Similarly, if a reliable provisional
    //    response is the first reliable message sent back to the UAC, and the
    //    INVITE did not contain an offer, one MUST appear in that reliable
    //    provisional response.

    //    If the UAC receives a reliable provisional response with an offer
    //    (this would occur if the UAC sent an INVITE without an offer, in
    //    which case the first reliable provisional response will contain the
    //    offer), it MUST generate an answer in the PRACK.  If the UAC receives
    //    a reliable provisional response with an answer, it MAY generate an
    //    additional offer in the PRACK.  If the UAS receives a PRACK with an
    //    offer, it MUST place the answer in the 2xx to the PRACK.

    //    Once an answer has been sent or received, the UA SHOULD establish the
    //    session based on the parameters of the offer and answer, even if the
    //    original INVITE itself has not been responded to.

    //    If the UAS had placed a session description in any reliable
    //    provisional response that is unacknowledged when the INVITE is
    //    accepted, the UAS MUST delay sending the 2xx until the provisional
    //    response is acknowledged.  Otherwise, the reliability of the 1xx
    //    cannot be guaranteed, and reliability is needed for proper operation
    //    of the offer/answer exchange.

    //    All user agents that support this extension MUST support all
    //    offer/answer exchanges that are possible based on the rules in
    //    Section 13.2 of RFC 3261, based on the existence of INVITE and PRACK
    //    as requests, and 2xx and reliable 1xx as non-failure reliable
    //    responses.
    //
    // https://tools.ietf.org/html/rfc3262#section-5

    ////
    // The Offer/Answer Model Implementation
    //
    // The offer/answer model is straight forward, but one MUST READ the specifications...
    //
    // 13.2.1 Creating the Initial INVITE (paragraph 8 in particular)
    // https://tools.ietf.org/html/rfc3261#section-13.2.1
    //
    // 5 The Offer/Answer Model and PRACK
    // https://tools.ietf.org/html/rfc3262#section-5
    //
    // Session Initiation Protocol (SIP) Usage of the Offer/Answer Model
    // https://tools.ietf.org/html/rfc6337
    //
    // *** IMPORTANT IMPLEMENTATION CHOICES ***
    //
    // TLDR...
    //
    //  1) Only one offer/answer exchange permitted during initial INVITE.
    //  2) No "early media" if the initial offer is in an INVITE.
    //
    //
    // 1) Initial Offer/Answer Restriction.
    //
    // Our implementation replaces the following bullet point...
    //
    // o  After having sent or received an answer to the first offer, the
    //    UAC MAY generate subsequent offers in requests based on rules
    //    specified for that method, but only if it has received answers
    //    to any previous offers, and has not sent any offers to which it
    //    hasn't gotten an answer.
    // https://tools.ietf.org/html/rfc3261#section-13.2.1
    //
    // ...with...
    //
    // o  After having sent or received an answer to the first offer, the
    //    UAC MUST NOT generate subsequent offers in requests based on rules
    //    specified for that method.
    //
    // ...which in combination with this bullet point...
    //
    // o  Once the UAS has sent or received an answer to the initial
    //    offer, it MUST NOT generate subsequent offers in any responses
    //    to the initial INVITE.  This means that a UAS based on this
    //    specification alone can never generate subsequent offers until
    //    completion of the initial transaction.
    // https://tools.ietf.org/html/rfc3261#section-13.2.1
    //
    // ...ensures that EXACTLY ONE offer/answer exchange will occur
    // during an initial out of dialog INVITE request made by our UAC.
    //
    //
    // 2) Early Media Restriction.
    //
    // While our implementation adheres to the following bullet point...
    //
    // o  If the initial offer is in an INVITE, the answer MUST be in a
    //    reliable non-failure message from UAS back to UAC which is
    //    correlated to that INVITE.  For this specification, that is
    //    only the final 2xx response to that INVITE.  That same exact
    //    answer MAY also be placed in any provisional responses sent
    //    prior to the answer.  The UAC MUST treat the first session
    //    description it receives as the answer, and MUST ignore any
    //    session descriptions in subsequent responses to the initial
    //    INVITE.
    // https://tools.ietf.org/html/rfc3261#section-13.2.1
    //
    // We have made the following implementation decision with regard to early media...
    //
    // o  If the initial offer is in the INVITE, the answer from the
    //    UAS back to the UAC will establish a media session only
    //    only after the final 2xx response to that INVITE is received.
    //
    // The reason for this decision is rooted in a restriction currently
    // inherent in WebRTC. Specifically, while a SIP INVITE request with an
    // initial offer may fork resulting in more than one provisional answer,
    // there is currently no easy/good way to to "fork" an offer generated
    // by a peer connection. In particular, a WebRTC offer currently may only
    // be matched with one answer and we have no good way to know which
    // "provisional answer" is going to be the "final answer". So we have
    // decided to punt and not create any "early media" sessions in this case.
    //
    // The upshot is that if you want "early media", you must not put the
    // initial offer in the INVITE. Instead, force the UAS to provide the
    // initial offer by sending an INVITE without an offer. In the WebRTC
    // case this allows us to create a unique peer connection with a unique
    // answer for every provisional offer with "early media" on all of them.
    ////

    ////
    // ROADMAP: The Offer/Answer Model Implementation
    //
    // The "no early media if offer in INVITE" implementation is not a
    // welcome one. The masses want it. The want it and they want it
    // to work for WebRTC (so they want to have their cake and eat too).
    //
    // So while we currently cannot make the offer in INVITE+forking+webrtc
    // case work, we decided to do the following...
    //
    // 1) modify SDH Factory to provide an initial offer without giving us the SDH, and then...
    // 2) stick that offer in the initial INVITE, and when 183 with initial answer is received...
    // 3) ask SDH Factory if it supports "earlyRemoteAnswer"
    //   a) if true, ask SDH Factory to createSDH(localOffer).then((sdh) => sdh.setDescription(remoteAnswer)
    //   b) if false, defer getting a SDH until 2xx response is received
    //
    // Our supplied WebRTC SDH will default to behavior 3b which works in forking environment (without)
    // early media if initial offer is in the INVITE). We will, however, provide an "inviteWillNotFork"
    // option which if set to "true" will have our supplied WebRTC SDH behave in the 3a manner.
    // That will result in
    //  - early media working with initial offer in the INVITE, and...
    //  - if the INVITE forks, the session terminating with an ERROR that reads like
    //    "You set 'inviteWillNotFork' to true but the INVITE forked. You can't eat your cake, and have it too."
    //  - furthermore, we accept that users will report that error to us as "bug" regardless
    //
    // So, SDH Factory is going to end up with a new interface along the lines of...
    //
    // interface SessionDescriptionHandlerFactory {
    //   makeLocalOffer(): Promise<ContentTypeAndBody>;
    //   makeSessionDescriptionHandler(
    //     initialOffer: ContentTypeAndBody, offerType: "local" | "remote"
    //   ): Promise<SessionDescriptionHandler>;
    //   supportsEarlyRemoteAnswer: boolean;
    //   supportsContentType(contentType: string): boolean;
    //   getDescription(description: ContentTypeAndBody): Promise<ContentTypeAndBody>
    //   setDescription(description: ContentTypeAndBody): Promise<void>
    // }
    //
    // We should be able to get rid of all the hasOffer/hasAnswer tracking code and otherwise code
    // it up to the same interaction with the SDH Factory and SDH regardless of signaling scenario.
    ////

    // Send the INVITE request.
    this.outgoingInviteRequest = this.ua.userAgentCore.invite(this.request, {
      onAccept: (inviteResponse): void => this.onAccept(inviteResponse),
      onProgress: (inviteResponse): void => this.onProgress(inviteResponse),
      onRedirect: (inviteResponse): void => this.onRedirect(inviteResponse),
      onReject: (inviteResponse): void => this.onReject(inviteResponse),
      onTrying: (inviteResponse): void => this.onTrying(inviteResponse)
    });
  }

  private ackAndBye(
    inviteResponse: AckableIncomingResponseWithSession,
    session: SessionCore,
    statusCode?: number,
    reasonPhrase?: string
  ): void {
    if (!this.ua.userAgentCore) {
      throw new Error("Method requires user agent core.");
    }

    const extraHeaders: Array<string> = [];
    if (statusCode) {
      extraHeaders.push("Reason: " + Utils.getReasonHeaderValue(statusCode, reasonPhrase));
    }
    const outgoingAckRequest = inviteResponse.ack();
    this.emit("ack", outgoingAckRequest.message);
    const outgoingByeRequest = session.bye(undefined, { extraHeaders });
    this.emit("bye", outgoingByeRequest.message);
  }

  private disposeEarlyMedia(): void {
    if (!this.earlyMediaSessionDescriptionHandlers) {
      throw new Error("Early media session description handlers undefined.");
    }
    this.earlyMediaSessionDescriptionHandlers.forEach((sessionDescriptionHandler) => {
      sessionDescriptionHandler.close();
    });
  }

  /**
   * Handle final response to initial INVITE.
   * @param inviteResponse 2xx response.
   */
  private onAccept(inviteResponse: AckableIncomingResponseWithSession): void {
    if (!this.earlyMediaSessionDescriptionHandlers) {
      throw new Error("Early media session description handlers undefined.");
    }

    const response = inviteResponse.message;
    const session = inviteResponse.session;

    // Our transaction layer is "non-standard" in that it will only
    // pass us a 2xx response once per branch, so there is no need to
    // worry about dealing with 2xx retransmissions. However, we can
    // and do still get 2xx responses for multiple branches (when an
    // INVITE is forked) which may create multiple confirmed dialogs.
    // Herein we are acking and sending a bye to any confirmed dialogs
    // which arrive beyond the first one. This is the desired behavior
    // for most applications (but certainly not all).

    // If we already received a confirmed dialog, ack & bye this session.
    if (this.session) {
      this.ackAndBye(inviteResponse, session);
      return;
    }

    // If the user requested cancellation, ack & bye this session.
    if (this.isCanceled) {
      this.ackAndBye(inviteResponse, session);
      this.emit("bye", this.request); // FIXME: Ported this odd second "bye" emit
      return;
    }

    // Ported behavior.
    if (response.hasHeader("P-Asserted-Identity")) {
      this.assertedIdentity = Grammar.nameAddrHeaderParse(response.getHeader("P-Asserted-Identity") as string);
    }

    // We have a confirmed dialog.
    this.session = session;
    this.session.delegate = {
      onAck: (ackRequest): void => this.onAck(ackRequest),
      onBye: (byeRequest): void => this.receiveRequest(byeRequest),
      onInfo: (infoRequest): void => this.receiveRequest(infoRequest),
      onInvite: (inviteRequest): void => this.receiveRequest(inviteRequest),
      onNotify: (notifyRequest): void => this.receiveRequest(notifyRequest),
      onPrack: (prackRequest): void => this.receiveRequest(prackRequest),
      onRefer: (referRequest): void => this.receiveRequest(referRequest)
    };

    switch (session.signalingState) {
      case SignalingState.Initial:
        // INVITE without Offer, so MUST have Offer at this point, so invalid state.
        this.ackAndBye(inviteResponse, session, 400, "Missing session description");
        this.failed(response, C.causes.BAD_MEDIA_DESCRIPTION);
        break;
      case SignalingState.HaveLocalOffer:
        // INVITE with Offer, so MUST have Answer at this point, so invalid state.
        this.ackAndBye(inviteResponse, session, 400, "Missing session description");
        this.failed(response, C.causes.BAD_MEDIA_DESCRIPTION);
        break;
      case SignalingState.HaveRemoteOffer:
        // INVITE without Offer, received offer in 2xx, so MUST send Answer in ACK.
        const sdh = this.sessionDescriptionHandlerFactory(
          this,
          this.ua.configuration.sessionDescriptionHandlerFactoryOptions || {}
        );
        this.sessionDescriptionHandler = sdh;
        this.emit("SessionDescriptionHandler-created", this.sessionDescriptionHandler);
        if (!sdh.hasDescription(response.getHeader("Content-Type") || "")) {
          this.ackAndBye(inviteResponse, session, 400, "Missing session description");
          this.failed(response, C.causes.BAD_MEDIA_DESCRIPTION);
          break;
        }
        this.hasOffer = true;
        sdh
          .setDescription(response.body, this.sessionDescriptionHandlerOptions, this.modifiers)
          .then(() => sdh.getDescription(this.sessionDescriptionHandlerOptions, this.modifiers))
          .then((description: BodyObj) => {
            if (this.isCanceled || this.status === SessionStatus.STATUS_TERMINATED) {
              return;
            }
            this.status = SessionStatus.STATUS_CONFIRMED;
            this.hasAnswer = true;
            const body: Body = {
              contentDisposition: "session", contentType: description.contentType, content: description.body
            };
            const ackRequest = inviteResponse.ack({ body });
            this.emit("ack", ackRequest.message);
            this.accepted(response);
          })
          .catch((e: any) => {
            if (e.type === TypeStrings.SessionDescriptionHandlerError) {
              this.logger.warn("invalid description");
              this.logger.warn(e.toString());
              // TODO: This message is inconsistent
              this.ackAndBye(inviteResponse, session, 488, "Invalid session description");
              this.failed(response, C.causes.BAD_MEDIA_DESCRIPTION);
            } else {
              throw e;
            }
          });
        break;
      case SignalingState.Stable:
        // This session has completed an initial offer/answer exchange...
        let options: RequestOptions | undefined;
        if (this.renderbody && this.rendertype) {
          options = { body: { contentDisposition: "render", contentType: this.rendertype, content: this.renderbody } };
        }
        // If INVITE with Offer and we have been waiting till now to apply the answer.
        if (this.hasOffer && !this.hasAnswer) {
          if (!this.sessionDescriptionHandler) {
            throw new Error("Session description handler undefined.");
          }
          const answer = session.answer;
          if (!answer) {
            throw new Error("Answer is undefined.");
          }
          this.sessionDescriptionHandler
            .setDescription(answer.content, this.sessionDescriptionHandlerOptions, this.modifiers)
            .then(() => {
              this.hasAnswer = true;
              this.status = SessionStatus.STATUS_CONFIRMED;
              const ackRequest = inviteResponse.ack(options);
              this.emit("ack", ackRequest.message);
              this.accepted(response);
            })
            .catch((error) => {
              this.logger.error(error);
              this.ackAndBye(inviteResponse, session, 488, "Not Acceptable Here");
              this.failed(response, C.causes.BAD_MEDIA_DESCRIPTION);
              // FIME: DON'T EAT UNHANDLED ERRORS!
            });
        } else {
          // Otherwise INVITE with or without Offer and we have already completed the initial exchange.
          this.sessionDescriptionHandler = this.earlyMediaSessionDescriptionHandlers.get(session.id);
          if (!this.sessionDescriptionHandler) {
            throw new Error("Session description handler undefined.");
          }
          this.earlyMediaSessionDescriptionHandlers.delete(session.id);
          this.hasOffer = true;
          this.hasAnswer = true;
          this.status = SessionStatus.STATUS_CONFIRMED;
          const ackRequest = inviteResponse.ack();
          this.emit("ack", ackRequest.message);
          this.accepted(response);
        }
        break;
      case SignalingState.Closed:
        // Dialog has terminated.
        break;
      default:
        throw new Error("Unknown session signaling state.");
    }

    this.disposeEarlyMedia();
  }

  /**
   * Handle provisional response to initial INVITE.
   * @param inviteResponse 1xx response.
   */
  private onProgress(inviteResponse: PrackableIncomingResponseWithSession): void {
    // Ported - User requested cancellation.
    if (this.isCanceled) {
      return;
    }

    if (!this.outgoingInviteRequest) {
      throw new Error("Outgoing INVITE request undefined.");
    }
    if (!this.earlyMediaSessionDescriptionHandlers) {
      throw new Error("Early media session description handlers undefined.");
    }

    const response = inviteResponse.message;
    const session = inviteResponse.session;

    // Ported - Set status.
    this.status = SessionStatus.STATUS_1XX_RECEIVED;

    // Ported - Set assertedIdentity.
    if (response.hasHeader("P-Asserted-Identity")) {
      this.assertedIdentity = Grammar.nameAddrHeaderParse(response.getHeader("P-Asserted-Identity") as string);
    }

    // The provisional response MUST establish a dialog if one is not yet created.
    // https://tools.ietf.org/html/rfc3262#section-4
    if (!session) {
      // A response with a to tag MUST create a session (should never get here).
      throw new Error("Session undefined.");
    }

    // If a provisional response is received for an initial request, and
    // that response contains a Require header field containing the option
    // tag 100rel, the response is to be sent reliably.  If the response is
    // a 100 (Trying) (as opposed to 101 to 199), this option tag MUST be
    // ignored, and the procedures below MUST NOT be used.
    // https://tools.ietf.org/html/rfc3262#section-4
    const requireHeader = response.getHeader("require");
    const rseqHeader = response.getHeader("rseq");
    const rseq = requireHeader && requireHeader.includes("100rel") && rseqHeader ? Number(rseqHeader) : undefined;
    const responseReliable = !!rseq;

    const extraHeaders: Array<string> = [];
    if (responseReliable) {
      extraHeaders.push("RAck: " + response.getHeader("rseq") + " " + response.getHeader("cseq"));
    }

    // INVITE without Offer and session still has no offer (and no answer).
    if (session.signalingState === SignalingState.Initial) {
      // Similarly, if a reliable provisional
      // response is the first reliable message sent back to the UAC, and the
      // INVITE did not contain an offer, one MUST appear in that reliable
      // provisional response.
      // https://tools.ietf.org/html/rfc3262#section-5
      if (responseReliable) {
        this.logger.warn(
          "First reliable provisional response received MUST contain an offer when INVITE does not contain an offer."
        );
        // FIXME: Known popular UA's currently end up here...
        inviteResponse.prack({ extraHeaders });
      }
      this.emit("progress", response);
      return;
    }

    // INVITE with Offer and session only has that initial local offer.
    if (session.signalingState === SignalingState.HaveLocalOffer) {
      if (responseReliable) {
        inviteResponse.prack({ extraHeaders });
      }
      this.emit("progress", response);
      return;
    }

    // INVITE without Offer and received initial offer in provisional response
    if (session.signalingState === SignalingState.HaveRemoteOffer) {
      // The initial offer MUST be in either an INVITE or, if not there,
      // in the first reliable non-failure message from the UAS back to
      // the UAC.
      // https://tools.ietf.org/html/rfc3261#section-13.2.1

      // According to Section 13.2.1 of [RFC3261], 'The first reliable
      // non-failure message' must have an offer if there is no offer in the
      // INVITE request.  This means that the User Agent (UA) that receives
      // the INVITE request without an offer must include an offer in the
      // first reliable response with 100rel extension.  If no reliable
      // provisional response has been sent, the User Agent Server (UAS) must
      // include an offer when sending 2xx response.
      // https://tools.ietf.org/html/rfc6337#section-2.2

      if (!responseReliable) {
        this.logger.warn("Non-reliable provisional response MUST NOT contain an initial offer, discarding response.");
        return;
      }
      // If the initial offer is in the first reliable non-failure
      // message from the UAS back to UAC, the answer MUST be in the
      // acknowledgement for that message
      const sdh = this.sessionDescriptionHandlerFactory(
        this,
        this.ua.configuration.sessionDescriptionHandlerFactoryOptions || {}
      );
      this.emit("SessionDescriptionHandler-created", sdh);
      this.earlyMediaSessionDescriptionHandlers.set(session.id, sdh);
      sdh
        .setDescription(response.body, this.sessionDescriptionHandlerOptions, this.modifiers)
        .then(() => sdh.getDescription(this.sessionDescriptionHandlerOptions, this.modifiers))
        .then((description) => {
          const body: Body = {
            contentDisposition: "session", contentType: description.contentType, content: description.body
          };
          inviteResponse.prack({ extraHeaders, body });
          this.status = SessionStatus.STATUS_EARLY_MEDIA;
          this.emit("progress", response);
        })
        .catch((error) => {
          if (this.status === SessionStatus.STATUS_TERMINATED) {
            return;
          }
          this.failed(undefined, C.causes.WEBRTC_ERROR);
          this.terminated(undefined, C.causes.WEBRTC_ERROR);
        });
      return;
    }

    // This session has completed an initial offer/answer exchange, so...
    // - INVITE with SDP and this provisional response MAY be reliable
    // - INVITE without SDP and this provisional response MAY be reliable
    if (session.signalingState === SignalingState.Stable) {
      if (responseReliable) {
        inviteResponse.prack({ extraHeaders });
      }
      // Note: As documented, no early media if offer was in INVITE, so nothing to be done.
      // FIXME: TODO: Add a flag/hack to allow early media in this case. There are people
      //              in non-forking environments (think straight to FreeSWITCH) who want
      //              early media on a 183. Not sure how to actually make it work, basically
      //              something like...
      if (0 /* flag */ && this.hasOffer && !this.hasAnswer && this.sessionDescriptionHandler) {
        this.hasAnswer = true;
        this.status = SessionStatus.STATUS_EARLY_MEDIA;
        this.sessionDescriptionHandler
          .setDescription(response.body, this.sessionDescriptionHandlerOptions, this.modifiers)
          .then(() => {
            this.status = SessionStatus.STATUS_EARLY_MEDIA;
          })
          .catch((error) => {
            if (this.status === SessionStatus.STATUS_TERMINATED) {
              return;
            }
            this.failed(undefined, C.causes.WEBRTC_ERROR);
            this.terminated(undefined, C.causes.WEBRTC_ERROR);
          });
      }
      this.emit("progress", response);
      return;
    }
  }

  /**
   * Handle final response to initial INVITE.
   * @param inviteResponse 3xx response.
   */
  private onRedirect(inviteResponse: IncomingResponse): void {
    this.disposeEarlyMedia();
    const response = inviteResponse.message;
    const statusCode = response.statusCode;
    const cause: string = Utils.sipErrorCause(statusCode || 0);
    this.rejected(response, cause);
    this.failed(response, cause);
    this.terminated(response, cause);
  }

  /**
   * Handle final response to initial INVITE.
   * @param inviteResponse 4xx, 5xx, or 6xx response.
   */
  private onReject(inviteResponse: IncomingResponse): void {
    this.disposeEarlyMedia();
    const response = inviteResponse.message;
    const statusCode = response.statusCode;
    const cause: string = Utils.sipErrorCause(statusCode || 0);
    this.rejected(response, cause);
    this.failed(response, cause);
    this.terminated(response, cause);
  }

  /**
   * Handle final response to initial INVITE.
   * @param inviteResponse 100 response.
   */
  private onTrying(inviteResponse: IncomingResponse): void {
    this.received100 = true;
    this.emit("progress", inviteResponse.message);
  }
}
