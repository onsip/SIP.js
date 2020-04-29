"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var core_1 = require("../../core");
/**
 * An exception indicating a session description handler error occured.
 * @public
 */
var SessionDescriptionHandlerError = /** @class */ (function (_super) {
    tslib_1.__extends(SessionDescriptionHandlerError, _super);
    function SessionDescriptionHandlerError(message) {
        return _super.call(this, message ? message : "Unspecified session description handler error.") || this;
    }
    return SessionDescriptionHandlerError;
}(core_1.Exception));
exports.SessionDescriptionHandlerError = SessionDescriptionHandlerError;
