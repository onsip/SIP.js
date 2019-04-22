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
export declare class NameAddrHeader extends Parameters {
    type: TypeStrings;
    uri: URI;
    private _displayName;
    constructor(uri: URI, displayName: string, parameters: Array<{
        key: string;
        value: string;
    }>);
    readonly friendlyName: string;
    displayName: string;
    clone(): NameAddrHeader;
    toString(): string;
}
