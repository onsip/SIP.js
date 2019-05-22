import { IncomingRequest as IncomingRequestMessage } from "../../SIPMessage";
import { SessionDialog } from "../dialogs";
import { IncomingInfoRequest, IncomingRequestDelegate } from "../messages";
import { UserAgentServer } from "./user-agent-server";
export declare class InfoUserAgentServer extends UserAgentServer implements IncomingInfoRequest {
    constructor(dialog: SessionDialog, message: IncomingRequestMessage, delegate?: IncomingRequestDelegate);
}