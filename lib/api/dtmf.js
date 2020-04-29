"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const info_1 = require("./info");
/**
 * A DTMF signal (incoming INFO).
 * @deprecated Use `Info`.
 * @internal
 */
class DTMF extends info_1.Info {
    /** @internal */
    constructor(incomingInfoRequest, tone, duration) {
        super(incomingInfoRequest);
        this._tone = tone;
        this._duration = duration;
    }
    get tone() {
        return this._tone;
    }
    get duration() {
        return this._duration;
    }
}
exports.DTMF = DTMF;
