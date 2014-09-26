/**
 * @augments SIP
 * @class Class creating a SIP User Agent.
 * @param {function returning SIP.MediaHandler} [configuration.mediaHandlerFactory]
 *        A function will be invoked by each of the UA's Sessions to build the MediaHandler for that Session.
 *        If no (or a falsy) value is provided, each Session will use a default (WebRTC) MediaHandler.
 *
 * @param {Object} [configuration.media] gets passed to SIP.MediaHandler.getDescription as mediaHint
 */
module.exports = function (SIP) {
var UA,
  C = {
    // UA status codes
    STATUS_INIT :                0,
    STATUS_READY:                1,
    STATUS_USER_CLOSED:          2,
    STATUS_NOT_READY:            3,

    // UA error codes
    CONFIGURATION_ERROR:  1,
    NETWORK_ERROR:        2,

    /* UA events and corresponding SIP Methods.
     * Dynamically added to 'Allow' header field if the
     * corresponding event handler is set.
     */
    EVENT_METHODS: {
      'invite': 'INVITE',
      'message': 'MESSAGE'
    },

    ALLOWED_METHODS: [
      'ACK',
      'CANCEL',
      'BYE',
      'OPTIONS',
      'INFO',
      'NOTIFY'
    ],

    ACCEPTED_BODY_TYPES: [
      'application/sdp',
      'application/dtmf-relay'
    ],

    MAX_FORWARDS: 70,
    TAG_LENGTH: 10
  };

UA = function(configuration) {
  var self = this,
  events = [
    'connecting',
    'connected',
    'disconnected',
    'newTransaction',
    'transactionDestroyed',
    'registered',
    'unregistered',
    'registrationFailed',
    'invite',
    'newSession',
    'message'
  ], i, len;

  // Helper function for forwarding events
  function selfEmit(type) {
    //registrationFailed handler is invoked with two arguments. Allow event handlers to be invoked with a variable no. of arguments
    return self.emit.bind(self, type);
  }

  for (i = 0, len = C.ALLOWED_METHODS.length; i < len; i++) {
    events.push(C.ALLOWED_METHODS[i].toLowerCase());
  }

  // Set Accepted Body Types
  C.ACCEPTED_BODY_TYPES = C.ACCEPTED_BODY_TYPES.toString();

  this.log = new SIP.LoggerFactory();
  this.logger = this.getLogger('sip.ua');

  this.cache = {
    credentials: {}
  };

  this.configuration = {};
  this.dialogs = {};

  //User actions outside any session/dialog (MESSAGE)
  this.applicants = {};

  this.data = {};
  this.sessions = {};
  this.subscriptions = {};
  this.transport = null;
  this.contact = null;
  this.status = C.STATUS_INIT;
  this.error = null;
  this.transactions = {
    nist: {},
    nict: {},
    ist: {},
    ict: {}
  };

  this.transportRecoverAttempts = 0;
  this.transportRecoveryTimer = null;

  Object.defineProperties(this, {
    transactionsCount: {
      get: function() {
        var type,
          transactions = ['nist','nict','ist','ict'],
          count = 0;

        for (type in transactions) {
          count += Object.keys(this.transactions[transactions[type]]).length;
        }

        return count;
      }
    },

    nictTransactionsCount: {
      get: function() {
        return Object.keys(this.transactions['nict']).length;
      }
    },

    nistTransactionsCount: {
      get: function() {
        return Object.keys(this.transactions['nist']).length;
      }
    },

    ictTransactionsCount: {
      get: function() {
        return Object.keys(this.transactions['ict']).length;
      }
    },

    istTransactionsCount: {
      get: function() {
        return Object.keys(this.transactions['ist']).length;
      }
    }
  });

  /**
   * Load configuration
   *
   * @throws {SIP.Exceptions.ConfigurationError}
   * @throws {TypeError}
   */

  if(configuration === undefined) {
    configuration = {};
  } else if (typeof configuration === 'string' || configuration instanceof String) {
    configuration = {
      uri: configuration
    };
  }

  // Apply log configuration if present
  if (configuration.log) {
    if (configuration.log.hasOwnProperty('builtinEnabled')) {
      this.log.builtinEnabled = configuration.log.builtinEnabled;
    }

    if (configuration.log.hasOwnProperty('level')) {
      this.log.level = configuration.log.level;
    }

    if (configuration.log.hasOwnProperty('connector')) {
      this.log.connector = configuration.log.connector;
    }
  }

  try {
    this.loadConfig(configuration);
    this.initEvents(events);
  } catch(e) {
    this.status = C.STATUS_NOT_READY;
    this.error = C.CONFIGURATION_ERROR;
    throw e;
  }

  // Initialize registerContext
  this.registerContext = new SIP.RegisterContext(this);
  this.registerContext.on('failed', selfEmit('registrationFailed'));
  this.registerContext.on('registered', selfEmit('registered'));
  this.registerContext.on('unregistered', selfEmit('unregistered'));

  if(this.configuration.autostart) {
    this.start();
  }
};
UA.prototype = Object.create(SIP.EventEmitter.prototype);

//=================
//  High Level API
//=================

UA.prototype.register = function(options) {
  this.configuration.register = true;
  this.registerContext.register(options);

  return this;
};

/**
 * Unregister.
 *
 * @param {Boolean} [all] unregister all user bindings.
 *
 */
UA.prototype.unregister = function(options) {
  this.configuration.register = false;
  this.registerContext.unregister(options);

  return this;
};

UA.prototype.isRegistered = function() {
  return this.registerContext.registered;
};

/**
 * Connection state.
 * @param {Boolean}
 */
UA.prototype.isConnected = function() {
  return this.transport ? this.transport.connected : false;
};

UA.prototype.afterConnected = function afterConnected (callback) {
  if (this.isConnected()) {
    callback();
  } else {
    this.once('connected', callback);
  }
};

/**
 * Make an outgoing call.
 *
 * @param {String} target
 * @param {Object} views
 * @param {Object} [options.media] gets passed to SIP.MediaHandler.getDescription as mediaHint
 *
 * @throws {TypeError}
 *
 */
UA.prototype.invite = function(target, options) {
  options = options || {};
  SIP.Utils.optionsOverride(options, 'media', 'mediaConstraints', true, this.logger);

  var context = new SIP.InviteClientContext(this, target, options);

  this.afterConnected(context.invite.bind(context, {media: options.media}));
  return context;
};

UA.prototype.subscribe = function(target, event, options) {
  var sub = new SIP.Subscription(this, target, event, options);

  this.afterConnected(sub.subscribe.bind(sub));
  return sub;
};

/**
 * Send a message.
 *
 * @param {String} target
 * @param {String} body
 * @param {Object} [options]
 *
 * @throws {TypeError}
 *
 */
UA.prototype.message = function(target, body, options) {
  if (body === undefined) {
    throw new TypeError('Not enough arguments');
  }

  options = options || {};
  options.contentType = options.contentType || 'text/plain';
  options.body = body;

  return this.request(SIP.C.MESSAGE, target, options);
};

UA.prototype.request = function (method, target, options) {
  var req = new SIP.ClientContext(this, method, target, options);

  this.afterConnected(req.send.bind(req));
  return req;
};

/**
 * Gracefully close.
 *
 */
UA.prototype.stop = function() {
  var session, subscription, applicant,
    ua = this;

  function transactionsListener() {
    if (ua.nistTransactionsCount === 0 && ua.nictTransactionsCount === 0) {
        ua.removeListener('transactionDestroyed', transactionsListener);
        ua.transport.disconnect();
    }
  }

  this.logger.log('user requested closure...');

  if(this.status === C.STATUS_USER_CLOSED) {
    this.logger.warn('UA already closed');
    return this;
  }

  // Clear transportRecoveryTimer
  SIP.Timers.clearTimeout(this.transportRecoveryTimer);

  // Close registerContext
  this.logger.log('closing registerContext');
  this.registerContext.close();

  // Run  _terminate_ on every Session
  for(session in this.sessions) {
    this.logger.log('closing session ' + session);
    this.sessions[session].terminate();
  }

  //Run _close_ on every Subscription
  for(subscription in this.subscriptions) {
    this.logger.log('unsubscribing from subscription ' + subscription);
    this.subscriptions[subscription].close();
  }

  // Run  _close_ on every applicant
  for(applicant in this.applicants) {
    this.applicants[applicant].close();
  }

  this.status = C.STATUS_USER_CLOSED;

  /*
   * If the remaining transactions are all INVITE transactions, there is no need to
   * wait anymore because every session has already been closed by this method.
   * - locally originated sessions where terminated (CANCEL or BYE)
   * - remotely originated sessions where rejected (4XX) or terminated (BYE)
   * Remaining INVITE transactions belong tho sessions that where answered. This are in
   * 'accepted' state due to timers 'L' and 'M' defined in [RFC 6026]
   */
  if (this.nistTransactionsCount === 0 && this.nictTransactionsCount === 0) {
    this.transport.disconnect();
  } else {
    this.on('transactionDestroyed', transactionsListener);
  }

  return this;
};

/**
 * Connect to the WS server if status = STATUS_INIT.
 * Resume UA after being closed.
 *
 */
UA.prototype.start = function() {
  var server;

  this.logger.log('user requested startup...');
  if (this.status === C.STATUS_INIT) {
    server = this.getNextWsServer();
    new SIP.Transport(this, server);
  } else if(this.status === C.STATUS_USER_CLOSED) {
    this.logger.log('resuming');
    this.status = C.STATUS_READY;
    this.transport.connect();
  } else if (this.status === C.STATUS_READY) {
    this.logger.log('UA is in READY status, not resuming');
  } else {
    this.logger.error('Connection is down. Auto-Recovery system is trying to connect');
  }

  return this;
};

/**
 * Normalize a string into a valid SIP request URI
 *
 * @param {String} target
 *
 * @returns {SIP.URI|undefined}
 */
UA.prototype.normalizeTarget = function(target) {
  return SIP.Utils.normalizeTarget(target, this.configuration.hostportParams);
};


//===============================
//  Private (For internal use)
//===============================

UA.prototype.saveCredentials = function(credentials) {
  this.cache.credentials[credentials.realm] = this.cache.credentials[credentials.realm] || {};
  this.cache.credentials[credentials.realm][credentials.uri] = credentials;

  return this;
};

UA.prototype.getCredentials = function(request) {
  var realm, credentials;

  realm = request.ruri.host;

  if (this.cache.credentials[realm] && this.cache.credentials[realm][request.ruri]) {
    credentials = this.cache.credentials[realm][request.ruri];
    credentials.method = request.method;
  }

  return credentials;
};

UA.prototype.getLogger = function(category, label) {
  return this.log.getLogger(category, label);
};


//==============================
// Event Handlers
//==============================

/**
 * Transport Close event
 * @private
 * @event
 * @param {SIP.Transport} transport.
 */
UA.prototype.onTransportClosed = function(transport) {
  // Run _onTransportError_ callback on every client transaction using _transport_
  var type, idx, length,
    client_transactions = ['nict', 'ict', 'nist', 'ist'];

  transport.server.status = SIP.Transport.C.STATUS_DISCONNECTED;
  this.logger.log('connection state set to '+ SIP.Transport.C.STATUS_DISCONNECTED);

  length = client_transactions.length;
  for (type = 0; type < length; type++) {
    for(idx in this.transactions[client_transactions[type]]) {
      this.transactions[client_transactions[type]][idx].onTransportError();
    }
  }

  // Close sessions if GRUU is not being used
  if (!this.contact.pub_gruu) {
    this.closeSessionsOnTransportError();
  }

};

/**
 * Unrecoverable transport event.
 * Connection reattempt logic has been done and didn't success.
 * @private
 * @event
 * @param {SIP.Transport} transport.
 */
UA.prototype.onTransportError = function(transport) {
  var server;

  this.logger.log('transport ' + transport.server.ws_uri + ' failed | connection state set to '+ SIP.Transport.C.STATUS_ERROR);

  // Close sessions.
  //Mark this transport as 'down' and try the next one
  transport.server.status = SIP.Transport.C.STATUS_ERROR;

  this.emit('disconnected', {
    transport: transport
  });

  server = this.getNextWsServer();

  if(server) {
    new SIP.Transport(this, server);
  }else {
    this.closeSessionsOnTransportError();
    if (!this.error || this.error !== C.NETWORK_ERROR) {
      this.status = C.STATUS_NOT_READY;
      this.error = C.NETWORK_ERROR;
    }
    // Transport Recovery process
    this.recoverTransport();
  }
};

/**
 * Transport connection event.
 * @private
 * @event
 * @param {SIP.Transport} transport.
 */
UA.prototype.onTransportConnected = function(transport) {
  this.transport = transport;

  // Reset transport recovery counter
  this.transportRecoverAttempts = 0;

  transport.server.status = SIP.Transport.C.STATUS_READY;
  this.logger.log('connection state set to '+ SIP.Transport.C.STATUS_READY);

  if(this.status === C.STATUS_USER_CLOSED) {
    return;
  }

  this.status = C.STATUS_READY;
  this.error = null;

  if(this.configuration.register) {
    this.registerContext.onTransportConnected();
  }

  this.emit('connected', {
    transport: transport
  });
};


/**
 * Transport connecting event
 * @private
 * @param {SIP.Transport} transport.
 * #param {Integer} attempts.
 */
  UA.prototype.onTransportConnecting = function(transport, attempts) {
    this.emit('connecting', {
      transport: transport,
      attempts: attempts
    });
  };


/**
 * new Transaction
 * @private
 * @param {SIP.Transaction} transaction.
 */
UA.prototype.newTransaction = function(transaction) {
  this.transactions[transaction.type][transaction.id] = transaction;
  this.emit('newTransaction', {transaction: transaction});
};


/**
 * destroy Transaction
 * @private
 * @param {SIP.Transaction} transaction.
 */
UA.prototype.destroyTransaction = function(transaction) {
  delete this.transactions[transaction.type][transaction.id];
  this.emit('transactionDestroyed', {
    transaction: transaction
  });
};


//=========================
// receiveRequest
//=========================

/**
 * Request reception
 * @private
 * @param {SIP.IncomingRequest} request.
 */
UA.prototype.receiveRequest = function(request) {
  var dialog, session, message,
    method = request.method,
    transaction,
    methodLower = request.method.toLowerCase(),
    self = this;

  function ruriMatches (uri) {
    return uri && uri.user === request.ruri.user;
  }

  // Check that request URI points to us
  if(!(ruriMatches(this.configuration.uri) ||
       ruriMatches(this.contact.uri) ||
       ruriMatches(this.contact.pub_gruu) ||
       ruriMatches(this.contact.temp_gruu))) {
    this.logger.warn('Request-URI does not point to us');
    if (request.method !== SIP.C.ACK) {
      request.reply_sl(404);
    }
    return;
  }

  // Check request URI scheme
  if(request.ruri.scheme === SIP.C.SIPS) {
    request.reply_sl(416);
    return;
  }

  // Check transaction
  if(SIP.Transactions.checkTransaction(this, request)) {
    return;
  }

  /* RFC3261 12.2.2
   * Requests that do not change in any way the state of a dialog may be
   * received within a dialog (for example, an OPTIONS request).
   * They are processed as if they had been received outside the dialog.
   */
  if(method === SIP.C.OPTIONS) {
    new SIP.Transactions.NonInviteServerTransaction(request, this);
    request.reply(200, null, [
      'Allow: '+ SIP.Utils.getAllowedMethods(this),
      'Accept: '+ C.ACCEPTED_BODY_TYPES
    ]);
  } else if (method === SIP.C.MESSAGE) {
    if (SIP.EventEmitter.listenerCount(this, methodLower) <= 1) {
      // UA is not listening for this.  Reject immediately.
      new SIP.Transactions.NonInviteServerTransaction(request, this);
      request.reply(405, null, ['Allow: '+ SIP.Utils.getAllowedMethods(this)]);
      return;
    }
    message = new SIP.ServerContext(this, request);
    message.body = request.body;
    message.content_type = request.getHeader('Content-Type') || 'text/plain';

    request.reply(200, null);
    this.emit('message', message);
  } else if (method !== SIP.C.INVITE &&
             method !== SIP.C.ACK) {
    // Let those methods pass through to normal processing for now.
    transaction = new SIP.ServerContext(this, request);
  }

  // Initial Request
  if(!request.to_tag) {
    switch(method) {
      case SIP.C.INVITE:
        var isMediaSupported = this.configuration.mediaHandlerFactory.isSupported;
        if(!isMediaSupported || isMediaSupported()) {
          session = new SIP.InviteServerContext(this, request)
            .on('invite', function() {
              self.emit('invite', this);
            });
        } else {
          this.logger.warn('INVITE received but WebRTC is not supported');
          request.reply(488);
        }
        break;
      case SIP.C.BYE:
        // Out of dialog BYE received
        request.reply(481);
        break;
      case SIP.C.CANCEL:
        session = this.findSession(request);
        if(session) {
          session.receiveRequest(request);
        } else {
          this.logger.warn('received CANCEL request for a non existent session');
        }
        break;
      case SIP.C.ACK:
        /* Absorb it.
         * ACK request without a corresponding Invite Transaction
         * and without To tag.
         */
        break;
      default:
        request.reply(405);
        break;
    }
  }
  // In-dialog request
  else {
    dialog = this.findDialog(request);

    if(dialog) {
      if (method === SIP.C.INVITE) {
        new SIP.Transactions.InviteServerTransaction(request, this);
      }
      dialog.receiveRequest(request);
    } else if (method === SIP.C.NOTIFY) {
      session = this.findSession(request);
      if(session) {
        session.receiveRequest(request);
      } else {
        this.logger.warn('received NOTIFY request for a non existent session');
        request.reply(481, 'Subscription does not exist');
      }
    }
    /* RFC3261 12.2.2
     * Request with to tag, but no matching dialog found.
     * Exception: ACK for an Invite request for which a dialog has not
     * been created.
     */
    else {
      if(method !== SIP.C.ACK) {
        request.reply(481);
      }
    }
  }
};

//=================
// Utils
//=================

/**
 * Get the session to which the request belongs to, if any.
 * @private
 * @param {SIP.IncomingRequest} request.
 * @returns {SIP.OutgoingSession|SIP.IncomingSession|null}
 */
UA.prototype.findSession = function(request) {
  return this.sessions[request.call_id + request.from_tag] ||
          this.sessions[request.call_id + request.to_tag] ||
          null;
};

/**
 * Get the dialog to which the request belongs to, if any.
 * @private
 * @param {SIP.IncomingRequest}
 * @returns {SIP.Dialog|null}
 */
UA.prototype.findDialog = function(request) {
  return this.dialogs[request.call_id + request.from_tag + request.to_tag] ||
          this.dialogs[request.call_id + request.to_tag + request.from_tag] ||
          null;
};

/**
 * Retrieve the next server to which connect.
 * @private
 * @returns {Object} ws_server
 */
UA.prototype.getNextWsServer = function() {
  // Order servers by weight
  var idx, length, ws_server,
    candidates = [];

  length = this.configuration.wsServers.length;
  for (idx = 0; idx < length; idx++) {
    ws_server = this.configuration.wsServers[idx];

    if (ws_server.status === SIP.Transport.C.STATUS_ERROR) {
      continue;
    } else if (candidates.length === 0) {
      candidates.push(ws_server);
    } else if (ws_server.weight > candidates[0].weight) {
      candidates = [ws_server];
    } else if (ws_server.weight === candidates[0].weight) {
      candidates.push(ws_server);
    }
  }

  idx = Math.floor(Math.random() * candidates.length);

  return candidates[idx];
};

/**
 * Close all sessions on transport error.
 * @private
 */
UA.prototype.closeSessionsOnTransportError = function() {
  var idx;

  // Run _transportError_ for every Session
  for(idx in this.sessions) {
    this.sessions[idx].onTransportError();
  }
  // Call registerContext _onTransportClosed_
  this.registerContext.onTransportClosed();
};

UA.prototype.recoverTransport = function(ua) {
  var idx, length, k, nextRetry, count, server;

  ua = ua || this;
  count = ua.transportRecoverAttempts;

  length = ua.configuration.wsServers.length;
  for (idx = 0; idx < length; idx++) {
    ua.configuration.wsServers[idx].status = 0;
  }

  server = ua.getNextWsServer();

  k = Math.floor((Math.random() * Math.pow(2,count)) +1);
  nextRetry = k * ua.configuration.connectionRecoveryMinInterval;

  if (nextRetry > ua.configuration.connectionRecoveryMaxInterval) {
    this.logger.log('time for next connection attempt exceeds connectionRecoveryMaxInterval, resetting counter');
    nextRetry = ua.configuration.connectionRecoveryMinInterval;
    count = 0;
  }

  this.logger.log('next connection attempt in '+ nextRetry +' seconds');

  this.transportRecoveryTimer = SIP.Timers.setTimeout(
    function(){
      ua.transportRecoverAttempts = count + 1;
      new SIP.Transport(ua, server);
    }, nextRetry * 1000);
};

/**
 * Configuration load.
 * @private
 * returns {Boolean}
 */
UA.prototype.loadConfig = function(configuration) {
  // Settings and default values
  var parameter, value, checked_value, hostportParams, registrarServer,
    settings = {
      /* Host address
      * Value to be set in Via sent_by and host part of Contact FQDN
      */
      viaHost: SIP.Utils.createRandomToken(12) + '.invalid',

      uri: new SIP.URI('sip', 'anonymous.' + SIP.Utils.createRandomToken(6), 'anonymous.invalid', null, null),
      wsServers: [{
        scheme: 'WSS',
        sip_uri: '<sip:edge.sip.onsip.com;transport=ws;lr>',
        status: 0,
        weight: 0,
        ws_uri: 'wss://edge.sip.onsip.com'
      }],

      // Password
      password: null,

      // Registration parameters
      registerExpires: 600,
      register: true,
      registrarServer: null,

      // Transport related parameters
      wsServerMaxReconnection: 3,
      wsServerReconnectionTimeout: 4,

      connectionRecoveryMinInterval: 2,
      connectionRecoveryMaxInterval: 30,

      usePreloadedRoute: false,

      //string to be inserted into User-Agent request header
      userAgentString: SIP.C.USER_AGENT,

      // Session parameters
      noAnswerTimeout: 60,
      stunServers: ['stun:stun.l.google.com:19302'],
      turnServers: [],

      // Logging parameters
      traceSip: false,

      // Hacks
      hackViaTcp: false,
      hackIpInContact: false,

      //autostarting
      autostart: true,

      //Reliable Provisional Responses
      rel100: SIP.C.supported.UNSUPPORTED,

      mediaHandlerFactory: SIP.WebRTC.MediaHandler.defaultFactory,

      authenticationFactory: function (ua) {
        return new SIP.DigestAuthentication(ua);
      }
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

  // Check Mandatory parameters
  for(parameter in UA.configuration_check.mandatory) {
    aliasUnderscored(parameter, this.logger);
    if(!configuration.hasOwnProperty(parameter)) {
      throw new SIP.Exceptions.ConfigurationError(parameter);
    } else {
      value = configuration[parameter];
      checked_value = UA.configuration_check.mandatory[parameter](value);
      if (checked_value !== undefined) {
        settings[parameter] = checked_value;
      } else {
        throw new SIP.Exceptions.ConfigurationError(parameter, value);
      }
    }
  }

  SIP.Utils.optionsOverride(configuration, 'rel100', 'reliable', true, this.logger, SIP.C.supported.UNSUPPORTED);

  // Check Optional parameters
  for(parameter in UA.configuration_check.optional) {
    aliasUnderscored(parameter, this.logger);
    if(configuration.hasOwnProperty(parameter)) {
      value = configuration[parameter];

      // If the parameter value is null, empty string,undefined, or empty array then apply its default value.
      if(value === null || value === "" || value === undefined || (value instanceof Array && value.length === 0)) { continue; }
      // If it's a number with NaN value then also apply its default value.
      // NOTE: JS does not allow "value === NaN", the following does the work:
      else if(typeof(value) === 'number' && isNaN(value)) { continue; }

      checked_value = UA.configuration_check.optional[parameter](value);
      if (checked_value !== undefined) {
        settings[parameter] = checked_value;
      } else {
        throw new SIP.Exceptions.ConfigurationError(parameter, value);
      }
    }
  }

  // Sanity Checks

  // Connection recovery intervals
  if(settings.connectionRecoveryMaxInterval < settings.connectionRecoveryMinInterval) {
    throw new SIP.Exceptions.ConfigurationError('connectionRecoveryMaxInterval', settings.connectionRecoveryMaxInterval);
  }

  // Post Configuration Process

  // Allow passing 0 number as displayName.
  if (settings.displayName === 0) {
    settings.displayName = '0';
  }

  // Instance-id for GRUU
  if (!settings.instanceId) {
    settings.instanceId = SIP.Utils.newUUID();
  }

  // sipjsId instance parameter. Static random tag of length 5
  settings.sipjsId = SIP.Utils.createRandomToken(5);

  // String containing settings.uri without scheme and user.
  hostportParams = settings.uri.clone();
  hostportParams.user = null;
  settings.hostportParams = hostportParams.toString().replace(/^sip:/i, '');

  /* Check whether authorizationUser is explicitly defined.
   * Take 'settings.uri.user' value if not.
   */
  if (!settings.authorizationUser) {
    settings.authorizationUser = settings.uri.user;
  }

  /* If no 'registrarServer' is set use the 'uri' value without user portion. */
  if (!settings.registrarServer) {
    registrarServer = settings.uri.clone();
    registrarServer.user = null;
    settings.registrarServer = registrarServer;
  }

  // User noAnswerTimeout
  settings.noAnswerTimeout = settings.noAnswerTimeout * 1000;

  // Via Host
  if (settings.hackIpInContact) {
    settings.viaHost = SIP.Utils.getRandomTestNetIP();
  }

  this.contact = {
    pub_gruu: null,
    temp_gruu: null,
    uri: new SIP.URI('sip', SIP.Utils.createRandomToken(8), settings.viaHost, null, {transport: 'ws'}),
    toString: function(options){
      options = options || {};

      var
        anonymous = options.anonymous || null,
        outbound = options.outbound || null,
        contact = '<';

      if (anonymous) {
        contact += (this.temp_gruu || 'sip:anonymous@anonymous.invalid;transport=ws').toString();
      } else {
        contact += (this.pub_gruu || this.uri).toString();
      }

      if (outbound) {
        contact += ';ob';
      }

      contact += '>';

      return contact;
    }
  };

  // media overrides mediaConstraints
  SIP.Utils.optionsOverride(settings, 'media', 'mediaConstraints', true, this.logger);

  // Fill the value of the configuration_skeleton
  for(parameter in settings) {
    UA.configuration_skeleton[parameter].value = settings[parameter];
  }

  Object.defineProperties(this.configuration, UA.configuration_skeleton);

  // Clean UA.configuration_skeleton
  for(parameter in settings) {
    UA.configuration_skeleton[parameter].value = '';
  }

  this.logger.log('configuration parameters after validation:');
  for(parameter in settings) {
    switch(parameter) {
      case 'uri':
      case 'registrarServer':
      case 'mediaHandlerFactory':
        this.logger.log('· ' + parameter + ': ' + settings[parameter]);
        break;
      case 'password':
        this.logger.log('· ' + parameter + ': ' + 'NOT SHOWN');
        break;
      default:
        this.logger.log('· ' + parameter + ': ' + JSON.stringify(settings[parameter]));
    }
  }

  return;
};

/**
 * Configuration Object skeleton.
 * @private
 */
UA.configuration_skeleton = (function() {
  var idx,  parameter,
    skeleton = {},
    parameters = [
      // Internal parameters
      "sipjsId",
      "hostportParams",

      // Optional user configurable parameters
      "uri",
      "wsServers",
      "authorizationUser",
      "connectionRecoveryMaxInterval",
      "connectionRecoveryMinInterval",
      "displayName",
      "hackViaTcp", // false.
      "hackIpInContact", //false
      "instanceId",
      "noAnswerTimeout", // 30 seconds.
      "password",
      "registerExpires", // 600 seconds.
      "registrarServer",
      "reliable",
      "rel100",
      "userAgentString", //SIP.C.USER_AGENT
      "autostart",
      "stunServers",
      "traceSip",
      "turnServers",
      "usePreloadedRoute",
      "wsServerMaxReconnection",
      "wsServerReconnectionTimeout",
      "mediaHandlerFactory",
      "media",
      "mediaConstraints",
      "authenticationFactory",

      // Post-configuration generated parameters
      "via_core_value",
      "viaHost"
    ];

  for(idx in parameters) {
    parameter = parameters[idx];
    skeleton[parameter] = {
      value: '',
      writable: false,
      configurable: false
    };
  }

  skeleton['register'] = {
    value: '',
    writable: true,
    configurable: false
  };

  return skeleton;
}());

/**
 * Configuration checker.
 * @private
 * @return {Boolean}
 */
UA.configuration_check = {
  mandatory: {
  },

  optional: {

    uri: function(uri) {
      var parsed;

      if (!(/^sip:/i).test(uri)) {
        uri = SIP.C.SIP + ':' + uri;
      }
      parsed = SIP.URI.parse(uri);

      if(!parsed) {
        return;
      } else if(!parsed.user) {
        return;
      } else {
        return parsed;
      }
    },

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
        } else if(url.scheme !== 'wss' && url.scheme !== 'ws') {
          return;
        } else {
          wsServers[idx].sip_uri = '<sip:' + url.host + (url.port ? ':' + url.port : '') + ';transport=ws;lr>';

          if (!wsServers[idx].weight) {
            wsServers[idx].weight = 0;
          }

          wsServers[idx].status = 0;
          wsServers[idx].scheme = url.scheme.toUpperCase();
        }
      }
      return wsServers;
    },

    authorizationUser: function(authorizationUser) {
      if(SIP.Grammar.parse('"'+ authorizationUser +'"', 'quoted_string') === -1) {
        return;
      } else {
        return authorizationUser;
      }
    },

    connectionRecoveryMaxInterval: function(connectionRecoveryMaxInterval) {
      var value;
      if(SIP.Utils.isDecimal(connectionRecoveryMaxInterval)) {
        value = Number(connectionRecoveryMaxInterval);
        if(value > 0) {
          return value;
        }
      }
    },

    connectionRecoveryMinInterval: function(connectionRecoveryMinInterval) {
      var value;
      if(SIP.Utils.isDecimal(connectionRecoveryMinInterval)) {
        value = Number(connectionRecoveryMinInterval);
        if(value > 0) {
          return value;
        }
      }
    },

    displayName: function(displayName) {
      if(SIP.Grammar.parse('"' + displayName + '"', 'displayName') === -1) {
        return;
      } else {
        return displayName;
      }
    },

    hackViaTcp: function(hackViaTcp) {
      if (typeof hackViaTcp === 'boolean') {
        return hackViaTcp;
      }
    },

    hackIpInContact: function(hackIpInContact) {
      if (typeof hackIpInContact === 'boolean') {
        return hackIpInContact;
      }
    },

    instanceId: function(instanceId) {
      if(typeof instanceId !== 'string') {
        return;
      }

      if ((/^uuid:/i.test(instanceId))) {
        instanceId = instanceId.substr(5);
      }

      if(SIP.Grammar.parse(instanceId, 'uuid') === -1) {
        return;
      } else {
        return instanceId;
      }
    },

    noAnswerTimeout: function(noAnswerTimeout) {
      var value;
      if (SIP.Utils.isDecimal(noAnswerTimeout)) {
        value = Number(noAnswerTimeout);
        if (value > 0) {
          return value;
        }
      }
    },

    password: function(password) {
      return String(password);
    },

    rel100: function(rel100) {
      if(rel100 === SIP.C.supported.REQUIRED) {
        return SIP.C.supported.REQUIRED;
      } else if (rel100 === SIP.C.supported.SUPPORTED) {
        return SIP.C.supported.SUPPORTED;
      } else  {
        return SIP.C.supported.UNSUPPORTED;
      }
    },

    register: function(register) {
      if (typeof register === 'boolean') {
        return register;
      }
    },

    registerExpires: function(registerExpires) {
      var value;
      if (SIP.Utils.isDecimal(registerExpires)) {
        value = Number(registerExpires);
        if (value > 0) {
          return value;
        }
      }
    },

    registrarServer: function(registrarServer) {
      var parsed;

      if(typeof registrarServer !== 'string') {
        return;
      }

      if (!/^sip:/i.test(registrarServer)) {
        registrarServer = SIP.C.SIP + ':' + registrarServer;
      }
      parsed = SIP.URI.parse(registrarServer);

      if(!parsed) {
        return;
      } else if(parsed.user) {
        return;
      } else {
        return parsed;
      }
    },

    stunServers: function(stunServers) {
      var idx, length, stun_server;

      if (typeof stunServers === 'string') {
        stunServers = [stunServers];
      } else if (!(stunServers instanceof Array)) {
        return;
      }

      length = stunServers.length;
      for (idx = 0; idx < length; idx++) {
        stun_server = stunServers[idx];
        if (!(/^stuns?:/.test(stun_server))) {
          stun_server = 'stun:' + stun_server;
        }

        if(SIP.Grammar.parse(stun_server, 'stun_URI') === -1) {
          return;
        } else {
          stunServers[idx] = stun_server;
        }
      }
      return stunServers;
    },

    traceSip: function(traceSip) {
      if (typeof traceSip === 'boolean') {
        return traceSip;
      }
    },

    turnServers: function(turnServers) {
      var idx, length, turn_server, url;

      if (turnServers instanceof Array) {
        // Do nothing
      } else {
        turnServers = [turnServers];
      }

      length = turnServers.length;
      for (idx = 0; idx < length; idx++) {
        turn_server = turnServers[idx];
        //Backwards compatibility: Allow defining the turn_server url with the 'server' property.
        if (turn_server.server) {
          turn_server.urls = [turn_server.server];
        }

        if (!turn_server.urls || !turn_server.username || !turn_server.password) {
          return;
        }

        if (!(turn_server.urls instanceof Array)) {
          turn_server.urls = [turn_server.urls];
        }

        length = turn_server.urls.length;
        for (idx = 0; idx < length; idx++) {
          url = turn_server.urls[idx];

          if (!(/^turns?:/.test(url))) {
            url = 'turn:' + url;
          }

          if(SIP.Grammar.parse(url, 'turn_URI') === -1) {
            return;
          }
        }
      }
      return turnServers;
    },

    userAgentString: function(userAgentString) {
      if (typeof userAgentString === 'string') {
        return userAgentString;
      }
    },

    usePreloadedRoute: function(usePreloadedRoute) {
      if (typeof usePreloadedRoute === 'boolean') {
        return usePreloadedRoute;
      }
    },

    wsServerMaxReconnection: function(wsServerMaxReconnection) {
      var value;
      if (SIP.Utils.isDecimal(wsServerMaxReconnection)) {
        value = Number(wsServerMaxReconnection);
        if (value > 0) {
          return value;
        }
      }
    },

    wsServerReconnectionTimeout: function(wsServerReconnectionTimeout) {
      var value;
      if (SIP.Utils.isDecimal(wsServerReconnectionTimeout)) {
        value = Number(wsServerReconnectionTimeout);
        if (value > 0) {
          return value;
        }
      }
    },

    autostart: function(autostart) {
      if (typeof autostart === 'boolean') {
        return autostart;
      }
    },

    mediaHandlerFactory: function(mediaHandlerFactory) {
      if (mediaHandlerFactory instanceof Function) {
        return mediaHandlerFactory;
      }
    },

    authenticationFactory: function(authenticationFactory) {
      if (authenticationFactory instanceof Function) {
        return authenticationFactory;
      }
    }
  }
};

UA.C = C;
SIP.UA = UA;
};
