import { Logger, OutgoingByeRequest } from "../core";
import { ByerByeOptions } from "./byer-bye-options";
import { ByerOptions } from "./byer-options";
import { Invitation } from "./invitation";
import { Inviter } from "./inviter";
import { Session } from "./session";
import { SessionState } from "./session-state";

/**
 * A byer ends a {@link Session} (outgoing BYE).
 * @remarks
 * Sends an outgoing in dialog BYE request.
 * @public
 */
export class Byer {
  /** The logger. */
  private logger: Logger;
  /** The byer session. */
  private _session: Session;

  /**
   * Constructs a new instance of the `Byer` class.
   * @param session - The session the BYE will be sent from. See {@link Session} for details.
   * @param options - An options bucket. See {@link ByerOptions} for details.
   */
  public constructor(session: Session, options?: ByerOptions) {
    this.logger = session.userAgent.getLogger("sip.Byer");
    this._session = session;
  }

  /** The byer session. */
  public get session(): Session {
    return this._session;
  }

  /**
   * Sends the BYE request.
   * @param options - {@link ByerByeOptions} options bucket.
   */
  public bye(options: ByerByeOptions = {}): Promise<OutgoingByeRequest> {
    return this.session.bye(options);
  }
}
