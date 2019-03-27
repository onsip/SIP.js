import { InviteClientContext, InviteServerContext } from "./Session";
import { SessionDescriptionHandler } from "./session-description-handler";

// tslint:disable:callable-types

/**
 * The SessionDescriptionHandlerFactory interface SIP.js is expecting.
 */
export interface SessionDescriptionHandlerFactory {
  (
    session: InviteClientContext | InviteServerContext,
    options?: SessionDescriptionHandlerFactoryOptions
  ): SessionDescriptionHandler;
}

/**
 * SessionDescriptionHandlerFactory options.
 * These options are provided as part of the UserAgent configuration
 * and passed through on every call to SessionDescriptionHandlerFactory's constructor.
 */
export type SessionDescriptionHandlerFactoryOptions = object;
