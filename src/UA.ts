import { EventEmitter } from "events";

import { Dialog } from "../types/dialogs";
import { Logger } from "../types/logger-factory";
import { PublishContext as PublishContextType } from "../types/publish-context";
import {
  InviteClientContext as InviteClientContextType,
  InviteServerContext as InviteServerContextType
} from "../types/session";
import {
  SessionDescriptionHandler,
  SessionDescriptionHandlerModifiers
} from "../types/session-description-handler";
import {
  IncomingRequest,
  IncomingResponse,
  OutgoingRequest
} from "../types/sip-message";
import { Subscription as SubscriptionType } from "../types/subscription";
import {
  InviteClientTransaction,
  InviteServerTransaction as InviteServerTransactionType,
  NonInviteClientTransaction,
  NonInviteServerTransaction as NonInviteServerTransactionType
} from "../types/transactions";
import { Transport } from "../types/transport";
import { UA as UADefinition } from "../types/ua";
import { URI as URIType } from "../types/uri";

import { ClientContext } from "./ClientContext";
import { C as SIPConstants } from "./Constants";
import { DigestAuthentication } from "./DigestAuthentication";
import { DialogStatus, SessionStatus, TypeStrings, UAStatus } from "./Enums";
import { Exceptions } from "./Exceptions";
import { Grammar } from "./Grammar";
import { Levels, LoggerFactory } from "./LoggerFactory";
import { Parser } from "./Parser";
import { PublishContext } from "./PublishContext";
import { RegisterContext } from "./RegisterContext";
import { SanityCheck } from "./SanityCheck";
import { ServerContext } from "./ServerContext";
import { InviteClientContext, InviteServerContext, ReferServerContext } from "./Session";
import { Subscription } from "./Subscription";
import {
  checkTransaction,
  InviteServerTransaction,
  NonInviteServerTransaction
} from "./Transactions";
import { URI } from "./URI";
import { Utils } from "./Utils";
import {
  SessionDescriptionHandler as WebSessionDescriptionHandler
} from "./Web/SessionDescriptionHandler";
import { Transport as WebTransport } from "./Web/Transport";

const environment = (global as any).window || global;

/**
 * @class Class creating a SIP User Agent.
 * @param {function returning SIP.sessionDescriptionHandler} [configuration.sessionDescriptionHandlerFactory]
 *  A function will be invoked by each of the UA's Sessions to build the sessionDescriptionHandler for that Session.
 *  If no (or a falsy) value is provided, each Session will use a default (WebRTC) sessionDescriptionHandler.
 */

export class UA extends EventEmitter implements UADefinition {
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

  public type: TypeStrings;
  public configuration: UADefinition.Options;
  public applicants: {[id: string]: InviteClientContextType};
  public publishers: {[id: string]: PublishContextType};
  public contact: any | undefined;
  public status: UAStatus;
  public transport: Transport | undefined;
  public transactions: {
    nist: {[id: string]: NonInviteServerTransactionType}
    nict: {[id: string]: NonInviteClientTransaction}
    ist: {[id: string]: InviteServerTransactionType}
    ict: {[id: string]: InviteClientTransaction}
  };
  public sessions: {[id: string]: InviteClientContextType | InviteServerContextType};
  public dialogs: {[id: string]: Dialog};
  public data: any;
  public logger: Logger;
  public earlySubscriptions: {[id: string]: SubscriptionType};
  public subscriptions: {[id: string]: SubscriptionType};

  private log: LoggerFactory;
  private cache: any;
  private error: number | undefined;
  private registerContext: RegisterContext;
  private environListener: any;

  constructor(configuration?: UADefinition.Options) {
    super();
    this.type = TypeStrings.UA;

    this.log = new LoggerFactory();
    this.logger = this.getLogger("sip.ua");

    this.cache = {
      credentials: {}
    };

    this.configuration = {};
    this.dialogs = {};

    // User actions outside any session/dialog (MESSAGE)
    this.applicants = {};

    this.data = {};
    this.sessions = {};
    this.subscriptions = {};
    this.earlySubscriptions = {};
    this.publishers = {};
    this.status = UAStatus.STATUS_INIT;
    this.transactions = {
      nist: {},
      nict: {},
      ist: {},
      ict: {}
    };

    /**
     * Load configuration
     *
     * @throws {SIP.Exceptions.ConfigurationError}
     * @throws {TypeError}
     */

    if (configuration === undefined) {
      configuration = {};
    } else if (typeof configuration === "string" || configuration instanceof String) {
      configuration = {
        uri: (configuration as string)
      };
    }

    // Apply log configuration if present
    if (configuration.log) {
      if (configuration.log.hasOwnProperty("builtinEnabled")) {
        this.log.builtinEnabled = configuration.log.builtinEnabled;
      }

      if (configuration.log.hasOwnProperty("level")) {
        const level = configuration.log.level;
        const normalized: Levels = typeof level === "string" ? Levels[level] : level;

        // avoid setting level when invalid, use default level instead
        if (!normalized) {
          this.logger.error(`Invalid "level" parameter value: ${JSON.stringify(level)}`);
        } else {
          this.log.level = normalized;
        }
      }

      if (configuration.log.hasOwnProperty("connector")) {
        this.log.connector = configuration.log.connector;
      }
    }

    try {
      this.loadConfig(configuration);
    } catch (e) {
      this.status = UAStatus.STATUS_NOT_READY;
      this.error = UA.C.CONFIGURATION_ERROR;
      throw e;
    }

    // Initialize registerContext
    this.registerContext = new RegisterContext(this, configuration.registerOptions);
    this.registerContext.on("failed", this.emit.bind(this, "registrationFailed"));
    this.registerContext.on("registered", this.emit.bind(this, "registered"));
    this.registerContext.on("unregistered", this.emit.bind(this, "unregistered"));

    if (this.configuration.autostart) {
      this.start();
    }
  }

  get transactionsCount(): number {
    let count: number = 0;

    for (const type of ["nist", "nict" , "ist", "ict"]) {
      count += Object.keys(this.transactions[type]).length;
    }
    return count;
  }

  get nictTransactionsCount(): number {
    return Object.keys(this.transactions.nict).length;
  }

  get nistTransactionsCount(): number {
    return Object.keys(this.transactions.nist).length;
  }

  get ictTransactionsCount(): number {
    return Object.keys(this.transactions.ict).length;
  }

  get istTransactionsCount(): number {
    return Object.keys(this.transactions.ist).length;
  }

  // =================
  //  High Level API
  // =================

  public register(options: any = {}): this {
    if (options.register) {
      this.configuration.register = true;
    }
    this.registerContext.register(options);

    return this;
  }

  /**
   * Unregister.
   *
   * @param {Boolean} [all] unregister all user bindings.
   *
   */
  public unregister(options?: any): this {
    this.configuration.register = false;

    if (this.transport) {
      this.transport.afterConnected(() => {
        this.registerContext.unregister(options);
      });
    }

    return this;
  }

  public isRegistered(): boolean {
    return this.registerContext.registered;
  }

  /**
   * Make an outgoing call.
   *
   * @param {String} target
   * @param {Object} views
   * @param {Object} [options.media] gets passed to SIP.sessionDescriptionHandler.getDescription as mediaHint
   *
   * @throws {TypeError}
   *
   */
  public invite(
    target: string | URIType,
    options?: InviteClientContextType.Options,
    modifiers?: SessionDescriptionHandlerModifiers
  ): InviteClientContextType {
    const context: InviteClientContextType = new InviteClientContext(this, target, options, modifiers);
    // Delay sending actual invite until the next 'tick' if we are already
    // connected, so that API consumers can register to events fired by the
    // the session.
    if (this.transport) {
      this.transport.afterConnected(() => {
        context.invite();
        this.emit("inviteSent", context);
      });
    }
    return context;
  }

  public subscribe(target: string | URI, event: string, options: any): SubscriptionType {
    const sub: SubscriptionType = new Subscription(this, target, event, options);

    if (this.transport) {
      this.transport.afterConnected(() => sub.subscribe());
    }
    return sub;
  }

  /**
   * Send PUBLISH Event State Publication (RFC3903)
   *
   * @param {String} target
   * @param {String} event
   * @param {String} body
   * @param {Object} [options]
   *
   * @throws {SIP.Exceptions.MethodParameterError}
   */
  public publish(target: string | URI, event: string, body: string, options: any): PublishContextType {
    const pub: PublishContextType = new PublishContext(this, target, event, options);

    if (this.transport) {
      this.transport.afterConnected(() => {
        pub.publish(body);
      });
    }
    return pub;
  }

  /**
   * Send a message.
   *
   * @param {String} target
   * @param {String} body
   * @param {Object} [options]
   *
   * @throws {TypeError}
   */
  public message(target: string | URI, body: string, options: any = {}): ClientContext {
    if (body === undefined) {
      throw new TypeError("Not enough arguments");
    }

    // There is no Message module, so it is okay that the UA handles defaults here.
    options.contentType = options.contentType || "text/plain";
    options.body = body;

    return this.request(SIPConstants.MESSAGE, target, options);
  }

  public request(method: string, target: string | URI, options?: any): ClientContext {
    const req: ClientContext = new ClientContext(this, method, target, options);

    if (this.transport) {
      this.transport.afterConnected(() => req.send());
    }
    return req;
  }

  /**
   * Gracefully close.
   */
  public stop(): this {
    this.logger.log("user requested closure...");

    if (this.status === UAStatus.STATUS_USER_CLOSED) {
      this.logger.warn("UA already closed");
      return this;
    }

    // Close registerContext
    this.logger.log("closing registerContext");
    this.registerContext.close();

    // Run  _terminate_ on every Session
    for (const session in this.sessions) {
      if (this.sessions[session]) {
        this.logger.log("closing session " + session);
        this.sessions[session].terminate();
      }
    }

    // Run _close_ on every confirmed Subscription
    for (const subscription in this.subscriptions) {
      if (this.subscriptions[subscription]) {
        this.logger.log("unsubscribing from subscription " + subscription);
        this.subscriptions[subscription].close();
      }
    }

    // Run _close_ on every early Subscription
    for (const earlySubscription in this.earlySubscriptions) {
      if (this.earlySubscriptions[earlySubscription]) {
        this.logger.log("unsubscribing from early subscription " + earlySubscription);
        this.earlySubscriptions[earlySubscription].close();
      }
    }

    // Run _close_ on every Publisher
    for (const publisher in this.publishers) {
      if (this.publishers[publisher]) {
        this.logger.log("unpublish " + publisher);
        this.publishers[publisher].close();
      }
    }

    // Run  _close_ on every applicant
    for (const applicant in this.applicants) {
      if (this.applicants[applicant]) {
        this.applicants[applicant].close();
      }
    }

    this.status = UAStatus.STATUS_USER_CLOSED;

    /*
     * If the remaining transactions are all INVITE transactions, there is no need to
     * wait anymore because every session has already been closed by this method.
     * - locally originated sessions where terminated (CANCEL or BYE)
     * - remotely originated sessions where rejected (4XX) or terminated (BYE)
     * Remaining INVITE transactions belong tho sessions that where answered. This are in
     * 'accepted' state due to timers 'L' and 'M' defined in [RFC 6026]
     */
    if (this.nistTransactionsCount === 0 && this.nictTransactionsCount === 0 && this.transport) {
      this.transport.disconnect();
    } else {
      const transactionsListener: (() => void) = () => {
        if (this.nistTransactionsCount === 0 && this.nictTransactionsCount === 0) {
            this.removeListener("transactionDestroyed", transactionsListener);
            if (this.transport) {
              this.transport.disconnect();
            }
        }
      };

      this.on("transactionDestroyed", transactionsListener);
    }

    if (typeof environment.removeEventListener === "function") {
      // Google Chrome Packaged Apps don't allow 'unload' listeners:
      // unload is not available in packaged apps
      if (!((global as any).chrome && (global as any).chrome.app && (global as any).chrome.app.runtime)) {
        environment.removeEventListener("unload", this.environListener);
      }
    }

    return this;
  }

  /**
   * Connect to the WS server if status = STATUS_INIT.
   * Resume UA after being closed.
   *
   */
  public start(): this {
    this.logger.log("user requested startup...");
    if (this.status === UAStatus.STATUS_INIT) {
      this.status = UAStatus.STATUS_STARTING;
      if (!this.configuration.transportConstructor) {
        throw new Exceptions.TransportError("Transport constructor not set");
      }
      this.transport = new this.configuration.transportConstructor(
        this.getLogger("sip.transport"),
        this.configuration.transportOptions
      );
      this.setTransportListeners();
      this.emit("transportCreated", this.transport);
      this.transport.connect();

    } else if (this.status === UAStatus.STATUS_USER_CLOSED) {
      this.logger.log("resuming");
      this.status = UAStatus.STATUS_READY;
      if (this.transport) {
        this.transport.connect();
      }

    } else if (this.status === UAStatus.STATUS_STARTING) {
      this.logger.log("UA is in STARTING status, not opening new connection");
    } else if (this.status === UAStatus.STATUS_READY) {
      this.logger.log("UA is in READY status, not resuming");
    } else {
      this.logger.error("Connection is down. Auto-Recovery system is trying to connect");
    }

    if (this.configuration.autostop && typeof environment.addEventListener === "function") {
      // Google Chrome Packaged Apps don't allow 'unload' listeners:
      // unload is not available in packaged apps
      if (!((global as any).chrome && (global as any).chrome.app && (global as any).chrome.app.runtime)) {
        this.environListener = this.stop;
        environment.addEventListener("unload", () => this.environListener());
      }
    }

    return this;
  }

  /**
   * Normalize a string into a valid SIP request URI
   *
   * @param {String} target
   *
   * @returns {SIP.URI|undefined}
   */
  public normalizeTarget(target: string | URIType): URIType | undefined {
    return Utils.normalizeTarget(target, this.configuration.hostportParams);
  }

  public getLogger(category: string, label?: string): Logger {
    return this.log.getLogger(category, label);
  }

  /**
   * new Transaction
   * @private
   * @param {SIP.Transaction} transaction.
   */
  public newTransaction(
    transaction: NonInviteClientTransaction |
      InviteClientTransaction |
      InviteServerTransaction |
      NonInviteServerTransaction
  ): void {
    this.transactions[transaction.kind][transaction.id] = transaction;
    this.emit("newTransaction", { transaction });
  }

  /**
   * destroy Transaction
   * @param {SIP.Transaction} transaction.
   */
  public destroyTransaction(
    transaction: NonInviteClientTransaction |
      InviteClientTransaction |
      InviteServerTransaction |
      NonInviteServerTransaction): void {
    delete this.transactions[transaction.kind][transaction.id];
    this.emit("transactionDestroyed", { transaction });
  }

  /**
   * Get the session to which the request belongs to, if any.
   * @param {SIP.IncomingRequest} request.
   * @returns {SIP.OutgoingSession|SIP.IncomingSession|undefined}
   */
  public findSession(request: IncomingRequest): InviteClientContextType | InviteServerContextType | undefined {
    return this.sessions[request.callId + request.fromTag] ||
      this.sessions[request.callId + request.toTag] ||
      undefined;
  }

  // ===============================
  //  Private (For internal use)
  // ===============================

  private saveCredentials(credentials: any): this {
    this.cache.credentials[credentials.realm] = this.cache.credentials[credentials.realm] || {};
    this.cache.credentials[credentials.realm][credentials.uri] = credentials;

    return this;
  }

  private getCredentials(request: OutgoingRequest): any {
    const realm: string | undefined =
      (request.ruri as URIType).type === TypeStrings.URI ? (request.ruri as URIType).host : "";

    if (realm && this.cache.credentials[realm] && this.cache.credentials[realm][request.ruri.toString()]) {
      const credentials: any = this.cache.credentials[realm][request.ruri.toString()];
      credentials.method = request.method;

      return credentials;
    }
  }

  // ==============================
  // Event Handlers
  // ==============================

  private onTransportError(): void {
    if (this.status === UAStatus.STATUS_USER_CLOSED) {
      return;
    }

    if (!this.error || this.error !== UA.C.NETWORK_ERROR) {
      this.status = UAStatus.STATUS_NOT_READY;
      this.error = UA.C.NETWORK_ERROR;
    }
  }

  /**
   * Helper function. Sets transport listeners
   */
  private setTransportListeners(): void {
    if (this.transport) {
      this.transport.on("connected", () => this.onTransportConnected());
      this.transport.on("message", (message: string) => this.onTransportReceiveMsg(message));
      this.transport.on("transportError", () => this.onTransportError());
    }
  }

  /**
   * Transport connection event.
   * @event
   * @param {SIP.Transport} transport.
   */
  private onTransportConnected(): void {
    if (this.configuration.register) {
      // In an effor to maintain behavior from when we "initialized" an
      // authentication factory, this is in a Promise.then
      Promise.resolve().then(() => this.registerContext.register());
    }
  }

  /**
   * Transport message receipt event.
   * @event
   * @param {String} message
   */

  private onTransportReceiveMsg(messageString: string): void {
    const message: IncomingRequest | IncomingResponse | undefined = Parser.parseMessage(messageString, this);

    if (this.status === UAStatus.STATUS_USER_CLOSED && message && message.type === TypeStrings.IncomingRequest) {
      this.logger.warn("UA received message when status = USER_CLOSED - aborting");
      return;
    }
    // Do some sanity check
    if (message && this.transport && SanityCheck.sanityCheck(message, this, this.transport)) {
      if (message.type === TypeStrings.IncomingRequest) {
        (message as IncomingRequest).transport = this.transport;
        this.receiveRequest(message as IncomingRequest);
      } else if (message.type === TypeStrings.IncomingResponse) {
        /* Unlike stated in 18.1.2, if a response does not match
         * any transaction, it is discarded here and no passed to the core
         * in order to be discarded there.
         */
        switch (message.method) {
          case SIPConstants.INVITE:
            const icTransaction: InviteClientTransaction | undefined = this.transactions.ict[message.viaBranch];
            if (icTransaction) {
              icTransaction.receiveResponse(message as IncomingResponse);
            }
            break;
          case SIPConstants.ACK:
            // Just in case ;-)
            break;
          default:
            const nicTransaction: NonInviteClientTransaction | undefined = this.transactions.nict[message.viaBranch];
            if (nicTransaction) {
              nicTransaction.receiveResponse(message as IncomingResponse);
            }
            break;
        }
      }
    }
  }

  /**
   * Request reception
   * @private
   * @param {SIP.IncomingRequest} request.
   */
  private receiveRequest(request: IncomingRequest): void {
    const ruriMatches: ((uri: URIType | undefined) => boolean) = (uri: URIType | undefined) => {
      return !!uri && !!request.ruri && uri.user === request.ruri.user;
    };

    // Check that request URI points to us
    if ((this.configuration.uri as URIType).type === TypeStrings.URI &&
      !(ruriMatches(this.configuration.uri as URIType) ||
        (this.contact && (
          ruriMatches(this.contact.uri) ||
          ruriMatches(this.contact.pubGruu) ||
          ruriMatches(this.contact.tempGruu))))) {
      this.logger.warn("Request-URI does not point to us");
      if (request.method !== SIPConstants.ACK) {
        request.reply_sl(404);
      }
      return;
    }

    // Check request URI scheme
    if (!!request.ruri && request.ruri.scheme === SIPConstants.SIPS) {
      request.reply_sl(416);
      return;
    }

    // Check transaction
    if (this.checkTransaction(request)) {
      return;
    }

    /* RFC3261 12.2.2
    * Requests that do not change in any way the state of a dialog may be
    * received within a dialog (for example, an OPTIONS request).
    * They are processed as if they had been received outside the dialog.
    */
    const method: string = request.method;
    let message: ServerContext;
    if (method === SIPConstants.OPTIONS) {
      const nonInviteTr: NonInviteServerTransaction = new NonInviteServerTransaction(request, this);
      request.reply(200, undefined, [
        "Allow: " + UA.C.ALLOWED_METHODS.toString(),
        "Accept: " + UA.C.ACCEPTED_BODY_TYPES.toString()
      ]);
    } else if (method === SIPConstants.MESSAGE) {
      message = new ServerContext(this, request);
      message.body = request.body;
      message.contentType = request.getHeader("Content-Type") || "text/plain";

      request.reply(200, undefined);
      this.emit("message", message);
    } else if (method !== SIPConstants.INVITE &&
               method !== SIPConstants.ACK) {
      // Let those methods pass through to normal processing for now.
      message = new ServerContext(this, request);
    }

    // Initial Request
    if (!request.toTag) {
      switch (method) {
        case SIPConstants.INVITE:
          const replaces: any = this.configuration.replaces !== SIPConstants.supported.UNSUPPORTED &&
            request.parseHeader("replaces");

          let replacedDialog: Dialog | undefined;
          if (replaces) {
            replacedDialog = this.dialogs[replaces.call_id + replaces.replaces_to_tag + replaces.replaces_from_tag];

            if (!replacedDialog) {
              // Replaced header without a matching dialog, reject
              request.reply_sl(481, undefined);
              return;
            } else if (!(replacedDialog.owner.type === TypeStrings.Subscription) &&
              (replacedDialog.owner as InviteClientContextType | InviteServerContextType).status
                === SessionStatus.STATUS_TERMINATED) {
              request.reply_sl(603, undefined);
              return;
            } else if (replacedDialog.state === DialogStatus.STATUS_CONFIRMED && replaces.earlyOnly) {
              request.reply_sl(486, undefined);
              return;
            }
          }

          const newSession: InviteServerContextType = new InviteServerContext(this, request);
          if (replacedDialog && !(replacedDialog.owner.type === TypeStrings.Subscription)) {
            newSession.replacee = replacedDialog && (replacedDialog.owner as InviteClientContext | InviteServerContext);
          }
          this.emit("invite", newSession);
          break;
        case SIPConstants.BYE:
          // Out of dialog BYE received
          request.reply(481);
          break;
        case SIPConstants.CANCEL:
          const session: InviteClientContextType | InviteServerContextType | undefined = this.findSession(request);
          if (session) {
            session.receiveRequest(request);
          } else {
            this.logger.warn("received CANCEL request for a non existent session");
          }
          break;
        case SIPConstants.ACK:
          /* Absorb it.
          * ACK request without a corresponding Invite Transaction
          * and without To tag.
          */
          break;
        case SIPConstants.NOTIFY:
          if (this.configuration.allowLegacyNotifications && this.listeners("notify").length > 0) {
            request.reply(200, undefined);
            this.emit("notify", { request });
          } else {
            request.reply(481, "Subscription does not exist");
          }
          break;
        case SIPConstants.REFER:
          this.logger.log("Received an out of dialog refer");
          if (this.configuration.allowOutOfDialogRefers) {
            this.logger.log("Allow out of dialog refers is enabled on the UA");
            const referContext: ReferServerContext = new ReferServerContext(this, request);
            if (this.listeners("outOfDialogReferRequested").length) {
              this.emit("outOfDialogReferRequested", referContext);
            } else {
              this.logger.log("No outOfDialogReferRequest listeners," +
                " automatically accepting and following the out of dialog refer");
              referContext.accept({followRefer: true});
            }
            break;
          }
          request.reply(405);
          break;
        default:
          request.reply(405);
          break;
      }
    } else { // In-dialog request
      const dialog: Dialog | undefined = this.findDialog(request);

      if (dialog) {
        if (method === SIPConstants.INVITE) {
          const unusedIST: InviteServerTransaction = new InviteServerTransaction(request, this);
        }
        dialog.receiveRequest(request);
      } else if (method === SIPConstants.NOTIFY) {
        const session: InviteClientContextType | InviteServerContextType | undefined = this.findSession(request);
        const earlySubscription: SubscriptionType | undefined = this.findEarlySubscription(request);

        if (session) {
          session.receiveRequest(request);
        } else if (earlySubscription) {
          earlySubscription.receiveRequest(request);
        } else {
          this.logger.warn("received NOTIFY request for a non existent session or subscription");
          request.reply(481, "Subscription does not exist");
        }
      } else {
        /* RFC3261 12.2.2
         * Request with to tag, but no matching dialog found.
         * Exception: ACK for an Invite request for which a dialog has not
         * been created.
         */
        if (method !== SIPConstants.ACK) {
          request.reply(481);
        }
      }
    }
  }

// =================
// Utils
// =================

private checkTransaction(request: IncomingRequest): boolean {
  return checkTransaction(this, request);
}

/**
 * Get the dialog to which the request belongs to, if any.
 * @param {SIP.IncomingRequest}
 * @returns {SIP.Dialog|undefined}
 */
  private findDialog(request: IncomingRequest): Dialog | undefined {
    return this.dialogs[request.callId + request.fromTag + request.toTag] ||
      this.dialogs[request.callId + request.toTag + request.fromTag] ||
      undefined;
  }

/**
 * Get the subscription which has not been confirmed to which the request belongs to, if any
 * @param {SIP.IncomingRequest}
 * @returns {SIP.Subscription|undefined}
 */
  private findEarlySubscription(request: IncomingRequest): SubscriptionType | undefined {
    return this.earlySubscriptions[request.callId + request.toTag + request.getHeader("event")] || undefined;
  }

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
   * returns {void}
   */
  private loadConfig(configuration: UADefinition.Options): void {
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

      // DTMF type: 'info' or 'rtp' (RFC 4733)
      // RTP Payload Spec: https://tools.ietf.org/html/rfc4733
      // WebRTC Audio Spec: https://tools.ietf.org/html/rfc7874
      dtmfType: SIPConstants.dtmfType.INFO,

      // Replaces header (RFC 3891)
      // http://tools.ietf.org/html/rfc3891
      replaces: SIPConstants.supported.UNSUPPORTED,

      sessionDescriptionHandlerFactory: WebSessionDescriptionHandler.defaultFactory,

      authenticationFactory: this.checkAuthenticationFactory((ua: UA) => {
        return new DigestAuthentication(ua);
      }),

      allowLegacyNotifications: false,

      allowOutOfDialogRefers: false,
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
    const hostportParams: URIType = settings.uri.clone();
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
   * @return {Boolean}
   */
  private getConfigurationCheck(): {mandatory: {[name: string]: any}, optional: {[name: string]: any}} {
    return {
      mandatory: {
      },

      optional: {

        uri: (uri: string): URIType | undefined => {
          if (!(/^sip:/i).test(uri)) {
            uri = SIPConstants.SIP + ":" + uri;
          }
          const parsed: URIType | undefined = Grammar.URIParse(uri);

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

        dtmfType: (dtmfType: string): string => {
          switch (dtmfType) {
            case SIPConstants.dtmfType.RTP:
              return SIPConstants.dtmfType.RTP;
            case SIPConstants.dtmfType.INFO:
              // Fall through
            default:
              return SIPConstants.dtmfType.INFO;
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
      }
    };
  }
}
