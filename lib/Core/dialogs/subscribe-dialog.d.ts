import { IncomingRequest as IncomingRequestMessage } from "../../SIPMessage";
import { OutgoingSubscribeRequest, OutgoingSubscribeRequestDelegate, RequestOptions } from "../messages";
import { Subscription, SubscriptionDelegate, SubscriptionState } from "../subscription";
import { UserAgentCore } from "../user-agent-core";
import { Dialog } from "./dialog";
import { DialogState } from "./dialog-state";
/**
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
 */
export declare class SubscribeDialog extends Dialog implements Subscription {
    delegate: SubscriptionDelegate | undefined;
    private logger;
    constructor(core: UserAgentCore, state: DialogState, delegate?: SubscriptionDelegate);
    dispose(): void;
    readonly subscriptionState: SubscriptionState;
    receiveRequest(message: IncomingRequestMessage): void;
    subscribe(delegate?: OutgoingSubscribeRequestDelegate, options?: RequestOptions): OutgoingSubscribeRequest;
}
