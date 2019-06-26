import {
  C,
  IncomingNotifyRequest,
  IncomingRequestMessage,
  IncomingRequestWithSubscription,
  IncomingResponse,
  IncomingResponseMessage,
  Logger,
  OutgoingRequestMessage,
  OutgoingSubscribeRequest,
  RequestOptions,
  Subscription as SubscriptionDialog,
  SubscriptionState as SubscriptionDialogState,
  URI,
  UserAgentCore
} from "../core";
import { AllowedMethods } from "../core/user-agent-core/allowed-methods";
import { Utils } from "../Utils";

import { Notification } from "./notification";
import { BodyAndContentType } from "./session-description-handler";
import { SubscriberOptions } from "./subscriber-options";
import { SubscriberSubscribeOptions } from "./subscriber-subscribe-options";
import { Subscription } from "./subscription";
import { SubscriptionState } from "./subscription-state";
import { SubscriptionUnsubscribeOptions } from "./subscription-unsubscribe-options";
import { UserAgent } from "./user-agent";

/**
 * A subscriber establishes a {@link Subscription} (outgoing SUBSCRIBE).
 *
 * @remarks
 * This is (more or less) an implementation of a "subscriber" as
 * defined in RFC 6665 "SIP-Specific Event Notifications".
 * https://tools.ietf.org/html/rfc6665
 *
 * @example
 * ```ts
 * // Create a new subscriber.
 * const targetURI = new URI("sip", "alice", "example.com");
 * const eventType = "example-name"; // https://www.iana.org/assignments/sip-events/sip-events.xhtml
 * const subscriber = new Subscriber(userAgent, targetURI, eventType);
 *
 * // Add delegate to handle event notifications.
 * subscriber.delegate = {
 *   onNotify: (notification: Notification) => {
 *     // handle notification here
 *   }
 * };
 *
 * // Monitor subscription state changes.
 * subscriber.stateChange.on((newState: SubscriptionState) => {
 *   if (newState === SubscriptionState.Terminated) {
 *     // handle state change here
 *   }
 * });
 *
 * // Attempt to establish the subscription
 * subscriber.subscribe();
 *
 * // Sometime later when done with subscription
 * subscriber.unsubscribe();
 * ```
 *
 * @public
 */
export class Subscriber extends Subscription {

  // TODO: Cleanup these internals
  private id: string;
  private body: BodyAndContentType | undefined = undefined;
  private context: SubscribeClientContext;
  private event: string;
  private expires: number;
  private extraHeaders: Array<string>;
  private logger: Logger;
  private request: OutgoingRequestMessage;
  private retryAfterTimer: any | undefined;
  private targetURI: URI;

  /**
   * Constructor.
   * @param userAgent - User agent. See {@link UserAgent} for details.
   * @param targetURI - The request URI identifying the subscribed event.
   * @param eventType - The event type identifying the subscribed event.
   * @param options - Options bucket. See {@link SubscriberOptions} for details.
   */
  constructor(userAgent: UserAgent, targetURI: URI, eventType: string, options: SubscriberOptions = {}) {
    super(userAgent, options);

    this.logger = userAgent.getLogger("sip.subscription");
    if (options.body) {
      this.body = {
        body: options.body,
        contentType: options.contentType ? options.contentType : "application/sdp"
      };
    }

    this.userAgent = userAgent;
    this.targetURI = targetURI;

    // Subscription event
    this.event = eventType;

    // Subscription expires
    if (options.expires === undefined) {
      this.expires = 3600;
    } else if (typeof options.expires !== "number") { // pre-typescript type guard
      userAgent.logger.warn(`Option "expires" must be a number. Using default of 3600.`);
      this.expires = 3600;
    } else {
      this.expires = options.expires;
    }

    // Subscription extra headers
    this.extraHeaders = (options.extraHeaders || []).slice();

    // Subscription context.
    this.context = this.initContext();

    this.request = this.context.message;

    // Add to UA's collection
    this.id = this.request.callId + this.request.from.parameters.tag + this.event;
    this.userAgent.subscriptions[this.id] = this;
  }

  /**
   * Destructor.
   * @internal
   */
  public dispose(): void {
    if (this.disposed) {
      return;
    }
    super.dispose();

    if (this.retryAfterTimer) {
      clearTimeout(this.retryAfterTimer);
      this.retryAfterTimer = undefined;
    }
    this.context.dispose();

    // Remove from userAgent's collection
    delete this.userAgent.subscriptions[this.id];
  }

  /**
   * Subscribe to event notifications.
   *
   * @remarks
   * Send an initial SUBSCRIBE request if no subscription as been established.
   * Sends a re-SUBSCRIBE request if the subscription is "active".
   */
  public subscribe(options: SubscriberSubscribeOptions = {}): Promise<void> {
    switch (this.context.state) {
      case SubscriptionDialogState.Initial:
        // we can end up here when retrying so only state transition if in SubscriptionState.Initial state
        if (this.state === SubscriptionState.Initial) {
          this.stateTransition(SubscriptionState.NotifyWait);
        }
        this.context.subscribe().then((result) => {
          if (result.success) {
            if (result.success.subscription) {
              this.dialog = result.success.subscription;
              this.dialog.delegate = {
                onNotify: (request) => this.onNotify(request),
                onRefresh: (request) => this.onRefresh(request),
                onTerminated: () => {
                  this.dispose();
                  this.onTerminated();
                }
              };
            }
            this.onNotify(result.success.request);
          } else if (result.failure) {
            this.onFailed(result.failure.response);
          }
        });
        break;
      case SubscriptionDialogState.NotifyWait:
        break;
      case SubscriptionDialogState.Pending:
        break;
      case SubscriptionDialogState.Active:
        if (this.dialog) {
          const request = this.dialog.refresh();
          request.delegate = {
            onAccept: ((response) => this.onAccepted(response)),
            onRedirect: ((response) => this.onFailed(response)),
            onReject: ((response) => this.onFailed(response)),
          };
        }
        break;
      case SubscriptionDialogState.Terminated:
        break;
      default:
        break;
    }
    return Promise.resolve();
  }

  /**
   * Unsubscribe.
   * @internal
   */
  public unsubscribe(options: SubscriptionUnsubscribeOptions = {}): Promise<void> {
    if (this.disposed) {
      return Promise.resolve();
    }
    switch (this.context.state) {
      case SubscriptionDialogState.Initial:
        break;
      case SubscriptionDialogState.NotifyWait:
        break;
      case SubscriptionDialogState.Pending:
        if (this.dialog) {
          this.dialog.unsubscribe();
          // responses intentionally ignored
        }
        break;
      case SubscriptionDialogState.Active:
        if (this.dialog) {
          this.dialog.unsubscribe();
          // responses intentionally ignored
        }
        break;
      case SubscriptionDialogState.Terminated:
        break;
      default:
        break;
    }
    this.dispose();
    this.onTerminated();
    return Promise.resolve();
  }

  /**
   * Alias for `unsubscribe`.
   * @deprecated Use `unsubscribe` instead.
   * @internal
   */
  public close(): Promise<void> {
    return this.unsubscribe();
  }

  /**
   * Sends a re-SUBSCRIBE request if the subscription is "active".
   * @deprecated Use `subscribe` instead.
   * @internal
   */
  public refresh(): Promise<void> {
    if (this.context.state === SubscriptionDialogState.Active) {
      return this.subscribe();
    }
    return Promise.resolve();
  }

  /**
   * Registration of event listeners.
   *
   * @remarks
   * The following events are emitted...
   *  - "accepted" A 200-class final response to a SUBSCRIBE request was received.
   *  - "failed" A non-200-class final response to a SUBSCRIBE request was received.
   *  - "rejected" Emitted immediately after a "failed" event (yes, it's redundant).
   *  - "notify" A NOTIFY request was received.
   *  - SubscriptionState.Terminated The subscription is moving to or has moved to a terminated state.
   *
   * More than one SUBSCRIBE request may be sent, so "accepted", "failed" and "rejected"
   * may be emitted multiple times. However these event will NOT be emitted for SUBSCRIBE
   * requests with expires of zero (unsubscribe requests).
   *
   * Note that a "terminated" event does NOT indicate the subscription is in the "terminated"
   * state as described in RFC 6665. Instead, a SubscriptionState.Terminated event indicates that this class
   * is no longer usable and/or is in the process of becoming no longer usable.
   *
   * The order the events are emitted in is not deterministic. Some examples...
   *  - "accepted" may occur multiple times
   *  - "accepted" may follow "notify" and "notify" may follow "accepted"
   *  - SubscriptionState.Terminated may follow "accepted" and "accepted" may follow SubscriptionState.Terminated
   *  - SubscriptionState.Terminated may follow "notify" and "notify" may follow SubscriptionState.Terminated
   *
   * Hint: Experience suggests one workable approach to utilizing these events
   * is to make use of "notify" and SubscriptionState.Terminated only. That is, call `subscribe()`
   * and if a "notify" occurs then you have a subscription. If a SubscriptionState.Terminated
   * event occurs then either a new subscription failed to be established or an
   * established subscription has terminated or is in the process of terminating.
   * Note that "notify" events may follow a SubscriptionState.Terminated event, but experience
   * suggests it is reasonable to discontinue usage of this class after receipt
   * of a SubscriptionState.Terminated event. The other events are informational, but as they do not
   * arrive in a deterministic manner it is difficult to make use of them otherwise.
   *
   * @param name - Event name.
   * @param callback - Callback.
   * @internal
   */
  public on(
    name: "accepted" | "failed" | "rejected",
    callback: (message: IncomingResponseMessage, cause: string) => void
  ): this;
  /** @internal */
  public on(name: "notify", callback: (notification: { request: IncomingRequestMessage }) => void): this;
  /** @internal */
  public on(name: "terminated", callback: () => void): this;
  /** @internal */
  public on(name: string, callback: (...args: any[]) => void): this {
    return super.on(name, callback);
  }

  /** @internal */
  public emit(
    event: "accepted" | "failed" | "rejected",
    message: IncomingResponseMessage, cause: string
  ): boolean;
  /** @internal */
  public emit(event: "notify", notification: { request: IncomingRequestMessage }): boolean;
  /** @internal */
  public emit(event: "terminated"): boolean;
  /** @internal */
  public emit(event: string | symbol, ...args: any[]): boolean {
    return super.emit(event, ...args);
  }

  /** @internal */
  protected onAccepted(response: IncomingResponse): void {
    const statusCode: number = response.message.statusCode ? response.message.statusCode : 0;
    const cause: string = Utils.getReasonPhrase(statusCode);
    this.emit("accepted", response.message, cause);
  }

  /** @internal */
  protected onFailed(response?: IncomingResponse): void {
    this.close();
    if (response) {
      const statusCode: number = response.message.statusCode ? response.message.statusCode : 0;
      const cause: string = Utils.getReasonPhrase(statusCode);
      this.emit("failed", response.message, cause);
      this.emit("rejected", response.message, cause);
    }
  }

  /** @internal */
  protected onNotify(request: IncomingNotifyRequest): void {
    // DEPRECATED BEGIN
    // request.accept(); // Send 200 response.
    this.emit("notify", { request: request.message });
    // DEPRECATED END

    // If we've set state to done, no further processing should take place
    // and we are only interested in cleaning up after the appropriate NOTIFY.
    if (this.disposed) {
      request.accept();
      return;
    }

    // State transition if needed.
    if (this.state !== SubscriptionState.Subscribed) {
      this.stateTransition(SubscriptionState.Subscribed);
    }

    // Delegate notification.
    if (this.delegate && this.delegate.onNotify) {
      const notification = new Notification(request);
      this.delegate.onNotify(notification);
    } else {
      request.accept();
    }

    //  If the "Subscription-State" value is SubscriptionState.Terminated, the subscriber
    //  MUST consider the subscription terminated.  The "expires" parameter
    //  has no semantics for SubscriptionState.Terminated -- notifiers SHOULD NOT include an
    //  "expires" parameter on a "Subscription-State" header field with a
    //  value of SubscriptionState.Terminated, and subscribers MUST ignore any such
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

  /** @internal */
  protected onRefresh(request: OutgoingSubscribeRequest): void {
    request.delegate = {
      onAccept: (response) => this.onAccepted(response)
    };
  }

  /** @internal */
  protected onTerminated(): void {
    this.emit("terminated");
  }

  private initContext(): SubscribeClientContext {
    const options = {
      extraHeaders: this.extraHeaders,
      body: this.body ? Utils.fromBodyObj(this.body) : undefined
    };
    this.context = new SubscribeClientContext(
      this.userAgent.userAgentCore,
      this.targetURI,
      this.event,
      this.expires,
      options
    );
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
  private subscription: SubscriptionDialog | undefined;

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
  get state(): SubscriptionDialogState {
    if (this.subscription) {
      return this.subscription.subscriptionState;
    } else if (this.subscribed) {
      return SubscriptionDialogState.NotifyWait;
    } else {
      return SubscriptionDialogState.Initial;
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
