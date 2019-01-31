var SessionDescriptionHandler = require('../../../lib/Web/SessionDescriptionHandler').SessionDescriptionHandler;
var SessionDescriptionHandlerObserver = {
  trackAdded: function() {
    return;
  },
  directionChanged: function() {
    return;
  },
};

function setIceGatheringState(pc, state) {
  pc.iceGatheringState = state;
  pc.onicegatheringstatechange.call(pc);
}

describe('Web/SessionDescriptionHandler', function() {
  var realMediaDevices,
    realRTCPeerConnection,
    handler;

  beforeEach(function() {
    var mockSession = {
      emit: function() {},
      ua: {
        getLogger: function() {
          return console;
        }
      }
    };

    // stub out WebRTC APIs
    realMediaDevices = window.navigator.mediaDevices;
    realRTCPeerConnection = window.RTCPeerConnection;
    window.RTCPeerConnection = function() {
        this.iceGatheringState = 'new';
    };
    window.RTCPeerConnection.prototype.close = function() {};
    window.RTCPeerConnection.prototype.getReceivers = function() {
      return [];
    };
    window.RTCPeerConnection.prototype.getSenders = function() {
      return [];
    };

    window.navigator.mediaDevices = {
      getUserMedia: function() {}
    };

    handler = new SessionDescriptionHandler(console, SessionDescriptionHandlerObserver, {
      peerConnectionOptions: {
        iceCheckingTimeout: 500
      }
    });
  });

  afterEach(function() {
    handler.close();

    window.navigator.mediaDevices = realMediaDevices;
    window.RTCPeerConnection = realRTCPeerConnection;
  });

  it('creates instance', function() {
    expect(handler).toBeTruthy();
    expect(handler.iceGatheringDeferred).toBe(undefined);
    expect(handler.iceGatheringTimeout).toBe(false);
    expect(handler.iceGatheringTimer).toBe(undefined);
    expect(handler.peerConnection).toBeTruthy();
  });

  it('adds default ice gathering timeout', function() {
    // no value
    expect(handler.addDefaultIceCheckingTimeout({})).toEqual({
      iceCheckingTimeout: 5000
    });

    // 0 value to disable the timeout
    expect(handler.addDefaultIceCheckingTimeout({
      iceCheckingTimeout: 0
    })).toEqual({
      iceCheckingTimeout: 0
    });

    // other value
    expect(handler.addDefaultIceCheckingTimeout({
      iceCheckingTimeout: 1234
    })).toEqual({
      iceCheckingTimeout: 1234
    });
  });

  it('waits for ice gathering to complete', function(done) {
    handler.waitForIceGatheringComplete().then(function() {
      expect(handler.iceGatheringDeferred).toBe(undefined);
      expect(handler.iceGatheringTimeout).toBe(false);
      expect(handler.iceGatheringTimer).toBe(undefined);
      expect(handler.peerConnection.iceGatheringState).toBe('complete');

      done();
    });

    expect(handler.iceGatheringDeferred).toBeTruthy();
    setIceGatheringState(handler.peerConnection, 'gathering');
    setIceGatheringState(handler.peerConnection, 'complete');
  });

  it('waits for ice gathering to complete, twice', function(done) {
    handler.waitForIceGatheringComplete().then(function() {
      expect(handler.iceGatheringDeferred).toBe(undefined);
      expect(handler.iceGatheringTimeout).toBe(false);
      expect(handler.iceGatheringTimer).toBe(undefined);
      expect(handler.peerConnection.iceGatheringState).toBe('complete');

      return handler.waitForIceGatheringComplete();
    }).then(function() {
      expect(handler.iceGatheringDeferred).toBe(undefined);
      expect(handler.iceGatheringTimeout).toBe(false);
      expect(handler.iceGatheringTimer).toBe(undefined);
      expect(handler.peerConnection.iceGatheringState).toBe('complete');

      done();
    });

    expect(handler.iceGatheringDeferred).toBeTruthy();
    setIceGatheringState(handler.peerConnection, 'gathering');
    setIceGatheringState(handler.peerConnection, 'complete');
  });

  it('waits for ice gathering to timeout, then complete', function(done) {
    handler.waitForIceGatheringComplete().then(function() {
      expect(handler.iceGatheringDeferred).toBe(undefined);
      expect(handler.iceGatheringTimeout).toBe(true);
      expect(handler.iceGatheringTimer).toBe(undefined);
      expect(handler.peerConnection.iceGatheringState).toBe('gathering');

      var promise = handler.waitForIceGatheringComplete();
      expect(handler.iceGatheringDeferred).toBe(undefined); // no new promise!
      expect(handler.iceGatheringTimeout).toBe(true);
      expect(handler.iceGatheringTimer).toBe(undefined);

      setIceGatheringState(handler.peerConnection, 'complete');

      return promise;
    }).then(function() {
      expect(handler.iceGatheringDeferred).toBe(undefined);
      expect(handler.iceGatheringTimeout).toBe(true);
      expect(handler.iceGatheringTimer).toBe(undefined);
      expect(handler.peerConnection.iceGatheringState).toBe('complete');

      done();
    });

    expect(handler.iceGatheringDeferred).toBeTruthy();
    setIceGatheringState(handler.peerConnection, 'gathering');
  });

  it('waits for ice gathering to complete, then restart, then complete', function(done) {
    handler.waitForIceGatheringComplete().then(function() {
      expect(handler.iceGatheringDeferred).toBe(undefined);
      expect(handler.iceGatheringTimeout).toBe(false);
      expect(handler.iceGatheringTimer).toBe(undefined);
      expect(handler.peerConnection.iceGatheringState).toBe('complete');

      var promise = handler.waitForIceGatheringComplete();
      expect(handler.iceGatheringDeferred).toBe(undefined); // no new promise!
      expect(handler.iceGatheringTimeout).toBe(false);
      expect(handler.iceGatheringTimer).toBe(undefined);

      setIceGatheringState(handler.peerConnection, 'gathering');
      setIceGatheringState(handler.peerConnection, 'complete');

      return promise;
    }).then(function() {
      expect(handler.iceGatheringDeferred).toBe(undefined);
      expect(handler.iceGatheringTimeout).toBe(false);
      expect(handler.iceGatheringTimer).toBe(undefined);
      expect(handler.peerConnection.iceGatheringState).toBe('complete');

      done();
    });

    expect(handler.iceGatheringDeferred).toBeTruthy();
    setIceGatheringState(handler.peerConnection, 'gathering');
    setIceGatheringState(handler.peerConnection, 'complete');
  });

  it('waits for ice gathering to complete, resets peer connection, waits again', function(done) {
    handler.waitForIceGatheringComplete().catch(function() {
      expect(handler.iceGatheringDeferred).toBe(undefined);
      expect(handler.iceGatheringTimeout).toBe(false);
      expect(handler.iceGatheringTimer).toBe(undefined);
      expect(handler.peerConnection.iceGatheringState).toBe('new');

      var promise = handler.waitForIceGatheringComplete();
      expect(handler.iceGatheringDeferred).toBeTruthy(); // new promise!
      expect(handler.iceGatheringTimeout).toBe(false);
      expect(handler.iceGatheringTimer).toBe(undefined);

      setIceGatheringState(handler.peerConnection, 'gathering');
      setIceGatheringState(handler.peerConnection, 'complete');

      return promise;
    }).then(function() {
      expect(handler.iceGatheringDeferred).toBe(undefined);
      expect(handler.iceGatheringTimeout).toBe(false);
      expect(handler.iceGatheringTimer).toBe(undefined);
      expect(handler.peerConnection.iceGatheringState).toBe('complete');

      done();
    });

    expect(handler.iceGatheringDeferred).toBeTruthy();
    setIceGatheringState(handler.peerConnection, 'gathering');
    handler.initPeerConnection();
  });
})
