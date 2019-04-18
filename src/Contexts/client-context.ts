import { ClientContext as ClientContextBase } from "../ClientContext";
import { IncomingResponse as IncomingResponseMessage } from "../SIPMessage";
import { UA } from "../UA";
import { URI } from "../URI";

export class ClientContext extends ClientContextBase {

  // Override ClientContext
  constructor(ua: UA, method: string, target: string | URI, options?: any) {
    super(ua, method, target, options);
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
    const outgoingRequest = this.ua.userAgentCore.request(this.request, {
      onAccept: (response): void => this.receiveResponse(response.message),
      onProgress: (response): void => this.receiveResponse(response.message),
      onRedirect: (response): void => this.receiveResponse(response.message),
      onReject: (response): void => this.receiveResponse(response.message),
      onTrying: (response): void => this.receiveResponse(response.message)
    });
    return this;
  }
}
