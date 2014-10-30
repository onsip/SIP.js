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
  WebSocket: global.WebSocket,
  Transport: require('./Transport'),
  open: global.open,
  Promise: global.Promise,
  timers: global,

  // Console is not defined in ECMAScript, so just in case...
  console: global.console || {
    debug: function () {},
    log: function () {},
    warn: function () {},
    error: function () {}
  },

  MediaStream: getPrefixedProperty(global, 'MediaStream'),
  getUserMedia: getPrefixedProperty(global.navigator, 'getUserMedia'),
  RTCPeerConnection: getPrefixedProperty(global, 'RTCPeerConnection'),
  RTCSessionDescription: getPrefixedProperty(global, 'RTCSessionDescription'),

  attachMediaStream: global.attachMediaStream,
  createObjectURL: global.URL && global.URL.createObjectURL,
  revokeObjectURL: global.URL && global.URL.revokeObjectURL
};
