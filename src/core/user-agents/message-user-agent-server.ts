import { IncomingMessageRequest, IncomingRequestDelegate, IncomingRequestMessage } from "../messages";
import { NonInviteServerTransaction } from "../transactions";
import { UserAgentCore } from "../user-agent-core";
import { UserAgentServer } from "./user-agent-server";

/**
 * MESSAGE UAS.
 * @public
 */
export class MessageUserAgentServer extends UserAgentServer implements IncomingMessageRequest {
  constructor(
    core: UserAgentCore,
    message: IncomingRequestMessage,
    delegate?: IncomingRequestDelegate
  ) {
    super(NonInviteServerTransaction, core, message, delegate);
  }
}
