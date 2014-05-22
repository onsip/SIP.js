/**
 * @fileoverview MediaHandler
 */

/* MediaHandler
 * @class PeerConnection helper Class.
 * @param {SIP.Session} session
 * @param {Object} [options]
 * @param {SIP.WebRTC.MediaStreamManager | SIP.WebRTC.MediaStream | (getUserMedia constraints)} [options.mediaStreamManager]
 *        The MediaStreamManager to acquire/release streams from/to.
 *        If a MediaStream or a getUserMedia constraints object is provided,
 *        it will be converted to a MediaStreamManager.
 *        If not provided, a default MediaStreamManager will be used.
 */
(function(SIP){

var MediaHandler = function(session, options) {
  var events = [
  ];
  options = options || {};

  this.logger = session.ua.getLogger('sip.invitecontext.mediahandler', session.id);
  this.session = session;
  this.localMedia = null;
  this.ready = true;
  this.mediaStreamManager = SIP.WebRTC.MediaStreamManager.cast(options.mediaStreamManager);
  this.audioMuted = false;
  this.videoMuted = false;

  // old init() from here on
  var idx, length, server,
    self = this,
    servers = [],
    stunServers = options.stunServers || null,
    turnServers = options.turnServers || null,
    config = this.session.ua.configuration;
  this.RTCConstraints = options.RTCConstraints || {};

  if (!stunServers) {
    stunServers = config.stunServers;
  }

  if(!turnServers) {
    turnServers = config.turnServers;
  }

  /* Change 'url' to 'urls' whenever this issue is solved:
   * https://code.google.com/p/webrtc/issues/detail?id=2096
   */
  servers.push({'url': stunServers});

  length = turnServers.length;
  for (idx = 0; idx < length; idx++) {
    server = turnServers[idx];
    servers.push({
      'url': server.urls,
      'username': server.username,
      'credential': server.password
    });
  }

  this.peerConnection = new SIP.WebRTC.RTCPeerConnection({'iceServers': servers}, this.RTCConstraints);

  this.peerConnection.onaddstream = function(e) {
    self.logger.log('stream added: '+ e.stream.id);
  };

  this.peerConnection.onremovestream = function(e) {
    self.logger.log('stream removed: '+ e.stream.id);
  };

  this.peerConnection.onicecandidate = function(e) {
    if (e.candidate) {
      self.logger.log('ICE candidate received: '+ e.candidate.candidate);
    } else if (self.onIceCompleted !== undefined) {
      self.onIceCompleted();
    }
  };

  this.peerConnection.oniceconnectionstatechange = function() {  //need e for commented out case
    self.logger.log('ICE connection state changed to "'+ this.iceConnectionState +'"');
    //Bria state changes are always connected -> disconnected -> connected on accept, so session gets terminated
    //normal calls switch from failed to connected in some cases, so checking for failed and terminated
    /*if (this.iceConnectionState === 'failed') {
      self.session.terminate({
        cause: SIP.C.causes.RTP_TIMEOUT,
        status_code: 200,
        reason_phrase: SIP.C.causes.RTP_TIMEOUT
      }); 
    } else if (e.currentTarget.iceGatheringState === 'complete' && this.iceConnectionState !== 'closed') {
      self.onIceCompleted();
    }*/
  };

  this.peerConnection.onstatechange = function() {
    self.logger.log('PeerConnection state changed to "'+ this.readyState +'"');
  };

  this.initEvents(events);
};

MediaHandler.defaultFactory = function defaultFactory (session, options) {
  return new MediaHandler(session, options);
};

MediaHandler.prototype = Object.create(SIP.MediaHandler.prototype, {
// Functions the session can use
  isReady: {value: function isReady () {
    return this.ready;
  }},

  close: {value: function close () {
    this.logger.log('closing PeerConnection');
    // have to check signalingState since this.close() gets called multiple times
    // TODO figure out why that happens
    if(this.peerConnection && this.peerConnection.signalingState !== 'closed') {
      this.peerConnection.close();

      if(this.localMedia) {
        this.mediaStreamManager.release(this.localMedia);
      }
    }
  }},

  /**
   * @param {Function} onSuccess
   * @param {Function} onFailure
   * @param {SIP.WebRTC.MediaStream | (getUserMedia constraints)} [mediaHint]
   *        the MediaStream (or the constraints describing it) to be used for the session
   */
  getDescription: {value: function getDescription (onSuccess, onFailure, mediaHint) {
    var self = this;

    /*
     * 1. acquire stream (skip if MediaStream passed in)
     * 2. addStream
     * 3. createOffer/createAnswer
     * 4. call onSuccess()
     */

    /* Last functions first, to quiet JSLint */
    function streamAdditionSucceeded() {
      self.createOfferOrAnswer(onSuccess, onFailure, self.RTCConstraints);
    }

    function acquireSucceeded(stream) {
      self.logger.log('acquired local media stream');
      self.localMedia = stream;
      self.session.connecting();
      self.addStream(
        stream,
        streamAdditionSucceeded,
        onFailure,
        self.RTCConstraints
      );
    }

    if (self.localMedia) {
      self.logger.log('already have local media');
      streamAdditionSucceeded();
      return;
    }

    if (mediaHint instanceof SIP.WebRTC.MediaStream) {
      self.logger.log('mediaHint provided to getDescription is a MediaStream, casting to MediaStreamManager:', mediaHint);
      self.mediaStreamManager = SIP.WebRTC.MediaStreamManager.cast(mediaHint);
    }

    self.logger.log('acquiring local media');
    self.mediaStreamManager.acquire(
      acquireSucceeded,
      function acquireFailed(err) {
        self.logger.error('unable to acquire stream');
        self.logger.error(err);
        self.session.connecting();
        onFailure(err);
      },
      mediaHint
    );
  }},

  /**
  * Message reception.
  * @param {String} type
  * @param {String} sdp
  * @param {Function} onSuccess
  * @param {Function} onFailure
  */
  setDescription: {value: function setDescription (sdp, onSuccess, onFailure) {
    var type = this.hasOffer('local') ? 'answer' : 'offer';
    var description = new SIP.WebRTC.RTCSessionDescription({type: type, sdp: sdp});
    this.peerConnection.setRemoteDescription(description, onSuccess, onFailure);
  }},

// Functions the session can use, but only because it's convenient for the application
  isMuted: {value: function isMuted () {
    return {
      audio: this.audioMuted,
      video: this.videoMuted
    };
  }},

  mute: {value: function mute (options) {
    if (this.getLocalStreams().length === 0) {
      return;
    }

    options = options || {
      audio: this.getLocalStreams()[0].getAudioTracks().length > 0,
      video: this.getLocalStreams()[0].getVideoTracks().length > 0
    };

    var audioMuted = false,
        videoMuted = false;

    if (options.audio && !this.audioMuted) {
      audioMuted = true;
      this.audioMuted = true;
      this.toggleMuteAudio(true);
    }

    if (options.video && !this.videoMuted) {
      videoMuted = true;
      this.videoMuted = true;
      this.toggleMuteVideo(true);
    }

    //REVISIT
    if (audioMuted || videoMuted) {
      return {
        audio: audioMuted,
        video: videoMuted
      };
      /*this.session.onmute({
        audio: audioMuted,
        video: videoMuted
      });*/
    }
  }},

  unmute: {value: function unmute (options) {
    if (this.getLocalStreams().length === 0) {
      return;
    }

    options = options || {
      audio: this.getLocalStreams()[0].getAudioTracks().length > 0,
      video: this.getLocalStreams()[0].getVideoTracks().length > 0
    };

    var audioUnMuted = false,
        videoUnMuted = false;

    if (options.audio && this.audioMuted) {
      audioUnMuted = true;
      this.audioMuted = false;

      //REVISIT
      if (!options.local_hold) {
        this.toggleMuteAudio(false);
      }
    }

    if (options.video && this.videoMuted) {
      videoUnMuted = true;
      this.videoMuted = false;

      //REVISIT
      if (!options.local_hold) {
        this.toggleMuteVideo(false);
      }
    }

    //REVISIT
    if (audioUnMuted || videoUnMuted) {
      return {
        audio: audioUnMuted,
        video: videoUnMuted
      };
      /*this.session.onunmute({
        audio: audioUnMuted,
        video: videoUnMuted
      });*/
    }
  }},

  hold: {value: function hold () {
    this.toggleMuteAudio(true);
    this.toggleMuteVideo(true);
  }},

  unhold: {value: function unhold () {
    if (!this.audioMuted) {
      this.toggleMuteAudio(false);
    }

    if (!this.videoMuted) {
      this.toggleMuteVideo(false);
    }
  }},

// Functions the application can use, but not the session
  getLocalStreams: {value: function getLocalStreams () {
    var pc = this.peerConnection;
    if (pc && pc.signalingState === 'closed') {
      this.logger.warn('peerConnection is closed, getLocalStreams returning []');
      return [];
    }
    return (pc.getLocalStreams && pc.getLocalStreams()) ||
      pc.localStreams || [];
  }},

  getRemoteStreams: {value: function getRemoteStreams () {
    var pc = this.peerConnection;
    if (pc && pc.signalingState === 'closed') {
      this.logger.warn('peerConnection is closed, getRemoteStreams returning []');
      return [];
    }
    return(pc.getRemoteStreams && pc.getRemoteStreams()) ||
      pc.remoteStreams || [];
  }},

// Internal functions
  hasOffer: {value: function hasOffer (where) {
    var offerState = 'have-' + where + '-offer';
    return this.peerConnection.signalingState === offerState;
    // TODO consider signalingStates with 'pranswer'?
  }},

  createOfferOrAnswer: {value: function createOfferOrAnswer (onSuccess, onFailure, constraints) {
    var self = this;

    function readySuccess () {
      var sdp = self.peerConnection.localDescription.sdp;

      sdp = SIP.Hacks.Chrome.needsExplicitlyInactiveSDP(sdp);

      self.ready = true;
      onSuccess(sdp);
    }

    function onSetLocalDescriptionSuccess() {
      if (self.peerConnection.iceGatheringState === 'complete' && self.peerConnection.iceConnectionState === 'connected') {
        readySuccess();
      } else {
        self.onIceCompleted = function() {
          self.onIceCompleted = undefined;
          readySuccess();
        };
      }
    }

    function methodFailed (methodName, e) {
      self.logger.error('peerConnection.' + methodName + ' failed');
      self.logger.error(e);
      self.ready = true;
      onFailure(e);
    }

    self.ready = false;

    var methodName = self.hasOffer('remote') ? 'createAnswer' : 'createOffer';

    self.peerConnection[methodName](
      function(sessionDescription){
        self.peerConnection.setLocalDescription(
          sessionDescription,
          onSetLocalDescriptionSuccess,
          methodFailed.bind(null, 'setLocalDescription')
        );
      },
      methodFailed.bind(null, methodName),
      constraints
    );
  }},

  addStream: {value: function addStream (stream, onSuccess, onFailure, constraints) {
    try {
      this.peerConnection.addStream(stream, constraints);
    } catch(e) {
      this.logger.error('error adding stream');
      this.logger.error(e);
      onFailure(e);
      return;
    }

    onSuccess();
  }},

  toggleMuteHelper: {value: function toggleMuteHelper (trackGetter, mute) {
    this.getLocalStreams().forEach(function (stream) {
      stream[trackGetter]().forEach(function (track) {
        track.enabled = !mute;
      });
    });
  }},

  toggleMuteAudio: {value: function toggleMuteAudio (mute) {
    this.toggleMuteHelper('getAudioTracks', mute);
  }},

  toggleMuteVideo: {value: function toggleMuteVideo (mute) {
    this.toggleMuteHelper('getVideoTracks', mute);
  }}
});

// Return since it will be assigned to a variable.
return MediaHandler;
}(SIP));
