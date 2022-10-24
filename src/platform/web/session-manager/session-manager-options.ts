import { RegistererOptions } from "../../../api/registerer-options.js";
import { RegistererRegisterOptions } from "../../../api/registerer-register-options.js";
import { Session } from "../../../api/session.js";
import { UserAgentOptions } from "../../../api/user-agent-options.js";
import { ManagedSessionFactory } from "./managed-session-factory.js";
import { SessionManagerDelegate } from "./session-manager-delegate.js";

/**
 * Media for {@link SessionManagerOptions}.
 * @public
 */
export interface SessionManagerMedia {
  /**
   * Offer/Answer constraints determine if audio and/or video are utilized.
   * If not specified, only audio is utilized (audio is true, video is false).
   * @remarks
   * Constraints are used when creating local media stream.
   * If undefined, defaults to audio true and video false.
   * If audio and video are false, media stream will have no tracks.
   */
  constraints?: SessionManagerMediaConstraints;

  /** HTML elements for local media streams. */
  local?: SessionManagerMediaLocal | ((session: Session) => SessionManagerMediaLocal);

  /** Local HTML media elements. */
  remote?: SessionManagerMediaRemote | ((session: Session) => SessionManagerMediaRemote);

  /** Whether to use the SessionDescriptionHandler to send DTMF */
  sendDtmfUsingSessionDescriptionHandler?: boolean;
}

/**
 * Constraints for {@link SessionManagerMedia}.
 * @public
 */
export interface SessionManagerMediaConstraints {
  /** If true, offer and answer to send and receive audio. */
  audio: boolean;
  /** If true, offer and answer to send and receive video. */
  video: boolean;
}

/**
 * Local media elements for {@link SessionManagerMedia}.
 * @public
 */
export interface SessionManagerMediaLocal {
  /** The local video media stream is attached to this element. */
  video?: HTMLVideoElement;
}

/**
 * Remote media elements for {@link SessionManagerMedia}.
 * @public
 */
export interface SessionManagerMediaRemote {
  /** The remote audio media stream is attached to this element. */
  audio?: HTMLAudioElement;
  /** The remote video media stream is attached to this element. */
  video?: HTMLVideoElement;
}

/**
 * Options for {@link SessionManager}.
 * @public
 */
export interface SessionManagerOptions {
  /**
   * User's SIP Address of Record (AOR).
   * @remarks
   * The AOR is registered to receive incoming calls.
   * If not specified, a random anonymous address is created for the user.
   */
  aor?: string;

  /**
   * If `true`, the user agent calls the `stop()` method on the window event `beforeunload`.
   * @defaultValue `true`
   */
  autoStop?: boolean;

  /**
   * Delegate for SessionManager.
   */
  delegate?: SessionManagerDelegate;

  /**
   * Stop waiting for ICE gathering to complete once a server reflexive address is obtained.
   * @remarks
   * This is an aggressive approach to limiting the amount of time spent gathering ICE candidates.
   * While this will contribute to minimizing the post dial/answer delay experienced,
   * it will very likely prevent a complete set of candidates from being gathered.
   * If an ICE gathering timeout is also provided as an option to the session
   * description handler, waiting will stop on whichever event occurs first.
   * @defaultValue `false`
   */
  iceStopWaitingOnServerReflexive?: boolean;

  /**
   * A factory for generating `ManagedSession` instances.
   * @remarks
   * The factory will be passed a `Session` object for the current session.
   * @defaultValue `Web.SessionManager.defaultManagedSessionFactory`
   */
  managedSessionFactory?: ManagedSessionFactory;

  /**
   * Maximum number of simultaneous sessions to manage.
   * @remarks
   * Set to 0 for unlimited.
   * @defaultValue 2
   */
  maxSimultaneousSessions?: number;

  /**
   * Media options.
   */
  media?: SessionManagerMedia;

  /**
   * Maximum number of times to attempt to reconnection.
   * @remarks
   * When the transport connection is lost (WebSocket disconnects),
   * reconnection will be attempted immediately. If that fails,
   * reconnection will be attempted again when the browser indicates
   * the application has come online. See:
   * https://developer.mozilla.org/en-US/docs/Web/API/NavigatorOnLine
   * @defaultValue 3
   */
  reconnectionAttempts?: number;

  /**
   * Seconds to wait between reconnection attempts.
   * @defaultValue 4
   */
  reconnectionDelay?: number;

  /**
   * If `true` then registration attempts will be automatically retried
   * when any registration attempts fail or is otherwise rejected.
   * @defaultValue `false`
   */
  registrationRetry?: boolean;

  /**
   * Time to wait before retrying to send a registration reqeust in seconds.
   * @defaultValue 3
   */
  registrationRetryInterval?: number;

  /**
   * Does nothing if undefined or resolves false.
   * If resolves true, the next regitration attempt will be blocked.
   */
  registerGuard?: (() => Promise<boolean>) | null;

  /**
   * Options for Registerer.
   */
  registererOptions?: RegistererOptions;

  /**
   * Options for register requests (auto register only).
   * @remarks
   * Any options provided here are overriden by the options provided via a cal to `register()`.
   */
  registererRegisterOptions?: RegistererRegisterOptions;

  /**
   * Options for UserAgent.
   */
  userAgentOptions?: UserAgentOptions;
}
