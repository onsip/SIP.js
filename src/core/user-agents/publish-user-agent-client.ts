import { OutgoingPublishRequest, OutgoingRequestDelegate, OutgoingRequestMessage } from "../messages";
import { NonInviteClientTransaction } from "../transactions";
import { UserAgentCore } from "../user-agent-core";
import { UserAgentClient } from "./user-agent-client";

/**
 * PUBLISH UAC.
 * @public
 */
export class PublishUserAgentClient extends UserAgentClient implements OutgoingPublishRequest {
  constructor(core: UserAgentCore, message: OutgoingRequestMessage, delegate?: OutgoingRequestDelegate) {
    super(NonInviteClientTransaction, core, message, delegate);
  }
}
