import { SessionDialog } from "../dialogs";
import { OutgoingPrackRequest, OutgoingRequestDelegate, RequestOptions } from "../messages";
import { UserAgentClient } from "./user-agent-client";
export declare class PrackUserAgentClient extends UserAgentClient implements OutgoingPrackRequest {
    constructor(dialog: SessionDialog, delegate?: OutgoingRequestDelegate, options?: RequestOptions);
}
