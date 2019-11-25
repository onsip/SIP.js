"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var core_1 = require("../../core");
/**
 * An exception indicating an unsupported content type prevented execution.
 * @public
 */
var ContentTypeUnsupportedError = /** @class */ (function (_super) {
    tslib_1.__extends(ContentTypeUnsupportedError, _super);
    function ContentTypeUnsupportedError(message) {
        return _super.call(this, message ? message : "Unsupported content type.") || this;
    }
    return ContentTypeUnsupportedError;
}(core_1.Exception));
exports.ContentTypeUnsupportedError = ContentTypeUnsupportedError;
