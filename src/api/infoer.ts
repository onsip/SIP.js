import { Logger, OutgoingInfoRequest } from "../core";
import { InfoerInfoOptions } from "./infoer-info-options";
import { InfoerOptions } from "./infoer-options";
import { Session } from "./session";
import { SessionState } from "./session-state";

/**
 * An Infoer sends {@link Info} (outgoing INFO).
 * @remarks
 * Sends an outgoing in dialog INFO request.
 * @public
 */
export class Infoer {
  /** The logger. */
  private logger: Logger;
  /** The Infoer session. */
  private _session: Session;

  /**
   * Constructs a new instance of the `Infoer` class.
   * @param session - The session the INFO will be sent from. See {@link Session} for details.
   * @param options - An options bucket.
   */
  public constructor(session: Session, options?: InfoerOptions) {
    this.logger = session.userAgent.getLogger("sip.Infoer");
    this._session = session;
  }

  /** The Infoer session. */
  public get session(): Session {
    return this._session;
  }

  /**
   * Sends the INFO request.
   * @param options - {@link InfoerInfoOptions} options bucket.
   */
  public info(options: InfoerInfoOptions = {}): Promise<OutgoingInfoRequest> {
    // guard session state
    if (this.session.state !== SessionState.Established) {
      const message = "Infoer.info() may only be called if established session.";
      this.logger.error(message);
      return Promise.reject(new Error(`Invalid session state ${this.session.state}`));
    }

    return this.session._info(options.requestDelegate, options.requestOptions);
  }
}
