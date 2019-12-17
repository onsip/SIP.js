/// <reference types="node" />
import { EventEmitter } from "events";
import { BodyAndContentType, Session, SessionDescriptionHandler as SessionDescriptionHandlerDefinition, SessionDescriptionHandlerModifier } from "../../api";
import { Logger } from "../../core";
export declare class SessionDescriptionHandler extends EventEmitter implements SessionDescriptionHandlerDefinition {
    /**
     * @param {SIP.Session} session
     * @param {Object} [options]
     */
    static defaultFactory(session: Session, options: any): SessionDescriptionHandler;
    private options;
    private logger;
    private dtmfSender;
    private shouldAcquireMedia;
    private CONTENT_TYPE;
    private direction;
    private C;
    private modifiers;
    private WebRTC;
    private iceGatheringDeferred;
    private iceGatheringTimeout;
    private iceGatheringTimer;
    private constraints;
    private peerConnection;
    constructor(logger: Logger, options: any);
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
    getDescription(options?: any, modifiers?: Array<SessionDescriptionHandlerModifier>): Promise<BodyAndContentType>;
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
    setDescription(sessionDescription: string, options?: any, modifiers?: Array<SessionDescriptionHandlerModifier>): Promise<void>;
    /**
     * Send DTMF via RTP (RFC 4733)
     * @param {String} tones A string containing DTMF digits
     * @param {Object} [options] Options object to be used by sendDtmf
     * @returns {boolean} true if DTMF send is successful, false otherwise
     */
    sendDtmf(tones: string, options: any): boolean;
    getDirection(): string;
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