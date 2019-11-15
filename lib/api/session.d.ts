import { AckableIncomingResponseWithSession, Body, IncomingAckRequest, IncomingByeRequest, IncomingInfoRequest, IncomingInviteRequest, IncomingNotifyRequest, IncomingPrackRequest, IncomingReferRequest, IncomingRequestMessage, Logger, NameAddrHeader, OutgoingByeRequest, OutgoingInviteRequest, OutgoingRequestDelegate, RequestOptions, Session as SessionDialog } from "../core";
import { Emitter } from "./emitter";
import { Inviter } from "./inviter";
import { Referrer } from "./referrer";
import { SessionDelegate } from "./session-delegate";
import { BodyAndContentType, SessionDescriptionHandler, SessionDescriptionHandlerModifier, SessionDescriptionHandlerOptions } from "./session-description-handler";
import { SessionDescriptionHandlerFactory } from "./session-description-handler-factory";
import { SessionInviteOptions } from "./session-invite-options";
import { SessionOptions } from "./session-options";
import { SessionState } from "./session-state";
import { UserAgent } from "./user-agent";
/**
 * Deprecated
 * @internal
 */
export declare enum _SessionStatus {
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
 * A session provides real time communication between one or more participants.
 * @public
 */
export declare abstract class Session {
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
    dialog: SessionDialog | undefined;
    /** @internal */
    userAgent: UserAgent;
    /** @internal */
    logger: Logger;
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
    /** True if an error caused session termination. */
    /** @internal */
    isFailed: boolean;
    /** @internal */
    protected earlySdp: string | undefined;
    /** @internal */
    protected fromTag: string | undefined;
    /** @internal */
    protected onInfo: ((request: IncomingRequestMessage) => void) | undefined;
    /** @internal */
    protected passedOptions: any;
    /** @internal */
    protected rel100: "none" | "required" | "supported";
    /** @internal */
    protected renderbody: string | undefined;
    /** @internal */
    protected rendertype: string | undefined;
    /** @internal */
    protected sessionDescriptionHandlerModifiers: Array<SessionDescriptionHandlerModifier> | undefined;
    /** @internal */
    protected sessionDescriptionHandlerOptions: SessionDescriptionHandlerOptions | undefined;
    /** @internal */
    protected status: _SessionStatus;
    /** @internal */
    protected expiresTimer: any;
    /** @internal */
    protected userNoAnswerTimer: any;
    private _sessionDescriptionHandler;
    private _state;
    private _stateEventEmitter;
    private pendingReinvite;
    /**
     * Constructor.
     * @param userAgent - User agent. See {@link UserAgent} for details.
     * @internal
     */
    protected constructor(userAgent: UserAgent, options?: SessionOptions);
    /**
     * Session description handler.
     * @remarks
     * If `this` is an instance of `Invitation`,
     * `sessionDescriptionHandler` will be defined when the session state changes to "established".
     * If `this` is an instance of `Inviter` and an offer was sent in the INVITE,
     * `sessionDescriptionHandler` will be defined when the session state changes to "establishing".
     * If `this` is an instance of `Inviter` and an offer was not sent in the INVITE,
     * `sessionDescriptionHandler` will be defined when the session state changes to "established".
     * Otherwise `undefined`.
     */
    readonly sessionDescriptionHandler: SessionDescriptionHandler | undefined;
    /**
     * Session description handler factory.
     */
    readonly sessionDescriptionHandlerFactory: SessionDescriptionHandlerFactory;
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
     * Send BYE.
     * @param delegate - Request delegate.
     * @param options - Request options bucket.
     * @internal
     */
    _bye(delegate?: OutgoingRequestDelegate, options?: RequestOptions): Promise<OutgoingByeRequest>;
    /**
     * Called to cleanup session after terminated.
     * @internal
     */
    _close(): void;
    /**
     * Send INFO.
     * @param delegate - Request delegate.
     * @param options - Request options bucket.
     * @internal
     */
    _info(delegate?: OutgoingRequestDelegate, options?: RequestOptions): Promise<OutgoingByeRequest>;
    /**
     * Send REFER.
     * @param referrer - Referrer.
     * @param delegate - Request delegate.
     * @param options - Request options bucket.
     * @internal
     */
    refer(referrer: Referrer, delegate?: OutgoingRequestDelegate, options?: RequestOptions): Promise<OutgoingByeRequest>;
    /**
     * Send ACK and then BYE. There are unrecoverable errors which can occur
     * while handling dialog forming and in-dialog INVITE responses and when
     * they occur we ACK the response and send a BYE.
     * Note that the BYE is sent in the dialog associated with the response
     * which is not necessarily `this.dialog`. And, accordingly, the
     * session state is not transitioned to terminated and session is not closed.
     * @param inviteResponse - The response causing the error.
     * @param statusCode - Status code for he reason phrase.
     * @param reasonPhrase - Reason phrase for the BYE.
     * @internal
     */
    protected ackAndBye(response: AckableIncomingResponseWithSession, statusCode?: number, reasonPhrase?: string): void;
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
     * Rollback local/remote offer.
     * @internal
     */
    protected rollbackOffer(): Promise<void>;
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
    private getReasonHeaderValue;
}
//# sourceMappingURL=session.d.ts.map