import { Parameters, URI } from "./uri";

/**
 * @class Class creating a Name Address SIP header.
 *
 * @param {SIP.URI} uri
 * @param {String} [displayName]
 * @param {Object} [parameters]
 *
 */
export declare class NameAddrHeader extends Parameters {
  uri: URI;
  friendlyName: string;
  displayName: string;

  constructor(uri: URI, displayName: string, parameters: Array<{ key: string, value: string }>);

  clone(): NameAddrHeader;
  toString(): string;
}
