import { C } from "./Constants";
import { Dialog } from "./Dialogs";
import { TypeStrings } from "./Enums";
import { Grammar } from "./Grammar";
import { Logger } from "./LoggerFactory";
import { NameAddrHeader } from "./NameAddrHeader";
import {
  ClientTransaction,
  ClientTransactionUser,
  InviteClientTransaction,
  NonInviteClientTransaction,
  ServerTransaction,
  TransactionState
} from "./Transactions";
import { Transport } from "./Transport";
import { UA } from "./UA";
import { URI } from "./URI";
import { Utils } from "./Utils";

export const getSupportedHeader: ((request: OutgoingRequest | IncomingRequest) => string) =  (request) => {
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
export class OutgoingRequest {
  public type: TypeStrings;
  public ruri: string | URI;
  public ua: UA;
  public headers: {[name: string]: Array<string>};
  public method: string;
  public cseq: number;
  public body: string | { body: string, contentType: string } | undefined;
  public to: NameAddrHeader | undefined;
  public toTag: string | undefined;
  public from: NameAddrHeader | undefined;
  public fromTag: string;
  public extraHeaders: Array<string>;
  public callId: string;

  // FIXME: Hack that is used because request is exposed and dialog is not
  public dialog: Dialog | undefined;

  // FIXME: This is a hack... set in ClientTransaction constructor.
  public transaction: ClientTransaction | undefined;
  public branch: string | undefined;

  private logger: Logger;
  private statusCode: number;
  private reasonPhrase: string;

  constructor(
    method: string,
    ruri: string | URI,
    ua: UA,
    params: any = {},
    extraHeaders?: Array<string>,
    body?: string | { body: string, contentType: string }
  ) {
    this.type = TypeStrings.OutgoingRequest;
    this.logger = ua.getLogger("sip.sipmessage");
    this.ua = ua;
    this.headers = {};
    this.method = method;
    this.ruri = ruri;
    this.body = body;
    this.extraHeaders = (extraHeaders || []).slice();
    // FIXME: Why are response properties on a Request class?
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

  /**
   * Cancel this request.
   * If this is not an INVITE request, a no-op.
   * @param reason Reason phrase.
   * @param extraHeaders Extra headers.
   */
  public cancel(reason?: string, extraHeaders?: Array<string>): void {
    if (!this.transaction) {
      throw new Error("Transaction undefined.");
    }

    const sendCancel = () => {
      if (!this.transaction) {
        throw new Error("Transaction undefined.");
      }
      if (!this.to) {
        throw new Error("To undefined.");
      }
      if (!this.from) {
        throw new Error("From undefined.");
      }

      // The following procedures are used to construct a CANCEL request.  The
      // Request-URI, Call-ID, To, the numeric part of CSeq, and From header
      // fields in the CANCEL request MUST be identical to those in the
      // request being cancelled, including tags.  A CANCEL constructed by a
      // client MUST have only a single Via header field value matching the
      // top Via value in the request being cancelled.  Using the same values
      // for these header fields allows the CANCEL to be matched with the
      // request it cancels (Section 9.2 indicates how such matching occurs).
      // However, the method part of the CSeq header field MUST have a value
      // of CANCEL.  This allows it to be identified and processed as a
      // transaction in its own right (See Section 17).
      // https://tools.ietf.org/html/rfc3261#section-9.1
      const cancel = new OutgoingRequest(
        C.CANCEL,
        this.ruri,
        this.ua,
        {
          toUri: this.to.uri,
          toTag: this.toTag,
          fromUri: this.from.uri,
          fromTag: this.fromTag,
          callId: this.callId,
          cseq: this.cseq
        },
        extraHeaders
      );

      // TODO: Revisit this.
      // The CANCEL needs to use the same branch parameter so that
      // it matches the INVITE transaction, but this is a hacky way to do this.
      // Or at the very least not well documented. If the the branch parameter
      // is set on the outgoing request, the transaction will use it. Otherwise
      // the transaction will make a new one.
      cancel.branch = this.branch;

      // If the request being cancelled contains a Route header field, the
      // CANCEL request MUST include that Route header field's values.
      // https://tools.ietf.org/html/rfc3261#section-9.1
      if (this.headers.Route) {
        cancel.headers.Route = this.headers.Route;
      }

      if (reason) {
        cancel.setHeader("Reason", reason);
      }

      const transport = this.transaction.transport;
      const user: ClientTransactionUser = {
        loggerFactory: this.ua.getLoggerFactory(),
        onStateChange: (newState) => {
          if (newState === TransactionState.Terminated) {
            this.ua.destroyTransaction(clientTransaction);
          }
        },
        receiveResponse: (response) => { return; }
      };
      const clientTransaction = new NonInviteClientTransaction(cancel, transport, user);
      this.ua.newTransaction(clientTransaction);
    };

    // A CANCEL request SHOULD NOT be sent to cancel a request other than INVITE.
    // Since requests other than INVITE are responded to immediately, sending a
    // CANCEL for a non-INVITE request would always create a race condition.
    // https://tools.ietf.org/html/rfc3261#section-9.1
    if (!(this.transaction instanceof InviteClientTransaction)) {
      return;
    }

    // If no provisional response has been received, the CANCEL request MUST
    // NOT be sent; rather, the client MUST wait for the arrival of a
    // provisional response before sending the request. If the original
    // request has generated a final response, the CANCEL SHOULD NOT be
    // sent, as it is an effective no-op, since CANCEL has no effect on
    // requests that have already generated a final response.
    // https://tools.ietf.org/html/rfc3261#section-9.1
    if (this.transaction.state === TransactionState.Proceeding) {
      sendCancel();
    } else {
      this.transaction.once("stateChanged", () => {
        if (this.transaction && this.transaction.state === TransactionState.Proceeding) {
          sendCancel();
        }
      });
    }
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

  // FIXME: Fix this a hack... set in ServerTransaction constructor.
  public transaction: ServerTransaction | undefined;

  // FIXME: Fix this a hack... set in UA.onTransportReceiveRequest()
  public transport: Transport | undefined;

  private logger: Logger;

  constructor(public ua: UA) {
    super();
    this.type = TypeStrings.IncomingRequest;
    this.logger = ua.getLogger("sip.sipmessage");
  }

  /**
   * Stateful reply.
   * @param {Number} code status code
   * @param {String} reason reason phrase
   * @param {Object} headers extra headers
   * @param {String} body body
   */
  public reply(
    code: number,
    reason?: string,
    extraHeaders?: Array<string>,
    body?: string | { body: string, contentType: string }
  ): string {
    if (!this.transaction) {
      throw new Error("Transaction undefined.");
    }

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

    this.transaction.receiveResponse(code, response);

    return response;
  }

  /**
   * Stateless reply.
   * @param {Number} code status code
   * @param {String} reason reason phrase
   */
  public reply_sl(code: number, reason?: string): string {
    if (!this.transport) {
      throw new Error("Transport undefined.");
    }

    let response: string = Utils.buildStatusLine(code, reason);

    for (const via of this.getHeaders("via")) {
      response += "Via: " + via + "\r\n";
    }

    let to: string = this.getHeader("To") || "";

    if (!this.toTag && code > 100) {
      // FIXME: This is a MUST, but we are generating a random tag each response
      // o  To header tags MUST be generated for responses in a stateless
      // manner - in a manner that will generate the same tag for the
      // same request consistently.  For information on tag construction
      // see Section 19.3.
      // https://tools.ietf.org/html/rfc3261#section-8.2.7
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

    this.transport.send(response);
    return response;
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

  // FIXME: Fix this a hack... set in UA.onTransportReceiveResponse()
  public transaction: ClientTransaction | undefined;

  private logger: Logger;

  constructor(public ua: UA) {
    super();
    this.type = TypeStrings.IncomingResponse;
    this.logger = ua.getLogger("sip.sipmessage");
    this.headers = {};
  }

  /**
   * Constructs and sends ACK to 2xx final response. Returns the sent ACK.
   * @param response The 2xx final repsonse the ACK is acknowledging.
   * @param options ACK options; extra headers, body.
   */
  public ack(
    options?: {
      extraHeaders?: Array<string>,
      body?: string | { body: string, contentType: string }
    }
  ): OutgoingRequest {
    if (!this.statusCode || this.statusCode < 200 || this.statusCode > 299) {
      throw new Error("Response status code must be 2xx to ACK.");
    }

    if (this.method !== C.INVITE) {
      throw new Error("Response must to be for an INVITE to ACK.");
    }

    if (!this.transaction) {
      throw new Error("Transaction undefined.");
    }

    if (!(this.transaction instanceof InviteClientTransaction)) {
      throw new Error("Transaction not instance of InviteServerTrasaction.");
    }

    // FIXME: This should all be done by the dialog. The current dialog code
    // structure is not currently setup to deal with ACKs to re-INVITEs, so
    // what follows is duplicate code for specifially handling the ACK case.

    // Dialog must exist after receipt of a 2xx response to an INVITE.
    const dialog = this.ua.dialogs[this.callId + this.fromTag + this.toTag];
    if (!dialog) {
      throw new Error("Dialog undefined.");
    }

    // The UAC core MUST generate an ACK request for each 2xx received from
    // the transaction layer.  The header fields of the ACK are constructed
    // in the same way as for any request sent within a dialog (see Section
    // 12) with the exception of the CSeq and the header fields related to
    // authentication.  The sequence number of the CSeq header field MUST be
    // the same as the INVITE being acknowledged, but the CSeq method MUST
    // be ACK.  The ACK MUST contain the same credentials as the INVITE.  If
    // the 2xx contains an offer (based on the rules above), the ACK MUST
    // carry an answer in its body.  If the offer in the 2xx response is not
    // acceptable, the UAC core MUST generate a valid answer in the ACK and
    // then send a BYE immediately.
    // https://tools.ietf.org/html/rfc3261#section-13.2.2.4

    // The URI in the To field of the request MUST be set to the remote URI
    // from the dialog state.  The tag in the To header field of the request
    // MUST be set to the remote tag of the dialog ID.  The From URI of the
    // request MUST be set to the local URI from the dialog state.  The tag
    // in the From header field of the request MUST be set to the local tag
    // of the dialog ID.  If the value of the remote or local tags is null,
    // the tag parameter MUST be omitted from the To or From header fields,
    // respectively.
    //
    // The Call-ID of the request MUST be set to the Call-ID of the dialog.
    // Requests within a dialog MUST contain strictly monotonically
    // increasing and contiguous CSeq sequence numbers (increasing-by-one)
    // in each direction (excepting ACK and CANCEL of course, whose numbers
    // equal the requests being acknowledged or cancelled).
    // https://tools.ietf.org/html/rfc3261#section-12.2.1.1
    const callId = this.callId;
    const cseq = this.cseq;
    const fromUri = dialog.localUri;
    const fromTag = this.fromTag;
    const toUri = dialog.remoteUri;
    const toTag = this.toTag;

    // The UAC uses the remote target and route set to build the Request-URI
    // and Route header field of the request.
    //
    // If the route set is empty, the UAC MUST place the remote target URI
    // into the Request-URI.  The UAC MUST NOT add a Route header field to
    // the request.
    //
    // If the route set is not empty, and the first URI in the route set
    // contains the lr parameter (see Section 19.1.1), the UAC MUST place
    // the remote target URI into the Request-URI and MUST include a Route
    // header field containing the route set values in order, including all
    // parameters.
    //
    // If the route set is not empty, and its first URI does not contain the
    // lr parameter, the UAC MUST place the first URI from the route set
    // into the Request-URI, stripping any parameters that are not allowed
    // in a Request-URI.  The UAC MUST add a Route header field containing
    // the remainder of the route set values in order, including all
    // parameters.  The UAC MUST then place the remote target URI into the
    // Route header field as the last value.
    // https://tools.ietf.org/html/rfc3261#section-12.2.1.1

    // The lr parameter, when present, indicates that the element
    // responsible for this resource implements the routing mechanisms
    // specified in this document.  This parameter will be used in the
    // URIs proxies place into Record-Route header field values, and
    // may appear in the URIs in a pre-existing route set.
    //
    // This parameter is used to achieve backwards compatibility with
    // systems implementing the strict-routing mechanisms of RFC 2543
    // and the rfc2543bis drafts up to bis-05.  An element preparing
    // to send a request based on a URI not containing this parameter
    // can assume the receiving element implements strict-routing and
    // reformat the message to preserve the information in the
    // Request-URI.
    // https://tools.ietf.org/html/rfc3261#section-19.1.1

    // NOTE: Not backwards compatibile with RFC 2543 (no support for strict-routing).
    const ruri = dialog.remoteTarget;
    const routeSet = dialog.routeSet;

    const request = new OutgoingRequest(
      C.ACK,
      ruri,
      this.ua,
      {
        callId,
        cseq,
        fromUri,
        fromTag,
        toUri,
        toTag,
        routeSet
      },
      options ? options.extraHeaders : undefined,
      options ? options.body : undefined
    );

    this.transaction.ackResponse(request);

    return request;
  }
}
