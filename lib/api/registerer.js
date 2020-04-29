"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var events_1 = require("events");
var core_1 = require("../core");
var emitter_1 = require("./emitter");
var exceptions_1 = require("./exceptions");
var registerer_state_1 = require("./registerer-state");
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
        this.disposed = false;
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
        // Set user agent
        this.userAgent = userAgent;
        // Default registrar is domain portion of user agent uri
        var defaultUserAgentRegistrar = userAgent.configuration.uri.clone();
        defaultUserAgentRegistrar.user = undefined;
        // Initialize configuration
        this.options = tslib_1.__assign(tslib_1.__assign(tslib_1.__assign({}, Registerer.defaultOptions), { registrar: defaultUserAgentRegistrar }), Registerer.stripUndefinedProperties(options));
        // Make sure we are not using references to array options
        this.options.extraContactHeaderParams = (this.options.extraContactHeaderParams || []).slice();
        this.options.extraHeaders = (this.options.extraHeaders || []).slice();
        // Make sure we are not using references to registrar uri
        if (!this.options.registrar) {
            throw new Error("Registrar undefined.");
        }
        this.options.registrar = this.options.registrar.clone();
        // Set instanceId and regId conditional defaults and validate
        if (this.options.regId && !this.options.instanceId) {
            this.options.instanceId = Registerer.newUUID();
        }
        else if (!this.options.regId && this.options.instanceId) {
            this.options.regId = 1;
        }
        if (this.options.instanceId && core_1.Grammar.parse(this.options.instanceId, "uuid") === -1) {
            throw new Error("Invalid instanceId.");
        }
        if (this.options.regId && this.options.regId < 0) {
            throw new Error("Invalid regId.");
        }
        var registrar = this.options.registrar;
        var fromURI = (this.options.params && this.options.params.fromUri) || userAgent.userAgentCore.configuration.aor;
        var toURI = (this.options.params && this.options.params.toUri) || userAgent.configuration.uri;
        var params = this.options.params || {};
        var extraHeaders = (options.extraHeaders || []).slice();
        // Build the request
        this.request = userAgent.userAgentCore.makeOutgoingRequestMessage(core_1.C.REGISTER, registrar, fromURI, toURI, params, extraHeaders, undefined);
        // Registration expires
        this.expires = this.options.expires || Registerer.defaultOptions.expires;
        if (this.expires < 0) {
            throw new Error("Invalid expires.");
        }
        // initialize logger
        this.logger = userAgent.getLogger("sip.Registerer");
        if (this.options.logConfiguration) {
            this.logger.log("Configuration:");
            Object.keys(this.options).forEach(function (key) {
                var value = _this.options[key];
                switch (key) {
                    case "registrar":
                        _this.logger.log("· " + key + ": " + value);
                        break;
                    default:
                        _this.logger.log("· " + key + ": " + JSON.stringify(value));
                }
            });
        }
        // Identifier
        this.id = this.request.callId + this.request.from.parameters.tag;
        // Add to the user agent's session collection.
        this.userAgent._registerers[this.id] = this;
    }
    // http://stackoverflow.com/users/109538/broofa
    Registerer.newUUID = function () {
        var UUID = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
            var r = Math.floor(Math.random() * 16);
            var v = c === "x" ? r : (r % 4 + 8);
            return v.toString(16);
        });
        return UUID;
    };
    /**
     * Strip properties with undefined values from options.
     * This is a work around while waiting for missing vs undefined to be addressed (or not)...
     * https://github.com/Microsoft/TypeScript/issues/13195
     * @param options - Options to reduce
     */
    Registerer.stripUndefinedProperties = function (options) {
        return Object.keys(options).reduce(function (object, key) {
            if (options[key] !== undefined) {
                object[key] = options[key];
            }
            return object;
        }, {});
    };
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
            return emitter_1._makeEmitter(this._stateEventEmitter);
        },
        enumerable: true,
        configurable: true
    });
    /** Destructor. */
    Registerer.prototype.dispose = function () {
        var _this = this;
        if (this.disposed) {
            return Promise.resolve();
        }
        this.disposed = true;
        this.logger.log("Registerer " + this.id + " in state " + this.state + " is being disposed");
        // Remove from the user agent's registerer collection
        delete this.userAgent._registerers[this.id];
        // If registered, unregisters and resolves after final response received.
        return new Promise(function (resolve, reject) {
            var doClose = function () {
                // If we are registered, unregister and resolve after our state changes
                if (!_this.waiting && _this._state === registerer_state_1.RegistererState.Registered) {
                    _this.stateChange.addListener(function () {
                        _this.terminated();
                        resolve();
                    }, { once: true });
                    _this.unregister();
                    return;
                }
                // Otherwise just resolve
                _this.terminated();
                resolve();
            };
            // If we are waiting for an outstanding request, wait for it to finish and then try closing.
            // Otherwise just try closing.
            if (_this.waiting) {
                _this.waitingChange.addListener(function () { return doClose(); }, { once: true });
            }
            else {
                doClose();
            }
        });
    };
    /**
     * Sends the REGISTER request.
     * @remarks
     * If successful, sends re-REGISTER requests prior to registration expiration until `unsubscribe()` is called.
     * Rejects with `RequestPendingError` if a REGISTER request is already in progress.
     */
    Registerer.prototype.register = function (options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        // UAs MUST NOT send a new registration (that is, containing new Contact
        // header field values, as opposed to a retransmission) until they have
        // received a final response from the registrar for the previous one or
        // the previous REGISTER request has timed out.
        // https://tools.ietf.org/html/rfc3261#section-10.2
        if (this.waiting) {
            this.waitingWarning();
            var error = new exceptions_1.RequestPendingError("REGISTER request already in progress, waiting for final response");
            return Promise.reject(error);
        }
        // Options
        if (options.requestOptions) {
            this.options = tslib_1.__assign(tslib_1.__assign({}, this.options), options.requestOptions);
        }
        // Extra headers
        var extraHeaders = (this.options.extraHeaders || []).slice();
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
        var outgoingRegisterRequest = this.userAgent.userAgentCore.register(this.request, {
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
                _this.logger.error("Redirect received. Not supported.");
                _this.unregistered();
                if (options.requestDelegate && options.requestDelegate.onRedirect) {
                    options.requestDelegate.onRedirect(response);
                }
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
                        _this.logger.error("423 response received for REGISTER without Min-Expires, dropping response");
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
        return Promise.resolve(outgoingRegisterRequest);
    };
    /**
     * Sends the REGISTER request with expires equal to zero.
     * @remarks
     * Rejects with `RequestPendingError` if a REGISTER request is already in progress.
     */
    Registerer.prototype.unregister = function (options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        // UAs MUST NOT send a new registration (that is, containing new Contact
        // header field values, as opposed to a retransmission) until they have
        // received a final response from the registrar for the previous one or
        // the previous REGISTER request has timed out.
        // https://tools.ietf.org/html/rfc3261#section-10.2
        if (this.waiting) {
            this.waitingWarning();
            var error = new exceptions_1.RequestPendingError("REGISTER request already in progress, waiting for final response");
            return Promise.reject(error);
        }
        if (this._state !== registerer_state_1.RegistererState.Registered && !options.all) {
            this.logger.warn("Not currently registered, but sending an unregister anyway.");
        }
        // Extra headers
        var extraHeaders = (options.requestOptions && options.requestOptions.extraHeaders || []).slice();
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
        // Pre-emptive clear the registration timer to avoid a race condition where
        // this timer fires while waiting for a final response to the unsubscribe.
        if (this.registrationTimer !== undefined) {
            clearTimeout(this.registrationTimer);
            this.registrationTimer = undefined;
        }
        this.waitingToggle(true);
        var outgoingRegisterRequest = this.userAgent.userAgentCore.register(this.request, {
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
        return Promise.resolve(outgoingRegisterRequest);
    };
    /**
     * Clear registration timers.
     */
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
     * Generate Contact Header
     */
    Registerer.prototype.generateContactHeader = function (expires) {
        var contact = this.userAgent.contact.toString();
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
    /**
     * Helper function, called when registered.
     */
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
    /**
     * Helper function, called when unregistered.
     */
    Registerer.prototype.unregistered = function () {
        this.clearTimers();
        if (this._state !== registerer_state_1.RegistererState.Unregistered) {
            this.stateTransition(registerer_state_1.RegistererState.Unregistered);
        }
    };
    /**
     * Helper function, called when terminated.
     */
    Registerer.prototype.terminated = function () {
        this.clearTimers();
        if (this._state !== registerer_state_1.RegistererState.Terminated) {
            this.stateTransition(registerer_state_1.RegistererState.Terminated);
        }
    };
    /**
     * Transition registration state.
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
                    newState !== registerer_state_1.RegistererState.Unregistered &&
                    newState !== registerer_state_1.RegistererState.Terminated) {
                    invalidTransition();
                }
                break;
            case registerer_state_1.RegistererState.Registered:
                if (newState !== registerer_state_1.RegistererState.Unregistered &&
                    newState !== registerer_state_1.RegistererState.Terminated) {
                    invalidTransition();
                }
                break;
            case registerer_state_1.RegistererState.Unregistered:
                if (newState !== registerer_state_1.RegistererState.Registered &&
                    newState !== registerer_state_1.RegistererState.Terminated) {
                    invalidTransition();
                }
                break;
            case registerer_state_1.RegistererState.Terminated:
                invalidTransition();
                break;
            default:
                throw new Error("Unrecognized state.");
        }
        // Transition
        this._state = newState;
        this.logger.log("Registration transitioned to state " + this._state);
        this._stateEventEmitter.emit("event", this._state);
        // Dispose
        if (newState === registerer_state_1.RegistererState.Terminated) {
            this.dispose();
        }
    };
    Object.defineProperty(Registerer.prototype, "waiting", {
        /** True if the registerer is currently waiting for final response to a REGISTER request. */
        get: function () {
            return this._waiting;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Registerer.prototype, "waitingChange", {
        /** Emits when the registerer waiting state changes. */
        get: function () {
            return emitter_1._makeEmitter(this._waitingEventEmitter);
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Toggle waiting.
     */
    Registerer.prototype.waitingToggle = function (waiting) {
        if (this._waiting === waiting) {
            throw new Error("Invalid waiting transition from " + this._waiting + " to " + waiting);
        }
        this._waiting = waiting;
        this.logger.log("Waiting toggled to " + this._waiting);
        this._waitingEventEmitter.emit("event", this._waiting);
    };
    /** Hopefully helpful as the standard behavior has been found to be unexpected. */
    Registerer.prototype.waitingWarning = function () {
        var message = "An attempt was made to send a REGISTER request while a prior one was still in progress.";
        message += " RFC 3261 requires UAs MUST NOT send a new registration until they have received a final response";
        message += " from the registrar for the previous one or the previous REGISTER request has timed out.";
        message += " Note that if the transport disconnects, you still must wait for the prior request to time out before";
        message += " sending a new REGISTER request or alternatively dispose of the current Registerer and create a new Registerer.";
        this.logger.warn(message);
    };
    /** Default registerer options. */
    Registerer.defaultOptions = {
        expires: 600,
        extraContactHeaderParams: [],
        extraHeaders: [],
        logConfiguration: true,
        instanceId: "",
        params: {},
        regId: 0,
        registrar: new core_1.URI("sip", "anonymous", "anonymous.invalid")
    };
    return Registerer;
}());
exports.Registerer = Registerer;
