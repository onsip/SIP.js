"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("../../core");
/**
 * An exception indicating an invalid state transition error occured.
 * @public
 */
class StateTransitionError extends core_1.Exception {
    constructor(message) {
        super(message ? message : "An error occurred during state transition.");
    }
}
exports.StateTransitionError = StateTransitionError;
