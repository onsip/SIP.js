import { AckableIncomingResponseWithSession, Body, IncomingAckRequest, IncomingByeRequest, IncomingInfoRequest, IncomingInviteRequest, IncomingMessageRequest, IncomingNotifyRequest, IncomingPrackRequest, IncomingReferRequest, Logger, NameAddrHeader, OutgoingByeRequest, OutgoingInfoRequest, OutgoingInviteRequest, OutgoingMessageRequest, OutgoingReferRequest, OutgoingRequestDelegate, RequestOptions, Session as SessionDialog, URI } from "../core";
import { Emitter } from "./emitter";
import { Inviter } from "./inviter";
import { InviterOptions } from "./inviter-options";
import { Notification } from "./notification";
import { SessionByeOptions } from "./session-bye-options";
import { SessionDelegate } from "./session-delegate";
import { SessionDescriptionHandler, SessionDescriptionHandlerModifier, SessionDescriptionHandlerOptions } from "./session-description-handler";
import { SessionDescriptionHandlerFactory } from "./session-description-handler-factory";
import { SessionInfoOptions } from "./session-info-options";
import { SessionInviteOptions } from "./session-invite-options";
import { SessionMessageOptions } from "./session-message-options";
import { SessionOptions } from "./session-options";
import { SessionReferOptions } from "./session-refer-options";
import { SessionState } from "./session-state";
import { UserAgent } from "./user-agent";
/**
 * A session provides real time communication between one or more participants.
 *
 * @remarks
 * The transport behaves in a deterministic manner according to the
 * the state defined in {@link SessionState}.
 * @public
 */
export declare abstract class Session {
    /**
     * Property reserved for use by instance owner.
     * @defaultValue `undefined`
     */
    data: unknown;
    /**
     * The session delegate.
     * @defaultValue `undefined`
     */
    delegate: SessionDelegate | undefined;
    /** @internal */
    _contact: string | undefined;
    /** @internal */
    _referral: Inviter | undefined;
    /** @internal */
    _replacee: Session | undefined;
    /** @internal */
    protected _assertedIdentity: NameAddrHeader | undefined;
    /** @internal */
    protected _dialog: SessionDialog | undefined;
    /** @internal */
    protected _referralInviterOptions: InviterOptions | undefined;
    /** @internal */
    protected _renderbody: string | undefined;
    /** @internal */
    protected _rendertype: string | undefined;
    /** If defined, NOTIFYs associated with a REFER subscription are delivered here. */
    private onNotify;
    /** True if there is an outgoing re-INVITE request outstanding. */
    private pendingReinvite;
    /** True if there is an incoming re-INVITE ACK request outstanding. */
    private pendingReinviteAck;
    /** Dialogs session description handler. */
    private _sessionDescriptionHandler;
    /** SDH modifiers for the initial INVITE transaction. */
    private _sessionDescriptionHandlerModifiers;
    /** SDH options for the initial INVITE transaction. */
    private _sessionDescriptionHandlerOptions;
    /** SDH modifiers for re-INVITE transactions. */
    private _sessionDescriptionHandlerModifiersReInvite;
    /** SDH options for re-NVITE transactions.*/
    private _sessionDescriptionHandlerOptionsReInvite;
    /** Session state. */
    private _state;
    /** Session state emitter. */
    private _stateEventEmitter;
    /** User agent. */
    private _userAgent;
    /**
     * The identity of the local user.
     */
    abstract readonly localIdentity: NameAddrHeader;
    /**
     * The identity of the remote user.
     */
    abstract readonly remoteIdentity: NameAddrHeader;
    /**
     * Logger.
     */
    protected abstract logger: Logger;
    /** @internal */
    protected abstract _id: string;
    /**
     * Constructor.
     * @param userAgent - User agent. See {@link UserAgent} for details.
     * @internal
     */
    protected constructor(userAgent: UserAgent, options?: SessionOptions);
    /**
     * Destructor.
     */
    dispose(): Promise<void>;
    /**
     * The asserted identity of the remote user.
     */
    get assertedIdentity(): NameAddrHeader | undefined;
    /**
     * The confirmed session dialog.
     */
    get dialog(): SessionDialog | undefined;
    /**
     * A unique identifier for this session.
     */
    get id(): string;
    /**
     * The session being replace by this one.
     */
    get replacee(): Session | undefined;
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
    get sessionDescriptionHandler(): SessionDescriptionHandler | undefined;
    /**
     * Session description handler factory.
     */
    get sessionDescriptionHandlerFactory(): SessionDescriptionHandlerFactory;
    /**
     * SDH modifiers for the initial INVITE transaction.
     * @remarks
     * Used in all cases when handling the initial INVITE transaction as either UAC or UAS.
     * May be set directly at anytime.
     * May optionally be set via constructor option.
     * May optionally be set via options passed to Inviter.invite() or Invitation.accept().
     */
    get sessionDescriptionHandlerModifiers(): Array<SessionDescriptionHandlerModifier>;
    set sessionDescriptionHandlerModifiers(modifiers: Array<SessionDescriptionHandlerModifier>);
    /**
     * SDH options for the initial INVITE transaction.
     * @remarks
     * Used in all cases when handling the initial INVITE transaction as either UAC or UAS.
     * May be set directly at anytime.
     * May optionally be set via constructor option.
     * May optionally be set via options passed to Inviter.invite() or Invitation.accept().
     */
    get sessionDescriptionHandlerOptions(): SessionDescriptionHandlerOptions;
    set sessionDescriptionHandlerOptions(options: SessionDescriptionHandlerOptions);
    /**
     * SDH modifiers for re-INVITE transactions.
     * @remarks
     * Used in all cases when handling a re-INVITE transaction as either UAC or UAS.
     * May be set directly at anytime.
     * May optionally be set via constructor option.
     * May optionally be set via options passed to Session.invite().
     */
    get sessionDescriptionHandlerModifiersReInvite(): Array<SessionDescriptionHandlerModifier>;
    set sessionDescriptionHandlerModifiersReInvite(modifiers: Array<SessionDescriptionHandlerModifier>);
    /**
     * SDH options for re-INVITE transactions.
     * @remarks
     * Used in all cases when handling a re-INVITE transaction as either UAC or UAS.
     * May be set directly at anytime.
     * May optionally be set via constructor option.
     * May optionally be set via options passed to Session.invite().
     */
    get sessionDescriptionHandlerOptionsReInvite(): SessionDescriptionHandlerOptions;
    set sessionDescriptionHandlerOptionsReInvite(options: SessionDescriptionHandlerOptions);
    /**
     * Session state.
     */
    get state(): SessionState;
    /**
     * Session state change emitter.
     */
    get stateChange(): Emitter<SessionState>;
    /**
     * The user agent.
     */
    get userAgent(): UserAgent;
    /**
     * End the {@link Session}. Sends a BYE.
     * @param options - Options bucket. See {@link SessionByeOptions} for details.
     */
    bye(options?: SessionByeOptions): Promise<OutgoingByeRequest>;
    /**
     * Share {@link Info} with peer. Sends an INFO.
     * @param options - Options bucket. See {@link SessionInfoOptions} for details.
     */
    info(options?: SessionInfoOptions): Promise<OutgoingInfoRequest>;
    /**
     * Renegotiate the session. Sends a re-INVITE.
     * @param options - Options bucket. See {@link SessionInviteOptions} for details.
     */
    invite(options?: SessionInviteOptions): Promise<OutgoingInviteRequest>;
    /**
     * Deliver a {@link Message}. Sends a MESSAGE.
     * @param options - Options bucket. See {@link SessionMessageOptions} for details.
     */
    message(options?: SessionMessageOptions): Promise<OutgoingMessageRequest>;
    /**
     * Proffer a {@link Referral}. Send a REFER.
     * @param referTo - The referral target. If a `Session`, a REFER w/Replaces is sent.
     * @param options - Options bucket. See {@link SessionReferOptions} for details.
     */
    refer(referTo: URI | Session, options?: SessionReferOptions): Promise<OutgoingReferRequest>;
    /**
     * Send BYE.
     * @param delegate - Request delegate.
     * @param options - Request options bucket.
     * @internal
     */
    _bye(delegate?: OutgoingRequestDelegate, options?: RequestOptions): Promise<OutgoingByeRequest>;
    /**
     * Send INFO.
     * @param delegate - Request delegate.
     * @param options - Request options bucket.
     * @internal
     */
    _info(delegate?: OutgoingRequestDelegate, options?: RequestOptions): Promise<OutgoingInfoRequest>;
    /**
     * Send MESSAGE.
     * @param delegate - Request delegate.
     * @param options - Request options bucket.
     * @internal
     */
    _message(delegate?: OutgoingRequestDelegate, options?: RequestOptions): Promise<OutgoingMessageRequest>;
    /**
     * Send REFER.
     * @param onNotify - Notification callback.
     * @param delegate - Request delegate.
     * @param options - Request options bucket.
     * @internal
     */
    _refer(onNotify?: (notification: Notification) => void, delegate?: OutgoingRequestDelegate, options?: RequestOptions): Promise<OutgoingByeRequest>;
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
    protected onAckRequest(request: IncomingAckRequest): Promise<void>;
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
     * Handle in dialog MESSAGE request.
     * @internal
     */
    protected onMessageRequest(request: IncomingMessageRequest): void;
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
    private copyRequestOptions;
    private getReasonHeaderValue;
    private referExtraHeaders;
    private referToString;
}
//# sourceMappingURL=session.d.ts.map