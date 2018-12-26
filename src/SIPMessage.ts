import { Dialog } from "../types/dialogs";
import { Logger } from "../types/logger-factory";
import { NameAddrHeader } from "../types/name-addr-header";
import {
  IncomingMessage as IncomingMessageDefinition,
  IncomingRequest as IncomingRequestDefinition,
  IncomingResponse as IncomingResponseDefinition,
  OutgoingRequest as OutgoingRequestDefinition
} from "../types/sip-message";
import { InviteClientTransaction, InviteServerTransaction, NonInviteServerTransaction } from "../types/transactions";
import { Transport } from "../types/transport";
import { UA } from "../types/ua";
import { URI } from "../types/uri";

import { C } from "./Constants";
import { TypeStrings } from "./Enums";
import { Grammar } from "./Grammar";
import { Utils } from "./Utils";

const getSupportedHeader: ((request: OutgoingRequest | IncomingRequest) => string) =  (request) => {
  let optionTags: Array<string> = [];

  if (request.method === C.REGISTER) {
    optionTags.push("path", "gruu");
  } else if (request.method === C.INVITE &&
             (request.ua.contact.pubGruu || request.ua.contact.tempGruu)) {
    optionTags.push("gruu");
  }

  if (request.ua.configuration.rel100 === C.supported.SUPPORTED) {
    optionTags.push("100rel");
  }
  if (request.ua.configuration.replaces === C.supported.SUPPORTED) {
    optionTags.push("replaces");
  }

  optionTags.push("outbound");

  optionTags = optionTags.concat(request.ua.configuration.extraSupported || []);

  const allowUnregistered: boolean = request.ua.configuration.hackAllowUnregisteredOptionTags || false;
  const optionTagSet: {[name: string]: boolean} = {};
  optionTags = optionTags.filter((optionTag: string) => {
    const registered: string = (C.OPTION_TAGS as any)[optionTag];
    const unique: boolean = !optionTagSet[optionTag];
    optionTagSet[optionTag] = true;
    return (registered || allowUnregistered) && unique;
  });

  return "Supported: " + optionTags.join(", ") + "\r\n";
};

/**
 * @class Class for outgoing SIP request.
 * @param {String} method request method
 * @param {String} ruri request uri
 * @param {SIP.UA} ua
 * @param {Object} params parameters that will have priority over ua.configuration parameters:
 * <br>
 *  - cseq, callId, fromTag, fromUri, fromDisplayName, toUri, toTag, routeSet
 * @param {Object} [headers] extra headers
 * @param {String} [body]
 */
export class OutgoingRequest implements OutgoingRequestDefinition {
  public type: TypeStrings;
  public ruri: string | URI;
  public ua: UA;
  public headers: {[name: string]: Array<string>};
  public method: string;
  public cseq: number;
  public body: string | any;
  public to: NameAddrHeader | undefined;
  public from: NameAddrHeader | undefined;
  public extraHeaders: Array<string>;
  public callId: string;

  // hack that is used because request is exposed and dialog is not
  public dialog: Dialog | undefined;

  private logger: Logger;
  private statusCode: number;
  private reasonPhrase: string;

  constructor(
    method: string,
    ruri: string | URI,
    ua: UA,
    params: any = {},
    extraHeaders: Array<string>,
    body?: string
  ) {
    this.type = TypeStrings.OutgoingRequest;
    this.logger = ua.getLogger("sip.sipmessage");
    this.ua = ua;
    this.headers = {};
    this.method = method;
    this.ruri = ruri;
    this.body = body;
    this.extraHeaders = (extraHeaders || []).slice();
    this.statusCode = params.statusCode;
    this.reasonPhrase = params.reasonPhrase;

    // Fill the Common SIP Request Headers

    // Route
    if (params.routeSet) {
      this.setHeader("route", params.routeSet);
    } else if (ua.configuration.usePreloadedRoute && ua.transport) {
      this.setHeader("route", ua.transport.server.sipUri);
    }

    // Via
    // Empty Via header. Will be filled by the client transaction.
    this.setHeader("via", "");

    // Max-Forwards
    // is a constant on ua.c, removed for circular dependency
    this.setHeader("max-forwards", "70");

    // To
    const toUri: URI | string = params.toUri || ruri;
    let to: string = (params.toDisplayName || params.toDisplayName === 0) ? '"' + params.toDisplayName + '" ' : "";
    to += "<" + ((toUri as URI).type === TypeStrings.URI ? (toUri as URI).toRaw() : toUri) + ">";
    to += params.toTag ? ";tag=" + params.toTag : "";

    this.to = Grammar.nameAddrHeaderParse(to);
    this.setHeader("to", to);

    // From
    const fromUri: URI | string = params.fromUri || ua.configuration.uri || "";
    let from: string;
    if (params.fromDisplayName || params.fromDisplayName === 0) {
      from = '"' + params.fromDisplayName + '" ';
    } else if (ua.configuration.displayName) {
      from = '"' + ua.configuration.displayName + '" ';
    } else {
      from = "";
    }
    from += "<" + ((fromUri as URI).type === TypeStrings.URI ? (fromUri as URI).toRaw() : fromUri) + ">;tag=";
    from += params.fromTag || Utils.newTag();

    this.from = Grammar.nameAddrHeaderParse(from);
    this.setHeader("from", from);

    // Call-ID
    this.callId = params.callId || (ua.configuration.sipjsId + Utils.createRandomToken(15));
    this.setHeader("call-id", this.callId);

    // CSeq
    this.cseq = params.cseq || Math.floor(Math.random() * 10000);
    this.setHeader("cseq", this.cseq + " " + method);
  }

  /**
   * Replace the the given header by the given value.
   * @param {String} name header name
   * @param {String | Array} value header value
   */
  public setHeader(name: string, value: string | Array<string>): void {
    this.headers[Utils.headerize(name)] = (value instanceof Array) ? value : [value];
  }

  /**
   * Get the value of the given header name at the given position.
   * @param {String} name header name
   * @returns {String|undefined} Returns the specified header, undefined if header doesn't exist.
   */
  public getHeader(name: string): string | undefined {
    const header: Array<string> = this.headers[Utils.headerize(name)];
    if (header) {
      if (header[0]) {
        return header[0];
      }
    } else {
      const regexp: RegExp = new RegExp("^\\s*" + name + "\\s*:", "i");
      for (const exHeader of this.extraHeaders) {
        if (regexp.test(exHeader)) {
          return exHeader.substring(exHeader.indexOf(":") + 1).trim();
        }
      }
    }

    return;
  }

  public cancel(reason: string | undefined, extraHeaders: Array<string>): void {
    // this gets defined "correctly" in InviteClientTransaction constructor
    // its a hack
  }

  /**
   * Get the header/s of the given name.
   * @param {String} name header name
   * @returns {Array} Array with all the headers of the specified name.
   */
  public getHeaders(name: string): Array<string> {
    const result: Array<string> = [];
    const headerArray: Array<string> = this.headers[Utils.headerize(name)];

    if (headerArray) {
      for (const headerPart of headerArray) {
        result.push(headerPart);
      }
    } else {
      const regexp: RegExp = new RegExp("^\\s*" + name + "\\s*:", "i");
      for (const exHeader of this.extraHeaders) {
        if (regexp.test(exHeader)) {
          result.push(exHeader.substring(exHeader.indexOf(":") + 1).trim());
        }
      }
    }
    return result;
  }

  /**
   * Verify the existence of the given header.
   * @param {String} name header name
   * @returns {boolean} true if header with given name exists, false otherwise
   */
  public hasHeader(name: string): boolean {
    if (this.headers[Utils.headerize(name)]) {
      return true;
    } else {
      const regexp: RegExp = new RegExp("^\\s*" + name + "\\s*:", "i");
      for (const extraHeader of this.extraHeaders) {
        if (regexp.test(extraHeader)) {
          return true;
        }
      }
    }

    return false;
  }

  public toString(): string {
    let msg: string = "";

    msg += this.method + " " + ((this.ruri as URI).type === TypeStrings.URI ?
      (this.ruri as URI).toRaw() : this.ruri) + " SIP/2.0\r\n";

    for (const header in this.headers) {
      if (this.headers[header]) {
        for (const headerPart of this.headers[header]) {
          msg += header + ": " + headerPart + "\r\n";
        }
      }
    }

    for (const header of this.extraHeaders) {
      msg += header.trim() + "\r\n";
    }

    msg += getSupportedHeader(this);
    msg += "User-Agent: " + this.ua.configuration.userAgentString + "\r\n";

    if (this.body) {
      if (typeof this.body === "string") {
        msg += "Content-Length: " + Utils.str_utf8_length(this.body) + "\r\n\r\n";
        msg += this.body;
      } else {
        if (this.body.body && this.body.contentType) {
          msg += "Content-Type: " + this.body.contentType + "\r\n";
          msg += "Content-Length: " + Utils.str_utf8_length(this.body.body) + "\r\n\r\n";
          msg += this.body.body;
        } else {
          msg += "Content-Length: " + 0 + "\r\n\r\n";
        }
      }
    } else {
      msg += "Content-Length: " + 0 + "\r\n\r\n";
    }

    return msg;
  }
}

/**
 * @class Class for incoming SIP message.
 */
// tslint:disable-next-line:max-classes-per-file
class IncomingMessage implements IncomingMessageDefinition {
  public type: TypeStrings = TypeStrings.IncomingMessage;
  public viaBranch!: string;
  public method!: string;
  public body!: string | any;
  public toTag!: string;
  public to!: NameAddrHeader;
  public fromTag!: string;
  public from!: NameAddrHeader;
  public callId!: string;
  public cseq!: number;
  public via!: {host: string, port: number};
  public headers: {[name: string]: any} = {};
  public referTo: string | undefined;
  public data!: string;

  /**
   * Insert a header of the given name and value into the last position of the
   * header array.
   * @param {String} name header name
   * @param {String} value header value
   */
  public addHeader(name: string, value: string): void {
    const header: any = { raw: value };
    name = Utils.headerize(name);

    if (this.headers[name]) {
      this.headers[name].push(header);
    } else {
      this.headers[name] = [header];
    }
  }

  /**
   * Get the value of the given header name at the given position.
   * @param {String} name header name
   * @returns {String|undefined} Returns the specified header, undefined if header doesn't exist.
   */
  public getHeader(name: string): string | undefined {
    const header: Array<any> = this.headers[Utils.headerize(name)];

    if (header) {
      if (header[0]) {
        return header[0].raw;
      }
    } else {
      return;
    }
  }

  /**
   * Get the header/s of the given name.
   * @param {String} name header name
   * @returns {Array} Array with all the headers of the specified name.
   */
  public getHeaders(name: string): Array<string> {
    const header: Array<any> = this.headers[Utils.headerize(name)];
    const result: Array<string> = [];

    if (!header) {
      return [];
    }
    for (const headerPart of header) {
      result.push(headerPart.raw);
    }
    return result;
  }

  /**
   * Verify the existence of the given header.
   * @param {String} name header name
   * @returns {boolean} true if header with given name exists, false otherwise
   */
  public hasHeader(name: string): boolean {
    return !!this.headers[Utils.headerize(name)];
  }

  /**
   * Parse the given header on the given index.
   * @param {String} name header name
   * @param {Number} [idx=0] header index
   * @returns {Object|undefined} Parsed header object, undefined if the
   *   header is not present or in case of a parsing error.
   */
  public parseHeader(name: string, idx: number = 0): any | undefined {
    name = Utils.headerize(name);

    if (!this.headers[name]) {
      // this.logger.log("header '" + name + "' not present");
      return;
    } else if (idx >= this.headers[name].length) {
      // this.logger.log("not so many '" + name + "' headers present");
      return;
    }

    const header: any = this.headers[name][idx];
    const value: string = header.raw;

    if (header.parsed) {
      return header.parsed;
    }

    // substitute '-' by '_' for grammar rule matching.
    const parsed: string | -1 = Grammar.parse(value, name.replace(/-/g, "_"));

    if (parsed === -1) {
      this.headers[name].splice(idx, 1); // delete from headers
      // this.logger.warn('error parsing "' + name + '" header field with value "' + value + '"');
      return;
    } else {
      header.parsed = parsed;
      return parsed;
    }
  }

  /**
   * Message Header attribute selector. Alias of parseHeader.
   * @param {String} name header name
   * @param {Number} [idx=0] header index
   * @returns {Object|undefined} Parsed header object, undefined if the
   *   header is not present or in case of a parsing error.
   *
   * @example
   * message.s('via',3).port
   */
  public s(name: string, idx: number = 0): any | undefined {
    return this.parseHeader(name, idx);
  }

  /**
   * Replace the value of the given header by the value.
   * @param {String} name header name
   * @param {String} value header value
   */
  public setHeader(name: string, value: string): void {
    this.headers[Utils.headerize(name)] = [{ raw: value }];
  }

  public toString(): string {
    return this.data;
  }
}

/**
 * @class Class for incoming SIP request.
 */
// tslint:disable-next-line:max-classes-per-file
export class IncomingRequest extends IncomingMessage implements IncomingRequestDefinition {
  public type: TypeStrings;
  public ua: UA;
  public serverTransaction: NonInviteServerTransaction | InviteServerTransaction | undefined;
  public transport: Transport | undefined;
  public ruri: URI | undefined;
  private logger: Logger;

  constructor(ua: UA) {
    super();
    this.type = TypeStrings.IncomingRequest;
    this.logger = ua.getLogger("sip.sipmessage");
    this.ua = ua;
  }

  /**
   * Stateful reply.
   * @param {Number} code status code
   * @param {String} reason reason phrase
   * @param {Object} headers extra headers
   * @param {String} body body
   * @param {Function} [onSuccess] onSuccess callback
   * @param {Function} [onFailure] onFailure callback
   */
// TODO: Get rid of callbacks and make promise based
  public reply(
    code: number,
    reason?: string,
    extraHeaders?: Array<string>,
    body?: any,
    onSuccess?: ((response: {msg: string}) => void),
    onFailure?: (() => void)
  ): string {
    let response: string = Utils.buildStatusLine(code, reason);
    extraHeaders = (extraHeaders || []).slice();

    if (this.method === C.INVITE && code > 100 && code <= 200) {
      for (const route of this.getHeaders("record-route")) {
        response += "Record-Route: " + route + "\r\n";
      }
    }

    for (const via of this.getHeaders("via")) {
      response += "Via: " + via + "\r\n";
    }

    let to: string = this.getHeader("to") || "";
    if (!this.toTag && code > 100) {
      to += ";tag=" + Utils.newTag();
    } else if (this.toTag && !this.s("to").hasParam("tag")) {
      to += ";tag=" + this.toTag;
    }

    response += "To: " + to + "\r\n";
    response += "From: " + this.getHeader("From") + "\r\n";
    response += "Call-ID: " + this.callId + "\r\n";
    response += "CSeq: " + this.cseq + " " + this.method + "\r\n";

    for (const extraHeader of extraHeaders) {
      response += extraHeader.trim() + "\r\n";
    }

    response += getSupportedHeader(this);
    response += "User-Agent: " + this.ua.configuration.userAgentString + "\r\n";

    if (body) {
      if (typeof body === "string") {
        response += "Content-Type: application/sdp\r\n";
        response += "Content-Length: " + Utils.str_utf8_length(body) + "\r\n\r\n";
        response += body;
      } else {
        if (body.body && body.contentType) {
          response += "Content-Type: " + body.contentType + "\r\n";
          response += "Content-Length: " + Utils.str_utf8_length(body.body) + "\r\n\r\n";
          response += body.body;
        } else {
          response += "Content-Length: " + 0 + "\r\n\r\n";
        }
      }
    } else {
      response += "Content-Length: " + 0 + "\r\n\r\n";
    }

    if (this.serverTransaction) {
      this.serverTransaction.receiveResponse(code, response).then(onSuccess, onFailure);
    }

    return response;
  }

  /**
   * Stateless reply.
   * @param {Number} code status code
   * @param {String} reason reason phrase
   */
  public reply_sl(code: number, reason?: string): void {
    let response: string = Utils.buildStatusLine(code, reason);

    for (const via of this.getHeaders("via")) {
      response += "Via: " + via + "\r\n";
    }

    let to: string = this.getHeader("To") || "";

    if (!this.toTag && code > 100) {
      to += ";tag=" + Utils.newTag();
    } else if (this.toTag && !this.s("to").hasParam("tag")) {
      to += ";tag=" + this.toTag;
    }

    response += "To: " + to + "\r\n";
    response += "From: " + this.getHeader("From") + "\r\n";
    response += "Call-ID: " + this.callId + "\r\n";
    response += "CSeq: " + this.cseq + " " + this.method + "\r\n";
    response += "User-Agent: " + this.ua.configuration.userAgentString + "\r\n";
    response += "Content-Length: " + 0 + "\r\n\r\n";

    if (this.transport) {
      this.transport.send(response);
    }
  }
}

/**
 * @class Class for incoming SIP response.
 */
// tslint:disable-next-line:max-classes-per-file
export class IncomingResponse extends IncomingMessage implements IncomingResponseDefinition {
  public type: TypeStrings;
  public statusCode: number | undefined;
  public reasonPhrase: string | undefined;
  // set in the transaction file
  public transaction!: InviteClientTransaction;

  private logger: Logger;

  constructor(ua: UA) {
    super();
    this.type = TypeStrings.IncomingResponse;
    this.logger = ua.getLogger("sip.sipmessage");
    this.headers = {};
  }
}
