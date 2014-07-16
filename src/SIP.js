/**
 * @name SIP
 * @namespace
 */
  "use strict";

  var SIP = {};
  module.exports = SIP;

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
  SIP.LoggerFactory = require('./LoggerFactory');
  SIP.EventEmitter = require('events').EventEmitter;
  SIP.EventEmitter.prototype.initEvents =
  SIP.EventEmitter.prototype.initMoreEvents = function (events) {
    events.forEach(function addLogListener (name) {
      this.on(name, function logEmission () {
        if (this.logger) {
          this.logger.log('emitting event ' + name);
        } else if (global.console && typeof jasmine === 'undefined') {
          global.console.warn('(no logger) emitting event ' + name);
        }
      });
    }, this);
  };
  SIP.C = require('./Constants')(SIP.name, SIP.version);
  SIP.Exceptions = require('./Exceptions');
  SIP.Timers = require('./Timers');
  require('./Transport')(SIP, global.WebSocket);
  require('./Parser')(SIP);
  require('./SIPMessage')(SIP);
  require('./URI')(SIP);
  require('./NameAddrHeader')(SIP);
  require('./Transactions')(SIP);
  require('./Dialogs')(SIP);
  require('./RequestSender')(SIP);
  require('./RegisterContext')(SIP);
  SIP.MediaHandler = require('./MediaHandler')(SIP.EventEmitter);
  require('./ClientContext')(SIP);
  require('./ServerContext')(SIP);
  require('./Session')(SIP);
  require('./Subscription')(SIP);
  SIP.WebRTC = require('./WebRTC')(SIP);
  require('./UA')(SIP);
  SIP.Hacks = require('./Hacks');
  require('./SanityCheck')(SIP);
  SIP.DigestAuthentication = require('./DigestAuthentication')(SIP.Utils);
  SIP.Grammar = require('./Grammar/dist/Grammar')(SIP);
