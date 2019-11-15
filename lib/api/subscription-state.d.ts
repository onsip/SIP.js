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
export declare enum SubscriptionState {
    Initial = "Initial",
    NotifyWait = "NotifyWait",
    Subscribed = "Subscribed",
    Terminated = "Terminated"
}
//# sourceMappingURL=subscription-state.d.ts.map