describe('Session', function() {
  var Session;
  var ua;
  var message;

  beforeEach(function() {
    ua = new SIP.UA({uri: 'alice@example.com'}).start();

    Session = new SIP.EventEmitter();
    Session.initEvents(['progress','accepted','rejected','failed']);
    SIP.Utils.augment(Session, SIP.Session, []);

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
      ''].join('\r\n'), Session.ua);
  });

  afterEach(function() {
    if(ua.status !== 2) {
      ua.stop();
    };
  });

  it('initializes session objects', function() {
    expect(Session.status).toBe(0);
    expect(Session.dialog).toBeNull();
    expect(Session.earlyDialogs).toBeDefined();
    expect(Session.mediaHandler).toBeUndefined();
  });

  it('initializes session timers', function() {
    expect(Session.timers.ackTimer).toBeNull();
    expect(Session.timers.expiresTimer).toBeNull();
    expect(Session.timers.invite2xxTimer).toBeNull();
    expect(Session.timers.userNoAnswerTimer).toBeNull();
    expect(Session.timers.rel1xxTimer).toBeNull();
    expect(Session.timers.prackTimer).toBeNull();
  });

  it('initializes session info', function() {
    expect(Session.startTime).toBeNull();
    expect(Session.endTime).toBeNull();
    expect(Session.tones).toBeNull();
  });

  it('initializes mute/hold state info', function() {
    expect(Session.local_hold).toBe(false);
    expect(Session.remote_hold).toBe(false);
  });

  it('initializes the pending actions array and functions', function() {
    expect(Session.pending_actions.actions).toBeDefined();
    expect(Session.pending_actions.length).toBeDefined();
    expect(Session.pending_actions.isPending).toBeDefined();
    expect(Session.pending_actions.shift).toBeDefined();
    expect(Session.pending_actions.push).toBeDefined();
    expect(Session.pending_actions.pop).toBeDefined();
  });

  describe('.pending_actions', function() {
    beforeEach(function() {
      Session.pending_actions.actions = [{name: 'foo'}, {name: 'bar'}];
    });

    describe('.length', function() {
      it('returns the length', function() {
        expect(Session.pending_actions.length()).toBe(2);
      });
    });

    describe('.isPending', function() {
      it('returns true for objects that are present', function() {
        expect(Session.pending_actions.isPending('foo')).toBe(true);
      });

      it('returns false for objects that are not present', function() {
        expect(Session.pending_actions.isPending('seven')).toBe(false);
      });
    });

    describe('.shift', function() {
      it('returns foo and leaves bar as the only element in the array', function() {
        expect(Session.pending_actions.shift().name).toBe('foo');
        expect(Session.pending_actions.isPending('foo')).toBe(false);
        expect(Session.pending_actions.isPending('bar')).toBe(true);
      });
    });

    describe('.push', function() {
      it('adds seven to the array', function() {
        Session.pending_actions.push('seven');
        expect(Session.pending_actions.isPending('seven')).toBe(true);
      });
    });

    describe('.pop', function() {
      it('removes foo from the array', function() {
        Session.pending_actions.pop('foo');
        expect(Session.pending_actions.isPending('foo')).toBe(false);
        expect(Session.pending_actions.isPending('bar')).toBe(true);
      });
    });
  });

  it('initializes early_sdp, and rel100', function() {
    expect(Session.early_sdp).toBeNull();
    expect(Session.rel100).toBeDefined();
  });

  describe('.dtmf', function() {
    var tones;

    beforeEach(function() {
      tones = 1;

      Session.dialog = new SIP.Dialog(Session, message, 'UAC');
      //spyOn(Session.dialog, 'sendRequest').and.returnValue('sent');

      Session.status = 12;
    });

    it('throws an error if tones is undefined', function() {
      expect(function(){Session.dtmf(undefined);}).toThrowError('Not enough arguments');
    });

    it('throws an error if the session status is incorrect', function() {
      Session.status = 0;
      expect(function(){Session.dtmf(1);}).toThrowError('Invalid status: 0');
    });

    it('throws an error if tones is the wrong type', function() {
      expect(function(){Session.dtmf(1);}).not.toThrowError('Invalid tones: 1');
      Session.status = 12;
      expect(function(){Session.dtmf('one');}).toThrowError('Invalid tones: one');
      expect(function(){Session.dtmf(true);}).toThrowError('Invalid tones: true');
    });

    it('accepts a string argument', function() {
      expect(function(){Session.dtmf('1');}).not.toThrowError('Invalid tones: 1');
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

    //DTMF sends first one, so this gets nulled before we can check it, and DTMF file is not accessible currently
    xit('sets tones if no tones are queued', function() {
      Session.tones = '';
      Session.dtmf('4');
      expect(Session.tones).toBe('4');
    });

    it('returns Session on success', function() {
      expect(Session.dtmf(1)).toBe(Session);
    });
  });

  describe('.bye', function() {
    beforeEach(function() {
      Session.dialog = new SIP.Dialog(Session, message, 'UAC');


      spyOn(Session,'emit')
      Session.status = 12;
    });

    it('logs an error and returns this if the session status is terminated', function() {
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
        expect(Session.emit.calls.mostRecent().args[1] instanceof SIP.OutgoingRequest).toBe(true);
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

    it('returns Session on success', function() {
      Session.dialog = new SIP.Dialog(Session, message, 'UAC');
      expect(Session.refer(target)).toBe(Session);
    });
  });

  describe('.sendRequest', function() {
    var method;

    it('returns Session on success', function() {
      method = 'method';
      Session.status = 12;

      Session.dialog = new SIP.Dialog(Session, message, 'UAC');

      expect(Session.sendRequest(method)).toBe(Session);
    });
  });

  describe('.close', function() {
    beforeEach(function() {
      Session.mediaHandler = {close: jasmine.createSpy('close').and.returnValue(true)};

      Session.dialog = new SIP.Dialog(Session, message, 'UAC');

      Session.status = 12;
    });

    it('returns Session if the status is terminated', function() {
      Session.status = 9;
      expect(Session.close()).toBe(Session);
    });

    it('deletes the session from the ua, deletes the dialog, and returns the Session on success', function() {
      Session.id = 777;
      Session.ua.sessions = {777: Session};

      expect(Session.close()).toBe(Session);
      expect(Session.dialog).toBeUndefined();
      expect(Session.ua.sessions[777]).toBeUndefined();
    });
  });

  describe('.createDialog', function() {
    var Cid, Sid;

    beforeEach(function() {
      Sid = message.call_id + message.to_tag + message.from_tag;
      Cid = message.call_id + message.from_tag + message.to_tag;

      Session.request = {};
      Session.mediaHandler = {};
    });

    it('returns true and puts the dialog in the early dialogs array on a success call with early = true, type = UAS', function() {
      expect(Session.createDialog(message, 'UAS', true)).toBe(true);
      expect(Session.earlyDialogs[Sid]).toBeDefined();
    });

    it('returns true and puts the dialog in the early dialogs array on a success call with early = true, type = UAC', function() {
      expect(Session.createDialog(message, 'UAC', true)).toBe(true);
      expect(Session.earlyDialogs[Cid]).toBeDefined();
    });

    it('returns false if early_dialog.error is true when early = true', function(){
      spyOn(Session, 'failed').and.returnValue(true);
      spyOn(SIP, 'Dialog').and.returnValue({error:true});
      SIP.Dialog.C = {STATUS_EARLY: 1, STATUS_CONFIRMED: 2};

      expect(Session.createDialog(message, 'UAC', true)).toBe(false);
    });

    it('creates an early dialog, then updates it; returns true, no longer in early dialog array', function() {
      expect(Session.createDialog(message, 'UAC', true)).toBe(true);
      expect(Session.earlyDialogs[Cid]).toBeDefined();

      expect(Session.createDialog(message, 'UAC', false)).toBe(true);
      expect(Session.earlyDialogs[Cid]).toBeUndefined();
    });

    it('returns false if dialog.error is true when early = false', function() {
      spyOn(Session, 'failed').and.returnValue(true);
      spyOn(SIP, 'Dialog').and.returnValue({error:true});
      SIP.Dialog.C = {STATUS_EARLY: 1, STATUS_CONFIRMED: 2};

      expect(Session.createDialog(message, 'UAC', false)).toBe(false);
    });

    it('returns true on a call where early = false', function() {
      expect(Session.createDialog(message, 'UAC', false)).toBe(true);
    });
  });

  describe('.isReadyToReinvite', function() {
    beforeEach(function() {
      Session.mediaHandler = {isReady: jasmine.createSpy('isReady').and.returnValue(true)};

      Session.dialog = new SIP.Dialog(Session, message, 'UAC');
    });

    it('returns false if mediaHandler.isReady() returns false', function() {
      Session.mediaHandler.isReady.and.returnValue(false);

      expect(Session.isReadyToReinvite()).toBe(false);
    });

    it('returns false if either of the pending_reply options are true', function() {
      Session.dialog.uac_pending_reply = true;
      expect(Session.isReadyToReinvite()).toBe(false);

      Session.dialog.uac_pending_reply = false;
      Session.dialog.uas_pending_reply = true;
      expect(Session.isReadyToReinvite()).toBe(false);
    });

    it('returns true if all above conditions are met', function() {
      expect(Session.isReadyToReinvite()).toBe(true);
    });
  });

  describe('.hold', function() {

    beforeEach(function() {
      spyOn(Session, 'emit');
      Session.status = 12;
      Session.mediaHandler = jasmine.createSpyObj('mediaHandler', ['hold']);

      spyOn(Session, 'isReadyToReinvite').and.returnValue(true);

      spyOn(Session, 'sendReinvite');
    });

    it('throws an error if the session is in the incorrect state', function() {
      Session.status = 0;

      expect(function(){Session.hold()}).toThrowError('Invalid status: 0');
    });

    //Note: the pending actions conditionals were skipped because it wouldn't test
    //anything in relation to this function.

    it('does not emit hold if local hold is true', function() {
      Session.local_hold = true;

      Session.hold();

      expect(Session.emit).not.toHaveBeenCalled();
    });

    it('emits hold on success', function() {
      Session.hold();

      expect(Session.emit.calls.mostRecent().args[0]).toBe('hold');
    });
  });

  describe('.unhold', function() {
    beforeEach(function() {
      spyOn(Session, 'emit');
      Session.status = 12;
      Session.local_hold = true;
      Session.mediaHandler = jasmine.createSpyObj('mediaHandler', ['unhold']);

      spyOn(Session, 'isReadyToReinvite').and.returnValue(true);

      spyOn(Session, 'sendReinvite');
    });

    //Note: the pending actions conditionals were skipped because it wouldn't test
    //anything in relation to this function.

    it('throws an error if the session is in the incorrect state', function() {
      Session.status = 0;

      expect(function(){Session.unhold()}).toThrowError('Invalid status: 0');
    });

    it('does not emit unhold if local hold is false', function() {
      Session.local_hold = false;

      Session.unhold();

      expect(Session.emit).not.toHaveBeenCalled();
    });

    it('emits unhold on success', function() {
      Session.unhold();

      expect(Session.emit.calls.mostRecent().args[0]).toBe('unhold');
    });
  });

  describe('.isOnHold', function() {
    it('returns the values of local_hold and remote_hold', function() {
      Session.local_hold = 'local';
      Session.remote_hold = 'remote';

      expect(Session.isOnHold()).toEqual({local: 'local', remote: 'remote'});
    });
  });

  describe('.receiveReinvite', function() {
    var request;

    beforeEach(function() {
      spyOn(Session, 'emit');
      Session.mediaHandler = {
        setDescription: jasmine.createSpy('setDescription').and.returnValue(SIP.Utils.Promise.resolve(true)),
        getDescription: jasmine.createSpy('getDescription').and.returnValue(SIP.Utils.Promise.resolve(true))
      };
    });

    it('does not call setDescription and replies with 415 if contentType is not application/sdp', function() {
      spyOn(message, 'getHeader').and.returnValue('incorrect');
      spyOn(message, 'reply');

      Session.receiveReinvite(message);

      expect(Session.mediaHandler.setDescription).not.toHaveBeenCalled();
      expect(message.reply).toHaveBeenCalledWith(415);
    });

    it('calls setDescription on success', function() {
      Session.receiveReinvite(message);

      expect(Session.mediaHandler.setDescription).toHaveBeenCalled();
    });
  });

  describe('.sendReinvite', function() {
    beforeEach(function() {
      Session.mediaHandler = {getDescription: jasmine.createSpy('getDescription').and.returnValue(SIP.Utils.Promise.resolve(true))};
      spyOn(SIP.Utils, 'getAllowedMethods').and.returnValue(true);
    });

    it('on success, sets receiveResponse, reinviteSucceeded, and reinviteFailed, and calls getDescription', function(){
      Session.sendReinvite();

      expect(Session.mediaHandler.getDescription).toHaveBeenCalled();
      expect(Session.receiveResponse).toBe(Session.receiveReinviteResponse);
      expect(Session.reinviteSucceeded).toBeDefined();
      expect(Session.reinviteFailed).toBeDefined();
    });
  });

  describe('.receiveReinviteResponse', function() {
    beforeEach(function() {
      Session.status = 12;

      Session.reinviteFailed = jasmine.createSpy('reinviteFailed');

      spyOn(Session, 'sendRequest');

      Session.mediaHandler = {setDescription: jasmine.createSpy('setDescription').and.returnValue(SIP.Utils.Promise.resolve(true))};
    });

    it('returns without calling sendRequest or reinviteFailed when status is terminated', function() {
      Session.status = 9;

      Session.receiveReinviteResponse(message);

      expect(Session.sendRequest).not.toHaveBeenCalled();
      expect(Session.reinviteFailed).not.toHaveBeenCalled();
      expect(Session.mediaHandler.setDescription).not.toHaveBeenCalled();
    });

    it('returns without calling sendRequest or reinviteFailed when response status code is 1xx', function() {
      message.status_code = 111;

      Session.receiveReinviteResponse(message);

      expect(Session.sendRequest).not.toHaveBeenCalled();
      expect(Session.reinviteFailed).not.toHaveBeenCalled();
      expect(Session.mediaHandler.setDescription).not.toHaveBeenCalled();
    });

    it('calls reInviteFailed when the response has no body with a 2xx status code', function() {
      message.body = null;
      message.status_code = 222;
      Session.dialog = new SIP.Dialog(Session, message, 'UAS');

      Session.receiveReinviteResponse(message);

      expect(Session.reinviteFailed).toHaveBeenCalled()
      expect(Session.sendRequest).toHaveBeenCalled()
      expect(Session.mediaHandler.setDescription).not.toHaveBeenCalled();
    });

    it('calls reInviteFailed when the response\'s content-type is not application/sdp with a 2xx status code', function() {
      spyOn(message, 'getHeader').and.returnValue('wrong');
      message.status_code = 222;
      Session.dialog = new SIP.Dialog(Session, message, 'UAS');

      Session.receiveReinviteResponse(message);

      expect(Session.reinviteFailed).toHaveBeenCalled()
      expect(Session.sendRequest).toHaveBeenCalled();
      expect(Session.mediaHandler.setDescription).not.toHaveBeenCalled();
    });

    it('calls sendRequest and setDescription when response has a 2xx status code, a body, and content-type of application/sdp', function() {
      message.status_code = 222;
      Session.dialog = new SIP.Dialog(Session, message, 'UAS');

      Session.receiveReinviteResponse(message);

      expect(Session.reinviteFailed).not.toHaveBeenCalled();
      expect(Session.sendRequest).toHaveBeenCalled();
      expect(Session.mediaHandler.setDescription).toHaveBeenCalled();
    });

    it('returns without calling sendRequest or reinviteFailed when response status code is neither 1xx or 2xx', function() {
      message.status_code = 333;

      Session.receiveReinviteResponse(message);

      expect(Session.sendRequest).not.toHaveBeenCalled();
      expect(Session.reinviteFailed).toHaveBeenCalled();
      expect(Session.mediaHandler.setDescription).not.toHaveBeenCalled();
    });
  });

  describe('.acceptAndTerminate', function() {
    beforeEach(function() {
      Session.dialog = new SIP.Dialog(Session, message, 'UAC');

      spyOn(Session, 'createDialog').and.returnValue(true);
      spyOn(Session, 'sendRequest');
    });

    it('calls sendRequest twice and returns Session on success', function() {
      expect(Session.acceptAndTerminate(message)).toBe(Session);

      expect(Session.sendRequest.calls.count()).toBe(2);
    });

    it('calls createDialog if this.dialog is null', function() {
      Session.dialog = null;

      expect(Session.acceptAndTerminate(message)).toBe(Session);

      expect(Session.createDialog).toHaveBeenCalled();
      expect(Session.sendRequest.calls.count()).toBe(2);
    });
  });

  describe('.setInvite2xxTimer', function() {
    it('defines timers.invite2xxTimer', function() {
      Session.setInvite2xxTimer(null, null);

      expect(Session.timers.invite2xxTimer).toBeDefined();
    });
  });

  describe('.setACKTimer', function() {
    it('defines timers.ackTimer', function() {
      Session.setACKTimer(null, null);

      expect(Session.timers.ackTimer).toBeDefined();
    });
  });

  describe('.onReadyToReinvite', function() {
    beforeEach(function() {
      spyOn(Session, 'hold');
      spyOn(Session, 'unhold');
    });

    it('returns without calling hold/unhold if pending_actions is empty', function() {
      Session.onReadyToReinvite();

      expect(Session.hold).not.toHaveBeenCalled();
      expect(Session.unhold).not.toHaveBeenCalled();
    });

    it('calls hold if that is the next action', function() {
      Session.pending_actions.push('hold');

      Session.onReadyToReinvite();

      expect(Session.hold).toHaveBeenCalled();
      expect(Session.unhold).not.toHaveBeenCalled();
    });

    it('calls unhold if that is the next action', function() {
      Session.pending_actions.push('unhold');

      Session.onReadyToReinvite();

      expect(Session.hold).not.toHaveBeenCalled();
      expect(Session.unhold).toHaveBeenCalled();
    });
  });

  describe('.onTransportError', function() {
    beforeEach(function() {
      spyOn(Session, 'terminated');
      spyOn(Session, 'failed');
    });

    it('does not call failed or terminated if the status is terminated', function() {
      Session.status = 9;

      Session.onTransportError();

      expect(Session.failed).not.toHaveBeenCalled();
      expect(Session.terminated).not.toHaveBeenCalled();;
    });

    it('calls terminated if the status is confirmed', function() {
      Session.status = 12;

      Session.onTransportError();

      expect(Session.terminated).toHaveBeenCalled();;
      expect(Session.failed).not.toHaveBeenCalled();;
    });

    it('calls failed if the status is neither terminated or confirmed', function() {
      Session.status = 11;

      Session.onTransportError();

      expect(Session.failed).toHaveBeenCalled();
      expect(Session.terminated).not.toHaveBeenCalled();
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
      expect(Session.terminated).not.toHaveBeenCalled();
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
      expect(Session.terminated).not.toHaveBeenCalled();
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
      expect(Session.terminated).not.toHaveBeenCalled();
    });
  });

  describe('.onhold', function() {
    beforeEach(function() {
      Session.local_hold = false;
      Session.remote_hold = false;

      spyOn(Session, 'emit');
    });

    it('sets local_hold to true and emits hold when originator is local', function(){
      expect(Session.local_hold).toBe(false);

      Session.onhold('local');

      expect(Session.local_hold).toBe(true);
      expect(Session.emit.calls.mostRecent().args[0]).toBe('hold');
    });

    it('sets remote_hold to true and emits hold when originator is remote', function(){
      expect(Session.remote_hold).toBe(false);

      Session.onhold('remote');

      expect(Session.remote_hold).toBe(true);
      expect(Session.emit.calls.mostRecent().args[0]).toBe('hold');
    });
  });

  describe('.onunhold', function() {
    beforeEach(function() {
      Session.local_hold = true;
      Session.remote_hold = true;

      spyOn(Session, 'emit');
    });

    it('sets local_hold to false and emits unhold when originator is local', function(){
      expect(Session.local_hold).toBe(true);

      Session.onunhold('local');

      expect(Session.local_hold).toBe(false);
      expect(Session.emit.calls.mostRecent().args[0]).toBe('unhold');
    });

    it('sets remote_hold to false and emit unhold when originator is remote', function(){
      expect(Session.remote_hold).toBe(true);

      Session.onunhold('remote');

      expect(Session.remote_hold).toBe(false);
      expect(Session.emit.calls.mostRecent().args[0]).toBe('unhold');
    });
  });

  describe('.onmute', function() {
    it('emits muted', function() {
      spyOn(Session, 'emit');

      Session.onmute({audio: true, video: true});

      expect(Session.emit.calls.mostRecent().args[0]).toBe('muted');
    });
  });

  describe('.onunmute', function() {
    it('emits unmuted', function() {
      spyOn(Session, 'emit');

      Session.onunmute({audio: true, video: true});

      expect(Session.emit.calls.mostRecent().args[0]).toBe('unmuted');
    });
  });

  describe('.failed', function() {
    beforeEach(function() {
      spyOn(Session, 'close');
      spyOn(Session, 'emit').and.callThrough();
    });

    it('calls close, emits, and returns Session', function() {
      expect(Session.failed()).toBe(Session);

      expect(Session.close).toHaveBeenCalled();
      expect(Session.emit.calls.mostRecent().args[0]).toBe('failed');
    });
  });

  describe('.rejected', function() {
    beforeEach(function() {
      spyOn(Session, 'close');
      spyOn(Session, 'emit').and.callThrough();
    });

    it('calls close, emits, and returns Session', function() {
      expect(Session.rejected()).toBe(Session);

      expect(Session.close).toHaveBeenCalled();
      expect(Session.emit.calls.mostRecent().args[0]).toBe('rejected');
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
    beforeEach(function() {
      spyOn(Session, 'close');
      spyOn(Session, 'emit').and.callThrough();
    });

    it('calls close, emits, and returns Session', function() {
      expect(Session.canceled()).toBe(Session);

      expect(Session.close).toHaveBeenCalled();
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

  beforeEach(function(){

    ua = new SIP.UA({uri: 'alice@example.com', wsServers: 'ws://server.example.com'});
    ua.transport = jasmine.createSpyObj('transport', ['send', 'connect', 'disconnect', 'reConnect','server']);
    ua.transport.server.scheme = 'wss';

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
      ''].join('\r\n'), ua);

    request.transport = ua.transport

    spyOn(request, 'reply');

    InviteServerContext = new SIP.InviteServerContext(ua,request);
  });

  afterEach(function(){
    if(ua.status !== 2) {
      ua.stop();
    };
  });

  it('sets contentDisp correctly', function() {
    expect(InviteServerContext.ContentDisp).toBeUndefined();
  });

  it('replies 415 from non-application/sdp content-type with a session content-disp', function() {
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
      ''].join('\r\n'), ua);
    spyOn(request, 'reply');

    var ISC = new SIP.InviteServerContext(ua, request);

    expect(request.reply).toHaveBeenCalledWith(415);
  });

  it('calls augment using ServerContext and Session', function() {
    spyOn(SIP.Utils, 'augment').and.callThrough();

    var ISC = new SIP.InviteServerContext(ua, request);
    SIP.Timers.clearTimeout(ISC.timers.userNoAnswerTimer);

    expect(SIP.Utils.augment.calls.argsFor(0)[1]).toBe(SIP.ServerContext);
    expect(SIP.Utils.augment.calls.argsFor(1)[1]).toBe(SIP.Session);
  });

  it('sets status, from_tag, id, request, contact, logger, and sessions', function() {
    expect(InviteServerContext.status).toBe(3);
    expect(InviteServerContext.from_tag).toBe(request.from_tag);
    expect(InviteServerContext.id).toBe(request.call_id + request.from_tag);
    expect(InviteServerContext.request).toBe(request);
    expect(InviteServerContext.contact).toBe(InviteServerContext.ua.contact.toString());

    expect(InviteServerContext.logger).toEqual(InviteServerContext.ua.getLogger('sip.inviteservercontext', request.call_id + request.from_tag));
    expect(InviteServerContext.ua.sessions[request.call_id + request.from_tag]).toBe(InviteServerContext);
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
      ''].join('\r\n'), ua);
    spyOn(request, 'reply');
    request.transport = ua.transport;

    var ISC = new SIP.InviteServerContext(ua, request);
    SIP.Timers.clearTimeout(ISC.timers.userNoAnswerTimer);

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
      ''].join('\r\n'), ua);
    spyOn(request, 'reply');
    request.transport = ua.transport;

    var ISC = new SIP.InviteServerContext(ua, request);
    SIP.Timers.clearTimeout(ISC.timers.userNoAnswerTimer);

    expect(ISC.rel100).toBe(SIP.C.supported.SUPPORTED);
  });

  it('replies 500 and returns if the createDialog call fails', function() {
    var ISC, fakereq;
    fakereq = SIP.Parser.parseMessage([
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
    spyOn(fakereq, 'reply');
    fakereq.transport = ua.transport;

    spyOn(SIP.Session.prototype,'createDialog').and.returnValue(false);

    ISC = new SIP.InviteServerContext(ua, fakereq);
    SIP.Timers.clearTimeout(ISC.timers.userNoAnswerTimer);

    expect(fakereq.reply).toHaveBeenCalledWith(500, 'Missing Contact header field');
  });

  it('calls fireNewSession if request.body is null', function() {
    var ISC;
    request.body = null;

    spyOn(SIP.EventEmitter.prototype,'emit');

    jasmine.clock().install();

    ISC = new SIP.InviteServerContext(ua, request);
    SIP.Timers.clearTimeout(ISC.timers.userNoAnswerTimer);

    jasmine.clock().tick(100);

    expect(ISC.emit.calls.argsFor(1)[0]).toBe('progress');

    expect(ISC.status).toBe(4);

    expect(ISC.timers.userNoAnswerTimer).toBeDefined();
    expect(ISC.timers.expiresTimer).toBeDefined();

    expect(ISC.emit.calls.argsFor(2)[0]).toBe('invite');

    jasmine.clock().uninstall();
  });

  // MediaHandler constructor issue (Session/*) TODO - JMF 2014-3-3
  xit('calls mediaHandler.setDescription otherwise', function() {
    var ISC;

    //replace these with spyOn to avoid cleanup
    jasmine.createSpy(SIP.Session, 'mediaHandler').and.callThrough();

    jasmine.createSpy(SIP.Session.mediaHandler.prototype, 'setDescription').and.returnValue(SIP.Utils.Promise.resolve(true));

    ISC = new SIP.InviteServerContext(ua, request);
    SIP.Timers.clearTimeout(ISC.timers.userNoAnswerTimer);

    expect(InviteServerContext.mediaHandler.setDescription).toHaveBeenCalled();

    SIP.Session.mediaHandler = mediaHandlerCleanup;
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
      request.reply.calls.reset();

      InviteServerContext.reject();

      expect(request.reply.calls.mostRecent().args[0]).toBe(480);
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

      InviteServerContext.dialog = new SIP.Dialog(InviteServerContext, request, 'UAS');
    });

    it('emits bye and calls terminated if the status is WAITING_FOR_ACK', function() {
      spyOn(InviteServerContext, 'terminated');

      InviteServerContext.terminate();

      expect(InviteServerContext.emit.calls.mostRecent().args[0]).toBe('bye');
      expect(InviteServerContext.terminated).toHaveBeenCalled();
    });

    it('sets the dialog in the ua dialogs array if the status is WAITING_FOR_ACK', function() {
      InviteServerContext.terminate();

      expect(InviteServerContext.ua.dialogs[InviteServerContext.dialog.id]).toBe(InviteServerContext.dialog);
    });

    it('calls bye if the status is CONFIRMED', function() {
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

      spyOn(InviteServerContext.mediaHandler, 'getDescription').and.returnValue(SIP.Utils.Promise.resolve(true));
    });

    it('changes status to ANSWERED_WAITING_FOR_PRACK and returns this if status is WAITING_FOR_PRACK', function() {
      InviteServerContext.status = 6;

      expect(InviteServerContext.accept()).toBe(InviteServerContext);
      expect(InviteServerContext.status).toBe(10);
    });

    it('throws Invalid State Error if status is not WAITING_FOR_PRACK, WAITING_FOR_ANSWER, or EARLY_MEDIA', function() {
      InviteServerContext.status = 11;

      expect(function(){InviteServerContext.accept();}).not.toThrowError('Invalid status: 11');

      InviteServerContext.status = 0;

      expect(function(){InviteServerContext.accept();}).toThrowError('Invalid status: 0');
    });

    it('replies 500 and returns this if createDialog fails', function() {
      request.reply.calls.reset();
      spyOn(InviteServerContext, 'createDialog').and.returnValue(false);

      expect(InviteServerContext.accept()).toBe(InviteServerContext);

      expect(request.reply.calls.mostRecent().args[0]).toBe(500);
    });

    it('clears the userNoAnswerTimer', function() {
      spyOn(SIP.Timers, 'clearTimeout').and.callThrough();

      InviteServerContext.timers.userNoAnswerTimer = SIP.Timers.setTimeout(function() {}, 200);

      InviteServerContext.accept();

      expect(SIP.Timers.clearTimeout).toHaveBeenCalledWith(InviteServerContext.timers.userNoAnswerTimer);
    });

    // x'ing this since the code it tests currently breaks FF accept - JMF 2014-1-21
    xit('sets the constraints to false if they were set to true earlier when there is no audio or video streams', function() {
      InviteServerContext.accept({mediaConstraints:{audio: true, video: true}});

      expect(InviteServerContext.mediaConstraints).toEqual({audio: false, video: false});
    });

    it('does not call getDescription and returns this when the status is EARLY_MEDIA', function() {
      InviteServerContext.status = 11;

      expect(InviteServerContext.accept()).toBe(InviteServerContext);

      expect(InviteServerContext.mediaHandler.getDescription).not.toHaveBeenCalled();
    });

    it('calls getDescription and returns this on a successful call where the status is not EARLY_MEDIA', function() {
      expect(InviteServerContext.accept()).toBe(InviteServerContext);

      expect(InviteServerContext.mediaHandler.getDescription).toHaveBeenCalled();
    });
  });

  describe('.receiveRequest', function() {
    var req;

    describe('method is CANCELED', function() {
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
          ''].join('\r\n'), ua);

        spyOn(InviteServerContext, 'canceled');
        spyOn(InviteServerContext, 'failed');
        spyOn(InviteServerContext, 'terminated');
        spyOn(SIP.Timers, 'clearTimeout').and.callThrough();

        InviteServerContext.timers.prackTimer = SIP.Timers.setTimeout(function(){}, 100);
        InviteServerContext.timers.rel1xxTimer = SIP.Timers.setTimeout(function(){}, 100);
      });

      it('status is WAITING_FOR_ANSWER, timers cleared', function() {
        InviteServerContext.status = 4;

        InviteServerContext.receiveRequest(req);

        expect(SIP.Timers.clearTimeout).toHaveBeenCalledWith(InviteServerContext.timers.prackTimer);
        expect(SIP.Timers.clearTimeout).toHaveBeenCalledWith(InviteServerContext.timers.rel1xxTimer);
      });

      it('status is WAITING_FOR_PRACK, timers cleared', function() {
        InviteServerContext.status = 6;

        InviteServerContext.receiveRequest(req);

        expect(SIP.Timers.clearTimeout).toHaveBeenCalledWith(InviteServerContext.timers.prackTimer);
        expect(SIP.Timers.clearTimeout).toHaveBeenCalledWith(InviteServerContext.timers.rel1xxTimer);
      });

      it('status is ANSWERED_WAITING_FOR_PRACK, timers cleared', function() {
        InviteServerContext.status = 10;

        InviteServerContext.receiveRequest(req);

        expect(SIP.Timers.clearTimeout).toHaveBeenCalledWith(InviteServerContext.timers.prackTimer);
        expect(SIP.Timers.clearTimeout).toHaveBeenCalledWith(InviteServerContext.timers.rel1xxTimer);
      });

      it('status is EARLY_MEDIA, timers cleared', function() {
        InviteServerContext.status = 11;

        InviteServerContext.receiveRequest(req);

        expect(SIP.Timers.clearTimeout).toHaveBeenCalledWith(InviteServerContext.timers.prackTimer);
        expect(SIP.Timers.clearTimeout).toHaveBeenCalledWith(InviteServerContext.timers.rel1xxTimer);
      });

      it('status is ANSWERED, timers cleared', function() {
        InviteServerContext.status = 5;

        InviteServerContext.receiveRequest(req);

        expect(SIP.Timers.clearTimeout).toHaveBeenCalledWith(InviteServerContext.timers.prackTimer);
        expect(SIP.Timers.clearTimeout).toHaveBeenCalledWith(InviteServerContext.timers.rel1xxTimer);
      });

      afterEach(function() {
        expect(InviteServerContext.status).toBe(9);
        expect(InviteServerContext.request.reply).toHaveBeenCalledWith(487);
        expect(InviteServerContext.canceled).toHaveBeenCalled();
        expect(InviteServerContext.failed.calls.mostRecent().args[1]).toBe(SIP.C.causes.CANCELED);
      });
    });

    describe('method is ACK', function() {
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
          ''].join('\r\n'), InviteServerContext.ua);

        InviteServerContext.status = 7;

        spyOn(InviteServerContext.mediaHandler, 'getLocalStreams').and.returnValue([
          {getAudioTracks: function(){return [];},
           getVideoTracks: function(){return [];},
           stop: function() {}}]);

        spyOn(InviteServerContext.mediaHandler, "close");
        InviteServerContext.dialog = {id: 7, terminate: function(){}, sendRequest: function(){}};
      });

      it('calls mediaHandler.setDescription when the ACK contains an answer to an invite w/o sdp', function() {
        InviteServerContext.hasOffer = true;

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
          ''].join('\r\n'), InviteServerContext.ua);

        spyOn(InviteServerContext.mediaHandler, 'setDescription').and.returnValue(SIP.Utils.Promise.resolve(true));

        InviteServerContext.receiveRequest(req);

        expect(InviteServerContext.mediaHandler.setDescription).toHaveBeenCalled();
      });

      it('calls confirmSession if session.early_sdp is true and above is false', function() {
        InviteServerContext.early_sdp = true;
        spyOn(SIP.Timers, 'clearTimeout').and.callThrough();
        spyOn(InviteServerContext, 'accepted').and.callThrough();

        InviteServerContext.dialog = new SIP.Dialog(InviteServerContext, req, 'UAS');

        InviteServerContext.receiveRequest(req);

        expect(SIP.Timers.clearTimeout).toHaveBeenCalledWith(InviteServerContext.timers.ackTimer);
        expect(SIP.Timers.clearTimeout).toHaveBeenCalledWith(InviteServerContext.timers.invite2xxTimer);

        expect(InviteServerContext.status).toBe(12);
        expect(InviteServerContext.accepted).not.toHaveBeenCalled();
      });

      it('calls failed if the above two conditions are not true', function() {
        spyOn(InviteServerContext, 'failed');

        InviteServerContext.receiveRequest(req);

        expect(InviteServerContext.failed).toHaveBeenCalledWith(req, SIP.C.causes.BAD_MEDIA_DESCRIPTION);
      });

      it('calls confirmSession if there was an invite w/ sdp originally', function() {
        InviteServerContext.hasOffer = true;
        InviteServerContext.hasAnswer = true;

        spyOn(SIP.Timers, 'clearTimeout').and.callThrough();
        InviteServerContext.dialog = new SIP.Dialog(InviteServerContext, req, 'UAS');

        InviteServerContext.receiveRequest(req);

        expect(SIP.Timers.clearTimeout).toHaveBeenCalledWith(InviteServerContext.timers.ackTimer);
        expect(SIP.Timers.clearTimeout).toHaveBeenCalledWith(InviteServerContext.timers.invite2xxTimer);

        expect(InviteServerContext.status).toBe(12);
      });
    });

    describe('method is PRACK', function() {
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
          ''].join('\r\n'), InviteServerContext.ua);

        InviteServerContext.status = 6;

        spyOn(InviteServerContext.mediaHandler, "close");
        InviteServerContext.dialog = {id: 7, terminate: function(){}, sendRequest: function(){}};
      });

      it('calls mediaHandler.setDescription when the invite had no body, but the request had sdp', function(){
        spyOn(InviteServerContext.mediaHandler, 'setDescription').and.returnValue(SIP.Utils.Promise.resolve(true));
        InviteServerContext.request.body = null;

        InviteServerContext.receiveRequest(req);

        expect(InviteServerContext.mediaHandler.setDescription).toHaveBeenCalled();
      });

      it('calls terminate and failed when invite has no body, but the request has a non-sdp body', function() {
        InviteServerContext.request.body = null;
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
          ''].join('\r\n'), InviteServerContext.ua);

        InviteServerContext.receiveRequest(req);

        expect(InviteServerContext.terminate).toHaveBeenCalled();
        expect(InviteServerContext.failed).toHaveBeenCalledWith(req, SIP.C.causes.BAD_MEDIA_DESCRIPTION);
      });

      it('calls reply(200) and other smaller things when the invite had a body (accept not called)', function() {
        InviteServerContext.hasOffer = true;
        InviteServerContext.hasAnswer = true;

        spyOn(SIP.Timers, 'clearTimeout').and.callThrough();
        spyOn(req, 'reply');
        spyOn(InviteServerContext, 'accept');
        spyOn(InviteServerContext.mediaHandler, 'getLocalStreams').and.returnValue([
          {getAudioTracks: function(){return [];},
           getVideoTracks: function(){return [];},
           stop: function() {}}]);

        InviteServerContext.receiveRequest(req);

        expect(SIP.Timers.clearTimeout).toHaveBeenCalledWith(InviteServerContext.timers.ackTimer);
        expect(SIP.Timers.clearTimeout).toHaveBeenCalledWith(InviteServerContext.timers.invite2xxTimer);
        expect(InviteServerContext.accept).not.toHaveBeenCalled();
        expect(req.reply).toHaveBeenCalledWith(200);
      });

      it('calls reply(200) and other smaller things when the invite had a body (accept also called)', function() {
        InviteServerContext.hasOffer = true;
        InviteServerContext.hasAnswer = true;

        spyOn(SIP.Timers, 'clearTimeout').and.callThrough();
        spyOn(req, 'reply');
        spyOn(InviteServerContext, 'accept');
        InviteServerContext.status = 10;
        spyOn(InviteServerContext.mediaHandler, 'getLocalStreams').and.returnValue([
          {getAudioTracks: function(){return [];},
           getVideoTracks: function(){return [];},
           stop: function() {}}]);

        InviteServerContext.receiveRequest(req);

        expect(SIP.Timers.clearTimeout).toHaveBeenCalledWith(InviteServerContext.timers.ackTimer);
        expect(SIP.Timers.clearTimeout).toHaveBeenCalledWith(InviteServerContext.timers.invite2xxTimer);
        expect(InviteServerContext.accept).toHaveBeenCalled();
        expect(req.reply).toHaveBeenCalledWith(200);
      });
    });

    describe('method is BYE', function() {
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
          ''].join('\r\n'), InviteServerContext.ua);

        spyOn(req, 'reply');
        spyOn(InviteServerContext, 'emit');
        spyOn(InviteServerContext, 'terminated').and.callThrough();

        InviteServerContext.receiveRequest(req);

        expect(req.reply).toHaveBeenCalledWith(200);
        expect(InviteServerContext.emit.calls.first().args[0]).toBe('bye');
        expect(InviteServerContext.terminated).toHaveBeenCalledWith(req, SIP.C.causes.BYE);
      });
    });

    describe('method is INVITE', function() {
      xit('calls receiveReinvite', function() {
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
          ''].join('\r\n'), InviteServerContext.ua);

        spyOn(InviteServerContext, 'receiveReinvite');

       InviteServerContext.dialog = new SIP.Dialog(InviteServerContext, InviteServerContext.request, 'UAS');

        InviteServerContext.receiveRequest(req);

        expect(InviteServerContext.receiveReinvite).toHaveBeenCalledWith(req);
      });
    });

    describe('method is INFO', function() {
      it('makes a new DTMF', function() {
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
          ''].join('\r\n'), InviteServerContext.ua);

        InviteServerContext.dialog = new SIP.Dialog(InviteServerContext, req, 'UAS');

        spyOn(req, 'reply');

        InviteServerContext.receiveRequest(req);

        expect(req.reply).toHaveBeenCalledWith(200);

        //Not sure how to test this... another Session/* problem
      });

      it('returns a 415 if DTMF packet had the wrong content-type header', function() {
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
          ''].join('\r\n'), InviteServerContext.ua);

        InviteServerContext.dialog = new SIP.Dialog(InviteServerContext, req, 'UAS');

        spyOn(req, 'reply');

        InviteServerContext.receiveRequest(req);

        expect(req.reply).toHaveBeenCalledWith(415, null, ["Accept: application/dtmf-relay"]);
      });
    });

    describe('method is REFER', function() {
      it('replies 202, then calls callback and terminate if there is a session.followRefer listener', function() {
        InviteServerContext.status = 12;
        req = SIP.Parser.parseMessage([
          'REFER sip:gled5gsn@hk95bautgaa7.invalid;transport=ws;aor=james%40onsnip.onsip.com SIP/2.0',
          'Max-Forwards: 65',
          'To: <sip:james@onsnip.onsip.com>',
          'refer-to: <sip:charles@example.com>',
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
          ''].join('\r\n'), InviteServerContext.ua);

        spyOn(req, 'reply');
        var referFollowed = jasmine.createSpy('referFollowed');
        spyOn(InviteServerContext, 'terminate');
        InviteServerContext.dialog = new SIP.Dialog(InviteServerContext, InviteServerContext.request, 'UAS');
        spyOn(InviteServerContext.dialog, 'sendRequest');
        InviteServerContext.on('refer', InviteServerContext.followRefer(referFollowed));

        InviteServerContext.receiveRequest(req);

        //More can be tested here... another Session/* problem

        expect(req.reply).toHaveBeenCalledWith(202, 'Accepted');
        expect(referFollowed).toHaveBeenCalled();
        expect(InviteServerContext.terminate).toHaveBeenCalled();
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
    ua = new SIP.UA({uri: 'alice@example.com', wsServers: 'ws:server.example.com'});

    ua.transport = jasmine.createSpyObj('transport', ['send', 'connect', 'disconnect', 'reConnect', 'server']);
    ua.transport.server.scheme = 'wss';

    InviteClientContext = new SIP.InviteClientContext(ua, target);
  });

  afterEach(function(){
    if(ua.status !== 2) {
      ua.stop();
    };
  });

  it('throws a type error if target is undefined', function() {
    expect(function() {new SIP.InviteClientContext(ua, undefined);}).toThrowError('Not enough arguments');
  });

  it('throws a not supported error if WebRTC is not supported', function() {
    spyOn(SIP.WebRTC, 'isSupported').and.callFake(function () {
      return false;
    });

    expect(function() {new SIP.InviteClientContext(ua, target);}).toThrowError('Media not supported');
  });

  it('throws a type error if normalizeTarget fails with the given target', function() {
    spyOn(ua, 'normalizeTarget').and.returnValue(null);

    expect(function() {new SIP.InviteClientContext(ua, target);}).toThrowError('Invalid target: bob@example.com');
  });

  it('calls augment using ClientContext and Session', function() {
    spyOn(SIP.Utils, 'augment').and.callThrough();

    var ICC = new SIP.InviteClientContext(ua, target);

    expect(SIP.Utils.augment.calls.argsFor(0)[1]).toBe(SIP.ClientContext);
    expect(SIP.Utils.augment.calls.argsFor(1)[1]).toBe(SIP.Session);
  });

  it('throws an invalid state error if the status is null', function() {
    spyOn(SIP.Utils, 'augment');

    expect(function() {new SIP.InviteClientContext(ua, target);}).toThrowError('Invalid status: undefined');
  });

  it('sets several parameters at the end of the constructor', function() {
    expect(InviteClientContext.from_tag).toBeDefined();

    expect(InviteClientContext.isCanceled).toBe(false);
    expect(InviteClientContext.received_100).toBe(false);

    expect(InviteClientContext.method).toBe(SIP.C.INVITE);
    expect(InviteClientContext.receiveResponse).toBe(InviteClientContext.receiveInviteResponse);

    expect(InviteClientContext.logger).toBe(ua.getLogger('sip.inviteclientcontext'));
  });

  it('throws a type error if invalid stun servers are passed in', function() {
    spyOn(SIP.UA.configuration_check.optional, 'stunServers');

    expect(function() { new SIP.InviteClientContext(ua, target, {stunServers: 'fake'});}).toThrowError('Invalid stunServers: fake');
  });

  it('throws a type error if invalid turn servers are passed in', function() {
    spyOn(SIP.UA.configuration_check.optional, 'turnServers');

    expect(function() { new SIP.InviteClientContext(ua, target, {turnServers: 'fake'});}).toThrowError('Invalid turnServers: fake');
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
    expect(InviteClientContext.id).toBe(InviteClientContext.request.call_id + InviteClientContext.from_tag);
    expect(InviteClientContext.logger).toBe(InviteClientContext.ua.getLogger('sip.inviteclientcontext', InviteClientContext.id));

  });

  describe('.invite', function() {

    it('sets MediaHandler and ua.sessions', function() {
      InviteClientContext.invite();
      expect(InviteClientContext.mediaHandler).toBeDefined();
      expect(InviteClientContext.ua.sessions[InviteClientContext.id]).toBe(InviteClientContext);
    });

    it('calls mediaHandler.getDescription async and returns this on success', function() {
      var callback, s;

      spyOn(SIP.WebRTC, 'getUserMedia').and.callThrough();
      callback = jasmine.createSpy('callback').and.callFake(function () {
        done();
        //jasmine.clock().uninstall();
      });

      //jasmine.clock().install();

      s = InviteClientContext.invite();
      expect(s).toBe(InviteClientContext);

      s.mediaHandler.on('userMediaRequest', callback);

      expect(SIP.WebRTC.getUserMedia).not.toHaveBeenCalled();
      expect(callback).not.toHaveBeenCalled();

      //jasmine.clock().tick(100);
    });
  });

  describe('.receiveInviteResponse', function() {
    var response;
    var resp;

    beforeEach(function() {
      response = SIP.Parser.parseMessage([
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
        ''].join('\r\n'), ua);

      InviteClientContext.request.body = 'a=sendrecv',
      '';

      spyOn(SIP.Dialog.prototype, 'sendRequest');
      spyOn(InviteClientContext, 'sendRequest');

      SIP.WebRTC.getUserMedia = jasmine.createSpy('getUserMedia');
    });

    it('accepts and terminates a 200 OK from a branch that\'s replying after the call has been established', function() {
      resp = SIP.Parser.parseMessage([
        'SIP/2.0 200 OK',
        'To: <sip:james@onsnip.onsip.com>;tag=1ma2ki9411',
        'From: "test1" <sip:test1@onsnip.onsip.com>;tag=58312p20s2',
        'Call-ID: aaaaaaaaaaaaaa',
        'CSeq: 9059 INVITE',
        'Contact: <sip:gusgt9j8@vk3dj582vbu9.invalid;transport=ws>',
        'Contact: <sip:gusgt9j8@vk3dj582vbu9.invalid;transport=ws>',
        'Supported: outbound',
        'Content-Type: application/sdp',
        'Content-Length: 11',
        '',
        'a= sendrecv',
        ''].join('\r\n'), ua);

      InviteClientContext.createDialog(response, 'UAC', false);
      expect(InviteClientContext.dialog).toBeDefined();

      InviteClientContext.status = 12;

      InviteClientContext.receiveInviteResponse(resp);

      expect(InviteClientContext.earlyDialogs[resp.call_id+resp.from_tag+resp.to_tag]).toBeDefined();
      expect(InviteClientContext.earlyDialogs[resp.call_id+resp.from_tag+resp.to_tag].sendRequest.calls.argsFor(0)[1]).toBe(SIP.C.ACK);
      expect(InviteClientContext.earlyDialogs[resp.call_id+resp.from_tag+resp.to_tag].sendRequest).toHaveBeenCalledWith(InviteClientContext, SIP.C.BYE);
    });

    it('emits failed if the branch on which early media was established is not the branch that picks up first (invite w/ sdp case)', function() {
      resp = SIP.Parser.parseMessage([
        'SIP/2.0 200 OK',
        'To: <sip:james@onsnip.onsip.com>;tag=1ma2ki9411',
        'From: "test1" <sip:test1@onsnip.onsip.com>;tag=58312p20s2',
        'Call-ID: aaaaaaaaaaaaaa',
        'CSeq: 9059 INVITE',
        'Contact: <sip:gusgt9j8@vk3dj582vbu9.invalid;transport=ws>',
        'Contact: <sip:gusgt9j8@vk3dj582vbu9.invalid;transport=ws>',
        'Supported: outbound',
        'Content-Type: application/sdp',
        'Content-Length: 11',
        '',
        'a= sendrecv',
        ''].join('\r\n'), ua);

      InviteClientContext.createDialog(response, 'UAC', false);
      expect(InviteClientContext.dialog).toBeDefined();

      spyOn(InviteClientContext, 'failed');

      InviteClientContext.receiveInviteResponse(resp);

      expect(InviteClientContext.failed).toHaveBeenCalledWith(resp, SIP.C.causes.WEBRTC_ERROR);
    });

    it('ACKs any 200 OKs from the branch on which the call is up after the initial 200 OK', function() {
      InviteClientContext.status = 12;
      InviteClientContext.createDialog(response, 'UAC', false);
      expect(InviteClientContext.dialog).toBeDefined();

      InviteClientContext.receiveInviteResponse(response);

      expect(InviteClientContext.sendRequest).toHaveBeenCalledWith(SIP.C.ACK, {cseq: response.cseq});
    });

    it('PRACKS any non 200 response when it already chose a dialog', function() {
      InviteClientContext.dialog = { terminate: function() {} };
      resp = SIP.Parser.parseMessage([
        'SIP/2.0 183 Session In Progress',
        'To: <sip:james@onsnip.onsip.com>;tag=1ma2ki9411',
        'From: "test1" <sip:test1@onsnip.onsip.com>;tag=58312p20s2',
        'Call-ID: aaaaaaaaaaaaaa',
        'CSeq: 9059 INVITE',
        'RSeq: 9060',
        'Contact: <sip:gusgt9j8@vk3dj582vbu9.invalid;transport=ws>',
        'Contact: <sip:gusgt9j8@vk3dj582vbu9.invalid;transport=ws>',
        'Supported: outbound',
        'Content-Type: application/sdp',
        'Content-Length: 11',
        '',
        'a= sendrecv',
        ''].join('\r\n'), ua);

      InviteClientContext.receiveInviteResponse(resp);

      expect(InviteClientContext.earlyDialogs[resp.call_id+resp.from_tag+resp.to_tag].pracked).toContain('9060');
      expect(InviteClientContext.earlyDialogs[resp.call_id+resp.from_tag+resp.to_tag].sendRequest.calls.argsFor(0)[1]).toBe(SIP.C.PRACK);
    });

    it('cancels the request if the call was canceled and the response is 1xx', function() {
      InviteClientContext.isCanceled = true;
      InviteClientContext.cancelReason = 'TESTING';
      resp = SIP.Parser.parseMessage([
        'SIP/2.0 183 Session In Progress',
        'To: <sip:james@onsnip.onsip.com>;tag=1ma2ki9411',
        'From: "test1" <sip:test1@onsnip.onsip.com>;tag=58312p20s2',
        'Call-ID: aaaaaaaaaaaaaa',
        'CSeq: 9059 INVITE',
        'RSeq: 9060',
        'Contact: <sip:gusgt9j8@vk3dj582vbu9.invalid;transport=ws>',
        'Contact: <sip:gusgt9j8@vk3dj582vbu9.invalid;transport=ws>',
        'Supported: outbound',
        'Content-Type: application/sdp',
        'Content-Length: 11',
        '',
        'a= sendrecv',
        ''].join('\r\n'), ua);

      InviteClientContext.request.cancel = jasmine.createSpy('cancel');
      spyOn(InviteClientContext, 'canceled');

      InviteClientContext.receiveInviteResponse(resp);

      expect(InviteClientContext.request.cancel).toHaveBeenCalledWith('TESTING');
      expect(InviteClientContext.canceled).toHaveBeenCalledWith(null);
    });
    it('accepts and terminates the response if the call was canceled and the response is 2xx', function() {
      InviteClientContext.isCanceled = true;

      spyOn(InviteClientContext, 'acceptAndTerminate');

      InviteClientContext.receiveInviteResponse(response);

      expect(InviteClientContext.acceptAndTerminate).toHaveBeenCalledWith(response);
    });

    it('sets received_100 to true when the response is 100', function() {
      expect(InviteClientContext.received_100).toBe(false);

      response.status_code = 100;

      InviteClientContext.receiveInviteResponse(response);

      expect(InviteClientContext.received_100).toBe(true);
    });

    describe('the response status code is 101-199', function() {
      beforeEach(function() {
        response.status_code = 183;
      });
      it('logs a warning and breaks if the response does not have a to tag', function() {
        response.to_tag = null;

        spyOn(InviteClientContext.logger, 'warn');

        InviteClientContext.receiveInviteResponse(response);

        expect(InviteClientContext.logger.warn).toHaveBeenCalledWith('1xx response received without to tag');
      });

      it('creates a dialog if the response has a contact; breaks if createDialog doesn\'t return correctly', function() {
        spyOn(InviteClientContext, 'createDialog').and.returnValue(false);

        InviteClientContext.receiveInviteResponse(response);

        expect(InviteClientContext.createDialog).toHaveBeenCalledWith(response, 'UAC', true);
        expect(InviteClientContext.status).not.toBe(2);
      })

      it('changes the status to 1XX_RECEIVED and emits progress', function() {
        expect(InviteClientContext.status).not.toBe(2);
        spyOn(InviteClientContext, 'emit');

        InviteClientContext.receiveInviteResponse(response);

        expect(InviteClientContext.status).toBe(2);
        expect(InviteClientContext.emit).toHaveBeenCalledWith('progress', response);
      });

      xit('does not PRACK a response with no body (and requires: 100rel) if there is already a confirmed dialog', function() {
        InviteClientContext.createDialog(response, 'UAC', false);
        expect(InviteClientContext.dialog).toBeDefined();

        resp = SIP.Parser.parseMessage([
          'SIP/2.0 183 Session In Progress',
          'To: <sip:james@onsnip.onsip.com>;tag=1ma2ki9411',
          'From: "test1" <sip:test1@onsnip.onsip.com>;tag=58312p20s2',
          'Call-ID: aaaaaaaaaaaaaa',
          'CSeq: 9059 INVITE',
          'RSeq: 9060',
          'require: 100rel',
          'Contact: <sip:gusgt9j8@vk3dj582vbu9.invalid;transport=ws>',
          'Contact: <sip:gusgt9j8@vk3dj582vbu9.invalid;transport=ws>',
          'Supported: outbound',
          'Content-Type: application/sdp',
          'Content-Length: 0',
          '',
          ''].join('\r\n'), ua);

        InviteClientContext.receiveInviteResponse(resp);

        expect(InviteClientContext.earlyDialogs[resp.call_id+resp.from_tag+resp.to_tag].sendRequest).not.toHaveBeenCalled();
      });

      it('does not PRACK a response with no body (and requires: 100rel) if there is an illegal rseq header', function() {
        resp = SIP.Parser.parseMessage([
          'SIP/2.0 183 Session In Progress',
          'To: <sip:james@onsnip.onsip.com>;tag=1ma2ki9411',
          'From: "test1" <sip:test1@onsnip.onsip.com>;tag=58312p20s2',
          'Call-ID: aaaaaaaaaaaaaa',
          'CSeq: 9059 INVITE',
          'RSeq: 9060',
          'require: 100rel',
          'Contact: <sip:gusgt9j8@vk3dj582vbu9.invalid;transport=ws>',
          'Contact: <sip:gusgt9j8@vk3dj582vbu9.invalid;transport=ws>',
          'Supported: outbound',
          'Content-Type: application/sdp',
          'Content-Length: 0',
          '',
          ''].join('\r\n'), ua);

        !InviteClientContext.createDialog(resp, 'UAC', true);
        InviteClientContext.earlyDialogs[resp.call_id+resp.from_tag+resp.to_tag].pracked.push(9060);

        resp.setHeader('rseq', 9010);

        InviteClientContext.receiveInviteResponse(resp);

        expect(InviteClientContext.earlyDialogs[resp.call_id+resp.from_tag+resp.to_tag].sendRequest).not.toHaveBeenCalled();
      });

      it('PRACKs (when require: 100rel is present) a response without a body', function() {
        resp = SIP.Parser.parseMessage([
          'SIP/2.0 183 Session In Progress',
          'To: <sip:james@onsnip.onsip.com>;tag=1ma2ki9411',
          'From: "test1" <sip:test1@onsnip.onsip.com>;tag=58312p20s2',
          'Call-ID: aaaaaaaaaaaaaa',
          'CSeq: 9059 INVITE',
          'RSeq: 9060',
          'require: 100rel',
          'Contact: <sip:gusgt9j8@vk3dj582vbu9.invalid;transport=ws>',
          'Contact: <sip:gusgt9j8@vk3dj582vbu9.invalid;transport=ws>',
          'Supported: outbound',
          'Content-Type: application/sdp',
          'Content-Length: 0',
          '',
          ''].join('\r\n'), ua);

        InviteClientContext.receiveInviteResponse(resp);

        expect(InviteClientContext.earlyDialogs[resp.call_id+resp.from_tag+resp.to_tag].pracked).toContain('9060');
        expect(InviteClientContext.earlyDialogs[resp.call_id+resp.from_tag+resp.to_tag].sendRequest).toHaveBeenCalledWith(InviteClientContext, SIP.C.PRACK, {extraHeaders: ['RAck: 9060 9059 INVITE']});
      });

      it('calls MediaHandler.setDescription for a response with a body with require: 100rel and confirms the dialog', function() {
        resp = SIP.Parser.parseMessage([
          'SIP/2.0 183 Session In Progress',
          'To: <sip:james@onsnip.onsip.com>;tag=1ma2ki9411',
          'From: "test1" <sip:test1@onsnip.onsip.com>;tag=58312p20s2',
          'Call-ID: aaaaaaaaaaaaaa',
          'CSeq: 9059 INVITE',
          'RSeq: 9060',
          'require: 100rel',
          'Contact: <sip:gusgt9j8@vk3dj582vbu9.invalid;transport=ws>',
          'Contact: <sip:gusgt9j8@vk3dj582vbu9.invalid;transport=ws>',
          'Supported: outbound',
          'Content-Type: application/sdp',
          'Content-Length: 11',
          '',
          'a= sendrecv',
          ''].join('\r\n'), ua);

        InviteClientContext.mediaHandler = jasmine.createSpyObj('mediaHandler', ['setDescription', 'close']);
        InviteClientContext.mediaHandler.setDescription.and.returnValue(SIP.Utils.Promise.resolve(true));

        InviteClientContext.hasOffer = true;

        InviteClientContext.receiveInviteResponse(resp);

        expect(InviteClientContext.dialog.id.toString()).toBe(resp.call_id+resp.from_tag+resp.to_tag);
        expect(InviteClientContext.mediaHandler.setDescription).toHaveBeenCalled();
      });

      xit('calls MediaHandler.setDescription for a 100rel response with a body where the request had a non-sdp body', function() {
        InviteClientContext.renderbody = InviteClientContext.request.body;
        InviteClientContext.mediaHandler = {localMedia: 'localMedia'};

        resp = SIP.Parser.parseMessage([
          'SIP/2.0 183 Session In Progress',
          'To: <sip:james@onsnip.onsip.com>;tag=1ma2ki9411',
          'From: "test1" <sip:test1@onsnip.onsip.com>;tag=58312p20s2',
          'Call-ID: aaaaaaaaaaaaaa',
          'CSeq: 9059 INVITE',
          'RSeq: 9060',
          'require: 100rel',
          'Contact: <sip:gusgt9j8@vk3dj582vbu9.invalid;transport=ws>',
          'Contact: <sip:gusgt9j8@vk3dj582vbu9.invalid;transport=ws>',
          'Supported: outbound',
          'Content-Type: application/sdp',
          'Content-Length: 11',
          '',
          'a= sendrecv',
          ''].join('\r\n'), ua);

        InviteClientContext.receiveInviteResponse(resp);
      });
    });

    describe('the response status code is 2xx', function() {
      beforeEach(function() {
        response.setHeader('cseq', InviteClientContext.request.cseq + ' ' + InviteClientContext.request.method);
      });

      it('returns after doing nothing because of an incorrect cseq (same as below, but the cseq is not reset)', function() {
        InviteClientContext.status = 11;
        InviteClientContext.createDialog(response, 'UAC', false);
        InviteClientContext.mediaHandler = {localMedia: {getAudioTracks: function() {return []},
                                                            getVideoTracks: function() {return []},
                                                            stop: function() {}},
                                               close: function(){}};

        response.setHeader('cseq', '7777 INVITE');
        spyOn(InviteClientContext, 'accepted');

        InviteClientContext.receiveInviteResponse(response);

        expect(InviteClientContext.status).toBe(11);
        expect(InviteClientContext.sendRequest).not.toHaveBeenCalled();
        expect(InviteClientContext.accepted).not.toHaveBeenCalled();
      });

      it('sets the status to confirmed, ACKS, and calls accepted if the status was earlyMedia', function() {
        InviteClientContext.status = 11;
        InviteClientContext.hasAnswer = true;
        InviteClientContext.createDialog(response, 'UAC', false);
        InviteClientContext.mediaHandler = {localMedia: {getAudioTracks: function() {return []},
                                                            getVideoTracks: function() {return []},
                                                            stop: function() {}},
                                               unmute: function(){},
                                               close: function(){}};
        spyOn(InviteClientContext, 'accepted');

        InviteClientContext.receiveInviteResponse(response);

        expect(InviteClientContext.status).toBe(12);
        expect(InviteClientContext.sendRequest).toHaveBeenCalled();
        expect(InviteClientContext.accepted).toHaveBeenCalledWith(response);
      });

      it('returns after doing nothing because there is already a confirmed dialog (same conditions as below otherwise', function() {
        response.body = null;
        spyOn(InviteClientContext, 'acceptAndTerminate');
        spyOn(InviteClientContext, 'failed');
        InviteClientContext.createDialog(response, 'UAC', false);

        InviteClientContext.receiveInviteResponse(response);

        expect(InviteClientContext.acceptAndTerminate).not.toHaveBeenCalled();
        expect(InviteClientContext.failed).not.toHaveBeenCalled();
      });

      it('calls acceptAndTerminate and failed if the response has no body', function() {
        response.body = null;
        spyOn(InviteClientContext, 'acceptAndTerminate');
        spyOn(InviteClientContext, 'failed');

        InviteClientContext.receiveInviteResponse(response);

        expect(InviteClientContext.acceptAndTerminate).toHaveBeenCalledWith(response, 400, 'Missing session description');
        expect(InviteClientContext.failed).toHaveBeenCalledWith(response, SIP.C.causes.BAD_MEDIA_DESCRIPTION);
      });

      it('uses the dialog with pre-established media, changes the status to confirmed, ACKS, and calls accepted if that dialog exists for this response and the request had no body', function() {
        InviteClientContext.request.body = null;
        InviteClientContext.createDialog(response, 'UAC', true);
        InviteClientContext.earlyDialogs[response.call_id+response.from_tag+response.to_tag].mediaHandler =
          {localMedia: {getAudioTracks: function() {return []},
                        getVideoTracks: function() {return []},
                        stop: function() {}},
           unmute: function(){},
           close: function(){}};

        spyOn(InviteClientContext, 'accepted');

        InviteClientContext.receiveInviteResponse(response);

        expect(InviteClientContext.sendRequest).toHaveBeenCalledWith(SIP.C.ACK, {cseq: response.cseq});
        expect(InviteClientContext.accepted).toHaveBeenCalledWith(response);
      });

      it('calls mediaHandler.setDescription if the request had no body and the response had no early dialog with media connected to it', function() {
        InviteClientContext.request.body = null;
        InviteClientContext.mediaHandler = jasmine.createSpyObj('mediaHandler', ['setDescription', 'getDescription', 'close']);
        InviteClientContext.mediaHandler.setDescription.and.returnValue(SIP.Utils.Promise.resolve(true));
        InviteClientContext.mediaHandler.getDescription.and.returnValue(SIP.Utils.Promise.resolve(true));

        InviteClientContext.receiveInviteResponse(response);

        expect(InviteClientContext.mediaHandler.setDescription).toHaveBeenCalled();
      });

      it('same as above, but does not make the call if the createDialog fails', function() {
        InviteClientContext.request.body = null;
        InviteClientContext.mediaHandler = jasmine.createSpyObj('mediaHandler', ['setDescription', 'close']);
        InviteClientContext.mediaHandler.setDescription.and.returnValue(SIP.Utils.Promise.resolve(true));
        spyOn(InviteClientContext, 'createDialog').and.returnValue(false);

        InviteClientContext.receiveInviteResponse(response);

        expect(InviteClientContext.mediaHandler.setDescription).not.toHaveBeenCalled();
      });

      it('calls mediaHandler.setDescription if the request has a body', function() {
        InviteClientContext.mediaHandler = jasmine.createSpyObj('mediaHandler', ['setDescription', 'getDescription', 'close']);
        InviteClientContext.mediaHandler.setDescription.and.returnValue(SIP.Utils.Promise.resolve(true));
        InviteClientContext.mediaHandler.getDescription.and.returnValue(SIP.Utils.Promise.resolve(true));

        InviteClientContext.receiveInviteResponse(response);

        expect(InviteClientContext.mediaHandler.setDescription).toHaveBeenCalled();
      });

      it('same as above, but does not make the call if the createDialog fails', function() {
        InviteClientContext.mediaHandler = jasmine.createSpyObj('mediaHandler', ['setDescription', 'close']);
        InviteClientContext.mediaHandler.setDescription.and.returnValue(SIP.Utils.Promise.resolve(true));
        spyOn(InviteClientContext, 'createDialog').and.returnValue(false);

        InviteClientContext.receiveInviteResponse(response);

        expect(InviteClientContext.mediaHandler.setDescription).not.toHaveBeenCalled();
      });
    });

    it('calls failed, rejected for any other response code', function() {
      response.status_code = 300;
      spyOn(InviteClientContext, 'failed');
      spyOn(InviteClientContext, 'rejected');
      spyOn(InviteClientContext, 'terminated');

      InviteClientContext.receiveInviteResponse(response);

      expect(InviteClientContext.failed).toHaveBeenCalled();
      expect(InviteClientContext.rejected).toHaveBeenCalled();
    });
  });

  describe('.cancel', function() {
    it('throws an invalid state error if the status is TERMINATED', function() {
      InviteClientContext.status = 9;

      expect(function() {InviteClientContext.cancel();}).toThrowError('Invalid status: 9');
    });

    it('throws a type error if the status code is invalid or less than 200', function() {
      expect(function() {InviteClientContext.cancel({status_code: 100});}).toThrowError('Invalid status_code: 100');
      expect(function() {InviteClientContext.cancel({status_code: 700});}).toThrowError('Invalid status_code: 700');
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

    it('sets isCanceled to true, calls canceled, and returns this if status is INVITE_SENT and received_100 is false', function() {
      InviteClientContext.status = 1;
      spyOn(InviteClientContext, 'failed').and.callThrough();
      spyOn(InviteClientContext, 'canceled').and.callThrough();
      spyOn(InviteClientContext, 'terminated').and.callThrough();

      expect(InviteClientContext.isCanceled).toBe(false);

      expect(InviteClientContext.cancel()).toBe(InviteClientContext);

      expect(InviteClientContext.isCanceled).toBe(true);
      expect(InviteClientContext.canceled).toHaveBeenCalled();
    });

    it('calls request.cancel, canceled, and returns this if status is INVITE_SENT and received_100 is true', function() {
      InviteClientContext.status = 1;
      InviteClientContext.received_100 = true;
      InviteClientContext.request = {cancel: jasmine.createSpy('cancel')};

      spyOn(InviteClientContext, 'failed').and.callThrough();
      spyOn(InviteClientContext, 'canceled').and.callThrough();
      spyOn(InviteClientContext, 'terminated').and.callThrough();

      expect(InviteClientContext.cancel()).toBe(InviteClientContext);

      expect(InviteClientContext.request.cancel).toHaveBeenCalled();
      expect(InviteClientContext.canceled).toHaveBeenCalled();
    });

    it('calls request.cancel, canceled, and returns this if status is 1XX_RECEIVED', function() {
      InviteClientContext.status = 2;
      InviteClientContext.request = {cancel: jasmine.createSpy('cancel')};

      spyOn(InviteClientContext, 'failed').and.callThrough();
      spyOn(InviteClientContext, 'canceled').and.callThrough();
      spyOn(InviteClientContext, 'terminated').and.callThrough();

      expect(InviteClientContext.cancel()).toBe(InviteClientContext);

      expect(InviteClientContext.request.cancel).toHaveBeenCalled();
      expect(InviteClientContext.canceled).toHaveBeenCalled();
    });
  });

  describe('.terminate', function() {
    beforeEach(function() {
      spyOn(InviteClientContext, 'terminated').and.callThrough();
    });

    afterEach(function() {
      expect(InviteClientContext.terminated).toHaveBeenCalled();
    });

    it('calls bye, terminated, and returns this if the status is WAITING_FOR_ACK', function() {
      InviteClientContext.status = 7;
      spyOn(InviteClientContext, 'bye');

      expect(InviteClientContext.terminate()).toBe(InviteClientContext);

      expect(InviteClientContext.bye).toHaveBeenCalled();
    });

    it('calls bye, terminated, and returns this if the status is CONFIRMED', function() {
      InviteClientContext.status = 12;
      spyOn(InviteClientContext, 'bye');

      expect(InviteClientContext.terminate()).toBe(InviteClientContext);

      expect(InviteClientContext.bye).toHaveBeenCalled();
    });

    it('calls cancel, terminated, and returns this if the status is anything else', function() {
      InviteClientContext.status = 0;
      spyOn(InviteClientContext, 'cancel');

      expect(InviteClientContext.terminate()).toBe(InviteClientContext);

      expect(InviteClientContext.cancel).toHaveBeenCalled();
    });
  });

  describe('.receiveRequest', function() {
    var request;

    beforeEach(function() {
      request = new SIP.OutgoingRequest('INVITE', 'bob@example.com', InviteClientContext.ua, {from: 'abcdefg'}, ['Contact: ' + InviteClientContext.contact, 'Allow: ' + SIP.Utils.getAllowedMethods(InviteClientContext.ua)]);

      request.body = 'a=sendrecv',
      '';
      request.reply = jasmine.createSpy('reply');
    });

    xit('sets the status to CANCELED, replies 487, and calls canceled and failed if the status is EARLY_MEDIA and the request method is CANCELED', function() {
      // TODO - UAC shouldn't receive CANCEL.  Error response instead?
      InviteClientContext.status = 11;
      request.method = SIP.C.CANCEL;

      spyOn(InviteClientContext, 'canceled');
      spyOn(InviteClientContext, 'failed');
      InviteClientContext.request = {reply: jasmine.createSpy('reply')};

      InviteClientContext.receiveRequest(request);

      expect(InviteClientContext.status).toBe(9);
      expect(InviteClientContext.request.reply).toHaveBeenCalledWith(487);
      expect(InviteClientContext.canceled).toHaveBeenCalled();
      expect(InviteClientContext.failed.calls.mostRecent().args[1]).toBe(SIP.C.causes.CANCELED);
    });

    it('replies 200 and emits bye and terminated if the request method is BYE', function() {
      InviteClientContext.status = 12;
      request.method = SIP.C.BYE;
      spyOn(InviteClientContext, 'emit');
      spyOn(InviteClientContext, 'terminated');

      InviteClientContext.receiveRequest(request);

      expect(request.reply).toHaveBeenCalledWith(200);
      expect(InviteClientContext.emit.calls.mostRecent().args[0]).toBe('bye');
      expect(InviteClientContext.terminated).toHaveBeenCalledWith(request, SIP.C.causes.BYE);
    });

    xit('logs and calls receiveReinvite if request method is INVITE', function() {
      InviteClientContext.status = 12;
      request.method = SIP.C.INVITE;

      spyOn(InviteClientContext.logger, 'log');
      spyOn(InviteClientContext, 'receiveReinvite');

      InviteClientContext.receiveRequest(request);

      expect(InviteClientContext.logger.log).toHaveBeenCalledWith('re-INVITE received');
      expect(InviteClientContext.receiveReinvite).toHaveBeenCalledWith(request);
    });

    xit('clears timers and sets the status to confirmed if request method was ACK and the status was WAITING_FOR_ACK', function() {
      // TODO - UAC shouldn't ever be waiting for ACK.
      InviteClientContext.timers.ackTimer = 1;
      InviteClientContext.timers.invite2xxTimer = 2;
      InviteClientContext.status = 7;
      request.method = SIP.C.ACK;

      spyOn(SIP.Timers, 'clearTimeout');

      InviteClientContext.receiveRequest(request);

      expect(InviteClientContext.status).toBe(12);
      expect(SIP.Timers.clearTimeout).toHaveBeenCalledWith(InviteClientContext.timers.ackTimer);
      expect(SIP.Timers.clearTimeout).toHaveBeenCalledWith(InviteClientContext.timers.invite2xxTimer);
    });

    xit('DTMF case', function() {
      //can't check much here, Session/* problem
    });

    it('logs, replies 202, then calls callback and terminate if session.followRefer listener present', function() {
      InviteClientContext.status = 12;
      request.method = SIP.C.REFER;
      request.parseHeader = jasmine.createSpy('parseHeader').and.returnValue({uri: SIP.URI.parse('sip:carol@example.com')});
      InviteClientContext.dialog = new SIP.Dialog(InviteClientContext, request, 'UAC');
/*       spyOn(InviteClientContext.dialog.sendRequest); */

      spyOn(InviteClientContext.logger, 'log');
      var referFollowed = jasmine.createSpy('referFollowed');
      spyOn(InviteClientContext, 'terminate');
      spyOn(InviteClientContext.ua, 'invite');

      InviteClientContext.on('refer', InviteClientContext.followRefer(referFollowed));

      InviteClientContext.receiveRequest(request);
      //no way to avoid request.send

      expect(InviteClientContext.logger.log).toHaveBeenCalledWith('REFER received');
      expect(request.reply).toHaveBeenCalledWith(202, 'Accepted');
/*       expect(InviteClientContext.dialog.sendRequest).toHaveBeenCalled(); */
      expect(InviteClientContext.ua.invite).toHaveBeenCalled();
      expect(referFollowed).toHaveBeenCalled();
      expect(InviteClientContext.terminate).toHaveBeenCalled();
    });
  });
});
