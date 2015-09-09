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

  it('defines mediaHint and acquisitions', function () {
    expect(mediaStreamManager.mediaHint).toBeDefined();
    expect(mediaStreamManager.acquisitions).toBeDefined();
  });

  describe('.acquire({constraints})', function () {
    var onSuccess, onFailure;

    beforeEach(function () {
      spyOn(SIP.WebRTC, 'getUserMedia').and.callThrough();
      onSuccess = function yay () {};
      onFailure = function boo () {};
    });

    afterEach(function() {
      SIP.WebRTC.getUserMedia.calls.reset();
    })

    it('passes constraints to SIP.WebRTC.getUserMedia', function (done) {
      var constraints = {audio: false, video: true};
      mediaStreamManager.acquire({constraints: constraints}).then(onSuccess, onFailure)
      .then(function () {
        expect(SIP.WebRTC.getUserMedia.calls.mostRecent().args[0]).toEqual(constraints);
        done();
      });
    });

    it('emits userMediaRequest before calling getUserMedia', function (done) {
      var onUMR = function () {
        expect(SIP.WebRTC.getUserMedia).not.toHaveBeenCalled();
        SIP.WebRTC.getUserMedia.and.callFake(function () {
          return SIP.Utils.Promise.resolve().then(done);
        });
      };
      mediaStreamManager.on('userMediaRequest', onUMR);

      mediaStreamManager.acquire({
        constraints: {
          audio: true,
          video: true
        }
      }).then(onSuccess, onFailure);
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
        mediaStreamManager.acquire({
          constraints: {
            audio: true,
            video: true
          }
        }).then(success, failure);
      });

      it('asynchronously', function () {
        expect(onUM).toHaveBeenCalled();
        expect(success).toHaveBeenCalled();
        expect(failure).not.toHaveBeenCalled();
      });
    });

    it('emits userMediaFailed when getUserMedia calls a failure callback', function (done) {
      var success, failure, onUMF;

      SIP.WebRTC.getUserMedia.and.callFake(function (c) {
        return SIP.Utils.Promise.reject();
      });

      success = jasmine.createSpy('success');
      failure = jasmine.createSpy('failure');
      onUMF = jasmine.createSpy('userMediaFailed');

      mediaStreamManager.on('userMediaFailed', onUMF);

      mediaStreamManager.acquire({
        constraints: {
          audio: true,
          video: true
        }
      }).then(success, failure)
      .then(function () {
        expect(onUMF).toHaveBeenCalled();
        expect(success).not.toHaveBeenCalled();
        expect(failure).toHaveBeenCalled();
        done();
      });
    });
  });

  describe('.release', function () {
    var acquiredStream = null;

    beforeEach(function(done) {
      mediaStreamManager.acquire(
        {constraints: {audio: true}}).then(
        function onSuccess (streams) {
          var stream = streams[0];
          acquiredStream = stream;
          mediaStreamManager.release(stream);
          done();
        },
        function onFailure () {
          throw new Error();
        }
      );
    });

    it('calls stop() on the tracks of the MediaStream it was passed', function () {
        expect(acquiredStream).not.toBeNull();
        acquiredStream.getTracks().forEach(function (track) {
          expect(track.stop).toHaveBeenCalled();
        });
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

    it('.acquire ignores constraints and succeeds with the stream', function (done) {
      mediaStreamManager.acquire(mediaHint).then(onSuccess, onFailure)
      .then(function () {
      expect(onSuccess).toHaveBeenCalledWith([mediaHint.stream]);
      done();
      });
    });

    it('.acquire called twice in a row does not fail', function (done) {
      mediaStreamManager.acquire(mediaHint).then(onSuccess, onFailure).
        then(mediaStreamManager.acquire(mediaHint)).then(onSuccess, onFailure).
        then(function () {
          expect(onSuccess).toHaveBeenCalled();
          done();
        }).
        catch(function () {
          expect(onFailure).not.toHaveBeenCalled();
          done();
        });
    });

    it('.release does not stop the stream\'s tracks', function (done) {
      mediaStreamManager.acquire(mediaHint).then(onSuccess, onFailure)
      .then(function () {
        mediaStreamManager.release(stream);
        stream.getTracks().forEach(function (track) {
          expect(track.stop).not.toHaveBeenCalled();
        });
        done();
      });
    });
  });
});
