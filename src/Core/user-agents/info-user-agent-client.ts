import { C } from "../../Constants";
import { NonInviteClientTransaction } from "../../Transactions";
import { InviteDialog } from "../dialogs";
import { OutgoingInfoRequest, OutgoingRequestDelegate, RequestOptions } from "../messages";
import { UserAgentClient } from "./user-agent-client";

export class InfoUserAgentClient extends UserAgentClient implements OutgoingInfoRequest {
  constructor(
    dialog: InviteDialog,
    delegate?: OutgoingRequestDelegate,
    options?: RequestOptions
  ) {
    const message = dialog.createOutgoingRequestMessage(C.INFO, options);
    super(NonInviteClientTransaction, dialog.userAgentCore, message, delegate);
  }
}
