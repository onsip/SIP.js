import { IncomingRequestDelegate, IncomingRequestMessage, IncomingSubscribeRequest } from "../messages";
import { UserAgentCore } from "../user-agent-core";
import { UserAgentServer } from "./user-agent-server";
export declare class SubscribeUserAgentServer extends UserAgentServer implements IncomingSubscribeRequest {
    protected core: UserAgentCore;
    constructor(core: UserAgentCore, message: IncomingRequestMessage, delegate?: IncomingRequestDelegate);
}
