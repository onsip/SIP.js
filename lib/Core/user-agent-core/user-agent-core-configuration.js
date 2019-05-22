"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var SIPMessage_1 = require("../../SIPMessage");
var URI_1 = require("../../URI");
/**
 * Factory function to generate configuration give a UA.
 * @param ua UA
 */
function makeUserAgentCoreConfigurationFromUA(ua) {
    // FIXME: Configuration URI is a bad mix of types currently. It also needs to exist.
    if (!(ua.configuration.uri instanceof URI_1.URI)) {
        throw new Error("Configuration URI not instance of URI.");
    }
    var configuration = {
        aor: ua.configuration.uri,
        contact: ua.contact,
        loggerFactory: ua.getLoggerFactory(),
        userAgentHeaderFieldValue: ua.configuration.userAgentString,
        authenticationFactory: function () {
            if (ua.configuration.authenticationFactory) {
                return ua.configuration.authenticationFactory(ua);
            }
            return undefined;
        },
        onRequestTimeoutResponseMessageFactory: function () {
            var message = new SIPMessage_1.IncomingResponse(ua);
            message.statusCode = 408;
            message.reasonPhrase = "Request Timeout";
            return message;
        },
        onTransportErrorResponseMessageFactory: function () {
            var message = new SIPMessage_1.IncomingResponse(ua);
            message.statusCode = 503;
            message.reasonPhrase = "Service Unavailable";
            return message;
        },
        outgoingRequestMessageFactory: function (method, ruri, params, extraHeaders, body) { return new SIPMessage_1.OutgoingRequest(method, ruri, ua, params, extraHeaders, body); },
        transportAccessor: function () { return ua.transport; }
    };
    return configuration;
}
exports.makeUserAgentCoreConfigurationFromUA = makeUserAgentCoreConfigurationFromUA;
