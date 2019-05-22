import { OutgoingRequest as OutgoingRequestMessage } from "../../SIPMessage";
import { OutgoingMessageRequest, OutgoingRequestDelegate } from "../messages";
import { UserAgentCore } from "../user-agent-core";
import { UserAgentClient } from "./user-agent-client";
export declare class MessageUserAgentClient extends UserAgentClient implements OutgoingMessageRequest {
    constructor(core: UserAgentCore, message: OutgoingRequestMessage, delegate?: OutgoingRequestDelegate);
}
