"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const exception_1 = require("./exception");
/**
 * Transport error.
 * @public
 */
class TransportError extends exception_1.Exception {
    constructor(message) {
        super(message ? message : "Unspecified transport error.");
    }
}
exports.TransportError = TransportError;
