type ToneType = number | string;

export class DTMFValidator {
  public static validate(tone: ToneType, moreThanOneTone: boolean = true): string {
    // Check tone type
    if (typeof tone === "string" ) {
      tone = tone.toUpperCase();
    } else if (typeof tone === "number") {
      tone = tone.toString();
    } else {
      DTMFValidator.generateInvalidToneError(tone);
    }
    const regex = moreThanOneTone ? /^[0-9A-D#*,]+$/i : /^[0-9A-D#*]$/i;
    // Check tone value
    if (!tone.match(regex)) {
      DTMFValidator.generateInvalidToneError(tone);
    }
    return tone;
  }

  private static generateInvalidToneError(tone: any): void {
    const toneForMsg: string = (!!tone && typeof tone !== "boolean" ? tone.toString().toLowerCase() : tone);
    throw new TypeError(`Invalid tone(s): ${toneForMsg}`);
  }
}
