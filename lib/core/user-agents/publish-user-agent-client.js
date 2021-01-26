import { NonInviteClientTransaction } from "../transactions";
import { UserAgentClient } from "./user-agent-client";
/**
 * PUBLISH UAC.
 * @public
 */
export class PublishUserAgentClient extends UserAgentClient {
    constructor(core, message, delegate) {
        super(NonInviteClientTransaction, core, message, delegate);
    }
}
