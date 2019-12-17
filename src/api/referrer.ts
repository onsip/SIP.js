import { Logger, OutgoingReferRequest, URI } from "../core";
import { ReferrerDelegate } from "./referrer-delegate";
import { ReferrerOptions } from "./referrer-options";
import { ReferrerReferOptions } from "./referrer-refer-options";
import { Session } from "./session";
import { SessionState } from "./session-state";

/**
 * A referrer sends a {@link Referral} (outgoing REFER).
 * @remarks
 * Sends an outgoing in dialog REFER request.
 * @public
 */
export class Referrer {
  /** The referrer delegate. */
  public delegate: ReferrerDelegate | undefined;

  /** The logger. */
  private logger: Logger;
  /** The referTo. */
  private _referTo: URI | Session;
  /** The referrer session. */
  private _session: Session;

  /**
   * Constructs a new instance of the `Referrer` class.
   * @param session - The session the REFER will be sent from. See {@link Session} for details.
   * @param referTo - The referral target. If a `Session`, a REFER w/Replaces is sent.
   * @param options - An options bucket. See {@link ReferrerOptions} for details.
   */
  public constructor(session: Session, referTo: URI | Session, options?: ReferrerOptions) {
    this.logger = session.userAgent.getLogger("sip.Referrer");
    this._session = session;
    this._referTo  = referTo;
  }

  /** The referrer session. */
  public get session(): Session {
    return this._session;
  }

  /**
   * Sends the REFER request.
   * @param options - An options bucket.
   */
   public refer(options: ReferrerReferOptions = {}): Promise<OutgoingReferRequest> {
    // guard session state
    if (this.session.state !== SessionState.Established) {
      const message = "Referrer.refer() may only be called if established session.";
      this.logger.error(message);
      return Promise.reject(new Error(`Invalid session state ${this.session.state}`));
    }

    const requestDelegate = options.requestDelegate;
    const requestOptions = options.requestOptions || {};

    const extraHeaders = this.extraHeaders(this.referToString(this._referTo));
    requestOptions.extraHeaders = requestOptions.extraHeaders || [];
    requestOptions.extraHeaders = requestOptions.extraHeaders.concat(extraHeaders);

    return this.session.refer(this, requestDelegate, requestOptions);
  }

  private extraHeaders(referTo: string): Array<string> {
    const extraHeaders: Array<string> = [];
    extraHeaders.push("Referred-By: <" + this._session.userAgent.configuration.uri + ">");
    extraHeaders.push("Contact: " + this._session._contact);
    extraHeaders.push("Allow: " + [
      "ACK",
      "CANCEL",
      "INVITE",
      "MESSAGE",
      "BYE",
      "OPTIONS",
      "INFO",
      "NOTIFY",
      "REFER"
    ].toString());
    extraHeaders.push("Refer-To: " + referTo);
    return extraHeaders;
  }

  private referToString(target: URI | Session): string {
    let referTo: string;
    if (target instanceof URI) {
      // REFER without Replaces (Blind Transfer)
      referTo = target.toString();
    } else {
      // REFER with Replaces (Attended Transfer)
      if (!target.dialog) {
        throw new Error("Dialog undefined.");
      }
      const displayName = target.remoteIdentity.friendlyName;
      const remoteTarget = target.dialog.remoteTarget.toString();
      const callId = target.dialog.callId;
      const remoteTag = target.dialog.remoteTag;
      const localTag = target.dialog.localTag;
      const replaces = encodeURIComponent(`${callId};to-tag=${remoteTag};from-tag=${localTag}`);
      referTo = `"${displayName}" <${remoteTarget}?Replaces=${replaces}>`;
    }
    return referTo;
  }
}
