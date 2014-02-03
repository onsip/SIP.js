describe('Message', function() {
  var Message;
  var ua;
  
  beforeEach(function() {
    ua = new SIP.UA({uri: 'alice@example.com', ws_servers: 'ws:server.example.com'});
    ua.transport = jasmine.createSpyObj('transport', ['disconnect']);
    spyOn(SIP.Utils, 'augment').andCallThrough();
  });

  afterEach(function() {
    ua.stop();
  });
  
  describe('MessageServerContext', function() {
    var request;
    
    beforeEach(function() {
      request = new SIP.IncomingRequest(ua);
      Message = new SIP.MessageServerContext(ua,request);
    });
    
    it('augments itself', function() {
      expect(SIP.Utils.augment).toHaveBeenCalledWith(Message, SIP.ServerContext, [ua,request]);
    });

    it('sets the content type to text/plain if none is found', function () {
      expect(Message.content_type).toBe('text/plain');
    });
  });
  
  describe('MessageClientContext',function() {
    var target;
    var body;
    var contentType;
    
    beforeEach(function() {
      target = 'alice@example.com';
      body = 'a= sendrecv\r\n';
      contentType = 'text/plain';
      
      Message = new SIP.MessageClientContext(ua,target,body,contentType);  
    });
    
    it('throws an error if the body is undefined', function() {
      expect(function() {new SIP.MessageClientContext(ua,target,undefined,contentType);}).toThrow('Not enough arguments');
    });
    
    it('augments itself when creating a client message context', function() {
      expect(SIP.Utils.augment).toHaveBeenCalledWith(Message, SIP.ClientContext, [ua, 'MESSAGE', target, { contentType: contentType, body: body }]);
    });
    
    it('sets the logger', function() {
      expect(Message.logger).toBe(ua.getLogger('sip.messageclientcontext'));
    });
    
    it('sets the body to the value passed to it', function() {
      expect(Message.body).toBe(body);
    });
    
    it('sets the content type to text/plain if none is defined',function() {
      Message = new SIP.MessageClientContext(ua,target,body,undefined);
      expect(Message.contentType).toEqual('text/plain');
    });
    
    it('sets the content type to the value passed to it', function() {
      expect(Message.contentType).toBe(contentType);
    });
  });
  
  describe('.message', function() {
    var target;
    var body;
    var contentType;
    
    beforeEach(function() {
      target = 'alice@example.com';
      body = 'a= sendrecv\r\n';
      contentType = 'text/plain';
      
      Message = new SIP.MessageClientContext(ua,target,body,contentType);
      Message.ua = new SIP.UA({uri: 'alice@example.com', ws_servers: 'ws:server.example.com'});

      spyOn(Message, 'send');
    });
  });
});