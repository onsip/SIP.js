import { Session } from "./session";
import { SessionDescriptionHandler } from "./session-description-handler";

// tslint:disable:callable-types

/**
 * Factory for {@link SessionDescriptionHandler}.
 * @public
 */
export interface SessionDescriptionHandlerFactory {
  /**
   * SessionDescriptionHandler factory fucntion.
   * @remarks
   * The `options` are provided as part of the UserAgent configuration
   * and passed through on every call to SessionDescriptionHandlerFactory's constructor.
   */
  (session: Session, options?: object): SessionDescriptionHandler;
}
