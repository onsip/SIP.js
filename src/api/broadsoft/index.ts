/**
 * BroadSoft Access-Side Extensions for SIP.js
 *
 * This module provides support for common BroadSoft Access-Side extensions:
 *
 * 1. Call-Info: ...; answer-after=N - Auto-Answer
 *    Automatically answers incoming calls when the answer-after parameter is present
 *    in the Call-Info header.
 *
 * 2. NOTIFY (Event: talk) - Remote Control Event
 *    Automatically answers ringing calls or resumes calls from hold when receiving
 *    NOTIFY with Event: talk header. Performs SIP signaling per BroadSoft specification.
 *
 * 3. NOTIFY (Event: hold) - Remote Control Event
 *    Automatically places an established call on hold when receiving NOTIFY with
 *    Event: hold header.
 *
 * @example
 * ```typescript
 * import { BroadSoft } from "sip.js/lib/api/broadsoft";
 *
 * // Configure auto-answer
 * const autoAnswerOptions: BroadSoft.AutoAnswerOptions = {
 *   enabled: true,
 *   onBeforeAutoAnswer: (delay) => console.log(`Auto-answering in ${delay}s`),
 *   onAfterAutoAnswer: () => console.log("Auto-answered")
 * };
 *
 * // Configure remote control
 * const remoteControlOptions: BroadSoft.RemoteControlOptions = {
 *   enabled: true,
 *   onTalkEvent: (action) => console.log(`Talk event: ${action}`),
 *   onHoldEvent: (action) => console.log(`Hold event: ${action}`)
 * };
 *
 * // Handle incoming invitation
 * userAgent.delegate = {
 *   onInvite: (invitation) => {
 *     // Check for auto-answer (returns a handle that can cancel the schedule)
 *     const autoAnswer = BroadSoft.handleAutoAnswer(invitation, autoAnswerOptions);
 *
 *     // Set up remote control handling
 *     invitation.delegate = {
 *       onNotify: (notification) => {
 *         if (BroadSoft.isBroadSoftNotification(notification)) {
 *           BroadSoft.handleRemoteControlNotification(invitation, notification, remoteControlOptions);
 *         }
 *         // The application owns the NOTIFY response
 *         notification.accept();
 *       }
 *     };
 *   }
 * };
 * ```
 */

// Export all types
export * from "./types.js";

// Export Call-Info parsing utilities
export { parseCallInfoHeader, extractCallInfoHeaders, getAutoAnswerDelay, hasAutoAnswer } from "./call-info-parser.js";

// Export auto-answer utilities
export { AutoAnswerHandle, handleAutoAnswer, shouldAutoAnswer } from "./auto-answer.js";

// Export remote control utilities
export {
  parseEventHeader,
  parseNotifyBody,
  applyTalkAction,
  handleRemoteControlNotify,
  isBroadSoftNotify,
  parseEventHeaderFromNotification,
  parseNotifyBodyFromNotification,
  handleRemoteControlNotification,
  isBroadSoftNotification,
  applyHoldAction,
  holdModifier,
  resumeModifier
} from "./remote-control.js";
