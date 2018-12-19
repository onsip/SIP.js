import { IncomingRequest, IncomingResponse } from "./sip-message";
import { Transport } from "./transport";
import { UA } from "./ua";

export declare namespace SanityCheck {
  export function reply(statusCode: number, message: IncomingRequest | IncomingResponse, transport: Transport): void;
  export function rfc3261_8_2_2_1(message: IncomingRequest, ua: UA, transport: Transport): boolean;
  export function rfc3261_16_3_4(message: IncomingRequest, ua: UA, transport: Transport): boolean;
  export function rfc3261_18_3_request(
    message: IncomingRequest | IncomingResponse,
    ua: UA,
    transport: Transport
  ): boolean;
  export function rfc3261_8_2_2_2(message: IncomingRequest, ua: UA, transport: Transport): boolean;
  export function rfc3261_8_1_3_3(message: IncomingResponse, ua: UA): boolean;
  export function rfc3261_18_1_2(message: IncomingResponse, ua: UA): boolean;
  export function rfc3261_18_3_response(message: IncomingResponse, ua: UA): boolean;
  export function minimumHeaders(message: IncomingRequest | IncomingResponse, ua: UA): boolean;
  export function sanityCheck(message: IncomingRequest | IncomingResponse, ua: UA, transport: Transport): boolean;
}