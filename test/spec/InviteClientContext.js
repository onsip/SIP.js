/*
 * Tests for the UAC-side of the SIP.Session API, including
 * testing that UAC Sessions pass ClientContext specs.
 */
describe('An INVITE sent from a UAC', function () {

  beforeEach(function (done) {
    this.ua_config = {
      register: false,
      sessionDescriptionHandlerFactory: rpsMediaHandlerFactory
    };

    this.session_options = {
      sessionDescriptionHandlerOptions: {
        gesture: 'rock'
      }
    };

    this.ua = new SIP.UA(this.ua_config).once('connected', function () {
      this.session = this.ua.invite('alice@example.com', this.session_options);
      setTimeout(done, 0);
    }.bind(this));
  });

  afterEach(function (done) {
    this.session.close();

    if (this.ua.isConnected()) {
      this.ua.once('disconnected', function () {
        done();
      }).stop();
    } else {
      done();
    }
  });

  /**
   *
   * Initial behavior tests
   *
   */
  it('inits instance attributes', function () {
    expect(this.session.ua).toBe(this.ua);
    expect(this.session.method).toBe(SIP.C.INVITE);

    expect(this.session.request).toBeDefined();
    expect(this.session.request instanceof SIP.OutgoingRequest).toBe(true);

    expect(this.session.localIdentity).toBeDefined();
    expect(this.session.localIdentity instanceof SIP.NameAddrHeader).toBe(true);
    expect(this.session.localIdentity.hasParam('tag')).toBe(true);
    expect(this.session.localIdentity.toString()).toMatch(/<sip:anonymous\.(.){6}@anonymous.invalid>;tag=/);

    expect(this.session.remoteIdentity).toBeDefined();
    expect(this.session.remoteIdentity instanceof SIP.NameAddrHeader).toBe(true);
    expect(this.session.remoteIdentity.hasParam('tag')).toBe(false);
    expect(this.session.remoteIdentity.toString()).toBe('<sip:alice@example.com>');

    expect(this.session.data).toEqual({});
  });

  it('has a custom .data attribute', function () {
    expect(this.session.data).toEqual({});
  });

  // FIXME - This test probably has an invalid scope.
  xit('sends an INVITE on the WebSocket', function (done) {
    // HACK: IF THIS BREAKS, CHANGE THE NUMBER: this is sketchy
    setTimeout(function() {
      expect(this.ua.transport.ws.send).toHaveBeenCalled();
      expect(this.ua.transport.ws.send.calls.mostRecent().args[0]).
        toMatch('INVITE sip:alice@example.com SIP/2.0\r\n');
      expect(this.session.status).toBe(SIP.Session.C.STATUS_INVITE_SENT);
      done();
    }, 200);
  });

  it('has no dialogs at first', function () {
    expect(this.session.dialog).toBeNull();
    expect(this.session.earlyDialogs).toEqual({});
  });

  /**
   *
   * RFC 3261 rules for valid requests.
   *
   */
  describe('following RFC3261 request generation rules (8.1.1)', function () {

    it('contains minimum header fields', function () {
      expect(this.session.request.hasHeader('to')).toBe(true);
      expect(this.session.request.hasHeader('from')).toBe(true);
      expect(this.session.request.hasHeader('cseq')).toBe(true);
      expect(this.session.request.hasHeader('call-id')).toBe(true);
      expect(this.session.request.hasHeader('max-forwards')).toBe(true);
      expect(this.session.request.hasHeader('via')).toBe(true);
    });

    it('sets the Request-URI to the To URI', function () {
      // See also - preloaded route set.
      expect(this.session.request.getHeader('to')).toBe("<" + this.session.request.ruri.toString() + ">");
    });

    it('sets the To URI from the given target', function () {
      expect(this.session.request.getHeader('to')).toBe("<sip:alice@example.com>");
    });

    it('must not contain a To tag', function () {
      expect(this.session.request.getHeader('to')).not.toContain(';tag');
    });

    it('sets the From URI from the UA', function () {
      expect(this.session.request.getHeader('from')).toContain(this.ua.configuration.displayName);
    });

    it('contains a From tag', function () {
      // See also - 19.3
     expect(this.session.request.getHeader('from')).toContain(';tag');
    });

    xit('generates a new Call-ID', function () { // XXX - WAM - This takes too long and is annoying while I am developing.  Put this back before committing.
      var id = this.session.request.getHeader('call-id');
      var ids = {};
      ids[id] = true;
      for (var i = 1; i < 1000; i++) {
        this.session = this.ua.invite('alice@example.com', this.session_options);

        id = this.session.request.getHeader('call-id');
        expect(ids[id]).toBeUndefined();
        ids[id] = true;

        // Clean up
        this.session.close();
      }
    });

    //hard to 'guarantee,' but if there is a problem here then there was almost certainly a mistake added to the code.
    xit('guarantees no other UA will inadvertently overlap Call-IDs', function () {
      var id = this.ua.configuration.sipjsId;
      var ids = {};
      ids[id] = true;

      for (var i = 1; i < 10; i++) {
        this.ua = new SIP.UA(this.ua_config);
        id = this.ua.configuration.sipjsId;
        expect(ids[id]).toBeUndefined();
        ids[id] = true;

        this.ua.stop();
      }
    });

    it('generates a valid CSeq', function () {
      var cseq = parseInt(this.session.request.getHeader('cseq').substring(0, this.session.request.getHeader('cseq').indexOf(' ')));
      expect(cseq).toBeLessThan(Math.pow(2,31));
      expect(cseq).toBeGreaterThan(0);
    });

    it('sets the Max-Forwards to 70', function () {
      expect(parseInt(this.session.request.getHeader('max-forwards'))).toBe(70);
    });

    describe('the Via header', function () {
      beforeEach(function (done) {
        if (this.ua.transport.ws.send.calls.mostRecent()) {
          done();
        } else {
          this.ua.transport.ws.send.and.callFake(function () {
            setTimeout(done, 0);
          });
        }
      });

      it('uses SIP/2.0', function () {
        var via = SIP.Parser.parseMessage(this.ua.transport.ws.send.calls.mostRecent().args[0], this.ua).getHeader('via');
        expect(via).toContain('SIP/2.0');
      });

      it('has a branch parameter', function () {
        var via = SIP.Parser.parseMessage(this.ua.transport.ws.send.calls.mostRecent().args[0], this.ua).getHeader('via');
        expect(via).toContain(';branch');
      });
    });

    it('has a Contact with one valid SIP URI', function () {
      var sip = this.session.request.getHeader('contact').indexOf('sip:') + 3;
      expect(sip).not.toBe(2);
      expect(this.session.request.getHeader('contact').indexOf('sip:', sip)).toBe(-1);
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
   *
   * 1xx Response texts (Progress)
   *
   */
  describe('when receiving a 1xx response', function () {
    beforeEach(function(done) {
      var session = this.session;
      var response = SIPHelper.createResponse(session.request, 180);

      spyOn(session, 'emit').and.callThrough();
      spyOn(this.ua.transport, 'send').and.callFake(function () {
        setTimeout(function () {
          session.receiveResponse(response);
          done();
        }, 0);

        return true;
      });
    });

    it('fires the `progress` event', function () {
      expect(this.session.emit.calls.mostRecent().args[0]).toBe('progress');
    });
  });

  /**
   *
   * 2xx Response texts (Accepted)
   *
   */
  describe('when receiving a 2xx response', function () {
    beforeEach(function(done) {
      var session = this.session;
      var response = SIPHelper.createResponse(session.request, 200, 'OK', 'paper');
      spyOn(session, 'emit').and.callThrough();
      spyOn(this.ua.transport, 'send').and.callFake(function () {
        setTimeout(function () {
          session.receiveResponse(response);
          done();
        }, 0);

        return true;
      });
    });

    // FIXME - this will fire asynchronously after a setDescription
    xit('fires the `accepted` event', function () {
      expect(this.session.accepted).toHaveBeenCalled();
    });

    // FIXME - also asynchronous
    xit('sends an ACK', function () {
      expect(this.ua.transport.ws.send.calls.mostRecent().args[0]).toContain('ACK');
    });
  });

  /**
   *
   * [3-6]xx Response texts (Rejected/Redirected/Failure)
   *
   */
  describe('when receiving a 3xx-6xx response', function () {
    beforeEach(function() {
      var session = this.session;
      var response = SIPHelper.createResponse(session.request, 603);
      spyOn(this.session, 'rejected');
      spyOn(this.ua.transport, 'send').and.callFake(function () {
        setTimeout(function () {
          session.receiveResponse(response);
          done();
        }, 0);

        return true;
      });
    });

    // FIXME - Asynchronous?
    xit('fires the `rejected` event', function () {
      expect(this.session.rejected).toHaveBeenCalled();
    });

    // FIXME - Asynchronous?
    xit('sends an ACK', function () {
      expect(this.ua.transport.ws.send.calls.mostRecent().args[0]).toContain('ACK');
    });
  });


  /**
   *
   * Termination events
   *
   */
  describe('when terminated', function () {

    var cancelSpy, failedSpy, rejectedSpy, terminatedSpy, byeSpy;

    beforeEach(function (done) {
      cancelSpy = jasmine.createSpy('cancel');
      this.session.on('cancel', cancelSpy);

      failedSpy = jasmine.createSpy('failed');
      this.session.on('failed', failedSpy);

      rejectedSpy = jasmine.createSpy('rejected');
      this.session.on('rejected', rejectedSpy);

      terminatedSpy = jasmine.createSpy('terminated');
      this.session.on('terminated', terminatedSpy);

      byeSpy = jasmine.createSpy('bye');
      this.session.on('bye', byeSpy);

      spyOn(this.ua.transport, 'send').and.callFake(function () {
        setTimeout(done, 0);
        return true;
      });
    });

    /* Before acceptance. */
    describe('before it has been accepted', function () {

      /* All rejection responses should fire these events. */
      function rejectResponseTests() {
        it('fires a `rejected` event', function () {
          expect(failedSpy).toHaveBeenCalled();
        });

        it('fires a `failed` event', function () {
          expect(rejectedSpy).toHaveBeenCalled();
        });

        it('fires a `terminated` event', function () {
          expect(terminatedSpy).toHaveBeenCalled();
        });
      }

      describe('by a [3-6]xx response', function () {

        function testWith(status_code) {
          describe('(' + status_code + ')', function () {
            beforeEach(function () {
              var response = SIPHelper.createResponse(this.session.request, status_code);
              this.session.receiveResponse(response);
            });
            rejectResponseTests();
          });
        }

        testWith(300);
        testWith(302);
        testWith(400);
        testWith(404);
        testWith(500);
        testWith(503);
        testWith(600);
        testWith(603);
      });


      describe('by a system error', function () {

        function testWith(method, args) {
          describe('(' + method + ')', function () {
            beforeEach(function () {
              this.session[method].apply(this.session, args);
            });

            it('fires a `failed` event', function () {
              expect(failedSpy).toHaveBeenCalled();
            });

            it('fires a `terminated` event', function () {
              expect(terminatedSpy).toHaveBeenCalled();
            });

            it('does not fire a `rejected` event', function () {
              expect(rejectedSpy).not.toHaveBeenCalled();
            });
          });
        }

        //testWith('onTransportError');
        testWith('onRequestTimeout');
        testWith('onDialogError');
      });

      describe('using the `cancel` method', function () {

        beforeEach(function () {
          this.session.cancel();
        });

        it('fires a `cancel` event', function () {
          expect(cancelSpy).toHaveBeenCalled();
        });

        it('does not immediately fire `rejected`', function () {
          expect(rejectedSpy).not.toHaveBeenCalled();
        });

        it('does not immediately fire `failed`', function () {
          expect(failedSpy).not.toHaveBeenCalled();
        });

        it('does not immediately fire `terminated`', function () {
          expect(terminatedSpy).not.toHaveBeenCalled();
        });

        describe('after receiving a 487', function () {
          beforeEach(function () {
            var response = SIPHelper.createResponse(this.session.request, 487);
            this.session.receiveResponse(response);
          });
          rejectResponseTests();
        });
      });

      describe('using the `terminate` method', function () {
        beforeEach(function () {
          this.session.terminate();
        });

        it('uses `cancel`', function () {
          expect(cancelSpy).toHaveBeenCalled();
          expect(byeSpy).not.toHaveBeenCalled();
        });

        it('does not fire `terminated` on its own', function () {
          expect(terminatedSpy).not.toHaveBeenCalled();
        });
      });
    });

    /* After acceptance. */
    describe('after it has been accepted', function () {

      beforeEach(function (done) {
        var response = SIPHelper.createResponse(this.session.request, 200, 'OK', 'paper');
        this.session.on('accepted', function () {
          setTimeout(done, 0);
        }).receiveResponse(response);
      });

      it('cannot be canceled', function () {
        expect(function () {
          this.session.cancel();
        }.bind(this)).toThrow();
        expect(cancelSpy).not.toHaveBeenCalled();
      });

      describe('by a BYE request', function () {
        beforeEach(function () {
          var byeRequest = new SIP.IncomingRequest(this.session.ua);
          byeRequest.method = 'BYE';
          spyOn(byeRequest, 'reply');
          this.session.receiveRequest(byeRequest);
        });

        it('fires a `bye` event', function () {
          expect(byeSpy).toHaveBeenCalled();
        });

        it('fires a `terminated` event', function () {
          expect(terminatedSpy).toHaveBeenCalled();
        });

        it('does not fire a `rejected` or `failed` event', function () {
          expect(rejectedSpy).not.toHaveBeenCalled();
          expect(failedSpy).not.toHaveBeenCalled();
        });
      });

      describe('using the `bye` method', function () {
        beforeEach(function () {
          spyOn(SIP.RequestSender.prototype, 'send');
          this.session.bye();
        });

        it('fires a `bye` event', function () {
          expect(byeSpy).toHaveBeenCalled();
        });

        it('fires a `terminated` event', function () {
          expect(terminatedSpy).toHaveBeenCalled();
        });

        it('does not fire a `rejected` or `failed` event', function () {
          expect(rejectedSpy).not.toHaveBeenCalled();
          expect(failedSpy).not.toHaveBeenCalled();
        });

      });

      // FIXME - WAM - I'm not sure when this would happen.
      describe('by a system failure', function () {
        xit('fires a `bye` event', function () {

        });

        xit('sends a BYE with a reason', function () {

        });

        xit('fires a `terminated` event', function () {

        });

        xit('does not fire a `rejected` or `failed` event', function () {

        });
      });

      describe('using the `terminated` method', function () {
        beforeEach(function () {
          spyOn(SIP.RequestSender.prototype, 'send');
          this.session.terminate();
        });

        it('uses `bye`', function () {
          expect(byeSpy).toHaveBeenCalled();
          expect(cancelSpy).not.toHaveBeenCalled();
        });

        it('fires `terminated` synchronously with the bye', function () {
          expect(terminatedSpy).toHaveBeenCalled();
        });

        it('does not fire the `failed` event', function () {
          expect(failedSpy).not.toHaveBeenCalled();
        });
      });
    });

  });

});
