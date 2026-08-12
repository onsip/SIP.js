/**
 * BroadSoft Auto-Answer Implementation
 *
 * Handles automatic answering of calls based on Call-Info header with answer-after parameter.
 */

import { Invitation } from "../invitation.js";
import { InvitationAcceptOptions } from "../invitation-accept-options.js";
import { SessionState } from "../session-state.js";
import { AutoAnswerOptions } from "./types.js";
import { getAutoAnswerDelay, hasAutoAnswer } from "./call-info-parser.js";

/**
 * Maximum timer delay in milliseconds (2^31 - 1).
 * Larger values overflow the signed 32-bit integer used by timers and would
 * cause the timeout to fire immediately, auto-answering a call that requested
 * an (absurdly) long delay.
 */
const MAX_TIMER_DELAY_MS = 2147483647;

/**
 * Handle to a scheduled auto-answer.
 */
export interface AutoAnswerHandle {
  /**
   * Cancel the scheduled auto-answer.
   * A no-op once the answer has been initiated or the schedule was already canceled.
   */
  cancel: () => void;
}

/**
 * Handle auto-answer for an incoming invitation
 *
 * This function checks if the invitation has an answer-after parameter in the Call-Info header.
 * If present, it will automatically accept the invitation after the specified delay.
 *
 * The scheduled answer is automatically canceled if the invitation leaves the Initial state
 * before the timer fires (manual answer, CANCEL, rejection, termination). It may also be
 * canceled explicitly via the returned handle.
 *
 * Calling this function more than once for the same invitation schedules multiple timers;
 * the extra timers are harmless (the invitation transitions out of Initial when the first
 * one fires, canceling the rest) but callers should avoid duplicate scheduling.
 *
 * @param invitation - The incoming invitation to potentially auto-answer
 * @param options - Auto-answer configuration options
 * @param acceptOptions - Options to pass to invitation.accept()
 * @returns A cancellation handle if auto-answer was scheduled, false otherwise
 */
export function handleAutoAnswer(
  invitation: Invitation,
  options: AutoAnswerOptions,
  acceptOptions?: InvitationAcceptOptions
): AutoAnswerHandle | false {
  if (!options.enabled) {
    return false;
  }

  // Check for auto-answer in Call-Info header
  const autoAnswerDelay = getAutoAnswerDelay(invitation.request);

  if (autoAnswerDelay === undefined) {
    return false;
  }

  // Use override delay if specified
  const delaySeconds = options.delayOverride !== undefined ? options.delayOverride : autoAnswerDelay;
  if (!Number.isFinite(delaySeconds) || delaySeconds < 0) {
    options.logger?.warn(`[BroadSoft] Ignoring invalid auto-answer delay ${delaySeconds}`);
    return false;
  }
  // Cap the delay so huge values do not overflow the timer and fire immediately.
  const delayMs = Math.min(delaySeconds * 1000, MAX_TIMER_DELAY_MS);

  // Invoke pre-answer callback
  if (options.onBeforeAutoAnswer) {
    try {
      options.onBeforeAutoAnswer(delaySeconds);
    } catch (e) {
      options.logger?.warn(`[BroadSoft] onBeforeAutoAnswer callback threw: ${e}`);
    }
  }

  let timer: ReturnType<typeof setTimeout> | undefined;
  let stateListener: ((newState: SessionState) => void) | undefined;

  const cancel = (): void => {
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
    if (stateListener !== undefined) {
      invitation.stateChange.removeListener(stateListener);
      stateListener = undefined;
    }
  };

  // Cancel automatically once the invitation leaves Initial
  // (manual answer, CANCEL, rejection, termination).
  stateListener = (newState: SessionState): void => {
    if (newState !== SessionState.Initial) {
      cancel();
    }
  };
  invitation.stateChange.addListener(stateListener);

  // Schedule auto-answer
  timer = setTimeout(() => {
    timer = undefined;
    cancel();
    // Accept requires the Initial state; anything else means the invitation was
    // answered, canceled or terminated in the meantime.
    if (invitation.state !== SessionState.Initial) {
      options.logger?.log(`[BroadSoft] Auto-answer skipped, invitation state is ${invitation.state}`);
      return;
    }
    invitation
      .accept(acceptOptions)
      .then(() => {
        // Invoke post-answer callback
        if (options.onAfterAutoAnswer) {
          try {
            options.onAfterAutoAnswer();
          } catch (e) {
            options.logger?.warn(`[BroadSoft] onAfterAutoAnswer callback threw: ${e}`);
          }
        }
      })
      .catch((error: Error) => {
        options.logger?.error(`[BroadSoft] Auto-answer accept failed: ${error}`);
      });
  }, delayMs);

  return { cancel };
}

/**
 * Check if an invitation should be auto-answered
 *
 * @param invitation - The incoming invitation to check
 * @returns True if the invitation has auto-answer enabled
 */
export function shouldAutoAnswer(invitation: Invitation): boolean {
  return hasAutoAnswer(invitation.request);
}
