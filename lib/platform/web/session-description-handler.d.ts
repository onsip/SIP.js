/// <reference types="node" />
import { EventEmitter } from "events";
import { BodyAndContentType, Session, SessionDescriptionHandler as SessionDescriptionHandlerDefinition, SessionDescriptionHandlerModifier, SessionDescriptionHandlerOptions as SessionDescriptionHandlerOptionsDefinition } from "../../api";
import { Logger } from "../../core";
/**
 * Options for PeerConnection.
 * @public
 */
export interface PeerConnectionOptions {
    iceCheckingTimeout?: number;
    rtcConfiguration?: RTCConfiguration;
}
/**
 * Options for {@link SessionDescriptionHandler}.
 * @public
 */
export interface SessionDescriptionHandlerOptions extends SessionDescriptionHandlerOptionsDefinition {
    peerConnectionOptions?: PeerConnectionOptions;
    alwaysAcquireMediaFirst?: boolean;
    disableAudioFallback?: boolean;
    RTCOfferOptions?: any;
    constraints?: MediaStreamConstraints;
}
/**
 * SessionDescriptionHandler for web browser.
 * @public
 */
export declare class SessionDescriptionHandler extends EventEmitter implements SessionDescriptionHandlerDefinition {
    static defaultFactory(session: Session, options: any): SessionDescriptionHandler;
    peerConnection: RTCPeerConnection;
    private options;
    private logger;
    private dtmfSender;
    private shouldAcquireMedia;
    private CONTENT_TYPE;
    private direction;
    private C;
    private modifiers;
    private iceGatheringDeferred;
    private iceGatheringTimeout;
    private iceGatheringTimer;
    private constraints;
    constructor(logger: Logger, options: any);
    /**
     * Destructor
     */
    close(): void;
    /**
     * Gets the local description from the underlying media implementation.
     * @remarks
     * Resolves with the local description to be used for the session.
     * @param options - Options object to be used by getDescription
     * @param modifiers - Array with one time use description modifiers
     */
    getDescription(options?: SessionDescriptionHandlerOptions, modifiers?: Array<SessionDescriptionHandlerModifier>): Promise<BodyAndContentType>;
    /**
     * Check if the Session Description Handler can handle the Content-Type described by a SIP Message
     * @param contentType - The content type that is in the SIP Message
     */
    hasDescription(contentType: string): boolean;
    /**
     * The modifier that should be used when the session would like to place the call on hold.
     * @remarks
     * Resolves with modified SDP.
     * @param description - The description that will be modified
     */
    holdModifier(description: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit>;
    /**
     * Set the remote description to the underlying media implementation.
     * @remarks
     * Resolves once the description is set.
     * @param sessionDescription - The description provided by a SIP message to be set on the media implementation.
     * @param options - Options object to be used by getDescription.
     * @param modifiers - Array with one time use description modifiers.
     */
    setDescription(sessionDescription: string, options?: SessionDescriptionHandlerOptions, modifiers?: Array<SessionDescriptionHandlerModifier>): Promise<void>;
    /**
     * Send DTMF via RTP (RFC 4733).
     * @remarks
     * Returns true if DTMF send is successful, false otherwise.
     * @param tones - A string containing DTMF digits.
     * @param options - Options object to be used by sendDtmf.
     */
    sendDtmf(tones: string, options?: any): boolean;
    /**
     * Get the direction of the session description
     */
    getDirection(): string;
    on(event: "getDescription" | "setDescription", listener: (description: RTCSessionDescriptionInit) => void): this;
    on(event: "peerConnection-setRemoteDescriptionFailed", listener: (error: any) => void): this;
    on(event: "setRemoteDescription", listener: (receivers: Array<RTCRtpReceiver>) => void): this;
    on(event: "confirmed", listener: (sessionDescriptionHandler: SessionDescriptionHandler) => void): this;
    on(event: "peerConnection-createAnswerFailed" | "peerConnection-createOfferFailed", listener: (error: any) => void): this;
    on(event: "peerConnection-SetLocalDescriptionFailed", listener: (error: any) => void): this;
    on(event: "addTrack", listener: (track: MediaStreamTrack) => void): this;
    on(event: "addStream", listener: (track: MediaStream) => void): this;
    on(event: "iceCandidate", listener: (candidate: RTCIceCandidate) => void): this;
    on(event: "iceConnection" | "iceConnectionChecking" | "iceConnectionConnected" | "iceConnectionCompleted" | "iceConnectionFailed" | "iceConnectionDisconnected" | "iceConectionClosed", listener: (sessionDescriptionHandler: SessionDescriptionHandler) => void): this;
    on(event: "iceGathering" | "iceGatheringComplete", listener: (sessionDescriptionHandler: SessionDescriptionHandler) => void): this;
    on(event: "userMediaRequest", listener: (constraints: MediaStreamConstraints) => void): this;
    on(event: "userMedia", listener: (streams: MediaStream) => void): this;
    on(event: "userMediaFailed", listener: (error: any) => void): this;
    protected getMediaStream(constraints: MediaStreamConstraints): Promise<MediaStream>;
    private createOfferOrAnswer;
    private createRTCSessionDescriptionInit;
    private addDefaultIceCheckingTimeout;
    private addDefaultIceServers;
    private checkAndDefaultConstraints;
    private hasBrowserTrackSupport;
    private hasBrowserGetSenderSupport;
    private initPeerConnection;
    private acquire;
    private hasOffer;
    private isIceGatheringComplete;
    private resetIceGatheringComplete;
    private setDirection;
    private triggerIceGatheringComplete;
    private waitForIceGatheringComplete;
}
//# sourceMappingURL=session-description-handler.d.ts.map