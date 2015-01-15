/*
 * Tests for the UAS-side of the SIP.Session API, including
 * testing that UAS Sessions pass ServerContext specs.
 */
describe('A UAS receiving an INVITE', function () {
  var ua, session, ua_config;

  /**
   *
   * Invite w/o SDP
   *
   */
  describe('without SDP', function () {
    it('creates an invite server context with the UA\'s mediaHandlerFactory, the ISC emits invite', function () {
      ua_config = {
        uri: 'alice@example.com',
        register: false,
        mediaHandlerFactory: function () {
          return {
            getDescription: function () {},
            setDescription: function () {}
          };
        }
      };

      spyOn(ua_config, 'mediaHandlerFactory').and.callThrough();
      spyOn(SIP, 'InviteServerContext').and.callThrough();
      var callback = jasmine.createSpy('callback');

      jasmine.clock().install();

      ua = new SIP.UA(ua_config).once('connected', function () {
        ws = ua.transport.ws;
        ws.receiveMessage(Messages.Invite.nosdp);
      }).once('invite', callback);

      jasmine.clock().tick(100);

      expect(SIP.InviteServerContext).toHaveBeenCalled();
      expect(ua_config.mediaHandlerFactory).toHaveBeenCalled();
      expect(callback).toHaveBeenCalled();

      jasmine.clock().uninstall();
    });
  });

  /**
   *
   * 100rel
   *
   */
  describe('with 100rel unsupported', function () {
    beforeEach(function (done) {
      ua_config = {
        uri: 'alice@example.com',
        register: false
      };

      ua = new SIP.UA(ua_config).once('connected', function () {
        ua.transport.ws.receiveMessage(Messages.Invite.normal);
      }).once('invite', function (s) {
        session = s;
        setTimeout(done, 0);
      });
    });

    describe('sending a progress response', function () {
      it('sends 100 unreliably with no body', function () {
        ua.transport.ws.send.and.callFake(function () {
          var packet = ua.transport.ws.send.calls.mostRecent().args[0];
          expect(packet).toMatch('SIP/2.0 100 Trying');
          expect(packet).not.toMatch(/Require *:[^\r]*100rel/);
          expect(packet).toMatch('Content-Length: 0\r\n');
        });

        ua.transport.ws.send.calls.reset();
        session.progress({ statusCode: 100 });
      });

      it('sends 1xx unreliably with no body', function () {
        ua.transport.ws.send.and.callFake(function () {
          var packet = ua.transport.ws.send.calls.mostRecent().args[0];
          expect(packet).toMatch('SIP/2.0 180 Ringing');
          expect(packet).not.toMatch(/Require *:[^\r]*100rel/);
          expect(packet).toMatch('Content-Length: 0\r\n');
        });

        ua.transport.ws.send.calls.reset();
        session.progress({ statusCode: 180 });
      });
    });
  });

  describe('with 100rel supported', function () {
    beforeEach(function (done) {
      ua_config = {
        uri: 'alice@example.com',
        register: false
      };

      ua = new SIP.UA(ua_config).once('connected', function () {
        ua.transport.ws.receiveMessage(Messages.Invite.rel100sup);
      }).once('invite', function (s) {
        session = s;
        setTimeout(done, 0);
      });
    });

    describe('sending a progress response', function () {
      it('sends 100 unreliably with no body', function () {
        ua.transport.ws.send.and.callFake(function () {
          var packet = ua.transport.ws.send.calls.mostRecent().args[0];
          expect(packet).toMatch('SIP/2.0 100 Trying');
          expect(packet).not.toMatch(/Require *:[^\r]*100rel/);
          expect(packet).toMatch('Content-Length: 0\r\n');
        });

        ua.transport.ws.send.calls.reset();
        session.progress({ statusCode: 100 });
      });

      it('sends 1xx unreliably with no body', function () {
        ua.transport.ws.send.and.callFake(function () {
          var packet = ua.transport.ws.send.calls.mostRecent().args[0];
          expect(packet).toMatch('SIP/2.0 183 Session Progress');
          expect(packet).not.toMatch(/Require *:[^\r]*100rel/);
          expect(packet).toMatch('Content-Length: 0\r\n');
        });

        ua.transport.ws.send.calls.reset();
        session.progress({ statusCode: 183 });
      });

      it('sends 1xx reliably with a body, when rel100 specified', function () {
        ua.transport.ws.send.and.callFake(function () {
          var packet = ua.transport.ws.send.calls.mostRecent().args[0];
          expect(packet).toMatch('SIP/2.0 183 Session Progress');
          expect(packet).toMatch(/Require *:[^\r]*100rel/);
          expect(packet).toMatch(/Content-Length: [^0].*\r\n/);
        });

        ua.transport.ws.send.calls.reset();
        session.progress({ statusCode: 183, rel100: true });
      });
    });
  });

  describe('with 100rel required', function () {
    beforeEach(function (done) {
      ua_config = {
        uri: 'alice@example.com',
        register: false
      };

      ua = new SIP.UA(ua_config).once('connected', function () {
        ua.transport.ws.receiveMessage(Messages.Invite.rel100req);
      }).once('invite', function (s) {
        session = s;
        setTimeout(done, 0);
      });
    });

    describe('sending a progress response', function () {
      it('sends 100 unreliably with no body', function () {
        ua.transport.ws.send.and.callFake(function () {
          var packet = ua.transport.ws.send.calls.mostRecent().args[0];
          expect(packet).toMatch('SIP/2.0 100 Trying');
          expect(packet).not.toMatch(/Require *:[^\r]*100rel/);
          expect(packet).toMatch('Content-Length: 0\r\n');
        });

        ua.transport.ws.send.calls.reset();
        session.progress({ statusCode: 100 });
      });

      it('sends 1xx reliably with a body', function () {
        ua.transport.ws.send.and.callFake(function () {
          var packet = ua.transport.ws.send.calls.mostRecent().args[0];
          expect(packet).toMatch('SIP/2.0 180 Ringing');
          expect(packet).toMatch(/Require *:[^\r]*100rel/);
          expect(packet).toMatch(/Content-Length: [^0].*\r\n/);
        });

        ua.transport.ws.send.calls.reset();
        session.progress({ statusCode: 180 });
      });
    });
  });


  /**
   *
   * Invite w/ Replaces
   *
   */
  describe('with a Replaces header', function () {
    describe('matching another dialog', function () {
      describe('with "replaces" supported', function () {
        beforeEach(function (done) {
          ua_config = {
            replaces: SIP.C.supported.SUPPORTED,
            uri: 'alice@example.com',
            register: false
          };

          ua = new SIP.UA(ua_config).once('connected', done);
          ua.on('invite', function (session) {
            session.accept();
          });
        });

        afterEach(function (done) {
          function closeOut() {
            ua.off();
            done();
          }
          if (ua.isConnected()) {
            ua.on('disconnected', closeOut).stop();
          } else {
            closeOut();
          }
        });

        it('emits "replaced" on the replaced session, then terminates it', function (done) {
          ua.dialogs['or1ek18v4gti27r1vt91' + 'dt0sj4e5ek' + 'qviijql90r'] = {
            owner: {
              emit: function (type, arg) {
                // TODO check arg?
                if (type === 'replaced') {
                  this.terminate = done;
                }
              }
            }
          };
          ua.transport.ws.receiveMessage(Messages.Invite.replaces);
        });
      });

      describe('with "replaces" unsupported', function () {
        beforeEach(function (done) {
          ua_config = {
            replaces: SIP.C.supported.UNSUPPORTED,
            uri: 'alice@example.com',
            register: false
          };

          ua = new SIP.UA(ua_config).once('connected', done);
          ua.on('invite', function (session) {
            session.accept();
          });
        });

        afterEach(function (done) {
          function closeOut() {
            ua.off();
            done();
          }
          if (ua.isConnected()) {
            ua.on('disconnected', closeOut).stop();
          } else {
            closeOut();
          }
        });

        it('neither emits "replaced" on the replaced session, nor terminates it', function () {
          ua.dialogs['or1ek18v4gti27r1vt91' + 'dt0sj4e5ek' + 'qviijql90r'] = {
            // https://stackoverflow.com/questions/22049210/how-to-mark-a-jasmine-test-as-failed#comment33440129_22049210
            owner: {
              emit: function (type, arg) {
                // TODO check arg?
                if (type === 'replaced') {
                  expect('').toBe('"replaced" was incorrectly emitted');
                }
              },
              terminate: function () {
                expect('').toBe('"terminate()" was incorrectly called');
              }
            }
          };
          ua.transport.ws.receiveMessage(Messages.Invite.replaces);
        });
      });
    });
  });


  /**
   *
   * Termination events
   *
   */
  describe('that is then terminated', function () {
    it('cannot cancel the request', function () {

    });
      
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

      describe('by a CANCEL from the UAC', function () {
        it('fires a `cancel` event', function () {

        });

        describe('when it sends a 487 response', function () {
          rejectResponseTests();
        });
      });
    });

    describe('after it has been accepted', function () {

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

    });
  });
});
