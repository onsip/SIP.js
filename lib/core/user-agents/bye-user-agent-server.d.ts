import { SessionDialog } from "../dialogs";
import { IncomingByeRequest, IncomingRequestDelegate, IncomingRequestMessage } from "../messages";
import { UserAgentServer } from "./user-agent-server";
export declare class ByeUserAgentServer extends UserAgentServer implements IncomingByeRequest {
    constructor(dialog: SessionDialog, message: IncomingRequestMessage, delegate?: IncomingRequestDelegate);
}
