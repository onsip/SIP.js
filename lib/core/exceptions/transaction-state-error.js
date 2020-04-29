"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const exception_1 = require("./exception");
/**
 * Indicates that the operation could not be completed given the current transaction state.
 * @public
 */
class TransactionStateError extends exception_1.Exception {
    constructor(message) {
        super(message ? message : "Transaction state error.");
    }
}
exports.TransactionStateError = TransactionStateError;
