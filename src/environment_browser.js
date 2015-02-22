"use strict";

var toplevel = global.window || global;

function getPrefixedProperty (object, name) {
  if (object == null) {
    return;
  }
  var capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);
  var prefixedNames = [name, 'webkit' + capitalizedName, 'moz' + capitalizedName];
  for (var i in prefixedNames) {
    var property = object[prefixedNames[i]];
    if (property) {
      return property.bind(object);
    }
  }
}

module.exports = {
  WebSocket: toplevel.WebSocket,
  Transport: require('./Transport'),
  open: toplevel.open,
  Promise: toplevel.Promise,
  timers: toplevel,

  // Console is not defined in ECMAScript, so just in case...
  console: toplevel.console || {
    debug: function () {},
    log: function () {},
    warn: function () {},
    error: function () {}
  },

  MediaStream: getPrefixedProperty(toplevel, 'MediaStream'),
  getUserMedia: getPrefixedProperty(toplevel.navigator, 'getUserMedia'),
  RTCPeerConnection: getPrefixedProperty(toplevel, 'RTCPeerConnection'),
  RTCSessionDescription: getPrefixedProperty(toplevel, 'RTCSessionDescription'),

  addEventListener: getPrefixedProperty(toplevel, 'addEventListener'),
  HTMLMediaElement: toplevel.HTMLMediaElement,

  attachMediaStream: toplevel.attachMediaStream,
  createObjectURL: toplevel.URL && toplevel.URL.createObjectURL,
  revokeObjectURL: toplevel.URL && toplevel.URL.revokeObjectURL
};
