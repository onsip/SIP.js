import { IncomingRequest as IncomingRequestMessage } from "../../SIPMessage";
import { InviteDialog } from "../dialogs";
import { IncomingReferRequest, IncomingRequestDelegate } from "../messages";
import { NonInviteServerTransaction } from "../transactions";
import { UserAgentCore } from "../user-agent-core";
import { UserAgentServer } from "./user-agent-server";

export class ReferUserAgentServer extends UserAgentServer implements IncomingReferRequest {
  /**
   * REFER UAS constructor.
   * @param dialogOrCore Dialog for in dialog REFER, UserAgentCore for out of dialog REFER.
   * @param message Incoming REFER request message.
   */
  constructor(
    dialogOrCore: InviteDialog | UserAgentCore,
    message: IncomingRequestMessage,
    delegate?: IncomingRequestDelegate
  ) {
    const userAgentCore =
      instanceOfInviteDialog(dialogOrCore) ?
        dialogOrCore.userAgentCore :
        dialogOrCore;
    super(NonInviteServerTransaction, userAgentCore, message, delegate);
  }
}

function instanceOfInviteDialog(object: any): object is InviteDialog {
  return object.userAgentCore !== undefined;
}
