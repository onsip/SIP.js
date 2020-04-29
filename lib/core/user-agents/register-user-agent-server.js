"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const transactions_1 = require("../transactions");
const user_agent_server_1 = require("./user-agent-server");
/**
 * REGISTER UAS.
 * @public
 */
class RegisterUserAgentServer extends user_agent_server_1.UserAgentServer {
    constructor(core, message, delegate) {
        super(transactions_1.NonInviteServerTransaction, core, message, delegate);
        this.core = core;
    }
}
exports.RegisterUserAgentServer = RegisterUserAgentServer;
