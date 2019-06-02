import { TypeStrings } from "../../Enums";
import { URI } from "../../URI";

import { IncomingMessage } from "./incoming-message";

/**
 * Incoming SIP request message.
 */
export class IncomingRequestMessage extends IncomingMessage {
  public type: TypeStrings;
  public ruri: URI | undefined;

  constructor() {
    super();
    this.type = TypeStrings.IncomingRequest;
  }
}
