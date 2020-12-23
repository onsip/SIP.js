import { NonInviteServerTransaction } from "../transactions";
import { UserAgentServer } from "./user-agent-server";
/**
 * PRACK UAS.
 * @public
 */
export class PrackUserAgentServer extends UserAgentServer {
    constructor(dialog, message, delegate) {
        super(NonInviteServerTransaction, dialog.userAgentCore, message, delegate);
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
