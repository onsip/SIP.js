import { C } from "../../Constants";
import { SessionDialog } from "../dialogs";
import { OutgoingReferRequest, OutgoingRequestDelegate, RequestOptions } from "../messages";
import { NonInviteClientTransaction } from "../transactions";
import { UserAgentClient } from "./user-agent-client";

export class ReferUserAgentClient extends UserAgentClient implements OutgoingReferRequest {
  constructor(
    dialog: SessionDialog,
    delegate?: OutgoingRequestDelegate,
    options?: RequestOptions
  ) {
    const message = dialog.createOutgoingRequestMessage(C.REFER, options);
    super(NonInviteClientTransaction, dialog.userAgentCore, message, delegate);
  }
}
