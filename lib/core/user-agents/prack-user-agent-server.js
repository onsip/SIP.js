"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const transactions_1 = require("../transactions");
const user_agent_server_1 = require("./user-agent-server");
/**
 * PRACK UAS.
 * @public
 */
class PrackUserAgentServer extends user_agent_server_1.UserAgentServer {
    constructor(dialog, message, delegate) {
        super(transactions_1.NonInviteServerTransaction, dialog.userAgentCore, message, delegate);
        // Update dialog signaling state with offer/answer in body
        dialog.signalingStateTransition(message);
        this.dialog = dialog;
    }
    /**
     * Update the dialog signaling state on a 2xx response.
     * @param options - Options bucket.
     */
    accept(options = { statusCode: 200 }) {
        if (options.body) {
            // Update dialog signaling state with offer/answer in body
            this.dialog.signalingStateTransition(options.body);
        }
        return super.accept(options);
    }
}
exports.PrackUserAgentServer = PrackUserAgentServer;
