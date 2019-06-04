import { C } from "./Constants";
import { Body } from "./core/messages/body";
import { Grammar } from "./core/messages/grammar";
import { URI } from "./core/messages/uri";
import { BodyObj, SessionDescriptionHandlerModifier } from "./session-description-handler";

export namespace Utils {
  export interface Deferred<T> {
    promise: Promise<T>;
    resolve: () => T;
    reject: () => T;
  }

  export function defer(): Deferred<any> {
    const deferred: any = {};
    deferred.promise = new Promise((resolve, reject) => {
      deferred.resolve = resolve;
      deferred.reject = reject;
    });
    return deferred as Deferred<any>;
  }

  export function reducePromises(arr: Array<SessionDescriptionHandlerModifier>, val: any): Promise<any> {
    return arr.reduce((acc, fn: any) => {
      acc = acc.then(fn);
      return acc;
    }, Promise.resolve(val));
  }

  export function str_utf8_length(str: string): number {
    return encodeURIComponent(str).replace(/%[A-F\d]{2}/g, "U").length;
  }

  export function generateFakeSDP(body: string): string | undefined {
    if (!body) {
      return;
    }

    const start: number = body.indexOf("o=");
    const end: number = body.indexOf("\r\n", start);

    return "v=0\r\n" + body.slice(start, end) + "\r\ns=-\r\nt=0 0\r\nc=IN IP4 0.0.0.0";
  }

  export function isDecimal(num: string): boolean {
    const numAsNum = parseInt(num, 10);
    return !isNaN(numAsNum) && (parseFloat(num) === numAsNum);
  }

  export function createRandomToken(size: number, base: number = 32): string {
    let token: string = "";

    for (let i = 0; i < size; i++ ) {
      const r: number = Math.floor(Math.random() * base);
      token += r.toString(base);
    }

    return token;
  }

  export function newTag(): string {
    // used to use the constant in UA
    return Utils.createRandomToken(10);
  }

  // http://stackoverflow.com/users/109538/broofa
  export function newUUID(): string {
    const UUID: string =  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r: number = Math.floor(Math.random() * 16);
      const v: number = c === "x" ? r : (r % 4 + 8);
      return v.toString(16);
    });

    return UUID;
  }

  /*
   * Normalize SIP URI.
   * NOTE: It does not allow a SIP URI without username.
   * Accepts 'sip', 'sips' and 'tel' URIs and convert them into 'sip'.
   * Detects the domain part (if given) and properly hex-escapes the user portion.
   * If the user portion has only 'tel' number symbols the user portion is clean of 'tel' visual separators.
   * @private
   * @param {String} target
   * @param {String} [domain]
   */
  export function normalizeTarget(target: string | URI, domain?: string): URI | undefined {
    // If no target is given then raise an error.
    if (!target) {
      return;
    // If a SIP.URI instance is given then return it.
    } else if (target instanceof URI) {
      return target as URI;

    // If a string is given split it by '@':
    // - Last fragment is the desired domain.
    // - Otherwise append the given domain argument.
    } else if (typeof target === "string") {
      const targetArray: Array<string> = target.split("@");
      let targetUser: string;
      let targetDomain: string;

      switch (targetArray.length) {
        case 1:
          if (!domain) {
            return;
          }
          targetUser = target;
          targetDomain = domain;
          break;
        case 2:
          targetUser = targetArray[0];
          targetDomain = targetArray[1];
          break;
        default:
          targetUser = targetArray.slice(0, targetArray.length - 1).join("@");
          targetDomain = targetArray[targetArray.length - 1];
      }

      // Remove the URI scheme (if present).
      targetUser = targetUser.replace(/^(sips?|tel):/i, "");

      // Remove 'tel' visual separators if the user portion just contains 'tel' number symbols.
      if (/^[\-\.\(\)]*\+?[0-9\-\.\(\)]+$/.test(targetUser)) {
        targetUser = targetUser.replace(/[\-\.\(\)]/g, "");
      }

      // Build the complete SIP URI.
      target = C.SIP + ":" + Utils.escapeUser(targetUser) + "@" + targetDomain;
      // Finally parse the resulting URI.

      return Grammar.URIParse(target);
    } else {
      return;
    }
  }

  /*
   * Hex-escape a SIP URI user.
   * @private
   * @param {String} user
   */
  export function escapeUser(user: string): string {
    // Don't hex-escape ':' (%3A), '+' (%2B), '?' (%3F"), '/' (%2F).
    return encodeURIComponent(decodeURIComponent(user))
      .replace(/%3A/ig, ":")
      .replace(/%2B/ig, "+")
      .replace(/%3F/ig, "?")
      .replace(/%2F/ig, "/");
  }

  export function headerize(str: string): string {
    const exceptions: any = {
      "Call-Id": "Call-ID",
      "Cseq": "CSeq",
      "Min-Se": "Min-SE",
      "Rack": "RAck",
      "Rseq": "RSeq",
      "Www-Authenticate": "WWW-Authenticate",
    };
    const name: Array<string> = str.toLowerCase().replace(/_/g, "-").split("-");
    const parts: number = name.length;
    let hname: string = "";

    for (let part = 0; part < parts; part++) {
      if (part !== 0) {
        hname += "-";
      }
      hname += name[part].charAt(0).toUpperCase() + name[part].substring(1);
    }
    if (exceptions[hname]) {
      hname = exceptions[hname];
    }
    return hname;
  }

  export function sipErrorCause(statusCode: number): string {

    for (const cause in C.SIP_ERROR_CAUSES) {
      if (((C.SIP_ERROR_CAUSES as any)[cause] as Array<number>).indexOf(statusCode) !== -1) {
        return (C.causes as any)[cause];
      }
    }

    return C.causes.SIP_FAILURE_CODE;
  }

  export function getReasonPhrase(code: number, specific?: string): string {
    return specific || (C.REASON_PHRASE as any)[code] || "";
  }

  export function getReasonHeaderValue(code: number, reason?: string): string {
    reason = Utils.getReasonPhrase(code, reason);
    return "SIP;cause=" + code + ';text="' + reason + '"';
  }

  export function getCancelReason(code: number, reason: string): string | undefined {
    if (code && code < 200 || code > 699) {
      throw new TypeError("Invalid statusCode: " + code);
    } else if (code) {
      return Utils.getReasonHeaderValue(code, reason);
    }
  }

  export function buildStatusLine(code: number, reason?: string): string {
    // Validate code and reason values
    if (!code || (code < 100 || code > 699)) {
      throw new TypeError("Invalid statusCode: " + code);
    } else if (reason && typeof reason !== "string" && !((reason as any) instanceof String)) {
      throw new TypeError("Invalid reason: " + reason);
    }

    reason = Utils.getReasonPhrase(code, reason);

    return "SIP/2.0 " + code + " " + reason + "\r\n";
  }

  /**
   * Create a Body given a BodyObj.
   * @param bodyObj Body Object
   */
  export function fromBodyObj(bodyObj: BodyObj): Body {
    const content = bodyObj.body;
    const contentType = bodyObj.contentType;
    const contentDisposition = contentTypeToContentDisposition(contentType);
    const body: Body = { contentDisposition, contentType, content };
    return body;
  }

  /**
   * Create a BodyObj given a Body.
   * @param bodyObj Body Object
   */
  export function toBodyObj(body: Body): BodyObj {
    const bodyObj: BodyObj = {
      body: body.content,
      contentType: body.contentType
    };
    return bodyObj;
  }

  // If the Content-Disposition header field is missing, bodies of
  // Content-Type application/sdp imply the disposition "session", while
  // other content types imply "render".
  // https://tools.ietf.org/html/rfc3261#section-13.2.1
  function contentTypeToContentDisposition(contentType: string): string {
    if (contentType === "application/sdp") {
      return "session";
    } else {
      return "render";
    }
  }
}
