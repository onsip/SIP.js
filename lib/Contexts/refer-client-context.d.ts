import { ReferClientContext as ReferClientContextBase } from "../ReferContext";
import { InviteClientContext, InviteServerContext } from "../Session";
import { UA } from "../UA";
import { URI } from "../URI";
export declare class ReferClientContext extends ReferClientContextBase {
    /**
     * Sends an in dialog REFER and handles the implicit subscription
     * dialog usage created by a REFER. The REFER is sent within the session
     * managed by the supplied InviteClientContext or InviteServerContext.
     * @param ua UA
     * @param context The invite context within which REFER will be sent.
     * @param target Target of the REFER.
     * @param options Options bucket.
     */
    constructor(ua: UA, context: InviteClientContext | InviteServerContext, target: InviteClientContext | InviteServerContext | string, options?: any);
    onRequestTimeout(): void;
    onTransportError(): void;
    receiveResponse(): void;
    send(): this;
    protected initReferTo(target: InviteClientContext | InviteServerContext | string): string | URI;
}
