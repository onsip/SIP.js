"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var ClientContext_1 = require("./ClientContext");
var Constants_1 = require("./Constants");
var core_1 = require("./core");
var Enums_1 = require("./Enums");
var Exceptions_1 = require("./Exceptions");
var Utils_1 = require("./Utils");
/**
 * SIP Publish (SIP Extension for Event State Publication RFC3903)
 * @class Class creating a SIP PublishContext.
 */
var PublishContext = /** @class */ (function (_super) {
    tslib_1.__extends(PublishContext, _super);
    function PublishContext(ua, target, event, options) {
        if (options === void 0) { options = {}; }
        var _this = this;
        options.extraHeaders = (options.extraHeaders || []).slice();
        options.contentType = (options.contentType || "text/plain");
        if (typeof options.expires !== "number" || (options.expires % 1) !== 0) {
            options.expires = 3600;
        }
        else {
            options.expires = Number(options.expires);
        }
        if (typeof (options.unpublishOnClose) !== "boolean") {
            options.unpublishOnClose = true;
        }
        if (target === undefined || target === null || target === "") {
            throw new Exceptions_1.Exceptions.MethodParameterError("Publish", "Target", target);
        }
        else {
            target = ua.normalizeTarget(target);
            if (target === undefined) {
                throw new Exceptions_1.Exceptions.MethodParameterError("Publish", "Target", target);
            }
        }
        _this = _super.call(this, ua, Constants_1.C.PUBLISH, target, options) || this;
        _this.type = Enums_1.TypeStrings.PublishContext;
        _this.options = options;
        _this.target = target;
        if (event === undefined || event === null || event === "") {
            throw new Exceptions_1.Exceptions.MethodParameterError("Publish", "Event", event);
        }
        else {
            _this.event = event;
        }
        _this.logger = ua.getLogger("sip.publish");
        _this.pubRequestExpires = _this.options.expires;
        return _this;
    }
    /**
     * Publish
     * @param {string} Event body to publish, optional
     */
    PublishContext.prototype.publish = function (body) {
        // Clean up before the run
        if (this.publishRefreshTimer) {
            clearTimeout(this.publishRefreshTimer);
            this.publishRefreshTimer = undefined;
        }
        // is Inital or Modify request
        this.options.body = body;
        this.pubRequestBody = this.options.body;
        if (this.pubRequestExpires === 0) {
            // This is Initial request after unpublish
            this.pubRequestExpires = this.options.expires;
            this.pubRequestEtag = undefined;
        }
        if (!(this.ua.publishers[this.target.toString() + ":" + this.event])) {
            this.ua.publishers[this.target.toString() + ":" + this.event] = this;
        }
        this.sendPublishRequest();
    };
    /**
     * Unpublish
     */
    PublishContext.prototype.unpublish = function () {
        // Clean up before the run
        if (this.publishRefreshTimer) {
            clearTimeout(this.publishRefreshTimer);
            this.publishRefreshTimer = undefined;
        }
        this.pubRequestBody = undefined;
        this.pubRequestExpires = 0;
        if (this.pubRequestEtag !== undefined) {
            this.sendPublishRequest();
        }
    };
    /**
     * Close
     */
    PublishContext.prototype.close = function () {
        // Send unpublish, if requested
        if (this.options.unpublishOnClose) {
            this.unpublish();
        }
        else {
            if (this.publishRefreshTimer) {
                clearTimeout(this.publishRefreshTimer);
                this.publishRefreshTimer = undefined;
            }
            this.pubRequestBody = undefined;
            this.pubRequestExpires = 0;
            this.pubRequestEtag = undefined;
        }
        if (this.ua.publishers[this.target.toString() + ":" + this.event]) {
            delete this.ua.publishers[this.target.toString() + ":" + this.event];
        }
    };
    PublishContext.prototype.onRequestTimeout = function () {
        _super.prototype.onRequestTimeout.call(this);
        this.emit("unpublished", undefined, Constants_1.C.causes.REQUEST_TIMEOUT);
    };
    PublishContext.prototype.onTransportError = function () {
        _super.prototype.onTransportError.call(this);
        this.emit("unpublished", undefined, Constants_1.C.causes.CONNECTION_ERROR);
    };
    PublishContext.prototype.receiveResponse = function (response) {
        var _this = this;
        var statusCode = response.statusCode || 0;
        var cause = Utils_1.Utils.getReasonPhrase(statusCode);
        switch (true) {
            case /^1[0-9]{2}$/.test(statusCode.toString()):
                this.emit("progress", response, cause);
                break;
            case /^2[0-9]{2}$/.test(statusCode.toString()):
                // Set SIP-Etag
                if (response.hasHeader("SIP-ETag")) {
                    this.pubRequestEtag = response.getHeader("SIP-ETag");
                }
                else {
                    this.logger.warn("SIP-ETag header missing in a 200-class response to PUBLISH");
                }
                // Update Expire
                if (response.hasHeader("Expires")) {
                    var expires = Number(response.getHeader("Expires"));
                    if (typeof expires === "number" && expires >= 0 && expires <= this.pubRequestExpires) {
                        this.pubRequestExpires = expires;
                    }
                    else {
                        this.logger.warn("Bad Expires header in a 200-class response to PUBLISH");
                    }
                }
                else {
                    this.logger.warn("Expires header missing in a 200-class response to PUBLISH");
                }
                if (this.pubRequestExpires !== 0) {
                    // Schedule refresh
                    this.publishRefreshTimer = setTimeout(function () { return _this.refreshRequest(); }, this.pubRequestExpires * 900);
                    this.emit("published", response, cause);
                }
                else {
                    this.emit("unpublished", response, cause);
                }
                break;
            case /^412$/.test(statusCode.toString()):
                // 412 code means no matching ETag - possibly the PUBLISH expired
                // Resubmit as new request, if the current request is not a "remove"
                if (this.pubRequestEtag !== undefined && this.pubRequestExpires !== 0) {
                    this.logger.warn("412 response to PUBLISH, recovering");
                    this.pubRequestEtag = undefined;
                    this.emit("progress", response, cause);
                    this.publish(this.options.body);
                }
                else {
                    this.logger.warn("412 response to PUBLISH, recovery failed");
                    this.pubRequestExpires = 0;
                    this.emit("failed", response, cause);
                    this.emit("unpublished", response, cause);
                }
                break;
            case /^423$/.test(statusCode.toString()):
                // 423 code means we need to adjust the Expires interval up
                if (this.pubRequestExpires !== 0 && response.hasHeader("Min-Expires")) {
                    var minExpires = Number(response.getHeader("Min-Expires"));
                    if (typeof minExpires === "number" || minExpires > this.pubRequestExpires) {
                        this.logger.warn("423 code in response to PUBLISH, adjusting the Expires value and trying to recover");
                        this.pubRequestExpires = minExpires;
                        this.emit("progress", response, cause);
                        this.publish(this.options.body);
                    }
                    else {
                        this.logger.warn("Bad 423 response Min-Expires header received for PUBLISH");
                        this.pubRequestExpires = 0;
                        this.emit("failed", response, cause);
                        this.emit("unpublished", response, cause);
                    }
                }
                else {
                    this.logger.warn("423 response to PUBLISH, recovery failed");
                    this.pubRequestExpires = 0;
                    this.emit("failed", response, cause);
                    this.emit("unpublished", response, cause);
                }
                break;
            default:
                this.pubRequestExpires = 0;
                this.emit("failed", response, cause);
                this.emit("unpublished", response, cause);
                break;
        }
        // Do the cleanup
        if (this.pubRequestExpires === 0) {
            if (this.publishRefreshTimer) {
                clearTimeout(this.publishRefreshTimer);
                this.publishRefreshTimer = undefined;
            }
            this.pubRequestBody = undefined;
            this.pubRequestEtag = undefined;
        }
    };
    PublishContext.prototype.send = function () {
        var _this = this;
        this.ua.userAgentCore.publish(this.request, {
            onAccept: function (response) { return _this.receiveResponse(response.message); },
            onProgress: function (response) { return _this.receiveResponse(response.message); },
            onRedirect: function (response) { return _this.receiveResponse(response.message); },
            onReject: function (response) { return _this.receiveResponse(response.message); },
            onTrying: function (response) { return _this.receiveResponse(response.message); }
        });
        return this;
    };
    PublishContext.prototype.refreshRequest = function () {
        // Clean up before the run
        if (this.publishRefreshTimer) {
            clearTimeout(this.publishRefreshTimer);
            this.publishRefreshTimer = undefined;
        }
        // This is Refresh request
        this.pubRequestBody = undefined;
        if (this.pubRequestEtag === undefined) {
            // Request not valid
            throw new Exceptions_1.Exceptions.MethodParameterError("Publish", "Body", undefined);
        }
        if (this.pubRequestExpires === 0) {
            // Request not valid
            throw new Exceptions_1.Exceptions.MethodParameterError("Publish", "Expire", this.pubRequestExpires);
        }
        this.sendPublishRequest();
    };
    PublishContext.prototype.sendPublishRequest = function () {
        var reqOptions = Object.create(this.options || Object.prototype);
        reqOptions.extraHeaders = (this.options.extraHeaders || []).slice();
        reqOptions.extraHeaders.push("Event: " + this.event);
        reqOptions.extraHeaders.push("Expires: " + this.pubRequestExpires);
        if (this.pubRequestEtag !== undefined) {
            reqOptions.extraHeaders.push("SIP-If-Match: " + this.pubRequestEtag);
        }
        var ruri = this.target instanceof core_1.URI ? this.target : this.ua.normalizeTarget(this.target);
        if (!ruri) {
            throw new Error("ruri undefined.");
        }
        var params = this.options.params || {};
        var bodyObj;
        if (this.pubRequestBody !== undefined) {
            bodyObj = {
                body: this.pubRequestBody,
                contentType: this.options.contentType
            };
        }
        var body;
        if (bodyObj) {
            body = Utils_1.Utils.fromBodyObj(bodyObj);
        }
        this.request = this.ua.userAgentCore.makeOutgoingRequestMessage(Constants_1.C.PUBLISH, ruri, params.fromUri ? params.fromUri : this.ua.userAgentCore.configuration.aor, params.toUri ? params.toUri : this.target, params, reqOptions.extraHeaders, body);
        this.send();
    };
    return PublishContext;
}(ClientContext_1.ClientContext));
exports.PublishContext = PublishContext;
