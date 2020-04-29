"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var events_1 = require("events");
var emitter_1 = require("./emitter");
var subscription_state_1 = require("./subscription-state");
/**
 * A subscription provides {@link Notification} of events.
 *
 * @remarks
 * See {@link Subscriber} for details on establishing a subscription.
 *
 * @public
 */
var Subscription = /** @class */ (function () {
    /**
     * Constructor.
     * @param userAgent - User agent. See {@link UserAgent} for details.
     * @internal
     */
    function Subscription(userAgent, options) {
        if (options === void 0) { options = {}; }
        this._disposed = false;
        this._state = subscription_state_1.SubscriptionState.Initial;
        this._stateEventEmitter = new events_1.EventEmitter();
        this._logger = userAgent.getLogger("sip.Subscription");
        this._userAgent = userAgent;
        this.delegate = options.delegate;
    }
    /**
     * Destructor.
     */
    Subscription.prototype.dispose = function () {
        if (this._disposed) {
            return Promise.resolve();
        }
        this._disposed = true;
        this._stateEventEmitter.removeAllListeners();
        return Promise.resolve();
    };
    Object.defineProperty(Subscription.prototype, "dialog", {
        /**
         * The subscribed subscription dialog.
         */
        get: function () {
            return this._dialog;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Subscription.prototype, "disposed", {
        /**
         * True if disposed.
         * @internal
         */
        get: function () {
            return this._disposed;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Subscription.prototype, "state", {
        /**
         * Subscription state. See {@link SubscriptionState} for details.
         */
        get: function () {
            return this._state;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Subscription.prototype, "stateChange", {
        /**
         * Emits when the subscription `state` property changes.
         */
        get: function () {
            return emitter_1._makeEmitter(this._stateEventEmitter);
        },
        enumerable: true,
        configurable: true
    });
    /** @internal */
    Subscription.prototype.stateTransition = function (newState) {
        var _this = this;
        var invalidTransition = function () {
            throw new Error("Invalid state transition from " + _this._state + " to " + newState);
        };
        // Validate transition
        switch (this._state) {
            case subscription_state_1.SubscriptionState.Initial:
                if (newState !== subscription_state_1.SubscriptionState.NotifyWait && newState !== subscription_state_1.SubscriptionState.Terminated) {
                    invalidTransition();
                }
                break;
            case subscription_state_1.SubscriptionState.NotifyWait:
                if (newState !== subscription_state_1.SubscriptionState.Subscribed && newState !== subscription_state_1.SubscriptionState.Terminated) {
                    invalidTransition();
                }
                break;
            case subscription_state_1.SubscriptionState.Subscribed:
                if (newState !== subscription_state_1.SubscriptionState.Terminated) {
                    invalidTransition();
                }
                break;
            case subscription_state_1.SubscriptionState.Terminated:
                invalidTransition();
                break;
            default:
                throw new Error("Unrecognized state.");
        }
        // Guard against duplicate transition
        if (this._state === newState) {
            return;
        }
        // Transition
        this._state = newState;
        this._logger.log("Subscription " + (this._dialog ? this._dialog.id : undefined) + " transitioned to " + this._state);
        this._stateEventEmitter.emit("event", this._state);
        // Dispose
        if (newState === subscription_state_1.SubscriptionState.Terminated) {
            this.dispose();
        }
    };
    return Subscription;
}());
exports.Subscription = Subscription;
