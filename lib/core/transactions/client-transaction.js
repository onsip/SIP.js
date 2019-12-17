"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var transaction_1 = require("./transaction");
/**
 * Client Transaction.
 * @remarks
 * The client transaction provides its functionality through the
 * maintenance of a state machine.
 *
 * The TU communicates with the client transaction through a simple
 * interface.  When the TU wishes to initiate a new transaction, it
 * creates a client transaction and passes it the SIP request to send
 * and an IP address, port, and transport to which to send it.  The
 * client transaction begins execution of its state machine.  Valid
 * responses are passed up to the TU from the client transaction.
 * https://tools.ietf.org/html/rfc3261#section-17.1
 * @public
 */
var ClientTransaction = /** @class */ (function (_super) {
    tslib_1.__extends(ClientTransaction, _super);
    function ClientTransaction(_request, transport, user, state, loggerCategory) {
        var _this = _super.call(this, transport, user, ClientTransaction.makeId(_request), state, loggerCategory) || this;
        _this._request = _request;
        _this.user = user;
        // The Via header field indicates the transport used for the transaction
        // and identifies the location where the response is to be sent.  A Via
        // header field value is added only after the transport that will be
        // used to reach the next hop has been selected (which may involve the
        // usage of the procedures in [4]).
        // https://tools.ietf.org/html/rfc3261#section-8.1.1.7
        _request.setViaHeader(_this.id, transport.protocol);
        return _this;
    }
    ClientTransaction.makeId = function (request) {
        if (request.method === "CANCEL") {
            if (!request.branch) {
                throw new Error("Outgoing CANCEL request without a branch.");
            }
            return request.branch;
        }
        else {
            return "z9hG4bK" + Math.floor(Math.random() * 10000000);
        }
    };
    Object.defineProperty(ClientTransaction.prototype, "request", {
        /** The outgoing request the transaction handling. */
        get: function () {
            return this._request;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * A 408 to non-INVITE will always arrive too late to be useful ([3]),
     * The client already has full knowledge of the timeout. The only
     * information this message would convey is whether or not the server
     * believed the transaction timed out. However, with the current design
     * of the NIT, a client cannot do anything with this knowledge. Thus,
     * the 408 is simply wasting network resources and contributes to the
     * response bombardment illustrated in [3].
     * https://tools.ietf.org/html/rfc4320#section-4.1
     */
    ClientTransaction.prototype.onRequestTimeout = function () {
        if (this.user.onRequestTimeout) {
            this.user.onRequestTimeout();
        }
    };
    return ClientTransaction;
}(transaction_1.Transaction));
exports.ClientTransaction = ClientTransaction;
