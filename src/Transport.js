"use strict";
/* eslint-disable */
/**
 * @fileoverview Transport
 */

/* Transport
 * @class Abstract transport layer parent class
 * @param {Logger} logger
 * @param {Object} [options]
 */
module.exports = function (SIP) {
var Transport = function(logger, options) {};

Transport.prototype = Object.create(SIP.EventEmitter.prototype, {

  /**
  * Returns the promise designated by the child layer then emits a connected event. Automatically emits an event upon resolution, unless overrideEvent is set. If you override the event in this fashion, you should emit it in your implementation of connectPromise
  * @param {Object} [options]
  * @returns {Promise}
  */
  connect: {writable: true, value: function connect (options) {
    options = options || {};
    return this.connectPromise(options).then(function (data) {!data.overrideEvent && this.emit('connected');}.bind(this));
  }},

  /**
  * Called by connect, must return a promise
  * promise must resolve to an object. object supports 1 parameter: overrideEvent - Boolean
  * @abstract
  * @private
  * @param {Object} [options]
  * @returns {Promise}
  */
  connectPromise: {writable: true, value: function connectPromise (options) {}},

  /**
  * Returns true if the transport is connected
  * @abstract
  * @returns {Boolean}
  */
  isConnected: {writable: true, value: function isConnected () {}},

  /**
  * Sends a message then emits a 'messageSent' event. Automatically emits an event upon resolution, unless data.overrideEvent is set. If you override the event in this fashion, you should emit it in your implementation of sendPromise
  * @param {SIP.OutgoingRequest|String} msg
  * @param {Object} options
  * @returns {Promise}
  */
  send: {writable: true, value: function send (msg, options) {
    options = options || {};
    return this.sendPromise(msg).then(function (data) {!data.overrideEvent && this.emit('messageSent', data.msg);}.bind(this));
  }},

  /**
  * Called by send, must return a promise
  * promise must resolve to an object. object supports 2 parameters: msg - string (mandatory) and overrideEvent - Boolean (optional)
  * @abstract
  * @private
  * @param {SIP.OutgoingRequest|String} msg
  * @param {Object} [options]
  * @returns {Promise}
  */
  sendPromise: {writable: true, value: function sendPromise (msg, options) {}},

  /**
  * To be called when a message is received
  * @abstract
  * @param {Event} e
  */
  onMessage: {writable: true, value: function onMessage (e) {}},

  /**
  * Returns the promise designated by the child layer then emits a disconnected event. Automatically emits an event upon resolution, unless overrideEvent is set. If you override the event in this fashion, you should emit it in your implementation of disconnectPromise
  * @param {Object} [options]
  * @returns {Promise}
  */
  disconnect: {writable: true, value: function disconnect (options) {
    options = options || {};
    return this.disconnectPromise(options).then(function (data) {!data.overrideEvent && this.emit('disconnected');}.bind(this));
  }},

  /**
  * Called by disconnect, must return a promise
  * promise must resolve to an object. object supports 1 parameter: overrideEvent - Boolean
  * @abstract
  * @private
  * @param {Object} [options]
  * @returns {Promise}
  */
  disconnectPromise: {writable: true, value: function disconnectPromise (options) {}},

  afterConnected: {writable: true, value: function afterConnected (callback) {
    if (this.isConnected()) {
      callback();
    } else {
      this.once('connected', callback);
    }
  }},

  /**
   * Returns a promise which resolves once the UA is connected. DEPRECATION WARNING: just use afterConnected()
   * @returns {Promise}
   */
  waitForConnected: {writable: true, value: function waitForConnected () {
    console.warn("DEPRECATION WARNING Transport.waitForConnected(): use afterConnected() instead");
    return new SIP.Utils.Promise(function(resolve) {
      this.afterConnected(resolve);
    }.bind(this));
  }},
});

return Transport;
};
