export declare namespace C {
    const version = "0.15.10";
    const USER_AGENT: string;
    const SIP = "sip";
    const SIPS = "sips";
    enum causes {
        CONNECTION_ERROR = "Connection Error",
        INTERNAL_ERROR = "Internal Error",
        REQUEST_TIMEOUT = "Request Timeout",
        SIP_FAILURE_CODE = "SIP Failure Code",
        ADDRESS_INCOMPLETE = "Address Incomplete",
        AUTHENTICATION_ERROR = "Authentication Error",
        BUSY = "Busy",
        DIALOG_ERROR = "Dialog Error",
        INCOMPATIBLE_SDP = "Incompatible SDP",
        NOT_FOUND = "Not Found",
        REDIRECTED = "Redirected",
        REJECTED = "Rejected",
        UNAVAILABLE = "Unavailable",
        BAD_MEDIA_DESCRIPTION = "Bad Media Description",
        CANCELED = "Canceled",
        EXPIRES = "Expires",
        NO_ACK = "No ACK",
        NO_ANSWER = "No Answer",
        NO_PRACK = "No PRACK",
        RTP_TIMEOUT = "RTP Timeout",
        USER_DENIED_MEDIA_ACCESS = "User Denied Media Access",
        WEBRTC_ERROR = "WebRTC Error",
        WEBRTC_NOT_SUPPORTED = "WebRTC Not Supported"
    }
    enum supported {
        REQUIRED = "required",
        SUPPORTED = "supported",
        UNSUPPORTED = "none"
    }
    const SIP_ERROR_CAUSES: {
        [name: string]: Array<number>;
    };
    const ACK = "ACK";
    const BYE = "BYE";
    const CANCEL = "CANCEL";
    const INFO = "INFO";
    const INVITE = "INVITE";
    const MESSAGE = "MESSAGE";
    const NOTIFY = "NOTIFY";
    const OPTIONS = "OPTIONS";
    const REGISTER = "REGISTER";
    const UPDATE = "UPDATE";
    const SUBSCRIBE = "SUBSCRIBE";
    const PUBLISH = "PUBLISH";
    const REFER = "REFER";
    const PRACK = "PRACK";
    const REASON_PHRASE: {
        [code: number]: string;
    };
    const OPTION_TAGS: {
        [option: string]: boolean;
    };
    enum dtmfType {
        INFO = "info",
        RTP = "rtp"
    }
}
//# sourceMappingURL=Constants.d.ts.map