"use strict";
/**
 * @fileoverview SessionDescriptionHandler
 */

/* SessionDescriptionHandler
 * @class PeerConnection helper Class.
 * @param {SIP.Session} session
 * @param {Object} [options]
 */
module.exports = function (EventEmitter) {
var SessionDescriptionHandler = function(session, options) {
  // keep jshint happy
  session = session;
  options = options;
};

SessionDescriptionHandler.prototype = Object.create(EventEmitter.prototype, {

  close: {value: function close () {}},

  /**
   * @param {Object} [mediaHint] A custom object describing the media to be used during this session.
   */
  getDescription: {value: function getDescription (constraints, modifier) {
    // keep jshint happy
    constraints = constraints;
    modifier = modifier;
  }},

  /**
   * Check if a SIP message contains a session description.
   * @param {SIP.SIPMessage} message
   * @returns {boolean}
   */
  hasSessionDescription: {value: function hasSessionDescription (contentType) {
    // keep jshint happy
    contentType = contentType;
  }},

  /**
   * Set the session description contained in a SIP message.
   * @param {SIP.SIPMessage} message
   * @returns {Promise}
   */
  setDescription: {value: function setDescription (sessionDescription, constraints, modifier) {
    // keep jshint happy
    sessionDescription = sessionDescription;
    constraints = constraints;
    modifier = modifier;
  }}
});

return SessionDescriptionHandler;
};
