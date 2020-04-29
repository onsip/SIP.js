"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const levels_1 = require("./levels");
/**
 * Logger.
 * @public
 */
class Logger {
    constructor(logger, category, label) {
        this.logger = logger;
        this.category = category;
        this.label = label;
    }
    error(content) { this.genericLog(levels_1.Levels.error, content); }
    warn(content) { this.genericLog(levels_1.Levels.warn, content); }
    log(content) { this.genericLog(levels_1.Levels.log, content); }
    debug(content) { this.genericLog(levels_1.Levels.debug, content); }
    genericLog(level, content) {
        this.logger.genericLog(level, this.category, this.label, content);
    }
}
exports.Logger = Logger;
