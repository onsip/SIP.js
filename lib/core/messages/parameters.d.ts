/**
 * @internal
 */
export declare class Parameters {
    parameters: {
        [name: string]: string;
    };
    constructor(parameters: {
        [name: string]: string;
    });
    setParam(key: string, value: any): void;
    getParam(key: string): string | undefined;
    hasParam(key: string): boolean;
    deleteParam(parameter: string): any;
    clearParams(): void;
}
//# sourceMappingURL=parameters.d.ts.map