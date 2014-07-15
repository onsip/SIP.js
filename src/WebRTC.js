/**
 * @fileoverview WebRTC
 */

module.exports = function (Utils, window, MediaHandler, MediaStreamManager) {
var WebRTC;

WebRTC = {};

WebRTC.MediaHandler = MediaHandler;
WebRTC.MediaStreamManager = MediaStreamManager;

var _isSupported;

WebRTC.isSupported = function () {
  if (_isSupported !== undefined) {
    return _isSupported;
  }

  WebRTC.MediaStream = Utils.getPrefixedProperty(window, 'MediaStream');
  WebRTC.getUserMedia = Utils.getPrefixedProperty(window.navigator, 'getUserMedia');
  WebRTC.RTCPeerConnection = Utils.getPrefixedProperty(window, 'RTCPeerConnection');
  WebRTC.RTCSessionDescription = Utils.getPrefixedProperty(window, 'RTCSessionDescription');

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
