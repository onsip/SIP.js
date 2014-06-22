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
  ];
  this.setMediaHint(defaultMediaHint);

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
MediaStreamManager.prototype = Object.create(SIP.EventEmitter.prototype, {
  'acquire': {value: function acquire (onSuccess, onFailure, mediaHint) {
    mediaHint = mediaHint || this.mediaHint;

    var saveSuccess = function (onSuccess, stream, isHintStream) {
      var streamId = MediaStreamManager.streamId(stream);
      this.acquisitions[streamId] = !!isHintStream;
      onSuccess(stream);
    }.bind(this, onSuccess);

    if (mediaHint.stream) {
      saveSuccess(mediaHint.stream, true);
    } else if (mediaHint.constraints) {
      SIP.WebRTC.getUserMedia(mediaHint.constraints, saveSuccess, onFailure);
    } else {
      var errorMessage = 'mediaHint specifies neither constraints nor stream: ';
      errorMessage += JSON.stringify(mediaHint);
      onFailure(new Error(errorMessage));
    }
  }},

  'release': {value: function release (stream) {
    var streamId = MediaStreamManager.streamId(stream);
    if (this.acquisitions[streamId] === false) {
      stream.stop();
    }
    delete this.acquisitions[streamId];
  }},

  'setMediaHint': {value: function setMediaHint (mediaHint) {
    // Assume audio/video constraints if no default mediaHint passed.
    this.mediaHint = mediaHint || {
      constraints: {audio: true, video: true}
    };
  }}
});

// Return since it will be assigned to a variable.
return MediaStreamManager;
}(SIP));
