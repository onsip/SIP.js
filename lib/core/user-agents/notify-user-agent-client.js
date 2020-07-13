import { C } from "../messages";
import { NonInviteClientTransaction } from "../transactions";
import { UserAgentClient } from "./user-agent-client";
/**
 * NOTIFY UAS.
 * @public
 */
export class NotifyUserAgentClient extends UserAgentClient {
    constructor(dialog, delegate, options) {
        const message = dialog.createOutgoingRequestMessage(C.NOTIFY, options);
        super(NonInviteClientTransaction, dialog.userAgentCore, message, delegate);
    }
}
