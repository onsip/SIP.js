/**
 * @fileoverview MediaHandler
 */

/* MediaHandler
 * @class PeerConnection helper Class.
 * @param {SIP.Session} session
 * @param {Object} [options]
 */
(function(SIP){
var MediaHandler = function(session, options) {
  session = session, options = options; // keep jshint happy
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
    onSuccess = onSuccess, onFailure = onFailure, mediaHint = mediaHint; // keep jshint happy
  }},

  /**
  * Message reception.
  * @param {String} type
  * @param {String} description
  * @param {Function} onSuccess
  * @param {Function} onFailure
  */
  setDescription: {value: function setDescription (description, onSuccess, onFailure) {
    description = description, onSuccess = onSuccess, onFailure = onFailure; // keep jshint happy
  }}
});

SIP.MediaHandler = MediaHandler;
}(SIP));
