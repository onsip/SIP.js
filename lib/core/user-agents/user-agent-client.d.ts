import { Logger, LoggerFactory } from "../log";
import { IncomingResponseMessage, OutgoingRequest, OutgoingRequestDelegate, OutgoingRequestMessage, RequestOptions } from "../messages";
import { ClientTransaction, ClientTransactionUser } from "../transactions";
import { Transport } from "../transport";
import { UserAgentCore } from "../user-agent-core";
declare type ClientTransactionConstructor = new (message: OutgoingRequestMessage, transport: Transport, user: ClientTransactionUser) => ClientTransaction;
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
     * @param options Cancel options bucket.
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
     * @param response The incoming response to guard.
     * @returns True if the program execution is to continue in the branch in question.
     *          Otherwise the request is retried with credentials and current request processing must stop.
     */
    protected authenticationGuard(message: IncomingResponseMessage): boolean;
    /**
     * Receive a response from the transaction layer.
     * @param message Incoming response message.
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
export {};
