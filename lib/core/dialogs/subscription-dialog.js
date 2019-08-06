"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var messages_1 = require("../messages");
var subscription_1 = require("../subscription");
var timers_1 = require("../timers");
var allowed_methods_1 = require("../user-agent-core/allowed-methods");
var notify_user_agent_server_1 = require("../user-agents/notify-user-agent-server");
var re_subscribe_user_agent_client_1 = require("../user-agents/re-subscribe-user-agent-client");
var dialog_1 = require("./dialog");
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
var SubscriptionDialog = /** @class */ (function (_super) {
    tslib_1.__extends(SubscriptionDialog, _super);
    function SubscriptionDialog(subscriptionEvent, subscriptionExpires, subscriptionState, core, state, delegate) {
        var _this = _super.call(this, core, state) || this;
        _this.delegate = delegate;
        _this._autoRefresh = false;
        _this._subscriptionEvent = subscriptionEvent;
        _this._subscriptionExpires = subscriptionExpires;
        _this._subscriptionExpiresInitial = subscriptionExpires;
        _this._subscriptionExpiresLastSet = Math.floor(Date.now() / 1000);
        _this._subscriptionRefresh = undefined;
        _this._subscriptionRefreshLastSet = undefined;
        _this._subscriptionState = subscriptionState;
        _this.logger = core.loggerFactory.getLogger("sip.subscribe-dialog");
        _this.logger.log("SUBSCRIBE dialog " + _this.id + " constructed");
        return _this;
    }
    /**
     * When a UAC receives a response that establishes a dialog, it
     * constructs the state of the dialog.  This state MUST be maintained
     * for the duration of the dialog.
     * https://tools.ietf.org/html/rfc3261#section-12.1.2
     * @param outgoingRequestMessage - Outgoing request message for dialog.
     * @param incomingResponseMessage - Incoming response message creating dialog.
     */
    SubscriptionDialog.initialDialogStateForSubscription = function (outgoingSubscribeRequestMessage, incomingNotifyRequestMessage) {
        // If the request was sent over TLS, and the Request-URI contained a
        // SIPS URI, the "secure" flag is set to TRUE.
        // https://tools.ietf.org/html/rfc3261#section-12.1.2
        var secure = false; // FIXME: Currently no support for TLS.
        // The route set MUST be set to the list of URIs in the Record-Route
        // header field from the response, taken in reverse order and preserving
        // all URI parameters.  If no Record-Route header field is present in
        // the response, the route set MUST be set to the empty set.  This route
        // set, even if empty, overrides any pre-existing route set for future
        // requests in this dialog.  The remote target MUST be set to the URI
        // from the Contact header field of the response.
        // https://tools.ietf.org/html/rfc3261#section-12.1.2
        var routeSet = incomingNotifyRequestMessage.getHeaders("record-route");
        var contact = incomingNotifyRequestMessage.parseHeader("contact");
        if (!contact) { // TODO: Review to make sure this will never happen
            throw new Error("Contact undefined.");
        }
        if (!(contact instanceof messages_1.NameAddrHeader)) {
            throw new Error("Contact not instance of NameAddrHeader.");
        }
        var remoteTarget = contact.uri;
        // The local sequence number MUST be set to the value of the sequence
        // number in the CSeq header field of the request.  The remote sequence
        // number MUST be empty (it is established when the remote UA sends a
        // request within the dialog).  The call identifier component of the
        // dialog ID MUST be set to the value of the Call-ID in the request.
        // The local tag component of the dialog ID MUST be set to the tag in
        // the From field in the request, and the remote tag component of the
        // dialog ID MUST be set to the tag in the To field of the response.  A
        // UAC MUST be prepared to receive a response without a tag in the To
        // field, in which case the tag is considered to have a value of null.
        //
        //    This is to maintain backwards compatibility with RFC 2543, which
        //    did not mandate To tags.
        //
        // https://tools.ietf.org/html/rfc3261#section-12.1.2
        var localSequenceNumber = outgoingSubscribeRequestMessage.cseq;
        var remoteSequenceNumber = undefined;
        var callId = outgoingSubscribeRequestMessage.callId;
        var localTag = outgoingSubscribeRequestMessage.fromTag;
        var remoteTag = incomingNotifyRequestMessage.fromTag;
        if (!callId) { // TODO: Review to make sure this will never happen
            throw new Error("Call id undefined.");
        }
        if (!localTag) { // TODO: Review to make sure this will never happen
            throw new Error("From tag undefined.");
        }
        if (!remoteTag) { // TODO: Review to make sure this will never happen
            throw new Error("To tag undefined."); // FIXME: No backwards compatibility with RFC 2543
        }
        // The remote URI MUST be set to the URI in the To field, and the local
        // URI MUST be set to the URI in the From field.
        // https://tools.ietf.org/html/rfc3261#section-12.1.2
        if (!outgoingSubscribeRequestMessage.from) { // TODO: Review to make sure this will never happen
            throw new Error("From undefined.");
        }
        if (!outgoingSubscribeRequestMessage.to) { // TODO: Review to make sure this will never happen
            throw new Error("To undefined.");
        }
        var localURI = outgoingSubscribeRequestMessage.from.uri;
        var remoteURI = outgoingSubscribeRequestMessage.to.uri;
        // A dialog can also be in the "early" state, which occurs when it is
        // created with a provisional response, and then transition to the
        // "confirmed" state when a 2xx final response arrives.
        // https://tools.ietf.org/html/rfc3261#section-12
        var early = false;
        var dialogState = {
            id: callId + localTag + remoteTag,
            early: early,
            callId: callId,
            localTag: localTag,
            remoteTag: remoteTag,
            localSequenceNumber: localSequenceNumber,
            remoteSequenceNumber: remoteSequenceNumber,
            localURI: localURI,
            remoteURI: remoteURI,
            remoteTarget: remoteTarget,
            routeSet: routeSet,
            secure: secure
        };
        return dialogState;
    };
    SubscriptionDialog.prototype.dispose = function () {
        _super.prototype.dispose.call(this);
        if (this.N) {
            clearTimeout(this.N);
            this.N = undefined;
        }
        this.refreshTimerClear();
        this.logger.log("SUBSCRIBE dialog " + this.id + " destroyed");
    };
    Object.defineProperty(SubscriptionDialog.prototype, "autoRefresh", {
        get: function () {
            return this._autoRefresh;
        },
        set: function (autoRefresh) {
            this._autoRefresh = true;
            this.refreshTimerSet();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SubscriptionDialog.prototype, "subscriptionEvent", {
        get: function () {
            return this._subscriptionEvent;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SubscriptionDialog.prototype, "subscriptionExpires", {
        /** Number of seconds until subscription expires. */
        get: function () {
            var secondsSinceLastSet = Math.floor(Date.now() / 1000) - this._subscriptionExpiresLastSet;
            var secondsUntilExpires = this._subscriptionExpires - secondsSinceLastSet;
            return Math.max(secondsUntilExpires, 0);
        },
        set: function (expires) {
            if (expires < 0) {
                throw new Error("Expires must be greater than or equal to zero.");
            }
            this._subscriptionExpires = expires;
            this._subscriptionExpiresLastSet = Math.floor(Date.now() / 1000);
            if (this.autoRefresh) {
                var refresh = this.subscriptionRefresh;
                if (refresh === undefined || refresh >= expires) {
                    this.refreshTimerSet();
                }
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SubscriptionDialog.prototype, "subscriptionExpiresInitial", {
        get: function () {
            return this._subscriptionExpiresInitial;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SubscriptionDialog.prototype, "subscriptionRefresh", {
        /** Number of seconds until subscription auto refresh. */
        get: function () {
            if (this._subscriptionRefresh === undefined || this._subscriptionRefreshLastSet === undefined) {
                return undefined;
            }
            var secondsSinceLastSet = Math.floor(Date.now() / 1000) - this._subscriptionRefreshLastSet;
            var secondsUntilExpires = this._subscriptionRefresh - secondsSinceLastSet;
            return Math.max(secondsUntilExpires, 0);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SubscriptionDialog.prototype, "subscriptionState", {
        get: function () {
            return this._subscriptionState;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Receive in dialog request message from transport.
     * @param message -  The incoming request message.
     */
    SubscriptionDialog.prototype.receiveRequest = function (message) {
        this.logger.log("SUBSCRIBE dialog " + this.id + " received " + message.method + " request");
        // Request within a dialog out of sequence guard.
        // https://tools.ietf.org/html/rfc3261#section-12.2.2
        if (!this.sequenceGuard(message)) {
            this.logger.log("SUBSCRIBE dialog " + this.id + " rejected out of order " + message.method + " request.");
            return;
        }
        // Request within a dialog common processing.
        // https://tools.ietf.org/html/rfc3261#section-12.2.2
        _super.prototype.receiveRequest.call(this, message);
        // Switch on method and then delegate.
        switch (message.method) {
            case messages_1.C.NOTIFY:
                this.onNotify(message);
                break;
            default:
                this.logger.log("SUBSCRIBE dialog " + this.id + " received unimplemented " + message.method + " request");
                this.core.replyStateless(message, { statusCode: 501 });
                break;
        }
    };
    /**
     * 4.1.2.2.  Refreshing of Subscriptions
     * https://tools.ietf.org/html/rfc6665#section-4.1.2.2
     */
    SubscriptionDialog.prototype.refresh = function () {
        var allowHeader = "Allow: " + allowed_methods_1.AllowedMethods.toString();
        var options = {};
        options.extraHeaders = (options.extraHeaders || []).slice();
        options.extraHeaders.push(allowHeader);
        options.extraHeaders.push("Event: " + this.subscriptionEvent);
        options.extraHeaders.push("Expires: " + this.subscriptionExpiresInitial);
        options.extraHeaders.push("Contact: " + this.core.configuration.contact.toString());
        return this.subscribe(undefined, options);
    };
    /**
     * 4.1.2.2.  Refreshing of Subscriptions
     * https://tools.ietf.org/html/rfc6665#section-4.1.2.2
     * @param delegate - Delegate to handle responses.
     * @param options - Options bucket.
     */
    SubscriptionDialog.prototype.subscribe = function (delegate, options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        if (this.subscriptionState !== subscription_1.SubscriptionState.Pending && this.subscriptionState !== subscription_1.SubscriptionState.Active) {
            // FIXME: This needs to be a proper exception
            throw new Error("Invalid state " + this.subscriptionState + ". May only re-subscribe while in state \"pending\" or \"active\".");
        }
        this.logger.log("SUBSCRIBE dialog " + this.id + " sending SUBSCRIBE request");
        var uac = new re_subscribe_user_agent_client_1.ReSubscribeUserAgentClient(this, delegate, options);
        // When refreshing a subscription, a subscriber starts Timer N, set to
        // 64*T1, when it sends the SUBSCRIBE request.
        // https://tools.ietf.org/html/rfc6665#section-4.1.2.2
        this.N = setTimeout(function () { return _this.timer_N(); }, timers_1.Timers.TIMER_N);
        return uac;
    };
    /**
     * 4.4.1.  Dialog Creation and Termination
     * A subscription is destroyed after a notifier sends a NOTIFY request
     * with a "Subscription-State" of "terminated", or in certain error
     * situations described elsewhere in this document.
     * https://tools.ietf.org/html/rfc6665#section-4.4.1
     */
    SubscriptionDialog.prototype.terminate = function () {
        this.stateTransition(subscription_1.SubscriptionState.Terminated);
        this.onTerminated();
    };
    /**
     * 4.1.2.3.  Unsubscribing
     * https://tools.ietf.org/html/rfc6665#section-4.1.2.3
     */
    SubscriptionDialog.prototype.unsubscribe = function () {
        var allowHeader = "Allow: " + allowed_methods_1.AllowedMethods.toString();
        var options = {};
        options.extraHeaders = (options.extraHeaders || []).slice();
        options.extraHeaders.push(allowHeader);
        options.extraHeaders.push("Event: " + this.subscriptionEvent);
        options.extraHeaders.push("Expires: 0");
        options.extraHeaders.push("Contact: " + this.core.configuration.contact.toString());
        return this.subscribe(undefined, options);
    };
    /**
     * Handle in dialog NOTIFY requests.
     * This does not include the first NOTIFY which created the dialog.
     * @param message - The incoming NOTIFY request message.
     */
    SubscriptionDialog.prototype.onNotify = function (message) {
        // If, for some reason, the event package designated in the "Event"
        // header field of the NOTIFY request is not supported, the subscriber
        // will respond with a 489 (Bad Event) response.
        // https://tools.ietf.org/html/rfc6665#section-4.1.3
        var event = message.parseHeader("Event").event;
        if (!event || event !== this.subscriptionEvent) {
            this.core.replyStateless(message, { statusCode: 489 });
            return;
        }
        // In the state diagram, "Re-subscription times out" means that an
        // attempt to refresh or update the subscription using a new SUBSCRIBE
        // request does not result in a NOTIFY request before the corresponding
        // Timer N expires.
        // https://tools.ietf.org/html/rfc6665#section-4.1.2
        if (this.N) {
            clearTimeout(this.N);
            this.N = undefined;
        }
        // NOTIFY requests MUST contain "Subscription-State" header fields that
        // indicate the status of the subscription.
        // https://tools.ietf.org/html/rfc6665#section-4.1.3
        var subscriptionState = message.parseHeader("Subscription-State");
        if (!subscriptionState || !subscriptionState.state) {
            this.core.replyStateless(message, { statusCode: 489 });
            return;
        }
        var state = subscriptionState.state;
        var expires = subscriptionState.expires ? Math.max(subscriptionState.expires, 0) : undefined;
        // Update our state and expiration.
        switch (state) {
            case "pending":
                this.stateTransition(subscription_1.SubscriptionState.Pending, expires);
                break;
            case "active":
                this.stateTransition(subscription_1.SubscriptionState.Active, expires);
                break;
            case "terminated":
                this.stateTransition(subscription_1.SubscriptionState.Terminated, expires);
                break;
            default:
                this.logger.warn("Unrecognized subscription state.");
                break;
        }
        // Delegate remainder of NOTIFY handling.
        var uas = new notify_user_agent_server_1.NotifyUserAgentServer(this, message);
        if (this.delegate && this.delegate.onNotify) {
            this.delegate.onNotify(uas);
        }
        else {
            uas.accept();
        }
    };
    SubscriptionDialog.prototype.onRefresh = function (request) {
        if (this.delegate && this.delegate.onRefresh) {
            this.delegate.onRefresh(request);
        }
    };
    SubscriptionDialog.prototype.onTerminated = function () {
        if (this.delegate && this.delegate.onTerminated) {
            this.delegate.onTerminated();
        }
    };
    SubscriptionDialog.prototype.refreshTimerClear = function () {
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
            this.refreshTimer = undefined;
        }
    };
    SubscriptionDialog.prototype.refreshTimerSet = function () {
        var _this = this;
        this.refreshTimerClear();
        if (this.autoRefresh && this.subscriptionExpires > 0) {
            var refresh = this.subscriptionExpires * 900;
            this._subscriptionRefresh = Math.floor(refresh / 1000);
            this._subscriptionRefreshLastSet = Math.floor(Date.now() / 1000);
            this.refreshTimer = setTimeout(function () {
                _this.refreshTimer = undefined;
                _this._subscriptionRefresh = undefined;
                _this._subscriptionRefreshLastSet = undefined;
                _this.onRefresh(_this.refresh());
            }, refresh);
        }
    };
    SubscriptionDialog.prototype.stateTransition = function (newState, newExpires) {
        var _this = this;
        // Assert valid state transitions.
        var invalidStateTransition = function () {
            _this.logger.warn("Invalid subscription state transition from " + _this.subscriptionState + " to " + newState);
        };
        switch (newState) {
            case subscription_1.SubscriptionState.Initial:
                invalidStateTransition();
                return;
            case subscription_1.SubscriptionState.NotifyWait:
                invalidStateTransition();
                return;
            case subscription_1.SubscriptionState.Pending:
                if (this.subscriptionState !== subscription_1.SubscriptionState.NotifyWait &&
                    this.subscriptionState !== subscription_1.SubscriptionState.Pending) {
                    invalidStateTransition();
                    return;
                }
                break;
            case subscription_1.SubscriptionState.Active:
                if (this.subscriptionState !== subscription_1.SubscriptionState.NotifyWait &&
                    this.subscriptionState !== subscription_1.SubscriptionState.Pending &&
                    this.subscriptionState !== subscription_1.SubscriptionState.Active) {
                    invalidStateTransition();
                    return;
                }
                break;
            case subscription_1.SubscriptionState.Terminated:
                if (this.subscriptionState !== subscription_1.SubscriptionState.NotifyWait &&
                    this.subscriptionState !== subscription_1.SubscriptionState.Pending &&
                    this.subscriptionState !== subscription_1.SubscriptionState.Active) {
                    invalidStateTransition();
                    return;
                }
                break;
            default:
                invalidStateTransition();
                return;
        }
        // If the "Subscription-State" value is "pending", the subscription has
        // been received by the notifier, but there is insufficient policy
        // information to grant or deny the subscription yet.  If the header
        // field also contains an "expires" parameter, the subscriber SHOULD
        // take it as the authoritative subscription duration and adjust
        // accordingly.  No further action is necessary on the part of the
        // subscriber.  The "retry-after" and "reason" parameters have no
        // semantics for "pending".
        // https://tools.ietf.org/html/rfc6665#section-4.1.3
        if (newState === subscription_1.SubscriptionState.Pending) {
            if (newExpires) {
                this.subscriptionExpires = newExpires;
            }
        }
        // If the "Subscription-State" header field value is "active", it means
        // that the subscription has been accepted and (in general) has been
        // authorized.  If the header field also contains an "expires"
        // parameter, the subscriber SHOULD take it as the authoritative
        // subscription duration and adjust accordingly.  The "retry-after" and
        // "reason" parameters have no semantics for "active".
        // https://tools.ietf.org/html/rfc6665#section-4.1.3
        if (newState === subscription_1.SubscriptionState.Active) {
            if (newExpires) {
                this.subscriptionExpires = newExpires;
            }
        }
        // If the "Subscription-State" value is "terminated", the subscriber
        // MUST consider the subscription terminated.  The "expires" parameter
        // has no semantics for "terminated" -- notifiers SHOULD NOT include an
        // "expires" parameter on a "Subscription-State" header field with a
        // value of "terminated", and subscribers MUST ignore any such
        // parameter, if present.
        if (newState === subscription_1.SubscriptionState.Terminated) {
            this.dispose();
        }
        this._subscriptionState = newState;
    };
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
    SubscriptionDialog.prototype.timer_N = function () {
        if (this.subscriptionState !== subscription_1.SubscriptionState.Terminated) {
            this.stateTransition(subscription_1.SubscriptionState.Terminated);
            this.onTerminated();
        }
    };
    return SubscriptionDialog;
}(dialog_1.Dialog));
exports.SubscriptionDialog = SubscriptionDialog;
