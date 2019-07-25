"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var transactions_1 = require("../transactions");
var user_agent_server_1 = require("./user-agent-server");
/**
 * INFO UAS.
 * @public
 */
var InfoUserAgentServer = /** @class */ (function (_super) {
    tslib_1.__extends(InfoUserAgentServer, _super);
    function InfoUserAgentServer(dialog, message, delegate) {
        return _super.call(this, transactions_1.NonInviteServerTransaction, dialog.userAgentCore, message, delegate) || this;
    }
    return InfoUserAgentServer;
}(user_agent_server_1.UserAgentServer));
exports.InfoUserAgentServer = InfoUserAgentServer;
