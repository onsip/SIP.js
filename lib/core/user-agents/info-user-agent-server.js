"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const transactions_1 = require("../transactions");
const user_agent_server_1 = require("./user-agent-server");
/**
 * INFO UAS.
 * @public
 */
class InfoUserAgentServer extends user_agent_server_1.UserAgentServer {
    constructor(dialog, message, delegate) {
        super(transactions_1.NonInviteServerTransaction, dialog.userAgentCore, message, delegate);
    }
}
exports.InfoUserAgentServer = InfoUserAgentServer;
