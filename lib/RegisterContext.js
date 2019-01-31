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
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var ClientContext_1 = require("./ClientContext");
var Constants_1 = require("./Constants");
var Enums_1 = require("./Enums");
var Exceptions_1 = require("./Exceptions");
var Grammar_1 = require("./Grammar");
var Utils_1 = require("./Utils");
/**
 * Configuration load.
 * @private
 * returns {any}
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
                if (Grammar_1.Grammar.parse(instanceId, "uuid") === -1) {
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
                var parsed = Grammar_1.Grammar.URIParse(registrar);
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
var RegisterContext = /** @class */ (function (_super) {
    __extends(RegisterContext, _super);
    function RegisterContext(ua, options) {
        if (options === void 0) { options = {}; }
        var _this = this;
        var settings = loadConfig(options);
        if (settings.regId && !settings.instanceId) {
            settings.instanceId = Utils_1.Utils.newUUID();
        }
        else if (!settings.regId && settings.instanceId) {
            settings.regId = 1;
        }
        settings.params.toUri = settings.params.toUri || ua.configuration.uri;
        settings.params.toDisplayName = settings.params.toDisplayName || ua.configuration.displayName;
        settings.params.callId = settings.params.callId || Utils_1.Utils.createRandomToken(22);
        settings.params.cseq = settings.params.cseq || Math.floor(Math.random() * 10000);
        /* If no 'registrarServer' is set use the 'uri' value without user portion. */
        if (!settings.registrar) {
            var registrarServer = {};
            if (typeof ua.configuration.uri === "object") {
                registrarServer = ua.configuration.uri.clone();
                registrarServer.user = undefined;
            }
            else {
                registrarServer = ua.configuration.uri;
            }
            settings.registrar = registrarServer;
        }
        _this = _super.call(this, ua, Constants_1.C.REGISTER, settings.registrar, settings) || this;
        _this.type = Enums_1.TypeStrings.RegisterContext;
        _this.options = settings;
        _this.logger = ua.getLogger("sip.registercontext");
        _this.logger.log("configuration parameters for RegisterContext after validation:");
        for (var parameter in settings) {
            if (settings.hasOwnProperty(parameter)) {
                _this.logger.log("· " + parameter + ": " + JSON.stringify(settings[parameter]));
            }
        }
        // Registration expires
        _this.expires = settings.expires;
        // Cseq
        _this.cseq = settings.params.cseq;
        // Contact header
        _this.contact = ua.contact.toString();
        // Set status
        _this.registered = false;
        ua.on("transportCreated", function (transport) {
            transport.on("disconnected", _this.onTransportDisconnected.bind(_this));
        });
        return _this;
    }
    RegisterContext.prototype.register = function (options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        // Handle Options
        this.options = __assign({}, this.options, options);
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
        // Save original extraHeaders to be used in .close
        this.closeHeaders = this.options.closeWithHeaders ?
            (this.options.extraHeaders || []).slice() : [];
        this.receiveResponse = function (response) {
            // Discard responses to older REGISTER/un-REGISTER requests.
            if (response.cseq !== _this.cseq) {
                return;
            }
            // Clear registration timer
            if (_this.registrationTimer !== undefined) {
                clearTimeout(_this.registrationTimer);
                _this.registrationTimer = undefined;
            }
            var statusCode = (response.statusCode || 0).toString();
            switch (true) {
                case /^1[0-9]{2}$/.test(statusCode):
                    _this.emit("progress", response);
                    break;
                case /^2[0-9]{2}$/.test(statusCode):
                    _this.emit("accepted", response);
                    var expires = void 0;
                    if (response.hasHeader("expires")) {
                        expires = Number(response.getHeader("expires"));
                    }
                    if (_this.registrationExpiredTimer !== undefined) {
                        clearTimeout(_this.registrationExpiredTimer);
                        _this.registrationExpiredTimer = undefined;
                    }
                    // Search the Contact pointing to us and update the expires value accordingly.
                    var contacts = response.getHeaders("contact").length;
                    if (!contacts) {
                        _this.logger.warn("no Contact header in response to REGISTER, response ignored");
                        break;
                    }
                    var contact = void 0;
                    while (contacts--) {
                        contact = response.parseHeader("contact", contacts);
                        if (contact.uri.user === _this.ua.contact.uri.user) {
                            expires = contact.getParam("expires");
                            break;
                        }
                        else {
                            contact = undefined;
                        }
                    }
                    if (!contact) {
                        _this.logger.warn("no Contact header pointing to us, response ignored");
                        break;
                    }
                    if (expires === undefined) {
                        expires = _this.expires;
                    }
                    // Re-Register before the expiration interval has elapsed.
                    // For that, decrease the expires value. ie: 3 seconds
                    _this.registrationTimer = setTimeout(function () {
                        _this.registrationTimer = undefined;
                        _this.register(_this.options);
                    }, (expires * 1000) - 3000);
                    _this.registrationExpiredTimer = setTimeout(function () {
                        _this.logger.warn("registration expired");
                        if (_this.registered) {
                            _this.unregistered(undefined, Constants_1.C.causes.EXPIRES);
                        }
                    }, expires * 1000);
                    // Save gruu values
                    if (contact.hasParam("temp-gruu")) {
                        _this.ua.contact.temp_gruu = Grammar_1.Grammar.URIParse(contact.getParam("temp-gruu").replace(/"/g, ""));
                    }
                    if (contact.hasParam("pub-gruu")) {
                        _this.ua.contact.pub_gruu = Grammar_1.Grammar.URIParse(contact.getParam("pub-gruu").replace(/"/g, ""));
                    }
                    _this.registered = true;
                    _this.emit("registered", response || undefined);
                    break;
                // Interval too brief RFC3261 10.2.8
                case /^423$/.test(statusCode):
                    if (response.hasHeader("min-expires")) {
                        // Increase our registration interval to the suggested minimum
                        _this.expires = Number(response.getHeader("min-expires"));
                        // Attempt the registration again immediately
                        _this.register(_this.options);
                    }
                    else { // This response MUST contain a Min-Expires header field
                        _this.logger.warn("423 response received for REGISTER without Min-Expires");
                        _this.registrationFailure(response, Constants_1.C.causes.SIP_FAILURE_CODE);
                    }
                    break;
                default:
                    _this.registrationFailure(response, Utils_1.Utils.sipErrorCause(response.statusCode || 0));
            }
        };
        this.onRequestTimeout = function () {
            _this.registrationFailure(undefined, Constants_1.C.causes.REQUEST_TIMEOUT);
        };
        this.onTransportError = function () {
            _this.registrationFailure(undefined, Constants_1.C.causes.CONNECTION_ERROR);
        };
        this.cseq++;
        if (this.request) {
            this.request.cseq = this.cseq;
            this.request.setHeader("cseq", this.cseq + " REGISTER");
            this.request.extraHeaders = extraHeaders;
        }
        this.send();
    };
    RegisterContext.prototype.close = function () {
        var options = {
            all: false,
            extraHeaders: this.closeHeaders
        };
        this.registeredBefore = this.registered;
        if (this.registered) {
            this.unregister(options);
        }
    };
    RegisterContext.prototype.unregister = function (options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        if (!this.registered && !options.all) {
            this.logger.warn("Already unregistered, but sending an unregister anyways.");
        }
        var extraHeaders = (options.extraHeaders || []).slice();
        this.registered = false;
        // Clear the registration timer.
        if (this.registrationTimer !== undefined) {
            clearTimeout(this.registrationTimer);
            this.registrationTimer = undefined;
        }
        if (options.all) {
            extraHeaders.push("Contact: *");
            extraHeaders.push("Expires: 0");
        }
        else {
            extraHeaders.push("Contact: " + this.generateContactHeader(0));
        }
        this.receiveResponse = function (response) {
            var statusCode = (response && response.statusCode) ? response.statusCode.toString() : "";
            switch (true) {
                case /^1[0-9]{2}$/.test(statusCode):
                    _this.emit("progress", response);
                    break;
                case /^2[0-9]{2}$/.test(statusCode):
                    _this.emit("accepted", response);
                    if (_this.registrationExpiredTimer !== undefined) {
                        clearTimeout(_this.registrationExpiredTimer);
                        _this.registrationExpiredTimer = undefined;
                    }
                    _this.unregistered(response);
                    break;
                default:
                    _this.unregistered(response, Utils_1.Utils.sipErrorCause(response.statusCode || 0));
            }
        };
        this.onRequestTimeout = function () {
            // Not actually unregistered...
            // this.unregistered(undefined, SIP.C.causes.REQUEST_TIMEOUT);
        };
        this.cseq++;
        if (this.request) {
            this.request.cseq = this.cseq;
            this.request.setHeader("cseq", this.cseq + " REGISTER");
            this.request.extraHeaders = extraHeaders;
        }
        this.send();
    };
    RegisterContext.prototype.unregistered = function (response, cause) {
        this.registered = false;
        this.emit("unregistered", response || undefined, cause || undefined);
    };
    RegisterContext.prototype.registrationFailure = function (response, cause) {
        this.emit("failed", response || undefined, cause || undefined);
    };
    RegisterContext.prototype.onTransportDisconnected = function () {
        this.registeredBefore = this.registered;
        if (this.registrationTimer !== undefined) {
            clearTimeout(this.registrationTimer);
            this.registrationTimer = undefined;
        }
        if (this.registrationExpiredTimer !== undefined) {
            clearTimeout(this.registrationExpiredTimer);
            this.registrationExpiredTimer = undefined;
        }
        if (this.registered) {
            this.unregistered(undefined, Constants_1.C.causes.CONNECTION_ERROR);
        }
    };
    /**
     * Helper Function to generate Contact Header
     * @private
     * returns {String}
     */
    RegisterContext.prototype.generateContactHeader = function (expires) {
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
    return RegisterContext;
}(ClientContext_1.ClientContext));
exports.RegisterContext = RegisterContext;
