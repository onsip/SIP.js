/**
 * @fileoverview MediaStreamManager
 */

/* MediaStreamManager
 * @class Manages the acquisition and release of MediaStreams.
 * @param {(getUserMedia constraints)} [defaultConstraints] The getUserMedia constraints to use if none are provided to acquire()
 */
module.exports = function (SIP) {

// Default MediaStreamManager provides single-use streams created with getUserMedia
var MediaStreamManager = function MediaStreamManager (defaultConstraints) {
  var events = [
  ];
  this.setConstraints(defaultConstraints);

  this.initEvents(events);
};
MediaStreamManager.prototype = Object.create(SIP.EventEmitter.prototype, {
  'acquire': {value: function acquire (onSuccess, onFailure, constraints) {
    constraints = constraints || this.constraints;
    SIP.WebRTC.getUserMedia(constraints, onSuccess, onFailure);
  }},

  'release': {value: function release (stream) {
    stream.stop();
  }},

  'setConstraints': {value: function setConstraints (constraints) {
    // Assume audio/video if no default constraints passed.
    this.constraints = constraints || {audio: true, video: true};
  }}
});

// A MediaStreamManager that reuses a given MediaStream in parallel, giving it out freely.
MediaStreamManager.ofStream = function ofStream (stream) {
  var events = [
  ];
  this.stream = stream;
  this.initEvents(events);
};
MediaStreamManager.ofStream.prototype = Object.create(MediaStreamManager.prototype, {
  'acquire': {value: function acquire (onSuccess) {
    onSuccess(this.stream);
  }},

  // don't stop the stream
  'release': {value: function release () {} }
});

MediaStreamManager.cast = function cast (obj) {
  if (!obj) {
    return new MediaStreamManager();
  }

  if (obj instanceof MediaStreamManager) {
    return obj;
  }

  if (SIP.WebRTC.MediaStream && obj instanceof SIP.WebRTC.MediaStream) {
    return new MediaStreamManager.ofStream(obj);
  }

  // if it's not a stream or a manager, assume it's a constraints object
  return new MediaStreamManager(obj);
};

// Return since it will be assigned to a variable.
return MediaStreamManager;
};
