"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("../../core");
/**
 * An exception indicating an outstanding prior request prevented execution.
 * @public
 */
class RequestPendingError extends core_1.Exception {
    /** @internal */
    constructor(message) {
        super(message ? message : "Request pending.");
    }
}
exports.RequestPendingError = RequestPendingError;
