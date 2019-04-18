import { IncomingRequest as IncomingRequestMessage } from "../../SIPMessage";
import { NonInviteServerTransaction } from "../../Transactions";
import { InviteDialog } from "../dialogs";
import { IncomingByeRequest, IncomingRequestDelegate } from "../messages";
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
