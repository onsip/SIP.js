import { Body } from "./Core";
import { TypeStrings } from "./Enums";
import { Grammar } from "./Grammar";
import { NameAddrHeader } from "./NameAddrHeader";
import { URI } from "./URI";
import { Utils } from "./Utils";

export interface OutgoingRequestMessageOptions {
  callId?: string;
  callIdPrefix?: string;
  cseq?: number;
  toDisplayName?: string;
  toTag?: string;
  fromDisplayName?: string;
  fromTag?: string;
  forceRport?: boolean;
  hackViaTcp?: boolean;
  optionTags?: Array<string>;
  routeSet?: Array<string>;
  userAgentString?: string;
  viaHost?: string;
}

/**
 * Outgoing SIP request.
 */
export class OutgoingRequest {

  /** Get a copy of the default options. */
  private static getDefaultOptions(): Required<OutgoingRequestMessageOptions> {
    return {
      callId: "",
      callIdPrefix: "",
      cseq: 1,
      toDisplayName: "",
      toTag: "",
      fromDisplayName: "",
      fromTag: "",
      forceRport: false,
      hackViaTcp: false,
      optionTags: ["outbound"],
      routeSet: [],
      userAgentString: "sip.js",
      viaHost: ""
    };
  }

  private static makeNameAddrHeader(uri: URI, displayName: string, tag: string): NameAddrHeader {
    const parameters: {[name: string]: string} = {};
    if (tag) {
      parameters.tag = tag;
    }
    return new NameAddrHeader(uri, displayName, parameters);
  }

  // Deprecated
  public type = TypeStrings.OutgoingRequest;
  public readonly headers: {[name: string]: Array<string>} = {};

  public readonly method: string;
  public readonly ruri: URI;
  public readonly from: NameAddrHeader;
  public readonly fromTag: string;
  public readonly fromURI: URI;
  public readonly to: NameAddrHeader;
  public readonly toTag: string | undefined;
  public readonly toURI: URI;
  public branch: string | undefined;
  public readonly callId: string;
  public cseq: number;
  public extraHeaders: Array<string> = [];
  public body: { body: string, contentType: string } | undefined;

  private options: Required<OutgoingRequestMessageOptions> = OutgoingRequest.getDefaultOptions();

  constructor(
    method: string,
    ruri: URI,
    fromURI: URI,
    toURI: URI,
    options?: OutgoingRequestMessageOptions,
    extraHeaders?: Array<string>,
    body?: Body
  ) {
    // Options - merge a deep copy
    if (options) {
      this.options = {
        ...this.options,
        ...options
      };
      if (this.options.optionTags && this.options.optionTags.length) {
        this.options.optionTags = this.options.optionTags.slice();
      }
      if (this.options.routeSet && this.options.routeSet.length) {
        this.options.routeSet = this.options.routeSet.slice();
      }
    }

    // Extra headers - deep copy
    if (extraHeaders && extraHeaders.length) {
      this.extraHeaders = extraHeaders.slice();
    }

    // Body - deep copy
    if (body) {
      // TODO: internal representation should be Body
      // this.body = { ...body };
      this.body = {
        body: body.content,
        contentType: body.contentType
      };
    }

    // Method
    this.method = method;

    // RURI
    this.ruri = ruri.clone();

    // From
    this.fromURI = fromURI.clone();
    this.fromTag = this.options.fromTag ? this.options.fromTag : Utils.newTag();
    this.from = OutgoingRequest.makeNameAddrHeader(this.fromURI, this.options.fromDisplayName, this.fromTag);

    // To
    this.toURI = toURI.clone();
    this.toTag = this.options.toTag;
    this.to = OutgoingRequest.makeNameAddrHeader(this.toURI, this.options.toDisplayName, this.toTag);

    // Call-ID
    this.callId = this.options.callId ? this.options.callId : this.options.callIdPrefix + Utils.createRandomToken(15);

    // CSeq
    this.cseq = this.options.cseq;

    // The relative order of header fields with different field names is not
    // significant.  However, it is RECOMMENDED that header fields which are
    // needed for proxy processing (Via, Route, Record-Route, Proxy-Require,
    // Max-Forwards, and Proxy-Authorization, for example) appear towards
    // the top of the message to facilitate rapid parsing.
    // https://tools.ietf.org/html/rfc3261#section-7.3.1
    this.setHeader("route", this.options.routeSet);
    this.setHeader("via", "");
    this.setHeader("to", this.to.toString());
    this.setHeader("from", this.from.toString());
    this.setHeader("cseq", this.cseq + " " + this.method);
    this.setHeader("call-id", this.callId);
    this.setHeader("max-forwards", "70");
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
   * @param scheme The scheme.
   */
  public setViaHeader(branch: string, scheme: string = "WSS"): void {
    // FIXME: Hack
    if (this.options.hackViaTcp) {
      scheme = "TCP";
    }
    let via = "SIP/2.0/" + scheme;
    via += " " + this.options.viaHost + ";branch=" + branch;
    if (this.options.forceRport) {
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

    msg += "Supported: " + this.options.optionTags.join(", ") + "\r\n";
    msg += "User-Agent: " + this.options.userAgentString + "\r\n";

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

  constructor() {
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

  constructor() {
    super();
    this.type = TypeStrings.IncomingResponse;
    this.headers = {};
  }
}
