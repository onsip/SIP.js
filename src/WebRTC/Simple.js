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
    throw new Error('At least one remote audio or video element is required for Simple.');
  }

  this.options = options;

  // https://stackoverflow.com/questions/7944460/detect-safari-browser
  var browserUa = global.navigator.userAgent.toLowerCase();
  var isSafari = false;
  if (browserUa.indexOf('safari') > -1 && browserUa.indexOf('chrome') < 0) {
    isSafari = true;
  }
  var sessionDescriptionHandlerFactoryOptions = {};
  if (isSafari) {
    sessionDescriptionHandlerFactoryOptions.modifiers = [SIP.WebRTC.Modifiers.stripG722];
  }

  if (!this.options.ua.uri) {
    this.anonymous = true;
  }

  this.ua = new SIP.UA({
    // User Configurable Options
    wsServers:         this.options.ua.wsServers,
    uri:               this.options.ua.uri,
    authorizationUser: this.options.ua.authorizationUser,
    password:          this.options.ua.password,
    displayName:       this.options.ua.displayName,
    // Undocumented "Advanced" Options
    traceSip:          this.options.ua.traceSip,
    userAgentString:   this.options.ua.userAgentString,
    // Fixed Options
    register:          true,
    sessionDescriptionHandlerFactoryOptions: sessionDescriptionHandlerFactoryOptions,
  });

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
    this.emit('ringing', this.session);
  }.bind(this));

  this.ua.on('message', function(message) {
    this.emit('message', message);
  }.bind(this));

  return this;
};

Simple.prototype = Object.create(SIP.EventEmitter.prototype);
Simple.C = C;

// Public

Simple.prototype.call = function(destination) {
  if (!this.ua || !this.checkRegistration()) {
    this.logger.warn('A registered UA is required for calling');
    return;
  }
  if (this.state !== C.STATUS_NULL && this.state !== C.STATUS_COMPLETED) {
    this.logger.warn('Cannot make more than a single call with Simple');
    return;
  }
  // Safari hack, because you cannot call .play() from a non user action
  if (this.options.media.remote.audio) {
    this.options.media.remote.audio.autoplay = true;
  }
  if (this.options.media.remote.video) {
    this.options.media.remote.video.autoplay = true;
  }
  if (this.options.media.local && this.options.media.local.video) {
    this.options.media.local.video.autoplay = true;
    this.options.media.local.video.volume = 0;
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
  // Safari hack, because you cannot call .play() from a non user action
  if (this.options.media.remote.audio) {
    this.options.media.remote.audio.autoplay = true;
  }
  if (this.options.media.remote.video) {
    this.options.media.remote.video.autoplay = true;
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
  if (this.state !== C.STATUS_CONNECTED) {
    return this.session.cancel();
  } else {
    return this.session.bye();
  }
};

Simple.prototype.hold = function() {
  if (this.state !== C.STATUS_CONNECTED || this.session.local_hold) {
    this.logger.warn('Cannot put call on hold');
    return;
  }
  this.mute();
  this.logger.log('Placing session on hold');
  return this.session.hold();
};

Simple.prototype.unhold = function() {
  if (this.state !== C.STATUS_CONNECTED || !this.session.local_hold) {
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
  this.emit('mute', this);
};

Simple.prototype.unmute = function() {
  if (this.state !== C.STATUS_CONNECTED) {
    this.logger.warn('An active call is required to unmute audio');
    return;
  }
  this.logger.log('Unmuting Audio');
  this.toggleMute(false);
  this.emit('unmute', this);
};

Simple.prototype.sendDTMF = function(tone) {
  if (this.state !== C.STATUS_CONNECTED) {
    this.logger.warn('An active call is required to send a DTMF tone');
    return;
  }
  this.logger.log('Sending DTMF tone: ' + tone);
  this.session.dtmf(tone);
};

Simple.prototype.message = function(destination, message) {
  if (!this.ua || !this.checkRegistration()) {
    this.logger.warn('A registered UA is required to send a message');
    return;
  }
  if (!destination || !message) {
    this.logger.warn('A destination and message are required to send a message');
    return;
  }
  this.ua.message(destination, message);
};

// Private Helpers

Simple.prototype.checkRegistration = function() {
  return (this.anonymous || (this.ua && this.ua.isRegistered()));
};

Simple.prototype.setupRemoteMedia = function() {
  // If there is a video track, it will attach the video and audio to the same element
  var pc = this.session.sessionDescriptionHandler.peerConnection;
  var remoteStream;

  if (pc.getReceivers) {
    remoteStream = new global.window.MediaStream();
    pc.getReceivers().forEach(function(receiver) {
      var track = receiver.track;
      if (track) {
        remoteStream.addTrack(track);
      }
    });
  } else {
    remoteStream = pc.getRemoteStreams()[0];
  }
  if (this.video) {
    this.options.media.remote.video.srcObject = remoteStream;
    this.options.media.remote.video.play().catch(function() {
      this.logger.log('play was rejected');
    }.bind(this));
  } else if (this.audio) {
    this.options.media.remote.audio.srcObject = remoteStream;
    this.options.media.remote.audio.play().catch(function() {
      this.logger.log('play was rejected');
    }.bind(this));
  }
};

Simple.prototype.setupLocalMedia = function() {
  if (this.video && this.options.media.local && this.options.media.local.video) {
    var pc = this.session.sessionDescriptionHandler.peerConnection;
    var localStream;
    if (pc.getSenders) {
      localStream = new global.window.MediaStream();
      pc.getSenders().forEach(function(sender) {
        var track = sender.track;
        if (track && track.kind === 'video') {
          localStream.addTrack(track);
        }
      });
    } else {
      localStream = pc.getLocalStreams()[0];
    }
    this.options.media.local.video.srcObject = localStream;
    this.options.media.local.video.volume = 0;
    this.options.media.local.video.play();
  }
};

Simple.prototype.cleanupMedia = function() {
  if (this.video) {
    this.options.media.remote.video.srcObject = null;
    this.options.media.remote.video.pause();
    if (this.options.media.local && this.options.media.local.video) {
      this.options.media.local.video.srcObject = null;
      this.options.media.local.video.pause();
    }
  }
  if (this.audio) {
    this.options.media.remote.audio.srcObject = null;
    this.options.media.remote.audio.pause();
  }
};

Simple.prototype.setupSession = function() {
  this.state = C.STATUS_NEW;
  this.emit('new', this.session);

  this.session.on('progress', this.onProgress.bind(this));
  this.session.on('accepted', this.onAccepted.bind(this));
  this.session.on('rejected', this.onEnded.bind(this));
  this.session.on('failed', this.onFailed.bind(this));
  this.session.on('terminated', this.onEnded.bind(this));
};

Simple.prototype.destroyMedia = function () {
  this.session.sessionDescriptionHandler.close();
};

Simple.prototype.toggleMute = function(mute) {
  var pc = this.session.sessionDescriptionHandler.peerConnection;
  if (pc.getSenders) {
    pc.getSenders().forEach(function(sender) {
      if (sender.track) {
        sender.track.enabled = !mute;
      }
    });
  } else {
    pc.getLocalStreams().forEach(function(stream) {
      stream.getAudioTracks().forEach(function(track) {
        track.enabled = !mute;
      });
      stream.getVideoTracks().forEach(function(track) {
        track.enabled = !mute;
      });
    });
  }
};

Simple.prototype.onAccepted = function() {
  this.state = C.STATUS_CONNECTED;
  this.emit('connected', this.session);

  this.setupLocalMedia();
  this.setupRemoteMedia();
  this.session.sessionDescriptionHandler.on('addTrack', function() {
    this.logger.log('A track has been added, triggering new remoteMedia setup');
    this.setupRemoteMedia();
  }.bind(this));

  this.session.sessionDescriptionHandler.on('addStream', function() {
    this.logger.log('A stream has been added, trigger new remoteMedia setup');
    this.setupRemoteMedia();
  }.bind(this));

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
  this.cleanupMedia();
};

return Simple;
};
