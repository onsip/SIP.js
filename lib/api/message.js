"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * A received message (incoming MESSAGE).
 * @public
 */
var Message = /** @class */ (function () {
    /** @internal */
    function Message(incomingMessageRequest) {
        this.incomingMessageRequest = incomingMessageRequest;
    }
    Object.defineProperty(Message.prototype, "request", {
        /** Incoming MESSAGE request message. */
        get: function () {
            return this.incomingMessageRequest.message;
        },
        enumerable: true,
        configurable: true
    });
    /** Accept the request. */
    Message.prototype.accept = function (options) {
        this.incomingMessageRequest.accept(options);
        return Promise.resolve();
    };
    /** Reject the request. */
    Message.prototype.reject = function (options) {
        this.incomingMessageRequest.reject(options);
        return Promise.resolve();
    };
    return Message;
}());
exports.Message = Message;
