import { IncomingRequest as IncomingRequestMessage } from "../../SIPMessage";
import { NonInviteServerTransaction,  } from "../../Transactions";
import { InviteDialog } from "../dialogs";
import { IncomingInfoRequest, IncomingRequestDelegate } from "../messages";
import { UserAgentServer } from "./user-agent-server";

export class InfoUserAgentServer extends UserAgentServer implements IncomingInfoRequest {
  constructor(
    dialog: InviteDialog,
    message: IncomingRequestMessage,
    delegate?: IncomingRequestDelegate
  ) {
    super(NonInviteServerTransaction, dialog.userAgentCore, message, delegate);
  }
}
