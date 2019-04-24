import { PublishContext as PublishClientContextBase } from "../PublishContext";
import { IncomingResponse as IncomingResponseMessage } from "../SIPMessage";
import { UA } from "../UA";
import { URI } from "../URI";

export class PublishClientContext extends PublishClientContextBase {

  constructor(ua: UA, target: string | URI, event: string, options: any = {}) {
    super(ua, target, event, options);
  }

  // Override ClientContext
  public onRequestTimeout(): void {
    throw new Error("Method not utilized by user agent core.");
  }

  // Override ClientContext
  public onTransportError(): void {
    throw new Error("Method not utilized by user agent core.");
  }

  // Override ClientContext
  public receiveResponse(message: IncomingResponseMessage): void {
    super.receiveResponse(message);
  }

  // Override ClientContext
  public send(): this {
    if (!this.ua.userAgentCore) {
      throw new Error("User agent core undefined.");
    }
    this.ua.userAgentCore.publish(this.request, {
      onAccept: (response): void => this.receiveResponse(response.message),
      onProgress: (response): void => this.receiveResponse(response.message),
      onRedirect: (response): void => this.receiveResponse(response.message),
      onReject: (response): void => this.receiveResponse(response.message),
      onTrying: (response): void => this.receiveResponse(response.message)
    });
    return this;
  }

  public publish(body: string): void {
    return super.publish(body);
  }

  public unpublish(): void {
    return super.unpublish();
  }

  public close(): void {
    return super.close();
  }
}
