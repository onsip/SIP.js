import { Parameters } from "./parameters";
import { URI } from "./uri";
/**
 * Name Address SIP header.
 * @public
 */
export declare class NameAddrHeader extends Parameters {
    uri: URI;
    private _displayName;
    /**
     * Constructor
     * @param uri -
     * @param displayName -
     * @param parameters -
     */
    constructor(uri: URI, displayName: string, parameters: {
        [name: string]: string;
    });
    get friendlyName(): string;
    get displayName(): string;
    set displayName(value: string);
    clone(): NameAddrHeader;
    toString(): string;
}
//# sourceMappingURL=name-addr-header.d.ts.map