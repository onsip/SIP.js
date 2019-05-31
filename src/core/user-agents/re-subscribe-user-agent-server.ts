import { IncomingRequest as IncomingRequestMessage } from "../../SIPMessage";
import { Dialog } from "../dialogs";
import { IncomingRequestDelegate, IncomingSubscribeRequest } from "../messages";
import { NonInviteServerTransaction } from "../transactions";
import { UserAgentServer } from "./user-agent-server";

export class ReSubscribeUserAgentServer extends UserAgentServer implements IncomingSubscribeRequest {
    constructor(
    dialog: Dialog,
    message: IncomingRequestMessage,
    delegate?: IncomingRequestDelegate
  ) {
    super(NonInviteServerTransaction, dialog.userAgentCore, message, delegate);
  }
}
