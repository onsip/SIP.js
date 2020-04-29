import {
  IncomingByeRequest,
  IncomingRequestMessage,
  ResponseOptions
} from "../core";

/**
 * A request to end a {@link Session} (incoming BYE).
 * @public
 */
export class Bye {

  /** @internal */
  public constructor(private incomingByeRequest: IncomingByeRequest) {
  }

  /** Incoming BYE request message. */
  public get request(): IncomingRequestMessage {
    return this.incomingByeRequest.message;
  }

  /** Accept the request. */
  public accept(options?: ResponseOptions): Promise<void> {
    this.incomingByeRequest.accept(options);
    return Promise.resolve();
  }

  /** Reject the request. */
  public reject(options?: ResponseOptions): Promise<void> {
    this.incomingByeRequest.reject(options);
    return Promise.resolve();
  }
}
