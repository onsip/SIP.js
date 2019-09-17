import { EventEmitter } from "events";

import { C } from "../Constants";
import {
  Grammar,
  Logger,
  OutgoingRegisterRequest,
  OutgoingRequestMessage,
  URI
} from "../core";
import { Exceptions } from "../Exceptions";
import { Utils } from "../Utils";

import { Emitter, makeEmitter } from "./emitter";
import { RegistererOptions } from "./registerer-options";
import { RegistererRegisterOptions } from "./registerer-register-options";
import { RegistererState } from "./registerer-state";
import { RegistererUnregisterOptions } from "./registerer-unregister-options";
import { UserAgent } from "./user-agent";

/**
 * @internal
 */
function loadConfig(configuration: RegistererOptions): any {
  const settings = {
    expires: 600,
    extraContactHeaderParams: [],
    instanceId: undefined,
    params: {},
    regId: undefined,
    registrar: undefined,
  };

  const configCheck = getConfigurationCheck();

  // Check Mandatory parameters
  for (const parameter in configCheck.mandatory) {
    if (!configuration.hasOwnProperty(parameter)) {
      throw new Exceptions.ConfigurationError(parameter);
    } else {
      const value = (configuration as any)[parameter];
      const checkedValue = configCheck.mandatory[parameter](value);
      if (checkedValue !== undefined) {
        (settings as any)[parameter] = checkedValue;
      } else {
        throw new Exceptions.ConfigurationError(parameter, value);
      }
    }
  }

  // Check Optional parameters
  for (const parameter in configCheck.optional) {
    if (configuration.hasOwnProperty(parameter)) {
      const value = (configuration as any)[parameter];

      // If the parameter value is an empty array, but shouldn't be, apply its default value.
      if (value instanceof Array && value.length === 0) { continue; }

      // If the parameter value is null, empty string, or undefined then apply its default value.
      // If it's a number with NaN value then also apply its default value.
      // NOTE: JS does not allow "value === NaN", the following does the work:
      if (value === null || value === "" || value === undefined ||
        (typeof(value) === "number" && isNaN(value))) {
        continue;
      }

      const checkedValue = configCheck.optional[parameter](value);
      if (checkedValue !== undefined) {
        (settings as any)[parameter] = checkedValue;
      } else {
        throw new Exceptions.ConfigurationError(parameter, value);
      }
    }
  }

  return settings;
}

/**
 * @internal
 */
function getConfigurationCheck(): any {
  return {
    mandatory: {
    },

    optional: {
      expires: (expires: string): number | undefined => {
        if (Utils.isDecimal(expires)) {
          const value = Number(expires);
          if (value >= 0) {
            return value;
          }
        }
      },
      extraContactHeaderParams: (extraContactHeaderParams: Array<string>): Array<string> | undefined => {
        if (extraContactHeaderParams instanceof Array) {
          return extraContactHeaderParams.filter((contactHeaderParam) => (typeof contactHeaderParam === "string"));
        }
      },
      instanceId: (instanceId: string): string | undefined => {
        if (typeof instanceId !== "string") {
          return;
        }

        if ((/^uuid:/i.test(instanceId))) {
          instanceId = instanceId.substr(5);
        }

        if (Grammar.parse(instanceId, "uuid") === -1) {
          return;
        } else {
          return instanceId;
        }
      },
      params: (params: any): any | undefined => {
        if (typeof params === "object") {
          return params;
        }
      },
      regId: (regId: string): number | undefined => {
        if (Utils.isDecimal(regId)) {
          const value = Number(regId);
          if (value >= 0) {
            return value;
          }
        }
      },
      registrar: (registrar: string): URI | undefined => {
        if (typeof registrar !== "string") {
          return;
        }

        if (!/^sip:/i.test(registrar)) {
          registrar = C.SIP + ":" + registrar;
        }
        const parsed = Grammar.URIParse(registrar);

        if (!parsed) {
          return;
        } else if (parsed.user) {
          return;
        } else {
          return parsed;
        }
      }
    }
  };
}

/**
 * A registerer registers a contact for an address of record (outgoing REGISTER).
 * @public
 */
export class Registerer {
  private id: string;

  private contact: string;
  private expires: number;
  private logger: Logger;
  private options: RegistererOptions;
  private request: OutgoingRequestMessage;
  private userAgent: UserAgent;

  private registrationExpiredTimer: any | undefined;
  private registrationTimer: any | undefined;

  /** The contacts returned from the most recent accepted REGISTER request. */
  private _contacts: Array<string> = [];

  /** The registration state. */
  private _state: RegistererState = RegistererState.Initial;
  /** Emits when the registration state changes. */
  private _stateEventEmitter = new EventEmitter();

  /** True is waiting for final response to outstanding REGISTER request. */
  private _waiting = false;
  /** Emits when waiting changes. */
  private _waitingEventEmitter = new EventEmitter();

  /**
   * Constructs a new instance of the `Registerer` class.
   * @param userAgent - User agent. See {@link UserAgent} for details.
   * @param options - Options bucket. See {@link RegistererOptions} for details.
   */
  constructor(userAgent: UserAgent, options: RegistererOptions = {}) {
    const settings: any = loadConfig(options);

    if (settings.regId && !settings.instanceId) {
      settings.instanceId = Utils.newUUID();
    } else if (!settings.regId && settings.instanceId) {
      settings.regId = 1;
    }

    settings.params.toUri = settings.params.toUri || userAgent.configuration.uri;
    settings.params.toDisplayName = settings.params.toDisplayName || userAgent.configuration.displayName;
    settings.params.callId = settings.params.callId || Utils.createRandomToken(22);
    settings.params.cseq = settings.params.cseq || Math.floor(Math.random() * 10000);

    /* If no 'registrarServer' is set use the 'uri' value without user portion. */
    if (!settings.registrar) {
      let registrarServer: any = {};
      if (typeof userAgent.configuration.uri === "object") {
        registrarServer = userAgent.configuration.uri.clone();
        registrarServer.user = undefined;
      } else {
        registrarServer = userAgent.configuration.uri;
      }
      settings.registrar = registrarServer;
    }

    this.userAgent = userAgent;
    this.logger = userAgent.getLogger("sip.registerer");

    const extraHeaders = (options.extraHeaders || []).slice();

    // Build the request
    this.request = userAgent.userAgentCore.makeOutgoingRequestMessage(
      C.REGISTER,
      settings.registrar,
      settings.params.fromUri ? settings.params.fromUri : userAgent.userAgentCore.configuration.aor,
      settings.params.toUri ? settings.params.toUri : settings.registrar,
      settings.params,
      extraHeaders,
      undefined
    );

    this.options = settings;

    this.logger.log("configuration parameters for RegisterContext after validation:");
    for (const parameter in settings) {
      if (settings.hasOwnProperty(parameter)) {
        this.logger.log("· " + parameter + ": " + JSON.stringify((settings as any)[parameter]));
      }
    }

    // Registration expires
    this.expires = settings.expires;

    // Contact header
    this.contact = userAgent.contact.toString();

    userAgent.transport.on("disconnected", () => this.onTransportDisconnected());

    // Add to UA's collection
    this.id = this.request.callId + this.request.from.parameters.tag;
    this.userAgent.registerers[this.id] = this;
  }

  /** The registered contacts. */
  get contacts(): Array<string> {
    return this._contacts.slice();
  }

  /** The registration state. */
  get state(): RegistererState {
    return this._state;
  }

  /** Emits when the registerer state changes. */
  get stateChange(): Emitter<RegistererState> {
    return makeEmitter(this._stateEventEmitter);
  }

  /** Destructor. */
  public async dispose(): Promise<void> {
    // Remove from UA's collection
    delete this.userAgent.registerers[this.id];

    // If registered, unregisters and resolves after final response received.
    return new Promise((resolve, reject) => {
      const doClose = () => {
        // If we are registered, unregister and resolve after our state changes
        if (!this.waiting && this._state === RegistererState.Registered) {
          this.stateChange.once(() => resolve());
          this.unregister();
          return;
        }
        // Otherwise just resolve
        resolve();
      };

      // If we are waiting for an outstanding request, wait for it to finish and then try closing.
      // Otherwise just try closing.
      if (this.waiting) {
        this.waitingChange.once(() => doClose());
      } else {
        doClose();
      }
    });
  }

  /**
   * Sends the REGISTER request.
   * @remarks
   * If successfull, sends re-REGISTER requests prior to registration expiration until `unsubscribe()` is called.
   */
  public async register(options: RegistererRegisterOptions = {}): Promise<OutgoingRegisterRequest> {
    // UAs MUST NOT send a new registration (that is, containing new Contact
    // header field values, as opposed to a retransmission) until they have
    // received a final response from the registrar for the previous one or
    // the previous REGISTER request has timed out.
    // https://tools.ietf.org/html/rfc3261#section-10.2
    if (this.waiting) {
      const error = new Error("REGISTER request already in progress, waiting for final response");
      return Promise.reject(error);
    }

    // Options
    if (options.requestOptions) {
      this.options = {...this.options, ...options.requestOptions};
    }

    // Extra headers
    const extraHeaders = (this.options.extraHeaders || []).slice();
    extraHeaders.push("Contact: " + this.generateContactHeader(this.expires));
    // this is UA.C.ALLOWED_METHODS, removed to get around circular dependency
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

    // Call-ID: All registrations from a UAC SHOULD use the same Call-ID
    // header field value for registrations sent to a particular
    // registrar.
    //
    // CSeq: The CSeq value guarantees proper ordering of REGISTER
    // requests.  A UA MUST increment the CSeq value by one for each
    // REGISTER request with the same Call-ID.
    // https://tools.ietf.org/html/rfc3261#section-10.2
    this.request.cseq++;
    this.request.setHeader("cseq", this.request.cseq + " REGISTER");
    this.request.extraHeaders = extraHeaders;

    this.waitingToggle(true);

    const outgoingRegisterRequest = this.userAgent.userAgentCore.register(this.request, {
      onAccept: (response): void => {
        let expires: number | undefined;

        // FIXME: This does NOT appear to be to spec and should be removed.
        // I haven't found anywhere that an Expires header may be used in a response.
        if (response.message.hasHeader("expires")) {
          expires = Number(response.message.getHeader("expires"));
        }

        // 8. The registrar returns a 200 (OK) response.  The response MUST
        // contain Contact header field values enumerating all current
        // bindings.  Each Contact value MUST feature an "expires"
        // parameter indicating its expiration interval chosen by the
        // registrar.  The response SHOULD include a Date header field.
        // https://tools.ietf.org/html/rfc3261#section-10.3
        this._contacts = response.message.getHeaders("contact");
        let contacts = this._contacts.length;
        if (!contacts) {
          this.logger.error("No Contact header in response to REGISTER, dropping response.");
          this.unregistered();
          return;
        }

        // The 200 (OK) response from the registrar contains a list of Contact
        // fields enumerating all current bindings.  The UA compares each
        // contact address to see if it created the contact address, using
        // comparison rules in Section 19.1.4.  If so, it updates the expiration
        // time interval according to the expires parameter or, if absent, the
        // Expires field value.  The UA then issues a REGISTER request for each
        // of its bindings before the expiration interval has elapsed.
        // https://tools.ietf.org/html/rfc3261#section-10.2.4
        let contact: any;
        while (contacts--) {
          contact = response.message.parseHeader("contact", contacts);
          if (contact.uri.user === this.userAgent.contact.uri.user) {
            expires = contact.getParam("expires");
            break;
          } else {
            contact = undefined;
          }
        }

        // There must be a matching contact.
        if (contact === undefined) {
          this.logger.error("No Contact header pointing to us, dropping response");
          this.unregistered();
          this.waitingToggle(false);
          return;
        }

        // The contact must have an expires.
        if (expires === undefined) {
          this.logger.error("Contact pointing to us is missing expires parameter, dropping response");
          this.unregistered();
          this.waitingToggle(false);
          return;
        }

        // Save gruu values
        if (contact.hasParam("temp-gruu")) {
          this.userAgent.contact.tempGruu = Grammar.URIParse(contact.getParam("temp-gruu").replace(/"/g, ""));
        }
        if (contact.hasParam("pub-gruu")) {
          this.userAgent.contact.pubGruu = Grammar.URIParse(contact.getParam("pub-gruu").replace(/"/g, ""));
        }

        this.registered(expires);
        this.waitingToggle(false);
      },
      onProgress: (response): void => {
        return;
      },
      onRedirect: (response): void => {
        this.logger.error("Redirect received. Not supported.");
        this.unregistered();
        this.waitingToggle(false);
      },
      onReject: (response): void => {
        if (response.message.statusCode === 423) {
          // If a UA receives a 423 (Interval Too Brief) response, it MAY retry
          // the registration after making the expiration interval of all contact
          // addresses in the REGISTER request equal to or greater than the
          // expiration interval within the Min-Expires header field of the 423
          // (Interval Too Brief) response.
          // https://tools.ietf.org/html/rfc3261#section-10.2.8
          //
          // The registrar MAY choose an expiration less than the requested
          // expiration interval.  If and only if the requested expiration
          // interval is greater than zero AND smaller than one hour AND
          // less than a registrar-configured minimum, the registrar MAY
          // reject the registration with a response of 423 (Interval Too
          // Brief).  This response MUST contain a Min-Expires header field
          // that states the minimum expiration interval the registrar is
          // willing to honor.  It then skips the remaining steps.
          // https://tools.ietf.org/html/rfc3261#section-10.3
          if (!response.message.hasHeader("min-expires")) {
            // This response MUST contain a Min-Expires header field
            this.logger.error("423 response received for REGISTER without Min-Expires");
            this.unregistered();
            this.waitingToggle(false);
            return;
          }
          // Increase our registration interval to the suggested minimum
          this.expires = Number(response.message.getHeader("min-expires"));
          // Attempt the registration again immediately
          this.waitingToggle(false);
          this.register();
          return;
        }
        this.logger.warn(`Failed to register, status code ${response.message.statusCode}`);
        this.unregistered();
        this.waitingToggle(false);
      },
      onTrying: (response): void => {
        return;
      }
    });

    return Promise.resolve(outgoingRegisterRequest);
  }

  /**
   * Sends the REGISTER request with expires equal to zero.
   */
  public async unregister(options: RegistererUnregisterOptions = {}): Promise<OutgoingRegisterRequest> {
    // UAs MUST NOT send a new registration (that is, containing new Contact
    // header field values, as opposed to a retransmission) until they have
    // received a final response from the registrar for the previous one or
    // the previous REGISTER request has timed out.
    // https://tools.ietf.org/html/rfc3261#section-10.2
    if (this.waiting) {
      const error = new Error("REGISTER request already in progress, waiting for final response");
      return Promise.reject(error);
    }

    if (this._state !== RegistererState.Registered && !options.all) {
      this.logger.warn("Not currently registered, but sending an unregister anyway.");
    }

    // Extra headers
    const extraHeaders = (options.requestOptions && options.requestOptions.extraHeaders || []).slice();
    this.request.extraHeaders = extraHeaders;

    // Registrations are soft state and expire unless refreshed, but can
    // also be explicitly removed.  A client can attempt to influence the
    // expiration interval selected by the registrar as described in Section
    // 10.2.1.  A UA requests the immediate removal of a binding by
    // specifying an expiration interval of "0" for that contact address in
    // a REGISTER request.  UAs SHOULD support this mechanism so that
    // bindings can be removed before their expiration interval has passed.
    //
    // The REGISTER-specific Contact header field value of "*" applies to
    // all registrations, but it MUST NOT be used unless the Expires header
    // field is present with a value of "0".
    // https://tools.ietf.org/html/rfc3261#section-10.2.2
    if (options.all) {
      extraHeaders.push("Contact: *");
      extraHeaders.push("Expires: 0");
    } else {
      extraHeaders.push("Contact: " + this.generateContactHeader(0));
    }

    // Call-ID: All registrations from a UAC SHOULD use the same Call-ID
    // header field value for registrations sent to a particular
    // registrar.
    //
    // CSeq: The CSeq value guarantees proper ordering of REGISTER
    // requests.  A UA MUST increment the CSeq value by one for each
    // REGISTER request with the same Call-ID.
    // https://tools.ietf.org/html/rfc3261#section-10.2
    this.request.cseq++;
    this.request.setHeader("cseq", this.request.cseq + " REGISTER");

    // Pre-emptively clear the registration timer to avoid a race condition where
    // this timer fires while waiting for a final response to the unsubscribe.
    if (this.registrationTimer !== undefined) {
      clearTimeout(this.registrationTimer);
      this.registrationTimer = undefined;
    }

    this.waitingToggle(true);

    const outgoingRegisterRequest = this.userAgent.userAgentCore.register(this.request, {
      onAccept: (response): void => {
        this._contacts = response.message.getHeaders("contact"); // Update contacts
        this.unregistered();
        if (options.requestDelegate && options.requestDelegate.onAccept) {
          options.requestDelegate.onAccept(response);
        }
        this.waitingToggle(false);
      },
      onProgress: (response): void => {
        if (options.requestDelegate && options.requestDelegate.onProgress) {
          options.requestDelegate.onProgress(response);
        }
      },
      onRedirect: (response): void => {
        this.logger.error("Unregister redirected. Not currently supported.");
        this.unregistered();
        if (options.requestDelegate && options.requestDelegate.onRedirect) {
          options.requestDelegate.onRedirect(response);
        }
        this.waitingToggle(false);
      },
      onReject: (response): void => {
        this.waitingToggle(false);
        this.logger.error(`Unregister rejected with status code ${response.message.statusCode}`);
        this.unregistered();
        if (options.requestDelegate && options.requestDelegate.onReject) {
          options.requestDelegate.onReject(response);
        }
        this.waitingToggle(false);
      },
      onTrying: (response): void => {
        if (options.requestDelegate && options.requestDelegate.onTrying) {
          options.requestDelegate.onTrying(response);
        }
      }
    });

    return Promise.resolve(outgoingRegisterRequest);
  }

  /** @internal */
  private clearTimers(): void {
    if (this.registrationTimer !== undefined) {
      clearTimeout(this.registrationTimer);
      this.registrationTimer = undefined;
    }

    if (this.registrationExpiredTimer !== undefined) {
      clearTimeout(this.registrationExpiredTimer);
      this.registrationExpiredTimer = undefined;
    }
  }

  /**
   * Helper Function to generate Contact Header
   * @internal
   */
  private generateContactHeader(expires: number = 0): string {
    let contact: string = this.contact;
    if (this.options.regId && this.options.instanceId) {
      contact += ";reg-id=" + this.options.regId;
      contact += ';+sip.instance="<urn:uuid:' + this.options.instanceId + '>"';
    }

    if (this.options.extraContactHeaderParams) {
      this.options.extraContactHeaderParams.forEach((header: string) => {
        contact += ";" + header;
      });
    }

    contact += ";expires=" + expires;

    return contact;
  }

  /** @internal */
  private onTransportDisconnected(): void {
    this.unregistered();
  }

  /** @internal */
  private registered(expires: number): void {
    this.clearTimers();

    // Re-Register before the expiration interval has elapsed.
    // For that, decrease the expires value. ie: 3 seconds
    this.registrationTimer = setTimeout(() => {
      this.registrationTimer = undefined;
      this.register();
    }, (expires * 1000) - 3000);

    // We are unregistered if the registration expires.
    this.registrationExpiredTimer = setTimeout(() => {
      this.logger.warn("Registration expired");
      this.unregistered();
    }, expires * 1000);

    if (this._state !== RegistererState.Registered) {
      this.stateTransition(RegistererState.Registered);
    }
  }

  /** @internal */
  private unregistered(): void {
    this.clearTimers();

    if (this._state !== RegistererState.Unregistered) {
      this.stateTransition(RegistererState.Unregistered);
    }
  }

  /**
   * Transition registration state.
   * @internal
   */
  private stateTransition(newState: RegistererState): void {
    const invalidTransition = () => {
      throw new Error(`Invalid state transition from ${this._state} to ${newState}`);
    };

    // Validate transition
    switch (this._state) {
      case RegistererState.Initial:
        if (
          newState !== RegistererState.Registered &&
          newState !== RegistererState.Unregistered
        ) {
          invalidTransition();
        }
        break;
      case RegistererState.Registered:
        if (
          newState !== RegistererState.Unregistered
        ) {
          invalidTransition();
        }
        break;
      case RegistererState.Unregistered:
        if (
          newState !== RegistererState.Registered
        ) {
          invalidTransition();
        }
        break;
      default:
        throw new Error("Unrecognized state.");
    }

    // Transition
    this._state = newState;
    this.logger.log(`Registration transitioned to state ${this._state}`);
    this._stateEventEmitter.emit("event", this._state);
  }

  /** True if waiting for final response to a REGISTER request. */
  private get waiting(): boolean {
    return this._waiting;
  }

  /** Emits when the registerer toggles waiting. */
  private get waitingChange(): Emitter<boolean> {
    return makeEmitter(this._waitingEventEmitter);
  }

  /**
   * Toggle waiting.
   * @internal
   */
  private waitingToggle(waiting: boolean): void {
    if (this._waiting === waiting) {
      throw new Error(`Invalid waiting transition from ${this._waiting} to ${waiting}`);
    }
    this._waiting = waiting;
    this.logger.log(`Waiting toggled to ${this._waiting}`);
    this._waitingEventEmitter.emit("event", this._waiting);
  }
}
