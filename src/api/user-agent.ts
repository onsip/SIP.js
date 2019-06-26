import { EventEmitter } from "events";

import { C as SIPConstants } from "../Constants";
import {
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
import { SessionStatus, TypeStrings, UAStatus } from "../Enums";
import { Exceptions } from "../Exceptions";
import { Parser } from "../Parser";
import { Utils } from "../Utils";
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
import { SessionDescriptionHandler } from "./session-description-handler";
import { SessionState } from "./session-state";
import { Subscription } from "./subscription";
import { UserAgentDelegate } from "./user-agent-delegate";
import { DTMFSignaling, UserAgentOptions } from "./user-agent-options";

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
export class UserAgent extends EventEmitter {
  /** @internal */
  public static readonly C = {
    // UA status codes
    STATUS_INIT:                0,
    STATUS_STARTING:            1,
    STATUS_READY:               2,
    STATUS_USER_CLOSED:         3,
    STATUS_NOT_READY:           4,

    // UA error codes
    CONFIGURATION_ERROR:  1,
    NETWORK_ERROR:        2,

    ALLOWED_METHODS: [
      "ACK",
      "CANCEL",
      "INVITE",
      "MESSAGE",
      "BYE",
      "OPTIONS",
      "INFO",
      "NOTIFY",
      "REFER"
    ],

    ACCEPTED_BODY_TYPES: [
      "application/sdp",
      "application/dtmf-relay"
    ],

    MAX_FORWARDS: 70,
    TAG_LENGTH: 10
  };

  /** Delegate. */
  public delegate: UserAgentDelegate | undefined;

  /** @internal */
  public type: TypeStrings;
  /** @internal */
  public configuration: UserAgentOptions;
  /** @internal */
  public applicants: {[id: string]: Inviter};
  /** @internal */
  public publishers: {[id: string]: Publisher};
  /** @internal */
  public contact!: // assigned in loadConfig()
    {
      pubGruu: URI | undefined,
      tempGruu: URI | undefined,
      uri: URI,
      toString: (options?: any) => string
    };
  /** @internal */
  public status: UAStatus;
  /** @internal */
  public transport: Transport;
  /** @internal */
  public sessions: {[id: string]: Session };
  /** @internal */
  public subscriptions: {[id: string]: Subscription};
  /** @internal */
  public data: any;
  /** @internal */
  public logger: Logger;

  /** @internal */
  public userAgentCore: UserAgentCore;

  private log: LoggerFactory;
  private error: number | undefined;
  // private registerer: Registerer;

  /** Unload listener. */
  private unloadListener = (() => { this.stop(); });

  /**
   * Constructs a new instance of the `UserAgent` class.
   * @param options - Options bucket. See {@link UserAgentOptions} for details.
   */
  constructor(options: UserAgentOptions = {}) {
    super();
    this.delegate = options.delegate;

    this.type = TypeStrings.UA;

    this.log = new LoggerFactory();
    this.logger = this.getLogger("sip.ua");

    this.configuration = {};

    // User actions outside any session/dialog (MESSAGE)
    this.applicants = {};

    this.data = {};
    this.sessions = {};
    this.subscriptions = {};
    this.publishers = {};
    this.status = UAStatus.STATUS_INIT;

    /**
     * Load configuration
     *
     * @throws {SIP.Exceptions.ConfigurationError}
     * @throws {TypeError}
     */

    // Apply log configuration if present
    if (options.log) {
      if (options.log.hasOwnProperty("builtinEnabled")) {
        this.log.builtinEnabled = options.log.builtinEnabled;
      }

      if (options.log.hasOwnProperty("connector")) {
        this.log.connector = options.log.connector;
      }

      if (options.log.hasOwnProperty("level")) {
        const level = options.log.level;
        let normalized: Levels | undefined;
        if (typeof level === "string") {
          switch (level) {
            case "error":
              normalized = Levels.error;
              break;
            case "warn":
              normalized = Levels.warn;
              break;
            case "log":
              normalized = Levels.log;
              break;
            case "debug":
              normalized = Levels.debug;
              break;
            default:
              break;
          }
        } else {
          switch (level) {
            case 0:
              normalized = Levels.error;
              break;
            case 1:
              normalized = Levels.warn;
              break;
            case 2:
              normalized = Levels.log;
              break;
            case 3:
              normalized = Levels.debug;
              break;
            default:
              break;
          }
        }
        // avoid setting level when invalid, use default level instead
        if (normalized === undefined) {
          this.logger.error(`Invalid "level" parameter value: ${JSON.stringify(level)}`);
        } else {
          this.log.level = normalized;
        }
      }
    }

    try {
      this.loadConfig(options);
    } catch (e) {
      this.status = UAStatus.STATUS_NOT_READY;
      this.error = UserAgent.C.CONFIGURATION_ERROR;
      throw e;
    }

    // initialize transport
    if (!this.configuration.transportConstructor) {
      throw new TransportError("Transport constructor not set");
    }
    this.transport = new this.configuration.transportConstructor(
      this.getLogger("sip.transport"),
      this.configuration.transportOptions
    );

    const userAgentCoreConfiguration = makeUserAgentCoreConfigurationFromUA(this);

    // The Replaces header contains information used to match an existing
    // SIP dialog (call-id, to-tag, and from-tag).  Upon receiving an INVITE
    // with a Replaces header, the User Agent (UA) attempts to match this
    // information with a confirmed or early dialog.
    // https://tools.ietf.org/html/rfc3891#section-3
    const handleInviteWithReplacesHeader = (
      context: Invitation,
      request: IncomingRequestMessage
    ): void => {
      if (this.configuration.replaces !== SIPConstants.supported.UNSUPPORTED) {
        const replaces = request.parseHeader("replaces");
        if (replaces) {
          const targetSession =
            this.sessions[replaces.call_id + replaces.replaces_from_tag] ||
            this.sessions[replaces.call_id + replaces.replaces_to_tag] ||
            undefined;
          if (!targetSession) {
            this.userAgentCore.replyStateless(request, { statusCode: 481 });
            return;
          }
          if (targetSession.status === SessionStatus.STATUS_TERMINATED) {
            this.userAgentCore.replyStateless(request, { statusCode: 603 });
            return;
          }
          const targetDialogId = replaces.call_id + replaces.replaces_to_tag + replaces.replaces_from_tag;
          const targetDialog = this.userAgentCore.dialogs.get(targetDialogId);
          if (!targetDialog) {
            this.userAgentCore.replyStateless(request, { statusCode: 481 });
            return;
          }
          if (!targetDialog.early && replaces.early_only) {
            this.userAgentCore.replyStateless(request, { statusCode: 486 });
            return;
          }
          context.replacee = targetSession;
        }
      }
    };

    const userAgentCoreDelegate: UserAgentCoreDelegate = {
      onInvite: (incomingInviteRequest: IncomingInviteRequest): void => {
        // FIXME: Ported - 100 Trying send should be configurable.
        // Only required if TU will not respond in 200ms.
        // https://tools.ietf.org/html/rfc3261#section-17.2.1
        incomingInviteRequest.trying();
        incomingInviteRequest.delegate = {
          onCancel: (cancel: IncomingRequestMessage): void => {
            context.onCancel(cancel);
          },
          onTransportError: (error: TransportError): void => {
            context.onTransportError();
          }
        };
        const context = new Invitation(this, incomingInviteRequest);
        // Ported - handling of out of dialog INVITE with Replaces.
        handleInviteWithReplacesHeader(context, incomingInviteRequest.message);
        // Ported - make the first call to progress automatically.
        if (context.autoSendAnInitialProvisionalResponse) {
          context.progress();
        }
        if (this.delegate && this.delegate.onInvite) {
          this.delegate.onInvite(context);
        } else {
          // TODO: If no delegate, reject the request.
        }
        // DEPRECATED
        this.emit("invite", context);
      },
      onMessage: (incomingMessageRequest: IncomingMessageRequest): void => {
        if (this.delegate && this.delegate.onMessage) {
          const message = new Message(incomingMessageRequest);
          this.delegate.onMessage(message);
        } else {
          // Accept the MESSAGE request, but do nothing with it.
          incomingMessageRequest.accept();
        }

        // DEPRECATED
        // const serverContext = new ServerContext(this, incomingMessageRequest);
        // serverContext.body = incomingMessageRequest.message.body;
        // serverContext.contentType = incomingMessageRequest.message.getHeader("Content-Type") || "text/plain";
        // this.emit("message", serverContext);
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
          if (this.configuration.allowLegacyNotifications) {
            incomingNotifyRequest.accept(); // Accept the NOTIFY request, but do nothing with it.
          } else {
            incomingNotifyRequest.reject({ statusCode: 481 });
          }
        }

        // DEPRECATED
        if (this.configuration.allowLegacyNotifications && this.listeners("notify").length > 0) {
          this.emit("notify", { request: incomingNotifyRequest.message });
        }
      },
      onRefer: (incomingReferRequest: IncomingReferRequest): void => {
        this.logger.log("Received an out of dialog refer");
        if (!this.configuration.allowOutOfDialogRefers) {
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
        this.emit("subscribe", incomingSubscribeRequest);
        // if (this.delegate && this.delegate.onSubscribe) {
        //   this.delegate.onSubscribe(incomingSubscribeRequest);
        // }
      }
    };

    this.userAgentCore = new UserAgentCore(userAgentCoreConfiguration, userAgentCoreDelegate);

    // // Initialize registerContext
    // this.registerer = new Registerer(this, this.configuration.registerOptions);
    // this.registerer.on("failed", this.emit.bind(this, "registrationFailed"));
    // this.registerer.on("registered", this.emit.bind(this, "registered"));
    // this.registerer.on("unregistered", this.emit.bind(this, "unregistered"));

    if (this.configuration.autostart) {
      this.start();
    }
  }

  /**
   * Normalize a string into a valid SIP request URI.
   * @param target - The target.
   */
  public makeTargetURI(target: string): URI | undefined {
    return Utils.normalizeTarget(target, this.configuration.hostportParams);
  }

  /**
   * Connect user agent to network transport.
   * @remarks
   * The first time `start` is called, the user agent will also
   * attempt to register if `UserAgentOptions.register` was set to `true`.
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

    if (this.configuration.autostop) {
      // Google Chrome Packaged Apps don't allow 'unload' listeners: unload is not available in packaged apps
      const googleChromePackagedApp = typeof chrome !== "undefined" && chrome.app && chrome.app.runtime ? true : false;
      if (typeof window !== "undefined" && !googleChromePackagedApp) {
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

    if (this.configuration.autostop) {
      // Google Chrome Packaged Apps don't allow 'unload' listeners: unload is not available in packaged apps
      const googleChromePackagedApp = typeof chrome !== "undefined" && chrome.app && chrome.app.runtime ? true : false;
      if (typeof window !== "undefined" && !googleChromePackagedApp) {
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
    return this.log.getLogger(category, label);
  }

  /** @internal */
  public getLoggerFactory(): LoggerFactory {
    return this.log;
  }

  /** @internal */
  public getSupportedResponseOptions(): Array<string> {
    let optionTags: Array<string> = [];

    if (this.contact.pubGruu || this.contact.tempGruu) {
      optionTags.push("gruu");
    }
    if (this.configuration.rel100 === SIPConstants.supported.SUPPORTED) {
      optionTags.push("100rel");
    }
    if (this.configuration.replaces === SIPConstants.supported.SUPPORTED) {
      optionTags.push("replaces");
    }

    optionTags.push("outbound");

    optionTags = optionTags.concat(this.configuration.extraSupported || []);

    const allowUnregistered = this.configuration.hackAllowUnregisteredOptionTags || false;
    const optionTagSet: {[name: string]: boolean} = {};
    optionTags = optionTags.filter((optionTag: string) => {
      const registered = SIPConstants.OPTION_TAGS[optionTag];
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

  /** @internal */
  public on(name: "invite", callback: (session: Invitation) => void): this;
  /** @internal */
  public on(name: "outOfDialogReferRequested", callback: (context: any) => void): this;
  /** @internal */
  public on(name: "message", callback: (message: any) => void): this;
  /** @internal */
  public on(name: "notify", callback: (request: any) => void): this;
  /** @internal */
  public on(name: "subscribe", callback: (subscribe: IncomingSubscribeRequest) => void): this;
  /** @internal */
  public on(name: "registered", callback: (response?: any) => void): this;
  /** @internal */
  public on(name: "unregistered" | "registrationFailed", callback: (response?: any, cause?: any) => void): this;
  /** @internal */
  public on(name: string, callback: (...args: any[]) => void): this  { return super.on(name, callback); }

  // ==============================
  // Event Handlers
  // ==============================

  private onTransportError(): void {
    if (this.status === UAStatus.STATUS_USER_CLOSED) {
      return;
    }

    if (!this.error || this.error !== UserAgent.C.NETWORK_ERROR) {
      this.status = UAStatus.STATUS_NOT_READY;
      this.error = UserAgent.C.NETWORK_ERROR;
    }
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
      this.logger.warn("UA failed to parse incoming SIP message - discarding.");
      return;
    }

    if (this.status === UAStatus.STATUS_USER_CLOSED && message instanceof IncomingRequestMessage) {
      this.logger.warn("UA received message when status = USER_CLOSED - aborting");
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
      if (!message.toTag && message.callId.substr(0, 5) === this.configuration.sipjsId) {
        this.userAgentCore.replyStateless(message, { statusCode: 482 });
        return;
      }

      // FIXME: This should be Transport check before we get here (Section 18).
      // Custom SIP.js check to reject requests if body length wrong.
      // This is port of SanityCheck.rfc3261_18_3_request().
      const len: number = Utils.str_utf8_length(message.body);
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
      if (message.via.host !== this.configuration.viaHost || message.via.port !== undefined) {
        this.logger.warn("Via sent-by in the response does not match UA Via host value. Dropping.");
        return;
      }

      // FIXME: This should be Transport check before we get here (Section 18).
      // Custom SIP.js check to reject requests if body length wrong.
      // This is port of SanityCheck.rfc3261_18_3_response().
      const len: number = Utils.str_utf8_length(message.body);
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

  // =================
  // Utils
  // =================
  private checkAuthenticationFactory(authenticationFactory: any): any | undefined {
    if (!(authenticationFactory instanceof Function)) {
      return;
    }
    if (!authenticationFactory.initialize) {
      authenticationFactory.initialize = () => {
        return Promise.resolve();
      };
    }
    return authenticationFactory;
  }

  /**
   * Configuration load.
   */
  private loadConfig(configuration: UserAgentOptions): void {
    // Settings and default values
    const settings: {[name: string]: any} = {
      /* Host address
       * Value to be set in Via sent_by and host part of Contact FQDN
       */
      viaHost: Utils.createRandomToken(12) + ".invalid",

      uri: new URI("sip", "anonymous." + Utils.createRandomToken(6), "anonymous.invalid", undefined, undefined),

      // Custom Configuration Settings
      custom: {},

      // Display name
      displayName: "",

      // Password
      password: undefined,

      register: true,

      // Registration parameters
      registerOptions: {},

      // Transport related parameters
      transportConstructor: WebTransport,
      transportOptions: {},

      usePreloadedRoute: false,

      // string to be inserted into User-Agent request header
      userAgentString: SIPConstants.USER_AGENT,

      // Session parameters
      noAnswerTimeout: 60,

      // Hacks
      hackViaTcp: false,
      hackIpInContact: false,
      hackWssInTransport: false,
      hackAllowUnregisteredOptionTags: false,

      // Session Description Handler Options
      sessionDescriptionHandlerFactoryOptions: {
        constraints: {},
        peerConnectionOptions: {}
      },

      extraSupported: [],

      contactName: Utils.createRandomToken(8), // user name in user part
      contactTransport: "ws",
      forceRport: false,

      // autostarting
      autostart: true,
      autostop: true,

      // Reliable Provisional Responses
      rel100: SIPConstants.supported.UNSUPPORTED,

      // DTMF type: 'INFO' or 'RTP' (RFC 4733)
      // RTP Payload Spec: https://tools.ietf.org/html/rfc4733
      // WebRTC Audio Spec: https://tools.ietf.org/html/rfc7874
      dtmfSignaling: DTMFSignaling.INFO,

      // Replaces header (RFC 3891)
      // http://tools.ietf.org/html/rfc3891
      replaces: SIPConstants.supported.UNSUPPORTED,

      sessionDescriptionHandlerFactory: WebSessionDescriptionHandler.defaultFactory,

      authenticationFactory: this.checkAuthenticationFactory((ua: UserAgent) => {
        return new DigestAuthentication(
          ua.getLoggerFactory(), this.configuration.authorizationUser, this.configuration.password
        );
      }),

      allowLegacyNotifications: false,

      allowOutOfDialogRefers: false,

      experimentalFeatures: false
    };

    const configCheck: {mandatory: {[name: string]: any}, optional: {[name: string]: any}} =
      this.getConfigurationCheck();

    // Check Mandatory parameters
    for (const parameter in configCheck.mandatory) {
      if (!configuration.hasOwnProperty(parameter)) {
        throw new Exceptions.ConfigurationError(parameter);
      } else {
        const value: any = (configuration as any)[parameter];
        const checkedValue: any = configCheck.mandatory[parameter](value);
        if (checkedValue !== undefined) {
          settings[parameter] = checkedValue;
        } else {
          throw new Exceptions.ConfigurationError(parameter, value);
        }
      }
    }

    // Check Optional parameters
    for (const parameter in configCheck.optional) {
      if (configuration.hasOwnProperty(parameter)) {
        const value: any = (configuration as any)[parameter];

        // If the parameter value is an empty array, but shouldn't be, apply its default value.
        // If the parameter value is null, empty string, or undefined then apply its default value.
        // If it's a number with NaN value then also apply its default value.
        // NOTE: JS does not allow "value === NaN", the following does the work:
        if ((value instanceof Array && value.length === 0) ||
            (value === null || value === "" || value === undefined) ||
            (typeof(value) === "number" && isNaN(value))) {
          continue;
        }

        const checkedValue: any = configCheck.optional[parameter](value);
        if (checkedValue !== undefined) {
          settings[parameter] = checkedValue;
        } else {
          throw new Exceptions.ConfigurationError(parameter, value);
        }
      }
    }

    // Post Configuration Process

    // Allow passing 0 number as displayName.
    if (settings.displayName === 0) {
      settings.displayName = "0";
    }

    // sipjsId instance parameter. Static random tag of length 5
    settings.sipjsId = Utils.createRandomToken(5);

    // String containing settings.uri without scheme and user.
    const hostportParams: URI = settings.uri.clone();
    hostportParams.user = undefined;
    settings.hostportParams = hostportParams.toRaw().replace(/^sip:/i, "");

    /* Check whether authorizationUser is explicitly defined.
     * Take 'settings.uri.user' value if not.
     */
    if (!settings.authorizationUser) {
      settings.authorizationUser = settings.uri.user;
    }

    // User noAnswerTimeout
    settings.noAnswerTimeout = settings.noAnswerTimeout * 1000;

    // Via Host
    if (settings.hackIpInContact) {
      if (typeof settings.hackIpInContact === "boolean") {
        const from: number = 1;
        const to: number = 254;
        const octet: number = Math.floor(Math.random() * (to - from + 1) + from);
        // random Test-Net IP (http://tools.ietf.org/html/rfc5735)
        settings.viaHost = "192.0.2." + octet;
      } else if (typeof settings.hackIpInContact === "string") {
        settings.viaHost = settings.hackIpInContact;
      }
    }

    // Contact transport parameter
    if (settings.hackWssInTransport) {
      settings.contactTransport = "wss";
    }

    this.contact = {
      pubGruu: undefined,
      tempGruu: undefined,
      uri: new URI("sip", settings.contactName, settings.viaHost, undefined, {transport: settings.contactTransport}),
      toString: (options: any = {}) => {
        const anonymous: boolean = options.anonymous || false;
        const outbound: boolean = options.outbound || false;
        let contact: string = "<";

        if (anonymous) {
          contact += (this.contact.tempGruu ||
            ("sip:anonymous@anonymous.invalid;transport=" + settings.contactTransport)).toString();
        } else {
          contact += (this.contact.pubGruu || this.contact.uri).toString();
        }

        if (outbound) {
          contact += ";ob";
        }

        contact += ">";

        return contact;
      }
    };

    const skeleton: {[key: string]: any} = {};
    // Fill the value of the configuration_skeleton
    for (const parameter in settings) {
      if (settings.hasOwnProperty(parameter)) {
        skeleton[parameter] = settings[parameter];
      }
    }

    Object.assign(this.configuration, skeleton);
    this.logger.log("configuration parameters after validation:");

    for (const parameter in settings) {
      if (settings.hasOwnProperty(parameter)) {

        switch (parameter) {
          case "uri":
          case "sessionDescriptionHandlerFactory":
            this.logger.log("· " + parameter + ": " + settings[parameter]);
            break;
          case "password":
            this.logger.log("· " + parameter + ": " + "NOT SHOWN");
            break;
          case "transportConstructor":
            this.logger.log("· " + parameter + ": " + settings[parameter].name);
            break;
          default:
            this.logger.log("· " + parameter + ": " + JSON.stringify(settings[parameter]));
        }
      }
    }

    return;
  }

  /**
   * Configuration checker.
   */
  private getConfigurationCheck(): {mandatory: {[name: string]: any}, optional: {[name: string]: any}} {
    return {
      mandatory: {
      },

      optional: {

        uri: (uri: string): URI | undefined => {
          if (!(/^sip:/i).test(uri)) {
            uri = SIPConstants.SIP + ":" + uri;
          }
          const parsed: URI | undefined = Grammar.URIParse(uri);

          if (!parsed || !parsed.user) {
            return;
          } else {
            return parsed;
          }
        },

        transportConstructor: (transportConstructor: () => Transport): (() => Transport) | undefined => {
          if (transportConstructor instanceof Function) {
            return transportConstructor;
          }
        },

        transportOptions: (transportOptions: any): any | undefined => {
          if (typeof transportOptions === "object") {
            return transportOptions;
          }
        },

        authorizationUser: (authorizationUser: string): string | undefined => {
          if (Grammar.parse('"' + authorizationUser + '"', "quoted_string") === -1) {
            return;
          } else {
            return authorizationUser;
          }
        },

        displayName: (displayName: string): string | undefined => {
          if (Grammar.parse('"' + displayName + '"', "displayName") === -1) {
            return;
          } else {
            return displayName;
          }
        },

        dtmfSignaling: (dtmfSignaling: DTMFSignaling): DTMFSignaling => {
          switch (dtmfSignaling) {
            case DTMFSignaling.RTP:
              return DTMFSignaling.RTP;
            case DTMFSignaling.INFO:
              return DTMFSignaling.INFO;
            default:
              return DTMFSignaling.INFO;
          }
        },

        hackViaTcp: (hackViaTcp: boolean): boolean | undefined => {
          if (typeof hackViaTcp === "boolean") {
            return hackViaTcp;
          }
        },

        hackIpInContact: (hackIpInContact: boolean): boolean | string | undefined => {
          if (typeof hackIpInContact === "boolean") {
            return hackIpInContact;
          } else if (typeof hackIpInContact === "string" && Grammar.parse(hackIpInContact, "host") !== -1) {
            return hackIpInContact;
          }
        },

        hackWssInTransport: (hackWssInTransport: boolean): boolean | undefined => {
          if (typeof hackWssInTransport === "boolean") {
            return hackWssInTransport;
          }
        },

        hackAllowUnregisteredOptionTags: (hackAllowUnregisteredOptionTags: boolean): boolean | undefined => {
          if (typeof hackAllowUnregisteredOptionTags === "boolean") {
            return hackAllowUnregisteredOptionTags;
          }
        },

        contactTransport: (contactTransport: string): string | undefined => {
          if (typeof contactTransport === "string") {
            return contactTransport;
          }
        },

        extraSupported: (optionTags: Array<string>): Array<string> | undefined => {
          if (!(optionTags instanceof Array)) {
            return;
          }

          for (const tag of optionTags) {
            if (typeof tag !== "string") {
              return;
            }
          }

          return optionTags;
        },

        forceRport: (forceRport: boolean): boolean | undefined => {
          if (typeof forceRport === "boolean") {
            return forceRport;
          }
        },

        noAnswerTimeout: (noAnswerTimeout: string): number | undefined => {
          if (Utils.isDecimal(noAnswerTimeout)) {
            const value: number = Number(noAnswerTimeout);
            if (value > 0) {
              return value;
            }
          }
        },

        password: (password: string): string => {
          return String(password);
        },

        rel100: (rel100: string): string => {
          if (rel100 === SIPConstants.supported.REQUIRED) {
            return SIPConstants.supported.REQUIRED;
          } else if (rel100 === SIPConstants.supported.SUPPORTED) {
            return SIPConstants.supported.SUPPORTED;
          } else  {
            return SIPConstants.supported.UNSUPPORTED;
          }
        },

        replaces: (replaces: string): string => {
          if (replaces === SIPConstants.supported.REQUIRED) {
            return SIPConstants.supported.REQUIRED;
          } else if (replaces === SIPConstants.supported.SUPPORTED) {
            return SIPConstants.supported.SUPPORTED;
          } else  {
            return SIPConstants.supported.UNSUPPORTED;
          }
        },

        register: (register: boolean): boolean | undefined => {
          if (typeof register === "boolean") {
            return register;
          }
        },

        registerOptions: (registerOptions: any): any | undefined => {
          if (typeof registerOptions === "object") {
            return registerOptions;
          }
        },

        usePreloadedRoute: (usePreloadedRoute: boolean): boolean | undefined => {
          if (typeof usePreloadedRoute === "boolean") {
            return usePreloadedRoute;
          }
        },

        userAgentString: (userAgentString: string): string | undefined => {
          if (typeof userAgentString === "string") {
            return userAgentString;
          }
        },

        autostart: (autostart: boolean): boolean | undefined => {
          if (typeof autostart === "boolean") {
            return autostart;
          }
        },

        autostop: (autostop: boolean): boolean | undefined => {
          if (typeof autostop === "boolean") {
            return autostop;
          }
        },

        sessionDescriptionHandlerFactory: (sessionDescriptionHandlerFactory: (() => SessionDescriptionHandler)):
          (() => SessionDescriptionHandler) | undefined => {
          if (sessionDescriptionHandlerFactory instanceof Function) {
            return sessionDescriptionHandlerFactory;
          }
        },

        sessionDescriptionHandlerFactoryOptions: (options: any): any | undefined => {
          if (typeof options === "object") {
            return options;
          }
        },

        authenticationFactory: this.checkAuthenticationFactory,

        allowLegacyNotifications: (allowLegacyNotifications: boolean): boolean | undefined => {
          if (typeof allowLegacyNotifications === "boolean") {
            return allowLegacyNotifications;
          }
        },

        custom: (custom: any): any | undefined => {
          if (typeof custom === "object") {
            return custom;
          }
        },

        contactName: (contactName: string): string | undefined => {
          if (typeof contactName === "string") {
            return contactName;
          }
        },

        experimentalFeatures: (experimentalFeatures: boolean): boolean | undefined => {
          if (typeof experimentalFeatures === "boolean") {
            return experimentalFeatures;
          }
        },
      }
    };
  }
}

/**
 * Factory function to generate configuration give a UA.
 * @param ua - User agent
 * @internal
 */
export function makeUserAgentCoreConfigurationFromUA(ua: UserAgent): UserAgentCoreConfiguration {
  // FIXME: Configuration URI is a bad mix of types currently. It also needs to exist.
  if (!(ua.configuration.uri instanceof URI)) {
    throw new Error("Configuration URI not instance of URI.");
  }
  const aor = ua.configuration.uri;
  const contact = ua.contact;
  const displayName = ua.configuration.displayName ? ua.configuration.displayName : "";
  const hackViaTcp = ua.configuration.hackViaTcp ? true : false;
  const routeSet =
     ua.configuration.usePreloadedRoute && ua.transport.server && ua.transport.server.sipUri ?
      [ua.transport.server.sipUri] :
      [];
  const sipjsId = ua.configuration.sipjsId || Utils.createRandomToken(5);

  let supportedOptionTags: Array<string> = [];
  supportedOptionTags.push("outbound"); // TODO: is this really supported?
  if (ua.configuration.rel100 === SIPConstants.supported.SUPPORTED) {
    supportedOptionTags.push("100rel");
  }
  if (ua.configuration.replaces === SIPConstants.supported.SUPPORTED) {
    supportedOptionTags.push("replaces");
  }
  if (ua.configuration.extraSupported) {
    supportedOptionTags.push(...ua.configuration.extraSupported);
  }
  if (!ua.configuration.hackAllowUnregisteredOptionTags) {
    supportedOptionTags = supportedOptionTags.filter((optionTag) => SIPConstants.OPTION_TAGS[optionTag]);
  }
  supportedOptionTags = Array.from(new Set(supportedOptionTags)); // array of unique values

  const supportedOptionTagsResponse = ua.getSupportedResponseOptions();

  const userAgentHeaderFieldValue = ua.configuration.userAgentString || "sipjs";

  if (!(ua.configuration.viaHost)) {
    throw new Error("Configuration via host undefined");
  }
  const viaForceRport = ua.configuration.forceRport ? true : false;
  const viaHost = ua.configuration.viaHost;

  const configuration: UserAgentCoreConfiguration = {
    aor,
    contact,
    displayName,
    hackViaTcp,
    loggerFactory: ua.getLoggerFactory(),
    routeSet,
    sipjsId,
    supportedOptionTags,
    supportedOptionTagsResponse,
    userAgentHeaderFieldValue,
    viaForceRport,
    viaHost,
    authenticationFactory: () => {
      if (ua.configuration.authenticationFactory) {
        return ua.configuration.authenticationFactory(ua);
      }
      return undefined;
    },
    transportAccessor: () => ua.transport
  };

  return configuration;
}
