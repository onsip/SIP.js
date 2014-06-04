/**
 * @fileoverview WebRTC
 */

module.exports = function (Utils, window, MediaHandler, MediaStreamManager) {
var WebRTC;

WebRTC = {};

WebRTC.MediaHandler = MediaHandler;
WebRTC.MediaStreamManager = MediaStreamManager;

WebRTC.MediaStream = Utils.getPrefixedProperty(window, 'MediaStream');
WebRTC.getUserMedia = Utils.getPrefixedProperty(window.navigator, 'getUserMedia');
WebRTC.RTCPeerConnection = Utils.getPrefixedProperty(window, 'RTCPeerConnection');
WebRTC.RTCSessionDescription = Utils.getPrefixedProperty(window, 'RTCSessionDescription');

if (WebRTC.getUserMedia && WebRTC.RTCPeerConnection && WebRTC.RTCSessionDescription) {
  WebRTC.getUserMedia = WebRTC.getUserMedia.bind(window.navigator);
  WebRTC.isSupported = true;
}
else {
  WebRTC.isSupported = false;
}

return WebRTC;
};
