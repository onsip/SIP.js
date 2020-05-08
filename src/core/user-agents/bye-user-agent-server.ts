import { SessionDialog } from "../dialogs";
import { IncomingByeRequest, IncomingRequestDelegate, IncomingRequestMessage } from "../messages";
import { NonInviteServerTransaction } from "../transactions";
import { UserAgentServer } from "./user-agent-server";

/**
 * BYE UAS.
 * @public
 */
export class ByeUserAgentServer extends UserAgentServer implements IncomingByeRequest {
  constructor(dialog: SessionDialog, message: IncomingRequestMessage, delegate?: IncomingRequestDelegate) {
    super(NonInviteServerTransaction, dialog.userAgentCore, message, delegate);
  }
}
