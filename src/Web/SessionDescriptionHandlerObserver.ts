import { TypeStrings } from "../Enums";
import { InviteClientContext, InviteServerContext } from "../Session";

/* SessionDescriptionHandlerObserver
 * @class SessionDescriptionHandler Observer Class.
 * @param {SIP.Session} session
 * @param {Object} [options]
 */

export class SessionDescriptionHandlerObserver {
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
