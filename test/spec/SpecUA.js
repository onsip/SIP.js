describe('UA', function() {
  var UA;
  var uri;
  var connectedRestore;

  beforeEach(function() {
    uri = 'alice@example.com';
    wsServers = 'ws://server.example.com';
    registrarServer = 'registrar.example.com';
    configuration = {uri : uri,
                     wsServers : wsServers };

    spyOn(SIP, 'RegisterContext').and.returnValue({
      on: jasmine.createSpy('on'),
      register: jasmine.createSpy('register'),
      unregister: jasmine.createSpy('unregister'),
      registered: true,
      close: jasmine.createSpy('close'),
      onTransportClosed: jasmine.createSpy('onTransportClosed'),
      onTransportConnected: jasmine.createSpy('onTransportConnected')
    });

    UA = new SIP.UA(configuration);

    UA.logger = jasmine.createSpyObj('logger', ['log', 'error', 'warn']);
  });

  afterEach(function() {
    UA.transport = jasmine.createSpyObj('transport', ['disconnect']);
    UA.stop();
  });

  it('has no mandatory parameters', function () {
    var myUA;
    function noParams() {
      myUA = new SIP.UA();
    }

    expect(noParams).not.toThrow();
    expect(myUA.configuration.uri.toString()).toEqual(jasmine.any(String));
    expect(myUA.configuration.wsServers).toEqual([{
      scheme: 'WSS',
      sip_uri: '<sip:edge.sip.onsip.com;transport=ws;lr>',
      status: 0,
      weight: 0,
      ws_uri: 'wss://edge.sip.onsip.com'
    }]);
  });

  it('can be created with just a string URI', function () {
    var myUA;
    function oneParam() {
      myUA = new SIP.UA('will@example.com');
    }

    expect(oneParam).not.toThrow();
    expect(myUA.configuration.uri.toString()).toEqual('sip:will@example.com');
    expect(myUA.configuration.wsServers).toEqual([{
      scheme: 'WSS',
      sip_uri: '<sip:edge.sip.onsip.com;transport=ws;lr>',
      status: 0,
      weight: 0,
      ws_uri: 'wss://edge.sip.onsip.com'
    }]);
  });

  it('can be created with just a String (object) URI', function () {
    var myUA;
    function oneParam() {
      myUA = new SIP.UA(new String('will@example.com'));
    }

    expect(oneParam).not.toThrow();
    expect(myUA.configuration.uri.toString()).toEqual('sip:will@example.com');
    expect(myUA.configuration.wsServers).toEqual([{
      scheme: 'WSS',
      sip_uri: '<sip:edge.sip.onsip.com;transport=ws;lr>',
      status: 0,
      weight: 0,
      ws_uri: 'wss://edge.sip.onsip.com'
    }]);
  });

  it('sets the instance variables', function() {
    UA = undefined;

    expect(UA).toBeUndefined();

    UA = new SIP.UA(configuration);

    // var defaultFactory = SIP.WebRTC.sessionDescriptionHandler.defaultFactory;
    // expect(UA.configuration.sessionDescriptionHandlerFactory).toBe(defaultFactory);
    expect(UA.log).toBeDefined();
    expect(UA.logger).toBeDefined();
    expect(UA.cache).toBeDefined();
    expect(UA.configuration).toBeDefined();
    expect(UA.dialogs).toBeDefined();
    expect(UA.applicants).toBeDefined();
    expect(UA.data).toBeDefined();
    expect(UA.sessions).toBeDefined();
    expect(UA.transport).toBeDefined();
    expect(UA.contact).toBeDefined();
    expect(UA.status).toBeDefined();
    expect(UA.error).toBeDefined();
    expect(UA.transactions).toBeDefined();
    expect(UA.transportRecoverAttempts).toBeDefined();

    // var mediaHandlerFactory = function(){};
    // mediaHandlerFactory.isSupported = function(){};
    // configuration.mediaHandlerFactory = mediaHandlerFactory;
    // UA = new SIP.UA(configuration);
    // expect(UA.configuration.mediaHandlerFactory).not.toBe(defaultFactory);
    // expect(UA.configuration.mediaHandlerFactory.isSupported).toBe(mediaHandlerFactory.isSupported);
  });

  it('creates a new register context', function() {
    UA = undefined;

    SIP.RegisterContext.calls.reset();

    UA = new SIP.UA(configuration);

    expect(SIP.RegisterContext).toHaveBeenCalledWith(UA);
  });

  describe('.start', function() {
    beforeEach(function() {
      spyOn(SIP, 'Transport');
      SIP.Transport.C = {
        STATUS_READY:        0,
        STATUS_DISCONNECTED: 1,
        STATUS_ERROR:        2
      };

      UA.transport = {connect: jasmine.createSpy('connect')};
    });

    it('creates a SIP transport if the status is C.STATUS_INIT', function() {
      UA.status = SIP.UA.C.STATUS_INIT;
      UA.getNextWsServer = jasmine.createSpy('getNextWsServer').and.callFake(function() {
        return 'ws-server';
      });
      UA.start();
      expect(SIP.Transport).toHaveBeenCalledWith(UA, 'ws-server');
    });

    it('sets the status to ready and connect the transport if the status is C.STATUS_USER_CLOSED', function() {
      UA.status = SIP.UA.C.STATUS_USER_CLOSED;
      UA.start();
      expect(UA.transport.connect).toHaveBeenCalledWith();
      expect(UA.status).toBe(SIP.UA.C.STATUS_READY);
    });

    it('logs if the status is set to starting', function() {
      UA.status = SIP.UA.C.STATUS_STARTING;
      UA.start();
      expect(UA.logger.log).toHaveBeenCalled();
    });

    it('logs if the status is set to ready', function() {
      UA.status = SIP.UA.C.STATUS_READY;
      UA.start();
      expect(UA.logger.log).toHaveBeenCalled();
    });

    it('logs an error if the status is not C.STATUS_INIT, C.STATUS_STARTING, C.STATUS_USER_CLOSED, C.STATUS_READY', function() {
      UA.status = SIP.UA.C.STATUS_NOT_READY;
      UA.start();
      expect(UA.logger.error).toHaveBeenCalled();
    });

    it('returns itself', function() {
      expect(UA.start()).toBe(UA);
    });

    it('does not register if not configured', function () {
      UA.start();
      expect(UA.registerContext.register).not.toHaveBeenCalled();
    });
  });

  describe('.stop', function() {
    beforeEach(function() {
      UA.transport = jasmine.createSpyObj('transport', ['disconnect']);
    });

    it('logs a warning and returns this if the ua has already been closed', function () {
      UA.status = 3;

      expect(UA.stop()).toBe(UA);
      expect(UA.logger.warn).toHaveBeenCalledWith('UA already closed');
    });

    it('clears the transportRecoveryTimer', function() {
      spyOn(SIP.Timers, 'clearTimeout');

      UA.stop();

      expect(SIP.Timers.clearTimeout).toHaveBeenCalledWith(UA.transportRecoveryTimer);
    });

    it('unregisters', function () {
      UA.stop();

      expect(UA.registerContext.close).toHaveBeenCalled();
    });

    it('terminates any active sessions', function () {
      var session = jasmine.createSpyObj('session', ['terminate']);
      UA.sessions[session] = session;

      UA.stop();

      expect(UA.sessions[session].terminate).toHaveBeenCalled();
    });

    it('closes any active subscriptions', function () {
      var subscription = jasmine.createSpyObj('subscription', ['close']);
      UA.subscriptions[subscription] = subscription;

      UA.stop();

      expect(UA.subscriptions[subscription].close).toHaveBeenCalled();
    });

    it('closes any early subscriptions', function () {
      var subscription = jasmine.createSpyObj('subscription', ['close']);
      UA.earlySubscriptions[subscription] = subscription;

      UA.stop();

      expect(UA.earlySubscriptions[subscription].close).toHaveBeenCalled();
    });

    it('closes any applicants', function () {
      var applicant = jasmine.createSpyObj('applicant', ['close']);
      UA.applicants[applicant] = applicant;

      UA.stop();

      expect(UA.applicants[applicant].close).toHaveBeenCalled();
    });

    it('disconnects from the Web Socket if there are no non-invite transactions left', function () {
      UA.transactions['nist'] = [];
      UA.transactions['nict'] = [];
      UA.stop();

      expect(UA.transport.disconnect).toHaveBeenCalled();
    });

    it('disconnects from the Web Socket if after transaction destroyed is emitted once there are no non-invite transactions left', function () {
      spyOn(UA, 'removeListener');

      //note: you can't explicitly set the *TransactionsCount properties of the UA, they are set by checking the length of the corresponding transactions array

      UA.transactions['nict'] = ['one'];
      UA.transactions['nist'] = ['one'];

      UA.stop();

      expect(UA.transport.disconnect).not.toHaveBeenCalled();

      UA.transactions['nist'] = [];
      UA.emit('transactionDestroyed');
      expect(UA.transport.disconnect).not.toHaveBeenCalled();

      UA.transactions['nict'] = [];
      UA.emit('transactionDestroyed');
      expect(UA.transport.disconnect).toHaveBeenCalled();
      expect(UA.removeListener).toHaveBeenCalled();
    });
  });

  describe('.register', function() {
    var options;

    beforeEach(function() {
      options = 'options';
    });

    it('does not require any arguments', function () {
      expect(function () {
        UA.register();
      }).not.toThrow();
      expect(UA.registerContext.register).toHaveBeenCalled();
    });

    it('sets the register configuration option to true', function() {
      UA.configuration.register = false;
      UA.register(options)
      expect(UA.configuration.register).toBeTruthy();
    });

    it('calls the Register Context register method with the options that were passed to the method', function() {
      UA.register(options);
      expect(UA.registerContext.register).toHaveBeenCalledWith(options);
    });

    it('returns itself', function() {
      expect(UA.register(options)).toBe(UA);
    });
  });

  describe('.unregister', function() {
    var options;

    beforeEach(function() {
      options = 'options';
      UA.transport = {};
      UA.transport.connected = true;
    });

    it('does not require any arguments', function () {
      expect(function () {
        UA.unregister();
      }).not.toThrow();
      expect(UA.registerContext.unregister).toHaveBeenCalled();
    });

    it('sets the register configuration option to false', function() {
      UA.configuration.register = true;
      UA.unregister(options);
      expect(UA.configuration.register).toBeFalsy();
    });

    it('calls the Register Context unregister method with the options that were passed to the method', function() {
      UA.unregister(options);
      expect(UA.registerContext.unregister).toHaveBeenCalledWith(options);
    });

    it('returns itself', function() {
      expect(UA.unregister(options)).toBe(UA);
    });
  });

  describe('.isRegistered', function() {
    it('returns the value stored by register context registered', function() {
      expect(UA.isRegistered()).toBe(UA.registerContext.registered);

      UA.registerContext.registered = false;
      expect(UA.isRegistered()).toBe(UA.registerContext.registered);

      UA.registerContext.registered = 'fishsticks';
      expect(UA.isRegistered()).toBe(UA.registerContext.registered);
    });
  });

  describe('.isConnected', function() {
    it('returns false if the transport is undefined', function() {
      UA.transport = undefined;
      expect(UA.isConnected()).toBe(false);
    });
    it('returns transport.connected if the transport is defined', function() {
      UA.transport = {};
      UA.transport.connected = true;
      expect(UA.isConnected()).toBe(UA.transport.connected);
      UA.transport.connected = false;
      expect(UA.isConnected()).toBe(UA.transport.connected);
      UA.transport.connected = "fishsticks";
      expect(UA.isConnected()).toBe(UA.transport.connected);
    });
  });

  describe('.message', function() {
    var target;
    var body;
    var options;
    var messageSpy;

    beforeEach(function() {
      target = 'target';
      body = 'body';

      messageSpy = jasmine.createSpy('message');

      spyOn(SIP, 'ClientContext').and.returnValue({
        send: messageSpy
      });

    });

    it('throws an exception if body argument is missing', function() {
      expect(function(){UA.message(target);}).toThrowError('Not enough arguments');
    });

    it('sets up a listener for connected if the transport has not connected', function() {
      spyOn(UA, 'once');

      UA.message(target, body, options);

      expect(UA.once).toHaveBeenCalled();
    });

    it('passes no options to message.send', function () {
      spyOn(UA, 'isConnected').and.returnValue(true);

      options = undefined;
      UA.message(target, body, options);
      expect(messageSpy).toHaveBeenCalledWith();
    });

    it('creates a ClientContext with itself, target, body, options.contentType and options as parameters', function() {
      spyOn(UA, 'isConnected').and.returnValue(true);

      options = {contentType : 'mixedContent' };

      UA.message(target, body, options);
      expect(SIP.ClientContext).toHaveBeenCalledWith(UA, SIP.C.MESSAGE, target, withPrototype({contentType: 'mixedContent', body: body}));
    });

    it('calls ClientContext.send method with no options provided to it', function() {
      spyOn(UA, 'isConnected').and.returnValue(true);

      options = { option : 'config' };

      UA.message(target, body, options);
      expect(messageSpy).toHaveBeenCalledWith();
    });
  });

  describe('.invite', function() {
    var inviteSpy;
    var target;

    beforeEach(function() {
      target = 'target';
      inviteSpy = jasmine.createSpy('invite');

      spyOn(SIP, 'InviteClientContext').and.returnValue({
        invite: inviteSpy
      });
    });

    it('sets up a listener for connected if the transport has not connected', function() {
      spyOn(UA, 'once');

      UA.invite(target);

      expect(UA.once).toHaveBeenCalled();
    });

    it('creates an Invite Client Context with itself, target, and options as parameters', function() {
      spyOn(UA, 'isConnected').and.returnValue(true);

      var options = {};
      var modifiers = []
      // UA.configuration.mediaHandlerFactory = function(){};
      UA.invite(target,options,modifiers);
      // invite() puts the mediaHandlerFactory into the options object
      expect(SIP.InviteClientContext).toHaveBeenCalledWith(UA, target, options, modifiers);
    });
  });

  describe('.subscribe', function() {
    var subscribeSpy;
    var target;
    var event;

    beforeEach(function() {
      target = 'target';
      event = 'event'
      subscribeSpy = jasmine.createSpy('subscribe');

      spyOn(SIP, 'Subscription').and.returnValue({
        subscribe: subscribeSpy
      });
    });

    it('sets up a listener for connected if the transport has not connected', function() {
      spyOn(UA, 'once');

      UA.subscribe(target, event);

      expect(UA.once).toHaveBeenCalled();
    });

    it('creates a Subscription with itself, target, and options as parameters', function() {
      spyOn(UA, 'isConnected').and.returnValue(true);

      var options = {};
      UA.subscribe(target, event, options);
      expect(SIP.Subscription).toHaveBeenCalledWith(UA,target, event, options);
    });

    it('calls the Subscription method with no arguments', function() {
      spyOn(UA, 'isConnected').and.returnValue(true);
      var options = { option : 'things' };
      UA.subscribe(target, event, options);
      expect(subscribeSpy).toHaveBeenCalledWith();
    });
  });

  describe('.request', function() {
    var method;
    var target;
    var options;
    var sendSpy;

    beforeEach(function() {
      method = 'method';
      target = 'target';
      options = { option : 'someField' };

      requestSpy = jasmine.createSpy('send');

      spyOn(SIP, 'ClientContext').and.returnValue({
        send: requestSpy
      });
    });

    it('sets up a listener for connected if the transport has not connected', function() {
      spyOn(UA, 'once');

      UA.request(method, target, options);

      expect(UA.once).toHaveBeenCalled();
    });

    it('creates a ClientContext with itself, the method, target and options provided', function() {
      spyOn(UA, 'isConnected').and.returnValue(true);

      UA.request(method,target,options);
      expect(SIP.ClientContext).toHaveBeenCalledWith(UA, method, target, options);
    });

    it('calls ClientContext.send method with no parameters', function() {
      spyOn(UA, 'isConnected').and.returnValue(true);

      UA.request(method,target,options);
      expect(requestSpy).toHaveBeenCalledWith();
    });
  });

  describe('.normalizeTarget', function() {
    beforeEach(function() {
      spyOn(SIP.Utils, 'normalizeTarget').and.returnValue('Normalize Target');
    });

    it('calls SIP.Utils.normalizeTarget with the target and the hostport params', function() {
      var target = 'target';
      UA.normalizeTarget(target);
      expect(SIP.Utils.normalizeTarget).toHaveBeenCalledWith(target, UA.configuration.hostportParams);
    });

    it('returns the result of calling SIP.Utils.normalizeTarget', function() {
      expect(UA.normalizeTarget({})).toEqual('Normalize Target');
    });
  });

  describe('.saveCredentials', function() {
    it('should create the credentials realm object if it does not exist', function() {
      var credentials = { realm : 'credential realm' ,
                          uri : 'credential uri' };
      expect(UA.cache.credentials[credentials.realm]).toBeUndefined();
      UA.saveCredentials(credentials);
      expect(UA.cache.credentials[credentials.realm]).toBeDefined();
    });

    it('adds the credentials uri to the credentials realm', function() {
      var credentials = { realm : 'credential realm' ,
                          uri : 'credential uri' };
      UA.saveCredentials(credentials);
      expect(UA.cache.credentials[credentials.realm][credentials.uri]).toBe(credentials);
    });

    it('returns itself', function() {
      var credentials = { realm : 'credential realm' ,
                          uri : 'credential uri' };
      expect(UA.saveCredentials(credentials)).toBe(UA);
    });
  });

  describe('.getCredentials', function() {
    it('returns undefined if the credentials are not found', function() {
      var request = { ruri : { host : 'ruri host' },
                      method : 'request method' };
      expect(UA.getCredentials(request)).toBeUndefined();
    });

    it('returns the credentials that are found', function() {
      var request = { ruri : { host : 'ruri host' },
                      method : 'request method' };
      var credentials = { realm : 'credential realm' ,
                          uri : 'credential uri' };
      UA.cache.credentials[request.ruri.host] = {};
      UA.cache.credentials[request.ruri.host][request.ruri] = credentials;
      expect(UA.getCredentials(request)).toBe(credentials);
    });
  });

  describe('.getLogger', function() {
    it('calls this.log.getLogger function with the category and label passed to it and return the result', function() {
      spyOn(UA.log, 'getLogger').and.returnValue('logger');
      var category = 'category';
      var label = 'label';
      expect(UA.getLogger(category,label)).toEqual('logger');
      expect(UA.log.getLogger).toHaveBeenCalledWith(category, label);
    });
  });

  xdescribe('.onTransportClosed', function () {});

  xdescribe('.onTransportError', function() {});

  xdescribe('.onTransportConnected', function() {});

  describe('.onTransportConnecting', function() {
    it('emits a connecting event', function() {
      var callback = jasmine.createSpy('callback');
      UA.on('connecting', callback);
      var transport = 'transport';
      var attempts = 'attempts';
      UA.onTransportConnecting(transport,attempts);
      expect(callback.calls.mostRecent().args[0]).toEqual( { transport : 'transport', attempts : 'attempts' } );
    });
  });

  describe('.newTransaction', function() {
    var transaction;
    beforeEach(function() {
      transaction = { type : 'transaction-type' ,
                      id : 'id' };
      UA.transactions[transaction.type] = {};
    });
    it('emits a newTransaction event', function() {
      var callback = jasmine.createSpy('callback');
      UA.on('newTransaction', callback);
      UA.newTransaction(transaction);
      expect(callback.calls.mostRecent().args[0]).toEqual( { transaction : { type : 'transaction-type', id : 'id' } } );
    });

    it('adds the trasaction to the transactions object', function() {
      UA.transactions[transaction.type] = {};
      expect(UA.transactions[transaction.type][transaction.id]).toBeUndefined();
      UA.newTransaction(transaction);
      expect(UA.transactions[transaction.type][transaction.id]).toBeDefined();
    });
  });

  describe('.destroyTransaction', function() {
    var transaction;
    beforeEach(function() {
      transaction = { type : 'transaction-type' ,
                      id : 'id' };
      UA.transactions[transaction.type] = {};
    });

    it('emits a transactionDestroyed event', function() {
      var callback = jasmine.createSpy('callback');
      UA.on('transactionDestroyed', callback);
      UA.newTransaction(transaction);
      expect(callback).not.toHaveBeenCalled();
      UA.destroyTransaction(transaction);
      expect(callback.calls.mostRecent().args[0]).toEqual({ transaction : { type : 'transaction-type', id : 'id' } });
    });

    it('deletes the transaction from the transactions object', function() {
      UA.newTransaction(transaction);
      expect(UA.transactions[transaction.type][transaction.id]).toBeDefined();
      UA.destroyTransaction(transaction);
      expect(UA.transactions[transaction.type][transaction.id]).toBeUndefined();
    });
  });

  describe('.receiveRequest', function() {
    var replySpy;
    beforeEach(function() {
      replySpy = jasmine.createSpy('reply');

      spyOn(SIP.Transactions, 'checkTransaction').and.returnValue(false);
      spyOn(SIP.Transactions, 'NonInviteServerTransaction').and.returnValue(true);
      spyOn(SIP, 'ServerContext').and.returnValue({
        on: function() {return true;}
      });
      spyOn(SIP, 'InviteServerContext').and.returnValue(true);
      spyOn(SIP.Transactions, 'InviteServerTransaction').and.returnValue(true);
    });

    it('checks that the ruri points to us', function() {
      var reply_sl = jasmine.createSpy('reply_sl');
      var request = { method : SIP.C.ACK ,
                  ruri : { user : 'user' } ,
                  reply_sl : reply_sl };
      expect(UA.receiveRequest(request)).toBeUndefined();
      expect(UA.logger.warn).toHaveBeenCalledWith('Request-URI does not point to us');
      expect(reply_sl).not.toHaveBeenCalled();
    });

    it('replies with a 404 if the request method is not ACK', function() {
      var reply_sl = jasmine.createSpy('reply_sl');
      var request = { method : 'not ACK' ,
                  ruri : { user : 'user' } ,
                  reply_sl : reply_sl };
      expect(UA.receiveRequest(request)).toBeUndefined();
      expect(UA.logger.warn).toHaveBeenCalledWith('Request-URI does not point to us');
      expect(reply_sl).toHaveBeenCalledWith(404);
    });

    it('checks the transaction and returns if invalid', function() {
      var request = { method : SIP.C.ACK ,
                      ruri : { user : UA.configuration.uri.user} };
      expect(UA.receiveRequest(request)).toBeUndefined();
      expect(SIP.Transactions.checkTransaction).toHaveBeenCalledWith(UA, request);
    });

    it('creates a new NIST if the SIP method is options', function() {
      var request = { method : SIP.C.OPTIONS ,
                      ruri : { user : UA.configuration.uri.user } ,
                      reply : replySpy };
      UA.receiveRequest(request);
      expect(SIP.Transactions.NonInviteServerTransaction).toHaveBeenCalledWith(request, UA);
      expect(replySpy).toHaveBeenCalledWith(200,null,jasmine.any(Array))
    });

    it('Accepts SIP MESSAGE requests', function() {
      var request = { method : SIP.C.MESSAGE ,
                      ruri : { user : UA.configuration.uri.user } ,
                      reply : replySpy,
                      getHeader: jasmine.createSpy('getHeader')};

      UA.receiveRequest(request);

      expect(SIP.ServerContext).toHaveBeenCalledWith(UA, request);
      expect(replySpy).toHaveBeenCalledWith(200,null);
      expect(request.getHeader).toHaveBeenCalled();
    });

    xit('creates a ServerContext if the SIP method is anything besides options, message, invite, and ack', function() {
      var request = { method : 'method' ,
                      ruri : { user : UA.configuration.uri.user },
                      reply : replySpy };
      UA.receiveRequest(request);
    });

    xit('sends a 488 if an invite is received but there is no WebRTC support', function() {
      var request = { method : SIP.C.INVITE ,
                      ruri : { user: UA.configuration.uri.user } ,
                      reply : replySpy,
                      getHeader : function () {},
                      parseHeader: function () {}
                    };
      var webrtc = SIP.WebRTC.isSupported;
      spyOn(SIP.WebRTC, 'isSupported').and.callFake(function () {
        return false;
      });

      UA.receiveRequest(request);
      expect(replySpy).toHaveBeenCalledWith(488);
    });

    it('sends a 481 if a BYE is received', function() {
      var request = { method : SIP.C.BYE ,
                    ruri : { user : UA.configuration.uri.user } ,
                    reply : replySpy };
      UA.receiveRequest(request);
      expect(replySpy).toHaveBeenCalledWith(481);
    });

    it('finds the session and call receiveRequest on the session if it exists if a CANCEL is received', function() {
      var receiveRequestSpy = jasmine.createSpy('receiveRequest');
      spyOn(UA, 'findSession').and.returnValue({receiveRequest : receiveRequestSpy });
      var request = { method : SIP.C.CANCEL ,
                    ruri : { user : UA.configuration.uri.user } ,
                    reply : replySpy };
      UA.receiveRequest(request);
      expect(UA.findSession).toHaveBeenCalledWith(request);
      expect(receiveRequestSpy).toHaveBeenCalledWith(request);
    });

    it('logs a warning if the session does not exist if a CANCEL is a received', function() {
      spyOn(UA, 'findSession').and.returnValue(false);
      var request = { method : SIP.C.CANCEL ,
                    ruri : { user : UA.configuration.uri.user } ,
                    reply : replySpy };
      UA.receiveRequest(request);
      expect(UA.findSession).toHaveBeenCalledWith(request);
      expect(UA.logger.warn).toHaveBeenCalled();
    });

    it('should not do nothing if an ACK is received', function() {
      var request = { method : SIP.C.ACK ,
                    ruri : { user : UA.configuration.uri.user } ,
                    reply : replySpy };
      UA.receiveRequest(request);
      expect(replySpy).not.toHaveBeenCalled();
    });


    it('replies with a 481 if allowLegacyNotifications is false when a NOTIFY is received', function() {
      var request = { method : SIP.C.NOTIFY ,
                    ruri : { user : UA.configuration.uri.user } ,
                    reply : replySpy };
      UA.receiveRequest(request);
      expect(replySpy).toHaveBeenCalledWith(481, 'Subscription does not exist');
    });

    it('replies with a 481 if allowLegacyNotifications is true, but no listener is set, when a NOTIFY is received', function() {
      configuration.allowLegacyNotifications = true;
      UA = new SIP.UA(configuration);

      var request = { method : SIP.C.NOTIFY ,
                    ruri : { user : UA.configuration.uri.user } ,
                    reply : replySpy };
      UA.receiveRequest(request);
      expect(replySpy).toHaveBeenCalledWith(481, 'Subscription does not exist');
    });

    it('emits notified and replies 200 OK if allowLegacyNotifications is true, but no listener is set, when a NOTIFY is received', function() {
      configuration.allowLegacyNotifications = true;
      UA = new SIP.UA(configuration);
      var callback = jasmine.createSpy('callback');

      UA.on('notify', callback);

      var request = { method : SIP.C.NOTIFY ,
                    ruri : { user : UA.configuration.uri.user } ,
                    reply : replySpy };
      UA.receiveRequest(request);
      expect(replySpy).toHaveBeenCalledWith(200, null);
      expect(callback).toHaveBeenCalled();
    });

    it('replies with a 405 if it cannot interpret the message', function() {
      var request = { method : 'unknown method' ,
                    ruri : { user : UA.configuration.uri.user } ,
                    reply : replySpy };
      UA.receiveRequest(request);
      expect(replySpy).toHaveBeenCalledWith(405);
    });

    it('creates a new Invite Server Transaction and call receive request if it receives an in dialog invite request', function() {
      var receiveRequest = jasmine.createSpy('receiveRequest').and.callFake(function() {
        return 'Receive Request';
      });
      UA.findDialog = jasmine.createSpy('findDialog').and.callFake(function() {
        return {receiveRequest : receiveRequest };
      });
      var request = { method : SIP.C.INVITE ,
                    ruri : { user : UA.configuration.uri.user } ,
                    reply : replySpy ,
                    to_tag : 'tag' };
      UA.receiveRequest(request);
      expect(UA.findDialog).toHaveBeenCalledWith(request);
      expect(SIP.Transactions.InviteServerTransaction).toHaveBeenCalledWith(request,UA);
      expect(receiveRequest).toHaveBeenCalledWith(request);
    });

    it('should not create a new Invite Server Transaction and just call receive request if it receives an in dialog request other than invite', function() {
      var receiveRequest = jasmine.createSpy('receiveRequest').and.callFake(function() {
        return 'Receive Request';
      });
      UA.findDialog = jasmine.createSpy('findDialog').and.callFake(function() {
        return {receiveRequest : receiveRequest };
      });
      var request = { method : 'some method' ,
                    ruri : { user : UA.configuration.uri.user } ,
                    reply : replySpy ,
                    to_tag : 'tag' };
      UA.receiveRequest(request);
      expect(UA.findDialog).toHaveBeenCalledWith(request);
      expect(SIP.Transactions.InviteServerTransaction).not.toHaveBeenCalled();
      expect(receiveRequest).toHaveBeenCalledWith(request);
    });

    it('replies 481 on the request if the dialog is not found and the request is an invite', function() {
      UA.findDialog = jasmine.createSpy('findDialog').and.callFake(function() {
        return false;
      });
      var request = { method : SIP.C.INVITE ,
                    ruri : { user : UA.configuration.uri.user } ,
                    reply : replySpy ,
                    to_tag : 'tag' };
      UA.receiveRequest(request);
      expect(UA.findDialog).toHaveBeenCalledWith(request);
      expect(replySpy).toHaveBeenCalledWith(481);
    });

    it('calls receiveRequest on the dialog if there is one', function() {
      var receiveRequest = jasmine.createSpy('dialogReceiveRequest').and.callFake(function() {
        return 'Receive Request';
      });
      UA.findDialog = jasmine.createSpy('findDialog').and.callFake(function() {
        return {receiveRequest : receiveRequest };
      });
      var request = { method : SIP.C.NOTIFY ,
                    ruri : { user : UA.configuration.uri.user } ,
                    reply : replySpy ,
                    to_tag : 'tag' };
      UA.receiveRequest(request);
      expect(UA.findDialog).toHaveBeenCalledWith(request);
      expect(receiveRequest).toHaveBeenCalledWith(request);
    });

    xit('calls receive request on the session if it exists and the dialog does not for an in dialog notify request', function() {
      //does not test as expected, so removed

      UA.findDialog = jasmine.createSpy('findDialog').and.callFake(function() {
        return false;
      });
      UA.findEarlySubscription = jasmine.createSpy('findEarlySubscription').and.callFake(function() {
        return false;
      });
      var receiveRequest = jasmine.createSpy('receiveRequest').and.callFake(function() {
        return 'Receive Request';
      });
      UA.findSession = jasmine.createSpy('findSession').and.callFake(function() {
        return {receiveRequest : receiveRequest};
      });
      var request = { method : SIP.C.NOTIFY ,
                    ruri : { user : UA.configuration.uri.user } ,
                    reply : replySpy ,
                    to_tag : 'tag' };
      UA.receiveRequest(request);
      expect(UA.findDialog).toHaveBeenCalledWith(request);
      expect(UA.findEarlySubscription).toHaveBeenCalledWith(request);
      expect(UA.findSession).toHaveBeenCalledWith(request);
      expect(receiveRequest).toHaveBeenCalledWith(request);
    });

    xit('calls receive request on the early subscription if it exists and the dialog does not for an in dialog notify request', function() {
      //upon creating this test, I realized the one above it doesn't really test anything, so removed
      UA.findDialog = jasmine.createSpy('findDialog').and.callFake(function() {
        return false;
      });
      UA.findSession = jasmine.createSpy('findSession').and.callFake(function() {
        return false;
      });
      var receiveRequest = jasmine.createSpy('receiveRequest').and.callFake(function() {
        return 'Receive Request';
      });
      UA.findEarlySubscription = jasmine.createSpy('findEarlySubscription').and.callFake(function() {
        return {receiveRequest : receiveRequest};
      });
      var request = { method : SIP.C.NOTIFY ,
                    ruri : { user : UA.configuration.uri.user } ,
                    reply : replySpy ,
                    getHeader: function () { return 'event'; } ,
                    from_tag : 'tag' };
      UA.receiveRequest(request);
      expect(UA.findDialog).toHaveBeenCalledWith(request);
      expect(UA.findEarlySubscription).toHaveBeenCalledWith(request);
      expect(UA.findSession).toHaveBeenCalledWith(request);
      expect(receiveRequest).toHaveBeenCalledWith(request);
    });

    it('replies with a 481 and subscription does not exist if an in dialog notify request is received and no dialog, session, or earlySubscription is found', function() {
      UA.findDialog = jasmine.createSpy('findDialog').and.callFake(function() {
        return false;
      });
      UA.findEarlySubscription = jasmine.createSpy('findEarlySubscription').and.callFake(function() {
        return false;
      });
      UA.findSession = jasmine.createSpy('findSession').and.callFake(function() {
        return false;
      });
      var request = { method : SIP.C.NOTIFY ,
                    ruri : { user : UA.configuration.uri.user } ,
                    reply : replySpy ,
                    to_tag : 'tag' };
      UA.receiveRequest(request);
      expect(UA.findDialog).toHaveBeenCalledWith(request);
      expect(UA.findEarlySubscription).toHaveBeenCalledWith(request);
      expect(UA.findSession).toHaveBeenCalledWith(request);
      expect(replySpy).toHaveBeenCalledWith(481,'Subscription does not exist');
    });

    it ('replies with a 481 if an in dialog request is received that is not a NOTIFY OR ACK and no dialog is found', function() {
      UA.findDialog = jasmine.createSpy('findDialog').and.callFake(function() {
        return false;
      });
      var request = { method : SIP.C.INVITE ,
                    ruri : { user : UA.configuration.uri.user } ,
                    reply : replySpy ,
                    to_tag : 'tag' };
      UA.receiveRequest(request);
      expect(UA.findDialog).toHaveBeenCalledWith(request);
      expect(replySpy).toHaveBeenCalledWith(481);
    });

    it('should not do anything if an ACK is received and no dialog is found', function() {
      UA.findDialog = jasmine.createSpy('findDialog').and.callFake(function() {
        return false;
      });
      var request = { method : SIP.C.ACK ,
                    ruri : { user : UA.configuration.uri.user } ,
                    reply : replySpy ,
                    to_tag : 'tag' };
      UA.receiveRequest(request);
      expect(UA.findDialog).toHaveBeenCalledWith(request);
      expect(replySpy).not.toHaveBeenCalled();
    });
  });

  describe('.findSession', function() {
    var request;

    beforeEach(function() {
      request = { call_id : 'callId' ,
                  from_tag : 'from' };
    });

    it('returns the session based on the call_id and from_tag', function() {
      UA.sessions[request.call_id + request.from_tag] = 'session';
      expect(UA.findSession(request)).toBe(UA.sessions[request.call_id + request.from_tag]);
      delete UA.sessions[request.call_id + request.from_tag];
    });
    it('returns the session based on the call_id and to_tag', function() {
      UA.sessions[request.call_id + request.to_tag] = 'session';
      expect(UA.findSession(request)).toBe(UA.sessions[request.call_id + request.to_tag]);
      delete UA.sessions[request.call_id + request.to_tag];
    });
    it('returns null if the session is not found', function() {
      expect(UA.findSession(request)).toBe(null);
    });
  });

  describe('.findDialog', function() {
    var request;

    beforeEach(function() {
      request = { call_id : 'callId' ,
                  from_tag : 'from' ,
                  to_tag : 'to' };
    });

    it('returns the dialog based on the call_id and from_tag and to_tag', function() {
      UA.dialogs[request.call_id + request.from_tag + request.to_tag] = 'dialog';
      expect(UA.findDialog(request)).toBe(UA.dialogs[request.call_id + request.from_tag + request.to_tag]);
    });
    it('returns the dialog based on the call_id and to_tag and from_tag', function() {
      UA.dialogs[request.call_id + request.to_tag + request.from_tag] = 'dialog';
      expect(UA.findDialog(request)).toBe(UA.dialogs[request.call_id + request.to_tag + request.from_tag]);
    });
    it('returns null if the session is not found', function() {
      expect(UA.findSession(request)).toBe(null);
    });
  });

  describe('.getNextWsServer', function() {
    var can1, can2, can3, can4;

    beforeEach(function() {
      can1 = {status: 0, weight: 0};
      can2 = {status: 0, weight: 1};
      can3 = {status: 0, weight: 1};
      can4 = {status: 0, weight: 2};

      //Note: can't just set wsServers at this point
      UA.configuration = {wsServers: [can1,can2,can3,can4]};
    });

    it('selects the candidate with the highest weight', function() {
      expect(UA.getNextWsServer()).toBe(can4);
    });

    it('selects one of the candidates with the highest weight', function() {
      can4.weight = 0;

      spyOn(Math, 'random').and.returnValue(0.9);

      expect(UA.getNextWsServer()).toBe(can3);

      Math.random.and.returnValue(0.4);

      expect(UA.getNextWsServer()).toBe(can2);
    });

    it('does not select a candidate that has a transport error', function() {
      can4.status = 2;

      expect(UA.getNextWsServer()).not.toBe(can4);
    });
  });

  describe('.closeSessionsOnTransportError', function() {
    it('calls onTransportError for all the sessions in the sessions object', function() {
      var session = jasmine.createSpyObj('session', ['onTransportError', 'terminate']);
      UA.sessions[session] = session;

      UA.closeSessionsOnTransportError();

      expect(UA.sessions[session].onTransportError).toHaveBeenCalled();
    });

    it('calls onTransportClosed on register context', function() {
      UA.closeSessionsOnTransportError();

      expect(UA.registerContext.onTransportClosed).toHaveBeenCalled();
    });
  });

  describe('.recoverTransport', function() {
    beforeEach(function() {
      spyOn(Math, 'random').and.returnValue(0);
    });

    it('logs if the next retry time exceeds the max_interval', function(){
      UA.configuration = {wsServers: [{status:1, weight: 0}], connectionRecoveryMinInterval: 1, connectionRecoveryMaxInterval: -1};

      UA.recoverTransport(UA);

      expect(UA.logger.log).toHaveBeenCalledWith('time for next connection attempt exceeds connectionRecoveryMaxInterval, resetting counter');
    });

    it('calls getNextWsServer', function() {
      spyOn(UA, 'getNextWsServer').and.callThrough();

      UA.recoverTransport(UA);

      expect(UA.getNextWsServer).toHaveBeenCalled();
    });

    it('sets the transportRecoveryTimer', function() {
      expect(UA.transportRecoveryTimer).toBeNull();

      UA.recoverTransport(UA);

      expect(UA.transportRecoveryTimer).toBeDefined();
    });

    describe('logs before setting the transport recovery timer, then attempts to make a new transport', function() {
      beforeEach(function (done) {
        spyOn(SIP, 'Transport');
        SIP.Transport.C = {STATUS_READY: 0, STATUS_DISCONNECTED: 1, STATUS_ERROR: 2};

        UA.configuration = {wsServers: [{status:0, weight: 0}], connectionRecoveryMinInterval: 1, connectionRecoveryMaxInterval: 7};
        UA.transportRecoverAttempts = 0;

        UA.recoverTransport(UA);

        expect(UA.logger.log).toHaveBeenCalledWith('next connection attempt in 1 seconds');

        setTimeout(function () {
          if (UA.transportRecoverAttempts > 0) {
            done();
          }
        },1100);
      });

      it('asynchronously', function () {
        expect(SIP.Transport).toHaveBeenCalled();
      });
    });
  });

  describe('.loadConfig', function() {
    beforeEach(function() {
      UA.configuration = {};
    });

    it('sets default settings for many parameters', function() {
      UA.loadConfig({});

      expect(UA.configuration.viaHost).toBeDefined();

      expect(UA.configuration.uri).toBeDefined();
      expect(UA.configuration.wsServers).toEqual([{scheme: 'WSS', sip_uri: '<sip:edge.sip.onsip.com;transport=ws;lr>', status: 0, weight: 0, ws_uri: 'wss://edge.sip.onsip.com'}]);

      expect(UA.configuration.password).toBeNull();

      expect(UA.configuration.registerExpires).toBe(600);
      expect(UA.configuration.register).toBe(true);
      //registrarServer is set to null here, then switched later in the function if it wasn't passed in

      expect(UA.configuration.wsServerMaxReconnection).toBe(3);
      expect(UA.configuration.wsServerReconnectionTimeout).toBe(4);

      expect(UA.configuration.connectionRecoveryMinInterval).toBe(2);
      expect(UA.configuration.connectionRecoveryMaxInterval).toBe(30);

      expect(UA.configuration.userAgentString).toBe(SIP.C.USER_AGENT);

      expect(UA.configuration.usePreloadedRoute).toBe(false);

      //defaults to 60, then multiplies by 1000 later in the function
      expect(UA.configuration.noAnswerTimeout).toBe(60000);

      expect(UA.configuration.traceSip).toBe(false);

      expect(UA.configuration.hackViaTcp).toBe(false);
      expect(UA.configuration.hackIpInContact).toBe(false);

      expect(UA.configuration.autostart).toBe(true);

      expect(UA.configuration.rel100).toBe(SIP.C.supported.UNSUPPORTED);
      expect(UA.configuration.replaces).toBe(SIP.C.supported.UNSUPPORTED);
      expect(UA.configuration.allowLegacyNotifications).toBe(false);

      expect(UA.configuration.dtmfType).toBe(SIP.C.dtmfType.INFO);
    });

    it('throws a configuration error when a mandatory parameter is missing', function() {
      spyOn(UA, 'getConfigurationCheck').and.returnValue({mandatory: { fake: function (value) {return;} }});

      expect(function(){UA.loadConfig({});}).toThrowError('Missing parameter: fake');
    });

    it('throws a configuration error if a mandatory parameter\'s passed-in value is invalid', function() {
      spyOn(UA, 'getConfigurationCheck').and.returnValue({mandatory: { fake: function (value) {return;} }});

      expect(function(){UA.loadConfig({fake: 'fake'});}).toThrowError('Invalid value "fake" for parameter "fake"');
    });

    it('sets a mandatory value successfully in settings', function() {
      spyOn(UA, 'getConfigurationCheck').and.returnValue({mandatory: { fake: function (value) {return 'fake';} }});

      UA.loadConfig({fake: 'fake'});

      expect(UA.logger.log).toHaveBeenCalledWith('· fake: "fake"');
    });

    it('throws a ConfigurationError if an optional value is passed in which is invalid', function() {
      spyOn(UA, 'getConfigurationCheck').and.returnValue({optional: { fake: function (value) {return;} }});

      expect(function(){UA.loadConfig({fake: 'fake'});}).toThrowError('Invalid value "fake" for parameter "fake"');
    });

    it('sets an optional value successfully in settings', function() {
      spyOn(UA, 'getConfigurationCheck').and.returnValue({optional: { fake: function (value) {return 'fake';} }});

      UA.loadConfig({fake: 'fake'});

      expect(UA.logger.log).toHaveBeenCalledWith('· fake: "fake"');
    });

    it('makes sure the connection recovery max interval is greater than the min interval', function() {
      expect(function(){UA.loadConfig({connectionRecoveryMaxInterval: 1, connectionRecoveryMinInterval: 2});}).toThrowError('Invalid value 1 for parameter "connectionRecoveryMaxInterval"');
    });

    it('allows 0 to be passed as a display name', function() {
      UA.loadConfig({displayName: 0});

      expect(UA.configuration.displayName).toBe('0');
    });

    it('sets an instanceId if one is not passed in also sets sipjsId', function() {
      UA.loadConfig({});

      expect(UA.configuration.instanceId).toBeDefined();

      expect(UA.configuration.sipjsId).toBeDefined();
      expect(UA.configuration.sipjsId.length).toBe(5);
    });

    it('sets auth user to uri user if auth user is not passed in', function() {
      UA.loadConfig({uri: 'james@onsnip.onsip.com'});

      expect(UA.configuration.authorizationUser).toBe(UA.configuration.uri.user);
    });

    it('sets the registrarServer to the uri (without user) if it is not passed in', function() {
      UA.loadConfig({uri: 'james@onsnip.onsip.com'});

      var reg = UA.configuration.uri.clone();
      reg.user = null;

      expect(UA.configuration.registrarServer).toEqual(reg);
    });

    it('uses getRandomTestNetIP for viaHost if hackIpInContact is set to true', function() {
      spyOn(SIP.Utils, 'getRandomTestNetIP').and.callThrough();

      UA.loadConfig({hackIpInContact: true});

      expect(SIP.Utils.getRandomTestNetIP).toHaveBeenCalled();
    });

    it('creates the contact object', function() {
      UA.loadConfig({});

      expect(UA.contact.temp_gruu).toBeNull();
      expect(UA.contact.pub_gruu).toBeNull();
      expect(UA.contact.uri).toBeDefined();
      expect(UA.contact.toString).toBeDefined();
    });

    //I'd check the filling of the configuration skeleton, but it is cleared soon after

    //the setting of the configuration was checked with the default test
    it('sets all parameters (except register and custom) as writable/configurable false', function() {
      UA.loadConfig({});

      expect(UA.configuration['uri']).toBeDefined();
      expect(Object.getOwnPropertyDescriptor(UA.configuration, 'uri').writable).toBe(false);
      expect(Object.getOwnPropertyDescriptor(UA.configuration, 'uri').configurable).toBe(false);
    });

    it('sets the register parameter as writable true, configurable false', function() {
      UA.loadConfig({});

      expect(UA.configuration['register']).toBeDefined();
      expect(Object.getOwnPropertyDescriptor(UA.configuration, 'register').writable).toBe(true);
      expect(Object.getOwnPropertyDescriptor(UA.configuration, 'register').configurable).toBe(false);
    });

    it('sets custom config options', function() {
      UA.loadConfig({custom: { fake: 'fake' }});

      expect(UA.configuration.custom['fake']).toBe('fake');
    });

    it('should set custom user in user part', function () {
      var contactName = 'test';

      UA.loadConfig({ contactName: contactName });

      expect(UA.configuration.contactName).toBe(contactName);
      expect(UA.contact.uri.user).toBe(contactName);
      expect(UA.contact.toString().indexOf(contactName) !== -1).toBeTruthy();
    });

    it('should set random token to contactName', function () {
      var randomToken = 'randomToken';
      spyOn(SIP.Utils, 'createRandomToken').and.returnValue(randomToken);
      UA.loadConfig({ });

      expect(UA.configuration.contactName).toBe(randomToken);
      expect(UA.contact.uri.user).toBe(randomToken);
      expect(UA.contact.toString().indexOf(randomToken) !== -1).toBeTruthy();
    });
  });

  describe('.configuration_check', function() {
    var configCheck;

    beforeEach(function() {
      configCheck = UA.getConfigurationCheck();
    });
    //I could've made another describe for optional, but they are all under that
    describe('.uri', function() {
      it('fails if nothing is passed in', function() {
        expect(configCheck.optional.uri()).toBeUndefined();
      });

      it('fails if there is no user', function() {
        expect(configCheck.optional.uri('@example.com')).toBeUndefined();
      });

      it('passes if there is a correctly parsed uri', function() {
        expect(configCheck.optional.uri('alice@example.com')).toBeDefined();
      });
    });

    describe('.wsServers', function() {
      it('fails for types that are not string or array (of strings or objects', function() {
        expect(configCheck.optional.wsServers(7)).toBeUndefined();
      });

      it('fails for an empty array', function() {
        //NOTE: this is the only case that false is returned (instead of nothing)
        expect(configCheck.optional.wsServers([])).toBe(false);
      });

      it('fails if ws_uri attribute is missing', function() {
        expect(configCheck.optional.wsServers([{sandwich: 'ham'}])).toBeUndefined();
      });

      it('fails if weight attribute is not a number', function() {
        expect(configCheck.optional.wsServers([{ws_uri: 'ham', weight: 'scissors'}])).toBeUndefined()
      });

      it('fails if the ws_uri is invalid', function() {
        expect(configCheck.optional.wsServers([{ws_uri: 'ham'}])).toBeUndefined();
      });

      it('fails if the url scheme is not wss or ws', function() {
        expect(configCheck.optional.wsServers([{ws_uri: 'ithoughtthiswasright://alice@example.com'}])).toBeUndefined();
      });

      it('returns correctly if none of the above is wrong', function() {
        expect(configCheck.optional.wsServers([{ws_uri: 'wss://edge.sip.onsip.com'}])).toEqual([{ws_uri: 'wss://edge.sip.onsip.com', sip_uri:'<sip:edge.sip.onsip.com;transport=ws;lr>', weight: 0, status: 0, scheme: 'WSS'}]);
        expect(configCheck.optional.wsServers("wss://edge.sip.onsip.com")).toEqual([{ws_uri: 'wss://edge.sip.onsip.com', sip_uri:'<sip:edge.sip.onsip.com;transport=ws;lr>', weight: 0, status: 0, scheme: 'WSS'}]);
      });
    });

    describe('.authorizationUser', function() {
      //Try to make this fail, you can't
      xit('fails if a type besides a string is passed in', function() {
        expect(configCheck.optional.authorizationUser()).toBeUndefined();
      });

      it('ALWAYS PASSES', function() {
        expect(configCheck.optional.authorizationUser()).toBe();
        expect(configCheck.optional.authorizationUser('a string')).toBe('a string');
        expect(configCheck.optional.authorizationUser(7)).toBe(7);
        expect(configCheck.optional.authorizationUser({even: 'objects'})).toEqual({even: 'objects'});
        expect(configCheck.optional.authorizationUser(['arrays'])).toEqual(['arrays']);
        expect(configCheck.optional.authorizationUser(true)).toEqual(true);
      });
    });

    describe('.connectionRecoveryMaxInterval', function() {
      it('fails for anything but numbers', function() {
        expect(configCheck.optional.connectionRecoveryMaxInterval(true)).toBeUndefined();
        expect(configCheck.optional.connectionRecoveryMaxInterval('string')).toBeUndefined();
        expect(configCheck.optional.connectionRecoveryMaxInterval(['arrays'])).toBeUndefined();
        expect(configCheck.optional.connectionRecoveryMaxInterval({even: 'objects'})).toBeUndefined();
      });

      it('fails for negative numbers and 0', function() {
        expect(configCheck.optional.connectionRecoveryMaxInterval(0)).toBeUndefined();
        expect(configCheck.optional.connectionRecoveryMaxInterval(-7)).toBeUndefined();
      });

      it('passes for positive numbers', function() {
        expect(configCheck.optional.connectionRecoveryMaxInterval(7)).toBe(7);
      });
    });

    describe('.connectionRecoveryMinInterval', function() {
      it('fails for anything but numbers', function() {
        expect(configCheck.optional.connectionRecoveryMinInterval(true)).toBeUndefined();
        expect(configCheck.optional.connectionRecoveryMinInterval('string')).toBeUndefined();
        expect(configCheck.optional.connectionRecoveryMinInterval(['arrays'])).toBeUndefined();
        expect(configCheck.optional.connectionRecoveryMinInterval({even: 'objects'})).toBeUndefined();
      });

      it('fails for negative numbers and 0', function() {
        expect(configCheck.optional.connectionRecoveryMinInterval(0)).toBeUndefined();
        expect(configCheck.optional.connectionRecoveryMinInterval(-7)).toBeUndefined();
      });

      it('passes for positive numbers', function() {
        expect(configCheck.optional.connectionRecoveryMinInterval(7)).toBe(7);
      });
    });

    describe('.displayName', function() {
      //Try to make this fail, you can't
      xit('fails if a type besides a string is passed in', function() {
        expect(configCheck.optional.displayName()).toBeUndefined();
      });

      it('ALWAYS PASSES', function() {
        expect(configCheck.optional.displayName()).toBe();
        expect(configCheck.optional.displayName(true)).toBe(true);
        expect(configCheck.optional.displayName('a string')).toBe('a string');
        expect(configCheck.optional.displayName(7)).toBe(7);
        expect(configCheck.optional.displayName({even: 'objects'})).toEqual({even: 'objects'});
        expect(configCheck.optional.displayName(['arrays'])).toEqual(['arrays']);
      });
    });

    describe('.hackViaTcp', function() {
      it('fails for all types except boolean', function() {
        expect(configCheck.optional.hackViaTcp()).toBeUndefined();
        expect(configCheck.optional.hackViaTcp(7)).toBeUndefined();
        expect(configCheck.optional.hackViaTcp('string')).toBeUndefined();
        expect(configCheck.optional.hackViaTcp({even: 'objects'})).toBeUndefined();
        expect(configCheck.optional.hackViaTcp(['arrays'])).toBeUndefined();
      });

      it('passes for boolean parameters', function() {
        expect(configCheck.optional.hackViaTcp(true)).toBe(true);
        expect(configCheck.optional.hackViaTcp(false)).toBe(false);
      });
    });

    describe('.hackIpInContact', function() {
      it('fails for all types except boolean and string', function() {
        expect(configCheck.optional.hackIpInContact()).toBeUndefined();
        expect(configCheck.optional.hackIpInContact(7)).toBeUndefined();
        expect(configCheck.optional.hackIpInContact({even: 'objects'})).toBeUndefined();
        expect(configCheck.optional.hackIpInContact(['arrays'])).toBeUndefined();
      });

      it('passes for boolean parameters', function() {
        expect(configCheck.optional.hackIpInContact(true)).toBe(true);
        expect(configCheck.optional.hackIpInContact(false)).toBe(false);
      });

      it('passes for string parameters that can be parsed as a host', function() {
        expect(configCheck.optional.hackIpInContact('1string')).toBeUndefined();
        expect(configCheck.optional.hackIpInContact('string')).toBe('string');
        expect(configCheck.optional.hackIpInContact('127.0.0.1')).toBe('127.0.0.1');
      });
    });

    describe('.instanceId', function() {
      it('fails for everything but string hex pattern (see below)', function() {
        expect(configCheck.optional.instanceId()).toBeUndefined();
        expect(configCheck.optional.instanceId(7)).toBeUndefined();
        expect(configCheck.optional.instanceId({even: 'objects'})).toBeUndefined();
        expect(configCheck.optional.instanceId(['arrays'])).toBeUndefined();
        expect(configCheck.optional.instanceId(false)).toBeUndefined();
        expect(configCheck.optional.instanceId(7)).toBeUndefined(7);
      });

      it('passes if passed (hex8)-(hex4)-(hex4)-(hex4)-(hex12) as a string (may have uuid: in front, but removes this)', function() {
        expect(configCheck.optional.instanceId('8f1fa16a-1165-4a96-8341-785b1ef24f02')).toBe('8f1fa16a-1165-4a96-8341-785b1ef24f02');
        expect(configCheck.optional.instanceId('uuid:8f1fa16a-1165-4a96-8341-785b1ef24f02')).toBe('8f1fa16a-1165-4a96-8341-785b1ef24f02');
      });
    });

    describe('.noAnswerTimeout', function() {
      it('fails for anything but numbers', function() {
        expect(configCheck.optional.noAnswerTimeout(true)).toBeUndefined();
        expect(configCheck.optional.noAnswerTimeout('string')).toBeUndefined();
        expect(configCheck.optional.noAnswerTimeout(['arrays'])).toBeUndefined();
        expect(configCheck.optional.noAnswerTimeout({even: 'objects'})).toBeUndefined();
      });

      it('fails for negative numbers and 0', function() {
        expect(configCheck.optional.noAnswerTimeout(0)).toBeUndefined();
        expect(configCheck.optional.noAnswerTimeout(-7)).toBeUndefined();
      });

      it('passes for positive numbers', function() {
        expect(configCheck.optional.noAnswerTimeout(7)).toBe(7);
      });
    });

    describe('.password', function() {
      //doesn't even have a fail case, just converts to String
      it('ALWAYS PASSES', function() {
        expect(configCheck.optional.password()).toBe('undefined');
        expect(configCheck.optional.password(true)).toBe('true');
        expect(configCheck.optional.password('a string')).toBe('a string');
        expect(configCheck.optional.password(7)).toBe('7');
        expect(configCheck.optional.password({even: 'objects'})).toBe('[object Object]');
        expect(configCheck.optional.password(['arrays'])).toBe('arrays');
      });
    });

    describe('.rel100', function() {
      it('returns SIP.C.supported.REQUIRED if SIP.C.supported.REQUIRED is passed in', function(){
        expect(configCheck.optional.rel100(SIP.C.supported.REQUIRED)).toBe(SIP.C.supported.REQUIRED);
      });

      // Legacy Support
      it('returns SIP.C.supported.REQUIRED if "required" is passed in', function(){
        expect(configCheck.optional.rel100("required")).toBe(SIP.C.supported.REQUIRED);
      });

      it('returns SIP.C.supported.SUPPORTED if SIP.C.supported.SUPPORTED is passed in', function(){
        expect(configCheck.optional.rel100(SIP.C.supported.SUPPORTED)).toBe(SIP.C.supported.SUPPORTED);
      });

      // Legacy Support
      it('returns SIP.C.supported.SUPPORTED if "supported" is passed in as well as adding it to the supported list', function(){
        expect(configCheck.optional.rel100('supported')).toBe(SIP.C.supported.SUPPORTED);
      });

      it('returns SIP.C.supported.NONE for all other arguments passed in', function() {
        expect(configCheck.optional.rel100()).toBe(SIP.C.supported.UNSUPPORTED);
        expect(configCheck.optional.rel100(true)).toBe(SIP.C.supported.UNSUPPORTED);
        expect(configCheck.optional.rel100('a string')).toBe(SIP.C.supported.UNSUPPORTED);
        expect(configCheck.optional.rel100(7)).toBe(SIP.C.supported.UNSUPPORTED);
        expect(configCheck.optional.rel100({even: 'objects'})).toBe(SIP.C.supported.UNSUPPORTED);
        expect(configCheck.optional.rel100(['arrays'])).toBe(SIP.C.supported.UNSUPPORTED);
      });
    });

    describe('.replaces', function() {
      it('returns SIP.C.supported.REQUIRED if SIP.C.supported.REQUIRED is passed in', function(){
        expect(configCheck.optional.replaces(SIP.C.supported.REQUIRED)).toBe(SIP.C.supported.REQUIRED);
      });

      it('returns SIP.C.supported.SUPPORTED if SIP.C.supported.SUPPORTED is passed in', function(){
        expect(configCheck.optional.replaces(SIP.C.supported.SUPPORTED)).toBe(SIP.C.supported.SUPPORTED);
      });

      it('returns SIP.C.supported.UNSUPPORTED for all other arguments passed in', function() {
        expect(configCheck.optional.replaces()).toBe(SIP.C.supported.UNSUPPORTED);
        expect(configCheck.optional.replaces(true)).toBe(SIP.C.supported.UNSUPPORTED);
        expect(configCheck.optional.replaces('a string')).toBe(SIP.C.supported.UNSUPPORTED);
        expect(configCheck.optional.replaces(7)).toBe(SIP.C.supported.UNSUPPORTED);
        expect(configCheck.optional.replaces({even: 'objects'})).toBe(SIP.C.supported.UNSUPPORTED);
        expect(configCheck.optional.replaces(['arrays'])).toBe(SIP.C.supported.UNSUPPORTED);
      });
    });

    describe('.register', function() {
      it('fails for all types except boolean', function() {
        expect(configCheck.optional.register()).toBeUndefined();
        expect(configCheck.optional.register(7)).toBeUndefined();
        expect(configCheck.optional.register('string')).toBeUndefined();
        expect(configCheck.optional.register({even: 'objects'})).toBeUndefined();
        expect(configCheck.optional.register(['arrays'])).toBeUndefined();
      });

      it('passes for boolean parameters', function() {
        expect(configCheck.optional.register(true)).toBe(true);
        expect(configCheck.optional.register(false)).toBe(false);
      });
    });

    describe('.registerExpires', function() {
      it('fails for anything but numbers', function() {
        expect(configCheck.optional.registerExpires(true)).toBeUndefined();
        expect(configCheck.optional.registerExpires('string')).toBeUndefined();
        expect(configCheck.optional.registerExpires(['arrays'])).toBeUndefined();
        expect(configCheck.optional.registerExpires({even: 'objects'})).toBeUndefined();
      });

      it('fails for negative numbers and 0', function() {
        expect(configCheck.optional.registerExpires(0)).toBeUndefined();
        expect(configCheck.optional.registerExpires(-7)).toBeUndefined();
      });

      it('passes for positive numbers', function() {
        expect(configCheck.optional.registerExpires(7)).toBe(7);
      });
    });

    describe('.registrarServer', function() {
      it('only accepts strings', function() {
        expect(configCheck.optional.registrarServer()).toBeUndefined();
        expect(configCheck.optional.registrarServer(7)).toBeUndefined();
        expect(configCheck.optional.registrarServer(true)).toBeUndefined();
        expect(configCheck.optional.registrarServer({even: 'objects'})).toBeUndefined();
        expect(configCheck.optional.registrarServer(['arrays'])).toBeUndefined();
      });

      it('fails for a string that is not a valid uri (parse returns nothing)', function() {
        expect(configCheck.optional.registrarServer('@example.com')).toBeUndefined();
      });

      it('fails for a string that is a valid uri, but has a user', function() {
        expect(configCheck.optional.registrarServer('alice@example.com')).toBeUndefined();
      });
      it('passes for a string that is a valid uri without a user and returns a URI', function() {
        expect(configCheck.optional.registrarServer('example.com')).toBeDefined();
        expect(configCheck.optional.registrarServer('sip:example.com')).toBeDefined();
      });
    });

    describe('.traceSip', function() {
      it('fails for all types except boolean', function() {
        expect(configCheck.optional.traceSip()).toBeUndefined();
        expect(configCheck.optional.traceSip(7)).toBeUndefined();
        expect(configCheck.optional.traceSip('string')).toBeUndefined();
        expect(configCheck.optional.traceSip({even: 'objects'})).toBeUndefined();
        expect(configCheck.optional.traceSip(['arrays'])).toBeUndefined();
      });

      it('passes for boolean parameters', function() {
        expect(configCheck.optional.traceSip(true)).toBe(true);
        expect(configCheck.optional.traceSip(false)).toBe(false);
      });
    });

    describe('.userAgentString', function() {
      it('fails for all types except string', function() {
        expect(configCheck.optional.userAgentString()).toBeUndefined();
        expect(configCheck.optional.userAgentString(7)).toBeUndefined();
        expect(configCheck.optional.userAgentString(true)).toBeUndefined();
        expect(configCheck.optional.userAgentString({even: 'objects'})).toBeUndefined();
        expect(configCheck.optional.userAgentString(['arrays'])).toBeUndefined();
      });

      it('passes for string parameters', function() {
        expect(configCheck.optional.userAgentString('string')).toBe('string');
        expect(configCheck.optional.userAgentString(SIP.C.USER_AGENT + ' string')).toBe(SIP.C.USER_AGENT + ' string');
      });
    });

    describe('.usePreloadedRoute', function() {
      it('fails for all types except boolean', function() {
        expect(configCheck.optional.usePreloadedRoute()).toBeUndefined();
        expect(configCheck.optional.usePreloadedRoute(7)).toBeUndefined();
        expect(configCheck.optional.usePreloadedRoute('string')).toBeUndefined();
        expect(configCheck.optional.usePreloadedRoute({even: 'objects'})).toBeUndefined();
        expect(configCheck.optional.usePreloadedRoute(['arrays'])).toBeUndefined();
      });

      it('passes for boolean parameters', function() {
        expect(configCheck.optional.usePreloadedRoute(true)).toBe(true);
        expect(configCheck.optional.usePreloadedRoute(false)).toBe(false);
      });
    });

    describe('.wsServerMaxReconnection', function() {
      it('fails for anything but numbers', function() {
        expect(configCheck.optional.wsServerMaxReconnection(true)).toBeUndefined();
        expect(configCheck.optional.wsServerMaxReconnection('string')).toBeUndefined();
        expect(configCheck.optional.wsServerMaxReconnection(['arrays'])).toBeUndefined();
        expect(configCheck.optional.wsServerMaxReconnection({even: 'objects'})).toBeUndefined();
      });

      it('fails for negative numbers and 0', function() {
        expect(configCheck.optional.wsServerMaxReconnection(0)).toBeUndefined();
        expect(configCheck.optional.wsServerMaxReconnection(-7)).toBeUndefined();
      });

      it('passes for positive numbers', function() {
        expect(configCheck.optional.wsServerMaxReconnection(7)).toBe(7);
      });
    });

    describe('.wsServerReconnectionTimeout', function() {
      it('fails for anything but numbers', function() {
        expect(configCheck.optional.wsServerReconnectionTimeout(true)).toBeUndefined();
        expect(configCheck.optional.wsServerReconnectionTimeout('string')).toBeUndefined();
        expect(configCheck.optional.wsServerReconnectionTimeout(['arrays'])).toBeUndefined();
        expect(configCheck.optional.wsServerReconnectionTimeout({even: 'objects'})).toBeUndefined();
      });

      it('fails for negative numbers and 0', function() {
        expect(configCheck.optional.wsServerReconnectionTimeout(0)).toBeUndefined();
        expect(configCheck.optional.wsServerReconnectionTimeout(-7)).toBeUndefined();
      });

      it('passes for positive numbers', function() {
        expect(configCheck.optional.wsServerReconnectionTimeout(7)).toBe(7);
      });
    });

    describe('.autostart', function() {
      it('fails for all types except boolean', function() {
        expect(configCheck.optional.autostart()).toBeUndefined();
        expect(configCheck.optional.autostart(7)).toBeUndefined();
        expect(configCheck.optional.autostart('string')).toBeUndefined();
        expect(configCheck.optional.autostart({even: 'objects'})).toBeUndefined();
        expect(configCheck.optional.autostart(['arrays'])).toBeUndefined();
      });

      it('passes for boolean parameters', function() {
        expect(configCheck.optional.autostart(true)).toBe(true);
        expect(configCheck.optional.autostart(false)).toBe(false);
      });
    });
    describe('.allowLegacyNotifications', function() {
      it('fails for all types except boolean', function() {
        expect(configCheck.optional.allowLegacyNotifications()).toBeUndefined();
        expect(configCheck.optional.allowLegacyNotifications(7)).toBeUndefined();
        expect(configCheck.optional.allowLegacyNotifications('string')).toBeUndefined();
        expect(configCheck.optional.allowLegacyNotifications({even: 'objects'})).toBeUndefined();
        expect(configCheck.optional.allowLegacyNotifications(['arrays'])).toBeUndefined();
      });

      it('passes for boolean parameters', function() {
        expect(configCheck.optional.allowLegacyNotifications(true)).toBe(true);
        expect(configCheck.optional.allowLegacyNotifications(false)).toBe(false);
      });
    });
    describe('.dtmfType', function() {
      it('is set to SIP.C.dtmfType.INFO on any input that isn\'t SIP.C.dtmfType.RTP', function() {
        expect(configCheck.optional.dtmfType(SIP.C.dtmfType.INFO)).toBe(SIP.C.dtmfType.INFO);
        expect(configCheck.optional.dtmfType('cat')).toBe(SIP.C.dtmfType.INFO);
        expect(configCheck.optional.dtmfType('')).toBe(SIP.C.dtmfType.INFO);
        expect(configCheck.optional.dtmfType()).toBe(SIP.C.dtmfType.INFO);
      });
      it('can be set to SIP.C.dtmfType.RTP', function() {
        expect(configCheck.optional.dtmfType(SIP.C.dtmfType.RTP)).toBe(SIP.C.dtmfType.RTP);
      });
    });
  });
});
