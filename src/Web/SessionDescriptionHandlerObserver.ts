import { Session } from "../api/session";
import { TypeStrings } from "../Enums";
import { InviteClientContext, InviteServerContext } from "../Session";

/* SessionDescriptionHandlerObserver
 * @class SessionDescriptionHandler Observer Class.
 * @param {SIP.Session} session
 * @param {Object} [options]
 */

export class SessionDescriptionHandlerObserver {
  public type: TypeStrings;
  private session: InviteClientContext | InviteServerContext | Session;
  private options: any;

  constructor(session: InviteClientContext | InviteServerContext | Session, options: any) {
    this.type = TypeStrings.SessionDescriptionHandlerObserver;
    this.session = session;
    this.options = options;
  }

  public trackAdded(): void {
    if (this.session instanceof Session) {
      return;
    }
    this.session.emit("trackAdded");
  }

  public directionChanged(): void {
    if (this.session instanceof Session) {
      return;
    }
    this.session.emit("directionChanged");
  }
}
