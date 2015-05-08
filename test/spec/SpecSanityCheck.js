describe('SanityCheck', function () {

  var transport, h, message, ua;

  h = {
    request: 'INVITE sip:eric@example.com SIP/2.0\r\n',
    ni_request: 'INFO sip:eric@example.com SIP/2.0\r\n',
    response: 'SIP/2.0 200 OK\r\n',
    from: 'From: <sip:will@example.com>;tag=123abc\r\n',
    to: 'To: <sip:james@example.com>\r\n',
    call_id: 'Call-Id: 123456\r\n',
    cseq: 'CSeq: 9999 INVITE\r\n',
    via: 'Via: SIP/2.0/WSS MYHOST;branch=z9hG4bK7532297\r\n',
    x_path: 'X-Path: other random information\r\n',
    p_hello: 'P-Hello: World!\r\n',

    f: 'f: <sip:will@example.onsip.com>;tag=123abc\r\n',
    t: 't: <sip:james@example.onsip.com>\r\n',
    i: 'i: 123456\r\n',
    v: 'v: SIP/2.0/WSS MYHOST;branch=z9hG4bK7532297\r\n'
  };

  beforeAll(function () {
    ua = new SIP.UA();
    ua.transport = transport;
    h.via = h.via.replace('MYHOST', ua.configuration.viaHost);
    h.v = h.v.replace('MYHOST', ua.configuration.viaHost);
  });

  function p(data) {
    return SIP.Parser.parseMessage(data, ua);
  };

  function expectOkay(message) {
    expect(SIP.sanityCheck(message, ua, transport)).toBe(true);
    expect(transport.send).not.toHaveBeenCalled();
  }

  function expectReply(message, code) {
    expect(SIP.sanityCheck(message, ua, transport)).toBe(false);
    expect(transport.send).toHaveBeenCalled();
    if (code) {
      expect(transport.send.calls.mostRecent().args[0]).toMatch('SIP/2.0 ' + code + ' ');
    }
  }

  function expectDropped(message) {
    expect(SIP.sanityCheck(message, ua, transport)).toBe(false);
    expect(transport.send).not.toHaveBeenCalled();
  }

  beforeEach(function () {
    transport = jasmine.createSpyObj('transport', ['send']);
  });

  afterEach(function () {
    ua.transport = jasmine.createSpyObj('transport', ['disconnect']);
    ua.stop();
  });

  describe('for all IncomingMessages', function () {

    describe('minimumHeaders check', function () {
      it('accepts messages with minimum headers', function () {
        message = p(h.request + h.from + h.to + h.call_id + h.cseq + h.via + '\r\n');
        expectOkay(message);

        message = p(h.response + h.to + h.from + h.call_id + h.via + h.cseq + '\r\n');
        expectOkay(message);

        message = p(h.response + h.from + h.to + h.call_id + h.cseq + h.via + '\r\n');
        expectOkay(message);
      });

      it('accepts messages with mininum short-form headers', function () {
        message = p(h.request + h.f + h.t + h.i + h.v + h.cseq + '\r\n');
        expectOkay(message);

        message = p(h.response + h.i + h.cseq + h.v + h.t + h.f + '\r\n');
        expectOkay(message);

        message = p(h.response + h.t + h.f + h.v + h.i + h.cseq + '\r\n');
        expectOkay(message);
      });

      it('rejects messages with no From header', function () {
        message = p(h.request + h.to + h.call_id + h.cseq + h.via + '\r\n');
        expectDropped(message);

        message = p(h.request + h.to + h.call_id + h.via + h.cseq + '\r\n');
        expectDropped(message);

        message = p(h.response + h.t + h.v + h.i + h.cseq + '\r\n');
        expectDropped(message);
      });

      it('rejects messages with no To header', function () {
        message = p(h.request + h.from + h.call_id + h.cseq + h.via + '\r\n');
        expectDropped(message);

        message = p(h.request + h.from + h.call_id + h.via + h.cseq + '\r\n');
        expectDropped(message);

        message = p(h.response + h.f + h.v + h.i + h.cseq + '\r\n');
        expectDropped(message);
      });

      it('rejects messages with no Call-Id header', function () {
        message = p(h.request + h.from + h.to + h.cseq + h.via + '\r\n');
        expectDropped(message);

        message = p(h.response + h.from + h.to + h.via + h.cseq + '\r\n');
        expectDropped(message);

        message = p(h.response + h.f + h.v + h.t + h.cseq + '\r\n');
        expectDropped(message);
      });

      it('rejects messages with no CSeq header', function () {
        message = p(h.request + h.from + h.to + h.call_id + h.via + '\r\n');
        expectDropped(message);

        message = p(h.request + h.from + h.to + h.via + h.call_id + '\r\n');
        expectDropped(message);

        message = p(h.response + h.f + h.v + h.t + h.i + '\r\n');
        expectDropped(message);
      });

      it('rejects messages with no Via header', function () {
        message = p(h.request + h.from + h.to + h.call_id + h.cseq + '\r\n');
        expectDropped(message);

        message = p(h.response + h.from + h.to + h.cseq + h.call_id + '\r\n');
        expectDropped(message);

        message = p(h.response + h.f + h.cseq + h.t + h.i + '\r\n');
        expectDropped(message);
      });
    
    });
  });

  describe('for IncomingRequests', function () {

    describe('rfc3261 check', function () {

      describe('8.2.2.1', function () {
        it('rejects requests with an invalid RURI scheme', function () {
          message = p('INVITE tel:eric@example.com SIP/2.0\r\n' +
                      h.from + h.to + h.call_id + h.via + h.cseq + '\r\n');
          expectReply(message, 416);

          message = p('INVITE tel:eric@example.com SIP/2.0\r\n' +
                      h.from + h.to + h.call_id + h.via + h.cseq + '\r\n');
          message.ruri = new SIP.URI('tel', 'eric', 'example.com', null, null);
          expectReply(message, 416);

          message = p('INVITE mailto:eric@example.com SIP/2.0\r\n' +
                      h.from + h.to + h.call_id + h.via + h.cseq + '\r\n');
          expectReply(message, 416);

          message = p('INVITE qbert:eric@example.com SIP/2.0\r\n' +
                      h.from + h.to + h.call_id + h.via + h.cseq + '\r\n');
          expectReply(message, 416);
        });

        xit('does not examine the To header', function () {
          // Currently rejected in Grammar
          message = p(h.request + h.from + h.call_id + h.via + h.cseq +
                      'To: <tel:james@example.com>\r\n\r\n');
          expectOkay(message);

          message = p(h.request + h.from + h.call_id + h.via + h.cseq +
                      'To: <mailto:james@example.com>\r\n\r\n');
          expectOkay(message);

          message = p(h.request + h.from + h.call_id + h.via + h.cseq +
                      'To: <qbert:james@example.com>\r\n\r\n');
          expectOkay(message);
        });
      });

      describe('16.3.4', function () {
        // NOTE: This is not the actual check from RFC3261.

        it('rejects messages from itself as loops', function () {
          message = p(h.request + h.f + h.t + h.v + h.cseq +
                      "Call-Id: " + ua.configuration.sipjsId + 'hello\r\n\r\n');
          expectReply(message, 482);
        });

        it('accepts messages from other places', function () {
          message = p(h.request + h.f + h.t + h.v + h.cseq +
                      "Call-Id: q" + ua.configuration.sipjsId + 'hello\r\n\r\n');
          expectOkay(message);
        });
      });

      describe('18.3_request', function () {
        it('rejects messages that are too short', function () {
          message = p(h.request + h.f + h.t + h.i + h.v + h.cseq +
                      'Content-Length: 1000\r\n\r\n12345\r\n\r\n');
          expectReply(message, 400);
        });

        it('accepts messages with no Content-Length', function () {
          message = p(h.request + h.f + h.t + h.i + h.v + h.cseq +
                      '\r\n\r\n12345\r\n\r\n');
          expectOkay(message);
        });

        it('truncates messages that are too long', function () {
          message = p(h.request + h.f + h.t + h.i + h.v + h.cseq +
                      'Content-Length: 3\r\n\r\n12345\r\n\r\n');
          expectOkay(message);
        });
      });

      describe('8.2.2.2', function () {
        it('rejects merged INVITE requests', function () {
          message = p(h.request + h.f + h.t + h.i + h.v + h.cseq + '\r\n');
          spyOn(message, 'reply');
          ua.transactions.ist[message.via_branch] = new SIP.Transactions.InviteServerTransaction(message, ua);
          message = p(h.request + h.f + h.t + h.i + h.cseq +
                      'Via: SIP/2.0/WSS ' + ua.configuration.viaHost + ';branch=z9hG4bK7532300\r\n\r\n');
          expectReply(message, 482);
        });

        it('rejects very different matching INVITE requests', function () {
          message = p(h.request +
                      'From: "Hello World" <sip:hello@example.org;param=foo>;tag=123abc\r\n' +
                      'To: "Goodnight Moon" <sip:moon@example.co.uk;bar=baz>\r\n' +
                      'Via: SIP/2.0/WSS ' + ua.configuration.viaHost + ';branch=z9hG4bK7532302\r\n' +
                      h.i + 'CSeq: 128102 INVITE\r\n\r\n');
          spyOn(message, 'reply');
          ua.transactions.ist[message.via_branch] = new SIP.Transactions.InviteServerTransaction(message, ua);
          message = p(h.request + h.f + h.t + h.i + h.cseq +
                      'Via: SIP/2.0/WSS ' + ua.configuration.viaHost + ';branch=z9hG4bK7532300\r\n\r\n');
          expectReply(message, 482);
        });


        it('rejects merged non-INVITE requests', function () {
          message = p(h.ni_request + h.f + h.t + h.i + h.v + h.cseq + '\r\n');
          spyOn(message, 'reply');
          ua.transactions.ist[message.via_branch] = new SIP.Transactions.NonInviteServerTransaction(message, ua);
          message = p(h.ni_request + h.f + h.t + h.i + h.cseq +
                      'Via: SIP/2.0/WSS ' + ua.configuration.viaHost + ';branch=z9hG4bK7532300\r\n\r\n');
          expectReply(message, 482);
        });

        it('rejects very different matching non-INVITE requests', function () {
          message = p(h.ni_request +
                      'From: "Hello World" <sip:hello@example.org;param=foo>;tag=123abc\r\n' +
                      'To: "Goodnight Moon" <sip:moon@example.co.uk;bar=baz>\r\n' +
                      'Via: SIP/2.0/WSS ' + ua.configuration.viaHost + ';branch=z9hG4bK7532302\r\n' +
                      h.i + 'CSeq: 128102 INVITE\r\n\r\n');
          spyOn(message, 'reply');
          ua.transactions.ist[message.via_branch] = new SIP.Transactions.NonInviteServerTransaction(message, ua);
          message = p(h.ni_request + h.f + h.t + h.i + h.cseq +
                      'Via: SIP/2.0/WSS ' + ua.configuration.viaHost + ';branch=z9hG4bK7532300\r\n\r\n');
          expectReply(message, 482);
        });
      });
    });

  });

  describe('for IncomingResponses', function () {

    describe('rfc3261 check', function () {

      describe('8.1.3.3', function () {
        it('drops messages with two vias', function () {
          message = p(h.response + h.f + h.t + h.i + h.v + h.v + h.cseq + '\r\n');
          expectDropped(message);

          message = p(h.response + h.f + h.t + h.i + h.via + h.v + h.cseq + '\r\n');
          expectDropped(message);

          message = p(h.response + h.f + h.t + h.i + h.via + h.via + h.cseq + '\r\n');
          expectDropped(message);
        });
      });

      describe('18.1.2', function () {
        it('drops messages with inappropriate via sent-by host', function () {
          message = p(h.response + h.f + h.t + h.i + h.cseq +
                      'Via: SIP/2.0/WSS MYHOST;branch=z9hG4bK7532297\r\n\r\n');
          expectDropped(message);
        });

        it('drops messages with inappropriate via sent-by port', function () {
          message = p(h.response + h.f + h.t + h.i + h.cseq +
                      'Via: SIP/2.0/WSS ' + ua.configuration.viaHost + ':8888;branch=z9hG4bK7532297\r\n\r\n');
          expectDropped(message);
        });

        it('accepts messages with correct via sent-by host', function () {
          message = p(h.response + h.f + h.t + h.i + h.cseq +
                      'Via: SIP/2.0/WSS ' + ua.configuration.viaHost + ';branch=z9hG4bK7532297\r\n\r\n');
          expectOkay(message);
        });
      });

      describe('18.3_response', function () {
        it('drops messages that are too short', function () {
          message = p(h.response + h.f + h.t + h.i + h.v + h.cseq +
                      'Content-Length: 1000\r\n\r\n12345\r\n\r\n');
          expectDropped(message);
        });

        it('accepts messages with no Content-Length', function () {
          message = p(h.response + h.f + h.t + h.i + h.v + h.cseq +
                      '\r\n\r\n12345\r\n\r\n');
          expectOkay(message);
        });

        it('truncates messages that are too long', function () {
          message = p(h.response + h.f + h.t + h.i + h.v + h.cseq +
                      'Content-Length: 3\r\n\r\n12345\r\n\r\n');
          expectOkay(message);
        });
      });
    });

  });
});
