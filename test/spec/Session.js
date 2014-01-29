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

    runs(function () {
      console.log('first', session_options);
      ua = new SIP.UA(ua_config).start().on('connected', function () {
        console.log(session_options);
        session = ua.invite('alice@example.com', session_options);
      });
    });
  });

  afterEach(function () {
    waitsFor(function () {
      return sendSpy.calls.length > 0;
    }, 'Send never called', 500);
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
      expect(session.checkEvent('canceled')).toBe(true);
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

  xdescribe('following RFC3261 request generation rules (8.1.1)', function () {
    it('contains minimum header fields', function () {
      expect('this test').toBe('implemented');
    });

    it('sets the Request-URI to the To URI', function () {
      // See also - preloaded route set.
      expect('this test').toBe('implemented');
    });

    it('sets the To URI from the given target', function () {
      expect('this test').toBe('implemented');
    });

    it('must not contain a To tag', function () {
      expect('this test').toBe('implemented');
    });

    it('sets the From URI from the UA', function () {
      expect('this test').toBe('implemented');
    });

    it('contains a From tag', function () {
      // See also - 19.3
      expect('this test').toBe('implemented');
    });

    it('generates a new Call-ID', function () {
      expect('this test').toBe('implemented');
    });

    it('guarantees no other UA will inadvertently overlap Call-IDs', function () {
      expect('this test').toBe('implemented');
    });

    it('generates a valid CSeq', function () {
      expect('this test').toBe('implemented');
    });

    it('sets the Max-Forwards to 70', function () {
      expect('this test').toBe('implemented');
    });

    it('uses SIP/2.0 in the Via', function () {
      expect('this test').toBe('implemented');
    });

    it('has a branch parameter in the Via', function () {
      expect('this test').toBe('implemented');
    });

    it('has a Contact with one valid SIP URI', function () {
      expect('this test').toBe('implemented');
    });

    it('declares Support for UA-supported extensions', function () {
      expect('this test').toBe('implemented');
    });

    it('must declare Support only for RFC-defined extensions', function () {
      expect('this test').toBe('implemented');
    });
  });


  /**
     OPTIONS
     -------

     Documented:

     mediaConstraints
     mediaStream
     RTCConstraints -> rtcConstraints
     extraHeaders
     anonymous

     Undocumented:

     stun_servers
     turn_servers
     inviteWithoutSdp -> offer
     renderbody -> renderBody
     rendertype -> renderType
     params

     Unimplemented:

     rel100/100rel (Currently in UA configuration)
   */
  describe('with options.mediaConstraints', function () {
    it('not defined, defaults to audio+video', function () {
      var gumSpy = spyOn(SIP.WebRTC, 'getUserMedia').andCallThrough();
      waitsFor('session to be created', function () { return session; }, 100);
      runs(function () {
        expect(session.mediaConstraints).toEqual({
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

    it('defined, follows those constraints', function () {
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
      session_options.mediaConstraints = {
        audio: ['Anything', 'Goes', 'Here'],
        video: {
          resolution: 'da best',
          frame_rate: 'lowsy'
        },
        telepathy: {
          basic: 100
        }
      };
      waitsFor('session to be created', function () { return session; }, 100);
      runs(function () {
        expect(session.mediaConstraints).toEqual(myConstraints);
      });

      waitsFor('gum to be called', function () {
        return gumSpy.calls.length;
      }, 100);
      runs(function () {
        expect(gumSpy.mostRecentCall.args[0]).toEqual(myConstraints);
      });
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
  describe('with options.stun_servers', function () {

  });
  describe('with options.turn_servers', function () {

  });
  describe('with options.offer', function () {

  });
  describe('with options.renderBody', function () {

  });
  describe('with options.renderType', function () {

  });
  describe('with options.rel100', function () {

  });

  xdescribe('when receiving a 1xx response', function () {
    it('fires the `progress` event', function () {
      expect('this test').toBe('implemented');
    });

    it('sends an ACK', function () {
      expect('this test').toBe('implemented');
    });
  });

  xdescribe('when receiving a 2xx response', function () {
    it('fires the `accepted` event', function () {
      expect('this test').toBe('implemented');
    });

    it('sends an ACK', function () {
      expect('this test').toBe('implemented');
    });
  });

  xdescribe('when receiving a 3xx-6xx response', function () {
    it('fires the `rejected` event', function () {
      expect('this test').toBe('implemented');
    });

    it('sends an ACK', function () {
      expect('this test').toBe('implemented');
    });
  });

});