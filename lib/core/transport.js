"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var events_1 = require("events");
/**
 * Transport
 * @remarks
 * Abstract transport layer base class.
 * @param logger - Logger.
 * @param options - Options bucket.
 * @public
 */
var Transport = /** @class */ (function (_super) {
    tslib_1.__extends(Transport, _super);
    function Transport(logger, options) {
        var _this = _super.call(this) || this;
        _this.logger = logger;
        return _this;
    }
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
     * @param msg - Message.
     * @param options - Options bucket.
     */
    Transport.prototype.send = function (msg, options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        return this.sendPromise(msg).then(function (data) {
            if (!data.overrideEvent) {
                _this.emit("messageSent", data.msg);
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
