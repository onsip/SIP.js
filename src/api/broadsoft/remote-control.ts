/**
 * BroadSoft Remote Control Implementation
 *
 * Handles NOTIFY events for remote control operations (Event: talk, Event: hold).
 */

import { IncomingNotifyRequest } from "../../core/messages/methods/notify.js";
import { Invitation } from "../invitation.js";
import { Notification } from "../notification.js";
import { Session } from "../session.js";
import { SessionState } from "../session-state.js";
import {
  BroadSoftEvent,
  BroadSoftNotifyBody,
  HoldAction,
  HoldNotifyBody,
  RemoteControlOptions,
  TalkAction,
  TalkNotifyBody
} from "./types.js";

/**
 * The minimal shape of a NOTIFY message required for BroadSoft parsing.
 * Both `IncomingNotifyRequest.message` and `Notification.request` conform.
 */
interface NotifyMessageLike {
  getHeader(name: string): string | undefined;
  body: string | undefined;
}

/**
 * Parse the Event header from a NOTIFY message.
 */
function parseEventFromMessage(message: NotifyMessageLike): BroadSoftEvent | undefined {
  try {
    const eventHeader = message.getHeader("event");
    if (!eventHeader) {
      return undefined;
    }

    // Event header format: "talk" (may have parameters)
    const eventType = eventHeader.split(";")[0].trim().toLowerCase();

    if (eventType === BroadSoftEvent.Talk || eventType === BroadSoftEvent.Hold) {
      return eventType as BroadSoftEvent;
    }
  } catch (e) {
    return undefined;
  }

  return undefined;
}

/**
 * Parse the body of a NOTIFY message for BroadSoft events.
 *
 * Expected body format:
 * - For talk events: "talk" or "mute", or empty (defaults to "talk")
 * - For hold events: "hold" or empty
 *
 * Note: FreeSWITCH's uuid_phone_event sends NOTIFY with empty body.
 * When body is empty, Event: talk → TalkAction.Talk and Event: hold → HoldAction.Hold.
 */
function parseBodyFromMessage(message: NotifyMessageLike, eventType: BroadSoftEvent): BroadSoftNotifyBody | undefined {
  try {
    const body = message.body;
    const action = body ? body.trim().toLowerCase() : "";

    if (eventType === BroadSoftEvent.Talk) {
      // Empty body for talk event means talk (FreeSWITCH uuid_phone_event behavior)
      if (action === "" || action === TalkAction.Talk || action === TalkAction.Mute) {
        return {
          event: BroadSoftEvent.Talk,
          action: action === "" ? TalkAction.Talk : (action as TalkAction)
        } as TalkNotifyBody;
      }
    }

    if (eventType === BroadSoftEvent.Hold) {
      // Empty body or "hold" body both mean hold (FreeSWITCH uuid_phone_event sends empty body)
      if (action === "" || action === HoldAction.Hold) {
        return { event: BroadSoftEvent.Hold, action: HoldAction.Hold } as HoldNotifyBody;
      }
    }
  } catch (e) {
    return undefined;
  }

  return undefined;
}

/**
 * Shared implementation for handling a BroadSoft remote control NOTIFY.
 *
 * Invokes the configured callbacks and then applies the appropriate SIP signaling
 * per BroadSoft specification. Signaling failures are reported via `options.logger`
 * and do not cause rejection (the NOTIFY response must not be blocked).
 */
async function handleRemoteControlMessage(
  session: Session,
  message: NotifyMessageLike,
  options: RemoteControlOptions
): Promise<boolean> {
  if (!options.enabled) {
    return false;
  }

  const eventType = parseEventFromMessage(message);
  if (!eventType) {
    return false;
  }

  const notifyBody = parseBodyFromMessage(message, eventType);
  if (!notifyBody) {
    return false;
  }

  // Handle talk events
  if (notifyBody.event === BroadSoftEvent.Talk) {
    const talkBody = notifyBody as TalkNotifyBody;

    // Invoke callback
    if (options.onTalkEvent) {
      try {
        options.onTalkEvent(talkBody.action);
      } catch (e) {
        options.logger?.warn(`[BroadSoft] onTalkEvent callback threw: ${e}`);
      }
    }

    // Apply SIP signaling per BroadSoft spec
    try {
      await applyTalkAction(session, talkBody.action);
    } catch (e) {
      options.logger?.error(`[BroadSoft] Error applying talk action: ${e}`);
    }

    return true;
  }

  // Handle hold events
  if (notifyBody.event === BroadSoftEvent.Hold) {
    const holdBody = notifyBody as HoldNotifyBody;
    if (options.onHoldEvent) {
      try {
        options.onHoldEvent(holdBody.action);
      } catch (e) {
        options.logger?.warn(`[BroadSoft] onHoldEvent callback threw: ${e}`);
      }
    }
    try {
      await applyHoldAction(session);
    } catch (e) {
      options.logger?.error(`[BroadSoft] Error applying hold action: ${e}`);
    }
    return true;
  }

  return false;
}

/**
 * Parse the Event header from a NOTIFY request
 *
 * @param request - Incoming NOTIFY request
 * @returns The event type, or undefined if not parseable
 */
export function parseEventHeader(request: IncomingNotifyRequest): BroadSoftEvent | undefined {
  return parseEventFromMessage(request.message);
}

/**
 * Parse the body of a NOTIFY request for BroadSoft events
 *
 * @param request - Incoming NOTIFY request
 * @param eventType - The type of event (from Event header)
 * @returns Parsed notify body, or undefined if not parseable
 */
export function parseNotifyBody(
  request: IncomingNotifyRequest,
  eventType: BroadSoftEvent
): BroadSoftNotifyBody | undefined {
  return parseBodyFromMessage(request.message, eventType);
}

/**
 * Apply a talk action to a session according to BroadSoft specification
 *
 * @remarks
 * Per BroadSoft spec, Event: talk means "answer" or "resume":
 * - If session is in Initial state (ringing): Accept the call (send 200 OK with SDP)
 * - If session is in Established state: Send re-INVITE with a=sendrecv to resume from hold
 * - Otherwise: No action taken
 *
 * TalkAction.Mute performs no SIP signaling and no media operation; it is only
 * surfaced to the application via the onTalkEvent callback.
 *
 * @param session - The session to apply the action to
 * @param action - The talk action (only TalkAction.Talk triggers SIP signaling)
 */
export async function applyTalkAction(session: Session, action: TalkAction): Promise<void> {
  // Only TalkAction.Talk triggers SIP signaling per BroadSoft spec
  if (action !== TalkAction.Talk) {
    return;
  }

  if (session.state === SessionState.Initial) {
    // Session is ringing - accept the call
    if (session instanceof Invitation) {
      await session.accept();
    } else {
      throw new Error("Cannot accept - session is not an Invitation");
    }
  } else if (session.state === SessionState.Established) {
    // Session is established - send re-INVITE with sendrecv to resume from hold
    await session.invite({
      sessionDescriptionHandlerOptions: session.sessionDescriptionHandlerOptions,
      sessionDescriptionHandlerModifiers: [resumeModifier]
    });
  }
  // For other states (Establishing, Terminating, Terminated), do nothing
}

/**
 * SDP modifier for resuming a call from hold: sendonly → sendrecv, inactive → recvonly.
 *
 * @remarks
 * The transformation is applied to every direction attribute in the description
 * (session-level and media-level). A media section that was *originally* sendonly
 * for reasons unrelated to hold (e.g. a one-way stream) is also rewritten to
 * sendrecv; if that matters for your application, manage hold state via the
 * session description handler's `hold` option instead.
 */
export function resumeModifier(description: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
  if (!description.sdp) {
    return Promise.resolve(description);
  }

  let sdp = description.sdp;

  sdp = sdp.replace(/a=sendonly\r\n/g, "a=sendrecv\r\n");
  sdp = sdp.replace(/a=inactive\r\n/g, "a=recvonly\r\n");

  return Promise.resolve({
    type: description.type,
    sdp: sdp
  });
}

/**
 * SDP modifier for placing a call on hold: sendrecv → sendonly, recvonly → inactive.
 *
 * If the description carries no direction attribute at all (implicit sendrecv),
 * an `a=sendonly` attribute is inserted after each media line, mirroring the
 * behavior of the platform web `holdModifier`.
 */
export function holdModifier(description: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
  if (!description.sdp) {
    return Promise.resolve(description);
  }
  let sdp = description.sdp;
  if (!/a=(sendrecv|sendonly|recvonly|inactive)/.test(sdp)) {
    sdp = sdp.replace(/(m=[^\r]*\r\n)/g, "$1a=sendonly\r\n");
  } else {
    sdp = sdp.replace(/a=sendrecv\r\n/g, "a=sendonly\r\n");
    sdp = sdp.replace(/a=recvonly\r\n/g, "a=inactive\r\n");
  }
  return Promise.resolve({ type: description.type, sdp });
}

/**
 * Apply a hold action per BroadSoft spec: re-INVITE with a=sendonly.
 * Only acts when the session is Established; all other states are a no-op
 * (hold in ringing/dialing/terminated states must not execute).
 */
export async function applyHoldAction(session: Session): Promise<void> {
  if (session.state !== SessionState.Established) {
    return;
  }
  await session.invite({
    sessionDescriptionHandlerOptions: session.sessionDescriptionHandlerOptions,
    sessionDescriptionHandlerModifiers: [holdModifier]
  });
}

/**
 * Handle a BroadSoft remote control NOTIFY request
 *
 * This function parses the NOTIFY request, invokes the configured callbacks, and
 * applies the appropriate SIP signaling action per BroadSoft specification
 * (accept a ringing call, resume from hold, or hold an established call).
 *
 * Note: this function does not send a response to the NOTIFY request; the caller
 * retains responsibility for accepting or rejecting it.
 *
 * @param session - The session receiving the NOTIFY
 * @param request - The incoming NOTIFY request
 * @param options - Remote control configuration options
 * @returns True if the NOTIFY was handled as a BroadSoft remote control event
 */
export async function handleRemoteControlNotify(
  session: Session,
  request: IncomingNotifyRequest,
  options: RemoteControlOptions
): Promise<boolean> {
  return handleRemoteControlMessage(session, request.message, options);
}

/**
 * Check if a NOTIFY request is a BroadSoft remote control event
 *
 * @param request - The incoming NOTIFY request
 * @returns True if this is a BroadSoft remote control event
 */
export function isBroadSoftNotify(request: IncomingNotifyRequest): boolean {
  return parseEventFromMessage(request.message) !== undefined;
}

/**
 * Parse the Event header from a Notification
 *
 * @param notification - The notification wrapper
 * @returns The event type, or undefined if not parseable
 */
export function parseEventHeaderFromNotification(notification: Notification): BroadSoftEvent | undefined {
  return parseEventFromMessage(notification.request);
}

/**
 * Parse the body of a Notification for BroadSoft events
 *
 * @param notification - The notification wrapper
 * @param eventType - The type of event (from Event header)
 * @returns Parsed notify body, or undefined if not parseable
 */
export function parseNotifyBodyFromNotification(
  notification: Notification,
  eventType: BroadSoftEvent
): BroadSoftNotifyBody | undefined {
  return parseBodyFromMessage(notification.request, eventType);
}

/**
 * Handle a BroadSoft remote control NOTIFY from a Notification wrapper
 *
 * This is a convenience function for use with the SessionDelegate.onNotify callback.
 * It parses the NOTIFY, invokes the configured callbacks, and applies the appropriate
 * SIP signaling action per BroadSoft specification (accept a ringing call, resume from
 * hold, or hold an established call).
 *
 * Note: this function does not send a response to the NOTIFY; the application must
 * still call `notification.accept()` (or `notification.reject()`).
 *
 * @param session - The session receiving the NOTIFY
 * @param notification - The notification wrapper from delegate
 * @param options - Remote control configuration options
 * @returns True if the NOTIFY was handled as a BroadSoft remote control event
 */
export async function handleRemoteControlNotification(
  session: Session,
  notification: Notification,
  options: RemoteControlOptions
): Promise<boolean> {
  return handleRemoteControlMessage(session, notification.request, options);
}

/**
 * Check if a Notification is a BroadSoft remote control event
 *
 * @param notification - The notification wrapper
 * @returns True if this is a BroadSoft remote control event
 */
export function isBroadSoftNotification(notification: Notification): boolean {
  return parseEventFromMessage(notification.request) !== undefined;
}
