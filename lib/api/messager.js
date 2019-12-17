"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var core_1 = require("../core");
/**
 * A messager sends a {@link Message} (outgoing MESSAGE).
 * @public
 */
var Messager = /** @class */ (function () {
    /**
     * Constructs a new instance of the `Messager` class.
     * @param userAgent - User agent. See {@link UserAgent} for details.
     * @param targetURI - Request URI identifying the target of the message.
     * @param content - Content for the body of the message.
     * @param contentType - Content type of the body of the message.
     * @param options - Options bucket. See {@link MessagerOptions} for details.
     */
    function Messager(userAgent, targetURI, content, contentType, options) {
        if (contentType === void 0) { contentType = "text/plain"; }
        if (options === void 0) { options = {}; }
        // Logger
        this.logger = userAgent.getLogger("sip.Messager");
        // Default options params
        options.params = options.params || {};
        // URIs
        var fromURI = userAgent.userAgentCore.configuration.aor;
        if (options.params.fromUri) {
            fromURI =
                (typeof options.params.fromUri === "string") ?
                    core_1.Grammar.URIParse(options.params.fromUri) :
                    options.params.fromUri;
        }
        if (!fromURI) {
            throw new TypeError("Invalid from URI: " + options.params.fromUri);
        }
        var toURI = targetURI;
        if (options.params.toUri) {
            toURI =
                (typeof options.params.toUri === "string") ?
                    core_1.Grammar.URIParse(options.params.toUri) :
                    options.params.toUri;
        }
        if (!toURI) {
            throw new TypeError("Invalid to URI: " + options.params.toUri);
        }
        // Message params
        var params = options.params ? tslib_1.__assign({}, options.params) : {};
        // Extra headers
        var extraHeaders = (options.extraHeaders || []).slice();
        // Body
        var contentDisposition = "render";
        var body = {
            contentDisposition: contentDisposition,
            contentType: contentType,
            content: content
        };
        // Build the request
        this.request = userAgent.userAgentCore.makeOutgoingRequestMessage(core_1.C.MESSAGE, targetURI, fromURI, toURI, params, extraHeaders, body);
        // User agent
        this.userAgent = userAgent;
    }
    /**
     * Send the message.
     */
    Messager.prototype.message = function (options) {
        if (options === void 0) { options = {}; }
        this.userAgent.userAgentCore.request(this.request, options.requestDelegate);
        return Promise.resolve();
    };
    return Messager;
}());
exports.Messager = Messager;
