import { Dialog } from "../dialogs";
import { IncomingRequestDelegate, IncomingRequestMessage, IncomingSubscribeRequest } from "../messages";
import { UserAgentServer } from "./user-agent-server";
export declare class ReSubscribeUserAgentServer extends UserAgentServer implements IncomingSubscribeRequest {
    constructor(dialog: Dialog, message: IncomingRequestMessage, delegate?: IncomingRequestDelegate);
}
