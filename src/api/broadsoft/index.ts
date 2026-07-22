/**
 * BroadSoft Access-Side Extensions for SIP.js
 *
 * This module provides support for two common BroadSoft Access-Side extensions:
 *
 * 1. Call-Info: ...; answer-after=1 - Auto-Answer
 *    Automatically answers incoming calls when the answer-after parameter is present
 *    in the Call-Info header.
 *
 * 2. NOTIFY (Event: talk) - Remote Control Event
 *    Automatically answers ringing calls or resumes calls from hold when receiving
 *    NOTIFY with Event: talk header. Performs SIP signaling per BroadSoft specification.
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
 *   onTalkEvent: (action) => console.log(`Talk event: ${action}`)
 * };
 *
 * // Handle incoming invitation
 * userAgent.delegate = {
 *   onInvite: (invitation) => {
 *     // Check for auto-answer
 *     if (BroadSoft.shouldAutoAnswer(invitation)) {
 *       BroadSoft.handleAutoAnswer(invitation, autoAnswerOptions);
 *     }
 *
 *     // Set up remote control handling
 *     invitation.delegate = {
 *       onNotifyRequest: (request) => {
 *         BroadSoft.handleRemoteControlNotify(invitation, request, remoteControlOptions);
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
export { handleAutoAnswer, shouldAutoAnswer } from "./auto-answer.js";

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
  holdModifier
} from "./remote-control.js";
