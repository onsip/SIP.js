"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var messages_1 = require("../messages");
var transactions_1 = require("../transactions");
var user_agent_client_1 = require("./user-agent-client");
/**
 * PRACK UAC.
 * @public
 */
var PrackUserAgentClient = /** @class */ (function (_super) {
    tslib_1.__extends(PrackUserAgentClient, _super);
    function PrackUserAgentClient(dialog, delegate, options) {
        var _this = this;
        var message = dialog.createOutgoingRequestMessage(messages_1.C.PRACK, options);
        _this = _super.call(this, transactions_1.NonInviteClientTransaction, dialog.userAgentCore, message, delegate) || this;
        dialog.signalingStateTransition(message);
        return _this;
    }
    return PrackUserAgentClient;
}(user_agent_client_1.UserAgentClient));
exports.PrackUserAgentClient = PrackUserAgentClient;
