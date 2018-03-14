"use strict";
/**
 * @fileoverview SessionDescriptionHandlerObserver
 */

 /* SessionDescriptionHandlerObserver
  * @class SessionDescriptionHandler Observer Class.
  * @param {SIP.Session} session
  * @param {Object} [options]
  */

// Constructor
var SessionDescriptionHandlerObserver = function(session, options) {
  this.session = session || {};
  this.options = options || {};
};

SessionDescriptionHandlerObserver.prototype = {
  trackAdded: function() {
    this.session.emit('trackAdded');
  },
};

module.exports = SessionDescriptionHandlerObserver;
