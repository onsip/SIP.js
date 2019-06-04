import { SessionDialog } from "../dialogs";
import { OutgoingReferRequest, OutgoingRequestDelegate, RequestOptions } from "../messages";
import { UserAgentClient } from "./user-agent-client";
export declare class ReferUserAgentClient extends UserAgentClient implements OutgoingReferRequest {
    constructor(dialog: SessionDialog, delegate?: OutgoingRequestDelegate, options?: RequestOptions);
}
