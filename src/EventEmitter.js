var NodeEventEmitter = require('events').EventEmitter;

function EventEmitter () {}

EventEmitter.prototype = Object.create(NodeEventEmitter.prototype);

EventEmitter.prototype.off = function off (eventName, listener) {
  if (arguments.length < 2) {
    return this.removeAllListeners.apply(this, arguments);
  } else {
    return this.removeListener(eventName, listener);
  }
};

module.exports = EventEmitter;
