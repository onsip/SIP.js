"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var DTMFValidator = /** @class */ (function () {
    function DTMFValidator() {
    }
    DTMFValidator.validate = function (tone, moreThanOneTone) {
        if (moreThanOneTone === void 0) { moreThanOneTone = true; }
        // Check tone type
        if (typeof tone === "string") {
            tone = tone.toUpperCase();
        }
        else if (typeof tone === "number") {
            tone = tone.toString();
        }
        else {
            DTMFValidator.generateInvalidToneError(tone);
        }
        var regex = moreThanOneTone ? /^[0-9A-D#*,]+$/i : /^[0-9A-D#*]$/i;
        // Check tone value
        if (!tone.match(regex)) {
            DTMFValidator.generateInvalidToneError(tone);
        }
        return tone;
    };
    DTMFValidator.generateInvalidToneError = function (tone) {
        var toneForMsg = (!!tone && typeof tone !== "boolean" ? tone.toString().toLowerCase() : tone);
        throw new TypeError("Invalid tone(s): " + toneForMsg);
    };
    return DTMFValidator;
}());
exports.DTMFValidator = DTMFValidator;
