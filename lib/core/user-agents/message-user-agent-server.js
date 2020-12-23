import { NonInviteServerTransaction } from "../transactions";
import { UserAgentServer } from "./user-agent-server";
/**
 * MESSAGE UAS.
 * @public
 */
export class MessageUserAgentServer extends UserAgentServer {
    constructor(core, message, delegate) {
        super(NonInviteServerTransaction, core, message, delegate);
    }
}
