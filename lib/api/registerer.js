"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var events_1 = require("events");
var Constants_1 = require("../Constants");
var core_1 = require("../core");
var Exceptions_1 = require("../Exceptions");
var Utils_1 = require("../Utils");
var emitter_1 = require("./emitter");
var registerer_state_1 = require("./registerer-state");
/**
 * @internal
 */
function loadConfig(configuration) {
    var settings = {
        expires: 600,
        extraContactHeaderParams: [],
        instanceId: undefined,
        params: {},
        regId: undefined,
        registrar: undefined,
    };
    var configCheck = getConfigurationCheck();
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
            if (value instanceof Array && value.length === 0) {
                continue;
            }
            // If the parameter value is null, empty string, or undefined then apply its default value.
            // If it's a number with NaN value then also apply its default value.
            // NOTE: JS does not allow "value === NaN", the following does the work:
            if (value === null || value === "" || value === undefined ||
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
    return settings;
}
/**
 * @internal
 */
function getConfigurationCheck() {
    return {
        mandatory: {},
        optional: {
            expires: function (expires) {
                if (Utils_1.Utils.isDecimal(expires)) {
                    var value = Number(expires);
                    if (value >= 0) {
                        return value;
                    }
                }
            },
            extraContactHeaderParams: function (extraContactHeaderParams) {
                if (extraContactHeaderParams instanceof Array) {
                    return extraContactHeaderParams.filter(function (contactHeaderParam) { return (typeof contactHeaderParam === "string"); });
                }
            },
            instanceId: function (instanceId) {
                if (typeof instanceId !== "string") {
                    return;
                }
                if ((/^uuid:/i.test(instanceId))) {
                    instanceId = instanceId.substr(5);
                }
                if (core_1.Grammar.parse(instanceId, "uuid") === -1) {
                    return;
                }
                else {
                    return instanceId;
                }
            },
            params: function (params) {
                if (typeof params === "object") {
                    return params;
                }
            },
            regId: function (regId) {
                if (Utils_1.Utils.isDecimal(regId)) {
                    var value = Number(regId);
                    if (value >= 0) {
                        return value;
                    }
                }
            },
            registrar: function (registrar) {
                if (typeof registrar !== "string") {
                    return;
                }
                if (!/^sip:/i.test(registrar)) {
                    registrar = Constants_1.C.SIP + ":" + registrar;
                }
                var parsed = core_1.Grammar.URIParse(registrar);
                if (!parsed) {
                    return;
                }
                else if (parsed.user) {
                    return;
                }
                else {
                    return parsed;
                }
            }
        }
    };
}
/**
 * A registerer registers a contact for an address of record (outgoing REGISTER).
 * @public
 */
var Registerer = /** @class */ (function () {
    /**
     * Constructs a new instance of the `Registerer` class.
     * @param userAgent - User agent. See {@link UserAgent} for details.
     * @param options - Options bucket. See {@link RegistererOptions} for details.
     */
    function Registerer(userAgent, options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        /** The contacts returned from the most recent accepted REGISTER request. */
        this._contacts = [];
        /** The registration state. */
        this._state = registerer_state_1.RegistererState.Initial;
        /** Emits when the registration state changes. */
        this._stateEventEmitter = new events_1.EventEmitter();
        /** True is waiting for final response to outstanding REGISTER request. */
        this._waiting = false;
        /** Emits when waiting changes. */
        this._waitingEventEmitter = new events_1.EventEmitter();
        var settings = loadConfig(options);
        if (settings.regId && !settings.instanceId) {
            settings.instanceId = Utils_1.Utils.newUUID();
        }
        else if (!settings.regId && settings.instanceId) {
            settings.regId = 1;
        }
        settings.params.toUri = settings.params.toUri || userAgent.configuration.uri;
        settings.params.toDisplayName = settings.params.toDisplayName || userAgent.configuration.displayName;
        settings.params.callId = settings.params.callId || Utils_1.Utils.createRandomToken(22);
        settings.params.cseq = settings.params.cseq || Math.floor(Math.random() * 10000);
        /* If no 'registrarServer' is set use the 'uri' value without user portion. */
        if (!settings.registrar) {
            var registrarServer = {};
            if (typeof userAgent.configuration.uri === "object") {
                registrarServer = userAgent.configuration.uri.clone();
                registrarServer.user = undefined;
            }
            else {
                registrarServer = userAgent.configuration.uri;
            }
            settings.registrar = registrarServer;
        }
        this.userAgent = userAgent;
        this.logger = userAgent.getLogger("sip.registerer");
        var extraHeaders = (options.extraHeaders || []).slice();
        // Build the request
        this.request = userAgent.userAgentCore.makeOutgoingRequestMessage(Constants_1.C.REGISTER, settings.registrar, settings.params.fromUri ? settings.params.fromUri : userAgent.userAgentCore.configuration.aor, settings.params.toUri ? settings.params.toUri : settings.registrar, settings.params, extraHeaders, undefined);
        this.options = settings;
        this.logger.log("configuration parameters for RegisterContext after validation:");
        for (var parameter in settings) {
            if (settings.hasOwnProperty(parameter)) {
                this.logger.log("· " + parameter + ": " + JSON.stringify(settings[parameter]));
            }
        }
        // Registration expires
        this.expires = settings.expires;
        // Contact header
        this.contact = userAgent.contact.toString();
        userAgent.transport.on("disconnected", function () { return _this.onTransportDisconnected(); });
        // Add to UA's collection
        this.id = this.request.callId + this.request.from.parameters.tag;
        this.userAgent.registerers[this.id] = this;
    }
    Object.defineProperty(Registerer.prototype, "contacts", {
        /** The registered contacts. */
        get: function () {
            return this._contacts.slice();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Registerer.prototype, "state", {
        /** The registration state. */
        get: function () {
            return this._state;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Registerer.prototype, "stateChange", {
        /** Emits when the registerer state changes. */
        get: function () {
            return emitter_1.makeEmitter(this._stateEventEmitter);
        },
        enumerable: true,
        configurable: true
    });
    /** Destructor. */
    Registerer.prototype.dispose = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                // Remove from UA's collection
                delete this.userAgent.registerers[this.id];
                // If registered, unregisters and resolves after final response received.
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var doClose = function () {
                            // If we are registered, unregister and resolve after our state changes
                            if (!_this.waiting && _this._state === registerer_state_1.RegistererState.Registered) {
                                _this.stateChange.once(function () { return resolve(); });
                                _this.unregister();
                                return;
                            }
                            // Otherwise just resolve
                            resolve();
                        };
                        // If we are waiting for an outstanding request, wait for it to finish and then try closing.
                        // Otherwise just try closing.
                        if (_this.waiting) {
                            _this.waitingChange.once(function () { return doClose(); });
                        }
                        else {
                            doClose();
                        }
                    })];
            });
        });
    };
    /**
     * Sends the REGISTER request.
     * @remarks
     * If successfull, sends re-REGISTER requests prior to registration expiration until `unsubscribe()` is called.
     */
    Registerer.prototype.register = function (options) {
        if (options === void 0) { options = {}; }
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var error, extraHeaders, outgoingRegisterRequest;
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                // UAs MUST NOT send a new registration (that is, containing new Contact
                // header field values, as opposed to a retransmission) until they have
                // received a final response from the registrar for the previous one or
                // the previous REGISTER request has timed out.
                // https://tools.ietf.org/html/rfc3261#section-10.2
                if (this.waiting) {
                    error = new Error("REGISTER request already in progress, waiting for final response");
                    return [2 /*return*/, Promise.reject(error)];
                }
                // Options
                if (options.requestOptions) {
                    this.options = tslib_1.__assign({}, this.options, options.requestOptions);
                }
                extraHeaders = (this.options.extraHeaders || []).slice();
                extraHeaders.push("Contact: " + this.generateContactHeader(this.expires));
                // this is UA.C.ALLOWED_METHODS, removed to get around circular dependency
                extraHeaders.push("Allow: " + [
                    "ACK",
                    "CANCEL",
                    "INVITE",
                    "MESSAGE",
                    "BYE",
                    "OPTIONS",
                    "INFO",
                    "NOTIFY",
                    "REFER"
                ].toString());
                // Call-ID: All registrations from a UAC SHOULD use the same Call-ID
                // header field value for registrations sent to a particular
                // registrar.
                //
                // CSeq: The CSeq value guarantees proper ordering of REGISTER
                // requests.  A UA MUST increment the CSeq value by one for each
                // REGISTER request with the same Call-ID.
                // https://tools.ietf.org/html/rfc3261#section-10.2
                this.request.cseq++;
                this.request.setHeader("cseq", this.request.cseq + " REGISTER");
                this.request.extraHeaders = extraHeaders;
                this.waitingToggle(true);
                outgoingRegisterRequest = this.userAgent.userAgentCore.register(this.request, {
                    onAccept: function (response) {
                        var expires;
                        // FIXME: This does NOT appear to be to spec and should be removed.
                        // I haven't found anywhere that an Expires header may be used in a response.
                        if (response.message.hasHeader("expires")) {
                            expires = Number(response.message.getHeader("expires"));
                        }
                        // 8. The registrar returns a 200 (OK) response.  The response MUST
                        // contain Contact header field values enumerating all current
                        // bindings.  Each Contact value MUST feature an "expires"
                        // parameter indicating its expiration interval chosen by the
                        // registrar.  The response SHOULD include a Date header field.
                        // https://tools.ietf.org/html/rfc3261#section-10.3
                        _this._contacts = response.message.getHeaders("contact");
                        var contacts = _this._contacts.length;
                        if (!contacts) {
                            _this.logger.error("No Contact header in response to REGISTER, dropping response.");
                            _this.unregistered();
                            return;
                        }
                        // The 200 (OK) response from the registrar contains a list of Contact
                        // fields enumerating all current bindings.  The UA compares each
                        // contact address to see if it created the contact address, using
                        // comparison rules in Section 19.1.4.  If so, it updates the expiration
                        // time interval according to the expires parameter or, if absent, the
                        // Expires field value.  The UA then issues a REGISTER request for each
                        // of its bindings before the expiration interval has elapsed.
                        // https://tools.ietf.org/html/rfc3261#section-10.2.4
                        var contact;
                        while (contacts--) {
                            contact = response.message.parseHeader("contact", contacts);
                            if (contact.uri.user === _this.userAgent.contact.uri.user) {
                                expires = contact.getParam("expires");
                                break;
                            }
                            else {
                                contact = undefined;
                            }
                        }
                        // There must be a matching contact.
                        if (contact === undefined) {
                            _this.logger.error("No Contact header pointing to us, dropping response");
                            _this.unregistered();
                            _this.waitingToggle(false);
                            return;
                        }
                        // The contact must have an expires.
                        if (expires === undefined) {
                            _this.logger.error("Contact pointing to us is missing expires parameter, dropping response");
                            _this.unregistered();
                            _this.waitingToggle(false);
                            return;
                        }
                        // Save gruu values
                        if (contact.hasParam("temp-gruu")) {
                            _this.userAgent.contact.tempGruu = core_1.Grammar.URIParse(contact.getParam("temp-gruu").replace(/"/g, ""));
                        }
                        if (contact.hasParam("pub-gruu")) {
                            _this.userAgent.contact.pubGruu = core_1.Grammar.URIParse(contact.getParam("pub-gruu").replace(/"/g, ""));
                        }
                        _this.registered(expires);
                        _this.waitingToggle(false);
                    },
                    onProgress: function (response) {
                        return;
                    },
                    onRedirect: function (response) {
                        _this.logger.error("Redirect received. Not supported.");
                        _this.unregistered();
                        _this.waitingToggle(false);
                    },
                    onReject: function (response) {
                        if (response.message.statusCode === 423) {
                            // If a UA receives a 423 (Interval Too Brief) response, it MAY retry
                            // the registration after making the expiration interval of all contact
                            // addresses in the REGISTER request equal to or greater than the
                            // expiration interval within the Min-Expires header field of the 423
                            // (Interval Too Brief) response.
                            // https://tools.ietf.org/html/rfc3261#section-10.2.8
                            //
                            // The registrar MAY choose an expiration less than the requested
                            // expiration interval.  If and only if the requested expiration
                            // interval is greater than zero AND smaller than one hour AND
                            // less than a registrar-configured minimum, the registrar MAY
                            // reject the registration with a response of 423 (Interval Too
                            // Brief).  This response MUST contain a Min-Expires header field
                            // that states the minimum expiration interval the registrar is
                            // willing to honor.  It then skips the remaining steps.
                            // https://tools.ietf.org/html/rfc3261#section-10.3
                            if (!response.message.hasHeader("min-expires")) {
                                // This response MUST contain a Min-Expires header field
                                _this.logger.error("423 response received for REGISTER without Min-Expires");
                                _this.unregistered();
                                _this.waitingToggle(false);
                                return;
                            }
                            // Increase our registration interval to the suggested minimum
                            _this.expires = Number(response.message.getHeader("min-expires"));
                            // Attempt the registration again immediately
                            _this.waitingToggle(false);
                            _this.register();
                            return;
                        }
                        _this.logger.warn("Failed to register, status code " + response.message.statusCode);
                        _this.unregistered();
                        _this.waitingToggle(false);
                    },
                    onTrying: function (response) {
                        return;
                    }
                });
                return [2 /*return*/, Promise.resolve(outgoingRegisterRequest)];
            });
        });
    };
    /**
     * Sends the REGISTER request with expires equal to zero.
     */
    Registerer.prototype.unregister = function (options) {
        if (options === void 0) { options = {}; }
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var error, extraHeaders, outgoingRegisterRequest;
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                // UAs MUST NOT send a new registration (that is, containing new Contact
                // header field values, as opposed to a retransmission) until they have
                // received a final response from the registrar for the previous one or
                // the previous REGISTER request has timed out.
                // https://tools.ietf.org/html/rfc3261#section-10.2
                if (this.waiting) {
                    error = new Error("REGISTER request already in progress, waiting for final response");
                    return [2 /*return*/, Promise.reject(error)];
                }
                if (this._state !== registerer_state_1.RegistererState.Registered && !options.all) {
                    this.logger.warn("Not currently registered, but sending an unregister anyway.");
                }
                extraHeaders = (options.requestOptions && options.requestOptions.extraHeaders || []).slice();
                this.request.extraHeaders = extraHeaders;
                // Registrations are soft state and expire unless refreshed, but can
                // also be explicitly removed.  A client can attempt to influence the
                // expiration interval selected by the registrar as described in Section
                // 10.2.1.  A UA requests the immediate removal of a binding by
                // specifying an expiration interval of "0" for that contact address in
                // a REGISTER request.  UAs SHOULD support this mechanism so that
                // bindings can be removed before their expiration interval has passed.
                //
                // The REGISTER-specific Contact header field value of "*" applies to
                // all registrations, but it MUST NOT be used unless the Expires header
                // field is present with a value of "0".
                // https://tools.ietf.org/html/rfc3261#section-10.2.2
                if (options.all) {
                    extraHeaders.push("Contact: *");
                    extraHeaders.push("Expires: 0");
                }
                else {
                    extraHeaders.push("Contact: " + this.generateContactHeader(0));
                }
                // Call-ID: All registrations from a UAC SHOULD use the same Call-ID
                // header field value for registrations sent to a particular
                // registrar.
                //
                // CSeq: The CSeq value guarantees proper ordering of REGISTER
                // requests.  A UA MUST increment the CSeq value by one for each
                // REGISTER request with the same Call-ID.
                // https://tools.ietf.org/html/rfc3261#section-10.2
                this.request.cseq++;
                this.request.setHeader("cseq", this.request.cseq + " REGISTER");
                // Pre-emptively clear the registration timer to avoid a race condition where
                // this timer fires while waiting for a final response to the unsubscribe.
                if (this.registrationTimer !== undefined) {
                    clearTimeout(this.registrationTimer);
                    this.registrationTimer = undefined;
                }
                this.waitingToggle(true);
                outgoingRegisterRequest = this.userAgent.userAgentCore.register(this.request, {
                    onAccept: function (response) {
                        _this._contacts = response.message.getHeaders("contact"); // Update contacts
                        _this.unregistered();
                        if (options.requestDelegate && options.requestDelegate.onAccept) {
                            options.requestDelegate.onAccept(response);
                        }
                        _this.waitingToggle(false);
                    },
                    onProgress: function (response) {
                        if (options.requestDelegate && options.requestDelegate.onProgress) {
                            options.requestDelegate.onProgress(response);
                        }
                    },
                    onRedirect: function (response) {
                        _this.logger.error("Unregister redirected. Not currently supported.");
                        _this.unregistered();
                        if (options.requestDelegate && options.requestDelegate.onRedirect) {
                            options.requestDelegate.onRedirect(response);
                        }
                        _this.waitingToggle(false);
                    },
                    onReject: function (response) {
                        _this.waitingToggle(false);
                        _this.logger.error("Unregister rejected with status code " + response.message.statusCode);
                        _this.unregistered();
                        if (options.requestDelegate && options.requestDelegate.onReject) {
                            options.requestDelegate.onReject(response);
                        }
                        _this.waitingToggle(false);
                    },
                    onTrying: function (response) {
                        if (options.requestDelegate && options.requestDelegate.onTrying) {
                            options.requestDelegate.onTrying(response);
                        }
                    }
                });
                return [2 /*return*/, Promise.resolve(outgoingRegisterRequest)];
            });
        });
    };
    /** @internal */
    Registerer.prototype.clearTimers = function () {
        if (this.registrationTimer !== undefined) {
            clearTimeout(this.registrationTimer);
            this.registrationTimer = undefined;
        }
        if (this.registrationExpiredTimer !== undefined) {
            clearTimeout(this.registrationExpiredTimer);
            this.registrationExpiredTimer = undefined;
        }
    };
    /**
     * Helper Function to generate Contact Header
     * @internal
     */
    Registerer.prototype.generateContactHeader = function (expires) {
        if (expires === void 0) { expires = 0; }
        var contact = this.contact;
        if (this.options.regId && this.options.instanceId) {
            contact += ";reg-id=" + this.options.regId;
            contact += ';+sip.instance="<urn:uuid:' + this.options.instanceId + '>"';
        }
        if (this.options.extraContactHeaderParams) {
            this.options.extraContactHeaderParams.forEach(function (header) {
                contact += ";" + header;
            });
        }
        contact += ";expires=" + expires;
        return contact;
    };
    /** @internal */
    Registerer.prototype.onTransportDisconnected = function () {
        this.unregistered();
    };
    /** @internal */
    Registerer.prototype.registered = function (expires) {
        var _this = this;
        this.clearTimers();
        // Re-Register before the expiration interval has elapsed.
        // For that, decrease the expires value. ie: 3 seconds
        this.registrationTimer = setTimeout(function () {
            _this.registrationTimer = undefined;
            _this.register();
        }, (expires * 1000) - 3000);
        // We are unregistered if the registration expires.
        this.registrationExpiredTimer = setTimeout(function () {
            _this.logger.warn("Registration expired");
            _this.unregistered();
        }, expires * 1000);
        if (this._state !== registerer_state_1.RegistererState.Registered) {
            this.stateTransition(registerer_state_1.RegistererState.Registered);
        }
    };
    /** @internal */
    Registerer.prototype.unregistered = function () {
        this.clearTimers();
        if (this._state !== registerer_state_1.RegistererState.Unregistered) {
            this.stateTransition(registerer_state_1.RegistererState.Unregistered);
        }
    };
    /**
     * Transition registration state.
     * @internal
     */
    Registerer.prototype.stateTransition = function (newState) {
        var _this = this;
        var invalidTransition = function () {
            throw new Error("Invalid state transition from " + _this._state + " to " + newState);
        };
        // Validate transition
        switch (this._state) {
            case registerer_state_1.RegistererState.Initial:
                if (newState !== registerer_state_1.RegistererState.Registered &&
                    newState !== registerer_state_1.RegistererState.Unregistered) {
                    invalidTransition();
                }
                break;
            case registerer_state_1.RegistererState.Registered:
                if (newState !== registerer_state_1.RegistererState.Unregistered) {
                    invalidTransition();
                }
                break;
            case registerer_state_1.RegistererState.Unregistered:
                if (newState !== registerer_state_1.RegistererState.Registered) {
                    invalidTransition();
                }
                break;
            default:
                throw new Error("Unrecognized state.");
        }
        // Transition
        this._state = newState;
        this.logger.log("Registration transitioned to state " + this._state);
        this._stateEventEmitter.emit("event", this._state);
    };
    Object.defineProperty(Registerer.prototype, "waiting", {
        /** True if waiting for final response to a REGISTER request. */
        get: function () {
            return this._waiting;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Registerer.prototype, "waitingChange", {
        /** Emits when the registerer toggles waiting. */
        get: function () {
            return emitter_1.makeEmitter(this._waitingEventEmitter);
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Toggle waiting.
     * @internal
     */
    Registerer.prototype.waitingToggle = function (waiting) {
        if (this._waiting === waiting) {
            throw new Error("Invalid waiting transition from " + this._waiting + " to " + waiting);
        }
        this._waiting = waiting;
        this.logger.log("Waiting toggled to " + this._waiting);
        this._waitingEventEmitter.emit("event", this._waiting);
    };
    return Registerer;
}());
exports.Registerer = Registerer;
