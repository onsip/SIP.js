"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const messages_1 = require("../messages");
const transactions_1 = require("../transactions");
const user_agent_client_1 = require("./user-agent-client");
/**
 * REFER UAC.
 * @public
 */
class ReferUserAgentClient extends user_agent_client_1.UserAgentClient {
    constructor(dialog, delegate, options) {
        const message = dialog.createOutgoingRequestMessage(messages_1.C.REFER, options);
        super(transactions_1.NonInviteClientTransaction, dialog.userAgentCore, message, delegate);
    }
}
exports.ReferUserAgentClient = ReferUserAgentClient;
