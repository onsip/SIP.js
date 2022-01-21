"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var exception_1 = require("./exception");
/**
 * Transport error.
 * @public
 */
var TransportError = /** @class */ (function (_super) {
    tslib_1.__extends(TransportError, _super);
    function TransportError(message) {
        return _super.call(this, message ? message : "Unspecified transport error.") || this;
    }
    return TransportError;
}(exception_1.Exception));
exports.TransportError = TransportError;
