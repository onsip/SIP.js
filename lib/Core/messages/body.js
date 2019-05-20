"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var SIPMessage_1 = require("../../SIPMessage");
/**
 * Create a Body given a BodyObj.
 * @param bodyObj Body Object
 */
function fromBodyObj(bodyObj) {
    var content = bodyObj.body;
    var contentType = bodyObj.contentType;
    var contentDisposition = contentTypeToContentDisposition(contentType);
    var body = { contentDisposition: contentDisposition, contentType: contentType, content: content };
    return body;
}
exports.fromBodyObj = fromBodyObj;
/**
 * Create a Body given a BodyObj.
 * @param bodyObj Body Object
 */
function fromBodyLegacy(bodyLegacy) {
    var content = (typeof bodyLegacy === "string") ? bodyLegacy : bodyLegacy.body;
    var contentType = (typeof bodyLegacy === "string") ? "application/sdp" : bodyLegacy.contentType;
    var contentDisposition = contentTypeToContentDisposition(contentType);
    var body = { contentDisposition: contentDisposition, contentType: contentType, content: content };
    return body;
}
exports.fromBodyLegacy = fromBodyLegacy;
/**
 * Given a message, get a normalized body.
 * The content disposition is inferred if not set.
 * @param message The message.
 */
function getBody(message) {
    var contentDisposition;
    var contentType;
    var content;
    // We're in UAS role, receiving incoming request
    if (message instanceof SIPMessage_1.IncomingRequest) {
        if (message.body) {
            // FIXME: Parsing needs typing
            var parse = message.parseHeader("Content-Disposition");
            contentDisposition = parse ? parse.type : undefined;
            contentType = message.parseHeader("Content-Type");
            content = message.body;
        }
    }
    // We're in UAC role, receiving incoming response
    if (message instanceof SIPMessage_1.IncomingResponse) {
        if (message.body) {
            // FIXME: Parsing needs typing
            var parse = message.parseHeader("Content-Disposition");
            contentDisposition = parse ? parse.type : undefined;
            contentType = message.parseHeader("Content-Type");
            content = message.body;
        }
    }
    // We're in UAC role, sending outgoing request
    if (message instanceof SIPMessage_1.OutgoingRequest) {
        if (message.body) {
            contentDisposition = message.getHeader("Content-Disposition");
            contentType = message.getHeader("Content-Type");
            if (typeof message.body === "string") {
                // FIXME: OutgoingRequest should not allow a "string" body without a "Content-Type" header.
                if (!contentType) {
                    throw new Error("Header content type header does not equal body content type.");
                }
                content = message.body;
            }
            else {
                // FIXME: OutgoingRequest should not allow the "Content-Type" header not to match th body content type
                if (contentType && contentType !== message.body.contentType) {
                    throw new Error("Header content type header does not equal body content type.");
                }
                contentType = message.body.contentType;
                content = message.body.body;
            }
        }
    }
    // We're in UAS role, sending outgoing response
    if (isBody(message)) {
        contentDisposition = message.contentDisposition;
        contentType = message.contentType;
        content = message.content;
    }
    // No content, no body.
    if (!content) {
        return undefined;
    }
    if (contentType && !contentDisposition) {
        contentDisposition = contentTypeToContentDisposition(contentType);
    }
    if (!contentDisposition) {
        throw new Error("Content disposition undefined.");
    }
    if (!contentType) {
        throw new Error("Content type undefined.");
    }
    return {
        contentDisposition: contentDisposition,
        contentType: contentType,
        content: content
    };
}
exports.getBody = getBody;
/**
 * User-Defined Type Guard for Body.
 * @param body Body to check.
 */
function isBody(body) {
    return body &&
        typeof body.content === "string" &&
        typeof body.contentType === "string" &&
        body.contentDisposition === undefined ? true : typeof body.contentDisposition === "string";
}
exports.isBody = isBody;
/**
 * Create a BodyObj given a Body.
 * @param bodyObj Body Object
 */
function toBodyObj(body) {
    var bodyObj = {
        body: body.content,
        contentType: body.contentType
    };
    return bodyObj;
}
exports.toBodyObj = toBodyObj;
// If the Content-Disposition header field is missing, bodies of
// Content-Type application/sdp imply the disposition "session", while
// other content types imply "render".
// https://tools.ietf.org/html/rfc3261#section-13.2.1
function contentTypeToContentDisposition(contentType) {
    if (contentType === "application/sdp") {
        return "session";
    }
    else {
        return "render";
    }
}
