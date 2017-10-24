/**
 * @name SIP
 * @namespace
 */
"use strict";

module.exports = function (environment) {

var pkg = require('../package.json'),
    version = pkg.version,
    title = pkg.title;

var SIP = Object.defineProperties({}, {
  version: {
    get: function(){ return version; }
  },
  name: {
    get: function(){ return title; }
  }
});

require('./Utils')(SIP, environment);
SIP.LoggerFactory = require('./LoggerFactory')(environment.console);
SIP.EventEmitter = require('./EventEmitter')();
SIP.C = require('./Constants')(SIP.name, SIP.version);
SIP.Exceptions = require('./Exceptions');
SIP.Timers = require('./Timers')(environment.timers);
SIP.Transport = environment.Transport(SIP, environment.WebSocket);
require('./Parser')(SIP);
require('./SIPMessage')(SIP);
require('./URI')(SIP);
require('./NameAddrHeader')(SIP);
require('./Transactions')(SIP);
require('./Dialogs')(SIP);
require('./RequestSender')(SIP);
require('./RegisterContext')(SIP);
SIP.SessionDescriptionHandler = require('./SessionDescriptionHandler')(SIP.EventEmitter);
require('./ClientContext')(SIP);
require('./ServerContext')(SIP);
require('./Session')(SIP);
require('./Subscription')(SIP);
require('./UA')(SIP, environment);
require('./SanityCheck')(SIP);
SIP.DigestAuthentication = require('./DigestAuthentication')(SIP.Utils);
SIP.Grammar = require('./Grammar')(SIP);
SIP.WebRTC = {
  Modifiers: require('./WebRTC/Modifiers')(SIP),
  Simple: require('./WebRTC/Simple')(SIP)
};

return SIP;
};
