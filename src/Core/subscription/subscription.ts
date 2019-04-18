import {
  OutgoingSubscribeRequest,
  OutgoingSubscribeRequestDelegate,
  RequestOptions
} from "../messages";
import { SubscriptionDelegate } from "./subscription-delegate";

/**
 * https://tools.ietf.org/html/rfc6665
 */
export interface Subscription {
  /** Subscription delegate. */
  delegate: SubscriptionDelegate | undefined;
  /** The subscription id. */
  readonly id: string;
  /** Subscription state. */
  readonly subscriptionState: SubscriptionState;

  /**
   * Send re-SUBSCRIBE request.
   * Refreshing a subscription and unsubscribing.
   * https://tools.ietf.org/html/rfc6665#section-4.1.2.2
   * @param delegate Request delegate.
   * @param options Options bucket
   * @returns A promise which resolves when a 2xx response to the SUBSCRIBE is received.
   * @throws {PendingRequestError} If there is a re-subscribe "pending".
   * @throws {RequestFailedReason} If a non-2xx final response to the SUBSCRIBE is received.
   */
  subscribe(delegate?: OutgoingSubscribeRequestDelegate, options?: RequestOptions): OutgoingSubscribeRequest;
}

/**
 * Subscription state.
 * https://tools.ietf.org/html/rfc6665#section-4.1.2
 */
export enum SubscriptionState {
  Initial = "Initial",
  notifyWait = "notifyWait",
  AckWait = "pending",
  active = "active",
  Terminated = "Terminated"
}
