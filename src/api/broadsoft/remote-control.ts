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
 * Parse the Event header from a NOTIFY request
 *
 * @param request - Incoming NOTIFY request
 * @returns The event type, or undefined if not parseable
 */
export function parseEventHeader(request: IncomingNotifyRequest): BroadSoftEvent | undefined {
  try {
    const eventHeader = request.message.getHeader("event");
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
 * Parse the body of a NOTIFY request for BroadSoft events
 *
 * Expected body format:
 * - For talk events: "talk" or "mute", or empty (defaults to "talk"/unmute)
 *
 * Note: FreeSWITCH's uuid_phone_event sends NOTIFY with empty body.
 * When body is empty, Event: talk → TalkAction.Talk (unmute)
 *
 * @param request - Incoming NOTIFY request
 * @param eventType - The type of event (from Event header)
 * @returns Parsed notify body, or undefined if not parseable
 */
export function parseNotifyBody(
  request: IncomingNotifyRequest,
  eventType: BroadSoftEvent
): BroadSoftNotifyBody | undefined {
  try {
    const body = request.message.body;
    const action = body ? body.trim().toLowerCase() : "";

    // Handle empty body (FreeSWITCH uuid_phone_event behavior)
    if (action === "") {
      if (eventType === BroadSoftEvent.Talk) {
        // Empty body for talk event means unmute
        return {
          event: BroadSoftEvent.Talk,
          action: TalkAction.Talk
        } as TalkNotifyBody;
      }
    }

    // Handle explicit actions in body
    if (eventType === BroadSoftEvent.Talk) {
      if (action === TalkAction.Talk || action === TalkAction.Mute) {
        return {
          event: BroadSoftEvent.Talk,
          action: action as TalkAction
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
 * Apply a talk action to a session according to BroadSoft specification
 *
 * @remarks
 * Per BroadSoft spec, Event: talk means "answer" or "resume":
 * - If session is in Initial state (ringing): Accept the call (send 200 OK with SDP)
 * - If session is in Established state: Send re-INVITE with a=sendrecv to resume from hold
 * - Otherwise: No action taken
 *
 * @param session - The session to apply the action to
 * @param action - The talk action (only TalkAction.Talk triggers SIP signaling)
 */
export async function applyTalkAction(session: Session, action: TalkAction): Promise<void> {
  // Only TalkAction.Talk triggers SIP signaling per BroadSoft spec
  // TalkAction.Mute is not used in BroadSoft NOTIFY (FreeSWITCH sends empty body)
  if (action !== TalkAction.Talk) {
    return;
  }

  // Log current session state for debugging
  /* eslint-disable no-console */
  console.log(`[BroadSoft] applyTalkAction: session.state = ${session.state}`);
  /* eslint-enable no-console */

  if (session.state === SessionState.Initial) {
    // Session is ringing - accept the call
    if (session instanceof Invitation) {
      /* eslint-disable no-console */
      console.log("[BroadSoft] applyTalkAction: Calling session.accept()");
      /* eslint-enable no-console */
      await session.accept();
      /* eslint-disable no-console */
      console.log("[BroadSoft] applyTalkAction: session.accept() completed");
      /* eslint-enable no-console */
    } else {
      throw new Error("Cannot accept - session is not an Invitation");
    }
  } else if (session.state === SessionState.Established) {
    // Session is established - send re-INVITE with sendrecv to resume
    // Use resumeModifier to explicitly set a=sendrecv in SDP
    /* eslint-disable no-console */
    console.log("[BroadSoft] applyTalkAction: Sending re-INVITE with sendrecv");
    /* eslint-enable no-console */
    await session.invite({
      sessionDescriptionHandlerOptions: session.sessionDescriptionHandlerOptions,
      sessionDescriptionHandlerModifiers: [resumeModifier]
    });
  } else {
    /* eslint-disable no-console */
    console.log(`[BroadSoft] applyTalkAction: No action for state ${session.state}`);
    /* eslint-enable no-console */
  }
  // For other states (Establishing, Terminating, Terminated), do nothing
}

/**
 * SDP modifier for resuming a call from hold
 *
 * This modifier sets the media direction to "sendrecv" by replacing sendonly/inactive
 */
function resumeModifier(description: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
  if (!description.sdp) {
    return Promise.resolve(description);
  }

  let sdp = description.sdp;

  // Replace sendonly with sendrecv and inactive with recvonly
  sdp = sdp.replace(/a=sendonly\r\n/g, "a=sendrecv\r\n");
  sdp = sdp.replace(/a=inactive\r\n/g, "a=recvonly\r\n");

  return Promise.resolve({
    type: description.type,
    sdp: sdp
  });
}

/**
 * SDP modifier for placing a call on hold: sendrecv → sendonly, recvonly → inactive.
 */
export function holdModifier(description: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
  if (!description.sdp) {
    return Promise.resolve(description);
  }
  let sdp = description.sdp;
  sdp = sdp.replace(/a=sendrecv\r\n/g, "a=sendonly\r\n");
  sdp = sdp.replace(/a=recvonly\r\n/g, "a=inactive\r\n");
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
 * This function parses the NOTIFY request and automatically applies the appropriate
 * SIP signaling action per BroadSoft specification.
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
  if (!options.enabled) {
    return false;
  }

  const eventType = parseEventHeader(request);
  if (!eventType) {
    return false;
  }

  const notifyBody = parseNotifyBody(request, eventType);
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
        // Silently ignore callback errors
      }
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
        // Silently ignore callback errors
      }
    }
    return true;
  }

  return false;
}

/**
 * Check if a NOTIFY request is a BroadSoft remote control event
 *
 * @param request - The incoming NOTIFY request
 * @returns True if this is a BroadSoft remote control event
 */
export function isBroadSoftNotify(request: IncomingNotifyRequest): boolean {
  const eventType = parseEventHeader(request);
  return eventType === BroadSoftEvent.Talk || eventType === BroadSoftEvent.Hold;
}

/**
 * Parse the Event header from a Notification
 *
 * @param notification - The notification wrapper
 * @returns The event type, or undefined if not parseable
 */
export function parseEventHeaderFromNotification(notification: Notification): BroadSoftEvent | undefined {
  try {
    const eventHeader = notification.request.getHeader("event");
    if (!eventHeader) {
      return undefined;
    }

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
  try {
    const body = notification.request.body;
    const action = body ? body.trim().toLowerCase() : "";

    // Handle empty body (FreeSWITCH uuid_phone_event behavior)
    if (action === "") {
      if (eventType === BroadSoftEvent.Talk) {
        // Empty body for talk event means unmute/talk
        return {
          event: BroadSoftEvent.Talk,
          action: TalkAction.Talk
        } as TalkNotifyBody;
      }
    }

    // Handle explicit actions in body
    if (eventType === BroadSoftEvent.Talk) {
      if (action === TalkAction.Talk || action === TalkAction.Mute) {
        return {
          event: BroadSoftEvent.Talk,
          action: action as TalkAction
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
 * Handle a BroadSoft remote control NOTIFY from a Notification wrapper
 *
 * This is a convenience function for use with SessionDelegate.onNotify callback.
 * Per BroadSoft specification, this function automatically applies the appropriate
 * SIP signaling (accept call or resume from hold) after invoking callbacks.
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
  if (!options.enabled) {
    return false;
  }

  const eventType = parseEventHeaderFromNotification(notification);
  if (!eventType) {
    return false;
  }

  const notifyBody = parseNotifyBodyFromNotification(notification, eventType);
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
        // Silently ignore callback errors
      }
    }

    // Automatically apply SIP signaling per BroadSoft spec
    try {
      await applyTalkAction(session, talkBody.action);
    } catch (e) {
      // Log error but continue - don't block NOTIFY response
      /* eslint-disable no-console */
      console.error("[BroadSoft] Error applying talk action:", e);
      /* eslint-enable no-console */
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
        // Silently ignore callback errors
      }
    }
    try {
      await applyHoldAction(session);
    } catch (e) {
      /* eslint-disable no-console */
      console.error("[BroadSoft] Error applying hold action:", e);
      /* eslint-enable no-console */
    }
    return true;
  }

  return false;
}

/**
 * Check if a Notification is a BroadSoft remote control event
 *
 * @param notification - The notification wrapper
 * @returns True if this is a BroadSoft remote control event
 */
export function isBroadSoftNotification(notification: Notification): boolean {
  const eventType = parseEventHeaderFromNotification(notification);
  return eventType === BroadSoftEvent.Talk || eventType === BroadSoftEvent.Hold;
}
