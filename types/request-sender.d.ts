import { IncomingResponse, OutgoingRequest } from "./sip-message";
import { AckClientTransaction, InviteClientTransaction, NonInviteClientTransaction } from "./transactions";
import { UA } from "./ua";

import { TypeStrings } from "./enums";

export declare class RequestSender {
  type: TypeStrings;
  ua: UA;
  clientTransaction: InviteClientTransaction | NonInviteClientTransaction | AckClientTransaction | undefined;
  applicant: RequestSender.StreamlinedApplicant;

  constructor(applicant: RequestSender.StreamlinedApplicant, ua: UA);
  send(): InviteClientTransaction | NonInviteClientTransaction | AckClientTransaction;
  onRequestTimeout(): void;
  onTransportError(): void;
  receiveResponse(response: IncomingResponse): void;
}

export declare namespace RequestSender {
  interface StreamlinedApplicant {
    request: OutgoingRequest;
    onRequestTimeout: () => void;
    onTransportError: () => void;
    receiveResponse: (response: IncomingResponse) => void;
  }
}