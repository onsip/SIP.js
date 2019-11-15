describe('Session', function() {
  var Session;
  var ua;
  var message;

  beforeEach(function() {
    ua = new SIP.UA({uri: 'alice@example.com'}).start();
    ua.transport = jasmine.createSpyObj('transport', ['connect', 'disconnect', 'send', 'on', 'removeListener']);
    ua.transport.connect.and.returnValue(Promise.resolve());
    ua.transport.disconnect.and.returnValue(Promise.resolve());
    ua.transport.send.and.returnValue(Promise.resolve());

    var sessionDescriptionHandlerFactory = function() {
      return {
        getDescription: function () { return Promise.resolve('foo'); },
        hasDescription: function (contentType) {
          return contentType === 'application/sdp';
        },
        setDescription: function () { return Promise.resolve(); },
        close: function() {return true;}
      };
    };
    Session = new SIP.Session(sessionDescriptionHandlerFactory);

    Session.logger = new SIP.LoggerFactory().getLogger('sip.session');

    Session.ua = ua;

    message = SIP.Parser.parseMessage([
      'INVITE sip:gled5gsn@hk95bautgaa7.invalid;transport=ws;aor=james%40onsnip.onsip.com SIP/2.0',
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
      'Content-Length: 11',
      '',
      'a=sendrecv',
      ''].join('\r\n'), Session.ua.getLogger("sip.parser"));
      message.reply = () => { return; };
  });

  afterEach(function() {
    if(ua.status !== 2) {
      ua.stop();
    };
  });

  it('initializes session objects', function() {
    expect(Session.status).toBe(0);
    expect(Session.sessionDescriptionHandler).toBeUndefined();
  });

  it('initializes session timers', function() {
    expect(Session.timers.ackTimer).toBeUndefined();
    expect(Session.timers.expiresTimer).toBeUndefined();
    expect(Session.timers.invite2xxTimer).toBeUndefined();
    expect(Session.timers.userNoAnswerTimer).toBeUndefined();
    expect(Session.timers.rel1xxTimer).toBeUndefined();
    expect(Session.timers.prackTimer).toBeUndefined();
  });

  it('initializes session info', function() {
    expect(Session.startTime).toBeUndefined();
    expect(Session.endTime).toBeUndefined();
    expect(Session.tones).toBeUndefined();
  });

  it('initializes local_hold state info', function() {
    expect(Session.localHold).toBe(false);
  });

  it('initializes early_sdp, and rel100', function() {
    expect(Session.earlySdp).toBeUndefined();
    expect(Session.rel100).toBeDefined();
  });

  describe('.dtmf', function() {
    var tones;

    beforeEach(function() {
      tones = 1;
      Session.status = 12;
    });

    it('throws an error if tones is undefined', function() {
      expect(function(){Session.dtmf(undefined);}).toThrowError('Invalid tone(s): undefined');
    });

    it('throws an error if the session status is incorrect', function() {
      Session.status = 0;
      expect(function(){Session.dtmf(1);}).toThrowError('Invalid status: 0');
    });

    it('throws an error if tones is the wrong type', function() {
      expect(function(){Session.dtmf(1);}).not.toThrowError('Invalid tone(s): 1');
      Session.status = 12;
      expect(function(){Session.dtmf('one');}).toThrowError('Invalid tone(s): one');
      expect(function(){Session.dtmf(true);}).toThrowError('Invalid tone(s): true');
    });

    it('accepts 0 as an integer argument', function() {
      expect(function(){Session.dtmf(0);}).not.toThrowError('Invalid tone(s): 0');
    });

    it('accepts a string argument', function() {
      expect(function(){Session.dtmf('1');}).not.toThrowError('Invalid tone(s): 1');
    });

    xit('throws an error if tone duration is invalid', function() {
      expect(function(){Session.dtmf(1, {duration: 'six'});}).toThrowError('Invalid tone duration: six');
    });

    xit('resets duration to 70 if it\'s too low', function() {
      var options = {duration: 7};
      Session.dtmf(1, options);
      expect(options.duration).toBe(70);
    });

    xit('resets duration to 6000 if it\'s too high', function() {
      var options = {duration: 7000};
      Session.dtmf(1, options);
      expect(options.duration).toBe(6000);
    });

    xit('resets duration to positive if it\'s negative', function() {
      var options = {duration: -700};
      Session.dtmf(1, options);
      expect(options.duration).toBe(70);
    });

    xit('throws an error if interToneGap is invalid', function() {
      expect(function(){Session.dtmf(1, {interToneGap: 'six'});}).toThrowError('Invalid interToneGap: six');
    });

    it('queues up tones if tones are already queued', function() {
      Session.tones = [1,2,3];
      Session.dtmf('4');
      expect(Session.tones.length).toBe(4);
    });

    //DTMF sends first one, so this gets undefined before we can check it, and DTMF file is not accessible currently
    xit('sets tones if no tones are queued', function() {
      Session.tones = '';
      Session.dtmf('4');
      expect(Session.tones).toBe('4');
    });

    it('returns Session on success', function() {
      expect(Session.dtmf(1)).toBe(Session);
    });

    describe('RTCDTMFSender', function() {
      beforeEach(function() {
        Session.ua = ua = new SIP.UA({uri: 'jim@example.com', dtmfType: SIP.C.dtmfType.RTP}).start();
        Session.sessionDescriptionHandler = { sendDtmf: function(tones, options) {} };
        ua.transport = jasmine.createSpyObj('transport', ['connect', 'disconnect', 'send', 'on', 'removeListener']);
        ua.transport.connect.and.returnValue(Promise.resolve());
        ua.transport.disconnect.and.returnValue(Promise.resolve());
        ua.transport.send.and.returnValue(Promise.resolve());
      });

      it('calls SessionDescriptionHandler.sendDtmf when the correct configuration is given', function() {
        Session.sessionDescriptionHandler.sendDtmf = function(tones, options) {return false;}
        spyOn(Session.sessionDescriptionHandler, 'sendDtmf').and.returnValue(true)
        Session.dtmf('7');
        expect(Session.sessionDescriptionHandler.sendDtmf).toHaveBeenCalledWith('7', {});
      });

      it('logs a warning when SessionDescriptionHandler.sendDtmf returns false', function() {
        spyOn(Session.logger, 'warn');
        Session.dtmf('7');
        expect(Session.logger.warn).toHaveBeenCalled();
      });

      it('sendDtmf is not called when dtmfType is SIP.C.dtmfType.INFO', function() {
        Session.ua = ua = new SIP.UA({uri: 'jim@example.com', dtmfType: SIP.C.dtmfType.INFO}).start();
        Session.ua.transport.ws.onopen();
        spyOn(Session.sessionDescriptionHandler, 'sendDtmf');
        Session.dtmf('7');
        expect(Session.sessionDescriptionHandler.sendDtmf).not.toHaveBeenCalled();
      });
    });
  });

  describe('.bye', function() {
    beforeEach(function() {
      Session.session = {
        bye: () => {
          return { message: "" }
        }        
      }

      spyOn(Session,'emit')
      Session.status = 12;
    });

    it('logs an error and returns this if the session status is terminated',  function() {
      spyOn(Session.logger, 'error');
      Session.status = 9;

      expect(Session.bye()).toEqual(Session);

      expect(Session.logger.error).toHaveBeenCalledWith('Error: Attempted to send BYE in a terminated session.');
    });

    it('emits bye and terminated on any status code >= 200', function() {
      spyOn(Session, 'terminated');
      spyOn(Session, 'close');

      for (var i = 200; i < 700; i++) {
        Session.bye({statusCode: i});

        expect(Session.emit.calls.mostRecent().args[0]).toBe('bye');
        expect(Session.terminated).toHaveBeenCalled();

        Session.emit.calls.reset();
        Session.terminated.calls.reset();
      }
    });

    it('throws an error for any other status code', function() {
      for (var i = 100; i < 200; i++) {
        expect(function(){Session.bye({statusCode: i});}).toThrowError('Invalid statusCode: ' + i);
      }
    });
  });

  describe('.refer', function() {
    var target;

    beforeEach(function() {
      target = 'target';

      Session.status = 12;
      Session.terminate = function() { return this; };
    });

    it('throws an error if target is undefined', function() {
      expect(function(){Session.refer(undefined);}).toThrowError('Not enough arguments');
    });

    it('throws an error if target is not an Session and status is not confirmed', function() {
      Session.status = 0;
      expect(function(){Session.refer(target);}).toThrowError('Invalid status: 0');
    });

    xit('returns Session on success', function() {
      expect(Session.refer(target)).toBe(Session);
    });
  });

  describe('.sendRequest', function() {
    var method;

    it('returns Session on success', function() {
      method = 'BYE';
      Session.status = 12;

      Session.session = {
        bye: () => {
          return { message: "" }
        }
      };

      expect(Session.sendRequest(method)).toBe(Session);
    });
  });

  describe('.close', function() {
    beforeEach(function() {
      Session.mediaHandler = {close: jasmine.createSpy('close').and.returnValue(true)};

      Session.status = 12;
    });

    it('returns Session if the status is terminated', function() {
      Session.status = 9;
      expect(Session.close()).toBe(Session);
    });

    it('deletes the session from the ua, deletes the dialog, removes transport listeners and returns the Session on success', function() {
      Session.id = 777;
      Session.ua.sessions = {777: Session};

      expect(Session.close()).toBe(Session);
      expect(Session.ua.sessions[777]).toBeUndefined();
      expect(Session.ua.transport.removeListener).toHaveBeenCalled();
    });
  });

  describe('.hold', function() {

    beforeEach(function() {
      spyOn(Session, 'emit');
      Session.status = 12;

      spyOn(Session, 'sendReinvite');
    });

    it('throws an error if the session is in the incorrect state', function() {
      Session.status = 0;

      expect(function(){Session.hold()}).toThrowError('Invalid status: 0');
    });
  });

  describe('.onTransportError', function() {
    beforeEach(function() {
      spyOn(Session, 'failed');
    });

    it('does not call failed if the status is terminated', function() {
      Session.status = 9;

      Session.onTransportError();

      expect(Session.failed).not.toHaveBeenCalled();
    });

    it('does not call failed if the status is terminated', function() {
      Session.status = 12;

      Session.onTransportError();

      expect(Session.failed).not.toHaveBeenCalled();
    });

    it('calls failed if the status is neither terminated or confirmed', function() {
      Session.status = 11;

      Session.onTransportError();

      expect(Session.failed).toHaveBeenCalled();
    });
  });

  describe('.onRequestTimeout', function() {
    beforeEach(function() {
      spyOn(Session, 'terminated');
      spyOn(Session, 'failed');
    });

    it('does not call failed or terminated if the status is terminated', function() {
      Session.status = 9;

      Session.onRequestTimeout();

      expect(Session.failed).not.toHaveBeenCalled();
    });

    it('calls terminated if the status is confirmed', function() {
      Session.status = 12;

      Session.onRequestTimeout();

      expect(Session.terminated).toHaveBeenCalled();
      expect(Session.failed).not.toHaveBeenCalled();
    });

    it('calls failed if the status is neither terminated or confirmed', function() {
      Session.status = 11;

      Session.onRequestTimeout();

      expect(Session.failed).toHaveBeenCalled();
    });
  });

  describe('.onDialogError', function() {
    beforeEach(function() {
      spyOn(Session, 'terminated');
      spyOn(Session, 'failed');
    });

    it('does not call failed or terminated if the status is terminated', function() {
      Session.status = 9;

      Session.onDialogError();

      expect(Session.failed).not.toHaveBeenCalled();
      expect(Session.terminated).not.toHaveBeenCalled();
    });

    it('calls terminated if the status is confirmed', function() {
      Session.status = 12;

      Session.onDialogError();

      expect(Session.terminated).toHaveBeenCalled();
      expect(Session.failed).not.toHaveBeenCalled();
    });

    it('calls failed if the status is neither terminated or confirmed', function() {
      Session.status = 11;

      Session.onDialogError();

      expect(Session.failed).toHaveBeenCalled();
    });
  });

  describe('.failed', function() {
    it('emits and returns Session', function() {
      spyOn(Session, 'emit').and.callThrough();
      expect(Session.failed()).toBe(Session);
      expect(Session.emit).toHaveBeenCalledWith('failed', undefined, undefined);
    });
  });

  describe('.rejected', function() {
    it('emits and returns Session', function() {
      spyOn(Session, 'emit').and.callThrough();
      expect(Session.rejected()).toBe(Session);
      expect(Session.emit).toHaveBeenCalledWith('rejected', undefined, undefined);
    });
  });

  describe('.refer', function() {
    beforeEach(function() {
      spyOn(Session, 'emit').and.callThrough();
    });

    xit('emits and returns Session', function() {
      //no longer works without referred event
      Session.status = 12;
      expect(Session.refer('alice@example.com')).toBe(Session);

      expect(Session.emit.calls.mostRecent().args[0]).toBe('refer');
    });
  });

  describe('.canceled', function() {
    it('emits, and returns Session', function() {
      spyOn(Session, 'emit').and.callThrough();
      spyOn(Session, 'close').and.callThrough();
      expect(Session.canceled()).toBe(Session);
      expect(Session.close).not.toHaveBeenCalled();
      expect(Session.emit.calls.mostRecent().args[0]).toBe('cancel');
    });
  });

  describe('.accepted', function() {
    beforeEach(function() {
      spyOn(Session, 'emit').and.callThrough();
    });

    it('calls emit, sets a startTime, and returns Session', function() {
      expect(Session.accepted()).toBe(Session);

      expect(Session.startTime).toBeDefined();
      expect(Session.emit.calls.mostRecent().args[0]).toBe('accepted');
    });
  });

  describe('.terminated', function() {
    beforeEach(function() {
      spyOn(Session, 'close');
      spyOn(Session, 'emit').and.callThrough();
    });

    it('calls close, emits, sets an endTime, and returns Session', function() {
      expect(Session.terminated()).toBe(Session);

      expect(Session.endTime).toBeDefined();
      expect(Session.close).toHaveBeenCalled();
      expect(Session.emit.calls.mostRecent().args[0]).toBe('terminated');
    });
  });

  describe('.connecting', function() {
    beforeEach(function() {
      spyOn(Session, 'emit');
    });

    it('calls emit', function() {
      Session.connecting();

      expect(Session.emit.calls.mostRecent().args[0]).toBe('connecting');
    });
  });
});

describe('InviteServerContext', function() {
  var InviteServerContext;
  var ua;
  var request;
  var webrtc;
  var incomingInviteRequest;

  beforeEach(function(){

    ua = new SIP.UA({
      uri: 'alice@example.com',
      wsServers: 'ws://server.example.com',
      sessionDescriptionHandlerFactory: function() {
        return {
          getDescription: jasmine.createSpy('getDescription').and.returnValue(Promise.resolve('foo')),
          hasDescription: function (contentType) {
            return contentType === 'application/sdp';
          },
          setDescription: jasmine.createSpy('setDescription').and.returnValue(Promise.resolve()),
          close: function() {return true;},
          on: function () {}
        };
      }
    });
    ua.transport = jasmine.createSpyObj('transport', ['connect', 'disconnect', 'send', 'on', 'removeListener']);
    ua.transport.connect.and.returnValue(Promise.resolve());
    ua.transport.disconnect.and.returnValue(Promise.resolve());
    ua.transport.send.and.returnValue(Promise.resolve());

    request = SIP.Parser.parseMessage([
      'INVITE sip:gled5gsn@hk95bautgaa7.invalid;transport=ws;aor=james%40onsnip.onsip.com SIP/2.0',
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
      'Content-Length: 11',
      '',
      'a=sendrecv',
      ''].join('\r\n'), ua.getLogger("sip.parser"));

    request.transport = ua.transport

    incomingInviteRequest = jasmine.createSpyObj("request", ["accept", "progress", "redirect", "reject", "trying"]);
    incomingInviteRequest.message = request;
    incomingInviteRequest.accept.and.returnValue({ message: "accept" });
    incomingInviteRequest.progress.and.returnValue({ message: "progress" });
    incomingInviteRequest.redirect.and.returnValue({ message: "redirect" });
    incomingInviteRequest.reject.and.returnValue({ message: "reject" });
    incomingInviteRequest.trying.and.returnValue({ message: "trying" });

    InviteServerContext = new SIP.InviteServerContext(ua, incomingInviteRequest);
  });

  afterEach(function(){
    if(ua.status !== 2) {
      ua.sessions = [];
      ua.stop();
    };
  });

  it('sets contentDisp correctly', function() {
    expect(InviteServerContext.ContentDisp).toBeUndefined();
  });

  function soon() {
    return new Promise(function(resolve, reject) {
      setTimeout(function() {
        resolve();
      }, 10);
    });
  }

  it('replies 415 from non-application/sdp content-type with a session content-disp', async function() {
    request = SIP.Parser.parseMessage([
      'INVITE sip:gled5gsn@hk95bautgaa7.invalid;transport=ws;aor=james%40onsnip.onsip.com SIP/2.0',
      'Max-Forwards: 65',
      'To: <sip:james@onsnip.onsip.com>',
      'From: "test1" <sip:test1@onsnip.onsip.com>;tag=rto5ib4052',
      'Call-ID: grj0liun879lfj35evfq',
      'CSeq: 1798 INVITE',
      'Contact: <sip:e55r35u3@kgu78r4e1e6j.invalid;transport=ws;ob>',
      'Allow: ACK,CANCEL,BYE,OPTIONS,INVITE,MESSAGE',
      'Content-Type: application/json',
      'Content-Disposition: session',
      'Supported: outbound',
      'User-Agent: SIP.js 0.5.0-devel',
      'Content-Length: 11',
      '',
      'a=sendrecv',
      ''].join('\r\n'), ua.getLogger("sip.parser"));
    incomingInviteRequest.message = request;

    var ISC = new SIP.InviteServerContext(ua, incomingInviteRequest);
    ISC.accept();
    await soon(); // accept is async
    expect(incomingInviteRequest.reject).toHaveBeenCalledWith({ statusCode: 415 });
  });

  it('sets status, fromTag, id, request, contact, logger, and sessions', function() {
    expect(InviteServerContext.status).toBe(4);
    expect(InviteServerContext.fromTag).toBe(request.fromTag);
    expect(InviteServerContext.id).toBe(request.callId + request.fromTag);
    expect(InviteServerContext.request).toEqual(incomingInviteRequest.message);
    expect(InviteServerContext.contact).toBe(InviteServerContext.ua.contact.toString());

    expect(InviteServerContext.logger).toEqual(InviteServerContext.ua.getLogger('sip.inviteservercontext', request.callId + request.fromTag));
    expect(InviteServerContext.ua.sessions[request.callId + request.fromTag]).toBe(InviteServerContext);
  });

  it('sets 100rel, requires', function() {
    request = SIP.Parser.parseMessage([
      'INVITE sip:gled5gsn@hk95bautgaa7.invalid;transport=ws;aor=james%40onsnip.onsip.com SIP/2.0',
      'Max-Forwards: 65',
      'To: <sip:james@onsnip.onsip.com>',
      'From: "test1" <sip:test1@onsnip.onsip.com>;tag=rto5ib4052',
      'Call-ID: grj0liun879lfj35evfq',
      'CSeq: 1798 INVITE',
      'Contact: <sip:e55r35u3@kgu78r4e1e6j.invalid;transport=ws;ob>',
      'Allow: ACK,CANCEL,BYE,OPTIONS,INVITE,MESSAGE',
      'Content-Type: application/sdp',
      'Require: 100rel',
      'Supported: outbound',
      'User-Agent: SIP.js 0.5.0-devel',
      'Content-Length: 11',
      '',
      'a=sendrecv',
      ''].join('\r\n'), ua.getLogger("sip.parser"));
    request.transport = ua.transport;
    incomingInviteRequest.message = request;

    var ISC = new SIP.InviteServerContext(ua, incomingInviteRequest);
    clearTimeout(ISC.timers.userNoAnswerTimer);

    expect(ISC.rel100).toBe(SIP.C.supported.REQUIRED);
  });

  it('sets 100rel, supported', function() {
    request = SIP.Parser.parseMessage([
      'INVITE sip:gled5gsn@hk95bautgaa7.invalid;transport=ws;aor=james%40onsnip.onsip.com SIP/2.0',
      'Max-Forwards: 65',
      'To: <sip:james@onsnip.onsip.com>',
      'From: "test1" <sip:test1@onsnip.onsip.com>;tag=rto5ib4052',
      'Call-ID: grj0liun879lfj35evfq',
      'CSeq: 1798 INVITE',
      'Contact: <sip:e55r35u3@kgu78r4e1e6j.invalid;transport=ws;ob>',
      'Allow: ACK,CANCEL,BYE,OPTIONS,INVITE,MESSAGE',
      'Content-Type: application/sdp',
      'Supported: outbound, 100rel',
      'User-Agent: SIP.js 0.5.0-devel',
      'Content-Length: 11',
      '',
      'a=sendrecv',
      ''].join('\r\n'), ua.getLogger("sip.parser"));
    request.transport = ua.transport;
    incomingInviteRequest.message = request;

    var ISC = new SIP.InviteServerContext(ua, incomingInviteRequest);
    clearTimeout(ISC.timers.userNoAnswerTimer);

    expect(ISC.rel100).toBe(SIP.C.supported.SUPPORTED);
  });

  xit('replies 500 and returns if the createDialog call fails', function() {
    var ISC, fakereq;
    fakereq = SIP.Parser.parseMessage([
      'INVITE sip:alice@example.com SIP/2.0',
      'Max-Forwards: 65',
      'To: <sip:james@onsnip.onsip.com>',
      'From: "test1" <sip:test1@onsnip.onsip.com>;tag=rto5ib4052',
      'Call-ID: grj0liun879lfj35evfq',
      'CSeq: 1798 INVITE',
      // 'Contact: <sip:e55r35u3@kgu78r4e1e6j.invalid;transport=ws;ob>',
      'Allow: ACK,CANCEL,BYE,OPTIONS,INVITE,MESSAGE',
      'Content-Type: application/sdp',
      'Supported: outbound',
      'User-Agent: SIP.js 0.5.0-devel',
      'Content-Length: 11',
      '',
      'a=sendrecv',
      ''].join('\r\n'), ua.getLogger("sip.parser"));
    spyOn(fakereq, 'reply');
    fakereq.transport = ua.transport;

    spyOn(SIP.Session.prototype,'createDialog').and.returnValue(false);
    if (ua.userAgentCore) {
      ua.userAgentCore.receiveIncomingRequestFromTransport(fakereq);
      expect(ua.transport.send.calls.mostRecent().args[0])
        .toMatch(new RegExp(`^SIP/2.0 400 Missing Contact Header`));
    } else {
      ISC = new SIP.InviteServerContext(ua, fakereq);
      clearTimeout(ISC.timers.userNoAnswerTimer);
      expect(fakereq.reply).toHaveBeenCalledWith(500, 'Missing Contact header field');
    }
  });

  describe('.reject', function() {

    it('throws an invalid state error is the status is terminated', function() {
      InviteServerContext.status = 9;

      expect(function(){InviteServerContext.reject();}).toThrowError('Invalid status: 9');

      InviteServerContext.status = 0;
    });

    it('throws a type error when the status code is valid and less than 300', function(){
      for(var i = 100; i < 300; i++) {
        expect(function(){InviteServerContext.reject({statusCode: i});}).toThrowError('Invalid statusCode: ' + i);
      }
    });

    it('replies to the request (480 is default)', function() {
      incomingInviteRequest.reject.calls.reset();

      InviteServerContext.reject();

      expect(incomingInviteRequest.reject.calls.mostRecent().args[0].statusCode).toBe(480);
    });

    it('calls rejected, failed, and terminated', function() {
      var rejected, failed;
      reject = failed = false;
      InviteServerContext.on('rejected', function () { rejected = true; });
      InviteServerContext.on('failed', function () { failed = true; });
      spyOn(InviteServerContext, 'terminated');

      InviteServerContext.reject();

      expect(rejected).toBe(true);
      expect(failed).toBe(true);
      expect(InviteServerContext.terminated).toHaveBeenCalled();
    });

    it('calls close', function() {
      spyOn(InviteServerContext, 'close');

      InviteServerContext.reject();

      expect(InviteServerContext.close).toHaveBeenCalled();
    });

    it('returns the InviteServerContext object', function() {
      expect(InviteServerContext.reject()).toBe(InviteServerContext);
    });
  });

  describe('.terminate', function() {
    beforeEach(function() {
      InviteServerContext.status = 7;

      spyOn(InviteServerContext, 'emit');
    });

    xit('emits bye and calls terminated if the status is WAITING_FOR_ACK', function() {
      spyOn(InviteServerContext, 'terminated');

      InviteServerContext.terminate();

      expect(InviteServerContext.emit.calls.mostRecent().args[0]).toBe('bye');
      expect(InviteServerContext.terminated).toHaveBeenCalled();
    });

    xit('sets the dialog in the ua dialogs array if the status is WAITING_FOR_ACK', function() {
      InviteServerContext.terminate();

      expect(InviteServerContext.ua.dialogs[InviteServerContext.dialog.id]).toBe(InviteServerContext.dialog);
    });

    xit('calls bye if the status is CONFIRMED', function() {
      InviteServerContext.status = 12;

      spyOn(InviteServerContext, 'bye');

      InviteServerContext.terminate();

      expect(InviteServerContext.bye).toHaveBeenCalled();
    });

    it('calls reject if the status is neither WAITING_FOR_ACK or CONFIRMED', function() {
      InviteServerContext.status = 0;

      spyOn(InviteServerContext, 'reject');

      InviteServerContext.terminate();

      expect(InviteServerContext.reject).toHaveBeenCalled();
    });
  });

  describe('.accept', function() {
    beforeEach(function() {
      InviteServerContext.status = 4;

    });

    it('changes status to ANSWERED_WAITING_FOR_PRACK and returns this if status is WAITING_FOR_PRACK', function() {
      InviteServerContext.status = 6;

      expect(InviteServerContext.accept()).toBe(InviteServerContext);
      expect(InviteServerContext.status).toBe(10);
    });

    xit('throws Invalid State Error if status is not WAITING_FOR_PRACK, WAITING_FOR_ANSWER, or EARLY_MEDIA', function() {
      InviteServerContext.status = 11;

      expect(function(){InviteServerContext.accept();}).not.toThrowError('Invalid status: 11');

      InviteServerContext.status = 0;

      expect(function(){InviteServerContext.accept();}).toThrowError('Invalid status: 0');
    });

    xit('replies 500 and returns this if createDialog fails', function() {
      request.reply.calls.reset();
      spyOn(InviteServerContext, 'createDialog').and.returnValue(false);

      expect(InviteServerContext.accept()).toBe(InviteServerContext);

      expect(request.reply.calls.mostRecent().args[0]).toBe(500);
    });

    it('clears the userNoAnswerTimer', function() {
      spyOn(window, 'clearTimeout').and.callThrough();

      InviteServerContext.timers.userNoAnswerTimer = setTimeout(function() {}, 200);

      InviteServerContext.accept();

      expect(clearTimeout).toHaveBeenCalledWith(InviteServerContext.timers.userNoAnswerTimer);
    });

    // x'ing this since the code it tests currently breaks FF accept - JMF 2014-1-21
    xit('sets the constraints to false if they were set to true earlier when there is no audio or video streams', function() {
      InviteServerContext.accept({mediaConstraints:{audio: true, video: true}});

      expect(InviteServerContext.mediaConstraints).toEqual({audio: false, video: false});
    });

    xit('does not call getDescription and returns this when the status is EARLY_MEDIA', function() {
      InviteServerContext.status = 11;

      expect(InviteServerContext.accept()).toBe(InviteServerContext);
      expect(InviteServerContext.sessionDescriptionHandler).toBeUndefined();
    });

    xit('calls getDescription and returns this on a successful call where the status is not EARLY_MEDIA', function(done) {
      expect(InviteServerContext.accept()).toBe(InviteServerContext);

      InviteServerContext.once('accepted', function() {
         done();
      });
    });
  });

  xdescribe('.receiveRequest', function() {
    var req;

    xdescribe('method is CANCELED', function() {
      beforeEach(function() {
        req = SIP.Parser.parseMessage([
          'CANCEL sip:gled5gsn@hk95bautgaa7.invalid;transport=ws;aor=james%40onsnip.onsip.com SIP/2.0',
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
          'Content-Length: 11',
          '',
          'a=sendrecv',
          ''].join('\r\n'), ua.getLogger("sip.parser"));

        spyOn(InviteServerContext, 'canceled');
        spyOn(InviteServerContext, 'failed');
        spyOn(InviteServerContext, 'terminated').and.callThrough();
        spyOn(window, 'clearTimeout').and.callThrough();

        InviteServerContext.timers.prackTimer = setTimeout(function(){}, 100);
        InviteServerContext.timers.rel1xxTimer = setTimeout(function(){}, 100);
      });

      it('status is WAITING_FOR_ANSWER, timers cleared', function() {
        InviteServerContext.status = 4;
        InviteServerContext.onCancel(req);

        expect(clearTimeout).toHaveBeenCalledWith(InviteServerContext.timers.prackTimer);
        expect(clearTimeout).toHaveBeenCalledWith(InviteServerContext.timers.rel1xxTimer);
      });

      it('status is WAITING_FOR_PRACK, timers cleared', function() {
        InviteServerContext.status = 6;

        InviteServerContext.onCancel(req);

        expect(clearTimeout).toHaveBeenCalledWith(InviteServerContext.timers.prackTimer);
        expect(clearTimeout).toHaveBeenCalledWith(InviteServerContext.timers.rel1xxTimer);
      });

      it('status is ANSWERED_WAITING_FOR_PRACK, timers cleared', function() {
        InviteServerContext.status = 10;

        InviteServerContext.onCancel(req);

        expect(clearTimeout).toHaveBeenCalledWith(InviteServerContext.timers.prackTimer);
        expect(clearTimeout).toHaveBeenCalledWith(InviteServerContext.timers.rel1xxTimer);
      });

      it('status is EARLY_MEDIA, timers cleared', function() {
        InviteServerContext.status = 11;

        InviteServerContext.onCancel(req);

        expect(clearTimeout).toHaveBeenCalledWith(InviteServerContext.timers.prackTimer);
        expect(clearTimeout).toHaveBeenCalledWith(InviteServerContext.timers.rel1xxTimer);
      });

      it('status is ANSWERED, timers cleared', function() {
        InviteServerContext.status = 5;

        InviteServerContext.onCancel(req);

        expect(clearTimeout).toHaveBeenCalledWith(InviteServerContext.timers.prackTimer);
        expect(clearTimeout).toHaveBeenCalledWith(InviteServerContext.timers.rel1xxTimer);
      });

      afterEach(function() {
        expect(InviteServerContext.status).toBe(9);
        expect(InviteServerContext.request.reject).toHaveBeenCalledWith(487);
        expect(InviteServerContext.canceled).toHaveBeenCalled();
        expect(InviteServerContext.failed.calls.mostRecent().args[1]).toBe(SIP.C.causes.CANCELED);
      });
    });

    xdescribe('method is ACK', function() {
      beforeEach(function() {
        req = SIP.Parser.parseMessage([
          'ACK sip:gled5gsn@hk95bautgaa7.invalid;transport=ws;aor=james%40onsnip.onsip.com SIP/2.0',
          'Max-Forwards: 65',
          'To: <sip:james@onsnip.onsip.com>',
          'From: "test1" <sip:test1@onsnip.onsip.com>;tag=rto5ib4052',
          'Call-ID: grj0liun879lfj35evfq',
          'CSeq: 1798 INVITE',
          'Contact: <sip:e55r35u3@kgu78r4e1e6j.invalid;transport=ws;ob>',
          'Allow: ACK,CANCEL,BYE,OPTIONS,INVITE,MESSAGE',
          'Supported: outbound',
          'User-Agent: SIP.js 0.5.0-devel',
          'Content-Length: 0',
          '',
          ''].join('\r\n'), InviteServerContext.ua.getLogger("sip.parser"));

        InviteServerContext.status = 7;

        InviteServerContext.dialog = {id: 7, terminate: function(){}, sendRequest: function(){}};
      });

      it('calls sessionDescriptionHandler.setDescription when the ACK contains an answer to an invite w/o sdp', function() {
        InviteServerContext.hasOffer = true;

        InviteServerContext.sessionDescriptionHandler = {
          hasDescription: function() {
            return true;
          },
          setDescription: jasmine.createSpy('setDescription').and.returnValue(Promise.resolve(true)),
          close: function() {
            return;
          }
        };

        req = SIP.Parser.parseMessage([
          'ACK sip:gled5gsn@hk95bautgaa7.invalid;transport=ws;aor=james%40onsnip.onsip.com SIP/2.0',
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
          'Content-Length: 11',
          '',
          'a=sendrecv',
          ''].join('\r\n'), InviteServerContext.ua.getLogger("sip.parser"));

        InviteServerContext.onAck({ message: req });

        expect(InviteServerContext.sessionDescriptionHandler.setDescription).toHaveBeenCalled();
      });

      it('calls confirmSession if session.early_sdp is true and above is false', function() {
        InviteServerContext.early_sdp = true;
        spyOn(window, 'clearTimeout').and.callThrough();
        spyOn(InviteServerContext, 'accepted').and.callThrough();
        var catchSpy = jasmine.createSpy('catch');
        InviteServerContext.ua.transport.send = function () {return {catch: catchSpy};};

        InviteServerContext.sessionDescriptionHandler = {
          hasDescription: function() {
            return false;
          },
          close: function() { return; }
        };

        InviteServerContext.onAck({ message: req });

        expect(clearTimeout).toHaveBeenCalledWith(InviteServerContext.timers.ackTimer);
        expect(clearTimeout).toHaveBeenCalledWith(InviteServerContext.timers.invite2xxTimer);

        expect(InviteServerContext.status).toBe(12);
        expect(InviteServerContext.accepted).not.toHaveBeenCalled();
      });

      it('calls confirmSession if there was an invite w/ sdp originally', function() {
        InviteServerContext.hasOffer = true;
        InviteServerContext.hasAnswer = true;

        spyOn(window, 'clearTimeout').and.callThrough();
        spyOn(InviteServerContext, 'emit');

        var catchSpy = jasmine.createSpy('catch');
        InviteServerContext.ua.transport.send = function () {return {catch: catchSpy};};

        InviteServerContext.sessionDescriptionHandler = {
          hasDescription: function() {
            return false;
          },
          close: function() { return; }
        };

        InviteServerContext.onAck({ message: req });

        expect(clearTimeout).toHaveBeenCalledWith(InviteServerContext.timers.ackTimer);
        expect(clearTimeout).toHaveBeenCalledWith(InviteServerContext.timers.invite2xxTimer);

        expect(InviteServerContext.status).toBe(12);
        expect(InviteServerContext.emit.calls.mostRecent().args[0]).toBe('confirmed');
        expect(InviteServerContext.emit.calls.mostRecent().args[1]).toBe(req);
      });
    });

    xdescribe('method is PRACK', function() {
      var incomingPrackRequest;

      beforeEach(function() {
        req = SIP.Parser.parseMessage([
          'PRACK sip:gled5gsn@hk95bautgaa7.invalid;transport=ws;aor=james%40onsnip.onsip.com SIP/2.0',
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
          'Content-Length: 11',
          '',
          'a=sendrecv',
          ''].join('\r\n'), InviteServerContext.ua.getLogger("sip.parser"));
        incomingPrackRequest = jasmine.createSpyObj("request", ["accept", "progress", "redirect", "reject", "trying"]);
        incomingPrackRequest.message = req;
        incomingPrackRequest.accept.and.returnValue({ message: "accept" });
        incomingPrackRequest.progress.and.returnValue({ message: "progress" });
        incomingPrackRequest.redirect.and.returnValue({ message: "redirect" });
        incomingPrackRequest.reject.and.returnValue({ message: "reject" });
        incomingPrackRequest.trying.and.returnValue({ message: "trying" });
      
        InviteServerContext.status = 6;

        InviteServerContext.dialog = {id: 7, terminate: function(){}, sendRequest: function(){}};
      });

      it('calls sessionDescriptionHandler.setDescription when the invite had no body, but the request had sdp', function(){
        // spyOn(InviteServerContext.mediaHandler, 'setDescription').and.returnValue(Promise.resolve(true));
        InviteServerContext.request.body = undefined;

        InviteServerContext.receiveRequest(incomingPrackRequest);

        expect(InviteServerContext.sessionDescriptionHandler.setDescription).toHaveBeenCalled();
      });

      it('calls terminate and failed when invite has no body, but the request has a non-sdp body', function() {
        InviteServerContext.request.body = undefined;
        spyOn(InviteServerContext, 'terminate');
        spyOn(InviteServerContext, 'failed');

        req = SIP.Parser.parseMessage([
          'PRACK sip:gled5gsn@hk95bautgaa7.invalid;transport=ws;aor=james%40onsnip.onsip.com SIP/2.0',
          'Max-Forwards: 65',
          'To: <sip:james@onsnip.onsip.com>',
          'From: "test1" <sip:test1@onsnip.onsip.com>;tag=rto5ib4052',
          'Call-ID: grj0liun879lfj35evfq',
          'CSeq: 1798 INVITE',
          'Contact: <sip:e55r35u3@kgu78r4e1e6j.invalid;transport=ws;ob>',
          'Allow: ACK,CANCEL,BYE,OPTIONS,INVITE,MESSAGE',
          'Content-Type: application/json',
          'Supported: outbound',
          'User-Agent: SIP.js 0.5.0-devel',
          'Content-Length: 11',
          '',
          'a=sendrecv',
          ''].join('\r\n'), InviteServerContext.ua.getLogger("sip.parser"));
        incomingPrackRequest.message = req;

        InviteServerContext.receiveRequest(incomingPrackRequest);

        expect(InviteServerContext.terminate).toHaveBeenCalled();
        expect(InviteServerContext.failed).toHaveBeenCalledWith(req, SIP.C.causes.BAD_MEDIA_DESCRIPTION);
      });

      it('calls reply(200) and other smaller things when the invite had a body (accept not called)', function() {
        InviteServerContext.hasOffer = true;
        InviteServerContext.hasAnswer = true;

        spyOn(window, 'clearTimeout').and.callThrough();
        spyOn(InviteServerContext, 'accept');

        InviteServerContext.receiveRequest(incomingPrackRequest);

        expect(clearTimeout).toHaveBeenCalledWith(InviteServerContext.timers.ackTimer);
        expect(clearTimeout).toHaveBeenCalledWith(InviteServerContext.timers.invite2xxTimer);
        expect(InviteServerContext.accept).not.toHaveBeenCalled();
        expect(incomingPrackRequest.accept).toHaveBeenCalled();
      });

      it('calls reply(200) and other smaller things when the invite had a body (accept also called)', function() {
        InviteServerContext.hasOffer = true;
        InviteServerContext.hasAnswer = true;

        spyOn(window, 'clearTimeout').and.callThrough();
        spyOn(InviteServerContext, 'accept');
        InviteServerContext.status = 10;

        InviteServerContext.receiveRequest(incomingPrackRequest);

        expect(clearTimeout).toHaveBeenCalledWith(InviteServerContext.timers.ackTimer);
        expect(clearTimeout).toHaveBeenCalledWith(InviteServerContext.timers.invite2xxTimer);
        expect(InviteServerContext.accept).toHaveBeenCalled();
        expect(incomingPrackRequest.accept).toHaveBeenCalled();
      });
    });

    xdescribe('method is BYE', function() {
      var incomingByeRequest;

      it('replies 200, emits bye, and terminates', function() {
        InviteServerContext.status = 12;
        req = SIP.Parser.parseMessage([
          'BYE sip:gled5gsn@hk95bautgaa7.invalid;transport=ws;aor=james%40onsnip.onsip.com SIP/2.0',
          'Max-Forwards: 65',
          'To: <sip:james@onsnip.onsip.com>',
          'From: "test1" <sip:test1@onsnip.onsip.com>;tag=rto5ib4052',
          'Call-ID: grj0liun879lfj35evfq',
          'CSeq: 1798 INVITE',
          'Contact: <sip:e55r35u3@kgu78r4e1e6j.invalid;transport=ws;ob>',
          'Allow: ACK,CANCEL,BYE,OPTIONS,INVITE,MESSAGE',
          'Content-Type: application/json',
          'Supported: outbound',
          'User-Agent: SIP.js 0.5.0-devel',
          'Content-Length: 11',
          '',
          'a=sendrecv',
          ''].join('\r\n'), InviteServerContext.ua.getLogger("sip.parser"));
        incomingByeRequest = jasmine.createSpyObj("request", ["accept", "progress", "redirect", "reject", "trying"]);
        incomingByeRequest.message = req;
        incomingByeRequest.accept.and.returnValue({ message: "accept" });
        incomingByeRequest.progress.and.returnValue({ message: "progress" });
        incomingByeRequest.redirect.and.returnValue({ message: "redirect" });
        incomingByeRequest.reject.and.returnValue({ message: "reject" });
        incomingByeRequest.trying.and.returnValue({ message: "trying" });
  
        spyOn(InviteServerContext, 'emit');
        spyOn(InviteServerContext, 'terminated').and.callThrough();

        InviteServerContext.receiveRequest(incomingByeRequest);

        expect(incomingByeRequest.accept).toHaveBeenCalled ();
        expect(InviteServerContext.emit.calls.first().args[0]).toBe('bye');
        expect(InviteServerContext.terminated).toHaveBeenCalledWith(req, SIP.C.BYE);
      });
    });

    xdescribe('method is INVITE', function() {
      var incomingReInviteRequest;

      it('calls receiveReinvite', function() {
        var catchSpy = jasmine.createSpy('catch');
        InviteServerContext.ua.transport.send = function () {return {catch: catchSpy};};
        InviteServerContext.status = 12;
        req = SIP.Parser.parseMessage([
          'INVITE sip:gled5gsn@hk95bautgaa7.invalid;transport=ws;aor=james%40onsnip.onsip.com SIP/2.0',
          'Max-Forwards: 65',
          'To: <sip:james@onsnip.onsip.com>',
          'From: "test1" <sip:test1@onsnip.onsip.com>;tag=rto5ib4052',
          'Call-ID: grj0liun879lfj35evfq',
          'CSeq: 1798 INVITE',
          'Contact: <sip:e55r35u3@kgu78r4e1e6j.invalid;transport=ws;ob>',
          'Allow: ACK,CANCEL,BYE,OPTIONS,INVITE,MESSAGE',
          'Content-Type: application/json',
          'Supported: outbound',
          'User-Agent: SIP.js 0.5.0-devel',
          'Content-Length: 11',
          '',
          'a=sendrecv',
          ''].join('\r\n'), InviteServerContext.ua.getLogger("sip.parser"));
        incomingReInviteRequest = jasmine.createSpyObj("request", ["accept", "progress", "redirect", "reject", "trying"]);
        incomingReInviteRequest.message = req;
        incomingReInviteRequest.accept.and.returnValue({ message: "accept" });
        incomingReInviteRequest.progress.and.returnValue({ message: "progress" });
        incomingReInviteRequest.redirect.and.returnValue({ message: "redirect" });
        incomingReInviteRequest.reject.and.returnValue({ message: "reject" });
        incomingReInviteRequest.trying.and.returnValue({ message: "trying" });
        spyOn(InviteServerContext, 'receiveReinvite');

        InviteServerContext.receiveRequest(incomingReInviteRequest);

        expect(InviteServerContext.receiveReinvite).toHaveBeenCalledWith(incomingReInviteRequest );
      });
    });

    xdescribe('method is INFO', function() {
      var incomingInfoRequest;

      it('makes a new DTMF', function() {
        var catchSpy = jasmine.createSpy('catch');
        InviteServerContext.ua.transport.send = function () {return {catch: catchSpy};};
        InviteServerContext.status = 12;
        req = SIP.Parser.parseMessage([
          'INFO sip:gled5gsn@hk95bautgaa7.invalid;transport=ws;aor=james%40onsnip.onsip.com SIP/2.0',
          'Max-Forwards: 65',
          'To: <sip:james@onsnip.onsip.com>',
          'From: "test1" <sip:test1@onsnip.onsip.com>;tag=rto5ib4052',
          'Call-ID: grj0liun879lfj35evfq',
          'CSeq: 1798 INVITE',
          'Contact: <sip:e55r35u3@kgu78r4e1e6j.invalid;transport=ws;ob>',
          'Allow: ACK,CANCEL,BYE,OPTIONS,INVITE,MESSAGE',
          'Content-Type: application/dtmf-relay',
          'Supported: outbound',
          'User-Agent: SIP.js 0.5.0-devel',
          'Content-Length: 26',
          '',
          'Signal= 6',
          'Duration= 100',
          ''].join('\r\n'), InviteServerContext.ua.getLogger("sip.parser"));
        incomingInfoRequest = jasmine.createSpyObj("request", ["accept", "progress", "redirect", "reject", "trying"]);
        incomingInfoRequest.message = req;
        incomingInfoRequest.accept.and.returnValue({ message: "accept" });
        incomingInfoRequest.progress.and.returnValue({ message: "progress" });
        incomingInfoRequest.redirect.and.returnValue({ message: "redirect" });
        incomingInfoRequest.reject.and.returnValue({ message: "reject" });
        incomingInfoRequest.trying.and.returnValue({ message: "trying" });

        InviteServerContext.receiveRequest(incomingInfoRequest);

        expect(incomingInfoRequest.accept).toHaveBeenCalled();

        //Not sure how to test this... another Session/* problem
      });

      it('returns a 415 if DTMF packet had the wrong content-type header', function() {
        var catchSpy = jasmine.createSpy('catch');
        InviteServerContext.ua.transport.send = function () {return {catch: catchSpy};};
        InviteServerContext.status = 12;
        req = SIP.Parser.parseMessage([
          'INFO sip:gled5gsn@hk95bautgaa7.invalid;transport=ws;aor=james%40onsnip.onsip.com SIP/2.0',
          'Max-Forwards: 65',
          'To: <sip:james@onsnip.onsip.com>',
          'From: "test1" <sip:test1@onsnip.onsip.com>;tag=rto5ib4052',
          'Call-ID: grj0liun879lfj35evfq',
          'CSeq: 1798 INVITE',
          'Contact: <sip:e55r35u3@kgu78r4e1e6j.invalid;transport=ws;ob>',
          'Allow: ACK,CANCEL,BYE,OPTIONS,INVITE,MESSAGE',
          'Content-Type: application/json',
          'Supported: outbound',
          'User-Agent: SIP.js 0.5.0-devel',
          'Content-Length: 11',
          '',
          'a=sendrecv',
          ''].join('\r\n'), InviteServerContext.ua.getLogger("sip.parser"));
        incomingInfoRequest.message = req;

        InviteServerContext.receiveRequest(incomingInfoRequest);

        expect(incomingInfoRequest.reject).toHaveBeenCalledWith({
          statusCode: 415,
          extraHeaders: ["Accept: application/dtmf-relay"]
        })
      });

      it('invokes onInfo if onInfo is set', function(done) {
        var catchSpy = jasmine.createSpy('catch');
        InviteServerContext.ua.transport.send = function () {return {catch: catchSpy};};
        InviteServerContext.status = 12;
        req = SIP.Parser.parseMessage([
          'INFO sip:gled5gsn@hk95bautgaa7.invalid;transport=ws;aor=james%40onsnip.onsip.com SIP/2.0',
          'Max-Forwards: 65',
          'To: <sip:james@onsnip.onsip.com>',
          'From: "test1" <sip:test1@onsnip.onsip.com>;tag=rto5ib4052',
          'Call-ID: grj0liun879lfj35evfq',
          'CSeq: 1798 INVITE',
          'Contact: <sip:e55r35u3@kgu78r4e1e6j.invalid;transport=ws;ob>',
          'Allow: ACK,CANCEL,BYE,OPTIONS,INVITE,MESSAGE',
          'Content-Type: application/dtmf-relay',
          'Supported: outbound',
          'User-Agent: SIP.js 0.5.0-devel',
          'Content-Length: 26',
          '',
          'Signal= 6',
          'Duration= 100',
          ''].join('\r\n'), InviteServerContext.ua.getLogger("sip.parser"));
        incomingInfoRequest.message = req;

        InviteServerContext.onInfo = function onInfo(request) {
          try {
            expect(incomingInfoRequest.message).toBe(request);
          } catch (error) {
            return done(error);
          }
          done();
        };

        InviteServerContext.receiveRequest(incomingInfoRequest);
      });
    });
  });
});

describe('InviteClientContext', function() {
  var InviteClientContext;
  var ua;
  var target;
  var webrtc;

  beforeEach(function(){
    target = 'bob@example.com';
    ua = new SIP.UA({uri: 'alice@example.com', wsServers: 'ws:server.example.com',
      sessionDescriptionHandlerFactory: function() {
        return {
          getDescription: function () { return Promise.resolve('foo'); },
          hasDescription: function (contentType) {
            return contentType === 'application/sdp';
          },
          setDescription: function () { return Promise.resolve(); },
          close: function () { return true; }
        };
      }
    });

    ua.transport = jasmine.createSpyObj('transport', ['send', 'connect', 'disconnect', 'reConnect', 'server', 'on', 'removeListener']);
    ua.transport.send.and.returnValue(Promise.resolve());
    ua.transport.server.scheme = 'wss';

    InviteClientContext = new SIP.InviteClientContext(ua, target);
    InviteClientContext.sendRequest = () => { return; }
  });

  afterEach(function(){
    if(ua.status !== 2) {
      ua.stop();
    };
  });

  it('throws a type error if target is undefined', function() {
    expect(function() {new SIP.InviteClientContext(ua, undefined);}).toThrowError('Not enough arguments');
  });

  it('throws a type error if normalizeTarget fails with the given target', function() {
    spyOn(ua, 'normalizeTarget').and.returnValue(undefined);

    expect(function() {new SIP.InviteClientContext(ua, target);}).toThrowError('Invalid target: bob@example.com');
  });

  it('sets several parameters at the end of the constructor', function() {
    expect(InviteClientContext.fromTag).toBeDefined();

    expect(InviteClientContext.isCanceled).toBe(false);
    expect(InviteClientContext.received100).toBe(false);

    expect(InviteClientContext.method).toBe(SIP.C.INVITE);

    expect(InviteClientContext.logger).toBe(ua.getLogger('sip.inviteclientcontext'));
  });

  it('sets anonymous, custom data, and contact', function() {
    var ICC = new SIP.InviteClientContext(ua, target, {anonymous: 'anon', renderbody: 'rbody', rendertype: 'rtype'});

    expect(ICC.anonymous).toBe('anon');
    expect(ICC.renderbody).toBe('rbody');
    expect(ICC.rendertype).toBe('rtype');
    expect(ICC.contact).toBe(ua.contact.toString({anonymous: 'anon', outbound: true}));
  });

  it('sets ua.applicants, request, local and remote identity, id, and logger', function() {
    expect(InviteClientContext.ua.applicants[InviteClientContext]).toBe(InviteClientContext);
    expect(InviteClientContext.request).toBeDefined();

    expect(InviteClientContext.localIdentity).toBe(InviteClientContext.request.from);
    expect(InviteClientContext.remoteIdentity).toBe(InviteClientContext.request.to);
    expect(InviteClientContext.id).toBe(InviteClientContext.request.callId + InviteClientContext.fromTag);
    expect(InviteClientContext.logger).toBe(InviteClientContext.ua.getLogger('sip.inviteclientcontext', InviteClientContext.id));

  });

  describe('.invite', function() {

    it('sets ua.sessions', function() {
      InviteClientContext.invite();
      expect(InviteClientContext.ua.sessions[InviteClientContext.id]).toBe(InviteClientContext);
    });

    xit('calls sessionDescriptionHandler.getDescription async and returns this on success', function(done) {
      var callback, s;

      spyOn(SIP.Web, 'getUserMedia').and.callThrough();
      callback = jasmine.createSpy('callback').and.callFake(function () {
        done();
        //jasmine.clock().uninstall();
      });

      //jasmine.clock().install();

      s = InviteClientContext.invite();
      expect(s).toBe(InviteClientContext);

      s.sessionDescriptionHandler.on('userMediaRequest', callback);

      expect(SIP.Web.getUserMedia).not.toHaveBeenCalled();
      expect(callback).not.toHaveBeenCalled();

      //jasmine.clock().tick(100);
    });
  });

  describe('.cancel', function() {
    it('throws an invalid state error if the status is TERMINATED', function() {
      InviteClientContext.status = 9;

      expect(function() {InviteClientContext.cancel();}).toThrowError('Invalid status: 9');
    });

    it('throws a type error if the status code is invalid', function() {
      expect(function() {InviteClientContext.cancel({statusCode: 700});}).toThrowError('Invalid statusCode: 700');
    });

    it('throws a type error if the status code is less than 200', function() {
      expect(function() {InviteClientContext.cancel({statusCode: 100});}).toThrowError('Invalid statusCode: 100');
    });

    it('sets isCanceled to true, calls canceled, and returns this if status is NULL', function() {
      InviteClientContext.status = 0;
      spyOn(InviteClientContext, 'failed').and.callThrough();
      spyOn(InviteClientContext, 'canceled').and.callThrough();
      spyOn(InviteClientContext, 'terminated').and.callThrough();

      expect(InviteClientContext.isCanceled).toBe(false);

      expect(InviteClientContext.cancel()).toBe(InviteClientContext);

      expect(InviteClientContext.isCanceled).toBe(true);
      expect(InviteClientContext.canceled).toHaveBeenCalled();
    });

    it('sets isCanceled to true, calls canceled, and returns this if status is INVITE_SENT and received100 is false', function() {
      InviteClientContext.status = 1;
      spyOn(InviteClientContext, 'failed').and.callThrough();
      spyOn(InviteClientContext, 'canceled').and.callThrough();
      spyOn(InviteClientContext, 'terminated').and.callThrough();

      expect(InviteClientContext.isCanceled).toBe(false);

      expect(InviteClientContext.cancel()).toBe(InviteClientContext);

      expect(InviteClientContext.isCanceled).toBe(true);
      expect(InviteClientContext.canceled).toHaveBeenCalled();
    });

    it('calls request.cancel, canceled, and returns this if status is INVITE_SENT and received100 is true', function() {
      InviteClientContext.status = 1;
      InviteClientContext.received100 = true;
      InviteClientContext.request = {cancel: jasmine.createSpy('cancel')};

      spyOn(InviteClientContext, 'failed').and.callThrough();
      spyOn(InviteClientContext, 'canceled').and.callThrough();
      spyOn(InviteClientContext, 'terminated').and.callThrough();

      expect(InviteClientContext.cancel()).toBe(InviteClientContext);

      expect(InviteClientContext.canceled).toHaveBeenCalled();
    });

    it('calls request.cancel, canceled, and returns this if status is 1XX_RECEIVED', function() {
      InviteClientContext.status = 2;
      InviteClientContext.request = {cancel: jasmine.createSpy('cancel')};

      spyOn(InviteClientContext, 'failed').and.callThrough();
      spyOn(InviteClientContext, 'canceled').and.callThrough();
      spyOn(InviteClientContext, 'terminated').and.callThrough();

      expect(InviteClientContext.cancel()).toBe(InviteClientContext);

      expect(InviteClientContext.canceled).toHaveBeenCalled();
    });
  });

  describe('.terminate', function() {
    it('calls bye and returns this if the status is WAITING_FOR_ACK', function() {
      InviteClientContext.status = 7;
      spyOn(InviteClientContext, 'bye');

      expect(InviteClientContext.terminate()).toBe(InviteClientContext);

      expect(InviteClientContext.bye).toHaveBeenCalled();
    });

    it('calls bye and returns this if the status is CONFIRMED', function() {
      InviteClientContext.status = 12;
      spyOn(InviteClientContext, 'bye');

      expect(InviteClientContext.terminate()).toBe(InviteClientContext);

      expect(InviteClientContext.bye).toHaveBeenCalled();
    });

    it('calls cancel and returns this if the status is anything else', function() {
      InviteClientContext.status = 0;
      spyOn(InviteClientContext, 'cancel');

      expect(InviteClientContext.terminate()).toBe(InviteClientContext);

      expect(InviteClientContext.cancel).toHaveBeenCalled();
    });
  });

});
