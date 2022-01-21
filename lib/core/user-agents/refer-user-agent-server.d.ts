import { SessionDialog } from "../dialogs";
import { IncomingReferRequest, IncomingRequestDelegate, IncomingRequestMessage } from "../messages";
import { UserAgentCore } from "../user-agent-core";
import { UserAgentServer } from "./user-agent-server";
/**
 * REFER UAS.
 * @public
 */
export declare class ReferUserAgentServer extends UserAgentServer implements IncomingReferRequest {
    /**
     * REFER UAS constructor.
     * @param dialogOrCore - Dialog for in dialog REFER, UserAgentCore for out of dialog REFER.
     * @param message - Incoming REFER request message.
     */
    constructor(dialogOrCore: SessionDialog | UserAgentCore, message: IncomingRequestMessage, delegate?: IncomingRequestDelegate);
}
//# sourceMappingURL=refer-user-agent-server.d.ts.map