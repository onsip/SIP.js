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
var Constants_1 = require("./Constants");
var Enums_1 = require("./Enums");
var Parameters = /** @class */ (function () {
    function Parameters(parameters) {
        this.parameters = {};
        this.type = Enums_1.TypeStrings.Parameters;
        for (var param in parameters) {
            if (parameters.hasOwnProperty(param)) {
                this.setParam(param, parameters[param]);
            }
        }
    }
    Parameters.prototype.setParam = function (key, value) {
        if (key) {
            this.parameters[key.toLowerCase()] = (typeof value === "undefined" || value === null) ? null : value.toString();
        }
    };
    Parameters.prototype.getParam = function (key) {
        if (key) {
            return this.parameters[key.toLowerCase()];
        }
    };
    Parameters.prototype.hasParam = function (key) {
        if (key) {
            return !!this.parameters.hasOwnProperty(key.toLowerCase());
        }
        return false;
    };
    Parameters.prototype.deleteParam = function (parameter) {
        parameter = parameter.toLowerCase();
        if (this.parameters.hasOwnProperty(parameter)) {
            var value = this.parameters[parameter];
            delete this.parameters[parameter];
            return value;
        }
    };
    Parameters.prototype.clearParams = function () {
        this.parameters = {};
    };
    return Parameters;
}());
exports.Parameters = Parameters;
/**
 * @class Class creating a SIP URI.
 *
 * @param {String} [scheme]
 * @param {String} [user]
 * @param {String} host
 * @param {String} [port]
 * @param {Object} [parameters]
 * @param {Object} [headers]
 *
 */
// tslint:disable-next-line:max-classes-per-file
var URI = /** @class */ (function (_super) {
    __extends(URI, _super);
    function URI(scheme, user, host, port, parameters, headers) {
        var _this = _super.call(this, parameters) || this;
        _this.headers = {};
        _this.type = Enums_1.TypeStrings.URI;
        // Checks
        if (!host) {
            throw new TypeError('missing or invalid "host" parameter');
        }
        // Initialize parameters
        scheme = scheme || Constants_1.C.SIP;
        for (var header in headers) {
            if (headers.hasOwnProperty(header)) {
                _this.setHeader(header, headers[header]);
            }
        }
        // Raw URI
        _this.raw = {
            scheme: scheme,
            user: user,
            host: host,
            port: port
        };
        // Normalized URI
        _this.normal = {
            scheme: scheme.toLowerCase(),
            user: user,
            host: host.toLowerCase(),
            port: port
        };
        return _this;
    }
    Object.defineProperty(URI.prototype, "_normal", {
        get: function () { return this.normal; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(URI.prototype, "_raw", {
        get: function () { return this.raw; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(URI.prototype, "scheme", {
        get: function () { return this.normal.scheme; },
        set: function (value) {
            this.raw.scheme = value;
            this.normal.scheme = value.toLowerCase();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(URI.prototype, "user", {
        get: function () { return this.normal.user; },
        set: function (value) {
            this.normal.user = this.raw.user = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(URI.prototype, "host", {
        get: function () { return this.normal.host; },
        set: function (value) {
            this.raw.host = value;
            this.normal.host = value.toLowerCase();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(URI.prototype, "aor", {
        get: function () { return this.normal.user + "@" + this.normal.host; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(URI.prototype, "port", {
        get: function () { return this.normal.port; },
        set: function (value) {
            this.normal.port = this.raw.port = value === 0 ? value : value;
        },
        enumerable: true,
        configurable: true
    });
    URI.prototype.setHeader = function (name, value) {
        this.headers[this.headerize(name)] = (value instanceof Array) ? value : [value];
    };
    URI.prototype.getHeader = function (name) {
        if (name) {
            return this.headers[this.headerize(name)];
        }
    };
    URI.prototype.hasHeader = function (name) {
        return !!name && !!this.headers.hasOwnProperty(this.headerize(name));
    };
    URI.prototype.deleteHeader = function (header) {
        header = this.headerize(header);
        if (this.headers.hasOwnProperty(header)) {
            var value = this.headers[header];
            delete this.headers[header];
            return value;
        }
    };
    URI.prototype.clearHeaders = function () {
        this.headers = {};
    };
    URI.prototype.clone = function () {
        return new URI(this._raw.scheme, this._raw.user || "", this._raw.host, this._raw.port, JSON.parse(JSON.stringify(this.parameters)), JSON.parse(JSON.stringify(this.headers)));
    };
    URI.prototype.toRaw = function () {
        return this._toString(this._raw);
    };
    URI.prototype.toString = function () {
        return this._toString(this._normal);
    };
    URI.prototype._toString = function (uri) {
        var uriString = uri.scheme + ":";
        // add slashes if it's not a sip(s) URI
        if (!uri.scheme.toLowerCase().match("^sips?$")) {
            uriString += "//";
        }
        if (uri.user) {
            uriString += this.escapeUser(uri.user) + "@";
        }
        uriString += uri.host;
        if (uri.port || uri.port === 0) {
            uriString += ":" + uri.port;
        }
        for (var parameter in this.parameters) {
            if (this.parameters.hasOwnProperty(parameter)) {
                uriString += ";" + parameter;
                if (this.parameters[parameter] !== null) {
                    uriString += "=" + this.parameters[parameter];
                }
            }
        }
        var headers = [];
        for (var header in this.headers) {
            if (this.headers.hasOwnProperty(header)) {
                for (var idx in this.headers[header]) {
                    if (this.headers[header].hasOwnProperty(idx)) {
                        headers.push(header + "=" + this.headers[header][idx]);
                    }
                }
            }
        }
        if (headers.length > 0) {
            uriString += "?" + headers.join("&");
        }
        return uriString;
    };
    // The following two functions were copied from Utils to break a circular dependency
    /*
     * Hex-escape a SIP URI user.
     * @private
     * @param {String} user
     */
    URI.prototype.escapeUser = function (user) {
        // Don't hex-escape ':' (%3A), '+' (%2B), '?' (%3F"), '/' (%2F).
        return encodeURIComponent(decodeURIComponent(user))
            .replace(/%3A/ig, ":")
            .replace(/%2B/ig, "+")
            .replace(/%3F/ig, "?")
            .replace(/%2F/ig, "/");
    };
    URI.prototype.headerize = function (str) {
        var exceptions = {
            "Call-Id": "Call-ID",
            "Cseq": "CSeq",
            "Min-Se": "Min-SE",
            "Rack": "RAck",
            "Rseq": "RSeq",
            "Www-Authenticate": "WWW-Authenticate",
        };
        var name = str.toLowerCase().replace(/_/g, "-").split("-");
        var parts = name.length;
        var hname = "";
        for (var part = 0; part < parts; part++) {
            if (part !== 0) {
                hname += "-";
            }
            hname += name[part].charAt(0).toUpperCase() + name[part].substring(1);
        }
        if (exceptions[hname]) {
            hname = exceptions[hname];
        }
        return hname;
    };
    return URI;
}(Parameters));
exports.URI = URI;
