import { EventEmitter } from "events";

import { Logger } from "./logger-factory";
import { TypeStrings } from "./enums";

export declare abstract class Transport extends EventEmitter {
  type: TypeStrings;
  server: any;

  constructor(logger: Logger, options: any);

  connect(options?: any): Promise<void>;
  abstract isConnected(): boolean;
  send(msg: string, options?: any): Promise<void>;
  disconnect(options?: any): Promise<void>;
  afterConnected(callback: () => void): void;
  waitForConnected(): Promise<void>;
}