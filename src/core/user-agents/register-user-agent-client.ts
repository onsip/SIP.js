import { OutgoingRegisterRequest, OutgoingRequestDelegate, OutgoingRequestMessage } from "../messages";
import { NonInviteClientTransaction } from "../transactions";
import { UserAgentCore } from "../user-agent-core";
import { UserAgentClient } from "./user-agent-client";

/**
 * REGISTER UAC.
 * @public
 */
export class RegisterUserAgentClient extends UserAgentClient implements OutgoingRegisterRequest {
  constructor(core: UserAgentCore, message: OutgoingRequestMessage, delegate?: OutgoingRequestDelegate) {
    super(NonInviteClientTransaction, core, message, delegate);
  }
}
