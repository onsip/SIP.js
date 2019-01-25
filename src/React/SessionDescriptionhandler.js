"use strict";

var WebRTC = require('react-native-webrtc');
var {
  RTCPeerConnection,
  MediaStream,
  mediaDevices,
} = WebRTC;

/**
 * @fileoverview SessionDescriptionHandler
 */

 /* SessionDescriptionHandler
  * @class PeerConnection helper Class.
  * @param {SIP.Session} session
  * @param {Object} [options]
  */
module.exports = function (SIP) {

// Constructor
var SessionDescriptionHandler = function(logger, observer, options) {
  // TODO: Validate the options
  this.options = options || {};

  this.logger = logger;
  this.observer = observer;
  this.dtmfSender = null;

  this.shouldAcquireMedia = true;

  this.CONTENT_TYPE = 'application/sdp';

  this.C = {};
  this.C.DIRECTION = {
    NULL:     null,
    SENDRECV: "sendrecv",
    SENDONLY: "sendonly",
    RECVONLY: "recvonly",
    INACTIVE: "inactive"
  };

  this.logger.log('SessionDescriptionHandlerOptions: ' + JSON.stringify(this.options));

  this.direction = this.C.DIRECTION.NULL;

  this.modifiers = this.options.modifiers || [];
  if (!Array.isArray(this.modifiers)) {
    this.modifiers = [this.modifiers];
  }

  this.WebRTC = {
    MediaStream: MediaStream,
    getUserMedia: mediaDevices.getUserMedia,
    RTCPeerConnection: RTCPeerConnection
  };

  this.iceGatheringDeferred = null;
  this.iceGatheringTimeout = false;
  this.iceGatheringTimer = null;

  this.initPeerConnection(this.options.peerConnectionOptions);

  this.constraints = this.checkAndDefaultConstraints(this.options.constraints);
};

/**
 * @param {SIP.Session} session
 * @param {Object} [options]
 */

SessionDescriptionHandler.defaultFactory = function defaultFactory (session, options) {
  var logger = session.ua.getLogger('sip.invitecontext.sessionDescriptionHandler', session.id);
  var SessionDescriptionHandlerObserver = require('./SessionDescriptionHandlerObserver');
  var observer = new SessionDescriptionHandlerObserver(session, options);
  return new SessionDescriptionHandler(logger, observer, options);
};

SessionDescriptionHandler.prototype = Object.create(SIP.SessionDescriptionHandler.prototype, {
  // Functions the sesssion can use

  /**
   * Destructor
   */
  close: {writable: true, value: function () {
    this.logger.log('closing PeerConnection');
    // have to check signalingState since this.close() gets called multiple times
    if(this.peerConnection && this.peerConnection.signalingState !== 'closed') {
      if (this.peerConnection.getSenders) {
        this.peerConnection.getSenders().forEach((sender) => {
          if (sender.track) {
            sender.track.stop();
          }
        });
      } else {
        this.logger.warn('Using getLocalStreams which is deprecated');
        this.peerConnection.getLocalStreams().forEach((stream) => {
          stream.getTracks().forEach((track) => {
            track.stop();
          });
        });
      }
      if (this.peerConnection.getReceivers) {
        this.peerConnection.getReceivers().forEach((receiver) => {
          if (receiver.track) {
            receiver.track.stop();
          }
        });
      } else {
        this.logger.warn('Using getRemoteStreams which is deprecated');
        this.peerConnection.getRemoteStreams().forEach((stream) => {
          stream.getTracks().forEach((track) => {
            track.stop();
          });
        });
      }
      this.resetIceGatheringComplete();
      this.peerConnection.close();
    }
  }},

  /**
   * Gets the local description from the underlying media implementation
   * @param {Object} [options] Options object to be used by getDescription
   * @param {MediaStreamConstraints} [options.constraints] MediaStreamConstraints https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamConstraints
   * @param {Object} [options.peerConnectionOptions] If this is set it will recreate the peer connection with the new options
   * @param {Array} [modifiers] Array with one time use description modifiers
   * @returns {Promise} Promise that resolves with the local description to be used for the session
   */
  getDescription: {writable: true, value: function (options, modifiers) {
    options = options || {};
    if (options.peerConnectionOptions) {
      this.initPeerConnection(options.peerConnectionOptions);
    }

    // Merge passed constraints with saved constraints and save
    var newConstraints = Object.assign({}, this.constraints, options.constraints);
    newConstraints = this.checkAndDefaultConstraints(newConstraints);
    if (JSON.stringify(newConstraints) !== JSON.stringify(this.constraints)) {
        this.constraints = newConstraints;
        this.shouldAcquireMedia = true;
    }

    modifiers = modifiers || [];
    if (!Array.isArray(modifiers)) {
      modifiers = [modifiers];
    }
    modifiers = modifiers.concat(this.modifiers);

    return Promise.resolve()
    .then(() => {
      if (this.shouldAcquireMedia) {
        return this.acquire(this.constraints).then(() => {
          this.shouldAcquireMedia = false;
        });
      }
    })
    .then(() => this.createOfferOrAnswer(options.RTCOfferOptions, modifiers))
    .then((description) => {
      // Recreate offer containing the ICE Candidates
      if (description.type === 'offer') {
        return this.peerConnection.createOffer()
        .then((sdp) => this.createRTCSessionDescriptionInit(sdp));
      }
      return description;
    })
    .catch((e) => {
      if (e instanceof SIP.Exceptions.SessionDescriptionHandlerError) {
        throw e;
      }
      const error = new SIP.Exceptions.SessionDescriptionHandlerError("createOffer failed", e);
      this.logger.error(error);
      throw error;
    })
    .then((description) => {
      this.emit('getDescription', description);
      return {
        body: description.sdp,
        contentType: this.CONTENT_TYPE
      };
    });
  }},

  /**
   * Check if the Session Description Handler can handle the Content-Type described by a SIP Message
   * @param {String} contentType The content type that is in the SIP Message
   * @returns {boolean}
   */
  hasDescription: {writable: true, value: function hasDescription (contentType) {
    return contentType === this.CONTENT_TYPE;
  }},

  /**
   * The modifier that should be used when the session would like to place the call on hold
   * @param {String} [sdp] The description that will be modified
   * @returns {Promise} Promise that resolves with modified SDP
   */
  holdModifier: {writable: true, value: function holdModifier (description) {
    if (!(/a=(sendrecv|sendonly|recvonly|inactive)/).test(description.sdp)) {
      description.sdp = description.sdp.replace(/(m=[^\r]*\r\n)/g, '$1a=sendonly\r\n');
    } else {
      description.sdp = description.sdp.replace(/a=sendrecv\r\n/g, 'a=sendonly\r\n');
      description.sdp = description.sdp.replace(/a=recvonly\r\n/g, 'a=inactive\r\n');
    }
    return Promise.resolve(description);
  }},

  /**
   * Set the remote description to the underlying media implementation
   * @param {String} sessionDescription The description provided by a SIP message to be set on the media implementation
   * @param {Object} [options] Options object to be used by getDescription
   * @param {MediaStreamConstraints} [options.constraints] MediaStreamConstraints https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamConstraints
   * @param {Object} [options.peerConnectionOptions] If this is set it will recreate the peer connection with the new options
   * @param {Array} [modifiers] Array with one time use description modifiers
   * @returns {Promise} Promise that resolves once the description is set
   */
  setDescription: {writable:true, value: function setDescription (sessionDescription, options, modifiers) {
    options = options || {};
    if (options.peerConnectionOptions) {
      this.initPeerConnection(options.peerConnectionOptions);
    }

    modifiers = modifiers || [];
    if (!Array.isArray(modifiers)) {
      modifiers = [modifiers];
    }
    modifiers = modifiers.concat(this.modifiers);

    var description = {
      type: this.hasOffer('local') ? 'answer' : 'offer',
      sdp: sessionDescription
    };

    return Promise.resolve()
    .then(() => {
      // Media should be acquired in getDescription unless we need to do it sooner for some reason (FF61+)
      if (this.shouldAcquireMedia && this.options.alwaysAcquireMediaFirst) {
        return this.acquire(this.constraints).then(() => {
          this.shouldAcquireMedia = false;
        });
      }
    })
    .then(() => SIP.Utils.reducePromises(modifiers, description))
    .catch((e) => {
      if (e instanceof SIP.Exceptions.SessionDescriptionHandlerError) {
        throw e;
      }
      const error = new SIP.Exceptions.SessionDescriptionHandlerError("setDescription", e, "The modifiers did not resolve successfully");
      this.logger.error(error.message);
      this.emit('peerConnection-setRemoteDescriptionFailed', error);
      throw error;
    })
    .then((modifiedDescription) => {
      this.emit('setDescription', modifiedDescription);
      return this.peerConnection.setRemoteDescription(modifiedDescription);
    })
    .catch((e) => {
      if (e instanceof SIP.Exceptions.SessionDescriptionHandlerError) {
        throw e;
      }
      // Check the original SDP for video, and ensure that we have want to do audio fallback
      if ((/^m=video.+$/gm).test(sessionDescription) && !options.disableAudioFallback) {
        // Do not try to audio fallback again
        options.disableAudioFallback = true;
        // Remove video first, then do the other modifiers
        return this.setDescription(sessionDescription, options, [SIP.Web.Modifiers.stripVideo].concat(modifiers));
      }
      const error = new SIP.Exceptions.SessionDescriptionHandlerError("setDescription", e);
      this.logger.error(error.error);
      this.emit('peerConnection-setRemoteDescriptionFailed', error);
      throw error;
    })
    .then(() => {
      if (this.peerConnection.getReceivers) {
        this.emit('setRemoteDescription', this.peerConnection.getReceivers());
      } else {
        this.emit('setRemoteDescription', this.peerConnection.getRemoteStreams());
      }
      this.emit('confirmed', this);
    });
  }},

  /**
   * Send DTMF via RTP (RFC 4733)
   * @param {String} tones A string containing DTMF digits
   * @param {Object} [options] Options object to be used by sendDtmf
   * @returns {boolean} true if DTMF send is successful, false otherwise
   */
  sendDtmf: {writable: true, value: function sendDtmf (tones, options) {
    if (!this.dtmfSender && this.hasBrowserGetSenderSupport()) {
      var senders = this.peerConnection.getSenders();
      if (senders.length > 0) {
        this.dtmfSender = senders[0].dtmf;
      }
    }
    if (!this.dtmfSender && this.hasBrowserTrackSupport()) {
      var streams = this.peerConnection.getLocalStreams();
      if (streams.length > 0) {
        var audioTracks = streams[0].getAudioTracks();
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
    }
    catch (e) {
      if (e.type ===  "InvalidStateError" || e.type ===  "InvalidCharacterError") {
        this.logger.error(e);
        return false;
      } else {
        throw e;
      }
    }
    this.logger.log('DTMF sent via RTP: ' + tones.toString());
    return true;
  }},

  getDirection: {writable: true, value: function getDirection() {
    return this.direction;
  }},

  // Internal functions
  createOfferOrAnswer: {writable: true, value: function createOfferOrAnswer (RTCOfferOptions, modifiers) {
    var methodName;
    var pc = this.peerConnection;

    RTCOfferOptions = RTCOfferOptions || {};

    methodName = this.hasOffer('remote') ? 'createAnswer' : 'createOffer';

    this.logger.log(methodName);

    return pc[methodName](RTCOfferOptions)
      .catch((e) => {
        if (e instanceof SIP.Exceptions.SessionDescriptionHandlerError) {
          throw e;
        }
        const error = new SIP.Exceptions.SessionDescriptionHandlerError("createOfferOrAnswer", e, 'peerConnection-' + methodName + 'Failed');
        this.emit('peerConnection-' + methodName + 'Failed', error);
        throw error;
      })
      .then((sdp) => SIP.Utils.reducePromises(modifiers, this.createRTCSessionDescriptionInit(sdp)))
      .then((sdp) => {
        this.resetIceGatheringComplete();
        this.logger.log('Setting local sdp.');
        this.logger.log(sdp.sdp);
        return pc.setLocalDescription(sdp);
      })
      .catch((e) => {
        if (e instanceof SIP.Exceptions.SessionDescriptionHandlerError) {
          throw e;
        }
        const error = new SIP.Exceptions.SessionDescriptionHandlerError("createOfferOrAnswer", e, 'peerConnection-SetLocalDescriptionFailed');
        this.emit('peerConnection-SetLocalDescriptionFailed', error);
        throw error;
      })
      .then(() => this.waitForIceGatheringComplete())
      .then(() => {
        var localDescription = this.createRTCSessionDescriptionInit(this.peerConnection.localDescription);
        return SIP.Utils.reducePromises(modifiers, localDescription);
      })
      .then((localDescription) => {
        this.setDirection(localDescription.sdp);
        return localDescription;
      })
      .catch((e) => {
        if (e instanceof SIP.Exceptions.SessionDescriptionHandlerError) {
          throw e;
        }
        const error = new SIP.Exceptions.SessionDescriptionHandlerError("createOfferOrAnswer", e);
        this.logger.error(error);
        throw error;
      });
  }},

  // Creates an RTCSessionDescriptionInit from an RTCSessionDescription
  createRTCSessionDescriptionInit: {writable: true, value: function createRTCSessionDescriptionInit(RTCSessionDescription) {
    return {
      type: RTCSessionDescription.type,
      sdp: RTCSessionDescription.sdp
    };
  }},

  addDefaultIceCheckingTimeout: {writable: true, value: function addDefaultIceCheckingTimeout (peerConnectionOptions) {
    if (peerConnectionOptions.iceCheckingTimeout === undefined) {
      peerConnectionOptions.iceCheckingTimeout = 5000;
    }
    return peerConnectionOptions;
  }},

  addDefaultIceServers: {writable: true, value: function addDefaultIceServers (rtcConfiguration) {
    if (!rtcConfiguration.iceServers) {
      rtcConfiguration.iceServers = [{urls: 'stun:stun.l.google.com:19302'}];
    }
    return rtcConfiguration;
  }},

  checkAndDefaultConstraints: {writable: true, value: function checkAndDefaultConstraints (constraints) {
    var defaultConstraints = {audio: true, video: !this.options.alwaysAcquireMediaFirst};

    constraints = constraints || defaultConstraints;
    // Empty object check
    if (Object.keys(constraints).length === 0 && constraints.constructor === Object) {
      return defaultConstraints;
    }
    return constraints;
  }},

  hasBrowserTrackSupport: {writable: true, value: function hasBrowserTrackSupport () {
    return Boolean(this.peerConnection.addTrack);
  }},

  hasBrowserGetSenderSupport: {writable: true, value: function hasBrowserGetSenderSupport () {
    return Boolean(this.peerConnection.getSenders);
  }},

  initPeerConnection: {writable: true, value: function initPeerConnection(options) {
    var self = this;
    options = options || {};
    options = this.addDefaultIceCheckingTimeout(options);
    options.rtcConfiguration = options.rtcConfiguration || {};
    options.rtcConfiguration = this.addDefaultIceServers(options.rtcConfiguration);

    this.logger.log('initPeerConnection');

    if (this.peerConnection) {
      this.logger.log('Already have a peer connection for this session. Tearing down.');
      this.resetIceGatheringComplete();
      this.peerConnection.close();
    }

    this.peerConnection = new this.WebRTC.RTCPeerConnection(options.rtcConfiguration);

    this.logger.log('New peer connection created');

    if ('ontrack' in this.peerConnection) {
      this.peerConnection.addEventListener('track', function(e) {
        self.logger.log('track added');
        self.observer.trackAdded();
        self.emit('addTrack', e);
      });
    } else {
      this.logger.warn('Using onaddstream which is deprecated');
      this.peerConnection.onaddstream = function(e) {
        self.logger.log('stream added');
        self.emit('addStream', e);
      };
    }

    this.peerConnection.onicecandidate = function (e) {
      self.emit('iceCandidate', e);
      if (e.candidate) {
        self.logger.log('ICE candidate received: ' + (e.candidate.candidate === null ? null : e.candidate.candidate.trim()));
      } else if (e.candidate === null) {
        // indicates the end of candidate gathering
        self.logger.log('ICE candidate gathering complete');
        self.triggerIceGatheringComplete();
      }
    };

    this.peerConnection.onicegatheringstatechange = function () {
      self.logger.log('RTCIceGatheringState changed: ' + this.iceGatheringState);
      switch (this.iceGatheringState) {
      case 'gathering':
        self.emit('iceGathering', this);
        if (!self.iceGatheringTimer && options.iceCheckingTimeout) {
          self.iceGatheringTimeout = false;
          self.iceGatheringTimer = setTimeout(() => {
            self.logger.log('RTCIceChecking Timeout Triggered after ' + options.iceCheckingTimeout + ' milliseconds');
            self.iceGatheringTimeout = true;
            self.triggerIceGatheringComplete();
          }, options.iceCheckingTimeout);
        }
        break;
      case 'complete':
        self.triggerIceGatheringComplete();
        break;
      }
    };

    this.peerConnection.oniceconnectionstatechange = function() {
      var stateEvent;

      switch (this.iceConnectionState) {
      case 'new':
        stateEvent = 'iceConnection';
        break;
      case 'checking':
        stateEvent = 'iceConnectionChecking';
        break;
      case 'connected':
        stateEvent = 'iceConnectionConnected';
        break;
      case 'completed':
        stateEvent = 'iceConnectionCompleted';
        break;
      case 'failed':
        stateEvent = 'iceConnectionFailed';
        break;
      case 'disconnected':
        stateEvent = 'iceConnectionDisconnected';
        break;
      case 'closed':
        stateEvent = 'iceConnectionClosed';
        break;
      default:
        self.logger.warn('Unknown iceConnection state:', this.iceConnectionState);
        return;
      }
      self.logger.log('ICE Connection State changed to ' + stateEvent);
      self.emit(stateEvent, this);
    };
  }},

  acquire: {writable: true, value: function acquire (constraints) {
    // Default audio & video to true
    constraints = this.checkAndDefaultConstraints(constraints);

    return new Promise((resolve, reject) => {
      /*
       * Make the call asynchronous, so that ICCs have a chance
       * to define callbacks to `userMediaRequest`
       */
      this.logger.log('acquiring local media');
      this.emit('userMediaRequest', constraints);

      if (constraints.audio || constraints.video) {
        this.WebRTC.getUserMedia(constraints)
        .then((streams) => {
          this.observer.trackAdded();
          this.emit('userMedia', streams);
          resolve(streams);
        }).catch((e) => {
          this.emit('userMediaFailed', e);
          reject(e);
        });
      } else {
        // Local streams were explicitly excluded.
        resolve([]);
      }
    })
    .catch((e) => {
      if (e instanceof SIP.Exceptions.SessionDescriptionHandlerError) {
        throw e;
      }
      const error = new SIP.Exceptions.SessionDescriptionHandlerError("acquire", e, "unable to acquire streams");
      this.logger.error(error.message);
      this.logger.error(error.error);
      throw error;
    })
    .then((streams) => {
      this.logger.log('acquired local media streams');
      try {
        // Remove old tracks
        if (this.peerConnection.removeTrack) {
          this.peerConnection.getSenders().forEach((sender) => {
            this.peerConnection.removeTrack(sender);
          });
        }
        return streams;
      } catch(e) {
        return Promise.reject(e);
      }
    })
    .catch((e) => {
      if (e instanceof SIP.Exceptions.SessionDescriptionHandlerError) {
        throw e;
      }
      const error = new SIP.Exceptions.SessionDescriptionHandlerError("acquire", e, "error removing streams");
      this.logger.error(error.message);
      this.logger.error(error.error);
      throw error;
    })
    .then((streams) => {
      try {
        streams = [].concat(streams);
        streams.forEach((stream) => {
          if (this.peerConnection.addTrack) {
            stream.getTracks().forEach((track) => {
              this.peerConnection.addTrack(track, stream);
            });
          } else {
            // Chrome 59 does not support addTrack
            this.peerConnection.addStream(stream);
          }
        });
      } catch(e) {
        return Promise.reject(e);
      }
      return Promise.resolve();
    })
    .catch((e) => {
      if (e instanceof SIP.Exceptions.SessionDescriptionHandlerError) {
        throw e;
      }
      const error = new SIP.Exceptions.SessionDescriptionHandlerError("acquire", e, "error adding stream");
      this.logger.error(error.message);
      this.logger.error(error.error);
      throw error;
    });
  }},

  hasOffer: {writable: true, value: function hasOffer (where) {
    var offerState = 'have-' + where + '-offer';
    return this.peerConnection.signalingState === offerState;
  }},

  // ICE gathering state handling

  isIceGatheringComplete: {writable: true, value: function isIceGatheringComplete() {
    return this.peerConnection.iceGatheringState === 'complete' || this.iceGatheringTimeout;
  }},

  resetIceGatheringComplete: {writable: true, value: function resetIceGatheringComplete() {
    this.iceGatheringTimeout = false;

    this.logger.log('resetIceGatheringComplete');

    if (this.iceGatheringTimer) {
      clearTimeout(this.iceGatheringTimer);
      this.iceGatheringTimer = null;
    }

    if (this.iceGatheringDeferred) {
      this.iceGatheringDeferred.reject();
      this.iceGatheringDeferred = null;
    }
  }},

  setDirection: {writable: true, value: function setDirection(sdp) {
    var match = sdp.match(/a=(sendrecv|sendonly|recvonly|inactive)/);
    if (match === null) {
      this.direction = this.C.DIRECTION.NULL;
      this.observer.directionChanged();
      return;
    }
    var direction = match[1];
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
  }},

  triggerIceGatheringComplete: {writable: true, value: function triggerIceGatheringComplete() {
    if (this.isIceGatheringComplete()) {
      this.emit('iceGatheringComplete', this);

      if (this.iceGatheringTimer) {
        clearTimeout(this.iceGatheringTimer);
        this.iceGatheringTimer = null;
      }

      if (this.iceGatheringDeferred) {
        this.iceGatheringDeferred.resolve();
        this.iceGatheringDeferred = null;
      }
    }
  }},

  waitForIceGatheringComplete: {writable: true, value: function waitForIceGatheringComplete() {
    this.logger.log('waitForIceGatheringComplete');
    if (this.isIceGatheringComplete()) {
      this.logger.log('ICE is already complete. Return resolved.');
      return Promise.resolve();
    } else if (!this.isIceGatheringDeferred) {
      this.iceGatheringDeferred = SIP.Utils.defer();
    }
    this.logger.log('ICE is not complete. Returning promise');
    return this.iceGatheringDeferred.promise;
  }}
});

return SessionDescriptionHandler;
};
