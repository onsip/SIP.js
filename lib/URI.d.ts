import { TypeStrings } from "./Enums";
export interface URIObject {
    scheme: string;
    user: string | undefined;
    host: string;
    port: number | undefined;
}
export declare class Parameters {
    type: TypeStrings;
    parameters: {
        [name: string]: any;
    };
    constructor(parameters: {
        [name: string]: any;
    });
    setParam(key: string, value: any): void;
    getParam(key: string): any;
    hasParam(key: string): boolean;
    deleteParam(parameter: string): any;
    clearParams(): void;
}
/**
 * @class Class creating a SIP URI.
 *
 * @param {String} [scheme]
 * @param {String} [user]
 * @param {String} host
 * @param {String} [port]
 * @param {Object} [parameters]
 * @param {Object} [headers]
 *
 */
export declare class URI extends Parameters {
    type: TypeStrings;
    private headers;
    private normal;
    private raw;
    constructor(scheme: string, user: string, host: string, port?: number, parameters?: any, headers?: any);
    readonly _normal: URIObject;
    readonly _raw: URIObject;
    scheme: string;
    user: string | undefined;
    host: string;
    readonly aor: string;
    port: number | undefined;
    setHeader(name: string, value: any): void;
    getHeader(name: string): string | undefined;
    hasHeader(name: string): boolean;
    deleteHeader(header: string): any;
    clearHeaders(): void;
    clone(): URI;
    toRaw(): string;
    toString(): string;
    private _toString;
    private escapeUser;
    private headerize;
}
