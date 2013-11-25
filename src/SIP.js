/*global console: false*/

/**
 * @name SIP
 * @namespace
 */
(function(window) {

var SIP = (function() {
  "use strict";

  var SIP = {};

  Object.defineProperties(SIP, {
    version: {
      get: function(){ return '<%= pkg.version %>'; }
    },
    name: {
      get: function(){ return '<%= pkg.title %>'; }
    }
  });

  return SIP;
}());
