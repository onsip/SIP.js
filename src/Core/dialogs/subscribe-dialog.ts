import { C } from "../../Constants";
import { Logger } from "../../LoggerFactory";
import { IncomingRequest as IncomingRequestMessage} from "../../SIPMessage";
import { OutgoingSubscribeRequest, OutgoingSubscribeRequestDelegate, RequestOptions } from "../messages";
import { Subscription, SubscriptionDelegate, SubscriptionState } from "../subscription";
import { UserAgentCore } from "../user-agent-core";
import { NotifyUserAgentServer } from "../user-agents/notify-user-agent-server";
import { ReSubscribeUserAgentClient } from "../user-agents/re-subscribe-user-agent-client";
import { Dialog } from "./dialog";
import { DialogState } from "./dialog-state";

/**
 * SIP-Specific Event Notification
 *
 * Abstract
 *
 *    This document describes an extension to the Session Initiation
 *    Protocol (SIP) defined by RFC 3261.  The purpose of this extension is
 *    to provide an extensible framework by which SIP nodes can request
 *    notification from remote nodes indicating that certain events have
 *    occurred.
 *
 *    Note that the event notification mechanisms defined herein are NOT
 *    intended to be a general-purpose infrastructure for all classes of
 *    event subscription and notification.
 *
 *    This document represents a backwards-compatible improvement on the
 *    original mechanism described by RFC 3265, taking into account several
 *    years of implementation experience.  Accordingly, this document
 *    obsoletes RFC 3265.  This document also updates RFC 4660 slightly to
 *    accommodate some small changes to the mechanism that were discussed
 *    in that document.
 *
 *  https://tools.ietf.org/html/rfc6665
 */
export class SubscribeDialog extends Dialog implements Subscription {
  public delegate: SubscriptionDelegate | undefined;

  private logger: Logger;

  constructor(
    core: UserAgentCore,
    state: DialogState,
    delegate?: SubscriptionDelegate
  ) {
    super(core, state);
    this.delegate = delegate;
    this.logger = core.loggerFactory.getLogger("sip.subscribe-dialog");
    this.logger.log(`SUBSCRIBE dialog ${this.id} constructed`);
  }

  public dispose(): void {
    super.dispose();
    this.logger.log(`SUBSCRIBE dialog ${this.id} destroyed`);
  }

  // FIXME: TODO:
  get subscriptionState(): SubscriptionState {
    return SubscriptionState.Initial;
  }

  public receiveRequest(message: IncomingRequestMessage): void {
    this.logger.log(`SUBSCRIBE dialog ${this.id} received ${message.method} request`);

    // Request within a dialog out of sequence guard.
    // https://tools.ietf.org/html/rfc3261#section-12.2.2
    if (!this.sequenceGuard(message)) {
      this.logger.log(`SUBSCRIBE dialog ${this.id} rejected out of order ${message.method} request.`);
      return;
    }

    // Request within a dialog common processing.
    // https://tools.ietf.org/html/rfc3261#section-12.2.2
    super.receiveRequest(message);

    // Switch on method and then delegate.
    switch (message.method) {
      case C.NOTIFY:
        {
          const uas = new NotifyUserAgentServer(this, message);
          if (this.delegate && this.delegate.onNotify) {
            this.delegate.onNotify(uas);
          } else {
            uas.accept();
          }
        }
        break;
      default:
        {
          this.logger.log(`SUBSCRIBE dialog ${this.id} received unimplemented ${message.method} request`);
          this.core.replyStateless(message, { statusCode: 501 });
        }
        break;
    }
  }

  public subscribe(delegate?: OutgoingSubscribeRequestDelegate, options?: RequestOptions): OutgoingSubscribeRequest {
    this.logger.log(`SUBSCRIBE dialog ${this.id} sending SUBSCRIBE request`);
    const uac = new ReSubscribeUserAgentClient(this, delegate, options);
    return uac;
  }
}
