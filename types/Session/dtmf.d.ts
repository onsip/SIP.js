import { EventEmitter } from "events";

import { Session } from "../session";
import { IncomingRequest, IncomingResponse } from "../sip-message";

export declare class DTMF extends EventEmitter {
  tone: string;
  duration: number;
  interToneGap: number;

  constructor(session: Session, tone?: string | number, options?: any);

  send(options?: any): void;
  init_incoming(request: IncomingRequest): void;
  receiveResponse(response: IncomingResponse): void;
  onRequestTimeout(): void;
  onTransportError(): void;
  onDialogError(response: IncomingResponse): void;
}