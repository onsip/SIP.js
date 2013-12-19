describe('MessageContext', function() {
  var MessageContext;
  var ua;
  var sipUtilsCleanup;
  
  beforeEach(function() {
    ua = jasmine.createSpyObj('ua',['getLogger','applicants']);
    sipUtilsCleanup = SIP.Utils;
    SIP.Utils = jasmine.createSpyObj('Utils',['augment']);
    SIP.Utils.augment.andCallFake(function() {
      return true;
    });
    ua.getLogger.andCallFake(function(){
      return jasmine.createSpyObj('logger',['log']);
    });
  });
  
  afterEach(function() {
    SIP.Utils = sipUtilsCleanup;
  });
  
  describe('when creating a server message context', function() {
    var request;
    
    beforeEach(function() {
      request = 'request';
      MessageContext = new SIP.MessageServerContext(ua,request);
    });
    
    it('should augment itself when creating a server message context', function() {
      expect(SIP.Utils.augment).toHaveBeenCalledWith(MessageContext, SIP.ServerContext, [ua,request]);
    });
  });
  
  describe('when creating a message client context',function() {
    var target;
    var body;
    var contentType;
    
    beforeEach(function() {
      target = 'target';
      body = 'body';
      contentType = 'type';
      
      MessageContext = new SIP.MessageClientContext(ua,target,body,contentType);  
    });
    
    it('should throw an error if the body is undefined', function() {
      expect(function() {new SIP.MessageClientContext(ua,target,undefined,contentType);}).toThrow('Not enough arguments');
    });
    
    it('should augment itself when creating a client message context', function() {
      expect(SIP.Utils.augment).toHaveBeenCalledWith(MessageContext, SIP.ClientContext, [ua, 'MESSAGE', target]);
    });
    
    it('should set the logger', function() {
      expect(MessageContext.logger).toBeDefined();
    });
    
    it('should set the body to the value passed to it', function() {
      expect(MessageContext.body).toBe(body);
    });
    
    it('should set the content type to text/plain if none is defined',function() {
      MessageContext = new SIP.MessageClientContext(ua,target,body,undefined);
      expect(MessageContext.contentType).toEqual('text/plain');
    });
    
    it('should set the content type to the value passed to it', function() {
      expect(MessageContext.contentType).toBe(contentType);
    });
  });
  
  describe('calling message in Message Client Context', function() {
    var target;
    var body;
    var contentType;
    
    beforeEach(function() {
      target = 'target';
      body = 'body';
      contentType = 'type';
      
      MessageContext = new SIP.MessageClientContext(ua,target,body,contentType);
      MessageContext.ua = {applicants : [MessageContext]};
      MessageContext.send = jasmine.createSpy('send').andCallFake(function(){ return 'sent'; });
    });
    
    it('should default the options if none are provided', function() {
      MessageContext.message(null);
      expect(MessageContext.send).toHaveBeenCalledWith({ extraHeaders : [ 'Content-Type: ' + contentType ], body : body } );
    });
    
    it('should pass the options that are provided to it', function() {
      var options = { extraHeaders : ['headers'],
                      body : 'body' };
      MessageContext.message(options);
      expect(MessageContext.send).toHaveBeenCalledWith({ extraHeaders : [ options.extraHeaders[0], 'Content-Type: ' + contentType ] , body : options.body });
    });
  });
});