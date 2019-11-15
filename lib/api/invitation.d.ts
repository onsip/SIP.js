import { IncomingInviteRequest, IncomingRequestMessage, NameAddrHeader } from "../core";
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
    /** @internal */
    body: string | undefined;
    /** @internal */
    localIdentity: NameAddrHeader;
    /** @internal */
    remoteIdentity: NameAddrHeader;
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
    /** Incoming INVITE request message. */
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
     * Called to cleanup session after terminated.
     * Using it here just for the PRACK timeout.
     * @internal
     */
    _close(): void;
    /**
     * Handle CANCEL request.
     * @param message - CANCEL message.
     * @internal
     */
    _onCancel(message: IncomingRequestMessage): void;
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
//# sourceMappingURL=invitation.d.ts.map