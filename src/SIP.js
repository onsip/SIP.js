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

  SIP.Utils = require('./Utils.js')(SIP);
  var Logger = require('./Logger.js');
  SIP.LoggerFactory = require('./LoggerFactory.js')(window, Logger);
  SIP.Event = require('./Event.js')(SIP);
  SIP.EventEmitter = require('./EventEmitter.js')(SIP);
  SIP.C = require('./Constants.js')(SIP.name, SIP.version);
  SIP.Exceptions = require('./Exceptions.js');
  SIP.Timers = require('./Timers.js');
  SIP.Transport = require('./Transport.js')(SIP, window);
  SIP.Parser = require('./Parser.js')(SIP);
  SIP.OutgoingRequest = require('./SIPMessage/OutgoingRequest.js')(SIP);
  var IncomingMessage = require('./SIPMessage/IncomingMessage.js')(SIP);
  SIP.IncomingRequest = require('./SIPMessage/IncomingRequest.js')(SIP, IncomingMessage);
  SIP.IncomingResponse = require('./SIPMessage/IncomingResponse.js')(IncomingMessage);
  SIP.URI = require('./URI.js')(SIP);
  SIP.NameAddrHeader = require('./NameAddrHeader.js')(SIP);
  SIP.Transactions = require('./Transactions.js')(SIP, window);
  var DialogRequestSender = require('./Dialog/RequestSender.js')(SIP, window);
  SIP.Dialog = require('./Dialogs.js')(SIP, DialogRequestSender);
  SIP.RequestSender = require('./RequestSender.js')(SIP);
  SIP.RegisterContext = require('./RegisterContext.js')(SIP, window);
  SIP.MediaHandler = require('./MediaHandler.js')(SIP.EventEmitter);
  SIP.ClientContext = require('./ClientContext.js')(SIP);
  SIP.ServerContext = require('./ServerContext.js')(SIP);
  var SessionC = require('./Session/Constants.js');
  SIP.InviteClientContext = require('./Session/InviteClientContext.js')(SIP, SessionC);
  SIP.InviteServerContext = require('./Session/InviteServerContext.js')(SIP, SessionC);
  var SessionDTMF = require('./Session/DTMF.js')(SIP);
  SIP.Session = require('./Session.js')(SIP, window, SessionC, SessionDTMF);
  SIP.Subscription = require('./Subscription.js')(SIP, window);
  var WebRTCMediaHandler = require('./WebRTC/MediaHandler.js')(SIP);
  var WebRTCMediaStreamManager = require('./WebRTC/MediaStreamManager.js')(SIP);
  SIP.WebRTC = require('./WebRTC.js')(SIP.Utils, window, WebRTCMediaHandler, WebRTCMediaStreamManager);
  SIP.UA = require('./UA.js')(SIP, window);
  SIP.Hacks = require('./Hacks.js')(window);
  SIP.sanityCheck = require('./SanityCheck.js')(SIP);
  SIP.DigestAuthentication = require('./DigestAuthentication.js')(SIP.Utils);
  SIP.Grammar = require('./Grammar/dist/Grammar')(SIP);

  return SIP;
})((typeof window !== 'undefined') ? window : global);
