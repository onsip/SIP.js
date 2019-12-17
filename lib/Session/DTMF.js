"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var events_1 = require("events");
var Constants_1 = require("../Constants");
var Enums_1 = require("../Enums");
var Exceptions_1 = require("../Exceptions");
var Utils_1 = require("../Utils");
var DTMFValidator_1 = require("./DTMFValidator");
/**
 * @class DTMF
 * @param {SIP.Session} session
 */
var DTMF = /** @class */ (function (_super) {
    tslib_1.__extends(DTMF, _super);
    function DTMF(session, tone, options) {
        if (options === void 0) { options = {}; }
        var _this = _super.call(this) || this;
        _this.C = {
            MIN_DURATION: 70,
            MAX_DURATION: 6000,
            DEFAULT_DURATION: 100,
            MIN_INTER_TONE_GAP: 50,
            DEFAULT_INTER_TONE_GAP: 500
        };
        _this.type = Enums_1.TypeStrings.DTMF;
        if (tone === undefined) {
            throw new TypeError("Not enough arguments");
        }
        _this.logger = session.ua.getLogger("sip.invitecontext.dtmf", session.id);
        _this.owner = session;
        var moreThanOneTone = false;
        // If tone is invalid, it will automatically generate an exception.
        // Otherwise, it will return the tone in the correct format.
        _this.tone = DTMFValidator_1.DTMFValidator.validate(tone, moreThanOneTone);
        var duration = options.duration;
        var interToneGap = options.interToneGap;
        // Check duration
        if (duration && !Utils_1.Utils.isDecimal(duration)) {
            throw new TypeError("Invalid tone duration: " + duration);
        }
        else if (!duration) {
            duration = _this.C.DEFAULT_DURATION;
        }
        else if (duration < _this.C.MIN_DURATION) {
            _this.logger.warn("'duration' value is lower than the minimum allowed, setting it to " +
                _this.C.MIN_DURATION + " milliseconds");
            duration = _this.C.MIN_DURATION;
        }
        else if (duration > _this.C.MAX_DURATION) {
            _this.logger.warn("'duration' value is greater than the maximum allowed, setting it to " +
                _this.C.MAX_DURATION + " milliseconds");
            duration = _this.C.MAX_DURATION;
        }
        else {
            duration = Math.abs(duration);
        }
        _this.duration = duration;
        // Check interToneGap
        if (interToneGap && !Utils_1.Utils.isDecimal(interToneGap)) {
            throw new TypeError("Invalid interToneGap: " + interToneGap);
        }
        else if (!interToneGap) {
            interToneGap = _this.C.DEFAULT_INTER_TONE_GAP;
        }
        else if (interToneGap < _this.C.MIN_INTER_TONE_GAP) {
            _this.logger.warn("'interToneGap' value is lower than the minimum allowed, setting it to " +
                _this.C.MIN_INTER_TONE_GAP + " milliseconds");
            interToneGap = _this.C.MIN_INTER_TONE_GAP;
        }
        else {
            interToneGap = Math.abs(interToneGap);
        }
        _this.interToneGap = interToneGap;
        return _this;
    }
    DTMF.prototype.send = function (options) {
        if (options === void 0) { options = {}; }
        // Check RTCSession Status
        if (this.owner.status !== Enums_1.SessionStatus.STATUS_CONFIRMED &&
            this.owner.status !== Enums_1.SessionStatus.STATUS_WAITING_FOR_ACK) {
            throw new Exceptions_1.Exceptions.InvalidStateError(this.owner.status);
        }
        // Get DTMF options
        var extraHeaders = options.extraHeaders ? options.extraHeaders.slice() : [];
        var body = {
            contentType: "application/dtmf-relay",
            body: "Signal= " + this.tone + "\r\nDuration= " + this.duration
        };
        if (this.owner.session) {
            var request = this.owner.session.info(undefined, {
                extraHeaders: extraHeaders,
                body: Utils_1.Utils.fromBodyObj(body)
            });
            this.owner.emit("dtmf", request.message, this);
            return;
        }
    };
    DTMF.prototype.init_incoming = function (request) {
        request.accept();
        if (!this.tone || !this.duration) {
            this.logger.warn("invalid INFO DTMF received, discarded");
        }
        else {
            this.owner.emit("dtmf", request.message, this);
        }
    };
    DTMF.prototype.receiveResponse = function (response) {
        var statusCode = response && response.statusCode ? response.statusCode : 0;
        switch (true) {
            case /^1[0-9]{2}$/.test(statusCode.toString()):
                // Ignore provisional responses.
                break;
            case /^2[0-9]{2}$/.test(statusCode.toString()):
                this.emit("succeeded", {
                    originator: "remote",
                    response: response
                });
                break;
            default:
                var cause = Utils_1.Utils.sipErrorCause(statusCode);
                this.emit("failed", response, cause);
                break;
        }
    };
    DTMF.prototype.onRequestTimeout = function () {
        this.emit("failed", undefined, Constants_1.C.causes.REQUEST_TIMEOUT);
        this.owner.onRequestTimeout();
    };
    DTMF.prototype.onTransportError = function () {
        this.emit("failed", undefined, Constants_1.C.causes.CONNECTION_ERROR);
        this.owner.onTransportError();
    };
    DTMF.prototype.onDialogError = function (response) {
        this.emit("failed", response, Constants_1.C.causes.DIALOG_ERROR);
        this.owner.onDialogError(response);
    };
    return DTMF;
}(events_1.EventEmitter));
exports.DTMF = DTMF;
