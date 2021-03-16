import { Parameters } from "./parameters";
/**
 * URI.
 * @public
 */
export declare class URI extends Parameters {
    headers: {
        [name: string]: Array<string>;
    };
    private normal;
    private raw;
    /**
     * Constructor
     * @param scheme -
     * @param user -
     * @param host -
     * @param port -
     * @param parameters -
     * @param headers -
     */
    constructor(scheme: string | undefined, user: string, host: string, port?: number, parameters?: {
        [name: string]: string | number | null;
    }, headers?: {
        [name: string]: Array<string>;
    });
    get scheme(): string;
    set scheme(value: string);
    get user(): string | undefined;
    set user(value: string | undefined);
    get host(): string;
    set host(value: string);
    get aor(): string;
    get port(): number | undefined;
    set port(value: number | undefined);
    setHeader(name: string, value: Array<string> | string): void;
    getHeader(name: string): Array<string> | undefined;
    hasHeader(name: string): boolean;
    deleteHeader(header: string): Array<string> | undefined;
    clearHeaders(): void;
    clone(): URI;
    toRaw(): string;
    toString(): string;
    private get _normal();
    private get _raw();
    private _toString;
    private escapeUser;
    private headerize;
}
/**
 * Returns true if URIs are equivalent per RFC 3261 Section 19.1.4.
 * @param a URI to compare
 * @param b URI to compare
 *
 * @remarks
 * 19.1.4 URI Comparison
 * Some operations in this specification require determining whether two
 * SIP or SIPS URIs are equivalent.
 *
 * https://tools.ietf.org/html/rfc3261#section-19.1.4
 * @internal
 */
export declare function equivalentURI(a: URI, b: URI): boolean;
//# sourceMappingURL=uri.d.ts.map