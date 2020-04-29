"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("../../core");
/**
 * An exception indicating the session terminated before the action completed.
 * @public
 */
class SessionTerminatedError extends core_1.Exception {
    constructor() {
        super("The session has terminated.");
    }
}
exports.SessionTerminatedError = SessionTerminatedError;
