import { C } from "../../Constants";
import { NonInviteClientTransaction } from "../../Transactions";
import { InviteDialog } from "../dialogs";
import { OutgoingReferRequest, OutgoingRequestDelegate, RequestOptions } from "../messages";
import { UserAgentClient } from "./user-agent-client";

export class ReferUserAgentClient extends UserAgentClient implements OutgoingReferRequest {
  constructor(
    dialog: InviteDialog,
    delegate?: OutgoingRequestDelegate,
    options?: RequestOptions
  ) {
    const message = dialog.createOutgoingRequestMessage(C.REFER, options);
    super(NonInviteClientTransaction, dialog.userAgentCore, message, delegate);
  }
}
