import { C } from "../messages";
import { NonInviteClientTransaction } from "../transactions";
import { UserAgentClient } from "./user-agent-client";
/**
 * INFO UAC.
 * @public
 */
export class InfoUserAgentClient extends UserAgentClient {
    constructor(dialog, delegate, options) {
        const message = dialog.createOutgoingRequestMessage(C.INFO, options);
        super(NonInviteClientTransaction, dialog.userAgentCore, message, delegate);
    }
}
