import { EventEmitter } from "events";

import {
  AckableIncomingResponseWithSession,
  Body,
  fromBodyLegacy,
  getBody,
  Grammar,
  IncomingAckRequest,
  IncomingByeRequest,
  IncomingInfoRequest,
  IncomingInviteRequest,
  IncomingMessageRequest,
  IncomingNotifyRequest,
  IncomingPrackRequest,
  IncomingReferRequest,
  Logger,
  NameAddrHeader,
  OutgoingByeRequest,
  OutgoingInfoRequest,
  OutgoingInviteRequest,
  OutgoingInviteRequestDelegate,
  OutgoingMessageRequest,
  OutgoingReferRequest,
  OutgoingRequestDelegate,
  RequestOptions,
  Session as SessionDialog,
  SessionState as SessionDialogState,
  SignalingState,
  URI
} from "../core";
import { getReasonPhrase } from "../core/messages/utils";
import { AllowedMethods } from "../core/user-agent-core/allowed-methods";
import { Bye } from "./bye";
import { _makeEmitter, Emitter } from "./emitter";
import { ContentTypeUnsupportedError, RequestPendingError } from "./exceptions";
import { Info } from "./info";
import { Inviter } from "./inviter";
import { InviterOptions } from "./inviter-options";
import { Message } from "./message";
import { Notification } from "./notification";
import { Referral } from "./referral";
import { SessionByeOptions } from "./session-bye-options";
import { SessionDelegate } from "./session-delegate";
import {
  SessionDescriptionHandler,
  SessionDescriptionHandlerModifier,
  SessionDescriptionHandlerOptions
} from "./session-description-handler";
import { SessionDescriptionHandlerFactory } from "./session-description-handler-factory";
import { SessionInfoOptions } from "./session-info-options";
import { SessionInviteOptions } from "./session-invite-options";
import { SessionMessageOptions } from "./session-message-options";
import { SessionOptions } from "./session-options";
import { SessionReferOptions } from "./session-refer-options";
import { SessionState } from "./session-state";
import { UserAgent } from "./user-agent";

/**
 * A session provides real time communication between one or more participants.
 *
 * @remarks
 * The transport behaves in a deterministic manner according to the
 * the state defined in {@link SessionState}.
 * @public
 */
export abstract class Session {

  /**
   * Property reserved for use by instance owner.
   * @defaultValue `undefined`
   */
  public data: any;

  /**
   * The session delegate.
   * @defaultValue `undefined`
   */
  public delegate: SessionDelegate | undefined;

  /**
   * The identity of the local user.
   */
  public abstract readonly localIdentity: NameAddrHeader;

  /**
   * The identity of the remote user.
   */
  public abstract readonly remoteIdentity: NameAddrHeader;

  //
  // Public properties for internal use only
  //
  /** @internal */
  public _contact: string | undefined;
  /** @internal */
  public _referral: Inviter | undefined;
  /** @internal */
  public _replacee: Session | undefined;

  /**
   * Logger.
   */
  protected abstract logger: Logger;

  //
  // Protected properties for internal use only
  //
  /** @internal */
  protected abstract _id: string;
  /** @internal */
  protected _assertedIdentity: NameAddrHeader | undefined;
  /** @internal */
  protected _dialog: SessionDialog | undefined;
  /** @internal */
  protected _referralInviterOptions: InviterOptions | undefined; // FIXME: This is not getting set by Invitation
  /** @internal */
  protected _renderbody: string | undefined;
  /** @internal */
  protected _rendertype: string | undefined;
  /** @internal */
  protected _sessionDescriptionHandlerModifiers: Array<SessionDescriptionHandlerModifier> | undefined;
  /** @internal */
  protected _sessionDescriptionHandlerOptions: SessionDescriptionHandlerOptions | undefined;

  /** If defined, NOTIFYs associated with a REFER subscription are delivered here. */
  private onNotify: ((notification: Notification) => void) | undefined;
  /** True if there is a re-INVITE request outstanding. */
  private pendingReinvite: boolean = false;
  /** Dialogs session description handler. */
  private _sessionDescriptionHandler: SessionDescriptionHandler | undefined;
  /** Session state. */
  private _state: SessionState = SessionState.Initial;
  /** Session state emitter. */
  private _stateEventEmitter = new EventEmitter();
  /** User agent. */
  private _userAgent: UserAgent;

  /**
   * Constructor.
   * @param userAgent - User agent. See {@link UserAgent} for details.
   * @internal
   */
  protected constructor(userAgent: UserAgent, options: SessionOptions = {}) {
    this.delegate = options.delegate;
    this._userAgent = userAgent;
  }

  /**
   * Destructor.
   */
  public dispose(): Promise<void> {
    this.logger.log(`Session ${this.id} in state ${this._state} is being disposed`);

    // Remove from the user agent's session collection
    delete this.userAgent._sessions[this.id];

    // Dispose of dialog media
    if (this._sessionDescriptionHandler) {
      this._sessionDescriptionHandler.close();

      // TODO: The SDH needs to remain defined as it will be called after it is closed in cases
      // where an answer/offer arrives while the session is being torn down. There are a variety
      // of circumstances where this can happen - sending a BYE during a re-INVITE for example.
      // The code is currently written such that it lazily makes a new SDH when it needs one
      // and one is not yet defined. Thus if we undefined it here, it will currently make a
      // new one which is out of sync and then never gets cleaned up.
      //
      // The downside of leaving it defined are that calls this closed SDH will continue to be
      // made (think setDescription) and those should/will fail. These failures are handled, but
      // it would be nice to have it all coded up in a way where having an undefined SDH where
      // one is expected throws an error.
      //
      // this._sessionDescriptionHandler = undefined;
    }

    switch (this.state) {
      case SessionState.Initial:
        break; // the Inviter/Invitation sub class dispose method handles this case
      case SessionState.Establishing:
        break; // the Inviter/Invitation sub class dispose method handles this case
      case SessionState.Established:
        return new Promise((resolve, reject) => {
          this._bye({ // wait for the response to the BYE before resolving
            onAccept: () => resolve(),
            onRedirect: () => resolve(),
            onReject: () => resolve()
          });
        });
      case SessionState.Terminating:
        break; // nothing to be done
      case SessionState.Terminated:
        break; // nothing to be done
      default:
        throw new Error("Unknown state.");
    }

    return Promise.resolve();
  }

  /**
   * The asserted identity of the remote user.
   */
  public get assertedIdentity(): NameAddrHeader | undefined {
    return this._assertedIdentity;
  }

  /**
   * The confirmed session dialog.
   */
  public get dialog(): SessionDialog | undefined {
    return this._dialog;
  }

  /**
   * A unique identifier for this session.
   */
  public get id(): string {
    return this._id;
  }

  /**
   * The session being replace by this one.
   */
  public get replacee(): Session | undefined {
    return this._replacee;
  }

  /**
   * Session description handler.
   * @remarks
   * If `this` is an instance of `Invitation`,
   * `sessionDescriptionHandler` will be defined when the session state changes to "established".
   * If `this` is an instance of `Inviter` and an offer was sent in the INVITE,
   * `sessionDescriptionHandler` will be defined when the session state changes to "establishing".
   * If `this` is an instance of `Inviter` and an offer was not sent in the INVITE,
   * `sessionDescriptionHandler` will be defined when the session state changes to "established".
   * Otherwise `undefined`.
   */
  public get sessionDescriptionHandler(): SessionDescriptionHandler | undefined {
    return this._sessionDescriptionHandler;
  }

  /**
   * Session description handler factory.
   */
  public get sessionDescriptionHandlerFactory(): SessionDescriptionHandlerFactory {
    return this.userAgent.configuration.sessionDescriptionHandlerFactory;
  }

  /**
   * Session state.
   */
  public get state(): SessionState {
    return this._state;
  }

  /**
   * Session state change emitter.
   */
  public get stateChange(): Emitter<SessionState> {
    return _makeEmitter(this._stateEventEmitter);
  }

  /**
   * The user agent.
   */
  public get userAgent(): UserAgent {
    return this._userAgent;
  }

  /**
   * End the {@link Session}. Sends a BYE.
   * @param options - Options bucket. See {@link SessionByeOptions} for details.
   */
  public bye(options: SessionByeOptions = {}): Promise<OutgoingByeRequest> {
    let message = "Session.bye() may only be called if established session.";

    switch (this.state) {
      case SessionState.Initial:
        if (typeof (this as any).cancel === "function") {
          message += " However Inviter.invite() has not yet been called.";
          message += " Perhaps you should have called Inviter.cancel()?";
        } else if (typeof (this as any).reject === "function") {
          message += " However Invitation.accept() has not yet been called.";
          message += " Perhaps you should have called Invitation.reject()?";
        }
        break;
      case SessionState.Establishing:
        if (typeof (this as any).cancel === "function") {
          message += " However a dialog does not yet exist.";
          message += " Perhaps you should have called Inviter.cancel()?";
        } else if (typeof (this as any).reject === "function") {
          message += " However Invitation.accept() has not yet been called (or not yet resolved).";
          message += " Perhaps you should have called Invitation.reject()?";
        }
        break;
      case SessionState.Established:
        const requestDelegate = options.requestDelegate;
        const requestOptions = this.copyRequestOptions(options.requestOptions);
        return this._bye(requestDelegate, requestOptions);
      case SessionState.Terminating:
        message += " However this session is already terminating.";
        if (typeof (this as any).cancel === "function") {
          message += " Perhaps you have already called Inviter.cancel()?";
        } else if (typeof (this as any).reject === "function") {
          message += " Perhaps you have already called Session.bye()?";
        }
        break;
      case SessionState.Terminated:
        message += " However this session is already terminated.";
        break;
      default:
        throw new Error("Unknown state");
    }

    this.logger.error(message);
    return Promise.reject(new Error(`Invalid session state ${this.state}`));
  }

  /**
   * Share {@link Info} with peer. Sends an INFO.
   * @param options - Options bucket. See {@link SessionInfoOptions} for details.
   */
  public info(options: SessionInfoOptions = {}): Promise<OutgoingInfoRequest> {
    // guard session state
    if (this.state !== SessionState.Established) {
      const message = "Session.info() may only be called if established session.";
      this.logger.error(message);
      return Promise.reject(new Error(`Invalid session state ${this.state}`));
    }

    const requestDelegate = options.requestDelegate;
    const requestOptions = this.copyRequestOptions(options.requestOptions);
    return this._info(requestDelegate, requestOptions);
  }

  /**
   * Renegotiate the session. Sends a re-INVITE.
   * @param options - Options bucket. See {@link SessionInviteOptions} for details.
   */
  public invite(options: SessionInviteOptions = {}): Promise<OutgoingInviteRequest> {
    this.logger.log("Session.invite");
    if (this.state !== SessionState.Established) {
      return Promise.reject(new Error(`Invalid session state ${this.state}`));
    }
    if (this.pendingReinvite) {
      return Promise.reject(
        new RequestPendingError("Reinvite in progress. Please wait until complete, then try again."
      ));
    }
    this.pendingReinvite = true;

    const delegate: OutgoingInviteRequestDelegate = {
      onAccept: (response): void => {
        // A re-INVITE transaction has an offer/answer [RFC3264] exchange
        // associated with it.  The UAC (User Agent Client) generating a given
        // re-INVITE can act as the offerer or as the answerer.  A UAC willing
        // to act as the offerer includes an offer in the re-INVITE.  The UAS
        // (User Agent Server) then provides an answer in a response to the
        // re-INVITE.  A UAC willing to act as answerer does not include an
        // offer in the re-INVITE.  The UAS then provides an offer in a response
        // to the re-INVITE becoming, thus, the offerer.
        // https://tools.ietf.org/html/rfc6141#section-1
        const body = getBody(response.message);
        if (!body) {
          // No way to recover, so terminate session and mark as failed.
          this.logger.error("Received 2xx response to re-INVITE without a session description");
          this.ackAndBye(response, 400, "Missing session description");
          this.stateTransition(SessionState.Terminated);
          this.pendingReinvite = false;
          return;
        }

        if (options.withoutSdp) {
          // INVITE without SDP - set remote offer and send an answer in the ACK
          // FIXME: SDH options & SDH modifiers options are applied somewhat ambiguously
          //        This behavior was ported from legacy code and the issue punted down the road.
          const answerOptions = {
            sessionDescriptionHandlerOptions: options.sessionDescriptionHandlerOptions,
            sessionDescriptionHandlerModifiers: options.sessionDescriptionHandlerModifiers
          };
          this.setOfferAndGetAnswer(body, answerOptions)
            .then((answerBody) => {
              response.ack({ body: answerBody });
            })
            .catch((error: Error) => {
              // No way to recover, so terminate session and mark as failed.
              this.logger.error("Failed to handle offer in 2xx response to re-INVITE");
              this.logger.error(error.message);
              if (this.state === SessionState.Terminated) {
                // A BYE should not be sent if already terminated.
                // For example, a BYE may be sent/received while re-INVITE is outstanding.
                response.ack();
              } else {
                this.ackAndBye(response, 488, "Bad Media Description");
                this.stateTransition(SessionState.Terminated);
              }
            })
            .then(() => {
              this.pendingReinvite = false;
              if (options.requestDelegate && options.requestDelegate.onAccept) {
                options.requestDelegate.onAccept(response);
              }
            });
        } else {
          // INVITE with SDP - set remote answer and send an ACK
          // FIXME: SDH options & SDH modifiers options are applied somewhat ambiguously
          //        This behavior was ported from legacy code and the issue punted down the road.
          const answerOptions = {
            sessionDescriptionHandlerOptions: this._sessionDescriptionHandlerOptions,
            sessionDescriptionHandlerModifiers: this._sessionDescriptionHandlerModifiers
          };
          this.setAnswer(body, answerOptions)
            .then(() => {
              response.ack();
            })
            .catch((error: Error) => {
              // No way to recover, so terminate session and mark as failed.
              this.logger.error("Failed to handle answer in 2xx response to re-INVITE");
              this.logger.error(error.message);
              // A BYE should only be sent if session is not already terminated.
              // For example, a BYE may be sent/received while re-INVITE is outstanding.
              // The ACK needs to be sent regardless as it was not handled by the transaction.
              if (this.state !== SessionState.Terminated) {
                this.ackAndBye(response, 488, "Bad Media Description");
                this.stateTransition(SessionState.Terminated);
              } else {
                response.ack();
              }
            })
            .then(() => {
              this.pendingReinvite = false;
              if (options.requestDelegate && options.requestDelegate.onAccept) {
                options.requestDelegate.onAccept(response);
              }
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
        this.logger.warn("Received a non-2xx response to re-INVITE");
        this.pendingReinvite = false;
        if (options.withoutSdp) {
          if (options.requestDelegate && options.requestDelegate.onReject) {
            options.requestDelegate.onReject(response);
          }
        } else {
          this.rollbackOffer()
            .catch((error: Error) => {
              // No way to recover, so terminate session and mark as failed.
              this.logger.error("Failed to rollback offer on non-2xx response to re-INVITE");
              this.logger.error(error.message);
              // A BYE should only be sent if session is not already terminated.
              // For example, a BYE may be sent/received while re-INVITE is outstanding.
              // Note that the ACK was already sent by the transaction, so just need to send BYE.
              if (this.state !== SessionState.Terminated) {
                if (!this.dialog) {
                  throw new Error("Dialog undefined.");
                }
                const extraHeaders: Array<string> = [];
                extraHeaders.push("Reason: " + this.getReasonHeaderValue(500, "Internal Server Error"));
                this.dialog.bye(undefined, { extraHeaders });
                this.stateTransition(SessionState.Terminated);
              }
            })
            .then(() => {
              if (options.requestDelegate && options.requestDelegate.onReject) {
                options.requestDelegate.onReject(response);
              }
            });
        }
      },
      onTrying: (response): void => {
        return;
      }
    };

    const requestOptions = options.requestOptions || {};
    requestOptions.extraHeaders = (requestOptions.extraHeaders || []).slice();
    requestOptions.extraHeaders.push("Allow: " + AllowedMethods.toString());
    requestOptions.extraHeaders.push("Contact: " + this._contact);

    // Just send an INVITE with no sdp...
    if (options.withoutSdp) {
      if (!this.dialog) {
        this.pendingReinvite = false;
        throw new Error("Dialog undefined.");
      }
      return Promise.resolve(this.dialog.invite(delegate, requestOptions));
    }

    // Get an offer and send it in an INVITE
    // FIXME: SDH options & SDH modifiers options are applied somewhat ambiguously
    //        This behavior was ported from legacy code and the issue punted down the road.
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
        this.logger.error("Failed to send re-INVITE");
        this.pendingReinvite = false;
        throw error;
      });
  }

  /**
   * Deliver a {@link Message}. Sends a MESSAGE.
   * @param options - Options bucket. See {@link SessionMessageOptions} for details.
   */
  public message(options: SessionMessageOptions = {}): Promise<OutgoingMessageRequest> {
    // guard session state
    if (this.state !== SessionState.Established) {
      const message = "Session.message() may only be called if established session.";
      this.logger.error(message);
      return Promise.reject(new Error(`Invalid session state ${this.state}`));
    }

    const requestDelegate = options.requestDelegate;
    const requestOptions = this.copyRequestOptions(options.requestOptions);
    return this._message(requestDelegate, requestOptions);
  }

  /**
   * Proffer a {@link Referral}. Send a REFER.
   * @param referTo - The referral target. If a `Session`, a REFER w/Replaces is sent.
   * @param options - Options bucket. See {@link SessionReferOptions} for details.
   */
  public refer(referTo: URI | Session, options: SessionReferOptions = {}): Promise<OutgoingReferRequest> {
    // guard session state
    if (this.state !== SessionState.Established) {
      const message = "Session.refer() may only be called if established session.";
      this.logger.error(message);
      return Promise.reject(new Error(`Invalid session state ${this.state}`));
    }

    const requestDelegate = options.requestDelegate;
    const requestOptions = this.copyRequestOptions(options.requestOptions);
    requestOptions.extraHeaders = requestOptions.extraHeaders ?
      requestOptions.extraHeaders.concat(this.referExtraHeaders(this.referToString(referTo))) :
      this.referExtraHeaders(this.referToString(referTo));
    return this._refer(options.onNotify, requestDelegate, requestOptions);
  }

  /**
   * Send BYE.
   * @param delegate - Request delegate.
   * @param options - Request options bucket.
   * @internal
   */
  public _bye(delegate?: OutgoingRequestDelegate, options?: RequestOptions): Promise<OutgoingByeRequest> {
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
        this.stateTransition(SessionState.Terminating); // We're terminating
        return new Promise((resolve, reject) => {
          dialog.delegate = {
            // When ACK shows up, say BYE.
            onAck: (): void => {
              const request = dialog.bye(delegate, options);
              this.stateTransition(SessionState.Terminated);
              resolve(request);
            },
            // Or the server transaction times out before the ACK arrives.
            onAckTimeout: (): void => {
              const request = dialog.bye(delegate, options);
              this.stateTransition(SessionState.Terminated);
              resolve(request);
            }
          };
        });
      }
      case SessionDialogState.Confirmed: {
        const request = dialog.bye(delegate, options);
        this.stateTransition(SessionState.Terminated);
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
  public _info(delegate?: OutgoingRequestDelegate, options?: RequestOptions): Promise<OutgoingInfoRequest> {
    // Using core session dialog
    if (!this.dialog) {
      return Promise.reject(new Error("Session dialog undefined."));
    }
    return Promise.resolve(this.dialog.info(delegate, options));
  }

  /**
   * Send MESSAGE.
   * @param delegate - Request delegate.
   * @param options - Request options bucket.
   * @internal
   */
  public _message(delegate?: OutgoingRequestDelegate, options?: RequestOptions): Promise<OutgoingMessageRequest> {
    // Using core session dialog
    if (!this.dialog) {
      return Promise.reject(new Error("Session dialog undefined."));
    }
    return Promise.resolve(this.dialog.message(delegate, options));
  }

  /**
   * Send REFER.
   * @param onNotify - Notification callback.
   * @param delegate - Request delegate.
   * @param options - Request options bucket.
   * @internal
   */
  public _refer(
    onNotify?: (notification: Notification) => void,
    delegate?: OutgoingRequestDelegate,
    options?: RequestOptions
  ): Promise<OutgoingByeRequest> {
    // Using core session dialog
    if (!this.dialog) {
      return Promise.reject(new Error("Session dialog undefined."));
    }
    // If set, deliver any in-dialog NOTIFY requests here...
    this.onNotify = onNotify;
    return Promise.resolve(this.dialog.refer(delegate, options));
  }

  /**
   * Send ACK and then BYE. There are unrecoverable errors which can occur
   * while handling dialog forming and in-dialog INVITE responses and when
   * they occur we ACK the response and send a BYE.
   * Note that the BYE is sent in the dialog associated with the response
   * which is not necessarily `this.dialog`. And, accordingly, the
   * session state is not transitioned to terminated and session is not closed.
   * @param inviteResponse - The response causing the error.
   * @param statusCode - Status code for he reason phrase.
   * @param reasonPhrase - Reason phrase for the BYE.
   * @internal
   */
  protected ackAndBye(
    response: AckableIncomingResponseWithSession,
    statusCode?: number,
    reasonPhrase?: string
  ): void {
    response.ack();
    const extraHeaders: Array<string> = [];
    if (statusCode) {
      extraHeaders.push("Reason: " + this.getReasonHeaderValue(statusCode, reasonPhrase));
    }
    // Using the dialog session associate with the response (which might not be this.dialog)
    response.session.bye(undefined, { extraHeaders });
  }

  /**
   * Handle in dialog ACK request.
   * @internal
   */
  protected onAckRequest(request: IncomingAckRequest): void {
    this.logger.log("Session.onAckRequest");
    if (this.state !== SessionState.Established && this.state !== SessionState.Terminating) {
      this.logger.error(`ACK received while in state ${this.state}, dropping request`);
      return;
    }

    const dialog = this.dialog;
    if (!dialog) {
      throw new Error("Dialog undefined.");
    }

    switch (dialog.signalingState) {
      case SignalingState.Initial: {
        // State should never be reached as first reliable response must have answer/offer.
        // So we must have never has sent an offer.
        this.logger.error(`Invalid signaling state ${dialog.signalingState}.`);
        const extraHeaders = ["Reason: " + this.getReasonHeaderValue(488, "Bad Media Description")];
        dialog.bye(undefined, { extraHeaders });
        this.stateTransition(SessionState.Terminated);
        return;
      }
      case SignalingState.Stable: {
        // State we should be in.
        // Either the ACK has the answer that got us here, or we were in this state prior to the ACK.
        const body = getBody(request.message);
        // If the ACK doesn't have an answer, nothing to be done.
        if (!body) {
          return;
        }
        if (body.contentDisposition === "render") {
          this._renderbody = body.content;
          this._rendertype = body.contentType;
          return;
        }
        if (body.contentDisposition !== "session") {
          return;
        }
        // Received answer in ACK.
        const options = {
          sessionDescriptionHandlerOptions: this._sessionDescriptionHandlerOptions,
          sessionDescriptionHandlerModifiers: this._sessionDescriptionHandlerModifiers
        };
        this.setAnswer(body, options)
          .catch((error: Error) => {
            this.logger.error(error.message);
            const extraHeaders = ["Reason: " + this.getReasonHeaderValue(488, "Bad Media Description")];
            dialog.bye(undefined, { extraHeaders });
            this.stateTransition(SessionState.Terminated);
          });
        return;
      }
      case SignalingState.HaveLocalOffer: {
        // State should never be reached as local offer would be answered by this ACK.
        // So we must have received an ACK without an answer.
        this.logger.error(`Invalid signaling state ${dialog.signalingState}.`);
        const extraHeaders = ["Reason: " + this.getReasonHeaderValue(488, "Bad Media Description")];
        dialog.bye(undefined, { extraHeaders });
        this.stateTransition(SessionState.Terminated);
        return;
      }
      case SignalingState.HaveRemoteOffer: {
        // State should never be reached as remote offer would be answered in first reliable response.
        // So we must have never has sent an answer.
        this.logger.error(`Invalid signaling state ${dialog.signalingState}.`);
        const extraHeaders = ["Reason: " + this.getReasonHeaderValue(488, "Bad Media Description")];
        dialog.bye(undefined, { extraHeaders });
        this.stateTransition(SessionState.Terminated);
        return;
      }
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
    if (this.delegate && this.delegate.onBye) {
      const bye = new Bye(request);
      this.delegate.onBye(bye);
    } else {
      request.accept();
    }
    this.stateTransition(SessionState.Terminated);
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
      // FIXME: TODO: We should reject request...
      //
      // If a UA receives an INFO request associated with an Info Package that
      // the UA has not indicated willingness to receive, the UA MUST send a
      // 469 (Bad Info Package) response (see Section 11.6), which contains a
      // Recv-Info header field with Info Packages for which the UA is willing
      // to receive INFO requests.
      // https://tools.ietf.org/html/rfc6086#section-4.2.2
      request.accept();
    }
  }

  /**
   * Handle in dialog INVITE request.
   * @internal
   */
  protected onInviteRequest(request: IncomingInviteRequest): void {
    this.logger.log("Session.onInviteRequest");
    if (this.state !== SessionState.Established) {
      this.logger.error(`INVITE received while in state ${this.state}, dropping request`);
      return;
    }

    // TODO: would be nice to have core track and set the Contact header,
    // but currently the session which is setting it is holding onto it.
    const extraHeaders = ["Contact: " + this._contact];

    // Handle P-Asserted-Identity
    if (request.message.hasHeader("P-Asserted-Identity")) {
      const header = request.message.getHeader("P-Asserted-Identity");
      if (!header) {
        throw new Error("Header undefined.");
      }
      this._assertedIdentity = Grammar.nameAddrHeaderParse(header);
    }

    // FIXME: SDH options & SDH modifiers options are applied somewhat ambiguously
    //        This behavior was ported from legacy code and the issue punted down the road.
    const options = {
      sessionDescriptionHandlerOptions: this._sessionDescriptionHandlerOptions,
      sessionDescriptionHandlerModifiers: this._sessionDescriptionHandlerModifiers
    };
    this.generateResponseOfferAnswerInDialog(options)
      .then((body) => {
        const outgoingResponse = request.accept({ statusCode: 200, extraHeaders, body });
        if (this.delegate && this.delegate.onInvite) {
          this.delegate.onInvite(request.message, outgoingResponse.message, 200);
        }
      })
      .catch((error: Error) => {
        this.logger.error(error.message);
        this.logger.error("Failed to handle to re-INVITE request");
        if (!this.dialog) {
          throw new Error("Dialog undefined.");
        }
        this.logger.error(this.dialog.signalingState);
        // If we don't have a local/remote offer...
        if (this.dialog.signalingState === SignalingState.Stable) {
          const outgoingResponse = request.reject({ statusCode: 488 }); // Not Acceptable Here
          if (this.delegate && this.delegate.onInvite) {
            this.delegate.onInvite(request.message, outgoingResponse.message, 488);
          }
          return;
        }
        // Otherwise rollback
        this.rollbackOffer()
          .then(() => {
            const outgoingResponse = request.reject({ statusCode: 488 }); // Not Acceptable Here
            if (this.delegate && this.delegate.onInvite) {
              this.delegate.onInvite(request.message, outgoingResponse.message, 488);
            }
          })
          .catch ((errorRollback: Error) => {
            // No way to recover, so terminate session and mark as failed.
            this.logger.error(errorRollback.message);
            this.logger.error("Failed to rollback offer on re-INVITE request");
            const outgoingResponse = request.reject({ statusCode: 488 }); // Not Acceptable Here
            // A BYE should only be sent if session is not already terminated.
            // For example, a BYE may be sent/received while re-INVITE is outstanding.
            // Note that the ACK was already sent by the transaction, so just need to send BYE.
            if (this.state !== SessionState.Terminated) {
              if (!this.dialog) {
                throw new Error("Dialog undefined.");
              }
              const extraHeadersBye: Array<string> = [];
              extraHeadersBye.push("Reason: " + this.getReasonHeaderValue(500, "Internal Server Error"));
              this.dialog.bye(undefined, { extraHeaders });
              this.stateTransition(SessionState.Terminated);
            }
            if (this.delegate && this.delegate.onInvite) {
              this.delegate.onInvite(request.message, outgoingResponse.message, 488);
            }
          });
      });
  }

  /**
   * Handle in dialog MESSAGE request.
   * @internal
   */
  protected onMessageRequest(request: IncomingMessageRequest): void {
    this.logger.log("Session.onMessageRequest");
    if (this.state !== SessionState.Established) {
      this.logger.error(`MESSAGE received while in state ${this.state}, dropping request`);
      return;
    }

    if (this.delegate && this.delegate.onMessage) {
      const message = new Message(request);
      this.delegate.onMessage(message);
    } else {
      request.accept();
    }
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

    // If this a NOTIFY associated with the progress of a REFER,
    // look to delegate handling to the associated callback.
    if (this.onNotify) {
      const notification = new Notification(request);
      this.onNotify(notification);
      return;
    }

    // Otherwise accept the NOTIFY.
    if (this.delegate && this.delegate.onNotify) {
      const notification = new Notification(request);
      this.delegate.onNotify(notification);
    } else {
      request.accept();
    }
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

    // REFER is a SIP request and is constructed as defined in [1].  A REFER
    // request MUST contain exactly one Refer-To header field value.
    // https://tools.ietf.org/html/rfc3515#section-2.4.1
    if (!request.message.hasHeader("refer-to")) {
      this.logger.warn("Invalid REFER packet. A refer-to header is required. Rejecting.");
      request.reject();
      return;
    }

    const referral = new Referral(request, this);

    if (this.delegate && this.delegate.onRefer) {
      this.delegate.onRefer(referral);
    } else {
      this.logger.log("No delegate available to handle REFER, automatically accepting and following.");
      referral
        .accept()
        .then(() => referral
          .makeInviter(this._referralInviterOptions)
          .invite()
        )
        .catch((error: Error) => {
          // FIXME: logging and eating error...
          this.logger.error(error.message);
        });
    }
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
    // This is intentionally written very defensively. Don't trust SDH to behave.
    try {
      return sdh.getDescription(sdhOptions, sdhModifiers)
        .then((bodyAndContentType) => fromBodyLegacy(bodyAndContentType))
        .catch((error: any) => { // don't trust SDH to reject with Error
          this.logger.error("Session.getOffer: SDH getDescription rejected...");
          const e =  error instanceof Error ? error : new Error(error);
          this.logger.error(e.message);
          throw e;
        });
    } catch (error) { // don't trust SDH to throw an Error
      this.logger.error("Session.getOffer: SDH getDescription threw...");
      const e = error instanceof Error ? error : new Error(error);
      this.logger.error(e.message);
      return Promise.reject(e);
    }
  }

  /**
   * Rollback local/remote offer.
   * @internal
   */
  protected rollbackOffer(): Promise<void> {
    const sdh = this.setupSessionDescriptionHandler();
    if (!sdh.rollbackDescription) {
      return Promise.resolve();
    }
    // This is intentionally written very defensively. Don't trust SDH to behave.
    try {
      return sdh.rollbackDescription()
        .catch((error: any) => { // don't trust SDH to reject with Error
          this.logger.error("Session.rollbackOffer: SDH rollbackDescription rejected...");
          const e = error instanceof Error ? error : new Error(error);
          this.logger.error(e.message);
          throw e;
        });
    } catch (error) { // don't trust SDH to throw an Error
      this.logger.error("Session.rollbackOffer: SDH rollbackDescription threw...");
      const e = error instanceof Error ? error : new Error(error);
      this.logger.error(e.message);
      return Promise.reject(e);
    }
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
    // This is intentionally written very defensively. Don't trust SDH to behave.
    try {
      if (!sdh.hasDescription(answer.contentType)) {
        return Promise.reject(new ContentTypeUnsupportedError());
      }
    } catch (error) {
      this.logger.error("Session.setAnswer: SDH hasDescription threw...");
      const e = error instanceof Error ? error : new Error(error);
      this.logger.error(e.message);
      return Promise.reject(e);
    }
    try {
      return sdh.setDescription(answer.content, sdhOptions, sdhModifiers)
        .catch((error: any) => { // don't trust SDH to reject with Error
          this.logger.error("Session.setAnswer: SDH setDescription rejected...");
          const e = error instanceof Error ? error : new Error(error);
          this.logger.error(e.message);
          throw e;
        });
    } catch (error) { // don't trust SDH to throw an Error
      this.logger.error("Session.setAnswer: SDH setDescription threw...");
      const e = error instanceof Error ? error : new Error(error);
      this.logger.error(e.message);
      return Promise.reject(e);
    }
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
    // This is intentionally written very defensively. Don't trust SDH to behave.
    try {
      if (!sdh.hasDescription(offer.contentType)) {
        return Promise.reject(new ContentTypeUnsupportedError());
      }
    } catch (error) {
      this.logger.error("Session.setOfferAndGetAnswer: SDH hasDescription threw...");
      const e = error instanceof Error ? error : new Error(error);
      this.logger.error(e.message);
      return Promise.reject(e);
    }
    try {
      return sdh.setDescription(offer.content, sdhOptions, sdhModifiers)
        .then(() => sdh.getDescription(sdhOptions, sdhModifiers))
        .then((bodyAndContentType) => fromBodyLegacy(bodyAndContentType))
        .catch((error: any) => { // don't trust SDH to reject with Error
          this.logger.error("Session.setOfferAndGetAnswer: SDH setDescription or getDescription rejected...");
          const e = error instanceof Error ? error : new Error(error);
          this.logger.error(e.message);
          throw e;
        });
    } catch (error) { // don't trust SDH to throw an Error
      this.logger.error("Session.setOfferAndGetAnswer: SDH setDescription or getDescription threw...");
      const e = error instanceof Error ? error : new Error(error);
      this.logger.error(e.message);
      return Promise.reject(e);
    }
  }

  /**
   * SDH for confirmed dialog.
   * @internal
   */
  protected setSessionDescriptionHandler(sdh: SessionDescriptionHandler): void {
    if (this._sessionDescriptionHandler) {
      throw new Error("Session description handler defined.");
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

    // Dispose
    if (newState === SessionState.Terminated) {
      this.dispose();
    }
  }

  private copyRequestOptions(requestOptions: RequestOptions = {}): RequestOptions {
    const extraHeaders = requestOptions.extraHeaders ? requestOptions.extraHeaders.slice() : undefined;
    const body = requestOptions.body ?
      {
        contentDisposition: requestOptions.body.contentDisposition || "render",
        contentType: requestOptions.body.contentType || "text/plain",
        content: requestOptions.body.content || ""
      } : undefined;
    return {
      extraHeaders,
      body
    };
  }

  private getReasonHeaderValue(code: number, reason?: string): string {
    const cause = code;
    let text = getReasonPhrase(code);
    if (!text && reason) {
      text = reason;
    }
    return "SIP;cause=" + cause + ';text="' + text + '"';
  }

  private referExtraHeaders(referTo: string): Array<string> {
    const extraHeaders: Array<string> = [];
    extraHeaders.push("Referred-By: <" + this.userAgent.configuration.uri + ">");
    extraHeaders.push("Contact: " + this._contact);
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
    extraHeaders.push("Refer-To: " + referTo);
    return extraHeaders;
  }

  private referToString(target: URI | Session): string {
    let referTo: string;
    if (target instanceof URI) {
      // REFER without Replaces (Blind Transfer)
      referTo = target.toString();
    } else {
      // REFER with Replaces (Attended Transfer)
      if (!target.dialog) {
        throw new Error("Dialog undefined.");
      }
      const displayName = target.remoteIdentity.friendlyName;
      const remoteTarget = target.dialog.remoteTarget.toString();
      const callId = target.dialog.callId;
      const remoteTag = target.dialog.remoteTag;
      const localTag = target.dialog.localTag;
      const replaces = encodeURIComponent(`${callId};to-tag=${remoteTag};from-tag=${localTag}`);
      referTo = `"${displayName}" <${remoteTarget}?Replaces=${replaces}>`;
    }
    return referTo;
  }
}
