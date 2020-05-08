import { SessionDialog } from "../dialogs";
import { C, OutgoingPrackRequest, OutgoingRequestDelegate, RequestOptions } from "../messages";
import { NonInviteClientTransaction } from "../transactions";
import { UserAgentClient } from "./user-agent-client";

/**
 * PRACK UAC.
 * @public
 */
export class PrackUserAgentClient extends UserAgentClient implements OutgoingPrackRequest {
  constructor(dialog: SessionDialog, delegate?: OutgoingRequestDelegate, options?: RequestOptions) {
    const message = dialog.createOutgoingRequestMessage(C.PRACK, options);
    super(NonInviteClientTransaction, dialog.userAgentCore, message, delegate);
    dialog.signalingStateTransition(message);
  }
}
