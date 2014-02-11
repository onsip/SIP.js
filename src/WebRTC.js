/**
 * @fileoverview WebRTC
 */

(function(SIP) {
var WebRTC;

WebRTC = {};

WebRTC.MediaHandler = @@include('../src/WebRTC/MediaHandler.js')

WebRTC.MediaStreamManager = @@include('../src/WebRTC/MediaStreamManager.js')

WebRTC.MediaStream = window.MediaStream || window.webkitMediaStream;

// getUserMedia
if (window.navigator.getUserMedia) {
  WebRTC.getUserMedia = window.navigator.getUserMedia.bind(navigator);
}
else if (window.navigator.webkitGetUserMedia) {
  WebRTC.getUserMedia = window.navigator.webkitGetUserMedia.bind(navigator);
}
else if (window.navigator.mozGetUserMedia) {
  WebRTC.getUserMedia = window.navigator.mozGetUserMedia.bind(navigator);
}

// RTCPeerConnection
if (window.RTCPeerConnection) {
  WebRTC.RTCPeerConnection = window.RTCPeerConnection;
}
else if (window.webkitRTCPeerConnection) {
  WebRTC.RTCPeerConnection = window.webkitRTCPeerConnection;
}
else if (window.mozRTCPeerConnection) {
  WebRTC.RTCPeerConnection = window.mozRTCPeerConnection;
}

// RTCSessionDescription
if (window.RTCSessionDescription) {
  WebRTC.RTCSessionDescription = window.RTCSessionDescription;
}
else if (window.webkitRTCSessionDescription) {
  WebRTC.RTCSessionDescription = window.webkitRTCSessionDescription;
}
else if (window.mozRTCSessionDescription) {
  WebRTC.RTCSessionDescription = window.mozRTCSessionDescription;
}

// isSupported attribute.
if (WebRTC.getUserMedia && WebRTC.RTCPeerConnection && WebRTC.RTCSessionDescription) {
  WebRTC.isSupported = true;
}
else {
  WebRTC.isSupported = false;
}

SIP.WebRTC = WebRTC;
}(SIP));
