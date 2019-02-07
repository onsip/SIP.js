"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Enums_1 = require("./Enums");
// tslint:disable:max-classes-per-file
var Exception = /** @class */ (function (_super) {
    __extends(Exception, _super);
    function Exception(code, name, message) {
        var _this = _super.call(this, message) || this;
        _this.code = code;
        _this.name = name;
        _this.message = message;
        return _this;
    }
    return Exception;
}(Error));
var Exceptions;
(function (Exceptions) {
    var ConfigurationError = /** @class */ (function (_super) {
        __extends(ConfigurationError, _super);
        function ConfigurationError(parameter, value) {
            var _this = _super.call(this, 1, "CONFIGURATION_ERROR", (!value) ? "Missing parameter: " + parameter :
                "Invalid value " + JSON.stringify(value) + " for parameter '" + parameter + "'") || this;
            _this.type = Enums_1.TypeStrings.ConfigurationError;
            _this.parameter = parameter;
            _this.value = value;
            return _this;
        }
        return ConfigurationError;
    }(Exception));
    Exceptions.ConfigurationError = ConfigurationError;
    var InvalidStateError = /** @class */ (function (_super) {
        __extends(InvalidStateError, _super);
        function InvalidStateError(status) {
            var _this = _super.call(this, 2, "INVALID_STATE_ERROR", "Invalid status: " + status) || this;
            _this.type = Enums_1.TypeStrings.InvalidStateError;
            _this.status = status;
            return _this;
        }
        return InvalidStateError;
    }(Exception));
    Exceptions.InvalidStateError = InvalidStateError;
    var NotSupportedError = /** @class */ (function (_super) {
        __extends(NotSupportedError, _super);
        function NotSupportedError(message) {
            var _this = _super.call(this, 3, "NOT_SUPPORTED_ERROR", message) || this;
            _this.type = Enums_1.TypeStrings.NotSupportedError;
            return _this;
        }
        return NotSupportedError;
    }(Exception));
    Exceptions.NotSupportedError = NotSupportedError;
    // 4 was GetDescriptionError, which was deprecated and now removed
    var RenegotiationError = /** @class */ (function (_super) {
        __extends(RenegotiationError, _super);
        function RenegotiationError(message) {
            var _this = _super.call(this, 5, "RENEGOTIATION_ERROR", message) || this;
            _this.type = Enums_1.TypeStrings.RenegotiationError;
            return _this;
        }
        return RenegotiationError;
    }(Exception));
    Exceptions.RenegotiationError = RenegotiationError;
    var MethodParameterError = /** @class */ (function (_super) {
        __extends(MethodParameterError, _super);
        function MethodParameterError(method, parameter, value) {
            var _this = _super.call(this, 6, "METHOD_PARAMETER_ERROR", (!value) ?
                "Missing parameter: " + parameter :
                "Invalid value " + JSON.stringify(value) + " for parameter '" + parameter + "'") || this;
            _this.type = Enums_1.TypeStrings.MethodParameterError;
            _this.method = method;
            _this.parameter = parameter;
            _this.value = value;
            return _this;
        }
        return MethodParameterError;
    }(Exception));
    Exceptions.MethodParameterError = MethodParameterError;
    var TransportError = /** @class */ (function (_super) {
        __extends(TransportError, _super);
        function TransportError(message) {
            var _this = _super.call(this, 7, "TRANSPORT_ERROR", message) || this;
            _this.type = Enums_1.TypeStrings.TransportError;
            return _this;
        }
        return TransportError;
    }(Exception));
    Exceptions.TransportError = TransportError;
    var SessionDescriptionHandlerError = /** @class */ (function (_super) {
        __extends(SessionDescriptionHandlerError, _super);
        function SessionDescriptionHandlerError(method, error, message) {
            var _this = _super.call(this, 8, "SESSION_DESCRIPTION_HANDLER_ERROR", message || "Error with Session Description Handler") || this;
            _this.type = Enums_1.TypeStrings.SessionDescriptionHandlerError;
            _this.method = method;
            _this.error = error;
            return _this;
        }
        return SessionDescriptionHandlerError;
    }(Exception));
    Exceptions.SessionDescriptionHandlerError = SessionDescriptionHandlerError;
})(Exceptions = exports.Exceptions || (exports.Exceptions = {}));
