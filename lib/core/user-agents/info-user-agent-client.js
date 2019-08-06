"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var messages_1 = require("../messages");
var transactions_1 = require("../transactions");
var user_agent_client_1 = require("./user-agent-client");
/**
 * INFO UAC.
 * @public
 */
var InfoUserAgentClient = /** @class */ (function (_super) {
    tslib_1.__extends(InfoUserAgentClient, _super);
    function InfoUserAgentClient(dialog, delegate, options) {
        var _this = this;
        var message = dialog.createOutgoingRequestMessage(messages_1.C.INFO, options);
        _this = _super.call(this, transactions_1.NonInviteClientTransaction, dialog.userAgentCore, message, delegate) || this;
        return _this;
    }
    return InfoUserAgentClient;
}(user_agent_client_1.UserAgentClient));
exports.InfoUserAgentClient = InfoUserAgentClient;
