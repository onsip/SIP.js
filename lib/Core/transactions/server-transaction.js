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
var transaction_1 = require("./transaction");
/**
 * Server Transaction
 * The server transaction is responsible for the delivery of requests to
 * the TU and the reliable transmission of responses.  It accomplishes
 * this through a state machine.  Server transactions are created by the
 * core when a request is received, and transaction handling is desired
 * for that request (this is not always the case).
 * https://tools.ietf.org/html/rfc3261#section-17.2
 */
var ServerTransaction = /** @class */ (function (_super) {
    __extends(ServerTransaction, _super);
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
