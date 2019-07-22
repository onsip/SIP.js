import { IncomingInfoRequest } from "../core";
import { Info } from "./info";

/**
 * A DTMF signal (incoming INFO).
 * @deprecated Use `Info`.
 * @internal
 */
export class DTMF extends Info {

  private _tone: string;
  private _duration: number;

  /** @internal */
  constructor(
    incomingInfoRequest: IncomingInfoRequest,
    tone: string,
    duration: number,
  ) {
    super(incomingInfoRequest);
    this._tone = tone;
    this._duration = duration;
  }

  get tone(): string {
    return this._tone;
  }

  get duration(): number {
    return this._duration;
  }
}
