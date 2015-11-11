"use strict";
var NodeEventEmitter = require('events').EventEmitter;

module.exports = function (console) {

// Don't use `new SIP.EventEmitter()` for inheriting.
// Use Object.create(SIP.EventEmitter.prototoype);
function EventEmitter () {
  NodeEventEmitter.call(this);
}

EventEmitter.prototype = Object.create(NodeEventEmitter.prototype, {
  constructor: {
    value: EventEmitter,
    enumerable: false,
    writable: true,
    configurable: true
  }
});

EventEmitter.prototype.off = function off (eventName, listener) {
  var warning = '';
  warning += 'SIP.EventEmitter#off is deprecated and may be removed in future SIP.js versions.\n';
  warning += 'Please use removeListener or removeAllListeners instead.\n';
  warning += 'See here for more details:\n';
  warning += 'http://nodejs.org/api/events.html#events_emitter_removelistener_event_listener';
  console.warn(warning);

  if (arguments.length < 2) {
    return this.removeAllListeners.apply(this, arguments);
  } else {
    return this.removeListener(eventName, listener);
  }
};

return EventEmitter;

};
