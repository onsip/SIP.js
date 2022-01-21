import { BodyAndContentType, SessionDescriptionHandler as SessionDescriptionHandlerDefinition, SessionDescriptionHandlerModifier } from "../../../api";
import { Logger } from "../../../core";
import { MediaStreamFactory } from "./media-stream-factory";
import { SessionDescriptionHandlerConfiguration } from "./session-description-handler-configuration";
import { SessionDescriptionHandlerOptions } from "./session-description-handler-options";
import { PeerConnectionDelegate } from "./peer-connection-delegate";
/**
 * A base class implementing a WebRTC session description handler for sip.js.
 * @remarks
 * It is expected/intended to be extended by specific WebRTC based applications.
 * @privateRemarks
 * So do not put application specific implementation in here.
 * @public
 */
export declare class SessionDescriptionHandler implements SessionDescriptionHandlerDefinition {
    /** Logger. */
    protected logger: Logger;
    /** Media stream factory. */
    protected mediaStreamFactory: MediaStreamFactory;
    /** Configuration options. */
    protected sessionDescriptionHandlerConfiguration?: SessionDescriptionHandlerConfiguration;
    /** The local media stream. */
    protected _localMediaStream: MediaStream;
    /** The remote media stream. */
    protected _remoteMediaStream: MediaStream;
    /** The data channel. Undefined before created. */
    protected _dataChannel: RTCDataChannel | undefined;
    /** The peer connection. Undefined after SessionDescriptionHandler.close(). */
    protected _peerConnection: RTCPeerConnection | undefined;
    /** The peer connection delegate. */
    protected _peerConnectionDelegate: PeerConnectionDelegate | undefined;
    private iceGatheringCompletePromise;
    private iceGatheringCompleteTimeoutId;
    private iceGatheringCompleteResolve;
    private iceGatheringCompleteReject;
    private localMediaStreamConstraints;
    private onDataChannel;
    /**
     * Constructor
     * @param logger - A logger
     * @param mediaStreamFactory - A factory to provide a MediaStream
     * @param options - Options passed from the SessionDescriptionHandleFactory
     */
    constructor(logger: Logger, mediaStreamFactory: MediaStreamFactory, sessionDescriptionHandlerConfiguration?: SessionDescriptionHandlerConfiguration);
    /**
     * The local media stream currently being sent.
     *
     * @remarks
     * The local media stream initially has no tracks, so the presence of tracks
     * should not be assumed. Furthermore, tracks may be added or removed if the
     * local media changes - for example, on upgrade from audio only to a video session.
     * At any given time there will be at most one audio track and one video track
     * (it's possible that this restriction may not apply to sub-classes).
     * Use `MediaStream.onaddtrack` or add a listener for the `addtrack` event
     * to detect when a new track becomes available:
     * https://developer.mozilla.org/en-US/docs/Web/API/MediaStream/onaddtrack
     */
    get localMediaStream(): MediaStream;
    /**
     * The remote media stream currently being received.
     *
     * @remarks
     * The remote media stream initially has no tracks, so the presence of tracks
     * should not be assumed. Furthermore, tracks may be added or removed if the
     * remote media changes - for example, on upgrade from audio only to a video session.
     * At any given time there will be at most one audio track and one video track
     * (it's possible that this restriction may not apply to sub-classes).
     * Use `MediaStream.onaddtrack` or add a listener for the `addtrack` event
     * to detect when a new track becomes available:
     * https://developer.mozilla.org/en-US/docs/Web/API/MediaStream/onaddtrack
     */
    get remoteMediaStream(): MediaStream;
    /**
     * The data channel. Undefined before it is created.
     */
    get dataChannel(): RTCDataChannel | undefined;
    /**
     * The peer connection. Undefined if peer connection has closed.
     *
     * @remarks
     * While access to the underlying `RTCPeerConnection` is provided, note that
     * using methods with modify it may break the operation of this class.
     * In particular, this class depends on exclusive access to the
     * event handler properties. If you need access to the peer connection
     * events, either register for events using `addEventListener()` on
     * the `RTCPeerConnection` or set the `peerConnectionDelegate` on
     * this `SessionDescriptionHandler`.
     */
    get peerConnection(): RTCPeerConnection | undefined;
    /**
     * A delegate which provides access to the peer connection event handlers.
     *
     * @remarks
     * Setting the peer connection event handlers directly is not supported
     * and may break this class. As this class depends on exclusive access
     * to them, a delegate may be set which provides alternative access to
     * the event handlers in a fashion which is supported.
     */
    get peerConnectionDelegate(): PeerConnectionDelegate | undefined;
    set peerConnectionDelegate(delegate: PeerConnectionDelegate | undefined);
    private static dispatchAddTrackEvent;
    private static dispatchRemoveTrackEvent;
    /**
     * Stop tracks and close peer connection.
     */
    close(): void;
    /**
     * Creates an offer or answer.
     * @param options - Options bucket.
     * @param modifiers - Modifiers.
     */
    getDescription(options?: SessionDescriptionHandlerOptions, modifiers?: Array<SessionDescriptionHandlerModifier>): Promise<BodyAndContentType>;
    /**
     * Returns true if the SessionDescriptionHandler can handle the Content-Type described by a SIP message.
     * @param contentType - The content type that is in the SIP Message.
     */
    hasDescription(contentType: string): boolean;
    /**
     * Send DTMF via RTP (RFC 4733).
     * Returns true if DTMF send is successful, false otherwise.
     * @param tones - A string containing DTMF digits.
     * @param options - Options object to be used by sendDtmf.
     */
    sendDtmf(tones: string, options?: {
        duration: number;
        interToneGap: number;
    }): boolean;
    /**
     * Sets an offer or answer.
     * @param sdp - The session description.
     * @param options - Options bucket.
     * @param modifiers - Modifiers.
     */
    setDescription(sdp: string, options?: SessionDescriptionHandlerOptions, modifiers?: Array<SessionDescriptionHandlerModifier>): Promise<void>;
    /**
     * Applies modifiers to SDP prior to setting the local or remote description.
     * @param sdp - SDP to modify.
     * @param modifiers - Modifiers to apply.
     */
    protected applyModifiers(sdp: RTCSessionDescriptionInit, modifiers?: Array<SessionDescriptionHandlerModifier>): Promise<RTCSessionDescriptionInit>;
    /**
     * Create a data channel.
     * @remarks
     * Only creates a data channel if SessionDescriptionHandlerOptions.dataChannel is true.
     * Only creates a data channel if creating a local offer.
     * Only if one does not already exist.
     * @param options - Session description handler options.
     */
    protected createDataChannel(options?: SessionDescriptionHandlerOptions): Promise<void>;
    /**
     * Depending on current signaling state, create a local offer or answer.
     * @param options - Session description handler options.
     */
    protected createLocalOfferOrAnswer(options?: SessionDescriptionHandlerOptions): Promise<RTCSessionDescriptionInit>;
    /**
     * Get a media stream from the media stream factory and set the local media stream.
     * @param options - Session description handler options.
     */
    protected getLocalMediaStream(options?: SessionDescriptionHandlerOptions): Promise<void>;
    /**
     * Sets the peer connection's sender tracks and local media stream tracks.
     *
     * @remarks
     * Only the first audio and video tracks of the provided MediaStream are utilized.
     * Adds tracks if audio and/or video tracks are not already present, otherwise replaces tracks.
     *
     * @param stream - Media stream containing tracks to be utilized.
     */
    protected setLocalMediaStream(stream: MediaStream): Promise<void>;
    /**
     * Gets the peer connection's local session description.
     */
    protected getLocalSessionDescription(): Promise<RTCSessionDescription>;
    /**
     * Sets the peer connection's local session description.
     * @param sessionDescription - sessionDescription The session description.
     */
    protected setLocalSessionDescription(sessionDescription: RTCSessionDescriptionInit): Promise<void>;
    /**
     * Sets the peer connection's remote session description.
     * @param sessionDescription - The session description.
     */
    protected setRemoteSessionDescription(sessionDescription: RTCSessionDescriptionInit): Promise<void>;
    /**
     * Sets a remote media stream track.
     *
     * @remarks
     * Adds tracks if audio and/or video tracks are not already present, otherwise replaces tracks.
     *
     * @param track - Media stream track to be utilized.
     */
    protected setRemoteTrack(track: MediaStreamTrack): void;
    /**
     * Depending on the current signaling state and the session hold state, update transceiver direction.
     * @param options - Session description handler options.
     */
    protected updateDirection(options?: SessionDescriptionHandlerOptions): Promise<void>;
    /**
     * Called when ICE gathering completes and resolves any waiting promise.
     */
    protected iceGatheringComplete(): void;
    /**
     * Wait for ICE gathering to complete.
     * @param restart - If true, waits if current state is "complete" (waits for transition to "complete").
     * @param timeout - Milliseconds after which waiting times out. No timeout if 0.
     */
    protected waitForIceGatheringComplete(restart?: boolean, timeout?: number): Promise<void>;
    /**
     * Initializes the peer connection event handlers
     */
    private initPeerConnectionEventHandlers;
}
//# sourceMappingURL=session-description-handler.d.ts.map