describe('MediaStreamManager', function () {
  var mediaStreamManager;
  var MediaStreamManager = SIP.WebRTC.MediaStreamManager;

  beforeEach(function () {
    mediaStreamManager = new MediaStreamManager();
  });

  it('throws an exception if WebRTC is not supported', function () {
    spyOn(SIP.WebRTC, 'isSupported').and.returnValue(false);
    expect(function() {new MediaStreamManager();}).toThrow(new SIP.Exceptions.NotSupportedError('Media not supported'));
  });

  it('initializes its events', function () {
    expect(mediaStreamManager.checkEvent('userMediaRequest')).toEqual(true);
    expect(mediaStreamManager.checkEvent('userMedia')).toEqual(true);
    expect(mediaStreamManager.checkEvent('userMediaFailed')).toEqual(true);
  });

  it('defines mediaHint and acquisitions', function () {
    expect(mediaStreamManager.mediaHint).toBeDefined();
    expect(mediaStreamManager.acquisitions).toBeDefined();
  });

  describe('.acquire({constraints})', function () {
    var onSuccess, onFailure;

    beforeEach(function () {
      spyOn(SIP.WebRTC, 'getUserMedia');
      onSuccess = function yay () {};
      onFailure = function boo () {};
    });

    afterEach(function() {
      SIP.WebRTC.getUserMedia.calls.reset();
    })

    it('passes constraints to SIP.WebRTC.getUserMedia', function (done) {
      var constraints = {audio: false, video: true};
      mediaStreamManager.acquire(onSuccess, onFailure, {constraints: constraints});
      setTimeout(function () {
        expect(SIP.WebRTC.getUserMedia.calls.mostRecent().args[0]).toEqual(constraints);
        done();
      }, 0);
    });

    it('emits userMediaRequest before calling getUserMedia', function (done) {
      var onUMR = function () {
        expect(SIP.WebRTC.getUserMedia).not.toHaveBeenCalled();
        SIP.WebRTC.getUserMedia.and.callFake(function () {
          done();
        });
      };
      mediaStreamManager.on('userMediaRequest', onUMR);

      mediaStreamManager.acquire(onSuccess, onFailure, {
        constraints: {
          audio: true,
          video: true
        }
      });
    });

    describe('emits userMedia when getUserMedia calls a success callback', function () {

      var myStream = { foo: 'bar' };

      var success = jasmine.createSpy('success');
      var failure = jasmine.createSpy('failure');
      var onUM = jasmine.createSpy('userMedia');

      beforeEach(function (done) {
        success.and.callFake(function(){done();});

        SIP.WebRTC.getUserMedia.and.callThrough();
        mediaStreamManager.on('userMedia', onUM);
        mediaStreamManager.acquire(success, failure, {
          constraints: {
            audio: true,
            video: true
          }
        });
      });

      it('asynchronously', function () {
        expect(onUM).toHaveBeenCalled();
        expect(success).toHaveBeenCalled();
        expect(failure).not.toHaveBeenCalled();
      });
    });

    it('emits userMediaFailed when getUserMedia calls a failure callback', function () {
      var success, failure, onUMF;

      SIP.WebRTC.getUserMedia.and.callFake(function (c, s, f) {
        f();
        expect(onUMF).toHaveBeenCalled();
        expect(success).not.toHaveBeenCalled();
        expect(failure).toHaveBeenCalled();
      });

      success = jasmine.createSpy('success');
      failure = jasmine.createSpy('failure');
      onUMF = jasmine.createSpy('userMediaFailed');

      mediaStreamManager.on('userMediaFailed', onUMF);

      mediaStreamManager.acquire(success, failure, {
        constraints: {
          audio: true,
          video: true
        }
      });
    });
  });

  describe('.release', function () {
    var acquiredStream = null;

    beforeEach(function(done) {
      mediaStreamManager.acquire(
        function onSuccess (stream) {
          acquiredStream = stream;
          mediaStreamManager.release(stream);
          done();
        },
        function onFailure () {
          throw new Error();
        },
        {constraints: {audio: true}}
      );
    });

    it('calls stop() on the MediaStream it was passed', function () {
        expect(acquiredStream).not.toBeNull();
        expect(acquiredStream.stop).toHaveBeenCalled();
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

    it('.release does not stop the stream', function () {
      mediaStreamManager.acquire(onSuccess, onFailure, mediaHint);
      mediaStreamManager.release(stream);
      expect(stream.stop).not.toHaveBeenCalled();
    });
  });
});
