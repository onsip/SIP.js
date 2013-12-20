describe('ClientContext', function() {
  var ClientContext;
  var ua = jasmine.createSpyObj('ua',['getLogger','normalizeTarget','applicants']);
  var method = 'method'; 
  var target = 'target';
  
  beforeEach(function(){
    ua.getLogger.andCallFake(function(){
      return jasmine.createSpyObj('logger',['log']);
    });
    ua.normalizeTarget.andCallFake(function(){
      return true;
    });
    ClientContext = new SIP.ClientContext(ua,method,target);
  });
  
  it('should set the ua', function() {
    expect(ClientContext.ua).toBe(ua);
  });
  
  it('should set the logger', function() {
    expect(ClientContext.logger).toEqual(jasmine.any(Object));
    expect(ua.getLogger).toHaveBeenCalled();
  });
  
  it('should set the method', function() {
    expect(ClientContext.method).toBe(method);
  });
  
  it('should set the target', function() {
    expect(ClientContext.target).toBe(target);
  });
  
  it('should initialize data', function() {
    expect(ClientContext.data).toBeDefined();
  });
  
  it('should init events', function() {
    expect(ClientContext.checkEvent('progress')).toBeTruthy();
    expect(ClientContext.checkEvent('accepted')).toBeTruthy();
    expect(ClientContext.checkEvent('rejected')).toBeTruthy();
    expect(ClientContext.checkEvent('failed')).toBeTruthy();
  });
  
  describe('when sending a message', function() {
    var options = {};
    beforeEach(function() {
      SIP.OutgoingRequest = jasmine.createSpy('OutgoingRequest');
      SIP.OutgoingRequest.send = jasmine.createSpy('send');
      spyOn(SIP,'RequestSender').andCallFake(function() {
        return {'send':SIP.OutgoingRequest.send}; 
      });
    });
    
    it('should check that the target is not undefined', function() {
      ClientContext.target = undefined;
      expect(function() {ClientContext.send(options);}).toThrow();
    });
    
    it('should check that the target is valid', function() {
      ClientContext.send(options);
      expect(ua.normalizeTarget).toHaveBeenCalled();
    });
    
    it('should create a new outgoing request', function() {
      ClientContext.send(options);
      expect(SIP.OutgoingRequest).toHaveBeenCalled();
    });
    
    it('should call the send method', function() {
      ClientContext.send(options);
      expect(SIP.OutgoingRequest.send).toHaveBeenCalled();
    });
    
    it('should return itself', function() {
      expect(ClientContext.send(options)).toBe(ClientContext);
    });
  });
  
  describe('when receiving a response', function() {
    var callback;

    beforeEach(function() {
      callback = jasmine.createSpy('callback');
    });
    
    it('should emit progress on a 1xx response', function() {
      var counter = 0;
      ClientContext.on('progress', callback.andCallFake(function () {
        expect(this).toBe(ClientContext);
      }));
      for (var i = 100; i < 200; i++) {
        ClientContext.receiveResponse({status_code:i});
        expect(callback.calls[counter].args[0].code).toEqual(i);
        expect(callback.calls[counter].args[0].response).toEqual({status_code:i});
        counter++;
      }
      expect(callback.calls.length).toEqual(counter);
    });
    
    it('should emit accepted on a 2xx response', function() {
      var counter = 0;
      ClientContext.on('accepted', callback.andCallFake(function () {
        expect(this).toBe(ClientContext);
      }));
      for (var i = 200; i < 300; i++) {
        ClientContext.receiveResponse({status_code:i});
        expect(callback.calls[counter].args[0].code).toEqual(i);
        expect(callback.calls[counter].args[0].response).toEqual({status_code:i});
        counter++;
      }
      expect(callback.calls.length).toEqual(counter);
    });
    
    it('should emit rejected and failed on all other responses',function() {
      var counter = 0;
      var failedCallback = jasmine.createSpy('failed');
      ClientContext.on('rejected', callback.andCallFake(function () {
        expect(this).toBe(ClientContext);
      }));
      ClientContext.on('failed', failedCallback.andCallFake(function () {
        expect(this).toBe(ClientContext);
      }));
      for (i = 300; i < 700; i++) {
        ClientContext.receiveResponse({status_code:i});
        expect(callback.calls[counter].args[0].code).toEqual(i);
        expect(callback.calls[counter].args[0].response).toEqual({status_code:i});
        expect(callback.calls[counter].args[0].cause).toBeDefined();
        expect(failedCallback.calls[counter].args[0].code).toEqual(i);
        expect(failedCallback.calls[counter].args[0].response).toEqual({status_code:i});
        expect(failedCallback.calls[counter].args[0].cause).toBeDefined();
        counter++;
      }
      expect(callback.calls.length).toEqual(counter);
      expect(failedCallback.calls.length).toEqual(counter);
    });
  });
  
  describe('when a request timeout occurs', function() {
    var callback;
    beforeEach(function() {
      callback = jasmine.createSpy('callback');
    });
    
    it('should emit failed with a status code 0, null response, and request timeout cause', function() {
      ClientContext.on('failed', callback);
      ClientContext.onRequestTimeout();
      expect(callback).toHaveBeenCalledWith(0, null, SIP.C.causes.REQUEST_TIMEOUT);
    });
  });
  
  describe('when a transport error occurs', function() {
    var callback;
    beforeEach(function() {
      callback = jasmine.createSpy('callback');
    });
    
    it('should emit failed with a status code 0, null response, and connection error cause', function() {
      ClientContext.on('failed', callback);
      ClientContext.onTransportError();
      expect(callback).toHaveBeenCalledWith(0,null,SIP.C.causes.CONNECTION_ERROR);
    });
  });
});