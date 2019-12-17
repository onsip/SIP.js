"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var messages_1 = require("../messages");
var transactions_1 = require("../transactions");
var user_agent_client_1 = require("./user-agent-client");
/**
 * REFER UAC.
 * @public
 */
var ReferUserAgentClient = /** @class */ (function (_super) {
    tslib_1.__extends(ReferUserAgentClient, _super);
    function ReferUserAgentClient(dialog, delegate, options) {
        var _this = this;
        var message = dialog.createOutgoingRequestMessage(messages_1.C.REFER, options);
        _this = _super.call(this, transactions_1.NonInviteClientTransaction, dialog.userAgentCore, message, delegate) || this;
        return _this;
    }
    return ReferUserAgentClient;
}(user_agent_client_1.UserAgentClient));
exports.ReferUserAgentClient = ReferUserAgentClient;
