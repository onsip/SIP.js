"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var parameters_1 = require("./parameters");
/**
 * URI.
 * @public
 */
var URI = /** @class */ (function (_super) {
    tslib_1.__extends(URI, _super);
    /**
     * Constructor
     * @param scheme -
     * @param user -
     * @param host -
     * @param port -
     * @param parameters -
     * @param headers -
     */
    function URI(scheme, user, host, port, parameters, headers) {
        var _this = _super.call(this, parameters) || this;
        _this.headers = {};
        // Checks
        if (!host) {
            throw new TypeError('missing or invalid "host" parameter');
        }
        // Initialize parameters
        scheme = scheme || "sip";
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
    /*
     * Hex-escape a SIP URI user.
     * @private
     * @param {String} user
     */
    URI.prototype.escapeUser = function (user) {
        var decodedUser;
        // FIXME: This is called by toString above which should never throw, but
        // decodeURIComponent can throw and I've seen one case in production where
        // it did throw resulting in a cascading failure. This class should be
        // fixed so that decodeURIComponent is not called at this point (in toString).
        // The user should be decoded when the URI is constructor or some other
        // place where we can catch the error before the URI is created or somesuch.
        try {
            decodedUser = decodeURIComponent(user);
        }
        catch (error) {
            throw error;
        }
        // Don't hex-escape ':' (%3A), '+' (%2B), '?' (%3F"), '/' (%2F).
        return encodeURIComponent(decodedUser)
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
}(parameters_1.Parameters));
exports.URI = URI;
