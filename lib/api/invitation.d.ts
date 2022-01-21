import { IncomingInviteRequest, IncomingRequestMessage, Logger, NameAddrHeader } from "../core";
import { InvitationAcceptOptions } from "./invitation-accept-options";
import { InvitationProgressOptions } from "./invitation-progress-options";
import { InvitationRejectOptions } from "./invitation-reject-options";
import { Session } from "./session";
import { UserAgent } from "./user-agent";
/**
 * An invitation is an offer to establish a {@link Session} (incoming INVITE).
 * @public
 */
export declare class Invitation extends Session {
    private incomingInviteRequest;
    /**
     * Logger.
     */
    protected logger: Logger;
    /** @internal */
    protected _id: string;
    /** True if dispose() has been called. */
    private disposed;
    /** INVITE will be rejected if not accepted within a certain period time. */
    private expiresTimer;
    /** True if this Session has been Terminated due to a CANCEL request. */
    private isCanceled;
    /** Are reliable provisional responses required or supported. */
    private rel100;
    /** The current RSeq header value. */
    private rseq;
    /** INVITE will be rejected if final response not sent in a certain period time. */
    private userNoAnswerTimer;
    /** True if waiting for a PRACK before sending a 200 Ok. */
    private waitingForPrack;
    /** A Promise providing a defer when waiting for a PRACK. */
    private waitingForPrackPromise;
    /** Function to resolve when PRACK arrives. */
    private waitingForPrackResolve;
    /** Function to reject when PRACK never arrives. */
    private waitingForPrackReject;
    /** @internal */
    constructor(userAgent: UserAgent, incomingInviteRequest: IncomingInviteRequest);
    /**
     * Destructor.
     */
    dispose(): Promise<void>;
    /**
     * If true, a first provisional response after the 100 Trying
     * will be sent automatically. This is false it the UAC required
     * reliable provisional responses (100rel in Require header) or
     * the user agent configuration has specified to not send an
     * initial response, otherwise it is true. The provisional is sent by
     * calling `progress()` without any options.
     */
    get autoSendAnInitialProvisionalResponse(): boolean;
    /**
     * Initial incoming INVITE request message body.
     */
    get body(): string | undefined;
    /**
     * The identity of the local user.
     */
    get localIdentity(): NameAddrHeader;
    /**
     * The identity of the remote user.
     */
    get remoteIdentity(): NameAddrHeader;
    /**
     * Initial incoming INVITE request message.
     */
    get request(): IncomingRequestMessage;
    /**
     * Accept the invitation.
     *
     * @remarks
     * Accept the incoming INVITE request to start a Session.
     * Replies to the INVITE request with a 200 Ok response.
     * Resolves once the response sent, otherwise rejects.
     *
     * This method may reject for a variety of reasons including
     * the receipt of a CANCEL request before `accept` is able
     * to construct a response.
     * @param options - Options bucket.
     */
    accept(options?: InvitationAcceptOptions): Promise<void>;
    /**
     * Indicate progress processing the invitation.
     *
     * @remarks
     * Report progress to the the caller.
     * Replies to the INVITE request with a 1xx provisional response.
     * Resolves once the response sent, otherwise rejects.
     * @param options - Options bucket.
     */
    progress(options?: InvitationProgressOptions): Promise<void>;
    /**
     * Reject the invitation.
     *
     * @remarks
     * Replies to the INVITE request with a 4xx, 5xx, or 6xx final response.
     * Resolves once the response sent, otherwise rejects.
     *
     * The expectation is that this method is used to reject an INVITE request.
     * That is indeed the case - a call to `progress` followed by `reject` is
     * a typical way to "decline" an incoming INVITE request. However it may
     * also be called after calling `accept` (but only before it completes)
     * which will reject the call and cause `accept` to reject.
     * @param options - Options bucket.
     */
    reject(options?: InvitationRejectOptions): Promise<void>;
    /**
     * Handle CANCEL request.
     *
     * @param message - CANCEL message.
     * @internal
     */
    _onCancel(message: IncomingRequestMessage): void;
    /**
     * Helper function to handle offer/answer in a PRACK.
     */
    private handlePrackOfferAnswer;
    /**
     * A handler for errors which occur while attempting to send 1xx and 2xx responses.
     * In all cases, an attempt is made to reject the request if it is still outstanding.
     * And while there are a variety of things which can go wrong and we log something here
     * for all errors, there are a handful of common exceptions we pay some extra attention to.
     * @param error - The error which occurred.
     */
    private handleResponseError;
    /**
     * Callback for when ACK for a 2xx response is never received.
     * @param session - Session the ACK never arrived for.
     */
    private onAckTimeout;
    /**
     * A version of `accept` which resolves a session when the 200 Ok response is sent.
     * @param options - Options bucket.
     */
    private sendAccept;
    /**
     * A version of `progress` which resolves when the provisional response is sent.
     * @param options - Options bucket.
     */
    private sendProgress;
    /**
     * A version of `progress` which resolves when the provisional response with sdp is sent.
     * @param options - Options bucket.
     */
    private sendProgressWithSDP;
    /**
     * A version of `progress` which resolves when the reliable provisional response is sent.
     * @param options - Options bucket.
     */
    private sendProgressReliable;
    /**
     * A version of `progress` which resolves when the reliable provisional response is acknowledged.
     * @param options - Options bucket.
     */
    private sendProgressReliableWaitForPrack;
    /**
     * A version of `progress` which resolves when a 100 Trying provisional response is sent.
     */
    private sendProgressTrying;
    /**
     * When attempting to accept the INVITE, an invitation waits
     * for any outstanding PRACK to arrive before sending the 200 Ok.
     * It will be waiting on this Promise to resolve which lets it know
     * the PRACK has arrived and it may proceed to send the 200 Ok.
     */
    private waitForArrivalOfPrack;
    /**
     * Here we are resolving the promise which in turn will cause
     * the accept to proceed (it may still fail for other reasons, but...).
     */
    private prackArrived;
    /**
     * Here we are rejecting the promise which in turn will cause
     * the accept to fail and the session to transition to "terminated".
     */
    private prackNeverArrived;
}
//# sourceMappingURL=invitation.d.ts.map