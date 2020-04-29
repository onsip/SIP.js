"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("../../core");
/**
 * An exception indicating an unsupported content type prevented execution.
 * @public
 */
class ContentTypeUnsupportedError extends core_1.Exception {
    constructor(message) {
        super(message ? message : "Unsupported content type.");
    }
}
exports.ContentTypeUnsupportedError = ContentTypeUnsupportedError;
