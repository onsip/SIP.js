/**
 * @name SIP
 * @namespace
 */
module.exports = (function(window) {
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

  require('./Utils.js')(SIP);
  var Logger = require('./Logger.js');
  SIP.LoggerFactory = require('./LoggerFactory.js')(window, Logger);
  require('./EventEmitter.js')(SIP);
  SIP.C = require('./Constants.js')(SIP.name, SIP.version);
  SIP.Exceptions = require('./Exceptions.js');
  SIP.Timers = require('./Timers.js')(window);
  require('./Transport.js')(SIP, window);
  require('./Parser.js')(SIP);
  require('./SIPMessage.js')(SIP);
  require('./URI.js')(SIP);
  require('./NameAddrHeader.js')(SIP);
  require('./Transactions.js')(SIP, window);
  var DialogRequestSender = require('./Dialog/RequestSender.js')(SIP, window);
  require('./Dialogs.js')(SIP, DialogRequestSender);
  require('./RequestSender.js')(SIP);
  require('./RegisterContext.js')(SIP, window);
  SIP.MediaHandler = require('./MediaHandler.js')(SIP.EventEmitter);
  require('./ClientContext.js')(SIP);
  require('./ServerContext.js')(SIP);
  var SessionDTMF = require('./Session/DTMF.js')(SIP);
  require('./Session.js')(SIP, window, SessionDTMF);
  require('./Subscription.js')(SIP, window);
  var WebRTCMediaHandler = require('./WebRTC/MediaHandler.js')(SIP);
  var WebRTCMediaStreamManager = require('./WebRTC/MediaStreamManager.js')(SIP);
  SIP.WebRTC = require('./WebRTC.js')(SIP.Utils, window, WebRTCMediaHandler, WebRTCMediaStreamManager);
  require('./UA.js')(SIP, window);
  SIP.Hacks = require('./Hacks.js')(window);
  require('./SanityCheck.js')(SIP);
  SIP.DigestAuthentication = require('./DigestAuthentication.js')(SIP.Utils);
  SIP.Grammar = require('./Grammar/dist/Grammar')(SIP);

  return SIP;
})((typeof window !== 'undefined') ? window : global);
