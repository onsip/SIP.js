/*
 * Tests for the UAC-side of the SIP.Session API, including
 * testing that UAC Sessions pass ClientContext specs.
 */
describe('An INVITE sent from a UAC', function () {
  var ua, session,
      ua_config, session_options;

  beforeEach(function (done) {
    ua_config = {
      register: false
    };
    session_options = {};

    ua = new SIP.UA(ua_config).once('connected', function () {
      session = ua.invite('alice@example.com', session_options);
      setTimeout(done, 0);
    });
  });

  /**
   *
   * Initial behavior tests
   *
   */
  it('inits ClientContext events', function () {
    expect(session.checkEvent('progress')).toBe(true);
    expect(session.checkEvent('accepted')).toBe(true);
    expect(session.checkEvent('rejected')).toBe(true);
    expect(session.checkEvent('failed')).toBe(true);
  });

  it('inits Session events', function () {
    expect(session.checkEvent('connecting')).toBe(true);
    expect(session.checkEvent('cancel')).toBe(true);
    expect(session.checkEvent('dtmf')).toBe(true);
    expect(session.checkEvent('bye')).toBe(true);
  });

  it('inits instance attributes', function () {
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

  it('has a custom .data attribute', function () {
    expect(session.data).toEqual({});
  });

  it('gets user media', function (done) {
    var gumSpy = spyOn(SIP.WebRTC, 'getUserMedia').and.callFake(function () {
      return SIP.Utils.Promise.resolve().then(done)
    });
    session = ua.invite('alice@example.com', session_options);
  });

  it('sends an INVITE on the WebSocket', function (done) {
    // HACK: IF THIS BREAKS, CHANGE THE NUMBER: this is sketchy
    setTimeout(function() {
      expect(ua.transport.ws.send).toHaveBeenCalled();
      expect(ua.transport.ws.send.calls.mostRecent().args[0]).toMatch('INVITE sip:alice@example.com SIP/2.0\r\n');
      expect(session.status).toBe(SIP.Session.C.STATUS_INVITE_SENT);
      done();
    }, 200);
  });

  it('has no dialogs at first', function () {
    expect(session.dialog).toBeNull();
    expect(session.earlyDialogs).toEqual({});
  });


  /**
   *
   * RFC 3261 rules for valid requests.
   *
   */
  describe('following RFC3261 request generation rules (8.1.1)', function () {

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

        id = session.request.getHeader('call-id');
        expect(ids[id]).toBeUndefined();
        ids[id] = true;
      }
    });

    //hard to 'guarantee,' but if there is a problem here then there was almost certainly a mistake added to the code.
    it('guarantees no other UA will inadvertently overlap Call-IDs', function () {
      var id = ua.configuration.sipjsId;
      var ids = {};
      ids[id] = true;

      for (var i = 1; i < 10; i++) {
        ua = new SIP.UA(ua_config);
        id = ua.configuration.sipjsId;
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

    describe('the Via header', function () {
      beforeEach(function (done) {
        if (ua.transport.ws.send.calls.mostRecent()) {
          done();
        } else {
          ua.transport.ws.send.and.callFake(function () {
            setTimeout(done, 0);
          });
        }
      });

      it('uses SIP/2.0', function () {
        var via = SIP.Parser.parseMessage(ua.transport.ws.send.calls.mostRecent().args[0], ua).getHeader('via');
        expect(via).toContain('SIP/2.0');
      });

      it('has a branch parameter', function () {
        var via = SIP.Parser.parseMessage(ua.transport.ws.send.calls.mostRecent().args[0], ua).getHeader('via');
        expect(via).toContain(';branch');
      });
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
    var gumSpy;

    it('not defined, defaults to audio+video', function (done) {
      gumSpy = spyOn(SIP.WebRTC, 'getUserMedia').and.callFake(function() {
        expect(gumSpy.calls.mostRecent().args[0]).toEqual({
          audio: true,
          video: true
        });
        return SIP.Utils.Promise.resolve().then(function () {
          setTimeout(done, 0);
        });
      });
      session = ua.invite('alice@example.com', session_options);
    });

    it('defined as constraints, follows those constraints', function (done) {
      var myConstraints;

      gumSpy = spyOn(SIP.WebRTC, 'getUserMedia').and.callFake(function() {
        expect(gumSpy.calls.mostRecent().args[0]).toEqual(myConstraints);
        return SIP.Utils.Promise.resolve().then(function () {
          setTimeout(done, 0);
        });
      });

      myConstraints = {
        audio: ['Anything', 'Goes', 'Here'],
        video: {
          resolution: 'da best',
          frame_rate: 'lowsy'
        },
        telepathy: {
          basic: 100
        }
      };
      session_options.media = {constraints: myConstraints};

      session = ua.invite('alice@example.com', session_options);
    });

    xit('TODO defined as stream, uses the stream', function () {
      // TODO
    });

    xit('TODO defined as manager, uses the manager', function () {
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


  /**
   *
   * 1xx Response texts (Progress)
   *
   */
  describe('when receiving a 1xx response', function () {
    var uas;

    beforeEach(function(done) {
      ua_config.uri = 'alice@example.com';

      uas = new SIP.UA(ua_config).once('connected', function () {
        uas.transport.ws.send.and.callFake(function (){
          var arg0 = uas.transport.ws.send.calls.mostRecent().args[0];
          if (arg0.indexOf('180 Ringing') >= 0) {
            spyOn(session, 'emit').and.callFake(function () {
              setTimeout(done, 0);
            });
            ua.transport.ws.receiveMessage(arg0);
          }
        });

        if (ua.transport.ws.send.calls.mostRecent() && ua.transport.ws.send.calls.mostRecent().args[0].indexOf('INVITE') >= 0) {
          uas.transport.ws.receiveMessage(ua.transport.ws.send.calls.mostRecent().args[0]);
        } else {
          ua.transport.ws.send.and.callFake(function () {
            var arg0 = ua.transport.ws.send.calls.mostRecent().args[0];
            if (arg0.indexOf('INVITE') >= 0) {
              uas.transport.ws.receiveMessage(arg0);
            }
          });
        }
      });
    });

    it('fires the `progress` event', function () {
      expect(session.emit.calls.mostRecent().args[0]).toBe('progress');
    });
  });

  /**
   *
   * 2xx Response texts (Accepted)
   *
   */
  describe('when receiving a 2xx response', function (done) {
    var uas;

    beforeEach(function(done) {
      ua_config.uri = 'alice@example.com';

      uas = new SIP.UA(ua_config).once('invite', function (newSession) {
        spyOn(session, 'accepted').and.callFake(function() {
          setTimeout(done, 0);
        });

        uas.transport.ws.send.and.callFake(function () {
          if (uas.transport.ws.send.calls.mostRecent().args[0].indexOf('200 OK') >= 0) {
            ua.transport.ws.receiveMessage(uas.transport.ws.send.calls.mostRecent().args[0]);
          }
        });

        newSession.accept();
      }).once('connected', function () {
        if (ua.transport.ws.send.calls.mostRecent() && ua.transport.ws.send.calls.mostRecent().args[0].indexOf('INVITE') >= 0) {
          uas.transport.ws.receiveMessage(ua.transport.ws.send.calls.mostRecent().args[0]);
        } else {
          ua.transport.ws.send.and.callFake(function () {
            var arg0 = ua.transport.ws.send.calls.mostRecent().args[0];
            if (arg0.indexOf('INVITE') >= 0) {
              uas.transport.ws.receiveMessage(arg0);
            }
          });
        }
      });
    });

    it('fires the `accepted` event', function () {
      expect(session.accepted).toHaveBeenCalled();
    });

    it('sends an ACK', function () {
      expect(ua.transport.ws.send.calls.mostRecent().args[0]).toContain('ACK');
    });
  });

  /**
   *
   * [3-6]xx Response texts (Rejected/Redirected/Failure)
   *
   */
  describe('when receiving a 3xx-6xx response', function () {
    var uas;

    beforeEach(function(done) {
      ua_config.uri = 'alice@example.com';

      uas = new SIP.UA(ua_config).once('invite', function (newSession) {
        spyOn(session, 'rejected').and.callFake(function () {
          setTimeout(done, 0);
        });

        uas.transport.ws.send.and.callFake(function () {
          if (uas.transport.ws.send.calls.mostRecent().args[0].indexOf('480') >= 0) {
            ua.transport.ws.receiveMessage(uas.transport.ws.send.calls.mostRecent().args[0]);
          }
        });

        newSession.reject();
      }).once('connected', function () {
        if (ua.transport.ws.send.calls.mostRecent() && ua.transport.ws.send.calls.mostRecent().args[0].indexOf('INVITE') >= 0) {
          uas.transport.ws.receiveMessage(ua.transport.ws.send.calls.mostRecent().args[0]);
        } else {
          ua.transport.ws.send.and.callFake(function () {
            var arg0 = ua.transport.ws.send.calls.mostRecent().args[0];
            if (arg0.indexOf('INVITE') >= 0) {
              uas.transport.ws.receiveMessage(arg0);
            }
          });
        }
      });
    });

    it('fires the `rejected` event', function () {
      expect(session.rejected).toHaveBeenCalled();
    });

    it('sends an ACK', function () {
      expect(ua.transport.ws.send.calls.mostRecent().args[0]).toContain('ACK');
    });
  });

  /**
   *
   * Termination events
   *
   */
  describe('when terminated', function () {

    /* Before acceptance. */
    describe('before it has been accepted', function () {

      /* All rejection responses should fire these events. */
      function rejectResponseTests() {
        it('fires a `rejected` event', function () {

        });

        it('fires a `failed` event', function () {

        });

        it('fires a `terminated` event', function () {

        });
      }
      
      describe('by a [3-6]xx response', function () {
        rejectResponseTests();
      });

      describe('by a system error', function () {
        it('fires a `failed` event', function () {

        });

        it('fires a `terminated` event', function () {

        });

        it('does not fire a `rejected` event', function () {

        });
      });

      describe('using the `cancel` method', function () {
        it('fires a `cancel` event', function () {

        });

        it('does not immediately fire `rejected`', function () {
          
        });

        it('does not immediately fire `failed`', function () {
          
        });

        it('does not immediately fire `terminated`', function () {

        });

        describe('after receiving a 487', function () {
          rejectResponseTests();
        });
      });

      describe('using the `terminate` method', function () {
        it('uses `cancel`', function () {

        });
        
        it('does not fire `terminated` on its own', function () {

        });
      });
    });

    /* After acceptance. */
    describe('after it has been accepted', function () {
      it('does not fire a `failed` event', function () {

      });

      describe('by a BYE request', function () {
        it('fires a `bye` event', function () {

        });

        it('fires a `terminated` event', function () {

        });

        it('does not fire a `rejected` or `failed` event', function () {

        });
      });

      describe('using the `bye` method', function () {
        it('fires a `bye` event', function () {

        });

        it('fires a `terminated` event', function () {

        });

        it('does not fire a `rejected` or `failed` event', function () {

        });

      });

      describe('by a system failure', function () {
        it('fires a `bye` event', function () {

        });

        it('sends a BYE with a reason', function () {

        });

        it('fires a `terminated` event', function () {

        });

        it('does not fire a `rejected` or `failed` event', function () {

        });
      });

      it('cannot be canceled', function () {
        
      });

      describe('using the `terminated` method', function () {
        it('uses `bye`', function () {

        });

        it('does not fire `terminated` on its own', function () {

        });
      });
    });

  });
});
