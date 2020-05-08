import { IncomingInfoRequest, IncomingRequestMessage, ResponseOptions } from "../core";

/**
 * An exchange of information (incoming INFO).
 * @public
 */
export class Info {
  /** @internal */
  public constructor(private incomingInfoRequest: IncomingInfoRequest) {}

  /** Incoming MESSAGE request message. */
  public get request(): IncomingRequestMessage {
    return this.incomingInfoRequest.message;
  }

  /** Accept the request. */
  public accept(options?: ResponseOptions): Promise<void> {
    this.incomingInfoRequest.accept(options);
    return Promise.resolve();
  }

  /** Reject the request. */
  public reject(options?: ResponseOptions): Promise<void> {
    this.incomingInfoRequest.reject(options);
    return Promise.resolve();
  }
}
