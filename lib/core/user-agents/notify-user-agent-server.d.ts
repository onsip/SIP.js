import { Dialog } from "../dialogs";
import { IncomingNotifyRequest, IncomingRequestDelegate, IncomingRequestMessage } from "../messages";
import { UserAgentCore } from "../user-agent-core";
import { UserAgentServer } from "./user-agent-server";
/**
 * NOTIFY UAS.
 * @public
 */
export declare class NotifyUserAgentServer extends UserAgentServer implements IncomingNotifyRequest {
    /**
     * NOTIFY UAS constructor.
     * @param dialogOrCore - Dialog for in dialog NOTIFY, UserAgentCore for out of dialog NOTIFY (deprecated).
     * @param message - Incoming NOTIFY request message.
     */
    constructor(dialogOrCore: Dialog | UserAgentCore, message: IncomingRequestMessage, delegate?: IncomingRequestDelegate);
}
//# sourceMappingURL=notify-user-agent-server.d.ts.map