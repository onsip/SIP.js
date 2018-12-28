import { EventEmitter } from "events";

export interface Notification {
  request: any;
}

/**
  * The Subscription interface SIP.js is providing.
  */
export class Subscription extends EventEmitter {

  refresh(): void;
  unsubscribe(): void;
  close(): void;

  on(name: 'accepted', callback: (response: any, cause: C.causes) => void): this;
  on(name: 'failed' | 'rejected', callback: (response?: any, cause?: C.causes) => void): this;
  on(name: 'terminated', callback: (message?: any, cause?: C.causes) => void): this;
  on(name: 'notify', callback: (notification: Notification) => void): this;
}
