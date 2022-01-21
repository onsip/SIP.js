/**
 * @internal
 */
export declare class Parameters {
    parameters: {
        [name: string]: string | null;
    };
    constructor(parameters: {
        [name: string]: string | number | null | undefined;
    });
    setParam(key: string, value: string | number | null | undefined): void;
    getParam(key: string): string | null | undefined;
    hasParam(key: string): boolean;
    deleteParam(key: string): string | null | undefined;
    clearParams(): void;
}
//# sourceMappingURL=parameters.d.ts.map