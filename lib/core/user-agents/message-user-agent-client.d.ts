import { OutgoingMessageRequest, OutgoingRequestDelegate, OutgoingRequestMessage } from "../messages";
import { UserAgentCore } from "../user-agent-core";
import { UserAgentClient } from "./user-agent-client";
/**
 * MESSAGE UAC.
 * @public
 */
export declare class MessageUserAgentClient extends UserAgentClient implements OutgoingMessageRequest {
    constructor(core: UserAgentCore, message: OutgoingRequestMessage, delegate?: OutgoingRequestDelegate);
}
//# sourceMappingURL=message-user-agent-client.d.ts.map