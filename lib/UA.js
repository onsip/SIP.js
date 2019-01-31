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
            if (configuration.log.hasOwnProperty("level")) {
                _this.log.level = configuration.log.level;
            }
            if (configuration.log.hasOwnProperty("connector")) {
                _this.log.connector = configuration.log.connector;
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
            this.on("transactionDestroyed", transactionsListener_1.bind(this));
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
                environment.addEventListener("unload", this.environListener);
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
        if (this.transport) {
            this.transport.on("connected", this.onTransportConnected.bind(this));
            this.transport.on("message", this.onTransportReceiveMsg.bind(this));
            this.transport.on("transportError", this.onTransportError.bind(this));
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
     * Transport message receipt event.
     * @event
     * @param {String} message
     */
    UA.prototype.onTransportReceiveMsg = function (messageString) {
        var message = Parser_1.Parser.parseMessage(messageString, this);
        if (this.status === Enums_1.UAStatus.STATUS_USER_CLOSED && message && message.type === Enums_1.TypeStrings.IncomingRequest) {
            this.logger.warn("UA received message when status = USER_CLOSED - aborting");
            return;
        }
        // Do some sanity check
        if (message && this.transport && SanityCheck_1.SanityCheck.sanityCheck(message, this, this.transport)) {
            if (message.type === Enums_1.TypeStrings.IncomingRequest) {
                message.transport = this.transport;
                this.receiveRequest(message);
            }
            else if (message.type === Enums_1.TypeStrings.IncomingResponse) {
                /* Unlike stated in 18.1.2, if a response does not match
                 * any transaction, it is discarded here and no passed to the core
                 * in order to be discarded there.
                 */
                switch (message.method) {
                    case Constants_1.C.INVITE:
                        var icTransaction = this.transactions.ict[message.viaBranch];
                        if (icTransaction) {
                            icTransaction.receiveResponse(message);
                        }
                        break;
                    case Constants_1.C.ACK:
                        // Just in case ;-)
                        break;
                    default:
                        var nicTransaction = this.transactions.nict[message.viaBranch];
                        if (nicTransaction) {
                            nicTransaction.receiveResponse(message);
                        }
                        break;
                }
            }
        }
    };
    /**
     * Request reception
     * @private
     * @param {SIP.IncomingRequest} request.
     */
    UA.prototype.receiveRequest = function (request) {
        var ruriMatches = function (uri) {
            return !!uri && !!request.ruri && uri.user === request.ruri.user;
        };
        // Check that request URI points to us
        if (this.configuration.uri.type === Enums_1.TypeStrings.URI &&
            !(ruriMatches(this.configuration.uri) ||
                (this.contact && (ruriMatches(this.contact.uri) ||
                    ruriMatches(this.contact.pubGruu) ||
                    ruriMatches(this.contact.tempGruu))))) {
            this.logger.warn("Request-URI does not point to us");
            if (request.method !== Constants_1.C.ACK) {
                request.reply_sl(404);
            }
            return;
        }
        // Check request URI scheme
        if (!!request.ruri && request.ruri.scheme === Constants_1.C.SIPS) {
            request.reply_sl(416);
            return;
        }
        // Check transaction
        if (this.checkTransaction(request)) {
            return;
        }
        /* RFC3261 12.2.2
        * Requests that do not change in any way the state of a dialog may be
        * received within a dialog (for example, an OPTIONS request).
        * They are processed as if they had been received outside the dialog.
        */
        var method = request.method;
        var message;
        if (method === Constants_1.C.OPTIONS) {
            var nonInviteTr = new Transactions_1.NonInviteServerTransaction(request, this);
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
                        replacedDialog = this.dialogs[replaces.callId + replaces.replacesToTag + replaces.replacesFromTag];
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
            var dialog = this.findDialog(request);
            if (dialog) {
                if (method === Constants_1.C.INVITE) {
                    var unusedIST = new Transactions_1.InviteServerTransaction(request, this);
                }
                dialog.receiveRequest(request);
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
    UA.prototype.checkTransaction = function (request) {
        return Transactions_1.checkTransaction(this, request);
    };
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
