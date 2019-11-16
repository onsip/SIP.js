import { Transport as CoreTransport } from "../core";

/**
 * Transport.
 *
 * @remarks
 * Transport layer interface expected by the api.
 * @public
 */
export interface Transport extends CoreTransport  {

  /**
   * Connect to network.
   */
  connect(): Promise<void>;

  /**
   * Disconnect from network.
   */
  disconnect(): Promise<void>;

  /**
   * Returns true if the transport is connected
   */
  isConnected(): boolean;

  /**
   * Calls the callback once the UA is connected.
   */
  // afterConnected(callback: () => void): void;

  /**
   * Returns a promise which resolves once the UA is connected.
   * @deprecated Use `afterConnected`
   * @internal
   */
  // waitForConnected(): Promise<void>;

  on(event: "connected" | "transportError", listener: () => void): this;
  on(event: "message", listener: (message: string) => void): this;
  on(name: string, callback: (...args: any[]) => void): this;
}
