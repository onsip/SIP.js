import { OutgoingRequestDelegate } from "../core";
import { Notification } from "./notification";
/**
 * Delegate for {@link Referrer}.
 * @public
 */
export interface ReferrerDelegate extends OutgoingRequestDelegate {
    onNotify(notification: Notification): void;
}
//# sourceMappingURL=referrer-delegate.d.ts.map