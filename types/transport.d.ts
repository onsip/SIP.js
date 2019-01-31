import { EventEmitter } from "events";

import { Logger } from "./logger-factory";
import { OutgoingRequest } from "./sip-message";

import { TypeStrings } from "./enums";

export declare abstract class Transport extends EventEmitter {
  type: TypeStrings;
  server: any;

  constructor(logger: Logger, options: any);


  connect(options?: any): Promise<any>;
  abstract isConnected(): boolean;
  send(msg: OutgoingRequest | string, options?: any): Promise<any>;
  disconnect(options?: any): Promise<any>;
  afterConnected(callback: () => void): void;
  waitForConnected(): Promise<any>;
}