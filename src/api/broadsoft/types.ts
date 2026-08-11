/**
 * BroadSoft Access-Side Extension Types
 *
 * This module provides type definitions for BroadSoft-specific SIP extensions.
 */

import { Logger } from "../../core/log/logger.js";

/**
 * Call-Info header parameters for BroadSoft extensions
 */
export interface CallInfoHeader {
  /** The URI part of the Call-Info header */
  uri: string;
  /** Parameters extracted from the Call-Info header */
  params: {
    /** Auto-answer delay in seconds (0 = immediate, > 0 = delayed) */
    answerAfter?: number;
    /** Additional parameters */
    [key: string]: string | number | boolean | undefined;
  };
}

/**
 * BroadSoft Event types for NOTIFY messages
 */
export enum BroadSoftEvent {
  /** Remote control event for talk/mute operations */
  Talk = "talk",
  /** Remote control event for hold operations (Access-Side Extension) */
  Hold = "hold"
}

/**
 * Talk event actions
 */
export enum TalkAction {
  /** Unmute the microphone */
  Talk = "talk",
  /** Mute the microphone */
  Mute = "mute"
}

/**
 * Parsed NOTIFY body for talk events
 */
export interface TalkNotifyBody {
  event: BroadSoftEvent.Talk;
  action: TalkAction;
}

/**
 * Hold event actions
 */
export enum HoldAction {
  /** Place the call on hold */
  Hold = "hold"
}

/**
 * Parsed NOTIFY body for hold events
 */
export interface HoldNotifyBody {
  event: BroadSoftEvent.Hold;
  action: HoldAction;
}

/**
 * Type for BroadSoft NOTIFY body
 */
export type BroadSoftNotifyBody = TalkNotifyBody | HoldNotifyBody;

/**
 * Options for auto-answer behavior
 */
export interface AutoAnswerOptions {
  /** Whether to enable auto-answer feature */
  enabled: boolean;
  /** Callback invoked before auto-answering */
  onBeforeAutoAnswer?: (answerAfter: number) => void;
  /** Callback invoked after auto-answering */
  onAfterAutoAnswer?: () => void;
  /** Override delay (in seconds) regardless of header value */
  delayOverride?: number;
  /** Optional logger; when provided, otherwise-silent failures (callback errors, accept rejections) are logged */
  logger?: Logger;
}

/**
 * Options for BroadSoft remote control handling
 */
export interface RemoteControlOptions {
  /** Whether to enable remote control features */
  enabled: boolean;
  /** Callback for talk events */
  onTalkEvent?: (action: TalkAction) => void;
  /** Callback for hold events */
  onHoldEvent?: (action: HoldAction) => void;
  /** Optional logger; when provided, otherwise-silent failures (callback errors, action failures) are logged */
  logger?: Logger;
}
