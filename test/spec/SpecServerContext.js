describe('ServerContext', function() {
  var ServerContext;
  var ua;
  var method;
  var request;

  beforeEach(function(){
    ua = new SIP.UA({uri: 'alice@example.com', wsServers: 'ws:server.example.com'});
    ua.transport = jasmine.createSpyObj('transport', ['send', 'connect', 'disconnect', 'reConnect']);

    request = SIP.Parser.parseMessage([
      'REFER sip:gled5gsn@hk95bautgaa7.invalid;transport=ws;aor=james%40onsnip.onsip.com SIP/2.0',
      'Max-Forwards: 65',
      'To: <sip:james@onsnip.onsip.com>',
      'From: "test1" <sip:test1@onsnip.onsip.com>;tag=rto5ib4052',
      'Call-ID: grj0liun879lfj35evfq',
      'CSeq: 1798 INVITE',
      'Contact: <sip:e55r35u3@kgu78r4e1e6j.invalid;transport=ws;ob>',
      'Allow: ACK,CANCEL,BYE,OPTIONS,INVITE,MESSAGE',
      'Content-Type: application/sdp',
      'Supported: outbound',
      'User-Agent: SIP.js 0.5.0-devel',
      'Content-Length: 10',
      '',
      'a=sendrecv',
      ''].join('\r\n'), ua);

    spyOn(SIP.Transactions, 'InviteServerTransaction');
    spyOn(SIP.Transactions, 'NonInviteServerTransaction');

    ServerContext = new SIP.ServerContext(ua,request);
  });

  afterEach(function () {
    ua.stop();
  });

  it('sets the ua', function() {
    expect(ServerContext.ua).toBe(ua);
  });

  it('sets the logger', function() {
    expect(ServerContext.logger).toBe(ua.getLogger('sip.servercontext'));
  });

  it('sets the method', function() {
    expect(ServerContext.method).toBe(SIP.C.REFER);
  });

  it('sets the request', function() {
    expect(ServerContext.request).toBe(request);
  });

  it('sets the body', function () {
    expect(ServerContext.body).toBe('a=sendrecv');
  });

  it('sets the contentType', function () {
    expect(ServerContext.contentType).toBe('application/sdp');
  });

  it('sets the transaction based on the request method', function() {
    expect(SIP.Transactions.NonInviteServerTransaction).toHaveBeenCalledWith(request,ua);
    expect(ServerContext.transaction).toBeDefined();
    request.method = SIP.C.INVITE;
    ServerContext = new SIP.ServerContext(ua,request);
    expect(SIP.Transactions.InviteServerTransaction).toHaveBeenCalledWith(request,ua);
    expect(ServerContext.transaction).toBeDefined();
  });

  it('initializes data', function() {
    expect(ServerContext.data).toBeDefined();
  });

  describe('.progress', function() {
    beforeEach(function() {
      spyOn(ServerContext.request, 'reply').and.returnValue('reply');
    });

    it('defaults to status code 180 if none is provided', function() {
      ServerContext.progress(null);
      expect(ServerContext.request.reply.calls.mostRecent().args[0]).toEqual(180);
    });

    it('throws an error with an invalid status code', function() {
      for (var i = 1; i < 100; i++) {
        expect(function() { ServerContext.progress({statusCode : i}); }).toThrow(TypeError('Invalid statusCode: ' + i));
      }
      for (i = 200; i < 700; i++) {
        expect(function() { ServerContext.progress({statusCode : i}); }).toThrow(TypeError('Invalid statusCode: ' + i));
      }
    });

    it('calls reply with a valid status code and passes along a reason phrase, extra headers, and body', function() {
      for (var i = 100; i < 200; i++) {
        var options = {statusCode : i ,
                        reasonPhrase : 'reason' ,
                        extraHeaders : 'headers' ,
                        body : 'body'}
        ServerContext.progress(options);
        expect(ServerContext.request.reply).toHaveBeenCalledWith(options.statusCode, options.reasonPhrase, options.extraHeaders, options.body);
        ServerContext.request.reply.calls.reset();
      }
    });

    it('emits event progress with a valid status code and response', function() {
      spyOn(ServerContext, 'emit');
      for (var i = 100; i < 200; i++) {
        var options = {statusCode : i};
        ServerContext.progress(options);
        expect(ServerContext.emit.calls.mostRecent().args[0]).toBe('progress');
        ServerContext.emit.calls.reset();
      }
    });

    it('returns itself', function() {
      expect(ServerContext.progress()).toBe(ServerContext);
    });
  });

  describe('.accept', function() {
    beforeEach(function() {
      spyOn(ServerContext.request, 'reply');
    });

    it('defaults to status code 200 if none is provided', function() {
      ServerContext.accept(null);
      expect(ServerContext.request.reply).toHaveBeenCalledWith(200, 'OK', [], undefined);
    });

    it('throws an error with an invalid status code', function() {
      for(var i = 1; i < 200; i++) {
        expect(function() { ServerContext.accept({statusCode : i}); }).toThrow(TypeError('Invalid statusCode: ' + i));
      }
      for (i = 300; i < 700; i++) {
        expect(function() { ServerContext.accept({statusCode : i}); }).toThrow(TypeError('Invalid statusCode: ' + i));
      }
    });

    it('calls reply with a valid status code and passes along a reason phrase, extra headers, and body', function() {
      var counter = 0;
      for (var i = 200; i < 300; i++) {
        var options = {statusCode : i ,
                        reasonPhrase : 'reason' ,
                        extraHeaders : 'headers' ,
                       body : 'body'};
        ServerContext.accept(options);
        expect(ServerContext.request.reply).toHaveBeenCalledWith(options.statusCode, options.reasonPhrase, options.extraHeaders, options.body);
        ServerContext.request.reply.calls.reset();
      }
    });

    it('emits event accepted with a valid status code and null response', function() {
      spyOn(ServerContext, 'emit');
      for (var i = 200; i < 300; i++) {
        var options = {statusCode : i};
        ServerContext.accept(options);
        expect(ServerContext.emit.calls.mostRecent().args[0]).toBe('accepted');
        ServerContext.emit.calls.reset();
      }
    });

    it('returns itself', function() {
      expect(ServerContext.accept()).toBe(ServerContext);
    });
  });

  describe('.reject', function() {
    beforeEach(function() {
      spyOn(ServerContext.request, 'reply');
    });

    it('defaults to status code 480 if none is provided', function() {
      ServerContext.reject(null);
      expect(ServerContext.request.reply).toHaveBeenCalledWith(480, 'Temporarily Unavailable', [], undefined);
    });

    it('throws an error with an invalid status code', function() {
      for(var i = 1; i < 300; i++) {
        expect(function() { ServerContext.reject({statusCode : i}); }).toThrow(TypeError('Invalid statusCode: ' + i));
      }
    });

    it('calls reply with a valid status code and passes along a reason phrase, extra headers, and body', function() {
      for (var i = 300; i < 700; i++) {
        var options = {statusCode : i,
                        reasonPhrase : 'reason',
                        extraHeaders : 'headers',
                       body : 'body'};
        ServerContext.reject(options);
        expect(ServerContext.request.reply).toHaveBeenCalledWith(options.statusCode, options.reasonPhrase, options.extraHeaders, options.body);
        ServerContext.request.reply.calls.reset();
      }
    });

    it('emits event rejected and event fails with a valid status code and null response and reasonPhrase for a cause', function() {
      var options = {statusCode: i, reasonPhrase: 'reason'};
      spyOn(ServerContext, 'emit');
      for (var i = 300; i < 700; i++) {
        options.statusCode = i;
        ServerContext.reject(options);
        expect(ServerContext.emit).toHaveBeenCalledWith('rejected', undefined, options.reasonPhrase);
        expect(ServerContext.emit).toHaveBeenCalledWith('failed', undefined, options.reasonPhrase);
        ServerContext.emit.calls.reset();
      }
    });

    it('returns itself', function() {
      var options = {};
      expect(ServerContext.reject(options)).toBe(ServerContext);
    });
  });

  describe('.reply', function() {
    beforeEach(function() {
      spyOn(ServerContext.request, 'reply');
    });

    it('passes along the status code, reason phrase, header, and body as is to request reply', function() {
      for( var i = 100; i < 700; i++) {
        var options={statusCode : i ,
                      reasonPhrase : 'reason' ,
                      extraHeaders : 'headers' ,
                      body : 'body text' }
        ServerContext.reply(options);
        expect(ServerContext.request.reply).toHaveBeenCalledWith(options.statusCode, options.reasonPhrase, options.extraHeaders, options.body);
        ServerContext.request.reply.calls.reset();
      }
    });

    it('returns itself', function() {
      var options = {};
      expect(ServerContext.reply(options)).toBe(ServerContext);
    });
  });


  describe('.onRequestTimeout', function() {
    it('emits failed with a status code 0, null response, and request timeout cause', function() {
      spyOn(ServerContext, 'emit');

      ServerContext.onRequestTimeout();

      expect(ServerContext.emit).toHaveBeenCalledWith('failed', null, SIP.C.causes.REQUEST_TIMEOUT);
    });
  });

  describe('.onTransportError', function() {
    it('emits failed with a status code 0, null response, and connection error cause', function() {
      spyOn(ServerContext, 'emit');

      ServerContext.onTransportError();

      expect(ServerContext.emit).toHaveBeenCalledWith('failed', null, SIP.C.causes.CONNECTION_ERROR);
    });
  });
});
