/**
 * @name SIP
 * @namespace
 */
module.exports = (function(window) {
  "use strict";

  var SIP = {};

  var pkg = require('../package.json');

  Object.defineProperties(SIP, {
    version: {
      get: function(){ return pkg.version; }
    },
    name: {
      get: function(){ return pkg.title; }
    }
  });

  require('./Utils')(SIP);
  SIP.LoggerFactory = require('./LoggerFactory')(window);
  require('./EventEmitter')(SIP);
  SIP.C = require('./Constants')(SIP.name, SIP.version);
  SIP.Exceptions = require('./Exceptions');
  SIP.Timers = require('./Timers')(window);
  require('./Transport')(SIP, window);
  require('./Parser')(SIP);
  require('./SIPMessage')(SIP);
  require('./URI')(SIP);
  require('./NameAddrHeader')(SIP);
  require('./Transactions')(SIP, window);
  require('./Dialogs')(SIP);
  require('./RequestSender')(SIP);
  require('./RegisterContext')(SIP, window);
  SIP.MediaHandler = require('./MediaHandler')(SIP.EventEmitter);
  require('./ClientContext')(SIP);
  require('./ServerContext')(SIP);
  require('./Session')(SIP, window);
  require('./Subscription')(SIP, window);
  SIP.WebRTC = require('./WebRTC')(SIP, window);
  require('./UA')(SIP, window);
  SIP.Hacks = require('./Hacks')(window);
  require('./SanityCheck')(SIP);
  SIP.DigestAuthentication = require('./DigestAuthentication')(SIP.Utils);
  SIP.Grammar = require('./Grammar/dist/Grammar')(SIP);

  return SIP;
})((typeof window !== 'undefined') ? window : global);
