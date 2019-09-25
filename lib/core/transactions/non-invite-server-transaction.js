"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var timers_1 = require("../timers");
var server_transaction_1 = require("./server-transaction");
var transaction_state_1 = require("./transaction-state");
/**
 * Non-INVITE Server Transaction.
 * @remarks
 * https://tools.ietf.org/html/rfc3261#section-17.2.2
 * @public
 */
var NonInviteServerTransaction = /** @class */ (function (_super) {
    tslib_1.__extends(NonInviteServerTransaction, _super);
    /**
     * Constructor.
     * After construction the transaction will be in the "trying": state and the transaction
     * `id` will equal the branch parameter set in the Via header of the incoming request.
     * https://tools.ietf.org/html/rfc3261#section-17.2.2
     * @param request - Incoming Non-INVITE request from the transport.
     * @param transport - The transport.
     * @param user - The transaction user.
     */
    function NonInviteServerTransaction(request, transport, user) {
        return _super.call(this, request, transport, user, transaction_state_1.TransactionState.Trying, "sip.transaction.nist") || this;
    }
    /**
     * Destructor.
     */
    NonInviteServerTransaction.prototype.dispose = function () {
        if (this.J) {
            clearTimeout(this.J);
            this.J = undefined;
        }
        _super.prototype.dispose.call(this);
    };
    Object.defineProperty(NonInviteServerTransaction.prototype, "kind", {
        /** Transaction kind. Deprecated. */
        get: function () {
            return "nist";
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Receive requests from transport matching this transaction.
     * @param request - Request matching this transaction.
     */
    NonInviteServerTransaction.prototype.receiveRequest = function (request) {
        var _this = this;
        switch (this.state) {
            case transaction_state_1.TransactionState.Trying:
                // Once in the "Trying" state, any further request retransmissions are discarded.
                // https://tools.ietf.org/html/rfc3261#section-17.2.2
                break;
            case transaction_state_1.TransactionState.Proceeding:
                // If a retransmission of the request is received while in the "Proceeding" state,
                // the most recently sent provisional response MUST be passed to the transport layer for retransmission.
                // https://tools.ietf.org/html/rfc3261#section-17.2.2
                if (!this.lastResponse) {
                    throw new Error("Last response undefined.");
                }
                this.send(this.lastResponse).catch(function (error) {
                    _this.logTransportError(error, "Failed to send retransmission of provisional response.");
                });
                break;
            case transaction_state_1.TransactionState.Completed:
                // While in the "Completed" state, the server transaction MUST pass the final response to the transport
                // layer for retransmission whenever a retransmission of the request is received. Any other final responses
                // passed by the TU to the server transaction MUST be discarded while in the "Completed" state.
                // https://tools.ietf.org/html/rfc3261#section-17.2.2
                if (!this.lastResponse) {
                    throw new Error("Last response undefined.");
                }
                this.send(this.lastResponse).catch(function (error) {
                    _this.logTransportError(error, "Failed to send retransmission of final response.");
                });
                break;
            case transaction_state_1.TransactionState.Terminated:
                break;
            default:
                throw new Error("Invalid state " + this.state);
        }
    };
    /**
     * Receive responses from TU for this transaction.
     * @param statusCode - Status code of repsonse. 101-199 not allowed per RFC 4320.
     * @param response - Response to send.
     */
    NonInviteServerTransaction.prototype.receiveResponse = function (statusCode, response) {
        var _this = this;
        if (statusCode < 100 || statusCode > 699) {
            throw new Error("Invalid status code " + statusCode);
        }
        // An SIP element MUST NOT send any provisional response with a
        // Status-Code other than 100 to a non-INVITE request.
        // An SIP element MUST NOT respond to a non-INVITE request with a
        // Status-Code of 100 over any unreliable transport, such as UDP,
        // before the amount of time it takes a client transaction's Timer E to be reset to T2.
        // An SIP element MAY respond to a non-INVITE request with a
        // Status-Code of 100 over a reliable transport at any time.
        // https://tools.ietf.org/html/rfc4320#section-4.1
        if (statusCode > 100 && statusCode <= 199) {
            throw new Error("Provisional response other than 100 not allowed.");
        }
        switch (this.state) {
            case transaction_state_1.TransactionState.Trying:
                // While in the "Trying" state, if the TU passes a provisional response
                // to the server transaction, the server transaction MUST enter the "Proceeding" state.
                // The response MUST be passed to the transport layer for transmission.
                // https://tools.ietf.org/html/rfc3261#section-17.2.2
                this.lastResponse = response;
                if (statusCode >= 100 && statusCode < 200) {
                    this.stateTransition(transaction_state_1.TransactionState.Proceeding);
                    this.send(response).catch(function (error) {
                        _this.logTransportError(error, "Failed to send provisional response.");
                    });
                    return;
                }
                if (statusCode >= 200 && statusCode <= 699) {
                    this.stateTransition(transaction_state_1.TransactionState.Completed);
                    this.send(response).catch(function (error) {
                        _this.logTransportError(error, "Failed to send final response.");
                    });
                    return;
                }
                break;
            case transaction_state_1.TransactionState.Proceeding:
                // Any further provisional responses that are received from the TU while
                // in the "Proceeding" state MUST be passed to the transport layer for transmission.
                // If the TU passes a final response (status codes 200-699) to the server while in
                // the "Proceeding" state, the transaction MUST enter the "Completed" state, and
                // the response MUST be passed to the transport layer for transmission.
                // https://tools.ietf.org/html/rfc3261#section-17.2.2
                this.lastResponse = response;
                if (statusCode >= 200 && statusCode <= 699) {
                    this.stateTransition(transaction_state_1.TransactionState.Completed);
                    this.send(response).catch(function (error) {
                        _this.logTransportError(error, "Failed to send final response.");
                    });
                    return;
                }
                break;
            case transaction_state_1.TransactionState.Completed:
                // Any other final responses passed by the TU to the server
                // transaction MUST be discarded while in the "Completed" state.
                // https://tools.ietf.org/html/rfc3261#section-17.2.2
                return;
            case transaction_state_1.TransactionState.Terminated:
                break;
            default:
                throw new Error("Invalid state " + this.state);
        }
        var message = "Non-INVITE server transaction received unexpected " + statusCode + " response from TU while in state " + this.state + ".";
        this.logger.error(message);
        throw new Error(message);
    };
    /**
     * First, the procedures in [4] are followed, which attempt to deliver the response to a backup.
     * If those should all fail, based on the definition of failure in [4], the server transaction SHOULD
     * inform the TU that a failure has occurred, and SHOULD transition to the terminated state.
     * https://tools.ietf.org/html/rfc3261#section-17.2.4
     */
    NonInviteServerTransaction.prototype.onTransportError = function (error) {
        if (this.user.onTransportError) {
            this.user.onTransportError(error);
        }
        this.stateTransition(transaction_state_1.TransactionState.Terminated, true);
    };
    /** For logging. */
    NonInviteServerTransaction.prototype.typeToString = function () {
        return "non-INVITE server transaction";
    };
    NonInviteServerTransaction.prototype.stateTransition = function (newState, dueToTransportError) {
        var _this = this;
        if (dueToTransportError === void 0) { dueToTransportError = false; }
        // Assert valid state transitions.
        var invalidStateTransition = function () {
            throw new Error("Invalid state transition from " + _this.state + " to " + newState);
        };
        switch (newState) {
            case transaction_state_1.TransactionState.Trying:
                invalidStateTransition();
                break;
            case transaction_state_1.TransactionState.Proceeding:
                if (this.state !== transaction_state_1.TransactionState.Trying) {
                    invalidStateTransition();
                }
                break;
            case transaction_state_1.TransactionState.Completed:
                if (this.state !== transaction_state_1.TransactionState.Trying && this.state !== transaction_state_1.TransactionState.Proceeding) {
                    invalidStateTransition();
                }
                break;
            case transaction_state_1.TransactionState.Terminated:
                if (this.state !== transaction_state_1.TransactionState.Proceeding && this.state !== transaction_state_1.TransactionState.Completed) {
                    if (!dueToTransportError) {
                        invalidStateTransition();
                    }
                }
                break;
            default:
                invalidStateTransition();
        }
        // When the server transaction enters the "Completed" state, it MUST set Timer J to fire
        // in 64*T1 seconds for unreliable transports, and zero seconds for reliable transports.
        // https://tools.ietf.org/html/rfc3261#section-17.2.2
        if (newState === transaction_state_1.TransactionState.Completed) {
            this.J = setTimeout(function () { return _this.timer_J(); }, timers_1.Timers.TIMER_J);
        }
        // The server transaction MUST be destroyed the instant it enters the "Terminated" state.
        // https://tools.ietf.org/html/rfc3261#section-17.2.2
        if (newState === transaction_state_1.TransactionState.Terminated) {
            this.dispose();
        }
        this.setState(newState);
    };
    /**
     * The server transaction remains in this state until Timer J fires,
     * at which point it MUST transition to the "Terminated" state.
     * https://tools.ietf.org/html/rfc3261#section-17.2.2
     */
    NonInviteServerTransaction.prototype.timer_J = function () {
        this.logger.debug("Timer J expired for NON-INVITE server transaction " + this.id + ".");
        if (this.state === transaction_state_1.TransactionState.Completed) {
            this.stateTransition(transaction_state_1.TransactionState.Terminated);
        }
    };
    return NonInviteServerTransaction;
}(server_transaction_1.ServerTransaction));
exports.NonInviteServerTransaction = NonInviteServerTransaction;
