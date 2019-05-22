import { SessionDialog } from "../dialogs";
import { OutgoingByeRequest, OutgoingRequestDelegate, RequestOptions } from "../messages";
import { UserAgentClient } from "./user-agent-client";
export declare class ByeUserAgentClient extends UserAgentClient implements OutgoingByeRequest {
    constructor(dialog: SessionDialog, delegate?: OutgoingRequestDelegate, options?: RequestOptions);
}
