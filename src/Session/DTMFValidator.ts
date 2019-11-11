export class DTMFValidator {
  public static validate(tone: string | number, moreThanOneTone: boolean = true): string {
    // Check tone type
    if (typeof tone === "string" ) {
      tone = tone.toUpperCase();
    } else if (typeof tone === "number") {
      tone = tone.toString();
    } else {
      throw new TypeError("Invalid tone(s): " + tone);
    }
    const regex = moreThanOneTone ? /^[0-9A-D#*,]+$/i : /^[0-9A-D#*]$/i;
    // Check tone value
    if (!tone.match(regex)) {
      throw new TypeError("Invalid tone(s): " + tone);
    }
    return tone;
  }
}
