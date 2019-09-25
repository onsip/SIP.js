"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var events_1 = require("events");
var core_1 = require("../core");
var utils_1 = require("../core/messages/utils");
var Enums_1 = require("../Enums");
var Parser_1 = require("../Parser");
var version_1 = require("../version");
var SessionDescriptionHandler_1 = require("../Web/SessionDescriptionHandler");
var Transport_1 = require("../Web/Transport");
var invitation_1 = require("./invitation");
var inviter_1 = require("./inviter");
var message_1 = require("./message");
var notification_1 = require("./notification");
var session_state_1 = require("./session-state");
var user_agent_options_1 = require("./user-agent-options");
var user_agent_state_1 = require("./user-agent-state");
/**
 * A user agent sends and receives requests using a `Transport`.
 *
 * @remarks
 * A user agent (UA) is associated with a user via the user's SIP address of record (AOR)
 * and acts on behalf of that user to send and receive SIP requests. The user agent can
 * register to receive incoming requests, as well as create and send outbound messages.
 * The user agent also maintains the Transport over which its signaling travels.
 *
 * @public
 */
var UserAgent = /** @class */ (function () {
    /**
     * Constructs a new instance of the `UserAgent` class.
     * @param options - Options bucket. See {@link UserAgentOptions} for details.
     */
    function UserAgent(options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        /** @internal */
        this.data = {};
        /** @internal */
        this.applicants = {};
        /** @internal */
        this.publishers = {};
        /** @internal */
        this.registerers = {};
        /** @internal */
        this.sessions = {};
        /** @internal */
        this.subscriptions = {};
        /** @internal */
        this.status = Enums_1.UAStatus.STATUS_INIT;
        /** LoggerFactory. */
        this.loggerFactory = new core_1.LoggerFactory();
        this._state = user_agent_state_1.UserAgentState.Initial;
        this._stateEventEmitter = new events_1.EventEmitter();
        /** Unload listener. */
        this.unloadListener = (function () { _this.stop(); });
        // initialize delegate
        this.delegate = options.delegate;
        // initialize configuration
        this.options = tslib_1.__assign(tslib_1.__assign(tslib_1.__assign(tslib_1.__assign(tslib_1.__assign({}, UserAgent.defaultOptions), { sipjsId: utils_1.createRandomToken(5) }), { uri: new core_1.URI("sip", "anonymous." + utils_1.createRandomToken(6), "anonymous.invalid") }), { viaHost: utils_1.createRandomToken(12) + ".invalid" }), options);
        // viaHost is hack
        if (this.options.hackIpInContact) {
            if (typeof this.options.hackIpInContact === "boolean" && this.options.hackIpInContact) {
                var from = 1;
                var to = 254;
                var octet = Math.floor(Math.random() * (to - from + 1) + from);
                // random Test-Net IP (http://tools.ietf.org/html/rfc5735)
                this.options.viaHost = "192.0.2." + octet;
            }
            else if (this.options.hackIpInContact) {
                this.options.viaHost = this.options.hackIpInContact;
            }
        }
        // initialize logger & logger factory
        this.logger = this.loggerFactory.getLogger("sip.UserAgent");
        this.loggerFactory.builtinEnabled = this.options.logBuiltinEnabled;
        this.loggerFactory.connector = this.options.logConnector;
        switch (this.options.logLevel) {
            case "error":
                this.loggerFactory.level = core_1.Levels.error;
                break;
            case "warn":
                this.loggerFactory.level = core_1.Levels.warn;
                break;
            case "log":
                this.loggerFactory.level = core_1.Levels.log;
                break;
            case "debug":
                this.loggerFactory.level = core_1.Levels.debug;
                break;
            default:
                break;
        }
        if (this.options.logConfiguration) {
            this.logger.log("Configuration:");
            Object.keys(this.options).forEach(function (key) {
                var value = _this.options[key];
                switch (key) {
                    case "uri":
                    case "sessionDescriptionHandlerFactory":
                        _this.logger.log("· " + key + ": " + value);
                        break;
                    case "authorizationPassword":
                        _this.logger.log("· " + key + ": " + "NOT SHOWN");
                        break;
                    case "transportConstructor":
                        _this.logger.log("· " + key + ": " + value.name);
                        break;
                    default:
                        _this.logger.log("· " + key + ": " + JSON.stringify(value));
                }
            });
        }
        // initialize transport
        this.transport = new this.options.transportConstructor(this.getLogger("sip.transport"), this.options.transportOptions);
        // initialize contact
        this.contact = this.initContact();
        // initialize core
        this.userAgentCore = this.initCore();
        if (this.options.autoStart) {
            this.start();
        }
    }
    /**
     * Create a URI instance from a string.
     * @param uri - The string to parse.
     *
     * @example
     * ```ts
     * const uri = UserAgent.makeURI("sip:edgar@example.com");
     * ```
     */
    UserAgent.makeURI = function (uri) {
        return core_1.Grammar.URIParse(uri);
    };
    Object.defineProperty(UserAgent.prototype, "configuration", {
        /**
         * User agent configuration.
         */
        get: function () {
            return this.options;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Connect user agent to network transport.
     * @remarks
     * Connect to the WS server if status = STATUS_INIT.
     * Resume UA after being closed.
     */
    UserAgent.prototype.start = function () {
        this.logger.log("user requested startup...");
        if (this.status === Enums_1.UAStatus.STATUS_INIT) {
            this.status = Enums_1.UAStatus.STATUS_STARTING;
            this.setTransportListeners();
            return this.transport.connect();
        }
        else if (this.status === Enums_1.UAStatus.STATUS_USER_CLOSED) {
            this.logger.log("resuming");
            this.status = Enums_1.UAStatus.STATUS_READY;
            return this.transport.connect();
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
        if (this.options.autoStop) {
            // Google Chrome Packaged Apps don't allow 'unload' listeners: unload is not available in packaged apps
            var googleChromePackagedApp = typeof chrome !== "undefined" && chrome.app && chrome.app.runtime ? true : false;
            if (typeof window !== "undefined" &&
                typeof window.addEventListener === "function" &&
                !googleChromePackagedApp) {
                window.addEventListener("unload", this.unloadListener);
            }
        }
        return Promise.resolve();
    };
    /**
     * Gracefully close.
     * Gracefully disconnect from network transport.
     * @remarks
     * Unregisters and terminates active sessions/subscriptions.
     */
    UserAgent.prototype.stop = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _a, _b, _i, id, id, session, subscription, publisher, applicant, googleChromePackagedApp;
            return tslib_1.__generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        this.logger.log("Stopping user agent " + this.configuration.uri + "...");
                        if (this.status === Enums_1.UAStatus.STATUS_USER_CLOSED) {
                            this.logger.warn("UA already closed");
                        }
                        _a = [];
                        for (_b in this.registerers)
                            _a.push(_b);
                        _i = 0;
                        _c.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 4];
                        id = _a[_i];
                        if (!this.registerers[id]) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.registerers[id].dispose()];
                    case 2:
                        _c.sent();
                        _c.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4:
                        // End every Session
                        for (id in this.sessions) {
                            if (this.sessions[id]) {
                                this.logger.log("closing session " + id);
                                session = this.sessions[id];
                                switch (session.state) {
                                    case session_state_1.SessionState.Initial:
                                    case session_state_1.SessionState.Establishing:
                                        if (session instanceof invitation_1.Invitation) {
                                            session.reject();
                                        }
                                        if (session instanceof inviter_1.Inviter) {
                                            session.cancel();
                                        }
                                        break;
                                    case session_state_1.SessionState.Established:
                                        session.bye();
                                        break;
                                    case session_state_1.SessionState.Terminating:
                                    case session_state_1.SessionState.Terminated:
                                    default:
                                        break;
                                }
                            }
                        }
                        // Run unsubscribe on every Subscription
                        for (subscription in this.subscriptions) {
                            if (this.subscriptions[subscription]) {
                                this.logger.log("unsubscribe " + subscription);
                                this.subscriptions[subscription].unsubscribe();
                            }
                        }
                        // Run close on every Publisher
                        for (publisher in this.publishers) {
                            if (this.publishers[publisher]) {
                                this.logger.log("unpublish " + publisher);
                                this.publishers[publisher].close();
                            }
                        }
                        // Run close on every applicant
                        for (applicant in this.applicants) {
                            if (this.applicants[applicant]) {
                                this.applicants[applicant].close();
                            }
                        }
                        this.status = Enums_1.UAStatus.STATUS_USER_CLOSED;
                        // Disconnect the transport and reset user agent core
                        this.transport.disconnect();
                        this.userAgentCore.reset();
                        if (this.options.autoStop) {
                            googleChromePackagedApp = typeof chrome !== "undefined" && chrome.app && chrome.app.runtime ? true : false;
                            if (typeof window !== "undefined" &&
                                window.removeEventListener &&
                                !googleChromePackagedApp) {
                                window.removeEventListener("unload", this.unloadListener);
                            }
                        }
                        return [2 /*return*/, Promise.resolve()];
                }
            });
        });
    };
    /** @internal */
    UserAgent.prototype.findSession = function (request) {
        return this.sessions[request.callId + request.fromTag] ||
            this.sessions[request.callId + request.toTag] ||
            undefined;
    };
    /** @internal */
    UserAgent.prototype.getLogger = function (category, label) {
        return this.loggerFactory.getLogger(category, label);
    };
    /** @internal */
    UserAgent.prototype.getLoggerFactory = function () {
        return this.loggerFactory;
    };
    /** @internal */
    UserAgent.prototype.getSupportedResponseOptions = function () {
        var optionTags = [];
        if (this.contact.pubGruu || this.contact.tempGruu) {
            optionTags.push("gruu");
        }
        if (this.options.sipExtension100rel === user_agent_options_1.SIPExtension.Supported) {
            optionTags.push("100rel");
        }
        if (this.options.sipExtensionReplaces === user_agent_options_1.SIPExtension.Supported) {
            optionTags.push("replaces");
        }
        optionTags.push("outbound");
        optionTags = optionTags.concat(this.options.sipExtensionExtraSupported || []);
        var allowUnregistered = this.options.hackAllowUnregisteredOptionTags || false;
        var optionTagSet = {};
        optionTags = optionTags.filter(function (optionTag) {
            var registered = user_agent_options_1.UserAgentRegisteredOptionTags[optionTag];
            var unique = !optionTagSet[optionTag];
            optionTagSet[optionTag] = true;
            return (registered || allowUnregistered) && unique;
        });
        return optionTags;
    };
    /** @internal */
    UserAgent.prototype.makeInviter = function (targetURI, options) {
        return new inviter_1.Inviter(this, targetURI, options);
    };
    // ==============================
    // Event Handlers
    // ==============================
    UserAgent.prototype.onTransportError = function () {
        if (this.status === Enums_1.UAStatus.STATUS_USER_CLOSED) {
            return;
        }
        this.status = Enums_1.UAStatus.STATUS_NOT_READY;
    };
    /**
     * Helper function. Sets transport listeners
     */
    UserAgent.prototype.setTransportListeners = function () {
        var _this = this;
        this.transport.on("connected", function () { return _this.onTransportConnected(); });
        this.transport.on("message", function (message) { return _this.onTransportReceiveMsg(message); });
        this.transport.on("transportError", function () { return _this.onTransportError(); });
    };
    /**
     * Transport connection event.
     */
    UserAgent.prototype.onTransportConnected = function () {
        // if (this.configuration.register) {
        //   // In an effor to maintain behavior from when we "initialized" an
        //   // authentication factory, this is in a Promise.then
        //   Promise.resolve().then(() => this.registerer.register());
        // }
    };
    /**
     * Handle SIP message received from the transport.
     * @param messageString - The message.
     */
    UserAgent.prototype.onTransportReceiveMsg = function (messageString) {
        var _this = this;
        var message = Parser_1.Parser.parseMessage(messageString, this.getLogger("sip.parser"));
        if (!message) {
            this.logger.warn("Failed to parse incoming message. Dropping.");
            return;
        }
        if (this.status === Enums_1.UAStatus.STATUS_USER_CLOSED && message instanceof core_1.IncomingRequestMessage) {
            this.logger.warn("Received " + message.method + " request in state USER_CLOSED. Dropping.");
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
            if (!message.toTag && message.callId.substr(0, 5) === this.options.sipjsId) {
                this.userAgentCore.replyStateless(message, { statusCode: 482 });
                return;
            }
            // FIXME: This should be Transport check before we get here (Section 18).
            // Custom SIP.js check to reject requests if body length wrong.
            // This is port of SanityCheck.rfc3261_18_3_request().
            var len = utils_1.str_utf8_length(message.body);
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
            if (message.via.host !== this.options.viaHost || message.via.port !== undefined) {
                this.logger.warn("Via sent-by in the response does not match UA Via host value. Dropping.");
                return;
            }
            // FIXME: This should be Transport check before we get here (Section 18).
            // Custom SIP.js check to reject requests if body length wrong.
            // This is port of SanityCheck.rfc3261_18_3_response().
            var len = utils_1.str_utf8_length(message.body);
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
    UserAgent.prototype.initContact = function () {
        var _this = this;
        var contactName = utils_1.createRandomToken(8); // FIXME: should be configurable
        var contactTransport = this.options.hackWssInTransport ? "wss" : "ws"; // FIXME: clearly broken for non ws transports
        var contact = {
            pubGruu: undefined,
            tempGruu: undefined,
            uri: new core_1.URI("sip", contactName, this.options.viaHost, undefined, { transport: contactTransport }),
            toString: function (contactToStringOptions) {
                if (contactToStringOptions === void 0) { contactToStringOptions = {}; }
                var anonymous = contactToStringOptions.anonymous || false;
                var outbound = contactToStringOptions.outbound || false;
                var contactString = "<";
                if (anonymous) {
                    contactString += _this.contact.tempGruu || "sip:anonymous@anonymous.invalid;transport=" + contactTransport;
                }
                else {
                    contactString += _this.contact.pubGruu || _this.contact.uri;
                }
                if (outbound) {
                    contactString += ";ob";
                }
                contactString += ">";
                return contactString;
            }
        };
        return contact;
    };
    UserAgent.prototype.initCore = function () {
        var _this = this;
        // supported options
        var supportedOptionTags = [];
        supportedOptionTags.push("outbound"); // TODO: is this really supported?
        if (this.options.sipExtension100rel === user_agent_options_1.SIPExtension.Supported) {
            supportedOptionTags.push("100rel");
        }
        if (this.options.sipExtensionReplaces === user_agent_options_1.SIPExtension.Supported) {
            supportedOptionTags.push("replaces");
        }
        if (this.options.sipExtensionExtraSupported) {
            supportedOptionTags.push.apply(supportedOptionTags, this.options.sipExtensionExtraSupported);
        }
        if (!this.options.hackAllowUnregisteredOptionTags) {
            supportedOptionTags = supportedOptionTags.filter(function (optionTag) { return user_agent_options_1.UserAgentRegisteredOptionTags[optionTag]; });
        }
        supportedOptionTags = Array.from(new Set(supportedOptionTags)); // array of unique values
        // FIXME: TODO: This was ported, but this is and was just plain broken.
        var supportedOptionTagsResponse = supportedOptionTags.slice();
        if (this.contact.pubGruu || this.contact.tempGruu) {
            supportedOptionTagsResponse.push("gruu");
        }
        // core configuration
        var userAgentCoreConfiguration = {
            aor: this.options.uri,
            contact: this.contact,
            displayName: this.options.displayName,
            loggerFactory: this.loggerFactory,
            hackViaTcp: this.options.hackViaTcp,
            routeSet: this.options.usePreloadedRoute && this.transport.server && this.transport.server.sipUri ?
                [this.transport.server.sipUri] :
                [],
            supportedOptionTags: supportedOptionTags,
            supportedOptionTagsResponse: supportedOptionTagsResponse,
            sipjsId: this.options.sipjsId,
            userAgentHeaderFieldValue: this.options.userAgentString,
            viaForceRport: this.options.forceRport,
            viaHost: this.options.viaHost,
            authenticationFactory: function () {
                var username = _this.options.authorizationUsername ?
                    _this.options.authorizationUsername :
                    _this.options.uri.user; // if authorization username not provided, use uri user as username
                var password = _this.options.authorizationPassword ?
                    _this.options.authorizationPassword :
                    undefined;
                return new core_1.DigestAuthentication(_this.getLoggerFactory(), username, password);
            },
            transportAccessor: function () { return _this.transport; }
        };
        var userAgentCoreDelegate = {
            onInvite: function (incomingInviteRequest) {
                var invitation = new invitation_1.Invitation(_this, incomingInviteRequest);
                incomingInviteRequest.delegate = {
                    onCancel: function (cancel) {
                        invitation.onCancel(cancel);
                    },
                    onTransportError: function (error) {
                        // A server transaction MUST NOT discard transaction state based only on
                        // encountering a non-recoverable transport error when sending a
                        // response.  Instead, the associated INVITE server transaction state
                        // machine MUST remain in its current state.  (Timers will eventually
                        // cause it to transition to the "Terminated" state).
                        // https://tools.ietf.org/html/rfc6026#section-7.1
                        // As noted in the comment above, we are to leaving it to the transaction
                        // timers to evenutally cause the transaction to sort itself out in the case
                        // of a transport failure in an invite server transaction. This delegate method
                        // is here simply here for completeness and to make it clear that it provides
                        // nothing more than informational hook into the core. That is, if you think
                        // you should be trying to deal with a transport error here, you are likely wrong.
                        _this.logger.error("A transport error has occured while handling an incoming INVITE request.");
                    }
                };
                // FIXME: Ported - 100 Trying send should be configurable.
                // Only required if TU will not respond in 200ms.
                // https://tools.ietf.org/html/rfc3261#section-17.2.1
                incomingInviteRequest.trying();
                // The Replaces header contains information used to match an existing
                // SIP dialog (call-id, to-tag, and from-tag).  Upon receiving an INVITE
                // with a Replaces header, the User Agent (UA) attempts to match this
                // information with a confirmed or early dialog.
                // https://tools.ietf.org/html/rfc3891#section-3
                if (_this.options.sipExtensionReplaces !== user_agent_options_1.SIPExtension.Unsupported) {
                    var message = incomingInviteRequest.message;
                    var replaces = message.parseHeader("replaces");
                    if (replaces) {
                        var callId = replaces.call_id;
                        if (typeof callId !== "string") {
                            throw new Error("Type of call id is not string");
                        }
                        var toTag = replaces.replaces_to_tag;
                        if (typeof toTag !== "string") {
                            throw new Error("Type of to tag is not string");
                        }
                        var fromTag = replaces.replaces_from_tag;
                        if (typeof fromTag !== "string") {
                            throw new Error("type of from tag is not string");
                        }
                        var targetDialogId = callId + toTag + fromTag;
                        var targetDialog = _this.userAgentCore.dialogs.get(targetDialogId);
                        // If no match is found, the UAS rejects the INVITE and returns a 481
                        // Call/Transaction Does Not Exist response.  Likewise, if the Replaces
                        // header field matches a dialog which was not created with an INVITE,
                        // the UAS MUST reject the request with a 481 response.
                        // https://tools.ietf.org/html/rfc3891#section-3
                        if (!targetDialog) {
                            invitation.reject({ statusCode: 481 });
                            return;
                        }
                        // If the Replaces header field matches a confirmed dialog, it checks
                        // for the presence of the "early-only" flag in the Replaces header
                        // field.  (This flag allows the UAC to prevent a potentially
                        // undesirable race condition described in Section 7.1.) If the flag is
                        // present, the UA rejects the request with a 486 Busy response.
                        // https://tools.ietf.org/html/rfc3891#section-3
                        if (!targetDialog.early && replaces.early_only === true) {
                            invitation.reject({ statusCode: 486 });
                            return;
                        }
                        // Provide a handle on the session being replaced.
                        var targetSession = _this.sessions[callId + fromTag] || _this.sessions[callId + toTag] || undefined;
                        if (!targetSession) {
                            throw new Error("Session does not exist.");
                        }
                        invitation.replacee = targetSession;
                    }
                }
                // A common scenario occurs when the callee is currently not willing or
                // able to take additional calls at this end system.  A 486 (Busy Here)
                // SHOULD be returned in such a scenario.
                // https://tools.ietf.org/html/rfc3261#section-13.3.1.3
                if (!_this.delegate || !_this.delegate.onInvite) {
                    invitation.reject({ statusCode: 486 });
                    return;
                }
                // Delegate invitation handling.
                if (!invitation.autoSendAnInitialProvisionalResponse) {
                    _this.delegate.onInvite(invitation);
                }
                else {
                    var onInvite_1 = _this.delegate.onInvite;
                    invitation.progress()
                        .then(function () { return onInvite_1(invitation); });
                }
            },
            onMessage: function (incomingMessageRequest) {
                if (_this.delegate && _this.delegate.onMessage) {
                    var message = new message_1.Message(incomingMessageRequest);
                    _this.delegate.onMessage(message);
                }
                else {
                    // Accept the MESSAGE request, but do nothing with it.
                    incomingMessageRequest.accept();
                }
            },
            onNotify: function (incomingNotifyRequest) {
                // NOTIFY requests are sent to inform subscribers of changes in state to
                // which the subscriber has a subscription.  Subscriptions are created
                // using the SUBSCRIBE method.  In legacy implementations, it is
                // possible that other means of subscription creation have been used.
                // However, this specification does not allow the creation of
                // subscriptions except through SUBSCRIBE requests and (for backwards-
                // compatibility) REFER requests [RFC3515].
                // https://tools.ietf.org/html/rfc6665#section-3.2
                if (_this.delegate && _this.delegate.onNotify) {
                    var notification = new notification_1.Notification(incomingNotifyRequest);
                    _this.delegate.onNotify(notification);
                }
                else {
                    // Per the above which sbsoletes https://tools.ietf.org/html/rfc3265,
                    // the use of out of dialog NOTIFY is obsolete, but...
                    if (_this.options.allowLegacyNotifications) {
                        incomingNotifyRequest.accept(); // Accept the NOTIFY request, but do nothing with it.
                    }
                    else {
                        incomingNotifyRequest.reject({ statusCode: 481 });
                    }
                }
            },
            onRefer: function (incomingReferRequest) {
                _this.logger.log("Received an out of dialog refer");
                if (!_this.options.allowOutOfDialogRefers) {
                    incomingReferRequest.reject({ statusCode: 405 });
                }
                _this.logger.log("Allow out of dialog refers is enabled on the UA");
                // const referContext = new ReferServerContext(this, incomingReferRequest);
                // if (this.listeners("outOfDialogReferRequested").length) {
                //   this.emit("outOfDialogReferRequested", referContext);
                // } else {
                //   this.logger.log(
                //     "No outOfDialogReferRequest listeners, automatically accepting and following the out of dialog refer"
                //   );
                //   referContext.accept({ followRefer: true });
                // }
                // if (this.delegate && this.delegate.onRefer) {
                //   this.delegate.onRefer(incomingReferRequest);
                // }
            },
            onRegister: function (incomingRegisterRequest) {
                // TOOD: this.delegate.onRegister(...)
                if (_this.delegate && _this.delegate.onRegisterRequest) {
                    _this.delegate.onRegisterRequest(incomingRegisterRequest);
                }
            },
            onSubscribe: function (incomingSubscribeRequest) {
                // TOOD: this.delegate.onSubscribe(...)
                if (_this.delegate && _this.delegate.onSubscribeRequest) {
                    _this.delegate.onSubscribeRequest(incomingSubscribeRequest);
                }
            }
        };
        return new core_1.UserAgentCore(userAgentCoreConfiguration, userAgentCoreDelegate);
    };
    /** Default user agent options. */
    UserAgent.defaultOptions = {
        allowLegacyNotifications: false,
        allowOutOfDialogRefers: false,
        authorizationPassword: "",
        authorizationUsername: "",
        autoStart: false,
        autoStop: true,
        delegate: {},
        displayName: "",
        forceRport: false,
        hackAllowUnregisteredOptionTags: false,
        hackIpInContact: false,
        hackViaTcp: false,
        hackWssInTransport: false,
        logBuiltinEnabled: true,
        logConfiguration: true,
        logConnector: function () { },
        logLevel: "log",
        noAnswerTimeout: 60,
        sessionDescriptionHandlerFactory: SessionDescriptionHandler_1.SessionDescriptionHandler.defaultFactory,
        sessionDescriptionHandlerFactoryOptions: {},
        sipExtension100rel: user_agent_options_1.SIPExtension.Unsupported,
        sipExtensionReplaces: user_agent_options_1.SIPExtension.Unsupported,
        sipExtensionExtraSupported: [],
        sipjsId: "",
        transportConstructor: Transport_1.Transport,
        transportOptions: {},
        uri: new core_1.URI("sip", "anonymous", "anonymous.invalid"),
        usePreloadedRoute: false,
        userAgentString: "SIP.js/" + version_1.LIBRARY_VERSION,
        viaHost: ""
    };
    return UserAgent;
}());
exports.UserAgent = UserAgent;
