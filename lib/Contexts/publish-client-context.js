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
var PublishContext_1 = require("../PublishContext");
var PublishClientContext = /** @class */ (function (_super) {
    __extends(PublishClientContext, _super);
    function PublishClientContext(ua, target, event, options) {
        if (options === void 0) { options = {}; }
        return _super.call(this, ua, target, event, options) || this;
    }
    // Override ClientContext
    PublishClientContext.prototype.onRequestTimeout = function () {
        throw new Error("Method not utilized by user agent core.");
    };
    // Override ClientContext
    PublishClientContext.prototype.onTransportError = function () {
        throw new Error("Method not utilized by user agent core.");
    };
    // Override ClientContext
    PublishClientContext.prototype.receiveResponse = function (message) {
        _super.prototype.receiveResponse.call(this, message);
    };
    // Override ClientContext
    PublishClientContext.prototype.send = function () {
        var _this = this;
        if (!this.ua.userAgentCore) {
            throw new Error("User agent core undefined.");
        }
        this.ua.userAgentCore.publish(this.request, {
            onAccept: function (response) { return _this.receiveResponse(response.message); },
            onProgress: function (response) { return _this.receiveResponse(response.message); },
            onRedirect: function (response) { return _this.receiveResponse(response.message); },
            onReject: function (response) { return _this.receiveResponse(response.message); },
            onTrying: function (response) { return _this.receiveResponse(response.message); }
        });
        return this;
    };
    PublishClientContext.prototype.publish = function (body) {
        return _super.prototype.publish.call(this, body);
    };
    PublishClientContext.prototype.unpublish = function () {
        return _super.prototype.unpublish.call(this);
    };
    PublishClientContext.prototype.close = function () {
        return _super.prototype.close.call(this);
    };
    return PublishClientContext;
}(PublishContext_1.PublishContext));
exports.PublishClientContext = PublishClientContext;
