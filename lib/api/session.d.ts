/// <reference types="node" />
import { EventEmitter } from "events";
import { C } from "../Constants";
import { Body, IncomingAckRequest, IncomingByeRequest, IncomingInfoRequest, IncomingInviteRequest, IncomingNotifyRequest, IncomingPrackRequest, IncomingReferRequest, IncomingRequestMessage, IncomingResponseMessage, Logger, NameAddrHeader, OutgoingByeRequest, OutgoingInviteRequest, OutgoingRequestDelegate, OutgoingRequestMessage, RequestOptions, Session as SessionDialog } from "../core";
import { SessionStatus, TypeStrings } from "../Enums";
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
 * A session provides real time communication between one or more participants.
 * @public
 */
export declare abstract class Session extends EventEmitter {
    /** @internal */
    static readonly C: typeof SessionStatus;
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
    type: TypeStrings;
    /** @internal */
    userAgent: UserAgent;
    /** @internal */
    logger: Logger;
    /** @internal */
    method: string;
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
    /** DEPRECATED: Session status */
    /** @internal */
    status: SessionStatus;
    /** @internal */
    protected earlySdp: string | undefined;
    /** @internal */
    protected errorListener: ((...args: Array<any>) => void);
    /** @internal */
    protected fromTag: string | undefined;
    /** @internal */
    protected onInfo: ((request: IncomingRequestMessage) => void) | undefined;
    /** @internal */
    protected passedOptions: any;
    /** @internal */
    protected rel100: C.supported;
    /** @internal */
    protected renderbody: string | undefined;
    /** @internal */
    protected rendertype: string | undefined;
    /** @internal */
    protected sessionDescriptionHandlerFactory: SessionDescriptionHandlerFactory;
    /** @internal */
    protected sessionDescriptionHandlerModifiers: Array<SessionDescriptionHandlerModifier> | undefined;
    /** @internal */
    protected sessionDescriptionHandlerOptions: SessionDescriptionHandlerOptions | undefined;
    /** @internal */
    protected expiresTimer: any;
    /** @internal */
    protected userNoAnswerTimer: any;
    private _sessionDescriptionHandler;
    private _state;
    private _stateEventEmitter;
    private pendingReinvite;
    private tones;
    /**
     * Constructor.
     * @param userAgent - User agent. See {@link UserAgent} for details.
     * @internal
     */
    protected constructor(userAgent: UserAgent, options?: SessionOptions);
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    on(event: "SessionDescriptionHandler-created", listener: (sessionDescriptionHandler: SessionDescriptionHandler) => void): this;
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    on(event: "referInviteSent" | "referProgress" | "referAccepted" | "referRequestProgress" | "referRequestAccepted" | "referRequestRejected" | "reinviteAccepted" | "reinviteFailed" | "replaced", listener: (session: Session) => void): this;
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    on(event: "reinvite", listener: (session: Session, request: IncomingRequestMessage) => void): this;
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    on(event: "confirmed" | "notify", listener: (request: IncomingRequestMessage) => void): this;
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    on(event: "ack" | "invite" | "refer", listener: (request: OutgoingRequestMessage) => void): this;
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    on(event: "bye", listener: (request: IncomingRequestMessage | OutgoingRequestMessage) => void): this;
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    on(event: "accepted", listener: (response: string | IncomingResponseMessage, cause: string) => void): this;
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    on(event: "connecting", listener: (request: {
        request: IncomingRequestMessage;
    }) => void): this;
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    on(event: "progress", listener: (response: IncomingResponseMessage | string, reasonPhrase?: any) => void): this;
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    on(event: "failed" | "rejected", listener: (response?: IncomingRequestMessage | IncomingResponseMessage | string, cause?: string) => void): this;
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    on(event: "terminated", listener: (response?: IncomingRequestMessage | IncomingResponseMessage, cause?: string) => void): this;
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    on(event: "renegotiationError", listener: (error: Error) => void): this;
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    on(event: "cancel" | "trackAdded" | "directionChanged" | "referRejected", listener: () => void): this;
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    emit(event: "SessionDescriptionHandler-created", sessionDescriptionHandler: SessionDescriptionHandler): boolean;
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    emit(event: "referInviteSent" | "referRejected" | "referRequestProgress" | "referRequestAccepted" | "referRequestRejected" | "reinviteAccepted" | "reinviteFailed" | "replaced", session: Session): boolean;
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    emit(event: "reinvite", session: Session, request: IncomingRequestMessage): boolean;
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    emit(event: "confirmed" | "notify", request: IncomingRequestMessage): boolean;
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    emit(event: "ack" | "invite" | "refer" | "notify", request: OutgoingRequestMessage): boolean;
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    emit(event: "bye", request: IncomingRequestMessage | OutgoingRequestMessage): boolean;
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    emit(event: "accepted", response?: string | IncomingResponseMessage, cause?: string): boolean;
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    emit(event: "connecting", request: {
        request: IncomingRequestMessage;
    }): boolean;
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    emit(event: "progress", response: IncomingResponseMessage | string, reasonPhrase?: any): boolean;
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    emit(event: "failed" | "rejected", response?: IncomingRequestMessage | IncomingResponseMessage | string, cause?: string): boolean;
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    emit(event: "terminated", response?: IncomingRequestMessage | IncomingResponseMessage, cause?: string): boolean;
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    emit(event: "renegotiationError", error: Error): boolean;
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    emit(event: "cancel" | "trackAdded" | "directionChanged" | "referRejected"): boolean;
    /**
     * Session description handler.
     */
    readonly sessionDescriptionHandler: SessionDescriptionHandler | undefined;
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
     * TODO: This is awkward.
     * Helper function
     * @internal
     */
    byePending(): void;
    /**
     * TODO: This is awkward.
     * Helper function
     * @internal
     */
    byeSent(request: OutgoingByeRequest): void;
    /**
     * Send BYE.
     * @param delegate - Request delegate.
     * @param options - Request options bucket.
     * @internal
     */
    bye(delegate?: OutgoingRequestDelegate, options?: RequestOptions): Promise<OutgoingByeRequest>;
    /**
     * Send INFO.
     * @param delegate - Request delegate.
     * @param options - Request options bucket.
     * @internal
     */
    info(delegate?: OutgoingRequestDelegate, options?: RequestOptions): Promise<OutgoingByeRequest>;
    /**
     * Send REFER.
     * @param delegate - Request delegate.
     * @param options - Request options bucket.
     * @internal
     */
    refer(referrer: Referrer, delegate?: OutgoingRequestDelegate, options?: RequestOptions): Promise<OutgoingByeRequest>;
    /**
     * @internal
     */
    close(): void;
    /**
     * @internal
     */
    onRequestTimeout(): void;
    /**
     * @internal
     */
    onTransportError(): void;
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
     * Unless an `onInviteFailure` delegate is available, the session is terminated on failure.
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
     * @deprecated Legacy state transition.
     * @internal
     */
    protected accepted(response?: IncomingResponseMessage | string, cause?: string): void;
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    protected canceled(): void;
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    protected connecting(request: IncomingRequestMessage): void;
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    protected failed(response: IncomingResponseMessage | IncomingRequestMessage | undefined, cause: string): void;
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    protected rejected(response: IncomingResponseMessage | IncomingRequestMessage, cause: string): void;
    /**
     * @deprecated Legacy state transition.
     * @internal
     */
    protected terminated(message?: IncomingResponseMessage | IncomingRequestMessage, cause?: string): void;
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
}
//# sourceMappingURL=session.d.ts.map