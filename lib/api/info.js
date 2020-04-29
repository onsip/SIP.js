"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * An exchange of information (incoming INFO).
 * @public
 */
var Info = /** @class */ (function () {
    /** @internal */
    function Info(incomingInfoRequest) {
        this.incomingInfoRequest = incomingInfoRequest;
    }
    Object.defineProperty(Info.prototype, "request", {
        /** Incoming MESSAGE request message. */
        get: function () {
            return this.incomingInfoRequest.message;
        },
        enumerable: true,
        configurable: true
    });
    /** Accept the request. */
    Info.prototype.accept = function (options) {
        this.incomingInfoRequest.accept(options);
        return Promise.resolve();
    };
    /** Reject the request. */
    Info.prototype.reject = function (options) {
        this.incomingInfoRequest.reject(options);
        return Promise.resolve();
    };
    return Info;
}());
exports.Info = Info;
