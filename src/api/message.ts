import {
  IncomingMessageRequest,
  IncomingRequestMessage,
  ResponseOptions
} from "../core";

/**
 * A received message (incoming MESSAGE).
 * @public
 */
export class Message {

  /** @internal */
  constructor(private incomingMessageRequest: IncomingMessageRequest) {
  }

  /** Incoming MESSAGE request message. */
  get request(): IncomingRequestMessage {
    return this.incomingMessageRequest.message;
  }

  /** Accept the request. */
  public accept(options?: ResponseOptions): Promise<void> {
    this.incomingMessageRequest.accept(options);
    return Promise.resolve();
  }

  /** Reject the request. */
  public reject(options?: ResponseOptions): Promise<void> {
    this.incomingMessageRequest.reject(options);
    return Promise.resolve();
  }
}
