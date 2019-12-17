"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @internal
 */
var Parameters = /** @class */ (function () {
    function Parameters(parameters) {
        this.parameters = {};
        for (var param in parameters) {
            if (parameters.hasOwnProperty(param)) {
                this.setParam(param, parameters[param]);
            }
        }
    }
    Parameters.prototype.setParam = function (key, value) {
        if (key) {
            this.parameters[key.toLowerCase()] = (typeof value === "undefined" || value === null) ? null : value.toString();
        }
    };
    Parameters.prototype.getParam = function (key) {
        if (key) {
            return this.parameters[key.toLowerCase()];
        }
    };
    Parameters.prototype.hasParam = function (key) {
        if (key) {
            return !!this.parameters.hasOwnProperty(key.toLowerCase());
        }
        return false;
    };
    Parameters.prototype.deleteParam = function (parameter) {
        parameter = parameter.toLowerCase();
        if (this.parameters.hasOwnProperty(parameter)) {
            var value = this.parameters[parameter];
            delete this.parameters[parameter];
            return value;
        }
    };
    Parameters.prototype.clearParams = function () {
        this.parameters = {};
    };
    return Parameters;
}());
exports.Parameters = Parameters;
