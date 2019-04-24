import { C } from "../../Constants";
import { InviteDialog } from "../dialogs";
import { OutgoingPrackRequest, OutgoingRequestDelegate, RequestOptions } from "../messages";
import { NonInviteClientTransaction } from "../transactions";
import { UserAgentClient } from "./user-agent-client";

export class PrackUserAgentClient extends UserAgentClient implements OutgoingPrackRequest {
  constructor(
    dialog: InviteDialog,
    delegate?: OutgoingRequestDelegate,
    options?: RequestOptions
  ) {
    const message = dialog.createOutgoingRequestMessage(C.PRACK, options);
    super(NonInviteClientTransaction, dialog.userAgentCore, message, delegate);
    dialog.signalingStateTransition(message);
  }
}
