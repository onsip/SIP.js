import { C } from "../messages";
import { NonInviteClientTransaction } from "../transactions";
import { UserAgentClient } from "./user-agent-client";
/**
 * REFER UAC.
 * @public
 */
export class ReferUserAgentClient extends UserAgentClient {
    constructor(dialog, delegate, options) {
        const message = dialog.createOutgoingRequestMessage(C.REFER, options);
        super(NonInviteClientTransaction, dialog.userAgentCore, message, delegate);
    }
}
