describe('MediaStreamManager', function() {
  var mediaStreamManager;
  var MediaStreamManager = SIP.WebRTC.MediaStreamManager;

  beforeEach(function () {
    mediaStreamManager = new MediaStreamManager();
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
  });

  describe('.release', function () {
    it('calls stop() on the MediaStream it was passed', function () {
      spyOn(SIP.WebRTC, 'getUserMedia').andCallFake(function () {
        var stream = {
          stop: function () {}
        };
        spyOn(stream, 'stop');
        return stream;
      });

      mediaStreamManager.acquire(
        function onSuccess (stream) {
          mediaStreamManager.release(stream);
          expect(stream.stop).toHaveBeenCalled();
        },
        function onFailure () {
          throw new Error();
        },
        {constraints: {audio: true}}
      );
    });
  });

  describe('.acquire({stream})', function () {
    var stream;
    var onSuccess;
    var onFailure;
    var mediaHint;

    beforeEach(function () {
      stream = jasmine.createSpyObj('stream', ['stop']);
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
