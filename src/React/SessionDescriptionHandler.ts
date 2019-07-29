import { EventEmitter } from "events";
import {
  mediaDevices,
  MediaStream,
  RTCPeerConnection,
} from "react-native-webrtc";

import { Logger } from "../core";
import { TypeStrings } from "../Enums";
import { Exceptions } from "../Exceptions";
import { InviteClientContext, InviteServerContext } from "../Session";
import {
  BodyObj,
  SessionDescriptionHandler as SessionDescriptionHandlerDefinition,
  SessionDescriptionHandlerModifiers
} from "../session-description-handler";
import { Utils } from "../Utils";

import { Session } from "../api/session";
import * as Modifiers from "../Web/Modifiers";
import { SessionDescriptionHandlerObserver } from "./SessionDescriptionHandlerObserver";

/* SessionDescriptionHandler
 * @class PeerConnection helper Class.
 * @param {SIP.Session} session
 * @param {Object} [options]
 */

export class SessionDescriptionHandler extends EventEmitter implements SessionDescriptionHandlerDefinition {
  /**
   * @param {SIP.Session} session
   * @param {Object} [options]
   */
  public static defaultFactory(
    session: InviteClientContext | InviteServerContext,
    options: any
  ): SessionDescriptionHandler {
    const logger: Logger =
      (session instanceof Session) ?
        session.userAgent.getLogger("sip.sessionDescriptionHandler", session.id) :
        session.ua.getLogger("sip.invitecontext.sessionDescriptionHandler", session.id);
    const observer: SessionDescriptionHandlerObserver = new SessionDescriptionHandlerObserver(session, options);
    return new SessionDescriptionHandler(logger, observer, options);
  }

  public type: TypeStrings;
  private options: any;
  private logger: Logger;
  private observer: SessionDescriptionHandlerObserver;
  private dtmfSender: any;
  private shouldAcquireMedia: boolean;
  private CONTENT_TYPE: string;
  private direction: string;
  private C: any;
  private modifiers: SessionDescriptionHandlerModifiers;
  private WebRTC: any;
  private iceGatheringDeferred: Utils.Deferred<any> | undefined;
  private iceGatheringTimeout: boolean;
  private iceGatheringTimer: any | undefined;
  private constraints: any;
  private peerConnection: any;

  constructor(logger: Logger, observer: SessionDescriptionHandlerObserver, options: any) {
    super();
    this.type = TypeStrings.SessionDescriptionHandler;
    // TODO: Validate the options
    this.options = options || {};

    this.logger = logger;
    this.observer = observer;
    this.dtmfSender = undefined;

    this.shouldAcquireMedia = true;

    this.CONTENT_TYPE = "application/sdp";

    this.C = {
      DIRECTION: {
        NULL:     null,
        SENDRECV: "sendrecv",
        SENDONLY: "sendonly",
        RECVONLY: "recvonly",
        INACTIVE: "inactive"
      }
    };

    this.logger.log("SessionDescriptionHandlerOptions: " + JSON.stringify(this.options));

    this.direction = this.C.DIRECTION.NULL;

    this.modifiers = this.options.modifiers || [];
    if (!Array.isArray(this.modifiers)) {
      this.modifiers = [this.modifiers];
    }

    this.WebRTC = {
      MediaStream,
      getUserMedia: mediaDevices.getUserMedia,
      RTCPeerConnection
    };

    this.iceGatheringTimeout = false;

    this.initPeerConnection(this.options.peerConnectionOptions);

    this.constraints = this.checkAndDefaultConstraints(this.options.constraints);
  }

  // Functions the sesssion can use

  /**
   * Destructor
   */
  public close(): void {
    this.logger.log("closing PeerConnection");
    // have to check signalingState since this.close() gets called multiple times
    if (this.peerConnection && this.peerConnection.signalingState !== "closed") {
      if (this.peerConnection.getSenders) {
        this.peerConnection.getSenders().forEach((sender: any) => {
          if (sender.track) {
            sender.track.stop();
          }
        });
      } else {
        this.logger.warn("Using getLocalStreams which is deprecated");
        this.peerConnection.getLocalStreams().forEach((stream: any) => {
          stream.getTracks().forEach((track: any) => {
            track.stop();
          });
        });
      }
      if (this.peerConnection.getReceivers) {
        this.peerConnection.getReceivers().forEach((receiver: any) => {
          if (receiver.track) {
            receiver.track.stop();
          }
        });
      } else {
        this.logger.warn("Using getRemoteStreams which is deprecated");
        this.peerConnection.getRemoteStreams().forEach((stream: any) => {
          stream.getTracks().forEach((track: any) => {
            track.stop();
          });
        });
      }
      this.resetIceGatheringComplete();
      this.peerConnection.close();
    }
  }

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
  public getDescription(options: any = {}, modifiers: SessionDescriptionHandlerModifiers= []): Promise<BodyObj> {
    if (options.peerConnectionOptions) {
      this.initPeerConnection(options.peerConnectionOptions);
    }

    // Merge passed constraints with saved constraints and save
    let newConstraints: any = Object.assign({}, this.constraints, options.constraints);
    newConstraints = this.checkAndDefaultConstraints(newConstraints);
    if (JSON.stringify(newConstraints) !== JSON.stringify(this.constraints)) {
        this.constraints = newConstraints;
        this.shouldAcquireMedia = true;
    }

    if (!Array.isArray(modifiers)) {
      modifiers = [modifiers];
    }
    modifiers = modifiers.concat(this.modifiers);

    return Promise.resolve().then(() => {
      if (this.shouldAcquireMedia) {
        return this.acquire(this.constraints).then(() => {
          this.shouldAcquireMedia = false;
        });
      }
    }).then(() => this.createOfferOrAnswer(options.RTCOfferOptions, modifiers))
    .then((description: RTCSessionDescriptionInit) => {
      // Recreate offer containing the ICE Candidates
      if (description.type === "offer") {
        return this.peerConnection.createOffer()
        .then((sdp: RTCSessionDescriptionInit) => this.createRTCSessionDescriptionInit(sdp));
      }
      return description;
    }).catch((e) => {
      if (e.type === TypeStrings.SessionDescriptionHandlerError) {
        throw e;
      }
      const error = new Exceptions.SessionDescriptionHandlerError("createOffer failed", e);
      this.logger.error(error.toString());
      throw error;
    }).then((description: RTCSessionDescriptionInit) => {
      if (description.sdp === undefined) {
        throw new Exceptions.SessionDescriptionHandlerError("getDescription", undefined, "SDP undefined");
      }
      this.emit("getDescription", description);
      return {
        body: description.sdp,
        contentType: this.CONTENT_TYPE
      };
    });
  }

  /**
   * Check if the Session Description Handler can handle the Content-Type described by a SIP Message
   * @param {String} contentType The content type that is in the SIP Message
   * @returns {boolean}
   */
  public hasDescription(contentType: string): boolean {
    return contentType === this.CONTENT_TYPE;
  }

  /**
   * The modifier that should be used when the session would like to place the call on hold
   * @param {String} [sdp] The description that will be modified
   * @returns {Promise} Promise that resolves with modified SDP
   */
  public holdModifier(description: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    if (!description.sdp) {
      return Promise.resolve(description);
    }

    if (!(/a=(sendrecv|sendonly|recvonly|inactive)/).test(description.sdp)) {
      description.sdp = description.sdp.replace(/(m=[^\r]*\r\n)/g, "$1a=sendonly\r\n");
    } else {
      description.sdp = description.sdp.replace(/a=sendrecv\r\n/g, "a=sendonly\r\n");
      description.sdp = description.sdp.replace(/a=recvonly\r\n/g, "a=inactive\r\n");
    }
    return Promise.resolve(description);
  }

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
  public setDescription(
    sessionDescription: string,
    options: any = {},
    modifiers: SessionDescriptionHandlerModifiers = []
  ): Promise<void> {
    options = options || {};
    if (options.peerConnectionOptions) {
      this.initPeerConnection(options.peerConnectionOptions);
    }

    if (!Array.isArray(modifiers)) {
      modifiers = [modifiers];
    }
    modifiers = modifiers.concat(this.modifiers);

    const description: RTCSessionDescriptionInit = {
      type: this.hasOffer("local") ? "answer" : "offer",
      sdp: sessionDescription
    };

    return Promise.resolve().then(() => {
      // Media should be acquired in getDescription unless we need to do it sooner for some reason (FF61+)
      if (this.shouldAcquireMedia && this.options.alwaysAcquireMediaFirst) {
        return this.acquire(this.constraints).then(() => {
          this.shouldAcquireMedia = false;
        });
      }
    }).then(() => Utils.reducePromises(modifiers, description))
    .catch((e) => {
      if (e.type === TypeStrings.SessionDescriptionHandlerError) {
        throw e;
      }
      const error = new Exceptions.SessionDescriptionHandlerError(
        "setDescription", e,
        "The modifiers did not resolve successfully"
      );
      this.logger.error(error.message);
      this.emit("peerConnection-setRemoteDescriptionFailed", error);
      throw error;
    }).then((modifiedDescription) => {
      this.emit("setDescription", modifiedDescription);
      return this.peerConnection.setRemoteDescription(modifiedDescription);
    }).catch((e) => {
      if (e.type === TypeStrings.SessionDescriptionHandlerError) {
        throw e;
      }
      // Check the original SDP for video, and ensure that we have want to do audio fallback
      if ((/^m=video.+$/gm).test(sessionDescription) && !options.disableAudioFallback) {
        // Do not try to audio fallback again
        options.disableAudioFallback = true;
        // Remove video first, then do the other modifiers
        return this.setDescription(sessionDescription, options, [Modifiers.stripVideo].concat(modifiers));
      }
      const error = new Exceptions.SessionDescriptionHandlerError("setDescription", e);
      if (error.error) {
        this.logger.error(error.error);
      }
      this.emit("peerConnection-setRemoteDescriptionFailed", error);
      throw error;
    }).then(() => {
      if (this.peerConnection.getReceivers) {
        this.emit("setRemoteDescription", this.peerConnection.getReceivers());
      } else {
        this.emit("setRemoteDescription", this.peerConnection.getRemoteStreams());
      }
      this.emit("confirmed", this);
    });
  }

  /**
   * Send DTMF via RTP (RFC 4733)
   * @param {String} tones A string containing DTMF digits
   * @param {Object} [options] Options object to be used by sendDtmf
   * @returns {boolean} true if DTMF send is successful, false otherwise
   */
  public sendDtmf(tones: string, options: any): boolean {
    if (!this.dtmfSender && this.hasBrowserGetSenderSupport()) {
      const senders = this.peerConnection.getSenders();
      if (senders.length > 0) {
        this.dtmfSender = senders[0].dtmf;
      }
    }
    if (!this.dtmfSender && this.hasBrowserTrackSupport()) {
      const streams = this.peerConnection.getLocalStreams();
      if (streams.length > 0) {
        const audioTracks = streams[0].getAudioTracks();
        if (audioTracks.length > 0) {
          this.dtmfSender = this.peerConnection.createDTMFSender(audioTracks[0]);
        }
      }
    }
    if (!this.dtmfSender) {
      return false;
    }
    try {
      this.dtmfSender.insertDTMF(tones, options.duration, options.interToneGap);
    } catch (e) {
      if (e.type ===  "InvalidStateError" || e.type ===  "InvalidCharacterError") {
        this.logger.error(e);
        return false;
      } else {
        throw e;
      }
    }
    this.logger.log("DTMF sent via RTP: " + tones.toString());
    return true;
  }

  public getDirection(): string {
    return this.direction;
  }

  // Internal functions
  private createOfferOrAnswer(
    RTCOfferOptions: any = {},
    modifiers: SessionDescriptionHandlerModifiers
  ): Promise<RTCSessionDescriptionInit> {
    RTCOfferOptions = RTCOfferOptions || {};

    const methodName: string = this.hasOffer("remote") ? "createAnswer" : "createOffer";
    const pc = this.peerConnection;

    this.logger.log(methodName);

    return pc[methodName](RTCOfferOptions).catch((e: any) => {
      if (e.type === TypeStrings.SessionDescriptionHandlerError) {
        throw e;
      }
      const error = new Exceptions.SessionDescriptionHandlerError(
        "createOfferOrAnswer", e,
        "peerConnection-" + methodName + "Failed"
      );
      this.emit("peerConnection-" + methodName + "Failed", error);
      throw error;
    }).then(
      (sdp: RTCSessionDescriptionInit) => Utils.reducePromises(modifiers, this.createRTCSessionDescriptionInit(sdp)))
      .then((sdp: RTCSessionDescriptionInit) => {
        this.resetIceGatheringComplete();
        this.logger.log("Setting local sdp.");
        this.logger.log("sdp is " + sdp.sdp || "undefined");
        return pc.setLocalDescription(sdp);
      })
      .catch((e: any) => {
        if (e.type === TypeStrings.SessionDescriptionHandlerError) {
          throw e;
        }
        const error = new Exceptions.SessionDescriptionHandlerError(
          "createOfferOrAnswer", e,
          "peerConnection-SetLocalDescriptionFailed"
        );
        this.emit("peerConnection-SetLocalDescriptionFailed", error);
        throw error;
      }).then(() => this.waitForIceGatheringComplete())
      .then(() => {
        const localDescription: RTCSessionDescriptionInit =
          this.createRTCSessionDescriptionInit(this.peerConnection.localDescription);
        return Utils.reducePromises(modifiers, localDescription);
      }).then((localDescription: RTCSessionDescriptionInit) => {
        this.setDirection(localDescription.sdp || "");
        return localDescription;
      }).catch((e: any) => {
        if (e.type === TypeStrings.SessionDescriptionHandlerError) {
          throw e;
        }
        const error = new Exceptions.SessionDescriptionHandlerError("createOfferOrAnswer", e);
        this.logger.error(error.toString());
        throw error;
      });
  }

  // Creates an RTCSessionDescriptionInit from an RTCSessionDescription
  private createRTCSessionDescriptionInit(RTCSessionDescription: RTCSessionDescriptionInit): RTCSessionDescriptionInit {
    return {
      type: RTCSessionDescription.type,
      sdp: RTCSessionDescription.sdp
    };
  }

  private addDefaultIceCheckingTimeout(peerConnectionOptions: any): any {
    if (peerConnectionOptions.iceCheckingTimeout === undefined) {
      peerConnectionOptions.iceCheckingTimeout = 5000;
    }
    return peerConnectionOptions;
  }

  private addDefaultIceServers(rtcConfiguration: any): any {
    if (!rtcConfiguration.iceServers) {
      rtcConfiguration.iceServers = [{urls: "stun:stun.l.google.com:19302"}];
    }
    return rtcConfiguration;
  }

  private checkAndDefaultConstraints(constraints: any): any {
    const defaultConstraints: any = {audio: true, video: !this.options.alwaysAcquireMediaFirst};

    constraints = constraints || defaultConstraints;
    // Empty object check
    if (Object.keys(constraints).length === 0 && constraints.constructor === Object) {
      return defaultConstraints;
    }
    return constraints;
  }

  private hasBrowserTrackSupport(): boolean {
    return Boolean(this.peerConnection.addTrack);
  }

  private hasBrowserGetSenderSupport(): boolean {
    return Boolean(this.peerConnection.getSenders);
  }

  private initPeerConnection(options: any = {}): void {
    options = this.addDefaultIceCheckingTimeout(options);
    options.rtcConfiguration = options.rtcConfiguration || {};
    options.rtcConfiguration = this.addDefaultIceServers(options.rtcConfiguration);

    this.logger.log("initPeerConnection");

    if (this.peerConnection) {
      this.logger.log("Already have a peer connection for this session. Tearing down.");
      this.resetIceGatheringComplete();
      this.peerConnection.close();
    }

    this.peerConnection = new this.WebRTC.RTCPeerConnection(options.rtcConfiguration);

    this.logger.log("New peer connection created");

    if ("ontrack" in this.peerConnection) {
      this.peerConnection.addEventListener("track", (e: any) => {
        this.logger.log("track added");
        this.observer.trackAdded();
        this.emit("addTrack", e);
      });
    } else {
      this.logger.warn("Using onaddstream which is deprecated");
      this.peerConnection.onaddstream = (e: any) => {
        this.logger.log("stream added");
        this.emit("addStream", e);
      };
    }

    this.peerConnection.onicecandidate = (e: any) => {
      this.emit("iceCandidate", e);
      if (e.candidate) {
        this.logger.log("ICE candidate received: " +
          (e.candidate.candidate === null ? null : e.candidate.candidate.trim()));
      } else if (e.candidate === null) {
        // indicates the end of candidate gathering
        this.logger.log("ICE candidate gathering complete");
        this.triggerIceGatheringComplete();
      }
    };

    this.peerConnection.onicegatheringstatechange = () => {
      this.logger.log("RTCIceGatheringState changed: " + this.peerConnection.iceGatheringState);
      switch (this.peerConnection.iceGatheringState) {
      case "gathering":
        this.emit("iceGathering", this);
        if (!this.iceGatheringTimer && options.iceCheckingTimeout) {
          this.iceGatheringTimeout = false;
          this.iceGatheringTimer = setTimeout(() => {
            this.logger.log("RTCIceChecking Timeout Triggered after " + options.iceCheckingTimeout + " milliseconds");
            this.iceGatheringTimeout = true;
            this.triggerIceGatheringComplete();
          }, options.iceCheckingTimeout);
        }
        break;
      case "complete":
        this.triggerIceGatheringComplete();
        break;
      }
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      let stateEvent: string;

      switch (this.peerConnection.iceConnectionState) {
        case "new":
          stateEvent = "iceConnection";
          break;
        case "checking":
          stateEvent = "iceConnectionChecking";
          break;
        case "connected":
          stateEvent = "iceConnectionConnected";
          break;
        case "completed":
          stateEvent = "iceConnectionCompleted";
          break;
        case "failed":
          stateEvent = "iceConnectionFailed";
          break;
        case "disconnected":
          stateEvent = "iceConnectionDisconnected";
          break;
        case "closed":
          stateEvent = "iceConnectionClosed";
          break;
        default:
          this.logger.warn("Unknown iceConnection state: " + this.peerConnection.iceConnectionState);
          return;
      }
      this.logger.log("ICE Connection State changed to " + stateEvent);
      this.emit(stateEvent, this);
    };
  }

  private acquire(constraints: any): any {
    // Default audio & video to true
    constraints = this.checkAndDefaultConstraints(constraints);

    return new Promise((resolve, reject) => {
      /*
       * Make the call asynchronous, so that ICCs have a chance
       * to define callbacks to `userMediaRequest`
       */
      this.logger.log("acquiring local media");
      this.emit("userMediaRequest", constraints);

      if (constraints.audio || constraints.video) {
        this.WebRTC.getUserMedia(constraints).then((streams: any) => {
          this.observer.trackAdded();
          this.emit("userMedia", streams);
          resolve(streams);
        }).catch((e: any) => {
          this.emit("userMediaFailed", e);
          reject(e);
        });
      } else {
        // Local streams were explicitly excluded.
        resolve([]);
      }
    }).catch((e) => {
      if (e.type === TypeStrings.SessionDescriptionHandlerError) {
        throw e;
      }
      const error = new Exceptions.SessionDescriptionHandlerError("acquire", e, "unable to acquire streams");
      this.logger.error(error.message);
      if (error.error) {
        this.logger.error(error.error);
      }
      throw error;
    }).then((streams) => {
      this.logger.log("acquired local media streams");
      try {
        // Remove old tracks
        if (this.peerConnection.removeTrack) {
          this.peerConnection.getSenders().forEach((sender: any) => {
            this.peerConnection.removeTrack(sender);
          });
        }
        return streams;
      } catch (e) {
        return Promise.reject(e);
      }
    })
    .catch((e) => {
      if (e.type === TypeStrings.SessionDescriptionHandlerError) {
        throw e;
      }
      const error = new Exceptions.SessionDescriptionHandlerError("acquire", e, "error removing streams");
      this.logger.error(error.message);
      if (error.error) {
        this.logger.error(error.error);
      }
      throw error;
    }).then((streams: any) => {
      try {
        streams = [].concat(streams);
        streams.forEach((stream: any) => {
          if (this.peerConnection.addTrack) {
            stream.getTracks().forEach((track: any) => {
              this.peerConnection.addTrack(track, stream);
            });
          } else {
            // Chrome 59 does not support addTrack
            this.peerConnection.addStream(stream);
          }
        });
      } catch (e) {
        return Promise.reject(e);
      }
      return Promise.resolve();
    })
    .catch((e) => {
      if (e.type === TypeStrings.SessionDescriptionHandlerError) {
        throw e;
      }
      const error = new Exceptions.SessionDescriptionHandlerError("acquire", e, "error adding stream");
      this.logger.error(error.message);
      if (error.error) {
        this.logger.error(error.error);
      }
      throw error;
    });
  }

  private hasOffer(where: string): boolean {
    const offerState: string = "have-" + where + "-offer";
    return this.peerConnection.signalingState === offerState;
  }

  // ICE gathering state handling
  private isIceGatheringComplete(): boolean {
    return this.peerConnection.iceGatheringState === "complete" || this.iceGatheringTimeout;
  }

  private resetIceGatheringComplete(): void {
    this.iceGatheringTimeout = false;

    this.logger.log("resetIceGatheringComplete");

    if (this.iceGatheringTimer) {
      clearTimeout(this.iceGatheringTimer);
      this.iceGatheringTimer = undefined;
    }

    if (this.iceGatheringDeferred) {
      this.iceGatheringDeferred.reject();
      this.iceGatheringDeferred = undefined;
    }
  }

  private setDirection(sdp: string): void {
    const match = sdp.match(/a=(sendrecv|sendonly|recvonly|inactive)/);
    if (match === null) {
      this.direction = this.C.DIRECTION.NULL;
      this.observer.directionChanged();
      return;
    }
    const direction: string = match[1];
    switch (direction) {
      case this.C.DIRECTION.SENDRECV:
      case this.C.DIRECTION.SENDONLY:
      case this.C.DIRECTION.RECVONLY:
      case this.C.DIRECTION.INACTIVE:
        this.direction = direction;
        break;
      default:
        this.direction = this.C.DIRECTION.NULL;
        break;
    }
    this.observer.directionChanged();
  }

  private triggerIceGatheringComplete(): void {
    if (this.isIceGatheringComplete()) {
      this.emit("iceGatheringComplete", this);

      if (this.iceGatheringTimer) {
        clearTimeout(this.iceGatheringTimer);
        this.iceGatheringTimer = undefined;
      }

      if (this.iceGatheringDeferred) {
        this.iceGatheringDeferred.resolve();
        this.iceGatheringDeferred = undefined;
      }
    }
  }

  private waitForIceGatheringComplete(): Promise<any> {
    this.logger.log("waitForIceGatheringComplete");
    if (this.isIceGatheringComplete()) {
      this.logger.log("ICE is already complete. Return resolved.");
      return Promise.resolve();
    } else if (!this.iceGatheringDeferred) {
      this.iceGatheringDeferred = Utils.defer();
    }
    this.logger.log("ICE is not complete. Returning promise");
    return this.iceGatheringDeferred ? this.iceGatheringDeferred.promise : Promise.resolve();
  }
}
