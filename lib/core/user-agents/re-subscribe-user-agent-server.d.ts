import { Dialog } from "../dialogs";
import { IncomingRequestDelegate, IncomingRequestMessage, IncomingSubscribeRequest } from "../messages";
import { UserAgentServer } from "./user-agent-server";
/**
 * Re-SUBSCRIBE UAS.
 * @public
 */
export declare class ReSubscribeUserAgentServer extends UserAgentServer implements IncomingSubscribeRequest {
    constructor(dialog: Dialog, message: IncomingRequestMessage, delegate?: IncomingRequestDelegate);
}
//# sourceMappingURL=re-subscribe-user-agent-server.d.ts.map