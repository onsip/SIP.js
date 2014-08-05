/**
 * @fileoverview WebRTC
 */

module.exports = function (SIP, window) {
var WebRTC;

WebRTC = {};

WebRTC.MediaHandler = require('./WebRTC/MediaHandler')(SIP);
WebRTC.MediaStreamManager = require('./WebRTC/MediaStreamManager')(SIP);

var _isSupported;

WebRTC.isSupported = function () {
  if (_isSupported !== undefined) {
    return _isSupported;
  }

  WebRTC.MediaStream = SIP.Utils.getPrefixedProperty(window, 'MediaStream');
  WebRTC.getUserMedia = SIP.Utils.getPrefixedProperty(window.navigator, 'getUserMedia');
  WebRTC.RTCPeerConnection = SIP.Utils.getPrefixedProperty(window, 'RTCPeerConnection');
  WebRTC.RTCSessionDescription = SIP.Utils.getPrefixedProperty(window, 'RTCSessionDescription');

  if (WebRTC.getUserMedia && WebRTC.RTCPeerConnection && WebRTC.RTCSessionDescription) {
    WebRTC.getUserMedia = WebRTC.getUserMedia.bind(window.navigator);
    _isSupported = true;
  }
  else {
    _isSupported = false;
  }
  return _isSupported;
};

return WebRTC;
};
