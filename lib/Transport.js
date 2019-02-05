"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var events_1 = require("events");
var Enums_1 = require("./Enums");
/* Transport
 * @class Abstract transport layer parent class
 * @param {Logger} logger
 * @param {Object} [options]
 */
var Transport = /** @class */ (function (_super) {
    __extends(Transport, _super);
    function Transport(logger, options) {
        var _this = _super.call(this) || this;
        _this.type = Enums_1.TypeStrings.Transport;
        _this.logger = logger;
        return _this;
    }
    /**
     * Returns the promise designated by the child layer then emits a connected event.
     * Automatically emits an event upon resolution, unless overrideEvent is set. If you
     * override the event in this fashion, you should emit it in your implementation of connectPromise
     * @param {Object} [options]
     * @returns {Promise}
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
     * @param {SIP.OutgoingRequest|String} msg
     * @param {Object} options
     * @returns {Promise}
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
     * @param {Object} [options]
     * @returns {Promise}
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
     * @returns {Promise}
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
