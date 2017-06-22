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
  this.options = options || {};

  this.logger = session.ua.getLogger('sip.invitecontext.sessionDescriptionHandler', session.id);
  this.session = session;

  this.CONTENT_TYPE = 'application/sdp';

  // TODO: Move to UA options
  this.modifiers = this.options.modifiers || [];
  if (!Array.isArray(this.modifiers)) {
    this.modifiers = [this.modifiers];
  }

  // TODO: Other sdp modifiers on the UA
  if (this.session.ua.configuration.hackStripTcp) {
    this.modifiers.push(function(sdp) {
      sdp = sdp.replace(/^a=candidate:\d+ \d+ tcp .*?\r\n/img, "");
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

  var servers = this.prepareIceServers(this.options.stunServers, this.options.turnServers);
  this.RTCConstraints = this.options.RTCConstraints || {};

  this.initPeerConnection(servers);
};

/**
 * @param {SIP.Session} session
 * @param {Object} [options]
 */

 // TODO: The options are going to disappear, and the handler will be responsible for pulling it's own options from the UA
SessionDescriptionHandler.defaultFactory = function defaultFactory (session, options) {
  return new SessionDescriptionHandler(session, options);
};

SessionDescriptionHandler.prototype = Object.create(SIP.SessionDescriptionHandler.prototype, {
  // Funtions the sesssion can use
  // TODO: Comments
  // TODO:
  close: {writable: true, value: function () {
    return;
  }},

  /**
   *
   */
  getDescription: {writable: true, value: function (constraints, modifiers) {
    var self = this;

    // We will override the saved constraints with new constraints if provided, otherwise use saved constraints
    this.constraints = constraints || this.constraints || {};

    modifiers = modifiers || [];
    if (!Array.isArray(modifiers)) {
      modifiers = [modifiers];
    }
    modifiers = modifiers.concat(this.modifiers);

    // Check to see if the peerConnection already has a local description
    if (this.peerConnection.localDescription && this.peerConnection.localDescription.sdp && this.peerConnection.localDescription.sdp !== '') {
      if (this.peerConnection.signalingState === 'stable') {
        // TODO: Events.
        return SIP.Utils.reducePromises(modifiers, this.peerConnection.localDescription.sdp)
        .then(function(sdp) {
          return {
            body: sdp,
            contentType: self.CONTENT_TYPE
          };
        });
      }
      // TODO: Determine if we need to do another GUM
      return this.createOfferOrAnswer();
    }

    // GUM and set myself up
    self.logger.log('acquiring local media');
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
            self.peerConnection.addStream(stream);
          }, this);
        } catch(e) {
          self.logger.error('error adding stream');
          self.logger.error(e);
          return SIP.Utils.Promise.reject(e);
        }
        return SIP.Utils.Promise.resolve();
      })
      .then(function streamAdditionSucceeded() {
        return self.createOfferOrAnswer();
      })
      .then(SIP.Utils.reducePromises.bind(null, modifiers))
      .then(function(sdp) {
        return {
          body: sdp,
          contentType: self.CONTENT_TYPE
        };
      });
  }},

  hasDescription: {writable: true, value: function hasDescription (contentType) {
    return contentType === this.CONTENT_TYPE;
  }},

  /**
   *
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

  setDescription: {writable:true, value: function setDescription (sessionDescription, constraints, modifiers) {
    var self = this;

    // We will override the saved constraints with new constraints if provided, otherwise use saved constraints
    this.constraints = constraints || this.constraints || {};

    modifiers = modifiers || [];
    if (!Array.isArray(modifiers)) {
      modifiers = [modifiers];
    }
    modifiers = modifiers.concat(this.modifiers);

    return SIP.Utils.reducePromises(modifiers, sessionDescription)
      .then(function(sdp) {
        var rawDescription = {
          type: self.hasOffer('local') ? 'answer' : 'offer',
          sdp: sdp
        };
        // TODO: This emit does not match what we are doing for getDescription... kind of re: modifier
        self.emit('setDescription', rawDescription);

        var description = new self.WebRTC.RTCSessionDescription(rawDescription);
        return SIP.Utils.promisify(self.peerConnection, 'setRemoteDescription')(description);
      })
      .then(function setRemoteDescriptionSuccess() {
        self.emit('setRemoteDescription', self.peerConnection.getRemoteStreams());
        // TODO: invite w/o sdp case, receiving call case
        self.emit('confirmed', self);
      })
      .catch(function setRemoteDescriptionError(e) {
        self.emit('peerConnection-setRemoteDescriptionFailed', e);
        throw e;
      });
  }},

  // Internal functions
  createOfferOrAnswer: {writable: true, value: function createOfferOrAnswer () {
    var self = this;
    var methodName;
    var pc = self.peerConnection;
    // TODO: Lock?
    // TODO: We need to lock on the setRemoteDescription so that it cannot be done 2x

    methodName = self.hasOffer('remote') ? 'createAnswer' : 'createOffer';

    return SIP.Utils.promisify(pc, methodName, true)()
      .catch(function methodError(e) {
        self.emit('peerConnection-' + methodName + 'Failed', e);
        throw e;
      })
      .then(SIP.Utils.promisify(pc, 'setLocalDescription'))
      .catch(function localDescError(e) {
        self.emit('peerConnection-SetLocalDescriptionFailed', e);
        throw e;
      })
      .then(function onSetLocalDescriptionSuccess() {
        var deferred = SIP.Utils.defer();
        if (pc.iceGatheringState === 'complete' && (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed')) {
          deferred.resolve();
        } else {
          self.onIceCompleted.promise.then(deferred.resolve);
        }
        return  deferred.promise;
      })
      .then(function readySuccess() {
        var sdp = self.peerConnection.localDescription.sdp;
        var sdpWrapper = {
          type: methodName === 'createOffer' ? 'offer' : 'answer',
          sdp: sdp
        };
        // This returns unmodified SDP from getDescription
        self.emit('getDescription', sdpWrapper);
        return sdpWrapper.sdp;
      })
      .catch(function createOfferOrAnserError (e) {
        self.logger.error(e);
        // TODO: Not sure if this is correct
        throw new SIP.Exceptions.GetDescriptionError(e);
      });
  }},

  prepareIceServers: {writable: true, value: function prepareIceServers (stunServers, turnServers) {
    var servers = [],
      config = this.session.ua.configuration.sessionDescriptionHandlerOptions;

    stunServers = stunServers || config.stunServers;
    turnServers = turnServers || config.turnServers;

    [].concat(stunServers).forEach(function (server) {
      servers.push({'urls': server});
    });

    [].concat(turnServers).forEach(function (server) {
      var turnServer = {'urls': server.urls};
      if (server.username) {
        turnServer.username = server.username;
      }
      if (server.password) {
        turnServer.credential = server.password;
      }
      servers.push(turnServer);
    });

    return servers;
  }},

  initPeerConnection: {writable: true, value: function initPeerConnection(servers) {
    var self = this,
      config = this.session.ua.configuration;

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

    var connConfig = {
      iceServers: servers
    };

    if (config.rtcpMuxPolicy) {
      connConfig.rtcpMuxPolicy = config.rtcpMuxPolicy;
    }

    this.peerConnection = new this.WebRTC.RTCPeerConnection(connConfig);

    this.peerConnection.onaddstream = function(e) {
      self.logger.log('stream added: '+ e.stream.id);
      self.emit('addStream', e);
    };

    this.peerConnection.onremovestream = function(e) {
      self.logger.log('stream removed: '+ e.stream.id);
    };

    this.startIceCheckingTimer = function () {
      if (!self.iceCheckingTimer) {
        self.iceCheckingTimer = SIP.Timers.setTimeout(function() {
          self.logger.log('RTCIceChecking Timeout Triggered after '+config.iceCheckingTimeout+' milliseconds');
          self.onIceCompleted.resolve(this);
        }.bind(this.peerConnection), config.iceCheckingTimeout);
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
    constraints = constraints || {audio: true, video: true};

    var deferred = SIP.Utils.defer();

    /*
     * Make the call asynchronous, so that ICCs have a chance
     * to define callbacks to `userMediaRequest`
     */
    SIP.Timers.setTimeout(function () {
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
          emitThenCall.bind(this, 'userMedia', function(streams) { deferred.resolve(streams); }),
          emitThenCall.bind(this, 'userMediaFailed', function(e) {throw e;})
        );
      } else {
        // Local streams were explicitly excluded.
        deferred.resolve([]);
      }
    }.bind(this), 0);
    return deferred.promise;
  }},

  hasOffer: {writable: true, value: function hasOffer (where) {
    var offerState = 'have-' + where + '-offer';
    return this.peerConnection.signalingState === offerState;
  }}
});

return SessionDescriptionHandler;
};
