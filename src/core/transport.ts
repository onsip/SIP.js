/**
 * Transport.
 *
 * @remarks
 * Transport layer interface expected by the user agent core.
 * @public
 */
export interface Transport {

  /**
   * The protocol.
   *
   * @remarks
   * Formatted as defined for the Via header sent-protocol transport.
   * https://tools.ietf.org/html/rfc3261#section-20.42
   */
  readonly protocol: string;

  /**
   * Send a message.
   *
   * @remarks
   * Resolves once message is sent.
   * Otherwise rejects with an Error.
   *
   * @param message - Message to send.
   */
   send(message: string): Promise<void>;
}
