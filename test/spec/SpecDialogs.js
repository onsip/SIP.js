describe('Dialogs', function() {
  var owner;
  var message;
  var Dialog;

  beforeEach(function() {
    var ua = new SIP.UA({
      uri: 'alice@example.com',
      wsServers: 'ws:server.example.com',
      sessionDescriptionHandlerFactory: function() {
        return {
          getDescription: function () { return Promise.resolve('foo'); },
          hasDescription: function (contentType) {
            return contentType === 'application/sdp';
          },
          setDescription: function () { return Promise.resolve(); },
          close: function() { return true; }
        };
      }
    });
    ua.transport = jasmine.createSpyObj('transport', ['connect', 'disconnect', 'send', 'on', 'removeListener']);
    ua.transport.connect.and.returnValue(Promise.resolve());
    ua.transport.disconnect.and.returnValue(Promise.resolve());
    ua.transport.send.and.returnValue(Promise.resolve());
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
      ''].join('\r\n'), ua);
    spyOn(message, 'reply');

    message.transport = ua.transport;

    owner = new SIP.InviteServerContext(ua, message);

    Dialog = new SIP.Dialog(owner, message, 'UAS');
  });

  afterEach(function() {
    Dialog.owner.ua.stop();
  });

  it('sets the *PendingReply properties', function() {
    expect(Dialog.uacPendingReply).toBe(false);
    expect(Dialog.uasPendingReply).toBe(false);
  });

  it('returns an error if the message has no contact header', function() {
    var mes = SIP.Parser.parseMessage([
      'INVITE sip:gled5gsn@hk95bautgaa7.invalid;transport=ws;aor=james%40onsnip.onsip.com SIP/2.0',
      'Max-Forwards: 65',
      'To: <sip:james@onsnip.onsip.com>',
      'From: "test1" <sip:test1@onsnip.onsip.com>;tag=rto5ib4052',
      'Call-ID: grj0liun879lfj35evfq',
      'CSeq: 1798 INVITE',
      'Allow: ACK,CANCEL,BYE,OPTIONS,INVITE,MESSAGE',
      'Content-Type: application/sdp',
      'Supported: outbound',
      'User-Agent: SIP.js 0.5.0-devel',
      'Content-Length: 11',
      '',
      'a=sendrecv',
      ''].join('\r\n'), owner.ua);

    mes.transport = owner.ua.transport;

    expect(function () {new SIP.Dialog(owner, mes, 'UAS');}).toThrowError('unable to create a Dialog without Contact header field');
  });

  it('sets the state correctly', function() {
    var resp = SIP.Parser.parseMessage([
      'SIP/2.0 200 OK',
      'To: <sip:james@onsnip.onsip.com>;tag=1ma2ki9411',
      'From: "test1" <sip:test1@onsnip.onsip.com>;tag=58312p20s2',
      'Call-ID: upfrf7jpeb3rmc0gnnq1',
      'CSeq: 9059 INVITE',
      'Contact: <sip:gusgt9j8@vk3dj582vbu9.invalid;transport=ws>',
      'Contact: <sip:gusgt9j8@vk3dj582vbu9.invalid;transport=ws>',
      'Supported: outbound',
      'Content-Type: application/sdp',
      'Content-Length: 11',
      '',
      'a= sendrecv',
      ''].join('\r\n'), owner.ua);

    resp.transport = owner.ua.transport;

    expect(Dialog.state).toBe(2);

    Dialog = new SIP.Dialog(owner, message, 'UAS', 3);
    expect(Dialog.state).toBe(3);

    Dialog = new SIP.Dialog(owner, resp, 'UAS');
    expect(Dialog.state).toBe(2);

    resp.statusCode = 183;
    resp.type = 7; // IncomingResponse
    Dialog = new SIP.Dialog(owner, resp, 'UAS');
    expect(Dialog.state).toBe(1);
  });

  it('sets all settings for UAS', function() {
    expect(Dialog.id.callId).toBe(message.callId);
    expect(Dialog.id.localTag).toBe(message.toTag);
    expect(Dialog.id.remoteTag).toBe(message.fromTag);
    expect(Dialog.id.toString()).toBe(message.callId + message.toTag + message.fromTag);

    expect(Dialog.state).toBe(2);
    expect(Dialog.remoteSeqnum).toBe(message.cseq);
    expect(Dialog.localUri).toBe(message.parseHeader('to').uri);
    expect(Dialog.remoteUri).toBe(message.parseHeader('from').uri);
    expect(Dialog.remoteTarget).toBe(message.parseHeader('contact').uri);
    expect(Dialog.routeSet).toEqual(message.getHeaders('record-route'));
    expect(Dialog.inviteSeqnum).toBe(message.cseq);
    expect(Dialog.localSeqnum).toBe(message.cseq);
  });

  it('sets all settings for UAC', function() {
    Dialog = new SIP.Dialog(owner, message, 'UAC');

    expect(Dialog.id.callId).toBe(message.callId);
    expect(Dialog.id.localTag).toBe(message.fromTag);
    expect(Dialog.id.remoteTag).toBe(message.toTag);
    expect(Dialog.id.toString()).toBe(message.callId + message.fromTag + message.toTag);

    expect(Dialog.state).toBe(2);
    expect(Dialog.inviteSeqnum).toBe(message.cseq);
    expect(Dialog.localSeqnum).toBe(message.cseq);
    expect(Dialog.localUri).toBe(message.parseHeader('from').uri);
    expect(Dialog.pracked).toEqual([]);
    expect(Dialog.remoteUri).toBe(message.parseHeader('to').uri);
    expect(Dialog.remoteTarget).toBe(message.parseHeader('contact').uri);
    expect(Dialog.routeSet).toEqual(message.getHeaders('record-route').reverse());

    expect(Dialog.sessionDescriptionHandler).toBeUndefined();

    owner.hasOffer = false;
    Dialog = new SIP.Dialog(owner, message, 'UAC', 1);
  });

  xit('uses the sessionDescriptionHandlerFactory of its owner session', function () {
    // acts like a constructor that doesn't need 'new'
    function sessionDescriptionHandlerConstructor () {
      return Object.create(sessionDescriptionHandlerConstructor.prototype);
    };
    owner.sessionDescriptionHandlerFactory = sessionDescriptionHandlerConstructor;
    owner.hasOffer = false;
    Dialog = new SIP.Dialog(owner, message, 'UAC', 1);
    expect(Dialog.sessionDescriptionHandler instanceof sessionDescriptionHandlerConstructor).toBe(true);
  });

  it('sets logger, owner, dialogs array, and logs', function() {
    var logger = owner.ua.getLogger('sip.dialog', Dialog.id.toString());

    spyOn(logger, 'log');

    Dialog = new SIP.Dialog(owner, message, 'UAS');

    expect(Dialog.logger).toBe(owner.ua.getLogger('sip.dialog', Dialog.id.toString()));
    expect(Dialog.owner).toBe(owner);
    expect(owner.ua.dialogs[Dialog.id.toString()]).toBe(Dialog);
    expect(logger.log).toHaveBeenCalledWith('new UAS dialog created with status CONFIRMED');
  });

  describe('.update', function() {

    it('sets the state to CONFIRMED and logs, doesn\'t set route set', function() {
      spyOn(Dialog.logger, 'log');

      message.setHeader('record-route', ['stuff1', 'stuff2']);

      Dialog.state = 1;
      Dialog.update(message, 'UAS');

      expect(Dialog.state).toBe(2);
      expect(Dialog.logger.log).toHaveBeenCalledWith('dialog ' + Dialog.id.toString() + '  changed to CONFIRMED state');

      expect(Dialog.routeSet).toEqual([]);
    });

    it('sets the state to CONFIRMED and logs, sets route set', function() {
      spyOn(Dialog.logger, 'log');

      expect(Dialog.routeSet).toEqual([]);

      message.setHeader('record-route', ['stuff1', 'stuff2']);

      Dialog.state = 1;
      Dialog.update(message, 'UAC');

      expect(Dialog.state).toBe(2);
      expect(Dialog.logger.log).toHaveBeenCalledWith('dialog ' + Dialog.id.toString() + '  changed to CONFIRMED state');

      expect(Dialog.routeSet).toEqual([['stuff1', 'stuff2']]);
    });
  });

  describe('.terminate', function() {
    it('logs, and deletes the dialog from the ua dialogs array', function() {
      spyOn(Dialog.logger, 'log');
      expect(owner.ua.dialogs[Dialog.id.toString()]).toBeDefined();

      Dialog.terminate();

      expect(Dialog.logger.log).toHaveBeenCalledWith('dialog ' + Dialog.id.toString() + ' deleted');

      expect(owner.ua.dialogs[Dialog.id.toString()]).toBeUndefined();
    });

    it('calls sessionDescriptionHandler.close if the dialog was in the EARLY state and there is an sessionDescriptionHandler', function() {
      owner.hasOffer = false;
      Dialog = new SIP.Dialog(owner, message, 'UAC', 1);
      Dialog.sessionDescriptionHandler = {
        close: jasmine.createSpy('close')
      };

      Dialog.terminate();

      expect(Dialog.sessionDescriptionHandler.close).toHaveBeenCalled();
    });
  });

  describe('.createRequest', function() {
    it('returns a request with proper settings, doesn\'t increment localSeqnum', function() {
      var method = SIP.C.ACK;

      expect(Dialog.createRequest(method, undefined, undefined).dialog).toEqual(Dialog);
      expect(Dialog.inviteSeqnum).toBe(Dialog.localSeqnum);
    });

    it('returns a request with proper settings, increments localSeqnum', function() {
      var method = SIP.C.INVITE;

      expect(Dialog.createRequest(method, undefined, undefined).dialog).toEqual(Dialog);
      expect(Dialog.inviteSeqnum).toBe(Dialog.localSeqnum - 1);
    });
  });

  describe('.checkInDialogRequest', function() {
    var request;

    beforeEach(function() {
      request = new SIP.OutgoingRequest('INVITE', 'bob@example.com', owner.ua, {from: 'abcdefg'}, ['Contact: ' + owner.contact, 'Allow: ' + SIP.UA.C.ALLOWED_METHODS.toString()]);

      request.transaction = {on: jasmine.createSpy('on')};
      request.reply = jasmine.createSpy('reply');

      Dialog.remoteSeqnum = 5;
    });

    it('sets the remoteSeqnum if there is not one on the Dialog', function() {
      Dialog.remoteSeqnum = undefined;

      Dialog.checkInDialogRequest(request);

      expect(Dialog.remoteSeqnum).toBe(request.cseq);
    });

    it('replies 500 to a non-ACK request where the request cseq is less than the Dialog cseq', function() {
      request.cseq = 1;

      Dialog.checkInDialogRequest(request);

      expect(request.reply).toHaveBeenCalledWith(500);
    });

    it('returns true if the request method is ACK, the remote seqnum is less than the request cseq, but the request cseq is equal to the invite seqnum', function() {
      Dialog.inviteSeqnum = 1;
      request.cseq = 1;

      expect(Dialog.checkInDialogRequest(request)).toBe(true);
    });

    it('returns false the remote seqnum is less than the request cseq, the method is ACK,and the request cseq is not equal to the invite seqnum', function() {
      Dialog.inviteSeqnum = 2;
      request.cseq = 1;

      expect(Dialog.checkInDialogRequest(request)).toBe(false);
    });

    it('sets the remote seqnum to the request cseq if it is initally less', function() {
      request.cseq = 7;

      Dialog.checkInDialogRequest(request);

      expect(Dialog.remoteSeqnum).toBe(7);
    })

    it('replies 491 if the request method is INVITE and uacPendingReply is true', function() {
      Dialog.uacPendingReply = true;

      Dialog.checkInDialogRequest(request);

      expect(request.reply).toHaveBeenCalledWith(491);
    });

    it('replies 500 and returns false if the request method is INVITE and uacPendingReply is true', function() {
      Dialog.uasPendingReply = true;

      expect(Dialog.checkInDialogRequest(request)).toBe(false);

      expect(request.reply.calls.mostRecent().args[0]).toBe(500);
    });

    it('returns true and calls transaction.on once if neither of the *PendingReply properties are true, the request method is INVITE, and the request does not have a contact header', function() {
      expect(Dialog.uacPendingReply).toBe(false);
      expect(Dialog.uasPendingReply).toBe(false);

      spyOn(request, 'hasHeader').and.returnValue(false);

      expect(Dialog.checkInDialogRequest(request)).toBe(true);

      expect(request.transaction.on).toHaveBeenCalled();
      expect(request.transaction.on.calls.count()).toBe(1);
    });

    it('returns true and calls transaction.on twice if neither of the *PendingReply properties are true, the request method is INVITE, and the request has have a contact header', function() {
      expect(Dialog.uacPendingReply).toBe(false);
      expect(Dialog.uasPendingReply).toBe(false);

      expect(Dialog.checkInDialogRequest(request)).toBe(true);

      expect(request.transaction.on).toHaveBeenCalled();
      expect(request.transaction.on.calls.count()).toBe(2);
    });

    it('returns true and calls transaction.on once if the request method is NOTIFY and the request has a contact header', function() {
      request.method = SIP.C.NOTIFY;

      expect(Dialog.checkInDialogRequest(request)).toBe(true);

      expect(request.transaction.on).toHaveBeenCalled();
      expect(request.transaction.on.calls.count()).toBe(1);
    });
  });

  describe('.sendRequest', function() {
    xit('calls requestsender.send', function() {
      //Dialog.sendRequest(owner, SIP.C.INVITE);
      //no good way to test;
    });
  });

  describe('.receiveRequest', function() {
    var request;

    beforeEach(function() {
      request = new SIP.OutgoingRequest('INVITE', 'bob@example.com', owner.ua, {from: 'abcdefg'}, ['Contact: ' + owner.contact, 'Allow: ' + SIP.UA.C.ALLOWED_METHODS.toString()]);

      spyOn(owner, 'receiveRequest');
    });

    it('does not call owner.receiveRequest if checkInDialogRequest returns false', function() {
      spyOn(Dialog, 'checkInDialogRequest').and.returnValue(false);

      Dialog.receiveRequest(request);

      expect(owner.receiveRequest).not.toHaveBeenCalled();
    });

    it('calls owner.receiveRequest if checkInDialogRequest returns false', function() {
      spyOn(Dialog, 'checkInDialogRequest').and.returnValue(true);

      Dialog.receiveRequest(request);

      expect(owner.receiveRequest).toHaveBeenCalled();
    });
  });
});
