"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var events_1 = require("events");
var core_1 = require("../core");
var utils_1 = require("../core/messages/utils");
var emitter_1 = require("./emitter");
var publisher_state_1 = require("./publisher-state");
/**
 * A publisher publishes a publication (outgoing PUBLISH).
 * @public
 */
var Publisher = /** @class */ (function (_super) {
    tslib_1.__extends(Publisher, _super);
    /**
     * Constructs a new instance of the `Publisher` class.
     *
     * @param userAgent - User agent. See {@link UserAgent} for details.
     * @param targetURI - Request URI identifying the target of the message.
     * @param eventType - The event type identifying the published document.
     * @param options - Options bucket. See {@link PublisherOptions} for details.
     */
    function Publisher(userAgent, targetURI, eventType, options) {
        if (options === void 0) { options = {}; }
        var _this = _super.call(this) || this;
        _this.disposed = false;
        /** The publication state. */
        _this._state = publisher_state_1.PublisherState.Initial;
        /** Emits when the registration state changes. */
        _this._stateEventEmitter = new events_1.EventEmitter();
        _this.userAgent = userAgent;
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
        _this.logger = userAgent.getLogger("sip.Publisher");
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
        _this.request = userAgent.userAgentCore.makeOutgoingRequestMessage(core_1.C.PUBLISH, targetURI, fromURI, toURI, params, extraHeaders, body);
        // Identifier
        _this.id = _this.target.toString() + ":" + _this.event;
        // Add to the user agent's publisher collection.
        _this.userAgent._publishers[_this.id] = _this;
        return _this;
    }
    /**
     * Destructor.
     */
    Publisher.prototype.dispose = function () {
        if (this.disposed) {
            return Promise.resolve();
        }
        this.disposed = true;
        this.logger.log("Publisher " + this.id + " in state " + this.state + " is being disposed");
        // Remove from the user agent's publisher collection
        delete this.userAgent._publishers[this.id];
        // Send unpublish, if requested
        if (this.options.unpublishOnClose && this.state === publisher_state_1.PublisherState.Published) {
            return this.unpublish();
        }
        if (this.publishRefreshTimer) {
            clearTimeout(this.publishRefreshTimer);
            this.publishRefreshTimer = undefined;
        }
        this.pubRequestBody = undefined;
        this.pubRequestExpires = 0;
        this.pubRequestEtag = undefined;
        return Promise.resolve();
    };
    Object.defineProperty(Publisher.prototype, "state", {
        /** The publication state. */
        get: function () {
            return this._state;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Publisher.prototype, "stateChange", {
        /** Emits when the publisher state changes. */
        get: function () {
            return emitter_1._makeEmitter(this._stateEventEmitter);
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Publish.
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
        this.sendPublishRequest();
        return Promise.resolve();
    };
    /**
     * Unpublish.
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
        return Promise.resolve();
    };
    /** @internal */
    Publisher.prototype.receiveResponse = function (response) {
        var _this = this;
        var statusCode = response.statusCode || 0;
        var cause = utils_1.getReasonPhrase(statusCode);
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
                    this.stateTransition(publisher_state_1.PublisherState.Published);
                }
                else {
                    this.stateTransition(publisher_state_1.PublisherState.Unpublished);
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
                    this.stateTransition(publisher_state_1.PublisherState.Unpublished);
                    this.stateTransition(publisher_state_1.PublisherState.Terminated);
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
                        this.stateTransition(publisher_state_1.PublisherState.Unpublished);
                        this.stateTransition(publisher_state_1.PublisherState.Terminated);
                    }
                }
                else {
                    this.logger.warn("423 response to PUBLISH, recovery failed");
                    this.pubRequestExpires = 0;
                    this.stateTransition(publisher_state_1.PublisherState.Unpublished);
                    this.stateTransition(publisher_state_1.PublisherState.Terminated);
                }
                break;
            default:
                this.pubRequestExpires = 0;
                this.stateTransition(publisher_state_1.PublisherState.Unpublished);
                this.stateTransition(publisher_state_1.PublisherState.Terminated);
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
        return this.userAgent.userAgentCore.publish(this.request, {
            onAccept: function (response) { return _this.receiveResponse(response.message); },
            onProgress: function (response) { return _this.receiveResponse(response.message); },
            onRedirect: function (response) { return _this.receiveResponse(response.message); },
            onReject: function (response) { return _this.receiveResponse(response.message); },
            onTrying: function (response) { return _this.receiveResponse(response.message); }
        });
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
            throw new Error("Etag undefined");
        }
        if (this.pubRequestExpires === 0) {
            throw new Error("Expires zero");
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
            body = core_1.fromBodyLegacy(bodyAndContentType);
        }
        this.request = this.userAgent.userAgentCore.makeOutgoingRequestMessage(core_1.C.PUBLISH, ruri, params.fromUri ? params.fromUri : this.userAgent.userAgentCore.configuration.aor, params.toUri ? params.toUri : this.target, params, reqOptions.extraHeaders, body);
        return this.send();
    };
    /**
     * Transition publication state.
     */
    Publisher.prototype.stateTransition = function (newState) {
        var _this = this;
        var invalidTransition = function () {
            throw new Error("Invalid state transition from " + _this._state + " to " + newState);
        };
        // Validate transition
        switch (this._state) {
            case publisher_state_1.PublisherState.Initial:
                if (newState !== publisher_state_1.PublisherState.Published &&
                    newState !== publisher_state_1.PublisherState.Unpublished &&
                    newState !== publisher_state_1.PublisherState.Terminated) {
                    invalidTransition();
                }
                break;
            case publisher_state_1.PublisherState.Published:
                if (newState !== publisher_state_1.PublisherState.Unpublished &&
                    newState !== publisher_state_1.PublisherState.Terminated) {
                    invalidTransition();
                }
                break;
            case publisher_state_1.PublisherState.Unpublished:
                if (newState !== publisher_state_1.PublisherState.Published &&
                    newState !== publisher_state_1.PublisherState.Terminated) {
                    invalidTransition();
                }
                break;
            case publisher_state_1.PublisherState.Terminated:
                invalidTransition();
                break;
            default:
                throw new Error("Unrecognized state.");
        }
        // Transition
        this._state = newState;
        this.logger.log("Publication transitioned to state " + this._state);
        this._stateEventEmitter.emit("event", this._state);
        // Dispose
        if (newState === publisher_state_1.PublisherState.Terminated) {
            this.dispose();
        }
    };
    return Publisher;
}(events_1.EventEmitter));
exports.Publisher = Publisher;
