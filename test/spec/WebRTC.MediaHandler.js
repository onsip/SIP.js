describe('WebRTC.MediaHandler', function() {
  // below code copied from SpecSession.js
  var Session;
  var ua;
  var MediaHandler;

  beforeEach(function() {
    ua = new SIP.UA({uri: 'alice@example.com'}).start();

    Session = new SIP.EventEmitter();
    SIP.Utils.augment(Session, SIP.Session, []);

    Session.ua = ua;

    MediaHandler = new SIP.WebRTC.MediaHandler(Session);
  });

  afterEach(function() {
    if(ua.status !== 2) {
      ua.stop();
    };
  });
  // above code copied from SpecSession.js

  it('sets mediaStreamManager if passed to constructor', function () {
    // default case is already set up by beforeEach
    expect(MediaHandler.mediaStreamManager instanceof SIP.WebRTC.MediaStreamManager).toBe(true);

    // custom case
    var mediaStreamManager = Object.create(SIP.WebRTC.MediaStreamManager.prototype);
    MediaHandler = new SIP.WebRTC.MediaHandler(Session, {mediaStreamManager: mediaStreamManager});
    expect(MediaHandler.mediaStreamManager).toBe(mediaStreamManager);
  });

  it('echoes MediaStreamManager events', function () {
    var callbacks = {
      umr: jasmine.createSpy('request'),
      um: jasmine.createSpy('success'),
      umf: jasmine.createSpy('failure')
    };

    MediaHandler.on('userMedia', callbacks.um);
    MediaHandler.on('userMediaRequest', callbacks.umr);
    MediaHandler.on('userMediaFailed', callbacks.umf);

    MediaHandler.mediaStreamManager.emit('userMedia', 1, 2, 3);
    expect(callbacks.um).toHaveBeenCalledWith(1, 2, 3);

    MediaHandler.mediaStreamManager.emit('userMediaRequest', 4, 5, 6);
    expect(callbacks.umr).toHaveBeenCalledWith(4, 5, 6);

    MediaHandler.mediaStreamManager.emit('userMediaFailed', 7, 8, 9);
    expect(callbacks.umf).toHaveBeenCalledWith(7, 8, 9);
  });

  it('initializes mute state info', function() {
    expect(MediaHandler.audioMuted).toBe(false);
    expect(MediaHandler.videoMuted).toBe(false);
  });

  describe('.render', function () {
    it("doesn't throw if renderHint and this.mediaHint are missing", function () {
      expect(MediaHandler.render.bind(MediaHandler)).not.toThrow();
    });
  });


  describe('.getLocalStreams', function() {
    it('returns peerConnection.getLocalStreams()', function() {
      MediaHandler.peerConnection = {getLocalStreams: jasmine.createSpy('getLocalStreams').and.returnValue([])};

      expect(MediaHandler.getLocalStreams()).toEqual([]);
    });
  });

  describe('.getRemoteStreams', function() {
    it('returns peerConnection.getRemoteStreams()', function() {
      MediaHandler.peerConnection = {getRemoteStreams: jasmine.createSpy('getRemoteStreams').and.returnValue([])};

      expect(MediaHandler.getRemoteStreams()).toEqual([]);
    });
  });

  describe('.mute', function() {
    beforeEach(function() {
      MediaHandler.audioMuted = false;
      MediaHandler.videoMuted = false;

      MediaHandler.peerConnection = {signalingState: 'stable', getLocalStreams: jasmine.createSpy('getLocalStreams').and.returnValue([ {
        getAudioTracks: function() {return [7];},
        getVideoTracks: function() {return [7];},
        stop: function() {}
      }])};

      spyOn(MediaHandler, 'toggleMuteAudio').and.returnValue(true);
      spyOn(MediaHandler, 'toggleMuteVideo').and.returnValue(true);

      spyOn(Session, 'emit');
    });

    it('sets audio and video muted to true if they are both present (no options)', function() {
      MediaHandler.mute();

      expect(MediaHandler.audioMuted).toBe(true);
      expect(MediaHandler.videoMuted).toBe(true);
    });

    it('sets audio and video muted to true if they are both present (options)', function() {
      MediaHandler.mute({audio: true, video: true});

      expect(MediaHandler.audioMuted).toBe(true);
      expect(MediaHandler.videoMuted).toBe(true);
      //expect(Session.emit.calls[0].args[0]).toBe('muted');
    });

    it('only sets video if audio is not present', function() {
      MediaHandler.mute({audio: false, video: true});

      expect(MediaHandler.audioMuted).toBe(false);
      expect(MediaHandler.videoMuted).toBe(true);
      //expect(Session.emit.calls[0].args[0]).toBe('muted');
    });

    it('only sets audio if video is not present', function() {
      MediaHandler.mute({audio: true, video: false});

      expect(MediaHandler.audioMuted).toBe(true);
      expect(MediaHandler.videoMuted).toBe(false);
      //expect(Session.emit.calls[0].args[0]).toBe('muted');
    });

    it('sets neither if neither is present and does not emit muted', function() {
      MediaHandler.mute({audio: false, video: false});

      expect(MediaHandler.audioMuted).toBe(false);
      expect(MediaHandler.videoMuted).toBe(false);
      //expect(Session.emit).not.toHaveBeenCalled();
    });

    it('sets neither if both are already muted and does not emit muted', function() {
      MediaHandler.audioMuted = true;
      MediaHandler.videoMuted = true;

      MediaHandler.mute({audio: true, video: true});

      expect(MediaHandler.audioMuted).toBe(true);
      expect(MediaHandler.videoMuted).toBe(true);
      //expect(Session.emit).not.toHaveBeenCalled();
    });
  });

  describe('.unmute', function() {
    beforeEach(function() {
      MediaHandler.audioMuted = true;
      MediaHandler.videoMuted = true;
      Session.local_hold = false;

      MediaHandler.peerConnection = {signalingState: 'stable', getLocalStreams: jasmine.createSpy('getLocalStreams').and.returnValue([ {
        getAudioTracks: function() {return [7];},
        getVideoTracks: function() {return [7];},
        stop: function() {}
      }])};

      spyOn(MediaHandler, 'toggleMuteAudio').and.returnValue(true);
      spyOn(MediaHandler, 'toggleMuteVideo').and.returnValue(true);

      spyOn(Session, 'emit');
    });

    it('sets audio and video muted to false if they are both present (no options)', function() {
      MediaHandler.unmute();

      expect(MediaHandler.audioMuted).toBe(false);
      expect(MediaHandler.videoMuted).toBe(false);
      //expect(Session.emit.calls[0].args[0]).toBe('unmuted');
    });

    it('sets audio and video muted to false if they are both present (options)', function() {
      MediaHandler.unmute({audio: true, video: true});

      expect(MediaHandler.audioMuted).toBe(false);
      expect(MediaHandler.videoMuted).toBe(false);
      //expect(Session.emit.calls[0].args[0]).toBe('unmuted');
    });

    it('only sets video if audio is not present', function() {
      MediaHandler.unmute({audio: false, video: true});

      expect(MediaHandler.audioMuted).toBe(true);
      expect(MediaHandler.videoMuted).toBe(false);
      //expect(Session.emit.calls[0].args[0]).toBe('unmuted');
    });

    it('onlys set audio if video is not present', function() {
      MediaHandler.unmute({audio: true, video: false});

      expect(MediaHandler.audioMuted).toBe(false);
      expect(MediaHandler.videoMuted).toBe(true);
      //expect(Session.emit.calls[0].args[0]).toBe('unmuted');
    });

    it('sets neither if neither is present and does not emit unmuted', function() {
      MediaHandler.unmute({audio: false, video: false});

      expect(MediaHandler.audioMuted).toBe(true);
      expect(MediaHandler.videoMuted).toBe(true);
      //expect(Session.emit).not.toHaveBeenCalled();
    });

    it('sets neither if both are already unmuted and does not emit unmuted', function() {
      MediaHandler.audioMuted = false;
      MediaHandler.videoMuted = false;

      MediaHandler.unmute({audio: true, video: true});

      expect(MediaHandler.audioMuted).toBe(false);
      expect(MediaHandler.videoMuted).toBe(false);
      //expect(Session.emit).not.toHaveBeenCalled();
    });

    //Note: the local_hold conditional doesn't change anything in terms of this code; as long as
    //the variables are set properly the hold code will work properly with this.
  });

  describe('.isMuted', function() {
    var result;

    it('returns the audioMuted and videoMuted variables', function() {
      MediaHandler.audioMuted = 'audio';
      MediaHandler.videoMuted = 'video';

      expect(MediaHandler.isMuted()).toEqual({audio: 'audio', video: 'video'});
    });
  });

  describe('.toggleMuteAudio', function() {
    var change;

    beforeEach(function() {
      change = {enabled: true};

      MediaHandler.peerConnection = {signalingState: 'stable'};
      spyOn(MediaHandler, 'getLocalStreams').and.returnValue([{getAudioTracks: function() { return [change]; }}]);
    });

    it('sets enabled to false', function() {
      expect(MediaHandler.getLocalStreams()[0].getAudioTracks()[0].enabled).toBe(true);
      MediaHandler.toggleMuteAudio(true);
      expect(MediaHandler.getLocalStreams()[0].getAudioTracks()[0].enabled).toBe(false);
    });

    it('sets enabled to true', function() {
      change = {enabled: false};

      expect(MediaHandler.getLocalStreams()[0].getAudioTracks()[0].enabled).toBe(false);
      MediaHandler.toggleMuteAudio(false);
      expect(MediaHandler.getLocalStreams()[0].getAudioTracks()[0].enabled).toBe(true);
    });

    it('does not set enabled', function() {
      expect(MediaHandler.getLocalStreams()[0].getAudioTracks()[0].enabled).toBe(true);
      MediaHandler.toggleMuteAudio(false);
      expect(MediaHandler.getLocalStreams()[0].getAudioTracks()[0].enabled).toBe(true);
    });
  });

  describe('.toggleMuteVideo', function() {
    var change;

    beforeEach(function() {
      change = {enabled: true};

      spyOn(MediaHandler, 'getLocalStreams').and.returnValue([{getVideoTracks: function() { return [change]; }}]);
    });

    it('sets enabled to false', function() {
      expect(MediaHandler.getLocalStreams()[0].getVideoTracks()[0].enabled).toBe(true);
      MediaHandler.toggleMuteVideo(true);
      expect(MediaHandler.getLocalStreams()[0].getVideoTracks()[0].enabled).toBe(false);
    });

    it('sets enabled to true', function() {
      change = {enabled: false};

      expect(MediaHandler.getLocalStreams()[0].getVideoTracks()[0].enabled).toBe(false);
      MediaHandler.toggleMuteVideo(false);
      expect(MediaHandler.getLocalStreams()[0].getVideoTracks()[0].enabled).toBe(true);
    });

    it('does not set enabled', function() {
      expect(MediaHandler.getLocalStreams()[0].getVideoTracks()[0].enabled).toBe(true);
      MediaHandler.toggleMuteVideo(false);
      expect(MediaHandler.getLocalStreams()[0].getVideoTracks()[0].enabled).toBe(true);
    });
  });

  describe('.setDescription', function () {
    it('emits setDescription before creating RTCSessionDescription', function () {
      spyOn(SIP.WebRTC, 'RTCSessionDescription');

      var mySDP = 'foo';

      var onSetDescription = jasmine.createSpy().and.callFake(function (raw) {
        expect(raw.sdp).toEqual(mySDP);
        expect(SIP.WebRTC.RTCSessionDescription).not.toHaveBeenCalled();
      });
      MediaHandler.on('setDescription', onSetDescription);

      MediaHandler.setDescription(mySDP, new Function(), new Function());

      expect(onSetDescription).toHaveBeenCalled();
      expect(SIP.WebRTC.RTCSessionDescription).toHaveBeenCalled();
    });
  });

  describe('.getReferMedia', function () {
    function fakeStreamArray (hasAudioTracks, hasVideoTracks) {
      function fakeTracks (hasTracks) {
        return hasTracks ? [ 1 ] : [];
      }

      return [{
        getAudioTracks: fakeTracks.bind(null, hasAudioTracks),
        getVideoTracks: fakeTracks.bind(null, hasVideoTracks)
      }];
    }

    it('returns audio-only constraints if local audio/video and remote audio', function () {
      spyOn(MediaHandler, 'getLocalStreams').and.returnValue(fakeStreamArray(true, true));
      spyOn(MediaHandler, 'getRemoteStreams').and.returnValue(fakeStreamArray(true, false));

      var referMedia = MediaHandler.getReferMedia();

      expect(referMedia.constraints.audio).toBe(true);
      expect(referMedia.constraints.video).toBe(false);
    });
  });
});
