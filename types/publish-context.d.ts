import { ClientContext } from "./client-context";
import { IncomingResponse } from "./sip-message";
import { UA } from "./ua";
import { URI } from "./uri";

export declare class PublishContext extends ClientContext {
  constructor(ua: UA, target: string | URI, event: string, options?: any);

  public publish(body: string): void;
  public unpublish(): void;
  public close(): void;
  public onRequestTimeout(): void;
  public onTransportError(): void;
  public receiveResponse(response: IncomingResponse): void;
}