import {
  Body,
  fromBodyLegacy,
  fromBodyObj,
  getBody,
  IncomingAckRequest,
  IncomingInviteRequest,
  IncomingPrackRequest,
  IncomingResponse,
  OutgoingRequest,
  OutgoingRequestDelegate,
  RequestOptions
} from "../Core/messages";
import { SessionState, SignalingState } from "../Core/session";

import { C } from "../Constants";
import { SessionStatus } from "../Enums";
import { Exceptions } from "../Exceptions";
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
   * @throws {Exceptions.SessionDescriptionHandlerError} On failure to get/set session description.
   * @throws {Exceptions.TerminatedSessionError} The session terminated before being accepted (i.e. cancel arrived).
   */
  public accept(options: InviteServerContextBase.Options = {}): this {
    // FIXME: Ported - callback for in dialog INFO requests.
    // Turns out accept() can be called more than once if we are waiting
    // for a PRACK in which case "options" get completely tossed away.
    // So this is broken in that case (and potentially other uses of options).
    // Tempted to just try to fix it now, but leaving it broken for the moment.
    this.onInfo = options.onInfo;

    // Helper function to send the 2xx response.
    const reply = (body?: Body) => {
      const statusCode = 200;
      const { message, session } = this.incomingInviteRequest.accept({ statusCode, body });
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
      this.status = SessionStatus.STATUS_WAITING_FOR_ACK; // FIXME: This assumes correct state after async call.
      this.accepted(message, Utils.getReasonPhrase(200));
    };

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
      this.waitForArrivalOfPrack()
        .then(() => {
          this.status = SessionStatus.STATUS_ANSWERED;
          clearTimeout(this.timers.userNoAnswerTimer); // Ported
          this.generateResponseOfferAnswer(options)
            .then(reply)
            .catch((error: Error) => {
              // FIXME: TODO: Nothing to be done with exceptions until the library interface is modified.
              // Hopefully this method will soon return a Promise instead of this.
              throw error; // For now, throw uncatchable exceptions. :(
            });
        })
        .catch((error: Error) => {
          if (error instanceof Exceptions.TerminatedSessionError) {
            // PRACK never arrived, so we timed out waiting for it.
            this.logger.warn("Incoming session terminated while waiting for PRACK during accept.");
          }
          throw error;
        });
      return this;
    }

    // Ported
    if (this.status === SessionStatus.STATUS_WAITING_FOR_ANSWER) {
      this.status = SessionStatus.STATUS_ANSWERED;
    } else {
      throw new Exceptions.InvalidStateError(this.status);
    }

    this.status = SessionStatus.STATUS_ANSWERED;
    clearTimeout(this.timers.userNoAnswerTimer); // Ported
    this.generateResponseOfferAnswer(options)
      .then(reply)
      .catch((error: Error) => {
        // FIXME: TODO: Nothing to be done with exceptions until the library interface is modified.
        // Hopefully this method will soon return a Promise instead of this.
        throw error; // For now, throw uncatchable exceptions. :(
      });
    return this;
  }

  /**
   * Report progress to the the caller.
   * Replies to the INVITE request with a 1xx provisional response.
   * @param options Options bucket.
   * @throws {Exceptions.SessionDescriptionHandlerError} On failure to get/set session description.
   * @throws {Exceptions.TerminatedSessionError} The session terminated before being accepted (i.e. cancel arrived).
   */
  public progress(options: InviteServerContextBase.Options = {}): this {
    // Ported
    let statusCode = options.statusCode || 180;
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
    // Ported
    if (options.statusCode === 100) {
      this.incomingInviteRequest.trying();
      return this;
    }
    // Ported
    const reasonPhrase = options.reasonPhrase;
    const extraHeaders: Array<string> = (options.extraHeaders || []).slice();

    // Standard progress reply.
    if (
      !(this.rel100 === C.supported.REQUIRED) &&
      !(this.rel100 === C.supported.SUPPORTED && options.rel100) &&
      !(this.rel100 === C.supported.SUPPORTED && this.ua.configuration.rel100 === C.supported.REQUIRED)
    ) {
      const body = options.body ? fromBodyLegacy(options.body) : undefined;
      const response = this.incomingInviteRequest.progress({ statusCode, reasonPhrase, extraHeaders, body });
      this.emit("progress", response.message, reasonPhrase);
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

    // Helper function to send a reliable 1xx response.
    const reply = (body?: Body) => {
      statusCode = options.statusCode || 183;
      extraHeaders.push("Require: 100rel");
      extraHeaders.push("RSeq: " + Math.floor(Math.random() * 10000));

      // Ported - Retransmit until we get a response or we time out (see prackTimer below).
      const rel1xxRetransmission = () => {
        this.incomingInviteRequest.progress({ statusCode, reasonPhrase, extraHeaders, body });
        rel1xxTimer = setTimeout(rel1xxRetransmission, timeout *= 2);
      };
      let timeout = Timers.T1;
      let rel1xxTimer = setTimeout(rel1xxRetransmission, timeout);

      // Ported - Timeout and reject INVITE if no response.
      const prackTimer = setTimeout(() => {
        if (this.status !== SessionStatus.STATUS_WAITING_FOR_PRACK) {
          return;
        }
        this.logger.warn("No PRACK received, rejecting INVITE.");
        clearTimeout(this.timers.rel1xxTimer);
        this.incomingInviteRequest.reject({ statusCode: 504 });
        this.terminated(undefined, C.causes.NO_PRACK);
      }, Timers.T1 * 64);

      const { message, session } = this.incomingInviteRequest.progress({
        statusCode,
        reasonPhrase,
        extraHeaders,
        body
      });
      session.delegate = {
        onPrack: (prackRequest): void => {
          this.handlePrackOfferAnswer(prackRequest, options)
            .then((prackResponseBody) => {
              prackRequest.accept({ statusCode: 200, body: prackResponseBody });
              clearTimeout(rel1xxTimer);
              clearTimeout(prackTimer);
              if (this.status === SessionStatus.STATUS_WAITING_FOR_PRACK) {
                this.status = SessionStatus.STATUS_WAITING_FOR_ANSWER;
              }
              this.prackArrived();
            })
            .catch((error: Error) => {
              // FIXME: TODO: Nothing to be done with exceptions until the library interface is modified.
              // Hopefully this method will soon return a Promise instead of this.
              throw error; // For now, throw uncatchable exceptions. :(
            });
        }
      };
      this.session = session;
      this.emit("progress", message, reasonPhrase);
    };

    // Ported - set status.
    this.status = SessionStatus.STATUS_WAITING_FOR_PRACK;

    // Get an offer/answer and send a reply.
    this.generateResponseOfferAnswer(options)
      .then(reply)
      .catch((error: Error) => {
        // FIXME: TODO: Nothing to be done with exceptions until the library interface is modified.
        // Hopefully this method will soon return a Promise instead of this.
        throw error; // For now, throw uncatchable exceptions. :(
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

    // We have a confirmed dialog and we're not waiting an ACK.
    if (this.session.sessionState === SessionState.Confirmed) {
      this.bye(options);
      return this;
    }

    // We have a confirmed dialog and we're not waiting an ACK.
    if (this.session.sessionState === SessionState.AckWait) {
      this.session.delegate = {
        // When it shows up, say BYE.
        onAck: (request: IncomingAckRequest): void => {
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
   * Called when session terminated.
   * Using it here just for the PRACK timeout.
   */
  protected terminated(message?: IncomingResponseMessage | IncomingRequestMessage, cause?: string): this {
    this.prackNeverArrived();
    return super.terminated(message, cause);
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
      .then((bodyObj) => fromBodyObj(bodyObj))
      .catch((error) => { throw this.handleSessionDescriptionHandlerFailure(error); });
  }

  private setAnswer(answer: Body, options: {
    sessionDescriptionHandlerOptions?: SessionDescriptionHandlerOptions,
    modifiers?: SessionDescriptionHandlerModifiers
  }): Promise<void> {
    this.hasAnswer = true;
    const sdh = this.getSessionDescriptionHandler();
    if (!sdh.hasDescription(answer.contentType)) {
      // TODO: failure
    }
    return sdh
      .setDescription(answer.content, options.sessionDescriptionHandlerOptions, options.modifiers)
      .catch((error) => { throw this.handleSessionDescriptionHandlerFailure(error); });
  }

  private setOfferAndGetAnswer(offer: Body, options: {
    sessionDescriptionHandlerOptions?: SessionDescriptionHandlerOptions,
    modifiers?: SessionDescriptionHandlerModifiers
  }): Promise<Body> {
    this.hasOffer = true;
    this.hasAnswer = true;
    const sdh = this.getSessionDescriptionHandler();
    if (!sdh.hasDescription(offer.contentType)) {
      // TODO: failure
    }
    return sdh
      .setDescription(offer.content, options.sessionDescriptionHandlerOptions, options.modifiers)
      .then(() => sdh.getDescription(options.sessionDescriptionHandlerOptions, options.modifiers))
      .then((bodyObj) => fromBodyObj(bodyObj))
      .catch((error) => { throw this.handleSessionDescriptionHandlerFailure(error); });
  }

  private getSessionDescriptionHandler(): SessionDescriptionHandler {
    // Create our session description handler if not already done so...
    const sdh = this.sessionDescriptionHandler = this.setupSessionDescriptionHandler();
    // FIXME: Ported - this can get emitted multiple times even when only created once... don't we care?
    this.emit("SessionDescriptionHandler-created", this.sessionDescriptionHandler);
    // Return.
    return sdh;
  }

  private handleSessionDescriptionHandlerFailure(error: Error): Error {
    if (error instanceof Exceptions.ClosedSessionDescriptionHandlerError) {
      if (this.status === SessionStatus.STATUS_TERMINATED) {
        this.logger.warn("Incoming session terminated while getting description.");
        error = new Exceptions.TerminatedSessionError();
        return error;
      }
    }

    // FIXME: Exceptions need review.
    if (error instanceof Exceptions.SessionDescriptionHandlerError) {
      this.logger.error(error.message);
      if (error.error) {
        this.logger.error(error.error);
      }
    } else {
      // We don't actually know what a session description handler implementation might throw
      // our way, so as a last resort, just assume we are getting an "any" and log it.
      this.logger.error("An error occurred in the session description handler.");
      this.logger.error(error as any);
    }

    // FIXME: It's not clear what state we are going to be in after the async calls,
    // so this needs to be done as part of a proper state transition machine.
    // As we could very well be terminated at this point, for now we are checking for
    // at least that cass. Otherwise, while the underlying transaction will
    // "do the right thing" dealing with this reply (perhaps throwing an error),
    // we should be able to figure out "what the right thing to do" is, so...
    if (this.status !== SessionStatus.STATUS_TERMINATED) {
      // FIXME: Need a proper state machine. Session should state transition and emit events accordingly.
      this.incomingInviteRequest.reject({ statusCode: 480 }); // "Temporarily Unavailable"
      this.failed(undefined, C.causes.WEBRTC_ERROR);
      this.terminated(undefined, C.causes.WEBRTC_ERROR);
    }
    return error;
  }
}
