"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var version_1 = require("./version");
var C;
(function (C) {
    C.version = version_1.LIBRARY_VERSION;
    C.USER_AGENT = "SIP.js/" + version_1.LIBRARY_VERSION;
    // SIP scheme
    C.SIP = "sip";
    C.SIPS = "sips";
    // End and Failure causes
    var causes;
    (function (causes) {
        // Generic error causes
        causes["CONNECTION_ERROR"] = "Connection Error";
        causes["INTERNAL_ERROR"] = "Internal Error";
        causes["REQUEST_TIMEOUT"] = "Request Timeout";
        causes["SIP_FAILURE_CODE"] = "SIP Failure Code";
        // SIP error causes
        causes["ADDRESS_INCOMPLETE"] = "Address Incomplete";
        causes["AUTHENTICATION_ERROR"] = "Authentication Error";
        causes["BUSY"] = "Busy";
        causes["DIALOG_ERROR"] = "Dialog Error";
        causes["INCOMPATIBLE_SDP"] = "Incompatible SDP";
        causes["NOT_FOUND"] = "Not Found";
        causes["REDIRECTED"] = "Redirected";
        causes["REJECTED"] = "Rejected";
        causes["UNAVAILABLE"] = "Unavailable";
        // Session error causes
        causes["BAD_MEDIA_DESCRIPTION"] = "Bad Media Description";
        causes["CANCELED"] = "Canceled";
        causes["EXPIRES"] = "Expires";
        causes["NO_ACK"] = "No ACK";
        causes["NO_ANSWER"] = "No Answer";
        causes["NO_PRACK"] = "No PRACK";
        causes["RTP_TIMEOUT"] = "RTP Timeout";
        causes["USER_DENIED_MEDIA_ACCESS"] = "User Denied Media Access";
        causes["WEBRTC_ERROR"] = "WebRTC Error";
        causes["WEBRTC_NOT_SUPPORTED"] = "WebRTC Not Supported";
    })(causes = C.causes || (C.causes = {}));
    var supported;
    (function (supported) {
        supported["REQUIRED"] = "required";
        supported["SUPPORTED"] = "supported";
        supported["UNSUPPORTED"] = "none";
    })(supported = C.supported || (C.supported = {}));
    C.SIP_ERROR_CAUSES = {
        ADDRESS_INCOMPLETE: [484],
        AUTHENTICATION_ERROR: [401, 407],
        BUSY: [486, 600],
        INCOMPATIBLE_SDP: [488, 606],
        NOT_FOUND: [404, 604],
        REDIRECTED: [300, 301, 302, 305, 380],
        REJECTED: [403, 603],
        UNAVAILABLE: [480, 410, 408, 430]
    };
    // SIP Methods
    C.ACK = "ACK";
    C.BYE = "BYE";
    C.CANCEL = "CANCEL";
    C.INFO = "INFO";
    C.INVITE = "INVITE";
    C.MESSAGE = "MESSAGE";
    C.NOTIFY = "NOTIFY";
    C.OPTIONS = "OPTIONS";
    C.REGISTER = "REGISTER";
    C.UPDATE = "UPDATE";
    C.SUBSCRIBE = "SUBSCRIBE";
    C.PUBLISH = "PUBLISH";
    C.REFER = "REFER";
    C.PRACK = "PRACK";
    /* SIP Response Reasons
     * DOC: http://www.iana.org/assignments/sip-parameters
     * Copied from https://github.com/versatica/OverSIP/blob/master/lib/oversip/sip/constants.rb#L7
     */
    C.REASON_PHRASE = {
        100: "Trying",
        180: "Ringing",
        181: "Call Is Being Forwarded",
        182: "Queued",
        183: "Session Progress",
        199: "Early Dialog Terminated",
        200: "OK",
        202: "Accepted",
        204: "No Notification",
        300: "Multiple Choices",
        301: "Moved Permanently",
        302: "Moved Temporarily",
        305: "Use Proxy",
        380: "Alternative Service",
        400: "Bad Request",
        401: "Unauthorized",
        402: "Payment Required",
        403: "Forbidden",
        404: "Not Found",
        405: "Method Not Allowed",
        406: "Not Acceptable",
        407: "Proxy Authentication Required",
        408: "Request Timeout",
        410: "Gone",
        412: "Conditional Request Failed",
        413: "Request Entity Too Large",
        414: "Request-URI Too Long",
        415: "Unsupported Media Type",
        416: "Unsupported URI Scheme",
        417: "Unknown Resource-Priority",
        420: "Bad Extension",
        421: "Extension Required",
        422: "Session Interval Too Small",
        423: "Interval Too Brief",
        428: "Use Identity Header",
        429: "Provide Referrer Identity",
        430: "Flow Failed",
        433: "Anonymity Disallowed",
        436: "Bad Identity-Info",
        437: "Unsupported Certificate",
        438: "Invalid Identity Header",
        439: "First Hop Lacks Outbound Support",
        440: "Max-Breadth Exceeded",
        469: "Bad Info Package",
        470: "Consent Needed",
        478: "Unresolvable Destination",
        480: "Temporarily Unavailable",
        481: "Call/Transaction Does Not Exist",
        482: "Loop Detected",
        483: "Too Many Hops",
        484: "Address Incomplete",
        485: "Ambiguous",
        486: "Busy Here",
        487: "Request Terminated",
        488: "Not Acceptable Here",
        489: "Bad Event",
        491: "Request Pending",
        493: "Undecipherable",
        494: "Security Agreement Required",
        500: "Internal Server Error",
        501: "Not Implemented",
        502: "Bad Gateway",
        503: "Service Unavailable",
        504: "Server Time-out",
        505: "Version Not Supported",
        513: "Message Too Large",
        580: "Precondition Failure",
        600: "Busy Everywhere",
        603: "Decline",
        604: "Does Not Exist Anywhere",
        606: "Not Acceptable"
    };
    /* SIP Option Tags
     * DOC: http://www.iana.org/assignments/sip-parameters/sip-parameters.xhtml#sip-parameters-4
     */
    C.OPTION_TAGS = {
        "100rel": true,
        "199": true,
        "answermode": true,
        "early-session": true,
        "eventlist": true,
        "explicitsub": true,
        "from-change": true,
        "geolocation-http": true,
        "geolocation-sip": true,
        "gin": true,
        "gruu": true,
        "histinfo": true,
        "ice": true,
        "join": true,
        "multiple-refer": true,
        "norefersub": true,
        "nosub": true,
        "outbound": true,
        "path": true,
        "policy": true,
        "precondition": true,
        "pref": true,
        "privacy": true,
        "recipient-list-invite": true,
        "recipient-list-message": true,
        "recipient-list-subscribe": true,
        "replaces": true,
        "resource-priority": true,
        "sdp-anat": true,
        "sec-agree": true,
        "tdialog": true,
        "timer": true,
        "uui": true // RFC 7433
    };
    var dtmfType;
    (function (dtmfType) {
        dtmfType["INFO"] = "info";
        dtmfType["RTP"] = "rtp";
    })(dtmfType = C.dtmfType || (C.dtmfType = {}));
})(C = exports.C || (exports.C = {}));
