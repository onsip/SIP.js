import { SessionDialog } from "../dialogs";
import { C, OutgoingInfoRequest, OutgoingRequestDelegate, RequestOptions } from "../messages";
import { NonInviteClientTransaction } from "../transactions";
import { UserAgentClient } from "./user-agent-client";

/**
 * INFO UAC.
 * @public
 */
export class InfoUserAgentClient extends UserAgentClient implements OutgoingInfoRequest {
  constructor(dialog: SessionDialog, delegate?: OutgoingRequestDelegate, options?: RequestOptions) {
    const message = dialog.createOutgoingRequestMessage(C.INFO, options);
    super(NonInviteClientTransaction, dialog.userAgentCore, message, delegate);
  }
}
