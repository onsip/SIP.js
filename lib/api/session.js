"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var events_1 = require("events");
var Constants_1 = require("../Constants");
var core_1 = require("../core");
var allowed_methods_1 = require("../core/user-agent-core/allowed-methods");
var Enums_1 = require("../Enums");
var Exceptions_1 = require("../Exceptions");
var Utils_1 = require("../Utils");
var emitter_1 = require("./emitter");
var info_1 = require("./info");
var notification_1 = require("./notification");
var referral_1 = require("./referral");
var session_state_1 = require("./session-state");
/**
 * A session provides real time communication between one or more participants.
 * @public
 */
var Session = /** @class */ (function (_super) {
    tslib_1.__extends(Session, _super);
    /**
     * Constructor.
     * @param userAgent - User agent. See {@link UserAgent} for details.
     * @internal
     */
    function Session(userAgent, options) {
        if (options === void 0) { options = {}; }
        var _this = _super.call(this) || this;
        // Property overlap with ClientContext & ServerContext Interfaces
        /** @internal */
        _this.type = Enums_1.TypeStrings.Session;
        /** @internal */
        _this.method = Constants_1.C.INVITE;
        /** @internal */
        _this.localHold = false;
        /** DEPRECATED: Session status */
        /** @internal */
        _this.status = Enums_1.SessionStatus.STATUS_NULL;
        /** @internal */
        _this.rel100 = Constants_1.C.supported.UNSUPPORTED;
        /** @internal */
        _this.expiresTimer = undefined;
        /** @internal */
        _this.userNoAnswerTimer = undefined;
        _this._state = session_state_1.SessionState.Initial;
        _this._stateEventEmitter = new events_1.EventEmitter();
        _this.pendingReinvite = false;
        _this.tones = undefined;
        _this.userAgent = userAgent;
        _this.delegate = options.delegate;
        _this.logger = userAgent.getLogger("sip.session");
        var sessionDescriptionHandlerFactory = _this.userAgent.configuration.sessionDescriptionHandlerFactory;
        if (!sessionDescriptionHandlerFactory) {
            throw new Exceptions_1.Exceptions.SessionDescriptionHandlerError("A session description handler is required for the session to function.");
        }
        _this.sessionDescriptionHandlerFactory = sessionDescriptionHandlerFactory;
        _this.errorListener = _this.onTransportError.bind(_this);
        if (userAgent.transport) {
            userAgent.transport.on("transportError", _this.errorListener);
        }
        return _this;
    }
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    Session.prototype.on = function (name, callback) {
        return _super.prototype.on.call(this, name, callback);
    };
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    Session.prototype.emit = function (event) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        return _super.prototype.emit.apply(this, [event].concat(args));
    };
    Object.defineProperty(Session.prototype, "sessionDescriptionHandler", {
        /**
         * Session description handler.
         */
        get: function () {
            return this._sessionDescriptionHandler;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Session.prototype, "state", {
        /**
         * Session state.
         */
        get: function () {
            return this._state;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Session.prototype, "stateChange", {
        /**
         * Session state change emitter.
         */
        get: function () {
            return emitter_1.makeEmitter(this._stateEventEmitter);
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Renegotiate the session. Sends a re-INVITE.
     * @param options - Options bucket.
     */
    Session.prototype.invite = function (options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        this.logger.log("Session.invite");
        if (this.state !== session_state_1.SessionState.Established) {
            return Promise.reject(new Error("Invalid session state " + this.state));
        }
        if (this.pendingReinvite) {
            return Promise.reject(new Error("Reinvite in progress. Please wait until complete, then try again."));
        }
        if (!this._sessionDescriptionHandler) {
            throw new Error("Session description handler undefined.");
        }
        this.pendingReinvite = true;
        var delegate = {
            onAccept: function (response) {
                // Our peer accepted re-INVITE, so get description from body and set remote offer/answer...
                var body = core_1.getBody(response.message);
                if (!body) {
                    _this.logger.error("Received 2xx final response to re-invite without a description");
                    var error = new Error("Invalid response to a re-invite.");
                    _this.emit("reinviteFailed", _this);
                    _this.emit("renegotiationError", error);
                    _this.pendingReinvite = false;
                    throw error;
                }
                if (options.withoutSdp) {
                    var answerOptions = {
                        sessionDescriptionHandlerOptions: options.sessionDescriptionHandlerOptions,
                        sessionDescriptionHandlerModifiers: options.sessionDescriptionHandlerModifiers
                    };
                    // INVITE without SDP, so set remote offer and send answer in ACk
                    _this.setOfferAndGetAnswer(body, answerOptions)
                        .then(function (answerBody) {
                        var request = response.ack({ body: answerBody });
                        _this.emit("ack", request.message);
                        _this.emit("reinviteAccepted", _this);
                        _this.pendingReinvite = false;
                        if (options.requestDelegate && options.requestDelegate.onAccept) {
                            options.requestDelegate.onAccept(response);
                        }
                    })
                        .catch(function (error) {
                        _this.logger.error(error.message);
                        _this.emit("reinviteFailed", _this);
                        _this.emit("renegotiationError", error);
                        _this.pendingReinvite = false;
                        throw error;
                    });
                }
                else {
                    // INVITE with SDP, so set remote answer and send ACk
                    var answerOptions = {
                        sessionDescriptionHandlerOptions: _this.sessionDescriptionHandlerOptions,
                        sessionDescriptionHandlerModifiers: _this.sessionDescriptionHandlerModifiers
                    };
                    _this.setAnswer(body, answerOptions)
                        .then(function () {
                        var request = response.ack();
                        _this.emit("ack", request.message);
                        _this.emit("reinviteAccepted", _this);
                        _this.pendingReinvite = false;
                        if (options.requestDelegate && options.requestDelegate.onAccept) {
                            options.requestDelegate.onAccept(response);
                        }
                    })
                        .catch(function (error) {
                        _this.logger.error(error.message);
                        _this.emit("reinviteFailed", _this);
                        _this.emit("renegotiationError", error);
                        _this.pendingReinvite = false;
                        throw error;
                    });
                }
            },
            onProgress: function (response) {
                return;
            },
            onRedirect: function (response) {
                return;
            },
            onReject: function (response) {
                _this.logger.error("Received a non-2xx final response to re-invite");
                var error = new Error("Invalid response to a re-invite.");
                _this.emit("reinviteFailed", _this);
                _this.emit("renegotiationError", error);
                _this.pendingReinvite = false;
                if (options.requestDelegate && options.requestDelegate.onReject) {
                    options.requestDelegate.onReject(response);
                }
            },
            onTrying: function (response) {
                return;
            }
        };
        var requestOptions = options.requestOptions || {};
        requestOptions.extraHeaders = (requestOptions.extraHeaders || []).slice();
        requestOptions.extraHeaders.push("Allow: " + allowed_methods_1.AllowedMethods.toString());
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
        var offerOptions = {
            sessionDescriptionHandlerOptions: options.sessionDescriptionHandlerOptions,
            sessionDescriptionHandlerModifiers: options.sessionDescriptionHandlerModifiers
        };
        return this.getOffer(offerOptions)
            .then(function (offerBody) {
            if (!_this.dialog) {
                _this.pendingReinvite = false;
                throw new Error("Dialog undefined.");
            }
            requestOptions.body = offerBody;
            return _this.dialog.invite(delegate, requestOptions);
        })
            .catch(function (error) {
            _this.logger.error(error.message);
            _this.emit("reinviteFailed", _this);
            _this.emit("renegotiationError", error);
            _this.pendingReinvite = false;
            throw error;
        });
    };
    /**
     * TODO: This is awkward.
     * Helper function
     * @internal
     */
    Session.prototype.byePending = function () {
        this.stateTransition(session_state_1.SessionState.Terminating);
        this.terminated();
    };
    /**
     * TODO: This is awkward.
     * Helper function
     * @internal
     */
    Session.prototype.byeSent = function (request) {
        this.emit("bye", request.message);
        this.stateTransition(session_state_1.SessionState.Terminated);
        this.terminated();
    };
    /**
     * Send BYE.
     * @param delegate - Request delegate.
     * @param options - Request options bucket.
     * @internal
     */
    Session.prototype.bye = function (delegate, options) {
        var _this = this;
        // Using core session dialog
        if (!this.dialog) {
            return Promise.reject(new Error("Session dialog undefined."));
        }
        var dialog = this.dialog;
        // The caller's UA MAY send a BYE for either confirmed or early dialogs,
        // and the callee's UA MAY send a BYE on confirmed dialogs, but MUST NOT
        // send a BYE on early dialogs. However, the callee's UA MUST NOT send a
        // BYE on a confirmed dialog until it has received an ACK for its 2xx
        // response or until the server transaction times out.
        // https://tools.ietf.org/html/rfc3261#section-15
        switch (dialog.sessionState) {
            case core_1.SessionState.Initial:
                throw new Error("Invalid dialog state " + dialog.sessionState);
            case core_1.SessionState.Early: // Implementation choice - not sending BYE for early dialogs.
                throw new Error("Invalid dialog state " + dialog.sessionState);
            case core_1.SessionState.AckWait: { // This state only occurs if we are the callee.
                this.byePending();
                return new Promise(function (resolve, reject) {
                    dialog.delegate = {
                        // When ACK shows up, say BYE.
                        onAck: function () {
                            var request = dialog.bye(delegate, options);
                            _this.byeSent(request);
                            resolve(request);
                        },
                        // Or the server transaction times out before the ACK arrives.
                        onAckTimeout: function () {
                            var request = dialog.bye(delegate, options);
                            _this.byeSent(request);
                            resolve(request);
                        }
                    };
                });
            }
            case core_1.SessionState.Confirmed: {
                var request = dialog.bye(delegate, options);
                this.byeSent(request);
                return Promise.resolve(request);
            }
            case core_1.SessionState.Terminated:
                throw new Error("Invalid dialog state " + dialog.sessionState);
            default:
                throw new Error("Unrecognized state.");
        }
    };
    /**
     * Send INFO.
     * @param delegate - Request delegate.
     * @param options - Request options bucket.
     * @internal
     */
    Session.prototype.info = function (delegate, options) {
        // Using core session dialog
        if (!this.dialog) {
            return Promise.reject(new Error("Session dialog undefined."));
        }
        return Promise.resolve(this.dialog.info(delegate, options));
    };
    /**
     * Send REFER.
     * @param delegate - Request delegate.
     * @param options - Request options bucket.
     * @internal
     */
    Session.prototype.refer = function (referrer, delegate, options) {
        // Using core session dialog
        if (!this.dialog) {
            return Promise.reject(new Error("Session dialog undefined."));
        }
        // If the session has a referrer, it will receive any in-dialog NOTIFY requests.
        this.referrer = referrer;
        return Promise.resolve(this.dialog.refer(delegate, options));
    };
    /**
     * @internal
     */
    Session.prototype.close = function () {
        if (this.status === Enums_1.SessionStatus.STATUS_TERMINATED) {
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
        this.status = Enums_1.SessionStatus.STATUS_TERMINATED;
        if (this.userAgent.transport) {
            this.userAgent.transport.removeListener("transportError", this.errorListener);
        }
        if (!this.id) {
            throw new Error("Session id undefined.");
        }
        delete this.userAgent.sessions[this.id];
        return;
    };
    /**
     * @internal
     */
    Session.prototype.onRequestTimeout = function () {
        if (this.status === Enums_1.SessionStatus.STATUS_CONFIRMED) {
            this.terminated(undefined, Constants_1.C.causes.REQUEST_TIMEOUT);
        }
        else if (this.status !== Enums_1.SessionStatus.STATUS_TERMINATED) {
            this.failed(undefined, Constants_1.C.causes.REQUEST_TIMEOUT);
            this.terminated(undefined, Constants_1.C.causes.REQUEST_TIMEOUT);
        }
    };
    /**
     * @internal
     */
    Session.prototype.onTransportError = function () {
        if (this.status !== Enums_1.SessionStatus.STATUS_CONFIRMED && this.status !== Enums_1.SessionStatus.STATUS_TERMINATED) {
            this.failed(undefined, Constants_1.C.causes.CONNECTION_ERROR);
        }
    };
    /**
     * Handle in dialog ACK request.
     * @internal
     */
    Session.prototype.onAckRequest = function (request) {
        var _this = this;
        this.logger.log("Session.onAckRequest");
        if (this.state !== session_state_1.SessionState.Initial &&
            this.state !== session_state_1.SessionState.Establishing &&
            this.state !== session_state_1.SessionState.Established &&
            this.state !== session_state_1.SessionState.Terminating) {
            this.logger.error("ACK received while in state " + this.state + ", dropping request");
            return;
        }
        // FIXME: Review is this ever true? We're "Established" when dialog created in accept().
        if (this.state === session_state_1.SessionState.Initial || this.state === session_state_1.SessionState.Establishing) {
            this.stateTransition(session_state_1.SessionState.Established);
        }
        var dialog = this.dialog;
        if (!dialog) {
            throw new Error("Dialog undefined.");
        }
        // Helper function.
        var confirmSession = function () {
            _this.status = Enums_1.SessionStatus.STATUS_CONFIRMED;
            _this.emit("confirmed", request.message);
        };
        // If the ACK doesn't have an offer/answer, nothing to be done.
        var body = core_1.getBody(request.message);
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
        var options = {
            sessionDescriptionHandlerOptions: this.sessionDescriptionHandlerOptions,
            sessionDescriptionHandlerModifiers: this.sessionDescriptionHandlerModifiers
        };
        switch (dialog.signalingState) {
            case core_1.SignalingState.Initial:
                // State should never be reached as first reliable response must have answer/offer.
                throw new Error("Invalid signaling state " + dialog.signalingState + ".");
            case core_1.SignalingState.Stable:
                // Receved answer.
                this.setAnswer(body, options)
                    .then(function () { return confirmSession(); })
                    .catch(function (error) {
                    // FIXME: TODO - need to do something to handle this error
                    _this.logger.error(error);
                    var extraHeaders = ["Reason: " + Utils_1.Utils.getReasonHeaderValue(488, "Bad Media Description")];
                    _this.bye(undefined, { extraHeaders: extraHeaders });
                    _this.failed(request.message, Constants_1.C.causes.BAD_MEDIA_DESCRIPTION);
                    _this.terminated(request.message, Constants_1.C.causes.BAD_MEDIA_DESCRIPTION);
                    throw error;
                });
                return;
            case core_1.SignalingState.HaveLocalOffer:
                // State should never be reached as local offer would be answered by this ACK
                throw new Error("Invalid signaling state " + dialog.signalingState + ".");
            case core_1.SignalingState.HaveRemoteOffer:
                // State should never be reached as remote offer would be answered in first reliable response.
                throw new Error("Invalid signaling state " + dialog.signalingState + ".");
            case core_1.SignalingState.Closed:
                throw new Error("Invalid signaling state " + dialog.signalingState + ".");
            default:
                throw new Error("Invalid signaling state " + dialog.signalingState + ".");
        }
    };
    /**
     * Handle in dialog BYE request.
     * @internal
     */
    Session.prototype.onByeRequest = function (request) {
        this.logger.log("Session.onByeRequest");
        if (this.state !== session_state_1.SessionState.Established) {
            this.logger.error("BYE received while in state " + this.state + ", dropping request");
            return;
        }
        request.accept();
        this.stateTransition(session_state_1.SessionState.Terminated);
        if (this.status === Enums_1.SessionStatus.STATUS_CONFIRMED) {
            this.emit("bye", request.message);
            this.terminated(request.message, Constants_1.C.BYE);
        }
    };
    /**
     * Handle in dialog INFO request.
     * @internal
     */
    Session.prototype.onInfoRequest = function (request) {
        this.logger.log("Session.onInfoRequest");
        if (this.state !== session_state_1.SessionState.Established) {
            this.logger.error("INFO received while in state " + this.state + ", dropping request");
            return;
        }
        if (this.delegate && this.delegate.onInfo) {
            var info = new info_1.Info(request);
            this.delegate.onInfo(info);
        }
        else {
            request.accept();
        }
    };
    /**
     * Handle in dialog INVITE request.
     * Unless an `onInviteFailure` delegate is available, the session is terminated on failure.
     * @internal
     */
    Session.prototype.onInviteRequest = function (request) {
        var _this = this;
        this.logger.log("Session.onInviteRequest");
        if (this.state !== session_state_1.SessionState.Established) {
            this.logger.error("INVITE received while in state " + this.state + ", dropping request");
            return;
        }
        // Handle P-Asserted-Identity
        if (request.message.hasHeader("P-Asserted-Identity")) {
            var header = request.message.getHeader("P-Asserted-Identity");
            if (!header) {
                throw new Error("Header undefined.");
            }
            this.assertedIdentity = core_1.Grammar.nameAddrHeaderParse(header);
        }
        this.emit("reinvite", this, request.message);
        // TODO: would be nice to have core track and set the Contact header,
        // but currently the session which is setting it is holding onto it.
        var extraHeaders = ["Contact: " + this.contact];
        // FIXME: TODO: These are the options/modifiers set on the initial INVITE and
        // it seems just plain broken to re-use them on a re-invite.
        // This behavior was ported from legacy code and the issue punted down the road.
        var options = {
            sessionDescriptionHandlerOptions: this.sessionDescriptionHandlerOptions,
            sessionDescriptionHandlerModifiers: this.sessionDescriptionHandlerModifiers
        };
        this.generateResponseOfferAnswerInDialog(options)
            .then(function (body) {
            request.accept({ statusCode: 200, extraHeaders: extraHeaders, body: body });
            _this.emit("reinviteAccepted", _this);
            if (_this.delegate && _this.delegate.onReinviteSuccess) {
                _this.delegate.onReinviteSuccess();
            }
        })
            .catch(function (error) {
            _this.logger.error(error.message);
            request.reject({ statusCode: 488 });
            _this.emit("reinviteFailed", _this);
            _this.emit("renegotiationError", error);
            if (_this.delegate && _this.delegate.onReinviteFailure) {
                _this.delegate.onReinviteFailure(error);
            }
            else {
                _this.logger.error("A failure occurred processing re-INVITE request with no delegate, terminating session...");
                _this.bye(undefined, {
                    extraHeaders: ["Reason: " + Utils_1.Utils.getReasonHeaderValue(488, "Not Acceptable Here")]
                });
            }
        });
    };
    /**
     * Handle in dialog NOTIFY request.
     * @internal
     */
    Session.prototype.onNotifyRequest = function (request) {
        this.logger.log("Session.onNotifyRequest");
        if (this.state !== session_state_1.SessionState.Established) {
            this.logger.error("NOTIFY received while in state " + this.state + ", dropping request");
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
            var notification = new notification_1.Notification(request);
            this.referrer.delegate.onNotify(notification);
            return;
        }
        // Otherwise accept the NOTIFY.
        if (this.delegate && this.delegate.onNotify) {
            var notification = new notification_1.Notification(request);
            this.delegate.onNotify(notification);
        }
        else {
            request.accept();
        }
        this.emit("notify", request.message);
    };
    /**
     * Handle in dialog PRACK request.
     * @internal
     */
    Session.prototype.onPrackRequest = function (request) {
        this.logger.log("Session.onPrackRequest");
        if (this.state !== session_state_1.SessionState.Established) {
            this.logger.error("PRACK received while in state " + this.state + ", dropping request");
            return;
        }
        throw new Error("Unimplemented.");
    };
    /**
     * Handle in dialog REFER request.
     * @internal
     */
    Session.prototype.onReferRequest = function (request) {
        var _this = this;
        this.logger.log("Session.onReferRequest");
        if (this.state !== session_state_1.SessionState.Established) {
            this.logger.error("REFER received while in state " + this.state + ", dropping request");
            return;
        }
        if (this.status === Enums_1.SessionStatus.STATUS_CONFIRMED) {
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
            var referral_2 = new referral_1.Referral(request, this);
            if (this.delegate && this.delegate.onRefer) {
                this.delegate.onRefer(referral_2);
            }
            else {
                this.logger.log("No delegate available to handle REFER, automatically accepting and following.");
                referral_2
                    .accept()
                    .then(function () { return referral_2
                    .makeInviter(_this.passedOptions)
                    .invite(); })
                    .catch(function (error) {
                    // FIXME: logging and eating error...
                    _this.logger.error(error.message);
                });
            }
        }
    };
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    Session.prototype.accepted = function (response, cause) {
        if (response instanceof core_1.IncomingResponseMessage) {
            cause = Utils_1.Utils.getReasonPhrase(response.statusCode || 0, cause);
        }
        this.startTime = new Date();
        if (this.replacee) {
            this.replacee.emit("replaced", this);
            this.replacee.bye();
        }
        this.emit("accepted", response, cause);
    };
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    Session.prototype.canceled = function () {
        if (this._sessionDescriptionHandler) {
            this._sessionDescriptionHandler.close();
        }
        this.emit("cancel");
    };
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    Session.prototype.connecting = function (request) {
        this.emit("connecting", { request: request });
    };
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    Session.prototype.failed = function (response, cause) {
        if (this.status === Enums_1.SessionStatus.STATUS_TERMINATED) {
            return;
        }
        this.emit("failed", response, cause);
    };
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    Session.prototype.rejected = function (response, cause) {
        this.emit("rejected", response, cause);
    };
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    Session.prototype.terminated = function (message, cause) {
        if (this.status === Enums_1.SessionStatus.STATUS_TERMINATED) {
            return;
        }
        this.endTime = new Date();
        this.close();
        this.emit("terminated", message, cause);
    };
    /**
     * Generate an offer or answer for a response to an INVITE request.
     * If a remote offer was provided in the request, set the remote
     * description and get a local answer. If a remote offer was not
     * provided, generates a local offer.
     * @internal
     */
    Session.prototype.generateResponseOfferAnswer = function (request, options) {
        if (this.dialog) {
            return this.generateResponseOfferAnswerInDialog(options);
        }
        var body = core_1.getBody(request.message);
        if (!body || body.contentDisposition !== "session") {
            return this.getOffer(options);
        }
        else {
            return this.setOfferAndGetAnswer(body, options);
        }
    };
    /**
     * Generate an offer or answer for a response to an INVITE request
     * when a dialog (early or otherwise) has already been established.
     * This method may NOT be called if a dialog has yet to be established.
     * @internal
     */
    Session.prototype.generateResponseOfferAnswerInDialog = function (options) {
        if (!this.dialog) {
            throw new Error("Dialog undefined.");
        }
        switch (this.dialog.signalingState) {
            case core_1.SignalingState.Initial:
                return this.getOffer(options);
            case core_1.SignalingState.HaveLocalOffer:
                // o  Once the UAS has sent or received an answer to the initial
                // offer, it MUST NOT generate subsequent offers in any responses
                // to the initial INVITE.  This means that a UAS based on this
                // specification alone can never generate subsequent offers until
                // completion of the initial transaction.
                // https://tools.ietf.org/html/rfc3261#section-13.2.1
                return Promise.resolve(undefined);
            case core_1.SignalingState.HaveRemoteOffer:
                if (!this.dialog.offer) {
                    throw new Error("Session offer undefined in signaling state " + this.dialog.signalingState + ".");
                }
                return this.setOfferAndGetAnswer(this.dialog.offer, options);
            case core_1.SignalingState.Stable:
                // o  Once the UAS has sent or received an answer to the initial
                // offer, it MUST NOT generate subsequent offers in any responses
                // to the initial INVITE.  This means that a UAS based on this
                // specification alone can never generate subsequent offers until
                // completion of the initial transaction.
                // https://tools.ietf.org/html/rfc3261#section-13.2.1
                if (this.state !== session_state_1.SessionState.Established) {
                    return Promise.resolve(undefined);
                }
                // In dialog INVITE without offer, get an offer for the response.
                return this.getOffer(options);
            case core_1.SignalingState.Closed:
                throw new Error("Invalid signaling state " + this.dialog.signalingState + ".");
            default:
                throw new Error("Invalid signaling state " + this.dialog.signalingState + ".");
        }
    };
    /**
     * Get local offer.
     * @internal
     */
    Session.prototype.getOffer = function (options) {
        var sdh = this.setupSessionDescriptionHandler();
        var sdhOptions = options.sessionDescriptionHandlerOptions;
        var sdhModifiers = options.sessionDescriptionHandlerModifiers;
        return sdh.getDescription(sdhOptions, sdhModifiers)
            .then(function (bodyAndContentType) { return Utils_1.Utils.fromBodyObj(bodyAndContentType); })
            .catch(function (error) {
            throw (error instanceof Error ? error : new Error(error));
        });
    };
    /**
     * Set remote answer.
     * @internal
     */
    Session.prototype.setAnswer = function (answer, options) {
        var sdh = this.setupSessionDescriptionHandler();
        var sdhOptions = options.sessionDescriptionHandlerOptions;
        var sdhModifiers = options.sessionDescriptionHandlerModifiers;
        if (!sdh.hasDescription(answer.contentType)) {
            return Promise.reject(new Exceptions_1.Exceptions.UnsupportedSessionDescriptionContentTypeError());
        }
        return sdh.setDescription(answer.content, sdhOptions, sdhModifiers)
            .catch(function (error) {
            throw (error instanceof Error ? error : new Error(error));
        });
    };
    /**
     * Set remote offer and get local answer.
     * @internal
     */
    Session.prototype.setOfferAndGetAnswer = function (offer, options) {
        var sdh = this.setupSessionDescriptionHandler();
        var sdhOptions = options.sessionDescriptionHandlerOptions;
        var sdhModifiers = options.sessionDescriptionHandlerModifiers;
        if (!sdh.hasDescription(offer.contentType)) {
            return Promise.reject(new Exceptions_1.Exceptions.UnsupportedSessionDescriptionContentTypeError());
        }
        return sdh.setDescription(offer.content, sdhOptions, sdhModifiers)
            .then(function () { return sdh.getDescription(sdhOptions, sdhModifiers); })
            .then(function (bodyAndContentType) { return Utils_1.Utils.fromBodyObj(bodyAndContentType); })
            .catch(function (error) {
            throw (error instanceof Error ? error : new Error(error));
        });
    };
    /**
     * SDH for confirmed dialog.
     * @internal
     */
    Session.prototype.setSessionDescriptionHandler = function (sdh) {
        if (this._sessionDescriptionHandler) {
            throw new Error("Sessionn description handler defined.");
        }
        this._sessionDescriptionHandler = sdh;
    };
    /**
     * SDH for confirmed dialog.
     * @internal
     */
    Session.prototype.setupSessionDescriptionHandler = function () {
        if (this._sessionDescriptionHandler) {
            return this._sessionDescriptionHandler;
        }
        this._sessionDescriptionHandler =
            this.sessionDescriptionHandlerFactory(this, this.userAgent.configuration.sessionDescriptionHandlerFactoryOptions);
        this.emit("SessionDescriptionHandler-created", this._sessionDescriptionHandler);
        return this._sessionDescriptionHandler;
    };
    /**
     * Transition session state.
     * @internal
     */
    Session.prototype.stateTransition = function (newState) {
        var _this = this;
        var invalidTransition = function () {
            throw new Error("Invalid state transition from " + _this._state + " to " + newState);
        };
        // Validate transition
        switch (this._state) {
            case session_state_1.SessionState.Initial:
                if (newState !== session_state_1.SessionState.Establishing &&
                    newState !== session_state_1.SessionState.Established &&
                    newState !== session_state_1.SessionState.Terminating &&
                    newState !== session_state_1.SessionState.Terminated) {
                    invalidTransition();
                }
                break;
            case session_state_1.SessionState.Establishing:
                if (newState !== session_state_1.SessionState.Established &&
                    newState !== session_state_1.SessionState.Terminating &&
                    newState !== session_state_1.SessionState.Terminated) {
                    invalidTransition();
                }
                break;
            case session_state_1.SessionState.Established:
                if (newState !== session_state_1.SessionState.Terminating &&
                    newState !== session_state_1.SessionState.Terminated) {
                    invalidTransition();
                }
                break;
            case session_state_1.SessionState.Terminating:
                if (newState !== session_state_1.SessionState.Terminated) {
                    invalidTransition();
                }
                break;
            case session_state_1.SessionState.Terminated:
                invalidTransition();
                break;
            default:
                throw new Error("Unrecognized state.");
        }
        // Transition
        this._state = newState;
        this.logger.log("Session " + this.id + " transitioned to state " + this._state);
        this._stateEventEmitter.emit("event", this._state);
    };
    // DEPRECATED
    /** @internal */
    Session.C = Enums_1.SessionStatus;
    return Session;
}(events_1.EventEmitter));
exports.Session = Session;
