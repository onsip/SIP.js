"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var timers_1 = require("../timers");
var client_transaction_1 = require("./client-transaction");
var transaction_state_1 = require("./transaction-state");
/**
 * Non-INVITE Client Transaction.
 * @remarks
 * Non-INVITE transactions do not make use of ACK.
 * They are simple request-response interactions.
 * https://tools.ietf.org/html/rfc3261#section-17.1.2
 * @public
 */
var NonInviteClientTransaction = /** @class */ (function (_super) {
    tslib_1.__extends(NonInviteClientTransaction, _super);
    /**
     * Constructor
     * Upon construction, the outgoing request's Via header is updated by calling `setViaHeader`.
     * Then `toString` is called on the outgoing request and the message is sent via the transport.
     * After construction the transaction will be in the "calling" state and the transaction id
     * will equal the branch parameter set in the Via header of the outgoing request.
     * https://tools.ietf.org/html/rfc3261#section-17.1.2
     * @param request - The outgoing Non-INVITE request.
     * @param transport - The transport.
     * @param user - The transaction user.
     */
    function NonInviteClientTransaction(request, transport, user) {
        var _this = _super.call(this, request, transport, user, transaction_state_1.TransactionState.Trying, "sip.transaction.nict") || this;
        // FIXME: Timer E for unreliable transports not implemented.
        //
        // The "Trying" state is entered when the TU initiates a new client
        // transaction with a request.  When entering this state, the client
        // transaction SHOULD set timer F to fire in 64*T1 seconds. The request
        // MUST be passed to the transport layer for transmission.
        // https://tools.ietf.org/html/rfc3261#section-17.1.2.2
        _this.F = setTimeout(function () { return _this.timer_F(); }, timers_1.Timers.TIMER_F);
        _this.send(request.toString()).catch(function (error) {
            _this.logTransportError(error, "Failed to send initial outgoing request.");
        });
        return _this;
    }
    /**
     * Destructor.
     */
    NonInviteClientTransaction.prototype.dispose = function () {
        if (this.F) {
            clearTimeout(this.F);
            this.F = undefined;
        }
        if (this.K) {
            clearTimeout(this.K);
            this.K = undefined;
        }
        _super.prototype.dispose.call(this);
    };
    Object.defineProperty(NonInviteClientTransaction.prototype, "kind", {
        /** Transaction kind. Deprecated. */
        get: function () {
            return "nict";
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Handler for incoming responses from the transport which match this transaction.
     * @param response - The incoming response.
     */
    NonInviteClientTransaction.prototype.receiveResponse = function (response) {
        var statusCode = response.statusCode;
        if (!statusCode || statusCode < 100 || statusCode > 699) {
            throw new Error("Invalid status code " + statusCode);
        }
        switch (this.state) {
            case transaction_state_1.TransactionState.Trying:
                // If a provisional response is received while in the "Trying" state, the
                // response MUST be passed to the TU, and then the client transaction
                // SHOULD move to the "Proceeding" state.
                // https://tools.ietf.org/html/rfc3261#section-17.1.2.2
                if (statusCode >= 100 && statusCode <= 199) {
                    this.stateTransition(transaction_state_1.TransactionState.Proceeding);
                    if (this.user.receiveResponse) {
                        this.user.receiveResponse(response);
                    }
                    return;
                }
                // If a final response (status codes 200-699) is received while in the
                // "Trying" state, the response MUST be passed to the TU, and the
                // client transaction MUST transition to the "Completed" state.
                // https://tools.ietf.org/html/rfc3261#section-17.1.2.2
                if (statusCode >= 200 && statusCode <= 699) {
                    this.stateTransition(transaction_state_1.TransactionState.Completed);
                    if (statusCode === 408) {
                        this.onRequestTimeout();
                        return;
                    }
                    if (this.user.receiveResponse) {
                        this.user.receiveResponse(response);
                    }
                    return;
                }
                break;
            case transaction_state_1.TransactionState.Proceeding:
                // If a provisional response is received while in the "Proceeding" state,
                // the response MUST be passed to the TU. (From Figure 6)
                // https://tools.ietf.org/html/rfc3261#section-17.1.2.2
                if (statusCode >= 100 && statusCode <= 199) {
                    if (this.user.receiveResponse) {
                        return this.user.receiveResponse(response);
                    }
                }
                // If a final response (status codes 200-699) is received while in the
                // "Proceeding" state, the response MUST be passed to the TU, and the
                // client transaction MUST transition to the "Completed" state.
                // https://tools.ietf.org/html/rfc3261#section-17.1.2.2
                if (statusCode >= 200 && statusCode <= 699) {
                    this.stateTransition(transaction_state_1.TransactionState.Completed);
                    if (statusCode === 408) {
                        this.onRequestTimeout();
                        return;
                    }
                    if (this.user.receiveResponse) {
                        this.user.receiveResponse(response);
                    }
                    return;
                }
            case transaction_state_1.TransactionState.Completed:
                // The "Completed" state exists to buffer any additional response
                // retransmissions that may be received (which is why the client
                // transaction remains there only for unreliable transports).
                // https://tools.ietf.org/html/rfc3261#section-17.1.2.2
                return;
            case transaction_state_1.TransactionState.Terminated:
                // For good measure just absorb additional response retransmissions.
                return;
            default:
                throw new Error("Invalid state " + this.state);
        }
        var message = "Non-INVITE client transaction received unexpected " + statusCode + " response while in state " + this.state + ".";
        this.logger.warn(message);
        return;
    };
    /**
     * The client transaction SHOULD inform the TU that a transport failure has occurred,
     * and the client transaction SHOULD transition directly to the "Terminated" state.
     * The TU will handle the failover mechanisms described in [4].
     * https://tools.ietf.org/html/rfc3261#section-17.1.4
     * @param error - Trasnsport error
     */
    NonInviteClientTransaction.prototype.onTransportError = function (error) {
        if (this.user.onTransportError) {
            this.user.onTransportError(error);
        }
        this.stateTransition(transaction_state_1.TransactionState.Terminated, true);
    };
    /** For logging. */
    NonInviteClientTransaction.prototype.typeToString = function () {
        return "non-INVITE client transaction";
    };
    /**
     * Execute a state transition.
     * @param newState - New state.
     */
    NonInviteClientTransaction.prototype.stateTransition = function (newState, dueToTransportError) {
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
                if (this.state !== transaction_state_1.TransactionState.Trying &&
                    this.state !== transaction_state_1.TransactionState.Proceeding) {
                    invalidStateTransition();
                }
                break;
            case transaction_state_1.TransactionState.Terminated:
                if (this.state !== transaction_state_1.TransactionState.Trying &&
                    this.state !== transaction_state_1.TransactionState.Proceeding &&
                    this.state !== transaction_state_1.TransactionState.Completed) {
                    if (!dueToTransportError) {
                        invalidStateTransition();
                    }
                }
                break;
            default:
                invalidStateTransition();
        }
        // Once the client transaction enters the "Completed" state, it MUST set
        // Timer K to fire in T4 seconds for unreliable transports, and zero
        // seconds for reliable transports  The "Completed" state exists to
        // buffer any additional response retransmissions that may be received
        // (which is why the client transaction remains there only for unreliable transports).
        // https://tools.ietf.org/html/rfc3261#section-17.1.2.2
        if (newState === transaction_state_1.TransactionState.Completed) {
            if (this.F) {
                clearTimeout(this.F);
                this.F = undefined;
            }
            this.K = setTimeout(function () { return _this.timer_K(); }, timers_1.Timers.TIMER_K);
        }
        // Once the transaction is in the terminated state, it MUST be destroyed immediately.
        // https://tools.ietf.org/html/rfc3261#section-17.1.2.2
        if (newState === transaction_state_1.TransactionState.Terminated) {
            this.dispose();
        }
        // Update state.
        this.setState(newState);
    };
    /**
     * If Timer F fires while the client transaction is still in the
     * "Trying" state, the client transaction SHOULD inform the TU about the
     * timeout, and then it SHOULD enter the "Terminated" state.
     * If timer F fires while in the "Proceeding" state, the TU MUST be informed of
     * a timeout, and the client transaction MUST transition to the terminated state.
     * https://tools.ietf.org/html/rfc3261#section-17.1.2.2
     */
    NonInviteClientTransaction.prototype.timer_F = function () {
        this.logger.debug("Timer F expired for non-INVITE client transaction " + this.id + ".");
        if (this.state === transaction_state_1.TransactionState.Trying || this.state === transaction_state_1.TransactionState.Proceeding) {
            this.onRequestTimeout();
            this.stateTransition(transaction_state_1.TransactionState.Terminated);
        }
    };
    /**
     * If Timer K fires while in this (COMPLETED) state, the client transaction
     * MUST transition to the "Terminated" state.
     * https://tools.ietf.org/html/rfc3261#section-17.1.2.2
     */
    NonInviteClientTransaction.prototype.timer_K = function () {
        if (this.state === transaction_state_1.TransactionState.Completed) {
            this.stateTransition(transaction_state_1.TransactionState.Terminated);
        }
    };
    return NonInviteClientTransaction;
}(client_transaction_1.ClientTransaction));
exports.NonInviteClientTransaction = NonInviteClientTransaction;
