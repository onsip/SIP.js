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
  SIP.LoggerFactory = require('./LoggerFactory.js')(window);
  SIP.Event = require('./Event.js')(SIP);
  SIP.EventEmitter = require('./EventEmitter.js')(SIP);
  SIP.C = require('./Constants.js')(SIP.name, SIP.version);
  SIP.Exceptions = require('./Exceptions.js');
  SIP.Timers = require('./Timers.js');
  SIP.Transport = require('./Transport.js')(SIP, window);
  SIP.Parser = require('./Parser.js')(SIP);
  SIP.OutgoingRequest = require('./SIPMessage/OutgoingRequest.js')(SIP);
  SIP.IncomingRequest = require('./SIPMessage/IncomingRequest.js')(SIP);
  SIP.IncomingResponse = require('./SIPMessage/IncomingResponse.js')(SIP);
  SIP.URI = require('./URI.js')(SIP);
  SIP.NameAddrHeader = require('./NameAddrHeader.js')(SIP);
  SIP.Transactions = require('./Transactions.js')(SIP, window);
  SIP.Dialog = require('./Dialogs.js')(SIP, window);
  SIP.RequestSender = require('./RequestSender.js')(SIP);
  SIP.RegisterContext = require('./RegisterContext.js')(SIP, window);
  SIP.MediaHandler = require('./MediaHandler.js')(SIP.EventEmitter);
  SIP.ClientContext = require('./ClientContext.js')(SIP);
  SIP.ServerContext = require('./ServerContext.js')(SIP);
  SIP.InviteClientContext = require('./Session/InviteClientContext.js')(SIP);
  SIP.InviteServerContext = require('./Session/InviteServerContext.js')(SIP);
  SIP.Session = require('./Session.js')(SIP, window);
  SIP.Subscription = require('./Subscription.js')(SIP, window);
  SIP.WebRTC = require('./WebRTC.js')(SIP, window);
  SIP.UA = require('./UA.js')(SIP, window);
  SIP.Hacks = require('./Hacks.js')(window);
  SIP.sanityCheck = require('./SanityCheck.js')(SIP);
  SIP.DigestAuthentication = require('./DigestAuthentication.js')(SIP.Utils);
  SIP.Grammar = require('./Grammar/dist/Grammar')(SIP);

  return SIP;
})((typeof window !== 'undefined') ? window : global);
