SIP.LoggerFactory.prototype.debug =
  SIP.LoggerFactory.prototype.log =
  SIP.LoggerFactory.prototype.warn =
  SIP.LoggerFactory.prototype.error = function f() {};

describe('ClientContext', function() {
  var ClientContext;
  var ua;
  var method; 
  var target;
  var body;
  var contentType;

  beforeEach(function(){
    spyOn(SIP, 'OutgoingRequest');
    SIP.OutgoingRequest.send = jasmine.createSpy('send');

    ua = new SIP.UA({uri: 'alice@example.com', wsServers: 'ws:server.example.com'});
    ua.transport = jasmine.createSpyObj('transport', ['disconnect']);
    method = SIP.C.INVITE;
    target = 'alice@example.com';
    body = '{"foo":"bar"}';
    contentType = 'application/json';

    ClientContext = new SIP.ClientContext(ua,method,target, {
      body: body,
      contentType: contentType
    });
  });

  afterEach(function () {
    ua.stop();
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
  
  it('sets the body', function () {
    expect(ClientContext.body).toBe('{"foo":"bar"}');
  });

  it('has no body by default', function () {
    expect(new SIP.ClientContext(ua,method,target).body).not.toBeDefined();
  });

  it('sets the contentType', function () {
    expect(ClientContext.contentType).toBe('application/json');
  });

  it('has no contentType by default', function () {
    expect(new SIP.ClientContext(ua,method,target).contentType).not.toBeDefined();
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

  it('checks that the target is not undefined', function() {
    expect(function () { new SIP.ClientContext(ua,method); }).toThrow('Not enough arguments');
  });

  it('checks that the target is valid', function() {
    spyOn(ClientContext.ua, 'normalizeTarget');

    expect(function() { new SIP.ClientContext(ua,method,'alice@example.com'); }).toThrow('Invalid target: alice@example.com');
  });

  it('creates a new outgoing request', function() {
    expect(SIP.OutgoingRequest).toHaveBeenCalled();
    expect(ClientContext.request).toBeDefined();
  });

  describe('.send', function() {
    var options = {};

    it('calls the send method', function() {
      spyOn(SIP,'RequestSender').andCallFake(function() {
        return {'send': SIP.OutgoingRequest.send}; 
      });

      ClientContext.send(options);
      expect(SIP.OutgoingRequest.send).toHaveBeenCalled();
    });
    
    it('returns itself', function() {
      spyOn(SIP,'RequestSender').andCallFake(function() {
        return {'send': SIP.OutgoingRequest.send}; 
      });

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

        expect(ClientContext.emit).toHaveBeenCalledWith('progress', response, SIP.C.REASON_PHRASE[response.status_code]|| '');
        ClientContext.emit.reset();
      }
    });
    
    it('emits accepted on a 2xx response', function() {
      spyOn(ClientContext, 'emit');

      for (var i = 200; i < 300; i++) {
        response.status_code = i;
        ClientContext.receiveResponse(response);

        expect(ClientContext.emit).toHaveBeenCalledWith('accepted', response, SIP.C.REASON_PHRASE[response.status_code]|| '');
        ClientContext.emit.reset();
      }
    });
    
    it('emits rejected and failed on all other responses',function() {
      spyOn(ClientContext, 'emit');
      
      for (i = 300; i < 700; i++) {
        response.status_code = i;
        ClientContext.receiveResponse(response);

        expect(ClientContext.emit).toHaveBeenCalledWith('rejected', response, SIP.C.REASON_PHRASE[response.status_code]|| '');
        expect(ClientContext.emit).toHaveBeenCalledWith('failed', response, SIP.C.REASON_PHRASE[response.status_code]|| '');
        ClientContext.emit.reset();
      }
    });
  });
  
  describe('.onRequestTimeout', function() {
    it('emits failed with a status code 0, null response, and request timeout cause', function() {
      spyOn(ClientContext, 'emit');
      ClientContext.onRequestTimeout();
      expect(ClientContext.emit).toHaveBeenCalledWith('failed', null, SIP.C.causes.REQUEST_TIMEOUT);
    });
  });
  
  describe('.onTransportError', function() {
    it('emits failed with a status code 0, null response, and connection error cause', function() {
      spyOn(ClientContext, 'emit');
      ClientContext.onTransportError();
      expect(ClientContext.emit).toHaveBeenCalledWith('failed',null,SIP.C.causes.CONNECTION_ERROR);
    });
  });

  describe('.cancel', function () {
    it('calls request.cancel', function () {
      ClientContext.request = jasmine.createSpyObj('request', ['cancel']);

      ClientContext.cancel();

      expect(ClientContext.request.cancel).toHaveBeenCalled();
    });
    it('emits a cancel event', function() {
      spyOn(ClientContext, 'emit');
      ClientContext.request = jasmine.createSpyObj('request', ['cancel']);
      
      ClientContext.cancel();
      
      expect(ClientContext.emit).toHaveBeenCalledWith('cancel');
    });
  });
});