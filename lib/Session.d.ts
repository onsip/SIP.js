/// <reference types="node" />
import { EventEmitter } from "events";
import { ClientContext } from "./ClientContext";
import { C } from "./Constants";
import { Body, IncomingAckRequest, IncomingInviteRequest, IncomingPrackRequest, IncomingRequest, IncomingRequestMessage, IncomingResponseMessage, InviteServerTransaction, Logger, NameAddrHeader, NonInviteServerTransaction, OutgoingRequestMessage, Session as SessionCore, URI } from "./core";
import { SessionStatus, TypeStrings } from "./Enums";
import { ReferClientContext, ReferServerContext } from "./ReferContext";
import { ServerContext } from "./ServerContext";
import { SessionDescriptionHandler, SessionDescriptionHandlerModifier, SessionDescriptionHandlerModifiers, SessionDescriptionHandlerOptions } from "./session-description-handler";
import { SessionDescriptionHandlerFactory } from "./session-description-handler-factory";
import { DTMF } from "./Session/DTMF";
import { UA } from "./UA";
export declare namespace Session {
    interface DtmfOptions {
        extraHeaders?: string[];
        duration?: number;
        interToneGap?: number;
    }
}
export declare abstract class Session extends EventEmitter {
    static readonly C: typeof SessionStatus;
    type: TypeStrings;
    ua: UA;
    logger: Logger;
    method: string;
    body: any;
    status: SessionStatus;
    contentType: string;
    localIdentity: NameAddrHeader;
    remoteIdentity: NameAddrHeader;
    data: any;
    assertedIdentity: NameAddrHeader | undefined;
    id: string;
    contact: string | undefined;
    replacee: InviteClientContext | InviteServerContext | undefined;
    localHold: boolean;
    sessionDescriptionHandler: SessionDescriptionHandler | undefined;
    startTime: Date | undefined;
    endTime: Date | undefined;
    session: SessionCore | undefined;
    protected sessionDescriptionHandlerFactory: SessionDescriptionHandlerFactory;
    protected sessionDescriptionHandlerOptions: any;
    protected rel100: string;
    protected earlySdp: string | undefined;
    protected hasOffer: boolean;
    protected hasAnswer: boolean;
    protected timers: {
        [name: string]: any;
    };
    protected fromTag: string | undefined;
    protected errorListener: ((...args: Array<any>) => void);
    protected renderbody: string | undefined;
    protected rendertype: string | undefined;
    protected modifiers: Array<SessionDescriptionHandlerModifier> | undefined;
    protected passedOptions: any;
    protected onInfo: ((request: IncomingRequestMessage) => void) | undefined;
    private tones;
    private pendingReinvite;
    private referContext;
    protected constructor(sessionDescriptionHandlerFactory: SessionDescriptionHandlerFactory);
    dtmf(tones: string | number, options?: Session.DtmfOptions): this;
    bye(options?: any): this;
    refer(target: string | InviteClientContext | InviteServerContext, options?: any): ReferClientContext;
    /**
     * Sends in dialog request.
     * @param method Request method.
     * @param options Options bucket.
     */
    sendRequest(method: string, options?: any): this;
    close(): this;
    hold(options?: SessionDescriptionHandlerOptions, modifiers?: SessionDescriptionHandlerModifiers): void;
    unhold(options?: SessionDescriptionHandlerOptions, modifiers?: SessionDescriptionHandlerModifiers): void;
    reinvite(options?: any, modifiers?: SessionDescriptionHandlerModifiers): void;
    terminate(options?: any): this;
    onTransportError(): void;
    onRequestTimeout(): void;
    onDialogError(response: IncomingResponseMessage): void;
    on(event: "dtmf", listener: (request: IncomingRequestMessage | OutgoingRequestMessage, dtmf: DTMF) => void): this;
    on(event: "progress", listener: (response: IncomingResponseMessage | string, reasonPhrase?: any) => void): this;
    on(event: "referRequested", listener: (context: ReferServerContext) => void): this;
    on(event: "referInviteSent" | "referProgress" | "referAccepted" | "referRejected" | "referRequestProgress" | "referRequestAccepted" | "referRequestRejected" | "reinvite" | "reinviteAccepted" | "reinviteFailed" | "replaced", listener: (session: Session) => void): this;
    on(event: "SessionDescriptionHandler-created", listener: (sessionDescriptionHandler: SessionDescriptionHandler) => void): this;
    on(event: "accepted", listener: (response: any, cause: C.causes) => void): this;
    on(event: "ack" | "bye" | "confirmed" | "connecting" | "notify", listener: (request: any) => void): this;
    on(event: "dialog", listener: (dialog: any) => void): this;
    on(event: "renegotiationError", listener: (error: any) => void): this;
    on(event: "failed" | "rejected", listener: (response?: any, cause?: C.causes) => void): this;
    on(event: "terminated", listener: (message?: any, cause?: C.causes) => void): this;
    on(event: "cancel" | "trackAdded" | "directionChanged", listener: () => void): this;
    protected onAck(incomingRequest: IncomingAckRequest): void;
    protected receiveRequest(incomingRequest: IncomingRequest): void;
    protected receiveReinvite(incomingRequest: IncomingRequest): void;
    protected sendReinvite(options?: any): void;
    protected failed(response: IncomingResponseMessage | IncomingRequestMessage | undefined, cause: string): this;
    protected rejected(response: IncomingResponseMessage | IncomingRequestMessage, cause: string): this;
    protected canceled(): this;
    protected accepted(response?: IncomingResponseMessage | string, cause?: string): this;
    protected terminated(message?: IncomingResponseMessage | IncomingRequestMessage, cause?: string): this;
    protected connecting(request: IncomingRequestMessage): this;
}
export declare namespace InviteServerContext {
    interface Options {
        /** Array of extra headers added to the INVITE. */
        extraHeaders?: Array<string>;
        /** Options to pass to SessionDescriptionHandler's getDescription() and setDescription(). */
        sessionDescriptionHandlerOptions?: SessionDescriptionHandlerOptions;
        modifiers?: SessionDescriptionHandlerModifiers;
        onInfo?: ((request: IncomingRequestMessage) => void);
        statusCode?: number;
        reasonPhrase?: string;
        body?: any;
        rel100?: boolean;
    }
}
export declare class InviteServerContext extends Session implements ServerContext {
    type: TypeStrings;
    transaction: InviteServerTransaction | NonInviteServerTransaction;
    request: IncomingRequestMessage;
    incomingRequest: IncomingInviteRequest;
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
    constructor(ua: UA, incomingInviteRequest: IncomingInviteRequest);
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
     */
    readonly autoSendAnInitialProvisionalResponse: boolean;
    reply(options?: any): this;
    reject(options?: InviteServerContext.Options): this;
    /**
     * Accept the incoming INVITE request to start a Session.
     * Replies to the INVITE request with a 200 Ok response.
     * @param options Options bucket.
     */
    accept(options?: InviteServerContext.Options): this;
    /**
     * Report progress to the the caller.
     * Replies to the INVITE request with a 1xx provisional response.
     * @param options Options bucket.
     */
    progress(options?: InviteServerContext.Options): this;
    /**
     * Reject an unaccepted incoming INVITE request or send BYE if established session.
     * @param options Options bucket. FIXME: This options bucket needs to be typed.
     */
    terminate(options?: any): this;
    onCancel(message: IncomingRequestMessage): void;
    protected receiveRequest(incomingRequest: IncomingRequest): void;
    protected setupSessionDescriptionHandler(): SessionDescriptionHandler;
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
     * A version of `progress` which resolves when the provisional response with sdp is sent.
     * @param options Options bucket.
     * @throws {ClosedSessionDescriptionHandlerError} The session description handler closed before method completed.
     * @throws {TransactionStateError} The transaction state does not allow for `progress()` to be called.
     *                                 Note that the transaction state can change while this call is in progress.
     */
    private _progressWithSDP;
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
export declare namespace InviteClientContext {
    interface Options {
        /** Anonymous call if true. */
        anonymous?: boolean;
        /** Deprecated. */
        body?: string;
        /** Deprecated. */
        contentType?: string;
        /** Array of extra headers added to the INVITE. */
        extraHeaders?: Array<string>;
        /** If true, send INVITE without SDP. */
        inviteWithoutSdp?: boolean;
        /** Deprecated. */
        onInfo?: any;
        /** Deprecated. */
        params?: {
            fromDisplayName?: string;
            fromTag?: string;
            fromUri?: string | URI;
            toDisplayName?: string;
            toUri?: string | URI;
        };
        /** Deprecated. */
        renderbody?: string;
        /** Deprecated. */
        rendertype?: string;
        /** Options to pass to SessionDescriptionHandler's getDescription() and setDescription(). */
        sessionDescriptionHandlerOptions?: SessionDescriptionHandlerOptions;
    }
}
export declare class InviteClientContext extends Session implements ClientContext {
    type: TypeStrings;
    request: OutgoingRequestMessage;
    protected anonymous: boolean;
    protected inviteWithoutSdp: boolean;
    protected isCanceled: boolean;
    protected received100: boolean;
    private earlyMediaSessionDescriptionHandlers;
    private outgoingInviteRequest;
    constructor(ua: UA, target: string | URI, options?: InviteClientContext.Options, modifiers?: SessionDescriptionHandlerModifiers);
    receiveResponse(response: IncomingResponseMessage): void;
    send(): this;
    invite(): this;
    cancel(options?: any): this;
    terminate(options?: any): this;
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
    /**
     * Handle final response to initial INVITE.
     * @param inviteResponse 2xx response.
     */
    private onAccept;
    /**
     * Handle provisional response to initial INVITE.
     * @param inviteResponse 1xx response.
     */
    private onProgress;
    /**
     * Handle final response to initial INVITE.
     * @param inviteResponse 3xx response.
     */
    private onRedirect;
    /**
     * Handle final response to initial INVITE.
     * @param inviteResponse 4xx, 5xx, or 6xx response.
     */
    private onReject;
    /**
     * Handle final response to initial INVITE.
     * @param inviteResponse 100 response.
     */
    private onTrying;
}
//# sourceMappingURL=Session.d.ts.map