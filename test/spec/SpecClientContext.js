describe('ClientContext', function() {
  var ClientContext;
  var ua;
  var method; 
  var target;
  
  beforeEach(function(){
    ua = new SIP.UA({uri: 'alice@example.com', ws_servers: 'ws:server.example.com'});
    method = SIP.C.INVITE;
    target = 'alice@example.com';
    
    ClientContext = new SIP.ClientContext(ua,method,target);
  });
  
  it('sets the ua', function() {
    expect(ClientContext.ua).toBe(ua);
  });
  
  it('sets the logger', function() {
    expect(ClientContext.logger).toBe(ua.getLogger('sip.clientcontext'));
  });
  
  it('sets the method', function() {
    expect(ClientContext.method).toBe(method);
  });
  
  it('sets the target', function() {
    expect(ClientContext.target).toBe(target);
  });
  
  it('initializes data', function() {
    expect(ClientContext.data).toBeDefined();
  });
  
  it('initializes events', function() {
    expect(ClientContext.checkEvent('progress')).toBeTruthy();
    expect(ClientContext.checkEvent('accepted')).toBeTruthy();
    expect(ClientContext.checkEvent('rejected')).toBeTruthy();
    expect(ClientContext.checkEvent('failed')).toBeTruthy();
  });
  
  describe('.send', function() {
    var options = {};

    beforeEach(function() {
      SIP.OutgoingRequest = jasmine.createSpy('OutgoingRequest');
      SIP.OutgoingRequest.send = jasmine.createSpy('send');

      spyOn(SIP,'RequestSender').andCallFake(function() {
        return {'send': SIP.OutgoingRequest.send}; 
      });
    });
    
    it('checks that the target is not undefined', function() {
      ClientContext.target = undefined;
      expect(function() {ClientContext.send(options);}).toThrow('Not enough arguments');
    });
    
    it('checks that the target is valid', function() {
      spyOn(ClientContext.ua, 'normalizeTarget');

      expect(function() {ClientContext.send(options);}).toThrow('Invalid target: alice@example.com');
    });
    
    it('creates a new outgoing request', function() {
      ClientContext.send(options);
      expect(SIP.OutgoingRequest).toHaveBeenCalled();
    });
    
    it('calls the send method', function() {
      ClientContext.send(options);
      expect(SIP.OutgoingRequest.send).toHaveBeenCalled();
    });
    
    it('returns itself', function() {
      expect(ClientContext.send(options)).toBe(ClientContext);
    });
  });
  
  describe('.receiveResponse', function() {

    beforeEach(function() {
      response = SIP.Parser.parseMessage('SIP/2.0 200 OK\r\nTo: <sip:james@onsnip.onsip.com>;tag=1ma2ki9411\r\nFrom: "test1" <sip:test1@onsnip.onsip.com>;tag=58312p20s2\r\nCall-ID: upfrf7jpeb3rmc0gnnq1\r\nCSeq: 9059 INVITE\r\nContact: <sip:gusgt9j8@vk3dj582vbu9.invalid;transport=ws>\r\nContact: <sip:gusgt9j8@vk3dj582vbu9.invalid;transport=ws>\r\nSupported: outbound\r\nContent-Type: application/sdp\r\nContent-Length: 11\r\n\r\na= sendrecv\r\n', ua);
    });
    
    it('emits progress on a 1xx response', function() {
      spyOn(ClientContext, 'emit');

      for (var i = 100; i < 200; i++) {
        response.status_code = i;
        ClientContext.receiveResponse(response);

        expect(ClientContext.emit).toHaveBeenCalledWith('progress', {code: i, response: response});
        ClientContext.emit.reset();
      }
    });
    
    it('emits accepted on a 2xx response', function() {
      spyOn(ClientContext, 'emit');

      for (var i = 200; i < 300; i++) {
        response.status_code = i;
        ClientContext.receiveResponse(response);

        expect(ClientContext.emit).toHaveBeenCalledWith('accepted', {code: i, response: response});
        ClientContext.emit.reset();
      }
    });
    
    it('emits rejected and failed on all other responses',function() {
      spyOn(ClientContext, 'emit');
      
      for (i = 300; i < 700; i++) {
        response.status_code = i;
        ClientContext.receiveResponse(response);

        expect(ClientContext.emit).toHaveBeenCalledWith('rejected', {code: i, response: response, cause: SIP.Utils.sipErrorCause(i)});
        expect(ClientContext.emit).toHaveBeenCalledWith('failed', {code: i, response: response, cause: SIP.Utils.sipErrorCause(i)});
        ClientContext.emit.reset();
      }
    });
  });
  
  describe('.onRequestTimeout', function() {
    it('emits failed with a status code 0, null response, and request timeout cause', function() {
      spyOn(ClientContext, 'emit');
      ClientContext.onRequestTimeout();
      expect(ClientContext.emit).toHaveBeenCalledWith('failed', 0, null, SIP.C.causes.REQUEST_TIMEOUT);
    });
  });
  
  describe('.onTransportError', function() {
    it('emits failed with a status code 0, null response, and connection error cause', function() {
      spyOn(ClientContext, 'emit');
      ClientContext.onTransportError();
      expect(ClientContext.emit).toHaveBeenCalledWith('failed',0,null,SIP.C.causes.CONNECTION_ERROR);
    });
  });
});