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
var Grammar_1 = require("./Grammar");
var Utils_1 = require("./Utils");
var getSupportedHeader = function (request) {
    var optionTags = [];
    if (request.method === Constants_1.C.REGISTER) {
        optionTags.push("path", "gruu");
    }
    else if (request.method === Constants_1.C.INVITE &&
        (request.ua.contact.pubGruu || request.ua.contact.tempGruu)) {
        optionTags.push("gruu");
    }
    if (request.ua.configuration.rel100 === Constants_1.C.supported.SUPPORTED) {
        optionTags.push("100rel");
    }
    if (request.ua.configuration.replaces === Constants_1.C.supported.SUPPORTED) {
        optionTags.push("replaces");
    }
    optionTags.push("outbound");
    optionTags = optionTags.concat(request.ua.configuration.extraSupported || []);
    var allowUnregistered = request.ua.configuration.hackAllowUnregisteredOptionTags || false;
    var optionTagSet = {};
    optionTags = optionTags.filter(function (optionTag) {
        var registered = Constants_1.C.OPTION_TAGS[optionTag];
        var unique = !optionTagSet[optionTag];
        optionTagSet[optionTag] = true;
        return (registered || allowUnregistered) && unique;
    });
    return "Supported: " + optionTags.join(", ") + "\r\n";
};
/**
 * @class Class for outgoing SIP request.
 * @param {String} method request method
 * @param {String} ruri request uri
 * @param {SIP.UA} ua
 * @param {Object} params parameters that will have priority over ua.configuration parameters:
 * <br>
 *  - cseq, callId, fromTag, fromUri, fromDisplayName, toUri, toTag, routeSet
 * @param {Object} [headers] extra headers
 * @param {String} [body]
 */
var OutgoingRequest = /** @class */ (function () {
    function OutgoingRequest(method, ruri, ua, params, extraHeaders, body) {
        if (params === void 0) { params = {}; }
        this.type = Enums_1.TypeStrings.OutgoingRequest;
        this.logger = ua.getLogger("sip.sipmessage");
        this.ua = ua;
        this.headers = {};
        this.method = method;
        this.ruri = ruri;
        this.body = body;
        this.extraHeaders = (extraHeaders || []).slice();
        this.statusCode = params.statusCode;
        this.reasonPhrase = params.reasonPhrase;
        // Fill the Common SIP Request Headers
        // Route
        if (params.routeSet) {
            this.setHeader("route", params.routeSet);
        }
        else if (ua.configuration.usePreloadedRoute && ua.transport) {
            this.setHeader("route", ua.transport.server.sipUri);
        }
        // Via
        // Empty Via header. Will be filled by the client transaction.
        this.setHeader("via", "");
        // Max-Forwards
        // is a constant on ua.c, removed for circular dependency
        this.setHeader("max-forwards", "70");
        // To
        var toUri = params.toUri || ruri;
        var to = (params.toDisplayName || params.toDisplayName === 0) ? '"' + params.toDisplayName + '" ' : "";
        to += "<" + (toUri.type === Enums_1.TypeStrings.URI ? toUri.toRaw() : toUri) + ">";
        to += params.toTag ? ";tag=" + params.toTag : "";
        this.to = Grammar_1.Grammar.nameAddrHeaderParse(to);
        this.setHeader("to", to);
        // From
        var fromUri = params.fromUri || ua.configuration.uri || "";
        var from;
        if (params.fromDisplayName || params.fromDisplayName === 0) {
            from = '"' + params.fromDisplayName + '" ';
        }
        else if (ua.configuration.displayName) {
            from = '"' + ua.configuration.displayName + '" ';
        }
        else {
            from = "";
        }
        from += "<" + (fromUri.type === Enums_1.TypeStrings.URI ? fromUri.toRaw() : fromUri) + ">;tag=";
        from += params.fromTag || Utils_1.Utils.newTag();
        this.from = Grammar_1.Grammar.nameAddrHeaderParse(from);
        this.setHeader("from", from);
        // Call-ID
        this.callId = params.callId || (ua.configuration.sipjsId + Utils_1.Utils.createRandomToken(15));
        this.setHeader("call-id", this.callId);
        // CSeq
        this.cseq = params.cseq || Math.floor(Math.random() * 10000);
        this.setHeader("cseq", this.cseq + " " + method);
    }
    /**
     * Replace the the given header by the given value.
     * @param {String} name header name
     * @param {String | Array} value header value
     */
    OutgoingRequest.prototype.setHeader = function (name, value) {
        this.headers[Utils_1.Utils.headerize(name)] = (value instanceof Array) ? value : [value];
    };
    /**
     * Get the value of the given header name at the given position.
     * @param {String} name header name
     * @returns {String|undefined} Returns the specified header, undefined if header doesn't exist.
     */
    OutgoingRequest.prototype.getHeader = function (name) {
        var header = this.headers[Utils_1.Utils.headerize(name)];
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
    OutgoingRequest.prototype.cancel = function (reason, extraHeaders) {
        // this gets defined "correctly" in InviteClientTransaction constructor
        // its a hack
    };
    /**
     * Get the header/s of the given name.
     * @param {String} name header name
     * @returns {Array} Array with all the headers of the specified name.
     */
    OutgoingRequest.prototype.getHeaders = function (name) {
        var result = [];
        var headerArray = this.headers[Utils_1.Utils.headerize(name)];
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
     * @param {String} name header name
     * @returns {boolean} true if header with given name exists, false otherwise
     */
    OutgoingRequest.prototype.hasHeader = function (name) {
        if (this.headers[Utils_1.Utils.headerize(name)]) {
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
    OutgoingRequest.prototype.toString = function () {
        var msg = "";
        msg += this.method + " " + (this.ruri.type === Enums_1.TypeStrings.URI ?
            this.ruri.toRaw() : this.ruri) + " SIP/2.0\r\n";
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
        msg += getSupportedHeader(this);
        msg += "User-Agent: " + this.ua.configuration.userAgentString + "\r\n";
        if (this.body) {
            if (typeof this.body === "string") {
                msg += "Content-Length: " + Utils_1.Utils.str_utf8_length(this.body) + "\r\n\r\n";
                msg += this.body;
            }
            else {
                if (this.body.body && this.body.contentType) {
                    msg += "Content-Type: " + this.body.contentType + "\r\n";
                    msg += "Content-Length: " + Utils_1.Utils.str_utf8_length(this.body.body) + "\r\n\r\n";
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
    return OutgoingRequest;
}());
exports.OutgoingRequest = OutgoingRequest;
/**
 * @class Class for incoming SIP message.
 */
// tslint:disable-next-line:max-classes-per-file
var IncomingMessage = /** @class */ (function () {
    function IncomingMessage() {
        this.type = Enums_1.TypeStrings.IncomingMessage;
        this.headers = {};
    }
    /**
     * Insert a header of the given name and value into the last position of the
     * header array.
     * @param {String} name header name
     * @param {String} value header value
     */
    IncomingMessage.prototype.addHeader = function (name, value) {
        var header = { raw: value };
        name = Utils_1.Utils.headerize(name);
        if (this.headers[name]) {
            this.headers[name].push(header);
        }
        else {
            this.headers[name] = [header];
        }
    };
    /**
     * Get the value of the given header name at the given position.
     * @param {String} name header name
     * @returns {String|undefined} Returns the specified header, undefined if header doesn't exist.
     */
    IncomingMessage.prototype.getHeader = function (name) {
        var header = this.headers[Utils_1.Utils.headerize(name)];
        if (header) {
            if (header[0]) {
                return header[0].raw;
            }
        }
        else {
            return;
        }
    };
    /**
     * Get the header/s of the given name.
     * @param {String} name header name
     * @returns {Array} Array with all the headers of the specified name.
     */
    IncomingMessage.prototype.getHeaders = function (name) {
        var header = this.headers[Utils_1.Utils.headerize(name)];
        var result = [];
        if (!header) {
            return [];
        }
        for (var _i = 0, header_1 = header; _i < header_1.length; _i++) {
            var headerPart = header_1[_i];
            result.push(headerPart.raw);
        }
        return result;
    };
    /**
     * Verify the existence of the given header.
     * @param {String} name header name
     * @returns {boolean} true if header with given name exists, false otherwise
     */
    IncomingMessage.prototype.hasHeader = function (name) {
        return !!this.headers[Utils_1.Utils.headerize(name)];
    };
    /**
     * Parse the given header on the given index.
     * @param {String} name header name
     * @param {Number} [idx=0] header index
     * @returns {Object|undefined} Parsed header object, undefined if the
     *   header is not present or in case of a parsing error.
     */
    IncomingMessage.prototype.parseHeader = function (name, idx) {
        if (idx === void 0) { idx = 0; }
        name = Utils_1.Utils.headerize(name);
        if (!this.headers[name]) {
            // this.logger.log("header '" + name + "' not present");
            return;
        }
        else if (idx >= this.headers[name].length) {
            // this.logger.log("not so many '" + name + "' headers present");
            return;
        }
        var header = this.headers[name][idx];
        var value = header.raw;
        if (header.parsed) {
            return header.parsed;
        }
        // substitute '-' by '_' for grammar rule matching.
        var parsed = Grammar_1.Grammar.parse(value, name.replace(/-/g, "_"));
        if (parsed === -1) {
            this.headers[name].splice(idx, 1); // delete from headers
            // this.logger.warn('error parsing "' + name + '" header field with value "' + value + '"');
            return;
        }
        else {
            header.parsed = parsed;
            return parsed;
        }
    };
    /**
     * Message Header attribute selector. Alias of parseHeader.
     * @param {String} name header name
     * @param {Number} [idx=0] header index
     * @returns {Object|undefined} Parsed header object, undefined if the
     *   header is not present or in case of a parsing error.
     *
     * @example
     * message.s('via',3).port
     */
    IncomingMessage.prototype.s = function (name, idx) {
        if (idx === void 0) { idx = 0; }
        return this.parseHeader(name, idx);
    };
    /**
     * Replace the value of the given header by the value.
     * @param {String} name header name
     * @param {String} value header value
     */
    IncomingMessage.prototype.setHeader = function (name, value) {
        this.headers[Utils_1.Utils.headerize(name)] = [{ raw: value }];
    };
    IncomingMessage.prototype.toString = function () {
        return this.data;
    };
    return IncomingMessage;
}());
/**
 * @class Class for incoming SIP request.
 */
// tslint:disable-next-line:max-classes-per-file
var IncomingRequest = /** @class */ (function (_super) {
    __extends(IncomingRequest, _super);
    function IncomingRequest(ua) {
        var _this = _super.call(this) || this;
        _this.type = Enums_1.TypeStrings.IncomingRequest;
        _this.logger = ua.getLogger("sip.sipmessage");
        _this.ua = ua;
        return _this;
    }
    /**
     * Stateful reply.
     * @param {Number} code status code
     * @param {String} reason reason phrase
     * @param {Object} headers extra headers
     * @param {String} body body
     * @param {Function} [onSuccess] onSuccess callback
     * @param {Function} [onFailure] onFailure callback
     */
    // TODO: Get rid of callbacks and make promise based
    IncomingRequest.prototype.reply = function (code, reason, extraHeaders, body, onSuccess, onFailure) {
        var response = Utils_1.Utils.buildStatusLine(code, reason);
        extraHeaders = (extraHeaders || []).slice();
        if (this.method === Constants_1.C.INVITE && code > 100 && code <= 200) {
            for (var _i = 0, _a = this.getHeaders("record-route"); _i < _a.length; _i++) {
                var route = _a[_i];
                response += "Record-Route: " + route + "\r\n";
            }
        }
        for (var _b = 0, _c = this.getHeaders("via"); _b < _c.length; _b++) {
            var via = _c[_b];
            response += "Via: " + via + "\r\n";
        }
        var to = this.getHeader("to") || "";
        if (!this.toTag && code > 100) {
            to += ";tag=" + Utils_1.Utils.newTag();
        }
        else if (this.toTag && !this.s("to").hasParam("tag")) {
            to += ";tag=" + this.toTag;
        }
        response += "To: " + to + "\r\n";
        response += "From: " + this.getHeader("From") + "\r\n";
        response += "Call-ID: " + this.callId + "\r\n";
        response += "CSeq: " + this.cseq + " " + this.method + "\r\n";
        for (var _d = 0, extraHeaders_1 = extraHeaders; _d < extraHeaders_1.length; _d++) {
            var extraHeader = extraHeaders_1[_d];
            response += extraHeader.trim() + "\r\n";
        }
        response += getSupportedHeader(this);
        response += "User-Agent: " + this.ua.configuration.userAgentString + "\r\n";
        if (body) {
            if (typeof body === "string") {
                response += "Content-Type: application/sdp\r\n";
                response += "Content-Length: " + Utils_1.Utils.str_utf8_length(body) + "\r\n\r\n";
                response += body;
            }
            else {
                if (body.body && body.contentType) {
                    response += "Content-Type: " + body.contentType + "\r\n";
                    response += "Content-Length: " + Utils_1.Utils.str_utf8_length(body.body) + "\r\n\r\n";
                    response += body.body;
                }
                else {
                    response += "Content-Length: " + 0 + "\r\n\r\n";
                }
            }
        }
        else {
            response += "Content-Length: " + 0 + "\r\n\r\n";
        }
        if (this.serverTransaction) {
            this.serverTransaction.receiveResponse(code, response).then(onSuccess, onFailure);
        }
        return response;
    };
    /**
     * Stateless reply.
     * @param {Number} code status code
     * @param {String} reason reason phrase
     */
    IncomingRequest.prototype.reply_sl = function (code, reason) {
        var response = Utils_1.Utils.buildStatusLine(code, reason);
        for (var _i = 0, _a = this.getHeaders("via"); _i < _a.length; _i++) {
            var via = _a[_i];
            response += "Via: " + via + "\r\n";
        }
        var to = this.getHeader("To") || "";
        if (!this.toTag && code > 100) {
            to += ";tag=" + Utils_1.Utils.newTag();
        }
        else if (this.toTag && !this.s("to").hasParam("tag")) {
            to += ";tag=" + this.toTag;
        }
        response += "To: " + to + "\r\n";
        response += "From: " + this.getHeader("From") + "\r\n";
        response += "Call-ID: " + this.callId + "\r\n";
        response += "CSeq: " + this.cseq + " " + this.method + "\r\n";
        response += "User-Agent: " + this.ua.configuration.userAgentString + "\r\n";
        response += "Content-Length: " + 0 + "\r\n\r\n";
        if (this.transport) {
            this.transport.send(response);
        }
    };
    return IncomingRequest;
}(IncomingMessage));
exports.IncomingRequest = IncomingRequest;
/**
 * @class Class for incoming SIP response.
 */
// tslint:disable-next-line:max-classes-per-file
var IncomingResponse = /** @class */ (function (_super) {
    __extends(IncomingResponse, _super);
    function IncomingResponse(ua) {
        var _this = _super.call(this) || this;
        _this.type = Enums_1.TypeStrings.IncomingResponse;
        _this.logger = ua.getLogger("sip.sipmessage");
        _this.headers = {};
        return _this;
    }
    return IncomingResponse;
}(IncomingMessage));
exports.IncomingResponse = IncomingResponse;
