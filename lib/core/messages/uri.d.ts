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
    private readonly _normal;
    private readonly _raw;
    private _toString;
    private escapeUser;
    private headerize;
}
//# sourceMappingURL=uri.d.ts.map