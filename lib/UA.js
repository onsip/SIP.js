"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var events_1 = require("events");
var ClientContext_1 = require("./ClientContext");
var Constants_1 = require("./Constants");
var core_1 = require("./core");
var Enums_1 = require("./Enums");
var Exceptions_1 = require("./Exceptions");
var PublishContext_1 = require("./PublishContext");
var ReferContext_1 = require("./ReferContext");
var RegisterContext_1 = require("./RegisterContext");
var ServerContext_1 = require("./ServerContext");
var Session_1 = require("./Session");
var Subscription_1 = require("./Subscription");
var Utils_1 = require("./Utils");
var SessionDescriptionHandler_1 = require("./Web/SessionDescriptionHandler");
var Transport_1 = require("./Web/Transport");
/**
 * @class Class creating a SIP User Agent.
 * @param {function returning SIP.sessionDescriptionHandler} [configuration.sessionDescriptionHandlerFactory]
 *  A function will be invoked by each of the UA's Sessions to build the sessionDescriptionHandler for that Session.
 *  If no (or a falsy) value is provided, each Session will use a default (WebRTC) sessionDescriptionHandler.
 */
var UA = /** @class */ (function (_super) {
    tslib_1.__extends(UA, _super);
    function UA(configuration) {
        var _this = _super.call(this) || this;
        /** Unload listener. */
        _this.unloadListener = (function () { _this.stop(); });
        _this.type = Enums_1.TypeStrings.UA;
        _this.log = new core_1.LoggerFactory();
        _this.logger = _this.getLogger("sip.ua");
        _this.configuration = {};
        // User actions outside any session/dialog (MESSAGE)
        _this.applicants = {};
        _this.data = {};
        _this.sessions = {};
        _this.subscriptions = {};
        _this.publishers = {};
        _this.status = Enums_1.UAStatus.STATUS_INIT;
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
            _this.log.builtinEnabled = configuration.log.builtinEnabled;
            if (configuration.log.hasOwnProperty("connector")) {
                _this.log.connector = configuration.log.connector;
            }
            if (configuration.log.hasOwnProperty("level")) {
                var level = configuration.log.level;
                var normalized = void 0;
                if (typeof level === "string") {
                    switch (level) {
                        case "error":
                            normalized = core_1.Levels.error;
                            break;
                        case "warn":
                            normalized = core_1.Levels.warn;
                            break;
                        case "log":
                            normalized = core_1.Levels.log;
                            break;
                        case "debug":
                            normalized = core_1.Levels.debug;
                            break;
                        default:
                            break;
                    }
                }
                else {
                    switch (level) {
                        case 0:
                            normalized = core_1.Levels.error;
                            break;
                        case 1:
                            normalized = core_1.Levels.warn;
                            break;
                        case 2:
                            normalized = core_1.Levels.log;
                            break;
                        case 3:
                            normalized = core_1.Levels.debug;
                            break;
                        default:
                            break;
                    }
                }
                // avoid setting level when invalid, use default level instead
                if (normalized === undefined) {
                    _this.logger.error("Invalid \"level\" parameter value: " + JSON.stringify(level));
                }
                else {
                    _this.log.level = normalized;
                }
            }
        }
        var deprecatedMessage = "The UA class has been deprecated and will no longer be available starting with SIP.js release 0.16.0. " +
            "The UA has been replaced by the UserAgent class. Please update accordingly.";
        _this.logger.warn(deprecatedMessage);
        try {
            _this.loadConfig(configuration);
        }
        catch (e) {
            _this.status = Enums_1.UAStatus.STATUS_NOT_READY;
            _this.error = UA.C.CONFIGURATION_ERROR;
            throw e;
        }
        if (!_this.configuration.transportConstructor) {
            throw new core_1.TransportError("Transport constructor not set");
        }
        _this.transport = new _this.configuration.transportConstructor(_this.getLogger("sip.transport"), _this.configuration.transportOptions);
        var userAgentCoreConfiguration = makeUserAgentCoreConfigurationFromUA(_this);
        // The Replaces header contains information used to match an existing
        // SIP dialog (call-id, to-tag, and from-tag).  Upon receiving an INVITE
        // with a Replaces header, the User Agent (UA) attempts to match this
        // information with a confirmed or early dialog.
        // https://tools.ietf.org/html/rfc3891#section-3
        var handleInviteWithReplacesHeader = function (context, request) {
            if (_this.configuration.replaces !== Constants_1.C.supported.UNSUPPORTED) {
                var replaces = request.parseHeader("replaces");
                if (replaces) {
                    var targetSession = _this.sessions[replaces.call_id + replaces.replaces_from_tag] ||
                        _this.sessions[replaces.call_id + replaces.replaces_to_tag] ||
                        undefined;
                    if (!targetSession) {
                        _this.userAgentCore.replyStateless(request, { statusCode: 481 });
                        return;
                    }
                    if (targetSession.status === Enums_1.SessionStatus.STATUS_TERMINATED) {
                        _this.userAgentCore.replyStateless(request, { statusCode: 603 });
                        return;
                    }
                    var targetDialogId = replaces.call_id + replaces.replaces_to_tag + replaces.replaces_from_tag;
                    var targetDialog = _this.userAgentCore.dialogs.get(targetDialogId);
                    if (!targetDialog) {
                        _this.userAgentCore.replyStateless(request, { statusCode: 481 });
                        return;
                    }
                    if (!targetDialog.early && replaces.early_only) {
                        _this.userAgentCore.replyStateless(request, { statusCode: 486 });
                        return;
                    }
                    context.replacee = targetSession;
                }
            }
        };
        var userAgentCoreDelegate = {
            onInvite: function (incomingInviteRequest) {
                // FIXME: Ported - 100 Trying send should be configurable.
                // Only required if TU will not respond in 200ms.
                // https://tools.ietf.org/html/rfc3261#section-17.2.1
                incomingInviteRequest.trying();
                incomingInviteRequest.delegate = {
                    onCancel: function (cancel) {
                        context.onCancel(cancel);
                    },
                    onTransportError: function (error) {
                        context.onTransportError();
                    }
                };
                var context = new Session_1.InviteServerContext(_this, incomingInviteRequest);
                // Ported - handling of out of dialog INVITE with Replaces.
                handleInviteWithReplacesHeader(context, incomingInviteRequest.message);
                // Ported - make the first call to progress automatically.
                if (context.autoSendAnInitialProvisionalResponse) {
                    context.progress();
                }
                _this.emit("invite", context);
            },
            onMessage: function (incomingMessageRequest) {
                // Ported - handling of out of dialog MESSAGE.
                var serverContext = new ServerContext_1.ServerContext(_this, incomingMessageRequest);
                serverContext.body = incomingMessageRequest.message.body;
                serverContext.contentType = incomingMessageRequest.message.getHeader("Content-Type") || "text/plain";
                incomingMessageRequest.accept();
                _this.emit("message", serverContext); // TODO: Review. Why is a "ServerContext" emitted? What use it is?
            },
            onNotify: function (incomingNotifyRequest) {
                // DEPRECATED: Out of dialog NOTIFY is an obsolete usage.
                // Ported - handling of out of dialog NOTIFY.
                if (_this.configuration.allowLegacyNotifications && _this.listeners("notify").length > 0) {
                    incomingNotifyRequest.accept();
                    _this.emit("notify", { request: incomingNotifyRequest.message });
                }
                else {
                    incomingNotifyRequest.reject({ statusCode: 481 });
                }
            },
            onRefer: function (incomingReferRequest) {
                // Ported - handling of out of dialog REFER.
                _this.logger.log("Received an out of dialog refer");
                if (!_this.configuration.allowOutOfDialogRefers) {
                    incomingReferRequest.reject({ statusCode: 405 });
                }
                _this.logger.log("Allow out of dialog refers is enabled on the UA");
                var referContext = new ReferContext_1.ReferServerContext(_this, incomingReferRequest);
                if (_this.listeners("outOfDialogReferRequested").length) {
                    _this.emit("outOfDialogReferRequested", referContext);
                }
                else {
                    _this.logger.log("No outOfDialogReferRequest listeners, automatically accepting and following the out of dialog refer");
                    referContext.accept({ followRefer: true });
                }
            },
            onSubscribe: function (incomingSubscribeRequest) {
                _this.emit("subscribe", incomingSubscribeRequest);
            },
        };
        _this.userAgentCore = new core_1.UserAgentCore(userAgentCoreConfiguration, userAgentCoreDelegate);
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
        this.transport.afterConnected(function () {
            _this.registerContext.unregister(options);
        });
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
        this.transport.afterConnected(function () {
            context.invite();
            _this.emit("inviteSent", context);
        });
        return context;
    };
    UA.prototype.subscribe = function (target, event, options) {
        var sub = new Subscription_1.Subscription(this, target, event, options);
        this.transport.afterConnected(function () { return sub.subscribe(); });
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
        this.transport.afterConnected(function () {
            pub.publish(body);
        });
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
        this.transport.afterConnected(function () { return req.send(); });
        return req;
    };
    /**
     * Gracefully close.
     */
    UA.prototype.stop = function () {
        this.logger.log("user requested closure...");
        if (this.status === Enums_1.UAStatus.STATUS_USER_CLOSED) {
            this.logger.warn("UA already closed");
            return this;
        }
        // Close registerContext
        this.logger.log("closing registerContext");
        this.registerContext.close();
        // Run terminate on every Session
        for (var session in this.sessions) {
            if (this.sessions[session]) {
                this.logger.log("closing session " + session);
                this.sessions[session].terminate();
            }
        }
        // Run unsubscribe on every Subscription
        for (var subscription in this.subscriptions) {
            if (this.subscriptions[subscription]) {
                this.logger.log("unsubscribe " + subscription);
                this.subscriptions[subscription].unsubscribe();
            }
        }
        // Run close on every Publisher
        for (var publisher in this.publishers) {
            if (this.publishers[publisher]) {
                this.logger.log("unpublish " + publisher);
                this.publishers[publisher].close();
            }
        }
        // Run close on every applicant
        for (var applicant in this.applicants) {
            if (this.applicants[applicant]) {
                this.applicants[applicant].close();
            }
        }
        this.status = Enums_1.UAStatus.STATUS_USER_CLOSED;
        // Disconnect the transport and reset user agent core
        this.transport.disconnect();
        this.userAgentCore.reset();
        if (this.configuration.autostop) {
            // Google Chrome Packaged Apps don't allow 'unload' listeners: unload is not available in packaged apps
            var googleChromePackagedApp = typeof chrome !== "undefined" && chrome.app && chrome.app.runtime ? true : false;
            if (typeof window !== "undefined" &&
                typeof window.removeEventListener === "function" &&
                !googleChromePackagedApp) {
                window.removeEventListener("unload", this.unloadListener);
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
            this.setTransportListeners();
            this.emit("transportCreated", this.transport);
            this.transport.connect();
        }
        else if (this.status === Enums_1.UAStatus.STATUS_USER_CLOSED) {
            this.logger.log("resuming");
            this.status = Enums_1.UAStatus.STATUS_READY;
            this.transport.connect();
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
        if (this.configuration.autostop) {
            // Google Chrome Packaged Apps don't allow 'unload' listeners: unload is not available in packaged apps
            var googleChromePackagedApp = typeof chrome !== "undefined" && chrome.app && chrome.app.runtime ? true : false;
            if (typeof window !== "undefined" &&
                typeof window.addEventListener === "function" &&
                !googleChromePackagedApp) {
                window.addEventListener("unload", this.unloadListener);
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
    UA.prototype.getSupportedResponseOptions = function () {
        var optionTags = [];
        if (this.contact.pubGruu || this.contact.tempGruu) {
            optionTags.push("gruu");
        }
        if (this.configuration.rel100 === Constants_1.C.supported.SUPPORTED) {
            optionTags.push("100rel");
        }
        if (this.configuration.replaces === Constants_1.C.supported.SUPPORTED) {
            optionTags.push("replaces");
        }
        optionTags.push("outbound");
        optionTags = optionTags.concat(this.configuration.extraSupported || []);
        var allowUnregistered = this.configuration.hackAllowUnregisteredOptionTags || false;
        var optionTagSet = {};
        optionTags = optionTags.filter(function (optionTag) {
            var registered = Constants_1.C.OPTION_TAGS[optionTag];
            var unique = !optionTagSet[optionTag];
            optionTagSet[optionTag] = true;
            return (registered || allowUnregistered) && unique;
        });
        return optionTags;
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
    UA.prototype.on = function (name, callback) { return _super.prototype.on.call(this, name, callback); };
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
        this.transport.on("connected", function () { return _this.onTransportConnected(); });
        this.transport.on("message", function (message) { return _this.onTransportReceiveMsg(message); });
        this.transport.on("transportError", function () { return _this.onTransportError(); });
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
        var _this = this;
        var message = core_1.Parser.parseMessage(messageString, this.getLogger("sip.parser"));
        if (!message) {
            this.logger.warn("UA failed to parse incoming SIP message - discarding.");
            return;
        }
        if (this.status === Enums_1.UAStatus.STATUS_USER_CLOSED && message instanceof core_1.IncomingRequestMessage) {
            this.logger.warn("UA received message when status = USER_CLOSED - aborting");
            return;
        }
        // A valid SIP request formulated by a UAC MUST, at a minimum, contain
        // the following header fields: To, From, CSeq, Call-ID, Max-Forwards,
        // and Via; all of these header fields are mandatory in all SIP
        // requests.
        // https://tools.ietf.org/html/rfc3261#section-8.1.1
        var hasMinimumHeaders = function () {
            var mandatoryHeaders = ["from", "to", "call_id", "cseq", "via"];
            for (var _i = 0, mandatoryHeaders_1 = mandatoryHeaders; _i < mandatoryHeaders_1.length; _i++) {
                var header = mandatoryHeaders_1[_i];
                if (!message.hasHeader(header)) {
                    _this.logger.warn("Missing mandatory header field : " + header + ".");
                    return false;
                }
            }
            return true;
        };
        // Request Checks
        if (message instanceof core_1.IncomingRequestMessage) {
            // This is port of SanityCheck.minimumHeaders().
            if (!hasMinimumHeaders()) {
                this.logger.warn("Request missing mandatory header field. Dropping.");
                return;
            }
            // FIXME: This is non-standard and should be a configruable behavior (desirable regardless).
            // Custom SIP.js check to reject request from ourself (this instance of SIP.js).
            // This is port of SanityCheck.rfc3261_16_3_4().
            if (!message.toTag && message.callId.substr(0, 5) === this.configuration.sipjsId) {
                this.userAgentCore.replyStateless(message, { statusCode: 482 });
                return;
            }
            // FIXME: This should be Transport check before we get here (Section 18).
            // Custom SIP.js check to reject requests if body length wrong.
            // This is port of SanityCheck.rfc3261_18_3_request().
            var len = Utils_1.Utils.str_utf8_length(message.body);
            var contentLength = message.getHeader("content-length");
            if (contentLength && len < Number(contentLength)) {
                this.userAgentCore.replyStateless(message, { statusCode: 400 });
                return;
            }
        }
        // Reponse Checks
        if (message instanceof core_1.IncomingResponseMessage) {
            // This is port of SanityCheck.minimumHeaders().
            if (!hasMinimumHeaders()) {
                this.logger.warn("Response missing mandatory header field. Dropping.");
                return;
            }
            // Custom SIP.js check to drop responses if multiple Via headers.
            // This is port of SanityCheck.rfc3261_8_1_3_3().
            if (message.getHeaders("via").length > 1) {
                this.logger.warn("More than one Via header field present in the response. Dropping.");
                return;
            }
            // FIXME: This should be Transport check before we get here (Section 18).
            // Custom SIP.js check to drop responses if bad Via header.
            // This is port of SanityCheck.rfc3261_18_1_2().
            if (message.via.host !== this.configuration.viaHost || message.via.port !== undefined) {
                this.logger.warn("Via sent-by in the response does not match UA Via host value. Dropping.");
                return;
            }
            // FIXME: This should be Transport check before we get here (Section 18).
            // Custom SIP.js check to reject requests if body length wrong.
            // This is port of SanityCheck.rfc3261_18_3_response().
            var len = Utils_1.Utils.str_utf8_length(message.body);
            var contentLength = message.getHeader("content-length");
            if (contentLength && len < Number(contentLength)) {
                this.logger.warn("Message body length is lower than the value in Content-Length header field. Dropping.");
                return;
            }
        }
        // Handle Request
        if (message instanceof core_1.IncomingRequestMessage) {
            this.userAgentCore.receiveIncomingRequestFromTransport(message);
            return;
        }
        // Handle Response
        if (message instanceof core_1.IncomingResponseMessage) {
            this.userAgentCore.receiveIncomingResponseFromTransport(message);
            return;
        }
        throw new Error("Invalid message type.");
    };
    // =================
    // Utils
    // =================
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
            uri: new core_1.URI("sip", "anonymous." + Utils_1.Utils.createRandomToken(6), "anonymous.invalid", undefined, undefined),
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
            usePreloadedRoute: false,
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
                return new core_1.DigestAuthentication(ua.getLoggerFactory(), _this.configuration.authorizationUser, _this.configuration.password);
            }),
            allowLegacyNotifications: false,
            allowOutOfDialogRefers: false,
            experimentalFeatures: false
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
            uri: new core_1.URI("sip", settings.contactName, settings.viaHost, undefined, { transport: settings.contactTransport }),
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
                    var parsed = core_1.Grammar.URIParse(uri);
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
                    if (core_1.Grammar.parse('"' + authorizationUser + '"', "quoted_string") === -1) {
                        return;
                    }
                    else {
                        return authorizationUser;
                    }
                },
                displayName: function (displayName) {
                    if (core_1.Grammar.parse('"' + displayName + '"', "displayName") === -1) {
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
                    else if (typeof hackIpInContact === "string" && core_1.Grammar.parse(hackIpInContact, "host") !== -1) {
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
                usePreloadedRoute: function (usePreloadedRoute) {
                    if (typeof usePreloadedRoute === "boolean") {
                        return usePreloadedRoute;
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
                experimentalFeatures: function (experimentalFeatures) {
                    if (typeof experimentalFeatures === "boolean") {
                        return experimentalFeatures;
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
(function (UA) {
    var DtmfType;
    (function (DtmfType) {
        DtmfType["RTP"] = "rtp";
        DtmfType["INFO"] = "info";
    })(DtmfType = UA.DtmfType || (UA.DtmfType = {}));
})(UA = exports.UA || (exports.UA = {}));
exports.UA = UA;
/**
 * Factory function to generate configuration give a UA.
 * @param ua UA
 */
function makeUserAgentCoreConfigurationFromUA(ua) {
    // FIXME: Configuration URI is a bad mix of types currently. It also needs to exist.
    if (!(ua.configuration.uri instanceof core_1.URI)) {
        throw new Error("Configuration URI not instance of URI.");
    }
    var aor = ua.configuration.uri;
    var contact = ua.contact;
    var displayName = ua.configuration.displayName ? ua.configuration.displayName : "";
    var hackViaTcp = ua.configuration.hackViaTcp ? true : false;
    var routeSet = ua.configuration.usePreloadedRoute && ua.transport.server && ua.transport.server.sipUri ?
        [ua.transport.server.sipUri] :
        [];
    var sipjsId = ua.configuration.sipjsId || Utils_1.Utils.createRandomToken(5);
    var supportedOptionTags = [];
    supportedOptionTags.push("outbound"); // TODO: is this really supported?
    if (ua.configuration.rel100 === Constants_1.C.supported.SUPPORTED) {
        supportedOptionTags.push("100rel");
    }
    if (ua.configuration.replaces === Constants_1.C.supported.SUPPORTED) {
        supportedOptionTags.push("replaces");
    }
    if (ua.configuration.extraSupported) {
        supportedOptionTags.push.apply(supportedOptionTags, ua.configuration.extraSupported);
    }
    if (!ua.configuration.hackAllowUnregisteredOptionTags) {
        supportedOptionTags = supportedOptionTags.filter(function (optionTag) { return Constants_1.C.OPTION_TAGS[optionTag]; });
    }
    supportedOptionTags = Array.from(new Set(supportedOptionTags)); // array of unique values
    var supportedOptionTagsResponse = ua.getSupportedResponseOptions();
    var userAgentHeaderFieldValue = ua.configuration.userAgentString || "sipjs";
    if (!(ua.configuration.viaHost)) {
        throw new Error("Configuration via host undefined");
    }
    var viaForceRport = ua.configuration.forceRport ? true : false;
    var viaHost = ua.configuration.viaHost;
    var configuration = {
        aor: aor,
        contact: contact,
        displayName: displayName,
        hackViaTcp: hackViaTcp,
        loggerFactory: ua.getLoggerFactory(),
        routeSet: routeSet,
        sipjsId: sipjsId,
        supportedOptionTags: supportedOptionTags,
        supportedOptionTagsResponse: supportedOptionTagsResponse,
        userAgentHeaderFieldValue: userAgentHeaderFieldValue,
        viaForceRport: viaForceRport,
        viaHost: viaHost,
        authenticationFactory: function () {
            if (ua.configuration.authenticationFactory) {
                return ua.configuration.authenticationFactory(ua);
            }
            return undefined;
        },
        transportAccessor: function () { return ua.transport; }
    };
    return configuration;
}
exports.makeUserAgentCoreConfigurationFromUA = makeUserAgentCoreConfigurationFromUA;
