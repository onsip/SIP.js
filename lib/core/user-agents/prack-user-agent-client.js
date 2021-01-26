import { C } from "../messages";
import { NonInviteClientTransaction } from "../transactions";
import { UserAgentClient } from "./user-agent-client";
/**
 * PRACK UAC.
 * @public
 */
export class PrackUserAgentClient extends UserAgentClient {
    constructor(dialog, delegate, options) {
        const message = dialog.createOutgoingRequestMessage(C.PRACK, options);
        super(NonInviteClientTransaction, dialog.userAgentCore, message, delegate);
        dialog.signalingStateTransition(message);
    }
}
