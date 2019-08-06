"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * A notification of an event (incoming NOTIFY).
 * @public
 */
var Notification = /** @class */ (function () {
    /** @internal */
    function Notification(incomingNotifyRequest) {
        this.incomingNotifyRequest = incomingNotifyRequest;
    }
    Object.defineProperty(Notification.prototype, "request", {
        /** Incoming NOTIFY request message. */
        get: function () {
            return this.incomingNotifyRequest.message;
        },
        enumerable: true,
        configurable: true
    });
    /** Accept the request. */
    Notification.prototype.accept = function (options) {
        this.incomingNotifyRequest.accept(options);
        return Promise.resolve();
    };
    /** Reject the request. */
    Notification.prototype.reject = function (options) {
        this.incomingNotifyRequest.reject(options);
        return Promise.resolve();
    };
    return Notification;
}());
exports.Notification = Notification;
