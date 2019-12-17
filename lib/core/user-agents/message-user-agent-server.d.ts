import { IncomingMessageRequest, IncomingRequestDelegate, IncomingRequestMessage } from "../messages";
import { UserAgentCore } from "../user-agent-core";
import { UserAgentServer } from "./user-agent-server";
/**
 * MESSAGE UAS.
 * @public
 */
export declare class MessageUserAgentServer extends UserAgentServer implements IncomingMessageRequest {
    protected core: UserAgentCore;
    constructor(core: UserAgentCore, message: IncomingRequestMessage, delegate?: IncomingRequestDelegate);
}
//# sourceMappingURL=message-user-agent-server.d.ts.map