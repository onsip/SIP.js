"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var grammar_1 = require("./grammar");
var utils_1 = require("./utils");
/**
 * Incoming message.
 * @public
 */
var IncomingMessage = /** @class */ (function () {
    function IncomingMessage() {
        this.headers = {};
    }
    /**
     * Insert a header of the given name and value into the last position of the
     * header array.
     * @param name - header name
     * @param value - header value
     */
    IncomingMessage.prototype.addHeader = function (name, value) {
        var header = { raw: value };
        name = utils_1.headerize(name);
        if (this.headers[name]) {
            this.headers[name].push(header);
        }
        else {
            this.headers[name] = [header];
        }
    };
    /**
     * Get the value of the given header name at the given position.
     * @param name - header name
     * @returns Returns the specified header, undefined if header doesn't exist.
     */
    IncomingMessage.prototype.getHeader = function (name) {
        var header = this.headers[utils_1.headerize(name)];
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
     * @param name - header name
     * @returns Array - with all the headers of the specified name.
     */
    IncomingMessage.prototype.getHeaders = function (name) {
        var header = this.headers[utils_1.headerize(name)];
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
     * @param name - header name
     * @returns true if header with given name exists, false otherwise
     */
    IncomingMessage.prototype.hasHeader = function (name) {
        return !!this.headers[utils_1.headerize(name)];
    };
    /**
     * Parse the given header on the given index.
     * @param name - header name
     * @param idx - header index
     * @returns Parsed header object, undefined if the
     *   header is not present or in case of a parsing error.
     */
    IncomingMessage.prototype.parseHeader = function (name, idx) {
        if (idx === void 0) { idx = 0; }
        name = utils_1.headerize(name);
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
        var parsed = grammar_1.Grammar.parse(value, name.replace(/-/g, "_"));
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
     * @param name - header name
     * @param idx - header index
     * @returns Parsed header object, undefined if the
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
     * @param name - header name
     * @param value - header value
     */
    IncomingMessage.prototype.setHeader = function (name, value) {
        this.headers[utils_1.headerize(name)] = [{ raw: value }];
    };
    IncomingMessage.prototype.toString = function () {
        return this.data;
    };
    return IncomingMessage;
}());
exports.IncomingMessage = IncomingMessage;
