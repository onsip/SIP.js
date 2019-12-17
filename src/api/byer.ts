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
    let message = "Byer.bye() may only be called if established session.";

    switch (this.session.state) {
      case SessionState.Initial:
        if (this.session instanceof Inviter) {
          message += " However Inviter.invite() has not yet been called.";
          message += " Perhaps you should have called Inviter.cancel()?";
        } else if (this.session instanceof Invitation) {
          message += " However Invitation.accept() has not yet been called.";
          message += " Perhaps you should have called Invitation.reject()?";
        }
        break;
      case SessionState.Establishing:
        if (this.session instanceof Inviter) {
          message += " However a dialog does not yet exist.";
          message += " Perhaps you should have called Inviter.cancel()?";
        } else if (this.session instanceof Invitation) {
          message += " However Invitation.accept() has not yet been called (or not yet resolved).";
          message += " Perhaps you should have called Invitation.reject()?";
        }
        break;
      case SessionState.Established:
        return this.session._bye(options.requestDelegate, options.requestOptions);
      case SessionState.Terminating:
        message += " However this session is already terminating.";
        if (this.session instanceof Inviter) {
          message += " Perhaps you have already called Inviter.cancel()?";
        } else if (this.session instanceof Invitation) {
          message += " Perhaps you have already called Byer.bye()?";
        }
        break;
      case SessionState.Terminated:
        message += " However this session is already terminated.";
        break;
      default:
        throw new Error("Unknown state");
    }

    this.logger.error(message);
    return Promise.reject(new Error(`Invalid session state ${this.session.state}`));
  }
}
