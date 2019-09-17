import { LIBRARY_VERSION } from "./version";

export namespace C {
  export const version = LIBRARY_VERSION;
  export const USER_AGENT =  "SIP.js/" + LIBRARY_VERSION;

  // SIP scheme
  export const SIP = "sip";
  export const SIPS = "sips";

  // End and Failure causes
  export enum causes {
    // Generic error causes
    CONNECTION_ERROR =         "Connection Error",
    INTERNAL_ERROR =           "Internal Error",
    REQUEST_TIMEOUT =          "Request Timeout",
    SIP_FAILURE_CODE =         "SIP Failure Code",

    // SIP error causes
    ADDRESS_INCOMPLETE =       "Address Incomplete",
    AUTHENTICATION_ERROR =     "Authentication Error",
    BUSY =                     "Busy",
    DIALOG_ERROR =             "Dialog Error",
    INCOMPATIBLE_SDP =         "Incompatible SDP",
    NOT_FOUND =                "Not Found",
    REDIRECTED =               "Redirected",
    REJECTED =                 "Rejected",
    UNAVAILABLE =              "Unavailable",

    // Session error causes

    BAD_MEDIA_DESCRIPTION =    "Bad Media Description",
    CANCELED =                 "Canceled",
    EXPIRES =                  "Expires",
    NO_ACK =                   "No ACK",
    NO_ANSWER =                "No Answer",
    NO_PRACK =                 "No PRACK",
    RTP_TIMEOUT =              "RTP Timeout",
    USER_DENIED_MEDIA_ACCESS = "User Denied Media Access",
    WEBRTC_ERROR =             "WebRTC Error",
    WEBRTC_NOT_SUPPORTED =     "WebRTC Not Supported"
  }

  export enum supported {
    REQUIRED =          "required",
    SUPPORTED =         "supported",
    UNSUPPORTED =       "none"
  }

  export const SIP_ERROR_CAUSES: {[name: string]: Array<number>} = {
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
  export const ACK = "ACK";
  export const BYE = "BYE";
  export const CANCEL = "CANCEL";
  export const INFO = "INFO";
  export const INVITE = "INVITE";
  export const MESSAGE = "MESSAGE";
  export const NOTIFY = "NOTIFY";
  export const OPTIONS = "OPTIONS";
  export const REGISTER = "REGISTER";
  export const UPDATE = "UPDATE";
  export const SUBSCRIBE = "SUBSCRIBE";
  export const PUBLISH = "PUBLISH";
  export const REFER = "REFER";
  export const PRACK = "PRACK";

  /* SIP Response Reasons
   * DOC: http://www.iana.org/assignments/sip-parameters
   * Copied from https://github.com/versatica/OverSIP/blob/master/lib/oversip/sip/constants.rb#L7
   */
  export const REASON_PHRASE: {[code: number]: string} = {
    100: "Trying",
    180: "Ringing",
    181: "Call Is Being Forwarded",
    182: "Queued",
    183: "Session Progress",
    199: "Early Dialog Terminated",  // draft-ietf-sipcore-199
    200: "OK",
    202: "Accepted",  // RFC 3265
    204: "No Notification",  // RFC 5839
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
    412: "Conditional Request Failed",  // RFC 3903
    413: "Request Entity Too Large",
    414: "Request-URI Too Long",
    415: "Unsupported Media Type",
    416: "Unsupported URI Scheme",
    417: "Unknown Resource-Priority",  // RFC 4412
    420: "Bad Extension",
    421: "Extension Required",
    422: "Session Interval Too Small",  // RFC 4028
    423: "Interval Too Brief",
    428: "Use Identity Header",  // RFC 4474
    429: "Provide Referrer Identity",  // RFC 3892
    430: "Flow Failed",  // RFC 5626
    433: "Anonymity Disallowed",  // RFC 5079
    436: "Bad Identity-Info",  // RFC 4474
    437: "Unsupported Certificate",  // RFC 4744
    438: "Invalid Identity Header",  // RFC 4744
    439: "First Hop Lacks Outbound Support",  // RFC 5626
    440: "Max-Breadth Exceeded",  // RFC 5393
    469: "Bad Info Package",  // draft-ietf-sipcore-info-events
    470: "Consent Needed",  // RFC 5360
    478: "Unresolvable Destination",  // Custom code copied from Kamailio.
    480: "Temporarily Unavailable",
    481: "Call/Transaction Does Not Exist",
    482: "Loop Detected",
    483: "Too Many Hops",
    484: "Address Incomplete",
    485: "Ambiguous",
    486: "Busy Here",
    487: "Request Terminated",
    488: "Not Acceptable Here",
    489: "Bad Event",  // RFC 3265
    491: "Request Pending",
    493: "Undecipherable",
    494: "Security Agreement Required",  // RFC 3329
    500: "Internal Server Error",
    501: "Not Implemented",
    502: "Bad Gateway",
    503: "Service Unavailable",
    504: "Server Time-out",
    505: "Version Not Supported",
    513: "Message Too Large",
    580: "Precondition Failure",  // RFC 3312
    600: "Busy Everywhere",
    603: "Decline",
    604: "Does Not Exist Anywhere",
    606: "Not Acceptable"
  };

  /* SIP Option Tags
   * DOC: http://www.iana.org/assignments/sip-parameters/sip-parameters.xhtml#sip-parameters-4
   */
  export const OPTION_TAGS: {[option: string]: boolean} = {
    "100rel":                   true,  // RFC 3262
    "199":                      true,  // RFC 6228
    "answermode":               true,  // RFC 5373
    "early-session":            true,  // RFC 3959
    "eventlist":                true,  // RFC 4662
    "explicitsub":              true,  // RFC-ietf-sipcore-refer-explicit-subscription-03
    "from-change":              true,  // RFC 4916
    "geolocation-http":         true,  // RFC 6442
    "geolocation-sip":          true,  // RFC 6442
    "gin":                      true,  // RFC 6140
    "gruu":                     true,  // RFC 5627
    "histinfo":                 true,  // RFC 7044
    "ice":                      true,  // RFC 5768
    "join":                     true,  // RFC 3911
    "multiple-refer":           true,  // RFC 5368
    "norefersub":               true,  // RFC 4488
    "nosub":                    true,  // RFC-ietf-sipcore-refer-explicit-subscription-03
    "outbound":                 true,  // RFC 5626
    "path":                     true,  // RFC 3327
    "policy":                   true,  // RFC 6794
    "precondition":             true,  // RFC 3312
    "pref":                     true,  // RFC 3840
    "privacy":                  true,  // RFC 3323
    "recipient-list-invite":    true,  // RFC 5366
    "recipient-list-message":   true,  // RFC 5365
    "recipient-list-subscribe": true,  // RFC 5367
    "replaces":                 true,  // RFC 3891
    "resource-priority":        true,  // RFC 4412
    "sdp-anat":                 true,  // RFC 4092
    "sec-agree":                true,  // RFC 3329
    "tdialog":                  true,  // RFC 4538
    "timer":                    true,  // RFC 4028
    "uui":                      true   // RFC 7433
  };

  export enum dtmfType {
    INFO = "info",
    RTP = "rtp"
  }
}
