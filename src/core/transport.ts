import { EventEmitter } from "events";

import { Logger } from "./log";

/**
 * Transport.
 * @remarks
 * Abstract transport layer base class.
 * @public
 */
export abstract class Transport extends EventEmitter {
  /**
   * FIXME: This needs to be reworked.
   * Some transport configuration which is controlling core behavior.
   * @internal
   */
  public server?: {
    // This "scheme" currently dictates what gets written into the
    // the Via header in ClientTransaction and InviteClientTransaction.
    scheme?: string;
    // This "sipUri" currently dictates what gets set in the route set
    // of an outgoing request in OutgoingRequestMessage if the UserAgent
    // is configured with preloaded route set is enabled.
    sipUri?: string;
  };

  protected logger: Logger;

  /**
   * Constructor
   * @param logger - Logger.
   * @param options - Options bucket. Deprecated.
   */
  constructor(logger: Logger, options?: any) {
    super();
    this.logger = logger;
  }

  /**
   * Returns the promise designated by the child layer then emits a connected event.
   * Automatically emits an event upon resolution, unless overrideEvent is set. If you
   * override the event in this fashion, you should emit it in your implementation of connectPromise
   * @param options - Options bucket.
   */
  public connect(options: any = {}): Promise<void> {
    return this.connectPromise(options).then((data: any) => {
      if (!data.overrideEvent) {
        this.emit("connected");
      }
    });
  }

  /**
   * Returns true if the transport is connected
   */
  public abstract isConnected(): boolean;

  /**
   * Sends a message then emits a 'messageSent' event. Automatically emits an
   * event upon resolution, unless data.overrideEvent is set. If you override
   * the event in this fashion, you should emit it in your implementation of sendPromise
   * Rejects with an Error if message fails to send.
   * @param message - Message.
   * @param options - Options bucket.
   */
  public send(message: string, options: any = {}): Promise<void> {
    // Error handling is independent of whether the message was a request or
    // response.
    //
    // If the transport user asks for a message to be sent over an
    // unreliable transport, and the result is an ICMP error, the behavior
    // depends on the type of ICMP error.  Host, network, port or protocol
    // unreachable errors, or parameter problem errors SHOULD cause the
    // transport layer to inform the transport user of a failure in sending.
    // Source quench and TTL exceeded ICMP errors SHOULD be ignored.
    //
    // If the transport user asks for a request to be sent over a reliable
    // transport, and the result is a connection failure, the transport
    // layer SHOULD inform the transport user of a failure in sending.
    // https://tools.ietf.org/html/rfc3261#section-18.4
    return this.sendPromise(message).then((result) => {
      if (!result.overrideEvent) {
        this.emit("messageSent", result.msg);
      }
    });
  }

  /**
   * Returns the promise designated by the child layer then emits a
   * disconnected event. Automatically emits an event upon resolution,
   * unless overrideEvent is set. If you override the event in this fashion,
   * you should emit it in your implementation of disconnectPromise
   * @param options - Options bucket
   */
  public disconnect(options: any = {}): Promise<void> {
    return this.disconnectPromise(options).then((data: any) => {
      if (!data.overrideEvent) {
        this.emit("disconnected");
      }
    });
  }

  public afterConnected(callback: () => void): void {
    if (this.isConnected()) {
      callback();
    } else {
      this.once("connected", callback);
    }
  }

  /**
   * Returns a promise which resolves once the UA is connected. DEPRECATION WARNING: just use afterConnected()
   */
  public waitForConnected(): Promise<void> {
    // tslint:disable-next-line:no-console
    console.warn("DEPRECATION WARNING Transport.waitForConnected(): use afterConnected() instead");
    return new Promise((resolve) => {
      this.afterConnected(resolve);
    });
  }
  /**
   * Called by connect, must return a promise
   * promise must resolve to an object. object supports 1 parameter: overrideEvent - Boolean
   * @param options - Options bucket.
   */
  protected abstract connectPromise(options: any): Promise<any>;

  /**
   * Called by send.
   * @param message - Message.
   * @param options - Options bucket.
   */
  protected abstract sendPromise(message: string, options?: any): Promise<{ msg: string, overrideEvent?: boolean }>;

  /**
   * Called by disconnect, must return a promise
   * promise must resolve to an object. object supports 1 parameter: overrideEvent - Boolean
   * @param options - Options bucket.
   */
  protected abstract disconnectPromise(options: any): Promise<any>;

  /**
   * To be called when a message is received
   * @param e - Event
   */
  protected abstract onMessage(e: any): void;
}
