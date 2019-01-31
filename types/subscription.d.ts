import { C } from "./constants";
import { ClientContext } from "./client-context";
import { IncomingRequest, IncomingResponse } from "./sip-message";
import { UA } from "./ua";
import { URI } from "./uri";

import { TypeStrings } from "./enums";

export declare interface Notification {
  request: any;
}
/**
  * The Subscription interface SIP.js is providing.
  */
 export declare class Subscription extends ClientContext {
  constructor(ua: UA, target: string | URI, event: string, options: any);

  subscribe(): Subscription;
  refresh(): void;
  receiveResponse(response: IncomingResponse): void;
  unsubscribe(): void;
  receiveRequest(request: IncomingRequest): void;
  onDialogError(response: IncomingResponse): void;
  close(): void;

  on(name: 'accepted', callback: (response: any, cause: C.causes) => void): this;
  on(name: 'failed' | 'rejected', callback: (response?: any, cause?: C.causes) => void): this;
  on(name: 'terminated', callback: (message?: any, cause?: C.causes) => void): this;
  on(name: 'notify', callback: (notification: Notification) => void): this;
}
