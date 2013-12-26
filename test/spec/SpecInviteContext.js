describe('InviteContext', function() {
  var InviteContext;
  var ua;
  var EventEmitter;
  var sipUtilsCleanup;
  var sipURICleanup;
  var sipDialogCleanup;

  beforeEach(function(){
    ua = jasmine.createSpyObj('ua',['getLogger','normalizeTarget','applicants']);
    ua.getLogger.andCallFake(function(){
      return jasmine.createSpyObj('logger',['log']);
    });
    ua.normalizeTarget.andCallFake(function(){
      return true;
    });

    InviteContext = new SIP.EventEmitter();
    InviteContext.initEvents([]);
    SIP.Utils.augment(InviteContext, SIP.InviteContext, []);
  });

  it('should initialize events', function() {
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

  it('should initialize session objects', function() {
    expect(InviteContext.status).toBe(0);
    expect(InviteContext.dialog).toBeNull();
    expect(InviteContext.earlyDialogs).toBeDefined();
    expect(InviteContext.rtcMediaHandler).toBeNull();
    expect(InviteContext.mediaStream).toBeNull();
  });

  it('should initialize session timers', function() {
    expect(InviteContext.timers.ackTimer).toBeNull();
    expect(InviteContext.timers.expiresTimer).toBeNull();
    expect(InviteContext.timers.invite2xxTimer).toBeNull();
    expect(InviteContext.timers.userNoAnswerTimer).toBeNull();
    expect(InviteContext.timers.rel1xxTimer).toBeNull();
    expect(InviteContext.timers.prackTimer).toBeNull();
  });

  it('should initialize session info', function() {
    expect(InviteContext.start_time).toBeNull();
    expect(InviteContext.end_time).toBeNull();
    expect(InviteContext.tones).toBeNull();
  });

  it('should initialize mute/hold state info', function() {
    expect(InviteContext.audioMuted).toBe(false);
    expect(InviteContext.videoMuted).toBe(false);
    expect(InviteContext.local_hold).toBe(false);
    expect(InviteContext.remote_hold).toBe(false);
  });

  it('should initialize the pending actions array and functions', function() {
    expect(InviteContext.pending_actions.actions).toBeDefined();
    expect(InviteContext.pending_actions.length).toBeDefined();
    expect(InviteContext.pending_actions.isPending).toBeDefined();
    expect(InviteContext.pending_actions.shift).toBeDefined();
    expect(InviteContext.pending_actions.push).toBeDefined();
    expect(InviteContext.pending_actions.pop).toBeDefined();
  });

  describe('when calling pending_actions functions', function() {
    beforeEach(function() {
      InviteContext.pending_actions.actions = [{name: 'foo'}, {name: 'bar'}];
    });

    describe('when calling length', function() {
      it('should properly return the length', function() {
        expect(InviteContext.pending_actions.length()).toBe(2);
      });
    });

    describe('when calling isPending', function() {
      it('should return true for objects that are present', function() {
        expect(InviteContext.pending_actions.isPending('foo')).toBe(true);
      });

      it('should return false for objects that are not present', function() {
        expect(InviteContext.pending_actions.isPending('seven')).toBe(false);
      });
    });

    describe('when calling shift', function() {
      it('should return foo and leave bar as the only element in the array', function() {
        expect(InviteContext.pending_actions.shift().name).toBe('foo');
        expect(InviteContext.pending_actions.isPending('foo')).toBe(false);
        expect(InviteContext.pending_actions.isPending('bar')).toBe(true);
      });
    });

    describe('when calling push', function() {
      it('should add seven to the array', function() {
        InviteContext.pending_actions.push('seven');
        expect(InviteContext.pending_actions.isPending('seven')).toBe(true);
      });
    });

    describe('when calling pop', function() {
      it('should remove foo from the array', function() {
        InviteContext.pending_actions.pop('foo');
        expect(InviteContext.pending_actions.isPending('foo')).toBe(false);
        expect(InviteContext.pending_actions.isPending('bar')).toBe(true);
      });
    });
  });

  it('should initialize media_constraints, early_sdp, and rel100', function() {
    expect(InviteContext.media_constraints).toBeDefined();
    expect(InviteContext.early_sdp).toBeNull();
    expect(InviteContext.rel100).toBeDefined();
  });

  describe('when sending DTMF', function() {
    var tones, ua;

    beforeEach(function() {
      tones = 1;
      InviteContext.ua = jasmine.createSpyObj('ua',['getLogger']);
      InviteContext.ua.getLogger.andCallFake(function(){
        return jasmine.createSpyObj('logger',['log']);
      });
      InviteContext.dialog = jasmine.createSpyObj('dialog', ['sendRequest']);

      InviteContext.dialog.sendRequest.andCallFake(function() {
        return 'sent';
      });

      InviteContext.status = 12;
    });

    it('should throw an error if tones is undefined', function() {
      expect(function(){InviteContext.sendDTMF(undefined);}).toThrow('Not enough arguments');
    });

    it('should throw an error if the session status is incorrect', function() {
      InviteContext.status = 0;
      expect(function(){InviteContext.sendDTMF(1);}).toThrow('Invalid status: 0');
    });

    it('should throw an error if tones is the wrong type', function() {
      expect(function(){InviteContext.sendDTMF(1);}).not.toThrow('Invalid tones: 1');
      expect(function(){InviteContext.sendDTMF('1');}).not.toThrow('Invalid tones: 1');
      expect(function(){InviteContext.sendDTMF('one');}).toThrow('Invalid tones: one');
      expect(function(){InviteContext.sendDTMF(true);}).toThrow('Invalid tones: true');
    });

    it('should throw an error if tone duration is invalid', function() {
      expect(function(){InviteContext.sendDTMF(1, {duration: 'six'});}).toThrow('Invalid tone duration: six');
    });

    it('should reset duration to 70 if it\'s too low', function() {
      var options = {duration: 7};
      InviteContext.sendDTMF(1, options);
      expect(options.duration).toBe(70);
    });

    it('should reset duration to 6000 if it\'s too high', function() {
      var options = {duration: 7000};
      InviteContext.sendDTMF(1, options);
      expect(options.duration).toBe(6000);
    });

    it('should reset duration to positive if it\'s negative', function() {
      var options = {duration: -700};
      InviteContext.sendDTMF(1, options);
      expect(options.duration).toBe(70);
    });

    it('should throw an error if interToneGap is invalid', function() {
      expect(function(){InviteContext.sendDTMF(1, {interToneGap: 'six'});}).toThrow('Invalid interToneGap: six');
    });

    it('should queue up tones if tones are already queued', function() {
      InviteContext.tones = '123';
      InviteContext.sendDTMF('456');
      expect(InviteContext.tones).toBe('123456');
    });

    it('should set tones if no tones are queued', function() {
      InviteContext.tones = '';
      InviteContext.sendDTMF('456');
      expect(InviteContext.tones).toBe('456');
    });

    it('should return InviteContext on success', function() {
      expect(InviteContext.sendDTMF(1)).toBe(InviteContext);
    });
  });

  describe('when sending bye', function() {
    beforeEach(function() {
      InviteContext.ua = jasmine.createSpyObj('ua',['getLogger']);
      InviteContext.ua.getLogger.andCallFake(function(){
        return jasmine.createSpyObj('logger',['log']);
      });

      spyOn(InviteContext, 'sendRequest').andCallFake(function() {
        return 'sent';
      });

      spyOn(InviteContext, 'close').andCallFake(function() {
        return 'closed';
      });

      InviteContext.emit = jasmine.createSpy('emit');
      InviteContext.status = 12;
    });

    it('should throw an error if the session status is terminated', function() {
      InviteContext.status = 9;
      expect(function(){InviteContext.bye();}).toThrow('Invalid status: 9');
    });

    it('should emit bye and terminated on any status code >= 200', function() {
      var counter = 0;
      for (var i = 200; i < 700; i++) {
        InviteContext.bye({status_code: i});
        expect(InviteContext.emit.calls[counter].args[0]).toEqual('bye');
        expect(InviteContext.emit.calls[counter].args[1].code).toEqual(i);
        counter++;
        expect(InviteContext.emit.calls[counter].args[0]).toEqual('terminated');
        counter++;
      }
    });

    it('should throw an error for any other status code', function() {
      for (var i = 100; i < 200; i++) {
        expect(function(){InviteContext.bye({status_code: i});}).toThrow('Invalid status_code: ' + i);
      }
    });
  });

  describe('when sending refer', function() {
    var target;

    beforeEach(function() {
      target = 'target';

      InviteContext.ua = jasmine.createSpyObj('ua',['getLogger', 'normalizeTarget']);
      InviteContext.ua.getLogger.andCallFake(function(){
        return jasmine.createSpyObj('logger',['log']);
      });

      InviteContext.ua.normalizeTarget.andCallFake(function(){
        return true;
      });

      //InviteContext.emit = jasmine.createSpy('emit');
      InviteContext.status = 12;
    });

    it('should throw an error if target is undefined', function() {
      expect(function(){InviteContext.refer(undefined);}).toThrow('Not enough arguments');
    });

    it('should throw an error if target is not an InviteContext and status is not confirmed', function() {
      InviteContext.status = 0;
      expect(function(){InviteContext.refer(target);}).toThrow('Invalid status: 0');
    });

    it('should return InviteContext on success', function() {
      sipURICleanup = SIP.URI;
      sipUtilsCleanup = SIP.Utils;

      spyOn(SIP.URI, 'parse').andCallFake(function() {
        return true;
      });
      spyOn(SIP.Utils, 'getAllowedMethods').andCallFake(function() {
        return true;
      });

      InviteContext.dialog = jasmine.createSpyObj('dialog', ['sendRequest']);

      InviteContext.dialog.sendRequest.andCallFake(function() {
        return 'sent';
      });

      expect(InviteContext.refer(target)).toBe(InviteContext);

      SIP.URI = sipURICleanup;
      SIP.Utils = sipUtilsCleanup;
    });
  });

  describe('when calling sendRequest', function() {
    var method;

    it('should return InviteContext on success', function() {
      method = 'method';
      sipUtilsCleanup = SIP.Utils;
      InviteContext.status = 12;

      InviteContext.ua = jasmine.createSpyObj('ua',['getLogger']);
      InviteContext.ua.getLogger.andCallFake(function(){
        return jasmine.createSpyObj('logger',['log']);
      });

      spyOn(SIP.Utils, 'getAllowedMethods').andCallFake(function() {
        return true;
      });

      InviteContext.dialog = jasmine.createSpyObj('dialog', ['sendRequest']);

      InviteContext.dialog.sendRequest.andCallFake(function() {
        return 'sent';
      });

      expect(InviteContext.sendRequest(method)).toBe(InviteContext);

      SIP.Utils = sipUtilsCleanup;
    });
  });

  describe('when calling getLocalStreams', function() { 
    it('should return RTCMediaHandler', function() {
      InviteContext.rtcMediaHandler = jasmine.createSpyObj('rtcMediaHandler', ['peerConnection']);

      InviteContext.rtcMediaHandler.peerConnection = jasmine.createSpyObj('peerConnection', ['getLocalStreams']);

      InviteContext.rtcMediaHandler.peerConnection.getLocalStreams.andCallFake(function() {
        return 'correct';
      });

      expect(InviteContext.getLocalStreams()).toBe('correct');
    });
  });

  describe('when calling getRemoteStreams', function() { 
    it('should return RTCMediaHandler', function() {
      InviteContext.rtcMediaHandler = jasmine.createSpyObj('rtcMediaHandler', ['peerConnection']);

      InviteContext.rtcMediaHandler.peerConnection = jasmine.createSpyObj('peerConnection', ['getRemoteStreams']);

      InviteContext.rtcMediaHandler.peerConnection.getRemoteStreams.andCallFake(function() {
        return 'correct';
      });

      expect(InviteContext.getRemoteStreams()).toBe('correct');
    });
  });

  describe('when calling close', function() {
    beforeEach(function() {
      InviteContext.ua = jasmine.createSpyObj('ua',['getLogger']);
      InviteContext.ua.getLogger.andCallFake(function(){
        return jasmine.createSpyObj('logger',['log']);
      });

      InviteContext.rtcMediaHandler = jasmine.createSpyObj('rtcMediaHandler', ['close']);
      InviteContext.rtcMediaHandler.close.andCallFake(function(){
        return true;
      });

      InviteContext.dialog = jasmine.createSpyObj('dialog', ['terminate']);
      InviteContext.dialog.terminate.andCallFake(function() {
        return true;
      });

      InviteContext.status = 12;
    });

    it('should return InviteContext if the status is terminated already', function() {
      InviteContext.status = 9;
      expect(InviteContext.close()).toBe(InviteContext);
    });

    it('should delete the session from the ua, delete the dialog, and return the InviteContext on success', function() {
      InviteContext.id = 777;
      InviteContext.ua.sessions = [{777: InviteContext}];

      expect(InviteContext.close()).toBe(InviteContext);
      expect(InviteContext.dialog).toBeUndefined();
      expect(InviteContext.ua.sessions[777]).toBeUndefined();
    });
  });

  describe('when calling createDialog', function() {
    var message;

    beforeEach(function() {
      message = {
        to_tag: 'to',
        from_tag: 'from',
        call_id: 'call'
      };

      InviteContext.earlyDialogs = [];

      InviteContext.ua = jasmine.createSpyObj('ua',['getLogger']);
      InviteContext.ua.getLogger.andCallFake(function(){
        return jasmine.createSpyObj('logger',['log', 'error']);
      });

      sipDialogCleanup = SIP.Dialog;

      spyOn(SIP, 'Dialog').andCallFake(function() {
        return { error: false, update: function(x, y) {return true;} };
      });
      SIP.Dialog.C =  {STATUS_EARLY: 0};
    });

    afterEach(function() {
      SIP.Dialog = sipDialogCleanup;
    });

    it('should return true and put the dialog in the early dialogs array on a success call with early = true, type= UAS', function() {
      expect(InviteContext.createDialog(message, 'UAS', true)).toBe(true);
      expect(InviteContext.earlyDialogs['calltofrom']).toBeDefined();
    });

    it('should return true and put the dialog in the early dialogs array on a success call with early = true, type = UAC', function() {
      expect(InviteContext.createDialog(message, 'UAC', true)).toBe(true);
      expect(InviteContext.earlyDialogs['callfromto']).toBeDefined();
    });

    it('should return false if early_dialog.error is true when early = true', function(){
      SIP.Dialog = jasmine.createSpy('errorSpy').andCallFake(function() {
        return { error: true, update: function(x, y) {return true;} };
      });
      SIP.Dialog.C =  {STATUS_EARLY: 0};

      spyOn(InviteContext, 'failed').andCallFake(function() {
        return true;
      });

      expect(InviteContext.createDialog(message, 'UAC', true)).toBe(false);
    });

    it('should create an early dialog, then update it; return true, no longer in early dialog array', function() {
      expect(InviteContext.createDialog(message, 'UAC', true)).toBe(true);
      expect(InviteContext.earlyDialogs['callfromto']).toBeDefined();
      
      expect(InviteContext.createDialog(message, 'UAC', false)).toBe(true);
      expect(InviteContext.earlyDialogs['callfromto']).toBeUndefined();
    });

    it('should return false if dialog.error is true when early = false', function() {
      SIP.Dialog = jasmine.createSpy('errorSpy').andCallFake(function() {
        return { error: true, update: function(x, y) {return true;} };
      });
      SIP.Dialog.C =  {STATUS_EARLY: 0};

      spyOn(InviteContext, 'failed').andCallFake(function() {
        return true;
      });

      expect(InviteContext.createDialog(message, 'UAC', false)).toBe(false);
    });

    it('should return true on a call where early = false', function() {
      expect(InviteContext.createDialog(message, 'UAC', false)).toBe(true);
    });
  });

  describe('when calling isReadyToReinvite', function() {
    beforeEach(function() {
      InviteContext.rtcMediaHandler = jasmine.createSpyObj('rtcMediaHandler', ['isReady']);
      InviteContext.rtcMediaHandler.isReady.andCallFake(function(){
        return true;
      });

      InviteContext.dialog = {uac_pending_reply: false, uas_pending_reply: false};
    });

    it('should return false if rtcMediaHandler.isReady() returns false', function() {
      InviteContext.rtcMediaHandler.isReady.andCallFake(function() {
        return false;
      });

      expect(InviteContext.isReadyToReinvite()).toBe(false);
    });

    it('should return false if either of the pending_reply options are true', function() {
      InviteContext.dialog.uac_pending_reply = true;
      expect(InviteContext.isReadyToReinvite()).toBe(false);

      InviteContext.dialog.uac_pending_reply = false;
      InviteContext.dialog.uas_pending_reply = true;
      expect(InviteContext.isReadyToReinvite()).toBe(false);
    });

    it('should return true if all above conditions are met', function() {
      expect(InviteContext.isReadyToReinvite()).toBe(true);
    });
  });

  describe('when calling mute', function() {
    beforeEach(function() {
      InviteContext.audioMuted = false;
      InviteContext.videoMuted = false;

      InviteContext.rtcMediaHandler = jasmine.createSpyObj('rtcMediaHandler', ['peerConnection']);
      InviteContext.rtcMediaHandler.peerConnection = jasmine.createSpyObj('peerConnection', ['getLocalStreams']);
      InviteContext.rtcMediaHandler.peerConnection.getLocalStreams.andCallFake(function() {
        return [ {
          getAudioTracks: function() {return [7];}, 
          getVideoTracks: function() {return [7];}
        }];
      });

      spyOn(InviteContext, 'toggleMuteAudio').andCallFake(function() {
        return true;
      });
      spyOn(InviteContext, 'toggleMuteVideo').andCallFake(function() {
        return true;
      });

      InviteContext.emit = jasmine.createSpy('emit');
    });

    it('should set audio and video muted to true if they are both present (no options)', function() {
      InviteContext.mute();

      expect(InviteContext.audioMuted).toBe(true);
      expect(InviteContext.videoMuted).toBe(true);
      expect(InviteContext.emit.calls[0].args[0]).toEqual('muted');
    });

    it('should set audio and video muted to true if they are both present (options)', function() {
      InviteContext.mute({audio: true, video: true});

      expect(InviteContext.audioMuted).toBe(true);
      expect(InviteContext.videoMuted).toBe(true);
      expect(InviteContext.emit.calls[0].args[0]).toEqual('muted');
    });

    it('should only set video if audio is not present', function() {
      InviteContext.mute({audio: false, video: true});

      expect(InviteContext.audioMuted).toBe(false);
      expect(InviteContext.videoMuted).toBe(true);
      expect(InviteContext.emit.calls[0].args[0]).toEqual('muted');
    });

    it('should only set audio if video is not present', function() {
      InviteContext.mute({audio: true, video: false});

      expect(InviteContext.audioMuted).toBe(true);
      expect(InviteContext.videoMuted).toBe(false);
      expect(InviteContext.emit.calls[0].args[0]).toEqual('muted');
    });

    it('should set neither if neither is present and not emit muted', function() {

      InviteContext.mute({audio: false, video: false});

      expect(InviteContext.audioMuted).toBe(false);
      expect(InviteContext.videoMuted).toBe(false);
      expect(InviteContext.emit.calls[0]).toBeUndefined();
    });

    it('should set neither if both are already muted and not emit muted', function() {
      InviteContext.audioMuted = true;
      InviteContext.videoMuted = true;

      InviteContext.mute({audio: true, video: true});

      expect(InviteContext.audioMuted).toBe(true);
      expect(InviteContext.videoMuted).toBe(true);
      expect(InviteContext.emit.calls[0]).toBeUndefined();
    });
  });

  describe('when calling unmute', function() {
    beforeEach(function() {
      InviteContext.audioMuted = true;
      InviteContext.videoMuted = true;
      InviteContext.local_hold = false;

      InviteContext.rtcMediaHandler = jasmine.createSpyObj('rtcMediaHandler', ['peerConnection']);
      InviteContext.rtcMediaHandler.peerConnection = jasmine.createSpyObj('peerConnection', ['getLocalStreams']);
      InviteContext.rtcMediaHandler.peerConnection.getLocalStreams.andCallFake(function() {
        return [ {
          getAudioTracks: function() {return [7];}, 
          getVideoTracks: function() {return [7];}
        }];
      });

      spyOn(InviteContext, 'toggleMuteAudio').andCallFake(function() {
        return true;
      });
      spyOn(InviteContext, 'toggleMuteVideo').andCallFake(function() {
        return true;
      });

      InviteContext.emit = jasmine.createSpy('emit');
    });

    it('should set audio and video muted to false if they are both present (no options)', function() {
      InviteContext.unmute();

      expect(InviteContext.audioMuted).toBe(false);
      expect(InviteContext.videoMuted).toBe(false);
      expect(InviteContext.emit.calls[0].args[0]).toEqual('unmuted');
    });

    it('should set audio and video muted to false if they are both present (options)', function() {
      InviteContext.unmute({audio: true, video: true});

      expect(InviteContext.audioMuted).toBe(false);
      expect(InviteContext.videoMuted).toBe(false);
      expect(InviteContext.emit.calls[0].args[0]).toEqual('unmuted');
    });

    it('should only set video if audio is not present', function() {
      InviteContext.unmute({audio: false, video: true});

      expect(InviteContext.audioMuted).toBe(true);
      expect(InviteContext.videoMuted).toBe(false);
      expect(InviteContext.emit.calls[0].args[0]).toEqual('unmuted');
    });

    it('should only set audio if video is not present', function() {
      InviteContext.unmute({audio: true, video: false});

      expect(InviteContext.audioMuted).toBe(false);
      expect(InviteContext.videoMuted).toBe(true);
      expect(InviteContext.emit.calls[0].args[0]).toEqual('unmuted');
    });

    it('should set neither if neither is present and not emit unmuted', function() {
      InviteContext.unmute({audio: false, video: false});

      expect(InviteContext.audioMuted).toBe(true);
      expect(InviteContext.videoMuted).toBe(true);
      expect(InviteContext.emit.calls[0]).toBeUndefined();
    });

    it('should set neither if both are already unmuted and not emit unmuted', function() {
      InviteContext.audioMuted = false;
      InviteContext.videoMuted = false;

      InviteContext.unmute({audio: true, video: true});

      expect(InviteContext.audioMuted).toBe(false);
      expect(InviteContext.videoMuted).toBe(false);
      expect(InviteContext.emit.calls[0]).toBeUndefined();
    });

    //Note: the local_hold conditional doesn't change anything in terms of this code; as long as
    //the variables are set properly the hold code will work properly with this.
  });

  describe('when isMuted is called', function() {
    var result;

    it('should return the audioMuted and videoMuted variables', function() {
      InviteContext.audioMuted = 'audio';
      InviteContext.videoMuted = 'video';

      result = InviteContext.isMuted();

      expect(result.audio).toBe('audio');
      expect(result.video).toBe('video');
    });
  });

  describe('when toggleMuteAudio is called', function() {
    var change;

    beforeEach(function() {
      change = {enabled: true};

      InviteContext.getLocalStreams = function() {
        return [{getAudioTracks: function() { return [change]; }}];
      };
    });

    it('should set enabled to false', function() {
      InviteContext.toggleMuteAudio(true);
      expect(InviteContext.getLocalStreams()[0].getAudioTracks()[0].enabled).toBe(false);
    });

    it('should set enabled to true', function() {
      change = {enabled: false};

      InviteContext.toggleMuteAudio(false);
      expect(InviteContext.getLocalStreams()[0].getAudioTracks()[0].enabled).toBe(true);
    });

    it('should not change enabled', function() {
      InviteContext.toggleMuteAudio(false);
      expect(InviteContext.getLocalStreams()[0].getAudioTracks()[0].enabled).toBe(true);
    });
  });

  describe('when toggleMuteVideo is called', function() {
    var change;

    beforeEach(function() {
      change = {enabled: true};

      InviteContext.getLocalStreams = function() {
        return [{getVideoTracks: function() { return [change]; }}];
      };
    });

    it('should set enabled to false', function() {
      InviteContext.toggleMuteVideo(true);
      expect(InviteContext.getLocalStreams()[0].getVideoTracks()[0].enabled).toBe(false);
    });

    it('should set enabled to true', function() {
      change = {enabled: false};

      InviteContext.toggleMuteVideo(false);
      expect(InviteContext.getLocalStreams()[0].getVideoTracks()[0].enabled).toBe(true);
    });

    it('should not change enabled', function() {
      InviteContext.toggleMuteVideo(false);
      expect(InviteContext.getLocalStreams()[0].getVideoTracks()[0].enabled).toBe(true);
    });
  });

  describe('when hold is called', function() {

    beforeEach(function() {
      InviteContext.emit = jasmine.createSpy('emit');
      InviteContext.status = 12;

      InviteContext.isReadyToReinvite = function(){
        return true;
      };

      InviteContext.toggleMuteAudio = function() {};
      InviteContext.toggleMuteVideo = function() {};
      InviteContext.sendReinvite = function() {};
    });

    it('should throw an error if the session is in the incorrect state', function() {
      InviteContext.status = 0;

      expect(function(){InviteContext.hold()}).toThrow('Invalid status: 0');
    });

    //Note: the pending actions conditionals were skipped because it wouldn't test
    //anything in relation to this function.

    it('should not emit hold if local hold is true', function() {
      InviteContext.local_hold = true;

      InviteContext.hold();

      expect(InviteContext.emit.calls[0]).toBeUndefined();
    });

    it('should emit hold on success', function() {
      InviteContext.hold();

      expect(InviteContext.emit.calls[0].args[0]).toEqual('hold');
    });
  });

  describe('when unhold is called', function() {
    beforeEach(function() {
      InviteContext.emit = jasmine.createSpy('emit');
      InviteContext.status = 12;
      InviteContext.local_hold = true;
      //Note: what's up with these checks, seem backwards
      InviteContext.audioMuted = true;
      InviteContext.videoMuted = true;

      InviteContext.isReadyToReinvite = function(){
        return true;
      };

      InviteContext.sendReinvite = function() {};
    });

    //Note: the pending actions conditionals were skipped because it wouldn't test
    //anything in relation to this function.

    it('should throw an error if the session is in the incorrect state', function() {
      InviteContext.status = 0;

      expect(function(){InviteContext.unhold()}).toThrow('Invalid status: 0');
    });

    it('should not emit unhold if local hold is false', function() {
      InviteContext.local_hold = false;

      InviteContext.unhold();

      expect(InviteContext.emit.calls[0]).toBeUndefined();
    });

    it('should emit unhold on success', function() {
      InviteContext.unhold();

      expect(InviteContext.emit.calls[0].args[0]).toEqual('unhold');
    });
  });

  describe('when isOnHold is called', function() {
    it('should return the values of local_hold and remote_hold', function() {
      InviteContext.local_hold = 'local';
      InviteContext.remote_hold = 'remote';

      var holds = InviteContext.isOnHold();

      expect(holds.local).toBe('local');
      expect(holds.remote).toBe('remote');
    });
  });
});

describe('InviteServerContext', function() {
  var InviteServerContext;
  var ua;
  var request;

  beforeEach(function(){
    request = 'request';
    ua = jasmine.createSpyObj('ua',['getLogger','normalizeTarget','applicants']);;
    ua.getLogger.andCallFake(function(){
      return jasmine.createSpyObj('logger',['log']);
    });
    ua.normalizeTarget.andCallFake(function(){
      return true;
    });
    InviteServerContext = new SIP.InviteServerContext(ua,method,target);
  });
});

describe('InviteClientContext', function() {
  var InviteClientContext;
  var ua;
  var target;

  beforeEach(function(){
    target = 'target';
    ua = jasmine.createSpyObj('ua',['getLogger','normalizeTarget','applicants']);
    ua.getLogger.andCallFake(function(){
      return jasmine.createSpyObj('logger',['log']);
    });
    ua.normalizeTarget.andCallFake(function(){
      return true;
    });
    InviteClientContext = new SIP.InviteClientContext(ua,method,target);
  });
});