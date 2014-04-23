/**
 * @fileoverview WebRTC
 */

(function(SIP) {
var WebRTC;

WebRTC = {};

WebRTC.MediaHandler = @@include('../src/WebRTC/MediaHandler.js')

WebRTC.MediaStreamManager = @@include('../src/WebRTC/MediaStreamManager.js')

WebRTC.MediaStream = SIP.Utils.getPrefixedProperty(window, 'MediaStream');
WebRTC.getUserMedia = SIP.Utils.getPrefixedProperty(window.navigator, 'getUserMedia');
WebRTC.RTCPeerConnection = SIP.Utils.getPrefixedProperty(window, 'RTCPeerConnection');
WebRTC.RTCSessionDescription = SIP.Utils.getPrefixedProperty(window, 'RTCSessionDescription');

// isSupported attribute.
if (WebRTC.getUserMedia && WebRTC.RTCPeerConnection && WebRTC.RTCSessionDescription) {
  WebRTC.getUserMedia = WebRTC.getUserMedia.bind(window.navigator);
  WebRTC.isSupported = true;
}
else {
  WebRTC.isSupported = false;
}

SIP.WebRTC = WebRTC;
}(SIP));
