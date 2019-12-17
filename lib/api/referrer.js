"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("../core");
var session_state_1 = require("./session-state");
/**
 * A referrer sends a {@link Referral} (outgoing REFER).
 * @remarks
 * Sends an outgoing in dialog REFER request.
 * @public
 */
var Referrer = /** @class */ (function () {
    /**
     * Constructs a new instance of the `Referrer` class.
     * @param session - The session the REFER will be sent from. See {@link Session} for details.
     * @param referTo - The referral target. If a `Session`, a REFER w/Replaces is sent.
     * @param options - An options bucket. See {@link ReferrerOptions} for details.
     */
    function Referrer(session, referTo, options) {
        this.logger = session.userAgent.getLogger("sip.Referrer");
        this._session = session;
        this._referTo = referTo;
    }
    Object.defineProperty(Referrer.prototype, "session", {
        /** The referrer session. */
        get: function () {
            return this._session;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Sends the REFER request.
     * @param options - An options bucket.
     */
    Referrer.prototype.refer = function (options) {
        if (options === void 0) { options = {}; }
        // guard session state
        if (this.session.state !== session_state_1.SessionState.Established) {
            var message = "Referrer.refer() may only be called if established session.";
            this.logger.error(message);
            return Promise.reject(new Error("Invalid session state " + this.session.state));
        }
        var requestDelegate = options.requestDelegate;
        var requestOptions = options.requestOptions || {};
        var extraHeaders = this.extraHeaders(this.referToString(this._referTo));
        requestOptions.extraHeaders = requestOptions.extraHeaders || [];
        requestOptions.extraHeaders = requestOptions.extraHeaders.concat(extraHeaders);
        return this.session.refer(this, requestDelegate, requestOptions);
    };
    Referrer.prototype.extraHeaders = function (referTo) {
        var extraHeaders = [];
        extraHeaders.push("Referred-By: <" + this._session.userAgent.configuration.uri + ">");
        extraHeaders.push("Contact: " + this._session._contact);
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
        extraHeaders.push("Refer-To: " + referTo);
        return extraHeaders;
    };
    Referrer.prototype.referToString = function (target) {
        var referTo;
        if (target instanceof core_1.URI) {
            // REFER without Replaces (Blind Transfer)
            referTo = target.toString();
        }
        else {
            // REFER with Replaces (Attended Transfer)
            if (!target.dialog) {
                throw new Error("Dialog undefined.");
            }
            var displayName = target.remoteIdentity.friendlyName;
            var remoteTarget = target.dialog.remoteTarget.toString();
            var callId = target.dialog.callId;
            var remoteTag = target.dialog.remoteTag;
            var localTag = target.dialog.localTag;
            var replaces = encodeURIComponent(callId + ";to-tag=" + remoteTag + ";from-tag=" + localTag);
            referTo = "\"" + displayName + "\" <" + remoteTarget + "?Replaces=" + replaces + ">";
        }
        return referTo;
    };
    return Referrer;
}());
exports.Referrer = Referrer;
