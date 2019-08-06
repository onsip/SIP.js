import { Notification } from "./notification";
/**
 * Delegate for {@link Subscription}.
 * @public
 */
export interface SubscriptionDelegate {
    /**
     * Called upon receiving an incoming in dialog NOTIFY request.
     * @param notification - A notification. See {@link Notification} for details.
     */
    onNotify(notification: Notification): void;
}
//# sourceMappingURL=subscription-delegate.d.ts.map