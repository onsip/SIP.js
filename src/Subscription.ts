import { EventEmitter } from "events";

import { ClientContext } from "./ClientContext";
import { C } from "./Constants";
import {
  IncomingNotifyRequest,
  IncomingRequestMessage,
  IncomingRequestWithSubscription,
  IncomingResponse,
  IncomingResponseMessage,
  Logger,
  NameAddrHeader,
  OutgoingRequestMessage,
  OutgoingSubscribeRequest,
  RequestOptions,
  Subscription as SubscriptionCore,
  SubscriptionState,
  URI,
  UserAgentCore
} from "./core";
import { AllowedMethods } from "./core/user-agent-core/allowed-methods";
import { TypeStrings } from "./Enums";
import { BodyObj } from "./session-description-handler";
import { UA } from "./UA";
import { Utils } from "./Utils";

interface SubscriptionOptions {
  expires?: number;
  extraHeaders?: Array<string>;
  body?: string;
  contentType?: string;
}

/**
 * While this class is named `Subscription`, it is closer to
 * an implementation of a "subscriber" as defined in RFC 6665
 * "SIP-Specific Event Notifications".
 * https://tools.ietf.org/html/rfc6665
 * @class Class creating a SIP Subscriber.
 */
export class Subscription extends EventEmitter implements ClientContext {

  // ClientContext interface
  public type: TypeStrings;
  public ua: UA;
  public logger: Logger;
  public data: any = {};
  public method: string = C.SUBSCRIBE;
  public body: BodyObj | undefined = undefined;
  public localIdentity: NameAddrHeader;
  public remoteIdentity: NameAddrHeader;
  public request: OutgoingRequestMessage;
  public onRequestTimeout!: () => void; // not used
  public onTransportError!: () => void; // not used
  public receiveResponse!: () => void; // not used
  public send!: () => this; // not used

  // Internals
  private id: string;
  private context: SubscribeClientContext;
  private disposed: boolean;
  private event: string;
  private expires: number;
  private extraHeaders: Array<string>;
  private retryAfterTimer: any | undefined;
  private subscription: SubscriptionCore | undefined;
  private uri: URI;

  /**
   * Constructor.
   * @param ua User agent.
   * @param target Subscription target.
   * @param event Subscription event.
   * @param options Options bucket.
   */
  constructor(ua: UA, target: string | URI, event: string, options: SubscriptionOptions = {}) {
    super();

    // ClientContext interface
    this.type = TypeStrings.Subscription;
    this.ua = ua;
    this.logger = ua.getLogger("sip.subscription");
    if (options.body) {
      this.body = {
        body: options.body,
        contentType: options.contentType ? options.contentType : "application/sdp"
      };
    }

    // Target URI
    const uri: URI | undefined = ua.normalizeTarget(target);
    if (!uri) {
      throw new TypeError("Invalid target: " + target);
    }
    this.uri = uri;

    // Subscription event
    this.event = event;

    // Subscription expires
    if (options.expires === undefined) {
      this.expires = 3600;
    } else if (typeof options.expires !== "number") { // pre-typescript type guard
      ua.logger.warn(`Option "expires" must be a number. Using default of 3600.`);
      this.expires = 3600;
    } else {
      this.expires = options.expires;
    }

    // Subscription extra headers
    this.extraHeaders = (options.extraHeaders || []).slice();

    // Subscription context.
    this.context = this.initContext();

    this.disposed = false;

    // ClientContext interface
    this.request = this.context.message;
    if (!this.request.from) {
      throw new Error("From undefined.");
    }
    if (!this.request.to) {
      throw new Error("From undefined.");
    }
    this.localIdentity = this.request.from;
    this.remoteIdentity = this.request.to;

    // Add to UA's collection
    this.id = this.request.callId + this.request.from.parameters.tag + this.event;
    this.ua.subscriptions[this.id] = this;
  }

  /**
   * Destructor.
   */
  public dispose(): void {
    if (this.disposed) {
      return;
    }
    if (this.retryAfterTimer) {
      clearTimeout(this.retryAfterTimer);
      this.retryAfterTimer = undefined;
    }
    this.context.dispose();
    this.disposed = true;

    // Remove from UA's collection
    delete this.ua.subscriptions[this.id];
  }

  /**
   * Registration of event listeners.
   *
   * The following events are emitted...
   *  - "accepted" A 200-class final response to a SUBSCRIBE request was received.
   *  - "failed" A non-200-class final response to a SUBSCRIBE request was received.
   *  - "rejected" Emitted immediately after a "failed" event (yes, it's redundant).
   *  - "notify" A NOTIFY request was received.
   *  - "terminated" The subscription is moving to or has moved to a terminated state.
   *
   * More than one SUBSCRIBE request may be sent, so "accepted", "failed" and "rejected"
   * may be emitted multiple times. However these event will NOT be emitted for SUBSCRIBE
   * requests with expires of zero (unsubscribe requests).
   *
   * Note that a "terminated" event does NOT indicate the subscription is in the "terminated"
   * state as described in RFC 6665. Instead, a "terminated" event indicates that this class
   * is no longer usable and/or is in the process of becoming no longer usable.
   *
   * The order the events are emitted in is not deterministic. Some examples...
   *  - "accepted" may occur multiple times
   *  - "accepted" may follow "notify" and "notify" may follow "accepted"
   *  - "terminated" may follow "accepted" and "accepted" may follow "terminated"
   *  - "terminated" may follow "notify" and "notify" may follow "terminated"
   *
   * Hint: Experience suggests one workable approach to utilizing these events
   * is to make use of "notify" and "terminated" only. That is, call `subscribe()`
   * and if a "notify" occurs then you have a subscription. If a "terminated"
   * event occurs then either a new subscription failed to be established or an
   * established subscription has terminated or is in the process of terminating.
   * Note that "notify" events may follow a "terminated" event, but experience
   * suggests it is reasonable to discontinue usage of this class after receipt
   * of a "terminated" event. The other events are informational, but as they do not
   * arrive in a deterministic manner it is difficult to make use of them otherwise.
   *
   * @param name Event name.
   * @param callback Callback.
   */
  public on(
    name: "accepted" | "failed" | "rejected",
    callback: (message: IncomingResponseMessage, cause: string) => void
  ): this;
  public on(name: "notify", callback: (notification: { request: IncomingRequestMessage }) => void): this;
  public on(name: "terminated", callback: () => void): this;
  public on(name: string, callback: (...args: any[]) => void): this {
    return super.on(name, callback);
  }

  public emit(
    event: "accepted" | "failed" | "rejected",
    message: IncomingResponseMessage, cause: string
  ): boolean;
  public emit(event: "notify", notification: { request: IncomingRequestMessage }): boolean;
  public emit(event: "terminated"): boolean;
  public emit(event: string | symbol, ...args: any[]): boolean {
    return super.emit(event, ...args);
  }

  /**
   * Gracefully terminate.
   */
  public close(): void {
    if (this.disposed) {
      return;
    }
    this.dispose();

    switch (this.context.state) {
      case SubscriptionState.Initial:
        this.onTerminated();
        break;
      case SubscriptionState.NotifyWait:
        this.onTerminated();
        break;
      case SubscriptionState.Pending:
        this.unsubscribe();
        break;
      case SubscriptionState.Active:
        this.unsubscribe();
        break;
      case SubscriptionState.Terminated:
        this.onTerminated();
        break;
      default:
        break;
    }
  }

  /**
   * Send a re-SUBSCRIBE request if there is an "active" subscription.
   */
  public refresh(): void {
    switch (this.context.state) {
      case SubscriptionState.Initial:
        break;
      case SubscriptionState.NotifyWait:
        break;
      case SubscriptionState.Pending:
        break;
      case SubscriptionState.Active:
        if (this.subscription) {
          const request = this.subscription.refresh();
          request.delegate = {
            onAccept: ((response) => this.onAccepted(response)),
            onRedirect: ((response) => this.onFailed(response)),
            onReject: ((response) => this.onFailed(response)),
          };
        }
        break;
      case SubscriptionState.Terminated:
        break;
      default:
        break;
    }
  }

  /**
   * Send an initial SUBSCRIBE request if no subscription.
   * Send a re-SUBSCRIBE request if there is an "active" subscription.
   */
  public subscribe(): this {
    switch (this.context.state) {
      case SubscriptionState.Initial:
        this.context.subscribe().then((result) => {
          if (result.success) {
            if (result.success.subscription) {
              this.subscription = result.success.subscription;
              this.subscription.delegate = {
                onNotify: (request) => this.onNotify(request),
                onRefresh: (request) => this.onRefresh(request),
                onTerminated: () => this.close()
              };
            }
            this.onNotify(result.success.request);
          } else if (result.failure) {
            this.onFailed(result.failure.response);
          }
        });
        break;
      case SubscriptionState.NotifyWait:
        break;
      case SubscriptionState.Pending:
        break;
      case SubscriptionState.Active:
        this.refresh();
        break;
      case SubscriptionState.Terminated:
        break;
      default:
        break;
    }

    return this;
  }

  /**
   * Send a re-SUBSCRIBE request if there is a "pending" or "active" subscription.
   */
  public unsubscribe(): void {
    this.dispose();

    switch (this.context.state) {
      case SubscriptionState.Initial:
        break;
      case SubscriptionState.NotifyWait:
        break;
      case SubscriptionState.Pending:
        if (this.subscription) {
          this.subscription.unsubscribe();
          // responses intentionally ignored
        }
        break;
      case SubscriptionState.Active:
        if (this.subscription) {
          this.subscription.unsubscribe();
          // responses intentionally ignored
        }
        break;
      case SubscriptionState.Terminated:
        break;
      default:
        break;
    }

    this.onTerminated();
  }

  protected onAccepted(response: IncomingResponse): void {
    const statusCode: number = response.message.statusCode ? response.message.statusCode : 0;
    const cause: string = Utils.getReasonPhrase(statusCode);
    this.emit("accepted", response.message, cause);
  }

  protected onFailed(response?: IncomingResponse): void {
    this.close();
    if (response) {
      const statusCode: number = response.message.statusCode ? response.message.statusCode : 0;
      const cause: string = Utils.getReasonPhrase(statusCode);
      this.emit("failed", response.message, cause);
      this.emit("rejected", response.message, cause);
    }
  }

  protected onNotify(request: IncomingNotifyRequest): void {
    request.accept(); // Send 200 response.
    this.emit("notify", { request: request.message });

    // If we've set state to done, no further processing should take place
    // and we are only interested in cleaning up after the appropriate NOTIFY.
    if (this.disposed) {
      return;
    }

    //  If the "Subscription-State" value is "terminated", the subscriber
    //  MUST consider the subscription terminated.  The "expires" parameter
    //  has no semantics for "terminated" -- notifiers SHOULD NOT include an
    //  "expires" parameter on a "Subscription-State" header field with a
    //  value of "terminated", and subscribers MUST ignore any such
    //  parameter, if present.  If a reason code is present, the client
    //  should behave as described below.  If no reason code or an unknown
    //  reason code is present, the client MAY attempt to re-subscribe at any
    //  time (unless a "retry-after" parameter is present, in which case the
    //  client SHOULD NOT attempt re-subscription until after the number of
    //  seconds specified by the "retry-after" parameter).  The reason codes
    //  defined by this document are:
    // https://tools.ietf.org/html/rfc6665#section-4.1.3
    const subscriptionState = request.message.parseHeader("Subscription-State");
    if (subscriptionState && subscriptionState.state) {
      switch (subscriptionState.state) {
        case "terminated":
          if (subscriptionState.reason) {
            this.logger.log(`Terminated subscription with reason ${subscriptionState.reason}`);
            switch (subscriptionState.reason) {
              case "deactivated":
              case "timeout":
                this.initContext();
                this.subscribe();
                return;
              case "probation":
              case "giveup":
                this.initContext();
                if (subscriptionState.params && subscriptionState.params["retry-after"]) {
                  this.retryAfterTimer = setTimeout(() => this.subscribe(), subscriptionState.params["retry-after"]);
                } else {
                  this.subscribe();
                }
                return;
              case "rejected":
              case "noresource":
              case "invariant":
                break;
            }
          }
          this.close();
          break;
        default:
          break;
      }
    }
  }

  protected onRefresh(request: OutgoingSubscribeRequest): void {
    request.delegate = {
      onAccept: (response) => this.onAccepted(response)
    };
  }

  protected onTerminated(): void {
    this.emit("terminated");
  }

  private initContext(): SubscribeClientContext {
    const options = {
      extraHeaders: this.extraHeaders,
      body: this.body ? Utils.fromBodyObj(this.body) : undefined
    };
    this.context = new SubscribeClientContext(this.ua.userAgentCore, this.uri, this.event, this.expires, options);
    this.context.delegate = {
      onAccept: ((response) => this.onAccepted(response))
    };
    return this.context;
  }
}

interface SubscribeClientContextDelegate {
  /**
   * This SUBSCRIBE request will be confirmed with a final response.
   * 200-class responses indicate that the subscription has been accepted
   * and that a NOTIFY request will be sent immediately.
   * https://tools.ietf.org/html/rfc6665#section-4.1.2.1
   *
   * Called for initial SUBSCRIBE request only.
   * @param response 200-class incoming response.
   */
  onAccept?(response: IncomingResponse): void;
}

interface SubscribeResult {
  /** Exists if successfully established a subscription, otherwise undefined. */
  success?: IncomingRequestWithSubscription;
  /** Exists if failed to establish a subscription, otherwise undefined. */
  failure?: {
    /**
     * The negative final response to the SUBSCRIBE, if one was received.
     * Otherwise a timeout occured waiting for the initial NOTIFY.
     */
    response?: IncomingResponse;
  };
}

// tslint:disable-next-line:max-classes-per-file
class SubscribeClientContext {
  public delegate: SubscribeClientContextDelegate | undefined;
  public message: OutgoingRequestMessage;

  private logger: Logger;
  private request: OutgoingSubscribeRequest | undefined;
  private subscription: SubscriptionCore | undefined;

  private subscribed = false;

  constructor(
    private core: UserAgentCore,
    private target: URI,
    private event: string,
    private expires: number,
    options: RequestOptions,
    delegate?: SubscribeClientContextDelegate
  ) {
    this.logger = core.loggerFactory.getLogger("sip.subscription");
    this.delegate = delegate;

    const allowHeader = "Allow: " + AllowedMethods.toString();
    const extraHeaders = (options && options.extraHeaders || []).slice();
    extraHeaders.push(allowHeader);
    extraHeaders.push("Event: " + this.event);
    extraHeaders.push("Expires: " + this.expires);
    extraHeaders.push("Contact: " + this.core.configuration.contact.toString());

    const body = options && options.body;

    this.message = core.makeOutgoingRequestMessage(
      C.SUBSCRIBE,
      this.target,
      this.core.configuration.aor,
      this.target,
      {},
      extraHeaders,
      body
    );
  }

  /** Destructor. */
  public dispose(): void {
    if (this.subscription) {
      this.subscription.dispose();
    }
    if (this.request) {
      this.request.waitNotifyStop();
      this.request.dispose();
    }
  }

  /** Subscription state. */
  get state(): SubscriptionState {
    if (this.subscription) {
      return this.subscription.subscriptionState;
    } else if (this.subscribed) {
      return SubscriptionState.NotifyWait;
    } else {
      return SubscriptionState.Initial;
    }
  }

  /**
   * Establish subscription.
   * @param options Options bucket.
   */
  public subscribe(): Promise<SubscribeResult> {
    if (this.subscribed) {
      return Promise.reject(new Error("Not in initial state. Did you call subscribe more than once?"));
    }
    this.subscribed = true;

    return new Promise((resolve, reject) => {
      if (!this.message) {
        throw new Error("Message undefined.");
      }
      this.request = this.core.subscribe(this.message, {
        // This SUBSCRIBE request will be confirmed with a final response.
        // 200-class responses indicate that the subscription has been accepted
        // and that a NOTIFY request will be sent immediately.
        // https://tools.ietf.org/html/rfc6665#section-4.1.2.1
        onAccept: (response) => {
          if (this.delegate && this.delegate.onAccept) {
            this.delegate.onAccept(response);
          }
        },
        // Due to the potential for out-of-order messages, packet loss, and
        // forking, the subscriber MUST be prepared to receive NOTIFY requests
        // before the SUBSCRIBE transaction has completed.
        // https://tools.ietf.org/html/rfc6665#section-4.1.2.4
        onNotify: (requestWithSubscription): void => {
          this.subscription = requestWithSubscription.subscription;
          if (this.subscription) {
            this.subscription.autoRefresh = true;
          }
          resolve({ success: requestWithSubscription });
        },
        // If this Timer N expires prior to the receipt of a NOTIFY request,
        // the subscriber considers the subscription failed, and cleans up
        // any state associated with the subscription attempt.
        // https://tools.ietf.org/html/rfc6665#section-4.1.2.4
        onNotifyTimeout: () => {
          resolve({ failure: {} });
        },
        // This SUBSCRIBE request will be confirmed with a final response.
        // Non-200-class final responses indicate that no subscription or new
        // dialog usage has been created, and no subsequent NOTIFY request will
        // be sent.
        // https://tools.ietf.org/html/rfc6665#section-4.1.2.1
        onRedirect: (response) => {
          resolve({ failure: { response } });
        },
        // This SUBSCRIBE request will be confirmed with a final response.
        // Non-200-class final responses indicate that no subscription or new
        // dialog usage has been created, and no subsequent NOTIFY request will
        // be sent.
        // https://tools.ietf.org/html/rfc6665#section-4.1.2.1
        onReject: (response) => {
          resolve({ failure: { response } });
        }
      });
    });
  }
}
