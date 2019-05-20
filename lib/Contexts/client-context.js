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
var ClientContext_1 = require("../ClientContext");
var ClientContext = /** @class */ (function (_super) {
    __extends(ClientContext, _super);
    // Override ClientContext
    function ClientContext(ua, method, target, options) {
        return _super.call(this, ua, method, target, options) || this;
    }
    // Override ClientContext
    ClientContext.prototype.onRequestTimeout = function () {
        throw new Error("Method not utilized by user agent core.");
    };
    // Override ClientContext
    ClientContext.prototype.onTransportError = function () {
        throw new Error("Method not utilized by user agent core.");
    };
    // Override ClientContext
    ClientContext.prototype.receiveResponse = function (message) {
        _super.prototype.receiveResponse.call(this, message);
    };
    // Override ClientContext
    ClientContext.prototype.send = function () {
        var _this = this;
        if (!this.ua.userAgentCore) {
            throw new Error("User agent core undefined.");
        }
        var outgoingRequest = this.ua.userAgentCore.request(this.request, {
            onAccept: function (response) { return _this.receiveResponse(response.message); },
            onProgress: function (response) { return _this.receiveResponse(response.message); },
            onRedirect: function (response) { return _this.receiveResponse(response.message); },
            onReject: function (response) { return _this.receiveResponse(response.message); },
            onTrying: function (response) { return _this.receiveResponse(response.message); }
        });
        return this;
    };
    return ClientContext;
}(ClientContext_1.ClientContext));
exports.ClientContext = ClientContext;
