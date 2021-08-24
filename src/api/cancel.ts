import { IncomingRequestMessage } from "../core";

/**
 * A request to end a {@link Session} (incoming CANCEL).
 * @public
 */
export class Cancel {
  /** @internal */
  public constructor(private incomingCancelRequest: IncomingRequestMessage) {}

  /** Incoming ACK request message. */
  public get request(): IncomingRequestMessage {
    return this.incomingCancelRequest;
  }
}
