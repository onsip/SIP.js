import { Session } from "../Core/session";
import { NonInviteClientTransaction } from "../Core/transactions";

import { C } from "../Constants";
import { SessionStatus } from "../Enums";
import { Exceptions } from "../Exceptions";
import { Grammar } from "../Grammar";
import { ReferServerContext as ReferServerContextBase } from "../ReferContext";
import { SessionDescriptionHandlerModifiers } from "../session-description-handler";
import {
  IncomingRequest as IncomingRequestMessage,
  OutgoingRequest as OutgoingRequestMessage
} from "../SIPMessage";
import { UA } from "../UA";

export class ReferServerContext extends ReferServerContextBase {

  /**
   * Receives an in dialog REFER and handles the implicit subscription
   * dialog usage created by a REFER. The REFER is received within the
   * session provided.
   * @param ua UA
   * @param context The invite context within which REFER will be sent.
   * @param target Target of the REFER.
   * @param options Options bucket.
   */
  constructor(ua: UA, message: IncomingRequestMessage, private session?: Session) {
    super(ua, message);
  }

  public accept(
    options: ReferServerContextBase.AcceptOptions,
    modifiers?: SessionDescriptionHandlerModifiers
  ): void {
    super.accept(options, modifiers);
  }

  public progress(): void {
    super.progress();
  }

  public reject(
    options: ReferServerContextBase.RejectOptions
  ): void {
    super.reject(options);
  }

  /**
   * Send an in dialog NOTIFY.
   * @param body Content of body.
   */
  public sendNotify(body: string): void {
    // FIXME: Ported this. Clean it up. Session knows its state.
    if (this.status !== SessionStatus.STATUS_ANSWERED) {
      throw new Exceptions.InvalidStateError(this.status);
    }
    if (Grammar.parse(body, "sipfrag") === -1) {
      throw new Error("sipfrag body is required to send notify for refer");
    }

    // NOTIFY requests sent in same dialog as in dialog REFER.
    if (this.session) {
      this.session.notify(undefined, {
        extraHeaders: [
          "Event: refer",
          "Subscription-State: terminated",
        ],
        body: {
          contentDisposition: "render",
          contentType: "message/sipfrag",
          content: body
        }
      });
      return;
    }

    // The implicit subscription created by a REFER is the same as a
    // subscription created with a SUBSCRIBE request.  The agent issuing the
    // REFER can terminate this subscription prematurely by unsubscribing
    // using the mechanisms described in [2].  Terminating a subscription,
    // either by explicitly unsubscribing or rejecting NOTIFY, is not an
    // indication that the referenced request should be withdrawn or
    // abandoned.
    // https://tools.ietf.org/html/rfc3515#section-2.4.4

    // NOTIFY requests sent in new dialog for out of dialog REFER.
    // FIXME: TODO: This should be done in a subscribe dialog to satisfy the above.
    const request = new OutgoingRequestMessage(
      C.NOTIFY,
      this.remoteTarget,
      this.ua,
      {
        cseq: this.cseq += 1,  // randomly generated then incremented on each additional notify
        callId: this.callId, // refer callId
        fromUri: this.fromUri,
        fromTag: this.fromTag,
        toUri: this.toUri,
        toTag: this.toTag,
        routeSet: this.routeSet
      },
      [
        "Event: refer",
        "Subscription-State: terminated",
        "Content-Type: message/sipfrag"
      ],
      body
    );
    const transport = this.ua.transport;
    if (!transport) {
      throw new Error("Transport undefined.");
    }
    const user = {
      loggerFactory: this.ua.getLoggerFactory()
    };
    const nic = new NonInviteClientTransaction(request, transport, user);
  }
}
