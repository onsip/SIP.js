import { OutgoingRequest as OutgoingRequestMessage } from "../../SIPMessage";
import { NonInviteClientTransaction } from "../../Transactions";
import { OutgoingMessageRequest, OutgoingRequestDelegate } from "../messages";
import { UserAgentCore } from "../user-agent-core";
import { UserAgentClient } from "./user-agent-client";

export class MessageUserAgentClient extends UserAgentClient implements OutgoingMessageRequest {
  constructor(
    protected core: UserAgentCore,
    message: OutgoingRequestMessage,
    delegate?: OutgoingRequestDelegate
  ) {
    super(NonInviteClientTransaction, core, message, delegate);
  }
}
