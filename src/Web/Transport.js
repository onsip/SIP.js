"use strict";
/**
 * @fileoverview Transport
 */

/**
 * @augments SIP
 * @class Transport
 * @param {Object} options
 */
module.exports = function (SIP) {
var Transport,
  C = {
    // Transport status codes
    STATUS_CONNECTING:  0,
    STATUS_OPEN:        1,
    STATUS_CLOSING:     2,
    STATUS_CLOSED:      3,
  };

var WebSocket = (global.window || global).WebSocket;

/**
 * Compute an amount of time in seconds to wait before sending another
 * keep-alive.
 * @returns {Number}
 */
function computeKeepAliveTimeout(upperBound) {
  var lowerBound = upperBound * 0.8;
  return 1000 * (Math.random() * (upperBound - lowerBound) + lowerBound);
}

Transport = function(logger, options) {
  options = SIP.Utils.defaultOptions({}, options);
  this.logger = logger;

  this.ws = null;
  this.server = null;

  this.connectionPromise = null;
  this.connectDeferredResolve = null;
  this.connectionTimeout = null;

  this.disconnectionPromise = null;
  this.disconnectDeferredResolve = null;

  this.boundOnOpen = null;
  this.boundOnMessage = null;
  this.boundOnClose = null;
  this.boundOnError = null;

  this.reconnectionAttempts = 0;
  this.reconnectTimer = null;

  // Keep alive
  this.keepAliveInterval = null;
  this.keepAliveDebounceTimeout = null;

  this.status = C.STATUS_CONNECTING;

  this.configuration = {};

  this.loadConfig(options);
};

Transport.prototype = Object.create(SIP.Transport.prototype, {

  /**
  *
  * @returns {Boolean}
  */
  isConnected: {writable: true, value: function isConnected () {
    return this.status === C.STATUS_OPEN;
  }},

  /**
   * Send a message.
   * @param {SIP.OutgoingRequest|String} msg
   * @param {Object} [options]
   * @returns {Promise}
   */
  sendPromise: {writable: true, value: function sendPromise (msg, options) {
    options = options || {};
    if (!this.statusAssert(C.STATUS_OPEN, options.force)) {
      this.onError('unable to send message - WebSocket not open');
      return SIP.Utils.Promise.reject();
    }

    var message = msg.toString();

    if (this.ws) {
      if (this.configuration.traceSip === true) {
        this.logger.log('sending WebSocket message:\n\n' + message + '\n');
      }
      this.ws.send(message);
      return SIP.Utils.Promise.resolve({msg: message});
    } else {
      this.onError('unable to send message - WebSocket does not exist');
      return SIP.Utils.Promise.reject();
    }
  }},

  /**
  * Disconnect socket.
  */
  disconnectPromise: {writable: true, value: function disconnectPromise (options) {
    if (this.disconnectionPromise) {
      return this.disconnectionPromise;
    }
    options = options || {};
    if (!this.statusTransition(C.STATUS_CLOSING, options.force)) {
      return SIP.Utils.Promise.reject('Failed status transition - attempted to disconnect a socket that was not open');
    }
    this.disconnectionPromise = new SIP.Utils.Promise(function(resolve, reject) {
      this.disconnectDeferredResolve = resolve;

      if (this.reconnectTimer) {
        SIP.Timers.clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }

      if (this.ws) {
        this.stopSendingKeepAlives();

        this.logger.log('closing WebSocket ' + this.server.ws_uri);
        this.ws.close(options.code, options.reason);
      } else {
        reject('Attempted to disconnect but the websocket doesn\'t exist');
      }
    }.bind(this));

    return this.disconnectionPromise;
  }},

  /**
  * Connect socket.
  */
  connectPromise: {writable: true, value: function connectPromise (options) {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }
    options = options || {};
    this.server = this.server || this.getNextWsServer(options.force);

    this.connectionPromise = new SIP.Utils.Promise(function(resolve, reject) {

      if ((this.status === C.STATUS_OPEN || this.status === C.STATUS_CLOSING) && !options.force) {
        this.logger.warn('WebSocket ' + this.server.ws_uri + ' is already connected');
        reject('Failed status check - attempted to open a connection but already open/closing');
        return;
      }

      this.connectDeferredResolve = resolve;

      this.status = C.STATUS_CONNECTING;
      this.logger.log('connecting to WebSocket ' + this.server.ws_uri);
      this.disposeWs();
      try {
        this.ws = new WebSocket(this.server.ws_uri, 'sip');
      } catch (e) {
        this.ws = null;
        this.status = C.STATUS_CLOSED; // force status to closed in error case
        this.onError('error connecting to WebSocket ' + this.server.ws_uri + ':' + e);
        reject('Failed to create a websocket');
        return;
      }

      if (!this.ws) {
        reject('Unexpected instance websocket not set');
        return;
      }

      this.connectionTimeout = SIP.Timers.setTimeout(function() {
        this.onError('took too long to connect - exceeded time set in configuration.connectionTimeout: ' + this.configuration.connectionTimeout + 's');
      }.bind(this), this.configuration.connectionTimeout * 1000);

      this.boundOnOpen = this.onOpen.bind(this);
      this.boundOnMessage = this.onMessage.bind(this);
      this.boundOnClose = this.onClose.bind(this);
      this.boundOnError = this.onError.bind(this);
      this.ws.addEventListener('open', this.boundOnOpen);
      this.ws.addEventListener('message', this.boundOnMessage);
      this.ws.addEventListener('close', this.boundOnClose);
      this.ws.addEventListener('error', this.boundOnError);
    }.bind(this));

    return this.connectionPromise;
  }},

  // Transport Event Handlers

  /**
  * @event
  * @param {event} e
  */
  onOpen: {writable: true, value: function onOpen () {
    this.status = C.STATUS_OPEN; // quietly force status to open
    this.emit('connected');
    SIP.Timers.clearTimeout(this.connectionTimeout);

    this.logger.log('WebSocket ' + this.server.ws_uri + ' connected');

    // Clear reconnectTimer since we are not disconnected
    if (this.reconnectTimer !== null) {
      SIP.Timers.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    // Reset reconnectionAttempts
    this.reconnectionAttempts = 0;

    // Reset disconnection promise so we can disconnect from a fresh state
    this.disconnectionPromise = null;
    this.disconnectDeferredResolve = null;

    // Start sending keep-alives
    this.startSendingKeepAlives();

    if (this.connectDeferredResolve) {
      this.connectDeferredResolve({overrideEvent: true});
    } else {
      this.logger.warn('Unexpected websocket.onOpen with no connectDeferredResolve');
    }
  }},

  /**
  * @event
  * @param {event} e
  */
  onClose: {writable: true, value: function onClose (e) {
    this.logger.log('WebSocket disconnected (code: ' + e.code + (e.reason? '| reason: ' + e.reason : '') +')');
    this.emit('disconnected', {code: e.code, reason: e.reason});

    if (this.status !== C.STATUS_CLOSING) {
      this.logger.warn('WebSocket abrupt disconnection');
      this.emit('transportError');
    }

    this.stopSendingKeepAlives();

    // Clean up connection variables so we can connect again from a fresh state
    SIP.Timers.clearTimeout(this.connectionTimeout);
    this.connectionTimeout = null;
    this.connectionPromise = null;
    this.connectDeferredResolve = null;

    // Check whether the user requested to close.
    if (this.disconnectDeferredResolve) {
      this.disconnectDeferredResolve({ overrideEvent: true });
      this.statusTransition(C.STATUS_CLOSED);
      this.disconnectDeferredResolve = null;
      return;
    }
    this.status = C.STATUS_CLOSED; // quietly force status to closed
    this.reconnect();
  }},

  /**
  * Removes event listeners and clears the instance ws
  * @private
  * @param {event} e
  */
  disposeWs: {writable: true, value: function disposeWs () {
    if (this.ws) {
      this.ws.removeEventListener('open', this.boundOnOpen);
      this.ws.removeEventListener('message', this.boundOnMessage);
      this.ws.removeEventListener('close', this.boundOnClose);
      this.ws.removeEventListener('error', this.boundOnError);
      this.boundOnOpen = null;
      this.boundOnMessage = null;
      this.boundOnClose = null;
      this.boundOnError = null;
      this.ws = null;
    }
  }},

  /**
  * @event
  * @param {event} e
  */
  onMessage: {writable: true, value: function onMessage (e) {
    var data = e.data;
    // CRLF Keep Alive response from server. Clear our keep alive timeout.
    if (/^(\r\n)+$/.test(data)) {
      this.clearKeepAliveTimeout();

      if (this.configuration.traceSip === true) {
        this.logger.log('received WebSocket message with CRLF Keep Alive response');
      }
      return;
    }

    else if (!data) {
      this.logger.warn('received empty message, message discarded');
      return;
    }

    // WebSocket binary message.
    else if (typeof data !== 'string') {
      try {
        data = String.fromCharCode.apply(null, new Uint8Array(data));
      } catch(err) {
        this.logger.warn('received WebSocket binary message failed to be converted into string, message discarded');
        return;
      }

      if (this.configuration.traceSip === true) {
        this.logger.log('received WebSocket binary message:\n\n' + data + '\n');
      }
    }

    // WebSocket text message.
    else {
      if (this.configuration.traceSip === true) {
        this.logger.log('received WebSocket text message:\n\n' + data + '\n');
      }
    }

    this.emit('message', data);
  }},

  /**
  * @event
  * @param {event} e
  */
  onError: {writable: true, value: function onError (e) {
    this.logger.warn('Transport error: ' + e);
    this.emit('transportError');
  }},

  /**
  * Reconnection attempt logic.
  * @private
  */
  reconnect: {writable: true, value: function reconnect () {
    if (this.reconnectionAttempts > 0) {
      this.logger.log('Reconnection attempt ' + this.reconnectionAttempts + ' failed');
    }

    if (this.noAvailableServers()) {
      this.logger.warn('no available ws servers left - going to closed state');
      this.status = C.STATUS_CLOSED;
      this.emit('closed');
      this.resetServerErrorStatus();
      return;
    }

    if (this.isConnected()) {
      this.logger.warn('attempted to reconnect while connected - forcing disconnect');
      this.disconnect({force: true});
    }

    this.reconnectionAttempts += 1;

    if (this.reconnectionAttempts > this.configuration.maxReconnectionAttempts) {
      this.logger.warn('maximum reconnection attempts for WebSocket ' + this.server.ws_uri);
      this.logger.log('transport ' + this.server.ws_uri + ' failed | connection state set to \'error\'');
      this.server.isError = true;
      this.emit('transportError');
      this.server = this.getNextWsServer();
      this.reconnectionAttempts = 0;
      this.reconnect();
    } else {
      this.logger.log('trying to reconnect to WebSocket ' + this.server.ws_uri + ' (reconnection attempt ' + this.reconnectionAttempts + ')');
      this.reconnectTimer = SIP.Timers.setTimeout(function() {
        this.connect();
        this.reconnectTimer = null;
      }.bind(this), (this.reconnectionAttempts === 1) ? 0 : this.configuration.reconnectionTimeout * 1000);
    }
  }},

  /**
  * Resets the error state of all servers in the configuration
  */
  resetServerErrorStatus: {writable: true, value: function resetServerErrorStatus () {
    var idx, length = this.configuration.wsServers.length;
    for(idx = 0; idx < length; idx++) {
      this.configuration.wsServers[idx].isError = false;
    }
  }},

  /**
  * Retrieve the next server to which connect.
  * @private
  * @param {Boolean} force allows bypass of server error status checking
  * @returns {Object} wsServer
  */
  getNextWsServer: {writable: true, value: function getNextWsServer (force) {
    if (this.noAvailableServers()) {
      this.logger.warn('attempted to get next ws server but there are no available ws servers left');
      return;
    }
    // Order servers by weight
    var idx, length, wsServer,
    candidates = [];

    length = this.configuration.wsServers.length;
    for (idx = 0; idx < length; idx++) {
      wsServer = this.configuration.wsServers[idx];

      if (wsServer.isError && !force) {
        continue;
      } else if (candidates.length === 0) {
        candidates.push(wsServer);
      } else if (wsServer.weight > candidates[0].weight) {
        candidates = [wsServer];
      } else if (wsServer.weight === candidates[0].weight) {
        candidates.push(wsServer);
      }
    }

    idx = Math.floor(Math.random() * candidates.length);

    return candidates[idx];
  }},

  /**
  * Checks all configuration servers, returns true if all of them have isError: true and false otherwise
  * @private
  * @returns {Boolean}
  */
  noAvailableServers: {writable: true, value: function noAvailableServers () {
    var server;
    for (server in this.configuration.wsServers) {
      if (!this.configuration.wsServers[server].isError) {
        return false;
      }
    }
    return true;
  }},

  //==============================
  // KeepAlive Stuff
  //==============================

  /**
   * Send a keep-alive (a double-CRLF sequence).
   * @private
   * @returns {Boolean}
   */
  sendKeepAlive: {writable: true, value: function sendKeepAlive () {
    if (this.keepAliveDebounceTimeout) {
      // We already have an outstanding keep alive, do not send another.
      return;
    }

    this.keepAliveDebounceTimeout = SIP.Timers.setTimeout(function() {
      this.emit('keepAliveDebounceTimeout');
      this.clearKeepAliveTimeout();
    }.bind(this), this.configuration.keepAliveDebounce * 1000);

    return this.send('\r\n\r\n');
  }},

  clearKeepAliveTimeout: {writable: true, value: function clearKeepAliveTimeout () {
    SIP.Timers.clearTimeout(this.keepAliveDebounceTimeout);
    this.keepAliveDebounceTimeout = null;
  }},

  /**
   * Start sending keep-alives.
   * @private
   */
  startSendingKeepAlives: {writable: true, value: function startSendingKeepAlives () {
    if (this.configuration.keepAliveInterval && !this.keepAliveInterval) {
      this.keepAliveInterval = SIP.Timers.setInterval(function() {
        this.sendKeepAlive();
        this.startSendingKeepAlives();
      }.bind(this), computeKeepAliveTimeout(this.configuration.keepAliveInterval));
    }
  }},

  /**
   * Stop sending keep-alives.
   * @private
   */
  stopSendingKeepAlives: {writable: true, value: function stopSendingKeepAlives () {
    SIP.Timers.clearInterval(this.keepAliveInterval);
    SIP.Timers.clearTimeout(this.keepAliveDebounceTimeout);
    this.keepAliveInterval = null;
    this.keepAliveDebounceTimeout = null;
  }},

  //==============================
  // Status Stuff
  //==============================

  /**
  * Checks given status against instance current status. Returns true if they match
  * @private
  * @param {Number} status
  * @param {Boolean} [force]
  * @returns {Boolean}
  */
  statusAssert: {writable: true, value: function statusAssert (status, force) {
    if (status === this.status) {
      return true;
    } else {
      if (force) {
        this.logger.warn('Attempted to assert '+ Object.keys(C)[this.status] + ' as ' + Object.keys(C)[status] + '- continuing with option: \'force\'');
        return true;
      } else {
        this.logger.warn('Tried to assert ' + Object.keys(C)[status] + ' but is currently ' + Object.keys(C)[this.status]);
        return false;
      }
    }
  }},

  /**
  * Transitions the status. Checks for legal transition via assertion beforehand
  * @private
  * @param {Number} status
  * @param {Boolean} [force]
  * @returns {Boolean}
  */
  statusTransition: {writable: true, value: function statusTransition (status, force) {
    this.logger.log('Attempting to transition status from ' + Object.keys(C)[this.status] + ' to ' + Object.keys(C)[status]);
    if ((status === C.STATUS_OPEN && this.statusAssert(C.STATUS_CONNECTING, force)) ||
        (status === C.STATUS_CLOSING && this.statusAssert(C.STATUS_OPEN, force))    ||
        (status === C.STATUS_CLOSED && this.statusAssert(C.STATUS_CLOSING, force)))
    {
      this.status = status;
      return true;
    } else {
      this.logger.warn('Status transition failed - result: no-op - reason: either gave an nonexistent status or attempted illegal transition');
      return false;
    }
  }},

  //==============================
  // Configuration Handling
  //==============================

  /**
   * Configuration load.
   * @private
   * returns {Boolean}
   */
  loadConfig: {writable: true, value: function loadConfig (configuration) {
    var parameter, value, checked_value,
      settings = {
        wsServers: [{
          scheme: 'WSS',
          sip_uri: '<sip:edge.sip.onsip.com;transport=ws;lr>',
          weight: 0,
          ws_uri: 'wss://edge.sip.onsip.com',
          isError: false
        }],

        connectionTimeout: 5,

        maxReconnectionAttempts: 3,
        reconnectionTimeout: 4,

        keepAliveInterval: 0,
        keepAliveDebounce: 10,

        // Logging
        traceSip: false,
      };

    // Pre-Configuration
    function aliasUnderscored (parameter, logger) {
      var underscored = parameter.replace(/([a-z][A-Z])/g, function (m) {
        return m[0] + '_' + m[1].toLowerCase();
      });

      if (parameter === underscored) {
        return;
      }

      var hasParameter = configuration.hasOwnProperty(parameter);
      if (configuration.hasOwnProperty(underscored)) {
        logger.warn(underscored + ' is deprecated, please use ' + parameter);
        if (hasParameter) {
          logger.warn(parameter + ' overriding ' + underscored);
        }
      }

      configuration[parameter] = hasParameter ? configuration[parameter] : configuration[underscored];
    }

    var configCheck = this.getConfigurationCheck();

    // Check Mandatory parameters
    for(parameter in configCheck.mandatory) {
      aliasUnderscored(parameter, this.logger);
      if(!configuration.hasOwnProperty(parameter)) {
        throw new SIP.Exceptions.ConfigurationError(parameter);
      } else {
        value = configuration[parameter];
        checked_value = configCheck.mandatory[parameter](value);
        if (checked_value !== undefined) {
          settings[parameter] = checked_value;
        } else {
          throw new SIP.Exceptions.ConfigurationError(parameter, value);
        }
      }
    }

    // Check Optional parameters
    for(parameter in configCheck.optional) {
      aliasUnderscored(parameter, this.logger);
      if(configuration.hasOwnProperty(parameter)) {
        value = configuration[parameter];

        // If the parameter value is an empty array, but shouldn't be, apply its default value.
        if (value instanceof Array && value.length === 0) { continue; }

        // If the parameter value is null, empty string, or undefined then apply its default value.
        if(value === null || value === '' || value === undefined) { continue; }
        // If it's a number with NaN value then also apply its default value.
        // NOTE: JS does not allow "value === NaN", the following does the work:
        else if(typeof(value) === 'number' && isNaN(value)) { continue; }

        checked_value = configCheck.optional[parameter](value);
        if (checked_value !== undefined) {
          settings[parameter] = checked_value;
        } else {
          throw new SIP.Exceptions.ConfigurationError(parameter, value);
        }
      }
    }

    var skeleton = {};
    // Fill the value of the configuration_skeleton
    for(parameter in settings) {
      skeleton[parameter] = {
        value: settings[parameter],
      };
    }

    Object.defineProperties(this.configuration, skeleton);

    this.logger.log('configuration parameters after validation:');
    for(parameter in settings) {
      this.logger.log('· ' + parameter + ': ' + JSON.stringify(settings[parameter]));
    }

    return;
  }},


  /**
   * Configuration checker.
   * @private
   * @return {Boolean}
   */
  getConfigurationCheck: {writable: true, value: function getConfigurationCheck () {
    return {
      mandatory: {
      },

      optional: {

        //Note: this function used to call 'this.logger.error' but calling 'this' with anything here is invalid
        wsServers: function(wsServers) {
          var idx, length, url;

          /* Allow defining wsServers parameter as:
           *  String: "host"
           *  Array of Strings: ["host1", "host2"]
           *  Array of Objects: [{ws_uri:"host1", weight:1}, {ws_uri:"host2", weight:0}]
           *  Array of Objects and Strings: [{ws_uri:"host1"}, "host2"]
           */
          if (typeof wsServers === 'string') {
            wsServers = [{ws_uri: wsServers}];
          } else if (wsServers instanceof Array) {
            length = wsServers.length;
            for (idx = 0; idx < length; idx++) {
              if (typeof wsServers[idx] === 'string'){
                wsServers[idx] = {ws_uri: wsServers[idx]};
              }
            }
          } else {
            return;
          }

          if (wsServers.length === 0) {
            return false;
          }

          length = wsServers.length;
          for (idx = 0; idx < length; idx++) {
            if (!wsServers[idx].ws_uri) {
              return;
            }
            if (wsServers[idx].weight && !Number(wsServers[idx].weight)) {
              return;
            }

            url = SIP.Grammar.parse(wsServers[idx].ws_uri, 'absoluteURI');

            if(url === -1) {
              return;
            } else if(['wss', 'ws', 'udp'].indexOf(url.scheme) < 0) {
              return;
            } else {
              wsServers[idx].sip_uri = '<sip:' + url.host + (url.port ? ':' + url.port : '') + ';transport=' + url.scheme.replace(/^wss$/i, 'ws') + ';lr>';

              if (!wsServers[idx].weight) {
                wsServers[idx].weight = 0;
              }

              wsServers[idx].isError = false;
              wsServers[idx].scheme = url.scheme.toUpperCase();
            }
          }
          return wsServers;
        },

        keepAliveInterval: function(keepAliveInterval) {
          var value;
          if (SIP.Utils.isDecimal(keepAliveInterval)) {
            value = Number(keepAliveInterval);
            if (value > 0) {
              return value;
            }
          }
        },

        keepAliveDebounce: function(keepAliveDebounce) {
          var value;
          if (SIP.Utils.isDecimal(keepAliveDebounce)) {
            value = Number(keepAliveDebounce);
            if (value > 0) {
              return value;
            }
          }
        },

        traceSip: function(traceSip) {
          if (typeof traceSip === 'boolean') {
            return traceSip;
          }
        },

        connectionTimeout: function(connectionTimeout) {
          var value;
          if (SIP.Utils.isDecimal(connectionTimeout)) {
            value = Number(connectionTimeout);
            if (value > 0) {
              return value;
            }
          }
        },

        maxReconnectionAttempts: function(maxReconnectionAttempts) {
          var value;
          if (SIP.Utils.isDecimal(maxReconnectionAttempts)) {
            value = Number(maxReconnectionAttempts);
            if (value >= 0) {
              return value;
            }
          }
        },

        reconnectionTimeout: function(reconnectionTimeout) {
          var value;
          if (SIP.Utils.isDecimal(reconnectionTimeout)) {
            value = Number(reconnectionTimeout);
            if (value > 0) {
              return value;
            }
          }
        }

      }
    };
  }}
});

Transport.C = C;
SIP.Web.Transport = Transport;
return Transport;
};
