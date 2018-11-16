import { Session } from "./session";
import { SessionDescriptionHandler } from "./session-description-handler";

/**
 * The SessionDescriptionHandlerFactory interface SIP.js is expecting.
 */
export interface SessionDescriptionHandlerFactory {
  (session: Session, options?: SessionDescriptionHandlerFactoryOptions): SessionDescriptionHandler;
}

/**
 * SessionDescriptionnHandlerFactory options.
 * These options are provided as part of the UserAgent configuration
 * and passed through on every call to SessionDescriptionHandlerFactory's constructor.
 */
export type SessionDescriptionHandlerFactoryOptions = object;
