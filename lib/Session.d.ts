/// <reference types="node" />
import { EventEmitter } from "events";
import { ClientContext } from "./ClientContext";
import { C } from "./Constants";
import { Dialog } from "./Dialogs";
import { SessionStatus, TypeStrings } from "./Enums";
import { Logger } from "./LoggerFactory";
import { NameAddrHeader } from "./NameAddrHeader";
import { ServerContext } from "./ServerContext";
import { SessionDescriptionHandler, SessionDescriptionHandlerModifier, SessionDescriptionHandlerModifiers, SessionDescriptionHandlerOptions } from "./session-description-handler";
import { SessionDescriptionHandlerFactory } from "./session-description-handler-factory";
import { DTMF } from "./Session/DTMF";
import { IncomingRequest, IncomingResponse, OutgoingRequest } from "./SIPMessage";
import { InviteServerTransaction, NonInviteServerTransaction } from "./Transactions";
import { UA } from "./UA";
import { URI } from "./URI";
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
    dialog: Dialog | undefined;
    localHold: boolean;
    sessionDescriptionHandler: SessionDescriptionHandler | undefined;
    startTime: Date | undefined;
    endTime: Date | undefined;
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
    protected earlyDialogs: {
        [name: string]: any;
    };
    protected passedOptions: any;
    protected onInfo: ((request: IncomingRequest) => void) | undefined;
    private tones;
    private pendingReinvite;
    private referContext;
    private toTag;
    private originalReceiveRequest;
    protected constructor(sessionDescriptionHandlerFactory: SessionDescriptionHandlerFactory);
    dtmf(tones: string | number, options?: Session.DtmfOptions): this;
    bye(options?: any): this;
    refer(target: string | InviteClientContext | InviteServerContext, options?: any): ReferClientContext;
    sendRequest(method: string, options?: any): this;
    close(): this;
    createDialog(message: IncomingRequest | IncomingResponse, type: "UAS" | "UAC", early?: boolean): boolean;
    hold(options?: SessionDescriptionHandlerOptions, modifiers?: SessionDescriptionHandlerModifiers): void;
    unhold(options?: SessionDescriptionHandlerOptions, modifiers?: SessionDescriptionHandlerModifiers): void;
    reinvite(options?: any, modifiers?: SessionDescriptionHandlerModifiers): void;
    receiveRequest(request: IncomingRequest): void;
    terminate(options?: any): this;
    onTransportError(): void;
    onRequestTimeout(): void;
    onDialogError(response: IncomingResponse): void;
    on(event: "dtmf", listener: (request: IncomingRequest | OutgoingRequest, dtmf: DTMF) => void): this;
    on(event: "progress", listener: (response: IncomingRequest, reasonPhrase?: any) => void): this;
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
    protected receiveReinvite(request: IncomingRequest): void;
    protected sendReinvite(options?: any): void;
    protected receiveReinviteResponse(response: IncomingResponse): void;
    protected acceptAndTerminate(response: IncomingResponse, statusCode?: number, reasonPhrase?: string): Session;
    /**
     * RFC3261 13.3.1.4
     * Response retransmissions cannot be accomplished by transaction layer
     *  since it is destroyed when receiving the first 2xx answer
     */
    protected setInvite2xxTimer(request: IncomingRequest, description: string): void;
    /**
     * RFC3261 14.2
     * If a UAS generates a 2xx response and never receives an ACK,
     * it SHOULD generate a BYE to terminate the dialog.
     */
    protected setACKTimer(): void;
    protected failed(response: IncomingResponse | IncomingRequest | undefined, cause: string): this;
    protected rejected(response: IncomingResponse | IncomingRequest, cause: string): this;
    protected canceled(): this;
    protected accepted(response?: IncomingResponse | string, cause?: string): this;
    protected terminated(message?: IncomingResponse | IncomingRequest, cause?: string): this;
    protected connecting(request: IncomingRequest): this;
    protected receiveNonInviteResponse(response: IncomingResponse): void;
}
export declare namespace InviteServerContext {
    interface Options {
        /** Array of extra headers added to the INVITE. */
        extraHeaders?: Array<string>;
        /** Options to pass to SessionDescriptionHandler's getDescription() and setDescription(). */
        sessionDescriptionHandlerOptions?: SessionDescriptionHandlerOptions;
        modifiers?: SessionDescriptionHandlerModifiers;
        onInfo?: ((request: IncomingRequest) => void);
        statusCode?: number;
        reasonPhrase?: string;
        body?: any;
        rel100?: boolean;
    }
}
export declare class InviteServerContext extends Session implements ServerContext {
    type: TypeStrings;
    transaction: InviteServerTransaction | NonInviteServerTransaction;
    request: IncomingRequest;
    constructor(ua: UA, request: IncomingRequest);
    reject(options?: InviteServerContext.Options): this;
    reply(options?: any): this;
    terminate(options?: any): this;
    progress(options?: InviteServerContext.Options): this;
    accept(options?: InviteServerContext.Options): this;
    receiveRequest(request: IncomingRequest): void;
    private setupSessionDescriptionHandler;
}
export declare namespace InviteClientContext {
    interface Options {
        /** Array of extra headers added to the INVITE. */
        extraHeaders?: Array<string>;
        /** If true, send INVITE without SDP. */
        inviteWithoutSdp?: boolean;
        /** Deprecated */
        params?: {
            toUri?: string;
            toDisplayName: string;
        };
        /** Options to pass to SessionDescriptionHandler's getDescription() and setDescription(). */
        sessionDescriptionHandlerOptions?: SessionDescriptionHandlerOptions;
    }
}
export declare class InviteClientContext extends Session implements ClientContext {
    type: TypeStrings;
    request: OutgoingRequest;
    private anonymous;
    private inviteWithoutSdp;
    private isCanceled;
    private received100;
    private cancelReason;
    constructor(ua: UA, target: string | URI, options?: any, modifiers?: any);
    receiveNonInviteResponse(response: IncomingResponse): void;
    receiveResponse(response: IncomingResponse): void;
    send(): this;
    invite(): this;
    receiveInviteResponse(response: IncomingResponse): void;
    cancel(options?: any): this;
    terminate(options?: any): this;
    receiveRequest(request: IncomingRequest): void;
}
export declare namespace ReferServerContext {
    interface AcceptOptions {
        /** If true, accept REFER request and automatically attempt to follow it. */
        followRefer?: boolean;
        /** If followRefer is true, options to following INVITE request. */
        inviteOptions?: InviteClientContext.Options;
    }
    interface RejectOptions {
    }
}
export declare class ReferClientContext extends ClientContext {
    type: TypeStrings;
    private extraHeaders;
    private options;
    private applicant;
    private target;
    private errorListener;
    constructor(ua: UA, applicant: InviteClientContext | InviteServerContext, target: InviteClientContext | InviteServerContext | string, options?: any);
    refer(options?: any): ReferClientContext;
    receiveNotify(request: IncomingRequest): void;
}
export declare class ReferServerContext extends ServerContext {
    type: TypeStrings;
    referTo: NameAddrHeader;
    targetSession: InviteClientContext | InviteServerContext | undefined;
    private status;
    private fromTag;
    private fromUri;
    private toUri;
    private toTag;
    private routeSet;
    private remoteTarget;
    private id;
    private callId;
    private cseq;
    private contact;
    private referredBy;
    private referredSession;
    private replaces;
    private errorListener;
    constructor(ua: UA, request: IncomingRequest);
    receiveNonInviteResponse(response: IncomingResponse): void;
    progress(): void;
    reject(options?: ReferServerContext.RejectOptions): void;
    accept(options?: ReferServerContext.AcceptOptions, modifiers?: SessionDescriptionHandlerModifiers): void;
    sendNotify(body: string): void;
    on(name: "referAccepted" | "referInviteSent" | "referProgress" | "referRejected" | "referRequestAccepted" | "referRequestRejected", callback: (referServerContext: ReferServerContext) => void): this;
}
