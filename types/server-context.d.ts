import { EventEmitter } from "events";

import { Logger } from "./logger-factory";
import { NameAddrHeader } from "./name-addr-header";
import { IncomingMessage, IncomingRequest } from "./sip-message";
import { InviteServerTransaction, NonInviteServerTransaction } from "./transactions";
import { UA } from "./ua";

import { TypeStrings } from "./enums";

export declare class ServerContext extends EventEmitter {
  static initializer(objectToConstruct: ServerContext, ua: UA, request: IncomingRequest): void;

  type: TypeStrings;
  ua: UA;
  logger: Logger;
  method: string;
  request: IncomingMessage;
  localIdentity: NameAddrHeader;
  remoteIdentity: NameAddrHeader;
  data: any;

  transaction: InviteServerTransaction | NonInviteServerTransaction;
  body: any;
  contentType: string | undefined;
  assertedIdentity: NameAddrHeader | undefined;

  constructor(ua: UA, request: IncomingRequest);

  progress(options?: any): this; // TODO
  accept(options?: any): this; // TODO
  reject(options?: any): this; // TODO
  reply(options?: any): this; // TODO

  onRequestTimeout(): void;
  onTransportError(): void;
}