"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var events_1 = require("events");
/**
 * Legacy Transport.
 * @remarks
 * Abstract transport layer base class.
 * @public
 */
var Transport = /** @class */ (function (_super) {
    tslib_1.__extends(Transport, _super);
    /**
     * Constructor
     * @param logger - Logger.
     * @param options - Options bucket. Deprecated.
     */
    function Transport(logger, options) {
        var _this = _super.call(this) || this;
        _this.logger = logger;
        return _this;
    }
    Object.defineProperty(Transport.prototype, "protocol", {
        /**
         * The protocol.
         *
         * @remarks
         * Formatted as defined for the Via header sent-protocol transport.
         * https://tools.ietf.org/html/rfc3261#section-20.42
         */
        get: function () {
            return this.server && this.server.scheme ? this.server.scheme : "WSS";
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Returns the promise designated by the child layer then emits a connected event.
     * Automatically emits an event upon resolution, unless overrideEvent is set. If you
     * override the event in this fashion, you should emit it in your implementation of connectPromise
     * @param options - Options bucket.
     */
    Transport.prototype.connect = function (options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        return this.connectPromise(options).then(function (data) {
            if (!data.overrideEvent) {
                _this.emit("connected");
            }
        });
    };
    /**
     * Sends a message then emits a 'messageSent' event. Automatically emits an
     * event upon resolution, unless data.overrideEvent is set. If you override
     * the event in this fashion, you should emit it in your implementation of sendPromise
     * Rejects with an Error if message fails to send.
     * @param message - Message.
     * @param options - Options bucket.
     */
    Transport.prototype.send = function (message, options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        // Error handling is independent of whether the message was a request or
        // response.
        //
        // If the transport user asks for a message to be sent over an
        // unreliable transport, and the result is an ICMP error, the behavior
        // depends on the type of ICMP error.  Host, network, port or protocol
        // unreachable errors, or parameter problem errors SHOULD cause the
        // transport layer to inform the transport user of a failure in sending.
        // Source quench and TTL exceeded ICMP errors SHOULD be ignored.
        //
        // If the transport user asks for a request to be sent over a reliable
        // transport, and the result is a connection failure, the transport
        // layer SHOULD inform the transport user of a failure in sending.
        // https://tools.ietf.org/html/rfc3261#section-18.4
        return this.sendPromise(message).then(function (result) {
            if (!result.overrideEvent) {
                _this.emit("messageSent", result.msg);
            }
        });
    };
    /**
     * Returns the promise designated by the child layer then emits a
     * disconnected event. Automatically emits an event upon resolution,
     * unless overrideEvent is set. If you override the event in this fashion,
     * you should emit it in your implementation of disconnectPromise
     * @param options - Options bucket
     */
    Transport.prototype.disconnect = function (options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        return this.disconnectPromise(options).then(function (data) {
            if (!data.overrideEvent) {
                _this.emit("disconnected");
            }
        });
    };
    Transport.prototype.afterConnected = function (callback) {
        if (this.isConnected()) {
            callback();
        }
        else {
            this.once("connected", callback);
        }
    };
    /**
     * Returns a promise which resolves once the UA is connected. DEPRECATION WARNING: just use afterConnected()
     */
    Transport.prototype.waitForConnected = function () {
        var _this = this;
        // tslint:disable-next-line:no-console
        console.warn("DEPRECATION WARNING Transport.waitForConnected(): use afterConnected() instead");
        return new Promise(function (resolve) {
            _this.afterConnected(resolve);
        });
    };
    return Transport;
}(events_1.EventEmitter));
exports.Transport = Transport;
