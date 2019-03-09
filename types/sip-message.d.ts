import { Dialog } from "./dialogs";
import { NameAddrHeader } from "./name-addr-header";
import { ClientTransaction, ServerTransaction } from "./transactions";
import { Transport } from "./transport";
import { UA } from "./ua";
import { URI } from "./uri";

import { TypeStrings } from "./enums";

/**
 * @class Class for outgoing SIP request.
 * @param {String} method request method
 * @param {String} ruri request uri
 * @param {SIP.UA} ua
 * @param {Object} params parameters that will have priority over ua.configuration parameters:
 * <br>
 *  - cseq, callId, fromTag, fromUri, fromDisplayName, toUri, toTag, routeSet
 * @param {Object} [headers] extra headers
 * @param {String} [body]
 */
export declare class OutgoingRequest {
  type: TypeStrings;
  ruri: string | URI;
  ua: UA;
  headers: {[name: string]: Array<string>};
  method: string;
  cseq: number;
  body: string | { body: string, contentType: string } | undefined;
  to: NameAddrHeader | undefined;
  from: NameAddrHeader | undefined;
  extraHeaders: Array<string>;
  callId: string;

  dialog: Dialog | undefined;
  transaction: ClientTransaction | undefined;
  branch: string | undefined;

  constructor(
    method: string,
    ruri: string | URI,
    ua: UA,
    params: any,
    extraHeaders: Array<string>,
    body?: string | { body: string, contentType: string } | undefined
  );
  getHeader(name: string): string | undefined;
  getHeaders(name: string): Array<string>;
  hasHeader(name: string): boolean;
  setHeader(name: string, value: string | Array<string>): void;
  setViaHeader(branchParameter: string, transport: Transport): void;
  cancel(reason?: string, extraHeaders?: Array<string>): void
  toString(): string;
}

export declare class IncomingMessage {
  type: TypeStrings;
  viaBranch: string;
  method: string;
  body: string;
  toTag: string;
  to: NameAddrHeader;
  fromTag: string;
  from: NameAddrHeader;
  callId: string;
  cseq: number;
  via: {host: string, port: number};
  headers: {[name: string]: any};
  referTo: string | undefined;
  data: string;

  addHeader(name: string, value: string): void;
  getHeader(name: string): string | undefined;
  getHeaders(name: string): Array<string>;
  hasHeader(name: string): boolean;
  parseHeader(name: string, idx?: number): any | undefined;
  s(name: string, idx?: number): any | undefined;
  setHeader(name: string, value: string): void;
  toString(): string;
}

/**
 * @class Class for incoming SIP request.
 */
export declare class IncomingRequest extends IncomingMessage {
  ua: UA;
  ruri: URI | undefined;
  transaction: ServerTransaction | undefined;
  transport: Transport | undefined;

  constructor(ua: UA);

  reply(
    code: number,
    reason?: string,
    extraHeaders?: Array<string>,
    body?: string | { body: string; contentType: string }
  ): string;

  reply_sl(code: number, reason?: string): string;
}

/**
 * @class Class for incoming SIP response.
 */
export declare class IncomingResponse extends IncomingMessage {
  ua: UA;
  statusCode: number | undefined;
  reasonPhrase: string | undefined;
  transaction: ClientTransaction | undefined;

  constructor(ua: UA);

  /**
   * Constructs and sends ACK to 2xx final response. Returns the sent ACK.
   * @param response The 2xx final response the ACK is acknowledging.
   * @param options ACK options; extra headers, body.
   */
  ack(
    options?: {
      extraHeaders?: Array<string>,
      body?: string | { body?: string, contentType: string }
    }
  ): OutgoingRequest;
}
