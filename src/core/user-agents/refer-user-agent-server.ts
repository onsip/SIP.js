import { IncomingRequest as IncomingRequestMessage } from "../../SIPMessage";
import { SessionDialog } from "../dialogs";
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
    dialogOrCore: SessionDialog | UserAgentCore,
    message: IncomingRequestMessage,
    delegate?: IncomingRequestDelegate
  ) {
    const userAgentCore =
      instanceOfSessionDialog(dialogOrCore) ?
        dialogOrCore.userAgentCore :
        dialogOrCore;
    super(NonInviteServerTransaction, userAgentCore, message, delegate);
  }
}

function instanceOfSessionDialog(object: any): object is SessionDialog {
  return object.userAgentCore !== undefined;
}
