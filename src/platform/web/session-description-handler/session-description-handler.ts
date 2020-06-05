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

// Terminology notes for those not familiar...
//
// A MediaStream is a collection MediaStreamTracks
//  - these are used to get cam/mic tracks and attach tracks to audio/video tags
//  - a video tag renders both audio and video tracks
//
// A PeerConnection has Transceivers (only ever one in our use case)
// A Transceiver has a Sender and a Receiver
// A Sender has zero or more MediaStreamTracks
// A Receiver has zero or more MediaStreamTracks
//  - a transceiver maps to SDP; sender local SDP, receiver to remote
//  - in our use case, there's one audio track optionally one video track per sender/receiver
//  - in theory, 3-way calling could be implemented by adding a the audio track from a receiver
//    on one peer connection to the sender of another peer connection'

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
  protected _localMediaStream: MediaStream;
  protected _remoteMediaStream: MediaStream;

  protected _peerConnection: RTCPeerConnection | undefined;
  protected _peerConnectionConfiguration: RTCConfiguration | undefined;
  protected _peerConnectionDelegate: PeerConnectionDelegate | undefined;

  private iceGatheringCompletePromise: Promise<void> | undefined;
  private iceGatheringCompleteTimeoutId: number | undefined;
  private iceGatheringCompleteResolve: ResolveFunction | undefined;
  private iceGatheringCompleteReject: RejectFunction | undefined;

  private localMediaStreamConstraints: MediaStreamConstraints | undefined;

  /**
   * Constructor
   * @param logger - A logger
   * @param mediaStreamFactory - A factory to provide a MediaStream
   * @param options - Options passed from the SessionDescriptionHandleFactory
   */
  constructor(
    protected logger: Logger,
    protected mediaStreamFactory: MediaStreamFactory,
    protected sessionDescriptionHandlerConfiguration?: SessionDescriptionHandlerConfiguration
  ) {
    logger.debug("SessionDescriptionHandler.constructor");
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

    // ICE will restart upon applying an offer created with the iceRestart option
    const iceRestart = options?.offerOptions?.iceRestart;

    // ICE gathering timeout may be set on a per call basis, otherwise the configured default is used
    const iceTimeout =
      options?.iceGatheringTimeout === undefined
        ? this.sessionDescriptionHandlerConfiguration?.iceGatheringTimeout
        : options?.iceGatheringTimeout;

    return this.getLocalMediaStream(options)
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
   * The modifier that should be used when the session would like to place the call on hold.
   * @param sessionDescription - The description that will be modified.
   */
  public holdModifier(sessionDescription: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    this.logger.debug("SessionDescriptionHandler.holdModifier");
    if (!sessionDescription.sdp || !sessionDescription.type) {
      throw new Error("Invalid SDP");
    }
    let sdp = sessionDescription.sdp;
    const type = sessionDescription.type;
    if (sdp) {
      if (!/a=(sendrecv|sendonly|recvonly|inactive)/.test(sdp)) {
        sdp = sdp.replace(/(m=[^\r]*\r\n)/g, "$1a=sendonly\r\n");
      } else {
        sdp = sdp.replace(/a=sendrecv\r\n/g, "a=sendonly\r\n");
        sdp = sdp.replace(/a=recvonly\r\n/g, "a=inactive\r\n");
      }
    }
    return Promise.resolve({ sdp, type });
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
   * @param  sessionDescription - The session description.
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
    if (!modifiers) {
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
          new Promise((resolve) => {
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
          new Promise((resolve) => {
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
   * @param restart If true, waits if current state is "complete" (waits for transition to "complete").
   * @param timeout Milliseconds after which waiting times out. No timeout if 0.
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

    peerConnection.onicecandidateerror = (event): void => {
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

    peerConnection.onstatsended = (event): void => {
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
