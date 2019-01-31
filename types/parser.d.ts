import { IncomingRequest, IncomingResponse } from "./sip-message";
import { UA } from "./ua";

export declare namespace Parser {
  export function getHeader(data: any, headerStart: number): number;
  export function parseHeader(
    message: IncomingRequest | IncomingResponse,
    data: any,
    headerStart: number,
    headerEnd: number
  ): boolean | any;
  export function parseMessage(data: string, ua: UA): IncomingRequest | IncomingResponse | undefined;
}