"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var exceptions_1 = require("../exceptions");
var messages_1 = require("../messages");
var utils_1 = require("../messages/utils");
var transactions_1 = require("../transactions");
/**
 * User Agent Server (UAS).
 * @remarks
 * A user agent server is a logical entity
 * that generates a response to a SIP request.  The response
 * accepts, rejects, or redirects the request.  This role lasts
 * only for the duration of that transaction.  In other words, if
 * a piece of software responds to a request, it acts as a UAS for
 * the duration of that transaction.  If it generates a request
 * later, it assumes the role of a user agent client for the
 * processing of that transaction.
 * https://tools.ietf.org/html/rfc3261#section-6
 * @public
 */
var UserAgentServer = /** @class */ (function () {
    function UserAgentServer(transactionConstructor, core, message, delegate) {
        this.transactionConstructor = transactionConstructor;
        this.core = core;
        this.message = message;
        this.delegate = delegate;
        this.logger = this.loggerFactory.getLogger("sip.user-agent-server");
        this.toTag = message.toTag ? message.toTag : utils_1.newTag();
        this.init();
    }
    UserAgentServer.prototype.dispose = function () {
        this.transaction.dispose();
    };
    Object.defineProperty(UserAgentServer.prototype, "loggerFactory", {
        get: function () {
            return this.core.loggerFactory;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(UserAgentServer.prototype, "transaction", {
        /** The transaction associated with this request. */
        get: function () {
            if (!this._transaction) {
                throw new Error("Transaction undefined.");
            }
            return this._transaction;
        },
        enumerable: true,
        configurable: true
    });
    UserAgentServer.prototype.accept = function (options) {
        if (options === void 0) { options = { statusCode: 200 }; }
        if (!this.acceptable) {
            throw new exceptions_1.TransactionStateError(this.message.method + " not acceptable in state " + this.transaction.state + ".");
        }
        var statusCode = options.statusCode;
        if (statusCode < 200 || statusCode > 299) {
            throw new TypeError("Invalid statusCode: " + statusCode);
        }
        var response = this.reply(options);
        return response;
    };
    UserAgentServer.prototype.progress = function (options) {
        if (options === void 0) { options = { statusCode: 180 }; }
        if (!this.progressable) {
            throw new exceptions_1.TransactionStateError(this.message.method + " not progressable in state " + this.transaction.state + ".");
        }
        var statusCode = options.statusCode;
        if (statusCode < 101 || statusCode > 199) {
            throw new TypeError("Invalid statusCode: " + statusCode);
        }
        var response = this.reply(options);
        return response;
    };
    UserAgentServer.prototype.redirect = function (contacts, options) {
        if (options === void 0) { options = { statusCode: 302 }; }
        if (!this.redirectable) {
            throw new exceptions_1.TransactionStateError(this.message.method + " not redirectable in state " + this.transaction.state + ".");
        }
        var statusCode = options.statusCode;
        if (statusCode < 300 || statusCode > 399) {
            throw new TypeError("Invalid statusCode: " + statusCode);
        }
        var contactHeaders = new Array();
        contacts.forEach(function (contact) { return contactHeaders.push("Contact: " + contact.toString()); });
        options.extraHeaders = (options.extraHeaders || []).concat(contactHeaders);
        var response = this.reply(options);
        return response;
    };
    UserAgentServer.prototype.reject = function (options) {
        if (options === void 0) { options = { statusCode: 480 }; }
        if (!this.rejectable) {
            throw new exceptions_1.TransactionStateError(this.message.method + " not rejectable in state " + this.transaction.state + ".");
        }
        var statusCode = options.statusCode;
        if (statusCode < 400 || statusCode > 699) {
            throw new TypeError("Invalid statusCode: " + statusCode);
        }
        var response = this.reply(options);
        return response;
    };
    UserAgentServer.prototype.trying = function (options) {
        if (!this.tryingable) {
            throw new exceptions_1.TransactionStateError(this.message.method + " not tryingable in state " + this.transaction.state + ".");
        }
        var response = this.reply({ statusCode: 100 });
        return response;
    };
    /**
     * If the UAS did not find a matching transaction for the CANCEL
     * according to the procedure above, it SHOULD respond to the CANCEL
     * with a 481 (Call Leg/Transaction Does Not Exist).  If the transaction
     * for the original request still exists, the behavior of the UAS on
     * receiving a CANCEL request depends on whether it has already sent a
     * final response for the original request.  If it has, the CANCEL
     * request has no effect on the processing of the original request, no
     * effect on any session state, and no effect on the responses generated
     * for the original request.  If the UAS has not issued a final response
     * for the original request, its behavior depends on the method of the
     * original request.  If the original request was an INVITE, the UAS
     * SHOULD immediately respond to the INVITE with a 487 (Request
     * Terminated).  A CANCEL request has no impact on the processing of
     * transactions with any other method defined in this specification.
     * https://tools.ietf.org/html/rfc3261#section-9.2
     * @param request - Incoming CANCEL request.
     */
    UserAgentServer.prototype.receiveCancel = function (message) {
        // Note: Currently CANCEL is being handled as a special case.
        // No UAS is created to handle the CANCEL and the response to
        // it CANCEL is being handled statelessly by the user agent core.
        // As such, there is currently no way to externally impact the
        // response to the a CANCEL request.
        if (this.delegate && this.delegate.onCancel) {
            this.delegate.onCancel(message);
        }
    };
    Object.defineProperty(UserAgentServer.prototype, "acceptable", {
        get: function () {
            if (this.transaction instanceof transactions_1.InviteServerTransaction) {
                return (this.transaction.state === transactions_1.TransactionState.Proceeding ||
                    this.transaction.state === transactions_1.TransactionState.Accepted);
            }
            if (this.transaction instanceof transactions_1.NonInviteServerTransaction) {
                return (this.transaction.state === transactions_1.TransactionState.Trying ||
                    this.transaction.state === transactions_1.TransactionState.Proceeding);
            }
            throw new Error("Unknown transaction type.");
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(UserAgentServer.prototype, "progressable", {
        get: function () {
            if (this.transaction instanceof transactions_1.InviteServerTransaction) {
                return this.transaction.state === transactions_1.TransactionState.Proceeding;
            }
            if (this.transaction instanceof transactions_1.NonInviteServerTransaction) {
                return false; // https://tools.ietf.org/html/rfc4320#section-4.1
            }
            throw new Error("Unknown transaction type.");
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(UserAgentServer.prototype, "redirectable", {
        get: function () {
            if (this.transaction instanceof transactions_1.InviteServerTransaction) {
                return this.transaction.state === transactions_1.TransactionState.Proceeding;
            }
            if (this.transaction instanceof transactions_1.NonInviteServerTransaction) {
                return (this.transaction.state === transactions_1.TransactionState.Trying ||
                    this.transaction.state === transactions_1.TransactionState.Proceeding);
            }
            throw new Error("Unknown transaction type.");
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(UserAgentServer.prototype, "rejectable", {
        get: function () {
            if (this.transaction instanceof transactions_1.InviteServerTransaction) {
                return this.transaction.state === transactions_1.TransactionState.Proceeding;
            }
            if (this.transaction instanceof transactions_1.NonInviteServerTransaction) {
                return (this.transaction.state === transactions_1.TransactionState.Trying ||
                    this.transaction.state === transactions_1.TransactionState.Proceeding);
            }
            throw new Error("Unknown transaction type.");
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(UserAgentServer.prototype, "tryingable", {
        get: function () {
            if (this.transaction instanceof transactions_1.InviteServerTransaction) {
                return this.transaction.state === transactions_1.TransactionState.Proceeding;
            }
            if (this.transaction instanceof transactions_1.NonInviteServerTransaction) {
                return this.transaction.state === transactions_1.TransactionState.Trying;
            }
            throw new Error("Unknown transaction type.");
        },
        enumerable: true,
        configurable: true
    });
    /**
     * When a UAS wishes to construct a response to a request, it follows
     * the general procedures detailed in the following subsections.
     * Additional behaviors specific to the response code in question, which
     * are not detailed in this section, may also be required.
     *
     * Once all procedures associated with the creation of a response have
     * been completed, the UAS hands the response back to the server
     * transaction from which it received the request.
     * https://tools.ietf.org/html/rfc3261#section-8.2.6
     * @param statusCode - Status code to reply with.
     * @param options - Reply options bucket.
     */
    UserAgentServer.prototype.reply = function (options) {
        if (!options.toTag && options.statusCode !== 100) {
            options.toTag = this.toTag;
        }
        options.userAgent = options.userAgent || this.core.configuration.userAgentHeaderFieldValue;
        options.supported = options.supported || this.core.configuration.supportedOptionTagsResponse;
        var response = messages_1.constructOutgoingResponse(this.message, options);
        this.transaction.receiveResponse(options.statusCode, response.message);
        return response;
    };
    UserAgentServer.prototype.init = function () {
        var _this = this;
        // We are the transaction user.
        var user = {
            loggerFactory: this.loggerFactory,
            onStateChange: function (newState) {
                if (newState === transactions_1.TransactionState.Terminated) {
                    // Remove the terminated transaction from the core.
                    _this.core.userAgentServers.delete(userAgentServerId);
                    _this.dispose();
                }
            },
            onTransportError: function (error) {
                _this.logger.error(error.message);
                if (_this.delegate && _this.delegate.onTransportError) {
                    _this.delegate.onTransportError(error);
                }
                else {
                    _this.logger.error("User agent server response transport error.");
                }
            }
        };
        // Create a new transaction with us as the user.
        var transaction = new this.transactionConstructor(this.message, this.core.transport, user);
        this._transaction = transaction;
        // Add the new transaction to the core.
        var userAgentServerId = transaction.id;
        this.core.userAgentServers.set(transaction.id, this);
    };
    return UserAgentServer;
}());
exports.UserAgentServer = UserAgentServer;
