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
  FakeWebSocket.CONNECTING = 0;
  FakeWebSocket.OPEN = 1;
  FakeWebSocket.CLOSED = 3;
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
    createOffer: function createOffer(success, failure) {
      if (createOffer.fail) {
        failure();
      } else {
        setTimeout(function () {
          success({
            type: 'offer',
            body: '',
            sdp: 'Hello'
          });
        }, 0);
      }
    },
    createAnswer: function createAnswer(success, failure) {
      if (createAnswer.fail) {
        failure();
      } else {
        setTimeout(function () {
          success({
            type: 'answer',
            body: '',
            sdp: 'Hello'
          });
        }, 0);
      }
    },
    setLocalDescription: function setLocalDescription(desc, success, failure) {
      if (setLocalDescription.fail) {
        failure();
      } else {
        this.localDescription = desc;
        setTimeout(function () {
          success();
        }, 0);
      }
    },
    setRemoteDescription: function setRemoteDescription(desc, success, failure) {
      if (setRemoteDescription.fail) {
        failure();
      } else {
        this.remoteDescription = desc;
        setTimeout(function () {
          success();
        }, 0);
      }
    },
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