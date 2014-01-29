xdescribe('Dialogs', function() {
  var owner;
  var message;
  var Dialog;
  var webrtc;

  beforeEach(function() {
    webrtc = SIP.WebRTC.isSupported;
    if(!webrtc) {
      SIP.WebRTC.isSupported = true;
      SIP.WebRTC.RTCPeerConnection = jasmine.createSpy('RTCPeerConnection');
      SIP.WebRTC.RTCPeerConnection.prototype.setRemoteDescription = jasmine.createSpy('setRemoteDescription');
      SIP.WebRTC.RTCPeerConnection.prototype.close = jasmine.createSpy('close');
      SIP.WebRTC.RTCSessionDescription = jasmine.createSpy('RTCSessionDescription');
      SIP.WebRTC.getUserMedia = jasmine.createSpy('getUserMedia');
    }

    var ua = new SIP.UA({uri: 'alice@example.com', ws_servers: 'ws:server.example.com'});
    message = SIP.Parser.parseMessage('INVITE sip:gled5gsn@hk95bautgaa7.invalid;transport=ws;aor=james%40onsnip.onsip.com SIP/2.0\r\nMax-Forwards: 65\r\nTo: <sip:james@onsnip.onsip.com>\r\nFrom: "test1" <sip:test1@onsnip.onsip.com>;tag=rto5ib4052\r\nCall-ID: grj0liun879lfj35evfq\r\nCSeq: 1798 INVITE\r\nContact: <sip:e55r35u3@kgu78r4e1e6j.invalid;transport=ws;ob>\r\nAllow: ACK,CANCEL,BYE,OPTIONS,INVITE,MESSAGE\r\nContent-Type: application/sdp\r\nSupported: outbound\r\nUser-Agent: JsSIP 0.4.0-devel\r\nContent-Length: 11\r\n\r\na=sendrecv\r\n', ua);
    spyOn(message, 'reply');

    owner = new SIP.InviteServerContext(ua, message);

    Dialog = new SIP.Dialog(owner, message, 'UAS');
  });

  afterEach(function() {
    SIP.WebRTC.isSupported = webrtc;
  });

  it('sets the *_pending_reply properties', function() {
    expect(Dialog.uac_pending_reply).toBe(false);
    expect(Dialog.uas_pending_reply).toBe(false);
  });

  it('returns an error if the message has no contact header', function() {
    var mes = SIP.Parser.parseMessage('INVITE sip:gled5gsn@hk95bautgaa7.invalid;transport=ws;aor=james%40onsnip.onsip.com SIP/2.0\r\nMax-Forwards: 65\r\nTo: <sip:james@onsnip.onsip.com>\r\nFrom: "test1" <sip:test1@onsnip.onsip.com>;tag=rto5ib4052\r\nCall-ID: grj0liun879lfj35evfq\r\nCSeq: 1798 INVITE\r\nAllow: ACK,CANCEL,BYE,OPTIONS,INVITE,MESSAGE\r\nContent-Type: application/sdp\r\nSupported: outbound\r\nUser-Agent: JsSIP 0.4.0-devel\r\nContent-Length: 11\r\n\r\na=sendrecv\r\n', owner.ua);

    expect(new SIP.Dialog(owner, mes, 'UAS')).toEqual({error: 'unable to create a Dialog without Contact header field'});
  });

  it('sets the state correctly', function() {
    var resp = SIP.Parser.parseMessage('SIP/2.0 200 OK\r\nTo: <sip:james@onsnip.onsip.com>;tag=1ma2ki9411\r\nFrom: "test1" <sip:test1@onsnip.onsip.com>;tag=58312p20s2\r\nCall-ID: upfrf7jpeb3rmc0gnnq1\r\nCSeq: 9059 INVITE\r\nContact: <sip:gusgt9j8@vk3dj582vbu9.invalid;transport=ws>\r\nContact: <sip:gusgt9j8@vk3dj582vbu9.invalid;transport=ws>\r\nSupported: outbound\r\nContent-Type: application/sdp\r\nContent-Length: 11\r\n\r\na= sendrecv\r\n', owner.ua);

    expect(Dialog.state).toBe(2);

    Dialog = new SIP.Dialog(owner, message, 'UAS', 3);
    expect(Dialog.state).toBe(3);

    Dialog = new SIP.Dialog(owner, resp, 'UAS');
    expect(Dialog.state).toBe(2);

    resp.status_code = 183;
    Dialog = new SIP.Dialog(owner, resp, 'UAS');
    expect(Dialog.state).toBe(1);
  });

  it('sets all settings for UAS', function() {
    expect(Dialog.id.call_id).toBe(message.call_id);
    expect(Dialog.id.local_tag).toBe(message.to_tag);
    expect(Dialog.id.remote_tag).toBe(message.from_tag);
    expect(Dialog.id.toString()).toBe(message.call_id + message.to_tag + message.from_tag);

    expect(Dialog.state).toBe(2);
    expect(Dialog.remote_seqnum).toBe(message.cseq);
    expect(Dialog.local_uri).toBe(message.parseHeader('to').uri);
    expect(Dialog.remote_uri).toBe(message.parseHeader('from').uri);
    expect(Dialog.remote_target).toBe(message.parseHeader('contact').uri);
    expect(Dialog.route_set).toEqual(message.getHeaders('record-route'));
    expect(Dialog.invite_seqnum).toBe(message.cseq);
    expect(Dialog.local_seqnum).toBe(message.cseq);
  });

  it('sets all settings for UAC', function() {
    Dialog = new SIP.Dialog(owner, message, 'UAC');

    expect(Dialog.id.call_id).toBe(message.call_id);
    expect(Dialog.id.local_tag).toBe(message.from_tag);
    expect(Dialog.id.remote_tag).toBe(message.to_tag);
    expect(Dialog.id.toString()).toBe(message.call_id + message.from_tag + message.to_tag);

    expect(Dialog.state).toBe(2);
    expect(Dialog.invite_seqnum).toBe(message.cseq);
    expect(Dialog.local_seqnum).toBe(message.cseq);
    expect(Dialog.local_uri).toBe(message.parseHeader('from').uri);
    expect(Dialog.pracked).toEqual([]);
    expect(Dialog.remote_uri).toBe(message.parseHeader('to').uri);
    expect(Dialog.remote_target).toBe(message.parseHeader('contact').uri);
    expect(Dialog.route_set).toEqual(message.getHeaders('record-route').reverse());

    expect(Dialog.rtcMediaHandler).toBeUndefined();

    owner.request.body = null;
    Dialog = new SIP.Dialog(owner, message, 'UAC', 1);

    expect(Dialog.rtcMediaHandler).toBeDefined();
  });

  it('sets logger, owner, dialogs array, and logs', function() {
    var logger = owner.ua.getLogger('sip.dialog', this.id.toString());

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

      expect(Dialog.route_set).toEqual([]);
    });

    it('sets the state to CONFIRMED and logs, sets route set', function() {
      spyOn(Dialog.logger, 'log');

      expect(Dialog.route_set).toEqual([]);

      message.setHeader('record-route', ['stuff1', 'stuff2']);

      Dialog.state = 1;
      Dialog.update(message, 'UAC');

      expect(Dialog.state).toBe(2);
      expect(Dialog.logger.log).toHaveBeenCalledWith('dialog ' + Dialog.id.toString() + '  changed to CONFIRMED state');

      expect(Dialog.route_set).toEqual([['stuff1', 'stuff2']]);
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

    it('calls peerConnection.close if the dialog was in the EARLY state and there is an rtcMediaHandler', function() {
      owner.request.body = null;
      Dialog = new SIP.Dialog(owner, message, 'UAC', 1);

      if(webrtc) {
        spyOn(Dialog.rtcMediaHandler.peerConnection, 'close');
      }

      Dialog.terminate();

      expect(Dialog.rtcMediaHandler.peerConnection.close).toHaveBeenCalled();
    });
  });

  describe('.createRequest', function() {
    beforeEach(function() {
      spyOn(SIP, 'OutgoingRequest').andReturn({made: 'successful'});
    });

    it('returns a request with proper settings, doesn\'t increment local_seqnum', function() {
      var method = SIP.C.ACK;

      expect(Dialog.createRequest(method, null, null)).toEqual({made: 'successful', dialog: Dialog});
      expect(Dialog.invite_seqnum).toBe(Dialog.local_seqnum);
    });

    it('returns a request with proper settings, increments local_seqnum', function() {
      var method = SIP.C.INVITE;

      expect(Dialog.createRequest(method, null, null)).toEqual({made: 'successful', dialog: Dialog});
      expect(Dialog.invite_seqnum).toBe(Dialog.local_seqnum - 1);
    });
  });

  describe('.checkInDialogRequest', function() {
    var request;

    beforeEach(function() {
      request = new SIP.OutgoingRequest('INVITE', 'bob@example.com', owner.ua, {from: 'abcdefg'}, ['Contact: ' + owner.contact, 'Allow: ' + SIP.Utils.getAllowedMethods(owner.ua)]);

      request.server_transaction = {on: jasmine.createSpy('on')};
      request.reply = jasmine.createSpy('reply');

      Dialog.remote_seqnum = 5;
    });

    it('sets the remote_seqnum if there is not one on the Dialog', function() {
      Dialog.remote_seqnum = null;

      Dialog.checkInDialogRequest(request);

      expect(Dialog.remote_seqnum).toBe(request.cseq);
    });

    it('replies 500 to a non-ACK request where the request cseq is less than the Dialog cseq', function() {
      request.cseq = 1;

      Dialog.checkInDialogRequest(request);

      expect(request.reply).toHaveBeenCalledWith(500);
    });

    it('returns true if the request method is ACK, the remote seqnum is less than the request cseq, but the request cseq is equal to the invite seqnum', function() {
      Dialog.invite_seqnum = 1;
      request.cseq = 1;

      expect(Dialog.checkInDialogRequest(request)).toBe(true);
    });

    it('returns false the remote seqnum is less than the request cseq, the method is ACK,and the request cseq is not equal to the invite seqnum', function() {
      Dialog.invite_seqnum = 2;
      request.cseq = 1;

      expect(Dialog.checkInDialogRequest(request)).toBe(false);
    });

    it('sets the remote seqnum to the request cseq if it is initally less', function() {
      request.cseq = 7;

      Dialog.checkInDialogRequest(request);

      expect(Dialog.remote_seqnum).toBe(7);
    })

    it('replies 491 if the request method is INVITE and uac_pending_reply is true', function() {
      Dialog.uac_pending_reply = true;

      Dialog.checkInDialogRequest(request);

      expect(request.reply).toHaveBeenCalledWith(491);
    });

    it('replies 500 and returns false if the request method is INVITE and uac_pending_reply is true', function() {
      Dialog.uas_pending_reply = true;

      expect(Dialog.checkInDialogRequest(request)).toBe(false);

      expect(request.reply.calls[0].args[0]).toBe(500);
    });

    it('returns true and calls server_transaction.on once if neither of the *_pending_reply properties are true, the request method is INVITE, and the request does not have a contact header', function() {
      expect(Dialog.uac_pending_reply).toBe(false);
      expect(Dialog.uas_pending_reply).toBe(false);

      spyOn(request, 'hasHeader').andReturn(false);

      expect(Dialog.checkInDialogRequest(request)).toBe(true);

      expect(request.server_transaction.on).toHaveBeenCalled();
      expect(request.server_transaction.on.calls.length).toBe(1);
    });

    it('returns true and calls server_transaction.on twice if neither of the *_pending_reply properties are true, the request method is INVITE, and the request has have a contact header', function() {
      expect(Dialog.uac_pending_reply).toBe(false);
      expect(Dialog.uas_pending_reply).toBe(false);

      expect(Dialog.checkInDialogRequest(request)).toBe(true);

      expect(request.server_transaction.on).toHaveBeenCalled();
      expect(request.server_transaction.on.calls.length).toBe(2);
    });

    it('returns true and calls server.transaction.on once if the request method is NOTIFY and the request has a contact header', function() {
      request.method = SIP.C.NOTIFY;

      expect(Dialog.checkInDialogRequest(request)).toBe(true);

      expect(request.server_transaction.on).toHaveBeenCalled();
      expect(request.server_transaction.on.calls.length).toBe(1);
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
      request = new SIP.OutgoingRequest('INVITE', 'bob@example.com', owner.ua, {from: 'abcdefg'}, ['Contact: ' + owner.contact, 'Allow: ' + SIP.Utils.getAllowedMethods(owner.ua)]);

      spyOn(owner, 'receiveRequest');
    });

    it('does not call owner.receiveRequest if checkInDialogRequest returns false', function() {
      spyOn(Dialog, 'checkInDialogRequest').andReturn(false);

      Dialog.receiveRequest(request);

      expect(owner.receiveRequest).not.toHaveBeenCalled();
    });

    it('calls owner.receiveRequest if checkInDialogRequest returns false', function() {
      spyOn(Dialog, 'checkInDialogRequest').andReturn(true);

      Dialog.receiveRequest(request);

      expect(owner.receiveRequest).toHaveBeenCalled();
    });
  });
});