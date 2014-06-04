/**
 * @fileoverview MediaHandler
 */

/* MediaHandler
 * @class PeerConnection helper Class.
 * @param {SIP.Session} session
 * @param {Object} [options]
 */
module.exports = function (SIP) {
var MediaHandler = function(session, options) {
  // keep jshint happy
  session = session;
  options = options;
};

MediaHandler.prototype = Object.create(SIP.EventEmitter.prototype, {
  isReady: {value: function isReady () {}},

  close: {value: function close () {}},

  /**
   * @param {Function} onSuccess called with the obtained local media description
   * @param {Function} onFailure
   * @param {Object} [mediaHint] A custom object describing the media to be used during this session.
   */
  getDescription: {value: function getDescription (onSuccess, onFailure, mediaHint) {
    // keep jshint happy
    onSuccess = onSuccess;
    onFailure = onFailure;
    mediaHint = mediaHint;
  }},

  /**
  * Message reception.
  * @param {String} type
  * @param {String} description
  * @param {Function} onSuccess
  * @param {Function} onFailure
  */
  setDescription: {value: function setDescription (description, onSuccess, onFailure) {
    // keep jshint happy
    description = description;
    onSuccess = onSuccess;
    onFailure = onFailure;
  }}
});

SIP.MediaHandler = MediaHandler;
};
