export declare enum DialogStatus {
    STATUS_EARLY = 1,
    STATUS_CONFIRMED = 2
}
export declare enum SessionStatus {
    STATUS_NULL = 0,
    STATUS_INVITE_SENT = 1,
    STATUS_1XX_RECEIVED = 2,
    STATUS_INVITE_RECEIVED = 3,
    STATUS_WAITING_FOR_ANSWER = 4,
    STATUS_ANSWERED = 5,
    STATUS_WAITING_FOR_PRACK = 6,
    STATUS_WAITING_FOR_ACK = 7,
    STATUS_CANCELED = 8,
    STATUS_TERMINATED = 9,
    STATUS_ANSWERED_WAITING_FOR_PRACK = 10,
    STATUS_EARLY_MEDIA = 11,
    STATUS_CONFIRMED = 12
}
export declare enum TypeStrings {
    ClientContext = 0,
    ConfigurationError = 1,
    Dialog = 2,
    DigestAuthentication = 3,
    DTMF = 4,
    IncomingMessage = 5,
    IncomingRequest = 6,
    IncomingResponse = 7,
    InvalidStateError = 8,
    InviteClientContext = 9,
    InviteServerContext = 10,
    Logger = 11,
    LoggerFactory = 12,
    MethodParameterError = 13,
    NameAddrHeader = 14,
    NotSupportedError = 15,
    OutgoingRequest = 16,
    Parameters = 17,
    PublishContext = 18,
    ReferClientContext = 19,
    ReferServerContext = 20,
    RegisterContext = 21,
    RenegotiationError = 22,
    RequestSender = 23,
    ServerContext = 24,
    Session = 25,
    SessionDescriptionHandler = 26,
    SessionDescriptionHandlerError = 27,
    SessionDescriptionHandlerObserver = 28,
    Subscription = 29,
    Transport = 30,
    UA = 31,
    URI = 32
}
export declare enum UAStatus {
    STATUS_INIT = 0,
    STATUS_STARTING = 1,
    STATUS_READY = 2,
    STATUS_USER_CLOSED = 3,
    STATUS_NOT_READY = 4
}
//# sourceMappingURL=Enums.d.ts.map