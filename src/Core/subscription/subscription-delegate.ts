import { IncomingNotifyRequest } from "../messages";

export interface SubscriptionDelegate {
  /**
   * Receive NOTIFY request.
   * https://tools.ietf.org/html/rfc6665#section-4.1.3
   * @param request Incoming NOTIFY request.
   */
  onNotify?(request: IncomingNotifyRequest): void;
}
