import { ClientContext } from "./ClientContext";
import { C } from "./Constants";
import { TypeStrings } from "./Enums";
import { IncomingRequest, IncomingResponse } from "./SIPMessage";
import { Timers } from "./Timers";
import { UA } from "./UA";
import { URI } from "./URI";
import { Utils } from "./Utils";

import { Subscription as SubscriptionCore } from "./Core/subscription";

/**
 * SIP Subscriber (SIP-Specific Event Notifications RFC6665)
 * @class Class creating a SIP Subscription.
 */
export class Subscription extends ClientContext {
  public type: TypeStrings;
  protected event: string;
  protected requestedExpires: number;
  protected expires: number;
  protected id: string | undefined;
  protected state: string;
  protected contact: string;
  protected extraHeaders: Array<string>;
  protected timers: any;
  protected errorCodes: Array<number>;

  private subscription: SubscriptionCore | undefined;

  constructor(ua: UA, target: string | URI, event: string, options: any = {}) {
    if (!event) {
      throw new TypeError("Event necessary to create a subscription.");
    }

    options.extraHeaders = (options.extraHeaders || []).slice();

    let expires: number;
    if (typeof options.expires !== "number") {
      ua.logger.warn("expires must be a number. Using default of 3600.");
      expires = 3600;
    } else {
      expires = options.expires;
    }

    options.extraHeaders.push("Event: " + event);
    options.extraHeaders.push("Expires: " + expires);
    options.extraHeaders.push("Contact: " + ua.contact.toString());
    // was UA.C.ALLOWED_METHODS, removed due to circular dependency
    options.extraHeaders.push("Allow: " + [
      "ACK",
      "CANCEL",
      "INVITE",
      "MESSAGE",
      "BYE",
      "OPTIONS",
      "INFO",
      "NOTIFY",
      "REFER"
    ].toString());

    super(ua, C.SUBSCRIBE, target, options);
    this.type = TypeStrings.Subscription;

    // TODO: check for valid events here probably make a list in SIP.C; or leave it up to app to check?
    // The check may need to/should probably occur on the other side,
    this.event = event;
    this.requestedExpires = expires;
    this.state = "init";
    this.contact = ua.contact.toString();
    this.extraHeaders = options.extraHeaders;
    this.logger = ua.getLogger("sip.subscription");
    this.expires = expires;

    this.timers = {N: undefined, subDuration: undefined};
    this.errorCodes  = [404, 405, 410, 416, 480, 481, 482, 483, 484, 485, 489, 501, 604];
  }

  public subscribe(): Subscription {
     // these states point to an existing subscription, no subscribe is necessary
    if (this.state === "active") {
      this.refresh();
      return this;
    } else if (this.state === "notify_wait") {
      return this;
    }

    clearTimeout(this.timers.subDuration);
    clearTimeout(this.timers.N);
    this.timers.N = setTimeout(() => this.timer_fire(), Timers.TIMER_N);

    if (this.request && this.request.from) {
      this.ua.earlySubscriptions[this.request.callId + this.request.from.parameters.tag + this.event] = this;
    }

    this.send();

    this.state = "notify_wait";

    return this;
  }

  public refresh(): void {
    if (this.state === "terminated" || this.state === "pending" || this.state === "notify_wait" || !this.subscription) {
      return;
    }

    this.sendSubscribeRequest({
      extraHeaders: this.extraHeaders,
      body: this.body
    });
  }

  public receiveResponse(response: IncomingResponse): void {
    const statusCode: number = response.statusCode ? response.statusCode : 0;
    const cause: string = Utils.getReasonPhrase(statusCode);

    if ((this.state === "notify_wait" && statusCode >= 300) ||
        (this.state !== "notify_wait" && this.errorCodes.indexOf(statusCode) !== -1)) {
      this.failed(response, undefined);
    } else if (/^2[0-9]{2}$/.test(statusCode.toString())) {
      this.emit("accepted", response, cause);
      // As we don't support RFC 5839 or other extensions where the NOTIFY is optional, timer N will not be cleared
      // clearTimeout(this.timers.N);

      const expires: string | undefined = response.getHeader("Expires");

      if (expires && Number(expires) <= this.requestedExpires) {
        // Preserve new expires value for subsequent requests
        this.expires = Number(expires);
        this.timers.subDuration = setTimeout(() => this.refresh(), Number(expires) * 900);
      } else {
        if (!expires) {
          this.logger.warn("Expires header missing in a 200-class response to SUBSCRIBE");
          this.failed(response, "Expires Header Missing");
        } else {
          this.logger.warn("Expires header in a 200-class response to" +
            " SUBSCRIBE with a higher value than the one in the request");
          this.failed(response, "Invalid Expires Header");
        }
      }
    } else if (statusCode > 300) {
      this.emit("failed", response, cause);
      this.emit("rejected", response, cause);
    }
  }

  public unsubscribe(): void {
    const extraHeaders: Array<string> = [];

    this.state = "terminated";

    extraHeaders.push("Event: " + this.event);
    extraHeaders.push("Expires: 0");

    extraHeaders.push("Contact: " + this.contact);
    // was UA.C.ALLOWED_METHODS, removed due to circular dependency
    extraHeaders.push("Allow: " + [
      "ACK",
      "CANCEL",
      "INVITE",
      "MESSAGE",
      "BYE",
      "OPTIONS",
      "INFO",
      "NOTIFY",
      "REFER"
    ].toString());

    // makes sure expires isn't set, and other typical resubscribe behavior
    this.receiveResponse = () => { /* intentionally blank */ };

    if (this.subscription) {
      this.sendSubscribeRequest({
        extraHeaders,
        body: this.body
      });
    }

    clearTimeout(this.timers.subDuration);
    clearTimeout(this.timers.N);
    this.timers.N = setTimeout(() => this.timer_fire(), Timers.TIMER_N);
    this.emit("terminated");
  }

  public receiveRequest(request: IncomingRequest): void {
    let subState: any;

    const setExpiresTimeout: (() => void) = () => {
      if (subState.expires) {
        clearTimeout(this.timers.subDuration);
        subState.expires = Math.min(this.expires,
                                     Math.max(subState.expires, 0));
        this.timers.subDuration = setTimeout(() => this.refresh(),
                                             subState.expires * 900);
      }
    };

    if (!this.matchEvent(request)) { // checks event and subscription_state headers
      request.reply(489);
      return;
    }

    subState = request.parseHeader("Subscription-State");

    request.reply(200);

    clearTimeout(this.timers.N);

    this.emit("notify", { request });

    // if we've set state to terminated, no further processing should take place
    // and we are only interested in cleaning up after the appropriate NOTIFY
    if (this.state === "terminated") {
      if (subState.state === "terminated") {
        clearTimeout(this.timers.N);
        clearTimeout(this.timers.subDuration);

        delete this.ua.subscriptions[this.id || ""];
      }
      return;
    }

    switch (subState.state) {
      case "active":
        this.state = "active";
        setExpiresTimeout();
        break;
      case "pending":
        if (this.state === "notify_wait") {
          setExpiresTimeout();
        }
        this.state = "pending";
        break;
      case "terminated":
        clearTimeout(this.timers.subDuration);
        if (subState.reason) {
          this.logger.log("terminating subscription with reason " + subState.reason);
          switch (subState.reason) {
            case "deactivated":
            case "timeout":
              this.subscribe();
              return;
            case "probation":
            case "giveup":
              if (subState.params && subState.params["retry-after"]) {
                this.timers.subDuration = setTimeout(() => this.subscribe(), subState.params["retry-after"]);
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
    }
  }

  public close(): void {
    if (this.state === "notify_wait") {
      this.state = "terminated";
      clearTimeout(this.timers.N);
      clearTimeout(this.timers.subDuration);
      this.receiveResponse = () => { /* intentionally blank */ };

      if (this.request && this.request.from) {
        delete this.ua.earlySubscriptions[this.request.callId + this.request.from.parameters.tag + this.event];
      }

      this.emit("terminated");
    } else if (this.state !== "terminated") {
      this.unsubscribe();
    }
  }

  public onDialogError(response: IncomingResponse): void {
    this.failed(response, C.causes.DIALOG_ERROR);
  }

  public on(name: "accepted", callback: (response: any, cause: C.causes) => void): this;
  public on(name: "notify", callback: (notification: { request: IncomingRequest }) => void): this;
  public on(
    name: "failed" | "rejected" | "terminated",
    callback: (messageOrResponse?: any, cause?: C.causes) => void
  ): this;
  public on(name: string, callback: (...args: any[]) => void): this  { return super.on(name, callback); }

  public send(): this {
    if (!this.ua.userAgentCore) {
      throw new Error("User agent core undefined.");
    }
    this.ua.userAgentCore.subscribe(this.request, {
      onAccept: (subscribeResponse): void => {
        this.subscription = subscribeResponse.subscription;
        this.id = this.subscription.id;
        if (this.request && this.request.from) {
          delete this.ua.earlySubscriptions[this.request.callId + this.request.from.parameters.tag  + this.event];
        }
        this.ua.subscriptions[this.id] = this;
        return this.receiveResponse(subscribeResponse.message);
      },
      onProgress: (subscribeResponse): void => this.receiveResponse(subscribeResponse.message),
      onRedirect: (subscribeResponse): void => this.receiveResponse(subscribeResponse.message),
      onReject: (subscribeResponse): void => this.receiveResponse(subscribeResponse.message),
      onTrying: (subscribeResponse): void => this.receiveResponse(subscribeResponse.message)
    });
    return this;
  }

  protected sendSubscribeRequest(options: any = {}): void {
    if (!this.subscription) {
      throw new Error("Subscription undefined.");
    }
    this.subscription.subscribe(options);
  }

  protected timer_fire(): void {
    if (this.state === "terminated") {
      clearTimeout(this.timers.N);
      clearTimeout(this.timers.subDuration);

      delete this.ua.subscriptions[this.id || ""];
    } else if (this.state === "notify_wait" || this.state === "pending") {
      this.close();
    } else {
      this.refresh();
    }
  }

  protected failed(response: IncomingResponse, cause?: string): Subscription {
    this.close();
    this.emit("failed", response, cause);
    this.emit("rejected", response, cause);
    return this;
  }

  protected matchEvent(request: IncomingRequest): boolean {
    // Check mandatory header Event
    if (!request.hasHeader("Event")) {
      this.logger.warn("missing Event header");
      return false;
    }
    // Check mandatory header Subscription-State
    if (!request.hasHeader("Subscription-State")) {
      this.logger.warn("missing Subscription-State header");
      return false;
    }

    // Check whether the event in NOTIFY matches the event in SUBSCRIBE
    const event: string = request.parseHeader("event").event;

    if (this.event !== event) {
      this.logger.warn("event match failed");
      request.reply(481, "Event Match Failed");
      return false;
    } else {
      return true;
    }
  }
}
