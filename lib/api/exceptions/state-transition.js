"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var core_1 = require("../../core");
/**
 * An exception indicating an invalid state transition error occured.
 * @public
 */
var StateTransitionError = /** @class */ (function (_super) {
    tslib_1.__extends(StateTransitionError, _super);
    function StateTransitionError(message) {
        return _super.call(this, message ? message : "An error occurred during state transition.") || this;
    }
    return StateTransitionError;
}(core_1.Exception));
exports.StateTransitionError = StateTransitionError;
