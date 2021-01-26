import { Info } from "./info";
/**
 * A DTMF signal (incoming INFO).
 * @deprecated Use `Info`.
 * @internal
 */
export class DTMF extends Info {
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
