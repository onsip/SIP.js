"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var incoming_message_1 = require("./incoming-message");
/**
 * Incoming request message.
 * @public
 */
var IncomingRequestMessage = /** @class */ (function (_super) {
    tslib_1.__extends(IncomingRequestMessage, _super);
    function IncomingRequestMessage() {
        return _super.call(this) || this;
    }
    return IncomingRequestMessage;
}(incoming_message_1.IncomingMessage));
exports.IncomingRequestMessage = IncomingRequestMessage;
