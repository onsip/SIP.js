import { OutgoingRequest as OutgoingRequestMessage } from "../../SIPMessage";
import { OutgoingCancelRequest, OutgoingRequestDelegate } from "../messages";
import { NonInviteClientTransaction } from "../transactions";
import { UserAgentCore } from "../user-agent-core";
import { UserAgentClient } from "./user-agent-client";

export class CancelUserAgentClient extends UserAgentClient implements OutgoingCancelRequest {
  constructor(
    core: UserAgentCore,
    message: OutgoingRequestMessage,
    delegate?: OutgoingRequestDelegate
  ) {
    super(NonInviteClientTransaction, core, message, delegate);
  }
}
