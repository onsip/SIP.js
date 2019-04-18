import {
  IncomingResponse as IncomingResponseMessage,
  OutgoingRequest as OutgoingRequestMessage
} from "../../SIPMessage";
import { NonInviteClientTransaction } from "../../Transactions";
import { Dialog, SubscribeDialog } from "../dialogs";
import { OutgoingSubscribeRequest, OutgoingSubscribeRequestDelegate } from "../messages";
import { UserAgentCore } from "../user-agent-core";
import { UserAgentClient } from "./user-agent-client";

export class SubscribeUserAgentClient extends UserAgentClient implements OutgoingSubscribeRequest {
  public delegate: OutgoingSubscribeRequestDelegate | undefined;

  private dialog: SubscribeDialog | undefined;

  constructor(
    protected core: UserAgentCore,
    message: OutgoingRequestMessage,
    delegate?: OutgoingSubscribeRequestDelegate
  ) {
    super(NonInviteClientTransaction, core, message, delegate);
    this.delegate = delegate;
  }

  protected receiveResponse(message: IncomingResponseMessage): void {
    if (!this.authenticationGuard(message)) {
      return;
    }

    const statusCode = message.statusCode ? message.statusCode.toString() : "";
    if (!statusCode) {
      throw new Error("Response status code undefined.");
    }

    switch (true) {
      case /^100$/.test(statusCode):
        if (this.delegate && this.delegate.onTrying) {
          this.delegate.onTrying({ message });
        }
        break;
      case /^1[0-9]{2}$/.test(statusCode):
        if (this.delegate && this.delegate.onProgress) {
          this.delegate.onProgress({ message });
        }
        break;
      case /^2[0-9]{2}$/.test(statusCode):
        // In accordance with the rules for proxying non-INVITE requests as
        // defined in [RFC3261], successful SUBSCRIBE requests will receive only
        // one 200-class response; however, due to forking, the subscription may
        // have been accepted by multiple nodes.  The subscriber MUST therefore
        // be prepared to receive NOTIFY requests with "From:" tags that differ
        // from the "To:" tag received in the SUBSCRIBE 200-class response.
        //
        // If multiple NOTIFY requests are received in different dialogs in
        // response to a single SUBSCRIBE request, each dialog represents a
        // different destination to which the SUBSCRIBE request was forked.
        // Subscriber handling in such situations varies by event package; see
        // Section 5.4.9 for details.
        // https://tools.ietf.org/html/rfc6665#section-4.1.4

        // Each event package MUST specify whether forked SUBSCRIBE requests are
        // allowed to install multiple subscriptions.
        //
        // If such behavior is not allowed, the first potential dialog-
        // establishing message will create a dialog.  All subsequent NOTIFY
        // requests that correspond to the SUBSCRIBE request (i.e., have
        // matching "To", "From", "Call-ID", and "Event" header fields, as well
        // as "From" header field "tag" parameter and "Event" header field "id"
        // parameter) but that do not match the dialog would be rejected with a
        // 481 response.  Note that the 200-class response to the SUBSCRIBE
        // request can arrive after a matching NOTIFY request has been received;
        // such responses might not correlate to the same dialog established by
        // the NOTIFY request.  Except as required to complete the SUBSCRIBE
        // transaction, such non-matching 200-class responses are ignored.
        //
        // If installing of multiple subscriptions by way of a single forked
        // SUBSCRIBE request is allowed, the subscriber establishes a new dialog
        // towards each notifier by returning a 200-class response to each
        // NOTIFY request.  Each dialog is then handled as its own entity and is
        // refreshed independently of the other dialogs.
        //
        // In the case that multiple subscriptions are allowed, the event
        // package MUST specify whether merging of the notifications to form a
        // single state is required, and how such merging is to be performed.
        // Note that it is possible that some event packages may be defined in
        // such a way that each dialog is tied to a mutually exclusive state
        // that is unaffected by the other dialogs; this MUST be clearly stated
        // if it is the case.
        // https://tools.ietf.org/html/rfc6665#section-5.4.9

        // FIXME: TODO: We're assuming forked SUBSCRIBE requests are not allowed
        // to install multiple subscriptions and thus ignoring all but the first.
        if (!this.dialog) {
          const dialogState = Dialog.initialDialogStateForUserAgentClient(this.message, message);
          this.dialog = new SubscribeDialog(this.core, dialogState);
        }

        // Subscription Initiated! :)
        const subscription = this.dialog;
        if (this.delegate && this.delegate.onAccept) {
          this.delegate.onAccept({ message, subscription });
        }
        break;
      case /^3[0-9]{2}$/.test(statusCode):
        if (this.delegate && this.delegate.onRedirect) {
          this.delegate.onRedirect({ message });
        }
        break;
      case /^[4-6][0-9]{2}$/.test(statusCode):
        if (this.delegate && this.delegate.onReject) {
          this.delegate.onReject({ message });
        }
        break;
      default:
        throw new Error(`Invalid status code ${statusCode}`);
    }
  }
}
