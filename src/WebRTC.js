/**
 * @fileoverview WebRTC
 */

module.exports = function (SIP, window) {
var WebRTC;

WebRTC = {};

WebRTC.MediaHandler = require('./WebRTC/MediaHandler.js')(SIP);
WebRTC.MediaStreamManager = require('./WebRTC/MediaStreamManager.js')(SIP);

WebRTC.MediaStream = SIP.Utils.getPrefixedProperty(window, 'MediaStream');
WebRTC.getUserMedia = SIP.Utils.getPrefixedProperty(window.navigator, 'getUserMedia');
WebRTC.RTCPeerConnection = SIP.Utils.getPrefixedProperty(window, 'RTCPeerConnection');
WebRTC.RTCSessionDescription = SIP.Utils.getPrefixedProperty(window, 'RTCSessionDescription');

if (WebRTC.getUserMedia && WebRTC.RTCPeerConnection && WebRTC.RTCSessionDescription) {
  WebRTC.getUserMedia = WebRTC.getUserMedia.bind(window.navigator);
  WebRTC.isSupported = true;
}
else {
  WebRTC.isSupported = false;
}

return WebRTC;
};
