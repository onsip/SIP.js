import { RegisterContext as RegisterClientContextBase } from "../RegisterContext";
import { IncomingResponse as IncomingResponseMessage } from "../SIPMessage";
import { UA } from "../UA";

export class RegisterClientContext extends RegisterClientContextBase {

  constructor(ua: UA, options: any = {}) {
    super(ua, options);
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
    this.ua.userAgentCore.register(this.request, {
      onAccept: (response): void => this.receiveResponse(response.message),
      onProgress: (response): void => this.receiveResponse(response.message),
      onRedirect: (response): void => this.receiveResponse(response.message),
      onReject: (response): void => this.receiveResponse(response.message),
      onTrying: (response): void => this.receiveResponse(response.message)
    });
    return this;
  }
}
