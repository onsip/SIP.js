import { SessionDialog } from "../dialogs/session-dialog.js";
import { IncomingRequestDelegate } from "../messages/incoming-request.js";
import { IncomingRequestMessage } from "../messages/incoming-request-message.js";
import { IncomingUpdateRequest } from "../messages/methods/update.js";
import { NonInviteServerTransaction } from "../transactions/non-invite-server-transaction.js";
import { UserAgentServer } from "./user-agent-server.js";
import { OutgoingResponse, ResponseOptions } from "../messages/outgoing-response.js";

/**
 * UPDATE UAS.
 * @public
 */
export class UpdateUserAgentServer extends UserAgentServer implements IncomingUpdateRequest {
  private dialog: SessionDialog;

  constructor(dialog: SessionDialog, message: IncomingRequestMessage, delegate?: IncomingRequestDelegate) {
    super(NonInviteServerTransaction, dialog.userAgentCore, message, delegate);
    dialog.updateUserAgentServer = this;
    this.dialog = dialog;
  }

  public accept(options: ResponseOptions = { statusCode: 200 }): OutgoingResponse {
    const response = super.accept(options);
    this.dialog.updateUserAgentServer = undefined;

    if (options.body) {
      // Update dialog signaling state with offer/answer in body
      this.dialog.signalingStateTransition(options.body);
    }

    return response;
  }

  public reject(options: ResponseOptions = { statusCode: 504 }): OutgoingResponse {
    this.dialog.signalingStateRollback();
    this.dialog.updateUserAgentServer = undefined;
    return super.reject(options);
  }
}
