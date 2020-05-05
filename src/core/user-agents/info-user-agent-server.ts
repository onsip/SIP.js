import { SessionDialog } from "../dialogs";
import { IncomingInfoRequest, IncomingRequestDelegate, IncomingRequestMessage } from "../messages";
import { NonInviteServerTransaction } from "../transactions";
import { UserAgentServer } from "./user-agent-server";

/**
 * INFO UAS.
 * @public
 */
export class InfoUserAgentServer extends UserAgentServer implements IncomingInfoRequest {
  constructor(dialog: SessionDialog, message: IncomingRequestMessage, delegate?: IncomingRequestDelegate) {
    super(NonInviteServerTransaction, dialog.userAgentCore, message, delegate);
  }
}
