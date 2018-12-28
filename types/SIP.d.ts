import { UA } from "./ua";
import { IncomingMessage } from "http";
import { NameAddrHeader } from "./name-addr-header";

export * from "./name-addr-header";
export * from "./session";
export * from "./session-description-handler";
export * from "./session-description-handler-factory";
export * from "./subscription";
export * from "./ua";
export * from "./uri";
export * from "./Web"
export * from "./Constants"

export const name: string;
export const version: string;

// TODO & FIXME
// If these are on the official public SIP.js API, then they should be typed.
// If not, these are leaking out of SIP.js up our application stack, so
// comment them out and compile to see where, then clean up their usage.

export const Exceptions: any;
export const Grammar: any;
export const Timers: any;
export const Utils: any;

export class OutgoingRequest {}

export class ServerContext {
  ua: UA;
  method: string;
  request: IncomingMessage;
  localIdentity: NameAddrHeader;
  remoteIdentitiy: NameAddrHeader;
  data: any;

  progress(options: any): ServerContext; // TODO
  accept(options: any): ServerContext; // TODO
  reject(options: any): ServerContext; // TODO
  reply(options: any): ServerContext; // TODO

  on(name: 'failed' | 'rejected', callback: (response: IncomingMessage, cause: string) => void): void;
  on(name: 'accepted', callback: (response: IncomingMessage, cause: string) => void): void;
  on(name: 'progress', callback: (response: IncomingMessage, cause: string) => void): void;
}
