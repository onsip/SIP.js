"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var events_1 = require("events");
var emitter_1 = require("./emitter");
var subscription_state_1 = require("./subscription-state");
/**
 * A subscription provides asynchronous {@link Notification} of events.
 *
 * @remarks
 * See {@link Subscriber} for details on establishing a subscription.
 *
 * @public
 */
var Subscription = /** @class */ (function (_super) {
    tslib_1.__extends(Subscription, _super);
    /**
     * Constructor.
     * @param userAgent - User agent. See {@link UserAgent} for details.
     * @internal
     */
    function Subscription(userAgent, options) {
        if (options === void 0) { options = {}; }
        var _this = _super.call(this) || this;
        _this._disposed = false;
        _this._state = subscription_state_1.SubscriptionState.Initial;
        _this._stateEventEmitter = new events_1.EventEmitter();
        _this._logger = userAgent.getLogger("sip.subscription");
        _this.userAgent = userAgent;
        _this.delegate = options.delegate;
        return _this;
    }
    /**
     * Destructor.
     * @internal
     */
    Subscription.prototype.dispose = function () {
        if (this._disposed) {
            return;
        }
        this._disposed = true;
        this.stateTransition(subscription_state_1.SubscriptionState.Terminated);
        this._stateEventEmitter.removeAllListeners();
    };
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
            return emitter_1.makeEmitter(this._stateEventEmitter);
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
        this._logger.log("Subscription " + (this.dialog ? this.dialog.id : undefined) + " transitioned to " + this._state);
        this._stateEventEmitter.emit("event", this._state);
    };
    return Subscription;
}(events_1.EventEmitter));
exports.Subscription = Subscription;
