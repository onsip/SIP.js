describe('RegisterContext', function() {
  var RegisterContext;
  var ua;
  
  beforeEach(function() {
    var log = jasmine.createSpy('log').and.callFake(function() {
      return 'log';
    });
    ua = {
      configuration : {
        registrarServer : 'registrar' ,
        registerExpires : 999,
        uri : 'uri',
        instanceId : 'instance'
      },
      contact : 'contact',
      getLogger : function() {
        return { log : log };
      },
      normalizeTarget: function (target) { return target; },
      listeners: function () { return [1]; }
    };
    RegisterContext = new SIP.RegisterContext(ua);
    
    
    RegisterContext.logger = jasmine.createSpy('logger').and.returnValue('logger');
    RegisterContext.logger.log = jasmine.createSpy('log').and.returnValue('log');
    RegisterContext.logger.warn = jasmine.createSpy('warn').and.returnValue('warn');
  });
  
  it('initialize instance variables', function() {
    RegisterContext = undefined;
  
    expect(RegisterContext).toBeUndefined();
    
    RegisterContext = new SIP.RegisterContext(ua);
    
    expect(RegisterContext).toBeDefined();
    expect(RegisterContext.registrar).toBe(ua.configuration.registrarServer);
    expect(RegisterContext.expires).toBe(ua.configuration.registerExpires);
    expect(RegisterContext.call_id).toBeDefined();
    expect(RegisterContext.cseq).toEqual(80);
    expect(RegisterContext.to_uri).toBe(ua.configuration.uri);
    expect(RegisterContext.registrationTimer).toBeDefined();
    expect(RegisterContext.registered).toBeFalsy();
    expect(RegisterContext.contact).toBeDefined();
    expect(RegisterContext.logger).toBeDefined();
  });
  
  describe('.register', function() {
    var options;
    beforeEach(function() {
      options = {};
      spyOn(RegisterContext, 'send').and.returnValue('send');
    });
    
    it('sets up the receiveResponse function', function() {
      RegisterContext.register(options);
      expect(RegisterContext.receiveResponse).toBeDefined();
    });
    
    it('sets up the onRequestTimeout function', function() {
      RegisterContext.register(options);
      expect(RegisterContext.onRequestTimeout).toBeDefined();
    });
    
    it('sets up the onTransportError function', function() {
      RegisterContext.register(options);
      expect(RegisterContext.onTransportError).toBeDefined();
    });
    
    it('sends params and the extra headers', function() {
      RegisterContext.register(options);
      expect(RegisterContext.send).toHaveBeenCalled();
    });
  });
  
  describe('.registrationFailure', function() {
    var callback;
    beforeEach(function() {
      callback = jasmine.createSpy('callback');
    });
    it('emits failed with the response and cause provided to it', function() {
      RegisterContext.on('failed', callback);
      
      var response = 'response';
      var cause = 'cause';
      
      RegisterContext.registrationFailure(response,cause);
      expect(callback).toHaveBeenCalledWith(response, cause);
    });
    
    it('emits failed with null and the cause provided if no response is provided', function() {
      RegisterContext.on('failed', callback);
      
      var cause = 'cause';
      
      RegisterContext.registrationFailure(undefined,cause);
      expect(callback).toHaveBeenCalledWith(null, cause);
    });
    
    it('does not unregister', function() {
      spyOn(RegisterContext, 'unregistered').and.returnValue('unregistered');
      RegisterContext.registered = true;
      expect(RegisterContext.unregistered).not.toHaveBeenCalled();
      
      var response = 'response';
      var cause = 'cause';
      
      RegisterContext.registrationFailure(response,cause);
      
      expect(RegisterContext.unregistered).not.toHaveBeenCalled();
    });
  });
  
  describe('.onTransportClosed', function() {
    it('takes the registered variable and move it to registered_before variable', function() {
      expect(RegisterContext.registered_before).not.toEqual(RegisterContext.registered);
      RegisterContext.onTransportClosed();
      expect(RegisterContext.registered_before).toEqual(RegisterContext.registered);
    });
    
    it('clears the registration timer if it is set', function() {
      RegisterContext.registrationTimer = SIP.Timers.setTimeout(function() {return;},999999);
      expect(RegisterContext.registrationTimer).not.toEqual(null);
      RegisterContext.onTransportClosed();
    });
    
    it('calls unregistered if it is registered', function() {
      spyOn(RegisterContext, 'unregistered').and.returnValue('unregister');
      RegisterContext.registered = true;
      expect(RegisterContext.unregistered).not.toHaveBeenCalled();
      RegisterContext.onTransportClosed();
      expect(RegisterContext.unregistered).toHaveBeenCalledWith(null, SIP.C.causes.CONNECTION_ERROR);
    });
  });
  
  describe('.onTransportConnected', function(){
    it('calls register', function() {
      spyOn(RegisterContext, 'register').and.returnValue('register');
      expect(RegisterContext.register).not.toHaveBeenCalled();
      
      RegisterContext.onTransportConnected();
      
      expect(RegisterContext.register).toHaveBeenCalledWith();
    });
  });
  
  describe('.close', function() {
    beforeEach(function(){
      spyOn(RegisterContext, 'unregister').and.returnValue('unregister');
    });
    it('takes registered and move it to registerd_before', function() {
      expect(RegisterContext.registered).not.toBe(RegisterContext.registered_before); 
      RegisterContext.close();
      expect(RegisterContext.registered).toBe(RegisterContext.registered_before);
    });
    
    it('calls unregister', function() {
      expect(RegisterContext.unregister).not.toHaveBeenCalled();
      RegisterContext.close();
      expect(RegisterContext.unregister).toHaveBeenCalledWith();
    });
  });
  
  describe('.unregister', function() {
    beforeEach(function() {
      RegisterContext.send = jasmine.createSpy('send').and.returnValue('send');
    });
    it('does nothing if the registered variable is false', function() {
      RegisterContext.registered = false;
      expect(RegisterContext.send).not.toHaveBeenCalled();
      RegisterContext.unregister();
      expect(RegisterContext.send).not.toHaveBeenCalled();
    });
    
    it('changes registered variable to false if it was true', function() {
      RegisterContext.registered = true;
      RegisterContext.unregister();
      expect(RegisterContext.registered).toBe(false);
    });
    
    it('clears the registration timer', function() {
      RegisterContext.registered = true;
      RegisterContext.registrationTimer = SIP.Timers.setTimeout(function() { return; }, 999999);
      RegisterContext.unregister();
      expect(RegisterContext.registrationTimer).toBe(null);
    });
    
    it('pushes extra headers Contact: *, Expires: 0 if options.all is truthy', function() {
      var options = { all : true };
      RegisterContext.registered = true;
      expect(RegisterContext.send).not.toHaveBeenCalled();
      RegisterContext.unregister(options);
      expect(RegisterContext.send).toHaveBeenCalledWith();
      expect(RegisterContext.request.extraHeaders).toEqual([ 'Contact: *', 'Expires: 0' ]);
      
    });
    
    it('pushes extra headers Contact: <contact>, Expires: 0 if options.all is falsy', function() {
      var options = { all : false };
      RegisterContext.registered = true;
      expect(RegisterContext.send).not.toHaveBeenCalled();
      RegisterContext.unregister(options);
      expect(RegisterContext.send).toHaveBeenCalledWith();
      expect(RegisterContext.request.extraHeaders).toEqual([ 'Contact: '+RegisterContext.contact+';expires=0' ]);
    });
    
    it('calls send with the params call_id, and cseq+=1', function() {
      RegisterContext.registered = true;
      expect(RegisterContext.send).not.toHaveBeenCalled();
      var cseqBefore = RegisterContext.cseq;
      RegisterContext.unregister();
      expect(RegisterContext.send).toHaveBeenCalledWith();
      expect(RegisterContext.request.call_id).toBe(RegisterContext.call_id);
      expect(RegisterContext.request.cseq).toBe(cseqBefore + 1);
      expect(RegisterContext.cseq).toBe(cseqBefore+1);
    });
    
    it('defines receiveResponse', function() {
      delete RegisterContext.receiveResponse;
      RegisterContext.registered = true;
      expect(RegisterContext.receiveResponse).toBeUndefined();
      RegisterContext.unregister();
      expect(RegisterContext.receiveResponse).toBeDefined();
    });
    
    it('defines onRequestTimeout', function() {
      delete RegisterContext.onRequestTimeout;
      RegisterContext.registered = true;
      expect(RegisterContext.onRequestTimeout).toBeUndefined();
      RegisterContext.unregister();
      expect(RegisterContext.onRequestTimeout).toBeDefined();
    });
    
    it('defines onTransportError', function() {
      delete RegisterContext.onTransportError;
      RegisterContext.registered = true;
      expect(RegisterContext.onTransportError).toBeUndefined();
      RegisterContext.unregister();
      expect(RegisterContext.onTransportError).toBeDefined();
    });
  });
  
  describe('.unregistered', function() {
    var callback;
    beforeEach(function() {
      callback = jasmine.createSpy('callback');
    });
    it('sets RegisterContext.registered to false if RegisterContext.registered is true', function() {
      RegisterContext.registered = true;
      expect(RegisterContext.registered).toBe(true);
      RegisterContext.unregistered();
      expect(RegisterContext.registered).toBe(false);
    });
    it('sets RegisterContext.registered to false if RegisterContext.registered is false', function() {
      RegisterContext.registered = false;
      expect(RegisterContext.registered).toBe(false);
      RegisterContext.unregistered();
      expect(RegisterContext.registered).toBe(false);
    });
    it('emits unregistered with the response and cause passed to it', function() {
      RegisterContext.on('unregistered', callback);
      var response = 'response';
      var cause = 'cause';
      expect(callback).not.toHaveBeenCalled();
      RegisterContext.unregistered(response,cause);
      expect(callback).toHaveBeenCalledWith(response, cause);
    });
    it('emits unregistered with a null response and a null cause if one is not provided', function() {
      RegisterContext.on('unregistered', callback);
      expect(callback).not.toHaveBeenCalled();
      RegisterContext.unregistered();
      expect(callback).toHaveBeenCalledWith(null, null);
    });
  });
});
