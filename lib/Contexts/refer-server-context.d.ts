import { Session } from "../Core/session";
import { ReferServerContext as ReferServerContextBase } from "../ReferContext";
import { SessionDescriptionHandlerModifiers } from "../session-description-handler";
import { IncomingRequest as IncomingRequestMessage } from "../SIPMessage";
import { UA } from "../UA";
export declare class ReferServerContext extends ReferServerContextBase {
    private session?;
    /**
     * Receives an in dialog REFER and handles the implicit subscription
     * dialog usage created by a REFER. The REFER is received within the
     * session provided.
     * @param ua UA
     * @param context The invite context within which REFER will be sent.
     * @param target Target of the REFER.
     * @param options Options bucket.
     */
    constructor(ua: UA, message: IncomingRequestMessage, session?: Session | undefined);
    accept(options: ReferServerContextBase.AcceptOptions, modifiers?: SessionDescriptionHandlerModifiers): void;
    progress(): void;
    reject(options: ReferServerContextBase.RejectOptions): void;
    /**
     * Send an in dialog NOTIFY.
     * @param body Content of body.
     */
    sendNotify(body: string): void;
}
