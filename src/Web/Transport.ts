import {
  Grammar,
  Logger
} from "../core";
import { TypeStrings } from "../Enums";
import { Exceptions } from "../Exceptions";
import { Transport as TransportBase } from "../Transport";
import { Utils } from "../Utils";

export enum TransportStatus {
  STATUS_CONNECTING,
  STATUS_OPEN,
  STATUS_CLOSING,
  STATUS_CLOSED
}

export interface WsServer {
  scheme: string;
  sipUri: string;
  wsUri: string;
  weight: number;
  isError: boolean;
}

export interface Configuration {
  wsServers: Array<WsServer>;
  connectionTimeout: number;
  maxReconnectionAttempts: number;
  reconnectionTimeout: number;
  keepAliveInterval: number;
  keepAliveDebounce: number;
  traceSip: boolean;
}

/**
 * Compute an amount of time in seconds to wait before sending another
 * keep-alive.
 * @returns {Number}
 */
const computeKeepAliveTimeout = (upperBound: number): number => {
  const lowerBound: number = upperBound * 0.8;
  return 1000 * (Math.random() * (upperBound - lowerBound) + lowerBound);
};

/**
 * @class Transport
 * @param {Object} options
 */
export class Transport extends TransportBase {
  public static readonly C = TransportStatus;
  public type: TypeStrings;
  public server: WsServer;
  public ws: WebSocket | undefined;

  private connectionPromise: Promise<any> | undefined;
  private connectDeferredResolve: ((obj: any) => void) | undefined;
  private connectDeferredReject: ((obj: any) => void) | undefined;
  private connectionTimeout: any | undefined;

  private disconnectionPromise: Promise<any> | undefined;
  private disconnectDeferredResolve: ((obj: any) => void) | undefined;

  private reconnectionAttempts: number;
  private reconnectTimer: any | undefined;

  // Keep alive
  private keepAliveInterval: any | undefined;
  private keepAliveDebounceTimeout: any | undefined;

  private status: TransportStatus;
  private configuration: Configuration;
  private boundOnOpen: any;
  private boundOnMessage: any;
  private boundOnClose: any;
  private boundOnError: any;

  constructor(logger: Logger, options: any = {}) {
    super(logger);
    this.type = TypeStrings.Transport;

    this.reconnectionAttempts = 0;
    this.status = TransportStatus.STATUS_CONNECTING;
    this.configuration = this.loadConfig(options);
    this.server = this.configuration.wsServers[0];
  }

  /**
   * @returns {Boolean}
   */
  public isConnected(): boolean {
    return this.status === TransportStatus.STATUS_OPEN;
  }

  /**
   * Send a message.
   * @param message - Outgoing message.
   * @param options - Options bucket.
   */
  protected sendPromise(message: string, options: any = {}): Promise<{msg: string}> {
    if (this.ws === undefined) {
      this.onError("unable to send message - WebSocket undefined");
      return Promise.reject(new Error("WebSocket undefined."));
    }

    // FIXME: This check is likely not necessary as WebSocket.send() will
    // throw INVALID_STATE_ERR if the connection is not currently open
    // which could happen regardless of what we thing the state is.
    if (!this.statusAssert(TransportStatus.STATUS_OPEN, options.force)) {
      this.onError("unable to send message - WebSocket not open");
      return Promise.reject(new Error("WebSocket not open."));
    }

    if (this.configuration.traceSip === true) {
      this.logger.log("sending WebSocket message:\n\n" + message + "\n");
    }

    // WebSocket.send() can throw.
    // https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/send
    try {
      this.ws.send(message);
    } catch (error) {
      if (error instanceof error) {
        Promise.reject(error);
      }
      return Promise.reject(new Error("Failed to send message."));
    }

    return Promise.resolve({ msg: message });
  }

  /**
   * Disconnect socket.
   */
  protected disconnectPromise(options: any = {}): Promise<any> {
    if (this.disconnectionPromise) { // Already disconnecting. Just return this.
      return this.disconnectionPromise;
    }
    options.code = options.code || 1000;

    if (!this.statusTransition(TransportStatus.STATUS_CLOSING, options.force)) {
      if (this.status === TransportStatus.STATUS_CLOSED) { // Websocket is already closed
        return Promise.resolve({overrideEvent: true});
      } else if (this.connectionPromise) { // Websocket is connecting, cannot move to disconneting yet
        return this.connectionPromise.then(() => Promise.reject("The websocket did not disconnect"))
        .catch(() => Promise.resolve({overrideEvent: true}));
      } else {
        // Cannot move to disconnecting, but not in connecting state.
        return Promise.reject("The websocket did not disconnect");
      }
    }
    this.emit("disconnecting");
    this.disconnectionPromise = new Promise((resolve, reject) => {
      this.disconnectDeferredResolve = resolve;

      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = undefined;
      }

      if (this.ws) {
        this.stopSendingKeepAlives();

        this.logger.log("closing WebSocket " + this.server.wsUri);
        this.ws.close(options.code, options.reason);
      } else {
        reject("Attempted to disconnect but the websocket doesn't exist");
      }
    });

    return this.disconnectionPromise;
  }

  /**
   * Connect socket.
   */
  protected connectPromise(options: any = {}) {
    if (this.status === TransportStatus.STATUS_CLOSING && !options.force) {
      return Promise.reject("WebSocket " + this.server.wsUri + " is closing");
    }
    if (this.connectionPromise) {
      return this.connectionPromise;
    }
    this.server = this.server || this.getNextWsServer(options.force);

    this.connectionPromise = new Promise((resolve, reject) => {
      if ((this.status === TransportStatus.STATUS_OPEN || this.status === TransportStatus.STATUS_CLOSING)
        && !options.force) {
        this.logger.warn("WebSocket " + this.server.wsUri + " is already connected");
        reject("Failed status check - attempted to open a connection but already open/closing");
        return;
      }

      this.connectDeferredResolve = resolve;
      this.connectDeferredReject = reject;

      this.status = TransportStatus.STATUS_CONNECTING;
      this.emit("connecting");
      this.logger.log("connecting to WebSocket " + this.server.wsUri);
      this.disposeWs();
      try {
        this.ws = new WebSocket(this.server.wsUri, "sip");
        this.ws.binaryType = "arraybuffer"; // set data type of received binary messages
      } catch (e) {
        this.ws = undefined;
        this.statusTransition(TransportStatus.STATUS_CLOSED, true);
        this.onError("error connecting to WebSocket " + this.server.wsUri + ":" + e);
        reject("Failed to create a websocket");
        this.connectDeferredResolve = undefined;
        this.connectDeferredReject = undefined;
        return;
      }

      if (!this.ws) {
        reject("Unexpected instance websocket not set");
        this.connectDeferredResolve = undefined;
        this.connectDeferredReject = undefined;
        return;
      }

      this.connectionTimeout = setTimeout(() => {
        this.statusTransition(TransportStatus.STATUS_CLOSED);
        this.logger.warn("took too long to connect - exceeded time set in configuration.connectionTimeout: " +
          this.configuration.connectionTimeout + "s");
        this.emit("disconnected", {code: 1000});
        this.connectionPromise = undefined;
        reject("Connection timeout");
        this.connectDeferredResolve = undefined;
        this.connectDeferredReject = undefined;
        const ws = this.ws;
        this.disposeWs();
        if (ws) {
          ws.close(1000);
        }
      }, this.configuration.connectionTimeout * 1000);

      this.boundOnOpen = this.onOpen.bind(this);
      this.boundOnMessage = this.onMessage.bind(this);
      this.boundOnClose = this.onClose.bind(this);
      this.boundOnError = this.onWebsocketError.bind(this);

      this.ws.addEventListener("open", this.boundOnOpen);
      this.ws.addEventListener("message", this.boundOnMessage);
      this.ws.addEventListener("close", this.boundOnClose);
      this.ws.addEventListener("error", this.boundOnError);
    });

    return this.connectionPromise;
  }

  /**
   * @event
   * @param {event} e
   */
  protected onMessage(e: any): void {
    const data: any  = e.data;
    let finishedData: string;
    // CRLF Keep Alive response from server. Clear our keep alive timeout.
    if (/^(\r\n)+$/.test(data)) {
      this.clearKeepAliveTimeout();

      if (this.configuration.traceSip === true) {
        this.logger.log("received WebSocket message with CRLF Keep Alive response");
      }
      return;
    } else if (!data) {
      this.logger.warn("received empty message, message discarded");
      return;
    } else if (typeof data !== "string") { // WebSocket binary message.
      try {
        // the UInt8Data was here prior to types, and doesn't check
        finishedData = String.fromCharCode.apply(null, (new Uint8Array(data) as unknown as Array<number>));
      } catch (err) {
        this.logger.warn("received WebSocket binary message failed to be converted into string, message discarded");
        return;
      }

      if (this.configuration.traceSip === true) {
        this.logger.log("received WebSocket binary message:\n\n" + data + "\n");
      }
    } else { // WebSocket text message.
      if (this.configuration.traceSip === true) {
        this.logger.log("received WebSocket text message:\n\n" + data + "\n");
      }
      finishedData = data;
    }

    this.emit("message", finishedData);
  }

  // Transport Event Handlers

  /**
   * @event
   * @param {event} e
   */
  private onOpen(): void  {
    if (this.status === TransportStatus.STATUS_CLOSED) { // Indicated that the transport thinks the ws is dead already
      const ws = this.ws;
      this.disposeWs();
      if (ws) {
        ws.close(1000);
      }
      return;
    }
    this.statusTransition(TransportStatus.STATUS_OPEN, true);
    this.emit("connected");
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = undefined;
    }

    this.logger.log("WebSocket " + this.server.wsUri + " connected");

    // Clear reconnectTimer since we are not disconnected
    if (this.reconnectTimer !== undefined) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
    // Reset reconnectionAttempts
    this.reconnectionAttempts = 0;

    // Reset disconnection promise so we can disconnect from a fresh state
    this.disconnectionPromise = undefined;
    this.disconnectDeferredResolve = undefined;

    // Start sending keep-alives
    this.startSendingKeepAlives();

    if (this.connectDeferredResolve) {
      this.connectDeferredResolve({overrideEvent: true});
      this.connectDeferredResolve = undefined;
      this.connectDeferredReject = undefined;
    } else {
      this.logger.warn("Unexpected websocket.onOpen with no connectDeferredResolve");
    }
  }

  /**
   * @event
   * @param {event} e
   */
  private onClose(e: any): void {
    this.logger.log("WebSocket disconnected (code: " + e.code + (e.reason ? "| reason: " + e.reason : "") + ")");

    if (this.status !== TransportStatus.STATUS_CLOSING) {
      this.logger.warn("WebSocket closed without SIP.js requesting it");
      this.emit("transportError");
    }

    this.stopSendingKeepAlives();

    // Clean up connection variables so we can connect again from a fresh state
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
    }
    if (this.connectDeferredReject) {
      this.connectDeferredReject("Websocket Closed");
    }
    this.connectionTimeout = undefined;
    this.connectionPromise = undefined;
    this.connectDeferredResolve = undefined;
    this.connectDeferredReject = undefined;

    // Check whether the user requested to close.
    if (this.disconnectDeferredResolve) {
      this.disconnectDeferredResolve({ overrideEvent: true });
      this.statusTransition(TransportStatus.STATUS_CLOSED);
      this.disconnectDeferredResolve = undefined;
      return;
    }

    this.statusTransition(TransportStatus.STATUS_CLOSED, true);
    this.emit("disconnected", {code: e.code, reason: e.reason});

    this.disposeWs();
    this.reconnect();
  }

  /**
   * Removes event listeners and clears the instance ws
   */
  private disposeWs(): void {
    if (this.ws) {
      this.ws.removeEventListener("open", this.boundOnOpen);
      this.ws.removeEventListener("message", this.boundOnMessage);
      this.ws.removeEventListener("close", this.boundOnClose);
      this.ws.removeEventListener("error", this.boundOnError);
      this.ws = undefined;
    }
  }

  /**
   * @event
   * @param {string} e
   */
  private onError(e: any): void {
    this.logger.warn("Transport error: " + e);
    this.emit("transportError");
  }

  /**
   * @event
   * @private
   */
  private onWebsocketError(): void {
    this.onError("The Websocket had an error");
  }

  /**
   * Reconnection attempt logic.
   */
  private reconnect(): void {
    if (this.reconnectionAttempts > 0) {
      this.logger.log("Reconnection attempt " + this.reconnectionAttempts + " failed");
    }

    if (this.noAvailableServers()) {
      this.logger.warn("attempted to get next ws server but there are no available ws servers left");
      this.logger.warn("no available ws servers left - going to closed state");
      this.statusTransition(TransportStatus.STATUS_CLOSED, true);
      this.emit("closed");
      this.resetServerErrorStatus();
      return;
    }

    if (this.isConnected()) {
      this.logger.warn("attempted to reconnect while connected - forcing disconnect");
      this.disconnect({force: true});
    }

    this.reconnectionAttempts += 1;

    if (this.reconnectionAttempts > this.configuration.maxReconnectionAttempts) {
      this.logger.warn("maximum reconnection attempts for WebSocket " + this.server.wsUri);
      this.logger.log("transport " + this.server.wsUri + " failed | connection state set to 'error'");
      this.server.isError = true;
      this.emit("transportError");
      if (!this.noAvailableServers()) {
        this.server = this.getNextWsServer();
      }
      // When there are no available servers, the reconnect function ends on the next recursive call
      // after checking for no available servers again.
      this.reconnectionAttempts = 0;
      this.reconnect();
    } else {
      this.logger.log("trying to reconnect to WebSocket " +
        this.server.wsUri + " (reconnection attempt " + this.reconnectionAttempts + ")");
      this.reconnectTimer = setTimeout(() => {
        this.connect();
        this.reconnectTimer = undefined;
      }, (this.reconnectionAttempts === 1) ? 0 : this.configuration.reconnectionTimeout * 1000);
    }
  }

  /**
   * Resets the error state of all servers in the configuration
   */
  private resetServerErrorStatus(): void {
    for (const websocket of this.configuration.wsServers) {
      websocket.isError = false;
    }
  }

  /**
   * Retrieve the next server to which connect.
   * @param {Boolean} force allows bypass of server error status checking
   * @returns {Object} WsServer
   */
  private getNextWsServer(force: boolean = false): WsServer {
    if (this.noAvailableServers()) {
      this.logger.warn("attempted to get next ws server but there are no available ws servers left");
      throw new Error("Attempted to get next ws server, but there are no available ws servers left.");
    }
    // Order servers by weight
    let candidates: Array<WsServer> = [];

    for (const wsServer of this.configuration.wsServers) {
      if (wsServer.isError && !force) {
        continue;
      } else if (candidates.length === 0) {
        candidates.push(wsServer);
      } else if (wsServer.weight > candidates[0].weight) {
        candidates = [wsServer];
      } else if (wsServer.weight === candidates[0].weight) {
        candidates.push(wsServer);
      }
    }

    const idx: number = Math.floor(Math.random() * candidates.length);
    return candidates[idx];
  }

  /**
   * Checks all configuration servers, returns true if all of them have isError: true and false otherwise
   * @returns {Boolean}
   */
  private noAvailableServers(): boolean {
    for (const server of this.configuration.wsServers) {
      if (!server.isError) {
        return false;
      }
    }
    return true;
  }

  // ==============================
  // KeepAlive Stuff
  // ==============================

  /**
   * Send a keep-alive (a double-CRLF sequence).
   * @returns {Boolean}
   */
  private sendKeepAlive(): Promise<any> | void {
    if (this.keepAliveDebounceTimeout) {
      // We already have an outstanding keep alive, do not send another.
      return;
    }

    this.keepAliveDebounceTimeout = setTimeout(() => {
      this.emit("keepAliveDebounceTimeout");
      this.clearKeepAliveTimeout();
    }, this.configuration.keepAliveDebounce * 1000);

    return this.send("\r\n\r\n");
  }

  private clearKeepAliveTimeout(): void {
    if (this.keepAliveDebounceTimeout) {
      clearTimeout(this.keepAliveDebounceTimeout);
    }
    this.keepAliveDebounceTimeout = undefined;
  }

  /**
   * Start sending keep-alives.
   */
  private startSendingKeepAlives(): void {
    if (this.configuration.keepAliveInterval && !this.keepAliveInterval) {
      this.keepAliveInterval = setInterval(() => {
        this.sendKeepAlive();
        this.startSendingKeepAlives();
      }, computeKeepAliveTimeout(this.configuration.keepAliveInterval));
    }
  }

  /**
   * Stop sending keep-alives.
   */
  private stopSendingKeepAlives(): void {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
    }
    if (this.keepAliveDebounceTimeout) {
      clearTimeout(this.keepAliveDebounceTimeout);
    }
    this.keepAliveInterval = undefined;
    this.keepAliveDebounceTimeout = undefined;
  }

  // ==============================
  // Status Stuff
  // ==============================

  /**
   * Checks given status against instance current status. Returns true if they match
   * @param {Number} status
   * @param {Boolean} [force]
   * @returns {Boolean}
   */
  private statusAssert(status: TransportStatus, force: boolean): boolean {
    if (status === this.status) {
      return true;
    } else {
      if (force) {
        this.logger.warn("Attempted to assert " +
          Object.keys(TransportStatus)[this.status] + " as " +
          Object.keys(TransportStatus)[status] + "- continuing with option: 'force'");
        return true;
      } else {
        this.logger.warn("Tried to assert " +
        Object.keys(TransportStatus)[status] + " but is currently " +
        Object.keys(TransportStatus)[this.status]);
        return false;
      }
    }
  }

  /**
   * Transitions the status. Checks for legal transition via assertion beforehand
   * @param {Number} status
   * @param {Boolean} [force]
   * @returns {Boolean}
   */
  private statusTransition(status: TransportStatus, force: boolean = false): boolean {
    this.logger.log("Attempting to transition status from " +
      Object.keys(TransportStatus)[this.status] + " to " +
      Object.keys(TransportStatus)[status]);
    if ((status === TransportStatus.STATUS_CONNECTING && this.statusAssert(TransportStatus.STATUS_CLOSED, force)) ||
        (status === TransportStatus.STATUS_OPEN && this.statusAssert(TransportStatus.STATUS_CONNECTING, force)) ||
        (status === TransportStatus.STATUS_CLOSING && this.statusAssert(TransportStatus.STATUS_OPEN, force))    ||
        (status === TransportStatus.STATUS_CLOSED)) {
      this.status = status;
      return true;
    } else {
      this.logger.warn("Status transition failed - result: no-op - reason:" +
        " either gave an nonexistent status or attempted illegal transition");
      return false;
    }
  }

  // ==============================
  // Configuration Handling
  // ==============================

  /**
   * Configuration load.
   * returns {Configuration}
   */
  private loadConfig(configuration: any): Configuration {
    const settings: Configuration = {
      wsServers: [{
        scheme: "WSS",
        sipUri: "<sip:edge.sip.onsip.com;transport=ws;lr>",
        weight: 0,
        wsUri: "wss://edge.sip.onsip.com",
        isError: false
      }],

      connectionTimeout: 5,

      maxReconnectionAttempts: 3,
      reconnectionTimeout: 4,

      keepAliveInterval: 0,
      keepAliveDebounce: 10,

      // Logging
      traceSip: false
    };

    const configCheck: {mandatory: {[name: string]: any}, optional: {[name: string]: any}} =
      this.getConfigurationCheck();

    // Check Mandatory parameters
    for (const parameter in configCheck.mandatory) {
      if (!configuration.hasOwnProperty(parameter)) {
        throw new Exceptions.ConfigurationError(parameter);
      } else {
        const value: any = configuration[parameter];
        const checkedValue: any = configCheck.mandatory[parameter](value);
        if (checkedValue !== undefined) {
          (settings as any)[parameter] = checkedValue;
        } else {
          throw new Exceptions.ConfigurationError(parameter, value);
        }
      }
    }

    // Check Optional parameters
    for (const parameter in configCheck.optional) {
      if (configuration.hasOwnProperty(parameter)) {
        const value = configuration[parameter];

        // If the parameter value is an empty array, but shouldn't be, apply its default value.
        // If the parameter value is null, empty string, or undefined then apply its default value.
        // If it's a number with NaN value then also apply its default value.
        // NOTE: JS does not allow "value === NaN", the following does the work:
        if ((value instanceof Array && value.length === 0) ||
            (value === null || value === "" || value === undefined) ||
            (typeof(value) === "number" && isNaN(value))) { continue; }

        const checkedValue: any = configCheck.optional[parameter](value);
        if (checkedValue !== undefined) {
          (settings as any)[parameter] = checkedValue;
        } else {
          throw new Exceptions.ConfigurationError(parameter, value);
        }
      }
    }

    const skeleton: any = {}; // Fill the value of the configuration_skeleton
    for (const parameter in settings) {
      if (settings.hasOwnProperty(parameter)) {
        skeleton[parameter] = {
          value: (settings as any)[parameter],
        };
      }
    }
    const returnConfiguration: Configuration = Object.defineProperties({}, skeleton);

    this.logger.log("configuration parameters after validation:");
    for (const parameter in settings) {
      if (settings.hasOwnProperty(parameter)) {
        this.logger.log("· " + parameter + ": " + JSON.stringify((settings as any)[parameter]));
      }
    }

    return returnConfiguration;
  }

  /**
   * Configuration checker.
   * @return {Boolean}
   */
  private getConfigurationCheck(): {mandatory: {[name: string]: any}, optional: {[name: string]: any}} {
    return {
      mandatory: {
      },

      optional: {

        // Note: this function used to call 'this.logger.error' but calling 'this' with anything here is invalid
        wsServers: (wsServers: any): any => {
          /* Allow defining wsServers parameter as:
           *  String: "host"
           *  Array of Strings: ["host1", "host2"]
           *  Array of Objects: [{wsUri:"host1", weight:1}, {wsUri:"host2", weight:0}]
           *  Array of Objects and Strings: [{wsUri:"host1"}, "host2"]
           */
          if (typeof wsServers === "string") {
            wsServers = [{wsUri: wsServers}];
          } else if (wsServers instanceof Array) {
            for (let idx = 0; idx < wsServers.length; idx++) {
              if (typeof wsServers[idx] === "string") {
                wsServers[idx] = {wsUri: wsServers[idx]};
              }
            }
          } else {
            return;
          }

          if (wsServers.length === 0) {
            return false;
          }

          for (const wsServer of wsServers) {
            if (!wsServer.wsUri) {
              return;
            }
            if (wsServer.weight && !Number(wsServer.weight)) {
              return;
            }

            const url: any | -1 = Grammar.parse(wsServer.wsUri, "absoluteURI");

            if (url === -1) {
              return;
            } else if (["wss", "ws", "udp"].indexOf(url.scheme) < 0) {
              return;
            } else {
              wsServer.sipUri = "<sip:" + url.host +
                (url.port ? ":" + url.port : "") + ";transport=" + url.scheme.replace(/^wss$/i, "ws") + ";lr>";

              if (!wsServer.weight) {
                wsServer.weight = 0;
              }

              wsServer.isError = false;
              wsServer.scheme = url.scheme.toUpperCase();
            }
          }
          return wsServers;
        },

        keepAliveInterval: (keepAliveInterval: string): number | undefined => {
          if (Utils.isDecimal(keepAliveInterval)) {
            const value: number = Number(keepAliveInterval);
            if (value > 0) {
              return value;
            }
          }
        },

        keepAliveDebounce: (keepAliveDebounce: string): number | undefined => {
          if (Utils.isDecimal(keepAliveDebounce)) {
            const value = Number(keepAliveDebounce);
            if (value > 0) {
              return value;
            }
          }
        },

        traceSip: (traceSip: boolean): boolean | undefined => {
          if (typeof traceSip === "boolean") {
            return traceSip;
          }
        },

        connectionTimeout: (connectionTimeout: string): number | undefined => {
          if (Utils.isDecimal(connectionTimeout)) {
            const value = Number(connectionTimeout);
            if (value > 0) {
              return value;
            }
          }
        },

        maxReconnectionAttempts: (maxReconnectionAttempts: string): number | undefined => {
          if (Utils.isDecimal(maxReconnectionAttempts)) {
            const value: number = Number(maxReconnectionAttempts);
            if (value >= 0) {
              return value;
            }
          }
        },

        reconnectionTimeout: (reconnectionTimeout: string): number | undefined => {
          if (Utils.isDecimal(reconnectionTimeout)) {
            const value: number = Number(reconnectionTimeout);
            if (value > 0) {
              return value;
            }
          }
        }

      }
    };
  }
}
