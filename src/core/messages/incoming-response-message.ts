import { IncomingMessage } from "./incoming-message";

/**
 * Incoming SIP response message.
 */
export class IncomingResponseMessage extends IncomingMessage {
  public statusCode: number | undefined;
  public reasonPhrase: string | undefined;

  constructor() {
    super();
    this.headers = {};
  }
}
