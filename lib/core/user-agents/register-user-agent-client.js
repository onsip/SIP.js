import { NonInviteClientTransaction } from "../transactions";
import { UserAgentClient } from "./user-agent-client";
/**
 * REGISTER UAC.
 * @public
 */
export class RegisterUserAgentClient extends UserAgentClient {
    constructor(core, message, delegate) {
        super(NonInviteClientTransaction, core, message, delegate);
    }
}
