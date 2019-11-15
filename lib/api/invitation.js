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
        /** @internal */
        _this.body = undefined;
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
        _this._canceled = false;
        _this.rseq = Math.floor(Math.random() * 10000);
        // ServerContext properties
        _this.logger = userAgent.getLogger("sip.invitation", _this.id);
        if (_this.request.body) {
            _this.body = _this.request.body;
        }
        if (_this.request.hasHeader("Content-Type")) {
            _this.contentType = _this.request.getHeader("Content-Type");
        }
        _this.localIdentity = _this.request.to;
        _this.remoteIdentity = _this.request.from;
        var hasAssertedIdentity = _this.request.hasHeader("P-Asserted-Identity");
        if (hasAssertedIdentity) {
            var assertedIdentity = _this.request.getHeader("P-Asserted-Identity");
            if (assertedIdentity) {
                _this.assertedIdentity = core_1.Grammar.nameAddrHeaderParse(assertedIdentity);
            }
        }
        // Session properties
        _this.contact = _this.userAgent.contact.toString();
        _this.fromTag = _this.request.fromTag;
        _this.id = _this.request.callId + _this.fromTag;
        // this.modifiers =
        // this.onInfo =
        // this.passedOptions =
        var contentDisposition = _this.request.parseHeader("Content-Disposition");
        if (contentDisposition && contentDisposition.type === "render") {
            _this.renderbody = _this.request.body;
            _this.rendertype = _this.request.getHeader("Content-Type");
        }
        // FIXME: This is being done twice...
        // Update logger
        _this.logger = userAgent.getLogger("sip.invitation", _this.id);
        // Update status
        _this.status = session_1._SessionStatus.STATUS_INVITE_RECEIVED;
        // Save the session into the ua sessions collection.
        _this.userAgent.sessions[_this.id] = _this;
        // Set 100rel if necessary
        var request = _this.request;
        var requireHeader = request.getHeader("require");
        if (requireHeader && requireHeader.toLowerCase().indexOf("100rel") >= 0) {
            _this.rel100 = "required";
        }
        var supportedHeader = request.getHeader("supported");
        if (supportedHeader && supportedHeader.toLowerCase().indexOf("100rel") >= 0) {
            _this.rel100 = "supported";
        }
        // Set the toTag on the incoming request to the toTag which
        // will be used in the response to the incoming request!!!
        // FIXME: HACK: This is a hack to port an existing behavior.
        // The behavior being ported appears to be a hack itself,
        // so this is a hack to port a hack. At least one test spec
        // relies on it (which is yet another hack).
        _this.request.toTag = incomingInviteRequest.toTag;
        // Update status again - sigh
        _this.status = session_1._SessionStatus.STATUS_WAITING_FOR_ANSWER;
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
        if (request.hasHeader("expires")) {
            var expires = Number(request.getHeader("expires") || 0) * 1000;
            _this.expiresTimer = setTimeout(function () {
                if (_this.status === session_1._SessionStatus.STATUS_WAITING_FOR_ANSWER) {
                    incomingInviteRequest.reject({ statusCode: 487 });
                    _this.stateTransition(session_state_1.SessionState.Terminated);
                }
            }, expires);
        }
        return _this;
    }
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
    Object.defineProperty(Invitation.prototype, "request", {
        /** Incoming INVITE request message. */
        get: function () {
            return this.incomingInviteRequest.message;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Accept the invitation.
     * @remarks
     * Accept the incoming INVITE request to start a Session.
     * Replies to the INVITE request with a 200 Ok response.
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
        return this._accept(options)
            .then(function (_a) {
            var message = _a.message, session = _a.session;
            session.delegate = {
                onAck: function (ackRequest) { return _this.onAckRequest(ackRequest); },
                onAckTimeout: function () { return _this.onAckTimeout(); },
                onBye: function (byeRequest) { return _this.onByeRequest(byeRequest); },
                onInfo: function (infoRequest) { return _this.onInfoRequest(infoRequest); },
                onInvite: function (inviteRequest) { return _this.onInviteRequest(inviteRequest); },
                onNotify: function (notifyRequest) { return _this.onNotifyRequest(notifyRequest); },
                onPrack: function (prackRequest) { return _this.onPrackRequest(prackRequest); },
                onRefer: function (referRequest) { return _this.onReferRequest(referRequest); }
            };
            _this.dialog = session;
            _this.stateTransition(session_state_1.SessionState.Established);
            // TODO: Reconsider this "automagic" send of a BYE to replacee behavior.
            // This behavoir has been ported forward from legacy versions.
            if (_this.replacee) {
                _this.replacee._bye();
            }
        })
            .catch(function (error) {
            _this.onContextError(error);
            // FIXME: Assuming error due to async race on CANCEL and eating error.
            if (!_this._canceled) {
                throw error;
            }
        });
    };
    /**
     * Indicate progress processing the invitation.
     * @remarks
     * Report progress to the the caller.
     * Replies to the INVITE request with a 1xx provisional response.
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
        // Ported
        if (this.status === session_1._SessionStatus.STATUS_TERMINATED) {
            this.logger.warn("Unexpected call for progress while terminated, ignoring");
            return Promise.resolve();
        }
        // Added
        if (this.status === session_1._SessionStatus.STATUS_ANSWERED) {
            this.logger.warn("Unexpected call for progress while answered, ignoring");
            return Promise.resolve();
        }
        // Added
        if (this.status === session_1._SessionStatus.STATUS_ANSWERED_WAITING_FOR_PRACK) {
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
        if (this.status === session_1._SessionStatus.STATUS_WAITING_FOR_PRACK) {
            this.logger.warn("Unexpected call for progress while waiting for prack, ignoring");
            return Promise.resolve();
        }
        // Ported
        if (options.statusCode === 100) {
            try {
                this.incomingInviteRequest.trying();
            }
            catch (error) {
                this.onContextError(error);
                // FIXME: Assuming error due to async race on CANCEL and eating error.
                if (!this._canceled) {
                    return Promise.reject(error);
                }
            }
            return Promise.resolve();
        }
        // Standard provisional response.
        if (!(this.rel100 === "required") &&
            !(this.rel100 === "supported" && options.rel100) &&
            !(this.rel100 === "supported" &&
                this.userAgent.configuration.sipExtension100rel === user_agent_options_1.SIPExtension.Required)) {
            return this._progress(options)
                .then(function (response) { return; })
                .catch(function (error) {
                _this.onContextError(error);
                // FIXME: Assuming error due to async race on CANCEL and eating error.
                if (!_this._canceled) {
                    throw error;
                }
            });
        }
        // Reliable provisional response.
        return this._progressReliableWaitForPrack(options)
            .then(function (response) { return; })
            .catch(function (error) {
            _this.onContextError(error);
            // FIXME: Assuming error due to async race on CANCEL and eating error.
            if (!_this._canceled) {
                throw error;
            }
        });
    };
    /**
     * Reject the invitation.
     * @param options - Options bucket.
     */
    Invitation.prototype.reject = function (options) {
        if (options === void 0) { options = {}; }
        this.logger.log("Invitation.reject");
        // validate state
        if (this.state !== session_state_1.SessionState.Initial) {
            var error = new Error("Invalid session state " + this.state);
            this.logger.error(error.message);
            return Promise.reject(error);
        }
        // Check Session Status
        if (this.status === session_1._SessionStatus.STATUS_TERMINATED) {
            throw new Error("Invalid status " + this.status);
        }
        this.logger.log("rejecting RTCSession");
        var statusCode = options.statusCode || 480;
        var reasonPhrase = options.reasonPhrase ? options.reasonPhrase : utils_1.getReasonPhrase(statusCode);
        var extraHeaders = options.extraHeaders || [];
        if (statusCode < 300 || statusCode > 699) {
            throw new TypeError("Invalid statusCode: " + statusCode);
        }
        var body = options.body ? core_1.fromBodyLegacy(options.body) : undefined;
        // FIXME: Need to redirect to someplae
        var response = statusCode < 400 ?
            this.incomingInviteRequest.redirect([], { statusCode: statusCode, reasonPhrase: reasonPhrase, extraHeaders: extraHeaders, body: body }) :
            this.incomingInviteRequest.reject({ statusCode: statusCode, reasonPhrase: reasonPhrase, extraHeaders: extraHeaders, body: body });
        this.stateTransition(session_state_1.SessionState.Terminated);
        return Promise.resolve();
    };
    /**
     * Called to cleanup session after terminated.
     * Using it here just for the PRACK timeout.
     * @internal
     */
    Invitation.prototype._close = function () {
        this.prackNeverArrived();
        _super.prototype._close.call(this);
    };
    /**
     * Handle CANCEL request.
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
        this._canceled = true;
        // reject INVITE with 487 status code
        this.incomingInviteRequest.reject({ statusCode: 487 });
        this.stateTransition(session_state_1.SessionState.Terminated);
    };
    /**
     * A version of `accept` which resolves a session when the 200 Ok response is sent.
     * @param options - Options bucket.
     */
    Invitation.prototype._accept = function (options) {
        var _this = this;
        if (options === void 0) { options = {}; }
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
        if (this.status === session_1._SessionStatus.STATUS_WAITING_FOR_PRACK) {
            this.status = session_1._SessionStatus.STATUS_ANSWERED_WAITING_FOR_PRACK;
            return this.waitForArrivalOfPrack()
                .then(function () {
                _this.status = session_1._SessionStatus.STATUS_ANSWERED;
                clearTimeout(_this.userNoAnswerTimer); // Ported
            })
                .then(function () { return _this.generateResponseOfferAnswer(_this.incomingInviteRequest, options); })
                .then(function (body) { return _this.incomingInviteRequest.accept({ statusCode: 200, body: body }); });
        }
        // Ported
        if (this.status === session_1._SessionStatus.STATUS_WAITING_FOR_ANSWER) {
            this.status = session_1._SessionStatus.STATUS_ANSWERED;
        }
        else {
            return Promise.reject(new Error("Invalid status " + this.status));
        }
        this.status = session_1._SessionStatus.STATUS_ANSWERED;
        clearTimeout(this.userNoAnswerTimer); // Ported
        return this.generateResponseOfferAnswer(this.incomingInviteRequest, options)
            .then(function (body) { return _this.incomingInviteRequest.accept({ statusCode: 200, body: body }); });
    };
    /**
     * A version of `progress` which resolves when the provisional response is sent.
     * @param options - Options bucket.
     */
    Invitation.prototype._progress = function (options) {
        if (options === void 0) { options = {}; }
        // Ported
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
            return this._progressWithSDP(options);
        }
        try {
            var progressResponse = this.incomingInviteRequest.progress({ statusCode: statusCode, reasonPhrase: reasonPhrase, extraHeaders: extraHeaders, body: body });
            this.dialog = progressResponse.session;
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
    Invitation.prototype._progressWithSDP = function (options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        var statusCode = options.statusCode || 183;
        var reasonPhrase = options.reasonPhrase;
        var extraHeaders = (options.extraHeaders || []).slice();
        // Get an offer/answer and send a reply.
        return this.generateResponseOfferAnswer(this.incomingInviteRequest, options)
            .then(function (body) { return _this.incomingInviteRequest.progress({ statusCode: statusCode, reasonPhrase: reasonPhrase, extraHeaders: extraHeaders, body: body }); })
            .then(function (progressResponse) {
            _this.dialog = progressResponse.session;
            return progressResponse;
        });
    };
    /**
     * A version of `progress` which resolves when the reliable provisional response is sent.
     * @param options - Options bucket.
     */
    Invitation.prototype._progressReliable = function (options) {
        if (options === void 0) { options = {}; }
        options.extraHeaders = (options.extraHeaders || []).slice();
        options.extraHeaders.push("Require: 100rel");
        options.extraHeaders.push("RSeq: " + Math.floor(Math.random() * 10000));
        return this._progressWithSDP(options);
    };
    /**
     * A version of `progress` which resolves when the reliable provisional response is acknowledged.
     * @param options - Options bucket.
     */
    Invitation.prototype._progressReliableWaitForPrack = function (options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        var statusCode = options.statusCode || 183;
        var reasonPhrase = options.reasonPhrase;
        var extraHeaders = (options.extraHeaders || []).slice();
        extraHeaders.push("Require: 100rel");
        extraHeaders.push("RSeq: " + this.rseq++);
        var body;
        // Ported - set status.
        this.status = session_1._SessionStatus.STATUS_WAITING_FOR_PRACK;
        return new Promise(function (resolve, reject) {
            var waitingForPrack = true;
            return _this.generateResponseOfferAnswer(_this.incomingInviteRequest, options)
                .then(function (offerAnswer) {
                body = offerAnswer;
                return _this.incomingInviteRequest.progress({ statusCode: statusCode, reasonPhrase: reasonPhrase, extraHeaders: extraHeaders, body: body });
            })
                .then(function (progressResponse) {
                _this.dialog = progressResponse.session;
                var prackRequest;
                var prackResponse;
                progressResponse.session.delegate = {
                    onPrack: function (request) {
                        prackRequest = request;
                        clearTimeout(prackWaitTimeoutTimer);
                        clearTimeout(rel1xxRetransmissionTimer);
                        if (!waitingForPrack) {
                            return;
                        }
                        waitingForPrack = false;
                        _this.handlePrackOfferAnswer(prackRequest, options)
                            .then(function (prackResponseBody) {
                            try {
                                prackResponse = prackRequest.accept({ statusCode: 200, body: prackResponseBody });
                                // Ported - set status.
                                if (_this.status === session_1._SessionStatus.STATUS_WAITING_FOR_PRACK) {
                                    _this.status = session_1._SessionStatus.STATUS_WAITING_FOR_ANSWER;
                                }
                                _this.prackArrived();
                                resolve({ prackRequest: prackRequest, prackResponse: prackResponse, progressResponse: progressResponse });
                            }
                            catch (error) {
                                reject(error);
                            }
                        });
                    }
                };
                // https://tools.ietf.org/html/rfc3262#section-3
                var prackWaitTimeout = function () {
                    if (!waitingForPrack) {
                        return;
                    }
                    waitingForPrack = false;
                    _this.logger.warn("No PRACK received, rejecting INVITE.");
                    clearTimeout(rel1xxRetransmissionTimer);
                    try {
                        _this.incomingInviteRequest.reject({ statusCode: 504 });
                        _this.stateTransition(session_state_1.SessionState.Terminated);
                        reject(new exceptions_1.SessionTerminatedError());
                    }
                    catch (error) {
                        reject(error);
                    }
                };
                var prackWaitTimeoutTimer = setTimeout(prackWaitTimeout, core_1.Timers.T1 * 64);
                // https://tools.ietf.org/html/rfc3262#section-3
                var rel1xxRetransmission = function () {
                    try {
                        _this.incomingInviteRequest.progress({ statusCode: statusCode, reasonPhrase: reasonPhrase, extraHeaders: extraHeaders, body: body });
                    }
                    catch (error) {
                        waitingForPrack = false;
                        reject(error);
                        return;
                    }
                    rel1xxRetransmissionTimer = setTimeout(rel1xxRetransmission, timeout *= 2);
                };
                var timeout = core_1.Timers.T1;
                var rel1xxRetransmissionTimer = setTimeout(rel1xxRetransmission, timeout);
            });
        });
    };
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
     * FIXME: TODO: The current library interface presents async methods without a
     * proper async error handling mechanism. Arguably a promise based interface
     * would be an improvement over the pattern of returning `this`. The approach has
     * been generally along the lines of log a error and terminate.
     */
    Invitation.prototype.onContextError = function (error) {
        var statusCode = 480;
        if (error instanceof core_1.Exception) { // There might be interest in catching these Exceptions.
            if (error instanceof exceptions_1.SessionDescriptionHandlerError) {
                this.logger.error(error.message);
            }
            else if (error instanceof exceptions_1.SessionTerminatedError) {
                // PRACK never arrived, so we timed out waiting for it.
                this.logger.warn("Incoming session terminated while waiting for PRACK.");
            }
            else if (error instanceof exceptions_1.ContentTypeUnsupportedError) {
                statusCode = 415;
            }
            else if (error instanceof core_1.Exception) {
                this.logger.error(error.message);
            }
        }
        else if (error instanceof Error) { // Other Errors hould go uncaught.
            this.logger.error(error.message);
        }
        else {
            // We don't actually know what a session description handler implementation might throw
            // our way, so as a last resort, just assume we are getting an "any" and log it.
            this.logger.error("An error occurred in the session description handler.");
            this.logger.error(error);
        }
        try {
            this.incomingInviteRequest.reject({ statusCode: statusCode }); // "Temporarily Unavailable"
            this.stateTransition(session_state_1.SessionState.Terminated);
        }
        catch (error) {
            return;
        }
    };
    Invitation.prototype.prackArrived = function () {
        if (this.waitingForPrackResolve) {
            this.waitingForPrackResolve();
        }
        this.waitingForPrackPromise = undefined;
        this.waitingForPrackResolve = undefined;
        this.waitingForPrackReject = undefined;
    };
    Invitation.prototype.prackNeverArrived = function () {
        if (this.waitingForPrackReject) {
            this.waitingForPrackReject(new exceptions_1.SessionTerminatedError());
        }
        this.waitingForPrackPromise = undefined;
        this.waitingForPrackResolve = undefined;
        this.waitingForPrackReject = undefined;
    };
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
    return Invitation;
}(session_1.Session));
exports.Invitation = Invitation;
