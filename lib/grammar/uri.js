/* eslint-disable @typescript-eslint/no-explicit-any */
import { Parameters } from "./parameters";
/**
 * URI.
 * @public
 */
export class URI extends Parameters {
    /**
     * Constructor
     * @param scheme -
     * @param user -
     * @param host -
     * @param port -
     * @param parameters -
     * @param headers -
     */
    constructor(scheme, user, host, port, parameters, headers) {
        super(parameters);
        this.headers = {};
        // Checks
        if (!host) {
            throw new TypeError('missing or invalid "host" parameter');
        }
        // Initialize parameters
        scheme = scheme || "sip";
        for (const header in headers) {
            // eslint-disable-next-line no-prototype-builtins
            if (headers.hasOwnProperty(header)) {
                this.setHeader(header, headers[header]);
            }
        }
        // Raw URI
        this.raw = {
            scheme,
            user,
            host,
            port
        };
        // Normalized URI
        this.normal = {
            scheme: scheme.toLowerCase(),
            user,
            host: host.toLowerCase(),
            port
        };
    }
    get scheme() { return this.normal.scheme; }
    set scheme(value) {
        this.raw.scheme = value;
        this.normal.scheme = value.toLowerCase();
    }
    get user() { return this.normal.user; }
    set user(value) {
        this.normal.user = this.raw.user = value;
    }
    get host() { return this.normal.host; }
    set host(value) {
        this.raw.host = value;
        this.normal.host = value.toLowerCase();
    }
    get aor() { return this.normal.user + "@" + this.normal.host; }
    get port() { return this.normal.port; }
    set port(value) {
        this.normal.port = this.raw.port = value === 0 ? value : value;
    }
    setHeader(name, value) {
        this.headers[this.headerize(name)] = (value instanceof Array) ? value : [value];
    }
    getHeader(name) {
        if (name) {
            return this.headers[this.headerize(name)];
        }
    }
    hasHeader(name) {
        // eslint-disable-next-line no-prototype-builtins
        return !!name && !!this.headers.hasOwnProperty(this.headerize(name));
    }
    deleteHeader(header) {
        header = this.headerize(header);
        // eslint-disable-next-line no-prototype-builtins
        if (this.headers.hasOwnProperty(header)) {
            const value = this.headers[header];
            delete this.headers[header];
            return value;
        }
    }
    clearHeaders() {
        this.headers = {};
    }
    clone() {
        return new URI(this._raw.scheme, this._raw.user || "", this._raw.host, this._raw.port, JSON.parse(JSON.stringify(this.parameters)), JSON.parse(JSON.stringify(this.headers)));
    }
    toRaw() {
        return this._toString(this._raw);
    }
    toString() {
        return this._toString(this._normal);
    }
    get _normal() { return this.normal; }
    get _raw() { return this.raw; }
    _toString(uri) {
        let uriString = uri.scheme + ":";
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
        for (const parameter in this.parameters) {
            // eslint-disable-next-line no-prototype-builtins
            if (this.parameters.hasOwnProperty(parameter)) {
                uriString += ";" + parameter;
                if (this.parameters[parameter] !== null) {
                    uriString += "=" + this.parameters[parameter];
                }
            }
        }
        const headers = [];
        for (const header in this.headers) {
            // eslint-disable-next-line no-prototype-builtins
            if (this.headers.hasOwnProperty(header)) {
                for (const idx in this.headers[header]) {
                    // eslint-disable-next-line no-prototype-builtins
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
    }
    /*
     * Hex-escape a SIP URI user.
     * @private
     * @param {String} user
     */
    escapeUser(user) {
        let decodedUser;
        // FIXME: This is called by toString above which should never throw, but
        // decodeURIComponent can throw and I've seen one case in production where
        // it did throw resulting in a cascading failure. This class should be
        // fixed so that decodeURIComponent is not called at this point (in toString).
        // The user should be decoded when the URI is constructor or some other
        // place where we can catch the error before the URI is created or somesuch.
        // eslint-disable-next-line no-useless-catch
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
    }
    headerize(str) {
        const exceptions = {
            "Call-Id": "Call-ID",
            "Cseq": "CSeq",
            "Min-Se": "Min-SE",
            "Rack": "RAck",
            "Rseq": "RSeq",
            "Www-Authenticate": "WWW-Authenticate",
        };
        const name = str.toLowerCase().replace(/_/g, "-").split("-");
        const parts = name.length;
        let hname = "";
        for (let part = 0; part < parts; part++) {
            if (part !== 0) {
                hname += "-";
            }
            hname += name[part].charAt(0).toUpperCase() + name[part].substring(1);
        }
        if (exceptions[hname]) {
            hname = exceptions[hname];
        }
        return hname;
    }
}
