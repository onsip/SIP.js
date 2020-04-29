class WebSocket {
  constructor(url: string, protocols: string) {
    throw new Error("TEST ERROR");
  }
}

let originalWebSocket: any = null;

function retrieveGlobalObject(this: any) {
  if (typeof window !== "undefined") {
    return window;
  }
  return typeof process === "object" && typeof require === "function" && typeof global === "object" ? global : this;
}

function start() {
  const globalObj = retrieveGlobalObject();

  if (globalObj.WebSocket) {
    originalWebSocket = globalObj.WebSocket;
  }
  globalObj.WebSocket = WebSocket;
}

function stop() {
  const globalObj = retrieveGlobalObject();

  if (originalWebSocket) {
    globalObj.WebSocket = originalWebSocket;
  } else {
    delete globalObj.WebSocket;
  }
  originalWebSocket = null;
}

import { LoggerFactory } from "../../../../src/core";
import { Transport } from "../../../../src/platform/web";

describe("Web Transport WebSocket Construction Failure", () => {
  const connectionTimeout = 5; // seconds
  const server = "wss://localhost:8080";
  const log = new LoggerFactory();
  const logger = log.getLogger("sip.Transport");
  let connectError: Error | undefined;
  let transport: Transport;

  beforeEach(async () => {
    start();
    jasmine.clock().install();
    connectError = undefined;
    transport = new Transport(
      logger,
      {
        connectionTimeout,
        server
      }
    );
    return transport.connect()
      .catch((error: Error) => { connectError = error; });
  });

  afterEach(() => {
    transport.dispose();
    jasmine.clock().uninstall();
    stop();
  });

  it("connect error MUST be thrown", () => {
    expect(connectError).toEqual(jasmine.any(Error));
  });
});
