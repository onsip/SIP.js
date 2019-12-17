"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var events_1 = require("events");
var core_1 = require("../core");
var utils_1 = require("../core/messages/utils");
var allowed_methods_1 = require("../core/user-agent-core/allowed-methods");
var emitter_1 = require("./emitter");
var exceptions_1 = require("./exceptions");
var info_1 = require("./info");
var notification_1 = require("./notification");
var referral_1 = require("./referral");
var session_state_1 = require("./session-state");
/**
 * A session provides real time communication between one or more participants.
 *
 * @remarks
 * The transport behaves in a deterministic manner according to the
 * the state defined in {@link SessionState}.
 * @public
 */
var Session = /** @class */ (function () {
    /**
     * Constructor.
     * @param userAgent - User agent. See {@link UserAgent} for details.
     * @internal
     */
    function Session(userAgent, options) {
        if (options === void 0) { options = {}; }
        /** True if there is a re-INVITE request outstanding. */
        this.pendingReinvite = false;
        /** Session state. */
        this._state = session_state_1.SessionState.Initial;
        /** Session state emitter. */
        this._stateEventEmitter = new events_1.EventEmitter();
        this.delegate = options.delegate;
        this._userAgent = userAgent;
    }
    /**
     * Destructor.
     */
    Session.prototype.dispose = function () {
        var _this = this;
        this.logger.log("Session " + this.id + " in state " + this._state + " is being disposed");
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
            case session_state_1.SessionState.Initial:
                break; // the Inviter/Invitation sub class dispose method handles this case
            case session_state_1.SessionState.Establishing:
                break; // the Inviter/Invitation sub class dispose method handles this case
            case session_state_1.SessionState.Established:
                return new Promise(function (resolve, reject) {
                    _this._bye({
                        onAccept: function () { return resolve(); },
                        onRedirect: function () { return resolve(); },
                        onReject: function () { return resolve(); }
                    });
                });
            case session_state_1.SessionState.Terminating:
                break; // nothing to be done
            case session_state_1.SessionState.Terminated:
                break; // nothing to be done
            default:
                throw new Error("Unknown state.");
        }
        return Promise.resolve();
    };
    Object.defineProperty(Session.prototype, "assertedIdentity", {
        /**
         * The asserted identity of the remote user.
         */
        get: function () {
            return this._assertedIdentity;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Session.prototype, "dialog", {
        /**
         * The confirmed session dialog.
         */
        get: function () {
            return this._dialog;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Session.prototype, "id", {
        /**
         * A unique identifier for this session.
         */
        get: function () {
            return this._id;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Session.prototype, "replacee", {
        /**
         * The session being replace by this one.
         */
        get: function () {
            return this._replacee;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Session.prototype, "sessionDescriptionHandler", {
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
        get: function () {
            return this._sessionDescriptionHandler;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Session.prototype, "sessionDescriptionHandlerFactory", {
        /**
         * Session description handler factory.
         */
        get: function () {
            return this.userAgent.configuration.sessionDescriptionHandlerFactory;
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
            return emitter_1._makeEmitter(this._stateEventEmitter);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Session.prototype, "userAgent", {
        /**
         * The user agent.
         */
        get: function () {
            return this._userAgent;
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
            return Promise.reject(new exceptions_1.RequestPendingError("Reinvite in progress. Please wait until complete, then try again."));
        }
        this.pendingReinvite = true;
        var delegate = {
            onAccept: function (response) {
                // A re-INVITE transaction has an offer/answer [RFC3264] exchange
                // associated with it.  The UAC (User Agent Client) generating a given
                // re-INVITE can act as the offerer or as the answerer.  A UAC willing
                // to act as the offerer includes an offer in the re-INVITE.  The UAS
                // (User Agent Server) then provides an answer in a response to the
                // re-INVITE.  A UAC willing to act as answerer does not include an
                // offer in the re-INVITE.  The UAS then provides an offer in a response
                // to the re-INVITE becoming, thus, the offerer.
                // https://tools.ietf.org/html/rfc6141#section-1
                var body = core_1.getBody(response.message);
                if (!body) {
                    // No way to recover, so terminate session and mark as failed.
                    _this.logger.error("Received 2xx response to re-INVITE without a session description");
                    _this.ackAndBye(response, 400, "Missing session description");
                    _this.stateTransition(session_state_1.SessionState.Terminated);
                    _this.pendingReinvite = false;
                    return;
                }
                if (options.withoutSdp) {
                    // INVITE without SDP - set remote offer and send an answer in the ACK
                    // FIXME: SDH options & SDH modifiers options are applied somewhat ambiguously
                    //        This behavior was ported from legacy code and the issue punted down the road.
                    var answerOptions = {
                        sessionDescriptionHandlerOptions: options.sessionDescriptionHandlerOptions,
                        sessionDescriptionHandlerModifiers: options.sessionDescriptionHandlerModifiers
                    };
                    _this.setOfferAndGetAnswer(body, answerOptions)
                        .then(function (answerBody) {
                        response.ack({ body: answerBody });
                    })
                        .catch(function (error) {
                        // No way to recover, so terminate session and mark as failed.
                        _this.logger.error("Failed to handle offer in 2xx response to re-INVITE");
                        _this.logger.error(error.message);
                        if (_this.state === session_state_1.SessionState.Terminated) {
                            // A BYE should not be sent if already terminated.
                            // For example, a BYE may be sent/received while re-INVITE is outstanding.
                            response.ack();
                        }
                        else {
                            _this.ackAndBye(response, 488, "Bad Media Description");
                            _this.stateTransition(session_state_1.SessionState.Terminated);
                        }
                    })
                        .then(function () {
                        _this.pendingReinvite = false;
                        if (options.requestDelegate && options.requestDelegate.onAccept) {
                            options.requestDelegate.onAccept(response);
                        }
                    });
                }
                else {
                    // INVITE with SDP - set remote answer and send an ACK
                    // FIXME: SDH options & SDH modifiers options are applied somewhat ambiguously
                    //        This behavior was ported from legacy code and the issue punted down the road.
                    var answerOptions = {
                        sessionDescriptionHandlerOptions: _this._sessionDescriptionHandlerOptions,
                        sessionDescriptionHandlerModifiers: _this._sessionDescriptionHandlerModifiers
                    };
                    _this.setAnswer(body, answerOptions)
                        .then(function () {
                        response.ack();
                    })
                        .catch(function (error) {
                        // No way to recover, so terminate session and mark as failed.
                        _this.logger.error("Failed to handle answer in 2xx response to re-INVITE");
                        _this.logger.error(error.message);
                        // A BYE should only be sent if session is not already terminated.
                        // For example, a BYE may be sent/received while re-INVITE is outstanding.
                        // The ACK needs to be sent regardless as it was not handled by the transaction.
                        if (_this.state !== session_state_1.SessionState.Terminated) {
                            _this.ackAndBye(response, 488, "Bad Media Description");
                            _this.stateTransition(session_state_1.SessionState.Terminated);
                        }
                        else {
                            response.ack();
                        }
                    })
                        .then(function () {
                        _this.pendingReinvite = false;
                        if (options.requestDelegate && options.requestDelegate.onAccept) {
                            options.requestDelegate.onAccept(response);
                        }
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
                _this.logger.warn("Received a non-2xx response to re-INVITE");
                _this.pendingReinvite = false;
                if (options.withoutSdp) {
                    if (options.requestDelegate && options.requestDelegate.onReject) {
                        options.requestDelegate.onReject(response);
                    }
                }
                else {
                    _this.rollbackOffer()
                        .catch(function (error) {
                        // No way to recover, so terminate session and mark as failed.
                        _this.logger.error("Failed to rollback offer on non-2xx response to re-INVITE");
                        _this.logger.error(error.message);
                        // A BYE should only be sent if session is not already terminated.
                        // For example, a BYE may be sent/received while re-INVITE is outstanding.
                        // Note that the ACK was already sent by the transaction, so just need to send BYE.
                        if (_this.state !== session_state_1.SessionState.Terminated) {
                            if (!_this.dialog) {
                                throw new Error("Dialog undefined.");
                            }
                            var extraHeaders = [];
                            extraHeaders.push("Reason: " + _this.getReasonHeaderValue(500, "Internal Server Error"));
                            _this.dialog.bye(undefined, { extraHeaders: extraHeaders });
                            _this.stateTransition(session_state_1.SessionState.Terminated);
                        }
                    })
                        .then(function () {
                        if (options.requestDelegate && options.requestDelegate.onReject) {
                            options.requestDelegate.onReject(response);
                        }
                    });
                }
            },
            onTrying: function (response) {
                return;
            }
        };
        var requestOptions = options.requestOptions || {};
        requestOptions.extraHeaders = (requestOptions.extraHeaders || []).slice();
        requestOptions.extraHeaders.push("Allow: " + allowed_methods_1.AllowedMethods.toString());
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
            _this.logger.error("Failed to send re-INVITE");
            _this.pendingReinvite = false;
            throw error;
        });
    };
    /**
     * Send REFER.
     * @param referrer - Referrer.
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
        this._referrer = referrer;
        return Promise.resolve(this.dialog.refer(delegate, options));
    };
    /**
     * Send BYE.
     * @param delegate - Request delegate.
     * @param options - Request options bucket.
     * @internal
     */
    Session.prototype._bye = function (delegate, options) {
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
                this.stateTransition(session_state_1.SessionState.Terminating); // We're terminating
                return new Promise(function (resolve, reject) {
                    dialog.delegate = {
                        // When ACK shows up, say BYE.
                        onAck: function () {
                            var request = dialog.bye(delegate, options);
                            _this.stateTransition(session_state_1.SessionState.Terminated);
                            resolve(request);
                        },
                        // Or the server transaction times out before the ACK arrives.
                        onAckTimeout: function () {
                            var request = dialog.bye(delegate, options);
                            _this.stateTransition(session_state_1.SessionState.Terminated);
                            resolve(request);
                        }
                    };
                });
            }
            case core_1.SessionState.Confirmed: {
                var request = dialog.bye(delegate, options);
                this.stateTransition(session_state_1.SessionState.Terminated);
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
    Session.prototype._info = function (delegate, options) {
        // Using core session dialog
        if (!this.dialog) {
            return Promise.reject(new Error("Session dialog undefined."));
        }
        return Promise.resolve(this.dialog.info(delegate, options));
    };
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
    Session.prototype.ackAndBye = function (response, statusCode, reasonPhrase) {
        response.ack();
        var extraHeaders = [];
        if (statusCode) {
            extraHeaders.push("Reason: " + this.getReasonHeaderValue(statusCode, reasonPhrase));
        }
        // Using the dialog session associate with the response (which might not be this.dialog)
        response.session.bye(undefined, { extraHeaders: extraHeaders });
    };
    /**
     * Handle in dialog ACK request.
     * @internal
     */
    Session.prototype.onAckRequest = function (request) {
        var _this = this;
        this.logger.log("Session.onAckRequest");
        if (this.state !== session_state_1.SessionState.Established && this.state !== session_state_1.SessionState.Terminating) {
            this.logger.error("ACK received while in state " + this.state + ", dropping request");
            return;
        }
        var dialog = this.dialog;
        if (!dialog) {
            throw new Error("Dialog undefined.");
        }
        switch (dialog.signalingState) {
            case core_1.SignalingState.Initial: {
                // State should never be reached as first reliable response must have answer/offer.
                // So we must have never has sent an offer.
                this.logger.error("Invalid signaling state " + dialog.signalingState + ".");
                var extraHeaders = ["Reason: " + this.getReasonHeaderValue(488, "Bad Media Description")];
                dialog.bye(undefined, { extraHeaders: extraHeaders });
                this.stateTransition(session_state_1.SessionState.Terminated);
                return;
            }
            case core_1.SignalingState.Stable: {
                // State we should be in.
                // Either the ACK has the answer that got us here, or we were in this state prior to the ACK.
                var body = core_1.getBody(request.message);
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
                var options = {
                    sessionDescriptionHandlerOptions: this._sessionDescriptionHandlerOptions,
                    sessionDescriptionHandlerModifiers: this._sessionDescriptionHandlerModifiers
                };
                this.setAnswer(body, options)
                    .catch(function (error) {
                    _this.logger.error(error.message);
                    var extraHeaders = ["Reason: " + _this.getReasonHeaderValue(488, "Bad Media Description")];
                    dialog.bye(undefined, { extraHeaders: extraHeaders });
                    _this.stateTransition(session_state_1.SessionState.Terminated);
                });
                return;
            }
            case core_1.SignalingState.HaveLocalOffer: {
                // State should never be reached as local offer would be answered by this ACK.
                // So we must have received an ACK without an answer.
                this.logger.error("Invalid signaling state " + dialog.signalingState + ".");
                var extraHeaders = ["Reason: " + this.getReasonHeaderValue(488, "Bad Media Description")];
                dialog.bye(undefined, { extraHeaders: extraHeaders });
                this.stateTransition(session_state_1.SessionState.Terminated);
                return;
            }
            case core_1.SignalingState.HaveRemoteOffer: {
                // State should never be reached as remote offer would be answered in first reliable response.
                // So we must have never has sent an answer.
                this.logger.error("Invalid signaling state " + dialog.signalingState + ".");
                var extraHeaders = ["Reason: " + this.getReasonHeaderValue(488, "Bad Media Description")];
                dialog.bye(undefined, { extraHeaders: extraHeaders });
                this.stateTransition(session_state_1.SessionState.Terminated);
                return;
            }
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
     * @internal
     */
    Session.prototype.onInviteRequest = function (request) {
        var _this = this;
        this.logger.log("Session.onInviteRequest");
        if (this.state !== session_state_1.SessionState.Established) {
            this.logger.error("INVITE received while in state " + this.state + ", dropping request");
            return;
        }
        // TODO: would be nice to have core track and set the Contact header,
        // but currently the session which is setting it is holding onto it.
        var extraHeaders = ["Contact: " + this._contact];
        // Handle P-Asserted-Identity
        if (request.message.hasHeader("P-Asserted-Identity")) {
            var header = request.message.getHeader("P-Asserted-Identity");
            if (!header) {
                throw new Error("Header undefined.");
            }
            this._assertedIdentity = core_1.Grammar.nameAddrHeaderParse(header);
        }
        // FIXME: SDH options & SDH modifiers options are applied somewhat ambiguously
        //        This behavior was ported from legacy code and the issue punted down the road.
        var options = {
            sessionDescriptionHandlerOptions: this._sessionDescriptionHandlerOptions,
            sessionDescriptionHandlerModifiers: this._sessionDescriptionHandlerModifiers
        };
        this.generateResponseOfferAnswerInDialog(options)
            .then(function (body) {
            var outgoingResponse = request.accept({ statusCode: 200, extraHeaders: extraHeaders, body: body });
            if (_this.delegate && _this.delegate.onInvite) {
                _this.delegate.onInvite(request.message, outgoingResponse.message, 200);
            }
        })
            .catch(function (error) {
            _this.logger.error(error.message);
            _this.logger.error("Failed to handle to re-INVITE request");
            if (!_this.dialog) {
                throw new Error("Dialog undefined.");
            }
            _this.logger.error(_this.dialog.signalingState);
            // If we don't have a local/remote offer...
            if (_this.dialog.signalingState === core_1.SignalingState.Stable) {
                var outgoingResponse = request.reject({ statusCode: 488 }); // Not Acceptable Here
                if (_this.delegate && _this.delegate.onInvite) {
                    _this.delegate.onInvite(request.message, outgoingResponse.message, 488);
                }
                return;
            }
            // Otherwise rollback
            _this.rollbackOffer()
                .then(function () {
                var outgoingResponse = request.reject({ statusCode: 488 }); // Not Acceptable Here
                if (_this.delegate && _this.delegate.onInvite) {
                    _this.delegate.onInvite(request.message, outgoingResponse.message, 488);
                }
            })
                .catch(function (errorRollback) {
                // No way to recover, so terminate session and mark as failed.
                _this.logger.error(errorRollback.message);
                _this.logger.error("Failed to rollback offer on re-INVITE request");
                var outgoingResponse = request.reject({ statusCode: 488 }); // Not Acceptable Here
                // A BYE should only be sent if session is not already terminated.
                // For example, a BYE may be sent/received while re-INVITE is outstanding.
                // Note that the ACK was already sent by the transaction, so just need to send BYE.
                if (_this.state !== session_state_1.SessionState.Terminated) {
                    if (!_this.dialog) {
                        throw new Error("Dialog undefined.");
                    }
                    var extraHeadersBye = [];
                    extraHeadersBye.push("Reason: " + _this.getReasonHeaderValue(500, "Internal Server Error"));
                    _this.dialog.bye(undefined, { extraHeaders: extraHeaders });
                    _this.stateTransition(session_state_1.SessionState.Terminated);
                }
                if (_this.delegate && _this.delegate.onInvite) {
                    _this.delegate.onInvite(request.message, outgoingResponse.message, 488);
                }
            });
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
        // If this a NOTIFY associated with the progress of a REFER,
        // look to delegate handling to the associated Referrer.
        if (this._referrer && this._referrer.delegate && this._referrer.delegate.onNotify) {
            var notification = new notification_1.Notification(request);
            this._referrer.delegate.onNotify(notification);
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
        // REFER is a SIP request and is constructed as defined in [1].  A REFER
        // request MUST contain exactly one Refer-To header field value.
        // https://tools.ietf.org/html/rfc3515#section-2.4.1
        if (!request.message.hasHeader("refer-to")) {
            this.logger.warn("Invalid REFER packet. A refer-to header is required. Rejecting.");
            request.reject();
            return;
        }
        var referral = new referral_1.Referral(request, this);
        if (this.delegate && this.delegate.onRefer) {
            this.delegate.onRefer(referral);
        }
        else {
            this.logger.log("No delegate available to handle REFER, automatically accepting and following.");
            referral
                .accept()
                .then(function () { return referral
                .makeInviter(_this._referralInviterOptions)
                .invite(); })
                .catch(function (error) {
                // FIXME: logging and eating error...
                _this.logger.error(error.message);
            });
        }
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
        var _this = this;
        var sdh = this.setupSessionDescriptionHandler();
        var sdhOptions = options.sessionDescriptionHandlerOptions;
        var sdhModifiers = options.sessionDescriptionHandlerModifiers;
        // This is intentionally written very defensively. Don't trust SDH to behave.
        try {
            return sdh.getDescription(sdhOptions, sdhModifiers)
                .then(function (bodyAndContentType) { return core_1.fromBodyLegacy(bodyAndContentType); })
                .catch(function (error) {
                _this.logger.error("Session.getOffer: SDH getDescription rejected...");
                var e = error instanceof Error ? error : new Error(error);
                _this.logger.error(e.message);
                throw e;
            });
        }
        catch (error) { // don't trust SDH to throw an Error
            this.logger.error("Session.getOffer: SDH getDescription threw...");
            var e = error instanceof Error ? error : new Error(error);
            this.logger.error(e.message);
            return Promise.reject(e);
        }
    };
    /**
     * Rollback local/remote offer.
     * @internal
     */
    Session.prototype.rollbackOffer = function () {
        var _this = this;
        var sdh = this.setupSessionDescriptionHandler();
        if (!sdh.rollbackDescription) {
            return Promise.resolve();
        }
        // This is intentionally written very defensively. Don't trust SDH to behave.
        try {
            return sdh.rollbackDescription()
                .catch(function (error) {
                _this.logger.error("Session.rollbackOffer: SDH rollbackDescription rejected...");
                var e = error instanceof Error ? error : new Error(error);
                _this.logger.error(e.message);
                throw e;
            });
        }
        catch (error) { // don't trust SDH to throw an Error
            this.logger.error("Session.rollbackOffer: SDH rollbackDescription threw...");
            var e = error instanceof Error ? error : new Error(error);
            this.logger.error(e.message);
            return Promise.reject(e);
        }
    };
    /**
     * Set remote answer.
     * @internal
     */
    Session.prototype.setAnswer = function (answer, options) {
        var _this = this;
        var sdh = this.setupSessionDescriptionHandler();
        var sdhOptions = options.sessionDescriptionHandlerOptions;
        var sdhModifiers = options.sessionDescriptionHandlerModifiers;
        // This is intentionally written very defensively. Don't trust SDH to behave.
        try {
            if (!sdh.hasDescription(answer.contentType)) {
                return Promise.reject(new exceptions_1.ContentTypeUnsupportedError());
            }
        }
        catch (error) {
            this.logger.error("Session.setAnswer: SDH hasDescription threw...");
            var e = error instanceof Error ? error : new Error(error);
            this.logger.error(e.message);
            return Promise.reject(e);
        }
        try {
            return sdh.setDescription(answer.content, sdhOptions, sdhModifiers)
                .catch(function (error) {
                _this.logger.error("Session.setAnswer: SDH setDescription rejected...");
                var e = error instanceof Error ? error : new Error(error);
                _this.logger.error(e.message);
                throw e;
            });
        }
        catch (error) { // don't trust SDH to throw an Error
            this.logger.error("Session.setAnswer: SDH setDescription threw...");
            var e = error instanceof Error ? error : new Error(error);
            this.logger.error(e.message);
            return Promise.reject(e);
        }
    };
    /**
     * Set remote offer and get local answer.
     * @internal
     */
    Session.prototype.setOfferAndGetAnswer = function (offer, options) {
        var _this = this;
        var sdh = this.setupSessionDescriptionHandler();
        var sdhOptions = options.sessionDescriptionHandlerOptions;
        var sdhModifiers = options.sessionDescriptionHandlerModifiers;
        // This is intentionally written very defensively. Don't trust SDH to behave.
        try {
            if (!sdh.hasDescription(offer.contentType)) {
                return Promise.reject(new exceptions_1.ContentTypeUnsupportedError());
            }
        }
        catch (error) {
            this.logger.error("Session.setOfferAndGetAnswer: SDH hasDescription threw...");
            var e = error instanceof Error ? error : new Error(error);
            this.logger.error(e.message);
            return Promise.reject(e);
        }
        try {
            return sdh.setDescription(offer.content, sdhOptions, sdhModifiers)
                .then(function () { return sdh.getDescription(sdhOptions, sdhModifiers); })
                .then(function (bodyAndContentType) { return core_1.fromBodyLegacy(bodyAndContentType); })
                .catch(function (error) {
                _this.logger.error("Session.setOfferAndGetAnswer: SDH setDescription or getDescription rejected...");
                var e = error instanceof Error ? error : new Error(error);
                _this.logger.error(e.message);
                throw e;
            });
        }
        catch (error) { // don't trust SDH to throw an Error
            this.logger.error("Session.setOfferAndGetAnswer: SDH setDescription or getDescription threw...");
            var e = error instanceof Error ? error : new Error(error);
            this.logger.error(e.message);
            return Promise.reject(e);
        }
    };
    /**
     * SDH for confirmed dialog.
     * @internal
     */
    Session.prototype.setSessionDescriptionHandler = function (sdh) {
        if (this._sessionDescriptionHandler) {
            throw new Error("Session description handler defined.");
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
        // Dispose
        if (newState === session_state_1.SessionState.Terminated) {
            this.dispose();
        }
    };
    Session.prototype.getReasonHeaderValue = function (code, reason) {
        var cause = code;
        var text = utils_1.getReasonPhrase(code);
        if (!text && reason) {
            text = reason;
        }
        return "SIP;cause=" + cause + ';text="' + text + '"';
    };
    return Session;
}());
exports.Session = Session;
