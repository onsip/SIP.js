"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var core_1 = require("../../core");
/**
 * An exception indicating an outstanding prior request prevented execution.
 * @public
 */
var RequestPendingError = /** @class */ (function (_super) {
    tslib_1.__extends(RequestPendingError, _super);
    /** @internal */
    function RequestPendingError(message) {
        return _super.call(this, message ? message : "Request pending.") || this;
    }
    return RequestPendingError;
}(core_1.Exception));
exports.RequestPendingError = RequestPendingError;
