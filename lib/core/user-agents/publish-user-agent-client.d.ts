import { OutgoingPublishRequest, OutgoingRequestDelegate, OutgoingRequestMessage } from "../messages";
import { UserAgentCore } from "../user-agent-core";
import { UserAgentClient } from "./user-agent-client";
/**
 * PUBLISH UAC.
 * @public
 */
export declare class PublishUserAgentClient extends UserAgentClient implements OutgoingPublishRequest {
    constructor(core: UserAgentCore, message: OutgoingRequestMessage, delegate?: OutgoingRequestDelegate);
}
//# sourceMappingURL=publish-user-agent-client.d.ts.map