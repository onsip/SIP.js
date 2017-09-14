"use strict";
/**
 * @fileoverview Simple
 */

 /* Simple
  * @class Simple
  */

module.exports = function (SIP) {

var C = {
  STATUS_NULL:         0,
  STATUS_NEW:          1,
  STATUS_CONNECTING:   2,
  STATUS_CONNECTED:    3,
  STATUS_COMPLETED:    4
};

/*
 * @param {Object} options
 */
var Simple = function (options) {
  /*
   *  {
   *    media: {
   *      remote: {
   *        audio: <DOM element>,
   *        video: <DOM element>
   *      },
   *      local: {
   *        video: <DOM element>
   *      }
   *    },
   *    ua: {
   *       <UA Configuration Options>
   *    }
   *  }
   */

  if (options.media.remote.video) {
    this.video = true;
  } else {
    this.video = false;
  }

  if (options.media.remote.audio) {
    this.audio = true;
  } else {
    this.audio = false;
  }

  if (!this.audio && !this.video) {
    // Need to do at least audio or video
    // Error
    this.logger.error('At least one remote audio or video element is required for Simple.');
    return;
  }

  this.options = options;

  this.ua = new SIP.UA({
    wsServers:         this.options.ua.wsServers,
    uri:               this.options.ua.uri,
    authorizationUser: this.options.ua.authorizationUser,
    password:          this.options.ua.password,
    register:          true,
    traceSip:          true
  });

  // TODO: Track state
  // If we track the state of Simple, then we do not have to care about the
  // state of the underlying session. Makes life a bit simpler.

  this.state = C.STATUS_NULL;

  this.logger = this.ua.getLogger('sip.simple');

  this.ua.on('registered', function() {
    this.emit('registered', this.ua);
  }.bind(this));

  this.ua.on('unregistered', function() {
    this.emit('unregistered', this.ua);
  }.bind(this));

  this.ua.on('failed', function() {
    this.emit('unregistered', this.ua);
  }.bind(this));

  this.ua.on('invite', function(session) {
    // If there is already an active session reject the incoming session
    if (this.state !== C.STATUS_NULL && this.state !== C.STATUS_COMPLETED) {
      this.logger.warn('Rejecting incoming call. Simple only supports 1 call at a time');
      session.reject();
      return;
    }
    this.session = session;
    this.setupSession();
  }.bind(this));

  return this;
};

Simple.prototype = Object.create(SIP.EventEmitter.prototype);

// Public

Simple.prototype.call = function(destination) {
  if (!this.ua && !this.ua.registered) {
    this.logger.warn('A registered UA is required for calling');
    return;
  }
  if (this.state !== C.STATUS_NULL && this.state !== C.STATUS_COMPLETED) {
    this.logger.warn('Cannot make more than a single call with Simple');
    return;
  }
  this.session = this.ua.invite(destination, {
    sessionDescriptionHandlerOptions: {
      constraints: {
        audio: this.audio,
        video: this.video
      }
    }
  });
  this.setupSession();

  return this.session;
};

Simple.prototype.answer = function() {
  if (this.state !== C.STATUS_NEW && this.state !== C.STATUS_CONNECTING) {
    this.logger.warn('No call to answer');
    return;
  }
  return this.session.accept({
    sessionDescriptionHandlerOptions: {
      constraints: {
        audio: this.audio,
        video: this.video
      }
    }
  });
  // emit call is active
};

Simple.prototype.reject = function() {
  if (this.state !== C.STATUS_NEW && this.state !== C.STATUS_CONNECTING) {
    this.logger.warn('Call is already answered');
    return;
  }
  return this.session.reject();
};

Simple.prototype.hangup = function() {
  if (this.state !== C.STATUS_CONNECTED && this.state !== C.STATUS_CONNECTING && this.state !== C.STATUS_NEW) {
    this.logger.warn('No active call to hang up on');
    return;
  }
  this.emit('ended', this.session);
  if (this.state !== C.STATUS_CONNECTED) {
    return this.session.cancel();
  } else {
    return this.session.bye();
  }
};

Simple.prototype.hold = function() {
  if (this.state !== C.STATUS_CONNECTED || this.session.isOnHold().local) {
    this.logger.warn('Cannot put call on hold');
    return;
  }
  this.mute();
  this.logger.log('Placing session on hold');
  return this.session.hold();
};

Simple.prototype.unhold = function() {
  if (this.state !== C.STATUS_CONNECTED || !this.session.isOnHold().local) {
    this.logger.warn('Cannot unhold a call that is not on hold');
    return;
  }
  this.unmute();
  this.logger.log('Placing call off hold');
  return this.session.unhold();
};

Simple.prototype.mute = function() {
  if (this.state !== C.STATUS_CONNECTED) {
    this.logger.warn('An acitve call is required to mute audio');
    return;
  }
  this.logger.log('Muting Audio');
  this.toggleMute(true);
};

Simple.prototype.unmute = function() {
  if (this.state !== C.STATUS_CONNECTED) {
    this.logger.warn('An active call is required to unmute audio');
    return;
  }
  this.logger.log('Unmuting Audio');
  this.toggleMute(false);
};

Simple.prototype.sendDTMF = function(tone) {
  if (this.state !== C.STATUS_CONNECTED) {
    this.logger.warn('An active call is required to send a DTMF tone');
    return;
  }
  this.logger.log('Sending DTMF tone: ' + tone);
  this.session.dtmf(tone);
};

// Private Helpers

Simple.prototype.setupMedia = function() {
  // If there is a video track, it will attach the video and audio to the same element
  var remoteStream = this.session.sessionDescriptionHandler.peerConnection.getRemoteStreams()[0];
  if (this.video) {
    this.options.media.remote.video.srcObject = remoteStream;
    this.options.media.remote.video.play();
    if (this.options.media.local.video) {
      this.options.media.local.video.srcObject = this.session.sessionDescriptionHandler.peerConnection.getLocalStreams()[0];
      this.options.media.local.video.volume = 0;
      this.options.media.local.video.play();
    }
  } else if (this.audio) {
    this.options.media.remote.audio.srcObject = remoteStream;
    this.options.media.remote.audio.play();
  }
};

Simple.prototype.setupSession = function() {
  this.state = C.STATUS_NEW;
  this.emit('new', this.session);

  this.session.on('progress', this.onProgress.bind(this));
  this.session.on('accepted', this.onAccepted.bind(this));
  this.session.on('rejected', this.onEnded.bind(this));
  this.session.on('failed', this.onFailed.bind(this));
};

Simple.prototype.destroyMedia = function () {
  this.session.sessionDescriptionHandler.close();
};

Simple.prototype.toggleMute = function(mute) {
  this.session.sessionDescriptionHandler.peerConnection.getLocalStreams().forEach(function(stream) {
    // TODO: Forward/backwards compatible
    stream.getAudioTracks().forEach(function(track) {
      track.enabled = !mute;
    });
    stream.getVideoTracks().forEach(function(track) {
      track.enabled = !mute;
    });
  });
};

Simple.prototype.onAccepted = function() {
  this.state = C.STATUS_CONNECTED;
  this.setupMedia();
  this.emit('connected', this.session);
  this.session.on('hold', function() {
    this.emit('hold', this.session);
  }.bind(this));
  this.session.on('unhold', function() {
    this.emit('unhold', this.session);
  }.bind(this));
  this.session.on('dtmf', function(tone) {
    this.emit('dtmf', tone);
  }.bind(this));
  this.session.on('bye', this.onEnded.bind(this));
};

Simple.prototype.onProgress = function() {
  this.state = C.STATUS_CONNECTING;
  this.emit('connecting', this.session);
};

Simple.prototype.onFailed = function() {
  this.onEnded();
};

Simple.prototype.onEnded = function() {
  this.state = C.STATUS_COMPLETED;
  this.emit('ended', this.session);
};

return Simple;
};
