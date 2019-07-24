"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var incoming_message_1 = require("./incoming-message");
/**
 * Incoming response message.
 * @public
 */
var IncomingResponseMessage = /** @class */ (function (_super) {
    tslib_1.__extends(IncomingResponseMessage, _super);
    function IncomingResponseMessage() {
        return _super.call(this) || this;
    }
    return IncomingResponseMessage;
}(incoming_message_1.IncomingMessage));
exports.IncomingResponseMessage = IncomingResponseMessage;
