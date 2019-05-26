import { C } from "./Constants";
import { TypeStrings } from "./Enums";
import { Grammar } from "./Grammar";
import { NameAddrHeader } from "./NameAddrHeader";
import { Transport } from "./Transport";
import { UA } from "./UA";
import { URI } from "./URI";
import { Utils } from "./Utils";

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
export class OutgoingRequest {
  public type: TypeStrings;
  public ruri: string | URI;
  public ua: UA;
  public headers: {[name: string]: Array<string>};
  public method: string;
  public cseq: number;
  public body: string | { body: string, contentType: string } | undefined;
  public branch: string | undefined;
  public to: NameAddrHeader | undefined;
  public toTag: string | undefined;
  public from: NameAddrHeader | undefined;
  public fromTag: string;
  public extraHeaders: Array<string>;
  public callId: string;

  constructor(
    method: string,
    ruri: string | URI,
    ua: UA,
    params: any = {},
    extraHeaders?: Array<string>,
    body?: string | { body: string, contentType: string }
  ) {
    this.type = TypeStrings.OutgoingRequest;
    this.ua = ua;
    this.headers = {};
    this.method = method;
    this.ruri = ruri;
    this.body = body;
    this.extraHeaders = (extraHeaders || []).slice();

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
    this.toTag = params.toTag;
    let to: string = (params.toDisplayName || params.toDisplayName === 0) ? '"' + params.toDisplayName + '" ' : "";
    to += "<" + ((toUri as URI).type === TypeStrings.URI ? (toUri as URI).toRaw() : toUri) + ">";
    to += this.toTag ? ";tag=" + this.toTag : "";

    this.to = Grammar.nameAddrHeaderParse(to);
    this.setHeader("to", to);

    // From
    const fromUri: URI | string = params.fromUri || ua.configuration.uri || "";
    this.fromTag = params.fromTag || Utils.newTag();
    let from: string;
    if (params.fromDisplayName || params.fromDisplayName === 0) {
      from = '"' + params.fromDisplayName + '" ';
    } else if (ua.configuration.displayName) {
      from = '"' + ua.configuration.displayName + '" ';
    } else {
      from = "";
    }
    from += "<" + ((fromUri as URI).type === TypeStrings.URI ? (fromUri as URI).toRaw() : fromUri) + ">;tag=";
    from += this.fromTag;

    this.from = Grammar.nameAddrHeaderParse(from);
    this.setHeader("from", from);

    // Call-ID
    this.callId = params.callId || (ua.configuration.sipjsId + Utils.createRandomToken(15));
    this.setHeader("call-id", this.callId);

    // CSeq
    // Why not make this a "1" if not provided? See: https://tools.ietf.org/html/rfc3261#section-8.1.1.5
    this.cseq = params.cseq || Math.floor(Math.random() * 10000);
    this.setHeader("cseq", this.cseq + " " + method);
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

  /**
   * Replace the the given header by the given value.
   * @param {String} name header name
   * @param {String | Array} value header value
   */
  public setHeader(name: string, value: string | Array<string>): void {
    this.headers[Utils.headerize(name)] = (value instanceof Array) ? value : [value];
  }

  /**
   * The Via header field indicates the transport used for the transaction
   * and identifies the location where the response is to be sent.  A Via
   * header field value is added only after the transport that will be
   * used to reach the next hop has been selected (which may involve the
   * usage of the procedures in [4]).
   *
   * When the UAC creates a request, it MUST insert a Via into that
   * request.  The protocol name and protocol version in the header field
   * MUST be SIP and 2.0, respectively.  The Via header field value MUST
   * contain a branch parameter.  This parameter is used to identify the
   * transaction created by that request.  This parameter is used by both
   * the client and the server.
   * https://tools.ietf.org/html/rfc3261#section-8.1.1.7
   * @param branchParameter The branch parameter.
   * @param transport The transport.
   */
  public setViaHeader(branch: string, transport: Transport): void {
    // FIXME: Default scheme to "WSS"
    // This should go away once transport is typed and we can be sure
    // we are getting the something valid from there transport.
    let scheme = "WSS";
    // FIXME: Transport's server property is not typed (as of writing this).
    if (transport.server && transport.server.scheme) {
      scheme = transport.server.scheme;
    }
    // FIXME: Hack
    if (this.ua.configuration.hackViaTcp) {
      scheme = "TCP";
    }
    let via = "SIP/2.0/" + scheme;
    via += " " + this.ua.configuration.viaHost + ";branch=" + branch;
    if (this.ua.configuration.forceRport) {
      via += ";rport";
    }
    this.setHeader("via", via);
    this.branch = branch;
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

    msg += this.getSupportedHeader();
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

  private getSupportedHeader(): string {
    let optionTags: Array<string> = [];

    if (this.method === C.REGISTER) {
      optionTags.push("path", "gruu");
    } else if (this.method === C.INVITE &&
               (this.ua.contact.pubGruu || this.ua.contact.tempGruu)) {
      optionTags.push("gruu");
    }

    if (this.ua.configuration.rel100 === C.supported.SUPPORTED) {
      optionTags.push("100rel");
    }
    if (this.ua.configuration.replaces === C.supported.SUPPORTED) {
      optionTags.push("replaces");
    }

    optionTags.push("outbound");

    optionTags = optionTags.concat(this.ua.configuration.extraSupported || []);

    const allowUnregistered: boolean = this.ua.configuration.hackAllowUnregisteredOptionTags || false;
    const optionTagSet: {[name: string]: boolean} = {};
    optionTags = optionTags.filter((optionTag: string) => {
      const registered: string = (C.OPTION_TAGS as any)[optionTag];
      const unique: boolean = !optionTagSet[optionTag];
      optionTagSet[optionTag] = true;
      return (registered || allowUnregistered) && unique;
    });

    return "Supported: " + optionTags.join(", ") + "\r\n";
  }
}

/**
 * @class Class for incoming SIP message.
 */
// tslint:disable-next-line:max-classes-per-file
export class IncomingMessage {
  public type: TypeStrings = TypeStrings.IncomingMessage;
  public viaBranch!: string;
  public method!: string;
  public body!: string;
  public toTag!: string;
  public to!: NameAddrHeader;
  public fromTag!: string;
  public from!: NameAddrHeader;
  public callId!: string;
  public cseq!: number;
  public via!: {host: string, port: number};
  public headers: {[name: string]: Array<{ parsed?: any, raw: string }>} = {};
  public referTo: string | undefined;
  public data!: string;

  /**
   * Insert a header of the given name and value into the last position of the
   * header array.
   * @param {String} name header name
   * @param {String} value header value
   */
  public addHeader(name: string, value: string): void {
    const header = { raw: value };
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
    const header = this.headers[Utils.headerize(name)];

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

    const header = this.headers[name][idx];
    const value = header.raw;

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
export class IncomingRequest extends IncomingMessage {
  public type: TypeStrings;
  public ruri: URI | undefined;

  constructor(public ua: UA) {
    super();
    this.type = TypeStrings.IncomingRequest;
  }
}

/**
 * @class Class for incoming SIP response.
 */
// tslint:disable-next-line:max-classes-per-file
export class IncomingResponse extends IncomingMessage {
  public type: TypeStrings;
  public statusCode: number | undefined;
  public reasonPhrase: string | undefined;

  constructor(public ua: UA) {
    super();
    this.type = TypeStrings.IncomingResponse;
    this.headers = {};
  }
}
