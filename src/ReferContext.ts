import { ClientContext } from "./ClientContext";
import { C } from "./Constants";
import { Dialog } from "./Dialogs";
import { SessionStatus, TypeStrings } from "./Enums";
import { Exceptions } from "./Exceptions";
import { Grammar } from "./Grammar";
import { NameAddrHeader } from "./NameAddrHeader";
import { RequestSender } from "./RequestSender";
import { ServerContext } from "./ServerContext";
import {
  InviteClientContext,
  InviteServerContext
} from "./Session";
import { SessionDescriptionHandlerModifiers } from "./session-description-handler";
import {
  IncomingRequest,
  IncomingResponse,
  OutgoingRequest
} from "./SIPMessage";
import { UA } from "./UA";
import { URI } from "./URI";

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
  private extraHeaders: Array<string>;
  private options: any;
  private applicant: InviteClientContext | InviteServerContext;
  private target: URI | string;
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

    if (!(typeof target === "string") &&
      (target.type === TypeStrings.InviteServerContext || target.type === TypeStrings.InviteClientContext)) {
      // Attended Transfer (with replaces)
      // All of these fields should be defined based on the check above
      const dialog: Dialog | undefined = (target as any).dialog;
      if (dialog) {
        this.target = '"' + target.remoteIdentity.friendlyName + '" ' +
            "<" + dialog.remoteTarget.toString() +
            "?Replaces=" + encodeURIComponent(dialog.id.callId +
            ";to-tag=" + dialog.id.remoteTag +
            ";from-tag=" + dialog.id.localTag) + ">";
      } else {
        throw new TypeError("Invalid target due to no dialog: " + target);
      }
    } else {
      // Blind Transfer
      // Refer-To: <sip:bob@example.com>

      const targetString: any = Grammar.parse(target as string, "Refer_To");
      this.target = targetString && targetString.uri ? targetString.uri : target;

      // Check target validity
      const targetUri: URI | undefined = this.ua.normalizeTarget(this.target as string);
      if (!targetUri) {
        throw new TypeError("Invalid target: " + target);
      }
      this.target = targetUri;
    }

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
      receiveResponse: (response: IncomingResponse): void => {
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
    const contentType: string | undefined = request.hasHeader("Content-Type") ?
      request.getHeader("Content-Type") : undefined;
    if (contentType && contentType.search(/^message\/sipfrag/) !== -1) {
      const messageBody: any = Grammar.parse(request.body, "sipfrag");
      if (messageBody === -1) {
        request.reply(489, "Bad Event");
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
      request.reply(200);
      this.emit("notify", request);
      return;
    }
    request.reply(489, "Bad Event");
  }
}

// tslint:disable-next-line:max-classes-per-file
export class ReferServerContext extends ServerContext {
  public type: TypeStrings;
  public referTo!: NameAddrHeader;
  public targetSession: InviteClientContext | InviteServerContext | undefined;

  private status: SessionStatus;
  private fromTag: string;
  private fromUri: URI;
  private toUri: URI;
  private toTag: string;
  private routeSet: Array<string>;
  private remoteTarget: URI;
  private id: string;
  private callId: string;
  private cseq: number;
  private contact: string;
  private referredBy: string | undefined;
  private referredSession!: InviteClientContext | InviteServerContext | undefined;
  private replaces: string | undefined;
  private errorListener!: (() => void);

  constructor(ua: UA, request: IncomingRequest) {
    super(ua, request);
    this.type = TypeStrings.ReferServerContext;

    this.ua = ua;

    this.status = SessionStatus.STATUS_INVITE_RECEIVED;
    this.fromTag = request.fromTag;
    this.id = request.callId + this.fromTag;
    this.request = request;
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
    this.referredSession = this.ua.findSession(request);

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

  public receiveNonInviteResponse(response: IncomingResponse): void { /* intentionally blank */}

  public progress(): void {
    if (this.status !== SessionStatus.STATUS_WAITING_FOR_ANSWER) {
      throw new Exceptions.InvalidStateError(this.status);
    }
    this.request.reply(100);
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

    this.request.reply(202, "Accepted");
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

        const referFailed: ((response: IncomingResponse) => void) = (response) => {
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

  public sendNotify(body: string): void {
    if (this.status !== SessionStatus.STATUS_ANSWERED) {
      throw new Exceptions.InvalidStateError(this.status);
    }
    if (Grammar.parse(body, "sipfrag") === -1) {
      throw new Error("sipfrag body is required to send notify for refer");
    }

    const request: OutgoingRequest = new OutgoingRequest(
      C.NOTIFY,
      this.remoteTarget,
      this.ua,
      {
        cseq: this.cseq += 1,  // randomly generated then incremented on each additional notify
        callId: this.callId, // refer callId
        fromUri: this.fromUri,
        fromTag: this.fromTag,
        toUri: this.toUri,
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

    new RequestSender({
      request,
      onRequestTimeout: () => {
        return;
      },
      onTransportError: () => {
        return;
      },
      receiveResponse: () => {
        return;
      }
    }, this.ua).send();
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
