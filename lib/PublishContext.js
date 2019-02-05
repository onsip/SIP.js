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
var ClientContext_1 = require("./ClientContext");
var Constants_1 = require("./Constants");
var Enums_1 = require("./Enums");
var Exceptions_1 = require("./Exceptions");
var SIPMessage_1 = require("./SIPMessage");
var Utils_1 = require("./Utils");
/**
 * SIP Publish (SIP Extension for Event State Publication RFC3903)
 * @class Class creating a SIP PublishContext.
 */
var PublishContext = /** @class */ (function (_super) {
    __extends(PublishContext, _super);
    function PublishContext(ua, target, event, options) {
        if (options === void 0) { options = {}; }
        var _this = this;
        options = options;
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
        else {
            options.unpublishOnClose = options.unpublishOnClose;
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
        ua.on("transportCreated", function (transport) {
            transport.on("transportError", _this.onTransportError.bind(_this));
        });
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
        if (body !== undefined && body !== null && body !== "") {
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
        }
        else {
            // This is Refresh request
            this.pubRequestBody = undefined;
            if (this.pubRequestEtag === undefined) {
                // Request not valid
                throw new Exceptions_1.Exceptions.MethodParameterError("Publish", "Body", body);
            }
            if (this.pubRequestExpires === 0) {
                // Request not valid
                throw new Exceptions_1.Exceptions.MethodParameterError("Publish", "Expire", this.pubRequestExpires);
            }
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
                    this.publishRefreshTimer = setTimeout(this.publish.bind(this), this.pubRequestExpires * 900);
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
    PublishContext.prototype.sendPublishRequest = function () {
        var reqOptions = Object.create(this.options || Object.prototype);
        reqOptions.extraHeaders = (this.options.extraHeaders || []).slice();
        reqOptions.extraHeaders.push("Event: " + this.event);
        reqOptions.extraHeaders.push("Expires: " + this.pubRequestExpires);
        if (this.pubRequestEtag !== undefined) {
            reqOptions.extraHeaders.push("SIP-If-Match: " + this.pubRequestEtag);
        }
        this.request = new SIPMessage_1.OutgoingRequest(Constants_1.C.PUBLISH, this.target, this.ua, this.options.params, reqOptions.extraHeaders);
        if (this.pubRequestBody !== undefined) {
            this.request.body = {};
            this.request.body.body = this.pubRequestBody;
            this.request.body.contentType = this.options.contentType;
        }
        this.send();
    };
    return PublishContext;
}(ClientContext_1.ClientContext));
exports.PublishContext = PublishContext;
