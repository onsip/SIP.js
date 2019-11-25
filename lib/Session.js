"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var events_1 = require("events");
var ClientContext_1 = require("./ClientContext");
var Constants_1 = require("./Constants");
var core_1 = require("./core");
var Enums_1 = require("./Enums");
var Exceptions_1 = require("./Exceptions");
var ReferContext_1 = require("./ReferContext");
var ServerContext_1 = require("./ServerContext");
var DTMF_1 = require("./Session/DTMF");
var DTMFValidator_1 = require("./Session/DTMFValidator");
var Utils_1 = require("./Utils");
/*
 * @param {function returning SIP.sessionDescriptionHandler} [sessionDescriptionHandlerFactory]
 *        (See the documentation for the sessionDescriptionHandlerFactory argument of the UA constructor.)
 */
var Session = /** @class */ (function (_super) {
    tslib_1.__extends(Session, _super);
    function Session(sessionDescriptionHandlerFactory) {
        var _this = _super.call(this) || this;
        _this.data = {};
        _this.type = Enums_1.TypeStrings.Session;
        if (!sessionDescriptionHandlerFactory) {
            throw new Exceptions_1.Exceptions.SessionDescriptionHandlerError("A session description handler is required for the session to function");
        }
        _this.status = Session.C.STATUS_NULL;
        _this.pendingReinvite = false;
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
        return _this;
    }
    Session.prototype.dtmf = function (tones, options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        // Check Session Status
        if (this.status !== Enums_1.SessionStatus.STATUS_CONFIRMED && this.status !== Enums_1.SessionStatus.STATUS_WAITING_FOR_ACK) {
            throw new Exceptions_1.Exceptions.InvalidStateError(this.status);
        }
        // Check tones' validity
        DTMFValidator_1.DTMFValidator.validate(tones);
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
        this.referContext = new ReferContext_1.ReferClientContext(this.ua, this, target, options);
        this.emit("referRequested", this.referContext);
        this.referContext.refer(options);
        return this.referContext;
    };
    /**
     * Sends in dialog request.
     * @param method Request method.
     * @param options Options bucket.
     */
    Session.prototype.sendRequest = function (method, options) {
        if (options === void 0) { options = {}; }
        if (!this.session) {
            throw new Error("Session undefined.");
        }
        // Convert any "body" option to a Body.
        if (options.body) {
            options.body = Utils_1.Utils.fromBodyObj(options.body);
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
        this.status = Enums_1.SessionStatus.STATUS_TERMINATED;
        if (this.ua.transport) {
            this.ua.transport.removeListener("transportError", this.errorListener);
        }
        delete this.ua.sessions[this.id];
        return this;
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
    Session.prototype.on = function (name, callback) {
        return _super.prototype.on.call(this, name, callback);
    };
    Session.prototype.onAck = function (incomingRequest) {
        var _this = this;
        var confirmSession = function () {
            clearTimeout(_this.timers.ackTimer);
            clearTimeout(_this.timers.invite2xxTimer);
            _this.status = Enums_1.SessionStatus.STATUS_CONFIRMED;
            var contentDisp = incomingRequest.message.getHeader("Content-Disposition");
            if (contentDisp && contentDisp.type === "render") {
                _this.renderbody = incomingRequest.message.body;
                _this.rendertype = incomingRequest.message.getHeader("Content-Type");
            }
            _this.emit("confirmed", incomingRequest.message);
        };
        if (this.status === Enums_1.SessionStatus.STATUS_WAITING_FOR_ACK) {
            if (this.sessionDescriptionHandler &&
                this.sessionDescriptionHandler.hasDescription(incomingRequest.message.getHeader("Content-Type") || "")) {
                this.hasAnswer = true;
                this.sessionDescriptionHandler.setDescription(incomingRequest.message.body, this.sessionDescriptionHandlerOptions, this.modifiers).catch(function (e) {
                    _this.logger.warn(e);
                    _this.terminate({
                        statusCode: "488",
                        reasonPhrase: "Bad Media Description"
                    });
                    _this.failed(incomingRequest.message, Constants_1.C.causes.BAD_MEDIA_DESCRIPTION);
                    _this.terminated(incomingRequest.message, Constants_1.C.causes.BAD_MEDIA_DESCRIPTION);
                    throw e;
                }).then(function () { return confirmSession(); });
            }
            else {
                confirmSession();
            }
        }
    };
    Session.prototype.receiveRequest = function (incomingRequest) {
        switch (incomingRequest.message.method) { // TODO: This needs a default case
            case Constants_1.C.BYE:
                incomingRequest.accept();
                if (this.status === Enums_1.SessionStatus.STATUS_CONFIRMED) {
                    this.emit("bye", incomingRequest.message);
                    this.terminated(incomingRequest.message, Constants_1.C.BYE);
                }
                break;
            case Constants_1.C.INVITE:
                if (this.status === Enums_1.SessionStatus.STATUS_CONFIRMED) {
                    this.logger.log("re-INVITE received");
                    this.receiveReinvite(incomingRequest);
                }
                break;
            case Constants_1.C.INFO:
                if (this.status === Enums_1.SessionStatus.STATUS_CONFIRMED || this.status === Enums_1.SessionStatus.STATUS_WAITING_FOR_ACK) {
                    if (this.onInfo) {
                        return this.onInfo(incomingRequest.message);
                    }
                    var contentType = incomingRequest.message.getHeader("content-type");
                    if (contentType) {
                        if (contentType.match(/^application\/dtmf-relay/i)) {
                            if (incomingRequest.message.body) {
                                var body = incomingRequest.message.body.split("\r\n", 2);
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
                                        new DTMF_1.DTMF(this, tone, { duration: duration }).init_incoming(incomingRequest);
                                    }
                                }
                            }
                        }
                        else {
                            incomingRequest.reject({
                                statusCode: 415,
                                extraHeaders: ["Accept: application/dtmf-relay"]
                            });
                        }
                    }
                }
                break;
            case Constants_1.C.REFER:
                if (this.status === Enums_1.SessionStatus.STATUS_CONFIRMED) {
                    this.logger.log("REFER received");
                    this.referContext = new ReferContext_1.ReferServerContext(this.ua, incomingRequest, this.session);
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
                if (this.referContext &&
                    this.referContext.type === Enums_1.TypeStrings.ReferClientContext &&
                    incomingRequest.message.hasHeader("event") &&
                    /^refer(;.*)?$/.test(incomingRequest.message.getHeader("event"))) {
                    this.referContext.receiveNotify(incomingRequest);
                    return;
                }
                incomingRequest.accept();
                this.emit("notify", incomingRequest.message);
                break;
        }
    };
    // In dialog INVITE Reception
    Session.prototype.receiveReinvite = function (incomingRequest) {
        // TODO: Should probably check state of the session
        var _this = this;
        this.emit("reinvite", this, incomingRequest.message);
        if (incomingRequest.message.hasHeader("P-Asserted-Identity")) {
            this.assertedIdentity =
                core_1.Grammar.nameAddrHeaderParse(incomingRequest.message.getHeader("P-Asserted-Identity"));
        }
        var promise;
        if (!this.sessionDescriptionHandler) {
            this.logger.warn("No SessionDescriptionHandler to reinvite");
            return;
        }
        if (incomingRequest.message.getHeader("Content-Length") === "0" &&
            !incomingRequest.message.getHeader("Content-Type")) { // Invite w/o SDP
            promise = this.sessionDescriptionHandler.getDescription(this.sessionDescriptionHandlerOptions, this.modifiers);
        }
        else if (this.sessionDescriptionHandler.hasDescription(incomingRequest.message.getHeader("Content-Type") || "")) {
            // Invite w/ SDP
            promise = this.sessionDescriptionHandler.setDescription(incomingRequest.message.body, this.sessionDescriptionHandlerOptions, this.modifiers).then(this.sessionDescriptionHandler.getDescription.bind(this.sessionDescriptionHandler, this.sessionDescriptionHandlerOptions, this.modifiers));
        }
        else { // Bad Packet (should never get hit)
            incomingRequest.reject({ statusCode: 415 });
            this.emit("reinviteFailed", this);
            return;
        }
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
            incomingRequest.reject({ statusCode: statusCode });
            _this.emit("reinviteFailed", _this);
            // TODO: This could be better
            throw e;
        }).then(function (description) {
            var extraHeaders = ["Contact: " + _this.contact];
            incomingRequest.accept({
                statusCode: 200,
                extraHeaders: extraHeaders,
                body: Utils_1.Utils.fromBodyObj(description)
            });
            _this.status = Enums_1.SessionStatus.STATUS_WAITING_FOR_ACK;
            _this.emit("reinviteAccepted", _this);
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
            if (!_this.session) {
                throw new Error("Session undefined.");
            }
            var delegate = {
                onAccept: function (response) {
                    if (_this.status === Enums_1.SessionStatus.STATUS_TERMINATED) {
                        _this.logger.error("Received reinvite response, but in STATUS_TERMINATED");
                        // TODO: Do we need to send a SIP response?
                        return;
                    }
                    if (!_this.pendingReinvite) {
                        _this.logger.error("Received reinvite response, but have no pending reinvite");
                        // TODO: Do we need to send a SIP response?
                        return;
                    }
                    // FIXME: Why is this set here?
                    _this.status = Enums_1.SessionStatus.STATUS_CONFIRMED;
                    // 17.1.1.1 - For each final response that is received at the client transaction,
                    // the client transaction sends an ACK,
                    _this.emit("ack", response.ack());
                    _this.pendingReinvite = false;
                    // TODO: All of these timers should move into the Transaction layer
                    clearTimeout(_this.timers.invite2xxTimer);
                    if (!_this.sessionDescriptionHandler ||
                        !_this.sessionDescriptionHandler.hasDescription(response.message.getHeader("Content-Type") || "")) {
                        _this.logger.error("2XX response received to re-invite but did not have a description");
                        _this.emit("reinviteFailed", _this);
                        _this.emit("renegotiationError", new Exceptions_1.Exceptions.RenegotiationError("2XX response received to re-invite but did not have a description"));
                        return;
                    }
                    _this.sessionDescriptionHandler
                        .setDescription(response.message.body, _this.sessionDescriptionHandlerOptions, _this.modifiers)
                        .catch(function (e) {
                        _this.logger.error("Could not set the description in 2XX response");
                        _this.logger.error(e);
                        _this.emit("reinviteFailed", _this);
                        _this.emit("renegotiationError", e);
                        _this.sendRequest(Constants_1.C.BYE, {
                            extraHeaders: ["Reason: " + Utils_1.Utils.getReasonHeaderValue(488, "Not Acceptable Here")]
                        });
                        _this.terminated(undefined, Constants_1.C.causes.INCOMPATIBLE_SDP);
                        throw e;
                    })
                        .then(function () {
                        _this.emit("reinviteAccepted", _this);
                    });
                },
                onProgress: function (response) {
                    return;
                },
                onRedirect: function (response) {
                    // FIXME: Does ACK need to be sent?
                    _this.pendingReinvite = false;
                    _this.logger.log("Received a non 1XX or 2XX response to a re-invite");
                    _this.emit("reinviteFailed", _this);
                    _this.emit("renegotiationError", new Exceptions_1.Exceptions.RenegotiationError("Invalid response to a re-invite"));
                },
                onReject: function (response) {
                    // FIXME: Does ACK need to be sent?
                    _this.pendingReinvite = false;
                    _this.logger.log("Received a non 1XX or 2XX response to a re-invite");
                    _this.emit("reinviteFailed", _this);
                    _this.emit("renegotiationError", new Exceptions_1.Exceptions.RenegotiationError("Invalid response to a re-invite"));
                },
                onTrying: function (response) {
                    return;
                }
            };
            var requestOptions = {
                extraHeaders: extraHeaders,
                body: Utils_1.Utils.fromBodyObj(description)
            };
            _this.session.invite(delegate, requestOptions);
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
    Session.C = Enums_1.SessionStatus;
    return Session;
}(events_1.EventEmitter));
exports.Session = Session;
// tslint:disable-next-line:max-classes-per-file
var InviteServerContext = /** @class */ (function (_super) {
    tslib_1.__extends(InviteServerContext, _super);
    function InviteServerContext(ua, incomingInviteRequest) {
        var _this = this;
        if (!ua.configuration.sessionDescriptionHandlerFactory) {
            ua.logger.warn("Can't build ISC without SDH Factory");
            throw new Error("ISC Constructor Failed");
        }
        _this = _super.call(this, ua.configuration.sessionDescriptionHandlerFactory) || this;
        _this._canceled = false;
        _this.rseq = Math.floor(Math.random() * 10000);
        _this.incomingRequest = incomingInviteRequest;
        var request = incomingInviteRequest.message;
        ServerContext_1.ServerContext.initializer(_this, ua, incomingInviteRequest);
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
        // Set the toTag on the incoming request to the toTag which
        // will be used in the response to the incoming request!!!
        // FIXME: HACK: This is a hack to port an existing behavior.
        // The behavior being ported appears to be a hack itself,
        // so this is a hack to port a hack. At least one test spec
        // relies on it (which is yet another hack).
        _this.request.toTag = incomingInviteRequest.toTag;
        _this.status = Enums_1.SessionStatus.STATUS_WAITING_FOR_ANSWER;
        // Set userNoAnswerTimer
        _this.timers.userNoAnswerTimer = setTimeout(function () {
            incomingInviteRequest.reject({ statusCode: 408 });
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
                    incomingInviteRequest.reject({ statusCode: 487 });
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
    Object.defineProperty(InviteServerContext.prototype, "autoSendAnInitialProvisionalResponse", {
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
         */
        get: function () {
            return this.rel100 === Constants_1.C.supported.REQUIRED ? false : true;
        },
        enumerable: true,
        configurable: true
    });
    // type hack for servercontext interface
    InviteServerContext.prototype.reply = function (options) {
        if (options === void 0) { options = {}; }
        return this;
    };
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
        var body = options.body ? core_1.fromBodyLegacy(options.body) : undefined;
        // FIXME: Need to redirect to someplae
        var response = statusCode < 400 ?
            this.incomingRequest.redirect([], { statusCode: statusCode, reasonPhrase: reasonPhrase, extraHeaders: extraHeaders, body: body }) :
            this.incomingRequest.reject({ statusCode: statusCode, reasonPhrase: reasonPhrase, extraHeaders: extraHeaders, body: body });
        (["rejected", "failed"]).forEach(function (event) {
            _this.emit(event, response.message, reasonPhrase);
        });
        return this.terminated();
    };
    /**
     * Accept the incoming INVITE request to start a Session.
     * Replies to the INVITE request with a 200 Ok response.
     * @param options Options bucket.
     */
    InviteServerContext.prototype.accept = function (options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        // FIXME: Need guard against calling more than once.
        this._accept(options)
            .then(function (_a) {
            var message = _a.message, session = _a.session;
            session.delegate = {
                onAck: function (ackRequest) { return _this.onAck(ackRequest); },
                onAckTimeout: function () { return _this.onAckTimeout(); },
                onBye: function (byeRequest) { return _this.receiveRequest(byeRequest); },
                onInfo: function (infoRequest) { return _this.receiveRequest(infoRequest); },
                onInvite: function (inviteRequest) { return _this.receiveRequest(inviteRequest); },
                onNotify: function (notifyRequest) { return _this.receiveRequest(notifyRequest); },
                onPrack: function (prackRequest) { return _this.receiveRequest(prackRequest); },
                onRefer: function (referRequest) { return _this.receiveRequest(referRequest); }
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
                this.incomingRequest.trying();
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
            case core_1.SessionState.Initial:
                this.reject(options);
                return this;
            case core_1.SessionState.Early:
                this.reject(options);
                return this;
            case core_1.SessionState.AckWait:
                this.session.delegate = {
                    // When ACK shows up, say BYE.
                    onAck: function () {
                        _this.sendRequest(Constants_1.C.BYE, options);
                    },
                    // Or the server transaction times out before the ACK arrives.
                    onAckTimeout: function () {
                        _this.sendRequest(Constants_1.C.BYE, options);
                    }
                };
                // Ported
                this.emit("bye", this.request);
                this.terminated();
                return this;
            case core_1.SessionState.Confirmed:
                this.bye(options);
                return this;
            case core_1.SessionState.Terminated:
                return this;
            default:
                return this;
        }
    };
    InviteServerContext.prototype.onCancel = function (message) {
        if (this.status === Enums_1.SessionStatus.STATUS_WAITING_FOR_ANSWER ||
            this.status === Enums_1.SessionStatus.STATUS_WAITING_FOR_PRACK ||
            this.status === Enums_1.SessionStatus.STATUS_ANSWERED_WAITING_FOR_PRACK ||
            this.status === Enums_1.SessionStatus.STATUS_EARLY_MEDIA ||
            this.status === Enums_1.SessionStatus.STATUS_ANSWERED) {
            this.status = Enums_1.SessionStatus.STATUS_CANCELED;
            this.incomingRequest.reject({ statusCode: 487 });
            this.canceled();
            this.rejected(message, Constants_1.C.causes.CANCELED);
            this.failed(message, Constants_1.C.causes.CANCELED);
            this.terminated(message, Constants_1.C.causes.CANCELED);
        }
    };
    InviteServerContext.prototype.receiveRequest = function (incomingRequest) {
        var _this = this;
        switch (incomingRequest.message.method) {
            case Constants_1.C.PRACK:
                if (this.status === Enums_1.SessionStatus.STATUS_WAITING_FOR_PRACK ||
                    this.status === Enums_1.SessionStatus.STATUS_ANSWERED_WAITING_FOR_PRACK) {
                    if (!this.hasAnswer) {
                        this.sessionDescriptionHandler = this.setupSessionDescriptionHandler();
                        this.emit("SessionDescriptionHandler-created", this.sessionDescriptionHandler);
                        if (this.sessionDescriptionHandler.hasDescription(incomingRequest.message.getHeader("Content-Type") || "")) {
                            this.hasAnswer = true;
                            this.sessionDescriptionHandler.setDescription(incomingRequest.message.body, this.sessionDescriptionHandlerOptions, this.modifiers).then(function () {
                                clearTimeout(_this.timers.rel1xxTimer);
                                clearTimeout(_this.timers.prackTimer);
                                incomingRequest.accept();
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
                                _this.failed(incomingRequest.message, Constants_1.C.causes.BAD_MEDIA_DESCRIPTION);
                                _this.terminated(incomingRequest.message, Constants_1.C.causes.BAD_MEDIA_DESCRIPTION);
                            });
                        }
                        else {
                            this.terminate({
                                statusCode: "488",
                                reasonPhrase: "Bad Media Description"
                            });
                            this.failed(incomingRequest.message, Constants_1.C.causes.BAD_MEDIA_DESCRIPTION);
                            this.terminated(incomingRequest.message, Constants_1.C.causes.BAD_MEDIA_DESCRIPTION);
                        }
                    }
                    else {
                        clearTimeout(this.timers.rel1xxTimer);
                        clearTimeout(this.timers.prackTimer);
                        incomingRequest.accept();
                        if (this.status === Enums_1.SessionStatus.STATUS_ANSWERED_WAITING_FOR_PRACK) {
                            this.status = Enums_1.SessionStatus.STATUS_EARLY_MEDIA;
                            this.accept();
                        }
                        this.status = Enums_1.SessionStatus.STATUS_EARLY_MEDIA;
                    }
                }
                else if (this.status === Enums_1.SessionStatus.STATUS_EARLY_MEDIA) {
                    incomingRequest.accept();
                }
                break;
            default:
                _super.prototype.receiveRequest.call(this, incomingRequest);
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
    InviteServerContext.prototype.generateResponseOfferAnswer = function (options) {
        if (!this.session) {
            var body = core_1.getBody(this.incomingRequest.message);
            if (!body || body.contentDisposition !== "session") {
                return this.getOffer(options);
            }
            else {
                return this.setOfferAndGetAnswer(body, options);
            }
        }
        else {
            switch (this.session.signalingState) {
                case core_1.SignalingState.Initial:
                    return this.getOffer(options);
                case core_1.SignalingState.Stable:
                    return Promise.resolve(undefined);
                case core_1.SignalingState.HaveLocalOffer:
                    // o  Once the UAS has sent or received an answer to the initial
                    // offer, it MUST NOT generate subsequent offers in any responses
                    // to the initial INVITE.  This means that a UAS based on this
                    // specification alone can never generate subsequent offers until
                    // completion of the initial transaction.
                    // https://tools.ietf.org/html/rfc3261#section-13.2.1
                    return Promise.resolve(undefined);
                case core_1.SignalingState.HaveRemoteOffer:
                    if (!this.session.offer) {
                        throw new Error("Session offer undefined");
                    }
                    return this.setOfferAndGetAnswer(this.session.offer, options);
                case core_1.SignalingState.Closed:
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
        switch (this.session.signalingState) {
            case core_1.SignalingState.Initial:
                // State should never be reached as first reliable provisional response must have answer/offer.
                throw new Error("Invalid signaling state " + this.session.signalingState + ".");
            case core_1.SignalingState.Stable:
                // Receved answer.
                return this.setAnswer(body, options).then(function () { return undefined; });
            case core_1.SignalingState.HaveLocalOffer:
                // State should never be reached as local offer would be answered by this PRACK
                throw new Error("Invalid signaling state " + this.session.signalingState + ".");
            case core_1.SignalingState.HaveRemoteOffer:
                // Receved offer, generate answer.
                return this.setOfferAndGetAnswer(body, options);
            case core_1.SignalingState.Closed:
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
                .then(function (body) { return _this.incomingRequest.accept({ statusCode: 200, body: body }); });
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
            .then(function (body) { return _this.incomingRequest.accept({ statusCode: 200, body: body }); });
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
            var progressResponse = this.incomingRequest.progress({ statusCode: statusCode, reasonPhrase: reasonPhrase, extraHeaders: extraHeaders, body: body });
            this.emit("progress", progressResponse.message, reasonPhrase); // Ported
            this.session = progressResponse.session;
            return Promise.resolve(progressResponse);
        }
        catch (error) {
            return Promise.reject(error);
        }
    };
    /**
     * A version of `progress` which resolves when the provisional response with sdp is sent.
     * @param options Options bucket.
     * @throws {ClosedSessionDescriptionHandlerError} The session description handler closed before method completed.
     * @throws {TransactionStateError} The transaction state does not allow for `progress()` to be called.
     *                                 Note that the transaction state can change while this call is in progress.
     */
    InviteServerContext.prototype._progressWithSDP = function (options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        var statusCode = options.statusCode || 183;
        var reasonPhrase = options.reasonPhrase;
        var extraHeaders = (options.extraHeaders || []).slice();
        // Get an offer/answer and send a reply.
        return this.generateResponseOfferAnswer(options)
            .then(function (body) { return _this.incomingRequest.progress({ statusCode: statusCode, reasonPhrase: reasonPhrase, extraHeaders: extraHeaders, body: body }); })
            .then(function (progressResponse) {
            _this.emit("progress", progressResponse.message, reasonPhrase); // Ported
            _this.session = progressResponse.session;
            return progressResponse;
        });
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
            .then(function (body) { return _this.incomingRequest.progress({ statusCode: statusCode, reasonPhrase: reasonPhrase, extraHeaders: extraHeaders, body: body }); })
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
        extraHeaders.push("RSeq: " + this.rseq++);
        var body;
        // Ported - set status.
        this.status = Enums_1.SessionStatus.STATUS_WAITING_FOR_PRACK;
        return new Promise(function (resolve, reject) {
            var waitingForPrack = true;
            return _this.generateResponseOfferAnswer(options)
                .then(function (offerAnswer) {
                body = offerAnswer;
                return _this.incomingRequest.progress({ statusCode: statusCode, reasonPhrase: reasonPhrase, extraHeaders: extraHeaders, body: body });
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
                        _this.incomingRequest.reject({ statusCode: 504 });
                        _this.terminated(undefined, Constants_1.C.causes.NO_PRACK);
                        reject(new Exceptions_1.Exceptions.TerminatedSessionError());
                    }
                    catch (error) {
                        reject(error);
                    }
                };
                var prackWaitTimeoutTimer = setTimeout(prackWaitTimeout, core_1.Timers.T1 * 64);
                // https://tools.ietf.org/html/rfc3262#section-3
                var rel1xxRetransmission = function () {
                    try {
                        _this.incomingRequest.progress({ statusCode: statusCode, reasonPhrase: reasonPhrase, extraHeaders: extraHeaders, body: body });
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
        var statusCode = 480;
        if (error instanceof core_1.Exception) { // There might be interest in catching these Exceptions.
            if (error instanceof Exceptions_1.Exceptions.SessionDescriptionHandlerError) {
                this.logger.error(error.message);
                if (error.error) {
                    this.logger.error(error.error);
                }
            }
            else if (error instanceof Exceptions_1.Exceptions.TerminatedSessionError) {
                // PRACK never arrived, so we timed out waiting for it.
                this.logger.warn("Incoming session terminated while waiting for PRACK.");
            }
            else if (error instanceof Exceptions_1.Exceptions.UnsupportedSessionDescriptionContentTypeError) {
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
            this.incomingRequest.reject({ statusCode: statusCode }); // "Temporarily Unavailable"
            this.failed(this.incomingRequest.message, error.message);
            this.terminated(this.incomingRequest.message, error.message);
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
            .then(function (bodyObj) { return Utils_1.Utils.fromBodyObj(bodyObj); });
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
            .then(function (bodyObj) { return Utils_1.Utils.fromBodyObj(bodyObj); });
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
}(Session));
exports.InviteServerContext = InviteServerContext;
// tslint:disable-next-line:max-classes-per-file
var InviteClientContext = /** @class */ (function (_super) {
    tslib_1.__extends(InviteClientContext, _super);
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
            outbound: anonymous ? !ua.contact.tempGruu : !ua.contact.pubGruu
        });
        var extraHeaders = (options.extraHeaders || []).slice();
        if (anonymous && ua.configuration.uri) {
            options.params.fromDisplayName = "Anonymous";
            options.params.fromUri = "sip:anonymous@anonymous.invalid";
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
        _this.earlyMediaSessionDescriptionHandlers = new Map();
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
    InviteClientContext.prototype.receiveResponse = function (response) {
        throw new Error("Unimplemented.");
    };
    // hack for getting around ClientContext interface
    InviteClientContext.prototype.send = function () {
        this.sendInvite();
        return this;
    };
    InviteClientContext.prototype.invite = function () {
        var _this = this;
        // Save the session into the ua sessions collection.
        // Note: placing in constructor breaks call to request.cancel on close... User does not need this anyway
        this.ua.sessions[this.id] = this;
        // This should allow the function to return so that listeners can be set up for these events
        Promise.resolve().then(function () {
            // FIXME: There is a race condition where cancel (or terminate) can be called synchronously after invite.
            if (_this.isCanceled || _this.status === Enums_1.SessionStatus.STATUS_TERMINATED) {
                return;
            }
            if (_this.inviteWithoutSdp) {
                // just send an invite with no sdp...
                if (_this.renderbody && _this.rendertype) {
                    _this.request.body = {
                        body: _this.renderbody,
                        contentType: _this.rendertype
                    };
                }
                _this.status = Enums_1.SessionStatus.STATUS_INVITE_SENT;
                _this.send();
            }
            else {
                // Initialize Media Session
                _this.sessionDescriptionHandler = _this.sessionDescriptionHandlerFactory(_this, _this.ua.configuration.sessionDescriptionHandlerFactoryOptions || {});
                _this.emit("SessionDescriptionHandler-created", _this.sessionDescriptionHandler);
                _this.sessionDescriptionHandler.getDescription(_this.sessionDescriptionHandlerOptions, _this.modifiers)
                    .then(function (description) {
                    // FIXME: There is a race condition where cancel (or terminate) can be called (a)synchronously after invite.
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
    InviteClientContext.prototype.cancel = function (options) {
        if (options === void 0) { options = {}; }
        // Check Session Status
        if (this.status === Enums_1.SessionStatus.STATUS_TERMINATED || this.status === Enums_1.SessionStatus.STATUS_CONFIRMED) {
            throw new Exceptions_1.Exceptions.InvalidStateError(this.status);
        }
        if (this.isCanceled) {
            throw new Exceptions_1.Exceptions.InvalidStateError(Enums_1.SessionStatus.STATUS_CANCELED);
        }
        this.isCanceled = true;
        this.logger.log("Canceling session");
        var cancelReason = Utils_1.Utils.getCancelReason(options.statusCode, options.reasonPhrase);
        options.extraHeaders = (options.extraHeaders || []).slice();
        if (this.outgoingInviteRequest) {
            this.logger.warn("Canceling session before it was created");
            this.outgoingInviteRequest.cancel(cancelReason, options);
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
    /**
     * 13.2.1 Creating the Initial INVITE
     *
     * Since the initial INVITE represents a request outside of a dialog,
     * its construction follows the procedures of Section 8.1.1.  Additional
     * processing is required for the specific case of INVITE.
     *
     * An Allow header field (Section 20.5) SHOULD be present in the INVITE.
     * It indicates what methods can be invoked within a dialog, on the UA
     * sending the INVITE, for the duration of the dialog.  For example, a
     * UA capable of receiving INFO requests within a dialog [34] SHOULD
     * include an Allow header field listing the INFO method.
     *
     * A Supported header field (Section 20.37) SHOULD be present in the
     * INVITE.  It enumerates all the extensions understood by the UAC.
     *
     * An Accept (Section 20.1) header field MAY be present in the INVITE.
     * It indicates which Content-Types are acceptable to the UA, in both
     * the response received by it, and in any subsequent requests sent to
     * it within dialogs established by the INVITE.  The Accept header field
     * is especially useful for indicating support of various session
     * description formats.
     *
     * The UAC MAY add an Expires header field (Section 20.19) to limit the
     * validity of the invitation.  If the time indicated in the Expires
     * header field is reached and no final answer for the INVITE has been
     * received, the UAC core SHOULD generate a CANCEL request for the
     * INVITE, as per Section 9.
     *
     * A UAC MAY also find it useful to add, among others, Subject (Section
     * 20.36), Organization (Section 20.25) and User-Agent (Section 20.41)
     * header fields.  They all contain information related to the INVITE.
     *
     * The UAC MAY choose to add a message body to the INVITE.  Section
     * 8.1.1.10 deals with how to construct the header fields -- Content-
     * Type among others -- needed to describe the message body.
     *
     * https://tools.ietf.org/html/rfc3261#section-13.2.1
     */
    InviteClientContext.prototype.sendInvite = function () {
        //    There are special rules for message bodies that contain a session
        //    description - their corresponding Content-Disposition is "session".
        //    SIP uses an offer/answer model where one UA sends a session
        //    description, called the offer, which contains a proposed description
        //    of the session.  The offer indicates the desired communications means
        //    (audio, video, games), parameters of those means (such as codec
        //    types) and addresses for receiving media from the answerer.  The
        //    other UA responds with another session description, called the
        //    answer, which indicates which communications means are accepted, the
        //    parameters that apply to those means, and addresses for receiving
        //    media from the offerer. An offer/answer exchange is within the
        //    context of a dialog, so that if a SIP INVITE results in multiple
        //    dialogs, each is a separate offer/answer exchange.  The offer/answer
        //    model defines restrictions on when offers and answers can be made
        //    (for example, you cannot make a new offer while one is in progress).
        //    This results in restrictions on where the offers and answers can
        //    appear in SIP messages.  In this specification, offers and answers
        //    can only appear in INVITE requests and responses, and ACK.  The usage
        //    of offers and answers is further restricted.  For the initial INVITE
        //    transaction, the rules are:
        //
        //       o  The initial offer MUST be in either an INVITE or, if not there,
        //          in the first reliable non-failure message from the UAS back to
        //          the UAC.  In this specification, that is the final 2xx
        //          response.
        //
        //       o  If the initial offer is in an INVITE, the answer MUST be in a
        //          reliable non-failure message from UAS back to UAC which is
        //          correlated to that INVITE.  For this specification, that is
        //          only the final 2xx response to that INVITE.  That same exact
        //          answer MAY also be placed in any provisional responses sent
        //          prior to the answer.  The UAC MUST treat the first session
        //          description it receives as the answer, and MUST ignore any
        //          session descriptions in subsequent responses to the initial
        //          INVITE.
        //
        //       o  If the initial offer is in the first reliable non-failure
        //          message from the UAS back to UAC, the answer MUST be in the
        //          acknowledgement for that message (in this specification, ACK
        //          for a 2xx response).
        //
        //       o  After having sent or received an answer to the first offer, the
        //          UAC MAY generate subsequent offers in requests based on rules
        //          specified for that method, but only if it has received answers
        //          to any previous offers, and has not sent any offers to which it
        //          hasn't gotten an answer.
        //
        //       o  Once the UAS has sent or received an answer to the initial
        //          offer, it MUST NOT generate subsequent offers in any responses
        //          to the initial INVITE.  This means that a UAS based on this
        //          specification alone can never generate subsequent offers until
        //          completion of the initial transaction.
        //
        // https://tools.ietf.org/html/rfc3261#section-13.2.1
        var _this = this;
        // 5 The Offer/Answer Model and PRACK
        //
        //    RFC 3261 describes guidelines for the sets of messages in which
        //    offers and answers [3] can appear.  Based on those guidelines, this
        //    extension provides additional opportunities for offer/answer
        //    exchanges.
        //    If the INVITE contained an offer, the UAS MAY generate an answer in a
        //    reliable provisional response (assuming these are supported by the
        //    UAC).  That results in the establishment of the session before
        //    completion of the call.  Similarly, if a reliable provisional
        //    response is the first reliable message sent back to the UAC, and the
        //    INVITE did not contain an offer, one MUST appear in that reliable
        //    provisional response.
        //    If the UAC receives a reliable provisional response with an offer
        //    (this would occur if the UAC sent an INVITE without an offer, in
        //    which case the first reliable provisional response will contain the
        //    offer), it MUST generate an answer in the PRACK.  If the UAC receives
        //    a reliable provisional response with an answer, it MAY generate an
        //    additional offer in the PRACK.  If the UAS receives a PRACK with an
        //    offer, it MUST place the answer in the 2xx to the PRACK.
        //    Once an answer has been sent or received, the UA SHOULD establish the
        //    session based on the parameters of the offer and answer, even if the
        //    original INVITE itself has not been responded to.
        //    If the UAS had placed a session description in any reliable
        //    provisional response that is unacknowledged when the INVITE is
        //    accepted, the UAS MUST delay sending the 2xx until the provisional
        //    response is acknowledged.  Otherwise, the reliability of the 1xx
        //    cannot be guaranteed, and reliability is needed for proper operation
        //    of the offer/answer exchange.
        //    All user agents that support this extension MUST support all
        //    offer/answer exchanges that are possible based on the rules in
        //    Section 13.2 of RFC 3261, based on the existence of INVITE and PRACK
        //    as requests, and 2xx and reliable 1xx as non-failure reliable
        //    responses.
        //
        // https://tools.ietf.org/html/rfc3262#section-5
        ////
        // The Offer/Answer Model Implementation
        //
        // The offer/answer model is straight forward, but one MUST READ the specifications...
        //
        // 13.2.1 Creating the Initial INVITE (paragraph 8 in particular)
        // https://tools.ietf.org/html/rfc3261#section-13.2.1
        //
        // 5 The Offer/Answer Model and PRACK
        // https://tools.ietf.org/html/rfc3262#section-5
        //
        // Session Initiation Protocol (SIP) Usage of the Offer/Answer Model
        // https://tools.ietf.org/html/rfc6337
        //
        // *** IMPORTANT IMPLEMENTATION CHOICES ***
        //
        // TLDR...
        //
        //  1) Only one offer/answer exchange permitted during initial INVITE.
        //  2) No "early media" if the initial offer is in an INVITE.
        //
        //
        // 1) Initial Offer/Answer Restriction.
        //
        // Our implementation replaces the following bullet point...
        //
        // o  After having sent or received an answer to the first offer, the
        //    UAC MAY generate subsequent offers in requests based on rules
        //    specified for that method, but only if it has received answers
        //    to any previous offers, and has not sent any offers to which it
        //    hasn't gotten an answer.
        // https://tools.ietf.org/html/rfc3261#section-13.2.1
        //
        // ...with...
        //
        // o  After having sent or received an answer to the first offer, the
        //    UAC MUST NOT generate subsequent offers in requests based on rules
        //    specified for that method.
        //
        // ...which in combination with this bullet point...
        //
        // o  Once the UAS has sent or received an answer to the initial
        //    offer, it MUST NOT generate subsequent offers in any responses
        //    to the initial INVITE.  This means that a UAS based on this
        //    specification alone can never generate subsequent offers until
        //    completion of the initial transaction.
        // https://tools.ietf.org/html/rfc3261#section-13.2.1
        //
        // ...ensures that EXACTLY ONE offer/answer exchange will occur
        // during an initial out of dialog INVITE request made by our UAC.
        //
        //
        // 2) Early Media Restriction.
        //
        // While our implementation adheres to the following bullet point...
        //
        // o  If the initial offer is in an INVITE, the answer MUST be in a
        //    reliable non-failure message from UAS back to UAC which is
        //    correlated to that INVITE.  For this specification, that is
        //    only the final 2xx response to that INVITE.  That same exact
        //    answer MAY also be placed in any provisional responses sent
        //    prior to the answer.  The UAC MUST treat the first session
        //    description it receives as the answer, and MUST ignore any
        //    session descriptions in subsequent responses to the initial
        //    INVITE.
        // https://tools.ietf.org/html/rfc3261#section-13.2.1
        //
        // We have made the following implementation decision with regard to early media...
        //
        // o  If the initial offer is in the INVITE, the answer from the
        //    UAS back to the UAC will establish a media session only
        //    only after the final 2xx response to that INVITE is received.
        //
        // The reason for this decision is rooted in a restriction currently
        // inherent in WebRTC. Specifically, while a SIP INVITE request with an
        // initial offer may fork resulting in more than one provisional answer,
        // there is currently no easy/good way to to "fork" an offer generated
        // by a peer connection. In particular, a WebRTC offer currently may only
        // be matched with one answer and we have no good way to know which
        // "provisional answer" is going to be the "final answer". So we have
        // decided to punt and not create any "early media" sessions in this case.
        //
        // The upshot is that if you want "early media", you must not put the
        // initial offer in the INVITE. Instead, force the UAS to provide the
        // initial offer by sending an INVITE without an offer. In the WebRTC
        // case this allows us to create a unique peer connection with a unique
        // answer for every provisional offer with "early media" on all of them.
        ////
        ////
        // ROADMAP: The Offer/Answer Model Implementation
        //
        // The "no early media if offer in INVITE" implementation is not a
        // welcome one. The masses want it. The want it and they want it
        // to work for WebRTC (so they want to have their cake and eat too).
        //
        // So while we currently cannot make the offer in INVITE+forking+webrtc
        // case work, we decided to do the following...
        //
        // 1) modify SDH Factory to provide an initial offer without giving us the SDH, and then...
        // 2) stick that offer in the initial INVITE, and when 183 with initial answer is received...
        // 3) ask SDH Factory if it supports "earlyRemoteAnswer"
        //   a) if true, ask SDH Factory to createSDH(localOffer).then((sdh) => sdh.setDescription(remoteAnswer)
        //   b) if false, defer getting a SDH until 2xx response is received
        //
        // Our supplied WebRTC SDH will default to behavior 3b which works in forking environment (without)
        // early media if initial offer is in the INVITE). We will, however, provide an "inviteWillNotFork"
        // option which if set to "true" will have our supplied WebRTC SDH behave in the 3a manner.
        // That will result in
        //  - early media working with initial offer in the INVITE, and...
        //  - if the INVITE forks, the session terminating with an ERROR that reads like
        //    "You set 'inviteWillNotFork' to true but the INVITE forked. You can't eat your cake, and have it too."
        //  - furthermore, we accept that users will report that error to us as "bug" regardless
        //
        // So, SDH Factory is going to end up with a new interface along the lines of...
        //
        // interface SessionDescriptionHandlerFactory {
        //   makeLocalOffer(): Promise<ContentTypeAndBody>;
        //   makeSessionDescriptionHandler(
        //     initialOffer: ContentTypeAndBody, offerType: "local" | "remote"
        //   ): Promise<SessionDescriptionHandler>;
        //   supportsEarlyRemoteAnswer: boolean;
        //   supportsContentType(contentType: string): boolean;
        //   getDescription(description: ContentTypeAndBody): Promise<ContentTypeAndBody>
        //   setDescription(description: ContentTypeAndBody): Promise<void>
        // }
        //
        // We should be able to get rid of all the hasOffer/hasAnswer tracking code and otherwise code
        // it up to the same interaction with the SDH Factory and SDH regardless of signaling scenario.
        ////
        // Send the INVITE request.
        this.outgoingInviteRequest = this.ua.userAgentCore.invite(this.request, {
            onAccept: function (inviteResponse) { return _this.onAccept(inviteResponse); },
            onProgress: function (inviteResponse) { return _this.onProgress(inviteResponse); },
            onRedirect: function (inviteResponse) { return _this.onRedirect(inviteResponse); },
            onReject: function (inviteResponse) { return _this.onReject(inviteResponse); },
            onTrying: function (inviteResponse) { return _this.onTrying(inviteResponse); }
        });
    };
    InviteClientContext.prototype.ackAndBye = function (inviteResponse, session, statusCode, reasonPhrase) {
        if (!this.ua.userAgentCore) {
            throw new Error("Method requires user agent core.");
        }
        var extraHeaders = [];
        if (statusCode) {
            extraHeaders.push("Reason: " + Utils_1.Utils.getReasonHeaderValue(statusCode, reasonPhrase));
        }
        var outgoingAckRequest = inviteResponse.ack();
        this.emit("ack", outgoingAckRequest.message);
        var outgoingByeRequest = session.bye(undefined, { extraHeaders: extraHeaders });
        this.emit("bye", outgoingByeRequest.message);
    };
    InviteClientContext.prototype.disposeEarlyMedia = function () {
        if (!this.earlyMediaSessionDescriptionHandlers) {
            throw new Error("Early media session description handlers undefined.");
        }
        this.earlyMediaSessionDescriptionHandlers.forEach(function (sessionDescriptionHandler) {
            sessionDescriptionHandler.close();
        });
    };
    /**
     * Handle final response to initial INVITE.
     * @param inviteResponse 2xx response.
     */
    InviteClientContext.prototype.onAccept = function (inviteResponse) {
        var _this = this;
        if (!this.earlyMediaSessionDescriptionHandlers) {
            throw new Error("Early media session description handlers undefined.");
        }
        var response = inviteResponse.message;
        var session = inviteResponse.session;
        // Our transaction layer is "non-standard" in that it will only
        // pass us a 2xx response once per branch, so there is no need to
        // worry about dealing with 2xx retransmissions. However, we can
        // and do still get 2xx responses for multiple branches (when an
        // INVITE is forked) which may create multiple confirmed dialogs.
        // Herein we are acking and sending a bye to any confirmed dialogs
        // which arrive beyond the first one. This is the desired behavior
        // for most applications (but certainly not all).
        // If we already received a confirmed dialog, ack & bye this session.
        if (this.session) {
            this.ackAndBye(inviteResponse, session);
            return;
        }
        // If the user requested cancellation, ack & bye this session.
        if (this.isCanceled) {
            this.ackAndBye(inviteResponse, session);
            this.emit("bye", this.request); // FIXME: Ported this odd second "bye" emit
            return;
        }
        // Ported behavior.
        if (response.hasHeader("P-Asserted-Identity")) {
            this.assertedIdentity = core_1.Grammar.nameAddrHeaderParse(response.getHeader("P-Asserted-Identity"));
        }
        // We have a confirmed dialog.
        this.session = session;
        this.session.delegate = {
            onAck: function (ackRequest) { return _this.onAck(ackRequest); },
            onBye: function (byeRequest) { return _this.receiveRequest(byeRequest); },
            onInfo: function (infoRequest) { return _this.receiveRequest(infoRequest); },
            onInvite: function (inviteRequest) { return _this.receiveRequest(inviteRequest); },
            onNotify: function (notifyRequest) { return _this.receiveRequest(notifyRequest); },
            onPrack: function (prackRequest) { return _this.receiveRequest(prackRequest); },
            onRefer: function (referRequest) { return _this.receiveRequest(referRequest); }
        };
        switch (session.signalingState) {
            case core_1.SignalingState.Initial:
                // INVITE without Offer, so MUST have Offer at this point, so invalid state.
                this.ackAndBye(inviteResponse, session, 400, "Missing session description");
                this.failed(response, Constants_1.C.causes.BAD_MEDIA_DESCRIPTION);
                break;
            case core_1.SignalingState.HaveLocalOffer:
                // INVITE with Offer, so MUST have Answer at this point, so invalid state.
                this.ackAndBye(inviteResponse, session, 400, "Missing session description");
                this.failed(response, Constants_1.C.causes.BAD_MEDIA_DESCRIPTION);
                break;
            case core_1.SignalingState.HaveRemoteOffer:
                // INVITE without Offer, received offer in 2xx, so MUST send Answer in ACK.
                var sdh_1 = this.sessionDescriptionHandlerFactory(this, this.ua.configuration.sessionDescriptionHandlerFactoryOptions || {});
                this.sessionDescriptionHandler = sdh_1;
                this.emit("SessionDescriptionHandler-created", this.sessionDescriptionHandler);
                if (!sdh_1.hasDescription(response.getHeader("Content-Type") || "")) {
                    this.ackAndBye(inviteResponse, session, 400, "Missing session description");
                    this.failed(response, Constants_1.C.causes.BAD_MEDIA_DESCRIPTION);
                    break;
                }
                this.hasOffer = true;
                sdh_1
                    .setDescription(response.body, this.sessionDescriptionHandlerOptions, this.modifiers)
                    .then(function () { return sdh_1.getDescription(_this.sessionDescriptionHandlerOptions, _this.modifiers); })
                    .then(function (description) {
                    if (_this.isCanceled || _this.status === Enums_1.SessionStatus.STATUS_TERMINATED) {
                        return;
                    }
                    _this.status = Enums_1.SessionStatus.STATUS_CONFIRMED;
                    _this.hasAnswer = true;
                    var body = {
                        contentDisposition: "session", contentType: description.contentType, content: description.body
                    };
                    var ackRequest = inviteResponse.ack({ body: body });
                    _this.emit("ack", ackRequest.message);
                    _this.accepted(response);
                })
                    .catch(function (e) {
                    if (e.type === Enums_1.TypeStrings.SessionDescriptionHandlerError) {
                        _this.logger.warn("invalid description");
                        _this.logger.warn(e.toString());
                        // TODO: This message is inconsistent
                        _this.ackAndBye(inviteResponse, session, 488, "Invalid session description");
                        _this.failed(response, Constants_1.C.causes.BAD_MEDIA_DESCRIPTION);
                    }
                    else {
                        throw e;
                    }
                });
                break;
            case core_1.SignalingState.Stable:
                // This session has completed an initial offer/answer exchange...
                var options_1;
                if (this.renderbody && this.rendertype) {
                    options_1 = { body: { contentDisposition: "render", contentType: this.rendertype, content: this.renderbody } };
                }
                // If INVITE with Offer and we have been waiting till now to apply the answer.
                if (this.hasOffer && !this.hasAnswer) {
                    if (!this.sessionDescriptionHandler) {
                        throw new Error("Session description handler undefined.");
                    }
                    var answer = session.answer;
                    if (!answer) {
                        throw new Error("Answer is undefined.");
                    }
                    this.sessionDescriptionHandler
                        .setDescription(answer.content, this.sessionDescriptionHandlerOptions, this.modifiers)
                        .then(function () {
                        _this.hasAnswer = true;
                        _this.status = Enums_1.SessionStatus.STATUS_CONFIRMED;
                        var ackRequest = inviteResponse.ack(options_1);
                        _this.emit("ack", ackRequest.message);
                        _this.accepted(response);
                    })
                        .catch(function (error) {
                        _this.logger.error(error);
                        _this.ackAndBye(inviteResponse, session, 488, "Not Acceptable Here");
                        _this.failed(response, Constants_1.C.causes.BAD_MEDIA_DESCRIPTION);
                        // FIME: DON'T EAT UNHANDLED ERRORS!
                    });
                }
                else {
                    // Otherwise INVITE with or without Offer and we have already completed the initial exchange.
                    this.sessionDescriptionHandler = this.earlyMediaSessionDescriptionHandlers.get(session.id);
                    if (!this.sessionDescriptionHandler) {
                        throw new Error("Session description handler undefined.");
                    }
                    this.earlyMediaSessionDescriptionHandlers.delete(session.id);
                    this.hasOffer = true;
                    this.hasAnswer = true;
                    this.status = Enums_1.SessionStatus.STATUS_CONFIRMED;
                    var ackRequest = inviteResponse.ack();
                    this.emit("ack", ackRequest.message);
                    this.accepted(response);
                }
                break;
            case core_1.SignalingState.Closed:
                // Dialog has terminated.
                break;
            default:
                throw new Error("Unknown session signaling state.");
        }
        this.disposeEarlyMedia();
    };
    /**
     * Handle provisional response to initial INVITE.
     * @param inviteResponse 1xx response.
     */
    InviteClientContext.prototype.onProgress = function (inviteResponse) {
        var _this = this;
        // Ported - User requested cancellation.
        if (this.isCanceled) {
            return;
        }
        if (!this.outgoingInviteRequest) {
            throw new Error("Outgoing INVITE request undefined.");
        }
        if (!this.earlyMediaSessionDescriptionHandlers) {
            throw new Error("Early media session description handlers undefined.");
        }
        var response = inviteResponse.message;
        var session = inviteResponse.session;
        // Ported - Set status.
        this.status = Enums_1.SessionStatus.STATUS_1XX_RECEIVED;
        // Ported - Set assertedIdentity.
        if (response.hasHeader("P-Asserted-Identity")) {
            this.assertedIdentity = core_1.Grammar.nameAddrHeaderParse(response.getHeader("P-Asserted-Identity"));
        }
        // The provisional response MUST establish a dialog if one is not yet created.
        // https://tools.ietf.org/html/rfc3262#section-4
        if (!session) {
            // A response with a to tag MUST create a session (should never get here).
            throw new Error("Session undefined.");
        }
        // If a provisional response is received for an initial request, and
        // that response contains a Require header field containing the option
        // tag 100rel, the response is to be sent reliably.  If the response is
        // a 100 (Trying) (as opposed to 101 to 199), this option tag MUST be
        // ignored, and the procedures below MUST NOT be used.
        // https://tools.ietf.org/html/rfc3262#section-4
        var requireHeader = response.getHeader("require");
        var rseqHeader = response.getHeader("rseq");
        var rseq = requireHeader && requireHeader.includes("100rel") && rseqHeader ? Number(rseqHeader) : undefined;
        var responseReliable = !!rseq;
        var extraHeaders = [];
        if (responseReliable) {
            extraHeaders.push("RAck: " + response.getHeader("rseq") + " " + response.getHeader("cseq"));
        }
        // INVITE without Offer and session still has no offer (and no answer).
        if (session.signalingState === core_1.SignalingState.Initial) {
            // Similarly, if a reliable provisional
            // response is the first reliable message sent back to the UAC, and the
            // INVITE did not contain an offer, one MUST appear in that reliable
            // provisional response.
            // https://tools.ietf.org/html/rfc3262#section-5
            if (responseReliable) {
                this.logger.warn("First reliable provisional response received MUST contain an offer when INVITE does not contain an offer.");
                // FIXME: Known popular UA's currently end up here...
                inviteResponse.prack({ extraHeaders: extraHeaders });
            }
            this.emit("progress", response);
            return;
        }
        // INVITE with Offer and session only has that initial local offer.
        if (session.signalingState === core_1.SignalingState.HaveLocalOffer) {
            if (responseReliable) {
                inviteResponse.prack({ extraHeaders: extraHeaders });
            }
            this.emit("progress", response);
            return;
        }
        // INVITE without Offer and received initial offer in provisional response
        if (session.signalingState === core_1.SignalingState.HaveRemoteOffer) {
            // The initial offer MUST be in either an INVITE or, if not there,
            // in the first reliable non-failure message from the UAS back to
            // the UAC.
            // https://tools.ietf.org/html/rfc3261#section-13.2.1
            // According to Section 13.2.1 of [RFC3261], 'The first reliable
            // non-failure message' must have an offer if there is no offer in the
            // INVITE request.  This means that the User Agent (UA) that receives
            // the INVITE request without an offer must include an offer in the
            // first reliable response with 100rel extension.  If no reliable
            // provisional response has been sent, the User Agent Server (UAS) must
            // include an offer when sending 2xx response.
            // https://tools.ietf.org/html/rfc6337#section-2.2
            if (!responseReliable) {
                this.logger.warn("Non-reliable provisional response MUST NOT contain an initial offer, discarding response.");
                return;
            }
            // If the initial offer is in the first reliable non-failure
            // message from the UAS back to UAC, the answer MUST be in the
            // acknowledgement for that message
            var sdh_2 = this.sessionDescriptionHandlerFactory(this, this.ua.configuration.sessionDescriptionHandlerFactoryOptions || {});
            this.emit("SessionDescriptionHandler-created", sdh_2);
            this.earlyMediaSessionDescriptionHandlers.set(session.id, sdh_2);
            sdh_2
                .setDescription(response.body, this.sessionDescriptionHandlerOptions, this.modifiers)
                .then(function () { return sdh_2.getDescription(_this.sessionDescriptionHandlerOptions, _this.modifiers); })
                .then(function (description) {
                var body = {
                    contentDisposition: "session", contentType: description.contentType, content: description.body
                };
                inviteResponse.prack({ extraHeaders: extraHeaders, body: body });
                _this.status = Enums_1.SessionStatus.STATUS_EARLY_MEDIA;
                _this.emit("progress", response);
            })
                .catch(function (error) {
                if (_this.status === Enums_1.SessionStatus.STATUS_TERMINATED) {
                    return;
                }
                _this.failed(undefined, Constants_1.C.causes.WEBRTC_ERROR);
                _this.terminated(undefined, Constants_1.C.causes.WEBRTC_ERROR);
            });
            return;
        }
        // This session has completed an initial offer/answer exchange, so...
        // - INVITE with SDP and this provisional response MAY be reliable
        // - INVITE without SDP and this provisional response MAY be reliable
        if (session.signalingState === core_1.SignalingState.Stable) {
            if (responseReliable) {
                inviteResponse.prack({ extraHeaders: extraHeaders });
            }
            // Note: As documented, no early media if offer was in INVITE, so nothing to be done.
            // FIXME: TODO: Add a flag/hack to allow early media in this case. There are people
            //              in non-forking environments (think straight to FreeSWITCH) who want
            //              early media on a 183. Not sure how to actually make it work, basically
            //              something like...
            if (0 /* flag */ && this.hasOffer && !this.hasAnswer && this.sessionDescriptionHandler) {
                this.hasAnswer = true;
                this.status = Enums_1.SessionStatus.STATUS_EARLY_MEDIA;
                this.sessionDescriptionHandler
                    .setDescription(response.body, this.sessionDescriptionHandlerOptions, this.modifiers)
                    .then(function () {
                    _this.status = Enums_1.SessionStatus.STATUS_EARLY_MEDIA;
                })
                    .catch(function (error) {
                    if (_this.status === Enums_1.SessionStatus.STATUS_TERMINATED) {
                        return;
                    }
                    _this.failed(undefined, Constants_1.C.causes.WEBRTC_ERROR);
                    _this.terminated(undefined, Constants_1.C.causes.WEBRTC_ERROR);
                });
            }
            this.emit("progress", response);
            return;
        }
    };
    /**
     * Handle final response to initial INVITE.
     * @param inviteResponse 3xx response.
     */
    InviteClientContext.prototype.onRedirect = function (inviteResponse) {
        this.disposeEarlyMedia();
        var response = inviteResponse.message;
        var statusCode = response.statusCode;
        var cause = Utils_1.Utils.sipErrorCause(statusCode || 0);
        this.rejected(response, cause);
        this.failed(response, cause);
        this.terminated(response, cause);
    };
    /**
     * Handle final response to initial INVITE.
     * @param inviteResponse 4xx, 5xx, or 6xx response.
     */
    InviteClientContext.prototype.onReject = function (inviteResponse) {
        this.disposeEarlyMedia();
        var response = inviteResponse.message;
        var statusCode = response.statusCode;
        var cause = Utils_1.Utils.sipErrorCause(statusCode || 0);
        this.rejected(response, cause);
        this.failed(response, cause);
        this.terminated(response, cause);
    };
    /**
     * Handle final response to initial INVITE.
     * @param inviteResponse 100 response.
     */
    InviteClientContext.prototype.onTrying = function (inviteResponse) {
        this.received100 = true;
        this.emit("progress", inviteResponse.message);
    };
    return InviteClientContext;
}(Session));
exports.InviteClientContext = InviteClientContext;
