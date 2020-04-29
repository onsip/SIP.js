"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var messages_1 = require("../messages");
var transactions_1 = require("../transactions");
var user_agent_client_1 = require("./user-agent-client");
/**
 * Re-INVITE UAC.
 * @remarks
 * 14 Modifying an Existing Session
 * https://tools.ietf.org/html/rfc3261#section-14
 * 14.1 UAC Behavior
 * https://tools.ietf.org/html/rfc3261#section-14.1
 * @public
 */
var ReInviteUserAgentClient = /** @class */ (function (_super) {
    tslib_1.__extends(ReInviteUserAgentClient, _super);
    function ReInviteUserAgentClient(dialog, delegate, options) {
        var _this = this;
        var message = dialog.createOutgoingRequestMessage(messages_1.C.INVITE, options);
        _this = _super.call(this, transactions_1.InviteClientTransaction, dialog.userAgentCore, message, delegate) || this;
        _this.delegate = delegate;
        dialog.signalingStateTransition(message);
        // FIXME: TODO: next line obviously needs to be improved...
        dialog.reinviteUserAgentClient = _this; // let the dialog know re-invite request sent
        _this.dialog = dialog;
        return _this;
    }
    ReInviteUserAgentClient.prototype.receiveResponse = function (message) {
        var _this = this;
        if (!this.authenticationGuard(message, this.dialog)) {
            return;
        }
        var statusCode = message.statusCode ? message.statusCode.toString() : "";
        if (!statusCode) {
            throw new Error("Response status code undefined.");
        }
        switch (true) {
            case /^100$/.test(statusCode):
                if (this.delegate && this.delegate.onTrying) {
                    this.delegate.onTrying({ message: message });
                }
                break;
            case /^1[0-9]{2}$/.test(statusCode):
                if (this.delegate && this.delegate.onProgress) {
                    this.delegate.onProgress({
                        message: message,
                        session: this.dialog,
                        prack: function (options) {
                            throw new Error("Unimplemented.");
                        }
                    });
                }
                break;
            case /^2[0-9]{2}$/.test(statusCode):
                // Update dialog signaling state with offer/answer in body
                this.dialog.signalingStateTransition(message);
                if (this.delegate && this.delegate.onAccept) {
                    this.delegate.onAccept({
                        message: message,
                        session: this.dialog,
                        ack: function (options) {
                            var outgoingAckRequest = _this.dialog.ack(options);
                            return outgoingAckRequest;
                        }
                    });
                }
                break;
            case /^3[0-9]{2}$/.test(statusCode):
                this.dialog.signalingStateRollback();
                this.dialog.reinviteUserAgentClient = undefined; // ACK was handled by transaction
                if (this.delegate && this.delegate.onRedirect) {
                    this.delegate.onRedirect({ message: message });
                }
                break;
            case /^[4-6][0-9]{2}$/.test(statusCode):
                this.dialog.signalingStateRollback();
                this.dialog.reinviteUserAgentClient = undefined; // ACK was handled by transaction
                if (this.delegate && this.delegate.onReject) {
                    this.delegate.onReject({ message: message });
                }
                else {
                    // If a UA receives a non-2xx final response to a re-INVITE, the session
                    // parameters MUST remain unchanged, as if no re-INVITE had been issued.
                    // Note that, as stated in Section 12.2.1.2, if the non-2xx final
                    // response is a 481 (Call/Transaction Does Not Exist), or a 408
                    // (Request Timeout), or no response at all is received for the re-
                    // INVITE (that is, a timeout is returned by the INVITE client
                    // transaction), the UAC will terminate the dialog.
                    //
                    // If a UAC receives a 491 response to a re-INVITE, it SHOULD start a
                    // timer with a value T chosen as follows:
                    //
                    //    1. If the UAC is the owner of the Call-ID of the dialog ID
                    //       (meaning it generated the value), T has a randomly chosen value
                    //       between 2.1 and 4 seconds in units of 10 ms.
                    //
                    //    2. If the UAC is not the owner of the Call-ID of the dialog ID, T
                    //       has a randomly chosen value of between 0 and 2 seconds in units
                    //       of 10 ms.
                    //
                    // When the timer fires, the UAC SHOULD attempt the re-INVITE once more,
                    // if it still desires for that session modification to take place.  For
                    // example, if the call was already hung up with a BYE, the re-INVITE
                    // would not take place.
                    // https://tools.ietf.org/html/rfc3261#section-14.1
                    // FIXME: TODO: The above.
                }
                break;
            default:
                throw new Error("Invalid status code " + statusCode);
        }
    };
    return ReInviteUserAgentClient;
}(user_agent_client_1.UserAgentClient));
exports.ReInviteUserAgentClient = ReInviteUserAgentClient;
