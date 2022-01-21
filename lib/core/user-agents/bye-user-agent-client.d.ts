import { SessionDialog } from "../dialogs";
import { OutgoingByeRequest, OutgoingRequestDelegate, RequestOptions } from "../messages";
import { UserAgentClient } from "./user-agent-client";
/**
 * BYE UAC.
 * @public
 */
export declare class ByeUserAgentClient extends UserAgentClient implements OutgoingByeRequest {
    constructor(dialog: SessionDialog, delegate?: OutgoingRequestDelegate, options?: RequestOptions);
}
//# sourceMappingURL=bye-user-agent-client.d.ts.map