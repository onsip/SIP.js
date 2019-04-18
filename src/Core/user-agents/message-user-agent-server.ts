import { IncomingRequest as IncomingRequestMessage } from "../../SIPMessage";
import { NonInviteServerTransaction } from "../../Transactions";
import { IncomingMessageRequest, IncomingRequestDelegate } from "../messages";
import { UserAgentCore } from "../user-agent-core";
import { UserAgentServer } from "./user-agent-server";

export class MessageUserAgentServer extends UserAgentServer implements IncomingMessageRequest {
  constructor(
    protected core: UserAgentCore,
    message: IncomingRequestMessage,
    delegate?: IncomingRequestDelegate
  ) {
    super(NonInviteServerTransaction, core, message, delegate);
  }
}
