import { Dialog } from "../dialogs";
import { LoggerFactory } from "../log";
import { Body, IncomingRequestMessage, IncomingResponseMessage, OutgoingInviteRequest, OutgoingInviteRequestDelegate, OutgoingMessageRequest, OutgoingPublishRequest, OutgoingRegisterRequest, OutgoingRequest, OutgoingRequestDelegate, OutgoingRequestMessage, OutgoingRequestMessageOptions, OutgoingResponse, OutgoingSubscribeRequest, OutgoingSubscribeRequestDelegate, ResponseOptions, URI } from "../messages";
import { Transport } from "../transport";
import { SubscribeUserAgentClient, UserAgentClient, UserAgentServer } from "../user-agents";
import { UserAgentCoreConfiguration } from "./user-agent-core-configuration";
import { UserAgentCoreDelegate } from "./user-agent-core-delegate";
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
    get loggerFactory(): LoggerFactory;
    /** Transport. */
    get transport(): Transport;
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
//# sourceMappingURL=user-agent-core.d.ts.map