import { SessionDescriptionHandler } from "./session-description-handler";
import { InviteClientContext, InviteServerContext } from "./session";
import { DTMF } from "./Session/dtmf";
import { Subscription } from "./subscription";
import { URI } from "./uri";
import { IncomingRequest, IncomingResponse, OutgoingRequest } from "./sip-message";

import { DialogStatus, TypeStrings } from "./enums";

export declare class Dialog {
  static readonly C: DialogStatus;

  type: TypeStrings;
  localSeqnum: number;
  inviteSeqnum: number;
  localUri: URI;
  remoteUri: URI;
  remoteTarget: string;
  id: any;
  routeSet: Array<string>;
  pracked: Array<string>;
  sessionDescriptionHandler: SessionDescriptionHandler | undefined;
  owner: InviteClientContext | InviteServerContext | Subscription;
  state: DialogStatus;
  uacPendingReply: boolean;

  error: any;

  constructor(
    owner: InviteClientContext | InviteServerContext | Subscription,
    message: IncomingRequest | IncomingResponse,
    type: "UAC" | "UAS",
    state?: DialogStatus
  );

  update(message: IncomingRequest | IncomingResponse, type: "UAC" | "UAS"): void;
  terminate(): void;
  createRequest(method: string, extraHeaders: Array<string> | undefined, body: string): OutgoingRequest;
  checkInDialogRequest(request: IncomingRequest): boolean;
  sendRequest(
    applicant: InviteClientContext | Subscription | DTMF,
    method: string,
    options?: any
  ): OutgoingRequest;
  receiveRequest(request: IncomingRequest): void;
}