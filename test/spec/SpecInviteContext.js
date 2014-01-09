describe('InviteContext', function() {
  var InviteContext;
  var ua;
  var message;
  var sipDialogCleanup;
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

    ua = new SIP.UA({uri: 'alice@example.com', ws_servers: 'ws:server.example.com'});

    InviteContext = new SIP.EventEmitter();
    InviteContext.initEvents([]);
    SIP.Utils.augment(InviteContext, SIP.InviteContext, []);

    InviteContext.ua = ua;

    message = SIP.Parser.parseMessage('INVITE sip:gled5gsn@hk95bautgaa7.invalid;transport=ws;aor=james%40onsnip.onsip.com SIP/2.0\r\nMax-Forwards: 65\r\nTo: <sip:james@onsnip.onsip.com>\r\nFrom: "test1" <sip:test1@onsnip.onsip.com>;tag=rto5ib4052\r\nCall-ID: grj0liun879lfj35evfq\r\nCSeq: 1798 INVITE\r\nContact: <sip:e55r35u3@kgu78r4e1e6j.invalid;transport=ws;ob>\r\nAllow: ACK,CANCEL,BYE,OPTIONS,INVITE,MESSAGE\r\nContent-Type: application/sdp\r\nSupported: outbound\r\nUser-Agent: JsSIP 0.4.0-devel\r\nContent-Length: 11\r\n\r\na=sendrecv\r\n', InviteContext.ua);
  });

  afterEach(function() {
    SIP.WebRTC.isSupported = webrtc;
  });

  it('initializes events', function() {
    expect(InviteContext.checkEvent('connecting')).toBeTruthy();
    expect(InviteContext.checkEvent('terminated')).toBeTruthy();
    expect(InviteContext.checkEvent('dtmf')).toBeTruthy();
    expect(InviteContext.checkEvent('invite')).toBeTruthy();
    expect(InviteContext.checkEvent('preaccepted')).toBeTruthy();
    expect(InviteContext.checkEvent('canceled')).toBeTruthy();
    expect(InviteContext.checkEvent('referred')).toBeTruthy();
    expect(InviteContext.checkEvent('bye')).toBeTruthy();
    expect(InviteContext.checkEvent('hold')).toBeTruthy();
    expect(InviteContext.checkEvent('unhold')).toBeTruthy();
    expect(InviteContext.checkEvent('muted')).toBeTruthy();
    expect(InviteContext.checkEvent('unmuted')).toBeTruthy();
  });

  it('initializes session objects', function() {
    expect(InviteContext.status).toBe(0);
    expect(InviteContext.dialog).toBeNull();
    expect(InviteContext.earlyDialogs).toBeDefined();
    expect(InviteContext.rtcMediaHandler).toBeNull();
    expect(InviteContext.mediaStream).toBeNull();
  });

  it('initializes session timers', function() {
    expect(InviteContext.timers.ackTimer).toBeNull();
    expect(InviteContext.timers.expiresTimer).toBeNull();
    expect(InviteContext.timers.invite2xxTimer).toBeNull();
    expect(InviteContext.timers.userNoAnswerTimer).toBeNull();
    expect(InviteContext.timers.rel1xxTimer).toBeNull();
    expect(InviteContext.timers.prackTimer).toBeNull();
  });

  it('initializes session info', function() {
    expect(InviteContext.startTime).toBeNull();
    expect(InviteContext.endTime).toBeNull();
    expect(InviteContext.tones).toBeNull();
  });

  it('initializes mute/hold state info', function() {
    expect(InviteContext.audioMuted).toBe(false);
    expect(InviteContext.videoMuted).toBe(false);
    expect(InviteContext.local_hold).toBe(false);
    expect(InviteContext.remote_hold).toBe(false);
  });

  it('initializes the pending actions array and functions', function() {
    expect(InviteContext.pending_actions.actions).toBeDefined();
    expect(InviteContext.pending_actions.length).toBeDefined();
    expect(InviteContext.pending_actions.isPending).toBeDefined();
    expect(InviteContext.pending_actions.shift).toBeDefined();
    expect(InviteContext.pending_actions.push).toBeDefined();
    expect(InviteContext.pending_actions.pop).toBeDefined();
  });

  describe('.pending_actions', function() {
    beforeEach(function() {
      InviteContext.pending_actions.actions = [{name: 'foo'}, {name: 'bar'}];
    });

    describe('.length', function() {
      it('returns the length', function() {
        expect(InviteContext.pending_actions.length()).toBe(2);
      });
    });

    describe('.isPending', function() {
      it('returns true for objects that are present', function() {
        expect(InviteContext.pending_actions.isPending('foo')).toBe(true);
      });

      it('returns false for objects that are not present', function() {
        expect(InviteContext.pending_actions.isPending('seven')).toBe(false);
      });
    });

    describe('.shift', function() {
      it('returns foo and leaves bar as the only element in the array', function() {
        expect(InviteContext.pending_actions.shift().name).toBe('foo');
        expect(InviteContext.pending_actions.isPending('foo')).toBe(false);
        expect(InviteContext.pending_actions.isPending('bar')).toBe(true);
      });
    });

    describe('.push', function() {
      it('adds seven to the array', function() {
        InviteContext.pending_actions.push('seven');
        expect(InviteContext.pending_actions.isPending('seven')).toBe(true);
      });
    });

    describe('.pop', function() {
      it('removes foo from the array', function() {
        InviteContext.pending_actions.pop('foo');
        expect(InviteContext.pending_actions.isPending('foo')).toBe(false);
        expect(InviteContext.pending_actions.isPending('bar')).toBe(true);
      });
    });
  });

  it('initializes media_constraints, early_sdp, and rel100', function() {
    expect(InviteContext.media_constraints).toBeDefined();
    expect(InviteContext.early_sdp).toBeNull();
    expect(InviteContext.rel100).toBeDefined();
  });

  describe('.sendDTMF', function() {
    var tones;

    beforeEach(function() {
      tones = 1;

      InviteContext.dialog = new SIP.Dialog(InviteContext, message, 'UAC');
      spyOn(InviteContext.dialog, 'sendRequest').andReturn('sent');

      InviteContext.status = 12;
    });

    it('throws an error if tones is undefined', function() {
      expect(function(){InviteContext.sendDTMF(undefined);}).toThrow('Not enough arguments');
    });

    it('throws an error if the session status is incorrect', function() {
      InviteContext.status = 0;
      expect(function(){InviteContext.sendDTMF(1);}).toThrow('Invalid status: 0');
    });

    it('throws an error if tones is the wrong type', function() {
      expect(function(){InviteContext.sendDTMF(1);}).not.toThrow('Invalid tones: 1');
      expect(function(){InviteContext.sendDTMF('one');}).toThrow('Invalid tones: one');
      expect(function(){InviteContext.sendDTMF(true);}).toThrow('Invalid tones: true');
    });

    it('accepts a string argument', function() {
      expect(function(){InviteContext.sendDTMF('1');}).not.toThrow('Invalid tones: 1');
    });

    it('throws an error if tone duration is invalid', function() {
      expect(function(){InviteContext.sendDTMF(1, {duration: 'six'});}).toThrow('Invalid tone duration: six');
    });

    it('resets duration to 70 if it\'s too low', function() {
      var options = {duration: 7};
      InviteContext.sendDTMF(1, options);
      expect(options.duration).toBe(70);
    });

    it('resets duration to 6000 if it\'s too high', function() {
      var options = {duration: 7000};
      InviteContext.sendDTMF(1, options);
      expect(options.duration).toBe(6000);
    });

    it('resets duration to positive if it\'s negative', function() {
      var options = {duration: -700};
      InviteContext.sendDTMF(1, options);
      expect(options.duration).toBe(70);
    });

    it('throws an error if interToneGap is invalid', function() {
      expect(function(){InviteContext.sendDTMF(1, {interToneGap: 'six'});}).toThrow('Invalid interToneGap: six');
    });

    it('queues up tones if tones are already queued', function() {
      InviteContext.tones = '123';
      InviteContext.sendDTMF('4');
      expect(InviteContext.tones).toBe('1234');
    });

    it('sets tones if no tones are queued', function() {
      InviteContext.tones = '';
      InviteContext.sendDTMF('4');
      expect(InviteContext.tones).toBe('4');
    });

    it('returns InviteContext on success', function() {
      expect(InviteContext.sendDTMF(1)).toBe(InviteContext);
    });
  });

  describe('.bye', function() {
    beforeEach(function() {
      InviteContext.dialog = new SIP.Dialog(InviteContext, message, 'UAC');
      spyOn(InviteContext.dialog, 'sendRequest');

      spyOn(InviteContext,'emit')
      InviteContext.status = 12;
    });

    it('throws an error if the session status is terminated', function() {
      InviteContext.status = 9;
      expect(function(){InviteContext.bye();}).toThrow('Invalid status: 9');
    });

    it('emits bye and terminated on any status code >= 200', function() {
      spyOn(InviteContext, 'terminated');
      spyOn(InviteContext, 'close');

      for (var i = 200; i < 700; i++) {
        InviteContext.bye({status_code: i});

        expect(InviteContext.emit).toHaveBeenCalledWith('bye', {code: i, cause: SIP.C.REASON_PHRASE[i] || ''});
        expect(InviteContext.terminated).toHaveBeenCalled();
        
        InviteContext.emit.reset();
        InviteContext.terminated.reset();
      }
    });

    it('throws an error for any other status code', function() {
      for (var i = 100; i < 200; i++) {
        expect(function(){InviteContext.bye({status_code: i});}).toThrow('Invalid status_code: ' + i);
      }
    });
  });

  describe('.refer', function() {
    var target;

    beforeEach(function() {
      target = 'target';

      InviteContext.status = 12;
    });

    it('throws an error if target is undefined', function() {
      expect(function(){InviteContext.refer(undefined);}).toThrow('Not enough arguments');
    });

    it('throws an error if target is not an InviteContext and status is not confirmed', function() {
      InviteContext.status = 0;
      expect(function(){InviteContext.refer(target);}).toThrow('Invalid status: 0');
    });

    it('returns InviteContext on success', function() {
      spyOn(SIP.URI, 'parse').andReturn(true);
      spyOn(SIP.Utils, 'getAllowedMethods').andReturn(true);

      InviteContext.dialog = new SIP.Dialog(InviteContext, message, 'UAC');
      spyOn(InviteContext.dialog, 'sendRequest').andReturn('sent');

      expect(InviteContext.refer(target)).toBe(InviteContext);
    });
  });

  describe('.sendRequest', function() {
    var method;

    it('returns InviteContext on success', function() {
      method = 'method';
      InviteContext.status = 12;

      spyOn(SIP.Utils, 'getAllowedMethods').andReturn(true);

      InviteContext.dialog = new SIP.Dialog(InviteContext, message, 'UAC');
      spyOn(InviteContext.dialog, 'sendRequest').andReturn('sent');

      expect(InviteContext.sendRequest(method)).toBe(InviteContext);
    });
  });

  describe('.getLocalStreams', function() { 
    it('returns RTCMediaHandler', function() {
      InviteContext.rtcMediaHandler = {peerConnection: {getLocalStreams: jasmine.createSpy('getLocalStreams').andReturn('correct')}};

      expect(InviteContext.getLocalStreams()).toBe('correct');
    });
  });

  describe('.getRemoteStreams', function() { 
    it('returns RTCMediaHandler', function() {
      InviteContext.rtcMediaHandler = {peerConnection: {getRemoteStreams: jasmine.createSpy('getRemoteStreams').andReturn('correct')}};

      expect(InviteContext.getRemoteStreams()).toBe('correct');
    });
  });

  describe('.close', function() {
    beforeEach(function() {
      InviteContext.rtcMediaHandler = {close: jasmine.createSpy('close').andReturn(true)};

      InviteContext.dialog = new SIP.Dialog(InviteContext, message, 'UAC');
      spyOn(InviteContext.dialog, 'terminate').andReturn(true);

      InviteContext.status = 12;
    });

    it('returns InviteContext if the status is terminated', function() {
      InviteContext.status = 9;
      expect(InviteContext.close()).toBe(InviteContext);
    });

    it('deletes the session from the ua, deletes the dialog, and returns the InviteContext on success', function() {
      InviteContext.id = 777;
      InviteContext.ua.sessions = [{777: InviteContext}];

      expect(InviteContext.close()).toBe(InviteContext);
      expect(InviteContext.dialog).toBeUndefined();
      expect(InviteContext.ua.sessions[777]).toBeUndefined();
    });
  });

  describe('.createDialog', function() {
    var Cid, Sid;

    beforeEach(function() {
      sipDialogCleanup = SIP.Dialog;

      Sid = message.call_id + message.to_tag + message.from_tag;
      Cid = message.call_id + message.from_tag + message.to_tag;

      SIP.Dialog.C =  {STATUS_EARLY: 0};
    });

    it('returns true and puts the dialog in the early dialogs array on a success call with early = true, type = UAS', function() {
      expect(InviteContext.createDialog(message, 'UAS', true)).toBe(true);
      expect(InviteContext.earlyDialogs[Sid]).toBeDefined();
    });

    it('returns true and puts the dialog in the early dialogs array on a success call with early = true, type = UAC', function() {
      expect(InviteContext.createDialog(message, 'UAC', true)).toBe(true);
      expect(InviteContext.earlyDialogs[Cid]).toBeDefined();
    });

    it('returns false if early_dialog.error is true when early = true', function(){
      SIP.Dialog = jasmine.createSpy('errorSpy').andReturn({ error: true, update: function(x, y) {return true;} });
      SIP.Dialog.C =  {STATUS_EARLY: 0};

      spyOn(InviteContext, 'failed').andReturn(true);

      expect(InviteContext.createDialog(message, 'UAC', true)).toBe(false);

      SIP.Dialog = sipDialogCleanup;
    });

    it('creates an early dialog, then updates it; returns true, no longer in early dialog array', function() {
      expect(InviteContext.createDialog(message, 'UAC', true)).toBe(true);
      expect(InviteContext.earlyDialogs[Cid]).toBeDefined();
      
      expect(InviteContext.createDialog(message, 'UAC', false)).toBe(true);
      expect(InviteContext.earlyDialogs[Cid]).toBeUndefined();
    });

    it('returns false if dialog.error is true when early = false', function() {
      SIP.Dialog = jasmine.createSpy('errorSpy').andReturn({ error: true, update: function(x, y) {return true;} });
      SIP.Dialog.C =  {STATUS_EARLY: 0};

      spyOn(InviteContext, 'failed').andReturn(true);

      expect(InviteContext.createDialog(message, 'UAC', false)).toBe(false);

      SIP.Dialog = sipDialogCleanup;
    });

    it('returns true on a call where early = false', function() {
      expect(InviteContext.createDialog(message, 'UAC', false)).toBe(true);
    });
  });

  describe('.isReadyToReinvite', function() {
    beforeEach(function() {
      InviteContext.rtcMediaHandler = {isReady: jasmine.createSpy('isReady').andReturn(true)};

      InviteContext.dialog = new SIP.Dialog(InviteContext, message, 'UAC');
    });

    it('returns false if rtcMediaHandler.isReady() returns false', function() {
      InviteContext.rtcMediaHandler.isReady.andReturn(false);

      expect(InviteContext.isReadyToReinvite()).toBe(false);
    });

    it('returns false if either of the pending_reply options are true', function() {
      InviteContext.dialog.uac_pending_reply = true;
      expect(InviteContext.isReadyToReinvite()).toBe(false);

      InviteContext.dialog.uac_pending_reply = false;
      InviteContext.dialog.uas_pending_reply = true;
      expect(InviteContext.isReadyToReinvite()).toBe(false);
    });

    it('returns true if all above conditions are met', function() {
      expect(InviteContext.isReadyToReinvite()).toBe(true);
    });
  });

  describe('.mute', function() {
    beforeEach(function() {
      InviteContext.audioMuted = false;
      InviteContext.videoMuted = false;

      InviteContext.rtcMediaHandler = {peerConnection: {getLocalStreams: jasmine.createSpy('getLocalStreams').andReturn([ {
        getAudioTracks: function() {return [7];}, 
        getVideoTracks: function() {return [7];}
      }])}};

      spyOn(InviteContext, 'toggleMuteAudio').andReturn(true);
      spyOn(InviteContext, 'toggleMuteVideo').andReturn(true);

      spyOn(InviteContext, 'emit');
    });

    it('sets audio and video muted to true if they are both present (no options)', function() {
      InviteContext.mute();

      expect(InviteContext.audioMuted).toBe(true);
      expect(InviteContext.videoMuted).toBe(true);
      expect(InviteContext.emit.calls[0].args[0]).toBe('muted');
    });

    it('sets audio and video muted to true if they are both present (options)', function() {
      InviteContext.mute({audio: true, video: true});

      expect(InviteContext.audioMuted).toBe(true);
      expect(InviteContext.videoMuted).toBe(true);
      expect(InviteContext.emit.calls[0].args[0]).toBe('muted');
    });

    it('only sets video if audio is not present', function() {
      InviteContext.mute({audio: false, video: true});

      expect(InviteContext.audioMuted).toBe(false);
      expect(InviteContext.videoMuted).toBe(true);
      expect(InviteContext.emit.calls[0].args[0]).toBe('muted');
    });

    it('only sets audio if video is not present', function() {
      InviteContext.mute({audio: true, video: false});

      expect(InviteContext.audioMuted).toBe(true);
      expect(InviteContext.videoMuted).toBe(false);
      expect(InviteContext.emit.calls[0].args[0]).toBe('muted');
    });

    it('sets neither if neither is present and does not emit muted', function() {
      InviteContext.mute({audio: false, video: false});

      expect(InviteContext.audioMuted).toBe(false);
      expect(InviteContext.videoMuted).toBe(false);
      expect(InviteContext.emit).not.toHaveBeenCalled();
    });

    it('sets neither if both are already muted and does not emit muted', function() {
      InviteContext.audioMuted = true;
      InviteContext.videoMuted = true;

      InviteContext.mute({audio: true, video: true});

      expect(InviteContext.audioMuted).toBe(true);
      expect(InviteContext.videoMuted).toBe(true);
      expect(InviteContext.emit).not.toHaveBeenCalled();
    });
  });

  describe('.unmute', function() {
    beforeEach(function() {
      InviteContext.audioMuted = true;
      InviteContext.videoMuted = true;
      InviteContext.local_hold = false;

      InviteContext.rtcMediaHandler = {peerConnection: {getLocalStreams: jasmine.createSpy('getLocalStreams').andReturn([ {
        getAudioTracks: function() {return [7];}, 
        getVideoTracks: function() {return [7];}
      }])}};

      spyOn(InviteContext, 'toggleMuteAudio').andReturn(true);
      spyOn(InviteContext, 'toggleMuteVideo').andReturn(true);

      spyOn(InviteContext, 'emit');
    });

    it('sets audio and video muted to false if they are both present (no options)', function() {
      InviteContext.unmute();

      expect(InviteContext.audioMuted).toBe(false);
      expect(InviteContext.videoMuted).toBe(false);
      expect(InviteContext.emit.calls[0].args[0]).toBe('unmuted');
    });

    it('sets audio and video muted to false if they are both present (options)', function() {
      InviteContext.unmute({audio: true, video: true});

      expect(InviteContext.audioMuted).toBe(false);
      expect(InviteContext.videoMuted).toBe(false);
      expect(InviteContext.emit.calls[0].args[0]).toBe('unmuted');
    });

    it('only sets video if audio is not present', function() {
      InviteContext.unmute({audio: false, video: true});

      expect(InviteContext.audioMuted).toBe(true);
      expect(InviteContext.videoMuted).toBe(false);
      expect(InviteContext.emit.calls[0].args[0]).toBe('unmuted');
    });

    it('onlys set audio if video is not present', function() {
      InviteContext.unmute({audio: true, video: false});

      expect(InviteContext.audioMuted).toBe(false);
      expect(InviteContext.videoMuted).toBe(true);
      expect(InviteContext.emit.calls[0].args[0]).toBe('unmuted');
    });

    it('sets neither if neither is present and does not emit unmuted', function() {
      InviteContext.unmute({audio: false, video: false});

      expect(InviteContext.audioMuted).toBe(true);
      expect(InviteContext.videoMuted).toBe(true);
      expect(InviteContext.emit).not.toHaveBeenCalled();
    });

    it('sets neither if both are already unmuted and does not emit unmuted', function() {
      InviteContext.audioMuted = false;
      InviteContext.videoMuted = false;

      InviteContext.unmute({audio: true, video: true});

      expect(InviteContext.audioMuted).toBe(false);
      expect(InviteContext.videoMuted).toBe(false);
      expect(InviteContext.emit).not.toHaveBeenCalled();
    });

    //Note: the local_hold conditional doesn't change anything in terms of this code; as long as
    //the variables are set properly the hold code will work properly with this.
  });

  describe('.isMuted', function() {
    var result;

    it('returns the audioMuted and videoMuted variables', function() {
      InviteContext.audioMuted = 'audio';
      InviteContext.videoMuted = 'video';

      expect(InviteContext.isMuted()).toEqual({audio: 'audio', video: 'video'});
    });
  });

  describe('.toggleMuteAudio', function() {
    var change;

    beforeEach(function() {
      change = {enabled: true};

      spyOn(InviteContext, 'getLocalStreams').andReturn([{getAudioTracks: function() { return [change]; }}]);
    });

    it('sets enabled to false', function() {
      expect(InviteContext.getLocalStreams()[0].getAudioTracks()[0].enabled).toBe(true);
      InviteContext.toggleMuteAudio(true);
      expect(InviteContext.getLocalStreams()[0].getAudioTracks()[0].enabled).toBe(false);
    });

    it('sets enabled to true', function() {
      change = {enabled: false};

      expect(InviteContext.getLocalStreams()[0].getAudioTracks()[0].enabled).toBe(false);
      InviteContext.toggleMuteAudio(false);
      expect(InviteContext.getLocalStreams()[0].getAudioTracks()[0].enabled).toBe(true);
    });

    it('does not set enabled', function() {
      expect(InviteContext.getLocalStreams()[0].getAudioTracks()[0].enabled).toBe(true);
      InviteContext.toggleMuteAudio(false);
      expect(InviteContext.getLocalStreams()[0].getAudioTracks()[0].enabled).toBe(true);
    });
  });

  describe('.toggleMuteVideo', function() {
    var change;

    beforeEach(function() {
      change = {enabled: true};

      spyOn(InviteContext, 'getLocalStreams').andReturn([{getVideoTracks: function() { return [change]; }}]);
    });

    it('sets enabled to false', function() {
      expect(InviteContext.getLocalStreams()[0].getVideoTracks()[0].enabled).toBe(true);
      InviteContext.toggleMuteVideo(true);
      expect(InviteContext.getLocalStreams()[0].getVideoTracks()[0].enabled).toBe(false);
    });

    it('sets enabled to true', function() {
      change = {enabled: false};

      expect(InviteContext.getLocalStreams()[0].getVideoTracks()[0].enabled).toBe(false);
      InviteContext.toggleMuteVideo(false);
      expect(InviteContext.getLocalStreams()[0].getVideoTracks()[0].enabled).toBe(true);
    });

    it('does not set enabled', function() {
      expect(InviteContext.getLocalStreams()[0].getVideoTracks()[0].enabled).toBe(true);
      InviteContext.toggleMuteVideo(false);
      expect(InviteContext.getLocalStreams()[0].getVideoTracks()[0].enabled).toBe(true);
    });
  });

  describe('.hold', function() {

    beforeEach(function() {
      spyOn(InviteContext, 'emit');
      InviteContext.status = 12;

      spyOn(InviteContext, 'isReadyToReinvite').andReturn(true);

      spyOn(InviteContext, 'toggleMuteAudio');
      spyOn(InviteContext, 'toggleMuteVideo');
      spyOn(InviteContext, 'sendReinvite');
    });

    it('throws an error if the session is in the incorrect state', function() {
      InviteContext.status = 0;

      expect(function(){InviteContext.hold()}).toThrow('Invalid status: 0');
    });

    //Note: the pending actions conditionals were skipped because it wouldn't test
    //anything in relation to this function.

    it('does not emit hold if local hold is true', function() {
      InviteContext.local_hold = true;

      InviteContext.hold();

      expect(InviteContext.emit).not.toHaveBeenCalled();
    });

    it('emits hold on success', function() {
      InviteContext.hold();

      expect(InviteContext.emit.calls[0].args[0]).toBe('hold');
    });
  });

  describe('.unhold', function() {
    beforeEach(function() {
      spyOn(InviteContext, 'emit');
      InviteContext.status = 12;
      InviteContext.local_hold = true;
      InviteContext.audioMuted = true;
      InviteContext.videoMuted = true;

      spyOn(InviteContext, 'isReadyToReinvite').andReturn(true);

      spyOn(InviteContext, 'sendReinvite');
    });

    //Note: the pending actions conditionals were skipped because it wouldn't test
    //anything in relation to this function.

    it('throws an error if the session is in the incorrect state', function() {
      InviteContext.status = 0;

      expect(function(){InviteContext.unhold()}).toThrow('Invalid status: 0');
    });

    it('does not emit unhold if local hold is false', function() {
      InviteContext.local_hold = false;

      InviteContext.unhold();

      expect(InviteContext.emit).not.toHaveBeenCalled();
    });

    it('emits unhold on success', function() {
      InviteContext.unhold();

      expect(InviteContext.emit.calls[0].args[0]).toBe('unhold');
    });
  });

  describe('.isOnHold', function() {
    it('should return the values of local_hold and remote_hold', function() {
      InviteContext.local_hold = 'local';
      InviteContext.remote_hold = 'remote';

      expect(InviteContext.isOnHold()).toEqual({local: 'local', remote: 'remote'});
    });
  });

  describe('.receiveReinvite', function() {
    var request;

    beforeEach(function() {
      spyOn(InviteContext, 'emit');
      InviteContext.rtcMediaHandler = {onMessage: jasmine.createSpy('onMessage')};
    });

    it('does not call onMessage and replies with 415 if contentType is not application/sdp', function() {
      spyOn(message, 'getHeader').andReturn('incorrect');
      spyOn(message, 'reply');

      InviteContext.receiveReinvite(message);

      expect(InviteContext.rtcMediaHandler.onMessage).not.toHaveBeenCalled();
      expect(message.reply).toHaveBeenCalledWith(415);
    });

    it('calls onMessage on success', function() {
      spyOn(SIP.Parser, 'parseSDP').andReturn({media: []});

      InviteContext.receiveReinvite(message);

      expect(InviteContext.rtcMediaHandler.onMessage).toHaveBeenCalled();
    });
  });

  describe('.sendReinvite', function() {
    beforeEach(function() {
      InviteContext.rtcMediaHandler = {createOffer: jasmine.createSpy('createOffer').andReturn(true)};
      spyOn(SIP.Utils, 'getAllowedMethods').andReturn(true);
    });

    it('on success, sets receiveResponse, reinviteSucceeded, and reinviteFailed, and calls createOffer', function(){
      InviteContext.sendReinvite();

      expect(InviteContext.rtcMediaHandler.createOffer).toHaveBeenCalled();
      expect(InviteContext.receiveResponse).toBe(InviteContext.receiveReinviteResponse);
      expect(InviteContext.reinviteSucceeded).toBeDefined();
      expect(InviteContext.reinviteFailed).toBeDefined();
    });
  });

  describe('.receiveReinviteResponse', function() {
    beforeEach(function() {
      InviteContext.status = 12;

      InviteContext.reinviteFailed = jasmine.createSpy('reinviteFailed');

      spyOn(InviteContext, 'sendRequest');

      InviteContext.rtcMediaHandler = {onMessage: jasmine.createSpy('onMessage').andReturn(true)};
    });

    it('returns without calling sendRequest or reinviteFailed when status is terminated', function() {
      InviteContext.status = 9;

      InviteContext.receiveReinviteResponse(message);

      expect(InviteContext.sendRequest).not.toHaveBeenCalled();
      expect(InviteContext.reinviteFailed).not.toHaveBeenCalled();
      expect(InviteContext.rtcMediaHandler.onMessage).not.toHaveBeenCalled();
    });

    it('returns without calling sendRequest or reinviteFailed when response status code is 1xx', function() {
      message.status_code = 111;

      InviteContext.receiveReinviteResponse(message);

      expect(InviteContext.sendRequest).not.toHaveBeenCalled();
      expect(InviteContext.reinviteFailed).not.toHaveBeenCalled();
      expect(InviteContext.rtcMediaHandler.onMessage).not.toHaveBeenCalled();
    });

    it('calls reInviteFailed when the response has no body with a 2xx status code', function() {
      message.body = null;
      message.status_code = 222;

      InviteContext.receiveReinviteResponse(message);

      expect(InviteContext.reinviteFailed).toHaveBeenCalled()
      expect(InviteContext.sendRequest).toHaveBeenCalled()
      expect(InviteContext.rtcMediaHandler.onMessage).not.toHaveBeenCalled();
    });

    it('calls reInviteFailed when the response\'s content-type is not application/sdp with a 2xx status code', function() {
      spyOn(message, 'getHeader').andReturn('wrong');
      message.status_code = 222;

      InviteContext.receiveReinviteResponse(message);

      expect(InviteContext.reinviteFailed).toHaveBeenCalled()
      expect(InviteContext.sendRequest).toHaveBeenCalled();
      expect(InviteContext.rtcMediaHandler.onMessage).not.toHaveBeenCalled();
    });

    it('calls sendRequest and onMessage when response has a 2xx status code, a body, and content-type of application/sdp', function() {
      message.status_code = 222;

      InviteContext.receiveReinviteResponse(message);

      expect(InviteContext.reinviteFailed).not.toHaveBeenCalled();
      expect(InviteContext.sendRequest).toHaveBeenCalled();
      expect(InviteContext.rtcMediaHandler.onMessage).toHaveBeenCalled();
    });

    it('returns without calling sendRequest or reinviteFailed when response status code is neither 1xx or 2xx', function() {
      message.status_code = 333;

      InviteContext.receiveReinviteResponse(message);

      expect(InviteContext.sendRequest).not.toHaveBeenCalled();
      expect(InviteContext.reinviteFailed).toHaveBeenCalled();
      expect(InviteContext.rtcMediaHandler.onMessage).not.toHaveBeenCalled();
    });
  });

  describe('.acceptAndTerminate', function() {
    beforeEach(function() {
      InviteContext.dialog = new SIP.Dialog(InviteContext, message, 'UAC');
        
      spyOn(InviteContext, 'createDialog').andReturn(true);
      spyOn(InviteContext, 'sendRequest');
    });

    it('calls sendRequest twice and returns InviteContext on success', function() {
      expect(InviteContext.acceptAndTerminate(message)).toBe(InviteContext);

      expect(InviteContext.sendRequest.calls.length).toBe(2);
    });

    it('calls createDialog if this.dialog is null', function() {
      InviteContext.dialog = null;

      expect(InviteContext.acceptAndTerminate(message)).toBe(InviteContext);

      expect(InviteContext.createDialog).toHaveBeenCalled();
      expect(InviteContext.sendRequest.calls.length).toBe(2);
    });
  });

  describe('.setInvite2xxTimer', function() {
    it('defines timers.invite2xxTimer', function() {
      InviteContext.setInvite2xxTimer(null, null);

      expect(InviteContext.timers.invite2xxTimer).toBeDefined();
    });
  });

  describe('.setACKTimer', function() {
    it('defines timers.ackTimer', function() {
      InviteContext.setACKTimer(null, null);

      expect(InviteContext.timers.ackTimer).toBeDefined();
    });
  });

  describe('.onReadyToReinvite', function() {
    beforeEach(function() {
      spyOn(InviteContext, 'hold');
      spyOn(InviteContext, 'unhold');
    });

    it('returns without calling hold/unhold if pending_actions is empty', function() {
      InviteContext.onReadyToReinvite();

      expect(InviteContext.hold).not.toHaveBeenCalled();
      expect(InviteContext.unhold).not.toHaveBeenCalled();
    });

    it('calls hold if that is the next action', function() {
      InviteContext.pending_actions.push('hold');

      InviteContext.onReadyToReinvite();

      expect(InviteContext.hold).toHaveBeenCalled();
      expect(InviteContext.unhold).not.toHaveBeenCalled();
    });

    it('calls unhold if that is the next action', function() {
      InviteContext.pending_actions.push('unhold');

      InviteContext.onReadyToReinvite();

      expect(InviteContext.hold).not.toHaveBeenCalled();
      expect(InviteContext.unhold).toHaveBeenCalled();
    });
  });

  describe('.onTransportError', function() {
    beforeEach(function() {
      spyOn(InviteContext, 'terminated');
      spyOn(InviteContext, 'failed');
    });

    it('does not call failed or terminated if the status is terminated', function() {
      InviteContext.status = 9;

      InviteContext.onTransportError();

      expect(InviteContext.failed).not.toHaveBeenCalled();
      expect(InviteContext.terminated).not.toHaveBeenCalled();;
    });

    it('calls terminated if the status is confirmed', function() {
      InviteContext.status = 12;

      InviteContext.onTransportError();

      expect(InviteContext.terminated).toHaveBeenCalled();;
      expect(InviteContext.failed).not.toHaveBeenCalled();;
    });

    it('calls failed if the status is neither terminated or confirmed', function() {
      InviteContext.status = 11;

      InviteContext.onTransportError();

      expect(InviteContext.failed).toHaveBeenCalled();
      expect(InviteContext.terminated).not.toHaveBeenCalled();
    });
  });

  describe('.onRequestTimeout', function() {
    beforeEach(function() {
      spyOn(InviteContext, 'terminated');
      spyOn(InviteContext, 'failed');
    });

    it('does not call failed or terminated if the status is terminated', function() {
      InviteContext.status = 9;

      InviteContext.onRequestTimeout();

      expect(InviteContext.failed).not.toHaveBeenCalled();
      expect(InviteContext.terminated).not.toHaveBeenCalled();
    });

    it('calls terminated if the status is confirmed', function() {
      InviteContext.status = 12;

      InviteContext.onRequestTimeout();

      expect(InviteContext.terminated).toHaveBeenCalled();
      expect(InviteContext.failed).not.toHaveBeenCalled();
    });

    it('calls failed if the status is neither terminated or confirmed', function() {
      InviteContext.status = 11;

      InviteContext.onRequestTimeout();

      expect(InviteContext.failed).toHaveBeenCalled();
      expect(InviteContext.terminated).not.toHaveBeenCalled();
    });
  });

  describe('.onDialogError', function() {
    beforeEach(function() {
      spyOn(InviteContext, 'terminated');
      spyOn(InviteContext, 'failed');
    });

    it('does not call failed or terminated if the status is terminated', function() {
      InviteContext.status = 9;

      InviteContext.onDialogError();

      expect(InviteContext.failed).not.toHaveBeenCalled();
      expect(InviteContext.terminated).not.toHaveBeenCalled();
    });

    it('calls terminated if the status is confirmed', function() {
      InviteContext.status = 12;

      InviteContext.onDialogError();

      expect(InviteContext.terminated).toHaveBeenCalled();
      expect(InviteContext.failed).not.toHaveBeenCalled();
    });

    it('calls failed if the status is neither terminated or confirmed', function() {
      InviteContext.status = 11;

      InviteContext.onDialogError();

      expect(InviteContext.failed).toHaveBeenCalled();
      expect(InviteContext.terminated).not.toHaveBeenCalled();
    });
  });

  describe('.onhold', function() {
    beforeEach(function() {
      InviteContext.local_hold = false;
      InviteContext.remote_hold = false;

      spyOn(InviteContext, 'emit');
    });

    it('sets local_hold to true and emits hold when originator is local', function(){
      expect(InviteContext.local_hold).toBe(false);

      InviteContext.onhold('local');

      expect(InviteContext.local_hold).toBe(true);
      expect(InviteContext.emit.calls[0].args[0]).toBe('hold');
    });

    it('sets remote_hold to true and emits hold when originator is remote', function(){
      expect(InviteContext.remote_hold).toBe(false);

      InviteContext.onhold('remote');

      expect(InviteContext.remote_hold).toBe(true);
      expect(InviteContext.emit.calls[0].args[0]).toBe('hold');
    });
  });

  describe('.onunhold', function() {
    beforeEach(function() {
      InviteContext.local_hold = true;
      InviteContext.remote_hold = true;
      
      spyOn(InviteContext, 'emit');
    });

    it('sets local_hold to false and emits unhold when originator is local', function(){
      expect(InviteContext.local_hold).toBe(true);

      InviteContext.onunhold('local');

      expect(InviteContext.local_hold).toBe(false);
      expect(InviteContext.emit.calls[0].args[0]).toBe('unhold');
    });

    it('sets remote_hold to false and emit unhold when originator is remote', function(){
      expect(InviteContext.remote_hold).toBe(true);

      InviteContext.onunhold('remote');

      expect(InviteContext.remote_hold).toBe(false);
      expect(InviteContext.emit.calls[0].args[0]).toBe('unhold');
    });
  });

  describe('.onmute', function() {
    it('emits muted', function() {
      spyOn(InviteContext, 'emit');

      InviteContext.onmute({audio: true, video: true});

      expect(InviteContext.emit.calls[0].args[0]).toBe('muted');
    });
  });

  describe('.onunmute', function() {
    it('emits unmuted', function() {
      spyOn(InviteContext, 'emit');

      InviteContext.onunmute({audio: true, video: true});

      expect(InviteContext.emit.calls[0].args[0]).toBe('unmuted');
    });
  });

  describe('.failed', function() {
    beforeEach(function() {
      spyOn(InviteContext, 'close');
      spyOn(InviteContext, 'emit');
    });

    it('calls close, emits, and returns InviteContext', function() {
      expect(InviteContext.failed()).toBe(InviteContext);

      expect(InviteContext.close).toHaveBeenCalled();
      expect(InviteContext.emit.calls[0].args[0]).toBe('failed');
    });
  });

  describe('.rejected', function() {
    beforeEach(function() {
      spyOn(InviteContext, 'close');
      spyOn(InviteContext, 'emit');
    });

    it('calls close, emits, and returns InviteContext', function() {
      expect(InviteContext.rejected()).toBe(InviteContext);

      expect(InviteContext.close).toHaveBeenCalled();
      expect(InviteContext.emit.calls[0].args[0]).toBe('rejected');
    });
  });

  describe('.referred', function() {
    beforeEach(function() {
      spyOn(InviteContext, 'emit');
    });

    it('emits and returns InviteContext', function() {
      expect(InviteContext.referred()).toBe(InviteContext);

      expect(InviteContext.emit.calls[0].args[0]).toBe('referred');
    });
  });

  describe('.canceled', function() {
    beforeEach(function() {
      spyOn(InviteContext, 'close');
      spyOn(InviteContext, 'emit');
    });

    it('calls close, emits, and returns InviteContext', function() {
      expect(InviteContext.canceled()).toBe(InviteContext);

      expect(InviteContext.close).toHaveBeenCalled();
      expect(InviteContext.emit.calls[0].args[0]).toBe('canceled');
    });
  });

  describe('.accepted', function() {
    beforeEach(function() {
      spyOn(InviteContext, 'emit');
    });

    it('calls emit, sets a startTime, and returns InviteContext', function() {
      expect(InviteContext.accepted()).toBe(InviteContext);

      expect(InviteContext.startTime).toBeDefined();
      expect(InviteContext.emit.calls[0].args[0]).toBe('accepted');
    });
  });

  describe('.terminated', function() {
    beforeEach(function() {
      spyOn(InviteContext, 'close');
      spyOn(InviteContext, 'emit');
    });

    it('calls close, emits, sets an endTime, and returns InviteContext', function() {
      expect(InviteContext.terminated()).toBe(InviteContext);

      expect(InviteContext.endTime).toBeDefined();
      expect(InviteContext.close).toHaveBeenCalled();
      expect(InviteContext.emit.calls[0].args[0]).toBe('terminated');
    });
  });

  describe('.connecting', function() {
    beforeEach(function() {
      spyOn(InviteContext, 'emit');
    });

    it('calls emit', function() {
      InviteContext.connecting();

      expect(InviteContext.emit.calls[0].args[0]).toBe('connecting');
    });
  });
});

describe('InviteServerContext', function() {
  var InviteServerContext;
  var ua;
  var request;
  var webrtc;

  beforeEach(function(){
    webrtc = SIP.WebRTC.isSupported;
    if(!webrtc) {
      SIP.WebRTC.isSupported = true;
      SIP.WebRTC.RTCPeerConnection = jasmine.createSpy('RTCPeerConnection');
      SIP.WebRTC.RTCPeerConnection.prototype.setRemoteDescription = jasmine.createSpy('setRemoteDescription');
      SIP.WebRTC.RTCPeerConnection.prototype.close = jasmine.createSpy('close');
      SIP.WebRTC.RTCSessionDescription = jasmine.createSpy('RTCSessionDescription');
      SIP.WebRTC.getUserMedia = jasmine.createSpy('getUserMedia');
    }

    ua = new SIP.UA({uri: 'alice@example.com', ws_servers: 'ws:server.example.com'});

    request = SIP.Parser.parseMessage('INVITE sip:gled5gsn@hk95bautgaa7.invalid;transport=ws;aor=james%40onsnip.onsip.com SIP/2.0\r\nMax-Forwards: 65\r\nTo: <sip:james@onsnip.onsip.com>\r\nFrom: "test1" <sip:test1@onsnip.onsip.com>;tag=rto5ib4052\r\nCall-ID: grj0liun879lfj35evfq\r\nCSeq: 1798 INVITE\r\nContact: <sip:e55r35u3@kgu78r4e1e6j.invalid;transport=ws;ob>\r\nAllow: ACK,CANCEL,BYE,OPTIONS,INVITE,MESSAGE\r\nContent-Type: application/sdp\r\nSupported: outbound\r\nUser-Agent: JsSIP 0.4.0-devel\r\nContent-Length: 11\r\n\r\na=sendrecv\r\n', ua);

    spyOn(request, 'reply');

    InviteServerContext = new SIP.InviteServerContext(ua,request);
  });

  afterEach(function() {
    SIP.WebRTC.isSupported = webrtc;
  });

  it('sets contentDisp correctly', function() {
    expect(InviteServerContext.ContentDisp).toBeUndefined();
  });

  it('returns from non-application/sdp content-type with a session content-disp', function() {
    request = SIP.Parser.parseMessage('INVITE sip:gled5gsn@hk95bautgaa7.invalid;transport=ws;aor=james%40onsnip.onsip.com SIP/2.0\r\nMax-Forwards: 65\r\nTo: <sip:james@onsnip.onsip.com>\r\nFrom: "test1" <sip:test1@onsnip.onsip.com>;tag=rto5ib4052\r\nCall-ID: grj0liun879lfj35evfq\r\nCSeq: 1798 INVITE\r\nContact: <sip:e55r35u3@kgu78r4e1e6j.invalid;transport=ws;ob>\r\nAllow: ACK,CANCEL,BYE,OPTIONS,INVITE,MESSAGE\r\nContent-Type: application/json\r\nContent-Disposition: session\r\nSupported: outbound\r\nUser-Agent: JsSIP 0.4.0-devel\r\nContent-Length: 11\r\n\r\na=sendrecv\r\n', ua);
    spyOn(request, 'reply');
    
    var ISC = new SIP.InviteServerContext(ua, request);

    expect(request.reply).toHaveBeenCalledWith(415);
  });

  it('returns from non-application/sdp content-type with a session content-disp', function() {
    request = SIP.Parser.parseMessage('INVITE sip:gled5gsn@hk95bautgaa7.invalid;transport=ws;aor=james%40onsnip.onsip.com SIP/2.0\r\nMax-Forwards: 65\r\nTo: <sip:james@onsnip.onsip.com>\r\nFrom: "test1" <sip:test1@onsnip.onsip.com>;tag=rto5ib4052\r\nCall-ID: grj0liun879lfj35evfq\r\nCSeq: 1798 INVITE\r\nContact: <sip:e55r35u3@kgu78r4e1e6j.invalid;transport=ws;ob>\r\nAllow: ACK,CANCEL,BYE,OPTIONS,INVITE,MESSAGE\r\nContent-Type: application/json\r\nContent-Disposition: render\r\nSupported: outbound\r\nUser-Agent: JsSIP 0.4.0-devel\r\nContent-Length: 11\r\n\r\na=sendrecv\r\n', ua);
    spyOn(request, 'reply');

    var ISC = new SIP.InviteServerContext(ua, request);
    window.clearTimeout(ISC.timers.userNoAnswerTimer);

    expect(ISC.contentDisp).toBe('render');
  });

  it('calls augment using ServerContext and InviteContext', function() {
    spyOn(SIP.Utils, 'augment').andCallThrough();

    var ISC = new SIP.InviteServerContext(ua, request);
    window.clearTimeout(ISC.timers.userNoAnswerTimer);

    expect(SIP.Utils.augment.calls[0].args[1]).toBe(SIP.ServerContext);
    expect(SIP.Utils.augment.calls[1].args[1]).toBe(SIP.InviteContext);
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
    request = SIP.Parser.parseMessage('INVITE sip:gled5gsn@hk95bautgaa7.invalid;transport=ws;aor=james%40onsnip.onsip.com SIP/2.0\r\nMax-Forwards: 65\r\nTo: <sip:james@onsnip.onsip.com>\r\nFrom: "test1" <sip:test1@onsnip.onsip.com>;tag=rto5ib4052\r\nCall-ID: grj0liun879lfj35evfq\r\nCSeq: 1798 INVITE\r\nContact: <sip:e55r35u3@kgu78r4e1e6j.invalid;transport=ws;ob>\r\nAllow: ACK,CANCEL,BYE,OPTIONS,INVITE,MESSAGE\r\nContent-Type: application/sdp\r\nRequire: 100rel\r\nSupported: outbound\r\nUser-Agent: JsSIP 0.4.0-devel\r\nContent-Length: 11\r\n\r\na=sendrecv\r\n', ua);
    spyOn(request, 'reply');

    var ISC = new SIP.InviteServerContext(ua, request);
    window.clearTimeout(ISC.timers.userNoAnswerTimer);

    expect(ISC.rel100).toBe(SIP.C.supported.REQUIRED);
  });

  it('sets 100rel, supported', function() {
    request = SIP.Parser.parseMessage('INVITE sip:gled5gsn@hk95bautgaa7.invalid;transport=ws;aor=james%40onsnip.onsip.com SIP/2.0\r\nMax-Forwards: 65\r\nTo: <sip:james@onsnip.onsip.com>\r\nFrom: "test1" <sip:test1@onsnip.onsip.com>;tag=rto5ib4052\r\nCall-ID: grj0liun879lfj35evfq\r\nCSeq: 1798 INVITE\r\nContact: <sip:e55r35u3@kgu78r4e1e6j.invalid;transport=ws;ob>\r\nAllow: ACK,CANCEL,BYE,OPTIONS,INVITE,MESSAGE\r\nContent-Type: application/json\r\nSupported: outbound, 100rel\r\nUser-Agent: JsSIP 0.4.0-devel\r\nContent-Length: 11\r\n\r\na=sendrecv\r\n', ua);
    spyOn(request, 'reply');

    var ISC = new SIP.InviteServerContext(ua, request);
    window.clearTimeout(ISC.timers.userNoAnswerTimer);

    expect(ISC.rel100).toBe(SIP.C.supported.SUPPORTED);
  });

  it('replies 500 and returns if the createDialog call fails', function() {
    var ISC, fakereq;
    fakereq = SIP.Parser.parseMessage('INVITE sip:gled5gsn@hk95bautgaa7.invalid;transport=ws;aor=james%40onsnip.onsip.com SIP/2.0\r\nMax-Forwards: 65\r\nTo: <sip:james@onsnip.onsip.com>\r\nFrom: "test1" <sip:test1@onsnip.onsip.com>;tag=rto5ib4052\r\nCall-ID: grj0liun879lfj35evfq\r\nCSeq: 1798 INVITE\r\nContact: <sip:e55r35u3@kgu78r4e1e6j.invalid;transport=ws;ob>\r\nAllow: ACK,CANCEL,BYE,OPTIONS,INVITE,MESSAGE\r\nContent-Type: application/sdp\r\nSupported: outbound\r\nUser-Agent: JsSIP 0.4.0-devel\r\nContent-Length: 11\r\n\r\na=sendrecv\r\n', ua);
    spyOn(fakereq, 'reply');

    spyOn(SIP.InviteContext.prototype,'createDialog').andReturn(false);

    ISC = new SIP.InviteServerContext(ua, fakereq);
    window.clearTimeout(ISC.timers.userNoAnswerTimer);

    expect(fakereq.reply).toHaveBeenCalledWith(500, 'Missing Contact header field');
  });

  it('calls fireNewSession if request.body is null', function() {
    var ISC;
    request.body = null;

    spyOn(SIP.EventEmitter.prototype,'emit');

    ISC = new SIP.InviteServerContext(ua, request);
    window.clearTimeout(ISC.timers.userNoAnswerTimer);

    expect(ISC.emit.calls[1].args[0]).toBe('progress');

    expect(ISC.status).toBe(4);

    expect(ISC.timers.userNoAnswerTimer).toBeDefined();
    expect(ISC.timers.expiresTimer).toBeDefined();

    expect(ISC.emit.calls[2].args[0]).toBe('invite');
  });

  // RTCMediaHandler constructor issue
  xit('should call rtcMediaHandler.onMessage otherwise', function() {
    var ISC;

    jasmine.createSpy(SIP.InviteContext, 'rtcMediaHandler').andCallThrough();

    jasmine.createSpy(SIP.InviteContext.rtcMediaHandler.prototype, 'onMessage');

    ISC = new SIP.InviteServerContext(ua, request);
    window.clearTimeout(ISC.timers.userNoAnswerTimer);

    expect(InviteServerContext.rtcMediaHandler.onMessage).toHaveBeenCalled();

    SIP.InviteContext.rtcMediaHandler = rtcMediaHandlerCleanup;
  });

  describe('.reject', function() {
    
    it('throws an invalid state error is the status is terminated', function() {
      InviteServerContext.status = 9;

      expect(function(){InviteServerContext.reject();}).toThrow('Invalid status: 9');
    });

    it('throws a type error when the status code is valid and less than 300', function(){
      for(var i = 100; i < 300; i++) {
        expect(function(){InviteServerContext.reject({status_code: i});}).toThrow('Invalid status_code: ' + i);
      }
    });

    it('replies to the request (480 is default)', function() {
      request.reply.reset();

      InviteServerContext.reject();

      expect(request.reply.calls[0].args[0]).toBe(480);
    });

    it('calls rejected, failed, and terminated', function() {
      spyOn(InviteServerContext, 'rejected');
      spyOn(InviteServerContext, 'failed');
      spyOn(InviteServerContext, 'terminated');

      InviteServerContext.reject();

      expect(InviteServerContext.rejected).toHaveBeenCalled();
      expect(InviteServerContext.failed).toHaveBeenCalled();
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

      expect(InviteServerContext.emit.calls[0].args[0]).toBe('bye');
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

  describe('.preaccept', function() {
    beforeEach(function() {
      InviteServerContext.rel100 = SIP.C.supported.REQUIRED;
    });

    it('returns InviteServerContext if rel100 is unsupported', function() {
      InviteServerContext.rel100 = SIP.C.supported.UNSUPPORTED;

      expect(InviteServerContext.preaccept()).toBe(InviteServerContext);
    });

    it('calls getUserMedia and return InviteServerContext', function() {
      spyOn(InviteServerContext.rtcMediaHandler, 'getUserMedia');

      expect(InviteServerContext.preaccept()).toBe(InviteServerContext);

      expect(InviteServerContext.rtcMediaHandler.getUserMedia).toHaveBeenCalled();
    });
  });

  describe('.accept', function() {
    beforeEach(function() {
      InviteServerContext.status = 4;

      spyOn(InviteServerContext.rtcMediaHandler, 'getUserMedia');
    });

    it('sets this.media_constraints if options.mediaConstraints is set', function() {
      InviteServerContext.accept({mediaConstraints: 'fish'});

      expect(InviteServerContext.media_constraints).toBe('fish');
    });

    it('changes status to ANSWERED_WAITING_FOR_PRACK and returns this if status is WAITING_FOR_PRACK', function() {
      InviteServerContext.status = 6;

      expect(InviteServerContext.accept()).toBe(InviteServerContext);
      expect(InviteServerContext.status).toBe(10);
    });

    it('throws Invalid State Error if status is not WAITING_FOR_PRACK, WAITING_FOR_ANSWER, or EARLY_MEDIA', function() {
      InviteServerContext.status = 11;

      expect(function(){InviteServerContext.accept();}).not.toThrow('Invalid status: 11');

      InviteServerContext.status = 0;

      expect(function(){InviteServerContext.accept();}).toThrow('Invalid status: 0');
    });

    it('replies 500 an returns this if createDialog fails', function() {
      request.reply.reset();
      spyOn(InviteServerContext, 'createDialog').andReturn(false);

      expect(InviteServerContext.accept()).toBe(InviteServerContext);

      expect(request.reply.calls[0].args[0]).toBe(500);
    });

    it('should clear the userNoAnswerTimer', function() {
      spyOn(window, 'clearTimeout').andCallThrough();

      InviteServerContext.timers.userNoAnswerTimer = window.setTimeout(function() {}, 200);

      InviteServerContext.accept();

      expect(window.clearTimeout).toHaveBeenCalledWith(InviteServerContext.timers.userNoAnswerTimer);
    });

    it('sets the constraints to false if they were set to true earlier when there is no audio or video streams', function() {
      InviteServerContext.accept({mediaConstraints:{audio: true, video: true}});

      expect(InviteServerContext.media_constraints).toEqual({audio: false, video: false});
    });

    it('does not call getUserMedia and returns this when the status is EARLY_MEDIA', function() {
      InviteServerContext.status = 11;

      expect(InviteServerContext.accept()).toBe(InviteServerContext);

      expect(InviteServerContext.rtcMediaHandler.getUserMedia).not.toHaveBeenCalled();
    });

    it('calls getUserMedia and returns this on a successful call where the status is not EARLY_MEDIA', function() {
      expect(InviteServerContext.accept()).toBe(InviteServerContext);

      expect(InviteServerContext.rtcMediaHandler.getUserMedia).toHaveBeenCalled();
    });
  });

  describe('receiveRequest', function() {
    var req;

    describe('method is CANCELED', function() {
      beforeEach(function() {
        req = SIP.Parser.parseMessage('CANCEL sip:gled5gsn@hk95bautgaa7.invalid;transport=ws;aor=james%40onsnip.onsip.com SIP/2.0\r\nMax-Forwards: 65\r\nTo: <sip:james@onsnip.onsip.com>\r\nFrom: "test1" <sip:test1@onsnip.onsip.com>;tag=rto5ib4052\r\nCall-ID: grj0liun879lfj35evfq\r\nCSeq: 1798 INVITE\r\nContact: <sip:e55r35u3@kgu78r4e1e6j.invalid;transport=ws;ob>\r\nAllow: ACK,CANCEL,BYE,OPTIONS,INVITE,MESSAGE\r\nContent-Type: application/sdp\r\nSupported: outbound\r\nUser-Agent: JsSIP 0.4.0-devel\r\nContent-Length: 11\r\n\r\na=sendrecv\r\n', ua);

        spyOn(InviteServerContext, 'canceled');
        spyOn(InviteServerContext, 'failed');
        spyOn(InviteServerContext, 'terminated');
        spyOn(window, 'clearTimeout').andCallThrough();

        InviteServerContext.timers.prackTimer = window.setTimeout(function(){}, 100);
        InviteServerContext.timers.rel1xxTimer = window.setTimeout(function(){}, 100);
      });

      it('status is WAITING_FOR_ANSWER, timers not cleared', function() {
        InviteServerContext.status = 4;

        InviteServerContext.receiveRequest(req);

        expect(window.clearTimeout).not.toHaveBeenCalledWith(InviteServerContext.timers.prackTimer);
        expect(window.clearTimeout).not.toHaveBeenCalledWith(InviteServerContext.timers.rel1xxTimer);
      });

      it('status is WAITING_FOR_PRACK, timers cleared', function() {
        InviteServerContext.status = 6;

        InviteServerContext.receiveRequest(req);

        expect(window.clearTimeout).toHaveBeenCalledWith(InviteServerContext.timers.prackTimer);
        expect(window.clearTimeout).toHaveBeenCalledWith(InviteServerContext.timers.rel1xxTimer);
      });

      it('status is ANSWERED_WAITING_FOR_PRACK, timers cleared', function() {
        InviteServerContext.status = 10;

        InviteServerContext.receiveRequest(req);

        expect(window.clearTimeout).toHaveBeenCalledWith(InviteServerContext.timers.prackTimer);
        expect(window.clearTimeout).toHaveBeenCalledWith(InviteServerContext.timers.rel1xxTimer);
      });

      it('status is EARLY_MEDIA, timers not cleared', function() {
        InviteServerContext.status = 11;

        InviteServerContext.receiveRequest(req);

        expect(window.clearTimeout).not.toHaveBeenCalledWith(InviteServerContext.timers.prackTimer);
        expect(window.clearTimeout).not.toHaveBeenCalledWith(InviteServerContext.timers.rel1xxTimer);
      });

      it('status is ANSWERED, timers not cleared', function() {
        InviteServerContext.status = 5;

        InviteServerContext.receiveRequest(req);

        expect(window.clearTimeout).not.toHaveBeenCalledWith(InviteServerContext.timers.prackTimer);
        expect(window.clearTimeout).not.toHaveBeenCalledWith(InviteServerContext.timers.rel1xxTimer);
      });

      afterEach(function() {
        expect(InviteServerContext.status).toBe(8);
        expect(InviteServerContext.request.reply).toHaveBeenCalledWith(487);
        expect(InviteServerContext.canceled).toHaveBeenCalledWith(req);
        expect(InviteServerContext.failed).toHaveBeenCalledWith(req, SIP.C.causes.CANCELED);
        expect(InviteServerContext.terminated).toHaveBeenCalledWith(req);
      });
    });

    describe('method is ACK', function() {
      beforeEach(function() {
        req = SIP.Parser.parseMessage('ACK sip:gled5gsn@hk95bautgaa7.invalid;transport=ws;aor=james%40onsnip.onsip.com SIP/2.0\r\nMax-Forwards: 65\r\nTo: <sip:james@onsnip.onsip.com>\r\nFrom: "test1" <sip:test1@onsnip.onsip.com>;tag=rto5ib4052\r\nCall-ID: grj0liun879lfj35evfq\r\nCSeq: 1798 INVITE\r\nContact: <sip:e55r35u3@kgu78r4e1e6j.invalid;transport=ws;ob>\r\nAllow: ACK,CANCEL,BYE,OPTIONS,INVITE,MESSAGE\r\nSupported: outbound\r\nUser-Agent: JsSIP 0.4.0-devel\r\nContent-Length: 0\r\n\r\n', InviteServerContext.ua);

        InviteServerContext.status = 7;

        InviteServerContext.rtcMediaHandler.localMedia = {getAudioTracks: function(){return [];},
                                                          getVideoTracks: function(){return [];}};
      });

      it('calls rtcMediaHandler.onMessage when the ACK contains a answer to an invite w/o sdp', function() {
        InviteServerContext.contentDisp = 'render';

        req = SIP.Parser.parseMessage('ACK sip:gled5gsn@hk95bautgaa7.invalid;transport=ws;aor=james%40onsnip.onsip.com SIP/2.0\r\nMax-Forwards: 65\r\nTo: <sip:james@onsnip.onsip.com>\r\nFrom: "test1" <sip:test1@onsnip.onsip.com>;tag=rto5ib4052\r\nCall-ID: grj0liun879lfj35evfq\r\nCSeq: 1798 INVITE\r\nContact: <sip:e55r35u3@kgu78r4e1e6j.invalid;transport=ws;ob>\r\nAllow: ACK,CANCEL,BYE,OPTIONS,INVITE,MESSAGE\r\nContent-Type: application/sdp\r\nSupported: outbound\r\nUser-Agent: JsSIP 0.4.0-devel\r\nContent-Length: 11\r\n\r\na=sendrecv\r\n', InviteServerContext.ua);

        spyOn(InviteServerContext.rtcMediaHandler, 'onMessage');

        InviteServerContext.receiveRequest(req);

        expect(InviteServerContext.rtcMediaHandler.onMessage).toHaveBeenCalled();
      });

      it('calls confirmSession and accepted if session.early_sdp is true and above is false', function() {
        InviteServerContext.early_sdp = true;
        InviteServerContext.contentDisp = 'render';
        spyOn(window, 'clearTimeout').andCallThrough();
        spyOn(InviteServerContext, 'accepted');

        InviteServerContext.receiveRequest(req);

        expect(window.clearTimeout).toHaveBeenCalledWith(InviteServerContext.timers.ackTimer);
        expect(window.clearTimeout).toHaveBeenCalledWith(InviteServerContext.timers.invite2xxTimer);

        expect(InviteServerContext.status).toBe(12);
        expect(InviteServerContext.accepted).toHaveBeenCalled();
        expect(InviteServerContext.renderbody).toBe(InviteServerContext.request.body);
        expect(InviteServerContext.rendertype).toBe('application/sdp');
      });

      it('calls failed if the above two conditions are not true', function() {
        InviteServerContext.contentDisp = 'render';
        spyOn(InviteServerContext, 'failed');

        InviteServerContext.receiveRequest(req);

        expect(InviteServerContext.failed).toHaveBeenCalledWith(req, SIP.C.causes.BAD_MEDIA_DESCRIPTION);
      });

      it('calls confirmSession if there was an invite w/ sdp originally', function() {
        spyOn(window, 'clearTimeout').andCallThrough();

        InviteServerContext.receiveRequest(req);

        expect(window.clearTimeout).toHaveBeenCalledWith(InviteServerContext.timers.ackTimer);
        expect(window.clearTimeout).toHaveBeenCalledWith(InviteServerContext.timers.invite2xxTimer);

        expect(InviteServerContext.status).toBe(12);
      });
    });

    describe('method is PRACK', function() {
      beforeEach(function() {
        req = SIP.Parser.parseMessage('PRACK sip:gled5gsn@hk95bautgaa7.invalid;transport=ws;aor=james%40onsnip.onsip.com SIP/2.0\r\nMax-Forwards: 65\r\nTo: <sip:james@onsnip.onsip.com>\r\nFrom: "test1" <sip:test1@onsnip.onsip.com>;tag=rto5ib4052\r\nCall-ID: grj0liun879lfj35evfq\r\nCSeq: 1798 INVITE\r\nContact: <sip:e55r35u3@kgu78r4e1e6j.invalid;transport=ws;ob>\r\nAllow: ACK,CANCEL,BYE,OPTIONS,INVITE,MESSAGE\r\nContent-Type: application/sdp\r\nSupported: outbound\r\nUser-Agent: JsSIP 0.4.0-devel\r\nContent-Length: 11\r\n\r\na=sendrecv\r\n', InviteServerContext.ua);

        InviteServerContext.status = 6;
      });

      it('calls rtcMediaHandler.onMessage when the invite had no body, but the request had sdp', function(){
        spyOn(InviteServerContext.rtcMediaHandler, 'onMessage');
        InviteServerContext.request.body = null;

        InviteServerContext.receiveRequest(req);

        expect(InviteServerContext.rtcMediaHandler.onMessage).toHaveBeenCalled();
      });

      it('calls terminate and failed when invite has no body, but the request has a non-sdp body', function() {
        InviteServerContext.request.body = null;
        spyOn(InviteServerContext, 'terminate');
        spyOn(InviteServerContext, 'failed');

        req = SIP.Parser.parseMessage('PRACK sip:gled5gsn@hk95bautgaa7.invalid;transport=ws;aor=james%40onsnip.onsip.com SIP/2.0\r\nMax-Forwards: 65\r\nTo: <sip:james@onsnip.onsip.com>\r\nFrom: "test1" <sip:test1@onsnip.onsip.com>;tag=rto5ib4052\r\nCall-ID: grj0liun879lfj35evfq\r\nCSeq: 1798 INVITE\r\nContact: <sip:e55r35u3@kgu78r4e1e6j.invalid;transport=ws;ob>\r\nAllow: ACK,CANCEL,BYE,OPTIONS,INVITE,MESSAGE\r\nContent-Type: application/json\r\nSupported: outbound\r\nUser-Agent: JsSIP 0.4.0-devel\r\nContent-Length: 11\r\n\r\na=sendrecv\r\n', InviteServerContext.ua);

        InviteServerContext.receiveRequest(req);

        expect(InviteServerContext.terminate).toHaveBeenCalled();
        expect(InviteServerContext.failed).toHaveBeenCalledWith(req, SIP.C.causes.BAD_MEDIA_DESCRIPTION);
      });

      it('calls reply(200) and other smaller things when the invite had a body (accept not called)', function() {
        spyOn(window, 'clearTimeout').andCallThrough();
        spyOn(req, 'reply');
        spyOn(InviteServerContext, 'accept');
        InviteServerContext.rtcMediaHandler.localMedia = {getAudioTracks: function(){return [];},
                                                          getVideoTracks: function(){return [];}};

        InviteServerContext.receiveRequest(req);

        expect(window.clearTimeout).toHaveBeenCalledWith(InviteServerContext.timers.ackTimer);
        expect(window.clearTimeout).toHaveBeenCalledWith(InviteServerContext.timers.invite2xxTimer);
        expect(InviteServerContext.accept).not.toHaveBeenCalled();
        expect(req.reply).toHaveBeenCalledWith(200);
      });

      it('calls reply(200) and other smaller things when the invite had a body (accept also called)', function() {
        spyOn(window, 'clearTimeout').andCallThrough();
        spyOn(req, 'reply');
        spyOn(InviteServerContext, 'accept');
        InviteServerContext.status = 10;
        InviteServerContext.rtcMediaHandler.localMedia = {getAudioTracks: function(){return [];},
                                                          getVideoTracks: function(){return [];}};

        InviteServerContext.receiveRequest(req);

        expect(window.clearTimeout).toHaveBeenCalledWith(InviteServerContext.timers.ackTimer);
        expect(window.clearTimeout).toHaveBeenCalledWith(InviteServerContext.timers.invite2xxTimer);
        expect(InviteServerContext.accept).toHaveBeenCalled();
        expect(req.reply).toHaveBeenCalledWith(200);
      });
    });

    describe('method is BYE', function() {
      it('replies 200, calls bye, and terminates', function() {
        InviteServerContext.status = 12;
        req = SIP.Parser.parseMessage('BYE sip:gled5gsn@hk95bautgaa7.invalid;transport=ws;aor=james%40onsnip.onsip.com SIP/2.0\r\nMax-Forwards: 65\r\nTo: <sip:james@onsnip.onsip.com>\r\nFrom: "test1" <sip:test1@onsnip.onsip.com>;tag=rto5ib4052\r\nCall-ID: grj0liun879lfj35evfq\r\nCSeq: 1798 INVITE\r\nContact: <sip:e55r35u3@kgu78r4e1e6j.invalid;transport=ws;ob>\r\nAllow: ACK,CANCEL,BYE,OPTIONS,INVITE,MESSAGE\r\nContent-Type: application/json\r\nSupported: outbound\r\nUser-Agent: JsSIP 0.4.0-devel\r\nContent-Length: 11\r\n\r\na=sendrecv\r\n', InviteServerContext.ua);

        spyOn(req, 'reply');
        spyOn(InviteServerContext, 'bye');
        spyOn(InviteServerContext, 'terminated');

        InviteServerContext.receiveRequest(req);

        expect(req.reply).toHaveBeenCalledWith(200);
        expect(InviteServerContext.bye).toHaveBeenCalled();
        expect(InviteServerContext.terminated).toHaveBeenCalledWith(req, SIP.C.causes.BYE);
      });
    });

    describe('method is INVITE', function() {
      it('calls receiveReinvite', function() {
        InviteServerContext.status = 12;
        req = SIP.Parser.parseMessage('INVITE sip:gled5gsn@hk95bautgaa7.invalid;transport=ws;aor=james%40onsnip.onsip.com SIP/2.0\r\nMax-Forwards: 65\r\nTo: <sip:james@onsnip.onsip.com>\r\nFrom: "test1" <sip:test1@onsnip.onsip.com>;tag=rto5ib4052\r\nCall-ID: grj0liun879lfj35evfq\r\nCSeq: 1798 INVITE\r\nContact: <sip:e55r35u3@kgu78r4e1e6j.invalid;transport=ws;ob>\r\nAllow: ACK,CANCEL,BYE,OPTIONS,INVITE,MESSAGE\r\nContent-Type: application/json\r\nSupported: outbound\r\nUser-Agent: JsSIP 0.4.0-devel\r\nContent-Length: 11\r\n\r\na=sendrecv\r\n', InviteServerContext.ua);

        spyOn(InviteServerContext, 'receiveReinvite');

        InviteServerContext.receiveRequest(req);

        expect(InviteServerContext.receiveReinvite).toHaveBeenCalledWith(req);
      });
    });

    describe('method is INFO', function() {
      it('makes a new DTMF', function() {
        InviteServerContext.status = 12;
        req = SIP.Parser.parseMessage('INFO sip:gled5gsn@hk95bautgaa7.invalid;transport=ws;aor=james%40onsnip.onsip.com SIP/2.0\r\nMax-Forwards: 65\r\nTo: <sip:james@onsnip.onsip.com>\r\nFrom: "test1" <sip:test1@onsnip.onsip.com>;tag=rto5ib4052\r\nCall-ID: grj0liun879lfj35evfq\r\nCSeq: 1798 INVITE\r\nContact: <sip:e55r35u3@kgu78r4e1e6j.invalid;transport=ws;ob>\r\nAllow: ACK,CANCEL,BYE,OPTIONS,INVITE,MESSAGE\r\nContent-Type: application/json\r\nSupported: outbound\r\nUser-Agent: JsSIP 0.4.0-devel\r\nContent-Length: 11\r\n\r\na=sendrecv\r\n', InviteServerContext.ua);

        InviteServerContext.receiveRequest(req);

        //Not sure how to test this... another InviteContext/* problem
      });
    });

    describe('method is REFER', function() {
      it('replies 202, then calls referred and terminate', function() {
        InviteServerContext.status = 12;
        req = SIP.Parser.parseMessage('REFER sip:gled5gsn@hk95bautgaa7.invalid;transport=ws;aor=james%40onsnip.onsip.com SIP/2.0\r\nMax-Forwards: 65\r\nTo: <sip:james@onsnip.onsip.com>\r\nrefer-to: <sip:charles@example.com>\r\nFrom: "test1" <sip:test1@onsnip.onsip.com>;tag=rto5ib4052\r\nCall-ID: grj0liun879lfj35evfq\r\nCSeq: 1798 INVITE\r\nContact: <sip:e55r35u3@kgu78r4e1e6j.invalid;transport=ws;ob>\r\nAllow: ACK,CANCEL,BYE,OPTIONS,INVITE,MESSAGE\r\nContent-Type: application/json\r\nSupported: outbound\r\nUser-Agent: JsSIP 0.4.0-devel\r\nContent-Length: 11\r\n\r\na=sendrecv\r\n', InviteServerContext.ua);

        spyOn(req, 'reply');
        spyOn(InviteServerContext, 'referred');
        spyOn(InviteServerContext, 'terminate');
        InviteServerContext.dialog = new SIP.Dialog(InviteServerContext, InviteServerContext.request, 'UAS');
        spyOn(InviteServerContext.dialog, 'sendRequest');

        InviteServerContext.receiveRequest(req);

        //More can be tested here... another InviteContext/* problem

        expect(req.reply).toHaveBeenCalledWith(202, 'Accepted');
        expect(InviteServerContext.referred).toHaveBeenCalled();
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
    webrtc = SIP.WebRTC.isSupported;
    if(!webrtc) {
      SIP.WebRTC.isSupported = true;
      SIP.WebRTC.RTCPeerConnection = jasmine.createSpy('RTCPeerConnection');
      SIP.WebRTC.RTCPeerConnection.prototype.setRemoteDescription = jasmine.createSpy('setRemoteDescription');
      SIP.WebRTC.RTCPeerConnection.prototype.close = jasmine.createSpy('close');
      SIP.WebRTC.RTCSessionDescription = jasmine.createSpy('RTCSessionDescription');
      SIP.WebRTC.getUserMedia = jasmine.createSpy('getUserMedia');
    }

    target = 'bob@example.com';
    ua = new SIP.UA({uri: 'alice@example.com', ws_servers: 'ws:server.example.com'});

    ua.transport = jasmine.createSpyObj('transport', ['send', 'connect', 'disconnect', 'reConnect']);

    InviteClientContext = new SIP.InviteClientContext(ua, target);
  });

  afterEach(function() {
    SIP.WebRTC.isSupported = webrtc;
  });

  it('throws a type error if target is undefined', function() {
    expect(function() {new SIP.InviteClientContext(ua, undefined);}).toThrow('Not enough arguments');
  });

  xit('throws a not supported error if WebRTC is not supported', function() {
    SIP.WebRTC.isSupported = false;

    expect(function() {new SIP.InviteClientContext(ua, target);}).toThrow('WebRTC not supported');

    SIP.WebRTC.isSupported = true;
  });

  it('throws a type error if normalizeTarget fails with the given target', function() {
    spyOn(ua, 'normalizeTarget').andReturn(null);

    expect(function() {new SIP.InviteClientContext(ua, target);}).toThrow('Invalid target: bob@example.com');
  });

  it('calls augment using ClientContext and InviteContext', function() {
    spyOn(SIP.Utils, 'augment').andCallThrough();

    var ICC = new SIP.InviteClientContext(ua, target);

    expect(SIP.Utils.augment.calls[0].args[1]).toBe(SIP.ClientContext);
    expect(SIP.Utils.augment.calls[1].args[1]).toBe(SIP.InviteContext);
  });

  it('throws an invalid state error if the status is null', function() {
    spyOn(SIP.Utils, 'augment');

    expect(function() {new SIP.InviteClientContext(ua, target);}).toThrow('Invalid status: undefined');
  });

  it('should set several parameters at the end of the constructor', function() {
    expect(InviteClientContext.from_tag).toBeDefined();

    expect(InviteClientContext.isCanceled).toBe(false);
    expect(InviteClientContext.received_100).toBe(false);

    expect(InviteClientContext.method).toBe(SIP.C.INVITE);
    expect(InviteClientContext.receiveResponse).toBe(InviteClientContext.receiveInviteResponse);

    expect(InviteClientContext.logger).toBe(ua.getLogger('sip.inviteclientcontext'));
  });

  it('throws a type error if invalid stun servers are passed in', function() {
    spyOn(SIP.UA.configuration_check.optional, 'stun_servers');

    expect(function() { new SIP.InviteClientContext(ua, target, {stun_servers: 'fake'});}).toThrow('Invalid stun_servers: fake');
  });

  it('throws a type error if invalid turn servers are passed in', function() {
    spyOn(SIP.UA.configuration_check.optional, 'turn_servers');

    expect(function() { new SIP.InviteClientContext(ua, target, {turn_servers: 'fake'});}).toThrow('Invalid turn_servers: fake');
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

    it('sets RTCMediaHandler and ua.sessions', function() {
      InviteClientContext.invite();
      expect(InviteClientContext.rtcMediaHandler).toBeDefined();
      expect(InviteClientContext.ua.sessions[InviteClientContext.id]).toBe(InviteClientContext);
    });

    it('calls rtcMediaHandler.getUserMedia and returns this on success', function() {
      SIP.WebRTC.getUserMedia = jasmine.createSpy('getUserMedia');

      expect(InviteClientContext.invite()).toBe(InviteClientContext);

      expect(SIP.WebRTC.getUserMedia).toHaveBeenCalled();
    });
  });

  describe('.receiveInviteResponse', function() {
    var response;
    var resp;
    var request;

    beforeEach(function() {
      sipDialogCleanup = SIP.Dialog.prototype.sendRequest;

      request = new SIP.OutgoingRequest('INVITE', 'bob@example.com', InviteClientContext.ua, {from: 'abcdefg'}, ['Contact: ' + InviteClientContext.contact, 'Allow: ' + SIP.Utils.getAllowedMethods(InviteClientContext.ua)]);

      request.body = 'a=sendrecv\r\n';

      InviteClientContext.request = request;

      response = SIP.Parser.parseMessage('SIP/2.0 200 OK\r\nTo: <sip:james@onsnip.onsip.com>;tag=1ma2ki9411\r\nFrom: "test1" <sip:test1@onsnip.onsip.com>;tag=58312p20s2\r\nCall-ID: upfrf7jpeb3rmc0gnnq1\r\nCSeq: 9059 INVITE\r\nContact: <sip:gusgt9j8@vk3dj582vbu9.invalid;transport=ws>\r\nContact: <sip:gusgt9j8@vk3dj582vbu9.invalid;transport=ws>\r\nSupported: outbound\r\nContent-Type: application/sdp\r\nContent-Length: 11\r\n\r\na= sendrecv\r\n', ua);

      spyOn(SIP.Dialog.prototype, 'sendRequest');
      spyOn(InviteClientContext, 'sendRequest');
    });

    afterEach(function(){
      SIP.Dialog.prototype.sendRequest = sipDialogCleanup;
    });

    it('accepts and terminates a 200 OK from a branch that\'s replying after the call has been established', function() {
      resp = SIP.Parser.parseMessage('SIP/2.0 200 OK\r\nTo: <sip:james@onsnip.onsip.com>;tag=1ma2ki9411\r\nFrom: "test1" <sip:test1@onsnip.onsip.com>;tag=58312p20s2\r\nCall-ID: aaaaaaaaaaaaaa\r\nCSeq: 9059 INVITE\r\nContact: <sip:gusgt9j8@vk3dj582vbu9.invalid;transport=ws>\r\nContact: <sip:gusgt9j8@vk3dj582vbu9.invalid;transport=ws>\r\nSupported: outbound\r\nContent-Type: application/sdp\r\nContent-Length: 11\r\n\r\na= sendrecv\r\n', ua);

      InviteClientContext.createDialog(response, 'UAC', false);
      expect(InviteClientContext.dialog).toBeDefined();

      InviteClientContext.receiveInviteResponse(resp);

      expect(InviteClientContext.earlyDialogs[resp.call_id+resp.from_tag+resp.to_tag]).toBeDefined();
      expect(InviteClientContext.earlyDialogs[resp.call_id+resp.from_tag+resp.to_tag].sendRequest).toHaveBeenCalledWith(InviteClientContext, SIP.C.ACK);
      expect(InviteClientContext.earlyDialogs[resp.call_id+resp.from_tag+resp.to_tag].sendRequest).toHaveBeenCalledWith(InviteClientContext, SIP.C.BYE);
    });

    it('ACKs any 200 OKs from the branch on which the call is up after the initial 200 OK', function() {
      InviteClientContext.status = 12;
      InviteClientContext.createDialog(response, 'UAC', false);
      expect(InviteClientContext.dialog).toBeDefined();

      InviteClientContext.receiveInviteResponse(response);

      expect(InviteClientContext.sendRequest).toHaveBeenCalledWith(SIP.C.ACK);
    });

    it('PRACKS any non 200 response when the status is earlyMedia', function() {
      InviteClientContext.status = 11;
      resp = SIP.Parser.parseMessage('SIP/2.0 183 Session In Progress\r\nTo: <sip:james@onsnip.onsip.com>;tag=1ma2ki9411\r\nFrom: "test1" <sip:test1@onsnip.onsip.com>;tag=58312p20s2\r\nCall-ID: aaaaaaaaaaaaaa\r\nCSeq: 9059 INVITE\r\nRSeq: 9060\r\nContact: <sip:gusgt9j8@vk3dj582vbu9.invalid;transport=ws>\r\nContact: <sip:gusgt9j8@vk3dj582vbu9.invalid;transport=ws>\r\nSupported: outbound\r\nContent-Type: application/sdp\r\nContent-Length: 11\r\n\r\na= sendrecv\r\n', ua);

      InviteClientContext.receiveInviteResponse(resp);

      expect(InviteClientContext.earlyDialogs[resp.call_id+resp.from_tag+resp.to_tag].pracked).toContain('9060');
      expect(InviteClientContext.earlyDialogs[resp.call_id+resp.from_tag+resp.to_tag].sendRequest).toHaveBeenCalledWith(InviteClientContext, SIP.C.PRACK, {extraHeaders: ['RAck: 9060 9059 INVITE']});
    });

    it('cancels the request if the call was canceled and the response is 1xx', function() {
      InviteClientContext.isCanceled = true;
      InviteClientContext.cancelReason = 'TESTING';
      resp = SIP.Parser.parseMessage('SIP/2.0 183 Session In Progress\r\nTo: <sip:james@onsnip.onsip.com>;tag=1ma2ki9411\r\nFrom: "test1" <sip:test1@onsnip.onsip.com>;tag=58312p20s2\r\nCall-ID: aaaaaaaaaaaaaa\r\nCSeq: 9059 INVITE\r\nRSeq: 9060\r\nContact: <sip:gusgt9j8@vk3dj582vbu9.invalid;transport=ws>\r\nContact: <sip:gusgt9j8@vk3dj582vbu9.invalid;transport=ws>\r\nSupported: outbound\r\nContent-Type: application/sdp\r\nContent-Length: 11\r\n\r\na= sendrecv\r\n', ua);

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
        spyOn(InviteClientContext, 'createDialog').andReturn(false);

        InviteClientContext.receiveInviteResponse(response);

        expect(InviteClientContext.createDialog).toHaveBeenCalledWith(response, 'UAC', true);
        expect(InviteClientContext.status).not.toBe(2);
      })

      it('changes the status to 1XX_RECEIVED and emits progress', function() {
        expect(InviteClientContext.status).not.toBe(2);
        spyOn(InviteClientContext, 'emit');

        InviteClientContext.receiveInviteResponse(response);

        expect(InviteClientContext.status).toBe(2);
        expect(InviteClientContext.emit).toHaveBeenCalledWith('progress', {response: response});
      });

      it('does not PRACK a response with no body (and requires: 100rel) if there is already a confirmed dialog', function() {
        InviteClientContext.createDialog(response, 'UAC', false);
        expect(InviteClientContext.dialog).toBeDefined();

        resp = SIP.Parser.parseMessage('SIP/2.0 183 Session In Progress\r\nTo: <sip:james@onsnip.onsip.com>;tag=1ma2ki9411\r\nFrom: "test1" <sip:test1@onsnip.onsip.com>;tag=58312p20s2\r\nCall-ID: aaaaaaaaaaaaaa\r\nCSeq: 9059 INVITE\r\nRSeq: 9060\r\nrequire: 100rel\r\nContact: <sip:gusgt9j8@vk3dj582vbu9.invalid;transport=ws>\r\nContact: <sip:gusgt9j8@vk3dj582vbu9.invalid;transport=ws>\r\nSupported: outbound\r\nContent-Type: application/sdp\r\nContent-Length: 0\r\n\r\n', ua);

        InviteClientContext.receiveInviteResponse(resp);

        expect(InviteClientContext.earlyDialogs[resp.call_id+resp.from_tag+resp.to_tag].sendRequest).not.toHaveBeenCalled();
      });

      it('does not PRACK a response with no body (and requires: 100rel) if there is an illegal rseq header', function() {
        resp = SIP.Parser.parseMessage('SIP/2.0 183 Session In Progress\r\nTo: <sip:james@onsnip.onsip.com>;tag=1ma2ki9411\r\nFrom: "test1" <sip:test1@onsnip.onsip.com>;tag=58312p20s2\r\nCall-ID: aaaaaaaaaaaaaa\r\nCSeq: 9059 INVITE\r\nRSeq: 9060\r\nrequire: 100rel\r\nContact: <sip:gusgt9j8@vk3dj582vbu9.invalid;transport=ws>\r\nContact: <sip:gusgt9j8@vk3dj582vbu9.invalid;transport=ws>\r\nSupported: outbound\r\nContent-Type: application/sdp\r\nContent-Length: 0\r\n\r\n', ua);

        !InviteClientContext.createDialog(resp, 'UAC', true);
        InviteClientContext.earlyDialogs[resp.call_id+resp.from_tag+resp.to_tag].pracked.push(9060);

        resp.setHeader('rseq', 9010);

        InviteClientContext.receiveInviteResponse(resp);

        expect(InviteClientContext.earlyDialogs[resp.call_id+resp.from_tag+resp.to_tag].sendRequest).not.toHaveBeenCalled();
      });

      it('PRACKs (when require: 100rel is present) a response without a body', function() {
        resp = SIP.Parser.parseMessage('SIP/2.0 183 Session In Progress\r\nTo: <sip:james@onsnip.onsip.com>;tag=1ma2ki9411\r\nFrom: "test1" <sip:test1@onsnip.onsip.com>;tag=58312p20s2\r\nCall-ID: aaaaaaaaaaaaaa\r\nCSeq: 9059 INVITE\r\nRSeq: 9060\r\nrequire: 100rel\r\nContact: <sip:gusgt9j8@vk3dj582vbu9.invalid;transport=ws>\r\nContact: <sip:gusgt9j8@vk3dj582vbu9.invalid;transport=ws>\r\nSupported: outbound\r\nContent-Type: application/sdp\r\nContent-Length: 0\r\n\r\n', ua);

        InviteClientContext.receiveInviteResponse(resp);

        expect(InviteClientContext.earlyDialogs[resp.call_id+resp.from_tag+resp.to_tag].pracked).toContain('9060');
        expect(InviteClientContext.earlyDialogs[resp.call_id+resp.from_tag+resp.to_tag].sendRequest).toHaveBeenCalledWith(InviteClientContext, SIP.C.PRACK, {extraHeaders: ['RAck: 9060 9059 INVITE']});
      });

      it('calls RTCMediaHandler.onMessage for a response with a body with require: 100rel and confirms the dialog', function() {
        resp = SIP.Parser.parseMessage('SIP/2.0 183 Session In Progress\r\nTo: <sip:james@onsnip.onsip.com>;tag=1ma2ki9411\r\nFrom: "test1" <sip:test1@onsnip.onsip.com>;tag=58312p20s2\r\nCall-ID: aaaaaaaaaaaaaa\r\nCSeq: 9059 INVITE\r\nRSeq: 9060\r\nrequire: 100rel\r\nContact: <sip:gusgt9j8@vk3dj582vbu9.invalid;transport=ws>\r\nContact: <sip:gusgt9j8@vk3dj582vbu9.invalid;transport=ws>\r\nSupported: outbound\r\nContent-Type: application/sdp\r\nContent-Length: 11\r\n\r\na= sendrecv\r\n', ua);

        InviteClientContext.rtcMediaHandler = {onMessage: jasmine.createSpy('onMessage')};

        InviteClientContext.receiveInviteResponse(resp);

        expect(InviteClientContext.dialog.id.toString()).toBe(resp.call_id+resp.from_tag+resp.to_tag);
        expect(InviteClientContext.rtcMediaHandler.onMessage).toHaveBeenCalled();
      });

      it('calls RTCMediaHandler on message and sets local media for a 100rel response with a body where the request had a non-sdp body', function() {
        InviteClientContext.renderbody = InviteClientContext.request.body;
        InviteClientContext.rtcMediaHandler = {localMedia: 'localMedia'};

        resp = SIP.Parser.parseMessage('SIP/2.0 183 Session In Progress\r\nTo: <sip:james@onsnip.onsip.com>;tag=1ma2ki9411\r\nFrom: "test1" <sip:test1@onsnip.onsip.com>;tag=58312p20s2\r\nCall-ID: aaaaaaaaaaaaaa\r\nCSeq: 9059 INVITE\r\nRSeq: 9060\r\nrequire: 100rel\r\nContact: <sip:gusgt9j8@vk3dj582vbu9.invalid;transport=ws>\r\nContact: <sip:gusgt9j8@vk3dj582vbu9.invalid;transport=ws>\r\nSupported: outbound\r\nContent-Type: application/sdp\r\nContent-Length: 11\r\n\r\na= sendrecv\r\n', ua);

        InviteClientContext.receiveInviteResponse(resp);

        expect(InviteClientContext.earlyDialogs[resp.call_id+resp.from_tag+resp.to_tag].rtcMediaHandler.localMedia).toBe('localMedia');
      });
    });

    describe('the response status code is 2xx', function() {
      beforeEach(function() {
        response.setHeader('cseq', InviteClientContext.request.cseq + ' ' + InviteClientContext.request.method);
      });

      it('returns after doing nothing because of an incorrect cseq (same as below, but the cseq is not reset)', function() {
        InviteClientContext.status = 11;
        InviteClientContext.createDialog(response, 'UAC', false);
        InviteClientContext.rtcMediaHandler = {localMedia: {getAudioTracks: function() {return []},
                                                            getVideoTracks: function() {return []}}};

        response.setHeader('cseq', '7777 INVITE');
        spyOn(InviteClientContext, 'accepted');

        InviteClientContext.receiveInviteResponse(response);

        expect(InviteClientContext.status).toBe(11);
        expect(InviteClientContext.sendRequest).not.toHaveBeenCalled();
        expect(InviteClientContext.accepted).not.toHaveBeenCalled();
      });

      it('sets the status to confirmed, ACKS, and calls accepted if the status was earlyMedia', function() {
        InviteClientContext.status = 11;
        InviteClientContext.createDialog(response, 'UAC', false);
        InviteClientContext.rtcMediaHandler = {localMedia: {getAudioTracks: function() {return []},
                                                            getVideoTracks: function() {return []}}};

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
        InviteClientContext.earlyDialogs[response.call_id+response.from_tag+response.to_tag].rtcMediaHandler = 
          {localMedia: {getAudioTracks: function() {return []},
                        getVideoTracks: function() {return []}}};
        
        spyOn(InviteClientContext, 'accepted');

        InviteClientContext.receiveInviteResponse(response);

        expect(InviteClientContext.sendRequest).toHaveBeenCalledWith(SIP.C.ACK);
        expect(InviteClientContext.accepted).toHaveBeenCalledWith(response);
      });

      it('calls rtcMediaHandler.onMessage if the request had no body and the response had no early dialog with media connected to it', function() {
        InviteClientContext.request.body = null;
        InviteClientContext.rtcMediaHandler = {onMessage: jasmine.createSpy('onMessage')};

        InviteClientContext.receiveInviteResponse(response);

        expect(InviteClientContext.rtcMediaHandler.onMessage).toHaveBeenCalled();
      });

      it('same as above, but does not make the call if the createDialog fails', function() {
        InviteClientContext.request.body = null;
        InviteClientContext.rtcMediaHandler = {onMessage: jasmine.createSpy('onMessage')};
        spyOn(InviteClientContext, 'createDialog').andReturn(false);

        InviteClientContext.receiveInviteResponse(response);

        expect(InviteClientContext.rtcMediaHandler.onMessage).not.toHaveBeenCalled();
      });

      it('calls rtcMediaHandler.onMessage if the request a body', function() {
        InviteClientContext.rtcMediaHandler = {onMessage: jasmine.createSpy('onMessage')};

        InviteClientContext.receiveInviteResponse(response);

        expect(InviteClientContext.rtcMediaHandler.onMessage).toHaveBeenCalled();
      });

      it('same as above, but does not make the call if the createDialog fails', function() {
        InviteClientContext.rtcMediaHandler = {onMessage: jasmine.createSpy('onMessage')};
        spyOn(InviteClientContext, 'createDialog').andReturn(false);

        InviteClientContext.receiveInviteResponse(response);

        expect(InviteClientContext.rtcMediaHandler.onMessage).not.toHaveBeenCalled();
      });
    });

    it('calls failed, rejected, and terminated for any other response code', function() {
      response.status_code = 300;
      spyOn(InviteClientContext, 'failed');
      spyOn(InviteClientContext, 'rejected');
      spyOn(InviteClientContext, 'terminated');

      InviteClientContext.receiveInviteResponse(response);

      expect(InviteClientContext.failed).toHaveBeenCalled();
      expect(InviteClientContext.rejected).toHaveBeenCalled();
      expect(InviteClientContext.terminated).toHaveBeenCalled();
    });
  });

  describe('.cancel', function() {
    it('throws an invalid state error if the status is TERMINATED', function() {
      InviteClientContext.status = 9;

      expect(function() {InviteClientContext.cancel();}).toThrow('Invalid status: 9');
    });

    it('throws a type error if the status code is invalid or less than 200', function() {
      expect(function() {InviteClientContext.cancel({status_code: 100});}).toThrow('Invalid status_code: 100');
      expect(function() {InviteClientContext.cancel({status_code: 700});}).toThrow('Invalid status_code: 700');
    });

    it('sets isCanceled to true, calls canceled, failed, and terminated, and returns this if status is NULL', function() {
      InviteClientContext.status = 0;
      spyOn(InviteClientContext, 'failed');
      spyOn(InviteClientContext, 'canceled');
      spyOn(InviteClientContext, 'terminated');

      expect(InviteClientContext.isCanceled).toBe(false);

      expect(InviteClientContext.cancel()).toBe(InviteClientContext);

      expect(InviteClientContext.isCanceled).toBe(true);
      expect(InviteClientContext.failed).toHaveBeenCalled();
      expect(InviteClientContext.canceled).toHaveBeenCalled();
      expect(InviteClientContext.terminated).toHaveBeenCalled();
    });

    it('sets isCanceled to true, calls canceled, failed, and terminated, and returns this if status is INVITE_SENT and received_100 is false', function() {
      InviteClientContext.status = 1;
      spyOn(InviteClientContext, 'failed');
      spyOn(InviteClientContext, 'canceled');
      spyOn(InviteClientContext, 'terminated');

      expect(InviteClientContext.isCanceled).toBe(false);

      expect(InviteClientContext.cancel()).toBe(InviteClientContext);

      expect(InviteClientContext.isCanceled).toBe(true);
      expect(InviteClientContext.failed).toHaveBeenCalled();
      expect(InviteClientContext.canceled).toHaveBeenCalled();
      expect(InviteClientContext.terminated).toHaveBeenCalled();
    });

    it('calls request.cancel, canceled, failed, and terminated, and returns this if status is INVITE_SENT and received_100 is true', function() {
      InviteClientContext.status = 1;
      InviteClientContext.received_100 = true;
      InviteClientContext.request = {cancel: jasmine.createSpy('cancel')};

      spyOn(InviteClientContext, 'failed');
      spyOn(InviteClientContext, 'canceled');
      spyOn(InviteClientContext, 'terminated');

      expect(InviteClientContext.cancel()).toBe(InviteClientContext);

      expect(InviteClientContext.request.cancel).toHaveBeenCalled();
      expect(InviteClientContext.failed).toHaveBeenCalled();
      expect(InviteClientContext.canceled).toHaveBeenCalled();
      expect(InviteClientContext.terminated).toHaveBeenCalled();
    });

    it('calls request.cancel, canceled, failed, and terminated, and returns this if status is 1XX_RECEIVED', function() {
      InviteClientContext.status = 2;
      InviteClientContext.request = {cancel: jasmine.createSpy('cancel')};

      spyOn(InviteClientContext, 'failed');
      spyOn(InviteClientContext, 'canceled');
      spyOn(InviteClientContext, 'terminated');

      expect(InviteClientContext.cancel()).toBe(InviteClientContext);

      expect(InviteClientContext.request.cancel).toHaveBeenCalled();
      expect(InviteClientContext.failed).toHaveBeenCalled();
      expect(InviteClientContext.canceled).toHaveBeenCalled();
      expect(InviteClientContext.terminated).toHaveBeenCalled();
    });
  });

  describe('.terminate', function() {
    beforeEach(function() {
      spyOn(InviteClientContext, 'terminated');
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

      request.body = 'a=sendrecv\r\n';
      request.reply = jasmine.createSpy('reply');
    });

    it('sets the status to CANCELED, replies 487, and calls canceled and failed if the status is EARLY_MEDIA and the request method is CANCELED', function() {
      InviteClientContext.status = 11;
      request.method = SIP.C.CANCEL;

      spyOn(InviteClientContext, 'canceled');
      spyOn(InviteClientContext, 'failed');
      InviteClientContext.request = {reply: jasmine.createSpy('reply')};

      InviteClientContext.receiveRequest(request);

      expect(InviteClientContext.status).toBe(8);
      expect(InviteClientContext.request.reply).toHaveBeenCalledWith(487);
      expect(InviteClientContext.canceled).toHaveBeenCalledWith(request);
      expect(InviteClientContext.failed).toHaveBeenCalledWith(request, SIP.C.causes.CANCELED);
    });

    it('replies 200 and calls bye and terminated if the request method is BYE', function() {
      request.method = SIP.C.BYE;
      spyOn(InviteClientContext, 'bye');
      spyOn(InviteClientContext, 'terminated');

      InviteClientContext.receiveRequest(request);

      expect(request.reply).toHaveBeenCalledWith(200);
      expect(InviteClientContext.bye).toHaveBeenCalled();
      expect(InviteClientContext.terminated).toHaveBeenCalledWith(request, SIP.C.causes.BYE);
    });

    it('logs and calls receiveReinvite if request method is INVITE', function() {
      request.method = SIP.C.INVITE;

      spyOn(InviteClientContext.logger, 'log');
      spyOn(InviteClientContext, 'receiveReinvite');

      InviteClientContext.receiveRequest(request);

      expect(InviteClientContext.logger.log).toHaveBeenCalledWith('re-INVITE received');
      expect(InviteClientContext.receiveReinvite).toHaveBeenCalledWith(request);
    });

    it('clears timers and sets the status to confirmed if request method was ACK and the status was WAITING_FOR_ACK', function() {
      InviteClientContext.timers.ackTimer = 1;
      InviteClientContext.timers.invite2xxTimer = 2;
      InviteClientContext.status = 7;
      request.method = SIP.C.ACK;

      spyOn(window, 'clearTimeout');

      InviteClientContext.receiveRequest(request);

      expect(InviteClientContext.status).toBe(12);
      expect(window.clearTimeout).toHaveBeenCalledWith(InviteClientContext.timers.ackTimer);
      expect(window.clearTimeout).toHaveBeenCalledWith(InviteClientContext.timers.invite2xxTimer);
    });

    xit('DTMF case', function() {
      //can't check much here, InviteContext/* problem
    });

    it('logs, replies 202, then calls referred and terminate', function() {
      InviteClientContext.status = 12;
      InviteClientContext.dialog = {sendRequest: jasmine.createSpy('sendRequest')};
      request.method = SIP.C.REFER;
      request.parseHeader = jasmine.createSpy('parseHeader').andReturn({uri: 'uri'});

      spyOn(InviteClientContext.logger, 'log');
      spyOn(InviteClientContext, 'referred');
      spyOn(InviteClientContext, 'terminate');
      spyOn(InviteClientContext.ua, 'invite');

      InviteClientContext.receiveRequest(request);
      //no way to avoid request.send

      expect(InviteClientContext.logger.log).toHaveBeenCalledWith('REFER received');
      expect(request.reply).toHaveBeenCalledWith(202, 'Accepted');
      expect(InviteClientContext.dialog.sendRequest).toHaveBeenCalled();
      expect(InviteClientContext.ua.invite).toHaveBeenCalled();
      expect(InviteClientContext.referred).toHaveBeenCalled();
      expect(InviteClientContext.terminate).toHaveBeenCalled();
    });
  });
});