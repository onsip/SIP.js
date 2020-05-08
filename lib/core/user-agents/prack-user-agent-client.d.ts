import { SessionDialog } from "../dialogs";
import { OutgoingPrackRequest, OutgoingRequestDelegate, RequestOptions } from "../messages";
import { UserAgentClient } from "./user-agent-client";
/**
 * PRACK UAC.
 * @public
 */
export declare class PrackUserAgentClient extends UserAgentClient implements OutgoingPrackRequest {
    constructor(dialog: SessionDialog, delegate?: OutgoingRequestDelegate, options?: RequestOptions);
}
//# sourceMappingURL=prack-user-agent-client.d.ts.map