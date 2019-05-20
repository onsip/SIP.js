"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Constants_1 = require("../../Constants");
/**
 * FIXME: TODO: Should be configurable/variable.
 */
exports.AllowedMethods = [
    Constants_1.C.ACK,
    Constants_1.C.BYE,
    Constants_1.C.CANCEL,
    Constants_1.C.INFO,
    Constants_1.C.INVITE,
    Constants_1.C.MESSAGE,
    Constants_1.C.NOTIFY,
    Constants_1.C.OPTIONS,
    Constants_1.C.PRACK,
    Constants_1.C.REFER,
    Constants_1.C.SUBSCRIBE
];
