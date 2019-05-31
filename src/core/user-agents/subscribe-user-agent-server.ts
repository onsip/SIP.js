import { IncomingRequest as IncomingRequestMessage } from "../../SIPMessage";
import { IncomingRequestDelegate, IncomingSubscribeRequest } from "../messages";
import { NonInviteServerTransaction } from "../transactions";
import { UserAgentCore } from "../user-agent-core";
import { UserAgentServer } from "./user-agent-server";

export class SubscribeUserAgentServer extends UserAgentServer implements IncomingSubscribeRequest {
  constructor(
    protected core: UserAgentCore,
    message: IncomingRequestMessage,
    delegate?: IncomingRequestDelegate
  ) {
    super(NonInviteServerTransaction, core, message, delegate);
  }
}
