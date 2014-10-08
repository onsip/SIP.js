/**
 * @fileoverview WebRTC
 */

module.exports = function (SIP) {
var WebRTC;

WebRTC = {};

WebRTC.MediaHandler = require('./WebRTC/MediaHandler')(SIP);
WebRTC.MediaStreamManager = require('./WebRTC/MediaStreamManager')(SIP);

var _isSupported;

WebRTC.isSupported = function () {
  if (_isSupported !== undefined) {
    return _isSupported;
  }

  WebRTC.MediaStream = SIP.Utils.getPrefixedProperty(global, 'MediaStream');
  WebRTC.getUserMedia = SIP.Utils.getPrefixedProperty(global.navigator, 'getUserMedia');
  WebRTC.RTCPeerConnection = SIP.Utils.getPrefixedProperty(global, 'RTCPeerConnection');
  WebRTC.RTCSessionDescription = SIP.Utils.getPrefixedProperty(global, 'RTCSessionDescription');

  if (WebRTC.RTCPeerConnection && WebRTC.RTCSessionDescription) {
    WebRTC.getUserMedia = SIP.Utils.addPromise(WebRTC.getUserMedia, global.navigator);
    _isSupported = true;
  }
  else {
    _isSupported = false;
  }
  return _isSupported;
};

return WebRTC;
};
