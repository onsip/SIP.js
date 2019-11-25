"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var core_1 = require("../core");
var allowed_methods_1 = require("../core/user-agent-core/allowed-methods");
var notification_1 = require("./notification");
var subscription_1 = require("./subscription");
var subscription_state_1 = require("./subscription-state");
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
var Subscriber = /** @class */ (function (_super) {
    tslib_1.__extends(Subscriber, _super);
    /**
     * Constructor.
     * @param userAgent - User agent. See {@link UserAgent} for details.
     * @param targetURI - The request URI identifying the subscribed event.
     * @param eventType - The event type identifying the subscribed event.
     * @param options - Options bucket. See {@link SubscriberOptions} for details.
     */
    function Subscriber(userAgent, targetURI, eventType, options) {
        if (options === void 0) { options = {}; }
        var _this = _super.call(this, userAgent, options) || this;
        _this.body = undefined;
        _this.logger = userAgent.getLogger("sip.subscription");
        if (options.body) {
            _this.body = {
                body: options.body,
                contentType: options.contentType ? options.contentType : "application/sdp"
            };
        }
        _this.userAgent = userAgent;
        _this.targetURI = targetURI;
        // Subscription event
        _this.event = eventType;
        // Subscription expires
        if (options.expires === undefined) {
            _this.expires = 3600;
        }
        else if (typeof options.expires !== "number") { // pre-typescript type guard
            _this.logger.warn("Option \"expires\" must be a number. Using default of 3600.");
            _this.expires = 3600;
        }
        else {
            _this.expires = options.expires;
        }
        // Subscription extra headers
        _this.extraHeaders = (options.extraHeaders || []).slice();
        // Subscription context.
        _this.context = _this.initContext();
        _this.request = _this.context.message;
        // Add to UA's collection
        _this.id = _this.request.callId + _this.request.from.parameters.tag + _this.event;
        _this.userAgent.subscriptions[_this.id] = _this;
        return _this;
    }
    /**
     * Subscribe to event notifications.
     *
     * @remarks
     * Send an initial SUBSCRIBE request if no subscription as been established.
     * Sends a re-SUBSCRIBE request if the subscription is "active".
     */
    Subscriber.prototype.subscribe = function (options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        switch (this.context.state) {
            case core_1.SubscriptionState.Initial:
                // we can end up here when retrying so only state transition if in SubscriptionState.Initial state
                if (this.state === subscription_state_1.SubscriptionState.Initial) {
                    this.stateTransition(subscription_state_1.SubscriptionState.NotifyWait);
                }
                this.context.subscribe().then(function (result) {
                    if (result.success) {
                        if (result.success.subscription) {
                            _this.dialog = result.success.subscription;
                            _this.dialog.delegate = {
                                onNotify: function (request) { return _this.onNotify(request); },
                                onRefresh: function (request) { return _this.onRefresh(request); },
                                onTerminated: function () { return _this._dispose(); }
                            };
                        }
                        _this.onNotify(result.success.request);
                    }
                    else if (result.failure) {
                        _this.unsubscribe();
                    }
                });
                break;
            case core_1.SubscriptionState.NotifyWait:
                break;
            case core_1.SubscriptionState.Pending:
                break;
            case core_1.SubscriptionState.Active:
                if (this.dialog) {
                    var request = this.dialog.refresh();
                    request.delegate = {
                        onAccept: (function (response) { return _this.onAccepted(response); }),
                        onRedirect: (function (response) { return _this.unsubscribe(); }),
                        onReject: (function (response) { return _this.unsubscribe(); }),
                    };
                }
                break;
            case core_1.SubscriptionState.Terminated:
                break;
            default:
                break;
        }
        return Promise.resolve();
    };
    /**
     * {@inheritDoc Subscription.unsubscribe}
     */
    Subscriber.prototype.unsubscribe = function (options) {
        if (options === void 0) { options = {}; }
        if (this.disposed) {
            return Promise.resolve();
        }
        switch (this.context.state) {
            case core_1.SubscriptionState.Initial:
                break;
            case core_1.SubscriptionState.NotifyWait:
                break;
            case core_1.SubscriptionState.Pending:
                if (this.dialog) {
                    this.dialog.unsubscribe();
                    // responses intentionally ignored
                }
                break;
            case core_1.SubscriptionState.Active:
                if (this.dialog) {
                    this.dialog.unsubscribe();
                    // responses intentionally ignored
                }
                break;
            case core_1.SubscriptionState.Terminated:
                break;
            default:
                break;
        }
        this._dispose();
        return Promise.resolve();
    };
    /**
     * Destructor.
     * @internal
     */
    Subscriber.prototype._dispose = function () {
        if (this.disposed) {
            return;
        }
        _super.prototype._dispose.call(this);
        if (this.retryAfterTimer) {
            clearTimeout(this.retryAfterTimer);
            this.retryAfterTimer = undefined;
        }
        this.context.dispose();
        // Remove from userAgent's collection
        delete this.userAgent.subscriptions[this.id];
    };
    /**
     * Sends a re-SUBSCRIBE request if the subscription is "active".
     * @deprecated Use `subscribe` instead.
     * @internal
     */
    Subscriber.prototype._refresh = function () {
        if (this.context.state === core_1.SubscriptionState.Active) {
            return this.subscribe();
        }
        return Promise.resolve();
    };
    /** @internal */
    Subscriber.prototype.onAccepted = function (response) {
        // NOTE: If you think you should do something with this response,
        // please make sure you understand what it is you are doing and why.
        // Per the RFC, the first NOTIFY is all that actually matters.
    };
    /** @internal */
    Subscriber.prototype.onNotify = function (request) {
        var _this = this;
        // If we've set state to done, no further processing should take place
        // and we are only interested in cleaning up after the appropriate NOTIFY.
        if (this.disposed) {
            request.accept();
            return;
        }
        // State transition if needed.
        if (this.state !== subscription_state_1.SubscriptionState.Subscribed) {
            this.stateTransition(subscription_state_1.SubscriptionState.Subscribed);
        }
        // Delegate notification.
        if (this.delegate && this.delegate.onNotify) {
            var notification = new notification_1.Notification(request);
            this.delegate.onNotify(notification);
        }
        else {
            request.accept();
        }
        //  If the "Subscription-State" value is SubscriptionState.Terminated, the subscriber
        //  MUST consider the subscription terminated.  The "expires" parameter
        //  has no semantics for SubscriptionState.Terminated -- notifiers SHOULD NOT include an
        //  "expires" parameter on a "Subscription-State" header field with a
        //  value of SubscriptionState.Terminated, and subscribers MUST ignore any such
        //  parameter, if present.  If a reason code is present, the client
        //  should behave as described below.  If no reason code or an unknown
        //  reason code is present, the client MAY attempt to re-subscribe at any
        //  time (unless a "retry-after" parameter is present, in which case the
        //  client SHOULD NOT attempt re-subscription until after the number of
        //  seconds specified by the "retry-after" parameter).  The reason codes
        //  defined by this document are:
        // https://tools.ietf.org/html/rfc6665#section-4.1.3
        var subscriptionState = request.message.parseHeader("Subscription-State");
        if (subscriptionState && subscriptionState.state) {
            switch (subscriptionState.state) {
                case "terminated":
                    if (subscriptionState.reason) {
                        this.logger.log("Terminated subscription with reason " + subscriptionState.reason);
                        switch (subscriptionState.reason) {
                            case "deactivated":
                            case "timeout":
                                this.initContext();
                                this.subscribe();
                                return;
                            case "probation":
                            case "giveup":
                                this.initContext();
                                if (subscriptionState.params && subscriptionState.params["retry-after"]) {
                                    this.retryAfterTimer = setTimeout(function () { return _this.subscribe(); }, subscriptionState.params["retry-after"]);
                                }
                                else {
                                    this.subscribe();
                                }
                                return;
                            case "rejected":
                            case "noresource":
                            case "invariant":
                                break;
                        }
                    }
                    this.unsubscribe();
                    break;
                default:
                    break;
            }
        }
    };
    /** @internal */
    Subscriber.prototype.onRefresh = function (request) {
        var _this = this;
        request.delegate = {
            onAccept: function (response) { return _this.onAccepted(response); }
        };
    };
    Subscriber.prototype.initContext = function () {
        var _this = this;
        var options = {
            extraHeaders: this.extraHeaders,
            body: this.body ? core_1.fromBodyLegacy(this.body) : undefined
        };
        this.context = new SubscribeClientContext(this.userAgent.userAgentCore, this.targetURI, this.event, this.expires, options);
        this.context.delegate = {
            onAccept: (function (response) { return _this.onAccepted(response); })
        };
        return this.context;
    };
    return Subscriber;
}(subscription_1.Subscription));
exports.Subscriber = Subscriber;
// tslint:disable-next-line:max-classes-per-file
var SubscribeClientContext = /** @class */ (function () {
    function SubscribeClientContext(core, target, event, expires, options, delegate) {
        this.core = core;
        this.target = target;
        this.event = event;
        this.expires = expires;
        this.subscribed = false;
        this.logger = core.loggerFactory.getLogger("sip.subscription");
        this.delegate = delegate;
        var allowHeader = "Allow: " + allowed_methods_1.AllowedMethods.toString();
        var extraHeaders = (options && options.extraHeaders || []).slice();
        extraHeaders.push(allowHeader);
        extraHeaders.push("Event: " + this.event);
        extraHeaders.push("Expires: " + this.expires);
        extraHeaders.push("Contact: " + this.core.configuration.contact.toString());
        var body = options && options.body;
        this.message = core.makeOutgoingRequestMessage(core_1.C.SUBSCRIBE, this.target, this.core.configuration.aor, this.target, {}, extraHeaders, body);
    }
    /** Destructor. */
    SubscribeClientContext.prototype.dispose = function () {
        if (this.subscription) {
            this.subscription.dispose();
        }
        if (this.request) {
            this.request.waitNotifyStop();
            this.request.dispose();
        }
    };
    Object.defineProperty(SubscribeClientContext.prototype, "state", {
        /** Subscription state. */
        get: function () {
            if (this.subscription) {
                return this.subscription.subscriptionState;
            }
            else if (this.subscribed) {
                return core_1.SubscriptionState.NotifyWait;
            }
            else {
                return core_1.SubscriptionState.Initial;
            }
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Establish subscription.
     * @param options Options bucket.
     */
    SubscribeClientContext.prototype.subscribe = function () {
        var _this = this;
        if (this.subscribed) {
            return Promise.reject(new Error("Not in initial state. Did you call subscribe more than once?"));
        }
        this.subscribed = true;
        return new Promise(function (resolve, reject) {
            if (!_this.message) {
                throw new Error("Message undefined.");
            }
            _this.request = _this.core.subscribe(_this.message, {
                // This SUBSCRIBE request will be confirmed with a final response.
                // 200-class responses indicate that the subscription has been accepted
                // and that a NOTIFY request will be sent immediately.
                // https://tools.ietf.org/html/rfc6665#section-4.1.2.1
                onAccept: function (response) {
                    if (_this.delegate && _this.delegate.onAccept) {
                        _this.delegate.onAccept(response);
                    }
                },
                // Due to the potential for out-of-order messages, packet loss, and
                // forking, the subscriber MUST be prepared to receive NOTIFY requests
                // before the SUBSCRIBE transaction has completed.
                // https://tools.ietf.org/html/rfc6665#section-4.1.2.4
                onNotify: function (requestWithSubscription) {
                    _this.subscription = requestWithSubscription.subscription;
                    if (_this.subscription) {
                        _this.subscription.autoRefresh = true;
                    }
                    resolve({ success: requestWithSubscription });
                },
                // If this Timer N expires prior to the receipt of a NOTIFY request,
                // the subscriber considers the subscription failed, and cleans up
                // any state associated with the subscription attempt.
                // https://tools.ietf.org/html/rfc6665#section-4.1.2.4
                onNotifyTimeout: function () {
                    resolve({ failure: {} });
                },
                // This SUBSCRIBE request will be confirmed with a final response.
                // Non-200-class final responses indicate that no subscription or new
                // dialog usage has been created, and no subsequent NOTIFY request will
                // be sent.
                // https://tools.ietf.org/html/rfc6665#section-4.1.2.1
                onRedirect: function (response) {
                    resolve({ failure: { response: response } });
                },
                // This SUBSCRIBE request will be confirmed with a final response.
                // Non-200-class final responses indicate that no subscription or new
                // dialog usage has been created, and no subsequent NOTIFY request will
                // be sent.
                // https://tools.ietf.org/html/rfc6665#section-4.1.2.1
                onReject: function (response) {
                    resolve({ failure: { response: response } });
                }
            });
        });
    };
    return SubscribeClientContext;
}());
