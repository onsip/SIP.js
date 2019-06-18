import { OutgoingRegisterRequest, OutgoingRequestDelegate, OutgoingRequestMessage } from "../messages";
import { UserAgentCore } from "../user-agent-core";
import { UserAgentClient } from "./user-agent-client";
export declare class RegisterUserAgentClient extends UserAgentClient implements OutgoingRegisterRequest {
    constructor(core: UserAgentCore, message: OutgoingRequestMessage, delegate?: OutgoingRequestDelegate);
}
