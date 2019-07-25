/**
 * A core library implementing low level SIP protocol elements.
 * @packageDocumentation
 */

/// <reference types="node" />
import { EventEmitter } from 'events';

/**
 * Incoming INVITE response received when request is accepted.
 * @public
 */
export declare interface AckableIncomingResponseWithSession extends IncomingResponse {
    /** Session associated with outgoing request acceptance. */
    readonly session: Session;
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
export declare interface Body {
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
 * BYE UAC.
 * @public
 */
export declare class ByeUserAgentClient extends UserAgentClient implements OutgoingByeRequest {
    constructor(dialog: SessionDialog, delegate?: OutgoingRequestDelegate, options?: RequestOptions);
}

/**
 * BYE UAS.
 * @public
 */
export declare class ByeUserAgentServer extends UserAgentServer implements IncomingByeRequest {
    constructor(dialog: SessionDialog, message: IncomingRequestMessage, delegate?: IncomingRequestDelegate);
}

/**
 * SIP Methods
 * @internal
 */
export declare namespace C {
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
}

/**
 * CANCEL UAC.
 * @public
 */
export declare class CancelUserAgentClient extends UserAgentClient implements OutgoingCancelRequest {
    constructor(core: UserAgentCore, message: OutgoingRequestMessage, delegate?: OutgoingRequestDelegate);
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
export declare abstract class ClientTransaction extends Transaction {
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
export declare interface ClientTransactionUser extends TransactionUser {
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
 * When a UAS wishes to construct a response to a request, it follows
 * the general procedures detailed in the following subsections.
 * Additional behaviors specific to the response code in question, which
 * are not detailed in this section, may also be required.
 * https://tools.ietf.org/html/rfc3261#section-8.2.6
 * @internal
 */
export declare function constructOutgoingResponse(message: IncomingRequestMessage, options: ResponseOptions): OutgoingResponse;

/**
 * Contact.
 * @remarks
 * https://tools.ietf.org/html/rfc3261#section-8.1.1.8
 * This is ported from UA.contact.
 * FIXME: TODO: This is not a great rep for Contact
 * and is used in a kinda hacky way herein.
 * @public
 */
export declare interface Contact {
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
export declare class Dialog {
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
export declare interface DialogState {
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
export declare class DigestAuthentication {
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
 * An Exception is considered a condition that a reasonable application may wish to catch.
 * An Error indicates serious problems that a reasonable application should not try to catch.
 * @public
 */
export declare abstract class Exception extends Error {
    protected constructor(message?: string);
}

/**
 * Create a Body given a legacy body type.
 * @param bodyLegacy - Body Object
 * @internal
 */
export declare function fromBodyLegacy(bodyLegacy: string | {
    body: string;
    contentType: string;
}): Body;

/**
 * Given a message, get a normalized body.
 * The content disposition is inferred if not set.
 * @param message - The message.
 * @internal
 */
export declare function getBody(message: IncomingRequestMessage | IncomingResponseMessage | OutgoingRequestMessage | Body): Body | undefined;

/**
 * Grammar.
 * @internal
 */
export declare namespace Grammar {
    /**
     * Parse.
     * @param input -
     * @param startRule -
     */
    export function parse(input: string, startRule: string): any;
    /**
     * Parse the given string and returns a SIP.NameAddrHeader instance or undefined if
     * it is an invalid NameAddrHeader.
     * @param name_addr_header -
     */
    export function nameAddrHeaderParse(nameAddrHeader: string): NameAddrHeader | undefined;
    /**
     * Parse the given string and returns a SIP.URI instance or undefined if
     * it is an invalid URI.
     * @param uri -
     */
    export function URIParse(uri: string): URI | undefined;
}

/**
 * Incoming ACK request.
 * @public
 */
export declare interface IncomingAckRequest {
    /** The incoming message. */
    readonly message: IncomingRequestMessage;
}

/**
 * Incoming BYE request.
 * @public
 */
export declare interface IncomingByeRequest extends IncomingRequest {
}

/**
 * Incoming BYE response.
 * @public
 */
export declare interface IncomingByeResponse extends IncomingResponse {
}

/**
 * Incoming CANCEL request.
 * @public
 */
export declare interface IncomingCancelRequest extends IncomingRequest {
}

/**
 * Incoming CANCEL response.
 * @public
 */
export declare interface IncomingCancelResponse extends IncomingResponse {
}

/**
 * Incoming INFO request.
 * @public
 */
export declare interface IncomingInfoRequest extends IncomingRequest {
}

/**
 * Incoming INFO response.
 * @public
 */
export declare interface IncomingInfoResponse extends IncomingResponse {
}

/**
 * Incoming INVITE request.
 * @public
 */
export declare interface IncomingInviteRequest extends IncomingRequest {
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
export declare class IncomingMessage {
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
export declare interface IncomingMessageRequest extends IncomingRequest {
}

/**
 * Incoming MESSAGE response.
 * @public
 */
export declare interface IncomingMessageResponse extends IncomingResponse {
}

/**
 * Incoming NOTIFY request.
 * @public
 */
export declare interface IncomingNotifyRequest extends IncomingRequest {
}

/**
 * Incoming NOTIFY response.
 * @public
 */
export declare interface IncomingNotifyResponse extends IncomingResponse {
}

/**
 * Incoming PRACK request.
 * @public
 */
export declare interface IncomingPrackRequest extends IncomingRequest {
}

/**
 * Incoming PRACK response.
 * @public
 */
export declare interface IncomingPrackResponse extends IncomingResponse {
}

/**
 * Incoming PUBLISH request.
 * @public
 */
export declare interface IncomingPublishRequest extends IncomingRequest {
}

/**
 * Incoming PUBLISH response.
 * @public
 */
export declare interface IncomingPublishResponse extends IncomingResponse {
}

/**
 * Incoming REFER request.
 * @public
 */
export declare interface IncomingReferRequest extends IncomingRequest {
}

/**
 * Incoming REFER response.
 * @public
 */
export declare interface IncomingReferResponse extends IncomingResponse {
}

/**
 * Incoming REGISTER request.
 * @public
 */
export declare interface IncomingRegisterRequest extends IncomingRequest {
}

/**
 * Incoming REGISTER response.
 * @public
 */
export declare interface IncomingRegisterResponse extends IncomingResponse {
}

/**
 * A SIP message sent from a remote client to a local server.
 * @remarks
 * For the purpose of invoking a particular operation.
 * https://tools.ietf.org/html/rfc3261#section-7.1
 * @public
 */
export declare interface IncomingRequest {
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
export declare interface IncomingRequestDelegate {
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
export declare class IncomingRequestMessage extends IncomingMessage {
    ruri: URI | undefined;
    constructor();
}

/**
 * Incoming NOTIFY request with associated {@link Subscription}.
 * @public
 */
export declare interface IncomingRequestWithSubscription {
    /** The NOTIFY request which established the subscription. */
    readonly request: IncomingNotifyRequest;
    /** If subscription state is not "terminated", then the subscription. Otherwise undefined. */
    readonly subscription?: Subscription;
}

/**
 * A SIP message sent from a remote server to a local client.
 * @remarks
 * For indicating the status of a request sent from the client to the server.
 * https://tools.ietf.org/html/rfc3261#section-7.2
 * @public
 */
export declare interface IncomingResponse {
    /** The incoming message. */
    readonly message: IncomingResponseMessage;
}

/**
 * Incoming response message.
 * @public
 */
export declare class IncomingResponseMessage extends IncomingMessage {
    statusCode: number | undefined;
    reasonPhrase: string | undefined;
    constructor();
}

/**
 * Incoming SUBSCRIBE request.
 * @public
 */
export declare interface IncomingSubscribeRequest extends IncomingRequest {
}

/**
 * Incoming SUBSCRIBE response.
 * @public
 */
export declare interface IncomingSubscribeResponse extends IncomingResponse {
}

/**
 * INFO UAC.
 * @public
 */
export declare class InfoUserAgentClient extends UserAgentClient implements OutgoingInfoRequest {
    constructor(dialog: SessionDialog, delegate?: OutgoingRequestDelegate, options?: RequestOptions);
}

/**
 * INFO UAS.
 * @public
 */
export declare class InfoUserAgentServer extends UserAgentServer implements IncomingInfoRequest {
    constructor(dialog: SessionDialog, message: IncomingRequestMessage, delegate?: IncomingRequestDelegate);
}

/**
 * INVITE Client Transaction.
 * @remarks
 * The INVITE transaction consists of a three-way handshake.  The client
 * transaction sends an INVITE, the server transaction sends responses,
 * and the client transaction sends an ACK.
 * https://tools.ietf.org/html/rfc3261#section-17.1.1
 * @public
 */
export declare class InviteClientTransaction extends ClientTransaction {
    private B;
    private D;
    private M;
    /**
     * Map of 2xx to-tag to ACK.
     * If value is not undefined, value is the ACK which was sent.
     * If key exists but value is undefined, a 2xx was received but the ACK not yet sent.
     * Otherwise, a 2xx was not (yet) received for this transaction.
     */
    private ackRetransmissionCache;
    /**
     * Constructor.
     * Upon construction, the outgoing request's Via header is updated by calling `setViaHeader`.
     * Then `toString` is called on the outgoing request and the message is sent via the transport.
     * After construction the transaction will be in the "calling" state and the transaction id
     * will equal the branch parameter set in the Via header of the outgoing request.
     * https://tools.ietf.org/html/rfc3261#section-17.1.1
     * @param request - The outgoing INVITE request.
     * @param transport - The transport.
     * @param user - The transaction user.
     */
    constructor(request: OutgoingRequestMessage, transport: Transport, user: ClientTransactionUser);
    /**
     * Destructor.
     */
    dispose(): void;
    /** Transaction kind. Deprecated. */
    readonly kind: string;
    /**
     * ACK a 2xx final response.
     *
     * The transaction includes the ACK only if the final response was not a 2xx response (the
     * transaction will generate and send the ACK to the transport automagically). If the
     * final response was a 2xx, the ACK is not considered part of the transaction (the
     * transaction user needs to generate and send the ACK).
     *
     * This library is not strictly RFC compliant with regard to ACK handling for 2xx final
     * responses. Specifically, retransmissions of ACKs to a 2xx final responses is handled
     * by the transaction layer (instead of the UAC core). The "standard" approach is for
     * the UAC core to receive all 2xx responses and manage sending ACK retransmissions to
     * the transport directly. Herein the transaction layer manages sending ACKs to 2xx responses
     * and any retransmissions of those ACKs as needed.
     *
     * @param ack - The outgoing ACK request.
     */
    ackResponse(ack: OutgoingRequestMessage): void;
    /**
     * Handler for incoming responses from the transport which match this transaction.
     * @param response - The incoming response.
     */
    receiveResponse(response: IncomingResponseMessage): void;
    /**
     * The client transaction SHOULD inform the TU that a transport failure
     * has occurred, and the client transaction SHOULD transition directly
     * to the "Terminated" state.  The TU will handle the failover
     * mechanisms described in [4].
     * https://tools.ietf.org/html/rfc3261#section-17.1.4
     * @param error - The error.
     */
    protected onTransportError(error: TransportError): void;
    /** For logging. */
    protected typeToString(): string;
    private ack;
    /**
     * Execute a state transition.
     * @param newState - New state.
     */
    private stateTransition;
    /**
     * When timer A fires, the client transaction MUST retransmit the
     * request by passing it to the transport layer, and MUST reset the
     * timer with a value of 2*T1.
     * When timer A fires 2*T1 seconds later, the request MUST be
     * retransmitted again (assuming the client transaction is still in this
     * state). This process MUST continue so that the request is
     * retransmitted with intervals that double after each transmission.
     * These retransmissions SHOULD only be done while the client
     * transaction is in the "Calling" state.
     * https://tools.ietf.org/html/rfc3261#section-17.1.1.2
     */
    private timer_A;
    /**
     * If the client transaction is still in the "Calling" state when timer
     * B fires, the client transaction SHOULD inform the TU that a timeout
     * has occurred.  The client transaction MUST NOT generate an ACK.
     * https://tools.ietf.org/html/rfc3261#section-17.1.1.2
     */
    private timer_B;
    /**
     * If Timer D fires while the client transaction is in the "Completed" state,
     * the client transaction MUST move to the "Terminated" state.
     * https://tools.ietf.org/html/rfc6026#section-8.4
     */
    private timer_D;
    /**
     * If Timer M fires while the client transaction is in the "Accepted"
     * state, the client transaction MUST move to the "Terminated" state.
     * https://tools.ietf.org/html/rfc6026#section-8.4
     */
    private timer_M;
}

/**
 * INVITE Server Transaction.
 * @remarks
 * https://tools.ietf.org/html/rfc3261#section-17.2.1
 * @public
 */
export declare class InviteServerTransaction extends ServerTransaction {
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
 * INVITE UAC.
 * @remarks
 * 13 Initiating a Session
 * https://tools.ietf.org/html/rfc3261#section-13
 * 13.1 Overview
 * https://tools.ietf.org/html/rfc3261#section-13.1
 * 13.2 UAC Processing
 * https://tools.ietf.org/html/rfc3261#section-13.2
 * @public
 */
export declare class InviteUserAgentClient extends UserAgentClient implements OutgoingInviteRequest {
    delegate: OutgoingInviteRequestDelegate | undefined;
    private confirmedDialogAcks;
    private confirmedDialogs;
    private earlyDialogs;
    constructor(core: UserAgentCore, message: OutgoingRequestMessage, delegate?: OutgoingInviteRequestDelegate);
    dispose(): void;
    /**
     * Once the INVITE has been passed to the INVITE client transaction, the
     * UAC waits for responses for the INVITE.
     * https://tools.ietf.org/html/rfc3261#section-13.2.2
     * @param incomingResponse - Incoming response to INVITE request.
     */
    protected receiveResponse(message: IncomingResponseMessage): void;
}

/**
 * INVITE UAS.
 * @remarks
 * 13 Initiating a Session
 * https://tools.ietf.org/html/rfc3261#section-13
 * 13.1 Overview
 * https://tools.ietf.org/html/rfc3261#section-13.1
 * 13.3 UAS Processing
 * https://tools.ietf.org/html/rfc3261#section-13.3
 * @public
 */
export declare class InviteUserAgentServer extends UserAgentServer implements IncomingInviteRequest {
    protected core: UserAgentCore;
    /** The confirmed dialog, if any. */
    private confirmedDialog;
    /** The early dialog, if any. */
    private earlyDialog;
    constructor(core: UserAgentCore, message: IncomingRequestMessage, delegate?: IncomingRequestDelegate);
    dispose(): void;
    /**
     * 13.3.1.4 The INVITE is Accepted
     * The UAS core generates a 2xx response.  This response establishes a
     * dialog, and therefore follows the procedures of Section 12.1.1 in
     * addition to those of Section 8.2.6.
     * https://tools.ietf.org/html/rfc3261#section-13.3.1.4
     * @param options - Accept options bucket.
     */
    accept(options?: ResponseOptions): OutgoingResponseWithSession;
    /**
     * 13.3.1.1 Progress
     * If the UAS is not able to answer the invitation immediately, it can
     * choose to indicate some kind of progress to the UAC (for example, an
     * indication that a phone is ringing).  This is accomplished with a
     * provisional response between 101 and 199.  These provisional
     * responses establish early dialogs and therefore follow the procedures
     * of Section 12.1.1 in addition to those of Section 8.2.6.  A UAS MAY
     * send as many provisional responses as it likes.  Each of these MUST
     * indicate the same dialog ID.  However, these will not be delivered
     * reliably.
     *
     * If the UAS desires an extended period of time to answer the INVITE,
     * it will need to ask for an "extension" in order to prevent proxies
     * from canceling the transaction.  A proxy has the option of canceling
     * a transaction when there is a gap of 3 minutes between responses in a
     * transaction.  To prevent cancellation, the UAS MUST send a non-100
     * provisional response at every minute, to handle the possibility of
     * lost provisional responses.
     * https://tools.ietf.org/html/rfc3261#section-13.3.1.1
     * @param options - Progress options bucket.
     */
    progress(options?: ResponseOptions): OutgoingResponseWithSession;
    /**
     * 13.3.1.2 The INVITE is Redirected
     * If the UAS decides to redirect the call, a 3xx response is sent.  A
     * 300 (Multiple Choices), 301 (Moved Permanently) or 302 (Moved
     * Temporarily) response SHOULD contain a Contact header field
     * containing one or more URIs of new addresses to be tried.  The
     * response is passed to the INVITE server transaction, which will deal
     * with its retransmissions.
     * https://tools.ietf.org/html/rfc3261#section-13.3.1.2
     * @param options - Reject options bucket.
     */
    redirect(contacts: Array<URI>, options?: ResponseOptions): OutgoingResponse;
    /**
     * 13.3.1.3 The INVITE is Rejected
     * A common scenario occurs when the callee is currently not willing or
     * able to take additional calls at this end system.  A 486 (Busy Here)
     * SHOULD be returned in such a scenario.
     * https://tools.ietf.org/html/rfc3261#section-13.3.1.3
     * @param options - Reject options bucket.
     */
    reject(options?: ResponseOptions): OutgoingResponse;
}

/**
 * User-Defined Type Guard for Body.
 * @param body - Body to check.
 * @internal
 */
export declare function isBody(body: any): body is Body;

/**
 * Log levels.
 * @public
 */
export declare enum Levels {
    error = 0,
    warn = 1,
    log = 2,
    debug = 3
}

/**
 * Logger.
 * @public
 */
export declare class Logger {
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
export declare class LoggerFactory {
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
 * MESSAGE UAS.
 * @public
 */
export declare class MessageUserAgentClient extends UserAgentClient implements OutgoingMessageRequest {
    constructor(core: UserAgentCore, message: OutgoingRequestMessage, delegate?: OutgoingRequestDelegate);
}

/**
 * MESSAGE UAS.
 * @public
 */
export declare class MessageUserAgentServer extends UserAgentServer implements IncomingMessageRequest {
    protected core: UserAgentCore;
    constructor(core: UserAgentCore, message: IncomingRequestMessage, delegate?: IncomingRequestDelegate);
}

/**
 * Name Address SIP header.
 * @public
 */
export declare class NameAddrHeader extends Parameters {
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
 * Non-INVITE Client Transaction.
 * @remarks
 * Non-INVITE transactions do not make use of ACK.
 * They are simple request-response interactions.
 * https://tools.ietf.org/html/rfc3261#section-17.1.2
 * @public
 */
export declare class NonInviteClientTransaction extends ClientTransaction {
    private F;
    private K;
    /**
     * Constructor
     * Upon construction, the outgoing request's Via header is updated by calling `setViaHeader`.
     * Then `toString` is called on the outgoing request and the message is sent via the transport.
     * After construction the transaction will be in the "calling" state and the transaction id
     * will equal the branch parameter set in the Via header of the outgoing request.
     * https://tools.ietf.org/html/rfc3261#section-17.1.2
     * @param request - The outgoing Non-INVITE request.
     * @param transport - The transport.
     * @param user - The transaction user.
     */
    constructor(request: OutgoingRequestMessage, transport: Transport, user: ClientTransactionUser);
    /**
     * Destructor.
     */
    dispose(): void;
    /** Transaction kind. Deprecated. */
    readonly kind: string;
    /**
     * Handler for incoming responses from the transport which match this transaction.
     * @param response - The incoming response.
     */
    receiveResponse(response: IncomingResponseMessage): void;
    /**
     * The client transaction SHOULD inform the TU that a transport failure has occurred,
     * and the client transaction SHOULD transition directly to the "Terminated" state.
     * The TU will handle the failover mechanisms described in [4].
     * https://tools.ietf.org/html/rfc3261#section-17.1.4
     * @param error - Trasnsport error
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
     * If Timer F fires while the client transaction is still in the
     * "Trying" state, the client transaction SHOULD inform the TU about the
     * timeout, and then it SHOULD enter the "Terminated" state.
     * If timer F fires while in the "Proceeding" state, the TU MUST be informed of
     * a timeout, and the client transaction MUST transition to the terminated state.
     * https://tools.ietf.org/html/rfc3261#section-17.1.2.2
     */
    private timer_F;
    /**
     * If Timer K fires while in this (COMPLETED) state, the client transaction
     * MUST transition to the "Terminated" state.
     * https://tools.ietf.org/html/rfc3261#section-17.1.2.2
     */
    private timer_K;
}

/**
 * Non-INVITE Server Transaction.
 * @remarks
 * https://tools.ietf.org/html/rfc3261#section-17.2.2
 * @public
 */
export declare class NonInviteServerTransaction extends ServerTransaction {
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
 * NOTIFY UAS.
 * @public
 */
export declare class NotifyUserAgentClient extends UserAgentClient implements OutgoingNotifyRequest {
    constructor(dialog: SessionDialog, delegate?: OutgoingRequestDelegate, options?: RequestOptions);
}

/**
 * NOTIFY UAS.
 * @public
 */
export declare class NotifyUserAgentServer extends UserAgentServer implements IncomingNotifyRequest {
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
export declare interface OutgoingAckRequest {
    /** The outgoing message. */
    readonly message: OutgoingRequestMessage;
}

/**
 * Outgoing BYE request.
 * @public
 */
export declare interface OutgoingByeRequest extends OutgoingRequest {
}

/**
 * Outgoing CANCEL request.
 * @public
 */
export declare interface OutgoingCancelRequest extends OutgoingRequest {
}

/**
 * Outgoing INFO request.
 * @public
 */
export declare interface OutgoingInfoRequest extends OutgoingRequest {
}

/**
 * Outgoing INVITE request.
 * @public
 */
export declare interface OutgoingInviteRequest extends OutgoingRequest {
    /** Delegate providing custom handling of this outgoing INVITE request. */
    delegate?: OutgoingInviteRequestDelegate;
}

/**
 * Delegate providing custom handling of outgoing INVITE requests.
 * @public
 */
export declare interface OutgoingInviteRequestDelegate extends OutgoingRequestDelegate {
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
export declare interface OutgoingMessageRequest extends OutgoingRequest {
}

/**
 * Outgoing NOTIFY request.
 * @public
 */
export declare interface OutgoingNotifyRequest extends OutgoingRequest {
}

/**
 * Outgoing PRACK request.
 * @public
 */
export declare interface OutgoingPrackRequest extends OutgoingRequest {
}

/**
 * Outgoing PUBLISH request.
 * @public
 */
export declare interface OutgoingPublishRequest extends OutgoingRequest {
}

/**
 * Outgoing REFER request.
 * @public
 */
export declare interface OutgoingReferRequest extends OutgoingRequest {
}

/**
 * Outgoing REGISTER request.
 * @public
 */
export declare interface OutgoingRegisterRequest extends OutgoingRequest {
}

/**
 * A SIP message sent from a local client to a remote server.
 * @remarks
 * For the purpose of invoking a particular operation.
 * https://tools.ietf.org/html/rfc3261#section-7.1
 * @public
 */
export declare interface OutgoingRequest {
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
export declare interface OutgoingRequestDelegate {
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
export declare class OutgoingRequestMessage {
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
export declare interface OutgoingRequestMessageOptions {
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
export declare interface OutgoingResponse {
    /** The outgoing message. */
    readonly message: string;
}

/**
 * Outgoing INVITE response with the associated {@link Session}.
 * @public
 */
export declare interface OutgoingResponseWithSession extends OutgoingResponse {
    /**
     * Session associated with incoming request acceptance, or
     * Session associated with incoming request progress (if an out of dialog request, an early dialog).
     */
    readonly session: Session;
}

/**
 * Outgoing SUBSCRIBE request.
 * @public
 */
export declare interface OutgoingSubscribeRequest extends OutgoingRequest {
    /** Delegate providing custom handling of this outgoing SUBSCRIBE request. */
    delegate?: OutgoingSubscribeRequestDelegate;
    /** Stop waiting for an inital subscription creating NOTIFY. */
    waitNotifyStop(): void;
}

/**
 * Delegate providing custom handling of outgoing SUBSCRIBE requests.
 * @public
 */
export declare interface OutgoingSubscribeRequestDelegate extends OutgoingRequestDelegate {
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
export declare class Parameters {
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
export declare interface PrackableIncomingResponseWithSession extends IncomingResponse {
    /** Session associated with outgoing request progress. If out of dialog request, an early dialog. */
    readonly session: Session;
    /**
     * Send an PRACK to acknowledge this response.
     * @param options - Request options bucket.
     */
    prack(options?: RequestOptions): OutgoingPrackRequest;
}

/**
 * PRACK UAC.
 * @public
 */
export declare class PrackUserAgentClient extends UserAgentClient implements OutgoingPrackRequest {
    constructor(dialog: SessionDialog, delegate?: OutgoingRequestDelegate, options?: RequestOptions);
}

/**
 * PRACK UAS.
 * @public
 */
export declare class PrackUserAgentServer extends UserAgentServer implements IncomingPrackRequest {
    private dialog;
    constructor(dialog: SessionDialog, message: IncomingRequestMessage, delegate?: IncomingRequestDelegate);
    /**
     * Update the dialog signaling state on a 2xx response.
     * @param options - Options bucket.
     */
    accept(options?: ResponseOptions): OutgoingResponse;
}

/**
 * PUBLISH UAC.
 * @public
 */
export declare class PublishUserAgentClient extends UserAgentClient implements OutgoingPublishRequest {
    constructor(core: UserAgentCore, message: OutgoingRequestMessage, delegate?: OutgoingRequestDelegate);
}

/**
 * REFER UAC.
 * @public
 */
export declare class ReferUserAgentClient extends UserAgentClient implements OutgoingReferRequest {
    constructor(dialog: SessionDialog, delegate?: OutgoingRequestDelegate, options?: RequestOptions);
}

/**
 * REFER UAS.
 * @public
 */
export declare class ReferUserAgentServer extends UserAgentServer implements IncomingReferRequest {
    /**
     * REFER UAS constructor.
     * @param dialogOrCore - Dialog for in dialog REFER, UserAgentCore for out of dialog REFER.
     * @param message - Incoming REFER request message.
     */
    constructor(dialogOrCore: SessionDialog | UserAgentCore, message: IncomingRequestMessage, delegate?: IncomingRequestDelegate);
}

/**
 * REGISTER UAC.
 * @public
 */
export declare class RegisterUserAgentClient extends UserAgentClient implements OutgoingRegisterRequest {
    constructor(core: UserAgentCore, message: OutgoingRequestMessage, delegate?: OutgoingRequestDelegate);
}

/**
 * Re-INVITE UAC.
 * @remarks
 * 14 Modifying an Existing Session
 * https://tools.ietf.org/html/rfc3261#section-14
 * 14.1 UAC Behavior
 * https://tools.ietf.org/html/rfc3261#section-14.1
 * @public
 */
export declare class ReInviteUserAgentClient extends UserAgentClient implements OutgoingInviteRequest {
    delegate: OutgoingInviteRequestDelegate | undefined;
    private dialog;
    constructor(dialog: SessionDialog, delegate?: OutgoingInviteRequestDelegate, options?: RequestOptions);
    protected receiveResponse(message: IncomingResponseMessage): void;
}

/**
 * Re-INVITE UAS.
 * @remarks
 * 14 Modifying an Existing Session
 * https://tools.ietf.org/html/rfc3261#section-14
 * 14.2 UAS Behavior
 * https://tools.ietf.org/html/rfc3261#section-14.2
 * @public
 */
export declare class ReInviteUserAgentServer extends UserAgentServer implements IncomingInviteRequest {
    private dialog;
    constructor(dialog: SessionDialog, message: IncomingRequestMessage, delegate?: IncomingRequestDelegate);
    /**
     * Update the dialog signaling state on a 2xx response.
     * @param options - Options bucket.
     */
    accept(options?: ResponseOptions): OutgoingResponseWithSession;
    /**
     * Update the dialog signaling state on a 1xx response.
     * @param options - Progress options bucket.
     */
    progress(options?: ResponseOptions): OutgoingResponseWithSession;
}

/**
 * Request options bucket.
 * @public
 */
export declare interface RequestOptions {
    /** Extra headers to include in the message. */
    extraHeaders?: Array<string>;
    /** Body to include in the message. */
    body?: Body;
}

/**
 * Response options bucket.
 * @public
 */
export declare interface ResponseOptions {
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
 * Re-SUBSCRIBE UAC.
 * @public
 */
export declare class ReSubscribeUserAgentClient extends UserAgentClient implements OutgoingSubscribeRequest {
    private dialog;
    constructor(dialog: SubscriptionDialog, delegate?: OutgoingRequestDelegate, options?: RequestOptions);
    waitNotifyStop(): void;
    /**
     * Receive a response from the transaction layer.
     * @param message - Incoming response message.
     */
    protected receiveResponse(message: IncomingResponseMessage): void;
}

/**
 * Re-SUBSCRIBE UAS.
 * @public
 */
export declare class ReSubscribeUserAgentServer extends UserAgentServer implements IncomingSubscribeRequest {
    constructor(dialog: Dialog, message: IncomingRequestMessage, delegate?: IncomingRequestDelegate);
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
export declare abstract class ServerTransaction extends Transaction {
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
export declare interface ServerTransactionUser extends TransactionUser {
}

/**
 * Session.
 * @remarks
 * https://tools.ietf.org/html/rfc3261#section-13
 * @public
 */
export declare interface Session {
    /** Session delegate. */
    delegate: SessionDelegate | undefined;
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
    readonly sessionState: SessionState;
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
 * Session delegate.
 * @public
 */
export declare interface SessionDelegate {
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
 * Session Dialog.
 * @public
 */
export declare class SessionDialog extends Dialog implements Session {
    private initialTransaction;
    delegate: SessionDelegate | undefined;
    reinviteUserAgentClient: ReInviteUserAgentClient | undefined;
    reinviteUserAgentServer: ReInviteUserAgentServer | undefined;
    /** The state of the offer/answer exchange. */
    private _signalingState;
    /** The current offer. Undefined unless signaling state HaveLocalOffer, HaveRemoteOffer, of Stable. */
    private _offer;
    /** The current answer. Undefined unless signaling state Stable. */
    private _answer;
    /** True if waiting for an ACK to the initial transaction 2xx (UAS only). */
    private ackWait;
    /** Retransmission timer for 2xx response which confirmed the dialog. */
    private invite2xxTimer;
    /** The rseq of the last reliable response. */
    private rseq;
    private logger;
    constructor(initialTransaction: InviteClientTransaction | InviteServerTransaction, core: UserAgentCore, state: DialogState, delegate?: SessionDelegate);
    dispose(): void;
    readonly sessionState: SessionState;
    /** The state of the offer/answer exchange. */
    readonly signalingState: SignalingState;
    /** The current offer. Undefined unless signaling state HaveLocalOffer, HaveRemoteOffer, of Stable. */
    readonly offer: Body | undefined;
    /** The current answer. Undefined unless signaling state Stable. */
    readonly answer: Body | undefined;
    /** Confirm the dialog. Only matters if dialog is currently early. */
    confirm(): void;
    /** Re-confirm the dialog. Only matters if handling re-INVITE request. */
    reConfirm(): void;
    /**
     * The UAC core MUST generate an ACK request for each 2xx received from
     * the transaction layer.  The header fields of the ACK are constructed
     * in the same way as for any request sent within a dialog (see Section
     * 12) with the exception of the CSeq and the header fields related to
     * authentication.  The sequence number of the CSeq header field MUST be
     * the same as the INVITE being acknowledged, but the CSeq method MUST
     * be ACK.  The ACK MUST contain the same credentials as the INVITE.  If
     * the 2xx contains an offer (based on the rules above), the ACK MUST
     * carry an answer in its body.  If the offer in the 2xx response is not
     * acceptable, the UAC core MUST generate a valid answer in the ACK and
     * then send a BYE immediately.
     * https://tools.ietf.org/html/rfc3261#section-13.2.2.4
     * @param options - ACK options bucket.
     */
    ack(options?: RequestOptions): OutgoingAckRequest;
    /**
     * Terminating a Session
     *
     * This section describes the procedures for terminating a session
     * established by SIP.  The state of the session and the state of the
     * dialog are very closely related.  When a session is initiated with an
     * INVITE, each 1xx or 2xx response from a distinct UAS creates a
     * dialog, and if that response completes the offer/answer exchange, it
     * also creates a session.  As a result, each session is "associated"
     * with a single dialog - the one which resulted in its creation.  If an
     * initial INVITE generates a non-2xx final response, that terminates
     * all sessions (if any) and all dialogs (if any) that were created
     * through responses to the request.  By virtue of completing the
     * transaction, a non-2xx final response also prevents further sessions
     * from being created as a result of the INVITE.  The BYE request is
     * used to terminate a specific session or attempted session.  In this
     * case, the specific session is the one with the peer UA on the other
     * side of the dialog.  When a BYE is received on a dialog, any session
     * associated with that dialog SHOULD terminate.  A UA MUST NOT send a
     * BYE outside of a dialog.  The caller's UA MAY send a BYE for either
     * confirmed or early dialogs, and the callee's UA MAY send a BYE on
     * confirmed dialogs, but MUST NOT send a BYE on early dialogs.
     *
     * However, the callee's UA MUST NOT send a BYE on a confirmed dialog
     * until it has received an ACK for its 2xx response or until the server
     * transaction times out.  If no SIP extensions have defined other
     * application layer states associated with the dialog, the BYE also
     * terminates the dialog.
     *
     * https://tools.ietf.org/html/rfc3261#section-15
     * FIXME: Make these proper Exceptions...
     * @param options - BYE options bucket.
     * @returns
     * Throws `Error` if callee's UA attempts a BYE on an early dialog.
     * Throws `Error` if callee's UA attempts a BYE on a confirmed dialog
     *                while it's waiting on the ACK for its 2xx response.
     */
    bye(delegate?: OutgoingRequestDelegate, options?: RequestOptions): OutgoingByeRequest;
    /**
     * An INFO request can be associated with an Info Package (see
     * Section 5), or associated with a legacy INFO usage (see Section 2).
     *
     * The construction of the INFO request is the same as any other
     * non-target refresh request within an existing invite dialog usage as
     * described in Section 12.2 of RFC 3261.
     * https://tools.ietf.org/html/rfc6086#section-4.2.1
     * @param options - Options bucket.
     */
    info(delegate?: OutgoingRequestDelegate, options?: RequestOptions): OutgoingInfoRequest;
    /**
     * Modifying an Existing Session
     *
     * A successful INVITE request (see Section 13) establishes both a
     * dialog between two user agents and a session using the offer-answer
     * model.  Section 12 explains how to modify an existing dialog using a
     * target refresh request (for example, changing the remote target URI
     * of the dialog).  This section describes how to modify the actual
     * session.  This modification can involve changing addresses or ports,
     * adding a media stream, deleting a media stream, and so on.  This is
     * accomplished by sending a new INVITE request within the same dialog
     * that established the session.  An INVITE request sent within an
     * existing dialog is known as a re-INVITE.
     *
     *    Note that a single re-INVITE can modify the dialog and the
     *    parameters of the session at the same time.
     *
     * Either the caller or callee can modify an existing session.
     * https://tools.ietf.org/html/rfc3261#section-14
     * @param options - Options bucket
     */
    invite(delegate?: OutgoingInviteRequestDelegate, options?: RequestOptions): OutgoingInviteRequest;
    /**
     * The NOTIFY mechanism defined in [2] MUST be used to inform the agent
     * sending the REFER of the status of the reference.
     * https://tools.ietf.org/html/rfc3515#section-2.4.4
     * @param options - Options bucket.
     */
    notify(delegate?: OutgoingRequestDelegate, options?: RequestOptions): OutgoingNotifyRequest;
    /**
     * Assuming the response is to be transmitted reliably, the UAC MUST
     * create a new request with method PRACK.  This request is sent within
     * the dialog associated with the provisional response (indeed, the
     * provisional response may have created the dialog).  PRACK requests
     * MAY contain bodies, which are interpreted according to their type and
     * disposition.
     * https://tools.ietf.org/html/rfc3262#section-4
     * @param options - Options bucket.
     */
    prack(delegate?: OutgoingRequestDelegate, options?: RequestOptions): OutgoingPrackRequest;
    /**
     * REFER is a SIP request and is constructed as defined in [1].  A REFER
     * request MUST contain exactly one Refer-To header field value.
     * https://tools.ietf.org/html/rfc3515#section-2.4.1
     * @param options - Options bucket.
     */
    refer(delegate?: OutgoingRequestDelegate, options?: RequestOptions): OutgoingReferRequest;
    /**
     * Requests sent within a dialog, as any other requests, are atomic.  If
     * a particular request is accepted by the UAS, all the state changes
     * associated with it are performed.  If the request is rejected, none
     * of the state changes are performed.
     * https://tools.ietf.org/html/rfc3261#section-12.2.2
     * @param message - Incoming request message within this dialog.
     */
    receiveRequest(message: IncomingRequestMessage): void;
    reliableSequenceGuard(message: IncomingResponseMessage): boolean;
    /**
     * Update the signaling state of the dialog.
     * @param message - The message to base the update off of.
     */
    signalingStateTransition(message: IncomingRequestMessage | IncomingResponseMessage | OutgoingRequestMessage | Body): void;
    private start2xxRetransmissionTimer;
    private startReInvite2xxRetransmissionTimer;
}

/**
 * Session state.
 * @remarks
 * https://tools.ietf.org/html/rfc3261#section-13
 * @public
 */
export declare enum SessionState {
    Initial = "Initial",
    Early = "Early",
    AckWait = "AckWait",
    Confirmed = "Confirmed",
    Terminated = "Terminated"
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
export declare enum SignalingState {
    Initial = "Initial",
    HaveLocalOffer = "HaveLocalOffer",
    HaveRemoteOffer = "HaveRemoteOffer",
    Stable = "Stable",
    Closed = "Closed"
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
export declare class SubscribeUserAgentClient extends UserAgentClient implements OutgoingSubscribeRequest {
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
 * SUBSCRIBE UAS.
 * @public
 */
export declare class SubscribeUserAgentServer extends UserAgentServer implements IncomingSubscribeRequest {
    protected core: UserAgentCore;
    constructor(core: UserAgentCore, message: IncomingRequestMessage, delegate?: IncomingRequestDelegate);
}

/**
 * Subscription.
 * @remarks
 * https://tools.ietf.org/html/rfc6665
 * @public
 */
export declare interface Subscription {
    /** Subscription delegate. */
    delegate: SubscriptionDelegate | undefined;
    /** The subscription id. */
    readonly id: string;
    /** Subscription expires. Number of seconds until the subscription expires. */
    readonly subscriptionExpires: number;
    /** Subscription state. */
    readonly subscriptionState: SubscriptionState;
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
 * Subscription delegate.
 * @public
 */
export declare interface SubscriptionDelegate {
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
 * Subscription Dialog.
 * @remarks
 * SIP-Specific Event Notification
 *
 * Abstract
 *
 *    This document describes an extension to the Session Initiation
 *    Protocol (SIP) defined by RFC 3261.  The purpose of this extension is
 *    to provide an extensible framework by which SIP nodes can request
 *    notification from remote nodes indicating that certain events have
 *    occurred.
 *
 *    Note that the event notification mechanisms defined herein are NOT
 *    intended to be a general-purpose infrastructure for all classes of
 *    event subscription and notification.
 *
 *    This document represents a backwards-compatible improvement on the
 *    original mechanism described by RFC 3265, taking into account several
 *    years of implementation experience.  Accordingly, this document
 *    obsoletes RFC 3265.  This document also updates RFC 4660 slightly to
 *    accommodate some small changes to the mechanism that were discussed
 *    in that document.
 *
 *  https://tools.ietf.org/html/rfc6665
 * @public
 */
export declare class SubscriptionDialog extends Dialog implements Subscription {
    /**
     * When a UAC receives a response that establishes a dialog, it
     * constructs the state of the dialog.  This state MUST be maintained
     * for the duration of the dialog.
     * https://tools.ietf.org/html/rfc3261#section-12.1.2
     * @param outgoingRequestMessage - Outgoing request message for dialog.
     * @param incomingResponseMessage - Incoming response message creating dialog.
     */
    static initialDialogStateForSubscription(outgoingSubscribeRequestMessage: OutgoingRequestMessage, incomingNotifyRequestMessage: IncomingRequestMessage): DialogState;
    delegate: SubscriptionDelegate | undefined;
    private _autoRefresh;
    private _subscriptionEvent;
    private _subscriptionExpires;
    private _subscriptionExpiresInitial;
    private _subscriptionExpiresLastSet;
    private _subscriptionRefresh;
    private _subscriptionRefreshLastSet;
    private _subscriptionState;
    private logger;
    private N;
    private refreshTimer;
    constructor(subscriptionEvent: string, subscriptionExpires: number, subscriptionState: SubscriptionState, core: UserAgentCore, state: DialogState, delegate?: SubscriptionDelegate);
    dispose(): void;
    autoRefresh: boolean;
    readonly subscriptionEvent: string;
    /** Number of seconds until subscription expires. */
    subscriptionExpires: number;
    readonly subscriptionExpiresInitial: number;
    /** Number of seconds until subscription auto refresh. */
    readonly subscriptionRefresh: number | undefined;
    readonly subscriptionState: SubscriptionState;
    /**
     * Receive in dialog request message from transport.
     * @param message -  The incoming request message.
     */
    receiveRequest(message: IncomingRequestMessage): void;
    /**
     * 4.1.2.2.  Refreshing of Subscriptions
     * https://tools.ietf.org/html/rfc6665#section-4.1.2.2
     */
    refresh(): OutgoingSubscribeRequest;
    /**
     * 4.1.2.2.  Refreshing of Subscriptions
     * https://tools.ietf.org/html/rfc6665#section-4.1.2.2
     * @param delegate - Delegate to handle responses.
     * @param options - Options bucket.
     */
    subscribe(delegate?: OutgoingSubscribeRequestDelegate, options?: RequestOptions): OutgoingSubscribeRequest;
    /**
     * 4.4.1.  Dialog Creation and Termination
     * A subscription is destroyed after a notifier sends a NOTIFY request
     * with a "Subscription-State" of "terminated", or in certain error
     * situations described elsewhere in this document.
     * https://tools.ietf.org/html/rfc6665#section-4.4.1
     */
    terminate(): void;
    /**
     * 4.1.2.3.  Unsubscribing
     * https://tools.ietf.org/html/rfc6665#section-4.1.2.3
     */
    unsubscribe(): OutgoingSubscribeRequest;
    /**
     * Handle in dialog NOTIFY requests.
     * This does not include the first NOTIFY which created the dialog.
     * @param message - The incoming NOTIFY request message.
     */
    private onNotify;
    private onRefresh;
    private onTerminated;
    private refreshTimerClear;
    private refreshTimerSet;
    private stateTransition;
    /**
     * When refreshing a subscription, a subscriber starts Timer N, set to
     * 64*T1, when it sends the SUBSCRIBE request.  If this Timer N expires
     * prior to the receipt of a NOTIFY request, the subscriber considers
     * the subscription terminated.  If the subscriber receives a success
     * response to the SUBSCRIBE request that indicates that no NOTIFY
     * request will be generated -- such as the 204 response defined for use
     * with the optional extension described in [RFC5839] -- then it MUST
     * cancel Timer N.
     * https://tools.ietf.org/html/rfc6665#section-4.1.2.2
     */
    private timer_N;
}

/**
 * Subscription state.
 * @remarks
 * https://tools.ietf.org/html/rfc6665#section-4.1.2
 * @public
 */
export declare enum SubscriptionState {
    Initial = "Initial",
    NotifyWait = "NotifyWait",
    Pending = "Pending",
    Active = "Active",
    Terminated = "Terminated"
}

/**
 * Timers.
 * @public
 */
export declare const Timers: {
    T1: number;
    T2: number;
    T4: number;
    TIMER_B: number;
    TIMER_D: number;
    TIMER_F: number;
    TIMER_H: number;
    TIMER_I: number;
    TIMER_J: number;
    TIMER_K: number;
    TIMER_L: number;
    TIMER_M: number;
    TIMER_N: number;
    PROVISIONAL_RESPONSE_INTERVAL: number;
};

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
export declare abstract class Transaction extends EventEmitter {
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
export declare enum TransactionState {
    Accepted = "Accepted",
    Calling = "Calling",
    Completed = "Completed",
    Confirmed = "Confirmed",
    Proceeding = "Proceeding",
    Terminated = "Terminated",
    Trying = "Trying"
}

/**
 * Indicates that the operation could not be completed given the current transaction state.
 * @public
 */
export declare class TransactionStateError extends Exception {
    constructor(message?: string);
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
export declare interface TransactionUser {
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
export declare abstract class Transport extends EventEmitter {
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
export declare class TransportError extends Exception {
    constructor(message?: string);
}

/**
 * URI.
 * @public
 */
export declare class URI extends Parameters {
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
export declare class UserAgentClient implements OutgoingRequest {
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
export declare class UserAgentCore {
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
export declare interface UserAgentCoreConfiguration {
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
export declare interface UserAgentCoreDelegate {
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
export declare class UserAgentServer implements IncomingRequest {
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
