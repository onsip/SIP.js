describe('UA', function() {
  var UA;
  var uri;

  beforeEach(function() {
    uri = 'alice@example.com';
    ws_servers = 'ws://server.example.com';
    registrar_server = 'registrar.example.com';
    configuration = {uri : uri,
                     ws_servers : ws_servers };

    spyOn(SIP, 'RegisterContext').andReturn({
      on: jasmine.createSpy('on'),
      register: jasmine.createSpy('register'),
      unregister: jasmine.createSpy('unregister'),
      registered: true,
      close: jasmine.createSpy('close'),
      onTransportClosed: jasmine.createSpy('onTransportClosed')
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
    expect(myUA.configuration.ws_servers).toEqual([{
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
    expect(myUA.configuration.ws_servers).toEqual([{
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
    expect(myUA.configuration.ws_servers).toEqual([{
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
  });

  it('creates a new register context', function() {
    UA = undefined;

    SIP.RegisterContext.reset();

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
      UA.getNextWsServer = jasmine.createSpy('getNextWsServer').andCallFake(function() {
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

    it('logs if the status is set to ready', function() {
      UA.status = SIP.UA.C.STATUS_READY;
      UA.start();
      expect(UA.logger.log).toHaveBeenCalled();
    });

    it('logs an error if the status is not C.STATUS_INIT, C.STATUS_USER_CLOSED, C.STATUS_READY', function() {
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
      UA.status = 2;

      expect(UA.stop()).toBe(UA);
      expect(UA.logger.warn).toHaveBeenCalledWith('UA already closed');
    });

    it('clears the transportRecoveryTimer', function() {
      spyOn(window, 'clearTimeout');

      UA.stop();

      expect(window.clearTimeout).toHaveBeenCalledWith(UA.transportRecoveryTimer);
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
      spyOn(UA, 'off');

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
      expect(UA.off).toHaveBeenCalled();
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

      messageSpy = jasmine.createSpy('message').andReturn('Message Client Context Message');

      spyOn(SIP, 'MessageClientContext').andReturn({
        message: messageSpy
      });

    });

    it('passes no options to message.message', function () {
      options = undefined;
      UA.message(target, body, options);
      expect(messageSpy).toHaveBeenCalledWith();
    });

    it('creates a MessageClientContext with itself, target, body, options.contentType and options as parameters', function() {
      options = {contentType : 'mixedContent' };

      UA.message(target, body, options);
      expect(SIP.MessageClientContext).toHaveBeenCalledWith(UA, target, body, options.contentType, options);
    });

    it('calls MessageClientContext.message method with no options provided to it', function() {
      options = { option : 'config' };

      UA.message(target, body, options);
      expect(messageSpy).toHaveBeenCalledWith();
    });

    it('returns the result of calling the message context message method', function() {
      var options = {};
      expect(UA.message(target, body, options)).toEqual('Message Client Context Message');
    });
  });

  describe('.invite', function() {
    var inviteSpy;
    var target;

    beforeEach(function() {
      target = 'target';
      inviteSpy = jasmine.createSpy('invite').andReturn('Invite Client Context Invite');

      spyOn(SIP, 'InviteClientContext').andReturn({
        invite: inviteSpy
      });
    });

    it('creates an Invite Client Context with itself, target, and options as parameters', function() {
      var options = {};
      UA.invite(target,options);
      expect(SIP.InviteClientContext).toHaveBeenCalledWith(UA,target,options);
    });

    it('calls the Invite Client Context invite method with no arguments', function() {
      var options = { option : 'things' };
      UA.invite(target,options);
      expect(inviteSpy).toHaveBeenCalledWith();
    });

    it('returns the result of calling the invite context invite mehtod', function() {
      var options = { option : 'things' };
      expect(UA.invite(target,options)).toEqual('Invite Client Context Invite');
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

      requestSpy = jasmine.createSpy('send').andReturn('Client Context Send');

      spyOn(SIP, 'ClientContext').andReturn({
        send: requestSpy
      });
    });

    it('creates a ClientContext with itself, the method, target and options provided', function() {
      UA.request(method,target,options);
      expect(SIP.ClientContext).toHaveBeenCalledWith(UA, method, target, options);
    });

    it('calls ClientContext.send method with no parameters', function() {
      UA.request(method,target,options);
      expect(requestSpy).toHaveBeenCalledWith();
    });

    it('returns the result of calling ClientContext.send method', function() {
      expect(UA.request(method,target,options)).toEqual('Client Context Send');
    });
  });

  describe('.normalizeTarget', function() {
    beforeEach(function() {
      spyOn(SIP.Utils, 'normalizeTarget').andReturn('Normalize Target');
    });

    it('calls SIP.Utils.normalizeTarget with the target and the hostport params', function() {
      var target = 'target';
      UA.normalizeTarget(target);
      expect(SIP.Utils.normalizeTarget).toHaveBeenCalledWith(target, UA.configuration.hostport_params);
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
      spyOn(UA.log, 'getLogger').andReturn('logger');
      var category = 'category';
      var label = 'label';
      expect(UA.getLogger(category,label)).toEqual('logger');
      expect(UA.log.getLogger).toHaveBeenCalledWith(category, label);
    });
  });

  xdescribe('.onTransportClosed', function() {

  });

  xdescribe('.onTransportError', function() {

  });

  xdescribe('.onTransportConnected', function() {

  });

  describe('.onTransportConnecting', function() {
    it('emits a connecting event', function() {
      var callback = jasmine.createSpy('callback');
      UA.on('connecting', callback);
      var transport = 'transport';
      var attempts = 'attempts';
      UA.onTransportConnecting(transport,attempts);
      expect(callback.calls[0].args[0]).toEqual( { transport : 'transport', attempts : 'attempts' } );
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
      expect(callback.calls[0].args[0]).toEqual( { transaction : { type : 'transaction-type', id : 'id' } } );
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
      expect(callback.calls[0].args[0]).toEqual({ transaction : { type : 'transaction-type', id : 'id' } });
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

      spyOn(SIP.Transactions, 'checkTransaction').andReturn(false);
      spyOn(SIP.Transactions, 'NonInviteServerTransaction').andReturn(true);
      spyOn(SIP, 'MessageServerContext').andReturn(true);
      spyOn(SIP, 'ServerContext').andReturn({
        on: function() {return true;}
      });
      spyOn(SIP, 'InviteServerContext').andReturn(true);
      spyOn(SIP.Transactions, 'InviteServerTransaction').andReturn(true);
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
      expect(replySpy).toHaveBeenCalledWith(200,null,[ 'Allow: ACK,CANCEL,BYE,OPTIONS', 'Accept: application/sdp,application/dtmf-relay' ])
    });

    it('checks if there is a listener when the SIP method is message and reject if no listener is found', function() {
      var request = { method : SIP.C.MESSAGE ,
                      ruri : { user : UA.configuration.uri.user } ,
                      reply : replySpy };
      UA.checkListener = jasmine.createSpy('checkListener').andCallFake(function() {
        return false;
      });
      expect(UA.receiveRequest(request)).toBeUndefined();
      expect(UA.checkListener).toHaveBeenCalledWith(request.method.toLowerCase());
      expect(SIP.Transactions.NonInviteServerTransaction).toHaveBeenCalledWith(request,UA);
      expect(replySpy).toHaveBeenCalledWith(405, null, [ 'Allow: ACK,CANCEL,BYE,OPTIONS' ]);
    });

    it('checks if there is a listener when the SIP method is message and accept if listener is found', function() {
      var callback = jasmine.createSpy('callback').andCallFake(function() {
        return true;
      });
      var request = { method : SIP.C.MESSAGE ,
                      ruri : { user : UA.configuration.uri.user } ,
                      reply : replySpy };
      UA.checkListener = jasmine.createSpy('checkListener').andCallFake(function() {
        return true;
      });
      UA.on('message',callback);

      UA.receiveRequest(request);

      expect(SIP.MessageServerContext).toHaveBeenCalledWith(UA, request);
      expect(replySpy).toHaveBeenCalledWith(200,null);
      expect(callback).toHaveBeenCalled();
    });

    xit('creates a ServerContext if the SIP method is anything besides options, message, invite, and ack', function() {
      var request = { method : 'method' ,
                      ruri : { user : UA.configuration.uri.user },
                      reply : replySpy };
      UA.receiveRequest(request);
    });

    it('creates an invite server context and emit invite if the message is of type INVITE', function() {
      var request = { method : SIP.C.INVITE ,
                      ruri : { user: UA.configuration.uri.user } ,
                      reply : replySpy };
      var callback = jasmine.createSpy('callback');
      UA.on('invite',callback);
      UA.receiveRequest(request);
      expect(callback).toHaveBeenCalledWith({});
    });

    it('sends a 488 if an invite is received but there is no WebRTC support', function() {
      var request = { method : SIP.C.INVITE ,
                      ruri : { user: UA.configuration.uri.user } ,
                      reply : replySpy };
      var webrtc = SIP.WebRTC.isSupported;
      SIP.WebRTC.isSupported = false;

      UA.receiveRequest(request);
      expect(replySpy).toHaveBeenCalledWith(488);

      SIP.WebRTC.isSupported = webrtc;
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
      spyOn(UA, 'findSession').andReturn({receiveRequest : receiveRequestSpy });
      var request = { method : SIP.C.CANCEL ,
                    ruri : { user : UA.configuration.uri.user } ,
                    reply : replySpy };
      UA.receiveRequest(request);
      expect(UA.findSession).toHaveBeenCalledWith(request);
      expect(receiveRequestSpy).toHaveBeenCalledWith(request);
    });

    it('logs a warning if the session does not exist if a CANCEL is a received', function() {
      spyOn(UA, 'findSession').andReturn(false);
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

    it('replies with a 405 if it cannot interpret the message', function() {
      var request = { method : 'unknown method' ,
                    ruri : { user : UA.configuration.uri.user } ,
                    reply : replySpy };
      UA.receiveRequest(request);
      expect(replySpy).toHaveBeenCalledWith(405);
    });

    it('creates a new Invite Server Transaction and call receive request if it receives an in dialog invite request', function() {
      var receiveRequest = jasmine.createSpy('receiveRequest').andCallFake(function() {
        return 'Receive Request';
      });
      UA.findDialog = jasmine.createSpy('findDialog').andCallFake(function() {
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
      var receiveRequest = jasmine.createSpy('receiveRequest').andCallFake(function() {
        return 'Receive Request';
      });
      UA.findDialog = jasmine.createSpy('findDialog').andCallFake(function() {
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
      UA.findDialog = jasmine.createSpy('findDialog').andCallFake(function() {
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
      var receiveRequest = jasmine.createSpy('dialogReceiveRequest').andCallFake(function() {
        return 'Receive Request';
      });
      UA.findDialog = jasmine.createSpy('findDialog').andCallFake(function() {
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

    it('calls receive response on the session if it exists and the dialog does not for an in dialog notify request', function() {
      UA.findDialog = jasmine.createSpy('findDialog').andCallFake(function() {
        return false;
      });
      var receiveRequest = jasmine.createSpy('receiveRequest').andCallFake(function() {
        return 'Receive Request';
      });
      UA.findSession = jasmine.createSpy('findSession').andCallFake(function() {
        return {receiveRequest : receiveRequest};
      });
      var request = { method : SIP.C.NOTIFY ,
                    ruri : { user : UA.configuration.uri.user } ,
                    reply : replySpy ,
                    to_tag : 'tag' };
      UA.receiveRequest(request);
      expect(UA.findDialog).toHaveBeenCalledWith(request);
      expect(UA.findSession).toHaveBeenCalledWith(request);
      expect(receiveRequest).toHaveBeenCalledWith(request);
    });

    it('replies with a 481 and subscription does not exist if an in dialog notify request is received and no dialog or session is found', function() {
      UA.findDialog = jasmine.createSpy('findDialog').andCallFake(function() {
        return false;
      });
      UA.findSession = jasmine.createSpy('findSession').andCallFake(function() {
        return false;
      });
      var request = { method : SIP.C.NOTIFY ,
                    ruri : { user : UA.configuration.uri.user } ,
                    reply : replySpy ,
                    to_tag : 'tag' };
      UA.receiveRequest(request);
      expect(UA.findDialog).toHaveBeenCalledWith(request);
      expect(UA.findSession).toHaveBeenCalledWith(request);
      expect(replySpy).toHaveBeenCalledWith(481,'Subscription does not exist');
    });

    it ('replies with a 481 if an in dialog request is received that is not a NOTIFY OR ACK and no dialog is found', function() {
      UA.findDialog = jasmine.createSpy('findDialog').andCallFake(function() {
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
      UA.findDialog = jasmine.createSpy('findDialog').andCallFake(function() {
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

      //Note: can't just set ws_servers at this point
      UA.configuration = {ws_servers: [can1,can2,can3,can4]};
    });

    it('selects the candidate with the highest weight', function() {
      expect(UA.getNextWsServer()).toBe(can4);
    });

    it('selects one of the candidates with the highest weight', function() {
      can4.weight = 0;

      spyOn(Math, 'random').andReturn(0.9);

      expect(UA.getNextWsServer()).toBe(can3);

      Math.random.andReturn(0.4);

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
      spyOn(Math, 'random').andReturn(0);
    });

    it('logs if the next retry time exceeds the max_interval', function(){
      UA.configuration = {ws_servers: [{status:1, weight: 0}], connection_recovery_min_interval: 1, connection_recovery_max_interval: -1};

      UA.recoverTransport(UA);

      expect(UA.logger.log).toHaveBeenCalledWith('time for next connection attempt exceeds connection_recovery_max_interval, resetting counter');
    });

    it('calls getNextWsServer', function() {
      spyOn(UA, 'getNextWsServer').andCallThrough();

      UA.recoverTransport(UA);

      expect(UA.getNextWsServer).toHaveBeenCalled();
    });

    it('sets the transportRecoveryTimer', function() {
      expect(UA.transportRecoveryTimer).toBeNull();
      
      UA.recoverTransport(UA);

      expect(UA.transportRecoveryTimer).toBeDefined();
    });

    it('logs before setting the transport recovery timer, then attempts to make a new transport', function() {
      spyOn(SIP, 'Transport');
      SIP.Transport.C = {STATUS_READY: 0, STATUS_DISCONNECTED: 1, STATUS_ERROR: 2};

      UA.configuration = {ws_servers: [{status:0, weight: 0}], connection_recovery_min_interval: 1, connection_recovery_max_interval: 7};
      UA.transportRecoverAttempts = 0;

      UA.recoverTransport(UA);

      expect(UA.logger.log).toHaveBeenCalledWith('next connection attempt in 1 seconds');

      waitsFor(function() {
        return UA.transportRecoverAttempts === 1;
      }, 'transportRecoveryTimer must fire', 1100);

      runs(function() {
        expect(SIP.Transport).toHaveBeenCalled();
      });
    })
  });

  describe('.loadConfig', function() {
    beforeEach(function() {
      UA.configuration = {};
    });

    it('sets default settings for many parameters', function() {
      UA.loadConfig({});

      expect(UA.configuration.via_host).toBeDefined();

      expect(UA.configuration.uri).toBeDefined();
      expect(UA.configuration.ws_servers).toEqual([{scheme: 'WSS', sip_uri: '<sip:edge.sip.onsip.com;transport=ws;lr>', status: 0, weight: 0, ws_uri: 'wss://edge.sip.onsip.com'}]);

      expect(UA.configuration.password).toBeNull();

      expect(UA.configuration.register_expires).toBe(600);
      expect(UA.configuration.register_min_expires).toBe(120);
      expect(UA.configuration.register).toBe(true);
      //registrar_server is set to null here, then switched later in the function if it wasn't passed in

      expect(UA.configuration.ws_server_max_reconnection).toBe(3);
      expect(UA.configuration.ws_server_reconnection_timeout).toBe(4);

      expect(UA.configuration.connection_recovery_min_interval).toBe(2);
      expect(UA.configuration.connection_recovery_max_interval).toBe(30);

      expect(UA.configuration.use_preloaded_route).toBe(false);

      //defaults to 60, then multiplies by 1000 later in the function
      expect(UA.configuration.no_answer_timeout).toBe(60000);
      expect(UA.configuration.stun_servers).toEqual(['stun:stun.l.google.com:19302']);
      expect(UA.configuration.turn_servers).toEqual([]);

      expect(UA.configuration.trace_sip).toBe(false);

      expect(UA.configuration.hack_via_tcp).toBe(false);
      expect(UA.configuration.hack_ip_in_contact).toBe(false);

      expect(UA.configuration.reliable).toBe('none');
    });

    it('throws a configuration error when a mandatory parameter is missing', function() {
      SIP.UA.configuration_check.mandatory.fake = function(value) {return;};

      expect(function(){UA.loadConfig({});}).toThrow('Missing parameter: fake');

      delete SIP.UA.configuration_check.mandatory.fake;
    });

    it('throws a configuration error if a mandatory parameter\'s passed-in value is invalid', function() {
      SIP.UA.configuration_check.mandatory.fake = function(value) {return;};

      expect(function(){UA.loadConfig({fake: 'fake'});}).toThrow('Invalid value "fake" for parameter "fake"');

      delete SIP.UA.configuration_check.mandatory.fake;
    });

    it('sets a mandatory value successfully in settings', function() {
      SIP.UA.configuration_check.mandatory.fake = function(value) {return 'fake';};
      SIP.UA.configuration_skeleton.fake = {value: '', writable: false, configurable: false};

      UA.loadConfig({fake: 'fake'});

      expect(UA.logger.log).toHaveBeenCalledWith('· fake: "fake"');

      delete SIP.UA.configuration_skeleton.fake;
      delete SIP.UA.configuration_check.mandatory.fake;
    });

    it('throws a ConfigurationError if an optional value is passed in which is invalid', function() {
      SIP.UA.configuration_check.optional.fake = function(value) {return;};

      expect(function(){UA.loadConfig({fake: 'fake'});}).toThrow('Invalid value "fake" for parameter "fake"');

      delete SIP.UA.configuration_check.optional.fake;
    });

    it('sets an optional value successfully in settings', function() {
      SIP.UA.configuration_check.optional.fake = function(value) {return 'fake';};
      SIP.UA.configuration_skeleton.fake = {value: '', writable: false, configurable: false};

      UA.loadConfig({fake: 'fake'});

      expect(UA.logger.log).toHaveBeenCalledWith('· fake: "fake"');

      delete SIP.UA.configuration_skeleton.fake;
      delete SIP.UA.configuration_check.optional.fake;
    });

    it('makes sure the connection recovery max interval is greater than the min interval', function() {
      expect(function(){UA.loadConfig({connection_recovery_max_interval: 1, connection_recovery_min_interval: 2});}).toThrow('Invalid value 1 for parameter "connection_recovery_max_interval"');
    });

    it('allows 0 to be passed as a display name', function() {
      UA.loadConfig({display_name: 0});

      expect(UA.configuration.display_name).toBe('0');
    });

    it('sets an instance_id if one is not passed in also sets jssip_id', function() {
      UA.loadConfig({});

      expect(UA.configuration.instance_id).toBeDefined();

      expect(UA.configuration.jssip_id).toBeDefined();
      expect(UA.configuration.jssip_id.length).toBe(5);
    });

    it('sets auth user to uri user if auth user is not passed in', function() {
      UA.loadConfig({uri: 'james@onsnip.onsip.com'});

      expect(UA.configuration.authorization_user).toBe(UA.configuration.uri.user);
    });

    it('sets the registrar_server to the uri (without user) if it is not passed in', function() {
      UA.loadConfig({uri: 'james@onsnip.onsip.com'});

      var reg = UA.configuration.uri.clone();
      reg.user = null;

      expect(UA.configuration.registrar_server).toEqual(reg);
    });

    it('uses getRandomTestNetIP for via_host if hack_ip_in_contact is set to true', function() {
      spyOn(SIP.Utils, 'getRandomTestNetIP').andCallThrough();

      UA.loadConfig({hack_ip_in_contact: true});

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
  });

  describe('.configuration_skeleton', function() {
    var skel;
    beforeEach(function() {
      skel = SIP.UA.configuration_skeleton;
    });

    it('sets all parameters (except register) as writable/configurable false', function() {
      expect(skel['uri']).toBeDefined();
      expect(skel['uri'].value).toBe('');
      expect(skel['uri'].writable).toBe(false);
      expect(skel['uri'].configurable).toBe(false);
    });

    it('sets all the register parameter as writable true, configurable false', function() {
      expect(skel['register']).toBeDefined();
      expect(skel['register'].value).toBe('');
      expect(skel['register'].writable).toBe(true);
      expect(skel['register'].configurable).toBe(false);
    });
  });

  describe('.configuration_check', function() {
    //I could've made another describe for optional, but they are all under that
    describe('.uri', function() {
      it('fails if nothing is passed in', function() {
        expect(SIP.UA.configuration_check.optional.uri()).toBeUndefined();
      });

      it('fails if there is no user', function() {
        expect(SIP.UA.configuration_check.optional.uri('@example.com')).toBeUndefined();
      });

      it('passes if there is a correctly parsed uri', function() {
        expect(SIP.UA.configuration_check.optional.uri('alice@example.com')).toBeDefined();
      });
    });

    xdescribe('.ws_servers', function() {
      it('fails for types that are not string or array (of strings or objects', function() {
        expect(SIP.UA.configuration_check.optional.ws_servers(7)).toBeUndefined();
      });

      it('fails for an empty array', function() {
        //NOTE: this is the only case that false is returned (instead of nothing)
        expect(SIP.UA.configuration_check.optional.ws_servers([])).toBe(false);
      });

      //From here on, there is logger errors, but because of how this testing works,
      //there is no logger, so catching the error for the logger counts as failure
      it('fails if ws_uri attribute is missing', function() {
        expect(function(){SIP.UA.configuration_check.optional.ws_servers([{sandwich: 'ham'}]);}).toThrow('Cannot call method \'error\' of undefined');
      });

      it('fails if weight attribute is not a number', function() {
        expect(function(){SIP.UA.configuration_check.optional.ws_servers([{ws_uri: 'ham', weight: 'scissors'}]);}).toThrow('Cannot call method \'error\' of undefined');
      });

      it('fails if the ws_uri is invalid', function() {
        expect(function(){SIP.UA.configuration_check.optional.ws_servers([{ws_uri: 'ham'}]);}).toThrow('Cannot call method \'error\' of undefined');
      });

      it('fails if the url scheme is not wss or ws', function() {
        expect(function(){SIP.UA.configuration_check.optional.ws_servers([{ws_uri: 'ithoughtthiswasright://alice@example.com'}]);}).toThrow('Cannot call method \'error\' of undefined');
      });

      it('returns correctly if none of the above is wrong', function() {
        expect(SIP.UA.configuration_check.optional.ws_servers([{ws_uri: 'wss://edge.sip.onsip.com'}])).toEqual([{ws_uri: 'wss://edge.sip.onsip.com', sip_uri:'<sip:edge.sip.onsip.com;transport=ws;lr>', weight: 0, status: 0, scheme: 'WSS'}]);
        expect(SIP.UA.configuration_check.optional.ws_servers("wss://edge.sip.onsip.com")).toEqual([{ws_uri: 'wss://edge.sip.onsip.com', sip_uri:'<sip:edge.sip.onsip.com;transport=ws;lr>', weight: 0, status: 0, scheme: 'WSS'}]);
      });
    });

    describe('.authorization_user', function() {
      it('fails if a type besides a string is passed in', function() {
        expect(SIP.UA.configuration_check.optional.authorization_user()).toBeUndefined();
      });
    });

    describe('.connection_recovery_max_interval', function() {

    });

    describe('.connection_recovery_min_interval', function() {

    });

    describe('.display_name', function() {

    });

    describe('.hack_via_tcp', function() {

    });

    describe('.hack_ip_in_contact', function() {

    });

    describe('.instance_id', function() {

    });

    describe('.no_answer_timeout', function() {

    });

    describe('.password', function() {

    });

    describe('.reliable', function() {

    });

    describe('.register', function() {

    });

    describe('.register_expires', function() {

    });

    describe('.registrar_server', function() {

    });

    describe('.stun_servers', function() {

    });

    describe('.trace_sip', function() {

    });

    describe('.turn_servers', function() {
      
    });

    describe('.use_preloaded_route', function() {

    });
  });
});
