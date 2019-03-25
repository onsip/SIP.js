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
var Transactions_1 = require("./Transactions");
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
        // FIXME: Why are response properties on a Request class?
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
    /**
     * Replace the the given header by the given value.
     * @param {String} name header name
     * @param {String | Array} value header value
     */
    OutgoingRequest.prototype.setHeader = function (name, value) {
        this.headers[Utils_1.Utils.headerize(name)] = (value instanceof Array) ? value : [value];
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
     * @param branchParameter The branch parameter.
     * @param transport The transport.
     */
    OutgoingRequest.prototype.setViaHeader = function (branch, transport) {
        // FIXME: Default scheme to "WSS"
        // This should go away once transport is typed and we can be sure
        // we are getting the something valid from there transport.
        var scheme = "WSS";
        // FIXME: Transport's server property is not typed (as of writing this).
        if (transport.server && transport.server.scheme) {
            scheme = transport.server.scheme;
        }
        // FIXME: Hack
        if (this.ua.configuration.hackViaTcp) {
            scheme = "TCP";
        }
        var via = "SIP/2.0/" + scheme;
        via += " " + this.ua.configuration.viaHost + ";branch=" + branch;
        if (this.ua.configuration.forceRport) {
            via += ";rport";
        }
        this.setHeader("via", via);
        this.branch = branch;
    };
    /**
     * Cancel this request.
     * If this is not an INVITE request, a no-op.
     * @param reason Reason phrase.
     * @param extraHeaders Extra headers.
     */
    OutgoingRequest.prototype.cancel = function (reason, extraHeaders) {
        var _this = this;
        if (!this.transaction) {
            throw new Error("Transaction undefined.");
        }
        var sendCancel = function () {
            if (!_this.transaction) {
                throw new Error("Transaction undefined.");
            }
            if (!_this.to) {
                throw new Error("To undefined.");
            }
            if (!_this.from) {
                throw new Error("From undefined.");
            }
            var toHeader = _this.getHeader("To");
            if (!toHeader) {
                throw new Error("To header undefined.");
            }
            var fromHeader = _this.getHeader("From");
            if (!fromHeader) {
                throw new Error("From header undefined.");
            }
            var cancel = new OutgoingRequest(Constants_1.C.CANCEL, _this.ruri, _this.ua, {
                toUri: _this.to.uri,
                fromUri: _this.from.uri,
                callId: _this.callId,
                cseq: _this.cseq
            }, extraHeaders);
            _this.setHeader("To", toHeader);
            _this.setHeader("From", fromHeader);
            cancel.callId = _this.callId;
            _this.setHeader("Call-ID", _this.callId);
            cancel.cseq = _this.cseq;
            _this.setHeader("CSeq", _this.cseq + " " + cancel.method);
            // TODO: Revisit this.
            // The CANCEL needs to use the same branch parameter so that
            // it matches the INVITE transaction, but this is a hacky way to do this.
            // Or at the very least not well documented. If the the branch parameter
            // is set on the outgoing request, the transaction will use it. Otherwise
            // the transaction will make a new one.
            cancel.branch = _this.branch;
            if (_this.headers.Route) {
                cancel.headers.Route = _this.headers.Route;
            }
            if (reason) {
                cancel.setHeader("Reason", reason);
            }
            var transport = _this.transaction.transport;
            var user = {
                loggerFactory: _this.ua.getLoggerFactory(),
                onStateChange: function (newState) {
                    if (newState === Transactions_1.TransactionState.Terminated) {
                        _this.ua.destroyTransaction(clientTransaction);
                    }
                },
                receiveResponse: function (response) { return; }
            };
            var clientTransaction = new Transactions_1.NonInviteClientTransaction(cancel, transport, user);
            _this.ua.newTransaction(clientTransaction);
        };
        // A CANCEL request SHOULD NOT be sent to cancel a request other than INVITE.
        // Since requests other than INVITE are responded to immediately, sending a
        // CANCEL for a non-INVITE request would always create a race condition.
        // https://tools.ietf.org/html/rfc3261#section-9.1
        if (!(this.transaction instanceof Transactions_1.InviteClientTransaction)) {
            return;
        }
        // If no provisional response has been received, the CANCEL request MUST
        // NOT be sent; rather, the client MUST wait for the arrival of a
        // provisional response before sending the request. If the original
        // request has generated a final response, the CANCEL SHOULD NOT be
        // sent, as it is an effective no-op, since CANCEL has no effect on
        // requests that have already generated a final response.
        // https://tools.ietf.org/html/rfc3261#section-9.1
        if (this.transaction.state === Transactions_1.TransactionState.Proceeding) {
            sendCancel();
        }
        else {
            this.transaction.once("stateChanged", function () {
                if (_this.transaction && _this.transaction.state === Transactions_1.TransactionState.Proceeding) {
                    sendCancel();
                }
            });
        }
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
        _this.ua = ua;
        _this.type = Enums_1.TypeStrings.IncomingRequest;
        _this.logger = ua.getLogger("sip.sipmessage");
        return _this;
    }
    /**
     * Stateful reply.
     * @param {Number} code status code
     * @param {String} reason reason phrase
     * @param {Object} headers extra headers
     * @param {String} body body
     */
    IncomingRequest.prototype.reply = function (code, reason, extraHeaders, body) {
        if (!this.transaction) {
            throw new Error("Transaction undefined.");
        }
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
        this.transaction.receiveResponse(code, response);
        return response;
    };
    /**
     * Stateless reply.
     * @param {Number} code status code
     * @param {String} reason reason phrase
     */
    IncomingRequest.prototype.reply_sl = function (code, reason) {
        if (!this.transport) {
            throw new Error("Transport undefined.");
        }
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
        this.transport.send(response);
        return response;
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
        _this.ua = ua;
        _this.type = Enums_1.TypeStrings.IncomingResponse;
        _this.logger = ua.getLogger("sip.sipmessage");
        _this.headers = {};
        return _this;
    }
    /**
     * Constructs and sends ACK to 2xx final response. Returns the sent ACK.
     * @param response The 2xx final repsonse the ACK is acknowledging.
     * @param options ACK options; extra headers, body.
     */
    IncomingResponse.prototype.ack = function (options) {
        if (!this.statusCode || this.statusCode < 200 || this.statusCode > 299) {
            throw new Error("Response status code must be 2xx to ACK.");
        }
        if (this.method !== Constants_1.C.INVITE) {
            throw new Error("Response must to be for an INVITE to ACK.");
        }
        if (!this.transaction) {
            throw new Error("Transaction undefined.");
        }
        if (!(this.transaction instanceof Transactions_1.InviteClientTransaction)) {
            throw new Error("Transaction not instance of InviteServerTrasaction.");
        }
        var contact = this.parseHeader("contact");
        if (!contact || !contact.uri) {
            throw new Error("Failed to parse contact header.");
        }
        var ruri = contact.uri;
        var request = new OutgoingRequest(Constants_1.C.ACK, ruri, this.ua, {
            cseq: this.cseq,
            callId: this.callId,
            fromUri: this.from.uri,
            fromTag: this.fromTag,
            toUri: this.to.uri,
            toTag: this.toTag,
            routeSet: this.getHeaders("record-route").reverse()
        }, options ? options.extraHeaders : undefined, options ? options.body : undefined);
        this.transaction.ackResponse(this, request);
        return request;
    };
    return IncomingResponse;
}(IncomingMessage));
exports.IncomingResponse = IncomingResponse;
