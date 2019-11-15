"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var grammar_1 = require("./grammar");
var incoming_request_message_1 = require("./incoming-request-message");
var incoming_response_message_1 = require("./incoming-response-message");
/**
 * Extract and parse every header of a SIP message.
 * @internal
 */
var Parser;
(function (Parser) {
    function getHeader(data, headerStart) {
        // 'start' position of the header.
        var start = headerStart;
        // 'end' position of the header.
        var end = 0;
        // 'partial end' position of the header.
        var partialEnd = 0;
        // End of message.
        if (data.substring(start, start + 2).match(/(^\r\n)/)) {
            return -2;
        }
        while (end === 0) {
            // Partial End of Header.
            partialEnd = data.indexOf("\r\n", start);
            // 'indexOf' returns -1 if the value to be found never occurs.
            if (partialEnd === -1) {
                return partialEnd;
            }
            if (!data.substring(partialEnd + 2, partialEnd + 4).match(/(^\r\n)/) &&
                data.charAt(partialEnd + 2).match(/(^\s+)/)) {
                // Not the end of the message. Continue from the next position.
                start = partialEnd + 2;
            }
            else {
                end = partialEnd;
            }
        }
        return end;
    }
    Parser.getHeader = getHeader;
    function parseHeader(message, data, headerStart, headerEnd) {
        var hcolonIndex = data.indexOf(":", headerStart);
        var headerName = data.substring(headerStart, hcolonIndex).trim();
        var headerValue = data.substring(hcolonIndex + 1, headerEnd).trim();
        var parsed;
        // If header-field is well-known, parse it.
        switch (headerName.toLowerCase()) {
            case "via":
            case "v":
                message.addHeader("via", headerValue);
                if (message.getHeaders("via").length === 1) {
                    parsed = message.parseHeader("Via");
                    if (parsed) {
                        message.via = parsed;
                        message.viaBranch = parsed.branch;
                    }
                }
                else {
                    parsed = 0;
                }
                break;
            case "from":
            case "f":
                message.setHeader("from", headerValue);
                parsed = message.parseHeader("from");
                if (parsed) {
                    message.from = parsed;
                    message.fromTag = parsed.getParam("tag");
                }
                break;
            case "to":
            case "t":
                message.setHeader("to", headerValue);
                parsed = message.parseHeader("to");
                if (parsed) {
                    message.to = parsed;
                    message.toTag = parsed.getParam("tag");
                }
                break;
            case "record-route":
                parsed = grammar_1.Grammar.parse(headerValue, "Record_Route");
                if (parsed === -1) {
                    parsed = undefined;
                    break;
                }
                if (!(parsed instanceof Array)) {
                    parsed = undefined;
                    break;
                }
                parsed.forEach(function (header) {
                    message.addHeader("record-route", headerValue.substring(header.position, header.offset));
                    message.headers["Record-Route"][message.getHeaders("record-route").length - 1].parsed = header.parsed;
                });
                break;
            case "call-id":
            case "i":
                message.setHeader("call-id", headerValue);
                parsed = message.parseHeader("call-id");
                if (parsed) {
                    message.callId = headerValue;
                }
                break;
            case "contact":
            case "m":
                parsed = grammar_1.Grammar.parse(headerValue, "Contact");
                if (parsed === -1) {
                    parsed = undefined;
                    break;
                }
                if (!(parsed instanceof Array)) {
                    parsed = undefined;
                    break;
                }
                parsed.forEach(function (header) {
                    message.addHeader("contact", headerValue.substring(header.position, header.offset));
                    message.headers.Contact[message.getHeaders("contact").length - 1].parsed = header.parsed;
                });
                break;
            case "content-length":
            case "l":
                message.setHeader("content-length", headerValue);
                parsed = message.parseHeader("content-length");
                break;
            case "content-type":
            case "c":
                message.setHeader("content-type", headerValue);
                parsed = message.parseHeader("content-type");
                break;
            case "cseq":
                message.setHeader("cseq", headerValue);
                parsed = message.parseHeader("cseq");
                if (parsed) {
                    message.cseq = parsed.value;
                }
                if (message instanceof incoming_response_message_1.IncomingResponseMessage) {
                    message.method = parsed.method;
                }
                break;
            case "max-forwards":
                message.setHeader("max-forwards", headerValue);
                parsed = message.parseHeader("max-forwards");
                break;
            case "www-authenticate":
                message.setHeader("www-authenticate", headerValue);
                parsed = message.parseHeader("www-authenticate");
                break;
            case "proxy-authenticate":
                message.setHeader("proxy-authenticate", headerValue);
                parsed = message.parseHeader("proxy-authenticate");
                break;
            case "refer-to":
            case "r":
                message.setHeader("refer-to", headerValue);
                parsed = message.parseHeader("refer-to");
                if (parsed) {
                    message.referTo = parsed;
                }
                break;
            default:
                // Do not parse this header.
                message.addHeader(headerName.toLowerCase(), headerValue);
                parsed = 0;
        }
        if (parsed === undefined) {
            return {
                error: "error parsing header '" + headerName + "'"
            };
        }
        else {
            return true;
        }
    }
    Parser.parseHeader = parseHeader;
    function parseMessage(data, logger) {
        var headerStart = 0;
        var headerEnd = data.indexOf("\r\n");
        if (headerEnd === -1) {
            logger.warn("no CRLF found, not a SIP message, discarded");
            return;
        }
        // Parse first line. Check if it is a Request or a Reply.
        var firstLine = data.substring(0, headerEnd);
        var parsed = grammar_1.Grammar.parse(firstLine, "Request_Response");
        var message;
        if (parsed === -1) {
            logger.warn('error parsing first line of SIP message: "' + firstLine + '"');
            return;
        }
        else if (!parsed.status_code) {
            message = new incoming_request_message_1.IncomingRequestMessage();
            message.method = parsed.method;
            message.ruri = parsed.uri;
        }
        else {
            message = new incoming_response_message_1.IncomingResponseMessage();
            message.statusCode = parsed.status_code;
            message.reasonPhrase = parsed.reason_phrase;
        }
        message.data = data;
        headerStart = headerEnd + 2;
        // Loop over every line in data. Detect the end of each header and parse
        // it or simply add to the headers collection.
        var bodyStart;
        while (true) {
            headerEnd = getHeader(data, headerStart);
            // The SIP message has normally finished.
            if (headerEnd === -2) {
                bodyStart = headerStart + 2;
                break;
            }
            else if (headerEnd === -1) {
                // data.indexOf returned -1 due to a malformed message.
                logger.error("malformed message");
                return;
            }
            var parsedHeader = parseHeader(message, data, headerStart, headerEnd);
            if (parsedHeader !== true) {
                logger.error(parsed.error);
                return;
            }
            headerStart = headerEnd + 2;
        }
        // RFC3261 18.3.
        // If there are additional bytes in the transport packet
        // beyond the end of the body, they MUST be discarded.
        if (message.hasHeader("content-length")) {
            message.body = data.substr(bodyStart, Number(message.getHeader("content-length")));
        }
        else {
            message.body = data.substring(bodyStart);
        }
        return message;
    }
    Parser.parseMessage = parseMessage;
})(Parser = exports.Parser || (exports.Parser = {}));
