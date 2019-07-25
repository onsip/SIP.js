"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var levels_1 = require("./levels");
var logger_1 = require("./logger");
/**
 * Logger.
 * @public
 */
var LoggerFactory = /** @class */ (function () {
    function LoggerFactory() {
        this.builtinEnabled = true;
        this._level = levels_1.Levels.log;
        this.loggers = {};
        this.logger = this.getLogger("sip:loggerfactory");
    }
    Object.defineProperty(LoggerFactory.prototype, "level", {
        get: function () { return this._level; },
        set: function (newLevel) {
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
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(LoggerFactory.prototype, "connector", {
        get: function () {
            return this._connector;
        },
        set: function (value) {
            if (!value) {
                this._connector = undefined;
            }
            else if (typeof value === "function") {
                this._connector = value;
            }
            else {
                this.logger.error("invalid 'connector' parameter value: " + JSON.stringify(value));
            }
        },
        enumerable: true,
        configurable: true
    });
    LoggerFactory.prototype.getLogger = function (category, label) {
        if (label && this.level === 3) {
            return new logger_1.Logger(this, category, label);
        }
        else if (this.loggers[category]) {
            return this.loggers[category];
        }
        else {
            var logger = new logger_1.Logger(this, category);
            this.loggers[category] = logger;
            return logger;
        }
    };
    LoggerFactory.prototype.genericLog = function (levelToLog, category, label, content) {
        if (this.level >= levelToLog) {
            if (this.builtinEnabled) {
                this.print(levelToLog, category, label, content);
            }
        }
        if (this.connector) {
            this.connector(levels_1.Levels[levelToLog], category, label, content);
        }
    };
    LoggerFactory.prototype.print = function (levelToLog, category, label, content) {
        if (typeof content === "string") {
            var prefix = [new Date(), category];
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
    };
    return LoggerFactory;
}());
exports.LoggerFactory = LoggerFactory;
