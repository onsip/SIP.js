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
var ClientContext_1 = require("./ClientContext");
var Constants_1 = require("./Constants");
var DigestAuthentication_1 = require("./DigestAuthentication");
var Enums_1 = require("./Enums");
var Exceptions_1 = require("./Exceptions");
var Grammar_1 = require("./Grammar");
var LoggerFactory_1 = require("./LoggerFactory");
var Parser_1 = require("./Parser");
var PublishContext_1 = require("./PublishContext");
var RegisterContext_1 = require("./RegisterContext");
var SanityCheck_1 = require("./SanityCheck");
var ServerContext_1 = require("./ServerContext");
var Session_1 = require("./Session");
var SIPMessage_1 = require("./SIPMessage");
var Subscription_1 = require("./Subscription");
var Transactions_1 = require("./Transactions");
var URI_1 = require("./URI");
var Utils_1 = require("./Utils");
var SessionDescriptionHandler_1 = require("./Web/SessionDescriptionHandler");
var Transport_1 = require("./Web/Transport");
var environment = global.window || global;
/**
 * @class Class creating a SIP User Agent.
 * @param {function returning SIP.sessionDescriptionHandler} [configuration.sessionDescriptionHandlerFactory]
 *  A function will be invoked by each of the UA's Sessions to build the sessionDescriptionHandler for that Session.
 *  If no (or a falsy) value is provided, each Session will use a default (WebRTC) sessionDescriptionHandler.
 */
var UA = /** @class */ (function (_super) {
    __extends(UA, _super);
    function UA(configuration) {
        var _this = _super.call(this) || this;
        _this.type = Enums_1.TypeStrings.UA;
        _this.log = new LoggerFactory_1.LoggerFactory();
        _this.logger = _this.getLogger("sip.ua");
        _this.cache = {
            credentials: {}
        };
        _this.configuration = {};
        _this.dialogs = {};
        // User actions outside any session/dialog (MESSAGE)
        _this.applicants = {};
        _this.data = {};
        _this.sessions = {};
        _this.subscriptions = {};
        _this.earlySubscriptions = {};
        _this.publishers = {};
        _this.status = Enums_1.UAStatus.STATUS_INIT;
        _this.transactions = {
            nist: {},
            nict: {},
            ist: {},
            ict: {}
        };
        /**
         * Load configuration
         *
         * @throws {SIP.Exceptions.ConfigurationError}
         * @throws {TypeError}
         */
        if (configuration === undefined) {
            configuration = {};
        }
        else if (typeof configuration === "string" || configuration instanceof String) {
            configuration = {
                uri: configuration
            };
        }
        // Apply log configuration if present
        if (configuration.log) {
            if (configuration.log.hasOwnProperty("builtinEnabled")) {
                _this.log.builtinEnabled = configuration.log.builtinEnabled;
            }
            if (configuration.log.hasOwnProperty("connector")) {
                _this.log.connector = configuration.log.connector;
            }
            if (configuration.log.hasOwnProperty("level")) {
                var level = configuration.log.level;
                var normalized = typeof level === "string" ? LoggerFactory_1.Levels[level] : level;
                // avoid setting level when invalid, use default level instead
                if (!normalized) {
                    _this.logger.error("Invalid \"level\" parameter value: " + JSON.stringify(level));
                }
                else {
                    _this.log.level = normalized;
                }
            }
        }
        try {
            _this.loadConfig(configuration);
        }
        catch (e) {
            _this.status = Enums_1.UAStatus.STATUS_NOT_READY;
            _this.error = UA.C.CONFIGURATION_ERROR;
            throw e;
        }
        // Initialize registerContext
        _this.registerContext = new RegisterContext_1.RegisterContext(_this, configuration.registerOptions);
        _this.registerContext.on("failed", _this.emit.bind(_this, "registrationFailed"));
        _this.registerContext.on("registered", _this.emit.bind(_this, "registered"));
        _this.registerContext.on("unregistered", _this.emit.bind(_this, "unregistered"));
        if (_this.configuration.autostart) {
            _this.start();
        }
        return _this;
    }
    Object.defineProperty(UA.prototype, "transactionsCount", {
        get: function () {
            var count = 0;
            for (var _i = 0, _a = ["nist", "nict", "ist", "ict"]; _i < _a.length; _i++) {
                var type = _a[_i];
                count += Object.keys(this.transactions[type]).length;
            }
            return count;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(UA.prototype, "nictTransactionsCount", {
        get: function () {
            return Object.keys(this.transactions.nict).length;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(UA.prototype, "nistTransactionsCount", {
        get: function () {
            return Object.keys(this.transactions.nist).length;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(UA.prototype, "ictTransactionsCount", {
        get: function () {
            return Object.keys(this.transactions.ict).length;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(UA.prototype, "istTransactionsCount", {
        get: function () {
            return Object.keys(this.transactions.ist).length;
        },
        enumerable: true,
        configurable: true
    });
    // =================
    //  High Level API
    // =================
    UA.prototype.register = function (options) {
        if (options === void 0) { options = {}; }
        if (options.register) {
            this.configuration.register = true;
        }
        this.registerContext.register(options);
        return this;
    };
    /**
     * Unregister.
     *
     * @param {Boolean} [all] unregister all user bindings.
     *
     */
    UA.prototype.unregister = function (options) {
        var _this = this;
        this.configuration.register = false;
        if (this.transport) {
            this.transport.afterConnected(function () {
                _this.registerContext.unregister(options);
            });
        }
        return this;
    };
    UA.prototype.isRegistered = function () {
        return this.registerContext.registered;
    };
    /**
     * Make an outgoing call.
     *
     * @param {String} target
     * @param {Object} views
     * @param {Object} [options.media] gets passed to SIP.sessionDescriptionHandler.getDescription as mediaHint
     *
     * @throws {TypeError}
     *
     */
    UA.prototype.invite = function (target, options, modifiers) {
        var _this = this;
        var context = new Session_1.InviteClientContext(this, target, options, modifiers);
        // Delay sending actual invite until the next 'tick' if we are already
        // connected, so that API consumers can register to events fired by the
        // the session.
        if (this.transport) {
            this.transport.afterConnected(function () {
                context.invite();
                _this.emit("inviteSent", context);
            });
        }
        return context;
    };
    UA.prototype.subscribe = function (target, event, options) {
        var sub = new Subscription_1.Subscription(this, target, event, options);
        if (this.transport) {
            this.transport.afterConnected(function () { return sub.subscribe(); });
        }
        return sub;
    };
    /**
     * Send PUBLISH Event State Publication (RFC3903)
     *
     * @param {String} target
     * @param {String} event
     * @param {String} body
     * @param {Object} [options]
     *
     * @throws {SIP.Exceptions.MethodParameterError}
     */
    UA.prototype.publish = function (target, event, body, options) {
        var pub = new PublishContext_1.PublishContext(this, target, event, options);
        if (this.transport) {
            this.transport.afterConnected(function () {
                pub.publish(body);
            });
        }
        return pub;
    };
    /**
     * Send a message.
     *
     * @param {String} target
     * @param {String} body
     * @param {Object} [options]
     *
     * @throws {TypeError}
     */
    UA.prototype.message = function (target, body, options) {
        if (options === void 0) { options = {}; }
        if (body === undefined) {
            throw new TypeError("Not enough arguments");
        }
        // There is no Message module, so it is okay that the UA handles defaults here.
        options.contentType = options.contentType || "text/plain";
        options.body = body;
        return this.request(Constants_1.C.MESSAGE, target, options);
    };
    UA.prototype.request = function (method, target, options) {
        var req = new ClientContext_1.ClientContext(this, method, target, options);
        if (this.transport) {
            this.transport.afterConnected(function () { return req.send(); });
        }
        return req;
    };
    /**
     * Gracefully close.
     */
    UA.prototype.stop = function () {
        var _this = this;
        this.logger.log("user requested closure...");
        if (this.status === Enums_1.UAStatus.STATUS_USER_CLOSED) {
            this.logger.warn("UA already closed");
            return this;
        }
        // Close registerContext
        this.logger.log("closing registerContext");
        this.registerContext.close();
        // Run  _terminate_ on every Session
        for (var session in this.sessions) {
            if (this.sessions[session]) {
                this.logger.log("closing session " + session);
                this.sessions[session].terminate();
            }
        }
        // Run _close_ on every confirmed Subscription
        for (var subscription in this.subscriptions) {
            if (this.subscriptions[subscription]) {
                this.logger.log("unsubscribing from subscription " + subscription);
                this.subscriptions[subscription].close();
            }
        }
        // Run _close_ on every early Subscription
        for (var earlySubscription in this.earlySubscriptions) {
            if (this.earlySubscriptions[earlySubscription]) {
                this.logger.log("unsubscribing from early subscription " + earlySubscription);
                this.earlySubscriptions[earlySubscription].close();
            }
        }
        // Run _close_ on every Publisher
        for (var publisher in this.publishers) {
            if (this.publishers[publisher]) {
                this.logger.log("unpublish " + publisher);
                this.publishers[publisher].close();
            }
        }
        // Run  _close_ on every applicant
        for (var applicant in this.applicants) {
            if (this.applicants[applicant]) {
                this.applicants[applicant].close();
            }
        }
        this.status = Enums_1.UAStatus.STATUS_USER_CLOSED;
        /*
         * If the remaining transactions are all INVITE transactions, there is no need to
         * wait anymore because every session has already been closed by this method.
         * - locally originated sessions where terminated (CANCEL or BYE)
         * - remotely originated sessions where rejected (4XX) or terminated (BYE)
         * Remaining INVITE transactions belong tho sessions that where answered. This are in
         * 'accepted' state due to timers 'L' and 'M' defined in [RFC 6026]
         */
        if (this.nistTransactionsCount === 0 && this.nictTransactionsCount === 0 && this.transport) {
            this.transport.disconnect();
        }
        else {
            var transactionsListener_1 = function () {
                if (_this.nistTransactionsCount === 0 && _this.nictTransactionsCount === 0) {
                    _this.removeListener("transactionDestroyed", transactionsListener_1);
                    if (_this.transport) {
                        _this.transport.disconnect();
                    }
                }
            };
            this.on("transactionDestroyed", transactionsListener_1);
        }
        if (typeof environment.removeEventListener === "function") {
            // Google Chrome Packaged Apps don't allow 'unload' listeners:
            // unload is not available in packaged apps
            if (!(global.chrome && global.chrome.app && global.chrome.app.runtime)) {
                environment.removeEventListener("unload", this.environListener);
            }
        }
        return this;
    };
    /**
     * Connect to the WS server if status = STATUS_INIT.
     * Resume UA after being closed.
     *
     */
    UA.prototype.start = function () {
        var _this = this;
        this.logger.log("user requested startup...");
        if (this.status === Enums_1.UAStatus.STATUS_INIT) {
            this.status = Enums_1.UAStatus.STATUS_STARTING;
            if (!this.configuration.transportConstructor) {
                throw new Exceptions_1.Exceptions.TransportError("Transport constructor not set");
            }
            this.transport = new this.configuration.transportConstructor(this.getLogger("sip.transport"), this.configuration.transportOptions);
            this.setTransportListeners();
            this.emit("transportCreated", this.transport);
            this.transport.connect();
        }
        else if (this.status === Enums_1.UAStatus.STATUS_USER_CLOSED) {
            this.logger.log("resuming");
            this.status = Enums_1.UAStatus.STATUS_READY;
            if (this.transport) {
                this.transport.connect();
            }
        }
        else if (this.status === Enums_1.UAStatus.STATUS_STARTING) {
            this.logger.log("UA is in STARTING status, not opening new connection");
        }
        else if (this.status === Enums_1.UAStatus.STATUS_READY) {
            this.logger.log("UA is in READY status, not resuming");
        }
        else {
            this.logger.error("Connection is down. Auto-Recovery system is trying to connect");
        }
        if (this.configuration.autostop && typeof environment.addEventListener === "function") {
            // Google Chrome Packaged Apps don't allow 'unload' listeners:
            // unload is not available in packaged apps
            if (!(global.chrome && global.chrome.app && global.chrome.app.runtime)) {
                this.environListener = this.stop;
                environment.addEventListener("unload", function () { return _this.environListener(); });
            }
        }
        return this;
    };
    /**
     * Normalize a string into a valid SIP request URI
     *
     * @param {String} target
     *
     * @returns {SIP.URI|undefined}
     */
    UA.prototype.normalizeTarget = function (target) {
        return Utils_1.Utils.normalizeTarget(target, this.configuration.hostportParams);
    };
    UA.prototype.getLogger = function (category, label) {
        return this.log.getLogger(category, label);
    };
    UA.prototype.getLoggerFactory = function () {
        return this.log;
    };
    // TODO: Transaction matching currently works circumstanially.
    //
    // 17.1.3 Matching Responses to Client Transactions
    //
    // When the transport layer in the client receives a response, it has to
    // determine which client transaction will handle the response, so that
    // the processing of Sections 17.1.1 and 17.1.2 can take place.  The
    // branch parameter in the top Via header field is used for this
    // purpose.  A response matches a client transaction under two
    // conditions:
    //
    //    1.  If the response has the same value of the branch parameter in
    //        the top Via header field as the branch parameter in the top
    //        Via header field of the request that created the transaction.
    //
    //    2.  If the method parameter in the CSeq header field matches the
    //        method of the request that created the transaction.  The
    //        method is needed since a CANCEL request constitutes a
    //        different transaction, but shares the same value of the branch
    //        parameter.
    /**
     * new Transaction
     * @private
     * @param {SIP.Transaction} transaction.
     */
    UA.prototype.newTransaction = function (transaction) {
        this.transactions[transaction.kind][transaction.id] = transaction;
        this.emit("newTransaction", { transaction: transaction });
    };
    /**
     * destroy Transaction
     * @param {SIP.Transaction} transaction.
     */
    UA.prototype.destroyTransaction = function (transaction) {
        delete this.transactions[transaction.kind][transaction.id];
        this.emit("transactionDestroyed", { transaction: transaction });
    };
    /**
     * Get the session to which the request belongs to, if any.
     * @param {SIP.IncomingRequest} request.
     * @returns {SIP.OutgoingSession|SIP.IncomingSession|undefined}
     */
    UA.prototype.findSession = function (request) {
        return this.sessions[request.callId + request.fromTag] ||
            this.sessions[request.callId + request.toTag] ||
            undefined;
    };
    // ===============================
    //  Private (For internal use)
    // ===============================
    UA.prototype.saveCredentials = function (credentials) {
        this.cache.credentials[credentials.realm] = this.cache.credentials[credentials.realm] || {};
        this.cache.credentials[credentials.realm][credentials.uri] = credentials;
        return this;
    };
    UA.prototype.getCredentials = function (request) {
        var realm = request.ruri.type === Enums_1.TypeStrings.URI ? request.ruri.host : "";
        if (realm && this.cache.credentials[realm] && this.cache.credentials[realm][request.ruri.toString()]) {
            var credentials = this.cache.credentials[realm][request.ruri.toString()];
            credentials.method = request.method;
            return credentials;
        }
    };
    // ==============================
    // Event Handlers
    // ==============================
    UA.prototype.onTransportError = function () {
        if (this.status === Enums_1.UAStatus.STATUS_USER_CLOSED) {
            return;
        }
        if (!this.error || this.error !== UA.C.NETWORK_ERROR) {
            this.status = Enums_1.UAStatus.STATUS_NOT_READY;
            this.error = UA.C.NETWORK_ERROR;
        }
    };
    /**
     * Helper function. Sets transport listeners
     */
    UA.prototype.setTransportListeners = function () {
        var _this = this;
        if (this.transport) {
            this.transport.on("connected", function () { return _this.onTransportConnected(); });
            this.transport.on("message", function (message) { return _this.onTransportReceiveMsg(message); });
            this.transport.on("transportError", function () { return _this.onTransportError(); });
        }
    };
    /**
     * Transport connection event.
     * @event
     * @param {SIP.Transport} transport.
     */
    UA.prototype.onTransportConnected = function () {
        var _this = this;
        if (this.configuration.register) {
            // In an effor to maintain behavior from when we "initialized" an
            // authentication factory, this is in a Promise.then
            Promise.resolve().then(function () { return _this.registerContext.register(); });
        }
    };
    /**
     * Handle SIP message received from the transport.
     * @param messageString The message.
     */
    UA.prototype.onTransportReceiveMsg = function (messageString) {
        var message = Parser_1.Parser.parseMessage(messageString, this);
        if (!message) {
            this.logger.warn("UA failed to parse incoming SIP message - discarding.");
            return;
        }
        if (this.status === Enums_1.UAStatus.STATUS_USER_CLOSED && message instanceof SIPMessage_1.IncomingRequest) {
            this.logger.warn("UA received message when status = USER_CLOSED - aborting");
            return;
        }
        if (!this.transport) {
            this.logger.warn("UA received message without transport - aborting");
            return;
        }
        if (!SanityCheck_1.SanityCheck.sanityCheck(message, this, this.transport)) {
            return;
        }
        if (message instanceof SIPMessage_1.IncomingRequest) {
            this.receiveRequestFromTransport(message);
            return;
        }
        if (message instanceof SIPMessage_1.IncomingResponse) {
            this.receiveResponseFromTransport(message);
            return;
        }
        throw new Error("Invalid message type.");
    };
    UA.prototype.receiveRequestFromTransport = function (request) {
        // FIXME: Bad hack. SIPMessage needs refactor.
        request.transport = this.transport;
        // FIXME: Configuration URI is a bad mix of tyes currently and needs to exist.
        if (!(this.configuration.uri instanceof URI_1.URI)) {
            throw new Error("Configuration URI not instance of URI.");
        }
        // FIXME: A request should always have an ruri
        if (!request.ruri) {
            throw new Error("Request ruri undefined.");
        }
        // If the Request-URI uses a scheme not supported by the UAS, it SHOULD
        // reject the request with a 416 (Unsupported URI Scheme) response.
        // https://tools.ietf.org/html/rfc3261#section-8.2.2.1
        if (request.ruri.scheme !== Constants_1.C.SIP) {
            request.reply_sl(416);
            return;
        }
        // If the Request-URI does not identify an address that the
        // UAS is willing to accept requests for, it SHOULD reject
        // the request with a 404 (Not Found) response.
        // https://tools.ietf.org/html/rfc3261#section-8.2.2.1
        var ruri = request.ruri;
        var ruriMatches = function (uri) {
            return !!uri && uri.user === ruri.user;
        };
        if (!ruriMatches(this.configuration.uri) &&
            !(ruriMatches(this.contact.uri) || ruriMatches(this.contact.pubGruu) || ruriMatches(this.contact.tempGruu))) {
            this.logger.warn("Request-URI does not point to us");
            if (request.method !== Constants_1.C.ACK) {
                request.reply_sl(404);
            }
            return;
        }
        // When a request is received from the network by the server, it has to
        // be matched to an existing transaction.  This is accomplished in the
        // following manner.
        //
        // The branch parameter in the topmost Via header field of the request
        // is examined.  If it is present and begins with the magic cookie
        // "z9hG4bK", the request was generated by a client transaction
        // compliant to this specification.  Therefore, the branch parameter
        // will be unique across all transactions sent by that client.  The
        // request matches a transaction if:
        //
        //    1. the branch parameter in the request is equal to the one in the
        //       top Via header field of the request that created the
        //       transaction, and
        //
        //    2. the sent-by value in the top Via of the request is equal to the
        //       one in the request that created the transaction, and
        //
        //    3. the method of the request matches the one that created the
        //       transaction, except for ACK, where the method of the request
        //       that created the transaction is INVITE.
        //
        // This matching rule applies to both INVITE and non-INVITE transactions
        // alike.
        //
        //    The sent-by value is used as part of the matching process because
        //    there could be accidental or malicious duplication of branch
        //    parameters from different clients.
        // https://tools.ietf.org/html/rfc3261#section-17.2.3
        // FIXME: The current transaction layer curently only matches on branch parameter.
        // Request matches branch parameter of an existing invite server transaction.
        var ist = this.transactions.ist[request.viaBranch];
        // Request matches branch parameter of an existing non-invite server transaction.
        var nist = this.transactions.nist[request.viaBranch];
        // The CANCEL method requests that the TU at the server side cancel a
        // pending transaction.  The TU determines the transaction to be
        // cancelled by taking the CANCEL request, and then assuming that the
        // request method is anything but CANCEL or ACK and applying the
        // transaction matching procedures of Section 17.2.3.  The matching
        // transaction is the one to be cancelled.
        // https://tools.ietf.org/html/rfc3261#section-9.2
        if (request.method === Constants_1.C.CANCEL) {
            if (ist || nist) {
                // Regardless of the method of the original request, as long as the
                // CANCEL matched an existing transaction, the UAS answers the CANCEL
                // request itself with a 200 (OK) response.
                // https://tools.ietf.org/html/rfc3261#section-9.2
                request.reply_sl(200);
                // If the transaction for the original request still exists, the behavior
                // of the UAS on receiving a CANCEL request depends on whether it has already
                // sent a final response for the original request. If it has, the CANCEL
                // request has no effect on the processing of the original request, no
                // effect on any session state, and no effect on the responses generated
                // for the original request. If the UAS has not issued a final response
                // for the original request, its behavior depends on the method of the
                // original request. If the original request was an INVITE, the UAS
                // SHOULD immediately respond to the INVITE with a 487 (Request
                // Terminated). A CANCEL request has no impact on the processing of
                // transactions with any other method defined in this specification.
                // https://tools.ietf.org/html/rfc3261#section-9.2
                if (ist && ist.state === Transactions_1.TransactionState.Proceeding) {
                    // TODO: Review this.
                    // The cancel request has been replied to, which is an exception.
                    this.receiveRequest(request);
                }
            }
            else {
                // If the UAS did not find a matching transaction for the CANCEL
                // according to the procedure above, it SHOULD respond to the CANCEL
                // with a 481 (Call Leg/Transaction Does Not Exist).
                // https://tools.ietf.org/html/rfc3261#section-9.2
                request.reply_sl(481);
            }
            return;
        }
        // When receiving an ACK that matches an existing INVITE server
        // transaction and that does not contain a branch parameter containing
        // the magic cookie defined in RFC 3261, the matching transaction MUST
        // be checked to see if it is in the "Accepted" state.  If it is, then
        // the ACK must be passed directly to the transaction user instead of
        // being absorbed by the transaction state machine.  This is necessary
        // as requests from RFC 2543 clients will not include a unique branch
        // parameter, and the mechanisms for calculating the transaction ID from
        // such a request will be the same for both INVITE and ACKs.
        // https://tools.ietf.org/html/rfc6026#section-6
        // Any ACKs received from the network while in the "Accepted" state MUST be
        // passed directly to the TU and not absorbed.
        // https://tools.ietf.org/html/rfc6026#section-7.1
        if (request.method === Constants_1.C.ACK) {
            if (ist && ist.state === Transactions_1.TransactionState.Accepted) {
                this.receiveRequest(request);
                return;
            }
        }
        // If a matching server transaction is found, the request is passed to that
        // transaction for processing.
        // https://tools.ietf.org/html/rfc6026#section-8.10
        if (ist) {
            ist.receiveRequest(request);
            return;
        }
        if (nist) {
            nist.receiveRequest(request);
            return;
        }
        // If no match is found, the request is passed to the core, which may decide to
        // construct a new server transaction for that request.
        // https://tools.ietf.org/html/rfc6026#section-8.10
        this.receiveRequest(request);
    };
    UA.prototype.receiveResponseFromTransport = function (response) {
        // When the transport layer in the client receives a response, it has to
        // determine which client transaction will handle the response, so that
        // the processing of Sections 17.1.1 and 17.1.2 can take place.  The
        // branch parameter in the top Via header field is used for this
        // purpose.  A response matches a client transaction under two
        // conditions:
        //
        //    1.  If the response has the same value of the branch parameter in
        //        the top Via header field as the branch parameter in the top
        //        Via header field of the request that created the transaction.
        //
        //    2.  If the method parameter in the CSeq header field matches the
        //        method of the request that created the transaction.  The
        //        method is needed since a CANCEL request constitutes a
        //        different transaction, but shares the same value of the branch
        //        parameter.
        // https://tools.ietf.org/html/rfc3261#section-17.1.3
        // The client transport uses the matching procedures of Section
        // 17.1.3 to attempt to match the response to an existing
        // transaction.  If there is a match, the response MUST be passed to
        // that transaction.  Otherwise, any element other than a stateless
        // proxy MUST silently discard the response.
        // https://tools.ietf.org/html/rfc6026#section-8.9
        var transaction;
        switch (response.method) {
            case Constants_1.C.INVITE:
                transaction = this.transactions.ict[response.viaBranch];
                break;
            case Constants_1.C.ACK:
                // Just in case ;-)
                break;
            default:
                transaction = this.transactions.nict[response.viaBranch];
                break;
        }
        if (!transaction) {
            var message = "Discarding unmatched " + response.statusCode + " response to " + response.method + " " + response.viaBranch + ".";
            this.logger.warn(message);
            return;
        }
        // FIXME: Bad hack. Potentially creating circular dependancy. SIPMessage needs refactor.
        response.transaction = transaction;
        // Pass incoming response to matching transaction.
        transaction.receiveResponse(response);
    };
    /**
     * Request reception
     * @private
     * @param {SIP.IncomingRequest} request.
     */
    UA.prototype.receiveRequest = function (request) {
        var _this = this;
        /* RFC3261 12.2.2
        * Requests that do not change in any way the state of a dialog may be
        * received within a dialog (for example, an OPTIONS request).
        * They are processed as if they had been received outside the dialog.
        */
        var method = request.method;
        var message;
        if (method === Constants_1.C.OPTIONS) {
            var transport = this.transport;
            if (!transport) {
                throw new Error("Transport undefined.");
            }
            var user = {
                loggerFactory: this.getLoggerFactory(),
                onStateChange: function (newState) {
                    if (newState === Transactions_1.TransactionState.Terminated) {
                        _this.destroyTransaction(optionsTransaction_1);
                    }
                },
                onTransportError: function (error) {
                    _this.logger.error(error.message);
                }
            };
            var optionsTransaction_1 = new Transactions_1.NonInviteServerTransaction(request, transport, user);
            this.newTransaction(optionsTransaction_1);
            request.reply(200, undefined, [
                "Allow: " + UA.C.ALLOWED_METHODS.toString(),
                "Accept: " + UA.C.ACCEPTED_BODY_TYPES.toString()
            ]);
        }
        else if (method === Constants_1.C.MESSAGE) {
            message = new ServerContext_1.ServerContext(this, request);
            message.body = request.body;
            message.contentType = request.getHeader("Content-Type") || "text/plain";
            request.reply(200, undefined);
            this.emit("message", message);
        }
        else if (method !== Constants_1.C.INVITE &&
            method !== Constants_1.C.ACK) {
            // Let those methods pass through to normal processing for now.
            message = new ServerContext_1.ServerContext(this, request);
        }
        // Initial Request
        if (!request.toTag) {
            switch (method) {
                case Constants_1.C.INVITE:
                    var replaces = this.configuration.replaces !== Constants_1.C.supported.UNSUPPORTED &&
                        request.parseHeader("replaces");
                    var replacedDialog = void 0;
                    if (replaces) {
                        replacedDialog = this.dialogs[replaces.call_id + replaces.replaces_to_tag + replaces.replaces_from_tag];
                        if (!replacedDialog) {
                            // Replaced header without a matching dialog, reject
                            request.reply_sl(481, undefined);
                            return;
                        }
                        else if (!(replacedDialog.owner.type === Enums_1.TypeStrings.Subscription) &&
                            replacedDialog.owner.status
                                === Enums_1.SessionStatus.STATUS_TERMINATED) {
                            request.reply_sl(603, undefined);
                            return;
                        }
                        else if (replacedDialog.state === Enums_1.DialogStatus.STATUS_CONFIRMED && replaces.earlyOnly) {
                            request.reply_sl(486, undefined);
                            return;
                        }
                    }
                    var newSession = new Session_1.InviteServerContext(this, request);
                    if (replacedDialog && !(replacedDialog.owner.type === Enums_1.TypeStrings.Subscription)) {
                        newSession.replacee = replacedDialog && replacedDialog.owner;
                    }
                    this.emit("invite", newSession);
                    break;
                case Constants_1.C.BYE:
                    // Out of dialog BYE received
                    request.reply(481);
                    break;
                case Constants_1.C.CANCEL:
                    var session = this.findSession(request);
                    if (session) {
                        session.receiveRequest(request);
                    }
                    else {
                        this.logger.warn("received CANCEL request for a non existent session");
                    }
                    break;
                case Constants_1.C.ACK:
                    /* Absorb it.
                    * ACK request without a corresponding Invite Transaction
                    * and without To tag.
                    */
                    break;
                case Constants_1.C.NOTIFY:
                    if (this.configuration.allowLegacyNotifications && this.listeners("notify").length > 0) {
                        request.reply(200, undefined);
                        this.emit("notify", { request: request });
                    }
                    else {
                        request.reply(481, "Subscription does not exist");
                    }
                    break;
                case Constants_1.C.REFER:
                    this.logger.log("Received an out of dialog refer");
                    if (this.configuration.allowOutOfDialogRefers) {
                        this.logger.log("Allow out of dialog refers is enabled on the UA");
                        var referContext = new Session_1.ReferServerContext(this, request);
                        if (this.listeners("outOfDialogReferRequested").length) {
                            this.emit("outOfDialogReferRequested", referContext);
                        }
                        else {
                            this.logger.log("No outOfDialogReferRequest listeners," +
                                " automatically accepting and following the out of dialog refer");
                            referContext.accept({ followRefer: true });
                        }
                        break;
                    }
                    request.reply(405);
                    break;
                default:
                    request.reply(405);
                    break;
            }
        }
        else { // In-dialog request
            var dialog_1 = this.findDialog(request);
            if (dialog_1) {
                if (method === Constants_1.C.INVITE) {
                    var transport = this.transport;
                    if (!transport) {
                        throw new Error("Transport undefined.");
                    }
                    var user = {
                        loggerFactory: this.log,
                        onStateChange: function (newState) {
                            if (newState === Transactions_1.TransactionState.Terminated) {
                                _this.destroyTransaction(ist_1);
                            }
                        },
                        onTransportError: function (error) {
                            _this.logger.error(error.message);
                            dialog_1.owner.onTransportError();
                        }
                    };
                    var ist_1 = new Transactions_1.InviteServerTransaction(request, transport, user);
                    this.newTransaction(ist_1);
                }
                dialog_1.receiveRequest(request);
            }
            else if (method === Constants_1.C.NOTIFY) {
                var session = this.findSession(request);
                var earlySubscription = this.findEarlySubscription(request);
                if (session) {
                    session.receiveRequest(request);
                }
                else if (earlySubscription) {
                    earlySubscription.receiveRequest(request);
                }
                else {
                    this.logger.warn("received NOTIFY request for a non existent session or subscription");
                    request.reply(481, "Subscription does not exist");
                }
            }
            else {
                /* RFC3261 12.2.2
                 * Request with to tag, but no matching dialog found.
                 * Exception: ACK for an Invite request for which a dialog has not
                 * been created.
                 */
                if (method !== Constants_1.C.ACK) {
                    request.reply(481);
                }
            }
        }
    };
    // =================
    // Utils
    // =================
    /**
     * Get the dialog to which the request belongs to, if any.
     * @param {SIP.IncomingRequest}
     * @returns {SIP.Dialog|undefined}
     */
    UA.prototype.findDialog = function (request) {
        return this.dialogs[request.callId + request.fromTag + request.toTag] ||
            this.dialogs[request.callId + request.toTag + request.fromTag] ||
            undefined;
    };
    /**
     * Get the subscription which has not been confirmed to which the request belongs to, if any
     * @param {SIP.IncomingRequest}
     * @returns {SIP.Subscription|undefined}
     */
    UA.prototype.findEarlySubscription = function (request) {
        return this.earlySubscriptions[request.callId + request.toTag + request.getHeader("event")] || undefined;
    };
    UA.prototype.checkAuthenticationFactory = function (authenticationFactory) {
        if (!(authenticationFactory instanceof Function)) {
            return;
        }
        if (!authenticationFactory.initialize) {
            authenticationFactory.initialize = function () {
                return Promise.resolve();
            };
        }
        return authenticationFactory;
    };
    /**
     * Configuration load.
     * returns {void}
     */
    UA.prototype.loadConfig = function (configuration) {
        var _this = this;
        // Settings and default values
        var settings = {
            /* Host address
             * Value to be set in Via sent_by and host part of Contact FQDN
             */
            viaHost: Utils_1.Utils.createRandomToken(12) + ".invalid",
            uri: new URI_1.URI("sip", "anonymous." + Utils_1.Utils.createRandomToken(6), "anonymous.invalid", undefined, undefined),
            // Custom Configuration Settings
            custom: {},
            // Display name
            displayName: "",
            // Password
            password: undefined,
            register: true,
            // Registration parameters
            registerOptions: {},
            // Transport related parameters
            transportConstructor: Transport_1.Transport,
            transportOptions: {},
            // string to be inserted into User-Agent request header
            userAgentString: Constants_1.C.USER_AGENT,
            // Session parameters
            noAnswerTimeout: 60,
            // Hacks
            hackViaTcp: false,
            hackIpInContact: false,
            hackWssInTransport: false,
            hackAllowUnregisteredOptionTags: false,
            // Session Description Handler Options
            sessionDescriptionHandlerFactoryOptions: {
                constraints: {},
                peerConnectionOptions: {}
            },
            extraSupported: [],
            contactName: Utils_1.Utils.createRandomToken(8),
            contactTransport: "ws",
            forceRport: false,
            // autostarting
            autostart: true,
            autostop: true,
            // Reliable Provisional Responses
            rel100: Constants_1.C.supported.UNSUPPORTED,
            // DTMF type: 'info' or 'rtp' (RFC 4733)
            // RTP Payload Spec: https://tools.ietf.org/html/rfc4733
            // WebRTC Audio Spec: https://tools.ietf.org/html/rfc7874
            dtmfType: Constants_1.C.dtmfType.INFO,
            // Replaces header (RFC 3891)
            // http://tools.ietf.org/html/rfc3891
            replaces: Constants_1.C.supported.UNSUPPORTED,
            sessionDescriptionHandlerFactory: SessionDescriptionHandler_1.SessionDescriptionHandler.defaultFactory,
            authenticationFactory: this.checkAuthenticationFactory(function (ua) {
                return new DigestAuthentication_1.DigestAuthentication(ua);
            }),
            allowLegacyNotifications: false,
            allowOutOfDialogRefers: false,
        };
        var configCheck = this.getConfigurationCheck();
        // Check Mandatory parameters
        for (var parameter in configCheck.mandatory) {
            if (!configuration.hasOwnProperty(parameter)) {
                throw new Exceptions_1.Exceptions.ConfigurationError(parameter);
            }
            else {
                var value = configuration[parameter];
                var checkedValue = configCheck.mandatory[parameter](value);
                if (checkedValue !== undefined) {
                    settings[parameter] = checkedValue;
                }
                else {
                    throw new Exceptions_1.Exceptions.ConfigurationError(parameter, value);
                }
            }
        }
        // Check Optional parameters
        for (var parameter in configCheck.optional) {
            if (configuration.hasOwnProperty(parameter)) {
                var value = configuration[parameter];
                // If the parameter value is an empty array, but shouldn't be, apply its default value.
                // If the parameter value is null, empty string, or undefined then apply its default value.
                // If it's a number with NaN value then also apply its default value.
                // NOTE: JS does not allow "value === NaN", the following does the work:
                if ((value instanceof Array && value.length === 0) ||
                    (value === null || value === "" || value === undefined) ||
                    (typeof (value) === "number" && isNaN(value))) {
                    continue;
                }
                var checkedValue = configCheck.optional[parameter](value);
                if (checkedValue !== undefined) {
                    settings[parameter] = checkedValue;
                }
                else {
                    throw new Exceptions_1.Exceptions.ConfigurationError(parameter, value);
                }
            }
        }
        // Post Configuration Process
        // Allow passing 0 number as displayName.
        if (settings.displayName === 0) {
            settings.displayName = "0";
        }
        // sipjsId instance parameter. Static random tag of length 5
        settings.sipjsId = Utils_1.Utils.createRandomToken(5);
        // String containing settings.uri without scheme and user.
        var hostportParams = settings.uri.clone();
        hostportParams.user = undefined;
        settings.hostportParams = hostportParams.toRaw().replace(/^sip:/i, "");
        /* Check whether authorizationUser is explicitly defined.
         * Take 'settings.uri.user' value if not.
         */
        if (!settings.authorizationUser) {
            settings.authorizationUser = settings.uri.user;
        }
        // User noAnswerTimeout
        settings.noAnswerTimeout = settings.noAnswerTimeout * 1000;
        // Via Host
        if (settings.hackIpInContact) {
            if (typeof settings.hackIpInContact === "boolean") {
                var from = 1;
                var to = 254;
                var octet = Math.floor(Math.random() * (to - from + 1) + from);
                // random Test-Net IP (http://tools.ietf.org/html/rfc5735)
                settings.viaHost = "192.0.2." + octet;
            }
            else if (typeof settings.hackIpInContact === "string") {
                settings.viaHost = settings.hackIpInContact;
            }
        }
        // Contact transport parameter
        if (settings.hackWssInTransport) {
            settings.contactTransport = "wss";
        }
        this.contact = {
            pubGruu: undefined,
            tempGruu: undefined,
            uri: new URI_1.URI("sip", settings.contactName, settings.viaHost, undefined, { transport: settings.contactTransport }),
            toString: function (options) {
                if (options === void 0) { options = {}; }
                var anonymous = options.anonymous || false;
                var outbound = options.outbound || false;
                var contact = "<";
                if (anonymous) {
                    contact += (_this.contact.tempGruu ||
                        ("sip:anonymous@anonymous.invalid;transport=" + settings.contactTransport)).toString();
                }
                else {
                    contact += (_this.contact.pubGruu || _this.contact.uri).toString();
                }
                if (outbound) {
                    contact += ";ob";
                }
                contact += ">";
                return contact;
            }
        };
        var skeleton = {};
        // Fill the value of the configuration_skeleton
        for (var parameter in settings) {
            if (settings.hasOwnProperty(parameter)) {
                skeleton[parameter] = settings[parameter];
            }
        }
        Object.assign(this.configuration, skeleton);
        this.logger.log("configuration parameters after validation:");
        for (var parameter in settings) {
            if (settings.hasOwnProperty(parameter)) {
                switch (parameter) {
                    case "uri":
                    case "sessionDescriptionHandlerFactory":
                        this.logger.log("· " + parameter + ": " + settings[parameter]);
                        break;
                    case "password":
                        this.logger.log("· " + parameter + ": " + "NOT SHOWN");
                        break;
                    case "transportConstructor":
                        this.logger.log("· " + parameter + ": " + settings[parameter].name);
                        break;
                    default:
                        this.logger.log("· " + parameter + ": " + JSON.stringify(settings[parameter]));
                }
            }
        }
        return;
    };
    /**
     * Configuration checker.
     * @return {Boolean}
     */
    UA.prototype.getConfigurationCheck = function () {
        return {
            mandatory: {},
            optional: {
                uri: function (uri) {
                    if (!(/^sip:/i).test(uri)) {
                        uri = Constants_1.C.SIP + ":" + uri;
                    }
                    var parsed = Grammar_1.Grammar.URIParse(uri);
                    if (!parsed || !parsed.user) {
                        return;
                    }
                    else {
                        return parsed;
                    }
                },
                transportConstructor: function (transportConstructor) {
                    if (transportConstructor instanceof Function) {
                        return transportConstructor;
                    }
                },
                transportOptions: function (transportOptions) {
                    if (typeof transportOptions === "object") {
                        return transportOptions;
                    }
                },
                authorizationUser: function (authorizationUser) {
                    if (Grammar_1.Grammar.parse('"' + authorizationUser + '"', "quoted_string") === -1) {
                        return;
                    }
                    else {
                        return authorizationUser;
                    }
                },
                displayName: function (displayName) {
                    if (Grammar_1.Grammar.parse('"' + displayName + '"', "displayName") === -1) {
                        return;
                    }
                    else {
                        return displayName;
                    }
                },
                dtmfType: function (dtmfType) {
                    switch (dtmfType) {
                        case Constants_1.C.dtmfType.RTP:
                            return Constants_1.C.dtmfType.RTP;
                        case Constants_1.C.dtmfType.INFO:
                        // Fall through
                        default:
                            return Constants_1.C.dtmfType.INFO;
                    }
                },
                hackViaTcp: function (hackViaTcp) {
                    if (typeof hackViaTcp === "boolean") {
                        return hackViaTcp;
                    }
                },
                hackIpInContact: function (hackIpInContact) {
                    if (typeof hackIpInContact === "boolean") {
                        return hackIpInContact;
                    }
                    else if (typeof hackIpInContact === "string" && Grammar_1.Grammar.parse(hackIpInContact, "host") !== -1) {
                        return hackIpInContact;
                    }
                },
                hackWssInTransport: function (hackWssInTransport) {
                    if (typeof hackWssInTransport === "boolean") {
                        return hackWssInTransport;
                    }
                },
                hackAllowUnregisteredOptionTags: function (hackAllowUnregisteredOptionTags) {
                    if (typeof hackAllowUnregisteredOptionTags === "boolean") {
                        return hackAllowUnregisteredOptionTags;
                    }
                },
                contactTransport: function (contactTransport) {
                    if (typeof contactTransport === "string") {
                        return contactTransport;
                    }
                },
                extraSupported: function (optionTags) {
                    if (!(optionTags instanceof Array)) {
                        return;
                    }
                    for (var _i = 0, optionTags_1 = optionTags; _i < optionTags_1.length; _i++) {
                        var tag = optionTags_1[_i];
                        if (typeof tag !== "string") {
                            return;
                        }
                    }
                    return optionTags;
                },
                forceRport: function (forceRport) {
                    if (typeof forceRport === "boolean") {
                        return forceRport;
                    }
                },
                noAnswerTimeout: function (noAnswerTimeout) {
                    if (Utils_1.Utils.isDecimal(noAnswerTimeout)) {
                        var value = Number(noAnswerTimeout);
                        if (value > 0) {
                            return value;
                        }
                    }
                },
                password: function (password) {
                    return String(password);
                },
                rel100: function (rel100) {
                    if (rel100 === Constants_1.C.supported.REQUIRED) {
                        return Constants_1.C.supported.REQUIRED;
                    }
                    else if (rel100 === Constants_1.C.supported.SUPPORTED) {
                        return Constants_1.C.supported.SUPPORTED;
                    }
                    else {
                        return Constants_1.C.supported.UNSUPPORTED;
                    }
                },
                replaces: function (replaces) {
                    if (replaces === Constants_1.C.supported.REQUIRED) {
                        return Constants_1.C.supported.REQUIRED;
                    }
                    else if (replaces === Constants_1.C.supported.SUPPORTED) {
                        return Constants_1.C.supported.SUPPORTED;
                    }
                    else {
                        return Constants_1.C.supported.UNSUPPORTED;
                    }
                },
                register: function (register) {
                    if (typeof register === "boolean") {
                        return register;
                    }
                },
                registerOptions: function (registerOptions) {
                    if (typeof registerOptions === "object") {
                        return registerOptions;
                    }
                },
                userAgentString: function (userAgentString) {
                    if (typeof userAgentString === "string") {
                        return userAgentString;
                    }
                },
                autostart: function (autostart) {
                    if (typeof autostart === "boolean") {
                        return autostart;
                    }
                },
                autostop: function (autostop) {
                    if (typeof autostop === "boolean") {
                        return autostop;
                    }
                },
                sessionDescriptionHandlerFactory: function (sessionDescriptionHandlerFactory) {
                    if (sessionDescriptionHandlerFactory instanceof Function) {
                        return sessionDescriptionHandlerFactory;
                    }
                },
                sessionDescriptionHandlerFactoryOptions: function (options) {
                    if (typeof options === "object") {
                        return options;
                    }
                },
                authenticationFactory: this.checkAuthenticationFactory,
                allowLegacyNotifications: function (allowLegacyNotifications) {
                    if (typeof allowLegacyNotifications === "boolean") {
                        return allowLegacyNotifications;
                    }
                },
                custom: function (custom) {
                    if (typeof custom === "object") {
                        return custom;
                    }
                },
                contactName: function (contactName) {
                    if (typeof contactName === "string") {
                        return contactName;
                    }
                },
            }
        };
    };
    UA.C = {
        // UA status codes
        STATUS_INIT: 0,
        STATUS_STARTING: 1,
        STATUS_READY: 2,
        STATUS_USER_CLOSED: 3,
        STATUS_NOT_READY: 4,
        // UA error codes
        CONFIGURATION_ERROR: 1,
        NETWORK_ERROR: 2,
        ALLOWED_METHODS: [
            "ACK",
            "CANCEL",
            "INVITE",
            "MESSAGE",
            "BYE",
            "OPTIONS",
            "INFO",
            "NOTIFY",
            "REFER"
        ],
        ACCEPTED_BODY_TYPES: [
            "application/sdp",
            "application/dtmf-relay"
        ],
        MAX_FORWARDS: 70,
        TAG_LENGTH: 10
    };
    return UA;
}(events_1.EventEmitter));
exports.UA = UA;
