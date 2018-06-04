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
    return this.connectPromise(options).then(function (overrideEvent) {!overrideEvent && this.emit('connected');}.bind(this));
  }},

  /**
  * Called by connect, must return a promise
  * @abstract
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
  * Sends a message then emits a sentMsg event. Automatically emits an event upon resolution, unless data.overrideEvent is set. If you override the event in this fashion, you should emit it in your implementation of sendMsgPromise
  * @param {SIP.OutgoingRequest|String} msg
  * @param {Object} options
  * @returns {Promise}
  */
  send: {writable: true, value: function send (msg, options) {
    options = options || {};
    return this.sendMsgPromise(msg).then(function (data) {!data.overrideEvent && this.emit('sentMsg', data.msg);}.bind(this));
  }},

  /**
  * Called by send, must return a promise
  * @abstract
  * @param {SIP.OutgoingRequest|String} msg
  * @param {Object} [options]
  * @returns {Promise}
  */
  sendMsgPromise: {writable: true, value: function sendMsgPromise (msg, options) {}},

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
    return this.disconnectPromise(options).then(function (overrideEvent) {!overrideEvent && this.emit('disconnected');}.bind(this));
  }},

  /**
  * Called by disconnect, must return a promise
  * @abstract
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
   * Returns a promise which resolves once the UA is connected.
   * @returns {Promise}
   */
  waitForConnected: {writable: true, value: function waitForConnected () {
    return new SIP.Utils.Promise(function(resolve) {
      this.afterConnected(resolve);
    }.bind(this));
  }},
});

return Transport;
};
