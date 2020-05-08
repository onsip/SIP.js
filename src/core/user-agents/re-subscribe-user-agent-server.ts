import { Dialog } from "../dialogs";
import { IncomingRequestDelegate, IncomingRequestMessage, IncomingSubscribeRequest } from "../messages";
import { NonInviteServerTransaction } from "../transactions";
import { UserAgentServer } from "./user-agent-server";

/**
 * Re-SUBSCRIBE UAS.
 * @public
 */
export class ReSubscribeUserAgentServer extends UserAgentServer implements IncomingSubscribeRequest {
  constructor(dialog: Dialog, message: IncomingRequestMessage, delegate?: IncomingRequestDelegate) {
    super(NonInviteServerTransaction, dialog.userAgentCore, message, delegate);
  }
}
