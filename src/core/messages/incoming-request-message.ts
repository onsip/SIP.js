import { URI } from "../messages";
import { IncomingMessage } from "./incoming-message";

/**
 * Incoming request message.
 * @public
 */
export class IncomingRequestMessage extends IncomingMessage {
  public ruri: URI | undefined;

  constructor() {
    super();
  }
}
