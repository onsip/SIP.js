import { OutgoingRequestDelegate, RequestOptions } from "../core";
import { Notification } from "./notification";
/**
 * Options for {@link Session.refer}.
 * @public
 */
export interface SessionReferOptions {
    /** Called upon receiving an incoming NOTIFY associated with a REFER. */
    onNotify?: (notification: Notification) => void;
    /** See `core` API. */
    requestDelegate?: OutgoingRequestDelegate;
    /** See `core` API. */
    requestOptions?: RequestOptions;
}
//# sourceMappingURL=session-refer-options.d.ts.map