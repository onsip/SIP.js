/*
 * Tests for the public API of SIP.Session, including
 * testing that UAC Sessions and UAS sessions pass
 * Client/ServerContext specs.
 */
describe('An INVITE sent from a UAC', function () {
  var ua, session;

  beforeEach(function () {
    runs(function () {
      ua = new SIP.UA().start().on('connected', function () {
        session = ua.invite('alice@example.com');
      });
    });
    waitsFor(function () {
      return session;
    }, "The Session was never created", 100);
  });

  afterEach(function () {
    session = undefined;
  });

  it('inits ClientContext events', function () {
    runs(function () {
      expect(session.checkEvent('progress')).toBe(true);
      expect(session.checkEvent('accepted')).toBe(true);
      expect(session.checkEvent('rejected')).toBe(true);
      expect(session.checkEvent('failed')).toBe(true);
    });
  });

  it('inits Session events', function () {
    runs(function () {
      expect(session.checkEvent('connecting')).toBe(true);
      expect(session.checkEvent('canceled')).toBe(true);
      expect(session.checkEvent('referred')).toBe(true);
      expect(session.checkEvent('dtmf')).toBe(true);
      expect(session.checkEvent('bye')).toBe(true);
    });
  });

  it('inits instance attributes', function () {
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
    runs(function () {
      expect(session.data).toEqual({});
    });
  });

  xit('has status STATUS_INVITE_SENT', function () {
    runs(function () {
      expect(session.status).toBe(SIP.Session.C.STATUS_INVITE_SENT);
    });
  });

});