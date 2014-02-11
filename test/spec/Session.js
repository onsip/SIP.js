/*
 * Tests for the public API of SIP.Session, including
 * testing that UAC Sessions and UAS sessions pass
 * Client/ServerContext specs.
 */
describe('An INVITE sent from a UAC', function () {
  var ua, session,
      ua_config, session_options,
      sendSpy;

  beforeEach(function () {
    sendSpy = spyOn(window.WebSocket.prototype, 'send');
    ua = undefined;
    session = undefined;
    ua_config = {
      register: false
    };
    session_options = {};
    console.log('cleared constraints');

    console.log('first', session_options);
    ua = new SIP.UA(ua_config).on('connected', function () {
      console.log(session_options);
      session = ua.invite('alice@example.com', session_options);
    });
  });

  afterEach(function () {
    waitsFor(function () {
      return sendSpy.calls.length > 0;
    }, 'Send never called', 500);

    //UNBELIEVABLY IMPORTANT DON'T TOUCH IT
    runs(function() {
      if(ua.status !== 2) {
        ua.stop();
      };
    });
  });

  it('inits ClientContext events', function () {
    waitsFor(function () {
      return session;
    }, "The Session was never created", 100);

    runs(function () {
      expect(session.checkEvent('progress')).toBe(true);
      expect(session.checkEvent('accepted')).toBe(true);
      expect(session.checkEvent('rejected')).toBe(true);
      expect(session.checkEvent('failed')).toBe(true);
    });

  });

  it('inits Session events', function () {
    waitsFor(function () {
      return session;
    }, "The Session was never created", 100);

    runs(function () {
      expect(session.checkEvent('connecting')).toBe(true);
      expect(session.checkEvent('cancel')).toBe(true);
      expect(session.checkEvent('referred')).toBe(true);
      expect(session.checkEvent('dtmf')).toBe(true);
      expect(session.checkEvent('bye')).toBe(true);
    });
  });

  it('inits instance attributes', function () {
    waitsFor(function () {
      return session;
    }, "The Session was never created", 100);

    runs(function () {
      expect(session.ua).toBe(ua);
      expect(session.method).toBe(SIP.C.INVITE);

      expect(session.request).toBeDefined();
      expect(session.request instanceof SIP.OutgoingRequest).toBe(true);

      expect(session.localIdentity).toBeDefined();
      expect(session.localIdentity instanceof SIP.NameAddrHeader).toBe(true);
      expect(session.localIdentity.hasParam('tag')).toBe(true);
      expect(session.localIdentity.toString()).toMatch(/<sip:anonymous\.(.){6}@anonymous.invalid>;tag=/);

      expect(session.remoteIdentity).toBeDefined();
      expect(session.remoteIdentity instanceof SIP.NameAddrHeader).toBe(true);
      expect(session.remoteIdentity.hasParam('tag')).toBe(false);
      expect(session.remoteIdentity.toString()).toBe('<sip:alice@example.com>');

      expect(session.data).toEqual({});
    });
  });

  it('has a custom .data attribute', function () {
    waitsFor(function () {
      return session;
    }, "The Session was never created", 100);

    runs(function () {
      expect(session.data).toEqual({});
    });
  });

  it('gets user media', function () {
    var gumSpy = spyOn(SIP.WebRTC, 'getUserMedia').andCallThrough();

    waitsFor(function () {
      return gumSpy.calls.length;
    }, 'GetUserMedia never called', 100);

    runs(function () {
      expect(gumSpy.calls.length).toBe(1);
    });
  });

  it('sends an INVITE on the WebSocket', function () {
    waitsFor(function () {
      return sendSpy.calls.length > 0;
    }, 'Send never called', 500);

    runs(function () {
      expect(sendSpy.calls.length).toBe(1);
      expect(sendSpy.mostRecentCall.args[0]).toMatch('INVITE sip:alice@example.com SIP/2.0\r\n');
      expect(session.status).toBe(SIP.Session.C.STATUS_INVITE_SENT);
    });
  });

  it('has no dialogs at first', function () {
    waitsFor(function () { return session; }, 'Session was never created', 100);

    runs(function () {
      expect(session.dialog).toBeNull();
      expect(session.earlyDialogs).toEqual({});
    });
  });

  describe('following RFC3261 request generation rules (8.1.1)', function () {
    beforeEach(function() {
      waitsFor(function() {
        return sendSpy.calls.length > 0;
      }, 'Send never called', 500);
    });

    it('contains minimum header fields', function () {
      expect(session.request.hasHeader('to')).toBe(true);
      expect(session.request.hasHeader('from')).toBe(true);
      expect(session.request.hasHeader('cseq')).toBe(true);
      expect(session.request.hasHeader('call-id')).toBe(true);
      expect(session.request.hasHeader('max-forwards')).toBe(true);
      expect(session.request.hasHeader('via')).toBe(true);      
    });

    it('sets the Request-URI to the To URI', function () {
      // See also - preloaded route set.
      expect(session.request.getHeader('to')).toBe("<" + session.request.ruri.toString() + ">");
    });

    it('sets the To URI from the given target', function () {
      expect(session.request.getHeader('to')).toBe("<sip:alice@example.com>");
    });

    it('must not contain a To tag', function () {
      expect(session.request.getHeader('to')).not.toContain(';tag');
    });

    it('sets the From URI from the UA', function () {
      expect(session.request.getHeader('from')).toContain(ua.configuration.displayName);
    });

    it('contains a From tag', function () {
      // See also - 19.3
     expect(session.request.getHeader('from')).toContain(';tag');
    });

    it('generates a new Call-ID', function () {
      var id = session.request.getHeader('call-id');
      var ids = {};
      ids[id] = true;
      for (var i = 1; i < 1000; i++) {
        session = ua.invite('alice@example.com', session_options);
        /*waitsFor(function() {
          return sendSpy.calls.length > i;
        }, 'Send never called', 10000); */

        id = session.request.getHeader('call-id');
        expect(ids[id]).toBeUndefined();
        ids[id] = true;
      }
    });

    //hard to 'guarantee,' but if there is a problem here then there was almost certainly a mistake added to the code.
    it('guarantees no other UA will inadvertently overlap Call-IDs', function () {
      var id = ua.configuration.jssipId;
      var ids = {};
      ids[id] = true;

      for (var i = 1; i < 10; i++) {
        ua = new SIP.UA(ua_config);
        id = ua.configuration.jssipId;
        expect(ids[id]).toBeUndefined();
        ids[id] = true;
      }
    });

    it('generates a valid CSeq', function () {
      var cseq = parseInt(session.request.getHeader('cseq').substring(0, session.request.getHeader('cseq').indexOf(' ')));
      expect(cseq).toBeLessThan(Math.pow(2,31));
      expect(cseq).toBeGreaterThan(0);
    });

    it('sets the Max-Forwards to 70', function () {
      expect(parseInt(session.request.getHeader('max-forwards'))).toBe(70);
    });

    it('uses SIP/2.0 in the Via', function () {
      var via = SIP.Parser.parseMessage(sendSpy.mostRecentCall.args[0], ua).getHeader('via');
      expect(via).toContain('SIP/2.0');
    });

    it('has a branch parameter in the Via', function () {
      var via = SIP.Parser.parseMessage(sendSpy.mostRecentCall.args[0], ua).getHeader('via');
      expect(via).toContain(';branch');
    });

    it('has a Contact with one valid SIP URI', function () {
      var sip = session.request.getHeader('contact').indexOf('sip:') + 3;
      expect(sip).not.toBe(2);
      expect(session.request.getHeader('contact').indexOf('sip:', sip)).toBe(-1);
    });

    //not sure where this would go
    xit('declares Support for UA-supported extensions', function () {
      expect('this test').toBe('implemented');
    });

    //RFC only mentions other RFC's; there is no exhaustive list
    xit('must declare Support only for RFC-defined extensions', function () {
      expect('this test').toBe('implemented');
    });
  });


  /**
     OPTIONS
     -------

     Documented:

     media
     RTCConstraints -> rtcConstraints
     extraHeaders
     anonymous

     Undocumented:

     stunServers
     turnServers
     inviteWithoutSdp -> offer
     renderbody -> renderBody
     rendertype -> renderType
     params

     Unimplemented:

     rel100/100rel (Currently in UA configuration)
   */
  describe('with options.media', function () {
    it('not defined, defaults to audio+video', function () {
      var gumSpy = spyOn(SIP.WebRTC, 'getUserMedia').andCallThrough();
      waitsFor('session to be created', function () { return session; }, 100);
      runs(function () {
        expect(session.mediaHandler.mediaStreamManager.constraints).toEqual({
          audio: true,
          video: true
        });
      });

      waitsFor('gum to be called', function () {
        return gumSpy.calls.length;
      }, 100);
      runs(function () {
        expect(gumSpy.mostRecentCall.args[0]).toEqual({
          audio: true,
          video: true
        });
      });
    });

    it('defined as constraints, follows those constraints', function () {
      console.log('running sync');
      var gumSpy = spyOn(SIP.WebRTC, 'getUserMedia').andCallThrough();
      var myConstraints = {
        audio: ['Anything', 'Goes', 'Here'],
        video: {
          resolution: 'da best',
          frame_rate: 'lowsy'
        },
        telepathy: {
          basic: 100
        }
      };
      session_options.media = myConstraints;
      waitsFor('gum to be called', function () {
        return gumSpy.calls.length;
      }, 100);
      runs(function () {
        expect(gumSpy.mostRecentCall.args[0]).toEqual(myConstraints);
      });
    });

    it('TODO defined as stream, uses the stream', function () {
      // TODO
    });

    it('TODO defined as manager, uses the manager', function () {
      // TODO
    });
  });
  describe('with options.mediaStream', function () {
  });
  describe('with options.rtcConstraints', function () {

  });
  describe('with options.extraHeaders', function () {

  });
  describe('with options.params', function () {

  });
  describe('with options.anonymous', function () {

  });
  describe('with options.stunServers', function () {

  });
  describe('with options.turnServers', function () {

  });
  describe('with options.offer', function () {

  });
  describe('with options.renderBody', function () {

  });
  describe('with options.renderType', function () {

  });
  describe('with options.rel100', function () {

  });

  describe('when receiving a 1xx response', function () {
    beforeEach(function() {
      ua_config.uri = 'alice@example.com';

      uas = new SIP.UA(ua_config);

      waitsFor(function () {
        return sendSpy.calls.length > 0 && uas.isConnected();
      }, 'Send never called', 500);

      runs(function(){uas.transport.ws.receiveMessage(sendSpy.mostRecentCall.args[0]);});
    });

    it('fires the `progress` event', function () {
      waitsFor( function() {
        return ua.isConnected() && sendSpy.mostRecentCall.args[0].indexOf('180 Ringing') >= 0;
      }, 'accept never called', 500);

      runs(function() {
        spyOn(session, 'emit');
        ua.transport.ws.receiveMessage(sendSpy.mostRecentCall.args[0]);

        expect(session.emit.mostRecentCall.args[0]).toBe('progress');
      });
    });
  });

  describe('when receiving a 2xx response', function () {
    var uas;

    beforeEach(function() {
      ua_config.uri = 'alice@example.com';

      uas = new SIP.UA(ua_config).on('invite', function (newSession) {
        newSession.accept();
      });

      waitsFor(function () {
        return sendSpy.calls.length > 0 && uas.isConnected();
      }, 'Send never called', 500);

      runs(function(){uas.transport.ws.receiveMessage(sendSpy.mostRecentCall.args[0]);});
    });

    it('fires the `accepted` event', function () {
      waitsFor( function() {
        return ua.isConnected() && sendSpy.mostRecentCall.args[0].indexOf('200 OK') >= 0;
      }, 'accept never called', 500);

      runs(function() {
        spyOn(session, 'accepted');
        ua.transport.ws.receiveMessage(sendSpy.mostRecentCall.args[0]);
      });

     waitsFor( function() {
       return session.accepted.calls.length > 0;
     }, 'accepted never called', 500);
    });

    it('sends an ACK', function () {
      waitsFor( function() {
        return sendSpy.mostRecentCall.args[0].indexOf('200 OK') >= 0;
      }, 'accept never called', 500);

      runs(function() {
        ua.transport.ws.receiveMessage(sendSpy.mostRecentCall.args[0]);
      });

      waitsFor( function() {
        return sendSpy.mostRecentCall.args[0].indexOf('ACK') >= 0;
      }, 'ACK never sent', 500);
    });
  });

  describe('when receiving a 3xx-6xx response', function () {
    beforeEach(function() {
      ua_config.uri = 'alice@example.com';

      uas = new SIP.UA(ua_config).on('invite', function (newSession) {
        newSession.reject();
      });

      waitsFor(function () {
        return sendSpy.calls.length > 0 && uas.isConnected();
      }, 'Send never called', 500);

      runs(function(){uas.transport.ws.receiveMessage(sendSpy.mostRecentCall.args[0]);});
    });

    it('fires the `rejected` event', function () {
      waitsFor( function() {
        return ua.isConnected() && sendSpy.mostRecentCall.args[0].indexOf('480') >= 0;
      }, 'reject never called', 500);

      runs(function() {
        spyOn(session, 'rejected');
        ua.transport.ws.receiveMessage(sendSpy.mostRecentCall.args[0]);
      });

      waitsFor( function() {
        return session.rejected.calls.length > 0;
      }, 'rejected never called', 500);
    });

    it('sends an ACK', function () {
      waitsFor( function() {
        return ua.isConnected() && sendSpy.mostRecentCall.args[0].indexOf('480') >= 0;
      }, 'reject never called', 500);

      runs(function() {
        ua.transport.ws.receiveMessage(sendSpy.mostRecentCall.args[0]);
      });

      waitsFor( function() {
        return sendSpy.mostRecentCall.args[0].indexOf('ACK') >= 0;
      }, 'ACK never sent', 500);
    });
  });

});
