import { InviteClientContext, InviteServerContext } from "../../types/session";
import {
  SessionDescriptionHandlerObserver as SessionDescriptionHandlerObserverDefinition
} from "../../types/session-description-handler-observer";

import { TypeStrings } from "../Enums";

/* SessionDescriptionHandlerObserver
 * @class SessionDescriptionHandler Observer Class.
 * @param {SIP.Session} session
 * @param {Object} [options]
 */

export class SessionDescriptionHandlerObserver implements SessionDescriptionHandlerObserverDefinition {
  public type: TypeStrings;
  private session: InviteClientContext | InviteServerContext;
  private options: any;

  constructor(session: InviteClientContext | InviteServerContext, options: any) {
    this.type = TypeStrings.SessionDescriptionHandlerObserver;
    this.session = session;
    this.options = options;
  }

  public trackAdded(): void {
    this.session.emit("trackAdded");
  }

  public directionChanged(): void {
    this.session.emit("directionChanged");
  }
}
