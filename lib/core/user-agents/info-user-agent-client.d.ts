import { SessionDialog } from "../dialogs";
import { OutgoingInfoRequest, OutgoingRequestDelegate, RequestOptions } from "../messages";
import { UserAgentClient } from "./user-agent-client";
/**
 * INFO UAC.
 * @public
 */
export declare class InfoUserAgentClient extends UserAgentClient implements OutgoingInfoRequest {
    constructor(dialog: SessionDialog, delegate?: OutgoingRequestDelegate, options?: RequestOptions);
}
//# sourceMappingURL=info-user-agent-client.d.ts.map