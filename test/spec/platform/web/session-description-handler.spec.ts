
import { Logger } from "../../../../src/core";
import { SessionDescriptionHandler } from "../../../../src/platform/web";

function setIceGatheringState(pc: any, state: string) {
  pc.iceGatheringState = state;
  pc.onicegatheringstatechange.call(pc);
}

describe("Web SessionDescriptionHandler", () => {
  let realMediaDevices: any;
  let realRTCPeerConnection: any;
  let handler: any;

  beforeEach(() => {
    // stub out WebRTC APIs
    realMediaDevices = window.navigator.mediaDevices;
    realRTCPeerConnection = window.RTCPeerConnection;
    (window as any).RTCPeerConnection = function() {
      this.iceGatheringState = "new";
    };
    window.RTCPeerConnection.prototype.close = () => { /* */ };
    window.RTCPeerConnection.prototype.getReceivers = () => {
      return [];
    };
    window.RTCPeerConnection.prototype.getSenders = () => {
      return [];
    };

    (window as any).navigator.mediaDevices = {
      getUserMedia: () => { /* */ }
    };

    handler = new SessionDescriptionHandler(console as any as Logger, {
      peerConnectionOptions: {
        iceCheckingTimeout: 500
      }
    });
  });

  afterEach(() => {
    handler.close();

    (window as any).navigator.mediaDevices = realMediaDevices;
    window.RTCPeerConnection = realRTCPeerConnection;
  });

  it("creates instance", () => {
    expect(handler).toBeTruthy();
    expect(handler.iceGatheringDeferred).toBe(undefined);
    expect(handler.iceGatheringTimeout).toBe(false);
    expect(handler.iceGatheringTimer).toBe(undefined);
    expect(handler.peerConnection).toBeTruthy();
  });

  it("adds default ice gathering timeout", () => {
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

  it("waits for ice gathering to complete", (done) => {
    handler.waitForIceGatheringComplete().then(() => {
      expect(handler.iceGatheringDeferred).toBe(undefined);
      expect(handler.iceGatheringTimeout).toBe(false);
      expect(handler.iceGatheringTimer).toBe(undefined);
      expect(handler.peerConnection.iceGatheringState).toBe("complete");

      done();
    });

    expect(handler.iceGatheringDeferred).toBeTruthy();
    setIceGatheringState(handler.peerConnection, "gathering");
    setIceGatheringState(handler.peerConnection, "complete");
  });

  it("waits for ice gathering to complete, twice", (done) => {
    handler.waitForIceGatheringComplete().then(() => {
      expect(handler.iceGatheringDeferred).toBe(undefined);
      expect(handler.iceGatheringTimeout).toBe(false);
      expect(handler.iceGatheringTimer).toBe(undefined);
      expect(handler.peerConnection.iceGatheringState).toBe("complete");

      return handler.waitForIceGatheringComplete();
    }).then(() => {
      expect(handler.iceGatheringDeferred).toBe(undefined);
      expect(handler.iceGatheringTimeout).toBe(false);
      expect(handler.iceGatheringTimer).toBe(undefined);
      expect(handler.peerConnection.iceGatheringState).toBe("complete");

      done();
    });

    expect(handler.iceGatheringDeferred).toBeTruthy();
    setIceGatheringState(handler.peerConnection, "gathering");
    setIceGatheringState(handler.peerConnection, "complete");
  });

  it("waits for ice gathering to timeout, then complete", (done) => {
    handler.waitForIceGatheringComplete().then(() => {
      expect(handler.iceGatheringDeferred).toBe(undefined);
      expect(handler.iceGatheringTimeout).toBe(true);
      expect(handler.iceGatheringTimer).toBe(undefined);
      expect(handler.peerConnection.iceGatheringState).toBe("gathering");

      const promise = handler.waitForIceGatheringComplete();
      expect(handler.iceGatheringDeferred).toBe(undefined); // no new promise!
      expect(handler.iceGatheringTimeout).toBe(true);
      expect(handler.iceGatheringTimer).toBe(undefined);

      setIceGatheringState(handler.peerConnection, "complete");

      return promise;
    }).then(() => {
      expect(handler.iceGatheringDeferred).toBe(undefined);
      expect(handler.iceGatheringTimeout).toBe(true);
      expect(handler.iceGatheringTimer).toBe(undefined);
      expect(handler.peerConnection.iceGatheringState).toBe("complete");

      done();
    });

    expect(handler.iceGatheringDeferred).toBeTruthy();
    setIceGatheringState(handler.peerConnection, "gathering");
  });

  it("waits for ice gathering to complete, then restart, then complete", (done) => {
    handler.waitForIceGatheringComplete().then(() => {
      expect(handler.iceGatheringDeferred).toBe(undefined);
      expect(handler.iceGatheringTimeout).toBe(false);
      expect(handler.iceGatheringTimer).toBe(undefined);
      expect(handler.peerConnection.iceGatheringState).toBe("complete");

      const promise = handler.waitForIceGatheringComplete();
      expect(handler.iceGatheringDeferred).toBe(undefined); // no new promise!
      expect(handler.iceGatheringTimeout).toBe(false);
      expect(handler.iceGatheringTimer).toBe(undefined);

      setIceGatheringState(handler.peerConnection, "gathering");
      setIceGatheringState(handler.peerConnection, "complete");

      return promise;
    }).then(() => {
      expect(handler.iceGatheringDeferred).toBe(undefined);
      expect(handler.iceGatheringTimeout).toBe(false);
      expect(handler.iceGatheringTimer).toBe(undefined);
      expect(handler.peerConnection.iceGatheringState).toBe("complete");

      done();
    });

    expect(handler.iceGatheringDeferred).toBeTruthy();
    setIceGatheringState(handler.peerConnection, "gathering");
    setIceGatheringState(handler.peerConnection, "complete");
  });

  it("waits for ice gathering to complete, resets peer connection, waits again", (done) => {
    handler.waitForIceGatheringComplete().catch(() => {
      expect(handler.iceGatheringDeferred).toBe(undefined);
      expect(handler.iceGatheringTimeout).toBe(false);
      expect(handler.iceGatheringTimer).toBe(undefined);
      expect(handler.peerConnection.iceGatheringState).toBe("new");

      const promise = handler.waitForIceGatheringComplete();
      expect(handler.iceGatheringDeferred).toBeTruthy(); // new promise!
      expect(handler.iceGatheringTimeout).toBe(false);
      expect(handler.iceGatheringTimer).toBe(undefined);

      setIceGatheringState(handler.peerConnection, "gathering");
      setIceGatheringState(handler.peerConnection, "complete");

      return promise;
    }).then(() => {
      expect(handler.iceGatheringDeferred).toBe(undefined);
      expect(handler.iceGatheringTimeout).toBe(false);
      expect(handler.iceGatheringTimer).toBe(undefined);
      expect(handler.peerConnection.iceGatheringState).toBe("complete");

      done();
    });

    expect(handler.iceGatheringDeferred).toBeTruthy();
    setIceGatheringState(handler.peerConnection, "gathering");
    handler.initPeerConnection();
  });
});
