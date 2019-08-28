import { EventEmitter } from "events";

import {
  Contact,
  DigestAuthentication,
  Grammar,
  IncomingInviteRequest,
  IncomingMessageRequest,
  IncomingNotifyRequest,
  IncomingReferRequest,
  IncomingRequestMessage,
  IncomingResponseMessage,
  IncomingSubscribeRequest,
  Levels,
  Logger,
  LoggerFactory,
  Transport,
  TransportError,
  URI,
  UserAgentCore,
  UserAgentCoreConfiguration,
  UserAgentCoreDelegate
} from "../core";
import {
  createRandomToken,
  str_utf8_length
} from "../core/messages/utils";
import { UAStatus } from "../Enums";
import { Parser } from "../Parser";
import { LIBRARY_VERSION } from "../version";
import {
  SessionDescriptionHandler as WebSessionDescriptionHandler
} from "../Web/SessionDescriptionHandler";
import { Transport as WebTransport } from "../Web/Transport";

import { Invitation } from "./invitation";
import { Inviter } from "./inviter";
import { InviterOptions } from "./inviter-options";
import { Message } from "./message";
import { Notification } from "./notification";
import { Publisher } from "./publisher";
import { Session } from "./session";
import { SessionState } from "./session-state";
import { Subscription } from "./subscription";
import { UserAgentDelegate } from "./user-agent-delegate";
import {
  SIPExtension,
  UserAgentOptions,
  UserAgentRegisteredOptionTags
} from "./user-agent-options";
import { UserAgentState } from "./user-agent-state";

declare var chrome: any;

/**
 * A user agent sends and receives requests using a `Transport`.
 *
 * @remarks
 * A user agent (UA) is associated with a user via the user's SIP address of record (AOR)
 * and acts on behalf of that user to send and receive SIP requests. The user agent can
 * register to receive incoming requests, as well as create and send outbound messages.
 * The user agent also maintains the Transport over which its signaling travels.
 *
 * @public
 */
export class UserAgent {

  /**
   * Create a URI instance from a string.
   * @param uri - The string to parse.
   *
   * @example
   * ```ts
   * const uri = UserAgent.makeURI("sip:edgar@example.com");
   * ```
   */
  public static makeURI(uri: string): URI | undefined {
    return Grammar.URIParse(uri);
  }

  /** Default user agent options. */
  private static readonly defaultOptions: Required<UserAgentOptions> = {
    allowLegacyNotifications: false,
    allowOutOfDialogRefers: false,
    authorizationPassword: "",
    authorizationUsername: "",
    autoStart: true,
    autoStop: true,
    delegate: {},
    displayName: "",
    forceRport: false,
    hackAllowUnregisteredOptionTags: false,
    hackIpInContact: false,
    hackViaTcp: false,
    hackWssInTransport: false,
    logBuiltinEnabled: true,
    logConfiguration: true,
    logConnector: () => { /* noop */ },
    logLevel: "log",
    noAnswerTimeout: 60,
    sessionDescriptionHandlerFactory: WebSessionDescriptionHandler.defaultFactory,
    sessionDescriptionHandlerFactoryOptions: {},
    sipExtension100rel: SIPExtension.Unsupported,
    sipExtensionReplaces: SIPExtension.Unsupported,
    sipExtensionExtraSupported: [],
    sipjsId: "",
    transportConstructor: WebTransport,
    transportOptions: {},
    uri: new URI("sip", "anonymous", "anonymous.invalid"),
    usePreloadedRoute: false,
    userAgentString: "SIP.js/" + LIBRARY_VERSION,
    viaHost: ""
  };

  /** Delegate. */
  public delegate: UserAgentDelegate | undefined;

  /** @internal */
  public data: any = {};
  /** @internal */
  public applicants: {[id: string]: Inviter} = {};
  /** @internal */
  public publishers: {[id: string]: Publisher} = {};
  /** @internal */
  public sessions: {[id: string]: Session } = {};
  /** @internal */
  public subscriptions: {[id: string]: Subscription} = {};
  /** @internal */
  public status: UAStatus = UAStatus.STATUS_INIT;
  /** @internal */
  public transport: Transport;

  /** @internal */
  public contact: Contact;

  /** @internal */
  public userAgentCore: UserAgentCore;

  /** Logger. */
  private logger: Logger;
  /** LoggerFactory. */
  private loggerFactory: LoggerFactory = new LoggerFactory();
  /** Options. */
  private options: Required<UserAgentOptions>;

  private _state: UserAgentState = UserAgentState.Initial;
  private _stateEventEmitter = new EventEmitter();

  /** Unload listener. */
  private unloadListener = (() => { this.stop(); });

  /**
   * Constructs a new instance of the `UserAgent` class.
   * @param options - Options bucket. See {@link UserAgentOptions} for details.
   */
  constructor(options: UserAgentOptions = {}) {
    // initialize delegate
    this.delegate = options.delegate;

    // initialize configuration
    this.options = {
      // start with the default option values
      ...UserAgent.defaultOptions,
      // add a unique sipjs id for each instance
      ...{ sipjsId: createRandomToken(5) },
      // add a unique anonymous uri for each instance
      ...{ uri: new URI("sip", "anonymous." + createRandomToken(6), "anonymous.invalid") },
      // add a unique via host for each instance
      ...{ viaHost: createRandomToken(12) + ".invalid" },
      // apply any options passed in via the constructor
      ...options
    };

    // viaHost is hack
    if (this.options.hackIpInContact) {
      if (typeof this.options.hackIpInContact === "boolean" && this.options.hackIpInContact) {
        const from: number = 1;
        const to: number = 254;
        const octet: number = Math.floor(Math.random() * (to - from + 1) + from);
        // random Test-Net IP (http://tools.ietf.org/html/rfc5735)
        this.options.viaHost = "192.0.2." + octet;
      } else if (this.options.hackIpInContact) {
        this.options.viaHost = this.options.hackIpInContact;
      }
    }

    // initialize logger & logger factory
    this.logger = this.loggerFactory.getLogger("sip.UserAgent");
    this.loggerFactory.builtinEnabled = this.options.logBuiltinEnabled;
    this.loggerFactory.connector = this.options.logConnector as
      (level: string, category: string, label: string | undefined, content: string) => void;
    switch (this.options.logLevel) {
      case "error":
        this.loggerFactory.level = Levels.error;
        break;
      case "warn":
        this.loggerFactory.level = Levels.warn;
        break;
      case "log":
        this.loggerFactory.level = Levels.log;
        break;
      case "debug":
        this.loggerFactory.level = Levels.debug;
        break;
      default:
        break;
    }

    if (this.options.logConfiguration) {
      this.logger.log("Configuration:");
      for (const [key, value] of Object.entries(this.options)) {
        switch (key) {
          case "uri":
          case "sessionDescriptionHandlerFactory":
            this.logger.log("· " + key + ": " + value);
            break;
          case "authorizationPassword":
            this.logger.log("· " + key + ": " + "NOT SHOWN");
            break;
          case "transportConstructor":
            this.logger.log("· " + key + ": " + value.name);
            break;
          default:
            this.logger.log("· " + key + ": " + JSON.stringify(value));
        }
      }
    }

    // initialize transport
    this.transport = new this.options.transportConstructor(
      this.getLogger("sip.transport"),
      this.options.transportOptions
    );

    // initialize contact
    this.contact = this.initContact();

    // initialize core
    this.userAgentCore = this.initCore();

    if (this.options.autoStart) {
      this.start();
    }
  }

  /**
   * User agent configuration.
   */
  public get configuration(): Required<UserAgentOptions> {
    return this.options;
  }

  /**
   * Connect user agent to network transport.
   * @remarks
   * Connect to the WS server if status = STATUS_INIT.
   * Resume UA after being closed.
   */
  public start(): Promise<void> {
    this.logger.log("user requested startup...");
    if (this.status === UAStatus.STATUS_INIT) {
      this.status = UAStatus.STATUS_STARTING;
      this.setTransportListeners();
      return this.transport.connect();
    } else if (this.status === UAStatus.STATUS_USER_CLOSED) {
      this.logger.log("resuming");
      this.status = UAStatus.STATUS_READY;
      return this.transport.connect();
    } else if (this.status === UAStatus.STATUS_STARTING) {
      this.logger.log("UA is in STARTING status, not opening new connection");
    } else if (this.status === UAStatus.STATUS_READY) {
      this.logger.log("UA is in READY status, not resuming");
    } else {
      this.logger.error("Connection is down. Auto-Recovery system is trying to connect");
    }

    if (this.options.autoStop) {
      // Google Chrome Packaged Apps don't allow 'unload' listeners: unload is not available in packaged apps
      const googleChromePackagedApp = typeof chrome !== "undefined" && chrome.app && chrome.app.runtime ? true : false;
      if (
        typeof window !== "undefined" &&
        typeof window.addEventListener === "function" &&
        !googleChromePackagedApp
      ) {
        window.addEventListener("unload", this.unloadListener);
      }
    }

    return Promise.resolve();
  }

  /**
   * Gracefully close.
   * Gracefully disconnect from network transport.
   * @remarks
   * Unregisters and terminates active sessions/subscriptions.
   */
  public stop(): Promise<void> {
    this.logger.log("user requested closure...");

    if (this.status === UAStatus.STATUS_USER_CLOSED) {
      this.logger.warn("UA already closed");
    }

    // Close registerContext
    // this.logger.log("closing registerContext");
    // this.registerer.close();

    // End every Session
    for (const id in this.sessions) {
      if (this.sessions[id]) {
        this.logger.log("closing session " + id);
        const session = this.sessions[id];
        switch (session.state) {
          case SessionState.Initial:
          case SessionState.Establishing:
            if (session instanceof Invitation) {
              session.reject();
            }
            if (session instanceof Inviter) {
              session.cancel();
            }
            break;
          case SessionState.Established:
            session.bye();
            break;
          case SessionState.Terminating:
          case SessionState.Terminated:
          default:
            break;
        }
      }
    }

    // Run unsubscribe on every Subscription
    for (const subscription in this.subscriptions) {
      if (this.subscriptions[subscription]) {
        this.logger.log("unsubscribe " + subscription);
        this.subscriptions[subscription].unsubscribe();
      }
    }

    // Run close on every Publisher
    for (const publisher in this.publishers) {
      if (this.publishers[publisher]) {
        this.logger.log("unpublish " + publisher);
        this.publishers[publisher].close();
      }
    }

    // Run close on every applicant
    for (const applicant in this.applicants) {
      if (this.applicants[applicant]) {
        this.applicants[applicant].close();
      }
    }

    this.status = UAStatus.STATUS_USER_CLOSED;

    // Disconnect the transport and reset user agent core
    this.transport.disconnect();
    this.userAgentCore.reset();

    if (this.options.autoStop) {
      // Google Chrome Packaged Apps don't allow 'unload' listeners: unload is not available in packaged apps
      const googleChromePackagedApp = typeof chrome !== "undefined" && chrome.app && chrome.app.runtime ? true : false;
      if (
        typeof window !== "undefined" &&
        window.removeEventListener &&
        !googleChromePackagedApp
      ) {
        window.removeEventListener("unload", this.unloadListener);
      }
    }

    return Promise.resolve();
  }

  /** @internal */
  public findSession(
    request: IncomingRequestMessage
  ): Session | undefined {
    return this.sessions[request.callId + request.fromTag] ||
      this.sessions[request.callId + request.toTag] ||
      undefined;
  }

  /** @internal */
  public getLogger(category: string, label?: string): Logger {
    return this.loggerFactory.getLogger(category, label);
  }

  /** @internal */
  public getLoggerFactory(): LoggerFactory {
    return this.loggerFactory;
  }

  /** @internal */
  public getSupportedResponseOptions(): Array<string> {
    let optionTags: Array<string> = [];

    if (this.contact.pubGruu || this.contact.tempGruu) {
      optionTags.push("gruu");
    }
    if (this.options.sipExtension100rel === SIPExtension.Supported) {
      optionTags.push("100rel");
    }
    if (this.options.sipExtensionReplaces === SIPExtension.Supported) {
      optionTags.push("replaces");
    }

    optionTags.push("outbound");

    optionTags = optionTags.concat(this.options.sipExtensionExtraSupported || []);

    const allowUnregistered = this.options.hackAllowUnregisteredOptionTags || false;
    const optionTagSet: {[name: string]: boolean} = {};
    optionTags = optionTags.filter((optionTag) => {
      const registered = UserAgentRegisteredOptionTags[optionTag];
      const unique = !optionTagSet[optionTag];
      optionTagSet[optionTag] = true;
      return (registered || allowUnregistered) && unique;
    });

    return optionTags;
  }

  /** @internal */
  public makeInviter(
    targetURI: URI,
    options?: InviterOptions
  ): Inviter {
    return new Inviter(this, targetURI, options);
  }

  // ==============================
  // Event Handlers
  // ==============================

  private onTransportError(): void {
    if (this.status === UAStatus.STATUS_USER_CLOSED) {
      return;
    }
    this.status = UAStatus.STATUS_NOT_READY;
  }

  /**
   * Helper function. Sets transport listeners
   */
  private setTransportListeners(): void {
    this.transport.on("connected", () => this.onTransportConnected());
    this.transport.on("message", (message: string) => this.onTransportReceiveMsg(message));
    this.transport.on("transportError", () => this.onTransportError());
  }

  /**
   * Transport connection event.
   */
  private onTransportConnected(): void {
    // if (this.configuration.register) {
    //   // In an effor to maintain behavior from when we "initialized" an
    //   // authentication factory, this is in a Promise.then
    //   Promise.resolve().then(() => this.registerer.register());
    // }
  }

  /**
   * Handle SIP message received from the transport.
   * @param messageString - The message.
   */
  private onTransportReceiveMsg(messageString: string): void {
    const message = Parser.parseMessage(messageString, this.getLogger("sip.parser"));
    if (!message) {
      this.logger.warn("Failed to parse incoming message. Dropping.");
      return;
    }

    if (this.status === UAStatus.STATUS_USER_CLOSED && message instanceof IncomingRequestMessage) {
      this.logger.warn(`Received ${message.method} request in state USER_CLOSED. Dropping.`);
      return;
    }

    // A valid SIP request formulated by a UAC MUST, at a minimum, contain
    // the following header fields: To, From, CSeq, Call-ID, Max-Forwards,
    // and Via; all of these header fields are mandatory in all SIP
    // requests.
    // https://tools.ietf.org/html/rfc3261#section-8.1.1
    const hasMinimumHeaders = (): boolean => {
      const mandatoryHeaders: Array<string> = ["from", "to", "call_id", "cseq", "via"];
      for (const header of mandatoryHeaders) {
        if (!message.hasHeader(header)) {
          this.logger.warn(`Missing mandatory header field : ${header}.`);
          return false;
        }
      }
      return true;
    };

    // Request Checks
    if (message instanceof IncomingRequestMessage) {
      // This is port of SanityCheck.minimumHeaders().
      if (!hasMinimumHeaders()) {
        this.logger.warn(`Request missing mandatory header field. Dropping.`);
        return;
      }

      // FIXME: This is non-standard and should be a configruable behavior (desirable regardless).
      // Custom SIP.js check to reject request from ourself (this instance of SIP.js).
      // This is port of SanityCheck.rfc3261_16_3_4().
      if (!message.toTag && message.callId.substr(0, 5) === this.options.sipjsId) {
        this.userAgentCore.replyStateless(message, { statusCode: 482 });
        return;
      }

      // FIXME: This should be Transport check before we get here (Section 18).
      // Custom SIP.js check to reject requests if body length wrong.
      // This is port of SanityCheck.rfc3261_18_3_request().
      const len: number = str_utf8_length(message.body);
      const contentLength: string | undefined = message.getHeader("content-length");
      if (contentLength && len < Number(contentLength)) {
        this.userAgentCore.replyStateless(message, { statusCode: 400 });
        return;
      }
    }

    // Reponse Checks
    if (message instanceof IncomingResponseMessage) {
      // This is port of SanityCheck.minimumHeaders().
      if (!hasMinimumHeaders()) {
        this.logger.warn(`Response missing mandatory header field. Dropping.`);
        return;
      }

      // Custom SIP.js check to drop responses if multiple Via headers.
      // This is port of SanityCheck.rfc3261_8_1_3_3().
      if (message.getHeaders("via").length > 1) {
        this.logger.warn("More than one Via header field present in the response. Dropping.");
        return;
      }

      // FIXME: This should be Transport check before we get here (Section 18).
      // Custom SIP.js check to drop responses if bad Via header.
      // This is port of SanityCheck.rfc3261_18_1_2().
      if (message.via.host !== this.options.viaHost || message.via.port !== undefined) {
        this.logger.warn("Via sent-by in the response does not match UA Via host value. Dropping.");
        return;
      }

      // FIXME: This should be Transport check before we get here (Section 18).
      // Custom SIP.js check to reject requests if body length wrong.
      // This is port of SanityCheck.rfc3261_18_3_response().
      const len: number = str_utf8_length(message.body);
      const contentLength: string | undefined = message.getHeader("content-length");
      if (contentLength && len < Number(contentLength)) {
        this.logger.warn("Message body length is lower than the value in Content-Length header field. Dropping.");
        return;
      }
    }

    // Handle Request
    if (message instanceof IncomingRequestMessage) {
      this.userAgentCore.receiveIncomingRequestFromTransport(message);
      return;
    }

    // Handle Response
    if (message instanceof IncomingResponseMessage) {
      this.userAgentCore.receiveIncomingResponseFromTransport(message);
      return;
    }

    throw new Error("Invalid message type.");
  }

  private initContact(): Contact {
    const contactName = createRandomToken(8); // FIXME: should be configurable
    const contactTransport =
      this.options.hackWssInTransport ? "wss" : "ws"; // FIXME: clearly broken for non ws transports
    const contact = {
      pubGruu: undefined,
      tempGruu: undefined,
      uri: new URI("sip", contactName, this.options.viaHost, undefined, { transport: contactTransport }),
      toString: (contactToStringOptions: { anonymous?: boolean, outbound?: boolean } = {}) => {
        const anonymous = contactToStringOptions.anonymous || false;
        const outbound = contactToStringOptions.outbound || false;
        let contactString: string = "<";
        if (anonymous) {
          contactString += this.contact.tempGruu || `sip:anonymous@anonymous.invalid;transport=${contactTransport}`;
        } else {
          contactString += this.contact.pubGruu || this.contact.uri;
        }
        if (outbound) {
          contactString += ";ob";
        }
        contactString += ">";
        return contactString;
      }
    };
    return contact;
  }

  private initCore(): UserAgentCore {
    // supported options
    let supportedOptionTags: Array<string> = [];
    supportedOptionTags.push("outbound"); // TODO: is this really supported?
    if (this.options.sipExtension100rel === SIPExtension.Supported) {
      supportedOptionTags.push("100rel");
    }
    if (this.options.sipExtensionReplaces === SIPExtension.Supported) {
      supportedOptionTags.push("replaces");
    }
    if (this.options.sipExtensionExtraSupported) {
      supportedOptionTags.push(...this.options.sipExtensionExtraSupported);
    }
    if (!this.options.hackAllowUnregisteredOptionTags) {
      supportedOptionTags = supportedOptionTags.filter((optionTag) => UserAgentRegisteredOptionTags[optionTag]);
    }
    supportedOptionTags = Array.from(new Set(supportedOptionTags)); // array of unique values

    // FIXME: TODO: This was ported, but this is and was just plain broken.
    const supportedOptionTagsResponse = supportedOptionTags.slice();
    if (this.contact.pubGruu || this.contact.tempGruu) {
      supportedOptionTagsResponse.push("gruu");
    }

    // core configuration
    const userAgentCoreConfiguration: UserAgentCoreConfiguration = {
      aor: this.options.uri,
      contact: this.contact,
      displayName: this.options.displayName,
      loggerFactory: this.loggerFactory,
      hackViaTcp: this.options.hackViaTcp,
      routeSet:
        this.options.usePreloadedRoute && this.transport.server && this.transport.server.sipUri ?
          [this.transport.server.sipUri] :
          [],
      supportedOptionTags,
      supportedOptionTagsResponse,
      sipjsId: this.options.sipjsId,
      userAgentHeaderFieldValue: this.options.userAgentString,
      viaForceRport: this.options.forceRport,
      viaHost: this.options.viaHost,
      authenticationFactory: () => {
        const username =
          this.options.authorizationUsername ?
            this.options.authorizationUsername :
            this.options.uri.user; // if authorization username not provided, use uri user as username
        const password =
          this.options.authorizationPassword ?
            this.options.authorizationPassword :
            undefined;
        return new DigestAuthentication(this.getLoggerFactory(), username, password);
      },
      transportAccessor: () => this.transport
    };

    const userAgentCoreDelegate: UserAgentCoreDelegate = {
      onInvite: (incomingInviteRequest: IncomingInviteRequest): void => {
        const invitation = new Invitation(this, incomingInviteRequest);

        incomingInviteRequest.delegate = {
          onCancel: (cancel: IncomingRequestMessage): void => {
            invitation.onCancel(cancel);
          },
          onTransportError: (error: TransportError): void => {
            invitation.onTransportError();
          }
        };

        // FIXME: Ported - 100 Trying send should be configurable.
        // Only required if TU will not respond in 200ms.
        // https://tools.ietf.org/html/rfc3261#section-17.2.1
        incomingInviteRequest.trying();

        // The Replaces header contains information used to match an existing
        // SIP dialog (call-id, to-tag, and from-tag).  Upon receiving an INVITE
        // with a Replaces header, the User Agent (UA) attempts to match this
        // information with a confirmed or early dialog.
        // https://tools.ietf.org/html/rfc3891#section-3
        if (this.options.sipExtensionReplaces !== SIPExtension.Unsupported) {
          const message = incomingInviteRequest.message;
          const replaces = message.parseHeader("replaces");
          if (replaces) {
            const callId = replaces.call_id;
            if (typeof callId !== "string") {
              throw new Error("Type of call id is not string");
            }
            const toTag = replaces.replaces_to_tag;
            if (typeof toTag !== "string") {
              throw new Error("Type of to tag is not string");
            }
            const fromTag = replaces.replaces_from_tag;
            if (typeof fromTag !== "string") {
              throw new Error("type of from tag is not string");
            }
            const targetDialogId = callId + toTag + fromTag;
            const targetDialog = this.userAgentCore.dialogs.get(targetDialogId);

            // If no match is found, the UAS rejects the INVITE and returns a 481
            // Call/Transaction Does Not Exist response.  Likewise, if the Replaces
            // header field matches a dialog which was not created with an INVITE,
            // the UAS MUST reject the request with a 481 response.
            // https://tools.ietf.org/html/rfc3891#section-3
            if (!targetDialog) {
              invitation.reject({ statusCode: 481 });
              return;
            }

            // If the Replaces header field matches a confirmed dialog, it checks
            // for the presence of the "early-only" flag in the Replaces header
            // field.  (This flag allows the UAC to prevent a potentially
            // undesirable race condition described in Section 7.1.) If the flag is
            // present, the UA rejects the request with a 486 Busy response.
            // https://tools.ietf.org/html/rfc3891#section-3
            if (!targetDialog.early && replaces.early_only === true) {
              invitation.reject({ statusCode: 486 });
              return;
            }

            // Provide a handle on the session being replaced.
            const targetSession = this.sessions[callId + fromTag] || this.sessions[callId + toTag] || undefined;
            if (!targetSession) {
              throw new Error("Session does not exist.");
            }
            invitation.replacee = targetSession;
          }
        }

        // A common scenario occurs when the callee is currently not willing or
        // able to take additional calls at this end system.  A 486 (Busy Here)
        // SHOULD be returned in such a scenario.
        // https://tools.ietf.org/html/rfc3261#section-13.3.1.3
        if (!this.delegate || !this.delegate.onInvite) {
          invitation.reject({ statusCode: 486 });
          return;
        }

        // Delegate invitation handling.
        if (!invitation.autoSendAnInitialProvisionalResponse) {
          this.delegate.onInvite(invitation);
        } else {
          const onInvite = this.delegate.onInvite;
          invitation.progress()
            .then(() => onInvite(invitation));
        }
      },
      onMessage: (incomingMessageRequest: IncomingMessageRequest): void => {
        if (this.delegate && this.delegate.onMessage) {
          const message = new Message(incomingMessageRequest);
          this.delegate.onMessage(message);
        } else {
          // Accept the MESSAGE request, but do nothing with it.
          incomingMessageRequest.accept();
        }
      },
      onNotify: (incomingNotifyRequest: IncomingNotifyRequest): void => {
        // NOTIFY requests are sent to inform subscribers of changes in state to
        // which the subscriber has a subscription.  Subscriptions are created
        // using the SUBSCRIBE method.  In legacy implementations, it is
        // possible that other means of subscription creation have been used.
        // However, this specification does not allow the creation of
        // subscriptions except through SUBSCRIBE requests and (for backwards-
        // compatibility) REFER requests [RFC3515].
        // https://tools.ietf.org/html/rfc6665#section-3.2
        if (this.delegate && this.delegate.onNotify) {
          const notification = new Notification(incomingNotifyRequest);
          this.delegate.onNotify(notification);
        } else {
          // Per the above which sbsoletes https://tools.ietf.org/html/rfc3265,
          // the use of out of dialog NOTIFY is obsolete, but...
          if (this.options.allowLegacyNotifications) {
            incomingNotifyRequest.accept(); // Accept the NOTIFY request, but do nothing with it.
          } else {
            incomingNotifyRequest.reject({ statusCode: 481 });
          }
        }
      },
      onRefer: (incomingReferRequest: IncomingReferRequest): void => {
        this.logger.log("Received an out of dialog refer");
        if (!this.options.allowOutOfDialogRefers) {
          incomingReferRequest.reject({ statusCode: 405 });
        }
        this.logger.log("Allow out of dialog refers is enabled on the UA");
        // const referContext = new ReferServerContext(this, incomingReferRequest);
        // if (this.listeners("outOfDialogReferRequested").length) {
        //   this.emit("outOfDialogReferRequested", referContext);
        // } else {
        //   this.logger.log(
        //     "No outOfDialogReferRequest listeners, automatically accepting and following the out of dialog refer"
        //   );
        //   referContext.accept({ followRefer: true });
        // }
        // if (this.delegate && this.delegate.onRefer) {
        //   this.delegate.onRefer(incomingReferRequest);
        // }
      },
      onSubscribe: (incomingSubscribeRequest: IncomingSubscribeRequest): void => {
        // TOOD: this.delegate.onSubscribe(...)
        if (this.delegate && this.delegate.onSubscribeRequest) {
          this.delegate.onSubscribeRequest(incomingSubscribeRequest);
        }
      }
    };

    return new UserAgentCore(userAgentCoreConfiguration, userAgentCoreDelegate);
  }
}
