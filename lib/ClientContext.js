"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var events_1 = require("events");
var Constants_1 = require("./Constants");
var core_1 = require("./core");
var Enums_1 = require("./Enums");
var Utils_1 = require("./Utils");
var ClientContext = /** @class */ (function (_super) {
    tslib_1.__extends(ClientContext, _super);
    function ClientContext(ua, method, target, options) {
        var _this = _super.call(this) || this;
        _this.data = {};
        ClientContext.initializer(_this, ua, method, target, options);
        return _this;
    }
    ClientContext.initializer = function (objToConstruct, ua, method, originalTarget, options) {
        objToConstruct.type = Enums_1.TypeStrings.ClientContext;
        // Validate arguments
        if (originalTarget === undefined) {
            throw new TypeError("Not enough arguments");
        }
        objToConstruct.ua = ua;
        objToConstruct.logger = ua.getLogger("sip.clientcontext");
        objToConstruct.method = method;
        var target = ua.normalizeTarget(originalTarget);
        if (!target) {
            throw new TypeError("Invalid target: " + originalTarget);
        }
        var fromURI = ua.userAgentCore.configuration.aor;
        if (options && options.params && options.params.fromUri) {
            fromURI =
                (typeof options.params.fromUri === "string") ?
                    core_1.Grammar.URIParse(options.params.fromUri) :
                    options.params.fromUri;
            if (!fromURI) {
                throw new TypeError("Invalid from URI: " + options.params.fromUri);
            }
        }
        var toURI = target;
        if (options && options.params && options.params.toUri) {
            toURI =
                (typeof options.params.toUri === "string") ?
                    core_1.Grammar.URIParse(options.params.toUri) :
                    options.params.toUri;
            if (!toURI) {
                throw new TypeError("Invalid to URI: " + options.params.toUri);
            }
        }
        /* Options
        * - extraHeaders
        * - params
        * - contentType
        * - body
        */
        options = Object.create(options || Object.prototype);
        options = options || {};
        var extraHeaders = (options.extraHeaders || []).slice();
        var params = options.params || {};
        var bodyObj;
        if (options.body) {
            bodyObj = {
                body: options.body,
                contentType: options.contentType ? options.contentType : "application/sdp"
            };
            objToConstruct.body = bodyObj;
        }
        var body;
        if (bodyObj) {
            body = Utils_1.Utils.fromBodyObj(bodyObj);
        }
        // Build the request
        objToConstruct.request = ua.userAgentCore.makeOutgoingRequestMessage(method, target, fromURI, toURI, params, extraHeaders, body);
        /* Set other properties from the request */
        if (objToConstruct.request.from) {
            objToConstruct.localIdentity = objToConstruct.request.from;
        }
        if (objToConstruct.request.to) {
            objToConstruct.remoteIdentity = objToConstruct.request.to;
        }
    };
    ClientContext.prototype.send = function () {
        var _this = this;
        this.ua.userAgentCore.request(this.request, {
            onAccept: function (response) { return _this.receiveResponse(response.message); },
            onProgress: function (response) { return _this.receiveResponse(response.message); },
            onRedirect: function (response) { return _this.receiveResponse(response.message); },
            onReject: function (response) { return _this.receiveResponse(response.message); },
            onTrying: function (response) { return _this.receiveResponse(response.message); }
        });
        return this;
    };
    ClientContext.prototype.receiveResponse = function (response) {
        var statusCode = response.statusCode || 0;
        var cause = Utils_1.Utils.getReasonPhrase(statusCode);
        switch (true) {
            case /^1[0-9]{2}$/.test(statusCode.toString()):
                this.emit("progress", response, cause);
                break;
            case /^2[0-9]{2}$/.test(statusCode.toString()):
                if (this.ua.applicants[this.toString()]) {
                    delete this.ua.applicants[this.toString()];
                }
                this.emit("accepted", response, cause);
                break;
            default:
                if (this.ua.applicants[this.toString()]) {
                    delete this.ua.applicants[this.toString()];
                }
                this.emit("rejected", response, cause);
                this.emit("failed", response, cause);
                break;
        }
    };
    ClientContext.prototype.onRequestTimeout = function () {
        this.emit("failed", undefined, Constants_1.C.causes.REQUEST_TIMEOUT);
    };
    ClientContext.prototype.onTransportError = function () {
        this.emit("failed", undefined, Constants_1.C.causes.CONNECTION_ERROR);
    };
    return ClientContext;
}(events_1.EventEmitter));
exports.ClientContext = ClientContext;
