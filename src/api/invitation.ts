import { C } from "../Constants";
import {
  Body,
  Exception,
  fromBodyLegacy,
  getBody,
  Grammar,
  IncomingInviteRequest,
  IncomingPrackRequest,
  IncomingRequestMessage,
  IncomingResponseMessage,
  InviteServerTransaction,
  NameAddrHeader,
  NonInviteServerTransaction,
  OutgoingResponse,
  OutgoingResponseWithSession,
  SignalingState,
  Timers
} from "../core";
import { SessionStatus, TypeStrings } from "../Enums";
import { Exceptions } from "../Exceptions";
import { Utils } from "../Utils";

import { InvitationAcceptOptions } from "./invitation-accept-options";
import { InvitationProgressOptions } from "./invitation-progress-options";
import { InvitationRejectOptions } from "./invitation-reject-options";
import { Session } from "./session";
import {
  SessionDescriptionHandlerModifier,
  SessionDescriptionHandlerOptions
} from "./session-description-handler";
import { SessionState } from "./session-state";
import { UserAgent } from "./user-agent";

type ResolveFunction = () => void;
type RejectFunction = (reason: Error) => void;

/**
 * An invitation is an offer to establish a {@link Session} (incoming INVITE).
 * @public
 */
export class Invitation extends Session {

  // BEGIN ServerContext Interface
  // public type: TypeStrings;
  // public ua: UA;
  // public logger: Logger;
  // public data: any = {};
  // public method = C.INVITE;
  /** @internal */
  public body: string | undefined = undefined;
  // public contentType: string | undefined;
  /** @internal */
  public localIdentity: NameAddrHeader;
  /** @internal */
  public remoteIdentity: NameAddrHeader;
  // public assertedIdentity: NameAddrHeader | undefined;
  /** @internal */
  public transaction!: InviteServerTransaction | NonInviteServerTransaction; // not used
  // public accept: (options: any = {}) => any;
  // public progress: (options: any = {}) => any;
  // public reject: (options: any = {}) => any;
  // public reply!: (options: any) => any; // not used
  // public onRequestTimeout: () => void;
  // public onTransportError: () => void;
  // END ServerContext interface

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
  private _canceled = false;

  private rseq = Math.floor(Math.random() * 10000);

  private waitingForPrackPromise: Promise<void> | undefined;
  private waitingForPrackResolve: ResolveFunction | undefined;
  private waitingForPrackReject: RejectFunction | undefined;

  /** @internal */
  constructor(userAgent: UserAgent, private incomingInviteRequest: IncomingInviteRequest) {
    super(userAgent);

    // ServerContext properties
    this.type = TypeStrings.InviteServerContext;
    this.logger = userAgent.getLogger("sip.invitation", this.id);
    if (this.request.body) {
      this.body = this.request.body;
    }
    if (this.request.hasHeader("Content-Type")) {
      this.contentType = this.request.getHeader("Content-Type");
    }
    this.localIdentity = this.request.to;
    this.remoteIdentity = this.request.from;
    const hasAssertedIdentity = this.request.hasHeader("P-Asserted-Identity");
    if (hasAssertedIdentity) {
      const assertedIdentity: string | undefined = this.request.getHeader("P-Asserted-Identity");
      if (assertedIdentity) {
        this.assertedIdentity = Grammar.nameAddrHeaderParse(assertedIdentity);
      }
    }

    // Session properties
    this.contact = this.userAgent.contact.toString();
    this.fromTag = this.request.fromTag;
    this.id = this.request.callId + this.fromTag;
    // this.modifiers =
    // this.onInfo =
    // this.passedOptions =
    const contentDisposition = this.request.parseHeader("Content-Disposition");
    if (contentDisposition && contentDisposition.type === "render") {
      this.renderbody = this.request.body;
      this.rendertype = this.request.getHeader("Content-Type");
    }

    // FIXME: This is being done twice...
    // Update logger
    this.logger = userAgent.getLogger("sip.invitation", this.id);

    // Update status
    this.status = SessionStatus.STATUS_INVITE_RECEIVED;

    // Save the session into the ua sessions collection.
    this.userAgent.sessions[this.id] = this;

    // Set 100rel if necessary
    const request = this.request;
    const set100rel = (header: string, relSetting: C.supported) => {
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

    // Update status again - sigh
    this.status = SessionStatus.STATUS_WAITING_FOR_ANSWER;

    // Set userNoAnswerTimer
    this.userNoAnswerTimer = setTimeout(() => {
      // FIXME: refactor the following bit
      // transition state
      this.stateTransition(SessionState.Terminated);
      incomingInviteRequest.reject({ statusCode: 408 });
      this.failed(request, C.causes.NO_ANSWER);
      this.terminated(request, C.causes.NO_ANSWER);
    }, this.userAgent.configuration.noAnswerTimeout || 60000);

    // Set expiresTimer (RFC3261 13.3.1)
    if (request.hasHeader("expires")) {
      const expires: number = Number(request.getHeader("expires") || 0) * 1000;
      this.expiresTimer = setTimeout(() => {
        if (this.status === SessionStatus.STATUS_WAITING_FOR_ANSWER) {
          // FIXME: refactor the following bit
          // transition state
          this.stateTransition(SessionState.Terminated);
          incomingInviteRequest.reject({ statusCode: 487 });
          this.failed(request, C.causes.EXPIRES);
          this.terminated(request, C.causes.EXPIRES);
        }
      }, expires);
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
   * @internal
   */
  get autoSendAnInitialProvisionalResponse(): boolean {
    return this.rel100 === C.supported.REQUIRED ? false : true;
  }

  /** Incoming MESSAGE request message. */
  get request(): IncomingRequestMessage {
    return this.incomingInviteRequest.message;
  }

  /**
   * Accept the invitation.
   * @remarks
   * Accept the incoming INVITE request to start a Session.
   * Replies to the INVITE request with a 200 Ok response.
   * @param options - Options bucket.
   */
  public accept(options: InvitationAcceptOptions = {}): Promise<void> {
    this.logger.log("Invitation.accept");

    // validate state
    if (this.state !== SessionState.Initial) {
      const error = new Error(`Invalid session state ${this.state}`);
      this.logger.error(error.message);
      return Promise.reject(error);
    }

    // transition state
    this.stateTransition(SessionState.Establishing);

    return this._accept(options)
      .then(({ message, session }) => {
        session.delegate = {
          onAck: (ackRequest): void => this.onAckRequest(ackRequest),
          onAckTimeout: (): void => this.onAckTimeout(),
          onBye: (byeRequest): void => this.onByeRequest(byeRequest),
          onInfo: (infoRequest): void => this.onInfoRequest(infoRequest),
          onInvite: (inviteRequest): void => this.onInviteRequest(inviteRequest),
          onNotify: (notifyRequest): void => this.onNotifyRequest(notifyRequest),
          onPrack: (prackRequest): void => this.onPrackRequest(prackRequest),
          onRefer: (referRequest): void => this.onReferRequest(referRequest)
        };
        this.dialog = session;
        this.stateTransition(SessionState.Established);
        // legacy
        this.accepted(message, Utils.getReasonPhrase(200));
      })
      .catch((error) => {
        this.onContextError(error);
        // FIXME: Assuming error due to async race on CANCEL and eating error.
        if (!this._canceled) {
          throw error;
        }
      });
  }

  /**
   * Indicate progress processing the invitation.
   * @remarks
   * Report progress to the the caller.
   * Replies to the INVITE request with a 1xx provisional response.
   * @param options - Options bucket.
   */
  public progress(options: InvitationProgressOptions = {}): Promise<void> {
    this.logger.log("Invitation.progress");

    // validate state
    if (this.state !== SessionState.Initial) {
      const error = new Error(`Invalid session state ${this.state}`);
      this.logger.error(error.message);
      return Promise.reject(error);
    }

    // Ported
    const statusCode = options.statusCode || 180;
    if (statusCode < 100 || statusCode > 199) {
      throw new TypeError("Invalid statusCode: " + statusCode);
    }
    // Ported
    if (this.status === SessionStatus.STATUS_TERMINATED) {
      this.logger.warn("Unexpected call for progress while terminated, ignoring");
      return Promise.resolve();
    }
    // Added
    if (this.status === SessionStatus.STATUS_ANSWERED) {
      this.logger.warn("Unexpected call for progress while answered, ignoring");
      return Promise.resolve();
    }
    // Added
    if (this.status === SessionStatus.STATUS_ANSWERED_WAITING_FOR_PRACK) {
      this.logger.warn("Unexpected call for progress while answered (waiting for prack), ignoring");
      return Promise.resolve();
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
      return Promise.resolve();
    }

    // Ported
    if (options.statusCode === 100) {
      try {
        this.incomingInviteRequest.trying();
      } catch (error) {
        this.onContextError(error);
        // FIXME: Assuming error due to async race on CANCEL and eating error.
        if (!this._canceled) {
          return Promise.reject(error);
        }
      }
      return Promise.resolve();
    }

    // Standard provisional response.
    if (
      !(this.rel100 === C.supported.REQUIRED) &&
      !(this.rel100 === C.supported.SUPPORTED && options.rel100) &&
      !(this.rel100 === C.supported.SUPPORTED && this.userAgent.configuration.rel100 === C.supported.REQUIRED)
    ) {
      return this._progress(options)
        .then((response) => { return; })
        .catch((error) => {
          this.onContextError(error);
          // FIXME: Assuming error due to async race on CANCEL and eating error.
          if (!this._canceled) {
            throw error;
          }
        });
    }

    // Reliable provisional response.
    return this._progressReliableWaitForPrack(options)
      .then((response) => { return; })
      .catch((error) => {
        this.onContextError(error);
        // FIXME: Assuming error due to async race on CANCEL and eating error.
        if (!this._canceled) {
          throw error;
        }
      });
  }

  /**
   * Reject the invitation.
   * @param options - Options bucket.
   */
  public reject(options: InvitationRejectOptions = {}): Promise<void> {
    this.logger.log("Invitation.reject");

    // validate state
    if (this.state !== SessionState.Initial) {
      const error = new Error(`Invalid session state ${this.state}`);
      this.logger.error(error.message);
      return Promise.reject(error);
    }

    // transition state
    this.stateTransition(SessionState.Terminated);

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
      this.incomingInviteRequest.redirect([], { statusCode, reasonPhrase, extraHeaders, body }) :
      this.incomingInviteRequest.reject({ statusCode, reasonPhrase, extraHeaders, body });

    this.emit("rejected", response.message, reasonPhrase);
    this.emit("failed", response.message, reasonPhrase);

    this.terminated();
    return Promise.resolve();
  }

  /**
   * FIXME: Kill this legacy emission
   * @internal
   */
  public byePending(): void {
    this.emit("bye", this.request);
    super.byePending();
  }

  /**
   * Handle CANCEL request.
   * @param message - CANCEL message.
   * @internal
   */
  public onCancel(message: IncomingRequestMessage): void {
    this.logger.log("Invitation.onCancel");

    // validate state
    if (
      this.state !== SessionState.Initial &&
      this.state !== SessionState.Establishing
    ) {
      this.logger.error(`CANCEL received while in state ${this.state}, dropping request`);
      return;
    }

    // transition state
    this.stateTransition(SessionState.Terminated);

    // reject INVITE with 487 status code
    this.incomingInviteRequest.reject({ statusCode: 487 });
    this.canceled();
    this.rejected(message, C.causes.CANCELED);
    this.failed(message, C.causes.CANCELED);
    this.terminated(message, C.causes.CANCELED);
  }

  /**
   * Called when session canceled.
   * @internal
   */
  protected canceled(): void {
    this._canceled = true;
    super.canceled();
  }

  /**
   * Called when session terminated.
   * Using it here just for the PRACK timeout.
   * @internal
   */
  protected terminated(message?: IncomingResponseMessage | IncomingRequestMessage, cause?: string): void {
    this.prackNeverArrived();
    super.terminated(message, cause);
  }

  /**
   * A version of `accept` which resolves a session when the 200 Ok response is sent.
   * @param options - Options bucket.
   */
  private _accept(options: InvitationAcceptOptions = {}): Promise<OutgoingResponseWithSession> {
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
          clearTimeout(this.userNoAnswerTimer); // Ported
        })
        .then(() => this.generateResponseOfferAnswer(this.incomingInviteRequest, options))
        .then((body) => this.incomingInviteRequest.accept({ statusCode: 200, body }));
    }

    // Ported
    if (this.status === SessionStatus.STATUS_WAITING_FOR_ANSWER) {
      this.status = SessionStatus.STATUS_ANSWERED;
    } else {
      return Promise.reject(new Exceptions.InvalidStateError(this.status));
    }

    this.status = SessionStatus.STATUS_ANSWERED;
    clearTimeout(this.userNoAnswerTimer); // Ported
    return this.generateResponseOfferAnswer(this.incomingInviteRequest, options)
      .then((body) => this.incomingInviteRequest.accept({ statusCode: 200, body }));
  }

  /**
   * A version of `progress` which resolves when the provisional response is sent.
   * @param options - Options bucket.
   */
  private _progress(options: InvitationProgressOptions = {}): Promise<OutgoingResponseWithSession> {
    // Ported
    const statusCode = options.statusCode || 180;
    const reasonPhrase = options.reasonPhrase;
    const extraHeaders = (options.extraHeaders || []).slice();
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
      const progressResponse = this.incomingInviteRequest.progress({ statusCode, reasonPhrase, extraHeaders, body });
      this.emit("progress", progressResponse.message, reasonPhrase); // Ported
      this.dialog = progressResponse.session;
      return Promise.resolve(progressResponse);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * A version of `progress` which resolves when the provisional response with sdp is sent.
   * @param options - Options bucket.
   */
  private _progressWithSDP(options: InvitationProgressOptions = {}): Promise<OutgoingResponseWithSession> {
    const statusCode = options.statusCode || 183;
    const reasonPhrase = options.reasonPhrase;
    const extraHeaders = (options.extraHeaders || []).slice();

    // Get an offer/answer and send a reply.
    return this.generateResponseOfferAnswer(this.incomingInviteRequest, options)
      .then((body) => this.incomingInviteRequest.progress({ statusCode, reasonPhrase, extraHeaders, body }))
      .then((progressResponse) => {
        this.emit("progress", progressResponse.message, reasonPhrase); // Ported
        this.dialog = progressResponse.session;
        return progressResponse;
      });
  }

  /**
   * A version of `progress` which resolves when the reliable provisional response is sent.
   * @param options - Options bucket.
   */
  private _progressReliable(options: InvitationProgressOptions = {}): Promise<OutgoingResponseWithSession> {
    options.extraHeaders = (options.extraHeaders || []).slice();
    options.extraHeaders.push("Require: 100rel");
    options.extraHeaders.push("RSeq: " + Math.floor(Math.random() * 10000));
    return this._progressWithSDP(options);
  }

  /**
   * A version of `progress` which resolves when the reliable provisional response is acknowledged.
   * @param options - Options bucket.
   */
  private _progressReliableWaitForPrack(options: InvitationProgressOptions = {}): Promise<{
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
      return this.generateResponseOfferAnswer(this.incomingInviteRequest, options)
        .then((offerAnswer) => {
          body = offerAnswer;
          return this.incomingInviteRequest.progress({ statusCode, reasonPhrase, extraHeaders, body });
        })
        .then((progressResponse) => {
          this.emit("progress", progressResponse.message, reasonPhrase); // Ported
          this.dialog = progressResponse.session;

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
              this.incomingInviteRequest.reject({ statusCode: 504 });
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
              this.incomingInviteRequest.progress({ statusCode, reasonPhrase, extraHeaders, body });
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

  private handlePrackOfferAnswer(
    request: IncomingPrackRequest,
    options: {
      sessionDescriptionHandlerOptions?: SessionDescriptionHandlerOptions,
      modifiers?: Array<SessionDescriptionHandlerModifier>
    }
  ): Promise<Body | undefined> {
    if (!this.dialog) {
      throw new Error("Dialog undefined.");
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
    switch (this.dialog.signalingState) {
      case SignalingState.Initial:
        // State should never be reached as first reliable provisional response must have answer/offer.
        throw new Error(`Invalid signaling state ${this.dialog.signalingState}.`);
      case SignalingState.Stable:
        // Receved answer.
        return this.setAnswer(body, options).then(() => undefined);
      case SignalingState.HaveLocalOffer:
        // State should never be reached as local offer would be answered by this PRACK
        throw new Error(`Invalid signaling state ${this.dialog.signalingState}.`);
      case SignalingState.HaveRemoteOffer:
        // Received offer, generate answer.
        return this.setOfferAndGetAnswer(body, options);
      case SignalingState.Closed:
        throw new Error(`Invalid signaling state ${this.dialog.signalingState}.`);
      default:
        throw new Error(`Invalid signaling state ${this.dialog.signalingState}.`);
    }
  }

  /**
   * Callback for when ACK for a 2xx response is never received.
   * @param session - Session the ACK never arrived for.
   */
  private onAckTimeout(): void {
    this.logger.log("Invitation.onAckTimeout");
    if (!this.dialog) {
      throw new Error("Dialog undefined.");
    }
    this.logger.log("No ACK received for an extended period of time, terminating session");
    this.dialog.bye();
    this.terminated(undefined, C.causes.NO_ACK);
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
      this.incomingInviteRequest.reject({ statusCode }); // "Temporarily Unavailable"
      this.failed(this.incomingInviteRequest.message, error.message);
      this.terminated(this.incomingInviteRequest.message, error.message);
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
}
