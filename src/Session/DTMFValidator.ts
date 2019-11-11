type ToneType = string | number;

export class DTMFValidator {
  public static validate(tone: ToneType, moreThanOneTone: boolean = true): string {
    // Check tone type
    if (typeof tone === "string" ) {
      tone = tone.toUpperCase();
    } else if (typeof tone === "number") {
      tone = tone.toString();
    }

    const regex = moreThanOneTone ? /^[0-9A-D#*,]+$/i : /^[0-9A-D#*]$/i;
    // Check tone value
    if (!!tone && !tone.match(regex)) {
      DTMFValidator.generateInvalidToneError(tone);
    }
    return tone;
  }

  private static generateInvalidToneError(tone: ToneType): void {
    throw new TypeError("Invalid tone(s): " + (!!tone && typeof tone !== 'boolean' ? tone.toString().toLowerCase() : tone));
  }
}
