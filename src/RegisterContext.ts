import { ClientContext } from "./ClientContext";
import { C } from "./Constants";
import { Grammar, IncomingResponseMessage, URI } from "./core";
import { Transport } from "./core/transport";
import { TypeStrings } from "./Enums";
import { Exceptions } from "./Exceptions";
import { UA } from "./UA";
import { Utils } from "./Utils";

export namespace RegisterContext {
  export interface RegistrationConfiguration {
    expires?: string;
    extraContactHeaderParams?: Array<string>;
    instanceId?: string;
    params?: any;
    regId?: number;
    registrar?: string;
  }
}

/**
 * Configuration load.
 * @private
 * returns {any}
 */
function loadConfig(configuration: RegisterContext.RegistrationConfiguration): any {
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

export class RegisterContext extends ClientContext {
  public type: TypeStrings;
  public registered: boolean;

  private options: any;
  private expires: number;
  private contact: string;

  private registrationTimer: any | undefined;
  private registrationExpiredTimer: any | undefined;
  private registeredBefore: boolean | undefined;

  private closeHeaders: Array<string> | undefined;

  constructor(ua: UA, options: any = {}) {
    const settings: any = loadConfig(options);

    if (settings.regId && !settings.instanceId) {
      settings.instanceId = Utils.newUUID();
    } else if (!settings.regId && settings.instanceId) {
      settings.regId = 1;
    }

    settings.params.toUri = settings.params.toUri || ua.configuration.uri;
    settings.params.toDisplayName = settings.params.toDisplayName || ua.configuration.displayName;
    settings.params.callId = settings.params.callId || Utils.createRandomToken(22);
    settings.params.cseq = settings.params.cseq || Math.floor(Math.random() * 10000);

    /* If no 'registrarServer' is set use the 'uri' value without user portion. */
    if (!settings.registrar) {
      let registrarServer: any = {};
      if (typeof ua.configuration.uri === "object") {
        registrarServer = ua.configuration.uri.clone();
        registrarServer.user = undefined;
      } else {
        registrarServer = ua.configuration.uri;
      }
      settings.registrar = registrarServer;
    }

    super(ua, C.REGISTER, settings.registrar, settings);
    this.type = TypeStrings.RegisterContext;

    this.options = settings;
    this.logger = ua.getLogger("sip.registercontext");

    this.logger.log("configuration parameters for RegisterContext after validation:");
    for (const parameter in settings) {
      if (settings.hasOwnProperty(parameter)) {
        this.logger.log("· " + parameter + ": " + JSON.stringify((settings as any)[parameter]));
      }
    }

    // Registration expires
    this.expires = settings.expires;

    // Contact header
    this.contact = ua.contact.toString();

    // Set status
    this.registered = false;

    ua.transport.on("disconnected", () => this.onTransportDisconnected());
  }

  public register(options: any = {}): void {
    // Handle Options
    this.options = {...this.options, ...options};
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

    // Save original extraHeaders to be used in .close
    this.closeHeaders = this.options.closeWithHeaders ?
      (this.options.extraHeaders || []).slice() : [];

    this.receiveResponse = (response: IncomingResponseMessage) => {
      // Discard responses to older REGISTER/un-REGISTER requests.
      if (response.cseq !== this.request.cseq) {
        return;
      }

      // Clear registration timer
      if (this.registrationTimer !== undefined) {
        clearTimeout(this.registrationTimer);
        this.registrationTimer = undefined;
      }

      const statusCode: string = (response.statusCode || 0).toString();
      switch (true) {
        case /^1[0-9]{2}$/.test(statusCode):
          this.emit("progress", response);
          break;
        case /^2[0-9]{2}$/.test(statusCode):
          this.emit("accepted", response);

          let expires: number | undefined;
          if (response.hasHeader("expires")) {
            expires = Number(response.getHeader("expires"));
          }

          if (this.registrationExpiredTimer !== undefined) {
            clearTimeout(this.registrationExpiredTimer);
            this.registrationExpiredTimer = undefined;
          }

          // Search the Contact pointing to us and update the expires value accordingly.
          let contacts: number = response.getHeaders("contact").length;
          if (!contacts) {
            this.logger.warn("no Contact header in response to REGISTER, response ignored");
            break;
          }

          let contact: any;
          while (contacts--) {
            contact = response.parseHeader("contact", contacts);
            if (contact.uri.user === this.ua.contact.uri.user) {
              expires = contact.getParam("expires");
              break;
            } else {
              contact = undefined;
            }
          }

          if (!contact) {
            this.logger.warn("no Contact header pointing to us, response ignored");
            break;
          }

          if (expires === undefined) {
            expires = this.expires;
          }

          // Re-Register before the expiration interval has elapsed.
          // For that, decrease the expires value. ie: 3 seconds
          this.registrationTimer = setTimeout(() => {
            this.registrationTimer = undefined;
            this.register(this.options);
          }, (expires * 1000) - 3000);

          this.registrationExpiredTimer = setTimeout(() => {
            this.logger.warn("registration expired");
            if (this.registered) {
              this.unregistered(undefined, C.causes.EXPIRES);
            }
          }, expires * 1000);

          // Save gruu values
          if (contact.hasParam("temp-gruu")) {
            this.ua.contact.tempGruu = Grammar.URIParse(contact.getParam("temp-gruu").replace(/"/g, ""));
          }
          if (contact.hasParam("pub-gruu")) {
            this.ua.contact.pubGruu = Grammar.URIParse(contact.getParam("pub-gruu").replace(/"/g, ""));
          }

          this.registered = true;
          this.emit("registered", response || undefined);
          break;
        // Interval too brief RFC3261 10.2.8
        case /^423$/.test(statusCode):
          if (response.hasHeader("min-expires")) {
            // Increase our registration interval to the suggested minimum
            this.expires = Number(response.getHeader("min-expires"));
            // Attempt the registration again immediately
            this.register(this.options);
          } else { // This response MUST contain a Min-Expires header field
            this.logger.warn("423 response received for REGISTER without Min-Expires");
            this.registrationFailure(response, C.causes.SIP_FAILURE_CODE);
          }
          break;
        default:
          this.registrationFailure(response, Utils.sipErrorCause(response.statusCode || 0));
      }
    };

    this.onRequestTimeout = (): void => {
      this.registrationFailure(undefined, C.causes.REQUEST_TIMEOUT);
    };

    this.onTransportError = (): void => {
      this.registrationFailure(undefined, C.causes.CONNECTION_ERROR);
    };

    this.request.cseq++;
    this.request.setHeader("cseq", this.request.cseq + " REGISTER");
    this.request.extraHeaders = extraHeaders;

    this.send();
  }

  public close(): void {
    const options: any = {
      all: false,
      extraHeaders: this.closeHeaders
    };

    this.registeredBefore = this.registered;
    if (this.registered) {
      this.unregister(options);
    }
  }

  public unregister(options: any = {}): void {
    if (!this.registered && !options.all) {
      this.logger.warn("Already unregistered, but sending an unregister anyways.");
    }

    const extraHeaders = (options.extraHeaders || []).slice();

    this.registered = false;

    // Clear the registration timer.
    if (this.registrationTimer !== undefined) {
      clearTimeout(this.registrationTimer);
      this.registrationTimer = undefined;
    }

    if (options.all) {
      extraHeaders.push("Contact: *");
      extraHeaders.push("Expires: 0");
    } else {
      extraHeaders.push("Contact: " + this.generateContactHeader(0));
    }

    this.receiveResponse = (response) => {
      const statusCode: string = (response && response.statusCode) ? response.statusCode.toString() : "";
      switch (true) {
        case /^1[0-9]{2}$/.test(statusCode):
          this.emit("progress", response);
          break;
        case /^2[0-9]{2}$/.test(statusCode):
          this.emit("accepted", response);
          if (this.registrationExpiredTimer !== undefined) {
            clearTimeout(this.registrationExpiredTimer);
            this.registrationExpiredTimer = undefined;
          }
          this.unregistered(response);
          break;
        default:
          this.unregistered(response, Utils.sipErrorCause(response.statusCode || 0));
      }
    };

    this.onRequestTimeout = () => {
      // Not actually unregistered...
      // this.unregistered(undefined, SIP.C.causes.REQUEST_TIMEOUT);
    };

    this.request.cseq++;
    this.request.setHeader("cseq", this.request.cseq + " REGISTER");
    this.request.extraHeaders = extraHeaders;

    this.send();
  }

  public unregistered(response?: IncomingResponseMessage, cause?: string): void {
    this.registered = false;
    this.emit("unregistered", response || undefined, cause || undefined);
  }

  public send(): this {
    this.ua.userAgentCore.register(this.request, {
      onAccept: (response): void => this.receiveResponse(response.message),
      onProgress: (response): void => this.receiveResponse(response.message),
      onRedirect: (response): void => this.receiveResponse(response.message),
      onReject: (response): void => this.receiveResponse(response.message),
      onTrying: (response): void => this.receiveResponse(response.message)
    });
    return this;
  }

  private registrationFailure(response: IncomingResponseMessage | undefined, cause: string): void {
    this.emit("failed", response || undefined, cause || undefined);
  }

  private onTransportDisconnected(): void {
    this.registeredBefore = this.registered;
    if (this.registrationTimer !== undefined) {
      clearTimeout(this.registrationTimer);
      this.registrationTimer = undefined;
    }

    if (this.registrationExpiredTimer !== undefined) {
      clearTimeout(this.registrationExpiredTimer);
      this.registrationExpiredTimer = undefined;
    }

    if (this.registered) {
      this.unregistered(undefined, C.causes.CONNECTION_ERROR);
    }
  }

  /**
   * Helper Function to generate Contact Header
   * @private
   * returns {String}
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
}
