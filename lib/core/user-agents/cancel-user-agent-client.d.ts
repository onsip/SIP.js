import { OutgoingCancelRequest, OutgoingRequestDelegate, OutgoingRequestMessage } from "../messages";
import { UserAgentCore } from "../user-agent-core";
import { UserAgentClient } from "./user-agent-client";
/**
 * CANCEL UAC.
 * @public
 */
export declare class CancelUserAgentClient extends UserAgentClient implements OutgoingCancelRequest {
    constructor(core: UserAgentCore, message: OutgoingRequestMessage, delegate?: OutgoingRequestDelegate);
}
//# sourceMappingURL=cancel-user-agent-client.d.ts.map