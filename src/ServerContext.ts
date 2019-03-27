import { EventEmitter } from "events";

import { C } from "./Constants";
import { TypeStrings } from "./Enums";
import { Grammar } from "./Grammar";
import { Logger } from "./LoggerFactory";
import { NameAddrHeader } from "./NameAddrHeader";
import { IncomingRequest } from "./SIPMessage";
import {
  InviteServerTransaction,
  NonInviteServerTransaction,
  ServerTransactionUser,
  TransactionState
} from "./Transactions";
import { UA } from "./UA";
import { Utils } from "./Utils";

export class ServerContext extends EventEmitter {
  // hack to get around our multiple inheritance issues
  public static initializer(objectToConstruct: ServerContext, ua: UA, request: IncomingRequest): void {
    objectToConstruct.type = TypeStrings.ServerContext;
    objectToConstruct.ua = ua;
    objectToConstruct.logger = ua.getLogger("sip.servercontext");
    objectToConstruct.request = request;
    const transport = ua.transport;
    if (!transport) {
      throw new Error("Transport undefined.");
    }
    const user: ServerTransactionUser = {
      loggerFactory: ua.getLoggerFactory(),
      onStateChange: (newState) => {
        if (newState === TransactionState.Terminated) {
          ua.destroyTransaction(objectToConstruct.transaction);
        }
      },
      onTransportError: (error) => {
        objectToConstruct.logger.error(error.message);
        objectToConstruct.onTransportError();
      }
    };
    if (request.method === C.INVITE) {
      objectToConstruct.transaction = new InviteServerTransaction(request, transport, user);
    } else {
      objectToConstruct.transaction = new NonInviteServerTransaction(request, transport, user);
    }
    ua.newTransaction(objectToConstruct.transaction);

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
  public request!: IncomingRequest;
  public data: any = {};

  // Typing note: these were all private, needed to switch to get around
  // inheritance issue with InviteServerContext
  public transaction!: InviteServerTransaction | NonInviteServerTransaction;
  public body: any;
  public contentType: string | undefined;
  public assertedIdentity: NameAddrHeader | undefined;

  constructor(ua: UA, request: IncomingRequest) {
    super();

    ServerContext.initializer(this, ua, request);
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
    const body = options.body;
    const events: Array<string> = options.events || [];

    if (statusCode < minCode || statusCode > maxCode) {
      throw new TypeError("Invalid statusCode: " + statusCode);
    }
    const response = this.request.reply(statusCode, reasonPhrase, extraHeaders, body);
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
