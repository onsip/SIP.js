"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var transactions_1 = require("../transactions");
var user_agent_server_1 = require("./user-agent-server");
/**
 * Re-SUBSCRIBE UAS.
 * @public
 */
var ReSubscribeUserAgentServer = /** @class */ (function (_super) {
    tslib_1.__extends(ReSubscribeUserAgentServer, _super);
    function ReSubscribeUserAgentServer(dialog, message, delegate) {
        return _super.call(this, transactions_1.NonInviteServerTransaction, dialog.userAgentCore, message, delegate) || this;
    }
    return ReSubscribeUserAgentServer;
}(user_agent_server_1.UserAgentServer));
exports.ReSubscribeUserAgentServer = ReSubscribeUserAgentServer;
