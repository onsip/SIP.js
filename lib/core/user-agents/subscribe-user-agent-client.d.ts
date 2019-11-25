import { IncomingResponseMessage, OutgoingRequestMessage, OutgoingSubscribeRequest, OutgoingSubscribeRequestDelegate } from "../messages";
import { UserAgentCore } from "../user-agent-core";
import { NotifyUserAgentServer } from "./notify-user-agent-server";
import { UserAgentClient } from "./user-agent-client";
/**
 * SUBSCRIBE UAC.
 * @remarks
 * 4.1.  Subscriber Behavior
 * https://tools.ietf.org/html/rfc6665#section-4.1
 *
 * User agent client for installation of a single subscription per SUBSCRIBE request.
 * TODO: Support for installation of multiple subscriptions on forked SUBSCRIBE reqeuests.
 * @public
 */
export declare class SubscribeUserAgentClient extends UserAgentClient implements OutgoingSubscribeRequest {
    delegate: OutgoingSubscribeRequestDelegate | undefined;
    /** Dialog created upon receiving the first NOTIFY. */
    private dialog;
    /** Identifier of this user agent client. */
    private subscriberId;
    /** When the subscription expires. Starts as requested expires and updated on 200 and NOTIFY. */
    private subscriptionExpires;
    /** The requested expires for the subscription. */
    private subscriptionExpiresRequested;
    /** Subscription event being targeted. */
    private subscriptionEvent;
    /** Subscription state. */
    private subscriptionState;
    /** Timer N Id. */
    private N;
    constructor(core: UserAgentCore, message: OutgoingRequestMessage, delegate?: OutgoingSubscribeRequestDelegate);
    /**
     * Destructor.
     * Note that Timer N may live on waiting for an initial NOTIFY and
     * the delegate may still receive that NOTIFY. If you don't want
     * that behavior then either clear the delegate so the delegate
     * doesn't get called (a 200 will be sent in response to the NOTIFY)
     * or call `waitNotifyStop` which will clear Timer N and remove this
     * UAC from the core (a 481 will be sent in response to the NOTIFY).
     */
    dispose(): void;
    /**
     * Handle out of dialog NOTIFY assoicated with SUBSCRIBE request.
     * This is the first NOTIFY received after the SUBSCRIBE request.
     * @param uas - User agent server handling the subscription creating NOTIFY.
     */
    onNotify(uas: NotifyUserAgentServer): void;
    waitNotifyStart(): void;
    waitNotifyStop(): void;
    /**
     * Receive a response from the transaction layer.
     * @param message - Incoming response message.
     */
    protected receiveResponse(message: IncomingResponseMessage): void;
    /**
     * To ensure that subscribers do not wait indefinitely for a
     * subscription to be established, a subscriber starts a Timer N, set to
     * 64*T1, when it sends a SUBSCRIBE request.  If this Timer N expires
     * prior to the receipt of a NOTIFY request, the subscriber considers
     * the subscription failed, and cleans up any state associated with the
     * subscription attempt.
     * https://tools.ietf.org/html/rfc6665#section-4.1.2.4
     */
    private timer_N;
}
//# sourceMappingURL=subscribe-user-agent-client.d.ts.map