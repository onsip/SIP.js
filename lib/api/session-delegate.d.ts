import { IncomingRequestMessage } from "../core";
import { Info } from "./info";
import { Notification } from "./notification";
import { Referral } from "./referral";
/**
 * Delegate for {@link Session}.
 * @public
 */
export interface SessionDelegate {
    /**
     * Called upon receiving an incoming in dialog INFO request.
     * @param info - The info.
     */
    onInfo?(info: Info): void;
    /**
     * Called upon receiving an incoming in dialog INVITE request.
     * @param invite - The invite.
     */
    onInvite?(request: IncomingRequestMessage, response: string, statusCode: number): void;
    /**
     * Called upon receiving an incoming in dialog NOTIFY request.
     *
     * @remarks
     * If a refer is in progress notifications are delivered to the referrers delegate.
     *
     * @param notification - The notification.
     */
    onNotify?(notification: Notification): void;
    /**
     * Called upon receiving an incoming in dialog REFER request.
     * @param referral - The referral.
     */
    onRefer?(referral: Referral): void;
}
//# sourceMappingURL=session-delegate.d.ts.map