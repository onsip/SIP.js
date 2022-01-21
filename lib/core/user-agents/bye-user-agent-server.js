import { NonInviteServerTransaction } from "../transactions";
import { UserAgentServer } from "./user-agent-server";
/**
 * BYE UAS.
 * @public
 */
export class ByeUserAgentServer extends UserAgentServer {
    constructor(dialog, message, delegate) {
        super(NonInviteServerTransaction, dialog.userAgentCore, message, delegate);
    }
}
