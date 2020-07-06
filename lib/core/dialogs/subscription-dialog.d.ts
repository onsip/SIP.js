import { IncomingRequestMessage, OutgoingRequestMessage, OutgoingSubscribeRequest, OutgoingSubscribeRequestDelegate, RequestOptions } from "../messages";
import { Subscription, SubscriptionDelegate, SubscriptionState } from "../subscription";
import { UserAgentCore } from "../user-agent-core/user-agent-core";
import { Dialog } from "./dialog";
import { DialogState } from "./dialog-state";
/**
 * Subscription Dialog.
 * @remarks
 * SIP-Specific Event Notification
 *
 * Abstract
 *
 *    This document describes an extension to the Session Initiation
 *    Protocol (SIP) defined by RFC 3261.  The purpose of this extension is
 *    to provide an extensible framework by which SIP nodes can request
 *    notification from remote nodes indicating that certain events have
 *    occurred.
 *
 *    Note that the event notification mechanisms defined herein are NOT
 *    intended to be a general-purpose infrastructure for all classes of
 *    event subscription and notification.
 *
 *    This document represents a backwards-compatible improvement on the
 *    original mechanism described by RFC 3265, taking into account several
 *    years of implementation experience.  Accordingly, this document
 *    obsoletes RFC 3265.  This document also updates RFC 4660 slightly to
 *    accommodate some small changes to the mechanism that were discussed
 *    in that document.
 *
 *  https://tools.ietf.org/html/rfc6665
 * @public
 */
export declare class SubscriptionDialog extends Dialog implements Subscription {
    delegate: SubscriptionDelegate | undefined;
    private _autoRefresh;
    private _subscriptionEvent;
    private _subscriptionExpires;
    private _subscriptionExpiresInitial;
    private _subscriptionExpiresLastSet;
    private _subscriptionRefresh;
    private _subscriptionRefreshLastSet;
    private _subscriptionState;
    private logger;
    private N;
    private refreshTimer;
    constructor(subscriptionEvent: string, subscriptionExpires: number, subscriptionState: SubscriptionState, core: UserAgentCore, state: DialogState, delegate?: SubscriptionDelegate);
    /**
     * When a UAC receives a response that establishes a dialog, it
     * constructs the state of the dialog.  This state MUST be maintained
     * for the duration of the dialog.
     * https://tools.ietf.org/html/rfc3261#section-12.1.2
     * @param outgoingRequestMessage - Outgoing request message for dialog.
     * @param incomingResponseMessage - Incoming response message creating dialog.
     */
    static initialDialogStateForSubscription(outgoingSubscribeRequestMessage: OutgoingRequestMessage, incomingNotifyRequestMessage: IncomingRequestMessage): DialogState;
    dispose(): void;
    get autoRefresh(): boolean;
    set autoRefresh(autoRefresh: boolean);
    get subscriptionEvent(): string;
    /** Number of seconds until subscription expires. */
    get subscriptionExpires(): number;
    set subscriptionExpires(expires: number);
    get subscriptionExpiresInitial(): number;
    /** Number of seconds until subscription auto refresh. */
    get subscriptionRefresh(): number | undefined;
    get subscriptionState(): SubscriptionState;
    /**
     * Receive in dialog request message from transport.
     * @param message -  The incoming request message.
     */
    receiveRequest(message: IncomingRequestMessage): void;
    /**
     * 4.1.2.2.  Refreshing of Subscriptions
     * https://tools.ietf.org/html/rfc6665#section-4.1.2.2
     */
    refresh(): OutgoingSubscribeRequest;
    /**
     * 4.1.2.2.  Refreshing of Subscriptions
     * https://tools.ietf.org/html/rfc6665#section-4.1.2.2
     * @param delegate - Delegate to handle responses.
     * @param options - Options bucket.
     */
    subscribe(delegate?: OutgoingSubscribeRequestDelegate, options?: RequestOptions): OutgoingSubscribeRequest;
    /**
     * 4.4.1.  Dialog Creation and Termination
     * A subscription is destroyed after a notifier sends a NOTIFY request
     * with a "Subscription-State" of "terminated", or in certain error
     * situations described elsewhere in this document.
     * https://tools.ietf.org/html/rfc6665#section-4.4.1
     */
    terminate(): void;
    /**
     * 4.1.2.3.  Unsubscribing
     * https://tools.ietf.org/html/rfc6665#section-4.1.2.3
     */
    unsubscribe(): OutgoingSubscribeRequest;
    /**
     * Handle in dialog NOTIFY requests.
     * This does not include the first NOTIFY which created the dialog.
     * @param message - The incoming NOTIFY request message.
     */
    private onNotify;
    private onRefresh;
    private onTerminated;
    private refreshTimerClear;
    private refreshTimerSet;
    private stateTransition;
    /**
     * When refreshing a subscription, a subscriber starts Timer N, set to
     * 64*T1, when it sends the SUBSCRIBE request.  If this Timer N expires
     * prior to the receipt of a NOTIFY request, the subscriber considers
     * the subscription terminated.  If the subscriber receives a success
     * response to the SUBSCRIBE request that indicates that no NOTIFY
     * request will be generated -- such as the 204 response defined for use
     * with the optional extension described in [RFC5839] -- then it MUST
     * cancel Timer N.
     * https://tools.ietf.org/html/rfc6665#section-4.1.2.2
     */
    private timerN;
}
//# sourceMappingURL=subscription-dialog.d.ts.map