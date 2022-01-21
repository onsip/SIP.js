import { SessionDialog } from "../dialogs";
import { IncomingInfoRequest, IncomingRequestDelegate, IncomingRequestMessage } from "../messages";
import { UserAgentServer } from "./user-agent-server";
/**
 * INFO UAS.
 * @public
 */
export declare class InfoUserAgentServer extends UserAgentServer implements IncomingInfoRequest {
    constructor(dialog: SessionDialog, message: IncomingRequestMessage, delegate?: IncomingRequestDelegate);
}
//# sourceMappingURL=info-user-agent-server.d.ts.map