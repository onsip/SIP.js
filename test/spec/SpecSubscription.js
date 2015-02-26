describe('Subscription', function() {
  var Subscription;
  var ua;

  beforeEach(function() {
    ua = new SIP.UA({uri: 'james@onsnip.onsip.com'}).start();

    Subscription = new SIP.Subscription(ua, 'james@onsnip.onsip.com', 'dialog');
  });

  afterEach(function() {
    if(ua.status !== 2) {
      ua.stop();
    }
  });

  describe('initialization', function() {
    it('sets id and state', function() {
      Subscription = new SIP.Subscription(ua, 'alice@example.com', 'dialog');

      expect(Subscription.id).toBeNull();
      expect(Subscription.state).toBe('init');
    });

    it('throws a type error if event is not set', function() {
      expect(function() {new SIP.Subscription(ua, 'alice@example.com');}).toThrowError('Event necessary to create a subscription.');
    });

    it('sets expires to 3600 if nothing is passed, or a non-number is passed', function() {
      Subscription = new SIP.Subscription(ua, 'alice@example.com', 'dialog');
      expect(Subscription.expires).toBe(3600);

      spyOn(ua.logger, 'warn');
      Subscription = new SIP.Subscription(ua, 'alice@example.com', 'dialog', {expires: 'nope'});
      expect(Subscription.expires).toBe(3600);
      expect(ua.logger.warn).toHaveBeenCalledWith('expires must be a number. Using default of 3600.');
    });

    it('allows expires less than 3600', function() {
      Subscription = new SIP.Subscription(ua, 'alice@example.com', 'dialog', {expires: 1000});
      expect(Subscription.expires).toBe(1000);
    });

    it('sets expires to a valid number passed in', function() {
      Subscription = new SIP.Subscription(ua, 'alice@example.com', 'dialog', {expires: 7777});
      expect(Subscription.expires).toBe(7777);
    });

    it('sets body if body is passed in', function() {
      Subscription = new SIP.Subscription(ua, 'alice@example.com', 'dialog', {body: 'not really a body'});
      expect(Subscription.body).toBe('not really a body');
    });

    it('sets the contact', function() {
      Subscription = new SIP.Subscription(ua, 'alice@example.com', 'dialog');

      expect(Subscription.contact).toBe(ua.contact.toString());
    });

    it('calls augment with ClientContext', function() {
      spyOn(SIP.Utils, 'augment').and.callThrough();

      Subscription = new SIP.Subscription(ua, 'alice@example.com', 'dialog');

      expect(SIP.Utils.augment.calls.argsFor(0)[1]).toBe(SIP.ClientContext);
    });

    it('sets logger, dialog, timers, and error codes', function() {
      Subscription = new SIP.Subscription(ua, 'alice@example.com', 'dialog');

      expect(Subscription.logger).toBeDefined();
      expect(Subscription.dialog).toBeNull();
      expect(Subscription.timers).toEqual({N: null, sub_duration: null});
      expect(Subscription.errorCodes).toEqual([404,405,410,416,480,481,482,483,484,485,489,501,604]);
    });
  });

  describe('.subscribe', function() {
    it('calls clearTimeout on each of the timers', function() {
      spyOn(SIP.Timers, 'clearTimeout');
      spyOn(Subscription, 'send');  //also makes calls to Timeout stuff, so it makes the checks less accurate

      Subscription.subscribe();

      expect(SIP.Timers.clearTimeout.calls.count()).toBe(2);
    });

    it('sets Timer_N to fire timer_fire after TIMER_N time', function() {
      spyOn(SIP.Timers, 'setTimeout').and.callThrough();
      spyOn(Subscription, 'send');

      Subscription.subscribe();

      expect(Subscription.timers.N).toBeDefined();
      expect(SIP.Timers.setTimeout.calls.count()).toBe(1);
    });

    it('calls send', function() {
      spyOn(Subscription, 'send');

      Subscription.subscribe();

      expect(Subscription.send).toHaveBeenCalled();
    });

    it('sets the state to notify_wait (that rhymes)', function() {
      Subscription.subscribe();

      expect(Subscription.state).toBe('notify_wait');
    });

    it('returns the Subscription', function() {
      expect(Subscription.subscribe()).toBe(Subscription);
    });
  });

  describe('.receiveResponse', function() {
    var response;

    beforeEach(function() {
      response = SIP.Parser.parseMessage([
        'SIP/2.0 200 OK',
        'To: <sip:james@onsnip.onsip.com>;tag=1ma2ki9411',
        'From: "test1" <sip:test1@onsnip.onsip.com>;tag=58312p20s2',
        'Call-ID: upfrf7jpeb3rmc0gnnq1',
        'CSeq: 9059 INVITE',
        'Contact: <sip:gusgt9j8@vk3dj582vbu9.invalid;transport=ws>',
        'Event: dialog',
        'Expires: 3600',
        'Contact: <sip:gusgt9j8@vk3dj582vbu9.invalid;transport=ws>',
        'Supported: outbound',
        'Content-Type: application/sdp',
        'Content-Length: 11',
        '',
        'a= sendrecv',
        ''].join('\r\n'), ua);
    });

    it('calls fail if the status code is one of the error codes', function() {
      var code;
      spyOn(Subscription, 'failed');

      for (code = 0; code < Subscription.errorCodes.length; code++) {
        response.status_code = Subscription.errorCodes[code];
        Subscription.receiveResponse(response);

        expect(Subscription.failed).toHaveBeenCalledWith(response, null);

        Subscription.failed.calls.reset();
      }
    });

    it('calls clearTimeout on Timer N', function() {
      spyOn(SIP.Timers, 'clearTimeout');

      Subscription.receiveResponse(response);

      expect(SIP.Timers.clearTimeout).toHaveBeenCalled();
    });

    it('creates a dialog, sets the id, emits accepted, and puts this subscription in the ua\'s subscriptions array', function() {
      spyOn(Subscription, 'createConfirmedDialog').and.callThrough();
      spyOn(Subscription, 'emit');

      expect(Subscription.dialog).toBeNull();

      Subscription.receiveResponse(response);

      expect(Subscription.createConfirmedDialog).toHaveBeenCalledWith(response, 'UAC');
      expect(Subscription.id).toBe(Subscription.dialog.id.toString());
      expect(Subscription.emit).toHaveBeenCalledWith('accepted', response, 'OK');
      expect(ua.subscriptions[Subscription.id]).toBe(Subscription);
    });

    it('sets the sub_duration timer if there was a valid expires header', function() {
      spyOn(SIP.Timers, 'setTimeout').and.callThrough();

      Subscription.receiveResponse(response);

      expect(SIP.Timers.setTimeout).toHaveBeenCalled();
      expect(Subscription.timers.sub_duration).toBeDefined();
    });

    it('calls failed and warns if expires header was missing', function() {
      spyOn(Subscription, 'failed');
      spyOn(Subscription.logger, 'warn');

      response = SIP.Parser.parseMessage([
        'SIP/2.0 200 OK',
        'To: <sip:james@onsnip.onsip.com>;tag=1ma2ki9411',
        'From: "test1" <sip:test1@onsnip.onsip.com>;tag=58312p20s2',
        'Call-ID: upfrf7jpeb3rmc0gnnq1',
        'CSeq: 9059 INVITE',
        'Contact: <sip:gusgt9j8@vk3dj582vbu9.invalid;transport=ws>',
        'Event: dialog',
        'Contact: <sip:gusgt9j8@vk3dj582vbu9.invalid;transport=ws>',
        'Supported: outbound',
        'Content-Type: application/sdp',
        'Content-Length: 11',
        '',
        'a= sendrecv',
        ''].join('\r\n'), ua);

      Subscription.receiveResponse(response);

      expect(Subscription.logger.warn).toHaveBeenCalledWith('Expires header missing in a 200-class response to SUBSCRIBE');
      expect(Subscription.failed).toHaveBeenCalledWith(response, SIP.C.EXPIRES_HEADER_MISSING);
    });

    it('calls close, failed, and warns if expires header was higher than original offer', function() {
      spyOn(Subscription, 'failed');
      spyOn(Subscription.logger, 'warn');

      response = SIP.Parser.parseMessage([
        'SIP/2.0 200 OK',
        'To: <sip:james@onsnip.onsip.com>;tag=1ma2ki9411',
        'From: "test1" <sip:test1@onsnip.onsip.com>;tag=58312p20s2',
        'Call-ID: upfrf7jpeb3rmc0gnnq1',
        'CSeq: 9059 INVITE',
        'Contact: <sip:gusgt9j8@vk3dj582vbu9.invalid;transport=ws>',
        'Event: dialog',
        'Expires: 777777',
        'Contact: <sip:gusgt9j8@vk3dj582vbu9.invalid;transport=ws>',
        'Supported: outbound',
        'Content-Type: application/sdp',
        'Content-Length: 11',
        '',
        'a= sendrecv',
        ''].join('\r\n'), ua);

      Subscription.receiveResponse(response);

      expect(Subscription.logger.warn).toHaveBeenCalledWith('Expires header in a 200-class response to SUBSCRIBE with a higher value than the one in the request');
      expect(Subscription.failed).toHaveBeenCalledWith(response, SIP.C.INVALID_EXPIRES_HEADER);
    });
  });

  describe('.unsubscribe', function() {
    it('sets the state to terminated', function() {
      Subscription.unsubscribe();

      expect(Subscription.state).toBe('terminated');
    });

    it('creates a new request with an Expires header of 0', function() {
      Subscription.unsubscribe();

      expect(Subscription.request.getHeader('Expires')).toBe('0');
    });

    it('calls clearTimeout on each of the timers', function() {
      spyOn(SIP.Timers, 'clearTimeout');
      spyOn(Subscription, 'send');  //also makes calls to Timeout stuff, so it makes the checks less accurate

      Subscription.unsubscribe();

      expect(SIP.Timers.clearTimeout.calls.count()).toBe(2);
    });

    it('sets Timer_N to fire timer_fire after TIMER_N time', function() {
      spyOn(SIP.Timers, 'setTimeout').and.callThrough();
      spyOn(Subscription, 'send');

      Subscription.unsubscribe();

      expect(Subscription.timers.N).toBeDefined();
      expect(SIP.Timers.setTimeout.calls.count()).toBe(1);
    });

    it('calls send', function() {
      spyOn(Subscription, 'send');

      Subscription.unsubscribe();

      expect(Subscription.send).toHaveBeenCalled();
    });
  });

  describe('.timer_fire', function() {
    it('calls close if state is terminated', function() {
      spyOn(Subscription, 'close');
      Subscription.state = 'terminated';

      Subscription.timer_fire();

      expect(Subscription.close).toHaveBeenCalled();
    });

    it('switches the state to terminated and calls close if the state is pending or notify_wait', function() {
      spyOn(Subscription, 'close');
      Subscription.state = 'pending';

      Subscription.timer_fire();

      expect(Subscription.close).toHaveBeenCalled();
      expect(Subscription.state).toBe('terminated');

      Subscription.close.calls.reset();
      Subscription.state = 'notify_wait';

      Subscription.timer_fire();

      expect(Subscription.close).toHaveBeenCalled();
      expect(Subscription.state).toBe('terminated');
    });

    it('calls refresh for all other states (active, init)', function() {
      spyOn(Subscription, 'refresh');
      Subscription.state = 'active';

      Subscription.timer_fire();

      expect(Subscription.refresh).toHaveBeenCalled();

      Subscription.refresh.calls.reset();
      Subscription.state = 'init'; //Note: there's no way this can be called with a state of init

      Subscription.timer_fire();

      expect(Subscription.refresh).toHaveBeenCalled();
    });
  });

  describe('.close', function() {
    it('calls unsubscribe if the state is not terminated', function() {
      Subscription.state = 'terminated';
      spyOn(Subscription, 'unsubscribe');

      Subscription.close();

      Subscription.state = 'pending';

      Subscription.close();

      expect(Subscription.unsubscribe.calls.count()).toBe(1);
    });

    it('calls terminateDialog', function() {
      spyOn(Subscription, 'terminateDialog');

      Subscription.close();

      expect(Subscription.terminateDialog).toHaveBeenCalled();
    });

    it('calls clearTimeout on both timers', function() {
      spyOn(SIP.Timers, 'clearTimeout');
      Subscription.state = 'terminated'; //to ensure number of calls to clearTimeout

      Subscription.close();

      expect(SIP.Timers.clearTimeout.calls.count()).toBe(2);
    });

    it('deletes the subscription from ua.subscriptions', function() {
      Subscription.id = 'fake';
      ua.subscriptions[Subscription.id] = Subscription;

      Subscription.close();

      expect(ua.subscriptions[Subscription.id]).toBeUndefined();
    });
  });

  describe('.createConfirmedDialog', function() {
    it('creates a dialog, sets it to the subscription, and returns true on success', function() {
      response = SIP.Parser.parseMessage([
        'SIP/2.0 200 OK',
        'To: <sip:james@onsnip.onsip.com>;tag=1ma2ki9411',
        'From: "test1" <sip:test1@onsnip.onsip.com>;tag=58312p20s2',
        'Call-ID: upfrf7jpeb3rmc0gnnq1',
        'CSeq: 9059 INVITE',
        'Contact: <sip:gusgt9j8@vk3dj582vbu9.invalid;transport=ws>',
        'Event: dialog',
        'Expires: 3600',
        'Contact: <sip:gusgt9j8@vk3dj582vbu9.invalid;transport=ws>',
        'Supported: outbound',
        'Content-Type: application/sdp',
        'Content-Length: 11',
        '',
        'a= sendrecv',
        ''].join('\r\n'), ua);

      expect(Subscription.createConfirmedDialog(response, 'UAC')).toBe(true);

      expect(Subscription.dialog).not.toBeNull();
      expect(Subscription.dialog).toBeDefined();
    });

    it('returns false, doesn\'t set the dialog on dialog creation failure', function() {
      response = SIP.Parser.parseMessage([
        'SIP/2.0 200 OK',
        'To: <sip:james@onsnip.onsip.com>;tag=1ma2ki9411',
        'From: "test1" <sip:test1@onsnip.onsip.com>;tag=58312p20s2',
        'Call-ID: upfrf7jpeb3rmc0gnnq1',
        'CSeq: 9059 INVITE',
        'Event: dialog',
        'Expires: 3600',
        'Supported: outbound',
        'Content-Type: application/sdp',
        'Content-Length: 11',
        '',
        'a= sendrecv',
        ''].join('\r\n'), ua);
      //no contact header, will be false

      expect(Subscription.createConfirmedDialog(response, 'UAC')).toBe(false);

      expect(Subscription.dialog).toBeNull();
    });
  });

  describe('.terminateDialog', function() {
    it('terminates and deletes the subscription\'s dialog if it exists', function() {
      var response = SIP.Parser.parseMessage([
        'SIP/2.0 200 OK',
        'To: <sip:james@onsnip.onsip.com>;tag=1ma2ki9411',
        'From: "test1" <sip:test1@onsnip.onsip.com>;tag=58312p20s2',
        'Call-ID: upfrf7jpeb3rmc0gnnq1',
        'CSeq: 9059 INVITE',
        'Contact: <sip:gusgt9j8@vk3dj582vbu9.invalid;transport=ws>',
        'Event: dialog',
        'Expires: 3600',
        'Contact: <sip:gusgt9j8@vk3dj582vbu9.invalid;transport=ws>',
        'Supported: outbound',
        'Content-Type: application/sdp',
        'Content-Length: 11',
        '',
        'a= sendrecv',
        '',].join('\r\n'), ua);

      Subscription.createConfirmedDialog(response, 'UAC')
      expect(Subscription.dialog).toBeDefined();

      Subscription.terminateDialog();
      //would spy on terminate, but the object no longer exists for the check

      expect(Subscription.dialog).toBeUndefined();
    });

  });

  describe('.receiveRequest', function() {
    var request;

    beforeEach(function() {
      request = SIP.Parser.parseMessage([
        'NOTIFY sip:5sik1gqu@ue55h9a6i4s5.invalid;transport=ws SIP/2.0',
        'Record-Route: <sip:1c2a4a345a@199.7.175.182:443;transport=wss;lr;ovid=7cb85a5c>',
        'Record-Route: <sip:199.7.175.182:5060;transport=udp;lr;ovid=7cb85a5c>',
        'Via: SIP/2.0/WSS 199.7.175.182:443;branch=z9hG4bK1b3f97d3d51a36142c17f2e35d31c93d0376cecc;rport',
        'Via: SIP/2.0/UDP 199.7.175.102:5060;branch=z9hG4bK5aef.40dfee72.0',
        'To: <sip:james@onsnip.onsip.com>;tag=c4pa0cc2uo',
        'From: <sip:sip:test1@onsnip.onsip.com>;tag=2b2fcef4d83711ffd986a7db00d29d1d.7992',
        'CSeq: 1 NOTIFY',
        'Call-ID: 8fe1v8j577pj9bakcpbs',
        'Max-Forwards: 69',
        'Content-Length: 160',
        'User-Agent: OpenSIPS (1.10.0-notls (x86_64/linux))',
        'Event: dialog',
        'Contact: <sip:199.7.175.102:5060>',
        'Subscription-State: active;expires=3600',
        'Content-Type: application/dialog-info+xml',
        '',
        '<?xml version="1.0"?>',
        '<dialog-info xmlns="urn:ietf:params:xml:ns:dialog-info" version="0"',
        'state="full" entity="sip:sip%3btest1@onsnip.onsip.com"/>'].join('\r\n'), ua);

      spyOn(request, 'reply'); //takes care of an error
    });

    it('replies 489 returns if matchEvent fails', function() {
      spyOn(Subscription, 'matchEvent').and.returnValue(false);

      Subscription.receiveRequest(request);

      expect(request.reply).toHaveBeenCalledWith(489);
    });

    it('replies 200 if match event passes', function() {
      Subscription.receiveRequest(request);

      expect(request.reply).toHaveBeenCalledWith(200, SIP.C.REASON_200);
    });

    it('clear both timers', function() {
      spyOn(SIP.Timers, 'clearTimeout');

      Subscription.receiveRequest(request);

      expect(SIP.Timers.clearTimeout.calls.count()).toBe(2);
    });

    it('emits notify', function() {
      spyOn(Subscription, 'emit');

      Subscription.receiveRequest(request);

      expect(Subscription.emit).toHaveBeenCalledWith('notify', {request: request});
    });

    it('if sub_state.state is active, changes state to active and sets the duration timer if there is an expires as well', function() {
      request.setHeader('Subscription-State', 'active;expires=3600');
      spyOn(SIP.Timers, 'setTimeout').and.callThrough();

      Subscription.receiveRequest(request);

      expect(SIP.Timers.setTimeout.calls.argsFor(0)[1]).toBe(3600000 * .9);
      expect(Subscription.timers.sub_duration).not.toBeNull();
      expect(Subscription.timers.sub_duration).toBeDefined();
    });

    it('expires is not reset if under 3600', function() {
      request.setHeader('Subscription-State', 'active;expires=700');
      spyOn(SIP.Timers, 'setTimeout').and.callThrough();

      Subscription.receiveRequest(request);

      expect(SIP.Timers.setTimeout.calls.argsFor(0)[1]).toBe(700000 * .9);
      expect(Subscription.timers.sub_duration).not.toBeNull();
      expect(Subscription.timers.sub_duration).toBeDefined();
    });

    it('expires is reset correctly if too high', function() {
      request.setHeader('Subscription-State', 'active;expires=77777777777777');
      spyOn(SIP.Timers, 'setTimeout').and.callThrough();

      Subscription.receiveRequest(request);

      expect(SIP.Timers.setTimeout.calls.argsFor(0)[1]).toBe(3600000 * .9);
      expect(Subscription.timers.sub_duration).not.toBeNull();
      expect(Subscription.timers.sub_duration).toBeDefined();
    });

    it('if sub_state.state is pending and current state is notify_wait, set sub_duration, otherwise just change state', function() {
      request.setHeader('Subscription-State', 'pending;expires=3600');
      spyOn(SIP.Timers, 'setTimeout').and.callThrough();
      Subscription.state = 'notify_wait';

      Subscription.receiveRequest(request);

      expect(SIP.Timers.setTimeout.calls.argsFor(0)[1]).toBe(3600000 * .9);
      expect(Subscription.timers.sub_duration).not.toBeNull();
      expect(Subscription.timers.sub_duration).toBeDefined();
      expect(Subscription.state).toBe('pending');

      Subscription.state = 'active';

      Subscription.receiveRequest(request);

      expect(SIP.Timers.setTimeout.calls.count()).toBe(1);
      expect(Subscription.state).toBe('pending');
    });

    it('if sub_state.state is terminated with reason deactivated or timeout, subscribe will be called without close (always a log)', function() {
      request.setHeader('Subscription-State', 'terminated;expires=3600;reason=deactivated');
      spyOn(Subscription, 'subscribe');
      spyOn(Subscription, 'close');
      spyOn(Subscription.logger, 'log');

      Subscription.receiveRequest(request);

      expect(Subscription.logger.log).toHaveBeenCalledWith('terminating subscription with reason deactivated');
      expect(Subscription.subscribe).toHaveBeenCalled();

      Subscription.subscribe.calls.reset();
      request.setHeader('Subscription-State', 'terminated;expires=3600;reason=timeout');

      Subscription.receiveRequest(request);

      expect(Subscription.subscribe).toHaveBeenCalled();
      expect(Subscription.close).not.toHaveBeenCalled();
    });

    it('if sub_state.state is terminated with reason probation or giveup, subscribe will be called or the sub_duration timer will be set if retry-after is present, both without close', function() {
      request.setHeader('Subscription-State', 'terminated;retry-after=3600;reason=probation');
      spyOn(Subscription, 'subscribe');
      spyOn(SIP.Timers, 'setTimeout').and.callThrough();
      spyOn(Subscription, 'close');

      Subscription.receiveRequest(request);

      request.setHeader('Subscription-State', 'terminated;expires=3600;reason=giveup');

      Subscription.receiveRequest(request);

      expect(SIP.Timers.setTimeout.calls.count()).toBe(1);
      expect(Subscription.subscribe.calls.count()).toBe(1);
      expect(Subscription.close).not.toHaveBeenCalled();
    });

    it('if sub_state.state is terminated with reason rejected, noresource, or invariant, close will be called', function() {
      spyOn(Subscription, 'close');

      request.setHeader('Subscription-State', 'terminated;retry-after=3600;reason=rejected');
      Subscription.receiveRequest(request);

      request.setHeader('Subscription-State', 'terminated;retry-after=3600;reason=noresource');
      Subscription.receiveRequest(request);

      request.setHeader('Subscription-State', 'terminated;retry-after=3600;reason=invariant');
      Subscription.receiveRequest(request);

      expect(Subscription.close.calls.count()).toBe(3);
    });

  });

  describe('.failed', function() {
    it('calls close and emits failed', function() {
      spyOn(Subscription, 'close');
      spyOn(Subscription, 'emit');

      Subscription.failed();

      expect(Subscription.close).toHaveBeenCalled();
      expect(Subscription.emit.calls.mostRecent().args[0]).toBe('failed');
    });
  });

  describe('.matchEvent', function() {
    var request;

    it('logs a warning and returns false if Event header is missing', function() {
      request = SIP.Parser.parseMessage([
        'NOTIFY sip:5sik1gqu@ue55h9a6i4s5.invalid;transport=ws SIP/2.0',
        'Record-Route: <sip:1c2a4a345a@199.7.175.182:443;transport=wss;lr;ovid=7cb85a5c>',
        'Record-Route: <sip:199.7.175.182:5060;transport=udp;lr;ovid=7cb85a5c>',
        'Via: SIP/2.0/WSS 199.7.175.182:443;branch=z9hG4bK1b3f97d3d51a36142c17f2e35d31c93d0376cecc;rport',
        'Via: SIP/2.0/UDP 199.7.175.102:5060;branch=z9hG4bK5aef.40dfee72.0',
        'To: <sip:james@onsnip.onsip.com>;tag=c4pa0cc2uo',
        'From: <sip:sip:test1@onsnip.onsip.com>;tag=2b2fcef4d83711ffd986a7db00d29d1d.7992',
        'CSeq: 1 NOTIFY',
        'Call-ID: 8fe1v8j577pj9bakcpbs',
        'Max-Forwards: 69',
        'Content-Length: 160',
        'User-Agent: OpenSIPS (1.10.0-notls (x86_64/linux))',
        'Contact: <sip:199.7.175.102:5060>',
        'Subscription-State: active;expires=3600',
        'Content-Type: application/dialog-info+xml',
        '',
        '<?xml version="1.0"?>',
        '<dialog-info xmlns="urn:ietf:params:xml:ns:dialog-info" version="0"',
        'state="full" entity="sip:sip%3btest1@onsnip.onsip.com"/>'].join('\r\n'), ua);

      spyOn(Subscription.logger, 'warn');

      expect(Subscription.matchEvent(request)).toBe(false);
      expect(Subscription.logger.warn).toHaveBeenCalledWith('missing Event header');
    });

    it('logs a warning and returns false if Subscription-State header is missing', function() {
      request = SIP.Parser.parseMessage([
        'NOTIFY sip:5sik1gqu@ue55h9a6i4s5.invalid;transport=ws SIP/2.0',
        'Record-Route: <sip:1c2a4a345a@199.7.175.182:443;transport=wss;lr;ovid=7cb85a5c>',
        'Record-Route: <sip:199.7.175.182:5060;transport=udp;lr;ovid=7cb85a5c>',
        'Via: SIP/2.0/WSS 199.7.175.182:443;branch=z9hG4bK1b3f97d3d51a36142c17f2e35d31c93d0376cecc;rport',
        'Via: SIP/2.0/UDP 199.7.175.102:5060;branch=z9hG4bK5aef.40dfee72.0',
        'To: <sip:james@onsnip.onsip.com>;tag=c4pa0cc2uo',
        'From: <sip:sip:test1@onsnip.onsip.com>;tag=2b2fcef4d83711ffd986a7db00d29d1d.7992',
        'CSeq: 1 NOTIFY',
        'Call-ID: 8fe1v8j577pj9bakcpbs',
        'Max-Forwards: 69',
        'Content-Length: 160',
        'User-Agent: OpenSIPS (1.10.0-notls (x86_64/linux))',
        'Event: dialog',
        'Contact: <sip:199.7.175.102:5060>',
        'Content-Type: application/dialog-info+xml',
        '',
        '<?xml version="1.0"?>',
        '<dialog-info xmlns="urn:ietf:params:xml:ns:dialog-info" version="0"',
        'state="full" entity="sip:sip%3btest1@onsnip.onsip.com"/>'].join('\r\n'), ua);

      spyOn(Subscription.logger, 'warn');

      expect(Subscription.matchEvent(request)).toBe(false);
      expect(Subscription.logger.warn).toHaveBeenCalledWith('missing Subscription-State header');
    });

    it('logs a warning, replies 481, and returns false if the events don\'t match', function() {
      request = SIP.Parser.parseMessage([
        'NOTIFY sip:5sik1gqu@ue55h9a6i4s5.invalid;transport=ws SIP/2.0',
        'Record-Route: <sip:1c2a4a345a@199.7.175.182:443;transport=wss;lr;ovid=7cb85a5c>',
        'Record-Route: <sip:199.7.175.182:5060;transport=udp;lr;ovid=7cb85a5c>',
        'Via: SIP/2.0/WSS 199.7.175.182:443;branch=z9hG4bK1b3f97d3d51a36142c17f2e35d31c93d0376cecc;rport',
        'Via: SIP/2.0/UDP 199.7.175.102:5060;branch=z9hG4bK5aef.40dfee72.0',
        'To: <sip:james@onsnip.onsip.com>;tag=c4pa0cc2uo',
        'From: <sip:sip:test1@onsnip.onsip.com>;tag=2b2fcef4d83711ffd986a7db00d29d1d.7992',
        'CSeq: 1 NOTIFY',
        'Call-ID: 8fe1v8j577pj9bakcpbs',
        'Max-Forwards: 69',
        'Content-Length: 160',
        'User-Agent: OpenSIPS (1.10.0-notls (x86_64/linux))',
        'Event: WRONG',
        'Contact: <sip:199.7.175.102:5060>',
        'Subscription-State: active;expires=3600',
        'Content-Type: application/dialog-info+xml',
        '',
        '<?xml version="1.0"?>',
        '<dialog-info xmlns="urn:ietf:params:xml:ns:dialog-info" version="0"',
        'state="full" entity="sip:sip%3btest1@onsnip.onsip.com"/>'].join('\r\n'), ua);

      spyOn(Subscription.logger, 'warn');
      spyOn(request, 'reply');

      expect(Subscription.matchEvent(request)).toBe(false);
      expect(Subscription.logger.warn).toHaveBeenCalledWith('event match failed');
      expect(request.reply).toHaveBeenCalledWith(481, 'Event Match Failed');
    });

    it('returns true if none of the above happens', function() {
      request = SIP.Parser.parseMessage([
        'NOTIFY sip:5sik1gqu@ue55h9a6i4s5.invalid;transport=ws SIP/2.0',
        'Record-Route: <sip:1c2a4a345a@199.7.175.182:443;transport=wss;lr;ovid=7cb85a5c>',
        'Record-Route: <sip:199.7.175.182:5060;transport=udp;lr;ovid=7cb85a5c>',
        'Via: SIP/2.0/WSS 199.7.175.182:443;branch=z9hG4bK1b3f97d3d51a36142c17f2e35d31c93d0376cecc;rport',
        'Via: SIP/2.0/UDP 199.7.175.102:5060;branch=z9hG4bK5aef.40dfee72.0',
        'To: <sip:james@onsnip.onsip.com>;tag=c4pa0cc2uo',
        'From: <sip:sip:test1@onsnip.onsip.com>;tag=2b2fcef4d83711ffd986a7db00d29d1d.7992',
        'CSeq: 1 NOTIFY',
        'Call-ID: 8fe1v8j577pj9bakcpbs',
        'Max-Forwards: 69',
        'Content-Length: 160',
        'User-Agent: OpenSIPS (1.10.0-notls (x86_64/linux))',
        'Event: dialog',
        'Contact: <sip:199.7.175.102:5060>',
        'Subscription-State: active;expires=3600',
        'Content-Type: application/dialog-info+xml',
        '',
        '<?xml version="1.0"?>',
        '<dialog-info xmlns="urn:ietf:params:xml:ns:dialog-info" version="0"',
        'state="full" entity="sip:sip%3btest1@onsnip.onsip.com"/>'].join('\r\n'), ua);

      expect(Subscription.matchEvent(request)).toBe(true);
    });
  });
});
