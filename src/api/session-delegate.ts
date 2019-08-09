import { Info } from "./info";
import { Notification } from "./notification";
import { Referral } from "./referral";

/**
 * Delegate for {@link Session}.
 * @public
 */
export interface SessionDelegate {
  /**
   * Called upon receiving an incoming in dialog INFO request.
   * @param info - The info.
   */
  onInfo?(info: Info): void;

  /**
   * Called upon receiving an incoming in dialog NOTIFY request.
   *
   * @remarks
   * If a refer is in progress notifications are delivered to the referrers delegate.
   *
   * @param notification - The notification.
   */
  onNotify?(notification: Notification): void;

  /**
   * Called upon receiving an incoming in dialog REFER request.
   * @param referral - The referral.
   */
  onRefer?(referral: Referral): void;

  // TODO: Interface for handling re-invite needs to be sorted out...
  // - current callbacks are not consistent with the others as they are firing after responding
  //  - they are firing after sending response
  //  - they don't provide access to the request
  //  - they don't provide access to the response
  // - an Invitation is not a re-Invitation, so can't provide that to a callback
  // - not clear how best to handle error responding to a reinvite

  /**
   * Hook which is called upon receiving an incoming in dialog INVITE request.
   * Used for generating and testing failure cases.
   * @internal
   */
  onReinviteTest?(): "acceptWithoutDescription" | "reject488";

  /**
   * Called upon successfully accepting a received in dialog INVITE request.
   * @internal
   */
  onReinviteSuccess?(): void;

  /**
   * Called upon failing to accept a received in dialog INVITE request.
   * @param error - The error.
   * @internal
   */
  onReinviteFailure?(error: Error): void;
}
