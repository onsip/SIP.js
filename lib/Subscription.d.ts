/// <reference types="node" />
import { EventEmitter } from "events";
import { ClientContext } from "./ClientContext";
import { IncomingNotifyRequest, IncomingRequestMessage, IncomingResponse, IncomingResponseMessage, Logger, NameAddrHeader, OutgoingRequestMessage, OutgoingSubscribeRequest, URI } from "./core";
import { TypeStrings } from "./Enums";
import { BodyObj } from "./session-description-handler";
import { UA } from "./UA";
interface SubscriptionOptions {
    expires?: number;
    extraHeaders?: Array<string>;
    body?: string;
    contentType?: string;
}
/**
 * While this class is named `Subscription`, it is closer to
 * an implementation of a "subscriber" as defined in RFC 6665
 * "SIP-Specific Event Notifications".
 * https://tools.ietf.org/html/rfc6665
 * @class Class creating a SIP Subscriber.
 */
export declare class Subscription extends EventEmitter implements ClientContext {
    type: TypeStrings;
    ua: UA;
    logger: Logger;
    data: any;
    method: string;
    body: BodyObj | undefined;
    localIdentity: NameAddrHeader;
    remoteIdentity: NameAddrHeader;
    request: OutgoingRequestMessage;
    onRequestTimeout: () => void;
    onTransportError: () => void;
    receiveResponse: () => void;
    send: () => this;
    private id;
    private context;
    private disposed;
    private event;
    private expires;
    private extraHeaders;
    private retryAfterTimer;
    private subscription;
    private uri;
    /**
     * Constructor.
     * @param ua User agent.
     * @param target Subscription target.
     * @param event Subscription event.
     * @param options Options bucket.
     */
    constructor(ua: UA, target: string | URI, event: string, options?: SubscriptionOptions);
    /**
     * Destructor.
     */
    dispose(): void;
    /**
     * Registration of event listeners.
     *
     * The following events are emitted...
     *  - "accepted" A 200-class final response to a SUBSCRIBE request was received.
     *  - "failed" A non-200-class final response to a SUBSCRIBE request was received.
     *  - "rejected" Emitted immediately after a "failed" event (yes, it's redundant).
     *  - "notify" A NOTIFY request was received.
     *  - "terminated" The subscription is moving to or has moved to a terminated state.
     *
     * More than one SUBSCRIBE request may be sent, so "accepted", "failed" and "rejected"
     * may be emitted multiple times. However these event will NOT be emitted for SUBSCRIBE
     * requests with expires of zero (unsubscribe requests).
     *
     * Note that a "terminated" event does NOT indicate the subscription is in the "terminated"
     * state as described in RFC 6665. Instead, a "terminated" event indicates that this class
     * is no longer usable and/or is in the process of becoming no longer usable.
     *
     * The order the events are emitted in is not deterministic. Some examples...
     *  - "accepted" may occur multiple times
     *  - "accepted" may follow "notify" and "notify" may follow "accepted"
     *  - "terminated" may follow "accepted" and "accepted" may follow "terminated"
     *  - "terminated" may follow "notify" and "notify" may follow "terminated"
     *
     * Hint: Experience suggests one workable approach to utilizing these events
     * is to make use of "notify" and "terminated" only. That is, call `subscribe()`
     * and if a "notify" occurs then you have a subscription. If a "terminated"
     * event occurs then either a new subscription failed to be established or an
     * established subscription has terminated or is in the process of terminating.
     * Note that "notify" events may follow a "terminated" event, but experience
     * suggests it is reasonable to discontinue usage of this class after receipt
     * of a "terminated" event. The other events are informational, but as they do not
     * arrive in a deterministic manner it is difficult to make use of them otherwise.
     *
     * @param name Event name.
     * @param callback Callback.
     */
    on(name: "accepted" | "failed" | "rejected", callback: (message: IncomingResponseMessage, cause: string) => void): this;
    on(name: "notify", callback: (notification: {
        request: IncomingRequestMessage;
    }) => void): this;
    on(name: "terminated", callback: () => void): this;
    emit(event: "accepted" | "failed" | "rejected", message: IncomingResponseMessage, cause: string): boolean;
    emit(event: "notify", notification: {
        request: IncomingRequestMessage;
    }): boolean;
    emit(event: "terminated"): boolean;
    /**
     * Gracefully terminate.
     */
    close(): void;
    /**
     * Send a re-SUBSCRIBE request if there is an "active" subscription.
     */
    refresh(): void;
    /**
     * Send an initial SUBSCRIBE request if no subscription.
     * Send a re-SUBSCRIBE request if there is an "active" subscription.
     */
    subscribe(): this;
    /**
     * Send a re-SUBSCRIBE request if there is a "pending" or "active" subscription.
     */
    unsubscribe(): void;
    protected onAccepted(response: IncomingResponse): void;
    protected onFailed(response?: IncomingResponse): void;
    protected onNotify(request: IncomingNotifyRequest): void;
    protected onRefresh(request: OutgoingSubscribeRequest): void;
    protected onTerminated(): void;
    private initContext;
}
export {};
//# sourceMappingURL=Subscription.d.ts.map