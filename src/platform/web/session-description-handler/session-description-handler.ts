import {
  BodyAndContentType,
  SessionDescriptionHandler as SessionDescriptionHandlerDefinition,
  SessionDescriptionHandlerModifier
} from "../../../api";
import { Logger } from "../../../core";
import { MediaStreamFactory } from "./media-stream-factory";
import { SessionDescriptionHandlerConfiguration } from "./session-description-handler-configuration";
import { SessionDescriptionHandlerOptions } from "./session-description-handler-options";
import { PeerConnectionDelegate } from "./peer-connection-delegate";

type ResolveFunction = () => void;
type RejectFunction = (reason: Error) => void;

/**
 * A base class implementing a WebRTC session description handler for sip.js.
 * @remarks
 * It is expected/intended to be extended by specific WebRTC based applications.
 * @privateRemarks
 * So do not put application specific implementation in here.
 * @public
 */
export class SessionDescriptionHandler implements SessionDescriptionHandlerDefinition {
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

  private iceGatheringCompletePromise: Promise<void> | undefined;
  private iceGatheringCompleteTimeoutId: number | undefined;
  private iceGatheringCompleteResolve: ResolveFunction | undefined;
  private iceGatheringCompleteReject: RejectFunction | undefined;
  private localMediaStreamConstraints: MediaStreamConstraints | undefined;
  private onDataChannel: ((dataChannel: RTCDataChannel) => void) | undefined;

  /**
   * Constructor
   * @param logger - A logger
   * @param mediaStreamFactory - A factory to provide a MediaStream
   * @param options - Options passed from the SessionDescriptionHandleFactory
   */
  constructor(
    logger: Logger,
    mediaStreamFactory: MediaStreamFactory,
    sessionDescriptionHandlerConfiguration?: SessionDescriptionHandlerConfiguration
  ) {
    logger.debug("SessionDescriptionHandler.constructor");
    this.logger = logger;
    this.mediaStreamFactory = mediaStreamFactory;
    this.sessionDescriptionHandlerConfiguration = sessionDescriptionHandlerConfiguration;
    this._localMediaStream = new MediaStream();
    this._remoteMediaStream = new MediaStream();
    this._peerConnection = new RTCPeerConnection(sessionDescriptionHandlerConfiguration?.peerConnectionConfiguration);
    this.initPeerConnectionEventHandlers();
  }

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
  get localMediaStream(): MediaStream {
    return this._localMediaStream;
  }

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
  get remoteMediaStream(): MediaStream {
    return this._remoteMediaStream;
  }

  /**
   * The data channel. Undefined before it is created.
   */
  get dataChannel(): RTCDataChannel | undefined {
    return this._dataChannel;
  }

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
  get peerConnection(): RTCPeerConnection | undefined {
    return this._peerConnection;
  }

  /**
   * A delegate which provides access to the peer connection event handlers.
   *
   * @remarks
   * Setting the peer connection event handlers directly is not supported
   * and may break this class. As this class depends on exclusive access
   * to them, a delegate may be set which provides alternative access to
   * the event handlers in a fashion which is supported.
   */
  get peerConnectionDelegate(): PeerConnectionDelegate | undefined {
    return this._peerConnectionDelegate;
  }

  set peerConnectionDelegate(delegate: PeerConnectionDelegate | undefined) {
    this._peerConnectionDelegate = delegate;
  }

  // The addtrack event does not get fired when JavaScript code explicitly adds tracks to the stream (by calling addTrack()).
  // https://developer.mozilla.org/en-US/docs/Web/API/MediaStream/onaddtrack
  private static dispatchAddTrackEvent(stream: MediaStream, track: MediaStreamTrack): void {
    stream.dispatchEvent(new MediaStreamTrackEvent("addtrack", { track }));
  }
  // The removetrack event does not get fired when JavaScript code explicitly removes tracks from the stream (by calling removeTrack()).
  // https://developer.mozilla.org/en-US/docs/Web/API/MediaStream/onremovetrack
  private static dispatchRemoveTrackEvent(stream: MediaStream, track: MediaStreamTrack): void {
    stream.dispatchEvent(new MediaStreamTrackEvent("removetrack", { track }));
  }

  /**
   * Stop tracks and close peer connection.
   */
  public close(): void {
    this.logger.debug("SessionDescriptionHandler.close");
    if (this._peerConnection === undefined) {
      return;
    }
    this._peerConnection.getReceivers().forEach((receiver) => {
      receiver.track && receiver.track.stop();
    });
    this._peerConnection.getSenders().forEach((sender) => {
      sender.track && sender.track.stop();
    });
    if (this._dataChannel) {
      this._dataChannel.close();
    }
    this._peerConnection.close();
    this._peerConnection = undefined;
  }

  /**
   * Creates an offer or answer.
   * @param options - Options bucket.
   * @param modifiers - Modifiers.
   */
  public getDescription(
    options?: SessionDescriptionHandlerOptions,
    modifiers?: Array<SessionDescriptionHandlerModifier>
  ): Promise<BodyAndContentType> {
    this.logger.debug("SessionDescriptionHandler.getDescription");
    if (this._peerConnection === undefined) {
      return Promise.reject(new Error("Peer connection closed."));
    }
    // Callback on data channel creation
    this.onDataChannel = options?.onDataChannel;

    // ICE will restart upon applying an offer created with the iceRestart option
    const iceRestart = options?.offerOptions?.iceRestart;

    // ICE gathering timeout may be set on a per call basis, otherwise the configured default is used
    const iceTimeout =
      options?.iceGatheringTimeout === undefined
        ? this.sessionDescriptionHandlerConfiguration?.iceGatheringTimeout
        : options?.iceGatheringTimeout;

    return this.getLocalMediaStream(options)
      .then(() => this.updateDirection(options))
      .then(() => this.createDataChannel(options))
      .then(() => this.createLocalOfferOrAnswer(options))
      .then((sessionDescription) => this.applyModifiers(sessionDescription, modifiers))
      .then((sessionDescription) => this.setLocalSessionDescription(sessionDescription))
      .then(() => this.waitForIceGatheringComplete(iceRestart, iceTimeout))
      .then(() => this.getLocalSessionDescription())
      .then((sessionDescription) => {
        return {
          body: sessionDescription.sdp,
          contentType: "application/sdp"
        };
      })
      .catch((error) => {
        this.logger.error("SessionDescriptionHandler.getDescription failed - " + error);
        throw error;
      });
  }

  /**
   * Returns true if the SessionDescriptionHandler can handle the Content-Type described by a SIP message.
   * @param contentType - The content type that is in the SIP Message.
   */
  public hasDescription(contentType: string): boolean {
    this.logger.debug("SessionDescriptionHandler.hasDescription");
    return contentType === "application/sdp";
  }

  /**
   * Send DTMF via RTP (RFC 4733).
   * Returns true if DTMF send is successful, false otherwise.
   * @param tones - A string containing DTMF digits.
   * @param options - Options object to be used by sendDtmf.
   */
  public sendDtmf(tones: string, options?: { duration: number; interToneGap: number }): boolean {
    this.logger.debug("SessionDescriptionHandler.sendDtmf");
    if (this._peerConnection === undefined) {
      this.logger.error("SessionDescriptionHandler.sendDtmf failed - peer connection closed");
      return false;
    }
    const senders = this._peerConnection.getSenders();
    if (senders.length === 0) {
      this.logger.error("SessionDescriptionHandler.sendDtmf failed - no senders");
      return false;
    }
    const dtmfSender = senders[0].dtmf;
    if (!dtmfSender) {
      this.logger.error("SessionDescriptionHandler.sendDtmf failed - no DTMF sender");
      return false;
    }
    const duration = options?.duration;
    const interToneGap = options?.interToneGap;
    try {
      dtmfSender.insertDTMF(tones, duration, interToneGap);
    } catch (e) {
      this.logger.error(e);
      return false;
    }
    this.logger.log("SessionDescriptionHandler.sendDtmf sent via RTP: " + tones.toString());
    return true;
  }

  /**
   * Sets an offer or answer.
   * @param sdp - The session description.
   * @param options - Options bucket.
   * @param modifiers - Modifiers.
   */
  public setDescription(
    sdp: string,
    options?: SessionDescriptionHandlerOptions,
    modifiers?: Array<SessionDescriptionHandlerModifier>
  ): Promise<void> {
    this.logger.debug("SessionDescriptionHandler.setDescription");
    if (this._peerConnection === undefined) {
      return Promise.reject(new Error("Peer connection closed."));
    }

    // Callback on data channel creation
    this.onDataChannel = options?.onDataChannel;

    // SDP type
    const type = this._peerConnection.signalingState === "have-local-offer" ? "answer" : "offer";

    return this.getLocalMediaStream(options)
      .then(() => this.applyModifiers({ sdp, type }, modifiers))
      .then((sessionDescription) => this.setRemoteSessionDescription(sessionDescription))
      .catch((error) => {
        this.logger.error("SessionDescriptionHandler.setDescription failed - " + error);
        throw error;
      });
  }

  /**
   * Applies modifiers to SDP prior to setting the local or remote description.
   * @param sdp - SDP to modify.
   * @param modifiers - Modifiers to apply.
   */
  protected applyModifiers(
    sdp: RTCSessionDescriptionInit,
    modifiers?: Array<SessionDescriptionHandlerModifier>
  ): Promise<RTCSessionDescriptionInit> {
    this.logger.debug("SessionDescriptionHandler.applyModifiers");
    if (!modifiers || modifiers.length === 0) {
      return Promise.resolve(sdp);
    }
    return modifiers
      .reduce((cur, next) => cur.then(next), Promise.resolve(sdp))
      .then((modified) => {
        this.logger.debug("SessionDescriptionHandler.applyModifiers - modified sdp");
        if (!modified.sdp || !modified.type) {
          throw new Error("Invalid SDP.");
        }
        return { sdp: modified.sdp, type: modified.type };
      });
  }

  /**
   * Create a data channel.
   * @remarks
   * Only creates a data channel if SessionDescriptionHandlerOptions.dataChannel is true.
   * Only creates a data channel if creating a local offer.
   * Only if one does not already exist.
   * @param options - Session description handler options.
   */
  protected createDataChannel(options?: SessionDescriptionHandlerOptions): Promise<void> {
    if (this._peerConnection === undefined) {
      return Promise.reject(new Error("Peer connection closed."));
    }
    // only create a data channel if requested
    if (options?.dataChannel !== true) {
      return Promise.resolve();
    }
    // do not create a data channel if we already have one
    if (this._dataChannel) {
      return Promise.resolve();
    }
    switch (this._peerConnection.signalingState) {
      case "stable":
        // if we are stable, assume we are creating a local offer so create a data channel
        this.logger.debug("SessionDescriptionHandler.createDataChannel - creating data channel");
        try {
          this._dataChannel = this._peerConnection.createDataChannel(
            options?.dataChannelLabel || "",
            options?.dataChannelOptions
          );
          if (this.onDataChannel) {
            this.onDataChannel(this._dataChannel);
          }
          return Promise.resolve();
        } catch (error) {
          return Promise.reject(error);
        }
      case "have-remote-offer":
        return Promise.resolve();
      case "have-local-offer":
      case "have-local-pranswer":
      case "have-remote-pranswer":
      case "closed":
      default:
        return Promise.reject(new Error("Invalid signaling state " + this._peerConnection.signalingState));
    }
  }

  /**
   * Depending on current signaling state, create a local offer or answer.
   * @param options - Session description handler options.
   */
  protected createLocalOfferOrAnswer(options?: SessionDescriptionHandlerOptions): Promise<RTCSessionDescriptionInit> {
    if (this._peerConnection === undefined) {
      return Promise.reject(new Error("Peer connection closed."));
    }
    switch (this._peerConnection.signalingState) {
      case "stable":
        // if we are stable, assume we are creating a local offer
        this.logger.debug("SessionDescriptionHandler.createLocalOfferOrAnswer - creating SDP offer");
        return this._peerConnection.createOffer(options?.offerOptions);
      case "have-remote-offer":
        // if we have a remote offer, assume we are creating a local answer
        this.logger.debug("SessionDescriptionHandler.createLocalOfferOrAnswer - creating SDP answer");
        return this._peerConnection.createAnswer(options?.answerOptions);
      case "have-local-offer":
      case "have-local-pranswer":
      case "have-remote-pranswer":
      case "closed":
      default:
        return Promise.reject(new Error("Invalid signaling state " + this._peerConnection.signalingState));
    }
  }

  /**
   * Get a media stream from the media stream factory and set the local media stream.
   * @param options - Session description handler options.
   */
  protected getLocalMediaStream(options?: SessionDescriptionHandlerOptions): Promise<void> {
    this.logger.debug("SessionDescriptionHandler.getLocalMediaStream");
    if (this._peerConnection === undefined) {
      return Promise.reject(new Error("Peer connection closed."));
    }
    let constraints: MediaStreamConstraints = { ...options?.constraints };

    // if we already have a local media stream...
    if (this.localMediaStreamConstraints) {
      // ignore constraint "downgrades"
      constraints.audio = constraints.audio || this.localMediaStreamConstraints.audio;
      constraints.video = constraints.video || this.localMediaStreamConstraints.video;

      // if constraints have not changed, do not get a new media stream
      if (
        JSON.stringify(this.localMediaStreamConstraints.audio) === JSON.stringify(constraints.audio) &&
        JSON.stringify(this.localMediaStreamConstraints.video) === JSON.stringify(constraints.video)
      ) {
        return Promise.resolve();
      }
    } else {
      // if no constraints have been specified, default to audio for initial media stream
      if (constraints.audio === undefined && constraints.video === undefined) {
        constraints = { audio: true };
      }
    }

    this.localMediaStreamConstraints = constraints;
    return this.mediaStreamFactory(constraints, this).then((mediaStream) => this.setLocalMediaStream(mediaStream));
  }

  /**
   * Sets the peer connection's sender tracks and local media stream tracks.
   *
   * @remarks
   * Only the first audio and video tracks of the provided MediaStream are utilized.
   * Adds tracks if audio and/or video tracks are not already present, otherwise replaces tracks.
   *
   * @param stream - Media stream containing tracks to be utilized.
   */
  protected setLocalMediaStream(stream: MediaStream): Promise<void> {
    this.logger.debug("SessionDescriptionHandler.setLocalMediaStream");

    if (!this._peerConnection) {
      throw new Error("Peer connection undefined.");
    }
    const pc = this._peerConnection;

    const localStream = this._localMediaStream;

    const trackUpdates: Array<Promise<void>> = [];

    const updateTrack = (newTrack: MediaStreamTrack): void => {
      const kind = newTrack.kind;
      if (kind !== "audio" && kind !== "video") {
        throw new Error(`Unknown new track kind ${kind}.`);
      }
      const sender = pc.getSenders().find((sender) => sender.track && sender.track.kind === kind);
      if (sender) {
        trackUpdates.push(
          new Promise<void>((resolve) => {
            this.logger.debug(`SessionDescriptionHandler.setLocalMediaStream - replacing sender ${kind} track`);
            resolve();
          }).then(() =>
            sender
              .replaceTrack(newTrack)
              .then(() => {
                const oldTrack = localStream.getTracks().find((localTrack) => localTrack.kind === kind);
                if (oldTrack) {
                  oldTrack.stop();
                  localStream.removeTrack(oldTrack);
                  SessionDescriptionHandler.dispatchRemoveTrackEvent(localStream, oldTrack);
                }
                localStream.addTrack(newTrack);
                SessionDescriptionHandler.dispatchAddTrackEvent(localStream, newTrack);
              })
              .catch((error: Error) => {
                this.logger.error(
                  `SessionDescriptionHandler.setLocalMediaStream - failed to replace sender ${kind} track`
                );
                throw error;
              })
          )
        );
      } else {
        trackUpdates.push(
          new Promise<void>((resolve) => {
            this.logger.debug(`SessionDescriptionHandler.setLocalMediaStream - adding sender ${kind} track`);
            resolve();
          }).then(() => {
            // Review: could make streamless tracks a configurable option?
            // https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/addTrack#Usage_notes
            try {
              pc.addTrack(newTrack, localStream);
            } catch (error) {
              this.logger.error(`SessionDescriptionHandler.setLocalMediaStream - failed to add sender ${kind} track`);
              throw error;
            }
            localStream.addTrack(newTrack);
            SessionDescriptionHandler.dispatchAddTrackEvent(localStream, newTrack);
          })
        );
      }
    };

    // update peer connection audio tracks
    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length) {
      updateTrack(audioTracks[0]);
    }

    // update peer connection video tracks
    const videoTracks = stream.getVideoTracks();
    if (videoTracks.length) {
      updateTrack(videoTracks[0]);
    }

    return trackUpdates.reduce((p, x) => p.then(() => x), Promise.resolve());
  }

  /**
   * Gets the peer connection's local session description.
   */
  protected getLocalSessionDescription(): Promise<RTCSessionDescription> {
    this.logger.debug("SessionDescriptionHandler.getLocalSessionDescription");
    if (this._peerConnection === undefined) {
      return Promise.reject(new Error("Peer connection closed."));
    }
    const sdp = this._peerConnection.localDescription;
    if (!sdp) {
      return Promise.reject(new Error("Failed to get local session description"));
    }
    return Promise.resolve(sdp);
  }

  /**
   * Sets the peer connection's local session description.
   * @param sessionDescription - sessionDescription The session description.
   */
  protected setLocalSessionDescription(sessionDescription: RTCSessionDescriptionInit): Promise<void> {
    this.logger.debug("SessionDescriptionHandler.setLocalSessionDescription");
    if (this._peerConnection === undefined) {
      return Promise.reject(new Error("Peer connection closed."));
    }
    return this._peerConnection.setLocalDescription(sessionDescription);
  }

  /**
   * Sets the peer connection's remote session description.
   * @param sessionDescription - The session description.
   */
  protected setRemoteSessionDescription(sessionDescription: RTCSessionDescriptionInit): Promise<void> {
    this.logger.debug("SessionDescriptionHandler.setRemoteSessionDescription");
    if (this._peerConnection === undefined) {
      return Promise.reject(new Error("Peer connection closed."));
    }
    const sdp = sessionDescription.sdp;
    let type: RTCSdpType;
    switch (this._peerConnection.signalingState) {
      case "stable":
        // if we are stable assume this is a remote offer
        type = "offer";
        break;
      case "have-local-offer":
        // if we made an offer, assume this is a remote answer
        type = "answer";
        break;
      case "have-local-pranswer":
      case "have-remote-offer":
      case "have-remote-pranswer":
      case "closed":
      default:
        return Promise.reject(new Error("Invalid signaling state " + this._peerConnection.signalingState));
    }
    if (!sdp) {
      this.logger.error("SessionDescriptionHandler.setRemoteSessionDescription failed - cannot set null sdp");
      return Promise.reject(new Error("SDP is undefined"));
    }
    return this._peerConnection.setRemoteDescription({ sdp, type });
  }

  /**
   * Sets a remote media stream track.
   *
   * @remarks
   * Adds tracks if audio and/or video tracks are not already present, otherwise replaces tracks.
   *
   * @param track - Media stream track to be utilized.
   */
  protected setRemoteTrack(track: MediaStreamTrack): void {
    this.logger.debug("SessionDescriptionHandler.setRemoteTrack");

    const remoteStream = this._remoteMediaStream;

    if (remoteStream.getTrackById(track.id)) {
      this.logger.debug(`SessionDescriptionHandler.setRemoteTrack - have remote ${track.kind} track`);
    } else if (track.kind === "audio") {
      this.logger.debug(`SessionDescriptionHandler.setRemoteTrack - adding remote ${track.kind} track`);
      remoteStream.getAudioTracks().forEach((track) => {
        track.stop();
        remoteStream.removeTrack(track);
        SessionDescriptionHandler.dispatchRemoveTrackEvent(remoteStream, track);
      });
      remoteStream.addTrack(track);
      SessionDescriptionHandler.dispatchAddTrackEvent(remoteStream, track);
    } else if (track.kind === "video") {
      this.logger.debug(`SessionDescriptionHandler.setRemoteTrack - adding remote ${track.kind} track`);
      remoteStream.getVideoTracks().forEach((track) => {
        track.stop();
        remoteStream.removeTrack(track);
        SessionDescriptionHandler.dispatchRemoveTrackEvent(remoteStream, track);
      });
      remoteStream.addTrack(track);
      SessionDescriptionHandler.dispatchAddTrackEvent(remoteStream, track);
    }
  }

  /**
   * Depending on the current signaling state and the session hold state, update transceiver direction.
   * @param options - Session description handler options.
   */
  protected updateDirection(options?: SessionDescriptionHandlerOptions): Promise<void> {
    if (this._peerConnection === undefined) {
      return Promise.reject(new Error("Peer connection closed."));
    }

    // 4.2.3.  setDirection
    //
    //    The setDirection method sets the direction of a transceiver, which
    //    affects the direction property of the associated "m=" section on
    //    future calls to createOffer and createAnswer.  The permitted values
    //    for direction are "recvonly", "sendrecv", "sendonly", and "inactive",
    //    mirroring the identically named direction attributes defined in
    //    [RFC4566], Section 6.
    //
    //    When creating offers, the transceiver direction is directly reflected
    //    in the output, even for re-offers.  When creating answers, the
    //    transceiver direction is intersected with the offered direction, as
    //    explained in Section 5.3 below.
    //
    //    Note that while setDirection sets the direction property of the
    //    transceiver immediately (Section 4.2.4), this property does not
    //    immediately affect whether the transceiver's RtpSender will send or
    //    its RtpReceiver will receive.  The direction in effect is represented
    //    by the currentDirection property, which is only updated when an
    //    answer is applied.
    //
    // 4.2.4.  direction
    //
    //    The direction property indicates the last value passed into
    //    setDirection.  If setDirection has never been called, it is set to
    //    the direction the transceiver was initialized with.
    //
    // 4.2.5.  currentDirection
    //
    //    The currentDirection property indicates the last negotiated direction
    //    for the transceiver's associated "m=" section.  More specifically, it
    //    indicates the direction attribute [RFC3264] of the associated "m="
    //    section in the last applied answer (including provisional answers),
    //    with "send" and "recv" directions reversed if it was a remote answer.
    //    For example, if the direction attribute for the associated "m="
    //    section in a remote answer is "recvonly", currentDirection is set to
    //    "sendonly".
    //
    //    If an answer that references this transceiver has not yet been
    //    applied or if the transceiver is stopped, currentDirection is set to
    //    "null".
    //  https://tools.ietf.org/html/rfc8829#section-4.2.3
    //
    // *  A direction attribute, determined by applying the rules regarding
    //    the offered direction specified in [RFC3264], Section 6.1, and
    //    then intersecting with the direction of the associated
    //    RtpTransceiver.  For example, in the case where an "m=" section is
    //    offered as "sendonly" and the local transceiver is set to
    //    "sendrecv", the result in the answer is a "recvonly" direction.
    // https://tools.ietf.org/html/rfc8829#section-5.3.1
    //
    // If a stream is offered as sendonly, the corresponding stream MUST be
    // marked as recvonly or inactive in the answer.  If a media stream is
    // listed as recvonly in the offer, the answer MUST be marked as
    // sendonly or inactive in the answer.  If an offered media stream is
    // listed as sendrecv (or if there is no direction attribute at the
    // media or session level, in which case the stream is sendrecv by
    // default), the corresponding stream in the answer MAY be marked as
    // sendonly, recvonly, sendrecv, or inactive.  If an offered media
    // stream is listed as inactive, it MUST be marked as inactive in the
    // answer.
    // https://tools.ietf.org/html/rfc3264#section-6.1

    switch (this._peerConnection.signalingState) {
      case "stable":
        // if we are stable, assume we are creating a local offer
        this.logger.debug("SessionDescriptionHandler.updateDirection - setting offer direction");
        {
          // determine the direction to offer given the current direction and hold state
          const directionToOffer = (currentDirection: RTCRtpTransceiverDirection): RTCRtpTransceiverDirection => {
            switch (currentDirection) {
              case "inactive":
                return options?.hold ? "inactive" : "recvonly";
              case "recvonly":
                return options?.hold ? "inactive" : "recvonly";
              case "sendonly":
                return options?.hold ? "sendonly" : "sendrecv";
              case "sendrecv":
                return options?.hold ? "sendonly" : "sendrecv";
              case "stopped":
                return "stopped";
              default:
                throw new Error("Should never happen");
            }
          };
          // set the transceiver direction to the offer direction
          this._peerConnection.getTransceivers().forEach((transceiver) => {
            if (transceiver.direction /* guarding, but should always be true */) {
              const offerDirection = directionToOffer(transceiver.direction);
              if (transceiver.direction !== offerDirection) {
                transceiver.direction = offerDirection;
              }
            }
          });
        }
        break;
      case "have-remote-offer":
        // if we have a remote offer, assume we are creating a local answer
        this.logger.debug("SessionDescriptionHandler.updateDirection - setting answer direction");

        // FIXME: This is not the correct way to determine the answer direction as it is only
        // considering first match in the offered SDP and using that to determine the answer direction.
        // While that may be fine for our current use cases, it is not a generally correct approach.
        {
          // determine the offered direction
          const offeredDirection = ((): "inactive" | "recvonly" | "sendonly" | "sendrecv" => {
            const description = this._peerConnection.remoteDescription;
            if (!description) {
              throw new Error("Failed to read remote offer");
            }
            const searchResult = /a=sendrecv\r\n|a=sendonly\r\n|a=recvonly\r\n|a=inactive\r\n/.exec(description.sdp);
            if (searchResult) {
              switch (searchResult[0]) {
                case "a=inactive\r\n":
                  return "inactive";
                case "a=recvonly\r\n":
                  return "recvonly";
                case "a=sendonly\r\n":
                  return "sendonly";
                case "a=sendrecv\r\n":
                  return "sendrecv";
                default:
                  throw new Error("Should never happen");
              }
            }
            return "sendrecv";
          })();

          // determine the answer direction based on the offered direction and our hold state
          const answerDirection = ((): "inactive" | "recvonly" | "sendonly" | "sendrecv" => {
            switch (offeredDirection) {
              case "inactive":
                return "inactive";
              case "recvonly":
                return "sendonly";
              case "sendonly":
                return options?.hold ? "inactive" : "recvonly";
              case "sendrecv":
                return options?.hold ? "sendonly" : "sendrecv";
              default:
                throw new Error("Should never happen");
            }
          })();

          // set the transceiver direction to the answer direction
          this._peerConnection.getTransceivers().forEach((transceiver) => {
            if (transceiver.direction /* guarding, but should always be true */) {
              if (transceiver.direction !== "stopped" && transceiver.direction !== answerDirection) {
                transceiver.direction = answerDirection;
              }
            }
          });
        }
        break;
      case "have-local-offer":
      case "have-local-pranswer":
      case "have-remote-pranswer":
      case "closed":
      default:
        return Promise.reject(new Error("Invalid signaling state " + this._peerConnection.signalingState));
    }
    return Promise.resolve();
  }

  /**
   * Called when ICE gathering completes and resolves any waiting promise.
   */
  protected iceGatheringComplete(): void {
    this.logger.debug("SessionDescriptionHandler.iceGatheringComplete");
    // clear timer if need be
    if (this.iceGatheringCompleteTimeoutId !== undefined) {
      this.logger.debug("SessionDescriptionHandler.iceGatheringComplete - clearing timeout");
      clearTimeout(this.iceGatheringCompleteTimeoutId);
      this.iceGatheringCompleteTimeoutId = undefined;
    }
    // resolve and cleanup promise if need be
    if (this.iceGatheringCompletePromise !== undefined) {
      this.logger.debug("SessionDescriptionHandler.iceGatheringComplete - resolving promise");
      this.iceGatheringCompleteResolve && this.iceGatheringCompleteResolve();
      this.iceGatheringCompletePromise = undefined;
      this.iceGatheringCompleteResolve = undefined;
      this.iceGatheringCompleteReject = undefined;
    }
  }

  /**
   * Wait for ICE gathering to complete.
   * @param restart - If true, waits if current state is "complete" (waits for transition to "complete").
   * @param timeout - Milliseconds after which waiting times out. No timeout if 0.
   */
  protected waitForIceGatheringComplete(restart = false, timeout = 0): Promise<void> {
    this.logger.debug("SessionDescriptionHandler.waitForIceGatheringToComplete");
    if (this._peerConnection === undefined) {
      return Promise.reject("Peer connection closed.");
    }
    // guard already complete
    if (!restart && this._peerConnection.iceGatheringState === "complete") {
      this.logger.debug("SessionDescriptionHandler.waitForIceGatheringToComplete - already complete");
      return Promise.resolve();
    }
    // only one may be waiting, reject any prior
    if (this.iceGatheringCompletePromise !== undefined) {
      this.logger.debug("SessionDescriptionHandler.waitForIceGatheringToComplete - rejecting prior waiting promise");
      this.iceGatheringCompleteReject && this.iceGatheringCompleteReject(new Error("Promise superseded."));
      this.iceGatheringCompletePromise = undefined;
      this.iceGatheringCompleteResolve = undefined;
      this.iceGatheringCompleteReject = undefined;
    }
    this.iceGatheringCompletePromise = new Promise<void>((resolve, reject) => {
      this.iceGatheringCompleteResolve = resolve;
      this.iceGatheringCompleteReject = reject;
      if (timeout > 0) {
        this.logger.debug("SessionDescriptionHandler.waitForIceGatheringToComplete - timeout in " + timeout);
        this.iceGatheringCompleteTimeoutId = setTimeout(() => {
          this.logger.debug("SessionDescriptionHandler.waitForIceGatheringToComplete - timeout");
          this.iceGatheringComplete();
        }, timeout);
      }
    });
    return this.iceGatheringCompletePromise;
  }

  /**
   * Initializes the peer connection event handlers
   */
  private initPeerConnectionEventHandlers(): void {
    this.logger.debug("SessionDescriptionHandler.initPeerConnectionEventHandlers");

    if (!this._peerConnection) throw new Error("Peer connection undefined.");
    const peerConnection = this._peerConnection;

    peerConnection.onconnectionstatechange = (event): void => {
      const newState = peerConnection.connectionState;
      this.logger.debug(`SessionDescriptionHandler.onconnectionstatechange ${newState}`);
      if (this._peerConnectionDelegate?.onconnectionstatechange) {
        this._peerConnectionDelegate.onconnectionstatechange(event);
      }
    };

    peerConnection.ondatachannel = (event): void => {
      this.logger.debug(`SessionDescriptionHandler.ondatachannel`);
      this._dataChannel = event.channel;
      if (this.onDataChannel) {
        this.onDataChannel(this._dataChannel);
      }
      if (this._peerConnectionDelegate?.ondatachannel) {
        this._peerConnectionDelegate.ondatachannel(event);
      }
    };

    peerConnection.onicecandidate = (event): void => {
      this.logger.debug(`SessionDescriptionHandler.onicecandidate`);
      if (this._peerConnectionDelegate?.onicecandidate) {
        this._peerConnectionDelegate.onicecandidate(event);
      }
    };

    peerConnection.onicecandidateerror = (event: any): void => {
      this.logger.debug(`SessionDescriptionHandler.onicecandidateerror`);
      if (this._peerConnectionDelegate?.onicecandidateerror) {
        this._peerConnectionDelegate.onicecandidateerror(event);
      }
    };

    peerConnection.oniceconnectionstatechange = (event): void => {
      const newState = peerConnection.iceConnectionState;
      this.logger.debug(`SessionDescriptionHandler.oniceconnectionstatechange ${newState}`);
      if (this._peerConnectionDelegate?.oniceconnectionstatechange) {
        this._peerConnectionDelegate.oniceconnectionstatechange(event);
      }
    };

    peerConnection.onicegatheringstatechange = (event): void => {
      const newState = peerConnection.iceGatheringState;
      this.logger.debug(`SessionDescriptionHandler.onicegatheringstatechange ${newState}`);
      if (newState === "complete") {
        this.iceGatheringComplete(); // complete waiting for ICE gathering to complete
      }
      if (this._peerConnectionDelegate?.onicegatheringstatechange) {
        this._peerConnectionDelegate.onicegatheringstatechange(event);
      }
    };

    peerConnection.onnegotiationneeded = (event): void => {
      this.logger.debug(`SessionDescriptionHandler.onnegotiationneeded`);
      if (this._peerConnectionDelegate?.onnegotiationneeded) {
        this._peerConnectionDelegate.onnegotiationneeded(event);
      }
    };

    peerConnection.onsignalingstatechange = (event): void => {
      const newState = peerConnection.signalingState;
      this.logger.debug(`SessionDescriptionHandler.onsignalingstatechange ${newState}`);
      if (this._peerConnectionDelegate?.onsignalingstatechange) {
        this._peerConnectionDelegate.onsignalingstatechange(event);
      }
    };

    peerConnection.onstatsended = (event: any): void => {
      this.logger.debug(`SessionDescriptionHandler.onstatsended`);
      if (this._peerConnectionDelegate?.onstatsended) {
        this._peerConnectionDelegate.onstatsended(event);
      }
    };

    peerConnection.ontrack = (event): void => {
      const kind = event.track.kind;
      const enabled = event.track.enabled ? "enabled" : "disabled";
      this.logger.debug(`SessionDescriptionHandler.ontrack ${kind} ${enabled}`);
      this.setRemoteTrack(event.track);
      if (this._peerConnectionDelegate?.ontrack) {
        this._peerConnectionDelegate.ontrack(event);
      }
    };
  }
}
