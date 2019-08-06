"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var events_1 = require("events");
var Constants_1 = require("../Constants");
var Exceptions_1 = require("../Exceptions");
var Utils_1 = require("../Utils");
/**
 * A publisher publishes a document (outgoing PUBLISH).
 * @public
 */
var Publisher = /** @class */ (function (_super) {
    tslib_1.__extends(Publisher, _super);
    /**
     * Constructs a new instance of the `Publisher` class.
     * @param userAgent - User agent. See {@link UserAgent} for details.
     * @param targetURI - Request URI identifying the target of the message.
     * @param eventType - The event type identifying the published document.
     * @param options - Options bucket. See {@link PublisherOptions} for details.
     */
    function Publisher(userAgent, targetURI, eventType, options) {
        if (options === void 0) { options = {}; }
        var _this = _super.call(this) || this;
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
        _this.target = targetURI;
        _this.event = eventType;
        _this.options = options;
        _this.pubRequestExpires = _this.options.expires;
        _this.logger = userAgent.getLogger("sip.publisher");
        var params = options.params || {};
        var fromURI = params.fromUri ? params.fromUri : userAgent.userAgentCore.configuration.aor;
        var toURI = params.toUri ? params.toUri : targetURI;
        var body;
        if (options.body && options.contentType) {
            var contentDisposition = "render";
            var contentType = options.contentType;
            var content = options.body;
            body = {
                contentDisposition: contentDisposition,
                contentType: contentType,
                content: content,
            };
        }
        var extraHeaders = (options.extraHeaders || []).slice();
        // Build the request
        _this.request = userAgent.userAgentCore.makeOutgoingRequestMessage(Constants_1.C.PUBLISH, targetURI, fromURI, toURI, params, extraHeaders, body);
        _this.userAgent = userAgent;
        return _this;
    }
    /**
     * Close
     * @internal
     */
    Publisher.prototype.close = function () {
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
        if (this.userAgent.publishers[this.target.toString() + ":" + this.event]) {
            delete this.userAgent.publishers[this.target.toString() + ":" + this.event];
        }
    };
    /**
     * Publish
     * @param content - Body to publish
     */
    Publisher.prototype.publish = function (content, options) {
        if (options === void 0) { options = {}; }
        // Clean up before the run
        if (this.publishRefreshTimer) {
            clearTimeout(this.publishRefreshTimer);
            this.publishRefreshTimer = undefined;
        }
        // is Initial or Modify request
        this.options.body = content;
        this.pubRequestBody = this.options.body;
        if (this.pubRequestExpires === 0) {
            // This is Initial request after unpublish
            this.pubRequestExpires = this.options.expires;
            this.pubRequestEtag = undefined;
        }
        if (!(this.userAgent.publishers[this.target.toString() + ":" + this.event])) {
            this.userAgent.publishers[this.target.toString() + ":" + this.event] = this;
        }
        this.sendPublishRequest();
    };
    /**
     * Unpublish
     */
    Publisher.prototype.unpublish = function (options) {
        if (options === void 0) { options = {}; }
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
    /** @internal */
    Publisher.prototype.receiveResponse = function (response) {
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
    /** @internal */
    Publisher.prototype.send = function () {
        var _this = this;
        this.userAgent.userAgentCore.publish(this.request, {
            onAccept: function (response) { return _this.receiveResponse(response.message); },
            onProgress: function (response) { return _this.receiveResponse(response.message); },
            onRedirect: function (response) { return _this.receiveResponse(response.message); },
            onReject: function (response) { return _this.receiveResponse(response.message); },
            onTrying: function (response) { return _this.receiveResponse(response.message); }
        });
        return this;
    };
    Publisher.prototype.refreshRequest = function () {
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
    Publisher.prototype.sendPublishRequest = function () {
        var reqOptions = Object.create(this.options || Object.prototype);
        reqOptions.extraHeaders = (this.options.extraHeaders || []).slice();
        reqOptions.extraHeaders.push("Event: " + this.event);
        reqOptions.extraHeaders.push("Expires: " + this.pubRequestExpires);
        if (this.pubRequestEtag !== undefined) {
            reqOptions.extraHeaders.push("SIP-If-Match: " + this.pubRequestEtag);
        }
        var ruri = this.target;
        var params = this.options.params || {};
        var bodyAndContentType;
        if (this.pubRequestBody !== undefined) {
            bodyAndContentType = {
                body: this.pubRequestBody,
                contentType: this.options.contentType
            };
        }
        var body;
        if (bodyAndContentType) {
            body = Utils_1.Utils.fromBodyObj(bodyAndContentType);
        }
        this.request = this.userAgent.userAgentCore.makeOutgoingRequestMessage(Constants_1.C.PUBLISH, ruri, params.fromUri ? params.fromUri : this.userAgent.userAgentCore.configuration.aor, params.toUri ? params.toUri : this.target, params, reqOptions.extraHeaders, body);
        this.send();
    };
    return Publisher;
}(events_1.EventEmitter));
exports.Publisher = Publisher;
