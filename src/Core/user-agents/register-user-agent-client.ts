import { OutgoingRequest as OutgoingRequestMessage } from "../../SIPMessage";
import { OutgoingRegisterRequest, OutgoingRequestDelegate } from "../messages";
import { NonInviteClientTransaction } from "../transactions";
import { UserAgentCore } from "../user-agent-core";
import { UserAgentClient } from "./user-agent-client";

export class RegisterUserAgentClient extends UserAgentClient implements OutgoingRegisterRequest {
  constructor(
    core: UserAgentCore,
    message: OutgoingRequestMessage,
    delegate?: OutgoingRequestDelegate
  ) {
    super(NonInviteClientTransaction, core, message, delegate);
  }
}
