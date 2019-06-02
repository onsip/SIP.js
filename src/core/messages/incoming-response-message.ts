import { TypeStrings } from "../../Enums";

import { IncomingMessage } from "./incoming-message";

/**
 * Incoming SIP response message.
 */
export class IncomingResponseMessage extends IncomingMessage {
  public type: TypeStrings;
  public statusCode: number | undefined;
  public reasonPhrase: string | undefined;

  constructor() {
    super();
    this.type = TypeStrings.IncomingResponse;
    this.headers = {};
  }
}
