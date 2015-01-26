"use strict";
/**
 * @fileoverview WebRTC
 */

module.exports = function (SIP, environment) {
var WebRTC;

WebRTC = {};

WebRTC.MediaHandler = require('./WebRTC/MediaHandler')(SIP);
WebRTC.MediaStreamManager = require('./WebRTC/MediaStreamManager')(SIP, environment);

var _isSupported;

WebRTC.isSupported = function () {
  if (_isSupported !== undefined) {
    return _isSupported;
  }

  WebRTC.MediaStream = environment.MediaStream;
  WebRTC.getUserMedia = environment.getUserMedia;
  WebRTC.RTCPeerConnection = environment.RTCPeerConnection;
  WebRTC.RTCSessionDescription = environment.RTCSessionDescription;

  if (WebRTC.RTCPeerConnection && WebRTC.RTCSessionDescription) {
    if (WebRTC.getUserMedia) {
      WebRTC.getUserMedia = SIP.Utils.promisify(environment, 'getUserMedia');
    }
    _isSupported = true;
  }
  else {
    _isSupported = false;
  }
  return _isSupported;
};

return WebRTC;
};
