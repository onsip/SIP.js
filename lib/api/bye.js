"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * A request to end a {@link Session} (incoming BYE).
 * @public
 */
var Bye = /** @class */ (function () {
    /** @internal */
    function Bye(incomingByeRequest) {
        this.incomingByeRequest = incomingByeRequest;
    }
    Object.defineProperty(Bye.prototype, "request", {
        /** Incoming BYE request message. */
        get: function () {
            return this.incomingByeRequest.message;
        },
        enumerable: true,
        configurable: true
    });
    /** Accept the request. */
    Bye.prototype.accept = function (options) {
        this.incomingByeRequest.accept(options);
        return Promise.resolve();
    };
    /** Reject the request. */
    Bye.prototype.reject = function (options) {
        this.incomingByeRequest.reject(options);
        return Promise.resolve();
    };
    return Bye;
}());
exports.Bye = Bye;
