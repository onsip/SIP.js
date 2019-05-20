"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var messages_1 = require("../Core/messages");
var session_1 = require("../Core/session");
var Constants_1 = require("../Constants");
var Enums_1 = require("../Enums");
var Exceptions_1 = require("../Exceptions");
var Session_1 = require("../Session");
var Timers_1 = require("../Timers");
var Utils_1 = require("../Utils");
var InviteServerContext = /** @class */ (function (_super) {
    __extends(InviteServerContext, _super);
    function InviteServerContext(ua, incomingInviteRequest) {
        var _this = _super.call(this, ua, incomingInviteRequest.message) || this;
        _this.incomingInviteRequest = incomingInviteRequest;
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
        // Set the toTag on the incoming request to the toTag which
        // will be used in the response to the incoming request!!!
        // FIXME: HACK: This is a hack to port an existing behavior.
        // The behavior being ported appears to be a hack itself,
        // so this is a hack to port a hack. At least one test spec
        // relies on it (which is yet another hack). See the parent
        // constructor for where this is done originally.
        _this.request.toTag = incomingInviteRequest.toTag;
        return _this;
    }
    ////
    // BEGIN Session Overrides - roadmap is to remove all of these, but for now...
    //
    // Override Session member we want to make sure we are not using.
    InviteServerContext.prototype.acceptAndTerminate = function (message, statusCode, reasonPhrase) {
        throw new Error("Method not utilized by user agent core.");
    };
    // Override Session member we want to make sure we are not using.
    InviteServerContext.prototype.createDialog = function (message, type, early) {
        if (early === void 0) { early = false; }
        throw new Error("Method not utilized by user agent core.");
    };
    /**
     * Sends in dialog request.
     * @param method Request method.
     * @param options Options bucket.
     */
    InviteServerContext.prototype.sendRequest = function (method, options) {
        if (options === void 0) { options = {}; }
        if (!this.session) {
            throw new Error("Session undefined.");
        }
        // Convert any "body" option to a Body.
        if (options.body) {
            options.body = messages_1.fromBodyObj(options.body);
        }
        // Convert any "receiveResponse" callback option passed to an OutgoingRequestDelegate.
        var delegate;
        var callback = options.receiveResponse;
        if (callback) {
            delegate = {
                onAccept: function (response) { return callback(response.message); },
                onProgress: function (response) { return callback(response.message); },
                onRedirect: function (response) { return callback(response.message); },
                onReject: function (response) { return callback(response.message); },
                onTrying: function (response) { return callback(response.message); }
            };
        }
        var request;
        var requestOptions = options;
        switch (method) {
            case Constants_1.C.BYE:
                request = this.session.bye(delegate, requestOptions);
                break;
            case Constants_1.C.INVITE:
                request = this.session.invite(delegate, requestOptions);
                break;
            case Constants_1.C.REFER:
                request = this.session.refer(delegate, requestOptions);
                break;
            default:
                throw new Error("Unexpected " + method + ". Method not implemented by user agent core.");
        }
        // Ported - Emit the request event
        this.emit(method.toLowerCase(), request.message);
        return this;
    };
    // Override Session member we want to make sure we are not using.
    InviteServerContext.prototype.setInvite2xxTimer = function (message, body) {
        throw new Error("Method not utilized by user agent core.");
    };
    // Override Session member we want to make sure we are not using.
    InviteServerContext.prototype.setACKTimer = function () {
        // throw new Error("Method not utilized by user agent core.");
        // FIXME: TODO: This gets called by receiveReinvite().
        // Just prevent it from doing anything for now until we stop calling that.
        return;
    };
    // END Session Overrides
    //////
    /**
     * Accept the incoming INVITE request to start a Session.
     * Replies to the INVITE request with a 200 Ok response.
     * @param options Options bucket.
     */
    InviteServerContext.prototype.accept = function (options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        this._accept(options)
            .then(function (_a) {
            var message = _a.message, session = _a.session;
            session.delegate = {
                onAck: function (ackRequest) { return _this.receiveRequest(ackRequest.message); },
                onAckTimeout: function () { return _this.onAckTimeout(); },
                onBye: function (byeRequest) { return _this.receiveRequest(byeRequest.message); },
                onInfo: function (infoRequest) { return _this.receiveRequest(infoRequest.message); },
                onInvite: function (inviteRequest) { return _this.receiveRequest(inviteRequest.message); },
                onNotify: function (notifyRequest) { return _this.receiveRequest(notifyRequest.message); },
                onPrack: function (prackRequest) { return _this.receiveRequest(prackRequest.message); },
                onRefer: function (referRequest) { return _this.receiveRequest(referRequest.message); }
            };
            _this.session = session;
            _this.status = Enums_1.SessionStatus.STATUS_WAITING_FOR_ACK;
            _this.accepted(message, Utils_1.Utils.getReasonPhrase(200));
        })
            .catch(function (error) {
            _this.onContextError(error);
            // FIXME: Assuming error due to async race on CANCEL and eating error.
            if (!_this._canceled) {
                throw error;
            }
        });
        return this;
    };
    /**
     * Report progress to the the caller.
     * Replies to the INVITE request with a 1xx provisional response.
     * @param options Options bucket.
     */
    InviteServerContext.prototype.progress = function (options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        // Ported
        var statusCode = options.statusCode || 180;
        if (statusCode < 100 || statusCode > 199) {
            throw new TypeError("Invalid statusCode: " + statusCode);
        }
        // Ported
        if (this.status === Enums_1.SessionStatus.STATUS_TERMINATED) {
            this.logger.warn("Unexpected call for progress while terminated, ignoring");
            return this;
        }
        // Added
        if (this.status === Enums_1.SessionStatus.STATUS_ANSWERED) {
            this.logger.warn("Unexpected call for progress while answered, ignoring");
            return this;
        }
        // Added
        if (this.status === Enums_1.SessionStatus.STATUS_ANSWERED_WAITING_FOR_PRACK) {
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
        if (this.status === Enums_1.SessionStatus.STATUS_WAITING_FOR_PRACK) {
            this.logger.warn("Unexpected call for progress while waiting for prack, ignoring");
            return this;
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
                    throw error;
                }
            }
            return this;
        }
        // Standard provisional response.
        if (!(this.rel100 === Constants_1.C.supported.REQUIRED) &&
            !(this.rel100 === Constants_1.C.supported.SUPPORTED && options.rel100) &&
            !(this.rel100 === Constants_1.C.supported.SUPPORTED && this.ua.configuration.rel100 === Constants_1.C.supported.REQUIRED)) {
            this._progress(options)
                .catch(function (error) {
                _this.onContextError(error);
                // FIXME: Assuming error due to async race on CANCEL and eating error.
                if (!_this._canceled) {
                    throw error;
                }
            });
            return this;
        }
        // Reliable provisional response.
        this._reliableProgressWaitForPrack(options)
            .catch(function (error) {
            _this.onContextError(error);
            // FIXME: Assuming error due to async race on CANCEL and eating error.
            if (!_this._canceled) {
                throw error;
            }
        });
        return this;
    };
    /**
     * Reject an unaccepted incoming INVITE request.
     * @param options Options bucket.
     */
    InviteServerContext.prototype.reject = function (options) {
        if (options === void 0) { options = {}; }
        return _super.prototype.reject.call(this, options);
    };
    /**
     * Reject an unaccepted incoming INVITE request or send BYE if established session.
     * @param options Options bucket. FIXME: This options bucket needs to be typed.
     */
    InviteServerContext.prototype.terminate = function (options) {
        // The caller's UA MAY send a BYE for either confirmed or early dialogs,
        // and the callee's UA MAY send a BYE on confirmed dialogs, but MUST NOT
        // send a BYE on early dialogs. However, the callee's UA MUST NOT send a
        // BYE on a confirmed dialog until it has received an ACK for its 2xx
        // response or until the server transaction times out.
        // https://tools.ietf.org/html/rfc3261#section-15
        var _this = this;
        if (options === void 0) { options = {}; }
        // We don't yet have a dialog, so reject request.
        if (!this.session) {
            this.reject(options);
            return this;
        }
        switch (this.session.sessionState) {
            case session_1.SessionState.Initial:
                this.reject(options);
                return this;
            case session_1.SessionState.Early:
                this.reject(options);
                return this;
            case session_1.SessionState.AckWait:
                this.session.delegate = {
                    // When ACK shows up, say BYE.
                    onAck: function () {
                        _this.bye();
                    },
                    // Or the server transaction times out before the ACK arrives.
                    onAckTimeout: function () {
                        _this.bye();
                    }
                };
                // Ported
                this.emit("bye", this.request);
                this.terminated();
                return this;
            case session_1.SessionState.Confirmed:
                this.bye(options);
                return this;
            case session_1.SessionState.Terminated:
                return this;
            default:
                return this;
        }
    };
    InviteServerContext.prototype.generateResponseOfferAnswer = function (options) {
        if (!this.session) {
            var body = messages_1.getBody(this.incomingInviteRequest.message);
            if (!body || body.contentDisposition !== "session") {
                return this.getOffer(options);
            }
            else {
                return this.setOfferAndGetAnswer(body, options);
            }
        }
        else {
            switch (this.session.signalingState) {
                case session_1.SignalingState.Initial:
                    return this.getOffer(options);
                case session_1.SignalingState.Stable:
                    return Promise.resolve(undefined);
                case session_1.SignalingState.HaveLocalOffer:
                    // o  Once the UAS has sent or received an answer to the initial
                    // offer, it MUST NOT generate subsequent offers in any responses
                    // to the initial INVITE.  This means that a UAS based on this
                    // specification alone can never generate subsequent offers until
                    // completion of the initial transaction.
                    // https://tools.ietf.org/html/rfc3261#section-13.2.1
                    return Promise.resolve(undefined);
                case session_1.SignalingState.HaveRemoteOffer:
                    if (!this.session.offer) {
                        throw new Error("Session offer undefined");
                    }
                    return this.setOfferAndGetAnswer(this.session.offer, options);
                case session_1.SignalingState.Closed:
                    throw new Error("Invalid signaling state " + this.session.signalingState + ".");
                default:
                    throw new Error("Invalid signaling state " + this.session.signalingState + ".");
            }
        }
    };
    InviteServerContext.prototype.handlePrackOfferAnswer = function (request, options) {
        if (!this.session) {
            throw new Error("Session undefined.");
        }
        // If the PRACK doesn't have an offer/answer, nothing to be done.
        var body = messages_1.getBody(request.message);
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
            case session_1.SignalingState.Initial:
                // State should never be reached as first reliable provisional response must have answer/offer.
                throw new Error("Invalid signaling state " + this.session.signalingState + ".");
            case session_1.SignalingState.Stable:
                // Receved answer.
                return this.setAnswer(body, options).then(function () { return undefined; });
            case session_1.SignalingState.HaveLocalOffer:
                // State should never be reached as local offer would be answered by this PRACK
                throw new Error("Invalid signaling state " + this.session.signalingState + ".");
            case session_1.SignalingState.HaveRemoteOffer:
                // Receved offer, generate answer.
                return this.setOfferAndGetAnswer(body, options);
            case session_1.SignalingState.Closed:
                throw new Error("Invalid signaling state " + this.session.signalingState + ".");
            default:
                throw new Error("Invalid signaling state " + this.session.signalingState + ".");
        }
    };
    /**
     * Called when session canceled.
     */
    InviteServerContext.prototype.canceled = function () {
        this._canceled = true;
        return _super.prototype.canceled.call(this);
    };
    /**
     * Called when session terminated.
     * Using it here just for the PRACK timeout.
     */
    InviteServerContext.prototype.terminated = function (message, cause) {
        this.prackNeverArrived();
        return _super.prototype.terminated.call(this, message, cause);
    };
    /**
     * A version of `accept` which resolves a session when the 200 Ok response is sent.
     * @param options Options bucket.
     * @throws {ClosedSessionDescriptionHandlerError} The session description handler closed before method completed.
     * @throws {TransactionStateError} The transaction state does not allow for `accept()` to be called.
     *                                 Note that the transaction state can change while this call is in progress.
     */
    InviteServerContext.prototype._accept = function (options) {
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
        if (this.status === Enums_1.SessionStatus.STATUS_WAITING_FOR_PRACK) {
            this.status = Enums_1.SessionStatus.STATUS_ANSWERED_WAITING_FOR_PRACK;
            return this.waitForArrivalOfPrack()
                .then(function () {
                _this.status = Enums_1.SessionStatus.STATUS_ANSWERED;
                clearTimeout(_this.timers.userNoAnswerTimer); // Ported
            })
                .then(function () { return _this.generateResponseOfferAnswer(options); })
                .then(function (body) { return _this.incomingInviteRequest.accept({ statusCode: 200, body: body }); });
        }
        // Ported
        if (this.status === Enums_1.SessionStatus.STATUS_WAITING_FOR_ANSWER) {
            this.status = Enums_1.SessionStatus.STATUS_ANSWERED;
        }
        else {
            return Promise.reject(new Exceptions_1.Exceptions.InvalidStateError(this.status));
        }
        this.status = Enums_1.SessionStatus.STATUS_ANSWERED;
        clearTimeout(this.timers.userNoAnswerTimer); // Ported
        return this.generateResponseOfferAnswer(options)
            .then(function (body) { return _this.incomingInviteRequest.accept({ statusCode: 200, body: body }); });
    };
    /**
     * A version of `progress` which resolves when the provisional response is sent.
     * @param options Options bucket.
     * @throws {ClosedSessionDescriptionHandlerError} The session description handler closed before method completed.
     * @throws {TransactionStateError} The transaction state does not allow for `progress()` to be called.
     *                                 Note that the transaction state can change while this call is in progress.
     */
    InviteServerContext.prototype._progress = function (options) {
        if (options === void 0) { options = {}; }
        // Ported
        var statusCode = options.statusCode || 180;
        var reasonPhrase = options.reasonPhrase;
        var extraHeaders = (options.extraHeaders || []).slice();
        var body = options.body ? messages_1.fromBodyLegacy(options.body) : undefined;
        try {
            var progressResponse = this.incomingInviteRequest.progress({ statusCode: statusCode, reasonPhrase: reasonPhrase, extraHeaders: extraHeaders, body: body });
            this.emit("progress", progressResponse.message, reasonPhrase); // Ported
            this.session = progressResponse.session;
            return Promise.resolve(progressResponse);
        }
        catch (error) {
            return Promise.reject(error);
        }
    };
    /**
     * A version of `progress` which resolves when the reliable provisional response is sent.
     * @param options Options bucket.
     * @throws {ClosedSessionDescriptionHandlerError} The session description handler closed before method completed.
     * @throws {TransactionStateError} The transaction state does not allow for `progress()` to be called.
     *                                 Note that the transaction state can change while this call is in progress.
     */
    InviteServerContext.prototype._reliableProgress = function (options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        var statusCode = options.statusCode || 183;
        var reasonPhrase = options.reasonPhrase;
        var extraHeaders = (options.extraHeaders || []).slice();
        extraHeaders.push("Require: 100rel");
        extraHeaders.push("RSeq: " + Math.floor(Math.random() * 10000));
        // Get an offer/answer and send a reply.
        return this.generateResponseOfferAnswer(options)
            .then(function (body) { return _this.incomingInviteRequest.progress({ statusCode: statusCode, reasonPhrase: reasonPhrase, extraHeaders: extraHeaders, body: body }); })
            .then(function (progressResponse) {
            _this.emit("progress", progressResponse.message, reasonPhrase); // Ported
            _this.session = progressResponse.session;
            return progressResponse;
        });
    };
    /**
     * A version of `progress` which resolves when the reliable provisional response is acknowledged.
     * @param options Options bucket.
     * @throws {ClosedSessionDescriptionHandlerError} The session description handler closed before method completed.
     * @throws {TransactionStateError} The transaction state does not allow for `progress()` to be called.
     *                                 Note that the transaction state can change while this call is in progress.
     */
    InviteServerContext.prototype._reliableProgressWaitForPrack = function (options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        var statusCode = options.statusCode || 183;
        var reasonPhrase = options.reasonPhrase;
        var extraHeaders = (options.extraHeaders || []).slice();
        extraHeaders.push("Require: 100rel");
        extraHeaders.push("RSeq: " + Math.floor(Math.random() * 10000));
        var body;
        // Ported - set status.
        this.status = Enums_1.SessionStatus.STATUS_WAITING_FOR_PRACK;
        return new Promise(function (resolve, reject) {
            var waitingForPrack = true;
            return _this.generateResponseOfferAnswer(options)
                .then(function (offerAnswer) {
                body = offerAnswer;
                return _this.incomingInviteRequest.progress({ statusCode: statusCode, reasonPhrase: reasonPhrase, extraHeaders: extraHeaders, body: body });
            })
                .then(function (progressResponse) {
                _this.emit("progress", progressResponse.message, reasonPhrase); // Ported
                _this.session = progressResponse.session;
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
                                if (_this.status === Enums_1.SessionStatus.STATUS_WAITING_FOR_PRACK) {
                                    _this.status = Enums_1.SessionStatus.STATUS_WAITING_FOR_ANSWER;
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
                        _this.terminated(undefined, Constants_1.C.causes.NO_PRACK);
                        reject(new Exceptions_1.Exceptions.TerminatedSessionError());
                    }
                    catch (error) {
                        reject(error);
                    }
                };
                var prackWaitTimeoutTimer = setTimeout(prackWaitTimeout, Timers_1.Timers.T1 * 64);
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
                var timeout = Timers_1.Timers.T1;
                var rel1xxRetransmissionTimer = setTimeout(rel1xxRetransmission, timeout);
            });
        });
    };
    /**
     * Callback for when ACK for a 2xx response is never received.
     * @param session Session the ACK never arrived for
     */
    InviteServerContext.prototype.onAckTimeout = function () {
        if (this.status === Enums_1.SessionStatus.STATUS_WAITING_FOR_ACK) {
            this.logger.log("no ACK received for an extended period of time, terminating the call");
            if (!this.session) {
                throw new Error("Session undefined.");
            }
            this.session.bye();
            this.terminated(undefined, Constants_1.C.causes.NO_ACK);
        }
    };
    /**
     * FIXME: TODO: The current library interface presents async methods without a
     * proper async error handling mechanism. Arguably a promise based interface
     * would be an improvement over the pattern of returning `this`. The approach has
     * been generally along the lines of log a error and terminate.
     */
    InviteServerContext.prototype.onContextError = function (error) {
        if (error instanceof Exceptions_1.Exception) { // There might be interest in catching these Exceptions.
            if (error instanceof Exceptions_1.Exceptions.SessionDescriptionHandlerError) {
                this.logger.error(error.message);
                if (error.error) {
                    this.logger.error(error.error);
                }
            }
            else if (error instanceof Exceptions_1.Exception) {
                this.logger.error(error.message);
            }
        }
        else if (error instanceof Exceptions_1.Exceptions.TerminatedSessionError) {
            // PRACK never arrived, so we timed out waiting for it.
            this.logger.warn("Incoming session terminated while waiting for PRACK.");
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
            this.incomingInviteRequest.reject({ statusCode: 480 }); // "Temporarily Unavailable"
            this.failed(this.incomingInviteRequest.message, error.message);
            this.terminated(this.incomingInviteRequest.message, error.message);
        }
        catch (error) {
            return;
        }
    };
    InviteServerContext.prototype.prackArrived = function () {
        if (this.waitingForPrackResolve) {
            this.waitingForPrackResolve();
        }
        this.waitingForPrackPromise = undefined;
        this.waitingForPrackResolve = undefined;
        this.waitingForPrackReject = undefined;
    };
    InviteServerContext.prototype.prackNeverArrived = function () {
        if (this.waitingForPrackReject) {
            this.waitingForPrackReject(new Exceptions_1.Exceptions.TerminatedSessionError());
        }
        this.waitingForPrackPromise = undefined;
        this.waitingForPrackResolve = undefined;
        this.waitingForPrackReject = undefined;
    };
    /**
     * @throws {Exceptions.TerminatedSessionError} The session terminated before being accepted (i.e. cancel arrived).
     */
    InviteServerContext.prototype.waitForArrivalOfPrack = function () {
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
    InviteServerContext.prototype.getOffer = function (options) {
        this.hasOffer = true;
        var sdh = this.getSessionDescriptionHandler();
        return sdh
            .getDescription(options.sessionDescriptionHandlerOptions, options.modifiers)
            .then(function (bodyObj) { return messages_1.fromBodyObj(bodyObj); });
    };
    InviteServerContext.prototype.setAnswer = function (answer, options) {
        this.hasAnswer = true;
        var sdh = this.getSessionDescriptionHandler();
        if (!sdh.hasDescription(answer.contentType)) {
            return Promise.reject(new Exceptions_1.Exceptions.UnsupportedSessionDescriptionContentTypeError());
        }
        return sdh
            .setDescription(answer.content, options.sessionDescriptionHandlerOptions, options.modifiers);
    };
    InviteServerContext.prototype.setOfferAndGetAnswer = function (offer, options) {
        this.hasOffer = true;
        this.hasAnswer = true;
        var sdh = this.getSessionDescriptionHandler();
        if (!sdh.hasDescription(offer.contentType)) {
            return Promise.reject(new Exceptions_1.Exceptions.UnsupportedSessionDescriptionContentTypeError());
        }
        return sdh
            .setDescription(offer.content, options.sessionDescriptionHandlerOptions, options.modifiers)
            .then(function () { return sdh.getDescription(options.sessionDescriptionHandlerOptions, options.modifiers); })
            .then(function (bodyObj) { return messages_1.fromBodyObj(bodyObj); });
    };
    InviteServerContext.prototype.getSessionDescriptionHandler = function () {
        // Create our session description handler if not already done so...
        var sdh = this.sessionDescriptionHandler = this.setupSessionDescriptionHandler();
        // FIXME: Ported - this can get emitted multiple times even when only created once... don't we care?
        this.emit("SessionDescriptionHandler-created", this.sessionDescriptionHandler);
        // Return.
        return sdh;
    };
    return InviteServerContext;
}(Session_1.InviteServerContext));
exports.InviteServerContext = InviteServerContext;
