"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Subscription state.
 * https://tools.ietf.org/html/rfc6665#section-4.1.2
 */
var SubscriptionState;
(function (SubscriptionState) {
    SubscriptionState["Initial"] = "Initial";
    SubscriptionState["NotifyWait"] = "NotifyWait";
    SubscriptionState["Pending"] = "Pending";
    SubscriptionState["Active"] = "Active";
    SubscriptionState["Terminated"] = "Terminated";
})(SubscriptionState = exports.SubscriptionState || (exports.SubscriptionState = {}));
