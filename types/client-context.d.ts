import { EventEmitter } from "events";

import { Logger } from "./logger-factory";
import { NameAddrHeader } from "./name-addr-header";
import { IncomingResponse, OutgoingRequest } from "./sip-message";
import { UA } from "./ua";
import { URI } from "./uri";
import { TypeStrings } from "./enums";

export declare class ClientContext extends EventEmitter {
  static initializer(
    objToConstruct: ClientContext,
    ua: UA,
    method: string,
    originalTarget: string | URI,
    options?: any
  ): void

  type: TypeStrings;
  data: any;
  ua: UA;
  logger: Logger;
  request: OutgoingRequest;
  method: string;
  body: any;
  localIdentity: NameAddrHeader;
  remoteIdentity: NameAddrHeader;

  constructor(ua: UA, method: string, target: string | URI, options?: any)

  send(): this;
  receiveResponse(response: IncomingResponse): void;
  onRequestTimeout(): void;
  onTransportError(): void;
}