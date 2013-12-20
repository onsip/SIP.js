describe('ServerContext', function() {
  var ServerContext;
  var ua;
  var request;
  
  beforeEach(function(){
    ua = jasmine.createSpyObj('ua',['getLogger','normalizeTarget','applicants']);
    request = 'request'; 
    ua.getLogger.andCallFake(function(){
      return jasmine.createSpyObj('logger',['log']);
    });
    SIP.Transactions.InviteServerTransaction = jasmine.createSpy('IST');
    SIP.Transactions.NonInviteServerTransaction = jasmine.createSpy('NST');
    ServerContext = new SIP.ServerContext(ua,request);
  });
  
  afterEach(function() {
    ua = null;
    request = null;
    
  });
  
  it('should set the ua', function() {
    expect(ServerContext.ua).toBe(ua);
  });
  
  it('should set the logger', function() {
    expect(ServerContext.logger).toEqual(jasmine.any(Object));
    expect(ua.getLogger).toHaveBeenCalled();
  });
  
  it('should set the request', function() {
    expect(ServerContext.request).toBe(request);
  });
  
  it('should set the transaction based on the request method', function() {
    expect(SIP.Transactions.NonInviteServerTransaction).toHaveBeenCalledWith(request,ua);
    expect(ServerContext.transaction).toBeDefined();
    ServerContext = new SIP.ServerContext(ua,{method : SIP.C.INVITE});
    expect(SIP.Transactions.InviteServerTransaction).toHaveBeenCalledWith({method : SIP.C.INVITE},ua);
    expect(ServerContext.transaction).toBeDefined();
  });
 
  it('should initialize data', function() {
    expect(ServerContext.data).toBeDefined();
  });
  
  it('should init events', function() {
    expect(ServerContext.checkEvent('progress')).toBeTruthy();
    expect(ServerContext.checkEvent('accepted')).toBeTruthy();
    expect(ServerContext.checkEvent('rejected')).toBeTruthy();
    expect(ServerContext.checkEvent('failed')).toBeTruthy();
  });
  
  describe('when there is progress', function() {
    var callback;

    beforeEach(function() {
      ServerContext.request = jasmine.createSpyObj('request',['reply']);
      ServerContext.request.reply.andCallFake(function() { return 'reply'; });
      callback = jasmine.createSpy('callback');
    });
    it('should default to status code 180 if none is provided', function() {
      ServerContext.progress(null);
      expect(ServerContext.request.reply.mostRecentCall.args[0]).toEqual(180);
    });
    
    it('should throw an error with an invalid status code', function() {
      for (var i = 1; i < 100; i++) {
        expect(function() { ServerContext.progress({statusCode : i}); }).toThrow(TypeError('Invalid statusCode: ' + i));
      }
      for (i = 200; i < 700; i++) {
        expect(function() { ServerContext.progress({statusCode : i}); }).toThrow(TypeError('Invalid statusCode: ' + i));
      }
    });
    
    it('should call reply with a valid status code and pass along a reason phrase, extra headers, and body', function() {
      var counter = 0;
      for (var i = 100; i < 200; i++) {
        var options = {statusCode : i ,
                        reasonPhrase : 'reason' ,
                        extraHeaders : 'headers' ,
                        body : 'body'}
        ServerContext.progress(options);
        expect(ServerContext.request.reply.calls[counter].args[0]).toBe(options.statusCode);
        expect(ServerContext.request.reply.calls[counter].args[1]).toBe(options.reasonPhrase);
        expect(ServerContext.request.reply.calls[counter].args[2]).toBe(options.extraHeaders);
        expect(ServerContext.request.reply.calls[counter].args[3]).toBe(options.body);
        counter++;
      }
      expect(ServerContext.request.reply.calls.length).toEqual(counter);
    });
    
    it('should emit event progress with a valid status code and response', function() {
      var counter = 0;
      ServerContext.on('progress', callback);
      for (var i = 100; i < 200; i++) {
        var options = {statusCode : i};
        ServerContext.progress(options);
        expect(callback.calls[counter].args[0].code).toBe(options.statusCode);
        expect(callback.calls[counter].args[0].response).toEqual('reply');
        counter++;
      }
    });
    
    it('should return itself', function() {
      var options = {};
      expect(ServerContext.progress(options)).toBe(ServerContext);
    });
  });
  
  describe('when there is an accept', function() {
    var callback;
    beforeEach(function() {
      ServerContext.request = jasmine.createSpyObj('request',['reply']);
      ServerContext.request.reply.andCallFake(function() { return 'reply'; });
      callback = jasmine.createSpy('callback');
    });
    it('should default to status code 200 if none is provided', function() {
      ServerContext.accept(null);
      expect(ServerContext.request.reply.mostRecentCall.args[0]).toEqual(200);
    });
    
    it('should throw an error with an invalid status code', function() {
      for(var i = 1; i < 200; i++) {
        expect(function() { ServerContext.accept({statusCode : i}); }).toThrow(TypeError('Invalid statusCode: ' + i));
      }
      for (i = 300; i < 700; i++) {
        expect(function() { ServerContext.accept({statusCode : i}); }).toThrow(TypeError('Invalid statusCode: ' + i));
      }
    });
    
    it('should call reply with a valid status code and pass along a reason phrase, extra headers, and body', function() {
      var counter = 0;
      for (var i = 200; i < 300; i++) {
        var options = {statusCode : i ,
                        reasonPhrase : 'reason' ,
                        extraHeaders : 'headers' ,
                        body : 'body'}
        ServerContext.accept(options);
        expect(ServerContext.request.reply.calls[counter].args[0]).toBe(options.statusCode);
        expect(ServerContext.request.reply.calls[counter].args[1]).toBe(options.reasonPhrase);
        expect(ServerContext.request.reply.calls[counter].args[2]).toBe(options.extraHeaders);
        expect(ServerContext.request.reply.calls[counter].args[3]).toBe(options.body);
        counter++;
      }
      expect(ServerContext.request.reply.calls.length).toEqual(counter);
    });
    
    it('should emit event accepted with a valid status code and null response', function() {
      var counter = 0;
      ServerContext.on('accepted', callback);
      for (var i = 200; i < 300; i++) {
        var options = {statusCode : i};
        ServerContext.accept(options);
        expect(callback.calls[counter].args[0].code).toBe(options.statusCode);
        expect(callback.calls[counter].args[0].response).toEqual(null);
        counter++;
      }
    });
    
    it('should return itself', function() {
      var options = {};
      expect(ServerContext.accept(options)).toBe(ServerContext);
    });
  });
  
  describe('when there is a reject', function() {
    var callback;
    beforeEach(function() {
      ServerContext.request = jasmine.createSpyObj('request',['reply']);
      ServerContext.request.reply.andCallFake(function() { return 'reply'; });
      callback = jasmine.createSpy('callback');
    });
    
    it('should default to status code 480 if none is provided', function() {
      ServerContext.reject(null);
      expect(ServerContext.request.reply.mostRecentCall.args[0]).toEqual(480);
    });
    
    it('should throw an error with an invalid status code', function() {
      for(var i = 1; i < 300; i++) {
        expect(function() { ServerContext.reject({statusCode : i}); }).toThrow(TypeError('Invalid statusCode: ' + i));
      }
    });
    
    it('should call reply with a valid status code and pass along a reason phrase, extra headers, and body', function() {
      var counter = 0;
      for (var i = 300; i < 700; i++) {
        var options = {statusCode : i ,
                        reasonPhrase : 'reason' ,
                        extraHeaders : 'headers' ,
                        body : 'body'}
        ServerContext.reject(options);
        expect(ServerContext.request.reply.calls[counter].args[0]).toBe(options.statusCode);
        expect(ServerContext.request.reply.calls[counter].args[1]).toBe(options.reasonPhrase);
        expect(ServerContext.request.reply.calls[counter].args[2]).toBe(options.extraHeaders);
        expect(ServerContext.request.reply.calls[counter].args[3]).toBe(options.body);
        counter++;
      }
      expect(ServerContext.request.reply.calls.length).toEqual(counter);
    });
    
    it('should emit event rejected and event fails with a valid status code and null response and reasonPhrase for a cause', function() {
      var counter = 0;
      var failedCallback = jasmine.createSpy('failed');
      ServerContext.
        on('rejected', callback).
        on('failed', failedCallback);

      for (var i = 300; i < 700; i++) {
        var options = {statusCode : i, reasonPhrase : 'reason'};
        ServerContext.reject(options);
        expect(callback.calls[counter].args[0].code).toBe(options.statusCode);
        expect(callback.calls[counter].args[0].response).toEqual(null);
        expect(callback.calls[counter].args[0].cause).toBe(options.reasonPhrase);
        expect(failedCallback.calls[counter].args[0].code).toBe(options.statusCode);
        expect(failedCallback.calls[counter].args[0].response).toEqual(null);
        expect(failedCallback.calls[counter].args[0].cause).toBe(options.reasonPhrase);
        counter++;
      }
    });
    
    it('should return itself', function() {
      var options = {};
      expect(ServerContext.reject(options)).toBe(ServerContext);
    });
  });
  
  describe('when a generic reply is sent', function() {
    beforeEach(function() {
      ServerContext.request = jasmine.createSpyObj('request',['reply']);
      ServerContext.request.reply.andCallFake(function() { return 'reply'; });
    });
    
    it('should pass along the status code, reason phrase, header, and body as is to request reply', function() {
      var counter = 0;
      for( var i = 1; i < 700; i++) {
        var options={statusCode : i ,
                      reasonPhrase : 'reason' , 
                      extraHeaders : 'headers' ,
                      body : 'body text' }
        ServerContext.reply(options);
        expect(ServerContext.request.reply.calls[counter].args[0]).toBe(options.statusCode);
        expect(ServerContext.request.reply.calls[counter].args[1]).toBe(options.reasonPhrase);
        expect(ServerContext.request.reply.calls[counter].args[2]).toBe(options.extraHeaders);
        expect(ServerContext.request.reply.calls[counter].args[3]).toBe(options.body);
        counter++;
      }
    });
    
    it('should return itself', function() {
      var options = {};
      expect(ServerContext.reply(options)).toBe(ServerContext);
    });
  });
  
    
  describe('when a request timeout occurs', function() {
    var callback;
    beforeEach(function() {
      callback = jasmine.createSpy('callback');
    });
    
    it('should emit failed with a status code 0, null response, and request timeout cause', function() {
      ServerContext.on('failed', callback);
      ServerContext.onRequestTimeout();
      expect(callback).toHaveBeenCalledWith(0, null, SIP.C.causes.REQUEST_TIMEOUT);
    });
  });
  
  describe('when a transport error occurs', function() {
    var callback;
    beforeEach(function() {
      callback = jasmine.createSpy('callback');
    });
    
    it('should emit failed with a status code 0, null response, and connection error cause', function() {
      ServerContext.on('failed', callback);
      ServerContext.onTransportError();
      expect(callback).toHaveBeenCalledWith(0, null, SIP.C.causes.CONNECTION_ERROR);
    });
  });
});