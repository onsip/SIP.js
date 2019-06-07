import { SessionDialog } from "../dialogs";
import { OutgoingInfoRequest, OutgoingRequestDelegate, RequestOptions } from "../messages";
import { UserAgentClient } from "./user-agent-client";
export declare class InfoUserAgentClient extends UserAgentClient implements OutgoingInfoRequest {
    constructor(dialog: SessionDialog, delegate?: OutgoingRequestDelegate, options?: RequestOptions);
}
