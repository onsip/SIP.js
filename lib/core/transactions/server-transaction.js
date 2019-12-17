"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var transaction_1 = require("./transaction");
/**
 * Server Transaction.
 * @remarks
 * The server transaction is responsible for the delivery of requests to
 * the TU and the reliable transmission of responses.  It accomplishes
 * this through a state machine.  Server transactions are created by the
 * core when a request is received, and transaction handling is desired
 * for that request (this is not always the case).
 * https://tools.ietf.org/html/rfc3261#section-17.2
 * @public
 */
var ServerTransaction = /** @class */ (function (_super) {
    tslib_1.__extends(ServerTransaction, _super);
    function ServerTransaction(_request, transport, user, state, loggerCategory) {
        var _this = _super.call(this, transport, user, _request.viaBranch, state, loggerCategory) || this;
        _this._request = _request;
        _this.user = user;
        return _this;
    }
    Object.defineProperty(ServerTransaction.prototype, "request", {
        /** The incoming request the transaction handling. */
        get: function () {
            return this._request;
        },
        enumerable: true,
        configurable: true
    });
    return ServerTransaction;
}(transaction_1.Transaction));
exports.ServerTransaction = ServerTransaction;
