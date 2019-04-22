import { IncomingRequest as IncomingRequestMessage } from "../../SIPMessage";
import { InviteDialog } from "../dialogs";
import { IncomingPrackRequest, IncomingRequestDelegate, OutgoingResponse, ResponseOptions} from "../messages";
import { NonInviteServerTransaction } from "../transactions";
import { UserAgentServer } from "./user-agent-server";

export class PrackUserAgentServer extends UserAgentServer implements IncomingPrackRequest {
  private dialog: InviteDialog;

  constructor(
    dialog: InviteDialog,
    message: IncomingRequestMessage,
    delegate?: IncomingRequestDelegate
  ) {
    super(NonInviteServerTransaction, dialog.userAgentCore, message, delegate);
    // Update dialog signaling state with offer/answer in body
    dialog.signalingStateTransition(message);
    this.dialog = dialog;
  }

  /**
   * Update the dialog signaling state on a 2xx response.
   * @param options Options bucket.
   */
  public accept(options: ResponseOptions = { statusCode: 200 }): OutgoingResponse {
    if (options.body) {
      // Update dialog signaling state with offer/answer in body
      this.dialog.signalingStateTransition(options.body);
    }
    return super.accept(options);
  }
}
