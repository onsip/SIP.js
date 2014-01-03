describe('MessageContext', function() {
  var MessageContext;
  var ua;
  
  beforeEach(function() {
    ua = new SIP.UA({uri: 'alice@example.com', ws_servers: 'ws:server.example.com'});
    spyOn(SIP.Utils, 'augment').andCallThrough();
  });
  
  describe('MessageServerContext', function() {
    var request;
    
    beforeEach(function() {
      request = new SIP.IncomingRequest(ua);
      MessageContext = new SIP.MessageServerContext(ua,request);
    });
    
    it('augments itself', function() {
      expect(SIP.Utils.augment).toHaveBeenCalledWith(MessageContext, SIP.ServerContext, [ua,request]);
    });

    it('sets the content type to text/plain if none is found', function () {
      expect(MessageContext.content_type).toBe('text/plain');
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
      
      MessageContext = new SIP.MessageClientContext(ua,target,body,contentType);  
    });
    
    it('throws an error if the body is undefined', function() {
      expect(function() {new SIP.MessageClientContext(ua,target,undefined,contentType);}).toThrow('Not enough arguments');
    });
    
    it('augments itself when creating a client message context', function() {
      expect(SIP.Utils.augment).toHaveBeenCalledWith(MessageContext, SIP.ClientContext, [ua, 'MESSAGE', target]);
    });
    
    it('sets the logger', function() {
      expect(MessageContext.logger).toBe(ua.getLogger('sip.messageclientcontext'));
    });
    
    it('sets the body to the value passed to it', function() {
      expect(MessageContext.body).toBe(body);
    });
    
    it('sets the content type to text/plain if none is defined',function() {
      MessageContext = new SIP.MessageClientContext(ua,target,body,undefined);
      expect(MessageContext.content_type).toEqual('text/plain');
    });
    
    it('sets the content type to the value passed to it', function() {
      expect(MessageContext.content_type).toBe(contentType);
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
      
      MessageContext = new SIP.MessageClientContext(ua,target,body,contentType);
      MessageContext.ua = new SIP.UA({uri: 'alice@example.com', ws_servers: 'ws:server.example.com'});

      spyOn(MessageContext, 'send');
    });
    
    it('defaults the options if none are provided', function() {
      MessageContext.message(null);
      expect(MessageContext.send).toHaveBeenCalledWith({ extraHeaders : [ 'Content-Type: ' + contentType ], body : body } );
    });
    
    it('passes the options that are provided to it', function() {
      var options = { extraHeaders : ['headers'],
                      body : 'body' };
      MessageContext.message(options);
      expect(MessageContext.send).toHaveBeenCalledWith({ extraHeaders : [ options.extraHeaders[0], 'Content-Type: ' + contentType ] , body : options.body });
    });
  });
});