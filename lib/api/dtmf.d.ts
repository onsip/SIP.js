import { IncomingInfoRequest } from "../core";
import { Info } from "./info";
/**
 * A DTMF signal (incoming INFO).
 * @deprecated Use `Info`.
 * @internal
 */
export declare class DTMF extends Info {
    private _tone;
    private _duration;
    /** @internal */
    constructor(incomingInfoRequest: IncomingInfoRequest, tone: string, duration: number);
    get tone(): string;
    get duration(): number;
}
//# sourceMappingURL=dtmf.d.ts.map