"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const transactions_1 = require("../transactions");
const user_agent_client_1 = require("./user-agent-client");
/**
 * MESSAGE UAC.
 * @public
 */
class MessageUserAgentClient extends user_agent_client_1.UserAgentClient {
    constructor(core, message, delegate) {
        super(transactions_1.NonInviteClientTransaction, core, message, delegate);
    }
}
exports.MessageUserAgentClient = MessageUserAgentClient;
