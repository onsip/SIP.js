"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * {@link Subscription} state.
 * @remarks
 * The {@link Subscription} behaves in a deterministic manner according to the following
 * Finite State Machine (FSM).
 * ```txt
 *                    _______________________________________
 * Subscription      |                                       v
 * Constructed -> Initial -> NotifyWait -> Subscribed -> Terminated
 *                              |____________________________^
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
