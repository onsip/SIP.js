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
   * Returns true if the transport is connected.
   */
  isConnected(): boolean;

  /**
   * Add listener for connection events.
   */
  on(event: "connected" | "disconnected" | "transportError", listener: () => void): this;

  /**
   * Add listener for message events.
   */
  on(event: "message", listener: (message: string) => void): this;

  /**
   * @internal
   */
  on(name: string, callback: (...args: any[]) => void): this;
}
