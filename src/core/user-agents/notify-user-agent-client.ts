import { SessionDialog } from "../dialogs";
import { C, OutgoingNotifyRequest, OutgoingRequestDelegate, RequestOptions } from "../messages";
import { NonInviteClientTransaction } from "../transactions";
import { UserAgentClient } from "./user-agent-client";

/**
 * NOTIFY UAS.
 * @public
 */
export class NotifyUserAgentClient extends UserAgentClient implements OutgoingNotifyRequest {
  constructor(dialog: SessionDialog, delegate?: OutgoingRequestDelegate, options?: RequestOptions) {
    const message = dialog.createOutgoingRequestMessage(C.NOTIFY, options);
    super(NonInviteClientTransaction, dialog.userAgentCore, message, delegate);
  }
}
