/* eslint-disable strict, no-undef */
describe('UA', function() {
  var UA;
  var uri;

  beforeEach(function() {
    uri = 'alice@example.com';
    wsServers = 'ws://server.example.com';
    registrarServer = 'registrar.example.com';
    configuration = {uri : uri,
                     wsServers : wsServers };

    UA = new SIP.UA(configuration);
    UA.transport = jasmine.createSpyObj('transport', ['connect', 'disconnect', 'send', 'afterConnected', 'on', 'once', 'removeListener']);
    UA.transport.afterConnected.and.callFake(function(callback) { callback(); });
    UA.transport.connect.and.returnValue(Promise.resolve());
    UA.transport.disconnect.and.returnValue(Promise.resolve());
    UA.transport.send.and.returnValue(Promise.resolve());
    UA.logger = jasmine.createSpyObj('logger', ['log', 'error', 'warn']);
  });

  afterEach(function() {
    UA.stop();
  });

  it('has no mandatory parameters', function () {
    var myUA;
    function noParams() {
      myUA = new SIP.UA();
    }

    expect(noParams).not.toThrow();
    expect(myUA.configuration.uri.toString()).toEqual(jasmine.any(String));
  });

  it('can be created with just a string URI', function () {
    var myUA;
    function oneParam() {
      myUA = new SIP.UA('will@example.com');
    }

    expect(oneParam).not.toThrow();
    expect(myUA.configuration.uri.toString()).toEqual('sip:will@example.com');
  });

  it('can be created with just a String (object) URI', function () {
    var myUA;
    function oneParam() {
      myUA = new SIP.UA('will@example.com');
    }

    expect(oneParam).not.toThrow();
    expect(myUA.configuration.uri.toString()).toEqual('sip:will@example.com');
  });

  it('sets the instance variables', function() {
    UA = undefined;

    expect(UA).toBeUndefined();

    UA = new SIP.UA(configuration);

    // var defaultFactory = SIP.Web.sessionDescriptionHandler.defaultFactory;
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
    expect(UA.error).toBeUndefined();
    expect(UA.transactions).toBeDefined();

    // var mediaHandlerFactory = function(){};
    // mediaHandlerFactory.isSupported = function(){};
    // configuration.mediaHandlerFactory = mediaHandlerFactory;
    // UA = new SIP.UA(configuration);
    // expect(UA.configuration.mediaHandlerFactory).not.toBe(defaultFactory);
    // expect(UA.configuration.mediaHandlerFactory.isSupported).toBe(mediaHandlerFactory.isSupported);
  });

  it('creates a new register context', function() {
    UA = undefined;

    UA = new SIP.UA(configuration);

    expect(UA.registerContext).toBeDefined();
  });

  describe('.start', function() {
    beforeEach(function() {
      spyOn(UA.configuration, 'transportConstructor').and.callThrough();
      UA.transport = jasmine.createSpyObj('transport', ['connect', 'disconnect', 'send', 'on', 'removeListener']);
      UA.transport.connect.and.returnValue(Promise.resolve());
      UA.transport.disconnect.and.returnValue(Promise.resolve());
      UA.transport.send.and.returnValue(Promise.resolve());
    });

    xit('creates a SIP transport if the status is C.STATUS_INIT', function() {
      UA.status = SIP.UA.C.STATUS_INIT;
      UA.start();
      expect(UA.configuration.transportConstructor).toHaveBeenCalled();
    });

    it('sets the status to ready and connect the transport if the status is C.STATUS_USER_CLOSED', function() {
      UA.status = SIP.UA.C.STATUS_USER_CLOSED;
      UA.start();
      expect(UA.transport.connect).toHaveBeenCalled();
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
      spyOn(UA.registerContext, "register");
      UA.start();
      expect(UA.registerContext.register).not.toHaveBeenCalled();
    });
  });

  describe('.stop', function() {
    beforeEach(function() {
      UA.transport = jasmine.createSpyObj('transport', ['connect', 'disconnect', 'send', 'on', 'removeListener']);
      UA.transport.connect.and.returnValue(Promise.resolve());
      UA.transport.disconnect.and.returnValue(Promise.resolve());
      UA.transport.send.and.returnValue(Promise.resolve());
    });

    it('logs a warning and returns this if the ua has already been closed', function () {
      UA.status = 3;

      expect(UA.stop()).toBe(UA);
      expect(UA.logger.warn).toHaveBeenCalledWith('UA already closed');
    });

    // it('clears the transportRecoveryTimer', function() {
    //   spyOn('clearTimeout');
    //
    //   UA.stop();
    //
    //   expect(clearTimeout).toHaveBeenCalledWith(UA.transportRecoveryTimer);
    // });

    it('unregisters', function () {
      spyOn(UA.registerContext, 'close');
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

    it('closes any publishers', function () {
      var publisher = jasmine.createSpyObj('publish', ['close']);
      UA.publishers[publisher] = publisher;

      UA.stop();

      expect(UA.publishers[publisher].close).toHaveBeenCalled();
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
      spyOn(UA.registerContext, 'register');
      expect(function () {
        UA.register();
      }).not.toThrow();
      expect(UA.registerContext.register).toHaveBeenCalled();
    });

    it('sets the register configuration option to true, if register flag is passed', function() {
      UA.configuration.register = false;
      UA.register({register: true});
      expect(UA.configuration.register).toBeTruthy();
    });

    it('calls the Register Context register method with the options that were passed to the method', function() {
      spyOn(UA.registerContext, 'register');
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
    });

    it('does not require any arguments', function () {
      spyOn(UA.registerContext, 'unregister');
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
      spyOn(UA.registerContext, 'unregister');
      UA.unregister(options);
      expect(UA.registerContext.unregister).toHaveBeenCalledWith(options);
    });

    it('returns itself', function() {
      expect(UA.unregister(options)).toBe(UA);
    });
  });

  describe('.isRegistered', function() {
    it('returns the value stored by register context registered', function() {
      spyOn(UA.registerContext, 'unregister');
      expect(UA.isRegistered()).toBe(UA.registerContext.registered);

      UA.registerContext.registered = false;
      expect(UA.isRegistered()).toBe(UA.registerContext.registered);

      UA.registerContext.registered = 'fishsticks';
      expect(UA.isRegistered()).toBe(UA.registerContext.registered);
    });
  });

  xdescribe('.message', function() {
    var target;
    var body;
    var options;
    var messageSpy;

    beforeEach(function() {
      target = 'target';
      body = 'body';
    });

    it('throws an exception if body argument is missing', function() {
      expect(function(){UA.message(target);}).toThrowError('Not enough arguments');
    });

    it('sets up a listener for connected if the transport has not connected', function() {
      UA.message(target, body, options);
      expect(UA.transport.once).toHaveBeenCalled();
    });
  });

  xdescribe('.invite', function() {
    var inviteSpy;
    var target;

    beforeEach(function() {
      target = 'target';
    });

    it('sets up a listener for connected if the transport has not connected', function() {
      UA.invite(target);
      expect(UA.transport.once).toHaveBeenCalled();
    });
  });

  xdescribe('.subscribe', function() {
    var subscribeSpy;
    var target;
    var event;

    beforeEach(function() {
      target = 'target';
      event = 'event';
    });

    it('sets up a listener for connected if the transport has not connected', function() {
      UA.subscribe(target, event);

      expect(UA.transport.once).toHaveBeenCalled();
    });
  });

  xdescribe('.publish', function() {
    var publishSpy;
    var target;
    var event;
    var body;

    beforeEach(function() {
      target = 'target';
      event = 'event';
      body = 'body';
    });

    it('sets up a listener for connected if the transport has not connected', function() {
      UA.publish(target, event, body);

      expect(UA.transport.once).toHaveBeenCalled();
    });
  });

  xdescribe('.request', function() {
    var method;
    var target;
    var options;

    beforeEach(function() {
      method = 'method';
      target = 'target';
      options = { option : 'someField' };
    });

    it('sets up a listener for connected if the transport has not connected', function() {
      UA.request(method, target, options);

      expect(UA.transport.once).toHaveBeenCalled();
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
      var request = { ruri : { host : 'ruri host', type: SIP.TypeStrings.URI },
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

  xdescribe('.onTransportConnecting', function() {
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
      UA.transactions[transaction.kind] = {};
    });
    it('emits a newTransaction event', function() {
      var callback = jasmine.createSpy('callback');
      UA.on('newTransaction', callback);
      UA.newTransaction(transaction);
      expect(callback.calls.mostRecent().args[0]).toEqual( { transaction : { type : 'transaction-type', id : 'id' } } );
    });

    it('adds the trasaction to the transactions object', function() {
      UA.transactions[transaction.kind] = {};
      expect(UA.transactions[transaction.kind][transaction.id]).toBeUndefined();
      UA.newTransaction(transaction);
      expect(UA.transactions[transaction.kind][transaction.id]).toBeDefined();
    });
  });

  describe('.destroyTransaction', function() {
    var transaction;
    beforeEach(function() {
      transaction = { type : 'transaction-type' ,
                      id : 'id'};
      UA.transactions[transaction.kind] = {};
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
      expect(UA.transactions[transaction.kind][transaction.id]).toBeDefined();
      UA.destroyTransaction(transaction);
      expect(UA.transactions[transaction.kind][transaction.id]).toBeUndefined();
    });
  });

  describe('.receiveRequest', function() {
    var replySpy;
    beforeEach(function() {
      replySpy = jasmine.createSpy('reply');
    });

    it('checks that the ruri points to us', function() {
      var reply_sl = jasmine.createSpy('reply_sl');
      var request = { method : SIP.C.ACK ,
                  ruri : { scheme: 'sip', user : 'user' } ,
                  reply_sl : reply_sl };
      expect(UA.receiveRequestFromTransport(request)).toBeUndefined();
      expect(UA.logger.warn).toHaveBeenCalledWith('Request-URI does not point to us');
      expect(reply_sl).not.toHaveBeenCalled();
    });

    it('replies with a 404 if the request method is not ACK', function() {
      var reply_sl = jasmine.createSpy('reply_sl');
      var request = { method : 'not ACK' ,
                  ruri : { scheme: 'sip', user : 'user' } ,
                  reply_sl : reply_sl };
      expect(UA.receiveRequestFromTransport(request)).toBeUndefined();
      expect(UA.logger.warn).toHaveBeenCalledWith('Request-URI does not point to us');
      expect(reply_sl).toHaveBeenCalledWith(404);
    });

    it('checks the transaction and returns if invalid', function() {
      var request = { method : SIP.C.ACK ,
                      ruri : { user : UA.configuration.uri.user} };
      expect(UA.receiveRequest(request)).toBeUndefined();
    });

    it('creates a new NIST if the SIP method is options', function() {
      var request = { method : SIP.C.OPTIONS ,
                      ruri : { user : UA.configuration.uri.user } ,
                      reply : replySpy };
      UA.receiveRequest(request);
      expect(replySpy).toHaveBeenCalledWith(200,undefined,jasmine.any(Array));
    });

    it('Accepts SIP MESSAGE requests', function() {
      var request = { method : SIP.C.MESSAGE ,
                      ruri : { user : UA.configuration.uri.user } ,
                      reply : replySpy,
                      hasHeader: jasmine.createSpy('hasHeader'),
                      getHeader: jasmine.createSpy('getHeader')};

      UA.receiveRequest(request);

      expect(replySpy).toHaveBeenCalledWith(200,undefined);
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
      spyOn(SIP.Web, 'isSupported').and.callFake(function () {
        return false;
      });

      UA.receiveRequest(request);
      expect(replySpy).toHaveBeenCalledWith(488);
    });

    it('sends a 481 if a BYE is received', function() {
      var request = { method : SIP.C.BYE ,
                    ruri : { user : UA.configuration.uri.user },
                    hasHeader: jasmine.createSpy('hasHeader'),
                    reply : replySpy };
      UA.receiveRequest(request);
      expect(replySpy).toHaveBeenCalledWith(481);
    });

    it('finds the session and call receiveRequest on the session if it exists if a CANCEL is received', function() {
      var receiveRequestSpy = jasmine.createSpy('receiveRequest');
      spyOn(UA, 'findSession').and.returnValue({receiveRequest : receiveRequestSpy });
      var request = { method : SIP.C.CANCEL ,
                    ruri : { user : UA.configuration.uri.user },
                    hasHeader: jasmine.createSpy("hasHeader"),
                    reply : replySpy };
      UA.receiveRequest(request);
      expect(UA.findSession).toHaveBeenCalledWith(request);
      expect(receiveRequestSpy).toHaveBeenCalledWith(request);
    });

    it('logs a warning if the session does not exist if a CANCEL is a received', function() {
      spyOn(UA, 'findSession').and.returnValue(false);
      var request = { method : SIP.C.CANCEL ,
                    ruri : { user : UA.configuration.uri.user } ,
                    hasHeader: jasmine.createSpy("hasHeader"),
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
                    hasHeader: jasmine.createSpy("hasHeader"),
                    reply : replySpy };
      UA.receiveRequest(request);
      expect(replySpy).toHaveBeenCalledWith(481, 'Subscription does not exist');
    });

    it('replies with a 481 if allowLegacyNotifications is true, but no listener is set, when a NOTIFY is received', function() {
      configuration.allowLegacyNotifications = true;
      UA = new SIP.UA(configuration);

      var request = { method : SIP.C.NOTIFY ,
                    ruri : { user : UA.configuration.uri.user } ,
                    hasHeader: jasmine.createSpy("hasHeader"),
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
                    hasHeader: jasmine.createSpy("hasHeader"),
                    reply : replySpy };
      UA.receiveRequest(request);
      expect(replySpy).toHaveBeenCalledWith(200, undefined);
      expect(callback).toHaveBeenCalled();
    });

    it('replies with a 405 if it cannot interpret the message', function() {
      var request = { method : 'unknown method' ,
                    ruri : { user : UA.configuration.uri.user } ,
                    hasHeader: jasmine.createSpy("hasHeader"),
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
                    toTag : 'tag' };
      UA.receiveRequest(request);
      expect(UA.findDialog).toHaveBeenCalledWith(request);
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
                    hasHeader: jasmine.createSpy("hasHeader"),
                    reply : replySpy ,
                    toTag : 'tag' };
      UA.receiveRequest(request);
      expect(UA.findDialog).toHaveBeenCalledWith(request);
      expect(receiveRequest).toHaveBeenCalledWith(request);
    });

    it('replies 481 on the request if the dialog is not found and the request is an invite', function() {
      UA.findDialog = jasmine.createSpy('findDialog').and.callFake(function() {
        return false;
      });
      var request = { method : SIP.C.INVITE ,
                    ruri : { user : UA.configuration.uri.user } ,
                    reply : replySpy ,
                    toTag : 'tag' };
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
                    hasHeader: jasmine.createSpy("hasHeader"),
                    reply : replySpy ,
                    toTag : 'tag' };
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
                    toTag : 'tag' };
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
                    fromTag : 'tag' };
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
                    hasHeader: jasmine.createSpy("hasHeader"),
                    reply : replySpy ,
                    toTag : 'tag' };
      UA.receiveRequest(request);
      expect(UA.findDialog).toHaveBeenCalledWith(request);
      expect(UA.findEarlySubscription).toHaveBeenCalledWith(request);
      expect(UA.findSession).toHaveBeenCalledWith(request);
      expect(replySpy).toHaveBeenCalledWith(481,'Subscription does not exist');
    });

    it('replies with a 481 if an in dialog request is received that is not a NOTIFY OR ACK and no dialog is found', function() {
      UA.findDialog = jasmine.createSpy('findDialog').and.callFake(function() {
        return false;
      });
      var request = { method : SIP.C.INVITE ,
                    ruri : { user : UA.configuration.uri.user } ,
                    reply : replySpy ,
                    toTag : 'tag' };
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
                    toTag : 'tag' };
      UA.receiveRequest(request);
      expect(UA.findDialog).toHaveBeenCalledWith(request);
      expect(replySpy).not.toHaveBeenCalled();
    });
  });

  describe('.findSession', function() {
    var request;

    beforeEach(function() {
      request = { callId : 'callId' ,
                  fromTag : 'from' };
    });

    it('returns the session based on the callId and fromTag', function() {
      UA.sessions[request.callId + request.fromTag] = 'session';
      expect(UA.findSession(request)).toBe(UA.sessions[request.callId + request.fromTag]);
      delete UA.sessions[request.callId + request.fromTag];
    });
    it('returns the session based on the callId and toTag', function() {
      UA.sessions[request.callId + request.toTag] = 'session';
      expect(UA.findSession(request)).toBe(UA.sessions[request.callId + request.toTag]);
      delete UA.sessions[request.callId + request.toTag];
    });
    it('returns undefined if the session is not found', function() {
      expect(UA.findSession(request)).toBe(undefined);
    });
  });

  describe('.findDialog', function() {
    var request;

    beforeEach(function() {
      request = { callId : 'callId' ,
                  fromTag : 'from' ,
                  toTag : 'to' };
    });

    it('returns the dialog based on the callId and fromTag and toTag', function() {
      UA.dialogs[request.callId + request.fromTag + request.toTag] = 'dialog';
      expect(UA.findDialog(request)).toBe(UA.dialogs[request.callId + request.fromTag + request.toTag]);
    });
    it('returns the dialog based on the callId and toTag and fromTag', function() {
      UA.dialogs[request.callId + request.toTag + request.fromTag] = 'dialog';
      expect(UA.findDialog(request)).toBe(UA.dialogs[request.callId + request.toTag + request.fromTag]);
    });
    it('returns undefined if the session is not found', function() {
      expect(UA.findSession(request)).toBe(undefined);
    });
  });

  xdescribe('.closeSessionsOnTransportError', function() {
    it('calls onTransportError for all the sessions in the sessions object', function() {
      var session = jasmine.createSpyObj('session', ['onTransportError', 'terminate']);
      UA.sessions[session] = session;

      UA.closeSessionsOnTransportError();

      expect(UA.sessions[session].onTransportError).toHaveBeenCalled();
    });

    it('calls onTransportClosed on register context', function() {
      spyOn(UA.registerContext, 'onTransportClosed');
      UA.closeSessionsOnTransportError();

      expect(UA.registerContext.onTransportClosed).toHaveBeenCalled();
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

      expect(UA.configuration.password).toBeUndefined();

      //registrarServer is set to undefined here, then switched later in the function if it wasn't passed in

      expect(UA.configuration.userAgentString).toBe(SIP.C.USER_AGENT);

      //defaults to 60, then multiplies by 1000 later in the function
      expect(UA.configuration.noAnswerTimeout).toBe(60000);

      expect(UA.configuration.hackViaTcp).toBe(false);
      expect(UA.configuration.hackIpInContact).toBe(false);

      expect(UA.configuration.autostart).toBe(true);

      expect(UA.configuration.rel100).toBe(SIP.C.supported.UNSUPPORTED);
      expect(UA.configuration.replaces).toBe(SIP.C.supported.UNSUPPORTED);
      expect(UA.configuration.allowLegacyNotifications).toBe(false);

      expect(UA.configuration.dtmfType).toBe(SIP.C.dtmfType.INFO);

      expect(UA.configuration.transportOptions).toBeDefined();
    });

    it('throws a configuration error when a mandatory parameter is missing', function() {
      spyOn(UA, 'getConfigurationCheck').and.returnValue({mandatory: { fake: function () {return;} }});

      expect(function(){UA.loadConfig({});}).toThrowError('Missing parameter: fake');
    });

    it('throws a configuration error if a mandatory parameter\'s passed-in value is invalid', function() {
      spyOn(UA, 'getConfigurationCheck').and.returnValue({mandatory: { fake: function () {return;} }});

      expect(function(){UA.loadConfig({fake: 'fake'});}).toThrowError("Invalid value \"fake\" for parameter 'fake'");
    });

    it('sets a mandatory value successfully in settings', function() {
      spyOn(UA, 'getConfigurationCheck').and.returnValue({mandatory: { fake: function () {return 'fake';} }});

      UA.loadConfig({fake: 'fake'});

      expect(UA.logger.log).toHaveBeenCalledWith('· fake: "fake"');
    });

    it('throws a ConfigurationError if an optional value is passed in which is invalid', function() {
      spyOn(UA, 'getConfigurationCheck').and.returnValue({optional: { fake: function () {return;} }});

      expect(function(){UA.loadConfig({fake: 'fake'});}).toThrowError("Invalid value \"fake\" for parameter 'fake'");
    });

    it('sets an optional value successfully in settings', function() {
      spyOn(UA, 'getConfigurationCheck').and.returnValue({optional: { fake: function () {return 'fake';} }});

      UA.loadConfig({fake: 'fake'});

      expect(UA.logger.log).toHaveBeenCalledWith('· fake: "fake"');
    });

    it('allows 0 to be passed as a display name', function() {
      UA.loadConfig({displayName: 0});

      expect(UA.configuration.displayName).toBe('0');
    });

    it('sets auth user to uri user if auth user is not passed in', function() {
      UA.loadConfig({uri: 'james@onsnip.onsip.com'});

      expect(UA.configuration.authorizationUser).toBe(UA.configuration.uri.user);
    });

    it('uses Math.floor for viaHost if hackIpInContact is set to true', function() {
      spyOn(Math, 'floor').and.callThrough();

      UA.loadConfig({hackIpInContact: true});

      expect(Math.floor).toHaveBeenCalled();
    });

    it('creates the contact object', function() {
      UA.loadConfig({});

      expect(UA.contact.tempGruu).toBeUndefined();
      expect(UA.contact.pubGruu).toBeUndefined();
      expect(UA.contact.uri).toBeDefined();
      expect(UA.contact.toString).toBeDefined();
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
