import { ClientContext } from "./ClientContext";
import { C } from "./Constants";
import {
  Grammar,
  IncomingRequest,
  IncomingResponseMessage,
  NameAddrHeader,
  NonInviteClientTransaction,
  Session,
  URI
} from "./core";
import { SessionStatus, TypeStrings } from "./Enums";
import { Exceptions } from "./Exceptions";
import { ServerContext } from "./ServerContext";
import {
  InviteClientContext,
  InviteServerContext
} from "./Session";
import { SessionDescriptionHandlerModifiers } from "./session-description-handler";
import { UA } from "./UA";

export namespace ReferServerContext {

  export interface AcceptOptions {
    /** If true, accept REFER request and automatically attempt to follow it. */
    followRefer?: boolean;
    /** If followRefer is true, options to following INVITE request. */
    inviteOptions?: InviteClientContext.Options;
  }

  // tslint:disable-next-line:no-empty-interface
  export interface RejectOptions {
  }
}

// tslint:disable-next-line:max-classes-per-file
export class ReferClientContext extends ClientContext {
  public type: TypeStrings;
  protected extraHeaders: Array<string>;
  protected options: any;
  protected applicant: InviteClientContext | InviteServerContext;
  protected target: URI | string;
  private errorListener: (() => void) | undefined;

  constructor(
    ua: UA,
    applicant: InviteClientContext | InviteServerContext,
    target: InviteClientContext | InviteServerContext | string,
    options: any = {}
  ) {
    if (ua === undefined || applicant === undefined || target === undefined) {
      throw new TypeError("Not enough arguments");
    }

    super(ua, C.REFER, applicant.remoteIdentity.uri.toString(), options);
    this.type = TypeStrings.ReferClientContext;

    this.options = options;
    this.extraHeaders = (this.options.extraHeaders || []).slice();
    this.applicant = applicant;

    this.target = this.initReferTo(target);

    if (this.ua) {
      this.extraHeaders.push("Referred-By: <" + this.ua.configuration.uri + ">");
    }
    // TODO: Check that this is correct isc/icc
    this.extraHeaders.push("Contact: " + applicant.contact);
    // this is UA.C.ALLOWED_METHODS, removed to get around circular dependency
    this.extraHeaders.push("Allow: " + [
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
    this.extraHeaders.push("Refer-To: " + this.target);

    this.errorListener = this.onTransportError.bind(this);
    if (ua.transport) {
      ua.transport.on("transportError", this.errorListener);
    }
  }

  public refer(options: any = {}): ReferClientContext {
    const extraHeaders: Array<string> = (this.extraHeaders || []).slice();

    if (options.extraHeaders) {
      extraHeaders.concat(options.extraHeaders);
    }

    this.applicant.sendRequest(C.REFER, {
      extraHeaders: this.extraHeaders,
      receiveResponse: (response: IncomingResponseMessage): void => {
        const statusCode: string = response && response.statusCode ? response.statusCode.toString() : "";
        if (/^1[0-9]{2}$/.test(statusCode) ) {
          this.emit("referRequestProgress", this);
        } else if (/^2[0-9]{2}$/.test(statusCode) ) {
          this.emit("referRequestAccepted", this);
        } else if (/^[4-6][0-9]{2}$/.test(statusCode)) {
          this.emit("referRequestRejected", this);
        }
        if (options.receiveResponse) {
          options.receiveResponse(response);
        }
      }
    });
    return this;
  }

  public receiveNotify(request: IncomingRequest): void {
    // If we can correctly handle this, then we need to send a 200 OK!
    const contentType = request.message.hasHeader("Content-Type") ?
      request.message.getHeader("Content-Type") : undefined;
    if (contentType && contentType.search(/^message\/sipfrag/) !== -1) {
      const messageBody = Grammar.parse(request.message.body, "sipfrag");
      if (messageBody === -1) {
        request.reject({
          statusCode: 489,
          reasonPhrase: "Bad Event"
        });
        return;
      }
      switch (true) {
        case (/^1[0-9]{2}$/.test(messageBody.status_code)):
          this.emit("referProgress", this);
          break;
        case (/^2[0-9]{2}$/.test(messageBody.status_code)):
          this.emit("referAccepted", this);
          if (!this.options.activeAfterTransfer && this.applicant.terminate) {
            this.applicant.terminate();
          }
          break;
        default:
          this.emit("referRejected", this);
          break;
      }
      request.accept();
      this.emit("notify", request.message);
      return;
    }
    request.reject({
      statusCode: 489,
      reasonPhrase: "Bad Event"
    });
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

// tslint:disable-next-line:max-classes-per-file
export class ReferServerContext extends ServerContext {
  public type: TypeStrings;
  public referTo!: NameAddrHeader;
  public targetSession: InviteClientContext | InviteServerContext | undefined;

  protected status: SessionStatus;
  protected fromTag: string;
  protected fromUri: URI;
  protected toUri: URI;
  protected toTag: string;
  protected routeSet: Array<string>;
  protected remoteTarget: URI;
  protected id: string;
  protected callId: string;
  protected cseq: number;
  protected contact: string;
  protected referredBy: string | undefined;
  protected referredSession!: InviteClientContext | InviteServerContext | undefined;
  protected replaces: string | undefined;
  protected errorListener!: (() => void);

  constructor(ua: UA, incomingRequest: IncomingRequest, private session?: Session) {
    super(ua, incomingRequest);
    this.type = TypeStrings.ReferServerContext;

    this.ua = ua;

    this.status = SessionStatus.STATUS_INVITE_RECEIVED;
    this.fromTag = this.request.fromTag;
    this.id = this.request.callId + this.fromTag;
    this.contact = this.ua.contact.toString();

    this.logger = ua.getLogger("sip.referservercontext", this.id);

    // Needed to send the NOTIFY's
    this.cseq = Math.floor(Math.random() * 10000);
    this.callId = this.request.callId;
    this.fromUri = this.request.to.uri;
    this.fromTag = this.request.to.parameters.tag;
    this.remoteTarget = this.request.headers.Contact[0].parsed.uri;
    this.toUri = this.request.from.uri;
    this.toTag = this.request.fromTag;
    this.routeSet = this.request.getHeaders("record-route");

    // RFC 3515 2.4.1
    if (!this.request.hasHeader("refer-to")) {
      this.logger.warn("Invalid REFER packet. A refer-to header is required. Rejecting refer.");
      this.reject();
      return;
    }

    this.referTo = this.request.parseHeader("refer-to");

    // TODO: Must set expiration timer and send 202 if there is no response by then
    this.referredSession = this.ua.findSession(this.request);

    if (this.request.hasHeader("referred-by")) {
      this.referredBy = this.request.getHeader("referred-by");
    }

    if (this.referTo.uri.hasHeader("replaces")) {
      this.replaces = this.referTo.uri.getHeader("replaces");
    }

    this.errorListener = this.onTransportError.bind(this);
    if (ua.transport) {
      ua.transport.on("transportError", this.errorListener);
    }

    this.status = SessionStatus.STATUS_WAITING_FOR_ANSWER;
  }

  public progress(): void {
    if (this.status !== SessionStatus.STATUS_WAITING_FOR_ANSWER) {
      throw new Exceptions.InvalidStateError(this.status);
    }
    this.incomingRequest.trying();
  }

  public reject(options: ReferServerContext.RejectOptions = {}): void {
    if (this.status  === SessionStatus.STATUS_TERMINATED) {
      throw new Exceptions.InvalidStateError(this.status);
    }
    this.logger.log("Rejecting refer");
    this.status = SessionStatus.STATUS_TERMINATED;
    super.reject(options);
    this.emit("referRequestRejected", this);
  }

  public accept(
    options: ReferServerContext.AcceptOptions = {},
    modifiers?: SessionDescriptionHandlerModifiers
  ): void {
    if (this.status === SessionStatus.STATUS_WAITING_FOR_ANSWER) {
      this.status = SessionStatus.STATUS_ANSWERED;
    } else {
      throw new Exceptions.InvalidStateError(this.status);
    }

    this.incomingRequest.accept({
      statusCode: 202,
      reasonPhrase: "Accepted"
    });
    this.emit("referRequestAccepted", this);

    if (options.followRefer) {
      this.logger.log("Accepted refer, attempting to automatically follow it");

      const target: URI = this.referTo.uri;
      if (!target.scheme || !target.scheme.match("^sips?$")) {
        this.logger.error("SIP.js can only automatically follow SIP refer target");
        this.reject();
        return;
      }

      const inviteOptions: any = options.inviteOptions || {};
      const extraHeaders: Array<string> = (inviteOptions.extraHeaders || []).slice();
      if (this.replaces) {
        // decodeURIComponent is a holdover from 2c086eb4. Not sure that it is actually necessary
        extraHeaders.push("Replaces: " + decodeURIComponent(this.replaces));
      }

      if (this.referredBy) {
        extraHeaders.push("Referred-By: " + this.referredBy);
      }

      inviteOptions.extraHeaders = extraHeaders;

      target.clearHeaders();

      this.targetSession = this.ua.invite(target.toString(), inviteOptions, modifiers);

      this.emit("referInviteSent", this);

      if (this.targetSession) {
        this.targetSession.once("progress", (response) => {
          const statusCode: number = response.statusCode || 100;
          const reasonPhrase: string = response.reasonPhrase;

          this.sendNotify(("SIP/2.0 " + statusCode + " " + reasonPhrase).trim());
          this.emit("referProgress", this);
          if (this.referredSession) {
            this.referredSession.emit("referProgress", this);
          }
        });
        this.targetSession.once("accepted", () => {
          this.logger.log("Successfully followed the refer");
          this.sendNotify("SIP/2.0 200 OK");
          this.emit("referAccepted", this);
          if (this.referredSession) {
            this.referredSession.emit("referAccepted", this);
          }
        });

        const referFailed: ((response: IncomingResponseMessage) => void) = (response) => {
          if (this.status === SessionStatus.STATUS_TERMINATED) {
            return; // No throw here because it is possible this gets called multiple times
          }
          this.logger.log("Refer was not successful. Resuming session");
          if (response && response.statusCode === 429) {
            this.logger.log("Alerting referrer that identity is required.");
            this.sendNotify("SIP/2.0 429 Provide Referrer Identity");
            return;
          }
          this.sendNotify("SIP/2.0 603 Declined");
          // Must change the status after sending the final Notify or it will not send due to check
          this.status = SessionStatus.STATUS_TERMINATED;
          this.emit("referRejected", this);
          if (this.referredSession) {
            this.referredSession.emit("referRejected");
          }
        };

        this.targetSession.once("rejected", referFailed);
        this.targetSession.once("failed", referFailed);
      }
    } else {
      this.logger.log("Accepted refer, but did not automatically follow it");
      this.sendNotify("SIP/2.0 200 OK");
      this.emit("referAccepted", this);
      if (this.referredSession) {
        this.referredSession.emit("referAccepted", this);
      }
    }
  }

  public sendNotify(bodyStr: string): void {
    // FIXME: Ported this. Clean it up. Session knows its state.
    if (this.status !== SessionStatus.STATUS_ANSWERED) {
      throw new Exceptions.InvalidStateError(this.status);
    }
    if (Grammar.parse(bodyStr, "sipfrag") === -1) {
      throw new Error("sipfrag body is required to send notify for refer");
    }

    const body = {
      contentDisposition: "render",
      contentType: "message/sipfrag",
      content: bodyStr
    };

    // NOTIFY requests sent in same dialog as in dialog REFER.
    if (this.session) {
      this.session.notify(undefined, {
        extraHeaders: [
          "Event: refer",
          "Subscription-State: terminated",
        ],
        body
      });
      return;
    }

    // The implicit subscription created by a REFER is the same as a
    // subscription created with a SUBSCRIBE request.  The agent issuing the
    // REFER can terminate this subscription prematurely by unsubscribing
    // using the mechanisms described in [2].  Terminating a subscription,
    // either by explicitly unsubscribing or rejecting NOTIFY, is not an
    // indication that the referenced request should be withdrawn or
    // abandoned.
    // https://tools.ietf.org/html/rfc3515#section-2.4.4

    // NOTIFY requests sent in new dialog for out of dialog REFER.
    // FIXME: TODO: This should be done in a subscribe dialog to satisfy the above.
    const request = this.ua.userAgentCore.makeOutgoingRequestMessage(
      C.NOTIFY,
      this.remoteTarget,
      this.fromUri,
      this.toUri,
      {
      cseq: this.cseq += 1,  // randomly generated then incremented on each additional notify
      callId: this.callId, // refer callId
      fromTag: this.fromTag,
      toTag: this.toTag,
      routeSet: this.routeSet
      },
      [
        "Event: refer",
        "Subscription-State: terminated",
        "Content-Type: message/sipfrag"
      ],
      body
    );
    const transport = this.ua.transport;
    if (!transport) {
      throw new Error("Transport undefined.");
    }
    const user = {
      loggerFactory: this.ua.getLoggerFactory()
    };
    const nic = new NonInviteClientTransaction(request, transport, user);
  }

  public on(
    name:
      "referAccepted" |
      "referInviteSent" |
      "referProgress" |
      "referRejected" |
      "referRequestAccepted" |
      "referRequestRejected",
    callback: (referServerContext: ReferServerContext) => void
  ): this;
  public on(name: string, callback: (...args: any[]) => void): this  { return super.on(name, callback); }
}
