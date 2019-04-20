import {
  Body,
  fromBodyLegacy,
  fromBodyObj,
  getBody,
  IncomingInviteRequest,
  IncomingPrackRequest,
  IncomingResponse,
  OutgoingRequest,
  OutgoingRequestDelegate,
  OutgoingResponse,
  OutgoingResponseWithSession,
  RequestOptions,
  toBodyObj
} from "../Core/messages";
import { SessionState, SignalingState } from "../Core/session";

import { C } from "../Constants";
import { SessionStatus } from "../Enums";
import { Exception, Exceptions } from "../Exceptions";
import { InviteServerContext as InviteServerContextBase } from "../Session";
import {
  SessionDescriptionHandler,
  SessionDescriptionHandlerModifiers,
  SessionDescriptionHandlerOptions
} from "../session-description-handler";
import {
  IncomingRequest as IncomingRequestMessage,
  IncomingResponse as IncomingResponseMessage
} from "../SIPMessage";
import { Timers } from "../Timers";
import { UA } from "../UA";
import { Utils } from "../Utils";

type ResolveFunction = () => void;
type RejectFunction = (reason: Error) => void;

export class InviteServerContext extends InviteServerContextBase {

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

  private waitingForPrackPromise: Promise<void> | undefined;
  private waitingForPrackResolve: ResolveFunction | undefined;
  private waitingForPrackReject: RejectFunction | undefined;

  constructor(ua: UA, private incomingInviteRequest: IncomingInviteRequest) {
    super(ua, incomingInviteRequest.message);
    // Set the toTag on the incoming request to the toTag which
    // will be used in the response to the incoming request!!!
    // FIXME: HACK: This is a hack to port an existing behavior.
    // The behavior being ported appears to be a hack itself,
    // so this is a hack to port a hack. At least one test spec
    // relies on it (which is yet another hack). See the parent
    // constructor for where this is done originally.
    this.request.toTag = (incomingInviteRequest as any).toTag;
  }

  ////
  // BEGIN Session Overrides - roadmap is to remove all of these, but for now...
  //

  // Override Session member we want to make sure we are not using.
  public acceptAndTerminate(message: IncomingResponseMessage, statusCode?: number, reasonPhrase?: string): this {
    throw new Error("Method not utilized by user agent core.");
  }

  // Override Session member we want to make sure we are not using.
  public createDialog(
    message: IncomingRequestMessage | IncomingResponseMessage, type: "UAS" | "UAC", early: boolean = false
  ): boolean {
    throw new Error("Method not utilized by user agent core.");
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
      options.body = fromBodyObj(options.body);
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

  // Override Session member we want to make sure we are not using.
  public setInvite2xxTimer(message: IncomingRequestMessage, body?: { body: string; contentType: string }): void {
    throw new Error("Method not utilized by user agent core.");
  }

  // Override Session member we want to make sure we are not using.
  public setACKTimer(): void {
    // throw new Error("Method not utilized by user agent core.");
    // FIXME: TODO: This gets called by receiveReinvite().
    // Just prevent it from doing anything for now until we stop calling that.
    return;
  }

  // END Session Overrides
  //////

  /**
   * Accept the incoming INVITE request to start a Session.
   * Replies to the INVITE request with a 200 Ok response.
   * @param options Options bucket.
   */
  public accept(options: InviteServerContextBase.Options = {}): this {
    this._accept(options)
      .then(({ message, session }) => {
        session.delegate = {
          onAck: (ackRequest): void => this.receiveRequest(ackRequest.message),
          onAckTimeout: (): void => this.onAckTimeout(),
          onBye: (byeRequest): void => this.receiveRequest(byeRequest.message),
          onInfo: (infoRequest): void => this.receiveRequest(infoRequest.message),
          onInvite: (inviteRequest): void => this.receiveRequest(inviteRequest.message),
          onNotify: (notifyRequest): void => this.receiveRequest(notifyRequest.message),
          onPrack: (prackRequest): void => this.receiveRequest(prackRequest.message),
          onRefer: (referRequest): void => this.receiveRequest(referRequest.message)
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
  public progress(options: InviteServerContextBase.Options = {}): this {
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
        this.incomingInviteRequest.trying();
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
   * Reject an unaccepted incoming INVITE request.
   * @param options Options bucket.
   */
  public reject(options: InviteServerContextBase.Options = {}): this {
    return super.reject(options);
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

    // We don't yet have a confirmed dialog, so reject request.
    if (!this.session) {
      this.reject(options);
      return this;
    }

    // We have a confirmed dialog and we're not waiting for an ACK.
    if (this.session.sessionState === SessionState.Confirmed) {
      this.bye(options);
      return this;
    }

    // We have a confirmed dialog and we're waiting for an ACK.
    if (this.session.sessionState === SessionState.AckWait) {
      this.session.delegate = {
        // When ACK shows up, say BYE.
        onAck: (): void => {
          this.bye();
        },
        // Or the server transaction times out before the ACK arrives.
        onAckTimeout: (): void => {
          this.bye();
        }
      };
    }

    // Ported
    this.emit("bye", this.request);
    this.terminated();

    return this;
  }

  protected generateResponseOfferAnswer(
    options: {
      sessionDescriptionHandlerOptions?: SessionDescriptionHandlerOptions,
      modifiers?: SessionDescriptionHandlerModifiers
    }
  ): Promise<Body | undefined> {
    if (!this.session) {
      const body = getBody(this.incomingInviteRequest.message);
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
  private _accept(options: InviteServerContextBase.Options = {}): Promise<OutgoingResponseWithSession> {
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
        .then((body) => this.incomingInviteRequest.accept({ statusCode: 200, body }));
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
      .then((body) => this.incomingInviteRequest.accept({ statusCode: 200, body }));
  }

  /**
   * A version of `progress` which resolves when the provisional response is sent.
   * @param options Options bucket.
   * @throws {ClosedSessionDescriptionHandlerError} The session description handler closed before method completed.
   * @throws {TransactionStateError} The transaction state does not allow for `progress()` to be called.
   *                                 Note that the transaction state can change while this call is in progress.
   */
  private _progress(options: InviteServerContextBase.Options = {}): Promise<OutgoingResponseWithSession> {
    // Ported
    const statusCode = options.statusCode || 180;
    const reasonPhrase = options.reasonPhrase;
    const extraHeaders: Array<string> = (options.extraHeaders || []).slice();
    const body = options.body ? fromBodyLegacy(options.body) : undefined;
    try {
      const progressResponse = this.incomingInviteRequest.progress({ statusCode, reasonPhrase, extraHeaders, body });
      this.emit("progress", progressResponse.message, reasonPhrase); // Ported
      this.session = progressResponse.session;
      return Promise.resolve(progressResponse);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * A version of `progress` which resolves when the reliable provisional response is sent.
   * @param options Options bucket.
   * @throws {ClosedSessionDescriptionHandlerError} The session description handler closed before method completed.
   * @throws {TransactionStateError} The transaction state does not allow for `progress()` to be called.
   *                                 Note that the transaction state can change while this call is in progress.
   */
  private _reliableProgress(options: InviteServerContextBase.Options = {}): Promise<OutgoingResponseWithSession> {
    const statusCode = options.statusCode || 183;
    const reasonPhrase = options.reasonPhrase;
    const extraHeaders: Array<string> = (options.extraHeaders || []).slice();
    extraHeaders.push("Require: 100rel");
    extraHeaders.push("RSeq: " + Math.floor(Math.random() * 10000));

    // Get an offer/answer and send a reply.
    return this.generateResponseOfferAnswer(options)
      .then((body) => this.incomingInviteRequest.progress({ statusCode, reasonPhrase, extraHeaders, body }))
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
  private _reliableProgressWaitForPrack(options: InviteServerContextBase.Options = {}): Promise<{
    prackRequest: IncomingPrackRequest,
    prackResponse: OutgoingResponse,
    progressResponse: OutgoingResponseWithSession,
  }> {
    const statusCode = options.statusCode || 183;
    const reasonPhrase = options.reasonPhrase;
    const extraHeaders: Array<string> = (options.extraHeaders || []).slice();
    extraHeaders.push("Require: 100rel");
    extraHeaders.push("RSeq: " + Math.floor(Math.random() * 10000));
    let body: Body | undefined;

    // Ported - set status.
    this.status = SessionStatus.STATUS_WAITING_FOR_PRACK;

    return new Promise((resolve, reject) => {
      let waitingForPrack = true;
      return this.generateResponseOfferAnswer(options)
        .then((offerAnswer) => {
          body = offerAnswer;
          return this.incomingInviteRequest.progress({ statusCode, reasonPhrase, extraHeaders, body });
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
    if (error instanceof Exception) { // There might be interest in catching these Exceptions.
      if (error instanceof Exceptions.SessionDescriptionHandlerError) {
        this.logger.error(error.message);
        if (error.error) {
          this.logger.error(error.error);
        }
      } else if (error instanceof Exception) {
        this.logger.error(error.message);
      }
    } else if (error instanceof Exceptions.TerminatedSessionError) {
      // PRACK never arrived, so we timed out waiting for it.
      this.logger.warn("Incoming session terminated while waiting for PRACK.");
    } else if (error instanceof Error) { // Other Errors hould go uncaught.
      this.logger.error(error.message);
    } else {
      // We don't actually know what a session description handler implementation might throw
      // our way, so as a last resort, just assume we are getting an "any" and log it.
      this.logger.error("An error occurred in the session description handler.");
      this.logger.error(error as any);
    }
    try {
      this.incomingInviteRequest.reject({ statusCode: 480 }); // "Temporarily Unavailable"
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
      .then((bodyObj) => fromBodyObj(bodyObj));
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
      .then((bodyObj) => fromBodyObj(bodyObj));
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
