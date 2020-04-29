"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var name_addr_header_1 = require("./name-addr-header");
var utils_1 = require("./utils");
/**
 * Outgoing SIP request message.
 * @public
 */
var OutgoingRequestMessage = /** @class */ (function () {
    function OutgoingRequestMessage(method, ruri, fromURI, toURI, options, extraHeaders, body) {
        this.headers = {};
        this.extraHeaders = [];
        this.options = OutgoingRequestMessage.getDefaultOptions();
        // Options - merge a deep copy
        if (options) {
            this.options = tslib_1.__assign(tslib_1.__assign({}, this.options), options);
            if (this.options.optionTags && this.options.optionTags.length) {
                this.options.optionTags = this.options.optionTags.slice();
            }
            if (this.options.routeSet && this.options.routeSet.length) {
                this.options.routeSet = this.options.routeSet.slice();
            }
        }
        // Extra headers - deep copy
        if (extraHeaders && extraHeaders.length) {
            this.extraHeaders = extraHeaders.slice();
        }
        // Body - deep copy
        if (body) {
            // TODO: internal representation should be Body
            // this.body = { ...body };
            this.body = {
                body: body.content,
                contentType: body.contentType
            };
        }
        // Method
        this.method = method;
        // RURI
        this.ruri = ruri.clone();
        // From
        this.fromURI = fromURI.clone();
        this.fromTag = this.options.fromTag ? this.options.fromTag : utils_1.newTag();
        this.from = OutgoingRequestMessage.makeNameAddrHeader(this.fromURI, this.options.fromDisplayName, this.fromTag);
        // To
        this.toURI = toURI.clone();
        this.toTag = this.options.toTag;
        this.to = OutgoingRequestMessage.makeNameAddrHeader(this.toURI, this.options.toDisplayName, this.toTag);
        // Call-ID
        this.callId = this.options.callId ? this.options.callId : this.options.callIdPrefix + utils_1.createRandomToken(15);
        // CSeq
        this.cseq = this.options.cseq;
        // The relative order of header fields with different field names is not
        // significant.  However, it is RECOMMENDED that header fields which are
        // needed for proxy processing (Via, Route, Record-Route, Proxy-Require,
        // Max-Forwards, and Proxy-Authorization, for example) appear towards
        // the top of the message to facilitate rapid parsing.
        // https://tools.ietf.org/html/rfc3261#section-7.3.1
        this.setHeader("route", this.options.routeSet);
        this.setHeader("via", "");
        this.setHeader("to", this.to.toString());
        this.setHeader("from", this.from.toString());
        this.setHeader("cseq", this.cseq + " " + this.method);
        this.setHeader("call-id", this.callId);
        this.setHeader("max-forwards", "70");
    }
    /** Get a copy of the default options. */
    OutgoingRequestMessage.getDefaultOptions = function () {
        return {
            callId: "",
            callIdPrefix: "",
            cseq: 1,
            toDisplayName: "",
            toTag: "",
            fromDisplayName: "",
            fromTag: "",
            forceRport: false,
            hackViaTcp: false,
            optionTags: ["outbound"],
            routeSet: [],
            userAgentString: "sip.js",
            viaHost: ""
        };
    };
    OutgoingRequestMessage.makeNameAddrHeader = function (uri, displayName, tag) {
        var parameters = {};
        if (tag) {
            parameters.tag = tag;
        }
        return new name_addr_header_1.NameAddrHeader(uri, displayName, parameters);
    };
    /**
     * Get the value of the given header name at the given position.
     * @param name - header name
     * @returns Returns the specified header, undefined if header doesn't exist.
     */
    OutgoingRequestMessage.prototype.getHeader = function (name) {
        var header = this.headers[utils_1.headerize(name)];
        if (header) {
            if (header[0]) {
                return header[0];
            }
        }
        else {
            var regexp = new RegExp("^\\s*" + name + "\\s*:", "i");
            for (var _i = 0, _a = this.extraHeaders; _i < _a.length; _i++) {
                var exHeader = _a[_i];
                if (regexp.test(exHeader)) {
                    return exHeader.substring(exHeader.indexOf(":") + 1).trim();
                }
            }
        }
        return;
    };
    /**
     * Get the header/s of the given name.
     * @param name - header name
     * @returns Array with all the headers of the specified name.
     */
    OutgoingRequestMessage.prototype.getHeaders = function (name) {
        var result = [];
        var headerArray = this.headers[utils_1.headerize(name)];
        if (headerArray) {
            for (var _i = 0, headerArray_1 = headerArray; _i < headerArray_1.length; _i++) {
                var headerPart = headerArray_1[_i];
                result.push(headerPart);
            }
        }
        else {
            var regexp = new RegExp("^\\s*" + name + "\\s*:", "i");
            for (var _a = 0, _b = this.extraHeaders; _a < _b.length; _a++) {
                var exHeader = _b[_a];
                if (regexp.test(exHeader)) {
                    result.push(exHeader.substring(exHeader.indexOf(":") + 1).trim());
                }
            }
        }
        return result;
    };
    /**
     * Verify the existence of the given header.
     * @param name - header name
     * @returns true if header with given name exists, false otherwise
     */
    OutgoingRequestMessage.prototype.hasHeader = function (name) {
        if (this.headers[utils_1.headerize(name)]) {
            return true;
        }
        else {
            var regexp = new RegExp("^\\s*" + name + "\\s*:", "i");
            for (var _i = 0, _a = this.extraHeaders; _i < _a.length; _i++) {
                var extraHeader = _a[_i];
                if (regexp.test(extraHeader)) {
                    return true;
                }
            }
        }
        return false;
    };
    /**
     * Replace the the given header by the given value.
     * @param name - header name
     * @param value - header value
     */
    OutgoingRequestMessage.prototype.setHeader = function (name, value) {
        this.headers[utils_1.headerize(name)] = (value instanceof Array) ? value : [value];
    };
    /**
     * The Via header field indicates the transport used for the transaction
     * and identifies the location where the response is to be sent.  A Via
     * header field value is added only after the transport that will be
     * used to reach the next hop has been selected (which may involve the
     * usage of the procedures in [4]).
     *
     * When the UAC creates a request, it MUST insert a Via into that
     * request.  The protocol name and protocol version in the header field
     * MUST be SIP and 2.0, respectively.  The Via header field value MUST
     * contain a branch parameter.  This parameter is used to identify the
     * transaction created by that request.  This parameter is used by both
     * the client and the server.
     * https://tools.ietf.org/html/rfc3261#section-8.1.1.7
     * @param branchParameter - The branch parameter.
     * @param transport - The sent protocol transport.
     */
    OutgoingRequestMessage.prototype.setViaHeader = function (branch, transport) {
        // FIXME: Hack
        if (this.options.hackViaTcp) {
            transport = "TCP";
        }
        var via = "SIP/2.0/" + transport;
        via += " " + this.options.viaHost + ";branch=" + branch;
        if (this.options.forceRport) {
            via += ";rport";
        }
        this.setHeader("via", via);
        this.branch = branch;
    };
    OutgoingRequestMessage.prototype.toString = function () {
        var msg = "";
        msg += this.method + " " + this.ruri.toRaw() + " SIP/2.0\r\n";
        for (var header in this.headers) {
            if (this.headers[header]) {
                for (var _i = 0, _a = this.headers[header]; _i < _a.length; _i++) {
                    var headerPart = _a[_i];
                    msg += header + ": " + headerPart + "\r\n";
                }
            }
        }
        for (var _b = 0, _c = this.extraHeaders; _b < _c.length; _b++) {
            var header = _c[_b];
            msg += header.trim() + "\r\n";
        }
        msg += "Supported: " + this.options.optionTags.join(", ") + "\r\n";
        msg += "User-Agent: " + this.options.userAgentString + "\r\n";
        if (this.body) {
            if (typeof this.body === "string") {
                msg += "Content-Length: " + utils_1.str_utf8_length(this.body) + "\r\n\r\n";
                msg += this.body;
            }
            else {
                if (this.body.body && this.body.contentType) {
                    msg += "Content-Type: " + this.body.contentType + "\r\n";
                    msg += "Content-Length: " + utils_1.str_utf8_length(this.body.body) + "\r\n\r\n";
                    msg += this.body.body;
                }
                else {
                    msg += "Content-Length: " + 0 + "\r\n\r\n";
                }
            }
        }
        else {
            msg += "Content-Length: " + 0 + "\r\n\r\n";
        }
        return msg;
    };
    return OutgoingRequestMessage;
}());
exports.OutgoingRequestMessage = OutgoingRequestMessage;
