import { SessionDialog } from "../dialogs";
import { IncomingReferRequest, IncomingRequestDelegate, IncomingRequestMessage } from "../messages";
import { NonInviteServerTransaction } from "../transactions";
import { UserAgentCore } from "../user-agent-core";
import { UserAgentServer } from "./user-agent-server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function instanceOfSessionDialog(object: any): object is SessionDialog {
  return object.userAgentCore !== undefined;
}

/**
 * REFER UAS.
 * @public
 */
export class ReferUserAgentServer extends UserAgentServer implements IncomingReferRequest {
  /**
   * REFER UAS constructor.
   * @param dialogOrCore - Dialog for in dialog REFER, UserAgentCore for out of dialog REFER.
   * @param message - Incoming REFER request message.
   */
  constructor(
    dialogOrCore: SessionDialog | UserAgentCore,
    message: IncomingRequestMessage,
    delegate?: IncomingRequestDelegate
  ) {
    const userAgentCore = instanceOfSessionDialog(dialogOrCore) ? dialogOrCore.userAgentCore : dialogOrCore;
    super(NonInviteServerTransaction, userAgentCore, message, delegate);
  }
}
