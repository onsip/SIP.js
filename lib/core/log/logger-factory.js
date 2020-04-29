"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const levels_1 = require("./levels");
const logger_1 = require("./logger");
/**
 * Logger.
 * @public
 */
class LoggerFactory {
    constructor() {
        this.builtinEnabled = true;
        this._level = levels_1.Levels.log;
        this.loggers = {};
        this.logger = this.getLogger("sip:loggerfactory");
    }
    get level() { return this._level; }
    set level(newLevel) {
        if (newLevel >= 0 && newLevel <= 3) {
            this._level = newLevel;
        }
        else if (newLevel > 3) {
            this._level = 3;
        }
        else if (levels_1.Levels.hasOwnProperty(newLevel)) {
            this._level = newLevel;
        }
        else {
            this.logger.error("invalid 'level' parameter value: " + JSON.stringify(newLevel));
        }
    }
    get connector() {
        return this._connector;
    }
    set connector(value) {
        if (!value) {
            this._connector = undefined;
        }
        else if (typeof value === "function") {
            this._connector = value;
        }
        else {
            this.logger.error("invalid 'connector' parameter value: " + JSON.stringify(value));
        }
    }
    getLogger(category, label) {
        if (label && this.level === 3) {
            return new logger_1.Logger(this, category, label);
        }
        else if (this.loggers[category]) {
            return this.loggers[category];
        }
        else {
            const logger = new logger_1.Logger(this, category);
            this.loggers[category] = logger;
            return logger;
        }
    }
    genericLog(levelToLog, category, label, content) {
        if (this.level >= levelToLog) {
            if (this.builtinEnabled) {
                this.print(levelToLog, category, label, content);
            }
        }
        if (this.connector) {
            this.connector(levels_1.Levels[levelToLog], category, label, content);
        }
    }
    print(levelToLog, category, label, content) {
        if (typeof content === "string") {
            const prefix = [new Date(), category];
            if (label) {
                prefix.push(label);
            }
            content = prefix.concat(content).join(" | ");
        }
        switch (levelToLog) {
            case levels_1.Levels.error:
                // tslint:disable-next-line:no-console
                console.error(content);
                break;
            case levels_1.Levels.warn:
                // tslint:disable-next-line:no-console
                console.warn(content);
                break;
            case levels_1.Levels.log:
                // tslint:disable-next-line:no-console
                console.log(content);
                break;
            case levels_1.Levels.debug:
                // tslint:disable-next-line:no-console
                console.debug(content);
                break;
            default:
                break;
        }
    }
}
exports.LoggerFactory = LoggerFactory;
