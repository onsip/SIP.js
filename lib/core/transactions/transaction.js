"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var events_1 = require("events");
var exceptions_1 = require("../exceptions");
/**
 * Transaction.
 * @remarks
 * SIP is a transactional protocol: interactions between components take
 * place in a series of independent message exchanges.  Specifically, a
 * SIP transaction consists of a single request and any responses to
 * that request, which include zero or more provisional responses and
 * one or more final responses.  In the case of a transaction where the
 * request was an INVITE (known as an INVITE transaction), the
 * transaction also includes the ACK only if the final response was not
 * a 2xx response.  If the response was a 2xx, the ACK is not considered
 * part of the transaction.
 * https://tools.ietf.org/html/rfc3261#section-17
 * @public
 */
var Transaction = /** @class */ (function (_super) {
    tslib_1.__extends(Transaction, _super);
    function Transaction(_transport, _user, _id, _state, loggerCategory) {
        var _this = _super.call(this) || this;
        _this._transport = _transport;
        _this._user = _user;
        _this._id = _id;
        _this._state = _state;
        _this.logger = _user.loggerFactory.getLogger(loggerCategory, _id);
        _this.logger.debug("Constructing " + _this.typeToString() + " with id " + _this.id + ".");
        return _this;
    }
    /**
     * Destructor.
     * Once the transaction is in the "terminated" state, it is destroyed
     * immediately and there is no need to call `dispose`. However, if a
     * transaction needs to be ended prematurely, the transaction user may
     * do so by calling this method (for example, perhaps the UA is shutting down).
     * No state transition will occur upon calling this method, all outstanding
     * transmission timers will be cancelled, and use of the transaction after
     * calling `dispose` is undefined.
     */
    Transaction.prototype.dispose = function () {
        this.logger.debug("Destroyed " + this.typeToString() + " with id " + this.id + ".");
    };
    Object.defineProperty(Transaction.prototype, "id", {
        /** Transaction id. */
        get: function () {
            return this._id;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Transaction.prototype, "kind", {
        /** Transaction kind. Deprecated. */
        get: function () {
            throw new Error("Invalid kind.");
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Transaction.prototype, "state", {
        /** Transaction state. */
        get: function () {
            return this._state;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Transaction.prototype, "transport", {
        /** Transaction transport. */
        get: function () {
            return this._transport;
        },
        enumerable: true,
        configurable: true
    });
    Transaction.prototype.on = function (name, callback) { return _super.prototype.on.call(this, name, callback); };
    Transaction.prototype.logTransportError = function (error, message) {
        this.logger.error(error.message);
        this.logger.error("Transport error occurred in " + this.typeToString() + " with id " + this.id + ".");
        this.logger.error(message);
    };
    /**
     * Pass message to transport for transmission. If transport fails,
     * the transaction user is notified by callback to onTransportError().
     * @returns
     * Rejects with `TransportError` if transport fails.
     */
    Transaction.prototype.send = function (message) {
        var _this = this;
        return this.transport.send(message).catch(function (error) {
            // If the transport rejects, it SHOULD reject with a TransportError.
            // But the transport may be external code, so we are careful
            // make sure we convert it to a TransportError if need be.
            if (error instanceof exceptions_1.TransportError) {
                _this.onTransportError(error);
                throw error;
            }
            var transportError;
            if (error && typeof error.message === "string") {
                transportError = new exceptions_1.TransportError(error.message);
            }
            else {
                transportError = new exceptions_1.TransportError();
            }
            _this.onTransportError(transportError);
            throw transportError;
        });
    };
    Transaction.prototype.setState = function (state) {
        this.logger.debug("State change to \"" + state + "\" on " + this.typeToString() + " with id " + this.id + ".");
        this._state = state;
        if (this._user.onStateChange) {
            this._user.onStateChange(state);
        }
        this.emit("stateChanged");
    };
    Transaction.prototype.typeToString = function () {
        return "UnknownType";
    };
    return Transaction;
}(events_1.EventEmitter));
exports.Transaction = Transaction;
