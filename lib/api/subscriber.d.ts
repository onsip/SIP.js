import { IncomingNotifyRequest, IncomingRequestMessage, IncomingResponse, IncomingResponseMessage, OutgoingSubscribeRequest, URI } from "../core";
import { SubscriberOptions } from "./subscriber-options";
import { SubscriberSubscribeOptions } from "./subscriber-subscribe-options";
import { Subscription } from "./subscription";
import { SubscriptionUnsubscribeOptions } from "./subscription-unsubscribe-options";
import { UserAgent } from "./user-agent";
/**
 * A subscriber establishes a {@link Subscription} (outgoing SUBSCRIBE).
 *
 * @remarks
 * This is (more or less) an implementation of a "subscriber" as
 * defined in RFC 6665 "SIP-Specific Event Notifications".
 * https://tools.ietf.org/html/rfc6665
 *
 * @example
 * ```ts
 * // Create a new subscriber.
 * const targetURI = new URI("sip", "alice", "example.com");
 * const eventType = "example-name"; // https://www.iana.org/assignments/sip-events/sip-events.xhtml
 * const subscriber = new Subscriber(userAgent, targetURI, eventType);
 *
 * // Add delegate to handle event notifications.
 * subscriber.delegate = {
 *   onNotify: (notification: Notification) => {
 *     // handle notification here
 *   }
 * };
 *
 * // Monitor subscription state changes.
 * subscriber.stateChange.on((newState: SubscriptionState) => {
 *   if (newState === SubscriptionState.Terminated) {
 *     // handle state change here
 *   }
 * });
 *
 * // Attempt to establish the subscription
 * subscriber.subscribe();
 *
 * // Sometime later when done with subscription
 * subscriber.unsubscribe();
 * ```
 *
 * @public
 */
export declare class Subscriber extends Subscription {
    private id;
    private body;
    private context;
    private event;
    private expires;
    private extraHeaders;
    private logger;
    private request;
    private retryAfterTimer;
    private targetURI;
    /**
     * Constructor.
     * @param userAgent - User agent. See {@link UserAgent} for details.
     * @param targetURI - The request URI identifying the subscribed event.
     * @param eventType - The event type identifying the subscribed event.
     * @param options - Options bucket. See {@link SubscriberOptions} for details.
     */
    constructor(userAgent: UserAgent, targetURI: URI, eventType: string, options?: SubscriberOptions);
    /**
     * Destructor.
     * @internal
     */
    dispose(): void;
    /**
     * Subscribe to event notifications.
     *
     * @remarks
     * Send an initial SUBSCRIBE request if no subscription as been established.
     * Sends a re-SUBSCRIBE request if the subscription is "active".
     */
    subscribe(options?: SubscriberSubscribeOptions): Promise<void>;
    /**
     * Unsubscribe.
     * @internal
     */
    unsubscribe(options?: SubscriptionUnsubscribeOptions): Promise<void>;
    /**
     * Alias for `unsubscribe`.
     * @deprecated Use `unsubscribe` instead.
     * @internal
     */
    close(): Promise<void>;
    /**
     * Sends a re-SUBSCRIBE request if the subscription is "active".
     * @deprecated Use `subscribe` instead.
     * @internal
     */
    refresh(): Promise<void>;
    /**
     * Registration of event listeners.
     *
     * @remarks
     * The following events are emitted...
     *  - "accepted" A 200-class final response to a SUBSCRIBE request was received.
     *  - "failed" A non-200-class final response to a SUBSCRIBE request was received.
     *  - "rejected" Emitted immediately after a "failed" event (yes, it's redundant).
     *  - "notify" A NOTIFY request was received.
     *  - SubscriptionState.Terminated The subscription is moving to or has moved to a terminated state.
     *
     * More than one SUBSCRIBE request may be sent, so "accepted", "failed" and "rejected"
     * may be emitted multiple times. However these event will NOT be emitted for SUBSCRIBE
     * requests with expires of zero (unsubscribe requests).
     *
     * Note that a "terminated" event does NOT indicate the subscription is in the "terminated"
     * state as described in RFC 6665. Instead, a SubscriptionState.Terminated event indicates that this class
     * is no longer usable and/or is in the process of becoming no longer usable.
     *
     * The order the events are emitted in is not deterministic. Some examples...
     *  - "accepted" may occur multiple times
     *  - "accepted" may follow "notify" and "notify" may follow "accepted"
     *  - SubscriptionState.Terminated may follow "accepted" and "accepted" may follow SubscriptionState.Terminated
     *  - SubscriptionState.Terminated may follow "notify" and "notify" may follow SubscriptionState.Terminated
     *
     * Hint: Experience suggests one workable approach to utilizing these events
     * is to make use of "notify" and SubscriptionState.Terminated only. That is, call `subscribe()`
     * and if a "notify" occurs then you have a subscription. If a SubscriptionState.Terminated
     * event occurs then either a new subscription failed to be established or an
     * established subscription has terminated or is in the process of terminating.
     * Note that "notify" events may follow a SubscriptionState.Terminated event, but experience
     * suggests it is reasonable to discontinue usage of this class after receipt
     * of a SubscriptionState.Terminated event. The other events are informational, but as they do not
     * arrive in a deterministic manner it is difficult to make use of them otherwise.
     *
     * @param name - Event name.
     * @param callback - Callback.
     * @internal
     */
    on(name: "accepted" | "failed" | "rejected", callback: (message: IncomingResponseMessage, cause: string) => void): this;
    /** @internal */
    on(name: "notify", callback: (notification: {
        request: IncomingRequestMessage;
    }) => void): this;
    /** @internal */
    on(name: "terminated", callback: () => void): this;
    /** @internal */
    emit(event: "accepted" | "failed" | "rejected", message: IncomingResponseMessage, cause: string): boolean;
    /** @internal */
    emit(event: "notify", notification: {
        request: IncomingRequestMessage;
    }): boolean;
    /** @internal */
    emit(event: "terminated"): boolean;
    /** @internal */
    protected onAccepted(response: IncomingResponse): void;
    /** @internal */
    protected onFailed(response?: IncomingResponse): void;
    /** @internal */
    protected onNotify(request: IncomingNotifyRequest): void;
    /** @internal */
    protected onRefresh(request: OutgoingSubscribeRequest): void;
    /** @internal */
    protected onTerminated(): void;
    private initContext;
}
//# sourceMappingURL=subscriber.d.ts.map