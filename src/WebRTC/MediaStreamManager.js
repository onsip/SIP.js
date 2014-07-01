/**
 * @fileoverview MediaStreamManager
 */

/* MediaStreamManager
 * @class Manages the acquisition and release of MediaStreams.
 * @param {mediaHint} [defaultMediaHint] The mediaHint to use if none is provided to acquire()
 */
(function(SIP){

// Default MediaStreamManager provides single-use streams created with getUserMedia
var MediaStreamManager = function MediaStreamManager (defaultMediaHint) {
  if (!SIP.WebRTC.isSupported()) {
    throw new SIP.Exceptions.NotSupportedError('Media not supported');
  }

  var events = [
    'userMediaRequest',
    'userMedia',
    'userMediaFailed'
  ];
  this.mediaHint = defaultMediaHint || {
    constraints: {audio: true, video: true}
  };

  this.initEvents(events);

  // map of streams to acquisition manner:
  // true -> passed in as mediaHint.stream
  // false -> getUserMedia
  this.acquisitions = {};
};
MediaStreamManager.streamId = function (stream) {
  return stream.getAudioTracks().concat(stream.getVideoTracks())
    .map(function trackId (track) {
      return track.id;
    })
    .join('');
};

MediaStreamManager.render = function render (stream, elements) {
  if (!elements) {
    return false;
  }

  function attachAndPlay (element, stream) {
    (window.attachMediaStream || attachMediaStream)(element, stream);
    ensureMediaPlaying(element);
  }

  function attachMediaStream(element, stream) {
    if (typeof element.src !== 'undefined') {
      URL.revokeObjectURL(element.src);
      element.src = URL.createObjectURL(stream);
    } else if (typeof (element.srcObject || element.mozSrcObject) !== 'undefined') {
      element.srcObject = element.mozSrcObject = stream;
    } else {
      return false;
    }

    return true;
  }

  function ensureMediaPlaying (mediaElement) {
    var interval = 100;
    mediaElement.ensurePlayingIntervalId = setInterval(function () {
      if (mediaElement.paused) {
        mediaElement.play();
      }
      else {
        clearInterval(mediaElement.ensurePlayingIntervalId);
      }
    }, interval);
  }

  if (elements.video) {
    if (elements.audio) {
      elements.video.volume = 0;
    }
    attachAndPlay(elements.video, stream);
  }
  if (elements.audio) {
    attachAndPlay(elements.audio, stream);
  }
};

MediaStreamManager.prototype = Object.create(SIP.EventEmitter.prototype, {
  'acquire': {value: function acquire (onSuccess, onFailure, mediaHint) {
    mediaHint = Object.keys(mediaHint || {}).length ? mediaHint : this.mediaHint;

    var saveSuccess = function (onSuccess, stream, isHintStream) {
      var streamId = MediaStreamManager.streamId(stream);
      this.acquisitions[streamId] = !!isHintStream;
      onSuccess(stream);
    }.bind(this, onSuccess);

    if (mediaHint.stream) {
      saveSuccess(mediaHint.stream, true);
    } else if (SIP.Utils.isMediaStream(mediaHint)) {
      saveSuccess(mediaHint, true);
    } else {
      // Fallback to audio/video enabled if no mediaHint can be found.
      var constraints = mediaHint.constraints ||
        (this.mediaHint && this.mediaHint.constraints) ||
        {audio: true, video: true};

      this.emit('userMediaRequest', constraints);

      var emitThenCall = function (eventName, callback) {
        var callbackArgs = Array.prototype.slice.call(arguments, 2);
        // Emit with all of the arguments from the real callback.
        var newArgs = [eventName].concat(callbackArgs);

        this.emit.apply(this, newArgs);

        callback.apply(null, callbackArgs);
      }.bind(this);

      SIP.WebRTC.getUserMedia(constraints,
        emitThenCall.bind(this, 'userMedia', saveSuccess),
        emitThenCall.bind(this, 'userMediaFailed', onFailure)
      );
    }
  }},

  'release': {value: function release (stream) {
    var streamId = MediaStreamManager.streamId(stream);
    if (this.acquisitions[streamId] === false) {
      stream.stop();
    }
    delete this.acquisitions[streamId];
  }},
});

// Return since it will be assigned to a variable.
return MediaStreamManager;
}(SIP));
