import { EventEmitter } from "events";

import { C } from "./Constants";
import {
  fromBodyLegacy,
  Grammar,
  IncomingRequest,
  IncomingRequestMessage,
  InviteServerTransaction,
  Logger,
  NameAddrHeader,
  NonInviteServerTransaction,
  ResponseOptions
} from "./core";
import { TypeStrings } from "./Enums";
import { UA } from "./UA";
import { Utils } from "./Utils";

export class ServerContext extends EventEmitter {
  // hack to get around our multiple inheritance issues
  public static initializer(objectToConstruct: ServerContext, ua: UA, incomingRequest: IncomingRequest): void {
    const request = incomingRequest.message;
    objectToConstruct.type = TypeStrings.ServerContext;
    objectToConstruct.ua = ua;
    objectToConstruct.logger = ua.getLogger("sip.servercontext");
    objectToConstruct.request = request;
    if (request.body) {
      objectToConstruct.body = request.body;
    }
    if (request.hasHeader("Content-Type")) {
      objectToConstruct.contentType = request.getHeader("Content-Type");
    }
    objectToConstruct.method = request.method;

    objectToConstruct.localIdentity = request.to;
    objectToConstruct.remoteIdentity = request.from;
    const hasAssertedIdentity = request.hasHeader("P-Asserted-Identity");
    if (hasAssertedIdentity) {
      const assertedIdentity: string | undefined = request.getHeader("P-Asserted-Identity");
      if (assertedIdentity) {
        objectToConstruct.assertedIdentity = Grammar.nameAddrHeaderParse(assertedIdentity);
      }
    }
  }

  public type!: TypeStrings;
  public ua!: UA;
  public logger!: Logger;
  public localIdentity!: NameAddrHeader;
  public remoteIdentity!: NameAddrHeader;
  public method!: string;
  public request!: IncomingRequestMessage;
  public data: any = {};

  // Typing note: these were all private, needed to switch to get around
  // inheritance issue with InviteServerContext
  public transaction!: InviteServerTransaction | NonInviteServerTransaction;
  public body: any;
  public contentType: string | undefined;
  public assertedIdentity: NameAddrHeader | undefined;

  constructor(ua: UA, public incomingRequest: IncomingRequest) {
    super();

    ServerContext.initializer(this, ua, incomingRequest);
  }

  public progress(options: any = {}): any {
    options.statusCode = options.statusCode || 180;
    options.minCode = 100;
    options.maxCode = 199;
    options.events = ["progress"];

    return this.reply(options);
  }

  public accept(options: any = {}): any {
    options.statusCode = options.statusCode || 200;
    options.minCode = 200;
    options.maxCode = 299;
    options.events = ["accepted"];

    return this.reply(options);
  }

  public reject(options: any = {}): any {
    options.statusCode = options.statusCode || 480;
    options.minCode = 300;
    options.maxCode = 699;
    options.events = ["rejected", "failed"];

    return this.reply(options);
  }

  public reply(options: any = {}): any {
    const statusCode = options.statusCode || 100;
    const minCode = options.minCode || 100;
    const maxCode = options.maxCode || 699;
    const reasonPhrase = Utils.getReasonPhrase(statusCode, options.reasonPhrase);
    const extraHeaders = options.extraHeaders || [];
    const body = options.body ? fromBodyLegacy(options.body) : undefined;
    const events: Array<string> = options.events || [];

    if (statusCode < minCode || statusCode > maxCode) {
      throw new TypeError("Invalid statusCode: " + statusCode);
    }

    const responseOptions: ResponseOptions = {
      statusCode,
      reasonPhrase,
      extraHeaders,
      body
    };

    let response: string;
    const statusCodeString = statusCode.toString();
    switch (true) {
      case /^100$/.test(statusCodeString):
        response = this.incomingRequest.trying(responseOptions).message;
        break;
      case /^1[0-9]{2}$/.test(statusCodeString):
        response = this.incomingRequest.progress(responseOptions).message;
        break;
      case /^2[0-9]{2}$/.test(statusCodeString):
        response = this.incomingRequest.accept(responseOptions).message;
        break;
      case /^3[0-9]{2}$/.test(statusCodeString):
        response = this.incomingRequest.redirect([], responseOptions).message;
        break;
      case /^[4-6][0-9]{2}$/.test(statusCodeString):
        response = this.incomingRequest.reject(responseOptions).message;
        break;
      default:
        throw new Error(`Invalid status code ${statusCode}`);
    }

    events.forEach((event) => {
      this.emit(event, response, reasonPhrase);
    });

    return this;
  }

  public onRequestTimeout(): void {
    this.emit("failed", undefined, C.causes.REQUEST_TIMEOUT);
  }

  public onTransportError(): void {
    this.emit("failed", undefined, C.causes.CONNECTION_ERROR);
  }
}
