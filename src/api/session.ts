import { EventEmitter } from "events";

import { C } from "../Constants";
import {
  Body,
  getBody,
  Grammar,
  IncomingAckRequest,
  IncomingByeRequest,
  IncomingInfoRequest,
  IncomingInviteRequest,
  IncomingNotifyRequest,
  IncomingPrackRequest,
  IncomingReferRequest,
  IncomingRequestMessage,
  IncomingResponseMessage,
  Logger,
  NameAddrHeader,
  OutgoingByeRequest,
  OutgoingInviteRequest,
  OutgoingInviteRequestDelegate,
  OutgoingRequestDelegate,
  OutgoingRequestMessage,
  RequestOptions,
  Session as SessionDialog,
  SessionState as SessionDialogState,
  SignalingState
} from "../core";
import { AllowedMethods } from "../core/user-agent-core/allowed-methods";
import { SessionStatus, TypeStrings } from "../Enums";
import { Exceptions } from "../Exceptions";
import { Utils } from "../Utils";

import { Emitter, makeEmitter } from "./emitter";
import { Info } from "./info";
import { Inviter } from "./inviter";
import { Notification } from "./notification";
import { Referral } from "./referral";
import { Referrer } from "./referrer";
import { SessionDelegate } from "./session-delegate";
import {
  BodyAndContentType,
  SessionDescriptionHandler,
  SessionDescriptionHandlerModifier,
  SessionDescriptionHandlerOptions
} from "./session-description-handler";
import { SessionDescriptionHandlerFactory } from "./session-description-handler-factory";
import { SessionInviteOptions } from "./session-invite-options";
import { SessionOptions } from "./session-options";
import { SessionState } from "./session-state";
import { UserAgent } from "./user-agent";

/**
 * A session provides real time communication between one or more participants.
 * @public
 */
export abstract class Session extends EventEmitter {
  // DEPRECATED
  /** @internal */
  public static readonly C = SessionStatus;

  /**
   * Property reserved for use by instance owner.
   * @defaultValue `undefined`
   */
  public data: any | undefined;

  /**
   * The session delegate.
   * @defaultValue `undefined`
   */
  public delegate: SessionDelegate | undefined;

  /**
   * The confirmed session dialog.
   */
  public dialog: SessionDialog | undefined;

  // Property overlap with ClientContext & ServerContext Interfaces
  /** @internal */
  public type = TypeStrings.Session;
  /** @internal */
  public userAgent: UserAgent;
  /** @internal */
  public logger: Logger;
  /** @internal */
  public method = C.INVITE;
  /** @internal */
  public abstract body: BodyAndContentType | string | undefined;
  /** @internal */
  public abstract localIdentity: NameAddrHeader;
  /** @internal */
  public abstract remoteIdentity: NameAddrHeader;

  // Property overlap with ClientContext Interface (only)

  // Property overlap with ServerContext Interface (only)
  /** @internal */
  public assertedIdentity: NameAddrHeader | undefined;
  /** @internal */
  public contentType: string | undefined;

  // Session properties
  /** @internal */
  public id: string | undefined;
  /** @internal */
  public contact: string | undefined;
  /** Terminated time. */
  /** @internal */
  public endTime: Date | undefined;
  /** @internal */
  public localHold = false;
  /** @internal */
  public referral: Inviter | undefined;
  /** @internal */
  public referrer: Referrer | undefined;
  /** @internal */
  public replacee: Session | undefined;
  /** Accepted time. */
  /** @internal */
  public startTime: Date | undefined;
  /** DEPRECATED: Session status */
  /** @internal */
  public status: SessionStatus =  SessionStatus.STATUS_NULL;

  /** @internal */
  protected earlySdp: string | undefined; // FIXME: Needs review. Appears to be unused.
  /** @internal */
  protected errorListener: ((...args: Array<any>) => void);
  /** @internal */
  protected fromTag: string | undefined;
  /** @internal */
  protected onInfo: ((request: IncomingRequestMessage) => void) | undefined;
  /** @internal */
  protected passedOptions: any;
  /** @internal */
  protected rel100 = C.supported.UNSUPPORTED;
  /** @internal */
  protected renderbody: string | undefined;
  /** @internal */
  protected rendertype: string | undefined;
  /** @internal */
  protected sessionDescriptionHandlerFactory: SessionDescriptionHandlerFactory;
  /** @internal */
  protected sessionDescriptionHandlerModifiers: Array<SessionDescriptionHandlerModifier> | undefined;
  /** @internal */
  protected sessionDescriptionHandlerOptions: SessionDescriptionHandlerOptions | undefined;
  /** @internal */
  protected expiresTimer: any = undefined;
  /** @internal */
  protected userNoAnswerTimer: any = undefined;

  private _sessionDescriptionHandler: SessionDescriptionHandler | undefined;
  private _state: SessionState = SessionState.Initial;
  private _stateEventEmitter = new EventEmitter();

  private pendingReinvite: boolean = false;
  private tones: any = undefined;

  /**
   * Constructor.
   * @param userAgent - User agent. See {@link UserAgent} for details.
   * @internal
   */
  protected constructor(userAgent: UserAgent, options: SessionOptions = {}) {
    super();
    this.userAgent = userAgent;
    this.delegate = options.delegate;
    this.logger = userAgent.getLogger("sip.session");

    const sessionDescriptionHandlerFactory = this.userAgent.configuration.sessionDescriptionHandlerFactory;
    if (!sessionDescriptionHandlerFactory) {
      throw new Exceptions.SessionDescriptionHandlerError(
        "A session description handler is required for the session to function."
      );
    }
    this.sessionDescriptionHandlerFactory = sessionDescriptionHandlerFactory;

    this.errorListener = this.onTransportError.bind(this);
    if (userAgent.transport) {
      userAgent.transport.on("transportError", this.errorListener);
    }
  }

  /**
   * @deprecated Legacy state transition.
   * @internal
   */
  public on(
    event: "SessionDescriptionHandler-created", listener: (sessionDescriptionHandler: SessionDescriptionHandler) => void
  ): this;
  /**
   * @deprecated Legacy state transition.
   * @internal
   */
  // public on(
  //   event: "dtmf",
  //   listener: (request: IncomingRequestMessage | OutgoingRequestMessage, dtmf: DTMF | DTMFSender) => void
  // ): this;
  /**
   * @deprecated Legacy state transition.
   * @internal
   */
  // public on(
  //   event: "referRequested", listener: (context: ReferClientContext | ReferServerContext) => void
  // ): this;
  /**
   * @deprecated Legacy state transition.
   * @internal
   */
  // public on(
  //   event: "referProgress" | "referAccepted", listener: (context: ReferServerContext) => void
  // ): this;
  /**
   * @deprecated Legacy state transition.
   * @internal
   */
  public on(
    event:
      "referInviteSent" |
      "referProgress" |
      "referAccepted" |
      "referRequestProgress" |
      "referRequestAccepted" |
      "referRequestRejected" |
      "reinviteAccepted" |
      "reinviteFailed" |
      "replaced",
    listener: (session: Session) => void
  ): this;
  /**
   * @deprecated Legacy state transition.
   * @internal
   */
  public on(
    event: "reinvite", listener: (session: Session, request: IncomingRequestMessage) => void
  ): this;
  /**
   * @deprecated Legacy state transition.
   * @internal
   */
  public on(
    event: "confirmed" | "notify",   listener: (request: IncomingRequestMessage) => void
  ): this;
  /**
   * @deprecated Legacy state transition.
   * @internal
   */
  public on(
    event: "ack" | "invite" | "refer", listener: (request: OutgoingRequestMessage) => void
  ): this;
  /**
   * @deprecated Legacy state transition.
   * @internal
   */
  public on(
    event: "bye", listener: (request: IncomingRequestMessage | OutgoingRequestMessage) => void
  ): this;
  /**
   * @deprecated Legacy state transition.
   * @internal
   */
  public on(
    event: "accepted", listener: (response: string | IncomingResponseMessage, cause: string) => void
  ): this;
  /**
   * @deprecated Legacy state transition.
   * @internal
   */
  public on(
    event: "connecting", listener: (request: { request: IncomingRequestMessage }) => void
  ): this;
  /**
   * @deprecated Legacy state transition.
   * @internal
   */
  public on(
    event: "progress", listener: (response: IncomingResponseMessage | string, reasonPhrase?: any) => void
  ): this;
  /**
   * @deprecated Legacy state transition.
   * @internal
   */
  public on(
    event: "failed" | "rejected",
    listener: (response?: IncomingRequestMessage | IncomingResponseMessage | string, cause?: string) => void
  ): this;
  /**
   * @deprecated Legacy state transition.
   * @internal
   */
  public on(
    event: "terminated", listener: (response?: IncomingRequestMessage | IncomingResponseMessage, cause?: string) => void
  ): this;
  /**
   * @deprecated Legacy state transition.
   * @internal
   */
  public on(event: "renegotiationError", listener: (error: Error) => void): this;
  /**
   * @deprecated Legacy state transition.
   * @internal
   */
  public on(event: "cancel" | "trackAdded" | "directionChanged" | "referRejected", listener: () => void): this;
  /**
   * @deprecated Legacy state transition.
   * @internal
   */
  public on(name: string, callback: (...args: any[]) => void): this {
    return super.on(name, callback);
  }

  /**
   * @deprecated Legacy state transition.
   * @internal
   */
  public emit(
    event: "SessionDescriptionHandler-created", sessionDescriptionHandler: SessionDescriptionHandler
  ): boolean;
  /**
   * @deprecated Legacy state transition.
   * @internal
   */
  // public emit(
  //   event: "dtmf", request: IncomingRequestMessage | OutgoingRequestMessage, dtmf: DTMF | DTMFSender
  // ): boolean;
  /**
   * @deprecated Legacy state transition.
   * @internal
   */
  // public emit(
  //   event: "referRequested", context: ReferClientContext | ReferServerContext
  // ): boolean;
  /**
   * @deprecated Legacy state transition.
   * @internal
   */
  // public emit(
  //   event: "referProgress" | "referAccepted", context: ReferServerContext): boolean;
  /**
   * @deprecated Legacy state transition.
   * @internal
   */
  public emit(
    event:
      "referInviteSent" |
      "referRejected" |
      "referRequestProgress" |
      "referRequestAccepted" |
      "referRequestRejected" |
      "reinviteAccepted" |
      "reinviteFailed" |
      "replaced",
    session: Session): boolean;
  /**
   * @deprecated Legacy state transition.
   * @internal
   */
  public emit(
    event: "reinvite", session: Session, request: IncomingRequestMessage
  ): boolean;
  /**
   * @deprecated Legacy state transition.
   * @internal
   */
  public emit(
    event: "confirmed" | "notify", request: IncomingRequestMessage
  ): boolean;
  /**
   * @deprecated Legacy state transition.
   * @internal
   */
  public emit(
    event: "ack" | "invite" | "refer" | "notify", request: OutgoingRequestMessage
  ): boolean;
  /**
   * @deprecated Legacy state transition.
   * @internal
   */
  public emit(
    event: "bye", request: IncomingRequestMessage | OutgoingRequestMessage
  ): boolean;
  /**
   * @deprecated Legacy state transition.
   * @internal
   */
  public emit(
    event: "accepted", response?: string | IncomingResponseMessage, cause?: string
  ): boolean;
  /**
   * @deprecated Legacy state transition.
   * @internal
   */
  public emit(
    event: "connecting", request: { request: IncomingRequestMessage }
  ): boolean;
  /**
   * @deprecated Legacy state transition.
   * @internal
   */
  public emit(
    event: "progress", response: IncomingResponseMessage | string, reasonPhrase?: any
  ): boolean;
  /**
   * @deprecated Legacy state transition.
   * @internal
   */
  public emit(
    event: "failed" | "rejected",
    response?: IncomingRequestMessage | IncomingResponseMessage | string, cause?: string
  ): boolean;
  /**
   * @deprecated Legacy state transition.
   * @internal
   */
  public emit(
    event: "terminated", response?: IncomingRequestMessage | IncomingResponseMessage, cause?: string
  ): boolean;
  /**
   * @deprecated Legacy state transition.
   * @internal
   */
  public emit(event: "renegotiationError", error: Error): boolean;
  /**
   * @deprecated Legacy state transition.
   * @internal
   */
  public emit(event: "cancel" | "trackAdded" | "directionChanged" | "referRejected"): boolean;
  /**
   * @deprecated Legacy state transition.
   * @internal
   */
  public emit(event: string | symbol, ...args: any[]): boolean {
    return super.emit(event, ...args);
  }

  /**
   * Session description handler.
   */
  get sessionDescriptionHandler(): SessionDescriptionHandler | undefined {
    return this._sessionDescriptionHandler;
  }

  /**
   * Session state.
   */
  get state(): SessionState {
    return this._state;
  }

  /**
   * Session state change emitter.
   */
  get stateChange(): Emitter<SessionState> {
    return makeEmitter(this._stateEventEmitter);
  }

  /**
   * Renegotiate the session. Sends a re-INVITE.
   * @param options - Options bucket.
   */
  public invite(options: SessionInviteOptions = {}): Promise<OutgoingInviteRequest> {
    this.logger.log("Session.invite");
    if (this.state !== SessionState.Established) {
      return Promise.reject(new Error(`Invalid session state ${this.state}`));
    }
    if (this.pendingReinvite) {
      return Promise.reject(new Error("Reinvite in progress. Please wait until complete, then try again."));
    }
    if (!this._sessionDescriptionHandler) {
      throw new Error("Session description handler undefined.");
    }

    this.pendingReinvite = true;

    const delegate: OutgoingInviteRequestDelegate = {
      onAccept: (response): void => {
        // Our peer accepted re-INVITE, so get description from body and set remote offer/answer...
        const body = getBody(response.message);
        if (!body) {
          this.logger.error("Received 2xx final response to re-invite without a description");
          const error = new Error("Invalid response to a re-invite.");
          this.emit("reinviteFailed", this);
          this.emit("renegotiationError", error);
          this.pendingReinvite = false;
          throw error;
        }

        if (options.withoutSdp) {
          const answerOptions = {
            sessionDescriptionHandlerOptions: options.sessionDescriptionHandlerOptions,
            sessionDescriptionHandlerModifiers: options.sessionDescriptionHandlerModifiers
          };
          // INVITE without SDP, so set remote offer and send answer in ACk
          this.setOfferAndGetAnswer(body, answerOptions)
            .then((answerBody) => {
              const request = response.ack({ body: answerBody });
              this.emit("ack", request.message);
              this.emit("reinviteAccepted", this);
              this.pendingReinvite = false;
              if (options.requestDelegate && options.requestDelegate.onAccept) {
                options.requestDelegate.onAccept(response);
              }
            })
            .catch((error: Error) => {
              this.logger.error(error.message);
              this.emit("reinviteFailed", this);
              this.emit("renegotiationError", error);
              this.pendingReinvite = false;
              throw error;
            });
        } else {
          // INVITE with SDP, so set remote answer and send ACk
          const answerOptions = {
            sessionDescriptionHandlerOptions: this.sessionDescriptionHandlerOptions,
            sessionDescriptionHandlerModifiers: this.sessionDescriptionHandlerModifiers
          };
          this.setAnswer(body, answerOptions)
            .then(() => {
              const request = response.ack();
              this.emit("ack", request.message);
              this.emit("reinviteAccepted", this);
              this.pendingReinvite = false;
              if (options.requestDelegate && options.requestDelegate.onAccept) {
                options.requestDelegate.onAccept(response);
              }
            })
            .catch((error: Error) => {
              this.logger.error(error.message);
              this.emit("reinviteFailed", this);
              this.emit("renegotiationError", error);
              this.pendingReinvite = false;
              throw error;
            });
        }
      },
      onProgress: (response): void => {
        return;
      },
      onRedirect: (response): void => {
        return;
      },
      onReject: (response): void => {
        this.logger.error("Received a non-2xx final response to re-invite");
        const error = new Error("Invalid response to a re-invite.");
        this.emit("reinviteFailed", this);
        this.emit("renegotiationError", error);
        this.pendingReinvite = false;
        if (options.requestDelegate && options.requestDelegate.onReject) {
          options.requestDelegate.onReject(response);
        }
      },
      onTrying: (response): void => {
        return;
      }
    };

    const requestOptions = options.requestOptions || {};
    requestOptions.extraHeaders = (requestOptions.extraHeaders || []).slice();
    requestOptions.extraHeaders.push("Allow: " + AllowedMethods.toString());
    requestOptions.extraHeaders.push("Contact: " + this.contact);

    // just send an INVITE with no sdp...
    if (options.withoutSdp) {
      if (!this.dialog) {
        this.pendingReinvite = false;
        throw new Error("Dialog undefined.");
      }
      return Promise.resolve(this.dialog.invite(delegate, requestOptions));
    }

    // get an offer and send it in an INVITE
    const offerOptions = {
      sessionDescriptionHandlerOptions: options.sessionDescriptionHandlerOptions,
      sessionDescriptionHandlerModifiers: options.sessionDescriptionHandlerModifiers
    };
    return this.getOffer(offerOptions)
      .then((offerBody) => {
        if (!this.dialog) {
          this.pendingReinvite = false;
          throw new Error("Dialog undefined.");
        }
        requestOptions.body = offerBody;
        return this.dialog.invite(delegate, requestOptions);
      })
      .catch((error: Error) => {
        this.logger.error(error.message);
        this.emit("reinviteFailed", this);
        this.emit("renegotiationError", error);
        this.pendingReinvite = false;
        throw error;
      });
  }

  /**
   * TODO: This is awkward.
   * Helper function
   * @internal
   */
  public byePending(): void {
    this.stateTransition(SessionState.Terminating);
    this.terminated();
  }

  /**
   * TODO: This is awkward.
   * Helper function
   * @internal
   */
  public byeSent(request: OutgoingByeRequest): void {
    this.emit("bye", request.message);
    this.stateTransition(SessionState.Terminated);
    this.terminated();
  }

  /**
   * Send BYE.
   * @param delegate - Request delegate.
   * @param options - Request options bucket.
   * @internal
   */
  public bye(delegate?: OutgoingRequestDelegate, options?: RequestOptions): Promise<OutgoingByeRequest> {
    // Using core session dialog
    if (!this.dialog) {
      return Promise.reject(new Error("Session dialog undefined."));
    }
    const dialog = this.dialog;

    // The caller's UA MAY send a BYE for either confirmed or early dialogs,
    // and the callee's UA MAY send a BYE on confirmed dialogs, but MUST NOT
    // send a BYE on early dialogs. However, the callee's UA MUST NOT send a
    // BYE on a confirmed dialog until it has received an ACK for its 2xx
    // response or until the server transaction times out.
    // https://tools.ietf.org/html/rfc3261#section-15
    switch (dialog.sessionState) {
      case SessionDialogState.Initial:
        throw new Error(`Invalid dialog state ${dialog.sessionState}`);
      case SessionDialogState.Early: // Implementation choice - not sending BYE for early dialogs.
        throw new Error(`Invalid dialog state ${dialog.sessionState}`);
      case SessionDialogState.AckWait: { // This state only occurs if we are the callee.
        this.byePending();
        return new Promise((resolve, reject) => {
          dialog.delegate = {
            // When ACK shows up, say BYE.
            onAck: (): void => {
              const request = dialog.bye(delegate, options);
              this.byeSent(request);
              resolve(request);
            },
            // Or the server transaction times out before the ACK arrives.
            onAckTimeout: (): void => {
              const request = dialog.bye(delegate, options);
              this.byeSent(request);
              resolve(request);
            }
          };
        });
      }
      case SessionDialogState.Confirmed: {
        const request = dialog.bye(delegate, options);
        this.byeSent(request);
        return Promise.resolve(request);
      }
      case SessionDialogState.Terminated:
        throw new Error(`Invalid dialog state ${dialog.sessionState}`);
      default:
        throw new Error("Unrecognized state.");
    }
  }

  /**
   * Send INFO.
   * @param delegate - Request delegate.
   * @param options - Request options bucket.
   * @internal
   */
  public info(delegate?: OutgoingRequestDelegate, options?: RequestOptions): Promise<OutgoingByeRequest> {
    // Using core session dialog
    if (!this.dialog) {
      return Promise.reject(new Error("Session dialog undefined."));
    }
    return Promise.resolve(this.dialog.info(delegate, options));
  }

  /**
   * Send REFER.
   * @param delegate - Request delegate.
   * @param options - Request options bucket.
   * @internal
   */
  public refer(
    referrer: Referrer,
    delegate?: OutgoingRequestDelegate,
    options?: RequestOptions
  ): Promise<OutgoingByeRequest> {
    // Using core session dialog
    if (!this.dialog) {
      return Promise.reject(new Error("Session dialog undefined."));
    }
    // If the session has a referrer, it will receive any in-dialog NOTIFY requests.
    this.referrer = referrer;
    return Promise.resolve(this.dialog.refer(delegate, options));
  }

  /**
   * @internal
   */
  public close(): void {
    if (this.status === SessionStatus.STATUS_TERMINATED) {
      return;
    }

    this.logger.log("closing INVITE session " + this.id);

    // 1st Step. Terminate media.
    if (this._sessionDescriptionHandler) {
      this._sessionDescriptionHandler.close();
    }

    // 2nd Step. Terminate signaling.

    // Clear session timers
    if (this.expiresTimer) {
      clearTimeout(this.expiresTimer);
    }
    if (this.userNoAnswerTimer) {
      clearTimeout(this.userNoAnswerTimer);
    }

    this.status = SessionStatus.STATUS_TERMINATED;
    if (this.userAgent.transport) {
      this.userAgent.transport.removeListener("transportError", this.errorListener);
    }

    if (!this.id) {
      throw new Error("Session id undefined.");
    }
    delete this.userAgent.sessions[this.id];

    return;
  }

  /**
   * @internal
   */
  public onRequestTimeout(): void {
    if (this.status === SessionStatus.STATUS_CONFIRMED) {
      this.terminated(undefined, C.causes.REQUEST_TIMEOUT);
    } else if (this.status !== SessionStatus.STATUS_TERMINATED) {
      this.failed(undefined, C.causes.REQUEST_TIMEOUT);
      this.terminated(undefined, C.causes.REQUEST_TIMEOUT);
    }
  }

  /**
   * @internal
   */
  public onTransportError(): void {
    if (this.status !== SessionStatus.STATUS_CONFIRMED && this.status !== SessionStatus.STATUS_TERMINATED) {
      this.failed(undefined, C.causes.CONNECTION_ERROR);
    }
  }

  /**
   * Handle in dialog ACK request.
   * @internal
   */
  protected onAckRequest(request: IncomingAckRequest): void {
    this.logger.log("Session.onAckRequest");
    if (
      this.state !== SessionState.Initial &&
      this.state !== SessionState.Establishing &&
      this.state !== SessionState.Established &&
      this.state !== SessionState.Terminating
    ) {
      this.logger.error(`ACK received while in state ${this.state}, dropping request`);
      return;
    }

    // FIXME: Review is this ever true? We're "Established" when dialog created in accept().
    if (this.state === SessionState.Initial || this.state === SessionState.Establishing) {
      this.stateTransition(SessionState.Established);
    }

    const dialog = this.dialog;
    if (!dialog) {
      throw new Error("Dialog undefined.");
    }

    // Helper function.
    const confirmSession = (): void => {
      this.status = SessionStatus.STATUS_CONFIRMED;
      this.emit("confirmed", request.message);
    };

    // If the ACK doesn't have an offer/answer, nothing to be done.
    const body = getBody(request.message);
    if (!body) {
      confirmSession();
      return;
    }
    if (body.contentDisposition === "render") {
      this.renderbody = body.content;
      this.rendertype = body.contentType;
      confirmSession();
      return;
    }
    if (body.contentDisposition !== "session") {
      confirmSession();
      return;
    }

    const options = {
      sessionDescriptionHandlerOptions: this.sessionDescriptionHandlerOptions,
      sessionDescriptionHandlerModifiers: this.sessionDescriptionHandlerModifiers
    };

    switch (dialog.signalingState) {
      case SignalingState.Initial:
        // State should never be reached as first reliable response must have answer/offer.
        throw new Error(`Invalid signaling state ${dialog.signalingState}.`);
      case SignalingState.Stable:
        // Receved answer.
        this.setAnswer(body, options)
          .then(() => confirmSession())
          .catch((error: any) => {
            // FIXME: TODO - need to do something to handle this error
            this.logger.error(error);
            const extraHeaders = ["Reason: " + Utils.getReasonHeaderValue(488, "Bad Media Description")];
            this.bye(undefined, { extraHeaders });
            this.failed(request.message, C.causes.BAD_MEDIA_DESCRIPTION);
            this.terminated(request.message, C.causes.BAD_MEDIA_DESCRIPTION);
            throw error;
          });
        return;
      case SignalingState.HaveLocalOffer:
        // State should never be reached as local offer would be answered by this ACK
        throw new Error(`Invalid signaling state ${dialog.signalingState}.`);
      case SignalingState.HaveRemoteOffer:
        // State should never be reached as remote offer would be answered in first reliable response.
        throw new Error(`Invalid signaling state ${dialog.signalingState}.`);
      case SignalingState.Closed:
        throw new Error(`Invalid signaling state ${dialog.signalingState}.`);
      default:
        throw new Error(`Invalid signaling state ${dialog.signalingState}.`);
    }
  }

  /**
   * Handle in dialog BYE request.
   * @internal
   */
  protected onByeRequest(request: IncomingByeRequest): void {
    this.logger.log("Session.onByeRequest");
    if (this.state !== SessionState.Established) {
      this.logger.error(`BYE received while in state ${this.state}, dropping request`);
      return;
    }
    request.accept();
    this.stateTransition(SessionState.Terminated);
    if (this.status === SessionStatus.STATUS_CONFIRMED) {
      this.emit("bye", request.message);
      this.terminated(request.message, C.BYE);
    }
  }

  /**
   * Handle in dialog INFO request.
   * @internal
   */
  protected onInfoRequest(request: IncomingInfoRequest): void {
    this.logger.log("Session.onInfoRequest");
    if (this.state !== SessionState.Established) {
      this.logger.error(`INFO received while in state ${this.state}, dropping request`);
      return;
    }

    if (this.delegate && this.delegate.onInfo) {
      const info = new Info(request);
      this.delegate.onInfo(info);
    } else {
      request.accept();
    }
  }

  /**
   * Handle in dialog INVITE request.
   * Unless an `onInviteFailure` delegate is available, the session is terminated on failure.
   * @internal
   */
  protected onInviteRequest(request: IncomingInviteRequest): void {
    this.logger.log("Session.onInviteRequest");
    if (this.state !== SessionState.Established) {
      this.logger.error(`INVITE received while in state ${this.state}, dropping request`);
      return;
    }

    // Handle P-Asserted-Identity
    if (request.message.hasHeader("P-Asserted-Identity")) {
      const header = request.message.getHeader("P-Asserted-Identity");
      if (!header) {
        throw new Error("Header undefined.");
      }
      this.assertedIdentity = Grammar.nameAddrHeaderParse(header);
    }

    this.emit("reinvite", this, request.message);

    // TODO: would be nice to have core track and set the Contact header,
    // but currently the session which is setting it is holding onto it.
    const extraHeaders = ["Contact: " + this.contact];
    // FIXME: TODO: These are the options/modifiers set on the initial INVITE and
    // it seems just plain broken to re-use them on a re-invite.
    // This behavior was ported from legacy code and the issue punted down the road.
    const options = {
      sessionDescriptionHandlerOptions: this.sessionDescriptionHandlerOptions,
      sessionDescriptionHandlerModifiers: this.sessionDescriptionHandlerModifiers
    };
    this.generateResponseOfferAnswerInDialog(options)
      .then((body) => {
        request.accept({ statusCode: 200, extraHeaders, body });
        this.emit("reinviteAccepted", this);
        if (this.delegate && this.delegate.onReinviteSuccess) {
          this.delegate.onReinviteSuccess();
        }
      })
      .catch((error: Error) => {
        this.logger.error(error.message);
        request.reject({ statusCode: 488 });
        this.emit("reinviteFailed", this);
        this.emit("renegotiationError", error);
        if (this.delegate && this.delegate.onReinviteFailure) {
          this.delegate.onReinviteFailure(error);
        } else {
          this.logger.error("A failure occurred processing re-INVITE request with no delegate, terminating session...");
          this.bye(undefined, {
            extraHeaders: ["Reason: " + Utils.getReasonHeaderValue(488, "Not Acceptable Here")]
          });
        }
      });
  }

  /**
   * Handle in dialog NOTIFY request.
   * @internal
   */
  protected onNotifyRequest(request: IncomingNotifyRequest): void {
    this.logger.log("Session.onNotifyRequest");
    if (this.state !== SessionState.Established) {
      this.logger.error(`NOTIFY received while in state ${this.state}, dropping request`);
      return;
    }

    // DEPRECATED BEGIN
    // ReferClientContext is deprecated
    // if (
    //   this.referContext &&
    //   this.referContext.type === TypeStrings.ReferClientContext &&
    //   incomingRequest.message.hasHeader("event") &&
    //   /^refer(;.*)?$/.test(incomingRequest.message.getHeader("event") as string)
    // ) {
    //   this.referContext.receiveNotify(incomingRequest);
    //   return;
    // }
    // DEPRECATED END

    // If this a NOTIFY associated with the progress of a REFER,
    // look to delegate handling to the associated Referrer.
    if (this.referrer && this.referrer.delegate && this.referrer.delegate.onNotify) {
      const notification = new Notification(request);
      this.referrer.delegate.onNotify(notification);
      return;
    }

    // Otherwise accept the NOTIFY.
    if (this.delegate && this.delegate.onNotify) {
      const notification = new Notification(request);
      this.delegate.onNotify(notification);
    } else {
      request.accept();
    }
    this.emit("notify", request.message);
  }

  /**
   * Handle in dialog PRACK request.
   * @internal
   */
  protected onPrackRequest(request: IncomingPrackRequest): void {
    this.logger.log("Session.onPrackRequest");
    if (this.state !== SessionState.Established) {
      this.logger.error(`PRACK received while in state ${this.state}, dropping request`);
      return;
    }

    throw new Error("Unimplemented.");
  }

  /**
   * Handle in dialog REFER request.
   * @internal
   */
  protected onReferRequest(request: IncomingReferRequest): void {
    this.logger.log("Session.onReferRequest");
    if (this.state !== SessionState.Established) {
      this.logger.error(`REFER received while in state ${this.state}, dropping request`);
      return;
    }

    if (this.status === SessionStatus.STATUS_CONFIRMED) {
      // RFC 3515 2.4.1
      if (!request.message.hasHeader("refer-to")) {
        this.logger.warn("Invalid REFER packet. A refer-to header is required. Rejecting.");
        request.reject();
        return;
      }

      // DEPRECATED BEGIN
      // // ReferServerContext is deprecated
      // if (this.listeners("referRequested").length) {
      //   const referContext = new ReferServerContext(this.ua, incomingRequest, this.dialog);
      //   this.emit("referRequested", referContext);
      //   return;
      // }
      // DEPRECATED END

      const referral = new Referral(request, this);

      if (this.delegate && this.delegate.onRefer) {
        this.delegate.onRefer(referral);
      } else {
        this.logger.log("No delegate available to handle REFER, automatically accepting and following.");
        referral
          .accept()
          .then(() => referral
            .makeInviter(this.passedOptions)
            .invite()
          )
          .catch((error: Error) => {
            // FIXME: logging and eating error...
            this.logger.error(error.message);
          });
      }
    }
  }

  /**
   * @deprecated Legacy state transition.
   * @internal
   */
  protected accepted(response?: IncomingResponseMessage | string, cause?: string): void {
    if (response instanceof IncomingResponseMessage) {
      cause = Utils.getReasonPhrase(response.statusCode || 0, cause);
    }

    this.startTime = new Date();

    if (this.replacee) {
      this.replacee.emit("replaced", this);
      this.replacee.bye();
    }
    this.emit("accepted", response, cause);
  }

  /**
   * @deprecated Legacy state transition.
   * @internal
   */
  protected canceled(): void {
    if (this._sessionDescriptionHandler) {
      this._sessionDescriptionHandler.close();
    }
    this.emit("cancel");
  }

  /**
   * @deprecated Legacy state transition.
   * @internal
   */
  protected connecting(request: IncomingRequestMessage): void {
    this.emit("connecting", { request });
  }

  /**
   * @deprecated Legacy state transition.
   * @internal
   */
  protected failed(response: IncomingResponseMessage | IncomingRequestMessage | undefined, cause: string): void {
    if (this.status === SessionStatus.STATUS_TERMINATED) {
      return;
    }
    this.emit("failed", response, cause);
  }

  /**
   * @deprecated Legacy state transition.
   * @internal
   */
  protected rejected(response: IncomingResponseMessage | IncomingRequestMessage, cause: string): void {
    this.emit("rejected", response, cause);
  }

  /**
   * @deprecated Legacy state transition.
   * @internal
   */
  protected terminated(message?: IncomingResponseMessage | IncomingRequestMessage, cause?: string): void {
    if (this.status === SessionStatus.STATUS_TERMINATED) {
      return;
    }

    this.endTime = new Date();

    this.close();
    this.emit("terminated", message, cause);
  }

  /**
   * Generate an offer or answer for a response to an INVITE request.
   * If a remote offer was provided in the request, set the remote
   * description and get a local answer. If a remote offer was not
   * provided, generates a local offer.
   * @internal
   */
  protected generateResponseOfferAnswer(
    request: IncomingInviteRequest,
    options: {
      sessionDescriptionHandlerOptions?: SessionDescriptionHandlerOptions,
      sessionDescriptionHandlerModifiers?: Array<SessionDescriptionHandlerModifier>
    }
  ): Promise<Body | undefined> {
    if (this.dialog) {
      return this.generateResponseOfferAnswerInDialog(options);
    }
    const body = getBody(request.message);
    if (!body || body.contentDisposition !== "session") {
      return this.getOffer(options);
    } else {
      return this.setOfferAndGetAnswer(body, options);
    }
  }

  /**
   * Generate an offer or answer for a response to an INVITE request
   * when a dialog (early or otherwise) has already been established.
   * This method may NOT be called if a dialog has yet to be established.
   * @internal
   */
  protected generateResponseOfferAnswerInDialog(
    options: {
      sessionDescriptionHandlerOptions?: SessionDescriptionHandlerOptions,
      sessionDescriptionHandlerModifiers?: Array<SessionDescriptionHandlerModifier>
    }
  ): Promise<Body | undefined> {
    if (!this.dialog) {
      throw new Error("Dialog undefined.");
    }
    switch (this.dialog.signalingState) {
      case SignalingState.Initial:
        return this.getOffer(options);
      case SignalingState.HaveLocalOffer:
        // o  Once the UAS has sent or received an answer to the initial
        // offer, it MUST NOT generate subsequent offers in any responses
        // to the initial INVITE.  This means that a UAS based on this
        // specification alone can never generate subsequent offers until
        // completion of the initial transaction.
        // https://tools.ietf.org/html/rfc3261#section-13.2.1
        return Promise.resolve(undefined);
      case SignalingState.HaveRemoteOffer:
        if (!this.dialog.offer) {
          throw new Error(`Session offer undefined in signaling state ${this.dialog.signalingState}.`);
        }
        return this.setOfferAndGetAnswer(this.dialog.offer, options);
      case SignalingState.Stable:
        // o  Once the UAS has sent or received an answer to the initial
        // offer, it MUST NOT generate subsequent offers in any responses
        // to the initial INVITE.  This means that a UAS based on this
        // specification alone can never generate subsequent offers until
        // completion of the initial transaction.
        // https://tools.ietf.org/html/rfc3261#section-13.2.1
        if (this.state !== SessionState.Established) {
          return Promise.resolve(undefined);
        }
        // In dialog INVITE without offer, get an offer for the response.
        return this.getOffer(options);
      case SignalingState.Closed:
        throw new Error(`Invalid signaling state ${this.dialog.signalingState}.`);
      default:
        throw new Error(`Invalid signaling state ${this.dialog.signalingState}.`);
    }
  }

  /**
   * Get local offer.
   * @internal
   */
  protected getOffer(options: {
    sessionDescriptionHandlerOptions?: SessionDescriptionHandlerOptions,
    sessionDescriptionHandlerModifiers?: Array<SessionDescriptionHandlerModifier>
  }): Promise<Body> {
    const sdh = this.setupSessionDescriptionHandler();
    const sdhOptions = options.sessionDescriptionHandlerOptions;
    const sdhModifiers = options.sessionDescriptionHandlerModifiers;
    return sdh.getDescription(sdhOptions, sdhModifiers)
      .then((bodyAndContentType) => Utils.fromBodyObj(bodyAndContentType))
      .catch((error: any) => { // don't trust SDH to reject with Error
        throw (error instanceof Error ? error : new Error(error));
      });
  }

  /**
   * Set remote answer.
   * @internal
   */
  protected setAnswer(answer: Body, options: {
    sessionDescriptionHandlerOptions?: SessionDescriptionHandlerOptions,
    sessionDescriptionHandlerModifiers?: Array<SessionDescriptionHandlerModifier>
  }): Promise<void> {
    const sdh = this.setupSessionDescriptionHandler();
    const sdhOptions = options.sessionDescriptionHandlerOptions;
    const sdhModifiers = options.sessionDescriptionHandlerModifiers;
    if (!sdh.hasDescription(answer.contentType)) {
      return Promise.reject(new Exceptions.UnsupportedSessionDescriptionContentTypeError());
    }
    return sdh.setDescription(answer.content, sdhOptions, sdhModifiers)
      .catch((error: any) => { // don't trust SDH to reject with Error
        throw (error instanceof Error ? error : new Error(error));
      });
  }

  /**
   * Set remote offer and get local answer.
   * @internal
   */
  protected setOfferAndGetAnswer(offer: Body, options: {
    sessionDescriptionHandlerOptions?: SessionDescriptionHandlerOptions,
    sessionDescriptionHandlerModifiers?: Array<SessionDescriptionHandlerModifier>
  }): Promise<Body> {
    const sdh = this.setupSessionDescriptionHandler();
    const sdhOptions = options.sessionDescriptionHandlerOptions;
    const sdhModifiers = options.sessionDescriptionHandlerModifiers;
    if (!sdh.hasDescription(offer.contentType)) {
      return Promise.reject(new Exceptions.UnsupportedSessionDescriptionContentTypeError());
    }
    return sdh.setDescription(offer.content, sdhOptions, sdhModifiers)
      .then(() => sdh.getDescription(sdhOptions, sdhModifiers))
      .then((bodyAndContentType) => Utils.fromBodyObj(bodyAndContentType))
      .catch((error: any) => { // don't trust SDH to reject with Error
        throw (error instanceof Error ? error : new Error(error));
      });
  }

  /**
   * SDH for confirmed dialog.
   * @internal
   */
  protected setSessionDescriptionHandler(sdh: SessionDescriptionHandler): void {
    if (this._sessionDescriptionHandler) {
      throw new Error("Sessionn description handler defined.");
    }
    this._sessionDescriptionHandler = sdh;
  }

  /**
   * SDH for confirmed dialog.
   * @internal
   */
  protected setupSessionDescriptionHandler(): SessionDescriptionHandler {
    if (this._sessionDescriptionHandler) {
      return this._sessionDescriptionHandler;
    }
    this._sessionDescriptionHandler =
      this.sessionDescriptionHandlerFactory(this, this.userAgent.configuration.sessionDescriptionHandlerFactoryOptions);
    this.emit("SessionDescriptionHandler-created", this._sessionDescriptionHandler);
    return this._sessionDescriptionHandler;
  }

  /**
   * Transition session state.
   * @internal
   */
  protected stateTransition(newState: SessionState): void {
    const invalidTransition = () => {
      throw new Error(`Invalid state transition from ${this._state} to ${newState}`);
    };

    // Validate transition
    switch (this._state) {
      case SessionState.Initial:
        if (
          newState !== SessionState.Establishing &&
          newState !== SessionState.Established &&
          newState !== SessionState.Terminating &&
          newState !== SessionState.Terminated
        ) {
          invalidTransition();
        }
        break;
      case SessionState.Establishing:
        if (
          newState !== SessionState.Established &&
          newState !== SessionState.Terminating &&
          newState !== SessionState.Terminated
        ) {
          invalidTransition();
        }
        break;
      case SessionState.Established:
        if (
          newState !== SessionState.Terminating &&
          newState !== SessionState.Terminated
        ) {
          invalidTransition();
        }
        break;
      case SessionState.Terminating:
        if (
          newState !== SessionState.Terminated
        ) {
          invalidTransition();
        }
        break;
      case SessionState.Terminated:
        invalidTransition();
        break;
      default:
        throw new Error("Unrecognized state.");
    }

    // Transition
    this._state = newState;
    this.logger.log(`Session ${this.id} transitioned to state ${this._state}`);
    this._stateEventEmitter.emit("event", this._state);
  }
}
