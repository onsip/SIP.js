import { Logger, LoggerFactory } from "../log";
import { IncomingRequest, IncomingRequestDelegate, IncomingRequestMessage, OutgoingResponse, ResponseOptions, URI } from "../messages";
import { ServerTransaction, ServerTransactionUser } from "../transactions";
import { Transport } from "../transport";
import { UserAgentCore } from "../user-agent-core";
declare type ServerTransactionConstructor = new (message: IncomingRequestMessage, transport: Transport, user: ServerTransactionUser) => ServerTransaction;
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
export {};
//# sourceMappingURL=user-agent-server.d.ts.map