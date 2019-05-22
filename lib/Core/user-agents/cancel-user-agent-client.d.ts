import { OutgoingRequest as OutgoingRequestMessage } from "../../SIPMessage";
import { OutgoingCancelRequest, OutgoingRequestDelegate } from "../messages";
import { UserAgentCore } from "../user-agent-core";
import { UserAgentClient } from "./user-agent-client";
export declare class CancelUserAgentClient extends UserAgentClient implements OutgoingCancelRequest {
    constructor(core: UserAgentCore, message: OutgoingRequestMessage, delegate?: OutgoingRequestDelegate);
}
