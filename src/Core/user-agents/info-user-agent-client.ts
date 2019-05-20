import { C } from "../../Constants";
import { SessionDialog } from "../dialogs";
import { OutgoingInfoRequest, OutgoingRequestDelegate, RequestOptions } from "../messages";
import { NonInviteClientTransaction } from "../transactions";
import { UserAgentClient } from "./user-agent-client";

export class InfoUserAgentClient extends UserAgentClient implements OutgoingInfoRequest {
  constructor(
    dialog: SessionDialog,
    delegate?: OutgoingRequestDelegate,
    options?: RequestOptions
  ) {
    const message = dialog.createOutgoingRequestMessage(C.INFO, options);
    super(NonInviteClientTransaction, dialog.userAgentCore, message, delegate);
  }
}
