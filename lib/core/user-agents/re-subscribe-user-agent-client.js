"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var messages_1 = require("../messages");
var transactions_1 = require("../transactions");
var user_agent_client_1 = require("./user-agent-client");
/**
 * Re-SUBSCRIBE UAC.
 * @public
 */
var ReSubscribeUserAgentClient = /** @class */ (function (_super) {
    tslib_1.__extends(ReSubscribeUserAgentClient, _super);
    function ReSubscribeUserAgentClient(dialog, delegate, options) {
        var _this = this;
        var message = dialog.createOutgoingRequestMessage(messages_1.C.SUBSCRIBE, options);
        _this = _super.call(this, transactions_1.NonInviteClientTransaction, dialog.userAgentCore, message, delegate) || this;
        _this.dialog = dialog;
        return _this;
    }
    ReSubscribeUserAgentClient.prototype.waitNotifyStop = function () {
        // TODO: Placeholder. Not utilized currently.
        return;
    };
    /**
     * Receive a response from the transaction layer.
     * @param message - Incoming response message.
     */
    ReSubscribeUserAgentClient.prototype.receiveResponse = function (message) {
        if (message.statusCode && message.statusCode >= 200 && message.statusCode < 300) {
            //  The "Expires" header field in a 200-class response to SUBSCRIBE
            //  request indicates the actual duration for which the subscription will
            //  remain active (unless refreshed).  The received value might be
            //  smaller than the value indicated in the SUBSCRIBE request but cannot
            //  be larger; see Section 4.2.1 for details.
            // https://tools.ietf.org/html/rfc6665#section-4.1.2.1
            var expires = message.getHeader("Expires");
            if (!expires) {
                this.logger.warn("Expires header missing in a 200-class response to SUBSCRIBE");
            }
            else {
                var subscriptionExpiresReceived = Number(expires);
                if (this.dialog.subscriptionExpires > subscriptionExpiresReceived) {
                    this.dialog.subscriptionExpires = subscriptionExpiresReceived;
                }
            }
        }
        if (message.statusCode && message.statusCode >= 400 && message.statusCode < 700) {
            // If a SUBSCRIBE request to refresh a subscription receives a 404, 405,
            // 410, 416, 480-485, 489, 501, or 604 response, the subscriber MUST
            // consider the subscription terminated.  (See [RFC5057] for further
            // details and notes about the effect of error codes on dialogs and
            // usages within dialog, such as subscriptions).  If the subscriber
            // wishes to re-subscribe to the state, he does so by composing an
            // unrelated initial SUBSCRIBE request with a freshly generated Call-ID
            // and a new, unique "From" tag (see Section 4.1.2.1).
            // https://tools.ietf.org/html/rfc6665#section-4.1.2.2
            var errorCodes = [404, 405, 410, 416, 480, 481, 482, 483, 484, 485, 489, 501, 604];
            if (errorCodes.indexOf(message.statusCode) !== -1) {
                this.dialog.terminate();
            }
            // If a SUBSCRIBE request to refresh a subscription fails with any error
            // code other than those listed above, the original subscription is
            // still considered valid for the duration of the most recently known
            // "Expires" value as negotiated by the most recent successful SUBSCRIBE
            // transaction, or as communicated by a NOTIFY request in its
            // "Subscription-State" header field "expires" parameter.
            // https://tools.ietf.org/html/rfc6665#section-4.1.2.2
        }
        _super.prototype.receiveResponse.call(this, message);
    };
    return ReSubscribeUserAgentClient;
}(user_agent_client_1.UserAgentClient));
exports.ReSubscribeUserAgentClient = ReSubscribeUserAgentClient;
