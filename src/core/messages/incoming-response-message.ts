import { IncomingMessage } from "./incoming-message";

/**
 * Incoming response message.
 * @public
 */
export class IncomingResponseMessage extends IncomingMessage {
  public statusCode: number | undefined;
  public reasonPhrase: string | undefined;

  constructor() {
    super();
  }
}
