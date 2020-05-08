import { Parameters } from "./parameters";
/**
 * URI.
 * @public
 */
export declare class URI extends Parameters {
    private headers;
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
    constructor(scheme: string, user: string, host: string, port?: number, parameters?: any, headers?: any);
    get scheme(): string;
    set scheme(value: string);
    get user(): string | undefined;
    set user(value: string | undefined);
    get host(): string;
    set host(value: string);
    get aor(): string;
    get port(): number | undefined;
    set port(value: number | undefined);
    setHeader(name: string, value: any): void;
    getHeader(name: string): string | undefined;
    hasHeader(name: string): boolean;
    deleteHeader(header: string): any;
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
//# sourceMappingURL=uri.d.ts.map