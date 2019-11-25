"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var messages_1 = require("../messages");
/**
 * FIXME: TODO: Should be configurable/variable.
 */
exports.AllowedMethods = [
    messages_1.C.ACK,
    messages_1.C.BYE,
    messages_1.C.CANCEL,
    messages_1.C.INFO,
    messages_1.C.INVITE,
    messages_1.C.MESSAGE,
    messages_1.C.NOTIFY,
    messages_1.C.OPTIONS,
    messages_1.C.PRACK,
    messages_1.C.REFER,
    messages_1.C.REGISTER,
    messages_1.C.SUBSCRIBE
];
