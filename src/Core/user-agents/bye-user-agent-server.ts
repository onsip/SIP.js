import { IncomingRequest as IncomingRequestMessage } from "../../SIPMessage";
import { InviteDialog } from "../dialogs";
import { IncomingByeRequest, IncomingRequestDelegate } from "../messages";
import { NonInviteServerTransaction } from "../transactions";
import { UserAgentServer } from "./user-agent-server";

export class ByeUserAgentServer extends UserAgentServer implements IncomingByeRequest {
  constructor(
    dialog: InviteDialog,
    message: IncomingRequestMessage,
    delegate?: IncomingRequestDelegate
  ) {
    super(NonInviteServerTransaction, dialog.userAgentCore, message, delegate);
  }
}
