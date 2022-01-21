"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var subscription_dialog_1 = require("../dialogs/subscription-dialog");
var subscription_1 = require("../subscription");
var timers_1 = require("../timers");
var transactions_1 = require("../transactions");
var user_agent_client_1 = require("./user-agent-client");
/**
 * 4.1.  Subscriber Behavior
 * https://tools.ietf.org/html/rfc6665#section-4.1
 *
 * User agent client for installation of a single subscription per SUBSCRIBE request.
 * TODO: Support for installation of multiple subscriptions on forked SUBSCRIBE reqeuests.
 */
var SubscribeUserAgentClient = /** @class */ (function (_super) {
    tslib_1.__extends(SubscribeUserAgentClient, _super);
    function SubscribeUserAgentClient(core, message, delegate) {
        var _this = this;
        // Get event from request message.
        var event = message.getHeader("Event");
        if (!event) {
            throw new Error("Event undefined");
        }
        // Get expires from reqeust message.
        var expires = message.getHeader("Expires");
        if (!expires) {
            throw new Error("Expires undefined");
        }
        _this = _super.call(this, transactions_1.NonInviteClientTransaction, core, message, delegate) || this;
        _this.delegate = delegate;
        // FIXME: Subscriber id should also be matching on event id.
        _this.subscriberId = message.callId + message.fromTag + event;
        _this.subscriptionExpiresRequested = _this.subscriptionExpires = Number(expires);
        _this.subscriptionEvent = event;
        _this.subscriptionState = subscription_1.SubscriptionState.NotifyWait;
        // Start waiting for a NOTIFY we can use to create a subscription.
        _this.waitNotifyStart();
        return _this;
    }
    /**
     * Destructor.
     * Note that Timer N may live on waiting for an initial NOTIFY and
     * the delegate may still receive that NOTIFY. If you don't want
     * that behavior then either clear the delegate so the delegate
     * doesn't get called (a 200 will be sent in response to the NOTIFY)
     * or call `waitNotifyStop` which will clear Timer N and remove this
     * UAC from the core (a 481 will be sent in response to the NOTIFY).
     */
    SubscribeUserAgentClient.prototype.dispose = function () {
        _super.prototype.dispose.call(this);
    };
    /**
     * Handle out of dialog NOTIFY assoicated with SUBSCRIBE request.
     * This is the first NOTIFY received after the SUBSCRIBE request.
     * @param uas User agent server handling the subscription creating NOTIFY.
     */
    SubscribeUserAgentClient.prototype.onNotify = function (uas) {
        // NOTIFY requests are matched to such SUBSCRIBE requests if they
        // contain the same "Call-ID", a "To" header field "tag" parameter that
        // matches the "From" header field "tag" parameter of the SUBSCRIBE
        // request, and the same "Event" header field.  Rules for comparisons of
        // the "Event" header fields are described in Section 8.2.1.
        // https://tools.ietf.org/html/rfc6665#section-4.4.1
        var event = uas.message.parseHeader("Event").event;
        if (!event || event !== this.subscriptionEvent) {
            this.logger.warn("Failed to parse event.");
            uas.reject({ statusCode: 489 });
            return;
        }
        // NOTIFY requests MUST contain "Subscription-State" header fields that
        // indicate the status of the subscription.
        // https://tools.ietf.org/html/rfc6665#section-4.1.3
        var subscriptionState = uas.message.parseHeader("Subscription-State");
        if (!subscriptionState || !subscriptionState.state) {
            this.logger.warn("Failed to parse subscription state.");
            uas.reject({ statusCode: 489 });
            return;
        }
        // Validate subscription state.
        var state = subscriptionState.state;
        switch (state) {
            case "pending":
                break;
            case "active":
                break;
            case "terminated":
                break;
            default:
                this.logger.warn("Invalid subscription state " + state);
                uas.reject({ statusCode: 489 });
                return;
        }
        // Dialogs usages are created upon completion of a NOTIFY transaction
        // for a new subscription, unless the NOTIFY request contains a
        // "Subscription-State" of "terminated."
        // https://tools.ietf.org/html/rfc6665#section-4.4.1
        if (state !== "terminated") {
            // The Contact header field MUST be present and contain exactly one SIP
            // or SIPS URI in any request that can result in the establishment of a
            // dialog.
            // https://tools.ietf.org/html/rfc3261#section-8.1.1.8
            var contact = uas.message.parseHeader("contact");
            if (!contact) {
                this.logger.warn("Failed to parse contact.");
                uas.reject({ statusCode: 489 });
                return;
            }
        }
        // In accordance with the rules for proxying non-INVITE requests as
        // defined in [RFC3261], successful SUBSCRIBE requests will receive only
        // one 200-class response; however, due to forking, the subscription may
        // have been accepted by multiple nodes.  The subscriber MUST therefore
        // be prepared to receive NOTIFY requests with "From:" tags that differ
        // from the "To:" tag received in the SUBSCRIBE 200-class response.
        //
        // If multiple NOTIFY requests are received in different dialogs in
        // response to a single SUBSCRIBE request, each dialog represents a
        // different destination to which the SUBSCRIBE request was forked.
        // Subscriber handling in such situations varies by event package; see
        // Section 5.4.9 for details.
        // https://tools.ietf.org/html/rfc6665#section-4.1.4
        // Each event package MUST specify whether forked SUBSCRIBE requests are
        // allowed to install multiple subscriptions.
        //
        // If such behavior is not allowed, the first potential dialog-
        // establishing message will create a dialog.  All subsequent NOTIFY
        // requests that correspond to the SUBSCRIBE request (i.e., have
        // matching "To", "From", "Call-ID", and "Event" header fields, as well
        // as "From" header field "tag" parameter and "Event" header field "id"
        // parameter) but that do not match the dialog would be rejected with a
        // 481 response.  Note that the 200-class response to the SUBSCRIBE
        // request can arrive after a matching NOTIFY request has been received;
        // such responses might not correlate to the same dialog established by
        // the NOTIFY request.  Except as required to complete the SUBSCRIBE
        // transaction, such non-matching 200-class responses are ignored.
        //
        // If installing of multiple subscriptions by way of a single forked
        // SUBSCRIBE request is allowed, the subscriber establishes a new dialog
        // towards each notifier by returning a 200-class response to each
        // NOTIFY request.  Each dialog is then handled as its own entity and is
        // refreshed independently of the other dialogs.
        //
        // In the case that multiple subscriptions are allowed, the event
        // package MUST specify whether merging of the notifications to form a
        // single state is required, and how such merging is to be performed.
        // Note that it is possible that some event packages may be defined in
        // such a way that each dialog is tied to a mutually exclusive state
        // that is unaffected by the other dialogs; this MUST be clearly stated
        // if it is the case.
        // https://tools.ietf.org/html/rfc6665#section-5.4.9
        // *** NOTE: This implementation is only for event packages which
        // do not allow forked requests to install muliple subscriptions.
        // As such and in accordance with the specificaiton, we stop waiting
        // and any future NOTIFY requests will be rejected with a 481.
        if (this.dialog) {
            throw new Error("Dialog already created. This implementation only supports install of single subscriptions.");
        }
        this.waitNotifyStop();
        // Update expires.
        this.subscriptionExpires =
            subscriptionState.expires ?
                Math.min(this.subscriptionExpires, Math.max(subscriptionState.expires, 0)) :
                this.subscriptionExpires;
        // Update subscriptoin state.
        switch (state) {
            case "pending":
                this.subscriptionState = subscription_1.SubscriptionState.Pending;
                break;
            case "active":
                this.subscriptionState = subscription_1.SubscriptionState.Active;
                break;
            case "terminated":
                this.subscriptionState = subscription_1.SubscriptionState.Terminated;
                break;
            default:
                throw new Error("Unrecognized state " + state + ".");
        }
        // Dialogs usages are created upon completion of a NOTIFY transaction
        // for a new subscription, unless the NOTIFY request contains a
        // "Subscription-State" of "terminated."
        // https://tools.ietf.org/html/rfc6665#section-4.4.1
        if (this.subscriptionState !== subscription_1.SubscriptionState.Terminated) {
            // Because the dialog usage is established by the NOTIFY request, the
            // route set at the subscriber is taken from the NOTIFY request itself,
            // as opposed to the route set present in the 200-class response to the
            // SUBSCRIBE request.
            // https://tools.ietf.org/html/rfc6665#section-4.4.1
            var dialogState = subscription_dialog_1.SubscriptionDialog.initialDialogStateForSubscription(this.message, uas.message);
            // Subscription Initiated! :)
            this.dialog = new subscription_dialog_1.SubscriptionDialog(this.subscriptionEvent, this.subscriptionExpires, this.subscriptionState, this.core, dialogState);
        }
        // Delegate.
        if (this.delegate && this.delegate.onNotify) {
            var request = uas;
            var subscription = this.dialog;
            this.delegate.onNotify({ request: request, subscription: subscription });
        }
        else {
            uas.accept();
        }
    };
    SubscribeUserAgentClient.prototype.waitNotifyStart = function () {
        var _this = this;
        if (!this.N) {
            // Add ourselves to the core's subscriber map.
            // This allows the core to route out of dialog NOTIFY messages to us.
            this.core.subscribers.set(this.subscriberId, this);
            this.N = setTimeout(function () { return _this.timer_N(); }, timers_1.Timers.TIMER_N);
        }
    };
    SubscribeUserAgentClient.prototype.waitNotifyStop = function () {
        if (this.N) {
            // Remove ourselves to the core's subscriber map.
            // Any future out of dialog NOTIFY messages will be rejected with a 481.
            this.core.subscribers.delete(this.subscriberId);
            clearTimeout(this.N);
            this.N = undefined;
        }
    };
    /**
     * Receive a response from the transaction layer.
     * @param message Incoming response message.
     */
    SubscribeUserAgentClient.prototype.receiveResponse = function (message) {
        if (!this.authenticationGuard(message)) {
            return;
        }
        if (message.statusCode && message.statusCode >= 200 && message.statusCode < 300) {
            //  The "Expires" header field in a 200-class response to SUBSCRIBE
            //  request indicates the actual duration for which the subscription will
            //  remain active (unless refreshed).  The received value might be
            //  smaller than the value indicated in the SUBSCRIBE request but cannot
            //  be larger; see Section 4.2.1 for details.
            // https://tools.ietf.org/html/rfc6665#section-4.1.2.1
            // The "Expires" values present in SUBSCRIBE 200-class responses behave
            // in the same way as they do in REGISTER responses: the server MAY
            // shorten the interval but MUST NOT lengthen it.
            //
            //    If the duration specified in a SUBSCRIBE request is unacceptably
            //    short, the notifier may be able to send a 423 response, as
            //    described earlier in this section.
            //
            // 200-class responses to SUBSCRIBE requests will not generally contain
            // any useful information beyond subscription duration; their primary
            // purpose is to serve as a reliability mechanism.  State information
            // will be communicated via a subsequent NOTIFY request from the
            // notifier.
            // https://tools.ietf.org/html/rfc6665#section-4.2.1.1
            var expires = message.getHeader("Expires");
            if (!expires) {
                this.logger.warn("Expires header missing in a 200-class response to SUBSCRIBE");
            }
            else {
                var subscriptionExpiresReceived = Number(expires);
                if (subscriptionExpiresReceived > this.subscriptionExpiresRequested) {
                    this.logger.warn("Expires header in a 200-class response to SUBSCRIBE with a higher value than the one in the request");
                }
                if (subscriptionExpiresReceived < this.subscriptionExpires) {
                    this.subscriptionExpires = subscriptionExpiresReceived;
                }
            }
            // If a NOTIFY arrived before 200-class response a dialog may have been created.
            // Updated the dialogs expiration only if this indicates earlier expiration.
            if (this.dialog) {
                if (this.dialog.subscriptionExpires > this.subscriptionExpires) {
                    this.dialog.subscriptionExpires = this.subscriptionExpires;
                }
            }
        }
        if (message.statusCode && message.statusCode >= 300 && message.statusCode < 700) {
            this.waitNotifyStop(); // No NOTIFY will be sent after a negative final response.
        }
        _super.prototype.receiveResponse.call(this, message);
    };
    /**
     * To ensure that subscribers do not wait indefinitely for a
     * subscription to be established, a subscriber starts a Timer N, set to
     * 64*T1, when it sends a SUBSCRIBE request.  If this Timer N expires
     * prior to the receipt of a NOTIFY request, the subscriber considers
     * the subscription failed, and cleans up any state associated with the
     * subscription attempt.
     * https://tools.ietf.org/html/rfc6665#section-4.1.2.4
     */
    SubscribeUserAgentClient.prototype.timer_N = function () {
        this.logger.warn("Timer N expired for SUBSCRIBE user agent client. Timed out waiting for NOTIFY.");
        this.waitNotifyStop();
        if (this.delegate && this.delegate.onNotifyTimeout) {
            this.delegate.onNotifyTimeout();
        }
    };
    return SubscribeUserAgentClient;
}(user_agent_client_1.UserAgentClient));
exports.SubscribeUserAgentClient = SubscribeUserAgentClient;
