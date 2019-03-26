import { TypeStrings } from "../Enums";
import { InviteClientContext, InviteServerContext } from "../Session";
import {
  SessionDescriptionHandlerObserver as SessionDescriptionHandlerObserverDefinition
} from "../session-description-handler-observer";

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
