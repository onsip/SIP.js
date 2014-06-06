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

  SIP.Utils = require('./Utils')(SIP);
  SIP.LoggerFactory = require('./LoggerFactory')(window);
  SIP.Event = require('./Event')(SIP);
  SIP.EventEmitter = require('./EventEmitter')(SIP);
  SIP.C = require('./Constants')(SIP.name, SIP.version);
  SIP.Exceptions = require('./Exceptions');
  SIP.Timers = require('./Timers');
  SIP.Transport = require('./Transport')(SIP, window);
  SIP.Parser = require('./Parser')(SIP);
  SIP.OutgoingRequest = require('./SIPMessage/OutgoingRequest')(SIP);
  SIP.IncomingRequest = require('./SIPMessage/IncomingRequest')(SIP);
  SIP.IncomingResponse = require('./SIPMessage/IncomingResponse')(SIP);
  SIP.URI = require('./URI')(SIP);
  SIP.NameAddrHeader = require('./NameAddrHeader')(SIP);
  SIP.Transactions = require('./Transactions')(SIP, window);
  SIP.Dialog = require('./Dialog')(SIP, window);
  SIP.RequestSender = require('./RequestSender')(SIP);
  SIP.RegisterContext = require('./RegisterContext')(SIP, window);
  SIP.MediaHandler = require('./MediaHandler')(SIP.EventEmitter);
  SIP.ClientContext = require('./ClientContext')(SIP);
  SIP.ServerContext = require('./ServerContext')(SIP);
  SIP.InviteClientContext = require('./Session/InviteClientContext')(SIP);
  SIP.InviteServerContext = require('./Session/InviteServerContext')(SIP);
  SIP.Session = require('./Session')(SIP, window);
  SIP.Subscription = require('./Subscription')(SIP, window);
  SIP.WebRTC = require('./WebRTC')(SIP, window);
  SIP.UA = require('./UA')(SIP, window);
  SIP.Hacks = require('./Hacks')(window);
  SIP.sanityCheck = require('./SanityCheck')(SIP);
  SIP.DigestAuthentication = require('./DigestAuthentication')(SIP.Utils);
  SIP.Grammar = require('./Grammar/dist/Grammar')(SIP);

  return SIP;
})((typeof window !== 'undefined') ? window : global);
