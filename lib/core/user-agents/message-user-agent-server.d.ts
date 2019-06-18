import { IncomingMessageRequest, IncomingRequestDelegate, IncomingRequestMessage } from "../messages";
import { UserAgentCore } from "../user-agent-core";
import { UserAgentServer } from "./user-agent-server";
export declare class MessageUserAgentServer extends UserAgentServer implements IncomingMessageRequest {
    protected core: UserAgentCore;
    constructor(core: UserAgentCore, message: IncomingRequestMessage, delegate?: IncomingRequestDelegate);
}
