import { EventEmitter } from "events";

import { C } from "./Constants";
import { TypeStrings } from "./Enums";
import { Logger } from "./LoggerFactory";
import { NameAddrHeader } from "./NameAddrHeader";
import { RequestSender } from "./RequestSender";
import { IncomingResponse, OutgoingRequest } from "./SIPMessage";
import { UA } from "./UA";
import { URI } from "./URI";
import { Utils } from "./Utils";

export class ClientContext extends EventEmitter {
  public static initializer(
    objToConstruct: ClientContext,
    ua: UA,
    method: string,
    originalTarget: string | URI,
    options?: any
  ): void {
    objToConstruct.type = TypeStrings.ClientContext;

    // Validate arguments
    if (originalTarget === undefined) {
      throw new TypeError("Not enough arguments");
    }

    objToConstruct.ua = ua;
    objToConstruct.logger = ua.getLogger("sip.clientcontext");
    objToConstruct.method = method;

    const target: URI | undefined = ua.normalizeTarget(originalTarget);
    if (!target) {
      throw new TypeError("Invalid target: " + originalTarget);
    }

    /* Options
    * - extraHeaders
    * - params
    * - contentType
    * - body
    */
    options = Object.create(options || Object.prototype);
    options.extraHeaders = (options.extraHeaders || []).slice();

    // Build the request
    objToConstruct.request = new OutgoingRequest(objToConstruct.method,
                                        target,
                                        objToConstruct.ua,
                                        options.params,
                                        options.extraHeaders);
    if (options.body) {
      objToConstruct.body = {};
      objToConstruct.body.body = options.body;
      if (options.contentType) {
        objToConstruct.body.contentType = options.contentType;
      }
      objToConstruct.request.body = objToConstruct.body;
    }

    /* Set other properties from the request */
    if (objToConstruct.request.from) {
      objToConstruct.localIdentity = objToConstruct.request.from;
    }
    if (objToConstruct.request.to) {
      objToConstruct.remoteIdentity = objToConstruct.request.to;
    }
  }

  public type!: TypeStrings;
  public data: any = {};

  // Typing note: these were all private, needed to switch to get around
  // inheritance issue with InviteClientContext
  public ua!: UA;
  public logger!: Logger;
  public request!: OutgoingRequest;
  public method!: string;
  public body: any;
  public localIdentity!: NameAddrHeader;
  public remoteIdentity!: NameAddrHeader;

  constructor(ua: UA, method: string, target: string | URI, options?: any) {
    super();

    ClientContext.initializer(this, ua, method, target, options);
  }

  public send(): this {
    const sender: RequestSender = new RequestSender(this, this.ua);
    sender.send();
    return this;
  }

  public receiveResponse(response: IncomingResponse): void {
    const statusCode: number = response.statusCode || 0;
    const cause: string = Utils.getReasonPhrase(statusCode);

    switch (true) {
      case /^1[0-9]{2}$/.test(statusCode.toString()):
        this.emit("progress", response, cause);
        break;

      case /^2[0-9]{2}$/.test(statusCode.toString()):
        if (this.ua.applicants[this.toString()]) {
          delete this.ua.applicants[this.toString()];
        }
        this.emit("accepted", response, cause);
        break;

      default:
        if (this.ua.applicants[this.toString()]) {
          delete this.ua.applicants[this.toString()];
        }
        this.emit("rejected", response, cause);
        this.emit("failed", response, cause);
        break;
    }
  }

  public onRequestTimeout(): void {
    this.emit("failed", undefined, C.causes.REQUEST_TIMEOUT);
  }

  public onTransportError(): void {
    this.emit("failed", undefined, C.causes.CONNECTION_ERROR);
  }
}
