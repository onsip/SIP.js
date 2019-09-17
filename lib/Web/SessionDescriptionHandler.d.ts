/// <reference types="node" />
import { EventEmitter } from "events";
import { Session } from "../api/session";
import { Logger } from "../core";
import { TypeStrings } from "../Enums";
import { InviteClientContext, InviteServerContext } from "../Session";
import { BodyObj, SessionDescriptionHandler as SessionDescriptionHandlerDefinition, SessionDescriptionHandlerModifiers, SessionDescriptionHandlerOptions } from "../session-description-handler";
import { SessionDescriptionHandlerObserver } from "./SessionDescriptionHandlerObserver";
export interface WebSessionDescriptionHandlerOptions extends SessionDescriptionHandlerOptions {
    peerConnectionOptions?: PeerConnectionOptions;
    alwaysAcquireMediaFirst?: boolean;
    disableAudioFallback?: boolean;
    RTCOfferOptions?: any;
    constraints?: MediaStreamConstraints;
}
export interface PeerConnectionOptions {
    iceCheckingTimeout?: number;
    rtcConfiguration?: RTCConfiguration;
}
export declare class SessionDescriptionHandler extends EventEmitter implements SessionDescriptionHandlerDefinition {
    /**
     * @param {SIP.Session} session
     * @param {Object} [options]
     */
    static defaultFactory(session: InviteClientContext | InviteServerContext | Session, options: any): SessionDescriptionHandler;
    type: TypeStrings;
    peerConnection: RTCPeerConnection;
    private options;
    private logger;
    private observer;
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
    constructor(logger: Logger, observer: SessionDescriptionHandlerObserver, options: any);
    /**
     * Destructor
     */
    close(): void;
    /**
     * Gets the local description from the underlying media implementation
     * @param {Object} [options] Options object to be used by getDescription
     * @param {MediaStreamConstraints} [options.constraints] MediaStreamConstraints
     *   https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamConstraints
     * @param {Object} [options.peerConnectionOptions] If this is set it will recreate the peer
     *   connection with the new options
     * @param {Array} [modifiers] Array with one time use description modifiers
     * @returns {Promise} Promise that resolves with the local description to be used for the session
     */
    getDescription(options?: WebSessionDescriptionHandlerOptions, modifiers?: SessionDescriptionHandlerModifiers): Promise<BodyObj>;
    /**
     * Check if the Session Description Handler can handle the Content-Type described by a SIP Message
     * @param {String} contentType The content type that is in the SIP Message
     * @returns {boolean}
     */
    hasDescription(contentType: string): boolean;
    /**
     * The modifier that should be used when the session would like to place the call on hold
     * @param {String} [sdp] The description that will be modified
     * @returns {Promise} Promise that resolves with modified SDP
     */
    holdModifier(description: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit>;
    /**
     * Set the remote description to the underlying media implementation
     * @param {String} sessionDescription The description provided by a SIP message to be set on the media implementation
     * @param {Object} [options] Options object to be used by getDescription
     * @param {MediaStreamConstraints} [options.constraints] MediaStreamConstraints
     *   https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamConstraints
     * @param {Object} [options.peerConnectionOptions] If this is set it will recreate the peer
     *   connection with the new options
     * @param {Array} [modifiers] Array with one time use description modifiers
     * @returns {Promise} Promise that resolves once the description is set
     */
    setDescription(sessionDescription: string, options?: WebSessionDescriptionHandlerOptions, modifiers?: SessionDescriptionHandlerModifiers): Promise<void>;
    /**
     * Send DTMF via RTP (RFC 4733)
     * @param {String} tones A string containing DTMF digits
     * @param {Object} [options] Options object to be used by sendDtmf
     * @returns {boolean} true if DTMF send is successful, false otherwise
     */
    sendDtmf(tones: string, options?: any): boolean;
    /**
     * Get the direction of the session description
     * @returns {String} direction of the description
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
//# sourceMappingURL=SessionDescriptionHandler.d.ts.map