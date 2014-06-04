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
  require('./LoggerFactory.js')(SIP, window, Logger);
  require('./EventEmitter.js')(SIP);
  require('./Constants.js')(SIP);
  require('./Exceptions.js')(SIP);
  require('./Timers.js')(SIP);
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
  require('./MediaHandler.js')(SIP);
  require('./ClientContext.js')(SIP);
  require('./ServerContext.js')(SIP);
  var SessionDTMF = require('./Session/DTMF.js')(SIP);
  require('./Session.js')(SIP, window, SessionDTMF);
  require('./Subscription.js')(SIP, window);
  var WebRTCMediaHandler = require('./WebRTC/MediaHandler.js')(SIP);
  var WebRTCMediaStreamManager = require('./WebRTC/MediaStreamManager.js')(SIP);
  require('./WebRTC.js')(SIP, window, WebRTCMediaHandler, WebRTCMediaStreamManager);
  require('./UA.js')(SIP, window);
  require('./Hacks.js')(SIP, window);
  require('./SanityCheck.js')(SIP);
  require('./DigestAuthentication.js')(SIP);
  SIP.Grammar = require('./Grammar/dist/Grammar');

  return SIP;
})((typeof window !== 'undefined') ? window : global);
