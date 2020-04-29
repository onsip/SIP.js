import { OutgoingMessageRequest, OutgoingRequestDelegate, OutgoingRequestMessage } from "../messages";
import { NonInviteClientTransaction } from "../transactions";
import { UserAgentCore } from "../user-agent-core";
import { UserAgentClient } from "./user-agent-client";

/**
 * MESSAGE UAC.
 * @public
 */
export class MessageUserAgentClient extends UserAgentClient implements OutgoingMessageRequest {
  constructor(
    core: UserAgentCore,
    message: OutgoingRequestMessage,
    delegate?: OutgoingRequestDelegate
  ) {
    super(NonInviteClientTransaction, core, message, delegate);
  }
}
