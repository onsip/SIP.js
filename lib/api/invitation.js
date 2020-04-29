"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var core_1 = require("../core");
var utils_1 = require("../core/messages/utils");
var exceptions_1 = require("./exceptions");
var session_1 = require("./session");
var session_state_1 = require("./session-state");
var user_agent_options_1 = require("./user-agent-options");
/**
 * An invitation is an offer to establish a {@link Session} (incoming INVITE).
 * @public
 */
var Invitation = /** @class */ (function (_super) {
    tslib_1.__extends(Invitation, _super);
    /** @internal */
    function Invitation(userAgent, incomingInviteRequest) {
        var _this = _super.call(this, userAgent) || this;
        _this.incomingInviteRequest = incomingInviteRequest;
        /** True if dispose() has been called. */
        _this.disposed = false;
        /** INVITE will be rejected if not accepted within a certain period time. */
        _this.expiresTimer = undefined;
        /** True if this Session has been Terminated due to a CANCEL request. */
        _this.isCanceled = false;
        /** Are reliable provisional responses required or supported. */
        _this.rel100 = "none";
        /** The current RSeq header value. */
        _this.rseq = Math.floor(Math.random() * 10000);
        /** INVITE will be rejected if final response not sent in a certain period time. */
        _this.userNoAnswerTimer = undefined;
        /** True if waiting for a PRACK before sending a 200 Ok. */
        _this.waitingForPrack = false;
        _this.logger = userAgent.getLogger("sip.Invitation");
        var incomingRequestMessage = _this.incomingInviteRequest.message;
        // Set 100rel if necessary
        var requireHeader = incomingRequestMessage.getHeader("require");
        if (requireHeader && requireHeader.toLowerCase().indexOf("100rel") >= 0) {
            _this.rel100 = "required";
        }
        var supportedHeader = incomingRequestMessage.getHeader("supported");
        if (supportedHeader && supportedHeader.toLowerCase().indexOf("100rel") >= 0) {
            _this.rel100 = "supported";
        }
        // Set the toTag on the incoming request message to the toTag which
        // will be used in the response to the incoming request!!!
        // FIXME: HACK: This is a hack to port an existing behavior.
        // The behavior being ported appears to be a hack itself,
        // so this is a hack to port a hack. At least one test spec
        // relies on it (which is yet another hack).
        incomingRequestMessage.toTag = incomingInviteRequest.toTag;
        if (typeof incomingRequestMessage.toTag !== "string") {
            throw new TypeError("toTag should have been a string.");
        }
        // The following mapping values are RECOMMENDED:
        // ...
        // 19 no answer from the user              480 Temporarily unavailable
        // https://tools.ietf.org/html/rfc3398#section-7.2.4.1
        _this.userNoAnswerTimer = setTimeout(function () {
            incomingInviteRequest.reject({ statusCode: 480 });
            _this.stateTransition(session_state_1.SessionState.Terminated);
        }, _this.userAgent.configuration.noAnswerTimeout ? _this.userAgent.configuration.noAnswerTimeout * 1000 : 60000);
        // 1. If the request is an INVITE that contains an Expires header
        // field, the UAS core sets a timer for the number of seconds
        // indicated in the header field value.  When the timer fires, the
        // invitation is considered to be expired.  If the invitation
        // expires before the UAS has generated a final response, a 487
        // (Request Terminated) response SHOULD be generated.
        // https://tools.ietf.org/html/rfc3261#section-13.3.1
        if (incomingRequestMessage.hasHeader("expires")) {
            var expires = Number(incomingRequestMessage.getHeader("expires") || 0) * 1000;
            _this.expiresTimer = setTimeout(function () {
                if (_this.state === session_state_1.SessionState.Initial) {
                    incomingInviteRequest.reject({ statusCode: 487 });
                    _this.stateTransition(session_state_1.SessionState.Terminated);
                }
            }, expires);
        }
        // Session parent properties
        var assertedIdentity = _this.request.getHeader("P-Asserted-Identity");
        if (assertedIdentity) {
            _this._assertedIdentity = core_1.Grammar.nameAddrHeaderParse(assertedIdentity);
        }
        _this._contact = _this.userAgent.contact.toString();
        var contentDisposition = incomingRequestMessage.parseHeader("Content-Disposition");
        if (contentDisposition && contentDisposition.type === "render") {
            _this._renderbody = incomingRequestMessage.body;
            _this._rendertype = incomingRequestMessage.getHeader("Content-Type");
        }
        // Identifier
        _this._id = incomingRequestMessage.callId + incomingRequestMessage.fromTag;
        // Add to the user agent's session collection.
        _this.userAgent._sessions[_this._id] = _this;
        return _this;
    }
    /**
     * Destructor.
     */
    Invitation.prototype.dispose = function () {
        var _this = this;
        // Only run through this once. It can and does get called multiple times
        // depending on the what the sessions state is when first called.
        // For example, if called when "establishing" it will be called again
        // at least once when the session transitions to "terminated".
        // Regardless, running through this more than once is pointless.
        if (this.disposed) {
            return Promise.resolve();
        }
        this.disposed = true;
        // Clear timers
        if (this.expiresTimer) {
            clearTimeout(this.expiresTimer);
            this.expiresTimer = undefined;
        }
        if (this.userNoAnswerTimer) {
            clearTimeout(this.userNoAnswerTimer);
            this.userNoAnswerTimer = undefined;
        }
        // If accept() is still waiting for a PRACK, make sure it rejects
        this.prackNeverArrived();
        // If the final response for the initial INVITE not yet been sent, reject it
        switch (this.state) {
            case session_state_1.SessionState.Initial:
                return this.reject().then(function () { return _super.prototype.dispose.call(_this); });
            case session_state_1.SessionState.Establishing:
                return this.reject().then(function () { return _super.prototype.dispose.call(_this); });
            case session_state_1.SessionState.Established:
                return _super.prototype.dispose.call(this);
            case session_state_1.SessionState.Terminating:
                return _super.prototype.dispose.call(this);
            case session_state_1.SessionState.Terminated:
                return _super.prototype.dispose.call(this);
            default:
                throw new Error("Unknown state.");
        }
    };
    Object.defineProperty(Invitation.prototype, "autoSendAnInitialProvisionalResponse", {
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
        get: function () {
            return this.rel100 === "required" ? false : true;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Invitation.prototype, "body", {
        /**
         * Initial incoming INVITE request message body.
         */
        get: function () {
            return this.incomingInviteRequest.message.body;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Invitation.prototype, "localIdentity", {
        /**
         * The identity of the local user.
         */
        get: function () {
            return this.request.to;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Invitation.prototype, "remoteIdentity", {
        /**
         * The identity of the remote user.
         */
        get: function () {
            return this.request.from;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Invitation.prototype, "request", {
        /**
         * Initial incoming INVITE request message.
         */
        get: function () {
            return this.incomingInviteRequest.message;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Accept the invitation.
     *
     * @remarks
     * Accept the incoming INVITE request to start a Session.
     * Replies to the INVITE request with a 200 Ok response.
     * Resolves once the response sent, otherwise rejects.
     *
     * This method may reject for a variety of reasons including
     * the receipt of a CANCEL request before `accept` is able
     * to construct a response.
     * @param options - Options bucket.
     */
    Invitation.prototype.accept = function (options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        this.logger.log("Invitation.accept");
        // validate state
        if (this.state !== session_state_1.SessionState.Initial) {
            var error = new Error("Invalid session state " + this.state);
            this.logger.error(error.message);
            return Promise.reject(error);
        }
        // transition state
        this.stateTransition(session_state_1.SessionState.Establishing);
        return this.sendAccept(options)
            .then(function (_a) {
            var message = _a.message, session = _a.session;
            session.delegate = {
                onAck: function (ackRequest) { return _this.onAckRequest(ackRequest); },
                onAckTimeout: function () { return _this.onAckTimeout(); },
                onBye: function (byeRequest) { return _this.onByeRequest(byeRequest); },
                onInfo: function (infoRequest) { return _this.onInfoRequest(infoRequest); },
                onInvite: function (inviteRequest) { return _this.onInviteRequest(inviteRequest); },
                onMessage: function (messageRequest) { return _this.onMessageRequest(messageRequest); },
                onNotify: function (notifyRequest) { return _this.onNotifyRequest(notifyRequest); },
                onPrack: function (prackRequest) { return _this.onPrackRequest(prackRequest); },
                onRefer: function (referRequest) { return _this.onReferRequest(referRequest); }
            };
            _this._dialog = session;
            _this.stateTransition(session_state_1.SessionState.Established);
            // TODO: Reconsider this "automagic" send of a BYE to replacee behavior.
            // This behavior has been ported forward from legacy versions.
            if (_this._replacee) {
                _this._replacee._bye();
            }
        })
            .catch(function (error) { return _this.handleResponseError(error); });
    };
    /**
     * Indicate progress processing the invitation.
     *
     * @remarks
     * Report progress to the the caller.
     * Replies to the INVITE request with a 1xx provisional response.
     * Resolves once the response sent, otherwise rejects.
     * @param options - Options bucket.
     */
    Invitation.prototype.progress = function (options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        this.logger.log("Invitation.progress");
        // validate state
        if (this.state !== session_state_1.SessionState.Initial) {
            var error = new Error("Invalid session state " + this.state);
            this.logger.error(error.message);
            return Promise.reject(error);
        }
        // Ported
        var statusCode = options.statusCode || 180;
        if (statusCode < 100 || statusCode > 199) {
            throw new TypeError("Invalid statusCode: " + statusCode);
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
        if (this.waitingForPrack) {
            this.logger.warn("Unexpected call for progress while waiting for prack, ignoring");
            return Promise.resolve();
        }
        // Trying provisional response
        if (options.statusCode === 100) {
            return this.sendProgressTrying()
                .then(function (response) { return; })
                .catch(function (error) { return _this.handleResponseError(error); });
        }
        // Standard provisional response
        if (!(this.rel100 === "required") &&
            !(this.rel100 === "supported" && options.rel100) &&
            !(this.rel100 === "supported" &&
                this.userAgent.configuration.sipExtension100rel === user_agent_options_1.SIPExtension.Required)) {
            return this.sendProgress(options)
                .then(function (response) { return; })
                .catch(function (error) { return _this.handleResponseError(error); });
        }
        // Reliable provisional response
        return this.sendProgressReliableWaitForPrack(options)
            .then(function (response) { return; })
            .catch(function (error) { return _this.handleResponseError(error); });
    };
    /**
     * Reject the invitation.
     *
     * @remarks
     * Replies to the INVITE request with a 4xx, 5xx, or 6xx final response.
     * Resolves once the response sent, otherwise rejects.
     *
     * The expectation is that this method is used to reject an INVITE request.
     * That is indeed the case - a call to `progress` followed by `reject` is
     * a typical way to "decline" an incoming INVITE request. However it may
     * also be called after calling `accept` (but only before it completes)
     * which will reject the call and cause `accept` to reject.
     * @param options - Options bucket.
     */
    Invitation.prototype.reject = function (options) {
        if (options === void 0) { options = {}; }
        this.logger.log("Invitation.reject");
        // validate state
        if (this.state !== session_state_1.SessionState.Initial &&
            this.state !== session_state_1.SessionState.Establishing) {
            var error = new Error("Invalid session state " + this.state);
            this.logger.error(error.message);
            return Promise.reject(error);
        }
        var statusCode = options.statusCode || 480;
        var reasonPhrase = options.reasonPhrase ? options.reasonPhrase : utils_1.getReasonPhrase(statusCode);
        var extraHeaders = options.extraHeaders || [];
        if (statusCode < 300 || statusCode > 699) {
            throw new TypeError("Invalid statusCode: " + statusCode);
        }
        var body = options.body ? core_1.fromBodyLegacy(options.body) : undefined;
        // FIXME: Need to redirect to someplace
        var response = statusCode < 400 ?
            this.incomingInviteRequest.redirect([], { statusCode: statusCode, reasonPhrase: reasonPhrase, extraHeaders: extraHeaders, body: body }) :
            this.incomingInviteRequest.reject({ statusCode: statusCode, reasonPhrase: reasonPhrase, extraHeaders: extraHeaders, body: body });
        this.stateTransition(session_state_1.SessionState.Terminated);
        return Promise.resolve();
    };
    /**
     * Handle CANCEL request.
     *
     * @param message - CANCEL message.
     * @internal
     */
    Invitation.prototype._onCancel = function (message) {
        this.logger.log("Invitation._onCancel");
        // validate state
        if (this.state !== session_state_1.SessionState.Initial &&
            this.state !== session_state_1.SessionState.Establishing) {
            this.logger.error("CANCEL received while in state " + this.state + ", dropping request");
            return;
        }
        // flag canceled
        this.isCanceled = true;
        // reject INVITE with 487 status code
        this.incomingInviteRequest.reject({ statusCode: 487 });
        this.stateTransition(session_state_1.SessionState.Terminated);
    };
    /**
     * Helper function to handle offer/answer in a PRACK.
     */
    Invitation.prototype.handlePrackOfferAnswer = function (request, options) {
        if (!this.dialog) {
            throw new Error("Dialog undefined.");
        }
        // If the PRACK doesn't have an offer/answer, nothing to be done.
        var body = core_1.getBody(request.message);
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
            case core_1.SignalingState.Initial:
                // State should never be reached as first reliable provisional response must have answer/offer.
                throw new Error("Invalid signaling state " + this.dialog.signalingState + ".");
            case core_1.SignalingState.Stable:
                // Receved answer.
                return this.setAnswer(body, options).then(function () { return undefined; });
            case core_1.SignalingState.HaveLocalOffer:
                // State should never be reached as local offer would be answered by this PRACK
                throw new Error("Invalid signaling state " + this.dialog.signalingState + ".");
            case core_1.SignalingState.HaveRemoteOffer:
                // Received offer, generate answer.
                return this.setOfferAndGetAnswer(body, options);
            case core_1.SignalingState.Closed:
                throw new Error("Invalid signaling state " + this.dialog.signalingState + ".");
            default:
                throw new Error("Invalid signaling state " + this.dialog.signalingState + ".");
        }
    };
    /**
     * A handler for errors which occur while attempting to send 1xx and 2xx responses.
     * In all cases, an attempt is made to reject the request if it is still outstanding.
     * And while there are a variety of things which can go wrong and we log something here
     * for all errors, there are a handful of common exceptions we pay some extra attention to.
     * @param error - The error which occurred.
     */
    Invitation.prototype.handleResponseError = function (error) {
        var statusCode = 480; // "Temporarily Unavailable"
        // Log Error message
        if (error instanceof Error) {
            this.logger.error(error.message);
        }
        else {
            // We don't actually know what a session description handler implementation might throw our way,
            // and more generally as a last resort catch all, just assume we are getting an "any" and log it.
            this.logger.error(error);
        }
        // Log Exception message
        if (error instanceof exceptions_1.ContentTypeUnsupportedError) {
            this.logger.error("A session description handler occurred while sending response (content type unsupported");
            statusCode = 415; // "Unsupported Media Type"
        }
        else if (error instanceof exceptions_1.SessionDescriptionHandlerError) {
            this.logger.error("A session description handler occurred while sending response");
        }
        else if (error instanceof exceptions_1.SessionTerminatedError) {
            this.logger.error("Session ended before response could be formulated and sent (while waiting for PRACK)");
        }
        else if (error instanceof core_1.TransactionStateError) {
            this.logger.error("Session changed state before response could be formulated and sent");
        }
        // Reject if still in "initial" or "establishing" state.
        if (this.state === session_state_1.SessionState.Initial || this.state === session_state_1.SessionState.Establishing) {
            try {
                this.incomingInviteRequest.reject({ statusCode: statusCode });
                this.stateTransition(session_state_1.SessionState.Terminated);
            }
            catch (e) {
                this.logger.error("An error occurred attempting to reject the request while handling another error");
                throw e; // This is not a good place to be...
            }
        }
        // FIXME: TODO:
        // Here we are squelching the throwing of errors due to an race condition.
        // We have an internal race between calling `accept()` and handling an incoming
        // CANCEL request. As there is no good way currently to delegate the handling of
        // these race errors to the caller of `accept()`, we are squelching the throwing
        // of ALL errors when/if they occur after receiving a CANCEL to catch the ONE we know
        // is a "normal" exceptional condition. While this is a completely reasonable approach,
        // the decision should be left up to the library user. Furthermore, as we are eating
        // ALL errors in this case, we are potentially (likely) hiding "real" errors which occur.
        //
        // Only rethrow error if the session has not been canceled.
        if (this.isCanceled) {
            this.logger.warn("An error occurred while attempting to formulate and send a response to an incoming INVITE." +
                " However a CANCEL was received and processed while doing so which can (and often does) result" +
                " in errors occurring as the session terminates in the meantime. Said error is being ignored.");
            return;
        }
        throw error;
    };
    /**
     * Callback for when ACK for a 2xx response is never received.
     * @param session - Session the ACK never arrived for.
     */
    Invitation.prototype.onAckTimeout = function () {
        this.logger.log("Invitation.onAckTimeout");
        if (!this.dialog) {
            throw new Error("Dialog undefined.");
        }
        this.logger.log("No ACK received for an extended period of time, terminating session");
        this.dialog.bye();
        this.stateTransition(session_state_1.SessionState.Terminated);
    };
    /**
     * A version of `accept` which resolves a session when the 200 Ok response is sent.
     * @param options - Options bucket.
     */
    Invitation.prototype.sendAccept = function (options) {
        var _this = this;
        if (options === void 0) { options = {}; }
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
        if (this.waitingForPrack) {
            return this.waitForArrivalOfPrack()
                .then(function () { return clearTimeout(_this.userNoAnswerTimer); }) // Ported
                .then(function () { return _this.generateResponseOfferAnswer(_this.incomingInviteRequest, options); })
                .then(function (body) { return _this.incomingInviteRequest.accept({ statusCode: 200, body: body }); });
        }
        clearTimeout(this.userNoAnswerTimer); // Ported
        return this.generateResponseOfferAnswer(this.incomingInviteRequest, options)
            .then(function (body) { return _this.incomingInviteRequest.accept({ statusCode: 200, body: body }); });
    };
    /**
     * A version of `progress` which resolves when the provisional response is sent.
     * @param options - Options bucket.
     */
    Invitation.prototype.sendProgress = function (options) {
        if (options === void 0) { options = {}; }
        var statusCode = options.statusCode || 180;
        var reasonPhrase = options.reasonPhrase;
        var extraHeaders = (options.extraHeaders || []).slice();
        var body = options.body ? core_1.fromBodyLegacy(options.body) : undefined;
        // The 183 (Session Progress) response is used to convey information
        // about the progress of the call that is not otherwise classified.  The
        // Reason-Phrase, header fields, or message body MAY be used to convey
        // more details about the call progress.
        // https://tools.ietf.org/html/rfc3261#section-21.1.5
        // It is the de facto industry standard to utilize 183 with SDP to provide "early media".
        // While it is unlikely someone would want to send a 183 without SDP, so it should be an option.
        if (statusCode === 183 && !body) {
            return this.sendProgressWithSDP(options);
        }
        try {
            var progressResponse = this.incomingInviteRequest.progress({ statusCode: statusCode, reasonPhrase: reasonPhrase, extraHeaders: extraHeaders, body: body });
            this._dialog = progressResponse.session;
            return Promise.resolve(progressResponse);
        }
        catch (error) {
            return Promise.reject(error);
        }
    };
    /**
     * A version of `progress` which resolves when the provisional response with sdp is sent.
     * @param options - Options bucket.
     */
    Invitation.prototype.sendProgressWithSDP = function (options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        var statusCode = options.statusCode || 183;
        var reasonPhrase = options.reasonPhrase;
        var extraHeaders = (options.extraHeaders || []).slice();
        // Get an offer/answer and send a reply.
        return this.generateResponseOfferAnswer(this.incomingInviteRequest, options)
            .then(function (body) { return _this.incomingInviteRequest.progress({ statusCode: statusCode, reasonPhrase: reasonPhrase, extraHeaders: extraHeaders, body: body }); })
            .then(function (progressResponse) {
            _this._dialog = progressResponse.session;
            return progressResponse;
        });
    };
    /**
     * A version of `progress` which resolves when the reliable provisional response is sent.
     * @param options - Options bucket.
     */
    Invitation.prototype.sendProgressReliable = function (options) {
        if (options === void 0) { options = {}; }
        options.extraHeaders = (options.extraHeaders || []).slice();
        options.extraHeaders.push("Require: 100rel");
        options.extraHeaders.push("RSeq: " + Math.floor(Math.random() * 10000));
        return this.sendProgressWithSDP(options);
    };
    /**
     * A version of `progress` which resolves when the reliable provisional response is acknowledged.
     * @param options - Options bucket.
     */
    Invitation.prototype.sendProgressReliableWaitForPrack = function (options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        var statusCode = options.statusCode || 183;
        var reasonPhrase = options.reasonPhrase;
        var extraHeaders = (options.extraHeaders || []).slice();
        extraHeaders.push("Require: 100rel");
        extraHeaders.push("RSeq: " + this.rseq++);
        var body;
        return new Promise(function (resolve, reject) {
            _this.waitingForPrack = true;
            _this.generateResponseOfferAnswer(_this.incomingInviteRequest, options)
                .then(function (offerAnswer) {
                body = offerAnswer;
                return _this.incomingInviteRequest.progress({ statusCode: statusCode, reasonPhrase: reasonPhrase, extraHeaders: extraHeaders, body: body });
            })
                .then(function (progressResponse) {
                _this._dialog = progressResponse.session;
                var prackRequest;
                var prackResponse;
                progressResponse.session.delegate = {
                    onPrack: function (request) {
                        prackRequest = request;
                        clearTimeout(prackWaitTimeoutTimer);
                        clearTimeout(rel1xxRetransmissionTimer);
                        if (!_this.waitingForPrack) {
                            return;
                        }
                        _this.waitingForPrack = false;
                        _this.handlePrackOfferAnswer(prackRequest, options)
                            .then(function (prackResponseBody) {
                            try {
                                prackResponse = prackRequest.accept({ statusCode: 200, body: prackResponseBody });
                                _this.prackArrived();
                                resolve({ prackRequest: prackRequest, prackResponse: prackResponse, progressResponse: progressResponse });
                            }
                            catch (error) {
                                reject(error);
                            }
                        })
                            .catch(function (error) { return reject(error); });
                    }
                };
                // https://tools.ietf.org/html/rfc3262#section-3
                var prackWaitTimeout = function () {
                    if (!_this.waitingForPrack) {
                        return;
                    }
                    _this.waitingForPrack = false;
                    _this.logger.warn("No PRACK received, rejecting INVITE.");
                    clearTimeout(rel1xxRetransmissionTimer);
                    _this.reject({ statusCode: 504 })
                        .then(function () { return reject(new exceptions_1.SessionTerminatedError()); })
                        .catch(function (error) { return reject(error); });
                };
                var prackWaitTimeoutTimer = setTimeout(prackWaitTimeout, core_1.Timers.T1 * 64);
                // https://tools.ietf.org/html/rfc3262#section-3
                var rel1xxRetransmission = function () {
                    try {
                        _this.incomingInviteRequest.progress({ statusCode: statusCode, reasonPhrase: reasonPhrase, extraHeaders: extraHeaders, body: body });
                    }
                    catch (error) {
                        _this.waitingForPrack = false;
                        reject(error);
                        return;
                    }
                    rel1xxRetransmissionTimer = setTimeout(rel1xxRetransmission, timeout *= 2);
                };
                var timeout = core_1.Timers.T1;
                var rel1xxRetransmissionTimer = setTimeout(rel1xxRetransmission, timeout);
            })
                .catch(function (error) {
                _this.waitingForPrack = false;
                reject(error);
            });
        });
    };
    /**
     * A version of `progress` which resolves when a 100 Trying provisional response is sent.
     */
    Invitation.prototype.sendProgressTrying = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            try {
                var progressResponse = _this.incomingInviteRequest.trying();
                return Promise.resolve(progressResponse);
            }
            catch (error) {
                return Promise.reject(error);
            }
        });
    };
    /**
     * When attempting to accept the INVITE, an invitation waits
     * for any outstanding PRACK to arrive before sending the 200 Ok.
     * It will be waiting on this Promise to resolve which lets it know
     * the PRACK has arrived and it may proceed to send the 200 Ok.
     */
    Invitation.prototype.waitForArrivalOfPrack = function () {
        var _this = this;
        if (this.waitingForPrackPromise) {
            throw new Error("Already waiting for PRACK");
        }
        this.waitingForPrackPromise = new Promise(function (resolve, reject) {
            _this.waitingForPrackResolve = resolve;
            _this.waitingForPrackReject = reject;
        });
        return this.waitingForPrackPromise;
    };
    /**
     * Here we are resolving the promise which in turn will cause
     * the accept to proceed (it may still fail for other reasons, but...).
     */
    Invitation.prototype.prackArrived = function () {
        if (this.waitingForPrackResolve) {
            this.waitingForPrackResolve();
        }
        this.waitingForPrackPromise = undefined;
        this.waitingForPrackResolve = undefined;
        this.waitingForPrackReject = undefined;
    };
    /**
     * Here we are rejecting the promise which in turn will cause
     * the accept to fail and the session to transition to "terminated".
     */
    Invitation.prototype.prackNeverArrived = function () {
        if (this.waitingForPrackReject) {
            this.waitingForPrackReject(new exceptions_1.SessionTerminatedError());
        }
        this.waitingForPrackPromise = undefined;
        this.waitingForPrackResolve = undefined;
        this.waitingForPrackReject = undefined;
    };
    return Invitation;
}(session_1.Session));
exports.Invitation = Invitation;
