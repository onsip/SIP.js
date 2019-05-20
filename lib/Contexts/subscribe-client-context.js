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
var Subscription_1 = require("../Subscription");
var SubscribeClientContext = /** @class */ (function (_super) {
    __extends(SubscribeClientContext, _super);
    function SubscribeClientContext(ua, target, event, options) {
        if (options === void 0) { options = {}; }
        return _super.call(this, ua, target, event, options) || this;
    }
    // Override ClientContext
    SubscribeClientContext.prototype.onRequestTimeout = function () {
        throw new Error("Method not utilized by user agent core.");
    };
    // Override ClientContext
    SubscribeClientContext.prototype.onTransportError = function () {
        throw new Error("Method not utilized by user agent core.");
    };
    // Override ClientContext
    SubscribeClientContext.prototype.receiveResponse = function (message) {
        _super.prototype.receiveResponse.call(this, message);
    };
    // Override ClientContext
    SubscribeClientContext.prototype.send = function () {
        var _this = this;
        if (!this.ua.userAgentCore) {
            throw new Error("User agent core undefined.");
        }
        this.ua.userAgentCore.subscribe(this.request, {
            onAccept: function (subscribeResponse) {
                _this.subscription = subscribeResponse.subscription;
                return _this.receiveResponse(subscribeResponse.message);
            },
            onProgress: function (subscribeResponse) { return _this.receiveResponse(subscribeResponse.message); },
            onRedirect: function (subscribeResponse) { return _this.receiveResponse(subscribeResponse.message); },
            onReject: function (subscribeResponse) { return _this.receiveResponse(subscribeResponse.message); },
            onTrying: function (subscribeResponse) { return _this.receiveResponse(subscribeResponse.message); }
        });
        return this;
    };
    SubscribeClientContext.prototype.refresh = function () {
        _super.prototype.refresh.call(this);
    };
    SubscribeClientContext.prototype.subscribe = function () {
        return _super.prototype.subscribe.call(this);
    };
    SubscribeClientContext.prototype.unsubscribe = function () {
        _super.prototype.unsubscribe.call(this);
    };
    SubscribeClientContext.prototype.close = function () {
        return;
    };
    SubscribeClientContext.prototype.sendSubscribeRequest = function (options) {
        if (options === void 0) { options = {}; }
        if (!this.subscription) {
            throw new Error("Subscription undefined.");
        }
        this.subscription.subscribe(options);
    };
    // Override SubscribeClientContextBase member we want to make sure we are not using.
    SubscribeClientContext.prototype.createConfirmedDialog = function (message, type) {
        return true;
    };
    return SubscribeClientContext;
}(Subscription_1.Subscription));
exports.SubscribeClientContext = SubscribeClientContext;
