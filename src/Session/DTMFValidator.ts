export class DTMFValidator {
  public static checkTonesValidity(tone: string | number): string {
    // Check tone type
    if (typeof tone === "string" ) {
      tone = tone.toUpperCase();
    } else if (typeof tone === "number") {
      tone = tone.toString();
    } else {
      throw new TypeError("Invalid tone: " + tone);
    }
    // Check tone value
    if (!tone.match(/^[0-9A-D#*]$/)) {
      throw new TypeError("Invalid tone: " + tone);
    }
    return tone;
  }
}
