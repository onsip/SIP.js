import { Body, IncomingInviteRequest, IncomingPrackRequest } from "../Core/messages";
import { InviteServerContext as InviteServerContextBase } from "../Session";
import { SessionDescriptionHandlerModifiers, SessionDescriptionHandlerOptions } from "../session-description-handler";
import { IncomingRequest as IncomingRequestMessage, IncomingResponse as IncomingResponseMessage } from "../SIPMessage";
import { UA } from "../UA";
export declare class InviteServerContext extends InviteServerContextBase {
    private incomingInviteRequest;
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
    private waitingForPrackPromise;
    private waitingForPrackResolve;
    private waitingForPrackReject;
    constructor(ua: UA, incomingInviteRequest: IncomingInviteRequest);
    acceptAndTerminate(message: IncomingResponseMessage, statusCode?: number, reasonPhrase?: string): this;
    createDialog(message: IncomingRequestMessage | IncomingResponseMessage, type: "UAS" | "UAC", early?: boolean): boolean;
    /**
     * Sends in dialog request.
     * @param method Request method.
     * @param options Options bucket.
     */
    sendRequest(method: string, options?: any): this;
    setInvite2xxTimer(message: IncomingRequestMessage, body?: {
        body: string;
        contentType: string;
    }): void;
    setACKTimer(): void;
    /**
     * Accept the incoming INVITE request to start a Session.
     * Replies to the INVITE request with a 200 Ok response.
     * @param options Options bucket.
     */
    accept(options?: InviteServerContextBase.Options): this;
    /**
     * Report progress to the the caller.
     * Replies to the INVITE request with a 1xx provisional response.
     * @param options Options bucket.
     */
    progress(options?: InviteServerContextBase.Options): this;
    /**
     * Reject an unaccepted incoming INVITE request.
     * @param options Options bucket.
     */
    reject(options?: InviteServerContextBase.Options): this;
    /**
     * Reject an unaccepted incoming INVITE request or send BYE if established session.
     * @param options Options bucket. FIXME: This options bucket needs to be typed.
     */
    terminate(options?: any): this;
    protected generateResponseOfferAnswer(options: {
        sessionDescriptionHandlerOptions?: SessionDescriptionHandlerOptions;
        modifiers?: SessionDescriptionHandlerModifiers;
    }): Promise<Body | undefined>;
    protected handlePrackOfferAnswer(request: IncomingPrackRequest, options: {
        sessionDescriptionHandlerOptions?: SessionDescriptionHandlerOptions;
        modifiers?: SessionDescriptionHandlerModifiers;
    }): Promise<Body | undefined>;
    /**
     * Called when session canceled.
     */
    protected canceled(): this;
    /**
     * Called when session terminated.
     * Using it here just for the PRACK timeout.
     */
    protected terminated(message?: IncomingResponseMessage | IncomingRequestMessage, cause?: string): this;
    /**
     * A version of `accept` which resolves a session when the 200 Ok response is sent.
     * @param options Options bucket.
     * @throws {ClosedSessionDescriptionHandlerError} The session description handler closed before method completed.
     * @throws {TransactionStateError} The transaction state does not allow for `accept()` to be called.
     *                                 Note that the transaction state can change while this call is in progress.
     */
    private _accept;
    /**
     * A version of `progress` which resolves when the provisional response is sent.
     * @param options Options bucket.
     * @throws {ClosedSessionDescriptionHandlerError} The session description handler closed before method completed.
     * @throws {TransactionStateError} The transaction state does not allow for `progress()` to be called.
     *                                 Note that the transaction state can change while this call is in progress.
     */
    private _progress;
    /**
     * A version of `progress` which resolves when the reliable provisional response is sent.
     * @param options Options bucket.
     * @throws {ClosedSessionDescriptionHandlerError} The session description handler closed before method completed.
     * @throws {TransactionStateError} The transaction state does not allow for `progress()` to be called.
     *                                 Note that the transaction state can change while this call is in progress.
     */
    private _reliableProgress;
    /**
     * A version of `progress` which resolves when the reliable provisional response is acknowledged.
     * @param options Options bucket.
     * @throws {ClosedSessionDescriptionHandlerError} The session description handler closed before method completed.
     * @throws {TransactionStateError} The transaction state does not allow for `progress()` to be called.
     *                                 Note that the transaction state can change while this call is in progress.
     */
    private _reliableProgressWaitForPrack;
    /**
     * Callback for when ACK for a 2xx response is never received.
     * @param session Session the ACK never arrived for
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
    /**
     * @throws {Exceptions.TerminatedSessionError} The session terminated before being accepted (i.e. cancel arrived).
     */
    private waitForArrivalOfPrack;
    private getOffer;
    private setAnswer;
    private setOfferAndGetAnswer;
    private getSessionDescriptionHandler;
}
