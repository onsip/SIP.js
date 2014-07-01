describe('MediaStreamManager', function() {
  var mediaStreamManager;
  var MediaStreamManager = SIP.WebRTC.MediaStreamManager;

  beforeEach(function () {
    mediaStreamManager = new MediaStreamManager();
  });

  it('initializes its events', function () {
    expect(mediaStreamManager.checkEvent('userMediaRequest')).toEqual(true);
    expect(mediaStreamManager.checkEvent('userMedia')).toEqual(true);
    expect(mediaStreamManager.checkEvent('userMediaFailed')).toEqual(true);
  });

  describe('.acquire({constraints})', function () {
    it('passes constraints to SIP.WebRTC.getUserMedia', function () {
      spyOn(SIP.WebRTC, 'getUserMedia');
      var onSuccess = function yay () {};
      var onFailure = function boo () {};
      var constraints = {audio: false, video: true};
      mediaStreamManager.acquire(onSuccess, onFailure, {constraints: constraints});
      expect(SIP.WebRTC.getUserMedia.mostRecentCall.args[0]).toEqual(constraints);
    });

    it('emits userMediaRequest before calling getUserMedia', function () {
      spyOn(SIP.WebRTC, 'getUserMedia');
      var onUMR = jasmine.createSpy().andCallFake(function () {
        expect(SIP.WebRTC.getUserMedia).not.toHaveBeenCalled();
      });
      mediaStreamManager.on('userMediaRequest', onUMR);

      mediaStreamManager.acquire(new Function(), new Function(), {
        constraints: {
          audio: true,
          video: true
        }
      });

      expect(onUMR).toHaveBeenCalled();
      expect(SIP.WebRTC.getUserMedia).toHaveBeenCalled();
    });

    it('emits userMedia when getUserMedia calls a success callback', function () {
      var myStream = { foo: 'bar' };
      spyOn(SIP.WebRTC, 'getUserMedia').andCallThrough();

      var success = jasmine.createSpy('success');
      var failure = jasmine.createSpy('failure');
      var onUM = jasmine.createSpy('userMedia');

      mediaStreamManager.on('userMedia', onUM);

      runs(function () {
        mediaStreamManager.acquire(success, failure, {
          constraints: {
            audio: true,
            video: true
          }
        });
      });

      waitsFor(function () {
        return onUM.calls.length > 0 &&
          success.calls.length > 0 &&
          failure.calls.length === 0;
      }, "success callback/listener to be called", 100);
    });

    it('emits userMediaFailed when getUserMedia calls a failure callback', function () {
      spyOn(SIP.WebRTC, 'getUserMedia').andCallFake(function (c, s, f) {
        f();
      });

      var success = jasmine.createSpy('success');
      var failure = jasmine.createSpy('failure');
      var onUMF = jasmine.createSpy('userMediaFailed');

      mediaStreamManager.on('userMediaFailed', onUMF);

      mediaStreamManager.acquire(success, failure, {
        constraints: {
          audio: true,
          video: true
        }
      });

      expect(onUMF).toHaveBeenCalled();
      expect(success).not.toHaveBeenCalled();
      expect(failure).toHaveBeenCalled();
    });

  });

  describe('.release', function () {
    it('calls stop() on the MediaStream it was passed', function () {
      var acquiredStream;
      runs(function () {
        mediaStreamManager.acquire(
          function onSuccess (stream) {
            acquiredStream = stream;
            mediaStreamManager.release(stream);
          },
          function onFailure () {
            throw new Error();
          },
          {constraints: {audio: true}}
        );
      });

      waitsFor(function () {
        return acquiredStream && acquiredStream.stop.calls.length > 0;
      }, "stream.stop() to be called", 100);
    });
  });

  describe('.acquire({stream})', function () {
    var stream;
    var onSuccess;
    var onFailure;
    var mediaHint;

    beforeEach(function () {
      stream = navigator.getUserMedia.fakeStream();
      onSuccess = jasmine.createSpy('onSuccess');
      onFailure = jasmine.createSpy('onFailure');
      mediaHint = {stream: stream, constraints: {audio: true}};
    });

    it('.acquire ignores constraints and succeeds with the stream', function () {
      mediaStreamManager.acquire(onSuccess, onFailure, mediaHint);
      expect(onSuccess).toHaveBeenCalledWith(mediaHint.stream);
    });

    it('.acquire called twice in a row does not fail', function () {
      mediaStreamManager.acquire(onSuccess, onFailure);
      mediaStreamManager.acquire(onSuccess, onFailure);
      expect(onFailure).not.toHaveBeenCalled();
    });

    it('.acquire when mediaHint is a stream', function() {
      spyOn(SIP.WebRTC, 'getUserMedia');
      spyOn(SIP.Utils, 'isMediaStream').andReturn(true);

      mediaStreamManager.acquire(onSuccess, onFailure, stream);
      expect(SIP.Utils.isMediaStream(stream)).toEqual(true);
      expect(SIP.WebRTC.getUserMedia).not.toHaveBeenCalled();
      expect(onSuccess).toHaveBeenCalledWith(stream);
    });

    it('.release does not stop the stream', function () {
      mediaStreamManager.acquire(onSuccess, onFailure, mediaHint);
      mediaStreamManager.release(stream);
      expect(stream.stop).not.toHaveBeenCalled();
    });
  });
});
