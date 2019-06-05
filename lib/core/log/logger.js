"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var levels_1 = require("./levels");
/**
 * Logger.
 * @public
 */
var Logger = /** @class */ (function () {
    function Logger(logger, category, label) {
        this.logger = logger;
        this.category = category;
        this.label = label;
    }
    Logger.prototype.error = function (content) { this.genericLog(levels_1.Levels.error, content); };
    Logger.prototype.warn = function (content) { this.genericLog(levels_1.Levels.warn, content); };
    Logger.prototype.log = function (content) { this.genericLog(levels_1.Levels.log, content); };
    Logger.prototype.debug = function (content) { this.genericLog(levels_1.Levels.debug, content); };
    Logger.prototype.genericLog = function (level, content) {
        this.logger.genericLog(level, this.category, this.label, content);
    };
    return Logger;
}());
exports.Logger = Logger;
