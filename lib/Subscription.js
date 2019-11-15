"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var events_1 = require("events");
var Constants_1 = require("./Constants");
var core_1 = require("./core");
var allowed_methods_1 = require("./core/user-agent-core/allowed-methods");
var Enums_1 = require("./Enums");
var Utils_1 = require("./Utils");
/**
 * While this class is named `Subscription`, it is closer to
 * an implementation of a "subscriber" as defined in RFC 6665
 * "SIP-Specific Event Notifications".
 * https://tools.ietf.org/html/rfc6665
 * @class Class creating a SIP Subscriber.
 */
var Subscription = /** @class */ (function (_super) {
    tslib_1.__extends(Subscription, _super);
    /**
     * Constructor.
     * @param ua User agent.
     * @param target Subscription target.
     * @param event Subscription event.
     * @param options Options bucket.
     */
    function Subscription(ua, target, event, options) {
        if (options === void 0) { options = {}; }
        var _this = _super.call(this) || this;
        _this.data = {};
        _this.method = Constants_1.C.SUBSCRIBE;
        _this.body = undefined;
        // ClientContext interface
        _this.type = Enums_1.TypeStrings.Subscription;
        _this.ua = ua;
        _this.logger = ua.getLogger("sip.subscription");
        if (options.body) {
            _this.body = {
                body: options.body,
                contentType: options.contentType ? options.contentType : "application/sdp"
            };
        }
        // Target URI
        var uri = ua.normalizeTarget(target);
        if (!uri) {
            throw new TypeError("Invalid target: " + target);
        }
        _this.uri = uri;
        // Subscription event
        _this.event = event;
        // Subscription expires
        if (options.expires === undefined) {
            _this.expires = 3600;
        }
        else if (typeof options.expires !== "number") { // pre-typescript type guard
            ua.logger.warn("Option \"expires\" must be a number. Using default of 3600.");
            _this.expires = 3600;
        }
        else {
            _this.expires = options.expires;
        }
        // Subscription extra headers
        _this.extraHeaders = (options.extraHeaders || []).slice();
        // Subscription context.
        _this.context = _this.initContext();
        _this.disposed = false;
        // ClientContext interface
        _this.request = _this.context.message;
        if (!_this.request.from) {
            throw new Error("From undefined.");
        }
        if (!_this.request.to) {
            throw new Error("From undefined.");
        }
        _this.localIdentity = _this.request.from;
        _this.remoteIdentity = _this.request.to;
        // Add to UA's collection
        _this.id = _this.request.callId + _this.request.from.parameters.tag + _this.event;
        _this.ua.subscriptions[_this.id] = _this;
        return _this;
    }
    /**
     * Destructor.
     */
    Subscription.prototype.dispose = function () {
        if (this.disposed) {
            return;
        }
        if (this.retryAfterTimer) {
            clearTimeout(this.retryAfterTimer);
            this.retryAfterTimer = undefined;
        }
        this.context.dispose();
        this.disposed = true;
        // Remove from UA's collection
        delete this.ua.subscriptions[this.id];
    };
    Subscription.prototype.on = function (name, callback) {
        return _super.prototype.on.call(this, name, callback);
    };
    Subscription.prototype.emit = function (event) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        return _super.prototype.emit.apply(this, tslib_1.__spreadArrays([event], args));
    };
    /**
     * Gracefully terminate.
     */
    Subscription.prototype.close = function () {
        if (this.disposed) {
            return;
        }
        this.dispose();
        switch (this.context.state) {
            case core_1.SubscriptionState.Initial:
                this.onTerminated();
                break;
            case core_1.SubscriptionState.NotifyWait:
                this.onTerminated();
                break;
            case core_1.SubscriptionState.Pending:
                this.unsubscribe();
                break;
            case core_1.SubscriptionState.Active:
                this.unsubscribe();
                break;
            case core_1.SubscriptionState.Terminated:
                this.onTerminated();
                break;
            default:
                break;
        }
    };
    /**
     * Send a re-SUBSCRIBE request if there is an "active" subscription.
     */
    Subscription.prototype.refresh = function () {
        var _this = this;
        switch (this.context.state) {
            case core_1.SubscriptionState.Initial:
                break;
            case core_1.SubscriptionState.NotifyWait:
                break;
            case core_1.SubscriptionState.Pending:
                break;
            case core_1.SubscriptionState.Active:
                if (this.subscription) {
                    var request = this.subscription.refresh();
                    request.delegate = {
                        onAccept: (function (response) { return _this.onAccepted(response); }),
                        onRedirect: (function (response) { return _this.onFailed(response); }),
                        onReject: (function (response) { return _this.onFailed(response); }),
                    };
                }
                break;
            case core_1.SubscriptionState.Terminated:
                break;
            default:
                break;
        }
    };
    /**
     * Send an initial SUBSCRIBE request if no subscription.
     * Send a re-SUBSCRIBE request if there is an "active" subscription.
     */
    Subscription.prototype.subscribe = function () {
        var _this = this;
        switch (this.context.state) {
            case core_1.SubscriptionState.Initial:
                this.context.subscribe().then(function (result) {
                    if (result.success) {
                        if (result.success.subscription) {
                            _this.subscription = result.success.subscription;
                            _this.subscription.delegate = {
                                onNotify: function (request) { return _this.onNotify(request); },
                                onRefresh: function (request) { return _this.onRefresh(request); },
                                onTerminated: function () { return _this.close(); }
                            };
                        }
                        _this.onNotify(result.success.request);
                    }
                    else if (result.failure) {
                        _this.onFailed(result.failure.response);
                    }
                });
                break;
            case core_1.SubscriptionState.NotifyWait:
                break;
            case core_1.SubscriptionState.Pending:
                break;
            case core_1.SubscriptionState.Active:
                this.refresh();
                break;
            case core_1.SubscriptionState.Terminated:
                break;
            default:
                break;
        }
        return this;
    };
    /**
     * Send a re-SUBSCRIBE request if there is a "pending" or "active" subscription.
     */
    Subscription.prototype.unsubscribe = function () {
        this.dispose();
        switch (this.context.state) {
            case core_1.SubscriptionState.Initial:
                break;
            case core_1.SubscriptionState.NotifyWait:
                break;
            case core_1.SubscriptionState.Pending:
                if (this.subscription) {
                    this.subscription.unsubscribe();
                    // responses intentionally ignored
                }
                break;
            case core_1.SubscriptionState.Active:
                if (this.subscription) {
                    this.subscription.unsubscribe();
                    // responses intentionally ignored
                }
                break;
            case core_1.SubscriptionState.Terminated:
                break;
            default:
                break;
        }
        this.onTerminated();
    };
    Subscription.prototype.onAccepted = function (response) {
        var statusCode = response.message.statusCode ? response.message.statusCode : 0;
        var cause = Utils_1.Utils.getReasonPhrase(statusCode);
        this.emit("accepted", response.message, cause);
    };
    Subscription.prototype.onFailed = function (response) {
        this.close();
        if (response) {
            var statusCode = response.message.statusCode ? response.message.statusCode : 0;
            var cause = Utils_1.Utils.getReasonPhrase(statusCode);
            this.emit("failed", response.message, cause);
            this.emit("rejected", response.message, cause);
        }
    };
    Subscription.prototype.onNotify = function (request) {
        var _this = this;
        request.accept(); // Send 200 response.
        this.emit("notify", { request: request.message });
        // If we've set state to done, no further processing should take place
        // and we are only interested in cleaning up after the appropriate NOTIFY.
        if (this.disposed) {
            return;
        }
        //  If the "Subscription-State" value is "terminated", the subscriber
        //  MUST consider the subscription terminated.  The "expires" parameter
        //  has no semantics for "terminated" -- notifiers SHOULD NOT include an
        //  "expires" parameter on a "Subscription-State" header field with a
        //  value of "terminated", and subscribers MUST ignore any such
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
                    this.close();
                    break;
                default:
                    break;
            }
        }
    };
    Subscription.prototype.onRefresh = function (request) {
        var _this = this;
        request.delegate = {
            onAccept: function (response) { return _this.onAccepted(response); }
        };
    };
    Subscription.prototype.onTerminated = function () {
        this.emit("terminated");
    };
    Subscription.prototype.initContext = function () {
        var _this = this;
        var options = {
            extraHeaders: this.extraHeaders,
            body: this.body ? Utils_1.Utils.fromBodyObj(this.body) : undefined
        };
        this.context = new SubscribeClientContext(this.ua.userAgentCore, this.uri, this.event, this.expires, options);
        this.context.delegate = {
            onAccept: (function (response) { return _this.onAccepted(response); })
        };
        return this.context;
    };
    return Subscription;
}(events_1.EventEmitter));
exports.Subscription = Subscription;
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
        this.message = core.makeOutgoingRequestMessage(Constants_1.C.SUBSCRIBE, this.target, this.core.configuration.aor, this.target, {}, extraHeaders, body);
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
