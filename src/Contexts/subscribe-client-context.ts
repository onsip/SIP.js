import { Subscription } from "../Core/subscription";

import {
  IncomingRequest as IncomingRequestMessage,
  IncomingResponse as IncomingResponseMessage
} from "../SIPMessage";
import { Subscription as SubscribeClientContextBase } from "../Subscription";
import { UA } from "../UA";
import { URI } from "../URI";

export class SubscribeClientContext extends SubscribeClientContextBase {

  private subscription: Subscription | undefined;

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
    this.ua.userAgentCore.subscribe(this.request, {
      onAccept: (subscribeResponse): void => {
        this.subscription = subscribeResponse.subscription;
        return this.receiveResponse(subscribeResponse.message);
      },
      onProgress: (subscribeResponse): void => this.receiveResponse(subscribeResponse.message),
      onRedirect: (subscribeResponse): void => this.receiveResponse(subscribeResponse.message),
      onReject: (subscribeResponse): void => this.receiveResponse(subscribeResponse.message),
      onTrying: (subscribeResponse): void => this.receiveResponse(subscribeResponse.message)
    });
    return this;
  }

  public refresh(): void {
    super.refresh();
  }

  public subscribe(): SubscribeClientContextBase {
    return super.subscribe();
  }

  public unsubscribe(): void {
    super.unsubscribe();
  }

  public close(): void {
    return;
  }

  protected sendSubscribeRequest(options: any = {}): void {
    if (!this.subscription) {
      throw new Error("Subscription undefined.");
    }
    this.subscription.subscribe(options);
  }

  // Override SubscribeClientContextBase member we want to make sure we are not using.
  protected createConfirmedDialog(message: IncomingRequestMessage, type: "UAC" | "UAS"): boolean {
    return true;
  }
}
