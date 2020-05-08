import { IncomingRegisterRequest, IncomingRequestDelegate, IncomingRequestMessage } from "../messages";
import { NonInviteServerTransaction } from "../transactions";
import { UserAgentCore } from "../user-agent-core";
import { UserAgentServer } from "./user-agent-server";

/**
 * REGISTER UAS.
 * @public
 */
export class RegisterUserAgentServer extends UserAgentServer implements IncomingRegisterRequest {
  constructor(protected core: UserAgentCore, message: IncomingRequestMessage, delegate?: IncomingRequestDelegate) {
    super(NonInviteServerTransaction, core, message, delegate);
  }
}
