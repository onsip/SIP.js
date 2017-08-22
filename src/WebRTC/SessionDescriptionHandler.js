"use strict";
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
var SessionDescriptionHandler = function(session, options) {
  // TODO: Validate the options
  this.options = options || {};

  this.logger = session.ua.getLogger('sip.invitecontext.sessionDescriptionHandler', session.id);
  this.session = session;

  this.CONTENT_TYPE = 'application/sdp';

  this.modifiers = this.options.modifiers || [];
  if (!Array.isArray(this.modifiers)) {
    this.modifiers = [this.modifiers];
  }

  if (this.options.hackStripTcpCandidates) {
    this.modifiers.push(function(sdp) {
      sdp = sdp.replace(/^a=candidate:\d+ \d+ tcp .*?\r\n/img, "");
      return SIP.Utils.Promise.resolve(sdp);
    });
  }
  if (this.options.hackStripTelephoneEvent) {
    this.modifiers.push(function(sdp) {
      sdp = sdp.replace(/^a=rtpmap:\d+ telephone-event\/d+/img, "");
      return SIP.Utils.Promise.resolve(sdp);
    });
  }
  if (this.options.hackCleanJitsiSdpImageattr) {
    this.modifiers.push(function(sdp) {
      // TODO:
      return SIP.Utils.Promise.resolve(sdp);
    });
  }

  var environment = global.window || global;
  this.WebRTC = {
    MediaStream           : environment.MediaStream,
    getUserMedia          : environment.navigator.mediaDevices.getUserMedia.bind(environment.navigator.mediaDevices),
    RTCPeerConnection     : environment.RTCPeerConnection,
    RTCSessionDescription : environment.RTCSessionDescription
  };

  this.initPeerConnection(this.options);

  this.constraints = this.checkAndDefaultConstraints(this.options.constraints);

  this.session.emit('SessionDescriptionHandler-created', this);
};

/**
 * @param {SIP.Session} session
 * @param {Object} [options]
 */

SessionDescriptionHandler.defaultFactory = function defaultFactory (session, options) {
  return new SessionDescriptionHandler(session, options);
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
      // TODO: getLocalStreams && getRemoteStreams are deprecated
      this.peerConnection.getLocalStreams().forEach(function(stream) {
        stream.getTracks().forEach(function(track) {
          track.stop();
        });
      });
      this.peerConnection.getRemoteStreams().forEach(function(stream) {
        stream.getTracks().forEach(function(track) {
          track.stop();
        });
      });
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
    var self = this;

    options = options || {};
    if (options.peerConnectionOptions) {
      this.initPeerConnection(options.peerConnectionOptions);
    }

    // Merge passed constraints with saved constraints and save
    this.constraints = Object.assign(this.constraints, options.constraints);
    this.constraints = this.checkAndDefaultConstraints(this.constraints);

    modifiers = modifiers || [];
    if (!Array.isArray(modifiers)) {
      modifiers = [modifiers];
    }
    modifiers = modifiers.concat(this.modifiers);

    // Check to see if the peerConnection already has a local description
    if (this.peerConnection.localDescription && this.peerConnection.localDescription.sdp && this.peerConnection.localDescription.sdp !== '') {
      return this.createOfferOrAnswer({}, modifiers).then(function(sdp) {
        return {
          body: sdp,
          contentType: self.CONTENT_TYPE
        };
      });
    }

    // GUM and set myself up
    self.logger.log('acquiring local media');
    // TODO: Constraints should be named MediaStreamConstraints
    return this.acquire(self.constraints)
      .then(function acquireSucceeded(streams) {
        self.logger.log('acquired local media streams');
        return streams;
      }, function acquireFailed(err) {
        self.logger.error('unable to acquire streams');
        self.logger.error(err);
        throw err;
      })
      .then(function addStreams(streams) {
        try {
          streams = [].concat(streams);
          streams.forEach(function (stream) {
            if (self.peerConnection.addTrack) {
              stream.getTracks().forEach(function (track) {
                self.peerConnection.addTrack(track, stream);
              });
            } else {
              // Chrome 59 does not support addTrack
              self.peerConnection.addStream(stream);
            }
          }, this);
        } catch(e) {
          self.logger.error('error adding stream');
          self.logger.error(e);
          return SIP.Utils.Promise.reject(e);
        }
        return SIP.Utils.Promise.resolve();
      })
      .then(function streamAdditionSucceeded() {
        return self.createOfferOrAnswer(options.RTCOfferOptions, modifiers);
      })
      .then(function(sdp) {
        return {
          body: sdp,
          contentType: self.CONTENT_TYPE
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
  holdModifier: {writable: true, value: function holdModifier (sdp) {
    if (!(/a=(sendrecv|sendonly|recvonly|inactive)/).test(sdp)) {
      sdp = sdp.replace(/(m=[^\r]*\r\n)/g, '$1a=sendonly\r\n');
    } else {
      sdp = sdp.replace(/a=sendrecv\r\n/g, 'a=sendonly\r\n');
      sdp = sdp.replace(/a=recvonly\r\n/g, 'a=inactive\r\n');
    }
    return SIP.Utils.Promise.resolve(sdp);
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
    var self = this;

    options = options || {};
    if (options.peerConnectionOptions) {
      this.initPeerConnection(options.peerConnectionOptions);
    }

    // Merge passed constraints with saved constraints and save
    this.constraints = Object.assign(this.constraints, options.constraints);
    this.constraints = this.checkAndDefaultConstraints(this.constraints);

    modifiers = modifiers || [];
    if (!Array.isArray(modifiers)) {
      modifiers = [modifiers];
    }
    modifiers = modifiers.concat(this.modifiers);

    return SIP.Utils.reducePromises(modifiers, sessionDescription)
      .catch(function modifierError(e) {
        self.logger.error("The modifiers did not resolve successfully");
        self.logger.error(e);
        throw e;
      })
      .then(function(sdp) {
        var rawDescription = {
          type: self.hasOffer('local') ? 'answer' : 'offer',
          sdp: sdp
        };
        // TODO: This emit does not match what we are doing for getDescription... kind of re: modifier
        self.emit('setDescription', rawDescription);

        return self.peerConnection.setRemoteDescription(new self.WebRTC.RTCSessionDescription(rawDescription));
      })
      .catch(function setRemoteDescriptionError(e) {
        self.logger.error(e);
        self.emit('peerConnection-setRemoteDescriptionFailed', e);
        throw e;
      })
      .then(function setRemoteDescriptionSuccess() {
        if (self.peerConnection.getRemoteStreams) {
          self.emit('setRemoteDescription', self.peerConnection.getRemoteStreams());
        } else {
          // TODO: Shim this correctly for Safari
          self.emit('setRemoteDescription', self.peerConnection.getSenders());
        }
        self.emit('confirmed', self);
      });
  }},

  // Internal functions
  createOfferOrAnswer: {writable: true, value: function createOfferOrAnswer (RTCOfferOptions, modifiers) {
    var self = this;
    var methodName;
    var pc = this.peerConnection;

    RTCOfferOptions = RTCOfferOptions || {};

    methodName = self.hasOffer('remote') ? 'createAnswer' : 'createOffer';

    return pc[methodName](RTCOfferOptions)
      .catch(function methodError(e) {
        self.emit('peerConnection-' + methodName + 'Failed', e);
        throw e;
      })
      .then(function(sdp) {
        return SIP.Utils.reducePromises(modifiers, sdp.sdp)
        .then(function(modifiedSdp) {
          sdp.sdp = modifiedSdp;
          return sdp;
        });
      })
      .then(function(sdp) {
        self.logger.log(sdp);
        return pc.setLocalDescription(sdp);
      })
      .catch(function localDescError(e) {
        self.emit('peerConnection-SetLocalDescriptionFailed', e);
        throw e;
      })
      .then(function onSetLocalDescriptionSuccess() {
        var deferred = SIP.Utils.defer();
        if (pc.iceGatheringState === 'complete' && (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed')) {
          deferred.resolve();
        } else {
          // TODO: Is this a race condition
          self.onIceCompleted.promise.then(deferred.resolve);
        }
        return  deferred.promise;
      })
      .then(function readySuccess() {
        var localDescription = self.peerConnection.localDescription;
        // This returns unmodified SDP from getDescription
        self.emit('getDescription', localDescription);
        return localDescription.sdp;
      })
      .catch(function createOfferOrAnswerError (e) {
        self.logger.error(e);
        // TODO: Not sure if this is correct
        throw new SIP.Exceptions.GetDescriptionError(e);
      });
  }},

  addDefaultIceServers: {writable: true, value: function addDefaultIceServers (rtcConfiguration) {
    if (!rtcConfiguration.iceServers) {
      rtcConfiguration.iceServers = [{urls: 'stun:stun.l.google.com:19302'}];
    }
    return rtcConfiguration;
  }},

  checkAndDefaultConstraints: {writable: true, value: function checkAndDefaultConstraints (constraints) {
    var defaultConstraints = {audio: true, video: true};
    constraints = constraints || defaultConstraints;
    // Empty object check
    if (Object.keys(constraints).length === 0 && constraints.constructor === Object) {
      return defaultConstraints;
    }
    return constraints;
  }},

  initPeerConnection: {writable: true, value: function initPeerConnection(options) {
    var self = this;
    options.rtcConfiguration = options.rtcConfiguration || {};
    options.rtcConfiguration = this.addDefaultIceServers(options.rtcConfiguration);

    this.onIceCompleted = SIP.Utils.defer();
    this.onIceCompleted.promise.then(function(pc) {
      self.emit('iceGatheringComplete', pc);
      if (self.iceCheckingTimer) {
        SIP.Timers.clearTimeout(self.iceCheckingTimer);
        self.iceCheckingTimer = null;
      }
    });

    if (this.peerConnection) {
      this.peerConnection.close();
    }

    this.peerConnection = new this.WebRTC.RTCPeerConnection(options.rtcConfiguration);

    this.session.emit('peerConnection-created', this.peerConnection);

    this.peerConnection.ontrack = function(e) {
      self.logger.log('track added ' + e.track.id);
      self.emit('addTrack', e);
    };

    // TODO: There is no remove track listener
    this.peerConnection.onremovestream = function(e) {
      self.logger.log('stream removed: '+ e.stream.id);
    };

    this.startIceCheckingTimer = function () {
      if (!self.iceCheckingTimer) {
        self.iceCheckingTimer = SIP.Timers.setTimeout(function() {
          self.logger.log('RTCIceChecking Timeout Triggered after ' + options.iceCheckingTimeout + ' milliseconds');
          self.onIceCompleted.resolve(this);
        }.bind(this.peerConnection), options.iceCheckingTimeout);
      }
    };

    this.peerConnection.onicecandidate = function(e) {
      self.emit('iceCandidate', e);
      if (e.candidate) {
        self.logger.log('ICE candidate received: '+ (e.candidate.candidate === null ? null : e.candidate.candidate.trim()));
        self.startIceCheckingTimer();
      } else {
        self.onIceCompleted.resolve(this);
      }
    };

    this.peerConnection.onicegatheringstatechange = function () {
      self.logger.log('RTCIceGatheringState changed: ' + this.iceGatheringState);
      if (this.iceGatheringState === 'gathering') {
        self.emit('iceGathering', this);
      }
      if (this.iceGatheringState === 'complete') {
        self.onIceCompleted.resolve(this);
      }
    };

    this.peerConnection.oniceconnectionstatechange = function() {  //need e for commented out case
      var stateEvent;

      if (this.iceConnectionState === 'checking') {
        self.startIceCheckingTimer();
      }

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
      self.emit(stateEvent, this);

      //Bria state changes are always connected -> disconnected -> connected on accept, so session gets terminated
      //normal calls switch from failed to connected in some cases, so checking for failed and terminated
      /*if (this.iceConnectionState === 'failed') {
        self.session.terminate({
        cause: SIP.C.causes.RTP_TIMEOUT,
        status_code: 200,
        reason_phrase: SIP.C.causes.RTP_TIMEOUT
      });
      } else if (e.currentTarget.iceGatheringState === 'complete' && this.iceConnectionState !== 'closed') {
      self.onIceCompleted(this);
      }*/
    };
  }},

  acquire: {writable: true, value: function acquire (constraints) {
    // Default audio & video to true
    constraints = this.checkAndDefaultConstraints(constraints);

    return new SIP.Utils.Promise(function(resolve, reject) {
      /*
       * Make the call asynchronous, so that ICCs have a chance
       * to define callbacks to `userMediaRequest`
       */
      this.emit('userMediaRequest', constraints);

      var emitThenCall = function(eventName, callback) {
        var callbackArgs = Array.prototype.slice.call(arguments, 2);
        // Emit with all of the arguments from the real callback.
        var newArgs = [eventName].concat(callbackArgs);
        this.emit.apply(this, newArgs);
        return callback.apply(null, callbackArgs);
      }.bind(this);

      if (constraints.audio || constraints.video) {
        this.WebRTC.getUserMedia(constraints)
        .then(
          emitThenCall.bind(this, 'userMedia', function(streams) { resolve(streams); }),
          emitThenCall.bind(this, 'userMediaFailed', function(e) {
            reject(e);
            throw e;
          })
        );
      } else {
        // Local streams were explicitly excluded.
        resolve([]);
      }
    }.bind(this));
  }},

  hasOffer: {writable: true, value: function hasOffer (where) {
    var offerState = 'have-' + where + '-offer';
    return this.peerConnection.signalingState === offerState;
  }}
});

return SessionDescriptionHandler;
};
