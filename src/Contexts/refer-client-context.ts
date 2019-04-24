import { Grammar } from "../Grammar";
import { ReferClientContext as ReferClientContextBase } from "../ReferContext";
import { InviteClientContext, InviteServerContext } from "../Session";
import { UA } from "../UA";
import { URI } from "../URI";

export class ReferClientContext extends ReferClientContextBase {
  /**
   * Sends an in dialog REFER and handles the implicit subscription
   * dialog usage created by a REFER. The REFER is sent within the session
   * managed by the supplied InviteClientContext or InviteServerContext.
   * @param ua UA
   * @param context The invite context within which REFER will be sent.
   * @param target Target of the REFER.
   * @param options Options bucket.
   */
  constructor(
    ua: UA,
    context: InviteClientContext | InviteServerContext,
    target: InviteClientContext | InviteServerContext | string,
    options: any = {}
  ) {
    super(ua, context, target, options);
  }

  // Override ClientContext
  public onRequestTimeout(): void {
    throw new Error("Method not utilized by user agent core.");
  }

  // Override ClientContext
  public onTransportError(): void {
    throw new Error("Method not utilized by user agent core.");
  }

  // Override ClientContext
  public receiveResponse(): void {
    throw new Error("Method not utilized by user agent core.");
  }

  // Override ClientContext
  public send(): this {
    throw new Error("Method not utilized by user agent core.");
  }

  protected initReferTo(target: InviteClientContext | InviteServerContext | string): string | URI {
    let stringOrURI: string | URI;

    if (typeof target === "string") {
      // REFER without Replaces (Blind Transfer)
      const targetString: any = Grammar.parse(target as string, "Refer_To");
      stringOrURI = targetString && targetString.uri ? targetString.uri : target;

      // Check target validity
      const targetUri: URI | undefined = this.ua.normalizeTarget(target);
      if (!targetUri) {
        throw new TypeError("Invalid target: " + target);
      }
      stringOrURI = targetUri;
    } else {
      // REFER with Replaces (Attended Transfer)
      if (!target.session) {
        throw new Error("Session undefined.");
      }
      const displayName = target.remoteIdentity.friendlyName;
      const remoteTarget = target.session.remoteTarget.toString();
      const callId = target.session.callId;
      const remoteTag = target.session.remoteTag;
      const localTag = target.session.localTag;
      const replaces = encodeURIComponent(`${callId};to-tag=${remoteTag};from-tag=${localTag}`);
      stringOrURI = `"${displayName}" <${remoteTarget}?Replaces=${replaces}>`;
    }

    return stringOrURI;
  }
}
