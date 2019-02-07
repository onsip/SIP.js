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
var events_1 = require("events");
var Constants_1 = require("./Constants");
var Enums_1 = require("./Enums");
var Grammar_1 = require("./Grammar");
var Transactions_1 = require("./Transactions");
var Utils_1 = require("./Utils");
var ServerContext = /** @class */ (function (_super) {
    __extends(ServerContext, _super);
    function ServerContext(ua, request) {
        var _this = _super.call(this) || this;
        _this.data = {};
        ServerContext.initializer(_this, ua, request);
        return _this;
    }
    // hack to get around our multiple inheritance issues
    ServerContext.initializer = function (objectToConstruct, ua, request) {
        objectToConstruct.type = Enums_1.TypeStrings.ServerContext;
        objectToConstruct.ua = ua;
        objectToConstruct.logger = ua.getLogger("sip.servercontext");
        objectToConstruct.request = request;
        if (request.method === Constants_1.C.INVITE) {
            objectToConstruct.transaction = new Transactions_1.InviteServerTransaction(request, ua);
        }
        else {
            objectToConstruct.transaction = new Transactions_1.NonInviteServerTransaction(request, ua);
        }
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
                objectToConstruct.assertedIdentity = Grammar_1.Grammar.nameAddrHeaderParse(assertedIdentity);
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
        var body = options.body;
        var events = options.events || [];
        if (statusCode < minCode || statusCode > maxCode) {
            throw new TypeError("Invalid statusCode: " + statusCode);
        }
        var response = this.request.reply(statusCode, reasonPhrase, extraHeaders, body);
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
