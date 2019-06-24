"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var events_1 = require("events");
var Constants_1 = require("./Constants");
var core_1 = require("./core");
var Enums_1 = require("./Enums");
var Utils_1 = require("./Utils");
var ServerContext = /** @class */ (function (_super) {
    tslib_1.__extends(ServerContext, _super);
    function ServerContext(ua, incomingRequest) {
        var _this = _super.call(this) || this;
        _this.incomingRequest = incomingRequest;
        _this.data = {};
        ServerContext.initializer(_this, ua, incomingRequest);
        return _this;
    }
    // hack to get around our multiple inheritance issues
    ServerContext.initializer = function (objectToConstruct, ua, incomingRequest) {
        var request = incomingRequest.message;
        objectToConstruct.type = Enums_1.TypeStrings.ServerContext;
        objectToConstruct.ua = ua;
        objectToConstruct.logger = ua.getLogger("sip.servercontext");
        objectToConstruct.request = request;
        if (request.body) {
            objectToConstruct.body = request.body;
        }
        if (request.hasHeader("Content-Type")) {
            objectToConstruct.contentType = request.getHeader("Content-Type");
        }
        objectToConstruct.method = request.method;
        objectToConstruct.localIdentity = request.to;
        objectToConstruct.remoteIdentity = request.from;
        var hasAssertedIdentity = request.hasHeader("P-Asserted-Identity");
        if (hasAssertedIdentity) {
            var assertedIdentity = request.getHeader("P-Asserted-Identity");
            if (assertedIdentity) {
                objectToConstruct.assertedIdentity = core_1.Grammar.nameAddrHeaderParse(assertedIdentity);
            }
        }
    };
    ServerContext.prototype.progress = function (options) {
        if (options === void 0) { options = {}; }
        options.statusCode = options.statusCode || 180;
        options.minCode = 100;
        options.maxCode = 199;
        options.events = ["progress"];
        return this.reply(options);
    };
    ServerContext.prototype.accept = function (options) {
        if (options === void 0) { options = {}; }
        options.statusCode = options.statusCode || 200;
        options.minCode = 200;
        options.maxCode = 299;
        options.events = ["accepted"];
        return this.reply(options);
    };
    ServerContext.prototype.reject = function (options) {
        if (options === void 0) { options = {}; }
        options.statusCode = options.statusCode || 480;
        options.minCode = 300;
        options.maxCode = 699;
        options.events = ["rejected", "failed"];
        return this.reply(options);
    };
    ServerContext.prototype.reply = function (options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        var statusCode = options.statusCode || 100;
        var minCode = options.minCode || 100;
        var maxCode = options.maxCode || 699;
        var reasonPhrase = Utils_1.Utils.getReasonPhrase(statusCode, options.reasonPhrase);
        var extraHeaders = options.extraHeaders || [];
        var body = options.body ? core_1.fromBodyLegacy(options.body) : undefined;
        var events = options.events || [];
        if (statusCode < minCode || statusCode > maxCode) {
            throw new TypeError("Invalid statusCode: " + statusCode);
        }
        var responseOptions = {
            statusCode: statusCode,
            reasonPhrase: reasonPhrase,
            extraHeaders: extraHeaders,
            body: body
        };
        var response;
        var statusCodeString = statusCode.toString();
        switch (true) {
            case /^100$/.test(statusCodeString):
                response = this.incomingRequest.trying(responseOptions).message;
                break;
            case /^1[0-9]{2}$/.test(statusCodeString):
                response = this.incomingRequest.progress(responseOptions).message;
                break;
            case /^2[0-9]{2}$/.test(statusCodeString):
                response = this.incomingRequest.accept(responseOptions).message;
                break;
            case /^3[0-9]{2}$/.test(statusCodeString):
                response = this.incomingRequest.redirect([], responseOptions).message;
                break;
            case /^[4-6][0-9]{2}$/.test(statusCodeString):
                response = this.incomingRequest.reject(responseOptions).message;
                break;
            default:
                throw new Error("Invalid status code " + statusCode);
        }
        events.forEach(function (event) {
            _this.emit(event, response, reasonPhrase);
        });
        return this;
    };
    ServerContext.prototype.onRequestTimeout = function () {
        this.emit("failed", undefined, Constants_1.C.causes.REQUEST_TIMEOUT);
    };
    ServerContext.prototype.onTransportError = function () {
        this.emit("failed", undefined, Constants_1.C.causes.CONNECTION_ERROR);
    };
    return ServerContext;
}(events_1.EventEmitter));
exports.ServerContext = ServerContext;
