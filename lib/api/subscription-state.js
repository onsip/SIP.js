"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * {@link Subscription} state.
 * @remarks
 * Valid state transitions:
 * ```
 * 1. "initial" --> "notify-wait" --> "subscribed" --> "terminated"
 * 2. "initial" --> "notify-wait" --> "terminated"
 * 3. "initial" --> "terminated"
 * ```
 * @public
 */
var SubscriptionState;
(function (SubscriptionState) {
    SubscriptionState["Initial"] = "Initial";
    SubscriptionState["NotifyWait"] = "NotifyWait";
    SubscriptionState["Subscribed"] = "Subscribed";
    SubscriptionState["Terminated"] = "Terminated";
})(SubscriptionState = exports.SubscriptionState || (exports.SubscriptionState = {}));
