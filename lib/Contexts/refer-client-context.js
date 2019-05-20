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
var Grammar_1 = require("../Grammar");
var ReferContext_1 = require("../ReferContext");
var ReferClientContext = /** @class */ (function (_super) {
    __extends(ReferClientContext, _super);
    /**
     * Sends an in dialog REFER and handles the implicit subscription
     * dialog usage created by a REFER. The REFER is sent within the session
     * managed by the supplied InviteClientContext or InviteServerContext.
     * @param ua UA
     * @param context The invite context within which REFER will be sent.
     * @param target Target of the REFER.
     * @param options Options bucket.
     */
    function ReferClientContext(ua, context, target, options) {
        if (options === void 0) { options = {}; }
        return _super.call(this, ua, context, target, options) || this;
    }
    // Override ClientContext
    ReferClientContext.prototype.onRequestTimeout = function () {
        throw new Error("Method not utilized by user agent core.");
    };
    // Override ClientContext
    ReferClientContext.prototype.onTransportError = function () {
        throw new Error("Method not utilized by user agent core.");
    };
    // Override ClientContext
    ReferClientContext.prototype.receiveResponse = function () {
        throw new Error("Method not utilized by user agent core.");
    };
    // Override ClientContext
    ReferClientContext.prototype.send = function () {
        throw new Error("Method not utilized by user agent core.");
    };
    ReferClientContext.prototype.initReferTo = function (target) {
        var stringOrURI;
        if (typeof target === "string") {
            // REFER without Replaces (Blind Transfer)
            var targetString = Grammar_1.Grammar.parse(target, "Refer_To");
            stringOrURI = targetString && targetString.uri ? targetString.uri : target;
            // Check target validity
            var targetUri = this.ua.normalizeTarget(target);
            if (!targetUri) {
                throw new TypeError("Invalid target: " + target);
            }
            stringOrURI = targetUri;
        }
        else {
            // REFER with Replaces (Attended Transfer)
            if (!target.session) {
                throw new Error("Session undefined.");
            }
            var displayName = target.remoteIdentity.friendlyName;
            var remoteTarget = target.session.remoteTarget.toString();
            var callId = target.session.callId;
            var remoteTag = target.session.remoteTag;
            var localTag = target.session.localTag;
            var replaces = encodeURIComponent(callId + ";to-tag=" + remoteTag + ";from-tag=" + localTag);
            stringOrURI = "\"" + displayName + "\" <" + remoteTarget + "?Replaces=" + replaces + ">";
        }
        return stringOrURI;
    };
    return ReferClientContext;
}(ReferContext_1.ReferClientContext));
exports.ReferClientContext = ReferClientContext;
