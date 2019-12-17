import { SessionDialog } from "../dialogs";
import { OutgoingNotifyRequest, OutgoingRequestDelegate, RequestOptions } from "../messages";
import { UserAgentClient } from "./user-agent-client";
/**
 * NOTIFY UAS.
 * @public
 */
export declare class NotifyUserAgentClient extends UserAgentClient implements OutgoingNotifyRequest {
    constructor(dialog: SessionDialog, delegate?: OutgoingRequestDelegate, options?: RequestOptions);
}
//# sourceMappingURL=notify-user-agent-client.d.ts.map