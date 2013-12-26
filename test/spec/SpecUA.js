describe('UA', function() {
  var UA;
  var uri;
  var saveUA = {};
  var registerContextRegister;
  var registerContextUnregister;
  var registerContextOn;
    
  beforeEach(function() {
    uri = 'alice@example.com';
    ws_servers = 'server.example.com';
    registrar_server = 'registrar.example.com';
    configuration = {uri : uri ,
                      ws_servers : ws_servers };
    
    saveUA.sipGrammarParse = SIP.Grammar.parse;
    
    SIP.Grammar.parse = jasmine.createSpy('Parse').andCallFake(function() {
      return { user : 'alice' , scheme : 'ws', clone: function() {return 'clone'; } };
    });
    
    saveUA.sipRegisterContext = SIP.RegisterContext;
  
    registerContextOn = jasmine.createSpy('on').andCallFake(function() { return 'on'; });
    registerContextRegister = jasmine.createSpy('register').andCallFake(function() { return 'register'; });
    registerContextUnregister = jasmine.createSpy('unregister').andCallFake(function() { return 'unregister'; });
    SIP.RegisterContext = jasmine.createSpy('RegisterContext').andCallFake(function() {
      return {  on : registerContextOn , 
                register : registerContextRegister , 
                unregister: registerContextUnregister,
                registered : true 
              }; 
    });
    
    UA = new SIP.UA(configuration);
    
    UA.logger = jasmine.createSpy('logger').andCallFake(function() {
      return 'logger';
    });
    
    UA.logger.log = jasmine.createSpy('log').andCallFake(function() {
      return 'log';
    });
    
    UA.logger.error = jasmine.createSpy('error').andCallFake(function() {
      return 'error';
    });
    
    UA.logger.warn = jasmine.createSpy('warn').andCallFake(function() {
      return 'warn';
    });
  });
  
  afterEach(function() {
    SIP.Grammar.parse = saveUA.sipGrammarParse;
    SIP.RegisterContext = saveUA.sipRegisterContext;
  });
    
  describe('when registering', function() {
    var options;
    
    beforeEach(function() {
      options = 'options';
    });
    
    it('should set the register configuration option to true', function() {
      UA.configuration.register = false;
      UA.register(options)
      expect(UA.configuration.register).toBeTruthy();
    });
    
    it('should call the Register Context register method with the options that were passed to the method', function() {
      UA.register(options);
      expect(registerContextRegister).toHaveBeenCalledWith(options);
    });
    
    it('should return itself', function() {
      expect(UA.register(options)).toBe(UA);
    });
  });
  
  describe('when unregistering', function() {
    var options;
    
    beforeEach(function() {
      options = 'options';
    });
    
    it('should set the register configuration option to false', function() {
      UA.configuration.register = true;
      UA.unregister(options);
      expect(UA.configuration.register).toBeFalsy();
    });
    
    it('should call the Register Context unregister method with the options that were passed to the method', function() {
      UA.unregister(options);
      expect(registerContextUnregister).toHaveBeenCalledWith(options);
    });
    
    it('should return itself', function() {
      expect(UA.unregister(options)).toBe(UA);
    });
  });
  
  describe('when checking if registered', function() {
    it('should return the value stored by register context registered', function() {
      expect(UA.isRegistered()).toBe(true);
    });
  });
  
  describe('when checking if connected', function() {
    it('if transport is undefined, should return false', function() {
      UA.transport = undefined;
      expect(UA.isConnected()).toBeFalsy();
    });
    it('if transport is defined, should return transport connected property', function() {
      UA.transport = {};
      UA.transport.connected = true;
      expect(UA.isConnected()).toBeTruthy();
      UA.transport.connected = false;
      expect(UA.isConnected()).toBeFalsy();     
    });
  });
  
  describe('when sending an invite', function() {
    var inviteClientContextInvite;
    var target; 
    
    beforeEach(function() {
      target = 'target';
      
      saveUA.sipInviteClientContext = SIP.InviteClientContext;
      inviteClientContextInvite = jasmine.createSpy('inviteClientContextInvite').andCallFake(function() {
        return 'Invite Client Context Invite';
      });

      SIP.InviteClientContext = jasmine.createSpy('inviteClientContext').andCallFake(function() {
        return {invite : inviteClientContextInvite} ;
      });
    });
    
    afterEach(function() {
      SIP.InviteClientContext = saveUA.sipInviteClientContext;
    });
    
    it('should create an Invite Client Context with itself and target as parameters', function() {
      var options = {};
      UA.invite(target,options);
      expect(SIP.InviteClientContext).toHaveBeenCalledWith(UA,target);
    });
    
    it('should call the Invite Client Context invite method with the options provided to it', function() {
      var options = { option : 'things' };
      UA.invite(target,options);
      expect(inviteClientContextInvite).toHaveBeenCalledWith(options);
    });
    
    it('should return the result of calling the invite context invite mehtod', function() {
      var options = { option : 'things' };
      expect(UA.invite(target,options)).toEqual('Invite Client Context Invite');
    });
  });
  
  describe('when sending a message', function() {
    var messageClientContextMessage;
    var target;
    var body;
    var options;
    
    beforeEach(function() {
      target = 'target';
      body = 'body';
      
      saveUA.sipMessageClientContext = SIP.MessageClientContext;
      messageClientContextMessage = jasmine.createSpy('messageClientContextMessage').andCallFake(function() {
        return 'Message Client Context Message';
      });

      SIP.MessageClientContext = jasmine.createSpy('messageClientContext').andCallFake(function() {
        return {message : messageClientContextMessage} ; 
      });
    });
    
    afterEach(function() {
      SIP.MessageClientContext = saveUA.sipMessageClientContext;
    });
    
    it('should default the options to an empty object if no options are provided', function() {
      options = undefined;
      UA.message(target, body, options);
      expect(messageClientContextMessage).toHaveBeenCalledWith({});
    });
    
    it('should create a Message Client Context with itself, target, body, and options.contentType as parameters', function() {
      options = {contentType : 'mixedContent' };
      
      UA.message(target, body, options);
      expect(SIP.MessageClientContext).toHaveBeenCalledWith(UA, target, body, options.contentType);
    });
    
    it('should call the Message Client Context message method with the options provided to it', function() {
      options = { option : 'config' };
      
      UA.message(target, body, options);
      expect(messageClientContextMessage).toHaveBeenCalledWith(options);
    });
    
    it('should return the result of calling the message context message method', function() {
      var options = {};
      expect(UA.message(target, body, options)).toEqual('Message Client Context Message');
    });
  });
  
  describe('when sending a request', function() {
    var method;
    var target;
    var options;
    var clientContextSend;
    
    beforeEach(function() {
      method = 'method';
      target = 'target';
      options = { option : 'someField' };
      saveUA.sipClientContext = SIP.ClientContext;
      clientContextSend = jasmine.createSpy('clientContextSend').andCallFake(function() {
        return 'Client Context Send';
      })
      SIP.ClientContext = jasmine.createSpy('clientContext').andCallFake(function() {
        return { send : clientContextSend };
      });
    });
    
    afterEach(function() {
      SIP.ClientContext = saveUA.sipClientContext;
    });
    
    it('should create a Client Context with the method, target and options provided and itself', function() {
      UA.request(method,target,options);
      expect(SIP.ClientContext).toHaveBeenCalledWith(method, target, options, UA);
    });
    
    it('should call the Client Context send method with no parameters', function() {
      UA.request(method,target,options);
      expect(clientContextSend).toHaveBeenCalledWith();
    });
    
    it('should return the result of calling the Client Context send method', function() {
      expect(UA.request(method,target,options)).toEqual('Client Context Send');
    });
  });
  
  describe('when stopping the UA', function() {
    beforeEach(function() {

    });
    
    afterEach(function() {
     
    });
    
    it('should warn that the ua is already closed if the status is C.STATUS_USER_CLOSED', function() {
      
    });
    
  });
  
  describe('when starting the UA', function() {
    beforeEach(function() {
      saveUA.sipTransport = SIP.Transport;  
      SIP.Transport = jasmine.createSpy('sipTransport').andCallFake(function() {
        return 'Sip Transport';
      });
      SIP.Transport.C = {};
      SIP.Transport.C.STATUS_ERROR = 999;
      
      UA.transport = {};
      UA.transport.connect = jasmine.createSpy('uaTransportConnect');
    });
    
    afterEach(function() {
      SIP.Transport = saveUA.sipTransport;
    });
    
    it('shoud create a SIP transport with itself and the WsServer if the status is C.STATUS_INIT', function() {
      UA.status = SIP.UA.C.STATUS_INIT;
      UA.getNextWsServer = jasmine.createSpy('getNextWsServer').andCallFake(function() {
        return 'ws-server';
      });
      UA.start();
      expect(SIP.Transport).toHaveBeenCalledWith(UA, 'ws-server');
    });
    
    it('should set the status to ready and and connect the transport if the status is C.STATUS_USER_CLOSED', function() {
      UA.status = SIP.UA.C.STATUS_USER_CLOSED;
      UA.start();
      expect(UA.transport.connect).toHaveBeenCalledWith();
    });
    
    it('should log if the status is set to ready', function() {
      UA.status = SIP.UA.C.STATUS_READY;
      UA.start();
      expect(UA.logger.log).toHaveBeenCalled();
    });
    
    it('should log an error if the status is not C.STATUS_INIT, C.STATUS_USER_CLOSED, C.STATUS_READY', function() {
      UA.status = SIP.UA.C.STATUS_NOT_READY;
      UA.start();
      expect(UA.logger.error).toHaveBeenCalled();
    });
    
    it('should return itself', function() {
      expect(UA.start()).toBe(UA);
    });
    
  });
  
  describe('when normalizing a target', function() {
    beforeEach(function() {
      saveUA.sipUtilsNormalizeTarget = SIP.Utils.normalizeTarget;
      SIP.Utils.normalizeTarget = jasmine.createSpy('normalizeTarget').andCallFake(function() {
        return 'Normalize Target';
      });
    });
    
    afterEach(function() {
      SIP.Utils.normalizeTarget = saveUA.sipUtilsNormalizeTarget;
    });
    
    it('should call the sip Utils normalize target with the target and the hostport params', function() {
      var target = 'target';
      UA.normalizeTarget(target);
      expect(SIP.Utils.normalizeTarget).toHaveBeenCalledWith(target, UA.configuration.hostport_params);
    });
    
    it('should return the result of calling SIP.Utils.normalizeTarget', function() {
      expect(UA.normalizeTarget({})).toEqual('Normalize Target');
    });
  });
  
  describe('when saving credentials in the cache', function() {
    it('should create the credentials realm object if it does not exist', function() {
      var credentials = { realm : 'credential realm' ,
                          uri : 'credential uri' };
      expect(UA.cache.credentials[credentials.realm]).toBeUndefined();
      UA.saveCredentials(credentials);
      expect(UA.cache.credentials[credentials.realm]).toBeDefined();
    });
    
    it('should add the credentials uri to the credentials realm', function() {
      var credentials = { realm : 'credential realm' ,
                          uri : 'credential uri' };
      UA.saveCredentials(credentials);
      expect(UA.cache.credentials[credentials.realm][credentials.uri]).toBe(credentials);
    });
    
    it('should return itself', function() {
      var credentials = { realm : 'credential realm' ,
                          uri : 'credential uri' };
      expect(UA.saveCredentials(credentials)).toBe(UA);
    });
  });
  
  describe('when retreving credentials from the cache', function() {
    it('should return undefined if the credentials are not found', function() {
      var request = { ruri : { host : 'ruri host' },
                      method : 'request method' };
      expect(UA.getCredentials(request)).toBeUndefined();
    });
    
    it('should return the credentials that are found', function() {
      var request = { ruri : { host : 'ruri host' },
                      method : 'request method' };
      var credentials = { realm : 'credential realm' ,
                          uri : 'credential uri' };
      UA.cache.credentials[request.ruri.host] = {};
      UA.cache.credentials[request.ruri.host][request.ruri] = credentials;
      expect(UA.getCredentials(request)).toBe(credentials);                      
    });
  });
  
  describe('when getting the logger', function() {
    it('should call the getLogger function with the category and label passed to it and return the result', function() {
      UA.log.getLogger = jasmine.createSpy('getLogger').andCallFake(function() {
        return 'logger';
      });
      var category = 'category';
      var label = 'label';
      expect(UA.getLogger(category,label)).toEqual('logger');
      expect(UA.log.getLogger).toHaveBeenCalledWith(category, label);
    });
  });
  
  describe('when the transport is closed', function() {
    
  });
  
  describe('when there is a transport error', function() {
    
  });
  
  describe('when the transport is connected', function() {
    
  });
  
  describe('when the transport is connecting', function() {
    it('should emit a connecting event', function() {
      var callback = jasmine.createSpy('callback');
      UA.on('connecting', callback);
      var transport = 'transport';
      var attempts = 'attempts';
      UA.onTransportConnecting(transport,attempts);
      expect(callback.calls[0].args[0]).toEqual( { transport : 'transport', attempts : 'attempts' } );
    });
  });
  
  describe('when there is a new transaction', function() {
    var transaction;
    beforeEach(function() {
      transaction = { type : 'transaction-type' ,
                      id : 'id' };
      UA.transactions[transaction.type] = {};
    });
    it('should emit a newTransaction event', function() {
      var callback = jasmine.createSpy('callback');
      UA.on('newTransaction', callback);
      UA.newTransaction(transaction);
      expect(callback.calls[0].args[0]).toEqual( { transaction : { type : 'transaction-type', id : 'id' } } );
    });
    
    it('should add the trasaction to the transactions object', function() {
      UA.transactions[transaction.type] = {};
      expect(UA.transactions[transaction.type][transaction.id]).toBeUndefined();
      UA.newTransaction(transaction);
      expect(UA.transactions[transaction.type][transaction.id]).toBeDefined();
    });
  });
  
  describe('when destroying a transaction', function() {
    var transaction;
    beforeEach(function() {
      transaction = { type : 'transaction-type' ,
                      id : 'id' };
      UA.transactions[transaction.type] = {};
    });
    
    it('should emit a transactionDestroyed event', function() {
      var callback = jasmine.createSpy('callback');
      UA.on('transactionDestroyed', callback);
      UA.newTransaction(transaction);
      expect(callback).not.toHaveBeenCalled();
      UA.destroyTransaction(transaction);
      expect(callback.calls[0].args[0]).toEqual({ transaction : { type : 'transaction-type', id : 'id' } });
    });
    
    it('should delete the transaction from the transactions object', function() {
      UA.newTransaction(transaction);
      expect(UA.transactions[transaction.type][transaction.id]).toBeDefined();
      UA.destroyTransaction(transaction);
      expect(UA.transactions[transaction.type][transaction.id]).toBeUndefined();
    });
  });
  
  describe('when receiving a request', function() {
    var reply;
    var serverContextOn;
    beforeEach(function() {
      saveUA.sipTransactionsCheckTransaction = SIP.Transactions.checkTransaction;
      SIP.Transactions.checkTransaction = jasmine.createSpy('checkTransaction').andCallFake(function() {
        return false;
      });
      
      saveUA.sipTransactionsNonInviteServerTransaction = SIP.Transactions.NonInviteServerTransaction;
      SIP.Transactions.NonInviteServerTransaction = jasmine.createSpy('NIST').andCallFake(function() {
        return true;
      });
      
      saveUA.sipMessageServerContext = SIP.MessageServerContext;
      SIP.MessageServerContext = jasmine.createSpy('MessageServerContext').andCallFake(function() {
        return true;
      });
      
      saveUA.sipServerContext = SIP.ServerContext;
      serverContextOn = jasmine.createSpy('ServerContext.on').andCallFake(function() {
        return true;
      });

      SIP.ServerContext = function() {
      /* jasmine.createSpy('ServerContext').andCallFake(function() { */
        return { on : serverContextOn } ;
      };    
      saveUA.sipInviteServerContext = SIP.InviteServerContext;
      SIP.InviteServerContext = jasmine.createSpy('InviteServerContext').andCallFake(function() {
        return true;
      });
      reply = jasmine.createSpy('reply').andCallFake(function() {
        return true;
      });
      
      saveUA.sipTransactionsInviteServerTransaction = SIP.Transactions.InviteServerTransaction;
      SIP.Transactions.InviteServerTransaction = jasmine.createSpy('InviteServerTransaction').andCallFake(function() {
        return true;
      });
      
      SIP.WebRTC.isSupported = true;
    });
   
    afterEach(function() {
      SIP.Transactions.checkTransaction = saveUA.sipTransactionsCheckTransaction;
      SIP.Transactions.NonInviteServerTransaction = saveUA.sipTransactionsNonInviteServerTransaction;
      SIP.MessageServerContext = saveUA.sipMessageServerContext;
      SIP.InviteServerContext = saveUA.sipInviteServerContext;
      SIP.Transactions.InviteServerTransaction = saveUA.sipTransactionsInviteServerTransaction;
    });
    it('should check that the ruri points to us', function() {
      var reply_sl = jasmine.createSpy('reply_sl');
      var request = { method : SIP.C.ACK ,
                  ruri : { user : 'user' } ,
                  reply_sl : reply_sl };
      expect(UA.receiveRequest(request)).toBeUndefined();
      expect(UA.logger.warn).toHaveBeenCalledWith('Request-URI does not point to us');
      expect(reply_sl).not.toHaveBeenCalled();
    });
    
    it('should reply with a 404 if the request method is not ACK', function() {
      var reply_sl = jasmine.createSpy('reply_sl');
      var request = { method : 'not ACK' ,
                  ruri : { user : 'user' } ,
                  reply_sl : reply_sl };
      expect(UA.receiveRequest(request)).toBeUndefined();
      expect(UA.logger.warn).toHaveBeenCalledWith('Request-URI does not point to us');
      expect(reply_sl).toHaveBeenCalledWith(404);
    });
    
    it('should check the transaction and return if invalid', function() {
      var request = { method : SIP.C.ACK ,
                      ruri : { user : UA.configuration.uri.user} };
      SIP.Transactions.checkTransaction = jasmine.createSpy('checkTransaction').andCallFake(function() {
        return true;
      });
      expect(UA.receiveRequest(request)).toBeUndefined();
      expect(SIP.Transactions.checkTransaction).toHaveBeenCalledWith(UA, request);
    });
    
    it('should create a new NIST if the SIP method is options', function() {
      var request = { method : SIP.C.OPTIONS ,
                      ruri : { user : UA.configuration.uri.user } ,
                      reply : reply };
      UA.receiveRequest(request);
      expect(SIP.Transactions.NonInviteServerTransaction).toHaveBeenCalledWith(request, UA);
      expect(reply).toHaveBeenCalledWith(200,null,[ 'Allow: ACK,CANCEL,BYE,OPTIONS', 'Accept: application/sdp,application/dtmf-relay' ])
    });
    
    it('should check if there is a listener when the SIP method is message and reject if no listener is found', function() {
      var request = { method : SIP.C.MESSAGE ,
                      ruri : { user : UA.configuration.uri.user } ,
                      reply : reply };
      UA.checkListener = jasmine.createSpy('checkListener').andCallFake(function() {
        return false;
      });
      expect(UA.receiveRequest(request)).toBeUndefined();
      expect(UA.checkListener).toHaveBeenCalledWith(request.method.toLowerCase());
      expect(SIP.Transactions.NonInviteServerTransaction).toHaveBeenCalledWith(request,UA);
      expect(reply).toHaveBeenCalledWith(405, null, [ 'Allow: ACK,CANCEL,BYE,OPTIONS' ]);
    });
    
    it('should check if there is a listener when the SIP method is message and accept if listener is found', function() {
      var callback = jasmine.createSpy('callback').andCallFake(function() {
        return true;
      });
      var request = { method : SIP.C.MESSAGE ,
                      ruri : { user : UA.configuration.uri.user } ,
                      reply : reply };
      UA.checkListener = jasmine.createSpy('checkListener').andCallFake(function() {
        return true;
      });
      UA.on('message',callback);
      
      UA.receiveRequest(request);
      
      expect(SIP.MessageServerContext).toHaveBeenCalledWith(UA, request);
      expect(reply).toHaveBeenCalledWith(200,null);
      expect(callback).toHaveBeenCalled();
    });
    
    it('should create a Server context and add a progress, accepted, and failed event listener to it if the SIP method is anything besides options, message, invite, and ack', function() {
      var request = { method : 'method' ,
                      ruri : { user : UA.configuration.uri.user },
                      reply : reply };
      UA.receiveRequest(request);
      expect(serverContextOn.calls[0].args[0]).toEqual('progress');
      expect(serverContextOn.calls[1].args[0]).toEqual('accepted');
      expect(serverContextOn.calls[2].args[0]).toEqual('failed');
    });
    
    it('should create an invite server context and emit invite if the message is of type INVITE', function() {
      var request = { method : SIP.C.INVITE , 
                      ruri : { user: UA.configuration.uri.user } ,
                      reply : reply };
      var callback = jasmine.createSpy('callback');
      UA.on('invite',callback);
      UA.receiveRequest(request);
      expect(callback).toHaveBeenCalledWith({});
    });
    
    it('should send a 488 if an invite is received but there is no WebRTC support', function() {
      var request = { method : SIP.C.INVITE , 
                      ruri : { user: UA.configuration.uri.user } ,
                      reply : reply };
      SIP.WebRTC.isSupported = false;
      UA.receiveRequest(request);
      expect(reply).toHaveBeenCalledWith(488);
    });
    
    it('should send a 481 if a BYE is received', function() {
      var request = { method : SIP.C.BYE ,
                    ruri : { user : UA.configuration.uri.user } ,
                    reply : reply };
      UA.receiveRequest(request);
      expect(reply).toHaveBeenCalledWith(481);
    });
    
    it('should find the session and call receiveRequest on the session if it exists if a CANCEL is received', function() {
      var receiveRequest = jasmine.createSpy('receiveRequest').andCallFake(function() {
        return 'Receive Request';
      });
      UA.findSession = jasmine.createSpy('findSession').andCallFake(function() {
        return {receiveRequest : receiveRequest };
      });
      var request = { method : SIP.C.CANCEL ,
                    ruri : { user : UA.configuration.uri.user } ,
                    reply : reply };
      UA.receiveRequest(request);
      expect(UA.findSession).toHaveBeenCalledWith(request);
      expect(receiveRequest).toHaveBeenCalledWith(request);
    });
    
    it('should log a warning if the session does not exist if a CANCEL is a received', function() {
      UA.findSession = jasmine.createSpy('findSession').andCallFake(function() {
        return false;
      });
      var request = { method : SIP.C.CANCEL ,
                    ruri : { user : UA.configuration.uri.user } ,
                    reply : reply };
      UA.receiveRequest(request);
      expect(UA.findSession).toHaveBeenCalledWith(request);
      expect(UA.logger.warn).toHaveBeenCalled();
    });
    
    it('should do nothing if an ACK is received', function() {
      var request = { method : SIP.C.ACK ,
                    ruri : { user : UA.configuration.uri.user } ,
                    reply : reply };
      UA.receiveRequest(request);
      expect(reply).not.toHaveBeenCalled();
    });
    
    it('should reply with a 405 if it cannot interpret the message', function() {
      var request = { method : 'unknown method' ,
                    ruri : { user : UA.configuration.uri.user } ,
                    reply : reply };
      UA.receiveRequest(request);
      expect(reply).toHaveBeenCalledWith(405);
    });
    
    it('should create a new Invite Server Transaction and call receive request if it recieves an in dialog invite request', function() {
      var receiveRequest = jasmine.createSpy('receiveRequest').andCallFake(function() {
        return 'Receive Request';
      });
      UA.findDialog = jasmine.createSpy('findDialog').andCallFake(function() {
        return {receiveRequest : receiveRequest };
      });
      var request = { method : SIP.C.INVITE ,
                    ruri : { user : UA.configuration.uri.user } ,
                    reply : reply ,
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
                    reply : reply ,
                    to_tag : 'tag' };
      UA.receiveRequest(request);
      expect(UA.findDialog).toHaveBeenCalledWith(request);
      expect(SIP.Transactions.InviteServerTransaction).not.toHaveBeenCalled();
      expect(receiveRequest).toHaveBeenCalledWith(request);      
    });
    
    it('should reply 481 on the request if the dialog is not found and the request is an invite', function() {
      UA.findDialog = jasmine.createSpy('findDialog').andCallFake(function() {
        return false;
      });
      var request = { method : SIP.C.INVITE ,
                    ruri : { user : UA.configuration.uri.user } ,
                    reply : reply ,
                    to_tag : 'tag' };
      UA.receiveRequest(request);
      expect(UA.findDialog).toHaveBeenCalledWith(request);
      expect(reply).toHaveBeenCalledWith(481);
    });
    
    it('should call receiveRequest on the dialog if there is one', function() {
      var receiveRequest = jasmine.createSpy('dialogReceiveRequest').andCallFake(function() {
        return 'Receive Request';
      });
      UA.findDialog = jasmine.createSpy('findDialog').andCallFake(function() {
        return {receiveRequest : receiveRequest };
      });
      var request = { method : SIP.C.NOTIFY ,
                    ruri : { user : UA.configuration.uri.user } ,
                    reply : reply ,
                    to_tag : 'tag' };
      UA.receiveRequest(request);
      expect(UA.findDialog).toHaveBeenCalledWith(request);
      expect(receiveRequest).toHaveBeenCalledWith(request);
    });
    
    it('should call receive response on the session if it exists and the dialog does not for an in dialog notify request', function() {
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
                    reply : reply ,
                    to_tag : 'tag' };
      UA.receiveRequest(request);
      expect(UA.findDialog).toHaveBeenCalledWith(request);
      expect(UA.findSession).toHaveBeenCalledWith(request);
      expect(receiveRequest).toHaveBeenCalledWith(request);
    });
    
    it('should reply with a 481 and subscription does not exist if an in dialog notify request is received and no dialog or session is found', function() {
      UA.findDialog = jasmine.createSpy('findDialog').andCallFake(function() {
        return false;
      });
      UA.findSession = jasmine.createSpy('findSession').andCallFake(function() {
        return false;
      });
      var request = { method : SIP.C.NOTIFY ,
                    ruri : { user : UA.configuration.uri.user } ,
                    reply : reply ,
                    to_tag : 'tag' };
      UA.receiveRequest(request);
      expect(UA.findDialog).toHaveBeenCalledWith(request);
      expect(UA.findSession).toHaveBeenCalledWith(request);
      expect(reply).toHaveBeenCalledWith(481,'Subscription does not exist');
    });
    
    it ('should reply with a 481 if an in dialog request is received that is not a NOTIFY OR ACK and no dialog is found', function() {
      UA.findDialog = jasmine.createSpy('findDialog').andCallFake(function() {
        return false;
      });
      var request = { method : SIP.C.INVITE ,
                    ruri : { user : UA.configuration.uri.user } ,
                    reply : reply ,
                    to_tag : 'tag' };
      UA.receiveRequest(request);
      expect(UA.findDialog).toHaveBeenCalledWith(request);
      expect(reply).toHaveBeenCalledWith(481);
    });
    
    it('should do nothing if an ACK is received and no dialog is found', function() {
      UA.findDialog = jasmine.createSpy('findDialog').andCallFake(function() {
        return false;
      });
      var request = { method : SIP.C.ACK ,
                    ruri : { user : UA.configuration.uri.user } ,
                    reply : reply ,
                    to_tag : 'tag' };
      UA.receiveRequest(request);
      expect(UA.findDialog).toHaveBeenCalledWith(request);
      expect(reply).not.toHaveBeenCalled();
    });
  });
  
  describe('when finding a session', function() {
    it('should return the session based on the call_id and from_tag', function() {
      var request = { call_id : 'callId' ,
                      from_tag : 'from' };
      UA.sessions[request.call_id + request.from_tag] = 'session';
      expect(UA.findSession(request)).toBe(UA.sessions[request.call_id + request.from_tag]);
    });
    it('should return the session based on the call_id and to_tag', function() {
      var request = { call_id : 'callId' ,
                      to_tag : 'to' };
      UA.sessions[request.call_id + request.to_tag] = 'session';
      expect(UA.findSession(request)).toBe(UA.sessions[request.call_id + request.to_tag]);
    });
    it('should return null if the session is not found', function() {
      var request = { call_id : 'callId' ,
                      from_tag : 'from' };
      expect(UA.findSession(request)).toBe(null);
    });
  });
  
  describe('when finding a dialog', function() {
    it('should return the dialog based on the call_id and from_tag and to_tag', function() {
      var request = { call_id : 'callId' ,
                      from_tag : 'from' ,
                      to_tag : 'to' };
      UA.dialogs[request.call_id + request.from_tag + request.to_tag] = 'dialog';
      expect(UA.findDialog(request)).toBe(UA.dialogs[request.call_id + request.from_tag + request.to_tag]);
    });
    it('should return the dialog based on the call_id and to_tag and from_tag', function() {
      var request = { call_id : 'callId' ,
                      from_tag : 'from' ,
                      to_tag : 'to' };
      UA.dialogs[request.call_id + request.to_tag + request.from_tag] = 'dialog';
      expect(UA.findDialog(request)).toBe(UA.dialogs[request.call_id + request.to_tag + request.from_tag]);
    });
    it('should return null if the session is not found', function() {
      var request = { call_id : 'callId' ,
                      from_tag : 'from' ,
                      to_tag : 'to' };
      expect(UA.findSession(request)).toBe(null);
    });
  });
  
  describe('when getting the next ws server', function() {
    it('should select the candidate with the highest weight', function() {
      
    });
    it('should not select a candidate that has a transport error', function() {
      
    });
  });
  
  describe('when closing sessions that have a transport error', function() {
    it('should call onTransportError for all the sessions in the sessions object', function() {
      
    });
    
  });
});