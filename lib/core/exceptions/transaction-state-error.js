"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var exception_1 = require("./exception");
/**
 * Indicates that the operation could not be completed given the current transaction state.
 * @public
 */
var TransactionStateError = /** @class */ (function (_super) {
    tslib_1.__extends(TransactionStateError, _super);
    function TransactionStateError(message) {
        return _super.call(this, message ? message : "Transaction state error.") || this;
    }
    return TransactionStateError;
}(exception_1.Exception));
exports.TransactionStateError = TransactionStateError;
