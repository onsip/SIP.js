import { TypeStrings } from "./Enums";
import { Parameters, URI } from "./URI";

/**
 * @class Class creating a Name Address SIP header.
 *
 * @param {SIP.URI} uri
 * @param {String} [displayName]
 * @param {Object} [parameters]
 *
 */
export class NameAddrHeader extends Parameters {
  public type: TypeStrings;
  public uri: URI;
  // tslint:disable-next-line:variable-name
  private _displayName: string;

  constructor(uri: URI, displayName: string, parameters: Array<{ key: string, value: string }>) {
    super(parameters);
    this.type = TypeStrings.NameAddrHeader;
    // Checks
    if (!uri || !(uri.type === TypeStrings.URI)) {
      throw new TypeError('missing or invalid "uri" parameter');
    }

    this.uri = uri;
    this._displayName = displayName;
  }

  get friendlyName(): string {
    return this.displayName || this.uri.aor;
  }

  get displayName() { return this._displayName; }
  set displayName(value: string) {
    this._displayName = value;
  }

  public clone(): NameAddrHeader {
    return new NameAddrHeader(
      this.uri.clone(),
      this._displayName,
      JSON.parse(JSON.stringify(this.parameters)));
  }

  public toString(): string {
    let body: string = (this.displayName || this.displayName === "0") ? '"' + this.displayName + '" ' : "";
    body += "<" + this.uri.toString() + ">";

    for (const parameter in this.parameters) {
      if (this.parameters.hasOwnProperty(parameter)) {
        body += ";" + parameter;

        if (this.parameters[parameter] !== null) {
          body += "=" + this.parameters[parameter];
        }
      }
    }

    return body;
  }
}
