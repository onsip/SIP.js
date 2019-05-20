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
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var Exceptions_1 = require("../../Exceptions");
var dialogs_1 = require("../dialogs");
var session_1 = require("../session");
var transactions_1 = require("../transactions");
var allowed_methods_1 = require("../user-agent-core/allowed-methods");
var user_agent_server_1 = require("./user-agent-server");
/**
 * 13 Initiating a Session
 * https://tools.ietf.org/html/rfc3261#section-13
 * 13.1 Overview
 * https://tools.ietf.org/html/rfc3261#section-13.1
 * 13.3 UAS Processing
 * https://tools.ietf.org/html/rfc3261#section-13.3
 */
var InviteUserAgentServer = /** @class */ (function (_super) {
    __extends(InviteUserAgentServer, _super);
    function InviteUserAgentServer(core, message, delegate) {
        var _this = _super.call(this, transactions_1.InviteServerTransaction, core, message, delegate) || this;
        _this.core = core;
        return _this;
    }
    InviteUserAgentServer.prototype.dispose = function () {
        if (this.earlyDialog) {
            this.earlyDialog.dispose();
        }
        _super.prototype.dispose.call(this);
    };
    /**
     * 13.3.1.4 The INVITE is Accepted
     * The UAS core generates a 2xx response.  This response establishes a
     * dialog, and therefore follows the procedures of Section 12.1.1 in
     * addition to those of Section 8.2.6.
     * https://tools.ietf.org/html/rfc3261#section-13.3.1.4
     * @param options Accept options bucket.
     */
    InviteUserAgentServer.prototype.accept = function (options) {
        if (options === void 0) { options = { statusCode: 200 }; }
        if (!this.acceptable) {
            throw new Exceptions_1.Exceptions.TransactionStateError(this.message.method + " not acceptable in state " + this.transaction.state + ".");
        }
        // This response establishes a dialog...
        // https://tools.ietf.org/html/rfc3261#section-13.3.1.4
        if (!this.confirmedDialog) {
            if (this.earlyDialog) {
                this.earlyDialog.confirm();
                this.confirmedDialog = this.earlyDialog;
                this.earlyDialog = undefined;
            }
            else {
                var transaction = this.transaction;
                if (!(transaction instanceof transactions_1.InviteServerTransaction)) {
                    throw new Error("Transaction not instance of InviteClientTransaction.");
                }
                var state = dialogs_1.Dialog.initialDialogStateForUserAgentServer(this.message, this.toTag);
                this.confirmedDialog = new dialogs_1.SessionDialog(transaction, this.core, state);
            }
        }
        // When a UAS responds to a request with a response that establishes a
        // dialog (such as a 2xx to INVITE), the UAS MUST copy all Record-Route
        // header field values from the request into the response (including the
        // URIs, URI parameters, and any Record-Route header field parameters,
        // whether they are known or unknown to the UAS) and MUST maintain the
        // order of those values.  The UAS MUST add a Contact header field to
        // the response.  The Contact header field contains an address where the
        // UAS would like to be contacted for subsequent requests in the dialog
        // (which includes the ACK for a 2xx response in the case of an INVITE).
        // Generally, the host portion of this URI is the IP address or FQDN of
        // the host.  The URI provided in the Contact header field MUST be a SIP
        // or SIPS URI.  If the request that initiated the dialog contained a
        // SIPS URI in the Request-URI or in the top Record-Route header field
        // value, if there was any, or the Contact header field if there was no
        // Record-Route header field, the Contact header field in the response
        // MUST be a SIPS URI.  The URI SHOULD have global scope (that is, the
        // same URI can be used in messages outside this dialog).  The same way,
        // the scope of the URI in the Contact header field of the INVITE is not
        // limited to this dialog either.  It can therefore be used in messages
        // to the UAC even outside this dialog.
        // https://tools.ietf.org/html/rfc3261#section-12.1.1
        var recordRouteHeader = this.message
            .getHeaders("record-route")
            .map(function (header) { return "Record-Route: " + header; });
        var contactHeader = "Contact: " + this.core.configuration.contact.toString();
        // A 2xx response to an INVITE SHOULD contain the Allow header field and
        // the Supported header field, and MAY contain the Accept header field.
        // Including these header fields allows the UAC to determine the
        // features and extensions supported by the UAS for the duration of the
        // call, without probing.
        // https://tools.ietf.org/html/rfc3261#section-13.3.1.4
        // FIXME: TODO: This should not be hard coded.
        var allowHeader = "Allow: " + allowed_methods_1.AllowedMethods.toString();
        // FIXME: TODO: Supported header (see reply())
        // FIXME: TODO: Accept header
        // If the INVITE request contained an offer, and the UAS had not yet
        // sent an answer, the 2xx MUST contain an answer.  If the INVITE did
        // not contain an offer, the 2xx MUST contain an offer if the UAS had
        // not yet sent an offer.
        // https://tools.ietf.org/html/rfc3261#section-13.3.1.4
        if (!options.body) {
            if (this.confirmedDialog.signalingState === session_1.SignalingState.Initial ||
                this.confirmedDialog.signalingState === session_1.SignalingState.HaveRemoteOffer) {
                throw new Error("Response must have a body.");
            }
        }
        // FIXME: TODO: Guard offer/answer
        options.statusCode = options.statusCode || 200;
        options.extraHeaders = options.extraHeaders || [];
        options.extraHeaders = options.extraHeaders.concat(recordRouteHeader);
        options.extraHeaders.push(allowHeader);
        options.extraHeaders.push(contactHeader);
        var response = _super.prototype.accept.call(this, options);
        var session = this.confirmedDialog;
        var result = __assign({}, response, { session: session });
        // Update dialog signaling state
        if (options.body) {
            this.confirmedDialog.signalingStateTransition(options.body);
        }
        return result;
    };
    /**
     * 13.3.1.1 Progress
     * If the UAS is not able to answer the invitation immediately, it can
     * choose to indicate some kind of progress to the UAC (for example, an
     * indication that a phone is ringing).  This is accomplished with a
     * provisional response between 101 and 199.  These provisional
     * responses establish early dialogs and therefore follow the procedures
     * of Section 12.1.1 in addition to those of Section 8.2.6.  A UAS MAY
     * send as many provisional responses as it likes.  Each of these MUST
     * indicate the same dialog ID.  However, these will not be delivered
     * reliably.
     *
     * If the UAS desires an extended period of time to answer the INVITE,
     * it will need to ask for an "extension" in order to prevent proxies
     * from canceling the transaction.  A proxy has the option of canceling
     * a transaction when there is a gap of 3 minutes between responses in a
     * transaction.  To prevent cancellation, the UAS MUST send a non-100
     * provisional response at every minute, to handle the possibility of
     * lost provisional responses.
     * https://tools.ietf.org/html/rfc3261#section-13.3.1.1
     * @param options Progress options bucket.
     */
    InviteUserAgentServer.prototype.progress = function (options) {
        if (options === void 0) { options = { statusCode: 180 }; }
        if (!this.progressable) {
            throw new Exceptions_1.Exceptions.TransactionStateError(this.message.method + " not progressable in state " + this.transaction.state + ".");
        }
        // This response establishes a dialog...
        // https://tools.ietf.org/html/rfc3261#section-13.3.1.4
        if (!this.earlyDialog) {
            var transaction = this.transaction;
            if (!(transaction instanceof transactions_1.InviteServerTransaction)) {
                throw new Error("Transaction not instance of InviteClientTransaction.");
            }
            var state = dialogs_1.Dialog.initialDialogStateForUserAgentServer(this.message, this.toTag, true);
            this.earlyDialog = new dialogs_1.SessionDialog(transaction, this.core, state);
        }
        // When a UAS responds to a request with a response that establishes a
        // dialog (such as a 2xx to INVITE), the UAS MUST copy all Record-Route
        // header field values from the request into the response (including the
        // URIs, URI parameters, and any Record-Route header field parameters,
        // whether they are known or unknown to the UAS) and MUST maintain the
        // order of those values.  The UAS MUST add a Contact header field to
        // the response.  The Contact header field contains an address where the
        // UAS would like to be contacted for subsequent requests in the dialog
        // (which includes the ACK for a 2xx response in the case of an INVITE).
        // Generally, the host portion of this URI is the IP address or FQDN of
        // the host.  The URI provided in the Contact header field MUST be a SIP
        // or SIPS URI.  If the request that initiated the dialog contained a
        // SIPS URI in the Request-URI or in the top Record-Route header field
        // value, if there was any, or the Contact header field if there was no
        // Record-Route header field, the Contact header field in the response
        // MUST be a SIPS URI.  The URI SHOULD have global scope (that is, the
        // same URI can be used in messages outside this dialog).  The same way,
        // the scope of the URI in the Contact header field of the INVITE is not
        // limited to this dialog either.  It can therefore be used in messages
        // to the UAC even outside this dialog.
        // https://tools.ietf.org/html/rfc3261#section-12.1.1
        var recordRouteHeader = this.message
            .getHeaders("record-route")
            .map(function (header) { return "Record-Route: " + header; });
        var contactHeader = "Contact: " + this.core.configuration.contact;
        options.extraHeaders = options.extraHeaders || [];
        options.extraHeaders = options.extraHeaders.concat(recordRouteHeader);
        options.extraHeaders.push(contactHeader);
        var response = _super.prototype.progress.call(this, options);
        var session = this.earlyDialog;
        var result = __assign({}, response, { session: session });
        // Update dialog signaling state
        if (options.body) {
            this.earlyDialog.signalingStateTransition(options.body);
        }
        return result;
    };
    /**
     * 13.3.1.2 The INVITE is Redirected
     * If the UAS decides to redirect the call, a 3xx response is sent.  A
     * 300 (Multiple Choices), 301 (Moved Permanently) or 302 (Moved
     * Temporarily) response SHOULD contain a Contact header field
     * containing one or more URIs of new addresses to be tried.  The
     * response is passed to the INVITE server transaction, which will deal
     * with its retransmissions.
     * https://tools.ietf.org/html/rfc3261#section-13.3.1.2
     * @param options Reject options bucket.
     */
    InviteUserAgentServer.prototype.redirect = function (contacts, options) {
        if (options === void 0) { options = { statusCode: 302 }; }
        return _super.prototype.redirect.call(this, contacts, options);
    };
    /**
     * 13.3.1.3 The INVITE is Rejected
     * A common scenario occurs when the callee is currently not willing or
     * able to take additional calls at this end system.  A 486 (Busy Here)
     * SHOULD be returned in such a scenario.
     * https://tools.ietf.org/html/rfc3261#section-13.3.1.3
     * @param options Reject options bucket.
     */
    InviteUserAgentServer.prototype.reject = function (options) {
        if (options === void 0) { options = { statusCode: 486 }; }
        return _super.prototype.reject.call(this, options);
    };
    return InviteUserAgentServer;
}(user_agent_server_1.UserAgentServer));
exports.InviteUserAgentServer = InviteUserAgentServer;
