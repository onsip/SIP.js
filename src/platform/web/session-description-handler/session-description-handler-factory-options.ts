import { SessionDescriptionHandlerConfiguration } from "./session-description-handler-configuration";

/**
 * Options for SessionDescriptionHandlerFactory.
 * @remarks
 * The "options" are provided as part of the UserAgent configuration and passed through
 * on every call to SessionDescriptionHandlerFactory's constructor.
 * @public
 */
export type SessionDescriptionHandlerFactoryOptions = SessionDescriptionHandlerConfiguration;
