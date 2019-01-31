import { EventEmitter } from "events";

import { RequestSender } from "./request-sender";
import { IncomingResponse, OutgoingRequest, IncomingRequest } from "./sip-message";
import { Transport } from "./transport";
import { UA } from "./ua";

import { TransactionStatus, TypeStrings } from "./enums";

/**
 * @class Non Invite Client Transaction
 * @param {SIP.RequestSender} request_sender
 * @param {SIP.OutgoingRequest} request
 * @param {SIP.Transport} transport
 */
export declare class NonInviteClientTransaction extends EventEmitter {
  state: TransactionStatus | undefined;
  transport: Transport;
  type: TypeStrings;
  kind: string;
  id: string;

  constructor(requestSender: RequestSender, request: OutgoingRequest, transport: Transport);
  stateChanged(state: TransactionStatus): void;
  send(): void;
  receiveResponse(response: IncomingResponse): void;
}

/**
 * @class Invite Client Transaction
 * @param {SIP.RequestSender} request_sender
 * @param {SIP.OutgoingRequest} request
 * @param {SIP.Transport} transport
 */
export declare class InviteClientTransaction extends EventEmitter {
  state: TransactionStatus | undefined;
  transport: Transport;
  type: TypeStrings;
  kind: string;
  id: string;

  constructor(requestSender: RequestSender, request: OutgoingRequest, transport: Transport);
  stateChanged(state: TransactionStatus): void;
  send(): void;
  receiveResponse(response: IncomingResponse): void;
  sendACK(options?: any): OutgoingRequest | undefined;
}

/**
 * @class ACK Client Transaction
 * @param {SIP.RequestSender} request_sender
 * @param {SIP.OutgoingRequest} request
 * @param {SIP.Transport} transport
 */
export declare class AckClientTransaction extends EventEmitter {
  type: TypeStrings;
  transport: Transport;
  id: string;

  constructor(requestSender: RequestSender, request: OutgoingRequest, transport: Transport)
  send(): void;
}

/**
 * @class Non Invite Server Transaction
 * @param {SIP.IncomingRequest} request
 * @param {SIP.UA} ua
 */
export declare class NonInviteServerTransaction extends EventEmitter {
  state: TransactionStatus | undefined;
  transport: Transport | undefined;
  lastResponse: string;
  type: TypeStrings;
  kind: string;
  id: string;
  request: IncomingRequest;

  constructor(request: IncomingRequest, ua: UA);
  stateChanged(state: TransactionStatus): void;
  receiveResponse(statusCode: number, response: string): Promise<any>;
}

/**
 * @class Invite Server Transaction
 * @param {SIP.IncomingRequest} request
 * @param {SIP.UA} ua
 */
// tslint:disable-next-line:max-classes-per-file
export declare class InviteServerTransaction extends EventEmitter {
  state: TransactionStatus | undefined;
  transport: Transport | undefined;
  lastResponse: string;
  I: any | undefined;
  type: TypeStrings;
  kind: string;
  id: string;
  request: IncomingRequest;

  constructor(request: IncomingRequest, ua: UA);
  stateChanged(state: TransactionStatus): void;
  timer_I(): void;
  receiveResponse(statusCode: number, response: string): Promise<void>;
}
