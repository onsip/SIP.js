import { Parameters } from "./parameters";

interface URIObject {
  scheme: string;
  user: string | undefined;
  host: string;
  port: number | undefined;
}

/**
 * URI.
 * @public
 */
export class URI extends Parameters {
  private headers: {[name: string]: any} = {};
  private normal: URIObject;
  private raw: URIObject;

  /**
   * Constructor
   * @param scheme -
   * @param user -
   * @param host -
   * @param port -
   * @param parameters -
   * @param headers -
   */
  constructor(
    scheme: string,
    user: string,
    host: string,
    port?: number,
    parameters?: any,
    headers?: any
  ) {
    super(parameters);
    // Checks
    if (!host) {
      throw new TypeError('missing or invalid "host" parameter');
    }

    // Initialize parameters
    scheme = scheme || "sip";

    for (const header in headers) {
      if (headers.hasOwnProperty(header)) {
        this.setHeader(header, headers[header]);
      }
    }

    // Raw URI
    this.raw = {
      scheme,
      user,
      host,
      port
    };

    // Normalized URI
    this.normal = {
      scheme: scheme.toLowerCase(),
      user,
      host: host.toLowerCase(),
      port
    };
  }

  get scheme(): string { return this.normal.scheme; }
  set scheme(value: string) {
    this.raw.scheme = value;
    this.normal.scheme = value.toLowerCase();
  }

  get user(): string | undefined { return this.normal.user; }
  set user(value: string | undefined) {
    this.normal.user = this.raw.user = value;
  }

  get host(): string { return this.normal.host; }
  set host(value: string) {
    this.raw.host = value;
    this.normal.host = value.toLowerCase();
  }

  get aor(): string { return this.normal.user + "@" + this.normal.host; }

  get port(): number | undefined { return this.normal.port; }
  set port(value: number | undefined) {
    this.normal.port = this.raw.port = value === 0 ? value : value;
  }

  public setHeader(name: string, value: any): void {
    this.headers[this.headerize(name)] = (value instanceof Array) ? value : [value];
  }

  public getHeader(name: string): string | undefined {
    if (name) {
      return this.headers[this.headerize(name)];
    }
  }

  public hasHeader(name: string): boolean {
    return !!name && !!this.headers.hasOwnProperty(this.headerize(name));
  }

  public deleteHeader(header: string): any {
    header = this.headerize(header);

    if (this.headers.hasOwnProperty(header)) {
      const value: any = this.headers[header];
      delete this.headers[header];
      return value;
    }
  }

  public clearHeaders(): void {
    this.headers = {};
  }

  public clone(): URI {
    return new URI(
      this._raw.scheme,
      this._raw.user || "",
      this._raw.host,
      this._raw.port,
      JSON.parse(JSON.stringify(this.parameters)),
      JSON.parse(JSON.stringify(this.headers)));
  }

  public toRaw(): string {
    return this._toString(this._raw);
  }

  public toString(): string {
    return this._toString(this._normal);
  }

  private get _normal(): URIObject { return this.normal; }

  private get _raw(): URIObject { return this.raw; }

  private _toString(uri: any): string {
    let uriString: string  = uri.scheme + ":";
    // add slashes if it's not a sip(s) URI
    if (!uri.scheme.toLowerCase().match("^sips?$")) {
      uriString += "//";
    }
    if (uri.user) {
      uriString += this.escapeUser(uri.user) + "@";
    }
    uriString += uri.host;
    if (uri.port || uri.port === 0) {
      uriString += ":" + uri.port;
    }

    for (const parameter in this.parameters) {
      if (this.parameters.hasOwnProperty(parameter)) {
        uriString += ";" + parameter;

        if (this.parameters[parameter] !== null) {
          uriString += "=" + this.parameters[parameter];
        }
      }
    }

    const headers: Array<string> = [];
    for (const header in this.headers) {
      if (this.headers.hasOwnProperty(header)) {
        for (const idx in this.headers[header]) {
          if (this.headers[header].hasOwnProperty(idx)) {
            headers.push(header + "=" + this.headers[header][idx]);
          }
        }
      }
    }

    if (headers.length > 0) {
      uriString += "?" + headers.join("&");
    }

    return uriString;
  }

  /*
   * Hex-escape a SIP URI user.
   * @private
   * @param {String} user
   */
  private escapeUser(user: string): string {
    let decodedUser: string;

    // FIXME: This is called by toString above which should never throw, but
    // decodeURIComponent can throw and I've seen one case in production where
    // it did throw resulting in a cascading failure. This class should be
    // fixed so that decodeURIComponent is not called at this point (in toString).
    // The user should be decoded when the URI is constructor or some other
    // place where we can catch the error before the URI is created or somesuch.
    try {
      decodedUser = decodeURIComponent(user);
    } catch (error) {
      throw error;
    }

    // Don't hex-escape ':' (%3A), '+' (%2B), '?' (%3F"), '/' (%2F).
    return encodeURIComponent(decodedUser)
      .replace(/%3A/ig, ":")
      .replace(/%2B/ig, "+")
      .replace(/%3F/ig, "?")
      .replace(/%2F/ig, "/");
  }

  private headerize(str: string): string {
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
}
