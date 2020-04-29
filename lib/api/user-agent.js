"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const events_1 = require("events");
const core_1 = require("../core");
const utils_1 = require("../core/messages/utils");
const session_description_handler_1 = require("../platform/web/session-description-handler");
const transport_1 = require("../platform/web/transport");
const version_1 = require("../version");
const emitter_1 = require("./emitter");
const invitation_1 = require("./invitation");
const inviter_1 = require("./inviter");
const message_1 = require("./message");
const notification_1 = require("./notification");
const user_agent_options_1 = require("./user-agent-options");
const user_agent_state_1 = require("./user-agent-state");
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
class UserAgent {
    /**
     * Constructs a new instance of the `UserAgent` class.
     * @param options - Options bucket. See {@link UserAgentOptions} for details.
     */
    constructor(options = {}) {
        /** @internal */
        this._publishers = {};
        /** @internal */
        this._registerers = {};
        /** @internal */
        this._sessions = {};
        /** @internal */
        this._subscriptions = {};
        this._state = user_agent_state_1.UserAgentState.Stopped;
        this._stateEventEmitter = new events_1.EventEmitter();
        /** LoggerFactory. */
        this.loggerFactory = new core_1.LoggerFactory();
        /** Unload listener. */
        this.unloadListener = (() => { this.stop(); });
        // initialize delegate
        this.delegate = options.delegate;
        // initialize configuration
        this.options = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, UserAgent.defaultOptions), { sipjsId: utils_1.createRandomToken(5) }), { uri: new core_1.URI("sip", "anonymous." + utils_1.createRandomToken(6), "anonymous.invalid") }), { viaHost: utils_1.createRandomToken(12) + ".invalid" }), UserAgent.stripUndefinedProperties(options));
        // viaHost is hack
        if (this.options.hackIpInContact) {
            if (typeof this.options.hackIpInContact === "boolean" && this.options.hackIpInContact) {
                const from = 1;
                const to = 254;
                const octet = Math.floor(Math.random() * (to - from + 1) + from);
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
            Object.keys(this.options).forEach((key) => {
                const value = this.options[key];
                switch (key) {
                    case "uri":
                    case "sessionDescriptionHandlerFactory":
                        this.logger.log("· " + key + ": " + value);
                        break;
                    case "authorizationPassword":
                        this.logger.log("· " + key + ": " + "NOT SHOWN");
                        break;
                    case "transportConstructor":
                        this.logger.log("· " + key + ": " + value.name);
                        break;
                    default:
                        this.logger.log("· " + key + ": " + JSON.stringify(value));
                }
            });
        }
        // guard deprecated transport options (remove this in version 16.x)
        if (this.options.transportOptions) {
            const optionsDeprecated = this.options.transportOptions;
            const maxReconnectionAttemptsDeprecated = optionsDeprecated.maxReconnectionAttempts;
            const reconnectionTimeoutDeprecated = optionsDeprecated.reconnectionTimeout;
            if (maxReconnectionAttemptsDeprecated !== undefined) {
                const deprecatedMessage = `The transport option "maxReconnectionAttempts" as has apparently been specified and has been deprecated. ` +
                    "It will no longer be available starting with SIP.js release 0.16.0. Please update accordingly.";
                this.logger.warn(deprecatedMessage);
            }
            if (reconnectionTimeoutDeprecated !== undefined) {
                const deprecatedMessage = `The transport option "reconnectionTimeout" as has apparently been specified and has been deprecated. ` +
                    "It will no longer be available starting with SIP.js release 0.16.0. Please update accordingly.";
                this.logger.warn(deprecatedMessage);
            }
            // hack
            if (options.reconnectionDelay === undefined && reconnectionTimeoutDeprecated !== undefined) {
                this.options.reconnectionDelay = reconnectionTimeoutDeprecated;
            }
            if (options.reconnectionAttempts === undefined && maxReconnectionAttemptsDeprecated !== undefined) {
                this.options.reconnectionAttempts = maxReconnectionAttemptsDeprecated;
            }
        }
        // guard deprecated user agent options (remove this in version 16.x)
        if (options.reconnectionDelay !== undefined) {
            const deprecatedMessage = `The user agent option "reconnectionDelay" as has apparently been specified and has been deprecated. ` +
                "It will no longer be available starting with SIP.js release 0.16.0. Please update accordingly.";
            this.logger.warn(deprecatedMessage);
        }
        if (options.reconnectionAttempts !== undefined) {
            const deprecatedMessage = `The user agent option "reconnectionAttempts" as has apparently been specified and has been deprecated. ` +
                "It will no longer be available starting with SIP.js release 0.16.0. Please update accordingly.";
            this.logger.warn(deprecatedMessage);
        }
        // Initialize Transport
        this._transport = new this.options.transportConstructor(this.getLogger("sip.Transport"), this.options.transportOptions);
        this.initTransportCallbacks();
        // Initialize Contact
        this._contact = this.initContact();
        // Initialize UserAgentCore
        this._userAgentCore = this.initCore();
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
    static makeURI(uri) {
        return core_1.Grammar.URIParse(uri);
    }
    /**
     * Strip properties with undefined values from options.
     * This is a work around while waiting for missing vs undefined to be addressed (or not)...
     * https://github.com/Microsoft/TypeScript/issues/13195
     * @param options - Options to reduce
     */
    static stripUndefinedProperties(options) {
        return Object.keys(options).reduce((object, key) => {
            if (options[key] !== undefined) {
                object[key] = options[key];
            }
            return object;
        }, {});
    }
    /**
     * User agent configuration.
     */
    get configuration() {
        return this.options;
    }
    /**
     * User agent contact.
     */
    get contact() {
        return this._contact;
    }
    /**
     * User agent state.
     */
    get state() {
        return this._state;
    }
    /**
     * User agent state change emitter.
     */
    get stateChange() {
        return emitter_1._makeEmitter(this._stateEventEmitter);
    }
    /**
     * User agent transport.
     */
    get transport() {
        return this._transport;
    }
    /**
     * User agent core.
     */
    get userAgentCore() {
        return this._userAgentCore;
    }
    /**
     * The logger.
     */
    getLogger(category, label) {
        return this.loggerFactory.getLogger(category, label);
    }
    /**
     * The logger factory.
     */
    getLoggerFactory() {
        return this.loggerFactory;
    }
    /**
     * True if transport is connected.
     */
    isConnected() {
        return this.transport.isConnected();
    }
    /**
     * Reconnect the transport.
     */
    reconnect() {
        if (this.state === user_agent_state_1.UserAgentState.Stopped) {
            return Promise.reject(new Error("User agent stopped."));
        }
        // Make sure we don't call synchronously
        return Promise.resolve().then(() => this.transport.connect());
    }
    /**
     * Start the user agent.
     *
     * @remarks
     * Resolves if transport connects, otherwise rejects.
     *
     * @example
     * ```ts
     * userAgent.start()
     *   .then(() => {
     *     // userAgent.isConnected() === true
     *   })
     *   .catch((error: Error) => {
     *     // userAgent.isConnected() === false
     *   });
     * ```
     */
    start() {
        if (this.state === user_agent_state_1.UserAgentState.Started) {
            this.logger.warn(`User agent already started`);
            return Promise.resolve();
        }
        this.logger.log(`Starting ${this.configuration.uri}`);
        // Transition state
        this.transitionState(user_agent_state_1.UserAgentState.Started);
        // TODO: Review this as it is not clear it has any benefit and at worst causes additional load the server.
        // On unload it may be best to simply in most scenarios to do nothing. Furthermore and regardless, this
        // kind of behavior seems more appropriate to be managed by the consumer of the API than the API itself.
        // Should this perhaps be deprecated?
        //
        // Add window unload event listener
        if (this.options.autoStop) {
            // Google Chrome Packaged Apps don't allow 'unload' listeners: unload is not available in packaged apps
            const googleChromePackagedApp = typeof chrome !== "undefined" && chrome.app && chrome.app.runtime ? true : false;
            if (typeof window !== "undefined" &&
                typeof window.addEventListener === "function" &&
                !googleChromePackagedApp) {
                window.addEventListener("unload", this.unloadListener);
            }
        }
        return this.transport.connect();
    }
    /**
     * Stop the user agent.
     *
     * @remarks
     * Resolves when the user agent has completed a graceful shutdown.
     * ```txt
     * 1) Sessions terminate.
     * 2) Registerers unregister.
     * 3) Subscribers unsubscribe.
     * 4) Publishers unpublish.
     * 5) Transport disconnects.
     * 6) User Agent Core resets.
     * ```
     * NOTE: While this is a "graceful shutdown", it can also be very slow one if you
     * are waiting for the returned Promise to resolve. The disposal of the clients and
     * dialogs is done serially - waiting on one to finish before moving on to the next.
     * This can be slow if there are lot of subscriptions to unsubscribe for example.
     *
     * THE SLOW PACE IS INTENTIONAL!
     * While one could spin them all down in parallel, this could slam the remote server.
     * It is bad practice to denial of service attack (DoS attack) servers!!!
     * Moreover, production servers will automatically blacklist clients which send too
     * many requests in too short a period of time - dropping any additional requests.
     *
     * If a different approach to disposing is needed, one can implement whatever is
     * needed and execute that prior to calling `stop()`. Alternatively one may simply
     * not wait for the Promise returned by `stop()` to complete.
     */
    stop() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (this.state === user_agent_state_1.UserAgentState.Stopped) {
                this.logger.warn(`User agent already stopped`);
                return Promise.resolve();
            }
            this.logger.log(`Stopping ${this.configuration.uri}`);
            // Transition state
            this.transitionState(user_agent_state_1.UserAgentState.Stopped);
            // TODO: See comments with associated complimentary code in start(). Should this perhaps be deprecated?
            // Remove window unload event listener
            if (this.options.autoStop) {
                // Google Chrome Packaged Apps don't allow 'unload' listeners: unload is not available in packaged apps
                const googleChromePackagedApp = typeof chrome !== "undefined" && chrome.app && chrome.app.runtime ? true : false;
                if (typeof window !== "undefined" &&
                    window.removeEventListener &&
                    !googleChromePackagedApp) {
                    window.removeEventListener("unload", this.unloadListener);
                }
            }
            // Be careful here to use a local references as start() can be called
            // again before we complete and we don't want to touch new clients
            // and we don't want to step on the new instances (or vice versa).
            const publishers = Object.assign({}, this._publishers);
            const registerers = Object.assign({}, this._registerers);
            const sessions = Object.assign({}, this._sessions);
            const subscriptions = Object.assign({}, this._subscriptions);
            const transport = this.transport;
            const userAgentCore = this.userAgentCore;
            //
            // At this point we have completed the state transition and everything
            // following will effectively run async and MUST NOT cause any issues
            // if UserAgent.start() is called while the following code continues.
            //
            // TODO: Minor optimization.
            // The disposal in all cases involves, in part, sending messages which
            // is not worth doing if the transport is not connected as we know attempting
            // to send messages will be futile. But none of these disposal methods check
            // if that's is the case and it would be easy for them to do so at this point.
            // Dispose of Registerers
            this.logger.log(`Dispose of registerers`);
            for (const id in registerers) {
                if (registerers[id]) {
                    yield registerers[id].dispose()
                        .catch((error) => {
                        this.logger.error(error.message);
                        delete this._registerers[id];
                        throw error;
                    });
                }
            }
            // Dispose of Sessions
            this.logger.log(`Dispose of sessions`);
            for (const id in sessions) {
                if (sessions[id]) {
                    yield sessions[id].dispose()
                        .catch((error) => {
                        this.logger.error(error.message);
                        delete this._sessions[id];
                        throw error;
                    });
                }
            }
            // Dispose of Subscriptions
            this.logger.log(`Dispose of subscriptions`);
            for (const id in subscriptions) {
                if (subscriptions[id]) {
                    yield subscriptions[id].dispose()
                        .catch((error) => {
                        this.logger.error(error.message);
                        delete this._subscriptions[id];
                        throw error;
                    });
                }
            }
            // Dispose of Publishers
            this.logger.log(`Dispose of publishers`);
            for (const id in publishers) {
                if (publishers[id]) {
                    yield publishers[id].dispose()
                        .catch((error) => {
                        this.logger.error(error.message);
                        delete this._publishers[id];
                        throw error;
                    });
                }
            }
            // Dispose of the transport (disconnecting)
            this.logger.log(`Dispose of transport`);
            yield transport.dispose()
                .catch((error) => {
                this.logger.error(error.message);
                throw error;
            });
            // Dispose of the user agent core (resetting)
            this.logger.log(`Dispose of core`);
            userAgentCore.dispose();
        });
    }
    /**
     * Used to avoid circular references.
     * @internal
     */
    _makeInviter(targetURI, options) {
        return new inviter_1.Inviter(this, targetURI, options);
    }
    /**
     * Attempt reconnection up to `maxReconnectionAttempts` times.
     * @param reconnectionAttempt - Current attempt number.
     */
    attemptReconnection(reconnectionAttempt = 1) {
        const reconnectionAttempts = this.options.reconnectionAttempts;
        const reconnectionDelay = this.options.reconnectionDelay;
        if (reconnectionAttempt > reconnectionAttempts) {
            this.logger.log(`Maximum reconnection attempts reached`);
            return;
        }
        this.logger.log(`Reconnection attempt ${reconnectionAttempt} of ${reconnectionAttempts} - trying`);
        setTimeout(() => {
            this.reconnect()
                .then(() => {
                this.logger.log(`Reconnection attempt ${reconnectionAttempt} of ${reconnectionAttempts} - succeeded`);
            })
                .catch((error) => {
                this.logger.error(error.message);
                this.logger.log(`Reconnection attempt ${reconnectionAttempt} of ${reconnectionAttempts} - failed`);
                this.attemptReconnection(++reconnectionAttempt);
            });
        }, reconnectionAttempt === 1 ? 0 : reconnectionDelay * 1000);
    }
    /**
     * Initialize contact.
     */
    initContact() {
        const contactName = utils_1.createRandomToken(8); // FIXME: should be configurable
        const contactTransport = this.options.hackWssInTransport ? "wss" : "ws"; // FIXME: clearly broken for non ws transports
        const contact = {
            pubGruu: undefined,
            tempGruu: undefined,
            uri: new core_1.URI("sip", contactName, this.options.viaHost, undefined, { transport: contactTransport }),
            toString: (contactToStringOptions = {}) => {
                const anonymous = contactToStringOptions.anonymous || false;
                const outbound = contactToStringOptions.outbound || false;
                let contactString = "<";
                if (anonymous) {
                    contactString += this.contact.tempGruu || `sip:anonymous@anonymous.invalid;transport=${contactTransport}`;
                }
                else {
                    contactString += this.contact.pubGruu || this.contact.uri;
                }
                if (outbound) {
                    contactString += ";ob";
                }
                contactString += ">";
                return contactString;
            }
        };
        return contact;
    }
    /**
     * Initialize user agent core.
     */
    initCore() {
        // supported options
        let supportedOptionTags = [];
        supportedOptionTags.push("outbound"); // TODO: is this really supported?
        if (this.options.sipExtension100rel === user_agent_options_1.SIPExtension.Supported) {
            supportedOptionTags.push("100rel");
        }
        if (this.options.sipExtensionReplaces === user_agent_options_1.SIPExtension.Supported) {
            supportedOptionTags.push("replaces");
        }
        if (this.options.sipExtensionExtraSupported) {
            supportedOptionTags.push(...this.options.sipExtensionExtraSupported);
        }
        if (!this.options.hackAllowUnregisteredOptionTags) {
            supportedOptionTags = supportedOptionTags.filter((optionTag) => user_agent_options_1.UserAgentRegisteredOptionTags[optionTag]);
        }
        supportedOptionTags = Array.from(new Set(supportedOptionTags)); // array of unique values
        // FIXME: TODO: This was ported, but this is and was just plain broken.
        const supportedOptionTagsResponse = supportedOptionTags.slice();
        if (this.contact.pubGruu || this.contact.tempGruu) {
            supportedOptionTagsResponse.push("gruu");
        }
        // core configuration
        const userAgentCoreConfiguration = {
            aor: this.options.uri,
            contact: this.contact,
            displayName: this.options.displayName,
            loggerFactory: this.loggerFactory,
            hackViaTcp: this.options.hackViaTcp,
            routeSet: this.options.preloadedRouteSet,
            supportedOptionTags,
            supportedOptionTagsResponse,
            sipjsId: this.options.sipjsId,
            userAgentHeaderFieldValue: this.options.userAgentString,
            viaForceRport: this.options.forceRport,
            viaHost: this.options.viaHost,
            authenticationFactory: () => {
                const username = this.options.authorizationUsername ?
                    this.options.authorizationUsername :
                    this.options.uri.user; // if authorization username not provided, use uri user as username
                const password = this.options.authorizationPassword ?
                    this.options.authorizationPassword :
                    undefined;
                return new core_1.DigestAuthentication(this.getLoggerFactory(), username, password);
            },
            transportAccessor: () => this.transport
        };
        const userAgentCoreDelegate = {
            onInvite: (incomingInviteRequest) => {
                const invitation = new invitation_1.Invitation(this, incomingInviteRequest);
                incomingInviteRequest.delegate = {
                    onCancel: (cancel) => {
                        invitation._onCancel(cancel);
                    },
                    onTransportError: (error) => {
                        // A server transaction MUST NOT discard transaction state based only on
                        // encountering a non-recoverable transport error when sending a
                        // response.  Instead, the associated INVITE server transaction state
                        // machine MUST remain in its current state.  (Timers will eventually
                        // cause it to transition to the "Terminated" state).
                        // https://tools.ietf.org/html/rfc6026#section-7.1
                        // As noted in the comment above, we are to leaving it to the transaction
                        // timers to eventually cause the transaction to sort itself out in the case
                        // of a transport failure in an invite server transaction. This delegate method
                        // is here simply here for completeness and to make it clear that it provides
                        // nothing more than informational hook into the core. That is, if you think
                        // you should be trying to deal with a transport error here, you are likely wrong.
                        this.logger.error("A transport error has occurred while handling an incoming INVITE request.");
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
                if (this.options.sipExtensionReplaces !== user_agent_options_1.SIPExtension.Unsupported) {
                    const message = incomingInviteRequest.message;
                    const replaces = message.parseHeader("replaces");
                    if (replaces) {
                        const callId = replaces.call_id;
                        if (typeof callId !== "string") {
                            throw new Error("Type of call id is not string");
                        }
                        const toTag = replaces.replaces_to_tag;
                        if (typeof toTag !== "string") {
                            throw new Error("Type of to tag is not string");
                        }
                        const fromTag = replaces.replaces_from_tag;
                        if (typeof fromTag !== "string") {
                            throw new Error("type of from tag is not string");
                        }
                        const targetDialogId = callId + toTag + fromTag;
                        const targetDialog = this.userAgentCore.dialogs.get(targetDialogId);
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
                        const targetSession = this._sessions[callId + fromTag] || this._sessions[callId + toTag] || undefined;
                        if (!targetSession) {
                            throw new Error("Session does not exist.");
                        }
                        invitation._replacee = targetSession;
                    }
                }
                // A common scenario occurs when the callee is currently not willing or
                // able to take additional calls at this end system.  A 486 (Busy Here)
                // SHOULD be returned in such a scenario.
                // https://tools.ietf.org/html/rfc3261#section-13.3.1.3
                if (!this.delegate || !this.delegate.onInvite) {
                    invitation.reject({ statusCode: 486 });
                    return;
                }
                // Delegate invitation handling.
                if (!invitation.autoSendAnInitialProvisionalResponse) {
                    this.delegate.onInvite(invitation);
                }
                else {
                    const onInvite = this.delegate.onInvite;
                    invitation.progress()
                        .then(() => onInvite(invitation));
                }
            },
            onMessage: (incomingMessageRequest) => {
                if (this.delegate && this.delegate.onMessage) {
                    const message = new message_1.Message(incomingMessageRequest);
                    this.delegate.onMessage(message);
                }
                else {
                    // Accept the MESSAGE request, but do nothing with it.
                    incomingMessageRequest.accept();
                }
            },
            onNotify: (incomingNotifyRequest) => {
                // NOTIFY requests are sent to inform subscribers of changes in state to
                // which the subscriber has a subscription.  Subscriptions are created
                // using the SUBSCRIBE method.  In legacy implementations, it is
                // possible that other means of subscription creation have been used.
                // However, this specification does not allow the creation of
                // subscriptions except through SUBSCRIBE requests and (for backwards-
                // compatibility) REFER requests [RFC3515].
                // https://tools.ietf.org/html/rfc6665#section-3.2
                if (this.delegate && this.delegate.onNotify) {
                    const notification = new notification_1.Notification(incomingNotifyRequest);
                    this.delegate.onNotify(notification);
                }
                else {
                    // Per the above which obsoletes https://tools.ietf.org/html/rfc3265,
                    // the use of out of dialog NOTIFY is obsolete, but...
                    if (this.options.allowLegacyNotifications) {
                        incomingNotifyRequest.accept(); // Accept the NOTIFY request, but do nothing with it.
                    }
                    else {
                        incomingNotifyRequest.reject({ statusCode: 481 });
                    }
                }
            },
            onRefer: (incomingReferRequest) => {
                this.logger.warn("Received an out of dialog REFER request");
                // TOOD: this.delegate.onRefer(...)
                if (this.delegate && this.delegate.onReferRequest) {
                    this.delegate.onReferRequest(incomingReferRequest);
                }
                else {
                    incomingReferRequest.reject({ statusCode: 405 });
                }
            },
            onRegister: (incomingRegisterRequest) => {
                this.logger.warn("Received an out of dialog REGISTER request");
                // TOOD: this.delegate.onRegister(...)
                if (this.delegate && this.delegate.onRegisterRequest) {
                    this.delegate.onRegisterRequest(incomingRegisterRequest);
                }
                else {
                    incomingRegisterRequest.reject({ statusCode: 405 });
                }
            },
            onSubscribe: (incomingSubscribeRequest) => {
                this.logger.warn("Received an out of dialog SUBSCRIBE request");
                // TOOD: this.delegate.onSubscribe(...)
                if (this.delegate && this.delegate.onSubscribeRequest) {
                    this.delegate.onSubscribeRequest(incomingSubscribeRequest);
                }
                else {
                    incomingSubscribeRequest.reject({ statusCode: 405 });
                }
            }
        };
        return new core_1.UserAgentCore(userAgentCoreConfiguration, userAgentCoreDelegate);
    }
    initTransportCallbacks() {
        this.transport.onConnect = () => this.onTransportConnect();
        this.transport.onDisconnect = (error) => this.onTransportDisconnect(error);
        this.transport.onMessage = (message) => this.onTransportMessage(message);
    }
    onTransportConnect() {
        if (this.state === user_agent_state_1.UserAgentState.Stopped) {
            return;
        }
        if (this.delegate && this.delegate.onConnect) {
            this.delegate.onConnect();
        }
    }
    onTransportDisconnect(error) {
        if (this.state === user_agent_state_1.UserAgentState.Stopped) {
            return;
        }
        if (this.delegate && this.delegate.onDisconnect) {
            this.delegate.onDisconnect(error);
        }
        // Only attempt to reconnect if network/server dropped the connection.
        if (error && this.options.reconnectionAttempts > 0) {
            this.attemptReconnection();
        }
    }
    onTransportMessage(messageString) {
        const message = core_1.Parser.parseMessage(messageString, this.getLogger("sip.Parser"));
        if (!message) {
            this.logger.warn("Failed to parse incoming message. Dropping.");
            return;
        }
        if (this.state === user_agent_state_1.UserAgentState.Stopped && message instanceof core_1.IncomingRequestMessage) {
            this.logger.warn(`Received ${message.method} request while stopped. Dropping.`);
            return;
        }
        // A valid SIP request formulated by a UAC MUST, at a minimum, contain
        // the following header fields: To, From, CSeq, Call-ID, Max-Forwards,
        // and Via; all of these header fields are mandatory in all SIP
        // requests.
        // https://tools.ietf.org/html/rfc3261#section-8.1.1
        const hasMinimumHeaders = () => {
            const mandatoryHeaders = ["from", "to", "call_id", "cseq", "via"];
            for (const header of mandatoryHeaders) {
                if (!message.hasHeader(header)) {
                    this.logger.warn(`Missing mandatory header field : ${header}.`);
                    return false;
                }
            }
            return true;
        };
        // Request Checks
        if (message instanceof core_1.IncomingRequestMessage) {
            // This is port of SanityCheck.minimumHeaders().
            if (!hasMinimumHeaders()) {
                this.logger.warn(`Request missing mandatory header field. Dropping.`);
                return;
            }
            // FIXME: This is non-standard and should be a configurable behavior (desirable regardless).
            // Custom SIP.js check to reject request from ourself (this instance of SIP.js).
            // This is port of SanityCheck.rfc3261_16_3_4().
            if (!message.toTag && message.callId.substr(0, 5) === this.options.sipjsId) {
                this.userAgentCore.replyStateless(message, { statusCode: 482 });
                return;
            }
            // FIXME: This should be Transport check before we get here (Section 18).
            // Custom SIP.js check to reject requests if body length wrong.
            // This is port of SanityCheck.rfc3261_18_3_request().
            const len = utils_1.str_utf8_length(message.body);
            const contentLength = message.getHeader("content-length");
            if (contentLength && len < Number(contentLength)) {
                this.userAgentCore.replyStateless(message, { statusCode: 400 });
                return;
            }
        }
        // Response Checks
        if (message instanceof core_1.IncomingResponseMessage) {
            // This is port of SanityCheck.minimumHeaders().
            if (!hasMinimumHeaders()) {
                this.logger.warn(`Response missing mandatory header field. Dropping.`);
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
            const len = utils_1.str_utf8_length(message.body);
            const contentLength = message.getHeader("content-length");
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
    }
    /**
     * Transition state.
     */
    transitionState(newState, error) {
        const invalidTransition = () => {
            throw new Error(`Invalid state transition from ${this._state} to ${newState}`);
        };
        // Validate state transition
        switch (this._state) {
            case user_agent_state_1.UserAgentState.Started:
                if (newState !== user_agent_state_1.UserAgentState.Stopped) {
                    invalidTransition();
                }
                break;
            case user_agent_state_1.UserAgentState.Stopped:
                if (newState !== user_agent_state_1.UserAgentState.Started) {
                    invalidTransition();
                }
                break;
            default:
                throw new Error("Unknown state.");
        }
        // Update state
        this.logger.log(`Transitioned from ${this._state} to ${newState}`);
        this._state = newState;
        this._stateEventEmitter.emit("event", this._state);
    }
}
exports.UserAgent = UserAgent;
/** Default user agent options. */
UserAgent.defaultOptions = {
    allowLegacyNotifications: false,
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
    logConnector: () => { },
    logLevel: "log",
    noAnswerTimeout: 60,
    preloadedRouteSet: [],
    reconnectionAttempts: 0,
    reconnectionDelay: 4,
    sessionDescriptionHandlerFactory: session_description_handler_1.SessionDescriptionHandler.defaultFactory,
    sessionDescriptionHandlerFactoryOptions: {},
    sipExtension100rel: user_agent_options_1.SIPExtension.Unsupported,
    sipExtensionReplaces: user_agent_options_1.SIPExtension.Unsupported,
    sipExtensionExtraSupported: [],
    sipjsId: "",
    transportConstructor: transport_1.Transport,
    transportOptions: {},
    uri: new core_1.URI("sip", "anonymous", "anonymous.invalid"),
    userAgentString: "SIP.js/" + version_1.LIBRARY_VERSION,
    viaHost: ""
};
