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
  var Logger = require('./Logger');
  SIP.LoggerFactory = require('./LoggerFactory')(window, Logger);
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
  var DialogRequestSender = require('./Dialog/RequestSender')(SIP, window);
  require('./Dialogs')(SIP, DialogRequestSender);
  require('./RequestSender')(SIP);
  require('./RegisterContext')(SIP, window);
  SIP.MediaHandler = require('./MediaHandler')(SIP.EventEmitter);
  require('./ClientContext')(SIP);
  require('./ServerContext')(SIP);
  var SessionDTMF = require('./Session/DTMF')(SIP);
  require('./Session')(SIP, window, SessionDTMF);
  require('./Subscription')(SIP, window);
  var WebRTCMediaHandler = require('./WebRTC/MediaHandler')(SIP);
  var WebRTCMediaStreamManager = require('./WebRTC/MediaStreamManager')(SIP);
  SIP.WebRTC = require('./WebRTC')(SIP.Utils, window, WebRTCMediaHandler, WebRTCMediaStreamManager);
  require('./UA')(SIP, window);
  SIP.Hacks = require('./Hacks')(window);
  require('./SanityCheck')(SIP);
  SIP.DigestAuthentication = require('./DigestAuthentication')(SIP.Utils);
  SIP.Grammar = require('./Grammar/dist/Grammar')(SIP);

  return SIP;
})((typeof window !== 'undefined') ? window : global);
