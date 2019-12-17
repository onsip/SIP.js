"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var core_1 = require("../../core");
/**
 * An exception indicating the session terminated before the action completed.
 * @public
 */
var SessionTerminatedError = /** @class */ (function (_super) {
    tslib_1.__extends(SessionTerminatedError, _super);
    function SessionTerminatedError() {
        return _super.call(this, "The session has terminated.") || this;
    }
    return SessionTerminatedError;
}(core_1.Exception));
exports.SessionTerminatedError = SessionTerminatedError;
