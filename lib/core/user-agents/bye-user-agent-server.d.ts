import { SessionDialog } from "../dialogs";
import { IncomingByeRequest, IncomingRequestDelegate, IncomingRequestMessage } from "../messages";
import { UserAgentServer } from "./user-agent-server";
/**
 * BYE UAS.
 * @public
 */
export declare class ByeUserAgentServer extends UserAgentServer implements IncomingByeRequest {
    constructor(dialog: SessionDialog, message: IncomingRequestMessage, delegate?: IncomingRequestDelegate);
}
//# sourceMappingURL=bye-user-agent-server.d.ts.map