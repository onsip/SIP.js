import { C } from "../../Constants";
import { NonInviteClientTransaction } from "../../Transactions";
import { SubscribeDialog } from "../dialogs";
import { OutgoingRequestDelegate, OutgoingSubscribeRequest, RequestOptions } from "../messages";
import { UserAgentClient } from "./user-agent-client";

export class ReSubscribeUserAgentClient extends UserAgentClient implements OutgoingSubscribeRequest {
  constructor(
    dialog: SubscribeDialog,
    delegate?: OutgoingRequestDelegate,
    options?: RequestOptions
  ) {
    const message = dialog.createOutgoingRequestMessage(C.SUBSCRIBE, options);
    super(NonInviteClientTransaction, dialog.userAgentCore, message, delegate);
  }
}
