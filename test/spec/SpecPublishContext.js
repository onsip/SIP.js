describe('PublishContext', function() {
  var Publish;
  var ua;

  beforeEach(function() {
    ua = new SIP.UA({uri: 'alice@example.com'}).start();

    var testOptions = { extraHeaders: ['X-Foo: foo', 'X-Bar: bar'] };
    Publish = new SIP.PublishContext(ua, 'alice@example.com', 'presence', testOptions);

  });

  afterEach(function() {
    if(ua.status !== 2) {
      ua.stop();
    }
  });

  describe('constructor', function() {
    it('set defaults, no options provided', function() {
      Publish = new SIP.PublishContext(ua, 'alice@example.com', 'presence');

      expect(Publish.pubRequestBody).toBeUndefined();
      expect(Publish.pubRequestEtag).toBeUndefined();
      expect(Publish.publish_refresh_timer).toBeUndefined();
      expect(Publish.pubRequestExpires).toBe(3600);
      expect(Publish.options.extraHeaders).toEqual([]);
      expect(Publish.options.contentType).toBe('text/plain');
      expect(Publish.options.body).toBeUndefined();
      expect(Publish.options.expires).toBe(3600);
      expect(Publish.options.unpublishOnClose).toBe(true);
      expect(Publish.target instanceof(SIP.URI)).toBeTruthy();
      expect(Publish.event).toBe('presence');
      expect(Publish.request).toBeDefined();
      expect(Publish.logger).toBeDefined();
      expect(Publish.method).toBe(SIP.C.PUBLISH);

    });

    it('override defaults with options object', function() {
      var testOptions = {
		contentType: 'application/json',
		expires: 180,
		extraHeaders: ['X-Foo: foo', 'X-Bar: bar'],
                unpublishOnClose: false
      };

      Publish = new SIP.PublishContext(ua, 'alice@example.com', 'presence', testOptions);

      expect(Publish.pubRequestBody).toBeUndefined();
      expect(Publish.pubRequestEtag).toBeUndefined();
      expect(Publish.publish_refresh_timer).toBeUndefined();
      expect(Publish.pubRequestExpires).toBe(180);
      expect(Publish.options.extraHeaders).toEqual(['X-Foo: foo','X-Bar: bar']);
      expect(Publish.options.contentType).toBe('application/json');
      expect(Publish.options.expires).toBe(180);
      expect(Publish.options.unpublishOnClose).toBe(false);
      expect(Publish.target instanceof(SIP.URI)).toBeTruthy();
      expect(Publish.event).toBe('presence');
      expect(Publish.options.body).toBeUndefined();
      expect(Publish.request).toBeDefined();
      expect(Publish.logger).toBeDefined();
      expect(Publish.method).toBe(SIP.C.PUBLISH);

    });

    it('throws a type error if event is not set', function() {
      expect(function() {new SIP.PublishContext(ua, 'alice@example.com');}).toThrowError('Missing parameter: Event');
    });

    it('throws a type error if event is empty', function() {
      expect(function() {new SIP.PublishContext(ua, 'alice@example.com', '');}).toThrowError('Missing parameter: Event');
    });

    it('throws a type error if target is not set', function() {
      expect(function() {new SIP.PublishContext(ua);}).toThrowError('Missing parameter: Target');
    });

    it('throws a type error if target is empty', function() {
      expect(function() {new SIP.PublishContext(ua, '');}).toThrowError('Missing parameter: Target');
    });

    it('sets expires to 3600 if non-number is passed', function() {
      var testOptions = { expires: 'bad' };

      Publish = new SIP.PublishContext(ua, 'alice@example.com', 'presence', testOptions);

      expect(Publish.options.expires).toBe(3600);
      expect(Publish.pubRequestExpires).toBe(3600);
    });

  });

  describe('.publish', function() {
    it('publish initial call after the object init', function() {
      spyOn(Publish, 'sendPublishRequest');

      Publish.publish('ExampleBody');

      expect(Publish.pubRequestEtag).toBeUndefined();
      expect(Publish.pubRequestBody).toBe('ExampleBody');
      expect(Publish.pubRequestExpires).toBe(3600);

      expect(Publish.event).toBe('presence');
      expect(Publish.target instanceof(SIP.URI)).toBeTruthy();
      expect(Publish.options.body).toBe('ExampleBody');

      expect(Publish.sendPublishRequest.calls.count()).toBe(1);

      expect(ua.publishers['sip:alice@example.com'+':'+'presence']).toBe(Publish);
    });

    it('refreshRequest call with no body and no ETag', function() {
      spyOn(Publish, 'sendPublishRequest');

      Publish.request = true;

      expect(function() {Publish.refreshRequest();}).toThrowError('Missing parameter: Body');

      expect(Publish.pubRequestEtag).toBeUndefined();
      expect(Publish.pubRequestBody).toBeUndefined();
      expect(Publish.pubRequestExpires).toBe(3600);

      expect(Publish.event).toBe('presence');
      expect(Publish.target instanceof(SIP.URI)).toBeTruthy();
      expect(Publish.options.body).toBeUndefined();

      expect(Publish.sendPublishRequest.calls.count()).toBe(0);

      expect(ua.publishers['sip:alice@example.com'+':'+'presence']).toBeUndefined();;
    });

    it('refreshRequest call with no body and Expire = 0', function() {
      spyOn(Publish, 'sendPublishRequest');

      Publish.request = true;
      Publish.pubRequestEtag = 'SomeValue';
      Publish.pubRequestExpires = 0;

      expect(function() {Publish.refreshRequest();}).toThrowError('Missing parameter: Expire');

      expect(Publish.pubRequestEtag).toBe('SomeValue');
      expect(Publish.pubRequestBody).toBeUndefined();
      expect(Publish.pubRequestExpires).toBe(0);

      expect(Publish.event).toBe('presence');
      expect(Publish.target instanceof(SIP.URI)).toBeTruthy();
      expect(Publish.options.body).toBeUndefined();

      expect(Publish.sendPublishRequest.calls.count()).toBe(0);

      expect(ua.publishers['sip:alice@example.com'+':'+'presence']).toBeUndefined();;
    })

    it('publish modify call, with both body and ETag set', function() {
      spyOn(Publish, 'sendPublishRequest');

      Publish.body = 'ExampleBody';
      Publish.pubRequestExpires = 180;
      Publish.pubRequestEtag = 'TestETag';
      Publish.request = true;

      Publish.publish('ExampleBodyModify');

      expect(Publish.pubRequestEtag).toBe('TestETag');
      expect(Publish.pubRequestBody).toBe('ExampleBodyModify');
      expect(Publish.pubRequestExpires).toBe(180);

      expect(Publish.event).toBe('presence');
      expect(Publish.target instanceof(SIP.URI)).toBeTruthy();
      expect(Publish.options.body).toBe('ExampleBodyModify');

      expect(Publish.sendPublishRequest.calls.count()).toBe(1);

      expect(ua.publishers['sip:alice@example.com'+':'+'presence']).toBe(Publish);
    });

    it('refreshRequest call, with no body but with ETag set', function() {
      spyOn(Publish, 'sendPublishRequest');

      Publish.options.body = 'ExampleBody';
      Publish.pubRequestBody = 'ExampleBody';
      Publish.pubRequestExpires = 180;
      Publish.pubRequestEtag = 'TestETag';
      Publish.request = true;
      ua.publishers['sip:alice@example.com'+':'+'presence'] = Publish;

      Publish.refreshRequest();

      expect(Publish.pubRequestEtag).toBe('TestETag');
      expect(Publish.pubRequestBody).toBeUndefined();
      expect(Publish.pubRequestExpires).toBe(180);

      expect(Publish.event).toBe('presence');
      expect(Publish.target instanceof(SIP.URI)).toBeTruthy();
      expect(Publish.options.body).toBe('ExampleBody');

      expect(Publish.sendPublishRequest.calls.count()).toBe(1);

      expect(ua.publishers['sip:alice@example.com'+':'+'presence']).toBe(Publish);
    });

    it('publish call with body and no ETag set, with Expires = 0 after unpublish', function() {
      spyOn(Publish, 'sendPublishRequest');

      Publish.options.body = 'ExampleBody';
      Publish.pubRequestBody = undefined;
      Publish.pubRequestExpires = 0;
      Publish.pubRequestEtag = undefined;
      Publish.request = true;
      ua.publishers['sip:alice@example.com'+':'+'presence'] = Publish;

      Publish.publish('ExampleBodyNew');

      expect(Publish.pubRequestEtag).toBeUndefined();
      expect(Publish.pubRequestBody).toBe('ExampleBodyNew');
      expect(Publish.pubRequestExpires).toBe(3600);

      expect(Publish.event).toBe('presence');
      expect(Publish.target instanceof(SIP.URI)).toBeTruthy();
      expect(Publish.options.body).toBe('ExampleBodyNew');

      expect(Publish.sendPublishRequest.calls.count()).toBe(1);

      expect(ua.publishers['sip:alice@example.com'+':'+'presence']).toBe(Publish);
    });

  });

  describe('.unpublish', function() {
    it('unpublish call with ETag set', function() {
      spyOn(Publish, 'sendPublishRequest');

      Publish.options.body = 'ExampleBody';
      Publish.pubRequestBody = 'ExampleBody';
      Publish.pubRequestExpires = 180;
      Publish.pubRequestEtag = 'TestETag';
      Publish.request = true;
      ua.publishers['sip:alice@example.com'+':'+'presence'] = Publish;

      Publish.unpublish();

      expect(Publish.pubRequestEtag).toBe('TestETag');
      expect(Publish.pubRequestBody).toBeUndefined();
      expect(Publish.pubRequestExpires).toBe(0);

      expect(Publish.event).toBe('presence');
      expect(Publish.target instanceof(SIP.URI)).toBeTruthy();
      expect(Publish.options.body).toBe('ExampleBody');

      expect(Publish.sendPublishRequest.calls.count()).toBe(1);

      expect(ua.publishers['sip:alice@example.com'+':'+'presence']).toBe(Publish);
    });

    it('unpublish call with no ETag set', function() {
      spyOn(Publish, 'sendPublishRequest');

      Publish.options.body = 'ExampleBody';
      Publish.pubRequestBody = 'ExampleBody';
      Publish.pubRequestExpires = 180;
      Publish.pubRequestEtag = undefined;
      Publish.request = true;
      ua.publishers['sip:alice@example.com'+':'+'presence'] = Publish;

      Publish.unpublish();

      expect(Publish.pubRequestEtag).toBeUndefined();
      expect(Publish.pubRequestBody).toBeUndefined();
      expect(Publish.pubRequestExpires).toBe(0);

      expect(Publish.event).toBe('presence');
      expect(Publish.target instanceof(SIP.URI)).toBeTruthy();
      expect(Publish.options.body).toBe('ExampleBody');

      expect(Publish.sendPublishRequest.calls.count()).toBe(0);

      expect(ua.publishers['sip:alice@example.com'+':'+'presence']).toBe(Publish);
    });

  });

  describe('.close', function() {
    it('close call with options.unpublishOnClose set to true', function() {
      spyOn(Publish, 'unpublish');
      Publish.options.unpublishOnClose = true;
      ua.publishers['sip:alice@example.com'+':'+'presence'] = Publish;

      Publish.close();

      expect(Publish.unpublish.calls.count()).toBe(1);
      expect(ua.publishers['sip:alice@example.com'+':'+'presence']).toBeUndefined();;
    });

    it('close call with options.unpublishOnClose set to false', function() {
      spyOn(Publish, 'unpublish');
      Publish.options.unpublishOnClose = false;
      ua.publishers['sip:alice@example.com'+':'+'presence'] = Publish;

      Publish.close();

      expect(Publish.pubRequestEtag).toBeUndefined();
      expect(Publish.pubRequestBody).toBeUndefined();
      expect(Publish.pubRequestExpires).toBe(0);

      expect(Publish.unpublish.calls.count()).toBe(0);
      expect(ua.publishers['sip:alice@example.com'+':'+'presence']).toBeUndefined();;
    });

    it('close call with undefined publishers', function() {
      spyOn(Publish, 'unpublish');
      Publish.options.unpublishOnClose = true;
      ua.publishers['sip:alice@example.com'+':'+'presence'] === undefined;

      Publish.close();

      expect(Publish.unpublish.calls.count()).toBe(1);
      expect(ua.publishers['sip:alice@example.com'+':'+'presence']).toBeUndefined();;
    });

  });

  describe('.sendPublishRequest', function() {
    it('send publish request with body and ETag', function() {
      spyOn(Publish, 'send');

      Publish.pubRequestBody = 'ExampleBody';
      Publish.pubRequestExpires = 180;
      Publish.pubRequestEtag = 'TestETag';
      Publish.request = undefined;

      Publish.sendPublishRequest();

      expect(Publish.request instanceof(SIP.OutgoingRequest)).toBeTruthy();

      expect(Publish.request.body.body).toBe('ExampleBody');
      expect(Publish.request.body.contentType).toBe('text/plain');

      expect(Publish.request.extraHeaders).toEqual(jasmine.arrayContaining(['X-Foo: foo', 'X-Bar: bar', 'Event: presence', 'Expires: 180', 'SIP-If-Match: TestETag']));

      expect(Publish.send.calls.count()).toBe(1);

    });

    it('send publish request with no body', function() {
      spyOn(Publish, 'send');

      Publish.pubRequestBody = undefined;
      Publish.pubRequestExpires = 180;
      Publish.pubRequestEtag = 'TestETag';
      Publish.request = undefined;

      Publish.sendPublishRequest();

      expect(Publish.request instanceof(SIP.OutgoingRequest)).toBeTruthy();

      expect(Publish.request.body).toBeUndefined();

      expect(Publish.request.extraHeaders).toEqual(jasmine.arrayContaining(['X-Foo: foo', 'X-Bar: bar', 'Event: presence', 'Expires: 180', 'SIP-If-Match: TestETag']));

      expect(Publish.send.calls.count()).toBe(1);

    });

  });

  describe('.receiveResponse', function() {
    it('1xx provisional response to PUBLISH', function() {
      spyOn(Publish, 'emit');

      Publish.pubRequestBody = 'ExampleBody';
      Publish.pubRequestExpires = 180;
      Publish.pubRequestEtag = 'TestETag';

      response = SIP.Parser.parseMessage([
        'SIP/2.0 100 Trying',
        'To: <sip:james@onsnip.onsip.com>;tag=1ma2ki9411',
        'From: "test1" <sip:test1@onsnip.onsip.com>;tag=58312p20s2',
        'Call-ID: upfrf7jpeb3rmc0gnnq1',
        'CSeq: 9059 PUBLISH',
        'Contact: <sip:gusgt9j8@vk3dj582vbu9.invalid;transport=ws>',
        'Event: presence',
        'Expires: 3600',
        'Supported: outbound',
        'SIP-ETag: 2SiNlejw',
        'Content-Length: 0',
        '',
        ''].join('\r\n'), ua.getLogger("sip.parser"));

      Publish.receiveResponse(response);

      expect(Publish.pubRequestEtag).toBe('TestETag');
      expect(Publish.pubRequestBody).toBe('ExampleBody');
      expect(Publish.pubRequestExpires).toBe(180);

      expect(Publish.emit).toHaveBeenCalledWith('progress', response, 'Trying');
    });

    it('2xx response to PUBLISH non-removal request with ETag and Expires tags', function() {
      spyOn(Publish, 'emit');
      spyOn(window, 'setTimeout');

      Publish.pubRequestBody = 'ExampleBody';
      Publish.pubRequestExpires = 3600;
      Publish.pubRequestEtag = 'TestETag';

      response = SIP.Parser.parseMessage([
        'SIP/2.0 200 OK',
        'To: <sip:james@onsnip.onsip.com>;tag=1ma2ki9411',
        'From: "test1" <sip:test1@onsnip.onsip.com>;tag=58312p20s2',
        'Call-ID: upfrf7jpeb3rmc0gnnq1',
        'CSeq: 9059 PUBLISH',
        'Contact: <sip:gusgt9j8@vk3dj582vbu9.invalid;transport=ws>',
        'Event: presence',
        'Expires: 180',
        'Supported: outbound',
        'SIP-ETag: 2SiNlejw',
        'Content-Length: 0',
        '',
        ''].join('\r\n'), ua.getLogger("sip.parser"));

      Publish.receiveResponse(response);

      Publish.pubRequestBody = 'ExampleBody';
      Publish.pubRequestExpires = 180;
      Publish.pubRequestEtag = '2SiNlejw';

      expect(setTimeout).toHaveBeenCalledWith(jasmine.any(Function), 180*900);
      expect(Publish.emit).toHaveBeenCalledWith('published', response, 'OK');
    });

    it('2xx response to PUBLISH non-removal request with Expires = 0', function() {
      spyOn(Publish, 'emit');
      spyOn(window, 'setTimeout');

      Publish.pubRequestBody = 'ExampleBody';
      Publish.pubRequestExpires = 3600;
      Publish.pubRequestEtag = 'TestETag';

      response = SIP.Parser.parseMessage([
        'SIP/2.0 200 OK',
        'To: <sip:james@onsnip.onsip.com>;tag=1ma2ki9411',
        'From: "test1" <sip:test1@onsnip.onsip.com>;tag=58312p20s2',
        'Call-ID: upfrf7jpeb3rmc0gnnq1',
        'CSeq: 9059 PUBLISH',
        'Contact: <sip:gusgt9j8@vk3dj582vbu9.invalid;transport=ws>',
        'Event: presence',
        'Expires: 0',
        'Supported: outbound',
        'SIP-ETag: 2SiNlejw',
        'Content-Length: 0',
        '',
        ''].join('\r\n'), ua.getLogger("sip.parser"));

      Publish.receiveResponse(response);

      Publish.pubRequestBody = undefined;
      Publish.pubRequestExpires = 0;
      Publish.pubRequestEtag = undefined;

      expect(setTimeout).not.toHaveBeenCalled();
      expect(Publish.emit).toHaveBeenCalledWith('unpublished', response, 'OK');
    });

    it('2xx response to PUBLISH removal request', function() {
      spyOn(Publish, 'emit');
      spyOn(window, 'setTimeout');

      Publish.pubRequestBody = undefined;
      Publish.pubRequestExpires = 0;
      Publish.pubRequestEtag = 'TestETag';

      response = SIP.Parser.parseMessage([
        'SIP/2.0 200 OK',
        'To: <sip:james@onsnip.onsip.com>;tag=1ma2ki9411',
        'From: "test1" <sip:test1@onsnip.onsip.com>;tag=58312p20s2',
        'Call-ID: upfrf7jpeb3rmc0gnnq1',
        'CSeq: 9059 PUBLISH',
        'Contact: <sip:gusgt9j8@vk3dj582vbu9.invalid;transport=ws>',
        'Event: presence',
        'Expires: 3600',
        'Supported: outbound',
        'SIP-ETag: TestETag',
        'Content-Length: 0',
        '',
        ''].join('\r\n'), ua.getLogger("sip.parser"));
      Publish.receiveResponse(response);

      Publish.pubRequestBody = undefined;
      Publish.pubRequestExpires = 0;
      Publish.pubRequestEtag = undefined;

      expect(setTimeout).not.toHaveBeenCalled();
      expect(Publish.emit).toHaveBeenCalledWith('unpublished', response, 'OK');
    });

    it('412 response to PUBLISH for non-removal request', function() {
      spyOn(Publish, 'emit');
      spyOn(Publish, 'publish');
      spyOn(Publish.logger, 'warn');

      Publish.options.body = 'ExampleBody';
      Publish.pubRequestBody = undefined;
      Publish.pubRequestExpires = 180;
      Publish.pubRequestEtag = 'TestETag';

      response = SIP.Parser.parseMessage([
        'SIP/2.0 412 Conditional Request Failed',
        'To: <sip:james@onsnip.onsip.com>;tag=1ma2ki9411',
        'From: "test1" <sip:test1@onsnip.onsip.com>;tag=58312p20s2',
        'Call-ID: upfrf7jpeb3rmc0gnnq1',
        'CSeq: 9059 PUBLISH',
        'Contact: <sip:gusgt9j8@vk3dj582vbu9.invalid;transport=ws>',
        'Event: presence',
        'Supported: outbound',
        'Content-Length: 0',
        '',
        ''].join('\r\n'), ua.getLogger("sip.parser"));

      Publish.receiveResponse(response);

      Publish.pubRequestBody = undefined;
      Publish.pubRequestExpires = 180;
      Publish.pubRequestEtag = undefined;

      expect(Publish.publish).toHaveBeenCalledWith('ExampleBody');
      expect(Publish.logger.warn).toHaveBeenCalledWith('412 response to PUBLISH, recovering');
      expect(Publish.emit).toHaveBeenCalledWith('progress', response, 'Conditional Request Failed');
    });

    it('412 response to PUBLISH for removal request', function() {
      spyOn(Publish, 'emit');
      spyOn(Publish.logger, 'warn');

      Publish.pubRequestBody = 'ExampleBody';
      Publish.pubRequestExpires = 0;
      Publish.pubRequestEtag = 'TestETag';

      response = SIP.Parser.parseMessage([
        'SIP/2.0 412 Conditional Request Failed',
        'To: <sip:james@onsnip.onsip.com>;tag=1ma2ki9411',
        'From: "test1" <sip:test1@onsnip.onsip.com>;tag=58312p20s2',
        'Call-ID: upfrf7jpeb3rmc0gnnq1',
        'CSeq: 9059 PUBLISH',
        'Contact: <sip:gusgt9j8@vk3dj582vbu9.invalid;transport=ws>',
        'Event: presence',
        'Supported: outbound',
        'Content-Length: 0',
        '',
        ''].join('\r\n'), ua.getLogger("sip.parser"));

      Publish.receiveResponse(response);

      Publish.pubRequestBody = undefined;
      Publish.pubRequestExpires = 0;
      Publish.pubRequestEtag = undefined;

      expect(Publish.logger.warn).toHaveBeenCalledWith('412 response to PUBLISH, recovery failed');
      expect(Publish.emit).toHaveBeenCalledWith('failed', response, 'Conditional Request Failed');
      expect(Publish.emit).toHaveBeenCalledWith('unpublished', response, 'Conditional Request Failed');
    });

    it('423 response to PUBLISH, recovery attempt', function() {
      spyOn(Publish, 'emit');
      spyOn(Publish, 'publish');
      spyOn(Publish.logger, 'warn');

      Publish.options.body = 'ExampleBody';
      Publish.pubRequestBody = 'ExampleBody';
      Publish.pubRequestExpires = 60;
      Publish.pubRequestEtag = 'TestETag';

      response = SIP.Parser.parseMessage([
        'SIP/2.0 423 Interval Too Brief',
        'To: <sip:james@onsnip.onsip.com>;tag=1ma2ki9411',
        'From: "test1" <sip:test1@onsnip.onsip.com>;tag=58312p20s2',
        'Call-ID: upfrf7jpeb3rmc0gnnq1',
        'CSeq: 9059 PUBLISH',
        'Contact: <sip:gusgt9j8@vk3dj582vbu9.invalid;transport=ws>',
        'Event: presence',
        'Min-Expires: 1800',
        'Supported: outbound',
        'Content-Length: 0',
        '',
        ''].join('\r\n'), ua.getLogger("sip.parser"));

      Publish.receiveResponse(response);

      Publish.pubRequestBody = 'ExampleBody';
      Publish.pubRequestExpires = 1800;
      Publish.pubRequestEtag = 'TestETag';

      expect(Publish.publish).toHaveBeenCalledWith('ExampleBody');
      expect(Publish.logger.warn).toHaveBeenCalledWith('423 code in response to PUBLISH, adjusting the Expires value and trying to recover');
      expect(Publish.emit).toHaveBeenCalledWith('progress', response, 'Interval Too Brief');
    });

    it('423 response to PUBLISH, failed recovery attempt', function() {
      spyOn(Publish, 'emit');
      spyOn(Publish, 'publish');
      spyOn(Publish.logger, 'warn');

      Publish.pubRequestBody = 'ExampleBody';
      Publish.pubRequestExpires = 0;
      Publish.pubRequestEtag = 'TestETag';

      response = SIP.Parser.parseMessage([
        'SIP/2.0 423 Interval Too Brief',
        'To: <sip:james@onsnip.onsip.com>;tag=1ma2ki9411',
        'From: "test1" <sip:test1@onsnip.onsip.com>;tag=58312p20s2',
        'Call-ID: upfrf7jpeb3rmc0gnnq1',
        'CSeq: 9059 PUBLISH',
        'Contact: <sip:gusgt9j8@vk3dj582vbu9.invalid;transport=ws>',
        'Event: presence',
        'Min-Expires: 1800',
        'Supported: outbound',
        'Content-Length: 0',
        '',
        ''].join('\r\n'), ua.getLogger("sip.parser"));

      Publish.receiveResponse(response);

      Publish.pubRequestBody = undefined;
      Publish.pubRequestExpires = 0;
      Publish.pubRequestEtag = undefined;

      expect(Publish.logger.warn).toHaveBeenCalledWith('423 response to PUBLISH, recovery failed');
      expect(Publish.emit).toHaveBeenCalledWith('failed', response, 'Interval Too Brief');
      expect(Publish.emit).toHaveBeenCalledWith('unpublished', response, 'Interval Too Brief');
    });

    it('Default for 3xx, 4xx (except 412, 423), 6xx response to PUBLISH', function() {
      spyOn(Publish, 'emit');

      Publish.pubRequestBody = 'ExampleBody';
      Publish.pubRequestExpires = 180;
      Publish.pubRequestEtag = 'TestETag';

      response = SIP.Parser.parseMessage([
        'SIP/2.0 480 Temporarily Unavailable',
        'To: <sip:james@onsnip.onsip.com>;tag=1ma2ki9411',
        'From: "test1" <sip:test1@onsnip.onsip.com>;tag=58312p20s2',
        'Call-ID: upfrf7jpeb3rmc0gnnq1',
        'CSeq: 9059 PUBLISH',
        'Contact: <sip:gusgt9j8@vk3dj582vbu9.invalid;transport=ws>',
        'Event: presence',
        'Expires: 3600',
        'Supported: outbound',
        'SIP-ETag: TestETag',
        'Content-Length: 0',
        '',
        ''].join('\r\n'), ua.getLogger("sip.parser"));

      Publish.receiveResponse(response);

      expect(Publish.pubRequestEtag).toBeUndefined();
      expect(Publish.pubRequestBody).toBeUndefined();
      expect(Publish.pubRequestExpires).toBe(0);

      expect(Publish.emit).toHaveBeenCalledWith('failed', response, 'Temporarily Unavailable');
      expect(Publish.emit).toHaveBeenCalledWith('unpublished', response, 'Temporarily Unavailable');
    });

  });

  describe('.onRequestTimeout', function() {
    it('Request timeout handling', function() {
      spyOn(SIP.ClientContext.prototype, 'onRequestTimeout');
      spyOn(Publish, 'emit');

      Publish.onRequestTimeout();

      expect(SIP.ClientContext.prototype.onRequestTimeout.calls.count()).toBe(1);
      expect(Publish.emit).toHaveBeenCalledWith('unpublished', undefined, SIP.C.causes.REQUEST_TIMEOUT);
    });

  });

  describe('.onTransportError', function() {
    it('Transport error handling', function() {
      spyOn(SIP.ClientContext.prototype, 'onTransportError');
      spyOn(Publish, 'emit');

      Publish.onTransportError();

      expect(SIP.ClientContext.prototype.onTransportError.calls.count()).toBe(1);
      expect(Publish.emit).toHaveBeenCalledWith('unpublished', undefined, SIP.C.causes.CONNECTION_ERROR);
    });

  });

});
