"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var events_1 = require("events");
var Constants_1 = require("../Constants");
var core_1 = require("../core");
var Enums_1 = require("../Enums");
var Parser_1 = require("../Parser");
var Utils_1 = require("../Utils");
var SessionDescriptionHandler_1 = require("../Web/SessionDescriptionHandler");
var Transport_1 = require("../Web/Transport");
var invitation_1 = require("./invitation");
var inviter_1 = require("./inviter");
var message_1 = require("./message");
var notification_1 = require("./notification");
var session_state_1 = require("./session-state");
var user_agent_options_1 = require("./user-agent-options");
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
var UserAgent = /** @class */ (function (_super) {
    tslib_1.__extends(UserAgent, _super);
    /**
     * Constructs a new instance of the `UserAgent` class.
     * @param options - Options bucket. See {@link UserAgentOptions} for details.
     */
    function UserAgent(options) {
        if (options === void 0) { options = {}; }
        var _this = _super.call(this) || this;
        /** @internal */
        _this.data = {};
        /** @internal */
        _this.applicants = {};
        /** @internal */
        _this.publishers = {};
        /** @internal */
        _this.sessions = {};
        /** @internal */
        _this.subscriptions = {};
        /** @internal */
        _this.status = Enums_1.UAStatus.STATUS_INIT;
        /** LoggerFactory. */
        _this.loggerFactory = new core_1.LoggerFactory();
        /** Unload listener. */
        _this.unloadListener = (function () { _this.stop(); });
        // initialize delegate
        _this.delegate = options.delegate;
        // initialize configuration
        _this.options = tslib_1.__assign({}, UserAgent.defaultOptions, { sipjsId: Utils_1.Utils.createRandomToken(5) }, { uri: new core_1.URI("sip", "anonymous." + Utils_1.Utils.createRandomToken(6), "anonymous.invalid") }, { viaHost: Utils_1.Utils.createRandomToken(12) + ".invalid" }, options);
        // viaHost is hack
        if (_this.options.hackIpInContact) {
            if (typeof _this.options.hackIpInContact === "boolean" && _this.options.hackIpInContact) {
                var from = 1;
                var to = 254;
                var octet = Math.floor(Math.random() * (to - from + 1) + from);
                // random Test-Net IP (http://tools.ietf.org/html/rfc5735)
                _this.options.viaHost = "192.0.2." + octet;
            }
            else if (_this.options.hackIpInContact) {
                _this.options.viaHost = _this.options.hackIpInContact;
            }
        }
        // initialize logger & logger factory
        _this.logger = _this.loggerFactory.getLogger("sip.UserAgent");
        _this.loggerFactory.builtinEnabled = _this.options.logBuiltinEnabled;
        _this.loggerFactory.connector = _this.options.logConnector;
        switch (_this.options.logLevel) {
            case "error":
                _this.loggerFactory.level = core_1.Levels.error;
                break;
            case "warn":
                _this.loggerFactory.level = core_1.Levels.warn;
                break;
            case "log":
                _this.loggerFactory.level = core_1.Levels.log;
                break;
            case "debug":
                _this.loggerFactory.level = core_1.Levels.debug;
                break;
            default:
                break;
        }
        _this.logger.log("configuration parameters after validation:");
        for (var _i = 0, _a = Object.entries(_this.options); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], value = _b[1];
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
        }
        // initialize transport
        _this.transport = new _this.options.transportConstructor(_this.getLogger("sip.transport"), _this.options.transportOptions);
        // initialize contact
        _this.contact = _this.initContact();
        // initialize core
        _this.userAgentCore = _this.initCore();
        if (_this.options.autoStart) {
            _this.start();
        }
        return _this;
    }
    Object.defineProperty(UserAgent.prototype, "configuration", {
        get: function () {
            return this.options;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Normalize a string into a valid SIP request URI.
     * @param target - The target.
     */
    UserAgent.prototype.makeTargetURI = function (target) {
        var uri = this.options.uri.clone();
        uri.user = undefined;
        var hostportParams = uri.toRaw().replace(/^sip:/i, "");
        return Utils_1.Utils.normalizeTarget(target, hostportParams);
    };
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
            if (typeof window !== "undefined" && !googleChromePackagedApp) {
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
        this.logger.log("user requested closure...");
        if (this.status === Enums_1.UAStatus.STATUS_USER_CLOSED) {
            this.logger.warn("UA already closed");
        }
        // Close registerContext
        // this.logger.log("closing registerContext");
        // this.registerer.close();
        // End every Session
        for (var id in this.sessions) {
            if (this.sessions[id]) {
                this.logger.log("closing session " + id);
                var session = this.sessions[id];
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
        if (this.options.autoStop) {
            // Google Chrome Packaged Apps don't allow 'unload' listeners: unload is not available in packaged apps
            var googleChromePackagedApp = typeof chrome !== "undefined" && chrome.app && chrome.app.runtime ? true : false;
            if (typeof window !== "undefined" && !googleChromePackagedApp) {
                window.removeEventListener("unload", this.unloadListener);
            }
        }
        return Promise.resolve();
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
            var registered = Constants_1.C.OPTION_TAGS[optionTag];
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
    /** @internal */
    UserAgent.prototype.on = function (name, callback) { return _super.prototype.on.call(this, name, callback); };
    // ==============================
    // Event Handlers
    // ==============================
    UserAgent.prototype.onTransportError = function () {
        if (this.status === Enums_1.UAStatus.STATUS_USER_CLOSED) {
            return;
        }
        if (!this.error || this.error !== UserAgent.C.NETWORK_ERROR) {
            this.status = Enums_1.UAStatus.STATUS_NOT_READY;
            this.error = UserAgent.C.NETWORK_ERROR;
        }
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
            if (!message.toTag && message.callId.substr(0, 5) === this.options.sipjsId) {
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
            if (message.via.host !== this.options.viaHost || message.via.port !== undefined) {
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
    UserAgent.prototype.initContact = function () {
        var _this = this;
        var contactName = Utils_1.Utils.createRandomToken(8); // FIXME: should be configurable
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
        // The Replaces header contains information used to match an existing
        // SIP dialog (call-id, to-tag, and from-tag).  Upon receiving an INVITE
        // with a Replaces header, the User Agent (UA) attempts to match this
        // information with a confirmed or early dialog.
        // https://tools.ietf.org/html/rfc3891#section-3
        var handleInviteWithReplacesHeader = function (context, request) {
            if (_this.options.sipExtensionReplaces !== user_agent_options_1.SIPExtension.Unsupported) {
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
                var context = new invitation_1.Invitation(_this, incomingInviteRequest);
                // Ported - handling of out of dialog INVITE with Replaces.
                handleInviteWithReplacesHeader(context, incomingInviteRequest.message);
                // Ported - make the first call to progress automatically.
                if (context.autoSendAnInitialProvisionalResponse) {
                    context.progress();
                }
                if (_this.delegate && _this.delegate.onInvite) {
                    _this.delegate.onInvite(context);
                }
                else {
                    // TODO: If no delegate, reject the request.
                }
                // DEPRECATED
                _this.emit("invite", context);
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
                // DEPRECATED
                if (_this.options.allowLegacyNotifications && _this.listeners("notify").length > 0) {
                    _this.emit("notify", { request: incomingNotifyRequest.message });
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
            onSubscribe: function (incomingSubscribeRequest) {
                _this.emit("subscribe", incomingSubscribeRequest);
                // if (this.delegate && this.delegate.onSubscribe) {
                //   this.delegate.onSubscribe(incomingSubscribeRequest);
                // }
            }
        };
        return new core_1.UserAgentCore(userAgentCoreConfiguration, userAgentCoreDelegate);
    };
    /** @internal */
    UserAgent.C = {
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
    /** Default user agent options. */
    UserAgent.defaultOptions = {
        allowLegacyNotifications: false,
        allowOutOfDialogRefers: false,
        authorizationPassword: "",
        authorizationUsername: "",
        autoStart: true,
        autoStop: true,
        delegate: {},
        displayName: "",
        forceRport: false,
        hackAllowUnregisteredOptionTags: false,
        hackIpInContact: false,
        hackViaTcp: false,
        hackWssInTransport: false,
        logBuiltinEnabled: true,
        logLevel: "log",
        logConnector: function () { },
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
        userAgentString: Constants_1.C.USER_AGENT,
        viaHost: ""
    };
    return UserAgent;
}(events_1.EventEmitter));
exports.UserAgent = UserAgent;
