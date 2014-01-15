(function () {

  /** WebSocket **/
  function FakeWebSocket(server, protocol) {
    this.readyState = 0; // CONNECTING
    var that = this;
    setTimeout(function () {
      that.readyState = 1; // OPEN
      if (that.onopen) {
        that.onopen();
      }
    }, 0);
  }
  FakeWebSocket.prototype = {
    send: function (msg) {},
    close: function () {
      this.readyState = 3; // CLOSED
      if (this.onclose) this.onclose();
    },

    // Useful testing functions
    receiveMessage: function (msg) {
      if (this.onmessage) this.onmessage(msg);
    },
    causeError: function (e) {
      if (this.onerror) this.onerror(e);
    }
  };

  FakeWebSocket.orig = window.WebSocket;
  window.WebSocket = FakeWebSocket;


  /** WebRTC **/
  function getUserMedia(constraints, success, failure) {
    if (getUserMedia.fail) {
      setTimeout(function () { failure(); }, 0);
    } else {
      setTimeout(function () { success(); }, 0);
    }
  }
  getUserMedia.orig = window.navigator.getUserMedia;
  window.navigator.getUserMedia = getUserMedia;

  function RTCPeerConnection(options, constraints) {}
  RTCPeerConnection.prototype = {
    iceGatheringState: 'complete',
    iceConnectionState: 'connected',
    createOffer: function () {
      return {
        type: 'offer',
        body: ''
      };
    },
    createAnswer: function () {
      return {
        type: 'answer',
        body: ''
      };
    },
    setLocalDescription: function () {},
    setRemoteDescription: function () {},
    addStream: function () {},
    close: function () {},
    signalingState: function () {}
  };
  RTCPeerConnection.orig = window.RTCPeerConnection;
  window.RTCPeerConnection = RTCPeerConnection;

  function RTCSessionDescription(options) {
    return {
      type: options && options.type,
      body: options && options.body
    };
  }
  RTCSessionDescription.orig = window.RTCSessionDescription;
  window.RTCSessionDescription = RTCSessionDescription;
})();