import { SessionDialog } from "../dialogs";
import { C, OutgoingByeRequest, OutgoingRequestDelegate, RequestOptions } from "../messages";
import { NonInviteClientTransaction } from "../transactions";
import { UserAgentClient } from "./user-agent-client";

/**
 * BYE UAC.
 * @public
 */
export class ByeUserAgentClient extends UserAgentClient implements OutgoingByeRequest {
  constructor(dialog: SessionDialog, delegate?: OutgoingRequestDelegate, options?: RequestOptions) {
    const message = dialog.createOutgoingRequestMessage(C.BYE, options);
    super(NonInviteClientTransaction, dialog.userAgentCore, message, delegate);
    dialog.dispose();
  }
}
