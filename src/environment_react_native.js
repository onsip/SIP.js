"use strict";
var DeviceEventEmitter = require('react-native').DeviceEventEmitter;
var WebRTC = require('react-native-webrtc');

var toplevel = global.window || global;

module.exports = {
  WebSocket: toplevel.WebSocket || require('ws'),
  Transport: require('./Transport'),
  open: toplevel.open, // null: only use in followRefer() in Session.js
  Promise: toplevel.Promise || require('promiscuous'),
  timers: {
    'setTimeout': toplevel.setTimeout,
    'clearTimeout': toplevel.clearTimeout,
    'setInterval': toplevel.setInterval,
    'clearInterval': toplevel.clearInterval
  },

  // Console is not defined in ECMAScript, so just in case...
  console: toplevel.console || {
    debug: function () {},
    log: function () {},
    warn: function () {},
    error: function () {}
  },

  MediaStream: WebRTC.MediaStream,
  getUserMedia: WebRTC.getUserMedia,
  RTCPeerConnection: WebRTC.RTCPeerConnection,
  RTCSessionDescription: WebRTC.RTCSessionDescription,

  // we don't need html audio/video tag to render media.
  addEventListener: DeviceEventEmitter.addEventListener, // only used in UA.js that try to listen 'unload' browser event
  HTMLMediaElement: toplevel.HTMLMediaElement, // null: only used in desugar() in Session.js.
  attachMediaStream: toplevel.attachMediaStream, // null: only used in WebRTC/MediaStreamManager, and has a fall back function.
  createObjectURL: toplevel.URL && toplevel.URL.createObjectURL,
  revokeObjectURL: toplevel.URL && toplevel.URL.revokeObjectURL
};
