/**
 * A simple yet powerful API which takes care of SIP signaling and WebRTC media sessions for you.
 * @packageDocumentation
 */

/// <reference types="node" />
import { EventEmitter } from 'events';

/**
 * Incoming INVITE response received when request is accepted.
 * @public
 */
declare interface AckableIncomingResponseWithSession extends IncomingResponse {
    /** Session associated with outgoing request acceptance. */
    readonly session: Session_2;
    /**
     * Send an ACK to acknowledge this response.
     * @param options - Request options bucket.
     */
    ack(options?: RequestOptions): OutgoingAckRequest;
}

/**
 * Message body.
 * @remarks
 * https://tools.ietf.org/html/rfc3261#section-7.4
 * @public
 */
declare interface Body {
    /**
     * If the Content-Disposition header field is missing, bodies of
     * Content-Type application/sdp imply the disposition "session", while
     * other content types imply "render".
     * https://tools.ietf.org/html/rfc3261#section-13.2.1
     * For backward-compatibility, if the Content-Disposition header field
     * is missing, the server SHOULD assume bodies of Content-Type
     * application/sdp are the disposition "session", while other content
     * types are "render".
     * https://tools.ietf.org/html/rfc3261#section-20.11
     */
    contentDisposition: string;
    /**
     * The Content-Type header field indicates the media type of the
     * message-body sent to the recipient.  The Content-Type header field
     * MUST be present if the body is not empty.  If the body is empty,
     * and a Content-Type header field is present, it indicates that the body
     * of the specific type has zero length (for example, an empty audio file).
     * https://tools.ietf.org/html/rfc3261#section-20.15
     */
    contentType: string;
    /**
     * Requests, including new requests defined in extensions to this
     * specification, MAY contain message bodies unless otherwise noted.
     * The interpretation of the body depends on the request method.
     * For response messages, the request method and the response status
     * code determine the type and interpretation of any message body.  All
     * responses MAY include a body.
     * https://tools.ietf.org/html/rfc3261#section-7.4
     */
    content: string;
}

/**
 * Message body content and type.
 * @public
 */
export declare interface BodyAndContentType {
    /** Message body content. */
    body: string;
    /** Message body content type. */
    contentType: string;
}

/**
 * A byer ends a {@link Session} (outgoing BYE).
 * @remarks
 * Sends an outgoing in dialog BYE request.
 * @public
 */
export declare class Byer {
    /** The byer session. */
    private _session;
    /**
     * Constructs a new instance of the `Byer` class.
     * @param session - The session the BYE will be sent from. See {@link Session} for details.
     * @param options - An options bucket. See {@link ByerOptions} for details.
     */
    constructor(session: Session, options?: ByerOptions);
    /** The byer session. */
    readonly session: Session;
    /**
     * Sends the BYE request.
     * @param options - {@link ByerByeOptions} options bucket.
     */
    bye(options?: ByerByeOptions): Promise<OutgoingByeRequest>;
}

/**
 * Options for {@link Byer.bye}.
 * @public
 */
export declare interface ByerByeOptions {
    /** See `core` API. */
    requestDelegate?: OutgoingRequestDelegate;
    /** See `core` API. */
    requestOptions?: RequestOptions;
}

/**
 * Options for {@link Byer} constructor.
 * @public
 */
export declare interface ByerOptions {
}

declare namespace C {
    const version = "0.15.2";
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

/**
 * Client Transaction.
 * @remarks
 * The client transaction provides its functionality through the
 * maintenance of a state machine.
 *
 * The TU communicates with the client transaction through a simple
 * interface.  When the TU wishes to initiate a new transaction, it
 * creates a client transaction and passes it the SIP request to send
 * and an IP address, port, and transport to which to send it.  The
 * client transaction begins execution of its state machine.  Valid
 * responses are passed up to the TU from the client transaction.
 * https://tools.ietf.org/html/rfc3261#section-17.1
 * @public
 */
declare abstract class ClientTransaction extends Transaction {
    private _request;
    protected user: ClientTransactionUser;
    private static makeId;
    protected constructor(_request: OutgoingRequestMessage, transport: Transport, user: ClientTransactionUser, state: TransactionState, loggerCategory: string);
    /** The outgoing request the transaction handling. */
    readonly request: OutgoingRequestMessage;
    /**
     * Receive incoming responses from the transport which match this transaction.
     * Responses will be delivered to the transaction user as necessary.
     * @param response - The incoming response.
     */
    abstract receiveResponse(response: IncomingResponseMessage): void;
    /**
     * A 408 to non-INVITE will always arrive too late to be useful ([3]),
     * The client already has full knowledge of the timeout. The only
     * information this message would convey is whether or not the server
     * believed the transaction timed out. However, with the current design
     * of the NIT, a client cannot do anything with this knowledge. Thus,
     * the 408 is simply wasting network resources and contributes to the
     * response bombardment illustrated in [3].
     * https://tools.ietf.org/html/rfc4320#section-4.1
     */
    protected onRequestTimeout(): void;
}

declare type ClientTransactionConstructor = new (message: OutgoingRequestMessage, transport: Transport, user: ClientTransactionUser) => ClientTransaction;

/**
 * UAC Core Transaction User.
 * @public
 */
declare interface ClientTransactionUser extends TransactionUser {
    /**
     * Callback for request timeout error.
     *
     * When a timeout error is received from the transaction layer, it MUST be
     * treated as if a 408 (Request Timeout) status code has been received.
     * https://tools.ietf.org/html/rfc3261#section-8.1.3.1
     * TU MUST be informed of a timeout.
     * https://tools.ietf.org/html/rfc3261#section-17.1.2.2
     */
    onRequestTimeout?: () => void;
    /**
     * Callback for delegation of valid response handling.
     *
     * Valid responses are passed up to the TU from the client transaction.
     * https://tools.ietf.org/html/rfc3261#section-17.1
     */
    receiveResponse?: (response: IncomingResponseMessage) => void;
}

/**
 * Contact.
 * @remarks
 * https://tools.ietf.org/html/rfc3261#section-8.1.1.8
 * This is ported from UA.contact.
 * FIXME: TODO: This is not a great rep for Contact
 * and is used in a kinda hacky way herein.
 * @public
 */
declare interface Contact {
    pubGruu: URI | undefined;
    tempGruu: URI | undefined;
    uri: URI;
    toString: (options?: any) => string;
}

/**
 * Dialog.
 * @remarks
 * A key concept for a user agent is that of a dialog.  A dialog
 * represents a peer-to-peer SIP relationship between two user agents
 * that persists for some time.  The dialog facilitates sequencing of
 * messages between the user agents and proper routing of requests
 * between both of them.  The dialog represents a context in which to
 * interpret SIP messages.
 * https://tools.ietf.org/html/rfc3261#section-12
 * @public
 */
declare class Dialog {
    protected core: UserAgentCore;
    protected dialogState: DialogState;
    /**
     * When a UAC receives a response that establishes a dialog, it
     * constructs the state of the dialog.  This state MUST be maintained
     * for the duration of the dialog.
     * https://tools.ietf.org/html/rfc3261#section-12.1.2
     * @param outgoingRequestMessage - Outgoing request message for dialog.
     * @param incomingResponseMessage - Incoming response message creating dialog.
     */
    static initialDialogStateForUserAgentClient(outgoingRequestMessage: OutgoingRequestMessage, incomingResponseMessage: IncomingResponseMessage): DialogState;
    /**
     * The UAS then constructs the state of the dialog.  This state MUST be
     * maintained for the duration of the dialog.
     * https://tools.ietf.org/html/rfc3261#section-12.1.1
     * @param incomingRequestMessage - Incoming request message creating dialog.
     * @param toTag - Tag in the To field in the response to the incoming request.
     */
    static initialDialogStateForUserAgentServer(incomingRequestMessage: IncomingRequestMessage, toTag: string, early?: boolean): DialogState;
    /**
     * Dialog constructor.
     * @param core - User agent core.
     * @param dialogState - Initial dialog state.
     */
    protected constructor(core: UserAgentCore, dialogState: DialogState);
    /** Destructor. */
    dispose(): void;
    /**
     * A dialog is identified at each UA with a dialog ID, which consists of
     * a Call-ID value, a local tag and a remote tag.  The dialog ID at each
     * UA involved in the dialog is not the same.  Specifically, the local
     * tag at one UA is identical to the remote tag at the peer UA.  The
     * tags are opaque tokens that facilitate the generation of unique
     * dialog IDs.
     * https://tools.ietf.org/html/rfc3261#section-12
     */
    readonly id: string;
    /**
     * A dialog can also be in the "early" state, which occurs when it is
     * created with a provisional response, and then it transition to the
     * "confirmed" state when a 2xx final response received or is sent.
     *
     * Note: RFC 3261 is concise on when a dialog is "confirmed", but it
     * can be a point of confusion if an INVITE dialog is "confirmed" after
     * a 2xx is sent or after receiving the ACK for the 2xx response.
     * With careful reading it can be inferred a dialog is always is
     * "confirmed" when the 2xx is sent (regardless of type of dialog).
     * However a INVITE dialog does have additional considerations
     * when it is confirmed but an ACK has not yet been received (in
     * particular with regard to a callee sending BYE requests).
     */
    readonly early: boolean;
    /** Call identifier component of the dialog id. */
    readonly callId: string;
    /** Local tag component of the dialog id. */
    readonly localTag: string;
    /** Remote tag component of the dialog id. */
    readonly remoteTag: string;
    /** Local sequence number (used to order requests from the UA to its peer). */
    readonly localSequenceNumber: number | undefined;
    /** Remote sequence number (used to order requests from its peer to the UA). */
    readonly remoteSequenceNumber: number | undefined;
    /** Local URI. */
    readonly localURI: URI;
    /** Remote URI. */
    readonly remoteURI: URI;
    /** Remote target. */
    readonly remoteTarget: URI;
    /**
     * Route set, which is an ordered list of URIs. The route set is the
     * list of servers that need to be traversed to send a request to the peer.
     */
    readonly routeSet: Array<string>;
    /**
     * If the request was sent over TLS, and the Request-URI contained
     * a SIPS URI, the "secure" flag is set to true. *NOT IMPLEMENTED*
     */
    readonly secure: boolean;
    /** The user agent core servicing this dialog. */
    readonly userAgentCore: UserAgentCore;
    /** Confirm the dialog. Only matters if dialog is currently early. */
    confirm(): void;
    /**
     * Requests sent within a dialog, as any other requests, are atomic.  If
     * a particular request is accepted by the UAS, all the state changes
     * associated with it are performed.  If the request is rejected, none
     * of the state changes are performed.
     *
     *    Note that some requests, such as INVITEs, affect several pieces of
     *    state.
     *
     * https://tools.ietf.org/html/rfc3261#section-12.2.2
     * @param message - Incoming request message within this dialog.
     */
    receiveRequest(message: IncomingRequestMessage): void;
    /**
     * If the dialog identifier in the 2xx response matches the dialog
     * identifier of an existing dialog, the dialog MUST be transitioned to
     * the "confirmed" state, and the route set for the dialog MUST be
     * recomputed based on the 2xx response using the procedures of Section
     * 12.2.1.2.  Otherwise, a new dialog in the "confirmed" state MUST be
     * constructed using the procedures of Section 12.1.2.
     *
     * Note that the only piece of state that is recomputed is the route
     * set.  Other pieces of state such as the highest sequence numbers
     * (remote and local) sent within the dialog are not recomputed.  The
     * route set only is recomputed for backwards compatibility.  RFC
     * 2543 did not mandate mirroring of the Record-Route header field in
     * a 1xx, only 2xx.  However, we cannot update the entire state of
     * the dialog, since mid-dialog requests may have been sent within
     * the early dialog, modifying the sequence numbers, for example.
     *
     *  https://tools.ietf.org/html/rfc3261#section-13.2.2.4
     */
    recomputeRouteSet(message: IncomingResponseMessage): void;
    /**
     * A request within a dialog is constructed by using many of the
     * components of the state stored as part of the dialog.
     * https://tools.ietf.org/html/rfc3261#section-12.2.1.1
     * @param method - Outgoing request method.
     */
    createOutgoingRequestMessage(method: string, options?: {
        cseq?: number;
        extraHeaders?: Array<string>;
        body?: Body;
    }): OutgoingRequestMessage;
    /**
     * If the remote sequence number was not empty, but the sequence number
     * of the request is lower than the remote sequence number, the request
     * is out of order and MUST be rejected with a 500 (Server Internal
     * Error) response.
     * https://tools.ietf.org/html/rfc3261#section-12.2.2
     * @param request - Incoming request to guard.
     * @returns True if the program execution is to continue in the branch in question.
     *          Otherwise a 500 Server Internal Error was stateless sent and request processing must stop.
     */
    protected sequenceGuard(message: IncomingRequestMessage): boolean;
}

/**
 * Dialog state.
 * @remarks
 * A dialog contains certain pieces of state needed for further message
 * transmissions within the dialog.  This state consists of the dialog
 * ID, a local sequence number (used to order requests from the UA to
 * its peer), a remote sequence number (used to order requests from its
 * peer to the UA), a local URI, a remote URI, remote target, a boolean
 * flag called "secure", and a route set, which is an ordered list of
 * URIs.  The route set is the list of servers that need to be traversed
 * to send a request to the peer.  A dialog can also be in the "early"
 * state, which occurs when it is created with a provisional response,
 * and then transition to the "confirmed" state when a 2xx final
 * response arrives.  For other responses, or if no response arrives at
 * all on that dialog, the early dialog terminates.
 *
 * https://tools.ietf.org/html/rfc3261#section-12
 * @public
 */
declare interface DialogState {
    id: string;
    early: boolean;
    callId: string;
    localTag: string;
    remoteTag: string;
    localSequenceNumber: number | undefined;
    remoteSequenceNumber: number | undefined;
    localURI: URI;
    remoteURI: URI;
    remoteTarget: URI;
    routeSet: Array<string>;
    secure: boolean;
}

/**
 * Digest Authentication.
 * @internal
 */
declare class DigestAuthentication {
    stale: boolean | undefined;
    private logger;
    private username;
    private password;
    private cnonce;
    private nc;
    private ncHex;
    private response;
    private algorithm;
    private realm;
    private nonce;
    private opaque;
    private qop;
    private method;
    private uri;
    /**
     * Constructor.
     * @param loggerFactory - LoggerFactory.
     * @param username - Username.
     * @param password - Password.
     */
    constructor(loggerFactory: LoggerFactory, username: string | undefined, password: string | undefined);
    /**
     * Performs Digest authentication given a SIP request and the challenge
     * received in a response to that request.
     * @param request -
     * @param challenge -
     * @returns true if credentials were successfully generated, false otherwise.
     */
    authenticate(request: OutgoingRequestMessage, challenge: any, body?: string): boolean;
    /**
     * Return the Proxy-Authorization or WWW-Authorization header value.
     */
    toString(): string;
    /**
     * Generate the 'nc' value as required by Digest in this.ncHex by reading this.nc.
     */
    private updateNcHex;
    /**
     * Generate Digest 'response' value.
     */
    private calculateResponse;
}

/**
 * Generic observable.
 * @public
 */
export declare interface Emitter<T> {
    /**
     * Registers a listener.
     * @param listener - Callback function.
     */
    on(listener: (data: T) => void): void;
    /**
     * Unregisters a listener.
     * @param listener - Callback function.
     */
    off(listener: (data: T) => void): void;
    /**
     * Registers a listener then unregisters the listener after one event emission.
     * @param listener - Callback function.
     */
    once(listener: (data: T) => void): void;
}

/**
 * An Exception is considered a condition that a reasonable application may wish to catch.
 * An Error indicates serious problems that a reasonable application should not try to catch.
 * @public
 */
declare abstract class Exception extends Error {
    protected constructor(message?: string);
}

/**
 * Incoming ACK request.
 * @public
 */
declare interface IncomingAckRequest {
    /** The incoming message. */
    readonly message: IncomingRequestMessage;
}

/**
 * Incoming BYE request.
 * @public
 */
declare interface IncomingByeRequest extends IncomingRequest {
}

/**
 * Incoming INFO request.
 * @public
 */
declare interface IncomingInfoRequest extends IncomingRequest {
}

/**
 * Incoming INVITE request.
 * @public
 */
declare interface IncomingInviteRequest extends IncomingRequest {
    /**
     * Send a 2xx positive final response to this request. Defaults to 200.
     * @param options - Response options bucket.
     * @returns Outgoing response and a confirmed Session.
     */
    accept(options?: ResponseOptions): OutgoingResponseWithSession;
    /**
     * Send a 1xx provisional response to this request. Defaults to 180. Excludes 100.
     * @param options - Response options bucket.
     * @returns Outgoing response and an early Session.
     */
    progress(options?: ResponseOptions): OutgoingResponseWithSession;
}

/**
 * Incoming message.
 * @public
 */
declare class IncomingMessage {
    viaBranch: string;
    method: string;
    body: string;
    toTag: string;
    to: NameAddrHeader;
    fromTag: string;
    from: NameAddrHeader;
    callId: string;
    cseq: number;
    via: {
        host: string;
        port: number;
    };
    headers: {
        [name: string]: Array<{
            parsed?: any;
            raw: string;
        }>;
    };
    referTo: string | undefined;
    data: string;
    /**
     * Insert a header of the given name and value into the last position of the
     * header array.
     * @param name - header name
     * @param value - header value
     */
    addHeader(name: string, value: string): void;
    /**
     * Get the value of the given header name at the given position.
     * @param name - header name
     * @returns Returns the specified header, undefined if header doesn't exist.
     */
    getHeader(name: string): string | undefined;
    /**
     * Get the header/s of the given name.
     * @param name - header name
     * @returns Array - with all the headers of the specified name.
     */
    getHeaders(name: string): Array<string>;
    /**
     * Verify the existence of the given header.
     * @param name - header name
     * @returns true if header with given name exists, false otherwise
     */
    hasHeader(name: string): boolean;
    /**
     * Parse the given header on the given index.
     * @param name - header name
     * @param idx - header index
     * @returns Parsed header object, undefined if the
     *   header is not present or in case of a parsing error.
     */
    parseHeader(name: string, idx?: number): any | undefined;
    /**
     * Message Header attribute selector. Alias of parseHeader.
     * @param name - header name
     * @param idx - header index
     * @returns Parsed header object, undefined if the
     *   header is not present or in case of a parsing error.
     *
     * @example
     * message.s('via',3).port
     */
    s(name: string, idx?: number): any | undefined;
    /**
     * Replace the value of the given header by the value.
     * @param name - header name
     * @param value - header value
     */
    setHeader(name: string, value: string): void;
    toString(): string;
}

/**
 * Incoming MESSAGE request.
 * @public
 */
declare interface IncomingMessageRequest extends IncomingRequest {
}

/**
 * Incoming NOTIFY request.
 * @public
 */
declare interface IncomingNotifyRequest extends IncomingRequest {
}

/**
 * Incoming PRACK request.
 * @public
 */
declare interface IncomingPrackRequest extends IncomingRequest {
}

/**
 * Incoming REFER request.
 * @public
 */
declare interface IncomingReferRequest extends IncomingRequest {
}

/**
 * A SIP message sent from a remote client to a local server.
 * @remarks
 * For the purpose of invoking a particular operation.
 * https://tools.ietf.org/html/rfc3261#section-7.1
 * @public
 */
declare interface IncomingRequest {
    /** Delegate providing custom handling of this incoming request. */
    delegate?: IncomingRequestDelegate;
    /** The incoming message. */
    readonly message: IncomingRequestMessage;
    /**
     * Send a 2xx positive final response to this request. Defaults to 200.
     * @param options - Response options bucket.
     */
    accept(options?: ResponseOptions): OutgoingResponse;
    /**
     * Send a 1xx provisional response to this request. Defaults to 180. Excludes 100.
     * Note that per RFC 4320, this method may only be used to respond to INVITE requests.
     * @param options - Response options bucket.
     */
    progress(options?: ResponseOptions): OutgoingResponse;
    /**
     * Send a 3xx negative final response to this request. Defaults to 302.
     * @param contacts - Contacts to redirect the UAC to.
     * @param options - Response options bucket.
     */
    redirect(contacts: Array<URI>, options?: ResponseOptions): OutgoingResponse;
    /**
     * Send a 4xx, 5xx, or 6xx negative final response to this request. Defaults to 480.
     * @param options -  Response options bucket.
     */
    reject(options?: ResponseOptions): OutgoingResponse;
    /**
     * Send a 100 outgoing response to this request.
     * @param options - Response options bucket.
     */
    trying(options?: ResponseOptions): OutgoingResponse;
}

/**
 * Delegate providing custom handling of incoming requests.
 * @public
 */
declare interface IncomingRequestDelegate {
    /**
     * Receive CANCEL request.
     * https://tools.ietf.org/html/rfc3261#section-9.2
     * Note: Currently CANCEL is being handled as a special case.
     * No UAS is created to handle the CANCEL and the response to
     * it CANCEL is being handled statelessly by the user agent core.
     * As such, there is currently no way to externally impact the
     * response to the a CANCEL request and thus the method here is
     * receiving a "message" (as apposed to a "uas").
     * @param message - Incoming CANCEL request message.
     */
    onCancel?(message: IncomingRequestMessage): void;
    /**
     * A transport error occurred attempted to send a response.
     * @param error - Transport error.
     */
    onTransportError?(error: TransportError): void;
}

/**
 * Incoming request message.
 * @public
 */
declare class IncomingRequestMessage extends IncomingMessage {
    ruri: URI | undefined;
    constructor();
}

/**
 * Incoming NOTIFY request with associated {@link Subscription}.
 * @public
 */
declare interface IncomingRequestWithSubscription {
    /** The NOTIFY request which established the subscription. */
    readonly request: IncomingNotifyRequest;
    /** If subscription state is not "terminated", then the subscription. Otherwise undefined. */
    readonly subscription?: Subscription_2;
}

/**
 * A SIP message sent from a remote server to a local client.
 * @remarks
 * For indicating the status of a request sent from the client to the server.
 * https://tools.ietf.org/html/rfc3261#section-7.2
 * @public
 */
declare interface IncomingResponse {
    /** The incoming message. */
    readonly message: IncomingResponseMessage;
}

/**
 * Incoming response message.
 * @public
 */
declare class IncomingResponseMessage extends IncomingMessage {
    statusCode: number | undefined;
    reasonPhrase: string | undefined;
    constructor();
}

/**
 * Incoming SUBSCRIBE request.
 * @public
 */
declare interface IncomingSubscribeRequest extends IncomingRequest {
}

/**
 * An exchange of information (incoming INFO).
 * @public
 */
export declare class Info {
    private incomingInfoRequest;
    /** @internal */
    constructor(incomingInfoRequest: IncomingInfoRequest);
    /** Incoming MESSAGE request message. */
    readonly request: IncomingRequestMessage;
    /** Accept the request. */
    accept(options?: ResponseOptions): Promise<void>;
    /** Reject the request. */
    reject(options?: ResponseOptions): Promise<void>;
}

/**
 * An Infoer sends {@link Info} (outgoing INFO).
 * @remarks
 * Sends an outgoing in dialog INFO request.
 * @public
 */
export declare class Infoer {
    /** The Infoer session. */
    private _session;
    /**
     * Constructs a new instance of the `Infoer` class.
     * @param session - The session the INFO will be sent from. See {@link Session} for details.
     * @param options - An options bucket.
     */
    constructor(session: Session, options?: InfoerOptions);
    /** The Infoer session. */
    readonly session: Session;
    /**
     * Sends the INFO request.
     * @param options - {@link InfoerInfoOptions} options bucket.
     */
    info(options?: InfoerInfoOptions): Promise<OutgoingInfoRequest>;
}

/**
 * Options for {@link Infoer.info}.
 * @public
 */
export declare interface InfoerInfoOptions {
    /** See `core` API. */
    requestDelegate?: OutgoingRequestDelegate;
    /** See `core` API. */
    requestOptions?: RequestOptions;
}

/**
 * Options for {@link Infoer} constructor.
 * @public
 */
export declare interface InfoerOptions {
}

/**
 * An invitation is an offer to establish a {@link Session} (incoming INVITE).
 * @public
 */
export declare class Invitation extends Session {
    private incomingInviteRequest;
    /** @internal */
    body: string | undefined;
    /** @internal */
    localIdentity: NameAddrHeader;
    /** @internal */
    remoteIdentity: NameAddrHeader;
    /** @internal */
    transaction: InviteServerTransaction | NonInviteServerTransaction;
    /**
     * FIXME: TODO:
     * Used to squelch throwing of errors due to async race condition.
     * We have an internal race between calling `accept()` and handling
     * an incoming CANCEL request. As there is no good way currently to
     * delegate the handling of this async errors to the caller of
     * `accept()`, we are squelching the throwing ALL errors when
     * they occur after receiving a CANCEL to catch the ONE we know
     * is a "normal" exceptional condition. While this is a completely
     * reasonable appraoch, the decision should be left up to the library user.
     */
    private _canceled;
    private rseq;
    private waitingForPrackPromise;
    private waitingForPrackResolve;
    private waitingForPrackReject;
    /** @internal */
    constructor(userAgent: UserAgent, incomingInviteRequest: IncomingInviteRequest);
    /**
     * If true, a first provisional response after the 100 Trying
     * will be sent automatically. This is false it the UAC required
     * reliable provisional responses (100rel in Require header),
     * otherwise it is true. The provisional is sent by calling
     * `progress()` without any options.
     *
     * FIXME: TODO: It seems reasonable that the ISC user should
     * be able to optionally disable this behavior. As the provisional
     * is sent prior to the "invite" event being emitted, it's a known
     * issue that the ISC user cannot register listeners or do any other
     * setup prior to the call to `progress()`. As an example why this is
     * an issue, setting `ua.configuration.rel100` to REQUIRED will result
     * in an attempt by `progress()` to send a 183 with SDP produced by
     * calling `getDescription()` on a session description handler, but
     * the ISC user cannot perform any potentially required session description
     * handler initialization (thus preventing the utilization of setting
     * `ua.configuration.rel100` to REQUIRED). That begs the question of
     * why this behavior is disabled when the UAC requires 100rel but not
     * when the UAS requires 100rel? But ignoring that, it's just one example
     * of a class of cases where the ISC user needs to do something prior
     * to the first call to `progress()` and is unable to do so.
     * @internal
     */
    readonly autoSendAnInitialProvisionalResponse: boolean;
    /** Incoming MESSAGE request message. */
    readonly request: IncomingRequestMessage;
    /**
     * Accept the invitation.
     * @remarks
     * Accept the incoming INVITE request to start a Session.
     * Replies to the INVITE request with a 200 Ok response.
     * @param options - Options bucket.
     */
    accept(options?: InvitationAcceptOptions): Promise<void>;
    /**
     * Indicate progress processing the invitation.
     * @remarks
     * Report progress to the the caller.
     * Replies to the INVITE request with a 1xx provisional response.
     * @param options - Options bucket.
     */
    progress(options?: InvitationProgressOptions): Promise<void>;
    /**
     * Reject the invitation.
     * @param options - Options bucket.
     */
    reject(options?: InvitationRejectOptions): Promise<void>;
    /**
     * FIXME: Kill this legacy emission
     * @internal
     */
    byePending(): void;
    /**
     * Handle CANCEL request.
     * @param message - CANCEL message.
     * @internal
     */
    onCancel(message: IncomingRequestMessage): void;
    /**
     * Called when session canceled.
     * @internal
     */
    protected canceled(): void;
    /**
     * Called when session terminated.
     * Using it here just for the PRACK timeout.
     * @internal
     */
    protected terminated(message?: IncomingResponseMessage | IncomingRequestMessage, cause?: string): void;
    /**
     * A version of `accept` which resolves a session when the 200 Ok response is sent.
     * @param options - Options bucket.
     */
    private _accept;
    /**
     * A version of `progress` which resolves when the provisional response is sent.
     * @param options - Options bucket.
     */
    private _progress;
    /**
     * A version of `progress` which resolves when the provisional response with sdp is sent.
     * @param options - Options bucket.
     */
    private _progressWithSDP;
    /**
     * A version of `progress` which resolves when the reliable provisional response is sent.
     * @param options - Options bucket.
     */
    private _progressReliable;
    /**
     * A version of `progress` which resolves when the reliable provisional response is acknowledged.
     * @param options - Options bucket.
     */
    private _progressReliableWaitForPrack;
    private handlePrackOfferAnswer;
    /**
     * Callback for when ACK for a 2xx response is never received.
     * @param session - Session the ACK never arrived for.
     */
    private onAckTimeout;
    /**
     * FIXME: TODO: The current library interface presents async methods without a
     * proper async error handling mechanism. Arguably a promise based interface
     * would be an improvement over the pattern of returning `this`. The approach has
     * been generally along the lines of log a error and terminate.
     */
    private onContextError;
    private prackArrived;
    private prackNeverArrived;
    private waitForArrivalOfPrack;
}

/**
 * Options for {@link Invitation.accept}.
 * @public
 */
export declare interface InvitationAcceptOptions {
    /**
     * Options to pass to SessionDescriptionHandler's getDescription() and setDescription().
     */
    sessionDescriptionHandlerOptions?: SessionDescriptionHandlerOptions;
    /**
     * Modifiers to pass to SessionDescriptionHandler's getDescription() and setDescription().
     */
    sessionDescriptionHandlerModifiers?: Array<SessionDescriptionHandlerModifier>;
    /**
     * @deprecated Use delegate instead.
     * @internal
     */
    onInfo?: ((request: IncomingRequestMessage) => void);
}

/**
 * Options for {@link Invitation.progress}.
 * @public
 */
export declare interface InvitationProgressOptions {
    /**
     * Body
     */
    body?: string | {
        body: string;
        contentType: string;
    };
    /**
     * Array of extra headers added to the response.
     */
    extraHeaders?: Array<string>;
    /**
     * Options to pass to SessionDescriptionHandler's getDescription() and setDescription().
     */
    sessionDescriptionHandlerOptions?: SessionDescriptionHandlerOptions;
    /**
     * Modifiers to pass to SessionDescriptionHandler's getDescription() and setDescription().
     */
    sessionDescriptionHandlerModifiers?: Array<SessionDescriptionHandlerModifier>;
    /**
     * Status code for response.
     */
    statusCode?: number;
    /**
     * Reason phrase for response.
     */
    reasonPhrase?: string;
    /**
     * Send reliable response.
     */
    rel100?: boolean;
}

/**
 * Options for {@link Invitation.reject}.
 * @public
 */
export declare interface InvitationRejectOptions {
    /**
     * Body
     */
    body?: string | {
        body: string;
        contentType: string;
    };
    /**
     * Array of extra headers added to the response.
     */
    extraHeaders?: Array<string>;
    /**
     * Status code for response.
     */
    statusCode?: number;
    /**
     * Reason phrase for response.
     */
    reasonPhrase?: string;
}

/**
 * An inviter offers to establish a {@link Session} (outgoing INVITE).
 * @public
 */
export declare class Inviter extends Session {
    /** @internal */
    body: BodyAndContentType | undefined;
    /** @internal */
    localIdentity: NameAddrHeader;
    /** @internal */
    remoteIdentity: NameAddrHeader;
    /** @internal */
    request: OutgoingRequestMessage;
    /** True if cancel() was called. */
    /** @internal */
    isCanceled: boolean;
    /** If this Inviter was created as a result of a REFER, the reffered Session. Otherwise undefined. */
    /** @internal */
    referred: Session | undefined;
    private earlyMedia;
    private earlyMediaDialog;
    private earlyMediaSessionDescriptionHandlers;
    private inviteWithoutSdp;
    private outgoingInviteRequest;
    /**
     * Constructs a new instance of the `Inviter` class.
     * @param userAgent - User agent. See {@link UserAgent} for details.
     * @param targetURI - Request URI identifying the target of the message.
     * @param options - Options bucket. See {@link InviterOptions} for details.
     */
    constructor(userAgent: UserAgent, targetURI: URI, options?: InviterOptions);
    /**
     * Cancels the INVITE request.
     * @param options - Options bucket.
     */
    cancel(options?: InviterCancelOptions): Promise<void>;
    /**
     * Sends the INVITE request.
     * @remarks
     * TLDR...
     *  1) Only one offer/answer exchange permitted during initial INVITE.
     *  2) No "early media" if the initial offer is in an INVITE (default behavior).
     *  3) If "early media" and the initial offer is in an INVITE, no INVITE forking.
     *
     * 1) Only one offer/answer exchange permitted during initial INVITE.
     *
     * Our implementation replaces the following bullet point...
     *
     * o  After having sent or received an answer to the first offer, the
     *    UAC MAY generate subsequent offers in requests based on rules
     *    specified for that method, but only if it has received answers
     *    to any previous offers, and has not sent any offers to which it
     *    hasn't gotten an answer.
     * https://tools.ietf.org/html/rfc3261#section-13.2.1
     *
     * ...with...
     *
     * o  After having sent or received an answer to the first offer, the
     *    UAC MUST NOT generate subsequent offers in requests based on rules
     *    specified for that method.
     *
     * ...which in combination with this bullet point...
     *
     * o  Once the UAS has sent or received an answer to the initial
     *    offer, it MUST NOT generate subsequent offers in any responses
     *    to the initial INVITE.  This means that a UAS based on this
     *    specification alone can never generate subsequent offers until
     *    completion of the initial transaction.
     * https://tools.ietf.org/html/rfc3261#section-13.2.1
     *
     * ...ensures that EXACTLY ONE offer/answer exchange will occur
     * during an initial out of dialog INVITE request made by our UAC.
     *
     *
     * 2) No "early media" if the initial offer is in an INVITE (default behavior).
     *
     * While our implementation adheres to the following bullet point...
     *
     * o  If the initial offer is in an INVITE, the answer MUST be in a
     *    reliable non-failure message from UAS back to UAC which is
     *    correlated to that INVITE.  For this specification, that is
     *    only the final 2xx response to that INVITE.  That same exact
     *    answer MAY also be placed in any provisional responses sent
     *    prior to the answer.  The UAC MUST treat the first session
     *    description it receives as the answer, and MUST ignore any
     *    session descriptions in subsequent responses to the initial
     *    INVITE.
     * https://tools.ietf.org/html/rfc3261#section-13.2.1
     *
     * We have made the following implementation decision with regard to early media...
     *
     * o  If the initial offer is in the INVITE, the answer from the
     *    UAS back to the UAC will establish a media session only
     *    only after the final 2xx response to that INVITE is received.
     *
     * The reason for this decision is rooted in a restriction currently
     * inherent in WebRTC. Specifically, while a SIP INVITE request with an
     * initial offer may fork resulting in more than one provisional answer,
     * there is currently no easy/good way to to "fork" an offer generated
     * by a peer connection. In particular, a WebRTC offer currently may only
     * be matched with one answer and we have no good way to know which
     * "provisional answer" is going to be the "final answer". So we have
     * decided to punt and not create any "early media" sessions in this case.
     *
     * The upshot is that if you want "early media", you must not put the
     * initial offer in the INVITE. Instead, force the UAS to provide the
     * initial offer by sending an INVITE without an offer. In the WebRTC
     * case this allows us to create a unique peer connection with a unique
     * answer for every provisional offer with "early media" on all of them.
     *
     *
     * 3) If "early media" and the initial offer is in an INVITE, no INVITE forking.
     *
     * The default behaviour may be altered and "early media" utilized if the
     * initial offer is in the an INVITE by setting the `earlyMedia` options.
     * However in that case the INVITE request MUST NOT fork. This allows for
     * "early media" in environments where the forking behaviour of the SIP
     * servers being utilized is configured to disallow forking.
     */
    invite(options?: InviterInviteOptions): Promise<OutgoingInviteRequest>;
    /**
     * 13.2.1 Creating the Initial INVITE
     *
     * Since the initial INVITE represents a request outside of a dialog,
     * its construction follows the procedures of Section 8.1.1.  Additional
     * processing is required for the specific case of INVITE.
     *
     * An Allow header field (Section 20.5) SHOULD be present in the INVITE.
     * It indicates what methods can be invoked within a dialog, on the UA
     * sending the INVITE, for the duration of the dialog.  For example, a
     * UA capable of receiving INFO requests within a dialog [34] SHOULD
     * include an Allow header field listing the INFO method.
     *
     * A Supported header field (Section 20.37) SHOULD be present in the
     * INVITE.  It enumerates all the extensions understood by the UAC.
     *
     * An Accept (Section 20.1) header field MAY be present in the INVITE.
     * It indicates which Content-Types are acceptable to the UA, in both
     * the response received by it, and in any subsequent requests sent to
     * it within dialogs established by the INVITE.  The Accept header field
     * is especially useful for indicating support of various session
     * description formats.
     *
     * The UAC MAY add an Expires header field (Section 20.19) to limit the
     * validity of the invitation.  If the time indicated in the Expires
     * header field is reached and no final answer for the INVITE has been
     * received, the UAC core SHOULD generate a CANCEL request for the
     * INVITE, as per Section 9.
     *
     * A UAC MAY also find it useful to add, among others, Subject (Section
     * 20.36), Organization (Section 20.25) and User-Agent (Section 20.41)
     * header fields.  They all contain information related to the INVITE.
     *
     * The UAC MAY choose to add a message body to the INVITE.  Section
     * 8.1.1.10 deals with how to construct the header fields -- Content-
     * Type among others -- needed to describe the message body.
     *
     * https://tools.ietf.org/html/rfc3261#section-13.2.1
     */
    private sendInvite;
    private ackAndBye;
    private disposeEarlyMedia;
    private notifyReferer;
    /**
     * Handle final response to initial INVITE.
     * @param inviteResponse - 2xx response.
     */
    private onAccept;
    /**
     * Handle provisional response to initial INVITE.
     * @param inviteResponse - 1xx response.
     */
    private onProgress;
    /**
     * Handle final response to initial INVITE.
     * @param inviteResponse - 3xx response.
     */
    private onRedirect;
    /**
     * Handle final response to initial INVITE.
     * @param inviteResponse - 4xx, 5xx, or 6xx response.
     */
    private onReject;
    /**
     * Handle final response to initial INVITE.
     * @param inviteResponse - 100 response.
     */
    private onTrying;
}

/**
 * Options for {@link Inviter.cancel}.
 * @public
 */
export declare interface InviterCancelOptions {
    extraHeaders?: Array<string>;
    reasonPhrase?: string;
    statusCode?: number;
}

/**
 * Options for {@link Inviter.invite}.
 * @public
 */
export declare interface InviterInviteOptions {
    /** See `core` API. */
    requestDelegate?: OutgoingRequestDelegate;
    /** See `core` API. */
    requestOptions?: RequestOptions;
    sessionDescriptionHandlerModifiers?: Array<SessionDescriptionHandlerModifier>;
    sessionDescriptionHandlerOptions?: SessionDescriptionHandlerOptions;
}

/**
 * Options for {@link Inviter} constructor.
 * @public
 */
export declare interface InviterOptions extends SessionOptions {
    /** If true, an anonymous call. */
    anonymous?: boolean;
    /** @deprecated TODO: provide alternative. */
    body?: string;
    /** @deprecated TODO: provide alternative. */
    contentType?: string;
    /**
     * If true, the first answer to the local offer is immediately utilized for media.
     * Requires that the INVITE request MUST NOT fork.
     * Has no effect if `inviteWtihoutSdp` is true.
     * Default is false.
     */
    earlyMedia?: boolean;
    /** Array of extra headers added to the INVITE. */
    extraHeaders?: Array<string>;
    /** If true, send INVITE without SDP. Default is false. */
    inviteWithoutSdp?: boolean;
    /** @deprecated TODO: provide alternative. */
    onInfo?: any;
    /** @deprecated TODO: provide alternative. */
    params?: {
        fromDisplayName?: string;
        fromTag?: string;
        fromUri?: string | URI;
        toDisplayName?: string;
        toUri?: string | URI;
    };
    /** @deprecated TODO: provide alternative. */
    renderbody?: string;
    /** @deprecated TODO: provide alternative. */
    rendertype?: string;
    /** Modifiers to pass to SessionDescriptionHandler's getDescription() and setDescription(). */
    SessionDescriptionHandlerModifiers?: Array<SessionDescriptionHandlerModifier>;
    /** Options to pass to SessionDescriptionHandler's getDescription() and setDescription(). */
    sessionDescriptionHandlerOptions?: SessionDescriptionHandlerOptions;
}

/**
 * INVITE Server Transaction.
 * @remarks
 * https://tools.ietf.org/html/rfc3261#section-17.2.1
 * @public
 */
declare class InviteServerTransaction extends ServerTransaction {
    private lastFinalResponse;
    private lastProvisionalResponse;
    private H;
    private I;
    private L;
    /**
     * FIXME: This should not be here. It should be in the UAS.
     *
     * If the UAS desires an extended period of time to answer the INVITE,
     * it will need to ask for an "extension" in order to prevent proxies
     * from canceling the transaction.  A proxy has the option of canceling
     * a transaction when there is a gap of 3 minutes between responses in a
     * transaction.  To prevent cancellation, the UAS MUST send a non-100
     * provisional response at every minute, to handle the possibility of
     * lost provisional responses.
     *
     *   An INVITE transaction can go on for extended durations when the
     *   user is placed on hold, or when interworking with PSTN systems
     *   which allow communications to take place without answering the
     *   call.  The latter is common in Interactive Voice Response (IVR)
     *   systems.
     * https://tools.ietf.org/html/rfc3261#section-13.3.1.1
     */
    private progressExtensionTimer;
    /**
     * Constructor.
     * Upon construction, a "100 Trying" reply will be immediately sent.
     * After construction the transaction will be in the "proceeding" state and the transaction
     * `id` will equal the branch parameter set in the Via header of the incoming request.
     * https://tools.ietf.org/html/rfc3261#section-17.2.1
     * @param request - Incoming INVITE request from the transport.
     * @param transport - The transport.
     * @param user - The transaction user.
     */
    constructor(request: IncomingRequestMessage, transport: Transport, user: ServerTransactionUser);
    /**
     * Destructor.
     */
    dispose(): void;
    /** Transaction kind. Deprecated. */
    readonly kind: string;
    /**
     * Receive requests from transport matching this transaction.
     * @param request - Request matching this transaction.
     */
    receiveRequest(request: IncomingRequestMessage): void;
    /**
     * Receive responses from TU for this transaction.
     * @param statusCode - Status code of response.
     * @param response - Response.
     */
    receiveResponse(statusCode: number, response: string): void;
    /**
     * Retransmit the last 2xx response. This is a noop if not in the "accepted" state.
     */
    retransmitAcceptedResponse(): void;
    /**
     * First, the procedures in [4] are followed, which attempt to deliver the response to a backup.
     * If those should all fail, based on the definition of failure in [4], the server transaction SHOULD
     * inform the TU that a failure has occurred, and MUST remain in the current state.
     * https://tools.ietf.org/html/rfc6026#section-8.8
     */
    protected onTransportError(error: Error): void;
    /** For logging. */
    protected typeToString(): string;
    /**
     * Execute a state transition.
     * @param newState - New state.
     */
    private stateTransition;
    /**
     * FIXME: UAS Provisional Retransmission Timer. See RFC 3261 Section 13.3.1.1
     * This is in the wrong place. This is not a transaction level thing. It's a UAS level thing.
     */
    private startProgressExtensionTimer;
    /**
     * FIXME: UAS Provisional Retransmission Timer id. See RFC 3261 Section 13.3.1.1
     * This is in the wrong place. This is not a transaction level thing. It's a UAS level thing.
     */
    private stopProgressExtensionTimer;
    /**
     * While in the "Proceeding" state, if the TU passes a response with status code
     * from 300 to 699 to the server transaction, the response MUST be passed to the
     * transport layer for transmission, and the state machine MUST enter the "Completed" state.
     * For unreliable transports, timer G is set to fire in T1 seconds, and is not set to fire for
     * reliable transports. If timer G fires, the response is passed to the transport layer once
     * more for retransmission, and timer G is set to fire in MIN(2*T1, T2) seconds. From then on,
     * when timer G fires, the response is passed to the transport again for transmission, and
     * timer G is reset with a value that doubles, unless that value exceeds T2, in which case
     * it is reset with the value of T2.
     * https://tools.ietf.org/html/rfc3261#section-17.2.1
     */
    private timer_G;
    /**
     * If timer H fires while in the "Completed" state, it implies that the ACK was never received.
     * In this case, the server transaction MUST transition to the "Terminated" state, and MUST
     * indicate to the TU that a transaction failure has occurred.
     * https://tools.ietf.org/html/rfc3261#section-17.2.1
     */
    private timer_H;
    /**
     * Once timer I fires, the server MUST transition to the "Terminated" state.
     * https://tools.ietf.org/html/rfc3261#section-17.2.1
     */
    private timer_I;
    /**
     * When Timer L fires and the state machine is in the "Accepted" state, the machine MUST
     * transition to the "Terminated" state. Once the transaction is in the "Terminated" state,
     * it MUST be destroyed immediately. Timer L reflects the amount of time the server
     * transaction could receive 2xx responses for retransmission from the
     * TU while it is waiting to receive an ACK.
     * https://tools.ietf.org/html/rfc6026#section-7.1
     * https://tools.ietf.org/html/rfc6026#section-8.7
     */
    private timer_L;
}

/**
 * Log levels.
 * @public
 */
declare enum Levels {
    error = 0,
    warn = 1,
    log = 2,
    debug = 3
}

/**
 * Log connector function.
 * @public
 */
export declare type LogConnector = (level: LogLevel, category: string, label: string | undefined, content: string) => void;

/**
 * Logger.
 * @public
 */
declare class Logger {
    private logger;
    private category;
    private label;
    constructor(logger: LoggerFactory, category: string, label?: string);
    error(content: string): void;
    warn(content: string): void;
    log(content: string): void;
    debug(content: string): void;
    private genericLog;
}

/**
 * Logger.
 * @public
 */
declare class LoggerFactory {
    builtinEnabled: boolean;
    private _level;
    private _connector;
    private loggers;
    private logger;
    constructor();
    level: Levels;
    connector: ((level: string, category: string, label: string | undefined, content: any) => void) | undefined;
    getLogger(category: string, label?: string): Logger;
    genericLog(levelToLog: Levels, category: string, label: string | undefined, content: any): void;
    private print;
}

/**
 * Log level.
 * @public
 */
export declare type LogLevel = "debug" | "log" | "warn" | "error";

/**
 * Creates an {@link Emitter}.
 * @param eventEmitter - An event emitter.
 * @param eventName - Event name.
 * @internal
 */
export declare function makeEmitter<T>(eventEmitter: EventEmitter, eventName?: string): Emitter<T>;

/**
 * A received message (incoming MESSAGE).
 * @public
 */
export declare class Message {
    private incomingMessageRequest;
    /** @internal */
    constructor(incomingMessageRequest: IncomingMessageRequest);
    /** Incoming MESSAGE request message. */
    readonly request: IncomingRequestMessage;
    /** Accept the request. */
    accept(options?: ResponseOptions): Promise<void>;
    /** Reject the request. */
    reject(options?: ResponseOptions): Promise<void>;
}

/**
 * A messager sends a {@link Message} (outgoing MESSAGE).
 * @public
 */
export declare class Messager extends EventEmitter {
    private logger;
    private request;
    private userAgent;
    private _disposed;
    /**
     * Constructs a new instance of the `Messager` class.
     * @param userAgent - User agent. See {@link UserAgent} for details.
     * @param targetURI - Request URI identifying the target of the message.
     * @param content - Content for the body of the message.
     * @param contentType - Content type of the body of the message.
     * @param options - Options bucket. See {@link MessagerOptions} for details.
     */
    constructor(userAgent: UserAgent, targetURI: URI, content: string, contentType?: string, options?: MessagerOptions);
    /**
     * Destructor.
     * @internal
     */
    dispose(): void;
    /**
     * Send the message.
     */
    message(options?: MessagerMessageOptions): Promise<void>;
}

/**
 * Options for {@link Messager.message}.
 * @public
 */
declare interface MessagerMessageOptions {
    /** See `core` API. */
    requestDelegate?: OutgoingRequestDelegate;
    /** See `core` API. */
    requestOptions?: RequestOptions;
}

/**
 * Options for {@link Messager} constructor.
 * @public
 */
export declare interface MessagerOptions {
    /** Array of extra headers added to the MESSAGE. */
    extraHeaders?: Array<string>;
    /** @deprecated TODO: provide alternative. */
    params?: {
        fromDisplayName?: string;
        fromTag?: string;
        fromUri?: string | URI;
        toDisplayName?: string;
        toUri?: string | URI;
    };
}

/**
 * Name Address SIP header.
 * @public
 */
declare class NameAddrHeader extends Parameters {
    uri: URI;
    private _displayName;
    /**
     * Constructor
     * @param uri -
     * @param displayName -
     * @param parameters -
     */
    constructor(uri: URI, displayName: string, parameters: {
        [name: string]: string;
    });
    readonly friendlyName: string;
    displayName: string;
    clone(): NameAddrHeader;
    toString(): string;
}

/**
 * Non-INVITE Server Transaction.
 * @remarks
 * https://tools.ietf.org/html/rfc3261#section-17.2.2
 * @public
 */
declare class NonInviteServerTransaction extends ServerTransaction {
    private lastResponse;
    private J;
    /**
     * Constructor.
     * After construction the transaction will be in the "trying": state and the transaction
     * `id` will equal the branch parameter set in the Via header of the incoming request.
     * https://tools.ietf.org/html/rfc3261#section-17.2.2
     * @param request - Incoming Non-INVITE request from the transport.
     * @param transport - The transport.
     * @param user - The transaction user.
     */
    constructor(request: IncomingRequestMessage, transport: Transport, user: ServerTransactionUser);
    /**
     * Destructor.
     */
    dispose(): void;
    /** Transaction kind. Deprecated. */
    readonly kind: string;
    /**
     * Receive requests from transport matching this transaction.
     * @param request - Request matching this transaction.
     */
    receiveRequest(request: IncomingRequestMessage): void;
    /**
     * Receive responses from TU for this transaction.
     * @param statusCode - Status code of repsonse. 101-199 not allowed per RFC 4320.
     * @param response - Response to send.
     */
    receiveResponse(statusCode: number, response: string): void;
    /**
     * First, the procedures in [4] are followed, which attempt to deliver the response to a backup.
     * If those should all fail, based on the definition of failure in [4], the server transaction SHOULD
     * inform the TU that a failure has occurred, and SHOULD transition to the terminated state.
     * https://tools.ietf.org/html/rfc3261#section-17.2.4
     */
    protected onTransportError(error: Error): void;
    /** For logging. */
    protected typeToString(): string;
    private stateTransition;
    /**
     * The server transaction remains in this state until Timer J fires,
     * at which point it MUST transition to the "Terminated" state.
     * https://tools.ietf.org/html/rfc3261#section-17.2.2
     */
    private timer_J;
}

/**
 * A notification of an event (incoming NOTIFY).
 * @public
 */
export declare class Notification {
    private incomingNotifyRequest;
    /** @internal */
    constructor(incomingNotifyRequest: IncomingNotifyRequest);
    /** Incoming NOTIFY request message. */
    readonly request: IncomingRequestMessage;
    /** Accept the request. */
    accept(options?: ResponseOptions): Promise<void>;
    /** Reject the request. */
    reject(options?: ResponseOptions): Promise<void>;
}

/**
 * NOTIFY UAS.
 * @public
 */
declare class NotifyUserAgentServer extends UserAgentServer implements IncomingNotifyRequest {
    /**
     * NOTIFY UAS constructor.
     * @param dialogOrCore - Dialog for in dialog NOTIFY, UserAgentCore for out of dialog NOTIFY (deprecated).
     * @param message - Incoming NOTIFY request message.
     */
    constructor(dialogOrCore: Dialog | UserAgentCore, message: IncomingRequestMessage, delegate?: IncomingRequestDelegate);
}

/**
 * Outgoing ACK request.
 * @public
 */
declare interface OutgoingAckRequest {
    /** The outgoing message. */
    readonly message: OutgoingRequestMessage;
}

/**
 * Outgoing BYE request.
 * @public
 */
declare interface OutgoingByeRequest extends OutgoingRequest {
}

/**
 * Outgoing INFO request.
 * @public
 */
declare interface OutgoingInfoRequest extends OutgoingRequest {
}

/**
 * Outgoing INVITE request.
 * @public
 */
declare interface OutgoingInviteRequest extends OutgoingRequest {
    /** Delegate providing custom handling of this outgoing INVITE request. */
    delegate?: OutgoingInviteRequestDelegate;
}

/**
 * Delegate providing custom handling of outgoing INVITE requests.
 * @public
 */
declare interface OutgoingInviteRequestDelegate extends OutgoingRequestDelegate {
    /**
     * Received a 2xx positive final response to this request.
     * @param response - Incoming response (including a confirmed Session).
     */
    onAccept?(response: AckableIncomingResponseWithSession): void;
    /**
     * Received a 1xx provisional response to this request. Excluding 100 responses.
     * @param response - Incoming response (including an early Session).
     */
    onProgress?(response: PrackableIncomingResponseWithSession): void;
}

/**
 * Outgoing MESSAGE request.
 * @public
 */
declare interface OutgoingMessageRequest extends OutgoingRequest {
}

/**
 * Outgoing NOTIFY request.
 * @public
 */
declare interface OutgoingNotifyRequest extends OutgoingRequest {
}

/**
 * Outgoing PRACK request.
 * @public
 */
declare interface OutgoingPrackRequest extends OutgoingRequest {
}

/**
 * Outgoing PUBLISH request.
 * @public
 */
declare interface OutgoingPublishRequest extends OutgoingRequest {
}

/**
 * Outgoing REFER request.
 * @public
 */
declare interface OutgoingReferRequest extends OutgoingRequest {
}

/**
 * Outgoing REGISTER request.
 * @public
 */
declare interface OutgoingRegisterRequest extends OutgoingRequest {
}

/**
 * A SIP message sent from a local client to a remote server.
 * @remarks
 * For the purpose of invoking a particular operation.
 * https://tools.ietf.org/html/rfc3261#section-7.1
 * @public
 */
declare interface OutgoingRequest {
    /** Delegate providing custom handling of this outgoing request. */
    delegate?: OutgoingRequestDelegate;
    /** The outgoing message. */
    readonly message: OutgoingRequestMessage;
    /**
     * Destroy request.
     */
    dispose(): void;
    /**
     * Sends a CANCEL message targeting this request to the UAS.
     * @param reason - Reason for canceling request.
     * @param options - Request options bucket.
     */
    cancel(reason?: string, options?: RequestOptions): void;
}

/**
 * Delegate providing custom handling of outgoing requests.
 * @public
 */
declare interface OutgoingRequestDelegate {
    /**
     * Received a 2xx positive final response to this request.
     * @param response - Incoming response.
     */
    onAccept?(response: IncomingResponse): void;
    /**
     * Received a 1xx provisional response to this request. Excluding 100 responses.
     * @param response - Incoming response.
     */
    onProgress?(response: IncomingResponse): void;
    /**
     * Received a 3xx negative final response to this request.
     * @param response - Incoming response.
     */
    onRedirect?(response: IncomingResponse): void;
    /**
     * Received a 4xx, 5xx, or 6xx negative final response to this request.
     * @param response - Incoming response.
     */
    onReject?(response: IncomingResponse): void;
    /**
     * Received a 100 provisional response.
     * @param response - Incoming response.
     */
    onTrying?(response: IncomingResponse): void;
}

/**
 * Outgoing SIP request message.
 * @public
 */
declare class OutgoingRequestMessage {
    /** Get a copy of the default options. */
    private static getDefaultOptions;
    private static makeNameAddrHeader;
    readonly headers: {
        [name: string]: Array<string>;
    };
    readonly method: string;
    readonly ruri: URI;
    readonly from: NameAddrHeader;
    readonly fromTag: string;
    readonly fromURI: URI;
    readonly to: NameAddrHeader;
    readonly toTag: string | undefined;
    readonly toURI: URI;
    branch: string | undefined;
    readonly callId: string;
    cseq: number;
    extraHeaders: Array<string>;
    body: {
        body: string;
        contentType: string;
    } | undefined;
    private options;
    constructor(method: string, ruri: URI, fromURI: URI, toURI: URI, options?: OutgoingRequestMessageOptions, extraHeaders?: Array<string>, body?: Body);
    /**
     * Get the value of the given header name at the given position.
     * @param name - header name
     * @returns Returns the specified header, undefined if header doesn't exist.
     */
    getHeader(name: string): string | undefined;
    /**
     * Get the header/s of the given name.
     * @param name - header name
     * @returns Array with all the headers of the specified name.
     */
    getHeaders(name: string): Array<string>;
    /**
     * Verify the existence of the given header.
     * @param name - header name
     * @returns true if header with given name exists, false otherwise
     */
    hasHeader(name: string): boolean;
    /**
     * Replace the the given header by the given value.
     * @param name - header name
     * @param value - header value
     */
    setHeader(name: string, value: string | Array<string>): void;
    /**
     * The Via header field indicates the transport used for the transaction
     * and identifies the location where the response is to be sent.  A Via
     * header field value is added only after the transport that will be
     * used to reach the next hop has been selected (which may involve the
     * usage of the procedures in [4]).
     *
     * When the UAC creates a request, it MUST insert a Via into that
     * request.  The protocol name and protocol version in the header field
     * MUST be SIP and 2.0, respectively.  The Via header field value MUST
     * contain a branch parameter.  This parameter is used to identify the
     * transaction created by that request.  This parameter is used by both
     * the client and the server.
     * https://tools.ietf.org/html/rfc3261#section-8.1.1.7
     * @param branchParameter - The branch parameter.
     * @param scheme - The scheme.
     */
    setViaHeader(branch: string, scheme?: string): void;
    toString(): string;
}

/**
 * Outgoing request message options.
 * @public
 */
declare interface OutgoingRequestMessageOptions {
    callId?: string;
    callIdPrefix?: string;
    cseq?: number;
    toDisplayName?: string;
    toTag?: string;
    fromDisplayName?: string;
    fromTag?: string;
    forceRport?: boolean;
    hackViaTcp?: boolean;
    optionTags?: Array<string>;
    routeSet?: Array<string>;
    userAgentString?: string;
    viaHost?: string;
}

/**
 * A SIP message sent from a local server to a remote client.
 * @remarks
 * For indicating the status of a request sent from the client to the server.
 * https://tools.ietf.org/html/rfc3261#section-7.2
 * @public
 */
declare interface OutgoingResponse {
    /** The outgoing message. */
    readonly message: string;
}

/**
 * Outgoing INVITE response with the associated {@link Session}.
 * @public
 */
declare interface OutgoingResponseWithSession extends OutgoingResponse {
    /**
     * Session associated with incoming request acceptance, or
     * Session associated with incoming request progress (if an out of dialog request, an early dialog).
     */
    readonly session: Session_2;
}

/**
 * Outgoing SUBSCRIBE request.
 * @public
 */
declare interface OutgoingSubscribeRequest extends OutgoingRequest {
    /** Delegate providing custom handling of this outgoing SUBSCRIBE request. */
    delegate?: OutgoingSubscribeRequestDelegate;
    /** Stop waiting for an inital subscription creating NOTIFY. */
    waitNotifyStop(): void;
}

/**
 * Delegate providing custom handling of outgoing SUBSCRIBE requests.
 * @public
 */
declare interface OutgoingSubscribeRequestDelegate extends OutgoingRequestDelegate {
    /**
     * Received the initial subscription creating NOTIFY in response to this request.
     * Called for out of dialog SUBSCRIBE requests only (not called for re-SUBSCRIBE requests).
     * @param request - Incoming NOTIFY request (including a Subscription).
     */
    onNotify?(request: IncomingRequestWithSubscription): void;
    /**
     * Timed out waiting to receive the initial subscription creating NOTIFY in response to this request.
     * Called for out of dialog SUBSCRIBE requests only (not called for re-SUBSCRIBE requests).
     */
    onNotifyTimeout?(): void;
}

/**
 * @internal
 */
declare class Parameters {
    parameters: {
        [name: string]: string;
    };
    constructor(parameters: {
        [name: string]: string;
    });
    setParam(key: string, value: any): void;
    getParam(key: string): string | undefined;
    hasParam(key: string): boolean;
    deleteParam(parameter: string): any;
    clearParams(): void;
}

/**
 * Incoming INVITE response received when request is progressed.
 * @public
 */
declare interface PrackableIncomingResponseWithSession extends IncomingResponse {
    /** Session associated with outgoing request progress. If out of dialog request, an early dialog. */
    readonly session: Session_2;
    /**
     * Send an PRACK to acknowledge this response.
     * @param options - Request options bucket.
     */
    prack(options?: RequestOptions): OutgoingPrackRequest;
}

/**
 * A publisher publishes a document (outgoing PUBLISH).
 * @public
 */
export declare class Publisher extends EventEmitter {
    private event;
    private options;
    private target;
    private pubRequestBody;
    private pubRequestExpires;
    private pubRequestEtag;
    private publishRefreshTimer;
    private logger;
    private request;
    private userAgent;
    /**
     * Constructs a new instance of the `Publisher` class.
     * @param userAgent - User agent. See {@link UserAgent} for details.
     * @param targetURI - Request URI identifying the target of the message.
     * @param eventType - The event type identifying the published document.
     * @param options - Options bucket. See {@link PublisherOptions} for details.
     */
    constructor(userAgent: UserAgent, targetURI: URI, eventType: string, options?: PublisherOptions);
    /**
     * Close
     * @internal
     */
    close(): void;
    /**
     * Publish
     * @param content - Body to publish
     */
    publish(content: string, options?: PublisherPublishOptions): void;
    /**
     * Unpublish
     */
    unpublish(options?: PublisherUnpublishOptions): void;
    /** @internal */
    protected receiveResponse(response: IncomingResponseMessage): void;
    /** @internal */
    protected send(): this;
    private refreshRequest;
    private sendPublishRequest;
}

/**
 * Options for {@link Publisher} constructor.
 * @public
 */
export declare interface PublisherOptions {
    /** @deprecated TODO: provide alternative. */
    body?: string;
    /** @deprecated TODO: provide alternative. */
    contentType?: string;
    /**
     * Expire value for the published event.
     * @defaultValue 3600
     */
    expires?: number;
    /**
     * Array of extra headers added to the PUBLISH request message.
     */
    extraHeaders?: Array<string>;
    /** @deprecated TODO: provide alternative. */
    params?: {
        fromDisplayName?: string;
        fromTag?: string;
        fromUri?: URI;
        toDisplayName?: string;
        toUri?: URI;
    };
    /**
     * If set true, UA will gracefully unpublish for the event on UA close.
     * @defaultValue true
     */
    unpublishOnClose?: boolean;
}

/**
 * Options for {@link Publisher.publish}.
 * @public
 */
export declare interface PublisherPublishOptions {
}

/**
 * Options for {@link Publisher.unpublish}.
 * @public
 */
export declare interface PublisherUnpublishOptions {
}

/**
 * A request to establish a {@link Session} elsewhere (incoming REFER).
 * @public
 */
export declare class Referral {
    private incomingReferRequest;
    private session;
    private inviter;
    /** @internal */
    constructor(incomingReferRequest: IncomingReferRequest, session: Session);
    readonly referTo: NameAddrHeader;
    readonly referredBy: string | undefined;
    readonly replaces: string | undefined;
    /** Incoming REFER request message. */
    readonly request: IncomingRequestMessage;
    /** Accept the request. */
    accept(options?: ResponseOptions): Promise<void>;
    /** Reject the request. */
    reject(options?: ResponseOptions): Promise<void>;
    /**
     * Creates an inviter which may be used to send an out of dialog INVITE request.
     *
     * @remarks
     * This a helper method to create an Inviter which will execute the referral
     * of the `Session` which was referred. The appropriate headers are set and
     * the referred `Session` is linked to the new `Session`. Note that only a
     * single instance of the `Inviter` will be created and returned (if called
     * more than once a reference to the same `Inviter` will be returned every time).
     *
     * @param options - Options bucket.
     * @param modifiers - Session description handler modifiers.
     */
    makeInviter(options?: InviterOptions): Inviter;
}

/**
 * A referrer sends a {@link Referral} (outgoing REFER).
 * @remarks
 * Sends an outgoing in dialog REFER request.
 * @public
 */
export declare class Referrer {
    /** The referrer delegate. */
    delegate: ReferrerDelegate | undefined;
    /** The referTo. */
    private _referTo;
    /** The referrer session. */
    private _session;
    /**
     * Constructs a new instance of the `Referrer` class.
     * @param session - The session the REFER will be sent from. See {@link Session} for details.
     * @param referTo - The referral target. If a `Session`, a REFER w/Replaces is sent.
     * @param options - An options bucket. See {@link ReferrerOptions} for details.
     */
    constructor(session: Session, referTo: URI | Session, options?: ReferrerOptions);
    /** The referrer session. */
    readonly session: Session;
    /**
     * Sends the REFER request.
     * @param options - An options bucket.
     */
    refer(options?: ReferrerReferOptions): Promise<OutgoingReferRequest>;
    private extraHeaders;
    private referToString;
}

/**
 * Delegate for {@link Referrer}.
 * @public
 */
export declare interface ReferrerDelegate extends OutgoingRequestDelegate {
    onNotify(notification: Notification): void;
}

/**
 * Options for {@link Referrer} constructor.
 * @public
 */
export declare interface ReferrerOptions {
    extraHeaders?: Array<string>;
}

/**
 * Options for {@link Referrer.refer}.
 * @public
 */
export declare interface ReferrerReferOptions {
    /** See `core` API. */
    requestDelegate?: ReferrerDelegate;
    /** See `core` API. */
    requestOptions?: RequestOptions;
}

/**
 * A registerer registers a contact for an address of record (outgoing REGISTER).
 * @public
 */
export declare class Registerer extends EventEmitter {
    registered: boolean;
    private options;
    private expires;
    private contact;
    private registrationTimer;
    private registrationExpiredTimer;
    private registeredBefore;
    private closeHeaders;
    private receiveResponse;
    private ua;
    private logger;
    private request;
    private _contacts;
    /** The registration state. */
    private _state;
    /** Emits when the registration state changes. */
    private _stateEventEmitter;
    /**
     * Constructs a new instance of the `Registerer` class.
     * @param userAgent - User agent. See {@link UserAgent} for details.
     * @param options - Options bucket. See {@link RegistererOptions} for details.
     */
    constructor(userAgent: UserAgent, options?: RegistererOptions);
    /** The registered contacts. */
    readonly contacts: Array<string>;
    /** The registration state. */
    readonly state: RegistererState;
    /** Emits when the referrer state changes. */
    readonly stateChange: Emitter<RegistererState>;
    register(options?: RegistererRegisterOptions): Promise<void>;
    unregister(options?: RegistererUnregisterOptions): Promise<void>;
    /** @internal */
    close(): void;
    /** @internal */
    unregistered(response?: IncomingResponseMessage, cause?: string): void;
    /** @internal */
    send(): Promise<void>;
    private registrationFailure;
    private onTransportDisconnected;
    /**
     * Helper Function to generate Contact Header
     * @internal
     */
    private generateContactHeader;
    /**
     * Transition registration state.
     * @internal
     */
    private stateTransition;
}

/**
 * Options for {@link Registerer} constructor.
 * @public
 */
export declare interface RegistererOptions {
    closeWithHeaders?: Array<string>;
    expires?: number;
    extraContactHeaderParams?: Array<string>;
    /** Array of extra headers added to the REGISTER. */
    extraHeaders?: Array<string>;
    instanceId?: string;
    params?: any;
    regId?: number;
    registrar?: string;
}

/**
 * Options for {@link Registerer.register}.
 * @public
 */
export declare interface RegistererRegisterOptions {
    closeWithHeaders?: Array<string>;
    extraHeaders?: Array<string>;
}

/**
 * {@link Registerer} state.
 * @remarks
 * Valid state transitions:
 * ```
 * 1. "initial" --> "registered"
 * 2. "initial" --> "unregistered"
 * 3. "registered" --> "unregistered"
 * 3. "unregistered" --> "registered"
 * ```
 * @public
 */
export declare enum RegistererState {
    Initial = "Initial",
    Registered = "Registered",
    Unregistered = "Unregistered"
}

/**
 * Options for {@link Registerer.unregister}.
 * @public
 */
export declare interface RegistererUnregisterOptions {
    all?: boolean;
    extraHeaders?: Array<string>;
}

/**
 * Request options bucket.
 * @public
 */
declare interface RequestOptions {
    /** Extra headers to include in the message. */
    extraHeaders?: Array<string>;
    /** Body to include in the message. */
    body?: Body;
}

/**
 * Response options bucket.
 * @public
 */
declare interface ResponseOptions {
    /** Status code of the response. */
    statusCode: number;
    /** Reason phrase of the response. */
    reasonPhrase?: string;
    /** To tag of the response. If not provided, one is generated. */
    toTag?: string;
    /** User agent string for User-Agent header. */
    userAgent?: string;
    /** Support options tags for Supported header. */
    supported?: Array<string>;
    /** Extra headers to include in the message. */
    extraHeaders?: Array<string>;
    /** Body to include in the message. */
    body?: Body;
}

/**
 * Server Transaction.
 * @remarks
 * The server transaction is responsible for the delivery of requests to
 * the TU and the reliable transmission of responses.  It accomplishes
 * this through a state machine.  Server transactions are created by the
 * core when a request is received, and transaction handling is desired
 * for that request (this is not always the case).
 * https://tools.ietf.org/html/rfc3261#section-17.2
 * @public
 */
declare abstract class ServerTransaction extends Transaction {
    private _request;
    protected user: ServerTransactionUser;
    protected constructor(_request: IncomingRequestMessage, transport: Transport, user: ServerTransactionUser, state: TransactionState, loggerCategory: string);
    /** The incoming request the transaction handling. */
    readonly request: IncomingRequestMessage;
    /**
     * Receive incoming requests from the transport which match this transaction.
     * @param request - The incoming request.
     */
    abstract receiveRequest(request: IncomingRequestMessage): void;
    /**
     * Receive outgoing responses to this request from the transaction user.
     * Responses will be delivered to the transport as necessary.
     * @param statusCode - Response status code.
     * @param response - Response.
     */
    abstract receiveResponse(statusCode: number, response: string): void;
}

declare type ServerTransactionConstructor = new (message: IncomingRequestMessage, transport: Transport, user: ServerTransactionUser) => ServerTransaction;

/**
 * UAS Core Transaction User.
 * @public
 */
declare interface ServerTransactionUser extends TransactionUser {
}

/**
 * A session provides real time communication between one or more participants.
 * @public
 */
export declare abstract class Session extends EventEmitter {
    /** @internal */
    static readonly C: typeof SessionStatus;
    /**
     * Property reserved for use by instance owner.
     * @defaultValue `undefined`
     */
    data: any | undefined;
    /**
     * The session delegate.
     * @defaultValue `undefined`
     */
    delegate: SessionDelegate | undefined;
    /**
     * The confirmed session dialog.
     */
    dialog: Session_2 | undefined;
    /** @internal */
    type: TypeStrings;
    /** @internal */
    userAgent: UserAgent;
    /** @internal */
    logger: Logger;
    /** @internal */
    method: string;
    /** @internal */
    abstract body: BodyAndContentType | string | undefined;
    /** @internal */
    abstract localIdentity: NameAddrHeader;
    /** @internal */
    abstract remoteIdentity: NameAddrHeader;
    /** @internal */
    assertedIdentity: NameAddrHeader | undefined;
    /** @internal */
    contentType: string | undefined;
    /** @internal */
    id: string | undefined;
    /** @internal */
    contact: string | undefined;
    /** Terminated time. */
    /** @internal */
    endTime: Date | undefined;
    /** @internal */
    localHold: boolean;
    /** @internal */
    referral: Inviter | undefined;
    /** @internal */
    referrer: Referrer | undefined;
    /** @internal */
    replacee: Session | undefined;
    /** Accepted time. */
    /** @internal */
    startTime: Date | undefined;
    /** DEPRECATED: Session status */
    /** @internal */
    status: SessionStatus;
    /** @internal */
    protected earlySdp: string | undefined;
    /** @internal */
    protected errorListener: ((...args: Array<any>) => void);
    /** @internal */
    protected fromTag: string | undefined;
    /** @internal */
    protected onInfo: ((request: IncomingRequestMessage) => void) | undefined;
    /** @internal */
    protected passedOptions: any;
    /** @internal */
    protected rel100: C.supported;
    /** @internal */
    protected renderbody: string | undefined;
    /** @internal */
    protected rendertype: string | undefined;
    /** @internal */
    protected sessionDescriptionHandlerFactory: SessionDescriptionHandlerFactory;
    /** @internal */
    protected sessionDescriptionHandlerModifiers: Array<SessionDescriptionHandlerModifier> | undefined;
    /** @internal */
    protected sessionDescriptionHandlerOptions: SessionDescriptionHandlerOptions | undefined;
    /** @internal */
    protected expiresTimer: any;
    /** @internal */
    protected userNoAnswerTimer: any;
    private _sessionDescriptionHandler;
    private _state;
    private _stateEventEmitter;
    private pendingReinvite;
    private tones;
    /**
     * Constructor.
     * @param userAgent - User agent. See {@link UserAgent} for details.
     * @internal
     */
    protected constructor(userAgent: UserAgent, options?: SessionOptions);
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    on(event: "SessionDescriptionHandler-created", listener: (sessionDescriptionHandler: SessionDescriptionHandler) => void): this;
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    on(event: "referInviteSent" | "referProgress" | "referAccepted" | "referRequestProgress" | "referRequestAccepted" | "referRequestRejected" | "reinviteAccepted" | "reinviteFailed" | "replaced", listener: (session: Session) => void): this;
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    on(event: "reinvite", listener: (session: Session, request: IncomingRequestMessage) => void): this;
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    on(event: "confirmed" | "notify", listener: (request: IncomingRequestMessage) => void): this;
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    on(event: "ack" | "invite" | "refer", listener: (request: OutgoingRequestMessage) => void): this;
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    on(event: "bye", listener: (request: IncomingRequestMessage | OutgoingRequestMessage) => void): this;
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    on(event: "accepted", listener: (response: string | IncomingResponseMessage, cause: string) => void): this;
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    on(event: "connecting", listener: (request: {
        request: IncomingRequestMessage;
    }) => void): this;
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    on(event: "progress", listener: (response: IncomingResponseMessage | string, reasonPhrase?: any) => void): this;
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    on(event: "failed" | "rejected", listener: (response?: IncomingRequestMessage | IncomingResponseMessage | string, cause?: string) => void): this;
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    on(event: "terminated", listener: (response?: IncomingRequestMessage | IncomingResponseMessage, cause?: string) => void): this;
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    on(event: "renegotiationError", listener: (error: Error) => void): this;
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    on(event: "cancel" | "trackAdded" | "directionChanged" | "referRejected", listener: () => void): this;
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    emit(event: "SessionDescriptionHandler-created", sessionDescriptionHandler: SessionDescriptionHandler): boolean;
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    emit(event: "referInviteSent" | "referRejected" | "referRequestProgress" | "referRequestAccepted" | "referRequestRejected" | "reinviteAccepted" | "reinviteFailed" | "replaced", session: Session): boolean;
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    emit(event: "reinvite", session: Session, request: IncomingRequestMessage): boolean;
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    emit(event: "confirmed" | "notify", request: IncomingRequestMessage): boolean;
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    emit(event: "ack" | "invite" | "refer" | "notify", request: OutgoingRequestMessage): boolean;
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    emit(event: "bye", request: IncomingRequestMessage | OutgoingRequestMessage): boolean;
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    emit(event: "accepted", response?: string | IncomingResponseMessage, cause?: string): boolean;
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    emit(event: "connecting", request: {
        request: IncomingRequestMessage;
    }): boolean;
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    emit(event: "progress", response: IncomingResponseMessage | string, reasonPhrase?: any): boolean;
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    emit(event: "failed" | "rejected", response?: IncomingRequestMessage | IncomingResponseMessage | string, cause?: string): boolean;
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    emit(event: "terminated", response?: IncomingRequestMessage | IncomingResponseMessage, cause?: string): boolean;
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    emit(event: "renegotiationError", error: Error): boolean;
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    emit(event: "cancel" | "trackAdded" | "directionChanged" | "referRejected"): boolean;
    /**
     * Session description handler.
     */
    readonly sessionDescriptionHandler: SessionDescriptionHandler | undefined;
    /**
     * Session state.
     */
    readonly state: SessionState;
    /**
     * Session state change emitter.
     */
    readonly stateChange: Emitter<SessionState>;
    /**
     * Renegotiate the session. Sends a re-INVITE.
     * @param options - Options bucket.
     */
    invite(options?: SessionInviteOptions): Promise<OutgoingInviteRequest>;
    /**
     * TODO: This is awkward.
     * Helper function
     * @internal
     */
    byePending(): void;
    /**
     * TODO: This is awkward.
     * Helper function
     * @internal
     */
    byeSent(request: OutgoingByeRequest): void;
    /**
     * Send BYE.
     * @param delegate - Request delegate.
     * @param options - Request options bucket.
     * @internal
     */
    bye(delegate?: OutgoingRequestDelegate, options?: RequestOptions): Promise<OutgoingByeRequest>;
    /**
     * Send INFO.
     * @param delegate - Request delegate.
     * @param options - Request options bucket.
     * @internal
     */
    info(delegate?: OutgoingRequestDelegate, options?: RequestOptions): Promise<OutgoingByeRequest>;
    /**
     * Send REFER.
     * @param delegate - Request delegate.
     * @param options - Request options bucket.
     * @internal
     */
    refer(referrer: Referrer, delegate?: OutgoingRequestDelegate, options?: RequestOptions): Promise<OutgoingByeRequest>;
    /**
     * @internal
     */
    close(): void;
    /**
     * @internal
     */
    onRequestTimeout(): void;
    /**
     * @internal
     */
    onTransportError(): void;
    /**
     * Handle in dialog ACK request.
     * @internal
     */
    protected onAckRequest(request: IncomingAckRequest): void;
    /**
     * Handle in dialog BYE request.
     * @internal
     */
    protected onByeRequest(request: IncomingByeRequest): void;
    /**
     * Handle in dialog INFO request.
     * @internal
     */
    protected onInfoRequest(request: IncomingInfoRequest): void;
    /**
     * Handle in dialog INVITE request.
     * Unless an `onInviteFailure` delegate is available, the session is terminated on failure.
     * @internal
     */
    protected onInviteRequest(request: IncomingInviteRequest): void;
    /**
     * Handle in dialog NOTIFY request.
     * @internal
     */
    protected onNotifyRequest(request: IncomingNotifyRequest): void;
    /**
     * Handle in dialog PRACK request.
     * @internal
     */
    protected onPrackRequest(request: IncomingPrackRequest): void;
    /**
     * Handle in dialog REFER request.
     * @internal
     */
    protected onReferRequest(request: IncomingReferRequest): void;
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    protected accepted(response?: IncomingResponseMessage | string, cause?: string): void;
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    protected canceled(): void;
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    protected connecting(request: IncomingRequestMessage): void;
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    protected failed(response: IncomingResponseMessage | IncomingRequestMessage | undefined, cause: string): void;
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    protected rejected(response: IncomingResponseMessage | IncomingRequestMessage, cause: string): void;
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    protected terminated(message?: IncomingResponseMessage | IncomingRequestMessage, cause?: string): void;
    /**
     * Generate an offer or answer for a response to an INVITE request.
     * If a remote offer was provided in the request, set the remote
     * description and get a local answer. If a remote offer was not
     * provided, generates a local offer.
     * @internal
     */
    protected generateResponseOfferAnswer(request: IncomingInviteRequest, options: {
        sessionDescriptionHandlerOptions?: SessionDescriptionHandlerOptions;
        sessionDescriptionHandlerModifiers?: Array<SessionDescriptionHandlerModifier>;
    }): Promise<Body | undefined>;
    /**
     * Generate an offer or answer for a response to an INVITE request
     * when a dialog (early or otherwise) has already been established.
     * This method may NOT be called if a dialog has yet to be established.
     * @internal
     */
    protected generateResponseOfferAnswerInDialog(options: {
        sessionDescriptionHandlerOptions?: SessionDescriptionHandlerOptions;
        sessionDescriptionHandlerModifiers?: Array<SessionDescriptionHandlerModifier>;
    }): Promise<Body | undefined>;
    /**
     * Get local offer.
     * @internal
     */
    protected getOffer(options: {
        sessionDescriptionHandlerOptions?: SessionDescriptionHandlerOptions;
        sessionDescriptionHandlerModifiers?: Array<SessionDescriptionHandlerModifier>;
    }): Promise<Body>;
    /**
     * Set remote answer.
     * @internal
     */
    protected setAnswer(answer: Body, options: {
        sessionDescriptionHandlerOptions?: SessionDescriptionHandlerOptions;
        sessionDescriptionHandlerModifiers?: Array<SessionDescriptionHandlerModifier>;
    }): Promise<void>;
    /**
     * Set remote offer and get local answer.
     * @internal
     */
    protected setOfferAndGetAnswer(offer: Body, options: {
        sessionDescriptionHandlerOptions?: SessionDescriptionHandlerOptions;
        sessionDescriptionHandlerModifiers?: Array<SessionDescriptionHandlerModifier>;
    }): Promise<Body>;
    /**
     * SDH for confirmed dialog.
     * @internal
     */
    protected setSessionDescriptionHandler(sdh: SessionDescriptionHandler): void;
    /**
     * SDH for confirmed dialog.
     * @internal
     */
    protected setupSessionDescriptionHandler(): SessionDescriptionHandler;
    /**
     * Transition session state.
     * @internal
     */
    protected stateTransition(newState: SessionState): void;
}

/**
 * Session.
 * @remarks
 * https://tools.ietf.org/html/rfc3261#section-13
 * @public
 */
declare interface Session_2 {
    /** Session delegate. */
    delegate: SessionDelegate_2 | undefined;
    /** The session id. Equal to callId + localTag + remoteTag. */
    readonly id: string;
    /** Call Id. */
    readonly callId: string;
    /** Local Tag. */
    readonly localTag: string;
    /** Local URI. */
    readonly localURI: URI;
    /** Remote Tag. */
    readonly remoteTag: string;
    /** Remote Target. */
    readonly remoteTarget: URI;
    /** Remote URI. */
    readonly remoteURI: URI;
    /** Session state. */
    readonly sessionState: SessionState_2;
    /** Current state of the offer/answer exchange. */
    readonly signalingState: SignalingState;
    /** The current answer if signalingState is stable. Otherwise undefined. */
    readonly answer: Body | undefined;
    /** The current offer if signalingState is not initial or closed. Otherwise undefined. */
    readonly offer: Body | undefined;
    /**
     * Destroy session.
     */
    dispose(): void;
    /**
     * Send a BYE request.
     * Terminating a session.
     * https://tools.ietf.org/html/rfc3261#section-15
     * @param delegate - Request delegate.
     * @param options - Options bucket.
     */
    bye(delegate?: OutgoingRequestDelegate, options?: RequestOptions): OutgoingByeRequest;
    /**
     * Send an INFO request.
     * Exchange information during a session.
     * https://tools.ietf.org/html/rfc6086#section-4.2.1
     * @param delegate - Request delegate.
     * @param options - Options bucket.
     */
    info(delegate?: OutgoingRequestDelegate, options?: RequestOptions): OutgoingInfoRequest;
    /**
     * Send re-INVITE request.
     * Modifying a session.
     * https://tools.ietf.org/html/rfc3261#section-14.1
     * @param delegate - Request delegate.
     * @param options - Options bucket.
     */
    invite(delegate?: OutgoingInviteRequestDelegate, options?: RequestOptions): OutgoingInviteRequest;
    /**
     * Send NOTIFY request.
     * Inform referrer of transfer progress.
     * The use of this is limited to the implicit creation of subscription by REFER (historical).
     * Otherwise, notifiers MUST NOT create subscriptions except upon receipt of a SUBSCRIBE request.
     * https://tools.ietf.org/html/rfc3515#section-3.7
     * @param delegate - Request delegate.
     * @param options - Options bucket.
     */
    notify(delegate?: OutgoingRequestDelegate, options?: RequestOptions): OutgoingNotifyRequest;
    /**
     * Send PRACK request.
     * Acknowledge a reliable provisional response.
     * https://tools.ietf.org/html/rfc3262#section-4
     * @param delegate - Request delegate.
     * @param options - Options bucket.
     */
    prack(delegate?: OutgoingRequestDelegate, options?: RequestOptions): OutgoingPrackRequest;
    /**
     * Send REFER request (in dialog).
     * Transfer a session.
     * https://tools.ietf.org/html/rfc3515#section-2.4.1
     * @param delegate - Request delegate.
     * @param options - Options bucket.
     */
    refer(delegate?: OutgoingRequestDelegate, options?: RequestOptions): OutgoingReferRequest;
}

/**
 * Delegate for {@link Session}.
 * @public
 */
export declare interface SessionDelegate {
    /**
     * Called upon receiving an incoming in dialog INFO request.
     * @param info - The info.
     */
    onInfo?(info: Info): void;
    /**
     * Called upon receiving an incoming in dialog NOTIFY request.
     *
     * @remarks
     * If a refer is in progress notifications are delivered to the referrers delegate.
     *
     * @param notification - The notification.
     */
    onNotify?(notification: Notification): void;
    /**
     * Called upon receiving an incoming in dialog REFER request.
     * @param referral - The referral.
     */
    onRefer?(referral: Referral): void;
    /**
     * Called upon successfully accepting a received in dialog INVITE request.
     * @internal
     */
    onReinviteSuccess?(): void;
    /**
     * Called upon failing to accept a received in dialog INVITE request.
     * @param error - The error.
     * @internal
     */
    onReinviteFailure?(error: Error): void;
}

/**
 * Session delegate.
 * @public
 */
declare interface SessionDelegate_2 {
    /**
     * Receive ACK request.
     * @param request - Incoming ACK request.
     */
    onAck?(request: IncomingAckRequest): void;
    /**
     * Timeout waiting for ACK request.
     * If no handler is provided the Session will terminated with a BYE.
     * https://tools.ietf.org/html/rfc3261#section-13.3.1.4
     */
    onAckTimeout?(): void;
    /**
     * Receive BYE request.
     * https://tools.ietf.org/html/rfc3261#section-15.1.2
     * @param request - Incoming BYE request.
     */
    onBye?(request: IncomingByeRequest): void;
    /**
     * Receive INFO request.
     * @param request - Incoming INFO request.
     */
    onInfo?(request: IncomingInfoRequest): void;
    /**
     * Receive re-INVITE request.
     * https://tools.ietf.org/html/rfc3261#section-14.2
     * @param request - Incoming INVITE request.
     */
    onInvite?(request: IncomingInviteRequest): void;
    /**
     * Receive NOTIFY request.
     * https://tools.ietf.org/html/rfc6665#section-4.1.3
     * @param request - Incoming NOTIFY request.
     */
    onNotify?(request: IncomingNotifyRequest): void;
    /**
     * Receive PRACK request.
     * https://tools.ietf.org/html/rfc3262#section-3
     * @param request - Incoming PRACK request.
     */
    onPrack?(request: IncomingPrackRequest): void;
    /**
     * Receive REFER request.
     * https://tools.ietf.org/html/rfc3515#section-2.4.2
     * @param request - Incoming REFER request.
     */
    onRefer?(request: IncomingReferRequest): void;
}

/**
 * Delegate for {@link Session} offer/answer exchange.
 * @public
 */
export declare interface SessionDescriptionHandler {
    /**
     * Destructor.
     */
    close(): void;
    /**
     * Gets the local description from the underlying media implementation.
     * @param options - Options object to be used by getDescription.
     * @param modifiers - Array with one time use description modifiers.
     * @returns Promise that resolves with the local description to be used for the session.
     * Rejects with `ClosedSessionDescriptionHandlerError` when this method
     * is called after close or when close occurs before complete.
     */
    getDescription(options?: SessionDescriptionHandlerOptions, modifiers?: Array<SessionDescriptionHandlerModifier>): Promise<BodyAndContentType>;
    /**
     * Returns true if the Session Description Handler can handle the Content-Type described by a SIP message.
     * @param contentType - The content type that is in the SIP Message.
     * @returns True if the content type is  handled by this session description handler. False otherwise.
     */
    hasDescription(contentType: string): boolean;
    /**
     * The modifier that should be used when the session would like to place the call on hold.
     * @param sessionDescription - The description that will be modified.
     * @returns Promise that resolves with modified SDP.
     * Rejects with `ClosedSessionDescriptionHandlerError` when this method
     * is called after close or when close occurs before complete.
     */
    holdModifier(sessionDescription: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit>;
    /**
     * Sets the remote description to the underlying media implementation.
     * @param  sessionDescription - The description provided by a SIP message to be set on the media implementation.
     * @param options - Options object to be used by setDescription.
     * @param modifiers - Array with one time use description modifiers.
     * @returns Promise that resolves once the description is set.
     * Rejects with `ClosedSessionDescriptionHandlerError` when this method
     * is called after close or when close occurs before complete.
     */
    setDescription(sdp: string, options?: SessionDescriptionHandlerOptions, modifiers?: Array<SessionDescriptionHandlerModifier>): Promise<void>;
    /**
     * Send DTMF via RTP (RFC 4733).
     * Returns true if DTMF send is successful, false otherwise.
     * @param tones - A string containing DTMF digits.
     * @param options - Options object to be used by sendDtmf.
     * @returns True if DTMF send is successful, false otherwise.
     */
    sendDtmf(tones: string, options?: any): boolean;
}

/**
 * Factory for {@link SessionDescriptionHandler}.
 * @public
 */
export declare interface SessionDescriptionHandlerFactory {
    /**
     * SessionDescriptionHandler factory fucntion.
     * @remarks
     * The `options` are provided as part of the UserAgent configuration
     * and passed through on every call to SessionDescriptionHandlerFactory's constructor.
     */
    (session: Session, options?: object): SessionDescriptionHandler;
}

/**
 * Modifier for {@link SessionDescriptionHandler} offer/answer.
 * @public
 */
export declare interface SessionDescriptionHandlerModifier {
    (sessionDescription: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit>;
}

/**
 * Options for {@link SessionDescriptionHandler} methods.
 * @remarks
 * These options are provided to various UserAgent methods (invite() for example)
 * and passed through on calls to getDescription() and setDescription().
 * @public
 */
export declare interface SessionDescriptionHandlerOptions {
    constraints?: {
        audio: boolean;
        video: boolean;
    };
}

/**
 * Options for {@link Session.invite}.
 * @public
 */
export declare interface SessionInviteOptions {
    /** See `core` API. */
    requestDelegate?: OutgoingRequestDelegate;
    /** See `core` API. */
    requestOptions?: RequestOptions;
    sessionDescriptionHandlerModifiers?: Array<SessionDescriptionHandlerModifier>;
    sessionDescriptionHandlerOptions?: SessionDescriptionHandlerOptions;
}

/**
 * Options for {@link Session} constructor.
 * @public
 */
export declare interface SessionOptions {
    delegate?: SessionDelegate;
}

/**
 * {@link Session} state.
 * @remarks
 * Valid state transitions:
 * ```
 * 1. "initial" --> "establishing"
 * 2. "initial" --> "established"
 * 4. "initial" --> "terminating"
 * 4. "initial" --> "terminated"
 * 5. "establishing" --> "established"
 * 6. "establishing" --> "terminating"
 * 7. "establishing" --> "terminated"
 * 8. "established" --> "terminating"
 * 9. "established" --> "terminated"
 * 10. "terminating" --> "terminated"
 * ```
 * @public
 */
export declare enum SessionState {
    Initial = "Initial",
    Establishing = "Establishing",
    Established = "Established",
    Terminating = "Terminating",
    Terminated = "Terminated"
}

/**
 * Session state.
 * @remarks
 * https://tools.ietf.org/html/rfc3261#section-13
 * @public
 */
declare enum SessionState_2 {
    Initial = "Initial",
    Early = "Early",
    AckWait = "AckWait",
    Confirmed = "Confirmed",
    Terminated = "Terminated"
}

declare enum SessionStatus {
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

/**
 * Offer/Answer state.
 * @remarks
 * ```txt
 *         Offer                Answer             RFC    Ini Est Early
 *  -------------------------------------------------------------------
 *  1. INVITE Req.          2xx INVITE Resp.     RFC 3261  Y   Y    N
 *  2. 2xx INVITE Resp.     ACK Req.             RFC 3261  Y   Y    N
 *  3. INVITE Req.          1xx-rel INVITE Resp. RFC 3262  Y   Y    N
 *  4. 1xx-rel INVITE Resp. PRACK Req.           RFC 3262  Y   Y    N
 *  5. PRACK Req.           200 PRACK Resp.      RFC 3262  N   Y    Y
 *  6. UPDATE Req.          2xx UPDATE Resp.     RFC 3311  N   Y    Y
 *
 *       Table 1: Summary of SIP Usage of the Offer/Answer Model
 * ```
 * https://tools.ietf.org/html/rfc6337#section-2.2
 * @public
 */
declare enum SignalingState {
    Initial = "Initial",
    HaveLocalOffer = "HaveLocalOffer",
    HaveRemoteOffer = "HaveRemoteOffer",
    Stable = "Stable",
    Closed = "Closed"
}

/**
 * SIP extension support level.
 * @public
 */
export declare enum SIPExtension {
    Required = "Required",
    Supported = "Supported",
    Unsupported = "Unsupported"
}

/**
 * A subscriber establishes a {@link Subscription} (outgoing SUBSCRIBE).
 *
 * @remarks
 * This is (more or less) an implementation of a "subscriber" as
 * defined in RFC 6665 "SIP-Specific Event Notifications".
 * https://tools.ietf.org/html/rfc6665
 *
 * @example
 * ```ts
 * // Create a new subscriber.
 * const targetURI = new URI("sip", "alice", "example.com");
 * const eventType = "example-name"; // https://www.iana.org/assignments/sip-events/sip-events.xhtml
 * const subscriber = new Subscriber(userAgent, targetURI, eventType);
 *
 * // Add delegate to handle event notifications.
 * subscriber.delegate = {
 *   onNotify: (notification: Notification) => {
 *     // handle notification here
 *   }
 * };
 *
 * // Monitor subscription state changes.
 * subscriber.stateChange.on((newState: SubscriptionState) => {
 *   if (newState === SubscriptionState.Terminated) {
 *     // handle state change here
 *   }
 * });
 *
 * // Attempt to establish the subscription
 * subscriber.subscribe();
 *
 * // Sometime later when done with subscription
 * subscriber.unsubscribe();
 * ```
 *
 * @public
 */
export declare class Subscriber extends Subscription {
    private id;
    private body;
    private context;
    private event;
    private expires;
    private extraHeaders;
    private logger;
    private request;
    private retryAfterTimer;
    private targetURI;
    /**
     * Constructor.
     * @param userAgent - User agent. See {@link UserAgent} for details.
     * @param targetURI - The request URI identifying the subscribed event.
     * @param eventType - The event type identifying the subscribed event.
     * @param options - Options bucket. See {@link SubscriberOptions} for details.
     */
    constructor(userAgent: UserAgent, targetURI: URI, eventType: string, options?: SubscriberOptions);
    /**
     * Destructor.
     * @internal
     */
    dispose(): void;
    /**
     * Subscribe to event notifications.
     *
     * @remarks
     * Send an initial SUBSCRIBE request if no subscription as been established.
     * Sends a re-SUBSCRIBE request if the subscription is "active".
     */
    subscribe(options?: SubscriberSubscribeOptions): Promise<void>;
    /**
     * Unsubscribe.
     * @internal
     */
    unsubscribe(options?: SubscriptionUnsubscribeOptions): Promise<void>;
    /**
     * Alias for `unsubscribe`.
     * @deprecated Use `unsubscribe` instead.
     * @internal
     */
    close(): Promise<void>;
    /**
     * Sends a re-SUBSCRIBE request if the subscription is "active".
     * @deprecated Use `subscribe` instead.
     * @internal
     */
    refresh(): Promise<void>;
    /**
     * Registration of event listeners.
     *
     * @remarks
     * The following events are emitted...
     *  - "accepted" A 200-class final response to a SUBSCRIBE request was received.
     *  - "failed" A non-200-class final response to a SUBSCRIBE request was received.
     *  - "rejected" Emitted immediately after a "failed" event (yes, it's redundant).
     *  - "notify" A NOTIFY request was received.
     *  - SubscriptionState.Terminated The subscription is moving to or has moved to a terminated state.
     *
     * More than one SUBSCRIBE request may be sent, so "accepted", "failed" and "rejected"
     * may be emitted multiple times. However these event will NOT be emitted for SUBSCRIBE
     * requests with expires of zero (unsubscribe requests).
     *
     * Note that a "terminated" event does NOT indicate the subscription is in the "terminated"
     * state as described in RFC 6665. Instead, a SubscriptionState.Terminated event indicates that this class
     * is no longer usable and/or is in the process of becoming no longer usable.
     *
     * The order the events are emitted in is not deterministic. Some examples...
     *  - "accepted" may occur multiple times
     *  - "accepted" may follow "notify" and "notify" may follow "accepted"
     *  - SubscriptionState.Terminated may follow "accepted" and "accepted" may follow SubscriptionState.Terminated
     *  - SubscriptionState.Terminated may follow "notify" and "notify" may follow SubscriptionState.Terminated
     *
     * Hint: Experience suggests one workable approach to utilizing these events
     * is to make use of "notify" and SubscriptionState.Terminated only. That is, call `subscribe()`
     * and if a "notify" occurs then you have a subscription. If a SubscriptionState.Terminated
     * event occurs then either a new subscription failed to be established or an
     * established subscription has terminated or is in the process of terminating.
     * Note that "notify" events may follow a SubscriptionState.Terminated event, but experience
     * suggests it is reasonable to discontinue usage of this class after receipt
     * of a SubscriptionState.Terminated event. The other events are informational, but as they do not
     * arrive in a deterministic manner it is difficult to make use of them otherwise.
     *
     * @param name - Event name.
     * @param callback - Callback.
     * @internal
     */
    on(name: "accepted" | "failed" | "rejected", callback: (message: IncomingResponseMessage, cause: string) => void): this;
    /** @internal */
    on(name: "notify", callback: (notification: {
        request: IncomingRequestMessage;
    }) => void): this;
    /** @internal */
    on(name: "terminated", callback: () => void): this;
    /** @internal */
    emit(event: "accepted" | "failed" | "rejected", message: IncomingResponseMessage, cause: string): boolean;
    /** @internal */
    emit(event: "notify", notification: {
        request: IncomingRequestMessage;
    }): boolean;
    /** @internal */
    emit(event: "terminated"): boolean;
    /** @internal */
    protected onAccepted(response: IncomingResponse): void;
    /** @internal */
    protected onFailed(response?: IncomingResponse): void;
    /** @internal */
    protected onNotify(request: IncomingNotifyRequest): void;
    /** @internal */
    protected onRefresh(request: OutgoingSubscribeRequest): void;
    /** @internal */
    protected onTerminated(): void;
    private initContext;
}

/**
 * Options for {@link Subscriber} constructor.
 * @public
 */
export declare interface SubscriberOptions extends SubscriptionOptions {
    expires?: number;
    extraHeaders?: Array<string>;
    body?: string;
    contentType?: string;
}

/**
 * Options for {@link Subscriber.subscribe}.
 * @public
 */
export declare interface SubscriberSubscribeOptions {
}

/**
 * SUBSCRIBE UAC.
 * @remarks
 * 4.1.  Subscriber Behavior
 * https://tools.ietf.org/html/rfc6665#section-4.1
 *
 * User agent client for installation of a single subscription per SUBSCRIBE request.
 * TODO: Support for installation of multiple subscriptions on forked SUBSCRIBE reqeuests.
 * @public
 */
declare class SubscribeUserAgentClient extends UserAgentClient implements OutgoingSubscribeRequest {
    delegate: OutgoingSubscribeRequestDelegate | undefined;
    /** Dialog created upon receiving the first NOTIFY. */
    private dialog;
    /** Identifier of this user agent client. */
    private subscriberId;
    /** When the subscription expires. Starts as requested expires and updated on 200 and NOTIFY. */
    private subscriptionExpires;
    /** The requested expires for the subscription. */
    private subscriptionExpiresRequested;
    /** Subscription event being targeted. */
    private subscriptionEvent;
    /** Subscription state. */
    private subscriptionState;
    /** Timer N Id. */
    private N;
    constructor(core: UserAgentCore, message: OutgoingRequestMessage, delegate?: OutgoingSubscribeRequestDelegate);
    /**
     * Destructor.
     * Note that Timer N may live on waiting for an initial NOTIFY and
     * the delegate may still receive that NOTIFY. If you don't want
     * that behavior then either clear the delegate so the delegate
     * doesn't get called (a 200 will be sent in response to the NOTIFY)
     * or call `waitNotifyStop` which will clear Timer N and remove this
     * UAC from the core (a 481 will be sent in response to the NOTIFY).
     */
    dispose(): void;
    /**
     * Handle out of dialog NOTIFY assoicated with SUBSCRIBE request.
     * This is the first NOTIFY received after the SUBSCRIBE request.
     * @param uas - User agent server handling the subscription creating NOTIFY.
     */
    onNotify(uas: NotifyUserAgentServer): void;
    waitNotifyStart(): void;
    waitNotifyStop(): void;
    /**
     * Receive a response from the transaction layer.
     * @param message - Incoming response message.
     */
    protected receiveResponse(message: IncomingResponseMessage): void;
    /**
     * To ensure that subscribers do not wait indefinitely for a
     * subscription to be established, a subscriber starts a Timer N, set to
     * 64*T1, when it sends a SUBSCRIBE request.  If this Timer N expires
     * prior to the receipt of a NOTIFY request, the subscriber considers
     * the subscription failed, and cleans up any state associated with the
     * subscription attempt.
     * https://tools.ietf.org/html/rfc6665#section-4.1.2.4
     */
    private timer_N;
}

/**
 * A subscription provides asynchronous {@link Notification} of events.
 *
 * @remarks
 * See {@link Subscriber} for details on establishing a subscription.
 *
 * @public
 */
export declare abstract class Subscription extends EventEmitter {
    /**
     * Property reserved for use by instance owner.
     * @defaultValue `undefined`
     */
    data: any | undefined;
    /**
     * Subscription delegate. See {@link SubscriptionDelegate} for details.
     * @defaultValue `undefined`
     */
    delegate: SubscriptionDelegate | undefined;
    /**
     * If the subscription state is SubscriptionState.Subscribed, the associated subscription dialog. Otherwise undefined.
     * @internal
     */
    dialog: Subscription_2 | undefined;
    /** @internal */
    protected userAgent: UserAgent;
    private _disposed;
    private _logger;
    private _state;
    private _stateEventEmitter;
    /**
     * Constructor.
     * @param userAgent - User agent. See {@link UserAgent} for details.
     * @internal
     */
    protected constructor(userAgent: UserAgent, options?: SubscriptionOptions);
    /**
     * Destructor.
     * @internal
     */
    dispose(): void;
    /**
     * True if disposed.
     * @internal
     */
    readonly disposed: boolean;
    /**
     * Subscription state. See {@link SubscriptionState} for details.
     */
    readonly state: SubscriptionState;
    /**
     * Emits when the subscription `state` property changes.
     */
    readonly stateChange: Emitter<SubscriptionState>;
    /**
     * Sends a re-SUBSCRIBE request if the subscription is "active".
     */
    abstract subscribe(options?: SubscriptionSubscribeOptions): Promise<void>;
    /**
     * Unsubscribe from event notifications.
     *
     * @remarks
     * If the subscription state is SubscriptionState.Subscribed, sends an in dialog SUBSCRIBE request
     * with expires time of zero (an un-subscribe) and terminates the subscription.
     * Otherwise a noop.
     */
    abstract unsubscribe(options?: SubscriptionUnsubscribeOptions): Promise<void>;
    /** @internal */
    protected stateTransition(newState: SubscriptionState): void;
}

/**
 * Subscription.
 * @remarks
 * https://tools.ietf.org/html/rfc6665
 * @public
 */
declare interface Subscription_2 {
    /** Subscription delegate. */
    delegate: SubscriptionDelegate_2 | undefined;
    /** The subscription id. */
    readonly id: string;
    /** Subscription expires. Number of seconds until the subscription expires. */
    readonly subscriptionExpires: number;
    /** Subscription state. */
    readonly subscriptionState: SubscriptionState_2;
    /** If true, refresh subscription prior to expiration. Default is false. */
    autoRefresh: boolean;
    /**
     * Destroy subscription.
     */
    dispose(): void;
    /**
     * Send re-SUBSCRIBE request.
     * Refreshing a subscription and unsubscribing.
     * https://tools.ietf.org/html/rfc6665#section-4.1.2.2
     * @param delegate - Request delegate.
     * @param options - Options bucket
     */
    subscribe(delegate?: OutgoingSubscribeRequestDelegate, options?: RequestOptions): OutgoingSubscribeRequest;
    /**
     * 4.1.2.2.  Refreshing of Subscriptions
     * https://tools.ietf.org/html/rfc6665#section-4.1.2.2
     */
    refresh(): OutgoingSubscribeRequest;
    /**
     * 4.1.2.3.  Unsubscribing
     * https://tools.ietf.org/html/rfc6665#section-4.1.2.3
     */
    unsubscribe(): OutgoingSubscribeRequest;
}

/**
 * Delegate for {@link Subscription}.
 * @public
 */
export declare interface SubscriptionDelegate {
    /**
     * Called upon receiving an incoming in dialog NOTIFY request.
     * @param notification - A notification. See {@link Notification} for details.
     */
    onNotify(notification: Notification): void;
}

/**
 * Subscription delegate.
 * @public
 */
declare interface SubscriptionDelegate_2 {
    /**
     * Receive NOTIFY request. This includes in dialog NOTIFY requests only.
     * Thus the first NOTIFY (the subscription creating NOTIFY) will not be provided.
     * https://tools.ietf.org/html/rfc6665#section-4.1.3
     * @param request - Incoming NOTIFY request.
     */
    onNotify?(request: IncomingNotifyRequest): void;
    /**
     * Sent a SUBSCRIBE request. This includes "auto refresh" in dialog SUBSCRIBE requests only.
     * Thus SUBSCRIBE requests triggered by calls to `refresh()` or `subscribe()` will not be provided.
     * Thus the first SUBSCRIBE (the subscription creating SUBSCRIBE) will not be provided.
     * @param request - Outgoing SUBSCRIBE request.
     */
    onRefresh?(request: OutgoingSubscribeRequest): void;
    /**
     * Subscription termination. This includes non-NOTIFY termination causes only.
     * Thus this will not be called if a NOTIFY is the cause of termination.
     * https://tools.ietf.org/html/rfc6665#section-4.4.1
     */
    onTerminated?(): void;
}

/**
 * Options for {@link Subscription } constructor.
 * @public
 */
export declare interface SubscriptionOptions {
    delegate?: SubscriptionDelegate;
}

/**
 * {@link Subscription} state.
 * @remarks
 * Valid state transitions:
 * ```
 * 1. "initial" --> "notify-wait" --> "subscribed" --> "terminated"
 * 2. "initial" --> "notify-wait" --> "terminated"
 * 3. "initial" --> "terminated"
 * ```
 * @public
 */
export declare enum SubscriptionState {
    Initial = "Initial",
    NotifyWait = "NotifyWait",
    Subscribed = "Subscribed",
    Terminated = "Terminated"
}

/**
 * Subscription state.
 * @remarks
 * https://tools.ietf.org/html/rfc6665#section-4.1.2
 * @public
 */
declare enum SubscriptionState_2 {
    Initial = "Initial",
    NotifyWait = "NotifyWait",
    Pending = "Pending",
    Active = "Active",
    Terminated = "Terminated"
}

/**
 * Options for {@link Subscription.subscribe}.
 * @public
 */
export declare interface SubscriptionSubscribeOptions {
}

/**
 * Options for {@link Subscription.unsubscribe}.
 * @public
 */
export declare interface SubscriptionUnsubscribeOptions {
}

/**
 * Transaction.
 * @remarks
 * SIP is a transactional protocol: interactions between components take
 * place in a series of independent message exchanges.  Specifically, a
 * SIP transaction consists of a single request and any responses to
 * that request, which include zero or more provisional responses and
 * one or more final responses.  In the case of a transaction where the
 * request was an INVITE (known as an INVITE transaction), the
 * transaction also includes the ACK only if the final response was not
 * a 2xx response.  If the response was a 2xx, the ACK is not considered
 * part of the transaction.
 * https://tools.ietf.org/html/rfc3261#section-17
 * @public
 */
declare abstract class Transaction extends EventEmitter {
    private _transport;
    private _user;
    private _id;
    private _state;
    protected logger: Logger;
    protected constructor(_transport: Transport, _user: TransactionUser, _id: string, _state: TransactionState, loggerCategory: string);
    /**
     * Destructor.
     * Once the transaction is in the "terminated" state, it is destroyed
     * immediately and there is no need to call `dispose`. However, if a
     * transaction needs to be ended prematurely, the transaction user may
     * do so by calling this method (for example, perhaps the UA is shutting down).
     * No state transition will occur upon calling this method, all outstanding
     * transmission timers will be cancelled, and use of the transaction after
     * calling `dispose` is undefined.
     */
    dispose(): void;
    /** Transaction id. */
    readonly id: string;
    /** Transaction kind. Deprecated. */
    readonly kind: string;
    /** Transaction state. */
    readonly state: TransactionState;
    /** Transaction transport. */
    readonly transport: Transport;
    /** Subscribe to 'stateChanged' event. */
    on(name: "stateChanged", callback: () => void): this;
    protected logTransportError(error: TransportError, message: string): void;
    protected abstract onTransportError(error: TransportError): void;
    /**
     * Pass message to transport for transmission. If transport fails,
     * the transaction user is notified by callback to onTransportError().
     * @returns
     * Rejects with `TransportError` if transport fails.
     */
    protected send(message: string): Promise<void>;
    protected setState(state: TransactionState): void;
    protected typeToString(): string;
}

/**
 * Transaction state.
 * @public
 */
declare enum TransactionState {
    Accepted = "Accepted",
    Calling = "Calling",
    Completed = "Completed",
    Confirmed = "Confirmed",
    Proceeding = "Proceeding",
    Terminated = "Terminated",
    Trying = "Trying"
}

/**
 * Transaction User (TU).
 * @remarks
 * The layer of protocol processing that resides above the transaction layer.
 * Transaction users include the UAC core, UAS core, and proxy core.
 * https://tools.ietf.org/html/rfc3261#section-5
 * https://tools.ietf.org/html/rfc3261#section-6
 * @public
 */
declare interface TransactionUser {
    /**
     * Logger factory.
     */
    loggerFactory: LoggerFactory;
    /**
     * Callback for notification of transaction state changes.
     *
     * Not called when transaction is constructed, so there is
     * no notification of entering the initial transaction state.
     * Otherwise, called once for each transaction state change.
     * State changes adhere to the following RFCs.
     * https://tools.ietf.org/html/rfc3261#section-17
     * https://tools.ietf.org/html/rfc6026
     */
    onStateChange?: (newState: TransactionState) => void;
    /**
     * Callback for notification of a transport error.
     *
     * If a fatal transport error is reported by the transport layer
     * (generally, due to fatal ICMP errors in UDP or connection failures in
     * TCP), the condition MUST be treated as a 503 (Service Unavailable)
     * status code.
     * https://tools.ietf.org/html/rfc3261#section-8.1.3.1
     * https://tools.ietf.org/html/rfc3261#section-17.1.4
     * https://tools.ietf.org/html/rfc3261#section-17.2.4
     * https://tools.ietf.org/html/rfc6026
     */
    onTransportError?: (error: TransportError) => void;
}

/**
 * Transport.
 * @remarks
 * Abstract transport layer base class.
 * @public
 */
declare abstract class Transport extends EventEmitter {
    server: any;
    protected logger: Logger;
    /**
     * Constructor
     * @param logger - Logger.
     * @param options - Options bucket.
     */
    constructor(logger: Logger, options: any);
    /**
     * Returns the promise designated by the child layer then emits a connected event.
     * Automatically emits an event upon resolution, unless overrideEvent is set. If you
     * override the event in this fashion, you should emit it in your implementation of connectPromise
     * @param options - Options bucket.
     */
    connect(options?: any): Promise<void>;
    /**
     * Returns true if the transport is connected
     */
    abstract isConnected(): boolean;
    /**
     * Sends a message then emits a 'messageSent' event. Automatically emits an
     * event upon resolution, unless data.overrideEvent is set. If you override
     * the event in this fashion, you should emit it in your implementation of sendPromise
     * @param msg - Message.
     * @param options - Options bucket.
     */
    send(msg: string, options?: any): Promise<void>;
    /**
     * Returns the promise designated by the child layer then emits a
     * disconnected event. Automatically emits an event upon resolution,
     * unless overrideEvent is set. If you override the event in this fashion,
     * you should emit it in your implementation of disconnectPromise
     * @param options - Options bucket
     */
    disconnect(options?: any): Promise<void>;
    afterConnected(callback: () => void): void;
    /**
     * Returns a promise which resolves once the UA is connected. DEPRECATION WARNING: just use afterConnected()
     */
    waitForConnected(): Promise<void>;
    /**
     * Called by connect, must return a promise
     * promise must resolve to an object. object supports 1 parameter: overrideEvent - Boolean
     * @param options - Options bucket.
     */
    protected abstract connectPromise(options: any): Promise<any>;
    /**
     * Called by send, must return a promise
     * promise must resolve to an object. object supports 2 parameters: msg - string (mandatory)
     * and overrideEvent - Boolean (optional)
     * @param msg - Message.
     * @param options - Options bucket.
     */
    protected abstract sendPromise(msg: string, options?: any): Promise<any>;
    /**
     * Called by disconnect, must return a promise
     * promise must resolve to an object. object supports 1 parameter: overrideEvent - Boolean
     * @param options - Options bucket.
     */
    protected abstract disconnectPromise(options: any): Promise<any>;
    /**
     * To be called when a message is received
     * @param e - Event
     */
    protected abstract onMessage(e: any): void;
}

/**
 * Transport error.
 * @public
 */
declare class TransportError extends Exception {
    constructor(message?: string);
}

declare enum TypeStrings {
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

declare enum UAStatus {
    STATUS_INIT = 0,
    STATUS_STARTING = 1,
    STATUS_READY = 2,
    STATUS_USER_CLOSED = 3,
    STATUS_NOT_READY = 4
}

/**
 * URI.
 * @public
 */
declare class URI extends Parameters {
    private headers;
    private normal;
    private raw;
    /**
     * Constructor
     * @param scheme -
     * @param user -
     * @param host -
     * @param port -
     * @param parameters -
     * @param headers -
     */
    constructor(scheme: string, user: string, host: string, port?: number, parameters?: any, headers?: any);
    scheme: string;
    user: string | undefined;
    host: string;
    readonly aor: string;
    port: number | undefined;
    setHeader(name: string, value: any): void;
    getHeader(name: string): string | undefined;
    hasHeader(name: string): boolean;
    deleteHeader(header: string): any;
    clearHeaders(): void;
    clone(): URI;
    toRaw(): string;
    toString(): string;
    private readonly _normal;
    private readonly _raw;
    private _toString;
    private escapeUser;
    private headerize;
}

/**
 * A user agent sends and receives requests using a `Transport`.
 *
 * @remarks
 * A user agent (UA) is associated with a user via the user's SIP address of record (AOR)
 * and acts on behalf of that user to send and receive SIP requests. The user agent can
 * register to receive incoming requests, as well as create and send outbound messages.
 * The user agent also maintains the Transport over which its signaling travels.
 *
 * @public
 */
export declare class UserAgent extends EventEmitter {
    /** @internal */
    static readonly C: {
        STATUS_INIT: number;
        STATUS_STARTING: number;
        STATUS_READY: number;
        STATUS_USER_CLOSED: number;
        STATUS_NOT_READY: number;
        CONFIGURATION_ERROR: number;
        NETWORK_ERROR: number;
        ALLOWED_METHODS: string[];
        ACCEPTED_BODY_TYPES: string[];
        MAX_FORWARDS: number;
        TAG_LENGTH: number;
    };
    /** Default user agent options. */
    private static readonly defaultOptions;
    /** Delegate. */
    delegate: UserAgentDelegate | undefined;
    /** @internal */
    data: any;
    /** @internal */
    applicants: {
        [id: string]: Inviter;
    };
    /** @internal */
    publishers: {
        [id: string]: Publisher;
    };
    /** @internal */
    sessions: {
        [id: string]: Session;
    };
    /** @internal */
    subscriptions: {
        [id: string]: Subscription;
    };
    /** @internal */
    status: UAStatus;
    /** @internal */
    transport: Transport;
    /** @internal */
    contact: Contact;
    /** @internal */
    userAgentCore: UserAgentCore;
    /** Logger. */
    private logger;
    /** LoggerFactory. */
    private loggerFactory;
    /** Options. */
    private options;
    private error;
    /** Unload listener. */
    private unloadListener;
    /**
     * Constructs a new instance of the `UserAgent` class.
     * @param options - Options bucket. See {@link UserAgentOptions} for details.
     */
    constructor(options?: UserAgentOptions);
    /**
     * User agent configuration.
     */
    readonly configuration: Required<UserAgentOptions>;
    /**
     * Normalize a string into a valid SIP request URI.
     * @param target - The target.
     */
    makeTargetURI(target: string): URI | undefined;
    /**
     * Connect user agent to network transport.
     * @remarks
     * Connect to the WS server if status = STATUS_INIT.
     * Resume UA after being closed.
     */
    start(): Promise<void>;
    /**
     * Gracefully close.
     * Gracefully disconnect from network transport.
     * @remarks
     * Unregisters and terminates active sessions/subscriptions.
     */
    stop(): Promise<void>;
    /** @internal */
    findSession(request: IncomingRequestMessage): Session | undefined;
    /** @internal */
    getLogger(category: string, label?: string): Logger;
    /** @internal */
    getLoggerFactory(): LoggerFactory;
    /** @internal */
    getSupportedResponseOptions(): Array<string>;
    /** @internal */
    makeInviter(targetURI: URI, options?: InviterOptions): Inviter;
    /** @internal */
    on(name: "invite", callback: (session: Invitation) => void): this;
    /** @internal */
    on(name: "outOfDialogReferRequested", callback: (context: any) => void): this;
    /** @internal */
    on(name: "message", callback: (message: any) => void): this;
    /** @internal */
    on(name: "notify", callback: (request: any) => void): this;
    /** @internal */
    on(name: "subscribe", callback: (subscribe: IncomingSubscribeRequest) => void): this;
    /** @internal */
    on(name: "registered", callback: (response?: any) => void): this;
    /** @internal */
    on(name: "unregistered" | "registrationFailed", callback: (response?: any, cause?: any) => void): this;
    private onTransportError;
    /**
     * Helper function. Sets transport listeners
     */
    private setTransportListeners;
    /**
     * Transport connection event.
     */
    private onTransportConnected;
    /**
     * Handle SIP message received from the transport.
     * @param messageString - The message.
     */
    private onTransportReceiveMsg;
    private initContact;
    private initCore;
}

/**
 * User Agent Client (UAC).
 * @remarks
 * A user agent client is a logical entity
 * that creates a new request, and then uses the client
 * transaction state machinery to send it.  The role of UAC lasts
 * only for the duration of that transaction.  In other words, if
 * a piece of software initiates a request, it acts as a UAC for
 * the duration of that transaction.  If it receives a request
 * later, it assumes the role of a user agent server for the
 * processing of that transaction.
 * https://tools.ietf.org/html/rfc3261#section-6
 * @public
 */
declare class UserAgentClient implements OutgoingRequest {
    private transactionConstructor;
    protected core: UserAgentCore;
    message: OutgoingRequestMessage;
    delegate?: OutgoingRequestDelegate | undefined;
    protected logger: Logger;
    private _transaction;
    private credentials;
    private challenged;
    private stale;
    constructor(transactionConstructor: ClientTransactionConstructor, core: UserAgentCore, message: OutgoingRequestMessage, delegate?: OutgoingRequestDelegate | undefined);
    dispose(): void;
    readonly loggerFactory: LoggerFactory;
    /** The transaction associated with this request. */
    readonly transaction: ClientTransaction;
    /**
     * Since requests other than INVITE are responded to immediately, sending a
     * CANCEL for a non-INVITE request would always create a race condition.
     * A CANCEL request SHOULD NOT be sent to cancel a request other than INVITE.
     * https://tools.ietf.org/html/rfc3261#section-9.1
     * @param options - Cancel options bucket.
     */
    cancel(reason?: string, options?: RequestOptions): OutgoingRequestMessage;
    /**
     * If a 401 (Unauthorized) or 407 (Proxy Authentication Required)
     * response is received, the UAC SHOULD follow the authorization
     * procedures of Section 22.2 and Section 22.3 to retry the request with
     * credentials.
     * https://tools.ietf.org/html/rfc3261#section-8.1.3.5
     * 22 Usage of HTTP Authentication
     * https://tools.ietf.org/html/rfc3261#section-22
     * 22.1 Framework
     * https://tools.ietf.org/html/rfc3261#section-22.1
     * 22.2 User-to-User Authentication
     * https://tools.ietf.org/html/rfc3261#section-22.2
     * 22.3 Proxy-to-User Authentication
     * https://tools.ietf.org/html/rfc3261#section-22.3
     *
     * FIXME: This "guard for and retry the request with credentials"
     * implementation is not complete and at best minimally passable.
     * @param response - The incoming response to guard.
     * @returns True if the program execution is to continue in the branch in question.
     *          Otherwise the request is retried with credentials and current request processing must stop.
     */
    protected authenticationGuard(message: IncomingResponseMessage): boolean;
    /**
     * Receive a response from the transaction layer.
     * @param message - Incoming response message.
     */
    protected receiveResponse(message: IncomingResponseMessage): void;
    private init;
    /**
     * 8.1.3.1 Transaction Layer Errors
     * In some cases, the response returned by the transaction layer will
     * not be a SIP message, but rather a transaction layer error.  When a
     * timeout error is received from the transaction layer, it MUST be
     * treated as if a 408 (Request Timeout) status code has been received.
     * If a fatal transport error is reported by the transport layer
     * (generally, due to fatal ICMP errors in UDP or connection failures in
     * TCP), the condition MUST be treated as a 503 (Service Unavailable)
     * status code.
     * https://tools.ietf.org/html/rfc3261#section-8.1.3.1
     */
    private onRequestTimeout;
    /**
     * 8.1.3.1 Transaction Layer Errors
     * In some cases, the response returned by the transaction layer will
     * not be a SIP message, but rather a transaction layer error.  When a
     * timeout error is received from the transaction layer, it MUST be
     * treated as if a 408 (Request Timeout) status code has been received.
     * If a fatal transport error is reported by the transport layer
     * (generally, due to fatal ICMP errors in UDP or connection failures in
     * TCP), the condition MUST be treated as a 503 (Service Unavailable)
     * status code.
     * https://tools.ietf.org/html/rfc3261#section-8.1.3.1
     */
    private onTransportError;
}

/**
 * User Agent Core.
 * @remarks
 * Core designates the functions specific to a particular type
 * of SIP entity, i.e., specific to either a stateful or stateless
 * proxy, a user agent or registrar.  All cores, except those for
 * the stateless proxy, are transaction users.
 * https://tools.ietf.org/html/rfc3261#section-6
 *
 * UAC Core: The set of processing functions required of a UAC that
 * reside above the transaction and transport layers.
 * https://tools.ietf.org/html/rfc3261#section-6
 *
 * UAS Core: The set of processing functions required at a UAS that
 * resides above the transaction and transport layers.
 * https://tools.ietf.org/html/rfc3261#section-6
 * @public
 */
declare class UserAgentCore {
    /** Configuration. */
    configuration: UserAgentCoreConfiguration;
    /** Delegate. */
    delegate: UserAgentCoreDelegate;
    /** Dialogs. */
    dialogs: Map<string, Dialog>;
    /** Subscribers. */
    subscribers: Map<string, SubscribeUserAgentClient>;
    /** UACs. */
    userAgentClients: Map<string, UserAgentClient>;
    /** UASs. */
    userAgentServers: Map<string, UserAgentServer>;
    private logger;
    /**
     * Constructor.
     * @param configuration - Configuration.
     * @param delegate - Delegate.
     */
    constructor(configuration: UserAgentCoreConfiguration, delegate?: UserAgentCoreDelegate);
    /** Destructor. */
    dispose(): void;
    /** Reset. */
    reset(): void;
    /** Logger factory. */
    readonly loggerFactory: LoggerFactory;
    /** Transport. */
    readonly transport: Transport;
    /**
     * Send INVITE.
     * @param request - Outgoing request.
     * @param delegate - Request delegate.
     */
    invite(request: OutgoingRequestMessage, delegate?: OutgoingInviteRequestDelegate): OutgoingInviteRequest;
    /**
     * Send MESSAGE.
     * @param request - Outgoing request.
     * @param delegate - Request delegate.
     */
    message(request: OutgoingRequestMessage, delegate?: OutgoingRequestDelegate): OutgoingMessageRequest;
    /**
     * Send PUBLISH.
     * @param request - Outgoing request.
     * @param delegate - Request delegate.
     */
    publish(request: OutgoingRequestMessage, delegate?: OutgoingRequestDelegate): OutgoingPublishRequest;
    /**
     * Send REGISTER.
     * @param request - Outgoing request.
     * @param delegate - Request delegate.
     */
    register(request: OutgoingRequestMessage, delegate?: OutgoingRequestDelegate): OutgoingRegisterRequest;
    /**
     * Send SUBSCRIBE.
     * @param request - Outgoing request.
     * @param delegate - Request delegate.
     */
    subscribe(request: OutgoingRequestMessage, delegate?: OutgoingSubscribeRequestDelegate): OutgoingSubscribeRequest;
    /**
     * Send a request.
     * @param request - Outgoing request.
     * @param delegate - Request delegate.
     */
    request(request: OutgoingRequestMessage, delegate?: OutgoingRequestDelegate): OutgoingRequest;
    /**
     * Outgoing request message factory function.
     * @param method - Method.
     * @param requestURI - Request-URI.
     * @param fromURI - From URI.
     * @param toURI - To URI.
     * @param options - Request options.
     * @param extraHeaders - Extra headers to add.
     * @param body - Message body.
     */
    makeOutgoingRequestMessage(method: string, requestURI: URI, fromURI: URI, toURI: URI, options: OutgoingRequestMessageOptions, extraHeaders?: Array<string>, body?: Body): OutgoingRequestMessage;
    /**
     * Handle an incoming request message from the transport.
     * @param message - Incoming request message from transport layer.
     */
    receiveIncomingRequestFromTransport(message: IncomingRequestMessage): void;
    /**
     * Handle an incoming response message from the transport.
     * @param message - Incoming response message from transport layer.
     */
    receiveIncomingResponseFromTransport(message: IncomingResponseMessage): void;
    /**
     * A stateless UAS is a UAS that does not maintain transaction state.
     * It replies to requests normally, but discards any state that would
     * ordinarily be retained by a UAS after a response has been sent.  If a
     * stateless UAS receives a retransmission of a request, it regenerates
     * the response and re-sends it, just as if it were replying to the first
     * instance of the request. A UAS cannot be stateless unless the request
     * processing for that method would always result in the same response
     * if the requests are identical. This rules out stateless registrars,
     * for example.  Stateless UASs do not use a transaction layer; they
     * receive requests directly from the transport layer and send responses
     * directly to the transport layer.
     * https://tools.ietf.org/html/rfc3261#section-8.2.7
     * @param message - Incoming request message to reply to.
     * @param statusCode - Status code to reply with.
     */
    replyStateless(message: IncomingRequestMessage, options: ResponseOptions): OutgoingResponse;
    /**
     * In Section 18.2.1, replace the last paragraph with:
     *
     * Next, the server transport attempts to match the request to a
     * server transaction.  It does so using the matching rules described
     * in Section 17.2.3.  If a matching server transaction is found, the
     * request is passed to that transaction for processing.  If no match
     * is found, the request is passed to the core, which may decide to
     * construct a new server transaction for that request.
     * https://tools.ietf.org/html/rfc6026#section-8.10
     * @param message - Incoming request message from transport layer.
     */
    private receiveRequestFromTransport;
    /**
     * UAC and UAS procedures depend strongly on two factors.  First, based
     * on whether the request or response is inside or outside of a dialog,
     * and second, based on the method of a request.  Dialogs are discussed
     * thoroughly in Section 12; they represent a peer-to-peer relationship
     * between user agents and are established by specific SIP methods, such
     * as INVITE.
     * @param message - Incoming request message.
     */
    private receiveRequest;
    /**
     * Once a dialog has been established between two UAs, either of them
     * MAY initiate new transactions as needed within the dialog.  The UA
     * sending the request will take the UAC role for the transaction.  The
     * UA receiving the request will take the UAS role.  Note that these may
     * be different roles than the UAs held during the transaction that
     * established the dialog.
     * https://tools.ietf.org/html/rfc3261#section-12.2
     * @param message - Incoming request message.
     */
    private receiveInsideDialogRequest;
    /**
     * Assuming all of the checks in the previous subsections are passed,
     * the UAS processing becomes method-specific.
     *  https://tools.ietf.org/html/rfc3261#section-8.2.5
     * @param message - Incoming request message.
     */
    private receiveOutsideDialogRequest;
    /**
     * Responses are first processed by the transport layer and then passed
     * up to the transaction layer.  The transaction layer performs its
     * processing and then passes the response up to the TU.  The majority
     * of response processing in the TU is method specific.  However, there
     * are some general behaviors independent of the method.
     * https://tools.ietf.org/html/rfc3261#section-8.1.3
     * @param message - Incoming response message from transport layer.
     */
    private receiveResponseFromTransport;
}

/**
 * User Agent Core configuration.
 * @public
 */
declare interface UserAgentCoreConfiguration {
    /**
     * Address-of-Record (AOR).
     * @remarks
     * https://tools.ietf.org/html/rfc3261#section-6
     */
    aor: URI;
    /**
     * Contact.
     * @remarks
     * https://tools.ietf.org/html/rfc3261#section-8.1.1.8
     */
    contact: Contact;
    /**
     * From header display name.
     */
    displayName: string;
    /**
     * Logger factory.
     */
    loggerFactory: LoggerFactory;
    /**
     * Force Via header field transport to TCP.
     */
    hackViaTcp: boolean;
    /**
     * Preloaded route set.
     */
    routeSet: Array<string>;
    /**
     * Unique instance id.
     */
    sipjsId: string;
    /**
     * Option tags of supported SIP extenstions.
     */
    supportedOptionTags: Array<string>;
    /**
     * Option tags of supported SIP extenstions.
     * Used in resposnes.
     * @remarks
     * FIXME: Make this go away.
     */
    supportedOptionTagsResponse: Array<string>;
    /**
     * User-Agent header field value.
     * @remarks
     * https://tools.ietf.org/html/rfc3261#section-20.41
     */
    userAgentHeaderFieldValue: string | undefined;
    /**
     * Force use of "rport" Via header field parameter.
     * @remarks
     * https://www.ietf.org/rfc/rfc3581.txt
     */
    viaForceRport: boolean;
    /**
     * Via header field host name or network address.
     * @remarks
     * The Via header field indicates the path taken by the request so far
     * and indicates the path that should be followed in routing responses.
     */
    viaHost: string;
    /**
     * DEPRECATED
     * Authentication factory function.
     */
    authenticationFactory(): DigestAuthentication | undefined;
    /**
     * DEPRECATED: This is a hack to get around `Transport`
     * requiring the `UA` to start for construction.
     */
    transportAccessor(): Transport | undefined;
}

/**
 * User Agent Core delegate.
 * @public
 */
declare interface UserAgentCoreDelegate {
    /**
     * Receive INVITE request.
     * @param request - Incoming INVITE request.
     */
    onInvite?(request: IncomingInviteRequest): void;
    /**
     * Receive MESSAGE request.
     * @param request - Incoming MESSAGE request.
     */
    onMessage?(request: IncomingMessageRequest): void;
    /**
     * DEPRECATED. Receive NOTIFY request.
     * @param message - Incoming NOTIFY request.
     */
    onNotify?(request: IncomingNotifyRequest): void;
    /**
     * Receive REFER request.
     * @param request - Incoming REFER request.
     */
    onRefer?(request: IncomingReferRequest): void;
    /**
     * Receive SUBSCRIBE request.
     * @param request - Incoming SUBSCRIBE request.
     */
    onSubscribe?(request: IncomingSubscribeRequest): void;
}

/**
 * Delegate for {@link UserAgent}.
 * @public
 */
export declare interface UserAgentDelegate {
    /**
     * Called upon receipt of an invitation.
     * @remarks
     * Handler for incoming out of dialog INVITE requests.
     * @param invitation - The invitation.
     */
    onInvite?(invitation: Invitation): void;
    /**
     * Called upon receipt of a message.
     * @remarks
     * Handler for incoming out of dialog MESSAGE requests.
     * @param message - The message.
     */
    onMessage?(message: Message): void;
    /**
     * Called upon receipt of a notification.
     * @remarks
     * Handler for incoming out of dialog NOTIFY requests.
     * @param notification - The notification.
     */
    onNotify?(notification: Notification): void;
    /**
     * Called upon receipt of a referral.
     * @remarks
     * Handler for incoming out of dialog REFER requests.
     * @param referral - The referral.
     */
    onRefer?(referral: Referral): void;
    /**
     * Called upon receipt of a subscription.
     * @remarks
     * Handler for incoming out of dialog SUBSCRIBE requests.
     * @param subscription - The subscription.
     */
    onSubscribe?(subscription: Subscription): void;
}

/**
 * Options for {@link UserAgent} constructor.
 * @public
 */
export declare interface UserAgentOptions {
    /**
     * If `true`, the user agent will accept out of dialog NOTIFY.
     * @remarks
     * RFC 6665 obsoletes the use of out of dialog NOTIFY from RFC 3265.
     * @defaultValue `false`
     */
    allowLegacyNotifications?: boolean;
    /**
     * If `true`, the user agent will accept out of dialog REFER.
     * @defaultValue `false`
     */
    allowOutOfDialogRefers?: boolean;
    /**
     * Authorization password.
     * @defaultValue `""`
     */
    authorizationPassword?: string;
    /**
     * Authorization username.
     * @defaultValue `""`
     */
    authorizationUsername?: string;
    /**
     * If `true`, the user agent calls the `start()` method upon being created.
     * @defaultValue `true`
     */
    autoStart?: boolean;
    /**
     * If `true`, the user  agent calls the `stop()` method on unload (if running in browser window).
     * @defaultValue `true`
     */
    autoStop?: boolean;
    /**
     * Delegate for {@link UserAgent}.
     * @defaultValue `{}`
     */
    delegate?: UserAgentDelegate;
    /**
     * The display name associated with the user agent.
     * @remarks
     * Descriptive name to be shown to the called party when calling or sending IM messages
     * (the display name portion of the From header).
     * It must NOT be enclosed between double quotes even if the given name contains multi-byte symbols
     * (SIPjs will always enclose the `displayName` value between double quotes).
     * @defaultValue `""`
     */
    displayName?: string;
    /**
     * Force adding rport to Via header.
     * @defaultValue `false`
     */
    forceRport?: boolean;
    /**
     * Hack
     * @deprecated TBD
     */
    hackIpInContact?: boolean | string;
    /**
     * Hack
     * @deprecated TBD
     */
    hackAllowUnregisteredOptionTags?: boolean;
    /**
     * Hack
     * @deprecated TBD
     */
    hackViaTcp?: boolean;
    /**
     * Hack
     * @deprecated TBD
     */
    hackWssInTransport?: boolean;
    /**
     * Indicates whether log messages should be written to the browser console.
     * @defaultValue `true`
     */
    logBuiltinEnabled?: boolean;
    /**
     * If true, constructor logs the user agent configuration.
     * @defaultValue `true`
     */
    logConfiguration?: boolean;
    /**
     * A function which will be called everytime a log is generated.
     * @defaultValue
     * A noop if not defined.
     */
    logConnector?: LogConnector;
    /**
     * Indicates the verbosity level of the log messages.
     * @defaultValue `"log"`
     */
    logLevel?: LogLevel;
    /**
     * Number of seconds after which an incoming call is rejected if not answered.
     * @defaultValue 60
     */
    noAnswerTimeout?: number;
    /**
     * A factory for generating `SessionDescriptionHandler` instances.
     * @remarks
     * The factory will be passed a `Session` object for the current session
     * and the `sessionDescriptionHandlerFactoryOptions` object.
     * @defaultValue `Web.SessionDesecriptionHandler.defaultFactory`
     */
    sessionDescriptionHandlerFactory?: SessionDescriptionHandlerFactory;
    /**
     * Options to passed to `sessionDescriptionHandlerFactory`.
     * @remarks
     * See `Web.SessionDesecriptionHandlerOptions` for details.
     * @defaultValue `{}`
     */
    sessionDescriptionHandlerFactoryOptions?: object;
    /**
     * Reliable provisional responses.
     * https://tools.ietf.org/html/rfc3262
     * @defaultValue `SIPExtension.Unsupported`
     */
    sipExtension100rel?: SIPExtension;
    /**
     * Replaces header.
     * https://tools.ietf.org/html/rfc3891
     * @defaultValue `SIPExtension.Unsupported`
     */
    sipExtensionReplaces?: SIPExtension;
    /**
     * Extra option tags to claim support for.
     * @remarks
     * Setting an extra option tag does not enable support for the associated extension
     * it simply adds the tag to the list of supported options.
     * See {@link UserAgentRegisteredOptionTags} for valid option tags.
     * @defaultValue `[]`
     */
    sipExtensionExtraSupported?: Array<string>;
    /**
     * An id uniquely identify this user agent instance.
     * @defaultValue
     * A random id generated by default.
     */
    sipjsId?: string;
    /**
     * A constructor function for the user agent's `Transport`.
     * @remarks
     * For more information about creating your own transport see `Transport`.
     * @defaultValue `WebSocketTransport`
     */
    transportConstructor?: new (logger: any, options: any) => Transport;
    /**
     * An options bucket object passed to `transportConstructor` when instantiated.
     * @remarks
     * See WebSocket Transport Configuration Parameters for the full list of options for the default transport.
     * @defaultValue `{}`
     */
    transportOptions?: any;
    /**
     * SIP URI associated with the user agent.
     * @remarks
     * This is a SIP address given to you by your provider.
     * @defaultValue
     * By default, URI is set to `sip:anonymous.X@anonymous.invalid`, where X is a random token generated for each UA.
     */
    uri?: URI;
    /**
     * Adds a Route header to requests.
     * @defaultValue `false`
     */
    usePreloadedRoute?: boolean;
    /**
     * User agent string used in the UserAgent header.
     * @defaultValue
     * A reasonable value is utilized.
     */
    userAgentString?: string;
    /**
     * Hostname to use in Via header.
     * @defaultValue
     * A random hostname in the .invalid domain.
     */
    viaHost?: string;
}

/**
 * SIP Option Tags
 * @remarks
 * http://www.iana.org/assignments/sip-parameters/sip-parameters.xhtml#sip-parameters-4
 * @public
 */
export declare const UserAgentRegisteredOptionTags: {
    [option: string]: boolean;
};

/**
 * User Agent Server (UAS).
 * @remarks
 * A user agent server is a logical entity
 * that generates a response to a SIP request.  The response
 * accepts, rejects, or redirects the request.  This role lasts
 * only for the duration of that transaction.  In other words, if
 * a piece of software responds to a request, it acts as a UAS for
 * the duration of that transaction.  If it generates a request
 * later, it assumes the role of a user agent client for the
 * processing of that transaction.
 * https://tools.ietf.org/html/rfc3261#section-6
 * @public
 */
declare class UserAgentServer implements IncomingRequest {
    private transactionConstructor;
    protected core: UserAgentCore;
    message: IncomingRequestMessage;
    delegate?: IncomingRequestDelegate | undefined;
    protected logger: Logger;
    protected toTag: string;
    private _transaction;
    constructor(transactionConstructor: ServerTransactionConstructor, core: UserAgentCore, message: IncomingRequestMessage, delegate?: IncomingRequestDelegate | undefined);
    dispose(): void;
    readonly loggerFactory: LoggerFactory;
    /** The transaction associated with this request. */
    readonly transaction: ServerTransaction;
    accept(options?: ResponseOptions): OutgoingResponse;
    progress(options?: ResponseOptions): OutgoingResponse;
    redirect(contacts: Array<URI>, options?: ResponseOptions): OutgoingResponse;
    reject(options?: ResponseOptions): OutgoingResponse;
    trying(options?: ResponseOptions): OutgoingResponse;
    /**
     * If the UAS did not find a matching transaction for the CANCEL
     * according to the procedure above, it SHOULD respond to the CANCEL
     * with a 481 (Call Leg/Transaction Does Not Exist).  If the transaction
     * for the original request still exists, the behavior of the UAS on
     * receiving a CANCEL request depends on whether it has already sent a
     * final response for the original request.  If it has, the CANCEL
     * request has no effect on the processing of the original request, no
     * effect on any session state, and no effect on the responses generated
     * for the original request.  If the UAS has not issued a final response
     * for the original request, its behavior depends on the method of the
     * original request.  If the original request was an INVITE, the UAS
     * SHOULD immediately respond to the INVITE with a 487 (Request
     * Terminated).  A CANCEL request has no impact on the processing of
     * transactions with any other method defined in this specification.
     * https://tools.ietf.org/html/rfc3261#section-9.2
     * @param request - Incoming CANCEL request.
     */
    receiveCancel(message: IncomingRequestMessage): void;
    protected readonly acceptable: boolean;
    protected readonly progressable: boolean;
    protected readonly redirectable: boolean;
    protected readonly rejectable: boolean;
    protected readonly tryingable: boolean;
    /**
     * When a UAS wishes to construct a response to a request, it follows
     * the general procedures detailed in the following subsections.
     * Additional behaviors specific to the response code in question, which
     * are not detailed in this section, may also be required.
     *
     * Once all procedures associated with the creation of a response have
     * been completed, the UAS hands the response back to the server
     * transaction from which it received the request.
     * https://tools.ietf.org/html/rfc3261#section-8.2.6
     * @param statusCode - Status code to reply with.
     * @param options - Reply options bucket.
     */
    private reply;
    private init;
}

export { }
