"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var transactions_1 = require("../transactions");
var user_agent_server_1 = require("./user-agent-server");
/**
 * MESSAGE UAS.
 * @public
 */
var MessageUserAgentServer = /** @class */ (function (_super) {
    tslib_1.__extends(MessageUserAgentServer, _super);
    function MessageUserAgentServer(core, message, delegate) {
        return _super.call(this, transactions_1.NonInviteServerTransaction, core, message, delegate) || this;
    }
    return MessageUserAgentServer;
}(user_agent_server_1.UserAgentServer));
exports.MessageUserAgentServer = MessageUserAgentServer;
