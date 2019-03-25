import { Transport as TransportBase } from "../transport";

import { TypeStrings } from "../enums";
export const TransportStatus: {[name: string]: number};
export type TransportStatus = any;

export declare class WebTransport extends TransportBase {
  static readonly C: TransportStatus;
  type: TypeStrings;
  server: any;
  ws: any;

  isConnected(): boolean;

}

export interface WsServer {
    scheme: string;
    sipUri: string;
    wsUri: string;
    weight: number;
    isError: boolean;
}

export interface Configuration {
    wsServers: Array<WsServer>;
    connectionTimeout: number;
    maxReconnectionAttempts: number;
    reconnectionTimeout: number;
    keepAliveInterval: number;
    keepAliveDebounce: number;
    traceSip: boolean;
}
