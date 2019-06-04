import { URI } from "../messages";

import { IncomingMessage } from "./incoming-message";

/**
 * Incoming SIP request message.
 */
export class IncomingRequestMessage extends IncomingMessage {
  public ruri: URI | undefined;

  constructor() {
    super();
  }
}
