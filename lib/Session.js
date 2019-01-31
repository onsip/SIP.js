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
var events_1 = require("events");
var ClientContext_1 = require("./ClientContext");
var Constants_1 = require("./Constants");
var Dialogs_1 = require("./Dialogs");
var Enums_1 = require("./Enums");
var Exceptions_1 = require("./Exceptions");
var Grammar_1 = require("./Grammar");
var RequestSender_1 = require("./RequestSender");
var ServerContext_1 = require("./ServerContext");
var DTMF_1 = require("./Session/DTMF");
var SIPMessage_1 = require("./SIPMessage");
var Timers_1 = require("./Timers");
var Utils_1 = require("./Utils");
/*
 * @param {function returning SIP.sessionDescriptionHandler} [sessionDescriptionHandlerFactory]
 *        (See the documentation for the sessionDescriptionHandlerFactory argument of the UA constructor.)
 */
var Session = /** @class */ (function (_super) {
    __extends(Session, _super);
    function Session(sessionDescriptionHandlerFactory) {
        var _this = _super.call(this) || this;
        _this.data = {};
        _this.type = Enums_1.TypeStrings.Session;
        if (!sessionDescriptionHandlerFactory) {
            throw new Exceptions_1.Exceptions.SessionDescriptionHandlerError("A session description handler is required for the session to function");
        }
        _this.status = Session.C.STATUS_NULL;
        _this.dialog = undefined;
        _this.pendingReinvite = false;
        _this.earlyDialogs = {};
        _this.sessionDescriptionHandlerFactory = sessionDescriptionHandlerFactory;
        _this.hasOffer = false;
        _this.hasAnswer = false;
        // Session Timers
        _this.timers = {
            ackTimer: undefined,
            expiresTimer: undefined,
            invite2xxTimer: undefined,
            userNoAnswerTimer: undefined,
            rel1xxTimer: undefined,
            prackTimer: undefined
        };
        // Session info
        _this.startTime = undefined;
        _this.endTime = undefined;
        _this.tones = undefined;
        // Hold state
        _this.localHold = false;
        _this.earlySdp = undefined;
        _this.rel100 = Constants_1.C.supported.UNSUPPORTED;
        _this.originalReceiveRequest = _this.receiveRequest;
        return _this;
    }
    Session.prototype.dtmf = function (tones, options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        // Check Session Status
        if (this.status !== Enums_1.SessionStatus.STATUS_CONFIRMED && this.status !== Enums_1.SessionStatus.STATUS_WAITING_FOR_ACK) {
            throw new Exceptions_1.Exceptions.InvalidStateError(this.status);
        }
        // Check tones
        if (!tones || !tones.toString().match(/^[0-9A-D#*,]+$/i)) {
            throw new TypeError("Invalid tones: " + tones);
        }
        var sendDTMF = function () {
            if (_this.status === Enums_1.SessionStatus.STATUS_TERMINATED || !_this.tones || _this.tones.length === 0) {
                // Stop sending DTMF
                _this.tones = undefined;
                return;
            }
            var dtmf = _this.tones.shift();
            var timeout;
            if (dtmf.tone === ",") {
                timeout = 2000;
            }
            else {
                dtmf.on("failed", function () { _this.tones = undefined; });
                dtmf.send(options);
                timeout = dtmf.duration + dtmf.interToneGap;
            }
            // Set timeout for the next tone
            setTimeout(sendDTMF, timeout);
        };
        tones = tones.toString();
        var dtmfType = this.ua.configuration.dtmfType;
        if (this.sessionDescriptionHandler && dtmfType === Constants_1.C.dtmfType.RTP) {
            var sent = this.sessionDescriptionHandler.sendDtmf(tones, options);
            if (!sent) {
                this.logger.warn("Attempt to use dtmfType 'RTP' has failed, falling back to INFO packet method");
                dtmfType = Constants_1.C.dtmfType.INFO;
            }
        }
        if (dtmfType === Constants_1.C.dtmfType.INFO) {
            var dtmfs = [];
            var tonesArray = tones.split("");
            while (tonesArray.length > 0) {
                dtmfs.push(new DTMF_1.DTMF(this, tonesArray.shift(), options));
            }
            if (this.tones) {
                // Tones are already queued, just add to the queue
                this.tones = this.tones.concat(dtmfs);
                return this;
            }
            this.tones = dtmfs;
            sendDTMF();
        }
        return this;
    };
    Session.prototype.bye = function (options) {
        if (options === void 0) { options = {}; }
        // Check Session Status
        if (this.status === Enums_1.SessionStatus.STATUS_TERMINATED) {
            this.logger.error("Error: Attempted to send BYE in a terminated session.");
            return this;
        }
        this.logger.log("terminating Session");
        var statusCode = options.statusCode;
        if (statusCode && (statusCode < 200 || statusCode >= 700)) {
            throw new TypeError("Invalid statusCode: " + statusCode);
        }
        options.receiveResponse = function () { };
        return this.sendRequest(Constants_1.C.BYE, options).terminated();
    };
    Session.prototype.refer = function (target, options) {
        if (options === void 0) { options = {}; }
        // Check Session Status
        if (this.status !== Enums_1.SessionStatus.STATUS_CONFIRMED) {
            throw new Exceptions_1.Exceptions.InvalidStateError(this.status);
        }
        this.referContext = new ReferClientContext(this.ua, this, target, options);
        this.emit("referRequested", this.referContext);
        this.referContext.refer(options);
        return this.referContext;
    };
    Session.prototype.sendRequest = function (method, options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        options = options || {};
        if (!this.dialog) {
            throw new Error("sending request without a dialog");
        }
        var request = new SIPMessage_1.OutgoingRequest(method, this.dialog.remoteTarget, this.ua, {
            cseq: options.cseq || (this.dialog.localSeqnum += 1),
            callId: this.dialog.id.callId,
            fromUri: this.dialog.localUri,
            fromTag: this.dialog.id.localTag,
            ToUri: this.dialog.remoteUri,
            toTag: this.dialog.id.remoteTag,
            routeSet: this.dialog.routeSet,
            statusCode: options.statusCode,
            reasonPhrase: options.reasonPhrase
        }, options.extraHeaders || [], options.body);
        new RequestSender_1.RequestSender({
            request: request,
            onRequestTimeout: function () { return _this.onRequestTimeout; },
            onTransportError: this.onTransportError,
            receiveResponse: (options.receiveResponse || this.receiveNonInviteResponse).bind(this)
        }, this.ua).send();
        // Emit the request event
        this.emit(method.toLowerCase(), request);
        return this;
    };
    Session.prototype.close = function () {
        if (this.status === Enums_1.SessionStatus.STATUS_TERMINATED) {
            return this;
        }
        this.logger.log("closing INVITE session " + this.id);
        // 1st Step. Terminate media.
        if (this.sessionDescriptionHandler) {
            this.sessionDescriptionHandler.close();
        }
        // 2nd Step. Terminate signaling.
        // Clear session timers
        for (var timer in this.timers) {
            if (this.timers[timer]) {
                clearTimeout(this.timers[timer]);
            }
        }
        // Terminate dialogs
        // Terminate confirmed dialog
        if (this.dialog) {
            this.dialog.terminate();
            delete this.dialog;
        }
        // Terminate early dialogs
        for (var idx in this.earlyDialogs) {
            if (this.earlyDialogs.hasOwnProperty(idx)) {
                this.earlyDialogs[idx].terminate();
                delete this.earlyDialogs[idx];
            }
        }
        this.status = Enums_1.SessionStatus.STATUS_TERMINATED;
        if (this.ua.transport) {
            this.ua.transport.removeListener("transportError", this.errorListener);
        }
        delete this.ua.sessions[this.id];
        return this;
    };
    Session.prototype.createDialog = function (message, type, early) {
        if (early === void 0) { early = false; }
        var localTag = message[(type === "UAS") ? "toTag" : "fromTag"];
        var remoteTag = message[(type === "UAS") ? "fromTag" : "toTag"];
        var id = message.callId + localTag + remoteTag;
        if (early) { // Early Dialog
            if (this.earlyDialogs[id]) {
                return true;
            }
            else {
                var earlyDialog = new Dialogs_1.Dialog(this, message, type, Dialogs_1.Dialog.C.STATUS_EARLY);
                // Dialog has been successfully created.
                if (earlyDialog.error) {
                    this.logger.error(earlyDialog.error);
                    this.failed(message, Constants_1.C.causes.INTERNAL_ERROR);
                    return false;
                }
                else {
                    this.earlyDialogs[id] = earlyDialog;
                    return true;
                }
            }
        }
        else { // Confirmed Dialog
            // In case the dialog is in _early_ state, update it
            var earlyDialog = this.earlyDialogs[id];
            if (earlyDialog) {
                earlyDialog.update(message, type);
                this.dialog = earlyDialog;
                delete this.earlyDialogs[id];
                for (var idx in this.earlyDialogs) {
                    if (this.earlyDialogs.hasOwnProperty(idx)) {
                        this.earlyDialogs[idx].terminate();
                        delete this.earlyDialogs[idx];
                    }
                }
                return true;
            }
            // Otherwise, create a _confirmed_ dialog
            var dialog = new Dialogs_1.Dialog(this, message, type);
            if (dialog.error) {
                this.logger.error(dialog.error);
                this.failed(message, Constants_1.C.causes.INTERNAL_ERROR);
                return false;
            }
            else {
                this.toTag = message.toTag;
                this.dialog = dialog;
                return true;
            }
        }
    };
    Session.prototype.hold = function (options, modifiers) {
        if (options === void 0) { options = {}; }
        if (modifiers === void 0) { modifiers = []; }
        if (this.status !== Enums_1.SessionStatus.STATUS_WAITING_FOR_ACK && this.status !== Enums_1.SessionStatus.STATUS_CONFIRMED) {
            throw new Exceptions_1.Exceptions.InvalidStateError(this.status);
        }
        if (this.localHold) {
            this.logger.log("Session is already on hold, cannot put it on hold again");
            return;
        }
        options.modifiers = modifiers;
        if (this.sessionDescriptionHandler) {
            options.modifiers.push(this.sessionDescriptionHandler.holdModifier);
        }
        this.localHold = true;
        this.sendReinvite(options);
    };
    Session.prototype.unhold = function (options, modifiers) {
        if (options === void 0) { options = {}; }
        if (modifiers === void 0) { modifiers = []; }
        if (this.status !== Enums_1.SessionStatus.STATUS_WAITING_FOR_ACK && this.status !== Enums_1.SessionStatus.STATUS_CONFIRMED) {
            throw new Exceptions_1.Exceptions.InvalidStateError(this.status);
        }
        if (!this.localHold) {
            this.logger.log("Session is not on hold, cannot unhold it");
            return;
        }
        options.modifiers = modifiers;
        this.localHold = false;
        this.sendReinvite(options);
    };
    Session.prototype.reinvite = function (options, modifiers) {
        if (options === void 0) { options = {}; }
        if (modifiers === void 0) { modifiers = []; }
        options.modifiers = modifiers;
        return this.sendReinvite(options);
    };
    Session.prototype.receiveRequest = function (request) {
        switch (request.method) { // TODO: This needs a default case
            case Constants_1.C.BYE:
                request.reply(200);
                if (this.status === Enums_1.SessionStatus.STATUS_CONFIRMED) {
                    this.emit("bye", request);
                    this.terminated(request, Constants_1.C.BYE);
                }
                break;
            case Constants_1.C.INVITE:
                if (this.status === Enums_1.SessionStatus.STATUS_CONFIRMED) {
                    this.logger.log("re-INVITE received");
                    this.receiveReinvite(request);
                }
                break;
            case Constants_1.C.INFO:
                if (this.status === Enums_1.SessionStatus.STATUS_CONFIRMED || this.status === Enums_1.SessionStatus.STATUS_WAITING_FOR_ACK) {
                    if (this.onInfo) {
                        return this.onInfo(request);
                    }
                    var contentType = request.getHeader("content-type");
                    if (contentType) {
                        if (contentType.match(/^application\/dtmf-relay/i)) {
                            if (request.body) {
                                var body = request.body.split("\r\n", 2);
                                if (body.length === 2) {
                                    var tone = void 0;
                                    var duration = void 0;
                                    var regTone = /^(Signal\s*?=\s*?)([0-9A-D#*]{1})(\s)?.*/;
                                    if (regTone.test(body[0])) {
                                        tone = body[0].replace(regTone, "$2");
                                    }
                                    var regDuration = /^(Duration\s?=\s?)([0-9]{1,4})(\s)?.*/;
                                    if (regDuration.test(body[1])) {
                                        duration = parseInt(body[1].replace(regDuration, "$2"), 10);
                                    }
                                    if (tone && duration) {
                                        new DTMF_1.DTMF(this, tone, { duration: duration }).init_incoming(request);
                                    }
                                }
                            }
                        }
                        else {
                            request.reply(415, undefined, ["Accept: application/dtmf-relay"]);
                        }
                    }
                }
                break;
            case Constants_1.C.REFER:
                if (this.status === Enums_1.SessionStatus.STATUS_CONFIRMED) {
                    this.logger.log("REFER received");
                    this.referContext = new ReferServerContext(this.ua, request);
                    if (this.listeners("referRequested").length) {
                        this.emit("referRequested", this.referContext);
                    }
                    else {
                        this.logger.log("No referRequested listeners, automatically accepting and following the refer");
                        var options = { followRefer: true };
                        if (this.passedOptions) {
                            options.inviteOptions = this.passedOptions;
                        }
                        this.referContext.accept(options, this.modifiers);
                    }
                }
                break;
            case Constants_1.C.NOTIFY:
                if ((this.referContext && this.referContext.type === Enums_1.TypeStrings.ReferClientContext) &&
                    request.hasHeader("event") && /^refer(;.*)?$/.test(request.getHeader("event"))) {
                    this.referContext.receiveNotify(request);
                    return;
                }
                request.reply(200, "OK");
                this.emit("notify", request);
                break;
        }
    };
    Session.prototype.terminate = function (options) {
        // here for types and to be overridden
        return this;
    };
    Session.prototype.onTransportError = function () {
        if (this.status !== Enums_1.SessionStatus.STATUS_CONFIRMED && this.status !== Enums_1.SessionStatus.STATUS_TERMINATED) {
            this.failed(undefined, Constants_1.C.causes.CONNECTION_ERROR);
        }
    };
    Session.prototype.onRequestTimeout = function () {
        if (this.status === Enums_1.SessionStatus.STATUS_CONFIRMED) {
            this.terminated(undefined, Constants_1.C.causes.REQUEST_TIMEOUT);
        }
        else if (this.status !== Enums_1.SessionStatus.STATUS_TERMINATED) {
            this.failed(undefined, Constants_1.C.causes.REQUEST_TIMEOUT);
            this.terminated(undefined, Constants_1.C.causes.REQUEST_TIMEOUT);
        }
    };
    Session.prototype.onDialogError = function (response) {
        if (this.status === Enums_1.SessionStatus.STATUS_CONFIRMED) {
            this.terminated(response, Constants_1.C.causes.DIALOG_ERROR);
        }
        else if (this.status !== Enums_1.SessionStatus.STATUS_TERMINATED) {
            this.failed(response, Constants_1.C.causes.DIALOG_ERROR);
            this.terminated(response, Constants_1.C.causes.DIALOG_ERROR);
        }
    };
    // In dialog INVITE Reception
    Session.prototype.receiveReinvite = function (request) {
        // TODO: Should probably check state of the session
        var _this = this;
        this.emit("reinvite", this, request);
        if (request.hasHeader("P-Asserted-Identity")) {
            this.assertedIdentity = Grammar_1.Grammar.nameAddrHeaderParse(request.getHeader("P-Asserted-Identity"));
        }
        var promise;
        if (!this.sessionDescriptionHandler) {
            this.logger.warn("No SessionDescriptionHandler to reinvite");
            return;
        }
        if (request.getHeader("Content-Length") === "0" && !request.getHeader("Content-Type")) { // Invite w/o SDP
            promise = this.sessionDescriptionHandler.getDescription(this.sessionDescriptionHandlerOptions, this.modifiers);
        }
        else if (this.sessionDescriptionHandler.hasDescription(request.getHeader("Content-Type") || "")) {
            // Invite w/ SDP
            promise = this.sessionDescriptionHandler.setDescription(request.body, this.sessionDescriptionHandlerOptions, this.modifiers).then(this.sessionDescriptionHandler.getDescription.bind(this.sessionDescriptionHandler, this.sessionDescriptionHandlerOptions, this.modifiers));
        }
        else { // Bad Packet (should never get hit)
            request.reply(415);
            this.emit("reinviteFailed", this);
            return;
        }
        this.receiveRequest = function (incRequest) {
            if (incRequest.method === Constants_1.C.ACK && _this.status === Enums_1.SessionStatus.STATUS_WAITING_FOR_ACK) {
                if (_this.sessionDescriptionHandler &&
                    _this.sessionDescriptionHandler.hasDescription(incRequest.getHeader("Content-Type") || "")) {
                    _this.hasAnswer = true;
                    _this.sessionDescriptionHandler.setDescription(incRequest.body, _this.sessionDescriptionHandlerOptions, _this.modifiers).then(function () {
                        clearTimeout(_this.timers.ackTimer);
                        clearTimeout(_this.timers.invite2xxTimer);
                        _this.status = Enums_1.SessionStatus.STATUS_CONFIRMED;
                        _this.emit("confirmed", incRequest);
                    });
                }
                else {
                    clearTimeout(_this.timers.ackTimer);
                    clearTimeout(_this.timers.invite2xxTimer);
                    _this.status = Enums_1.SessionStatus.STATUS_CONFIRMED;
                    _this.emit("confirmed", incRequest);
                }
            }
            else {
                _this.originalReceiveRequest(incRequest);
            }
        };
        promise.catch(function (e) {
            var statusCode;
            if (e.type === Enums_1.TypeStrings.SessionDescriptionHandlerError) {
                statusCode = 500;
            }
            else if (e.type === Enums_1.TypeStrings.RenegotiationError) {
                _this.emit("renegotiationError", e);
                _this.logger.warn(e.toString());
                statusCode = 488;
            }
            else {
                _this.logger.error(e);
                statusCode = 488;
            }
            request.reply(statusCode);
            _this.emit("reinviteFailed", _this);
            // TODO: This could be better
            throw e;
        }).then(function (description) {
            var extraHeaders = ["Contact: " + _this.contact];
            request.reply(200, undefined, extraHeaders, description, function () {
                _this.status = Enums_1.SessionStatus.STATUS_WAITING_FOR_ACK;
                _this.setACKTimer();
                _this.emit("reinviteAccepted", _this);
            });
        });
    };
    Session.prototype.sendReinvite = function (options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        if (this.pendingReinvite) {
            this.logger.warn("Reinvite in progress. Please wait until complete, then try again.");
            return;
        }
        if (!this.sessionDescriptionHandler) {
            this.logger.warn("No SessionDescriptionHandler, can't reinvite..");
            return;
        }
        this.pendingReinvite = true;
        options.modifiers = options.modifiers || [];
        var extraHeaders = (options.extraHeaders || []).slice();
        extraHeaders.push("Contact: " + this.contact);
        // this is UA.C.ALLOWED_METHODS, removed to get around circular dependency
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
        this.sessionDescriptionHandler.getDescription(options.sessionDescriptionHandlerOptions, options.modifiers)
            .then(function (description) {
            _this.sendRequest(Constants_1.C.INVITE, {
                extraHeaders: extraHeaders,
                body: description,
                receiveResponse: _this.receiveReinviteResponse
            });
        }).catch(function (e) {
            if (e.type === Enums_1.TypeStrings.RenegotiationError) {
                _this.pendingReinvite = false;
                _this.emit("renegotiationError", e);
                _this.logger.warn("Renegotiation Error");
                _this.logger.warn(e.toString());
                throw e;
            }
            _this.logger.error("sessionDescriptionHandler error");
            _this.logger.error(e);
            throw e;
        });
    };
    // Reception of Response for in-dialog INVITE
    Session.prototype.receiveReinviteResponse = function (response) {
        var _this = this;
        if (this.status === Enums_1.SessionStatus.STATUS_TERMINATED) {
            this.logger.error("Received reinvite response, but in STATUS_TERMINATED");
            // TODO: Do we need to send a SIP response?
            return;
        }
        if (!this.pendingReinvite) {
            this.logger.error("Received reinvite response, but have no pending reinvite");
            // TODO: Do we need to send a SIP response?
            return;
        }
        var statusCode = response && response.statusCode ? response.statusCode.toString() : "";
        switch (true) {
            case /^1[0-9]{2}$/.test(statusCode):
                break;
            case /^2[0-9]{2}$/.test(statusCode):
                this.status = Enums_1.SessionStatus.STATUS_CONFIRMED;
                // 17.1.1.1 - For each final response that is received at the client transaction,
                // the client transaction sends an ACK,
                this.emit("ack", response.transaction.sendACK());
                this.pendingReinvite = false;
                // TODO: All of these timers should move into the Transaction layer
                clearTimeout(this.timers.invite2xxTimer);
                if (!this.sessionDescriptionHandler ||
                    (!this.sessionDescriptionHandler.hasDescription(response.getHeader("Content-Type") || ""))) {
                    this.logger.error("2XX response received to re-invite but did not have a description");
                    this.emit("reinviteFailed", this);
                    this.emit("renegotiationError", new Exceptions_1.Exceptions.RenegotiationError("2XX response received to re-invite but did not have a description"));
                    break;
                }
                this.sessionDescriptionHandler.setDescription(response.body, this.sessionDescriptionHandlerOptions, this.modifiers).catch(function (e) {
                    _this.logger.error("Could not set the description in 2XX response");
                    _this.logger.error(e);
                    _this.emit("reinviteFailed", _this);
                    _this.emit("renegotiationError", e);
                    _this.sendRequest(Constants_1.C.BYE, {
                        extraHeaders: ["Reason: " + Utils_1.Utils.getReasonHeaderValue(488, "Not Acceptable Here")]
                    });
                    _this.terminated(undefined, Constants_1.C.causes.INCOMPATIBLE_SDP);
                    throw e;
                }).then(function () {
                    _this.emit("reinviteAccepted", _this);
                });
                break;
            default:
                this.pendingReinvite = false;
                this.logger.log("Received a non 1XX or 2XX response to a re-invite");
                this.emit("reinviteFailed", this);
                this.emit("renegotiationError", new Exceptions_1.Exceptions.RenegotiationError("Invalid response to a re-invite"));
        }
    };
    Session.prototype.acceptAndTerminate = function (response, statusCode, reasonPhrase) {
        var extraHeaders = [];
        if (statusCode) {
            extraHeaders.push("Reason: " + Utils_1.Utils.getReasonHeaderValue(statusCode, reasonPhrase));
        }
        // An error on dialog creation will fire 'failed' event
        if (this.dialog || this.createDialog(response, "UAC")) {
            this.emit("ack", response.transaction.sendACK());
            this.sendRequest(Constants_1.C.BYE, { extraHeaders: extraHeaders });
        }
        return this;
    };
    /**
     * RFC3261 13.3.1.4
     * Response retransmissions cannot be accomplished by transaction layer
     *  since it is destroyed when receiving the first 2xx answer
     */
    Session.prototype.setInvite2xxTimer = function (request, description) {
        var _this = this;
        var timeout = Timers_1.Timers.T1;
        var invite2xxRetransmission = function () {
            if (_this.status !== Enums_1.SessionStatus.STATUS_WAITING_FOR_ACK) {
                return;
            }
            _this.logger.log("no ACK received, attempting to retransmit OK");
            var extraHeaders = ["Contact: " + _this.contact];
            request.reply(200, undefined, extraHeaders, description);
            timeout = Math.min(timeout * 2, Timers_1.Timers.T2);
            _this.timers.invite2xxTimer = setTimeout(invite2xxRetransmission.bind(_this), timeout);
        };
        this.timers.invite2xxTimer = setTimeout(invite2xxRetransmission.bind(this), timeout);
    };
    /**
     * RFC3261 14.2
     * If a UAS generates a 2xx response and never receives an ACK,
     * it SHOULD generate a BYE to terminate the dialog.
     */
    Session.prototype.setACKTimer = function () {
        var _this = this;
        this.timers.ackTimer = setTimeout(function () {
            if (_this.status === Enums_1.SessionStatus.STATUS_WAITING_FOR_ACK) {
                _this.logger.log("no ACK received for an extended period of time, terminating the call");
                clearTimeout(_this.timers.invite2xxTimer);
                _this.sendRequest(Constants_1.C.BYE);
                _this.terminated(undefined, Constants_1.C.causes.NO_ACK);
            }
        }, Timers_1.Timers.TIMER_H);
    };
    Session.prototype.failed = function (response, cause) {
        if (this.status === Enums_1.SessionStatus.STATUS_TERMINATED) {
            return this;
        }
        this.emit("failed", response, cause);
        return this;
    };
    Session.prototype.rejected = function (response, cause) {
        this.emit("rejected", response, cause);
        return this;
    };
    Session.prototype.canceled = function () {
        if (this.sessionDescriptionHandler) {
            this.sessionDescriptionHandler.close();
        }
        this.emit("cancel");
        return this;
    };
    Session.prototype.accepted = function (response, cause) {
        if (!(response instanceof String)) {
            cause = Utils_1.Utils.getReasonPhrase((response && response.statusCode) || 0, cause);
        }
        this.startTime = new Date();
        if (this.replacee) {
            this.replacee.emit("replaced", this);
            this.replacee.terminate();
        }
        this.emit("accepted", response, cause);
        return this;
    };
    Session.prototype.terminated = function (message, cause) {
        if (this.status === Enums_1.SessionStatus.STATUS_TERMINATED) {
            return this;
        }
        this.endTime = new Date();
        this.close();
        this.emit("terminated", message, cause);
        return this;
    };
    Session.prototype.connecting = function (request) {
        this.emit("connecting", { request: request });
        return this;
    };
    Session.prototype.receiveNonInviteResponse = function (response) {
        // blank, to be overridden
    };
    Session.C = Enums_1.SessionStatus;
    return Session;
}(events_1.EventEmitter));
exports.Session = Session;
// tslint:disable-next-line:max-classes-per-file
var InviteServerContext = /** @class */ (function (_super) {
    __extends(InviteServerContext, _super);
    function InviteServerContext(ua, request) {
        var _this = this;
        if (!ua.configuration.sessionDescriptionHandlerFactory) {
            ua.logger.warn("Can't build ISC without SDH Factory");
            throw new Error("ISC Constructor Failed");
        }
        _this = _super.call(this, ua.configuration.sessionDescriptionHandlerFactory) || this;
        ServerContext_1.ServerContext.initializer(_this, ua, request);
        _this.type = Enums_1.TypeStrings.InviteServerContext;
        var contentDisp = request.parseHeader("Content-Disposition");
        if (contentDisp && contentDisp.type === "render") {
            _this.renderbody = request.body;
            _this.rendertype = request.getHeader("Content-Type");
        }
        _this.status = Enums_1.SessionStatus.STATUS_INVITE_RECEIVED;
        _this.fromTag = request.fromTag;
        _this.id = request.callId + _this.fromTag;
        _this.request = request;
        _this.contact = _this.ua.contact.toString();
        _this.receiveNonInviteResponse = function () { };
        _this.logger = ua.getLogger("sip.inviteservercontext", _this.id);
        // Save the session into the ua sessions collection.
        _this.ua.sessions[_this.id] = _this;
        // Set 100rel if necessary
        var set100rel = function (header, relSetting) {
            if (request.hasHeader(header) && request.getHeader(header).toLowerCase().indexOf("100rel") >= 0) {
                _this.rel100 = relSetting;
            }
        };
        set100rel("require", Constants_1.C.supported.REQUIRED);
        set100rel("supported", Constants_1.C.supported.SUPPORTED);
        /* Set the toTag before
        * replying a response code that will create a dialog.
        */
        request.toTag = Utils_1.Utils.newTag();
        // An error on dialog creation will fire 'failed' event
        if (!_this.createDialog(request, "UAS", true)) {
            request.reply(500, "Missing Contact header field");
            return;
        }
        var options = { extraHeaders: ["Contact: " + _this.contact] };
        if (_this.rel100 !== Constants_1.C.supported.REQUIRED) {
            _this.progress(options);
        }
        _this.status = Enums_1.SessionStatus.STATUS_WAITING_FOR_ANSWER;
        // Set userNoAnswerTimer
        _this.timers.userNoAnswerTimer = setTimeout(function () {
            request.reply(408);
            _this.failed(request, Constants_1.C.causes.NO_ANSWER);
            _this.terminated(request, Constants_1.C.causes.NO_ANSWER);
        }, _this.ua.configuration.noAnswerTimeout || 60);
        /* Set expiresTimer
        * RFC3261 13.3.1
        */
        // Get the Expires header value if exists
        if (request.hasHeader("expires")) {
            var expires = Number(request.getHeader("expires") || 0) * 1000;
            _this.timers.expiresTimer = setTimeout(function () {
                if (_this.status === Enums_1.SessionStatus.STATUS_WAITING_FOR_ANSWER) {
                    request.reply(487);
                    _this.failed(request, Constants_1.C.causes.EXPIRES);
                    _this.terminated(request, Constants_1.C.causes.EXPIRES);
                }
            }, expires);
        }
        _this.errorListener = _this.onTransportError.bind(_this);
        if (ua.transport) {
            ua.transport.on("transportError", _this.errorListener);
        }
        return _this;
    }
    // typing note: this was the only function using its super in ServerContext
    // so the bottom half of this function is copied and paired down from that
    InviteServerContext.prototype.reject = function (options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        // Check Session Status
        if (this.status === Enums_1.SessionStatus.STATUS_TERMINATED) {
            throw new Exceptions_1.Exceptions.InvalidStateError(this.status);
        }
        this.logger.log("rejecting RTCSession");
        var statusCode = options.statusCode || 480;
        var reasonPhrase = Utils_1.Utils.getReasonPhrase(statusCode, options.reasonPhrase);
        var extraHeaders = options.extraHeaders || [];
        if (statusCode < 300 || statusCode > 699) {
            throw new TypeError("Invalid statusCode: " + statusCode);
        }
        var response = this.request.reply(statusCode, reasonPhrase, extraHeaders, options.body);
        (["rejected", "failed"]).forEach(function (event) {
            _this.emit(event, response, reasonPhrase);
        });
        return this.terminated();
    };
    // type hack for servercontext interface
    InviteServerContext.prototype.reply = function (options) {
        if (options === void 0) { options = {}; }
        return this;
    };
    InviteServerContext.prototype.terminate = function (options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        var extraHeaders = (options.extraHeaders || []).slice();
        if (this.status === Enums_1.SessionStatus.STATUS_WAITING_FOR_ACK &&
            this.request.serverTransaction &&
            this.request.serverTransaction.state !== Enums_1.TransactionStatus.STATUS_TERMINATED) {
            var dialog = this.dialog;
            this.receiveRequest = function (request) {
                if (request.method === Constants_1.C.ACK) {
                    _this.sendRequest(Constants_1.C.BYE, { extraHeaders: extraHeaders });
                    if (_this.dialog) {
                        _this.dialog.terminate();
                    }
                }
            };
            this.request.serverTransaction.on("stateChanged", function () {
                if (_this.request.serverTransaction &&
                    _this.request.serverTransaction.state === Enums_1.TransactionStatus.STATUS_TERMINATED &&
                    _this.dialog) {
                    _this.bye();
                    _this.dialog.terminate();
                }
            });
            this.emit("bye", this.request);
            this.terminated();
            // Restore the dialog into 'ua' so the ACK can reach 'this' session
            this.dialog = dialog;
            if (this.dialog) {
                this.ua.dialogs[this.dialog.id.toString()] = this.dialog;
            }
        }
        else if (this.status === Enums_1.SessionStatus.STATUS_CONFIRMED) {
            this.bye(options);
        }
        else {
            this.reject(options);
        }
        return this;
    };
    // @param {Object} [options.sessionDescriptionHandlerOptions]
    // gets passed to SIP.SessionDescriptionHandler.getDescription as options
    InviteServerContext.prototype.progress = function (options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        var statusCode = options.statusCode || 180;
        var extraHeaders = (options.extraHeaders || []).slice();
        if (statusCode < 100 || statusCode > 199) {
            throw new TypeError("Invalid statusCode: " + statusCode);
        }
        if (this.status === Enums_1.SessionStatus.STATUS_TERMINATED) {
            return this;
        }
        var do100rel = function () {
            var relStatusCode = options.statusCode || 183;
            // Set status and add extra headers
            _this.status = Enums_1.SessionStatus.STATUS_WAITING_FOR_PRACK;
            extraHeaders.push("Contact: " + _this.contact);
            extraHeaders.push("Require: 100rel");
            extraHeaders.push("RSeq: " + Math.floor(Math.random() * 10000));
            if (!_this.sessionDescriptionHandler) {
                _this.logger.warn("No SessionDescriptionHandler, can't do 100rel");
                return;
            }
            // Get the session description to add to preaccept with
            _this.sessionDescriptionHandler.getDescription(options.sessionDescriptionHandlerOptions, options.modifiers)
                .then(function (description) {
                if (_this.status === Enums_1.SessionStatus.STATUS_TERMINATED) {
                    return;
                }
                _this.earlySdp = description.body;
                _this[_this.hasOffer ? "hasAnswer" : "hasOffer"] = true;
                // Retransmit until we get a response or we time out (see prackTimer below)
                var timeout = Timers_1.Timers.T1;
                var rel1xxRetransmission = function () {
                    _this.request.reply(relStatusCode, undefined, extraHeaders, description);
                    timeout *= 2;
                    _this.timers.rel1xxTimer = setTimeout(rel1xxRetransmission.bind(_this), timeout);
                };
                _this.timers.rel1xxTimer = setTimeout(rel1xxRetransmission.bind(_this), timeout);
                // Timeout and reject INVITE if no response
                _this.timers.prackTimer = setTimeout(function () {
                    if (_this.status !== Enums_1.SessionStatus.STATUS_WAITING_FOR_PRACK) {
                        return;
                    }
                    _this.logger.log("no PRACK received, rejecting the call");
                    clearTimeout(_this.timers.rel1xxTimer);
                    _this.request.reply(504);
                    _this.terminated(undefined, Constants_1.C.causes.NO_PRACK);
                }, Timers_1.Timers.T1 * 64);
                // Send the initial response
                var response = _this.request.reply(relStatusCode, options.reasonPhrase, extraHeaders, description);
                _this.emit("progress", response, options.reasonPhrase);
            }, function () {
                _this.request.reply(480);
                _this.failed(undefined, Constants_1.C.causes.WEBRTC_ERROR);
                _this.terminated(undefined, Constants_1.C.causes.WEBRTC_ERROR);
            });
        }; // end do100rel
        var normalReply = function () {
            var response = _this.request.reply(statusCode, options.reasonPhrase, extraHeaders, options.body);
            _this.emit("progress", response, options.reasonPhrase);
        };
        if (options.statusCode !== 100 &&
            (this.rel100 === Constants_1.C.supported.REQUIRED ||
                (this.rel100 === Constants_1.C.supported.SUPPORTED && options.rel100) ||
                (this.rel100 === Constants_1.C.supported.SUPPORTED && (this.ua.configuration.rel100 === Constants_1.C.supported.REQUIRED)))) {
            this.sessionDescriptionHandler = this.setupSessionDescriptionHandler();
            this.emit("SessionDescriptionHandler-created", this.sessionDescriptionHandler);
            if (this.sessionDescriptionHandler.hasDescription(this.request.getHeader("Content-Type") || "")) {
                this.hasOffer = true;
                this.sessionDescriptionHandler.setDescription(this.request.body, options.sessionDescriptionHandlerOptions, options.modifiers).then(do100rel)
                    .catch(function (e) {
                    _this.logger.warn("invalid description");
                    _this.logger.warn(e);
                    _this.failed(undefined, Constants_1.C.causes.WEBRTC_ERROR);
                    _this.terminated(undefined, Constants_1.C.causes.WEBRTC_ERROR);
                    throw e;
                });
            }
            else {
                do100rel();
            }
        }
        else {
            normalReply();
        }
        return this;
    };
    // @param {Object} [options.sessionDescriptionHandlerOptions] gets passed
    // to SIP.SessionDescriptionHandler.getDescription as options
    InviteServerContext.prototype.accept = function (options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        this.onInfo = options.onInfo;
        var extraHeaders = (options.extraHeaders || []).slice();
        var descriptionCreationSucceeded = function (description) {
            // run for reply success callback
            var replySucceeded = function () {
                _this.status = Enums_1.SessionStatus.STATUS_WAITING_FOR_ACK;
                _this.setInvite2xxTimer(_this.request, description);
                _this.setACKTimer();
            };
            // run for reply failure callback
            var replyFailed = function () {
                _this.failed(undefined, Constants_1.C.causes.CONNECTION_ERROR);
                _this.terminated(undefined, Constants_1.C.causes.CONNECTION_ERROR);
            };
            extraHeaders.push("Contact: " + _this.contact);
            // this is UA.C.ALLOWED_METHODS, removed to get around circular dependency
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
            if (!_this.hasOffer) {
                _this.hasOffer = true;
            }
            else {
                _this.hasAnswer = true;
            }
            var response = _this.request.reply(200, undefined, extraHeaders, description, replySucceeded, replyFailed);
            if (_this.status !== Enums_1.SessionStatus.STATUS_TERMINATED) { // Didn't fail
                _this.accepted(response, Utils_1.Utils.getReasonPhrase(200));
            }
        };
        var descriptionCreationFailed = function (err) {
            if (err.type === Enums_1.TypeStrings.SessionDescriptionHandlerError) {
                _this.logger.log(err.message);
                if (err.error) {
                    _this.logger.log(err.error);
                }
            }
            _this.request.reply(480);
            _this.failed(undefined, Constants_1.C.causes.WEBRTC_ERROR);
            _this.terminated(undefined, Constants_1.C.causes.WEBRTC_ERROR);
            throw err;
        };
        // Check Session Status
        if (this.status === Enums_1.SessionStatus.STATUS_WAITING_FOR_PRACK) {
            this.status = Enums_1.SessionStatus.STATUS_ANSWERED_WAITING_FOR_PRACK;
            return this;
        }
        else if (this.status === Enums_1.SessionStatus.STATUS_WAITING_FOR_ANSWER) {
            this.status = Enums_1.SessionStatus.STATUS_ANSWERED;
        }
        else if (this.status !== Enums_1.SessionStatus.STATUS_EARLY_MEDIA) {
            throw new Exceptions_1.Exceptions.InvalidStateError(this.status);
        }
        // An error on dialog creation will fire 'failed' event
        if (!this.createDialog(this.request, "UAS")) {
            this.request.reply(500, "Missing Contact header field");
            return this;
        }
        clearTimeout(this.timers.userNoAnswerTimer);
        if (this.status === Enums_1.SessionStatus.STATUS_EARLY_MEDIA) {
            descriptionCreationSucceeded({});
        }
        else {
            this.sessionDescriptionHandler = this.setupSessionDescriptionHandler();
            this.emit("SessionDescriptionHandler-created", this.sessionDescriptionHandler);
            if (this.request.getHeader("Content-Length") === "0" && !this.request.getHeader("Content-Type")) {
                this.sessionDescriptionHandler.getDescription(options.sessionDescriptionHandlerOptions, options.modifiers)
                    .catch(descriptionCreationFailed)
                    .then(descriptionCreationSucceeded);
            }
            else if (this.sessionDescriptionHandler.hasDescription(this.request.getHeader("Content-Type") || "")) {
                this.hasOffer = true;
                this.sessionDescriptionHandler.setDescription(this.request.body, options.sessionDescriptionHandlerOptions, options.modifiers).then(function () {
                    if (!_this.sessionDescriptionHandler) {
                        throw new Error("No SDH");
                    }
                    return _this.sessionDescriptionHandler.getDescription(options.sessionDescriptionHandlerOptions, options.modifiers);
                })
                    .catch(descriptionCreationFailed)
                    .then(descriptionCreationSucceeded);
            }
            else {
                this.request.reply(415);
                // TODO: Events
                return this;
            }
        }
        return this;
    };
    // ISC RECEIVE REQUEST
    InviteServerContext.prototype.receiveRequest = function (request) {
        var _this = this;
        var confirmSession = function () {
            clearTimeout(_this.timers.ackTimer);
            clearTimeout(_this.timers.invite2xxTimer);
            _this.status = Enums_1.SessionStatus.STATUS_CONFIRMED;
            var contentDisp = request.getHeader("Content-Disposition");
            if (contentDisp && contentDisp.type === "render") {
                _this.renderbody = request.body;
                _this.rendertype = request.getHeader("Content-Type");
            }
            _this.emit("confirmed", request);
        };
        switch (request.method) {
            case Constants_1.C.CANCEL:
                /* RFC3261 15 States that a UAS may have accepted an invitation while a CANCEL
                * was in progress and that the UAC MAY continue with the session established by
                * any 2xx response, or MAY terminate with BYE. SIP does continue with the
                * established session. So the CANCEL is processed only if the session is not yet
                * established.
                */
                /*
                * Terminate the whole session in case the user didn't accept (or yet to send the answer) nor reject the
                *request opening the session.
                */
                if (this.status === Enums_1.SessionStatus.STATUS_WAITING_FOR_ANSWER ||
                    this.status === Enums_1.SessionStatus.STATUS_WAITING_FOR_PRACK ||
                    this.status === Enums_1.SessionStatus.STATUS_ANSWERED_WAITING_FOR_PRACK ||
                    this.status === Enums_1.SessionStatus.STATUS_EARLY_MEDIA ||
                    this.status === Enums_1.SessionStatus.STATUS_ANSWERED) {
                    this.status = Enums_1.SessionStatus.STATUS_CANCELED;
                    this.request.reply(487);
                    this.canceled();
                    this.rejected(request, Constants_1.C.causes.CANCELED);
                    this.failed(request, Constants_1.C.causes.CANCELED);
                    this.terminated(request, Constants_1.C.causes.CANCELED);
                }
                break;
            case Constants_1.C.ACK:
                if (this.status === Enums_1.SessionStatus.STATUS_WAITING_FOR_ACK) {
                    this.status = Enums_1.SessionStatus.STATUS_CONFIRMED;
                    if (this.sessionDescriptionHandler &&
                        this.sessionDescriptionHandler.hasDescription(request.getHeader("Content-Type") || "")) {
                        // ACK contains answer to an INVITE w/o SDP negotiation
                        this.hasAnswer = true;
                        this.sessionDescriptionHandler.setDescription(request.body, this.sessionDescriptionHandlerOptions, this.modifiers).catch(function (e) {
                            _this.logger.warn(e);
                            _this.terminate({
                                statusCode: "488",
                                reasonPhrase: "Bad Media Description"
                            });
                            _this.failed(request, Constants_1.C.causes.BAD_MEDIA_DESCRIPTION);
                            _this.terminated(request, Constants_1.C.causes.BAD_MEDIA_DESCRIPTION);
                            throw e;
                        }).then(function () { return confirmSession(); });
                    }
                    else {
                        confirmSession();
                    }
                }
                break;
            case Constants_1.C.PRACK:
                if (this.status === Enums_1.SessionStatus.STATUS_WAITING_FOR_PRACK ||
                    this.status === Enums_1.SessionStatus.STATUS_ANSWERED_WAITING_FOR_PRACK) {
                    if (!this.hasAnswer) {
                        this.sessionDescriptionHandler = this.setupSessionDescriptionHandler();
                        this.emit("SessionDescriptionHandler-created", this.sessionDescriptionHandler);
                        if (this.sessionDescriptionHandler.hasDescription(request.getHeader("Content-Type") || "")) {
                            this.hasAnswer = true;
                            this.sessionDescriptionHandler.setDescription(request.body, this.sessionDescriptionHandlerOptions, this.modifiers).then(function () {
                                clearTimeout(_this.timers.rel1xxTimer);
                                clearTimeout(_this.timers.prackTimer);
                                request.reply(200);
                                if (_this.status === Enums_1.SessionStatus.STATUS_ANSWERED_WAITING_FOR_PRACK) {
                                    _this.status = Enums_1.SessionStatus.STATUS_EARLY_MEDIA;
                                    _this.accept();
                                }
                                _this.status = Enums_1.SessionStatus.STATUS_EARLY_MEDIA;
                            }, function (e) {
                                _this.logger.warn(e);
                                _this.terminate({
                                    statusCode: "488",
                                    reasonPhrase: "Bad Media Description"
                                });
                                _this.failed(request, Constants_1.C.causes.BAD_MEDIA_DESCRIPTION);
                                _this.terminated(request, Constants_1.C.causes.BAD_MEDIA_DESCRIPTION);
                            });
                        }
                        else {
                            this.terminate({
                                statusCode: "488",
                                reasonPhrase: "Bad Media Description"
                            });
                            this.failed(request, Constants_1.C.causes.BAD_MEDIA_DESCRIPTION);
                            this.terminated(request, Constants_1.C.causes.BAD_MEDIA_DESCRIPTION);
                        }
                    }
                    else {
                        clearTimeout(this.timers.rel1xxTimer);
                        clearTimeout(this.timers.prackTimer);
                        request.reply(200);
                        if (this.status === Enums_1.SessionStatus.STATUS_ANSWERED_WAITING_FOR_PRACK) {
                            this.status = Enums_1.SessionStatus.STATUS_EARLY_MEDIA;
                            this.accept();
                        }
                        this.status = Enums_1.SessionStatus.STATUS_EARLY_MEDIA;
                    }
                }
                else if (this.status === Enums_1.SessionStatus.STATUS_EARLY_MEDIA) {
                    request.reply(200);
                }
                break;
            default:
                Session.prototype.receiveRequest.apply(this, [request]);
                break;
        }
    };
    // Internal Function to setup the handler consistently
    InviteServerContext.prototype.setupSessionDescriptionHandler = function () {
        if (this.sessionDescriptionHandler) {
            return this.sessionDescriptionHandler;
        }
        return this.sessionDescriptionHandlerFactory(this, this.ua.configuration.sessionDescriptionHandlerFactoryOptions);
    };
    return InviteServerContext;
}(Session));
exports.InviteServerContext = InviteServerContext;
// tslint:disable-next-line:max-classes-per-file
var InviteClientContext = /** @class */ (function (_super) {
    __extends(InviteClientContext, _super);
    function InviteClientContext(ua, target, options, modifiers) {
        if (options === void 0) { options = {}; }
        if (modifiers === void 0) { modifiers = []; }
        var _this = this;
        if (!ua.configuration.sessionDescriptionHandlerFactory) {
            ua.logger.warn("Can't build ISC without SDH Factory");
            throw new Error("ICC Constructor Failed");
        }
        options.params = options.params || {};
        var anonymous = options.anonymous || false;
        var fromTag = Utils_1.Utils.newTag();
        options.params.fromTag = fromTag;
        /* Do not add ;ob in initial forming dialog requests if the registration over
        *  the current connection got a GRUU URI.
        */
        var contact = ua.contact.toString({
            anonymous: anonymous,
            outbound: anonymous ? !ua.contact.temp_gruu : !ua.contact.pub_gruu
        });
        var extraHeaders = (options.extraHeaders || []).slice();
        if (anonymous && ua.configuration.uri) {
            options.params.from_displayName = "Anonymous";
            options.params.from_uri = "sip:anonymous@anonymous.invalid";
            extraHeaders.push("P-Preferred-Identity: " + ua.configuration.uri.toString());
            extraHeaders.push("Privacy: id");
        }
        extraHeaders.push("Contact: " + contact);
        // this is UA.C.ALLOWED_METHODS, removed to get around circular dependency
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
        if (ua.configuration.rel100 === Constants_1.C.supported.REQUIRED) {
            extraHeaders.push("Require: 100rel");
        }
        if (ua.configuration.replaces === Constants_1.C.supported.REQUIRED) {
            extraHeaders.push("Require: replaces");
        }
        options.extraHeaders = extraHeaders;
        _this = _super.call(this, ua.configuration.sessionDescriptionHandlerFactory) || this;
        ClientContext_1.ClientContext.initializer(_this, ua, Constants_1.C.INVITE, target, options);
        _this.type = Enums_1.TypeStrings.InviteClientContext;
        _this.passedOptions = options; // Save for later to use with refer
        _this.sessionDescriptionHandlerOptions = options.sessionDescriptionHandlerOptions || {};
        _this.modifiers = modifiers;
        _this.inviteWithoutSdp = options.inviteWithoutSdp || false;
        // Set anonymous property
        _this.anonymous = options.anonymous || false;
        // Custom data to be sent either in INVITE or in ACK
        _this.renderbody = options.renderbody || undefined;
        _this.rendertype = options.rendertype || "text/plain";
        // Session parameter initialization
        _this.fromTag = fromTag;
        _this.contact = contact;
        // Check Session Status
        if (_this.status !== Enums_1.SessionStatus.STATUS_NULL) {
            throw new Exceptions_1.Exceptions.InvalidStateError(_this.status);
        }
        // OutgoingSession specific parameters
        _this.isCanceled = false;
        _this.received100 = false;
        _this.method = Constants_1.C.INVITE;
        _this.logger = ua.getLogger("sip.inviteclientcontext");
        ua.applicants[_this.toString()] = _this;
        _this.id = _this.request.callId + _this.fromTag;
        _this.onInfo = options.onInfo;
        _this.errorListener = _this.onTransportError.bind(_this);
        if (ua.transport) {
            ua.transport.on("transportError", _this.errorListener);
        }
        return _this;
    }
    InviteClientContext.prototype.receiveNonInviteResponse = function (response) {
        this.receiveInviteResponse(response);
    };
    InviteClientContext.prototype.receiveResponse = function (response) {
        this.receiveInviteResponse(response);
    };
    // hack for getting around ClientContext interface
    InviteClientContext.prototype.send = function () {
        var sender = new RequestSender_1.RequestSender(this, this.ua);
        sender.send();
        return this;
    };
    InviteClientContext.prototype.invite = function () {
        var _this = this;
        // Save the session into the ua sessions collection.
        // Note: placing in constructor breaks call to request.cancel on close... User does not need this anyway
        this.ua.sessions[this.id] = this;
        // This should allow the function to return so that listeners can be set up for these events
        Promise.resolve().then(function () {
            if (_this.inviteWithoutSdp) {
                // just send an invite with no sdp...
                _this.request.body = _this.renderbody;
                _this.status = Enums_1.SessionStatus.STATUS_INVITE_SENT;
                _this.send();
            }
            else {
                // Initialize Media Session
                _this.sessionDescriptionHandler = _this.sessionDescriptionHandlerFactory(_this, _this.ua.configuration.sessionDescriptionHandlerFactoryOptions || {});
                _this.emit("SessionDescriptionHandler-created", _this.sessionDescriptionHandler);
                _this.sessionDescriptionHandler.getDescription(_this.sessionDescriptionHandlerOptions, _this.modifiers)
                    .then(function (description) {
                    if (_this.isCanceled || _this.status === Enums_1.SessionStatus.STATUS_TERMINATED) {
                        return;
                    }
                    _this.hasOffer = true;
                    _this.request.body = description;
                    _this.status = Enums_1.SessionStatus.STATUS_INVITE_SENT;
                    _this.send();
                }, function (err) {
                    if (err.type === Enums_1.TypeStrings.SessionDescriptionHandlerError) {
                        _this.logger.log(err.message);
                        if (err.error) {
                            _this.logger.log(err.error);
                        }
                    }
                    if (_this.status === Enums_1.SessionStatus.STATUS_TERMINATED) {
                        return;
                    }
                    _this.failed(undefined, Constants_1.C.causes.WEBRTC_ERROR);
                    _this.terminated(undefined, Constants_1.C.causes.WEBRTC_ERROR);
                });
            }
        });
        return this;
    };
    InviteClientContext.prototype.receiveInviteResponse = function (response) {
        var _this = this;
        if (this.status === Enums_1.SessionStatus.STATUS_TERMINATED || response.method !== Constants_1.C.INVITE) {
            return;
        }
        var id = response.callId + response.fromTag + response.toTag;
        var extraHeaders = [];
        if (this.dialog && (response.statusCode && response.statusCode >= 200 && response.statusCode <= 299)) {
            if (id !== this.dialog.id.toString()) {
                if (!this.createDialog(response, "UAC", true)) {
                    return;
                }
                this.emit("ack", response.transaction.sendACK({ body: Utils_1.Utils.generateFakeSDP(response.body) }));
                this.earlyDialogs[id].sendRequest(this, Constants_1.C.BYE);
                /* NOTE: This fails because the forking proxy does not recognize that an unanswerable
                 * leg (due to peerConnection limitations) has been answered first. If your forking
                 * proxy does not hang up all unanswered branches on the first branch answered, remove this.
                 */
                if (this.status !== Enums_1.SessionStatus.STATUS_CONFIRMED) {
                    this.failed(response, Constants_1.C.causes.WEBRTC_ERROR);
                    this.terminated(response, Constants_1.C.causes.WEBRTC_ERROR);
                }
                return;
            }
            else if (this.status === Enums_1.SessionStatus.STATUS_CONFIRMED) {
                this.emit("ack", response.transaction.sendACK());
                return;
            }
            else if (!this.hasAnswer) {
                // invite w/o sdp is waiting for callback
                // an invite with sdp must go on, and hasAnswer is true
                return;
            }
        }
        var statusCode = response && response.statusCode;
        if (this.dialog && statusCode && statusCode < 200) {
            /*
              Early media has been set up with at least one other different branch,
              but a final 2xx response hasn't been received
            */
            var rseq = response.getHeader("rseq");
            if (rseq && (this.dialog.pracked.indexOf(rseq) !== -1 ||
                (Number(this.dialog.pracked[this.dialog.pracked.length - 1]) >= Number(rseq) &&
                    this.dialog.pracked.length > 0))) {
                return;
            }
            if (!this.earlyDialogs[id] && !this.createDialog(response, "UAC", true)) {
                return;
            }
            if (this.earlyDialogs[id].pracked.indexOf(response.getHeader("rseq")) !== -1 ||
                (this.earlyDialogs[id].pracked[this.earlyDialogs[id].pracked.length - 1] >= Number(rseq) &&
                    this.earlyDialogs[id].pracked.length > 0)) {
                return;
            }
            extraHeaders.push("RAck: " + response.getHeader("rseq") + " " + response.getHeader("cseq"));
            this.earlyDialogs[id].pracked.push(response.getHeader("rseq"));
            this.earlyDialogs[id].sendRequest(this, Constants_1.C.PRACK, {
                extraHeaders: extraHeaders,
                body: Utils_1.Utils.generateFakeSDP(response.body)
            });
            return;
        }
        // Proceed to cancellation if the user requested.
        if (this.isCanceled) {
            if (statusCode && statusCode >= 100 && statusCode < 200) {
                this.request.cancel(this.cancelReason, extraHeaders);
                this.canceled();
            }
            else if (statusCode && statusCode >= 200 && statusCode < 299) {
                this.acceptAndTerminate(response);
                this.emit("bye", this.request);
            }
            else if (statusCode && statusCode >= 300) {
                var cause = Constants_1.C.REASON_PHRASE[response.statusCode || 0] || Constants_1.C.causes.CANCELED;
                this.rejected(response, cause);
                this.failed(response, cause);
                this.terminated(response, cause);
            }
            return;
        }
        var codeString = statusCode ? statusCode.toString() : "";
        switch (true) {
            case /^100$/.test(codeString):
                this.received100 = true;
                this.emit("progress", response);
                break;
            case (/^1[0-9]{2}$/.test(codeString)):
                // Do nothing with 1xx responses without To tag.
                if (!response.toTag) {
                    this.logger.warn("1xx response received without to tag");
                    break;
                }
                // Create Early Dialog if 1XX comes with contact
                if (response.hasHeader("contact")) {
                    // An error on dialog creation will fire 'failed' event
                    if (!this.createDialog(response, "UAC", true)) {
                        break;
                    }
                }
                this.status = Enums_1.SessionStatus.STATUS_1XX_RECEIVED;
                if (response.hasHeader("P-Asserted-Identity")) {
                    this.assertedIdentity = Grammar_1.Grammar.nameAddrHeaderParse(response.getHeader("P-Asserted-Identity"));
                }
                if (response.hasHeader("require") &&
                    response.getHeader("require").indexOf("100rel") !== -1) {
                    // Do nothing if this.dialog is already confirmed
                    if (this.dialog || !this.earlyDialogs[id]) {
                        break;
                    }
                    var rseq_1 = response.getHeader("rseq");
                    if (this.earlyDialogs[id].pracked.indexOf(rseq_1) !== -1 ||
                        (this.earlyDialogs[id].pracked[this.earlyDialogs[id].pracked.length - 1] >= Number(rseq_1) &&
                            this.earlyDialogs[id].pracked.length > 0)) {
                        return;
                    }
                    // TODO: This may be broken. It may have to be on the early dialog
                    this.sessionDescriptionHandler = this.sessionDescriptionHandlerFactory(this, this.ua.configuration.sessionDescriptionHandlerFactoryOptions || {});
                    this.emit("SessionDescriptionHandler-created", this.sessionDescriptionHandler);
                    if (!this.sessionDescriptionHandler.hasDescription(response.getHeader("Content-Type") || "")) {
                        extraHeaders.push("RAck: " + response.getHeader("rseq") + " " + response.getHeader("cseq"));
                        this.earlyDialogs[id].pracked.push(response.getHeader("rseq"));
                        this.earlyDialogs[id].sendRequest(this, Constants_1.C.PRACK, {
                            extraHeaders: extraHeaders
                        });
                        this.emit("progress", response);
                    }
                    else if (this.hasOffer) {
                        if (!this.createDialog(response, "UAC")) {
                            break;
                        }
                        this.hasAnswer = true;
                        if (this.dialog !== undefined && rseq_1) {
                            this.dialog.pracked.push(rseq_1);
                        }
                        this.sessionDescriptionHandler.setDescription(response.body, this.sessionDescriptionHandlerOptions, this.modifiers).then(function () {
                            extraHeaders.push("RAck: " + response.getHeader("rseq") + " " + response.getHeader("cseq"));
                            _this.sendRequest(Constants_1.C.PRACK, {
                                extraHeaders: extraHeaders,
                                // tslint:disable-next-line:no-empty
                                receiveResponse: function () { }
                            });
                            _this.status = Enums_1.SessionStatus.STATUS_EARLY_MEDIA;
                            _this.emit("progress", response);
                        }, function (e) {
                            _this.logger.warn(e);
                            _this.acceptAndTerminate(response, 488, "Not Acceptable Here");
                            _this.failed(response, Constants_1.C.causes.BAD_MEDIA_DESCRIPTION);
                        });
                    }
                    else {
                        var earlyDialog_1 = this.earlyDialogs[id];
                        earlyDialog_1.sessionDescriptionHandler = this.sessionDescriptionHandlerFactory(this, this.ua.configuration.sessionDescriptionHandlerFactoryOptions || {});
                        this.emit("SessionDescriptionHandler-created", earlyDialog_1.sessionDescriptionHandler);
                        if (rseq_1) {
                            earlyDialog_1.pracked.push(rseq_1);
                        }
                        if (earlyDialog_1.sessionDescriptionHandler) {
                            earlyDialog_1.sessionDescriptionHandler.setDescription(response.body, this.sessionDescriptionHandlerOptions, this.modifiers).then(function () { return earlyDialog_1.sessionDescriptionHandler.getDescription(_this.sessionDescriptionHandlerOptions, _this.modifiers); }).then(function (description) {
                                extraHeaders.push("RAck: " + rseq_1 + " " + response.getHeader("cseq"));
                                earlyDialog_1.sendRequest(_this, Constants_1.C.PRACK, {
                                    extraHeaders: extraHeaders,
                                    body: description
                                });
                                _this.status = Enums_1.SessionStatus.STATUS_EARLY_MEDIA;
                                _this.emit("progress", response);
                            }).catch(function (e) {
                                // TODO: This is a bit wonky
                                if (rseq_1 && e.type === Enums_1.TypeStrings.SessionDescriptionHandlerError) {
                                    earlyDialog_1.pracked.push(rseq_1);
                                    if (_this.status === Enums_1.SessionStatus.STATUS_TERMINATED) {
                                        return;
                                    }
                                    _this.failed(undefined, Constants_1.C.causes.WEBRTC_ERROR);
                                    _this.terminated(undefined, Constants_1.C.causes.WEBRTC_ERROR);
                                }
                                else {
                                    if (rseq_1) {
                                        earlyDialog_1.pracked.splice(earlyDialog_1.pracked.indexOf(rseq_1), 1);
                                    }
                                    // Could not set remote description
                                    _this.logger.warn("invalid description");
                                    _this.logger.warn(e);
                                }
                            });
                        }
                    }
                }
                else {
                    this.emit("progress", response);
                }
                break;
            case /^2[0-9]{2}$/.test(codeString):
                var cseq = this.request.cseq + " " + this.request.method;
                if (cseq !== response.getHeader("cseq")) {
                    break;
                }
                if (response.hasHeader("P-Asserted-Identity")) {
                    this.assertedIdentity = Grammar_1.Grammar.nameAddrHeaderParse(response.getHeader("P-Asserted-Identity"));
                }
                if (this.status === Enums_1.SessionStatus.STATUS_EARLY_MEDIA && this.dialog) {
                    this.status = Enums_1.SessionStatus.STATUS_CONFIRMED;
                    var options = {};
                    if (this.renderbody) {
                        extraHeaders.push("Content-Type: " + this.rendertype);
                        options.extraHeaders = extraHeaders;
                        options.body = this.renderbody;
                    }
                    this.emit("ack", response.transaction.sendACK(options));
                    this.accepted(response);
                    break;
                }
                // Do nothing if this.dialog is already confirmed
                if (this.dialog) {
                    break;
                }
                // This is an invite without sdp
                if (!this.hasOffer) {
                    if (this.earlyDialogs[id] && this.earlyDialogs[id].sessionDescriptionHandler) {
                        // REVISIT
                        this.hasOffer = true;
                        this.hasAnswer = true;
                        this.sessionDescriptionHandler = this.earlyDialogs[id].sessionDescriptionHandler;
                        if (!this.createDialog(response, "UAC")) {
                            break;
                        }
                        this.status = Enums_1.SessionStatus.STATUS_CONFIRMED;
                        this.emit("ack", response.transaction.sendACK());
                        this.accepted(response);
                    }
                    else {
                        this.sessionDescriptionHandler = this.sessionDescriptionHandlerFactory(this, this.ua.configuration.sessionDescriptionHandlerFactoryOptions || {});
                        this.emit("SessionDescriptionHandler-created", this.sessionDescriptionHandler);
                        if (!this.sessionDescriptionHandler.hasDescription(response.getHeader("Content-Type") || "")) {
                            this.acceptAndTerminate(response, 400, "Missing session description");
                            this.failed(response, Constants_1.C.causes.BAD_MEDIA_DESCRIPTION);
                            break;
                        }
                        if (!this.createDialog(response, "UAC")) {
                            break;
                        }
                        this.hasOffer = true;
                        this.sessionDescriptionHandler.setDescription(response.body, this.sessionDescriptionHandlerOptions, this.modifiers).then(function () { return _this.sessionDescriptionHandler.getDescription(_this.sessionDescriptionHandlerOptions, _this.modifiers); }).then(function (description) {
                            if (_this.isCanceled || _this.status === Enums_1.SessionStatus.STATUS_TERMINATED) {
                                return;
                            }
                            _this.status = Enums_1.SessionStatus.STATUS_CONFIRMED;
                            _this.hasAnswer = true;
                            _this.emit("ack", response.transaction.sendACK({ body: description }));
                            _this.accepted(response);
                        }).catch(function (e) {
                            if (e.type === Enums_1.TypeStrings.SessionDescriptionHandlerError) {
                                _this.logger.warn("invalid description");
                                _this.logger.warn(e.toString());
                                // TODO: This message is inconsistent
                                _this.acceptAndTerminate(response, 488, "Invalid session description");
                                _this.failed(response, Constants_1.C.causes.BAD_MEDIA_DESCRIPTION);
                            }
                        });
                    }
                }
                else if (this.hasAnswer) {
                    var options = {};
                    if (this.renderbody) {
                        extraHeaders.push("Content-Type: " + this.rendertype);
                        options.extraHeaders = extraHeaders;
                        options.body = this.renderbody;
                    }
                    this.emit("ack", response.transaction.sendACK(options));
                }
                else {
                    if (!this.sessionDescriptionHandler ||
                        !this.sessionDescriptionHandler.hasDescription(response.getHeader("Content-Type") || "")) {
                        this.acceptAndTerminate(response, 400, "Missing session description");
                        this.failed(response, Constants_1.C.causes.BAD_MEDIA_DESCRIPTION);
                        break;
                    }
                    if (!this.createDialog(response, "UAC")) {
                        break;
                    }
                    this.hasAnswer = true;
                    this.sessionDescriptionHandler.setDescription(response.body, this.sessionDescriptionHandlerOptions, this.modifiers).then(function () {
                        var options = {};
                        _this.status = Enums_1.SessionStatus.STATUS_CONFIRMED;
                        if (_this.renderbody) {
                            extraHeaders.push("Content-Type: " + _this.rendertype);
                            options.extraHeaders = extraHeaders;
                            options.body = _this.renderbody;
                        }
                        _this.emit("ack", response.transaction.sendACK(options));
                        _this.accepted(response);
                    }, function (e) {
                        _this.logger.warn(e);
                        _this.acceptAndTerminate(response, 488, "Not Acceptable Here");
                        _this.failed(response, Constants_1.C.causes.BAD_MEDIA_DESCRIPTION);
                    });
                }
                break;
            default:
                var cause = Utils_1.Utils.sipErrorCause(statusCode || 0);
                this.rejected(response, cause);
                this.failed(response, cause);
                this.terminated(response, cause);
        }
    };
    InviteClientContext.prototype.cancel = function (options) {
        if (options === void 0) { options = {}; }
        options.extraHeaders = (options.extraHeaders || []).slice();
        if (this.isCanceled) {
            throw new Exceptions_1.Exceptions.InvalidStateError(Enums_1.SessionStatus.STATUS_CANCELED);
        }
        // Check Session Status
        if (this.status === Enums_1.SessionStatus.STATUS_TERMINATED || this.status === Enums_1.SessionStatus.STATUS_CONFIRMED) {
            throw new Exceptions_1.Exceptions.InvalidStateError(this.status);
        }
        this.logger.log("canceling RTCSession");
        this.isCanceled = true;
        var cancelReason = Utils_1.Utils.getCancelReason(options.statusCode, options.reasonPhrase);
        // Check Session Status
        if (this.status === Enums_1.SessionStatus.STATUS_NULL ||
            (this.status === Enums_1.SessionStatus.STATUS_INVITE_SENT && !this.received100)) {
            this.cancelReason = cancelReason;
        }
        else if (this.status === Enums_1.SessionStatus.STATUS_INVITE_SENT ||
            this.status === Enums_1.SessionStatus.STATUS_1XX_RECEIVED ||
            this.status === Enums_1.SessionStatus.STATUS_EARLY_MEDIA) {
            this.request.cancel(cancelReason, options.extraHeaders);
        }
        return this.canceled();
    };
    InviteClientContext.prototype.terminate = function (options) {
        if (this.status === Enums_1.SessionStatus.STATUS_TERMINATED) {
            return this;
        }
        if (this.status === Enums_1.SessionStatus.STATUS_WAITING_FOR_ACK || this.status === Enums_1.SessionStatus.STATUS_CONFIRMED) {
            this.bye(options);
        }
        else {
            this.cancel(options);
        }
        return this;
    };
    // ICC RECEIVE REQUEST
    InviteClientContext.prototype.receiveRequest = function (request) {
        // Reject CANCELs
        if (request.method === Constants_1.C.CANCEL) {
            // TODO; make this a switch when it gets added
        }
        if (request.method === Constants_1.C.ACK && this.status === Enums_1.SessionStatus.STATUS_WAITING_FOR_ACK) {
            clearTimeout(this.timers.ackTimer);
            clearTimeout(this.timers.invite2xxTimer);
            this.status = Enums_1.SessionStatus.STATUS_CONFIRMED;
            this.accepted();
        }
        return _super.prototype.receiveRequest.call(this, request);
    };
    return InviteClientContext;
}(Session));
exports.InviteClientContext = InviteClientContext;
// tslint:disable-next-line:max-classes-per-file
var ReferClientContext = /** @class */ (function (_super) {
    __extends(ReferClientContext, _super);
    function ReferClientContext(ua, applicant, target, options) {
        if (options === void 0) { options = {}; }
        var _this = this;
        if (ua === undefined || applicant === undefined || target === undefined) {
            throw new TypeError("Not enough arguments");
        }
        _this = _super.call(this, ua, Constants_1.C.REFER, applicant.remoteIdentity.uri.toString(), options) || this;
        _this.type = Enums_1.TypeStrings.ReferClientContext;
        _this.options = options;
        _this.extraHeaders = (_this.options.extraHeaders || []).slice();
        _this.applicant = applicant;
        if (!(typeof target === "string") &&
            (target.type === Enums_1.TypeStrings.InviteServerContext || target.type === Enums_1.TypeStrings.InviteClientContext)) {
            // Attended Transfer (with replaces)
            // All of these fields should be defined based on the check above
            var dialog = target.dialog;
            if (dialog) {
                _this.target = '"' + target.remoteIdentity.friendlyName + '" ' +
                    "<" + dialog.remoteTarget.toString() +
                    "?Replaces=" + dialog.id.callId +
                    "%3Bto-tag%3D" + dialog.id.remoteTag +
                    "%3Bfrom-tag%3D" + dialog.id.localTag + ">";
            }
            else {
                throw new TypeError("Invalid target due to no dialog: " + target);
            }
        }
        else {
            // Blind Transfer
            // Refer-To: <sip:bob@example.com>
            var targetString = Grammar_1.Grammar.parse(target, "Refer_To");
            _this.target = targetString && targetString.uri ? targetString.uri : target;
            // Check target validity
            var targetUri = _this.ua.normalizeTarget(_this.target);
            if (!targetUri) {
                throw new TypeError("Invalid target: " + target);
            }
            _this.target = targetUri;
        }
        if (_this.ua) {
            _this.extraHeaders.push("Referred-By: <" + _this.ua.configuration.uri + ">");
        }
        // TODO: Check that this is correct isc/icc
        _this.extraHeaders.push("Contact: " + applicant.contact);
        // this is UA.C.ALLOWED_METHODS, removed to get around circular dependency
        _this.extraHeaders.push("Allow: " + [
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
        _this.extraHeaders.push("Refer-To: " + _this.target);
        _this.errorListener = _this.onTransportError.bind(_this);
        if (ua.transport) {
            ua.transport.on("transportError", _this.errorListener);
        }
        return _this;
    }
    ReferClientContext.prototype.refer = function (options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        var extraHeaders = (this.extraHeaders || []).slice();
        if (options.extraHeaders) {
            extraHeaders.concat(options.extraHeaders);
        }
        this.applicant.sendRequest(Constants_1.C.REFER, {
            extraHeaders: this.extraHeaders,
            receiveResponse: function (response) {
                var statusCode = response && response.statusCode ? response.statusCode.toString() : "";
                if (/^1[0-9]{2}$/.test(statusCode)) {
                    _this.emit("referRequestProgress", _this);
                }
                else if (/^2[0-9]{2}$/.test(statusCode)) {
                    _this.emit("referRequestAccepted", _this);
                }
                else if (/^[4-6][0-9]{2}$/.test(statusCode)) {
                    _this.emit("referRequestRejected", _this);
                }
                if (options.receiveResponse) {
                    options.receiveResponse(response);
                }
            }
        });
        return this;
    };
    ReferClientContext.prototype.receiveNotify = function (request) {
        // If we can correctly handle this, then we need to send a 200 OK!
        var contentType = request.hasHeader("Content-Type") ?
            request.getHeader("Content-Type") : undefined;
        if (contentType && contentType.search(/^message\/sipfrag/) !== -1) {
            var messageBody = Grammar_1.Grammar.parse(request.body, "sipfrag");
            if (messageBody === -1) {
                request.reply(489, "Bad Event");
                return;
            }
            switch (true) {
                case (/^1[0-9]{2}$/.test(messageBody.statusCode)):
                    this.emit("referProgress", this);
                    break;
                case (/^2[0-9]{2}$/.test(messageBody.statusCode)):
                    this.emit("referAccepted", this);
                    if (!this.options.activeAfterTransfer && this.applicant.terminate) {
                        this.applicant.terminate();
                    }
                    break;
                default:
                    this.emit("referRejected", this);
                    break;
            }
            request.reply(200);
            this.emit("notify", request);
            return;
        }
        request.reply(489, "Bad Event");
    };
    return ReferClientContext;
}(ClientContext_1.ClientContext));
exports.ReferClientContext = ReferClientContext;
// tslint:disable-next-line:max-classes-per-file
var ReferServerContext = /** @class */ (function (_super) {
    __extends(ReferServerContext, _super);
    function ReferServerContext(ua, request) {
        var _this = _super.call(this, ua, request) || this;
        _this.type = Enums_1.TypeStrings.ReferServerContext;
        _this.ua = ua;
        _this.status = Enums_1.SessionStatus.STATUS_INVITE_RECEIVED;
        _this.fromTag = request.fromTag;
        _this.id = request.callId + _this.fromTag;
        _this.request = request;
        _this.contact = _this.ua.contact.toString();
        _this.logger = ua.getLogger("sip.referservercontext", _this.id);
        // Needed to send the NOTIFY's
        _this.cseq = Math.floor(Math.random() * 10000);
        _this.callId = _this.request.callId;
        _this.fromUri = _this.request.to.uri;
        _this.fromTag = _this.request.to.parameters.tag;
        _this.remoteTarget = _this.request.headers.Contact[0].parsed.uri;
        _this.toUri = _this.request.from.uri;
        _this.toTag = _this.request.fromTag;
        _this.routeSet = _this.request.getHeaders("record-route");
        // RFC 3515 2.4.1
        if (!_this.request.hasHeader("refer-to")) {
            _this.logger.warn("Invalid REFER packet. A refer-to header is required. Rejecting refer.");
            _this.reject();
            return _this;
        }
        _this.referTo = _this.request.parseHeader("refer-to");
        // TODO: Must set expiration timer and send 202 if there is no response by then
        _this.referredSession = _this.ua.findSession(request);
        if (_this.request.hasHeader("referred-by")) {
            _this.referredBy = _this.request.getHeader("referred-by");
        }
        if (_this.referTo.uri.hasHeader("replaces")) {
            _this.replaces = _this.referTo.uri.getHeader("replaces");
        }
        _this.errorListener = _this.onTransportError.bind(_this);
        if (ua.transport) {
            ua.transport.on("transportError", _this.errorListener);
        }
        _this.status = Enums_1.SessionStatus.STATUS_WAITING_FOR_ANSWER;
        return _this;
    }
    ReferServerContext.prototype.receiveNonInviteResponse = function (response) { };
    ReferServerContext.prototype.progress = function () {
        if (this.status !== Enums_1.SessionStatus.STATUS_WAITING_FOR_ANSWER) {
            throw new Exceptions_1.Exceptions.InvalidStateError(this.status);
        }
        this.request.reply(100);
    };
    ReferServerContext.prototype.reject = function (options) {
        if (options === void 0) { options = {}; }
        if (this.status === Enums_1.SessionStatus.STATUS_TERMINATED) {
            throw new Exceptions_1.Exceptions.InvalidStateError(this.status);
        }
        this.logger.log("Rejecting refer");
        this.status = Enums_1.SessionStatus.STATUS_TERMINATED;
        _super.prototype.reject.call(this, options);
        this.emit("referRequestRejected", this);
    };
    ReferServerContext.prototype.accept = function (options, modifiers) {
        var _this = this;
        if (options === void 0) { options = {}; }
        if (this.status === Enums_1.SessionStatus.STATUS_WAITING_FOR_ANSWER) {
            this.status = Enums_1.SessionStatus.STATUS_ANSWERED;
        }
        else {
            throw new Exceptions_1.Exceptions.InvalidStateError(this.status);
        }
        this.request.reply(202, "Accepted");
        this.emit("referRequestAccepted", this);
        if (options.followRefer) {
            this.logger.log("Accepted refer, attempting to automatically follow it");
            var target = this.referTo.uri;
            if (!target.scheme || !target.scheme.match("^sips?$")) {
                this.logger.error("SIP.js can only automatically follow SIP refer target");
                this.reject();
                return;
            }
            var inviteOptions = options.inviteOptions || {};
            var extraHeaders = (inviteOptions.extraHeaders || []).slice();
            if (this.replaces) {
                // decodeURIComponent is a holdover from 2c086eb4. Not sure that it is actually necessary
                extraHeaders.push("Replaces: " + decodeURIComponent(this.replaces));
            }
            if (this.referredBy) {
                extraHeaders.push("Referred-By: " + this.referredBy);
            }
            inviteOptions.extraHeaders = extraHeaders;
            target.clearHeaders();
            this.targetSession = this.ua.invite(target.toString(), inviteOptions, modifiers);
            this.emit("referInviteSent", this);
            if (this.targetSession) {
                this.targetSession.once("progress", function (response) {
                    var statusCode = response.statusCode || 100;
                    var reasonPhrase = response.reasonPhrase;
                    _this.sendNotify(("SIP/2.0 " + statusCode + " " + reasonPhrase).trim());
                    _this.emit("referProgress", _this);
                    if (_this.referredSession) {
                        _this.referredSession.emit("referProgress", _this);
                    }
                });
                this.targetSession.once("accepted", function () {
                    _this.logger.log("Successfully followed the refer");
                    _this.sendNotify("SIP/2.0 200 OK");
                    _this.emit("referAccepted", _this);
                    if (_this.referredSession) {
                        _this.referredSession.emit("referAccepted", _this);
                    }
                });
                var referFailed = function (response) {
                    if (_this.status === Enums_1.SessionStatus.STATUS_TERMINATED) {
                        return; // No throw here because it is possible this gets called multiple times
                    }
                    _this.logger.log("Refer was not successful. Resuming session");
                    if (response && response.statusCode === 429) {
                        _this.logger.log("Alerting referrer that identity is required.");
                        _this.sendNotify("SIP/2.0 429 Provide Referrer Identity");
                        return;
                    }
                    _this.sendNotify("SIP/2.0 603 Declined");
                    // Must change the status after sending the final Notify or it will not send due to check
                    _this.status = Enums_1.SessionStatus.STATUS_TERMINATED;
                    _this.emit("referRejected", _this);
                    if (_this.referredSession) {
                        _this.referredSession.emit("referRejected");
                    }
                };
                this.targetSession.once("rejected", referFailed);
                this.targetSession.once("failed", referFailed);
            }
        }
        else {
            this.logger.log("Accepted refer, but did not automatically follow it");
            this.sendNotify("SIP/2.0 200 OK");
            this.emit("referAccepted", this);
            if (this.referredSession) {
                this.referredSession.emit("referAccepted", this);
            }
        }
    };
    ReferServerContext.prototype.sendNotify = function (body) {
        if (this.status !== Enums_1.SessionStatus.STATUS_ANSWERED) {
            throw new Exceptions_1.Exceptions.InvalidStateError(this.status);
        }
        if (Grammar_1.Grammar.parse(body, "sipfrag") === -1) {
            throw new Error("sipfrag body is required to send notify for refer");
        }
        var request = new SIPMessage_1.OutgoingRequest(Constants_1.C.NOTIFY, this.remoteTarget, this.ua, {
            cseq: this.cseq += 1,
            callId: this.callId,
            fromUri: this.fromUri,
            fromTag: this.fromTag,
            toUri: this.toUri,
            toTag: this.toTag,
            routeSet: this.routeSet
        }, [
            "Event: refer",
            "Subscription-State: terminated",
            "Content-Type: message/sipfrag"
        ], body);
        new RequestSender_1.RequestSender({
            request: request,
            onRequestTimeout: function () {
                return;
            },
            onTransportError: function () {
                return;
            },
            receiveResponse: function () {
                return;
            }
        }, this.ua).send();
    };
    return ReferServerContext;
}(ServerContext_1.ServerContext));
exports.ReferServerContext = ReferServerContext;
