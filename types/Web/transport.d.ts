import { Transport as TransportBase } from "../transport";

import { TypeStrings } from "../enums";
export const TransportStatus: {[name: string]: number};
export type TransportStatus = any;

export declare class Transport extends TransportBase {
  static readonly C: TransportStatus;
  type: TypeStrings;
  server: any;
  ws: any;

  isConnected(): boolean;
}