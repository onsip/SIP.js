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
  open: global.open,
  Promise: global.Promise || require('promiscuous'),
  console: require('console'),
  timers: require('timers'),

  MediaStream: getPrefixedProperty(global, 'MediaStream'),
  getUserMedia: getPrefixedProperty(global.navigator, 'getUserMedia'),
  RTCPeerConnection: getPrefixedProperty(global, 'RTCPeerConnection'),
  RTCSessionDescription: getPrefixedProperty(global, 'RTCSessionDescription'),

  attachMediaStream: global.attachMediaStream,
  // these aren't prefixed, but some platforms don't have global.URL
  createObjectURL: getPrefixedProperty(global.URL, 'createObjectURL'),
  revokeObjectURL: getPrefixedProperty(global.URL, 'revokeObjectURL')
};
