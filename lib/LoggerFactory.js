"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Enums_1 = require("./Enums");
var Levels;
(function (Levels) {
    Levels[Levels["error"] = 0] = "error";
    Levels[Levels["warn"] = 1] = "warn";
    Levels[Levels["log"] = 2] = "log";
    Levels[Levels["debug"] = 3] = "debug";
})(Levels = exports.Levels || (exports.Levels = {}));
var LoggerFactory = /** @class */ (function () {
    function LoggerFactory() {
        this.builtinEnabled = true;
        // tslint:disable-next-line:variable-name
        this._level = Levels.log;
        this.loggers = {};
        this.type = Enums_1.TypeStrings.LoggerFactory;
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
            else if (Levels.hasOwnProperty(newLevel)) {
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
            return new Logger(this, category, label);
        }
        else if (this.loggers[category]) {
            return this.loggers[category];
        }
        else {
            var logger = new Logger(this, category);
            this.loggers[category] = logger;
            return logger;
        }
    };
    LoggerFactory.prototype.genericLog = function (levelToLog, category, label, content) {
        if (this.level >= levelToLog) {
            if (this.builtinEnabled) {
                this.print(console[Levels[levelToLog]], category, label, content);
            }
            if (this.connector) {
                this.connector(Levels[levelToLog], category, label, content);
            }
        }
    };
    LoggerFactory.prototype.print = function (target, category, label, content) {
        if (typeof content === "string") {
            var prefix = [new Date(), category];
            if (label) {
                prefix.push(label);
            }
            content = prefix.concat(content).join(" | ");
        }
        target.call(console, content);
    };
    return LoggerFactory;
}());
exports.LoggerFactory = LoggerFactory;
// tslint:disable-next-line:max-classes-per-file
var Logger = /** @class */ (function () {
    function Logger(logger, category, label) {
        this.type = Enums_1.TypeStrings.Logger;
        this.logger = logger;
        this.category = category;
        this.label = label;
    }
    Logger.prototype.error = function (content) { this.genericLog(Levels.error, content); };
    Logger.prototype.warn = function (content) { this.genericLog(Levels.warn, content); };
    Logger.prototype.log = function (content) { this.genericLog(Levels.log, content); };
    Logger.prototype.debug = function (content) { this.genericLog(Levels.debug, content); };
    Logger.prototype.genericLog = function (level, content) {
        this.logger.genericLog(level, this.category, this.label, content);
    };
    return Logger;
}());
exports.Logger = Logger;
