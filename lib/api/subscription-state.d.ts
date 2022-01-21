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
export declare enum SubscriptionState {
    Initial = "Initial",
    NotifyWait = "NotifyWait",
    Subscribed = "Subscribed",
    Terminated = "Terminated"
}
//# sourceMappingURL=subscription-state.d.ts.map