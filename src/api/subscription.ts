import { EventEmitter } from "events";

import {
  Logger,
  Subscription as SubscriptionDialog
} from "../core";
import { Emitter, makeEmitter } from "./emitter";
import { SubscriptionDelegate } from "./subscription-delegate";
import { SubscriptionOptions } from "./subscription-options";
import { SubscriptionState } from "./subscription-state";
import { SubscriptionSubscribeOptions } from "./subscription-subscribe-options";
import { SubscriptionUnsubscribeOptions } from "./subscription-unsubscribe-options";
import { UserAgent } from "./user-agent";

/**
 * A subscription provides asynchronous {@link Notification} of events.
 *
 * @remarks
 * See {@link Subscriber} for details on establishing a subscription.
 *
 * @public
 */
export abstract class Subscription {

  /**
   * Property reserved for use by instance owner.
   * @defaultValue `undefined`
   */
  public data: any | undefined;

  /**
   * Subscription delegate. See {@link SubscriptionDelegate} for details.
   * @defaultValue `undefined`
   */
  public delegate: SubscriptionDelegate | undefined;

  /**
   * If the subscription state is SubscriptionState.Subscribed, the associated subscription dialog. Otherwise undefined.
   * @internal
   */
  public dialog: SubscriptionDialog | undefined;

  /** @internal */
  protected userAgent: UserAgent;

  private _disposed = false;
  private _logger: Logger;
  private _state: SubscriptionState = SubscriptionState.Initial;
  private _stateEventEmitter = new EventEmitter();

  /**
   * Constructor.
   * @param userAgent - User agent. See {@link UserAgent} for details.
   * @internal
   */
  protected constructor(userAgent: UserAgent, options: SubscriptionOptions = {}) {
    this._logger = userAgent.getLogger("sip.subscription");
    this.userAgent = userAgent;
    this.delegate = options.delegate;
  }

  /**
   * Subscription state. See {@link SubscriptionState} for details.
   */
  get state(): SubscriptionState {
    return this._state;
  }

  /**
   * Emits when the subscription `state` property changes.
   */
  get stateChange(): Emitter<SubscriptionState> {
    return makeEmitter(this._stateEventEmitter);
  }

  /**
   * Sends a re-SUBSCRIBE request if the subscription is "active".
   */
  public abstract subscribe(options?: SubscriptionSubscribeOptions): Promise<void>;

  /**
   * Unsubscribe from event notifications.
   *
   * @remarks
   * If the subscription state is SubscriptionState.Subscribed, sends an in dialog SUBSCRIBE request
   * with expires time of zero (an un-subscribe) and terminates the subscription.
   * Otherwise a noop.
   */
  public abstract unsubscribe(options?: SubscriptionUnsubscribeOptions): Promise<void>;

  /**
   * True if disposed.
   * @internal
   */
  get disposed(): boolean {
    return this._disposed;
  }

  /**
   * Destructor.
   * @internal
   */
  public _dispose(): void {
    if (this._disposed) {
      return;
    }
    this._disposed = true;
    this.stateTransition(SubscriptionState.Terminated);
    this._stateEventEmitter.removeAllListeners();
  }

  /** @internal */
  protected stateTransition(newState: SubscriptionState): void {
    const invalidTransition = () => {
      throw new Error(`Invalid state transition from ${this._state} to ${newState}`);
    };

    // Validate transition
    switch (this._state) {
      case SubscriptionState.Initial:
        if (newState !== SubscriptionState.NotifyWait && newState !== SubscriptionState.Terminated) {
          invalidTransition();
        }
        break;
      case SubscriptionState.NotifyWait:
        if (newState !== SubscriptionState.Subscribed && newState !== SubscriptionState.Terminated) {
          invalidTransition();
        }
        break;
      case SubscriptionState.Subscribed:
        if (newState !== SubscriptionState.Terminated) {
          invalidTransition();
        }
        break;
      case SubscriptionState.Terminated:
        invalidTransition();
        break;
      default:
        throw new Error("Unrecognized state.");
    }

    // Guard against duplicate transition
    if (this._state === newState) {
      return;
    }

    // Transition
    this._state = newState;
    this._logger.log(`Subscription ${this.dialog ? this.dialog.id : undefined} transitioned to ${this._state}`);
    this._stateEventEmitter.emit("event", this._state);
  }
}
