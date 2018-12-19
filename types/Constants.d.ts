export namespace C {
  enum causes {
    // Generic error causes
    CONNECTION_ERROR = "Connection Error",
    REQUEST_TIMEOUT = "Request Timeout",
    SIP_FAILURE_CODE = "SIP Failure Code",
    INTERNAL_ERROR = "Internal Error",

    // SIP error causes
    BUSY = "Busy",
    REJECTED = "Rejected",
    REDIRECTED = "Redirected",
    UNAVAILABLE = "Unavailable",
    NOT_FOUND = "Not Found",
    ADDRESS_INCOMPLETE = "Address Incomplete",
    INCOMPATIBLE_SDP = "Incompatible SDP",
    AUTHENTICATION_ERROR = "Authentication Error",
    DIALOG_ERROR = "Dialog Error",

    // Session error causes
    WEBRTC_NOT_SUPPORTED = "WebRTC Not Supported",
    WEBRTC_ERROR = "WebRTC Error",
    CANCELED = "Canceled",
    NO_ANSWER = "No Answer",
    EXPIRES = "Expires",
    NO_ACK = "No ACK",
    NO_PRACK = "No PRACK",
    USER_DENIED_MEDIA_ACCESS = "User Denied Media Access",
    BAD_MEDIA_DESCRIPTION = "Bad Media Description",
    RTP_TIMEOUT = "RTP Timeout"
  }

  enum supported {
    UNSUPPORTED = "none",
    SUPPORTED = "supported",
    REQUIRED = "required"
  }

  enum DtmfType {
    INFO = "info",
    RTP = "rtp"
  }
}
