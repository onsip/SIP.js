/* eslint-disable @typescript-eslint/no-explicit-any */

import { Logger } from "../../../../src/core";
import { SessionDescriptionHandler } from "../../../../src/platform/web";

// TODO:
// These old tests were ported from JavaScript to TypesSript verbatim.
// The next time the SessionDescriptionHandler gets a work over, these should be reviewed.

// Might be helpful, so for reference...
// https://testrtc.com/manipulating-getusermedia-available-devices/

function setIceGatheringState(pc: any, state: string): void {
  pc.iceGatheringState = state;
  pc.onicegatheringstatechange.call(pc);
}

describe("Web SessionDescriptionHandler", () => {
  let realGetUserMedia: any;
  let realMediaDevices: any;
  let realRTCPeerConnection: any;
  let handler: any;

  beforeEach(() => {
    // stub out WebRTC APIs
    // eslint-disable-next-line @typescript-eslint/unbound-method
    realGetUserMedia = window.navigator.mediaDevices && window.navigator.mediaDevices.getUserMedia;
    realMediaDevices = window.navigator.mediaDevices;
    realRTCPeerConnection = window.RTCPeerConnection;
    (window as any).RTCPeerConnection = function(): void {
      this.iceGatheringState = "new";
    };
    window.RTCPeerConnection.prototype.close = (): void => { /* */ };
    window.RTCPeerConnection.prototype.getReceivers = (): Array<RTCRtpReceiver> => {
      return [];
    };
    window.RTCPeerConnection.prototype.getSenders = ():  Array<RTCRtpSender> => {
      return [];
    };

    // In strict mode
    //   https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode)
    // window.navigator.mediaDevices is read-only
    //   https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/Read-only
    // which doesn't let us assign to it
    if (window.navigator.mediaDevices) {
      (window.navigator.mediaDevices.getUserMedia as any) = (): any => { /* */ };
    } else {
      (window.navigator.mediaDevices as any) = { getUserMedia: (): any => { /* */ } };
    }

    (window.navigator.mediaDevices.getUserMedia as any) = (): any => { /* */ };

    handler = new SessionDescriptionHandler(console as any as Logger, {
      peerConnectionOptions: {
        iceCheckingTimeout: 500
      }
    });
  });

  afterEach(() => {
    handler.close();
    if (window.navigator.mediaDevices) {
      window.navigator.mediaDevices.getUserMedia = realGetUserMedia;
    } else {
      (window.navigator.mediaDevices as any) = realMediaDevices;
    }
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
