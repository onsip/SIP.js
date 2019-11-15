"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var transactions_1 = require("../transactions");
var user_agent_server_1 = require("./user-agent-server");
/**
 * Re-INVITE UAS.
 * @remarks
 * 14 Modifying an Existing Session
 * https://tools.ietf.org/html/rfc3261#section-14
 * 14.2 UAS Behavior
 * https://tools.ietf.org/html/rfc3261#section-14.2
 * @public
 */
var ReInviteUserAgentServer = /** @class */ (function (_super) {
    tslib_1.__extends(ReInviteUserAgentServer, _super);
    function ReInviteUserAgentServer(dialog, message, delegate) {
        var _this = _super.call(this, transactions_1.InviteServerTransaction, dialog.userAgentCore, message, delegate) || this;
        dialog.reinviteUserAgentServer = _this;
        _this.dialog = dialog;
        return _this;
    }
    /**
     * Update the dialog signaling state on a 2xx response.
     * @param options - Options bucket.
     */
    ReInviteUserAgentServer.prototype.accept = function (options) {
        if (options === void 0) { options = { statusCode: 200 }; }
        // FIXME: The next two lines SHOULD go away, but I suppose it's technically harmless...
        // These are here because some versions of SIP.js prior to 0.13.8 set the route set
        // of all in dialog ACKs based on the Record-Route headers in the associated 2xx
        // response. While this worked for dialog forming 2xx responses, it was technically
        // broken for re-INVITE ACKS as it only worked if the UAS populated the Record-Route
        // headers in the re-INVITE 2xx response (which is not required and a waste of bandwidth
        // as the should be ignored if present in re-INVITE ACKS) and the UAS populated
        // the Record-Route headers with the correct values (would be weird not too, but...).
        // Anyway, for now the technically useless Record-Route headers are being added
        // to maintain "backwards compatibility" with the older broken versions of SIP.js.
        options.extraHeaders = options.extraHeaders || [];
        options.extraHeaders = options.extraHeaders.concat(this.dialog.routeSet.map(function (route) { return "Record-Route: " + route; }));
        // Send and return the response
        var response = _super.prototype.accept.call(this, options);
        var session = this.dialog;
        var result = tslib_1.__assign(tslib_1.__assign({}, response), { session: session });
        if (options.body) {
            // Update dialog signaling state with offer/answer in body
            this.dialog.signalingStateTransition(options.body);
        }
        // Update dialog
        this.dialog.reConfirm();
        return result;
    };
    /**
     * Update the dialog signaling state on a 1xx response.
     * @param options - Progress options bucket.
     */
    ReInviteUserAgentServer.prototype.progress = function (options) {
        if (options === void 0) { options = { statusCode: 180 }; }
        // Send and return the response
        var response = _super.prototype.progress.call(this, options);
        var session = this.dialog;
        var result = tslib_1.__assign(tslib_1.__assign({}, response), { session: session });
        // Update dialog signaling state
        if (options.body) {
            this.dialog.signalingStateTransition(options.body);
        }
        return result;
    };
    /**
     * TODO: Not Yet Supported
     * @param contacts - Contacts to redirect to.
     * @param options - Redirect options bucket.
     */
    ReInviteUserAgentServer.prototype.redirect = function (contacts, options) {
        if (options === void 0) { options = { statusCode: 302 }; }
        this.dialog.signalingStateRollback();
        this.dialog.reinviteUserAgentServer = undefined; // ACK will be handled by transaction
        throw new Error("Unimplemented.");
    };
    /**
     * 3.1 Background on Re-INVITE Handling by UASs
     * An error response to a re-INVITE has the following semantics.  As
     * specified in Section 12.2.2 of RFC 3261 [RFC3261], if a re-INVITE is
     * rejected, no state changes are performed.
     * https://tools.ietf.org/html/rfc6141#section-3.1
     * @param options - Reject options bucket.
     */
    ReInviteUserAgentServer.prototype.reject = function (options) {
        if (options === void 0) { options = { statusCode: 488 }; }
        this.dialog.signalingStateRollback();
        this.dialog.reinviteUserAgentServer = undefined; // ACK will be handled by transaction
        return _super.prototype.reject.call(this, options);
    };
    return ReInviteUserAgentServer;
}(user_agent_server_1.UserAgentServer));
exports.ReInviteUserAgentServer = ReInviteUserAgentServer;
