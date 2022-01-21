export declare class Md5 {
    static hashStr(str: string, raw?: false): string;
    static hashStr(str: string, raw?: true): Int32Array;
    static hashAsciiStr(str: string, raw?: false): string;
    static hashAsciiStr(str: string, raw?: true): Int32Array;
    private static stateIdentity;
    private static buffer32Identity;
    private static hexChars;
    private static hexOut;
    private static onePassHasher;
    private static _hex;
    private static _md5cycle;
    private _dataLength;
    private _bufferLength;
    private _state;
    private _buffer;
    private _buffer8;
    private _buffer32;
    constructor();
    start(): this;
    appendStr(str: string): this;
    appendAsciiStr(str: string): this;
    appendByteArray(input: Uint8Array): this;
    getState(): {
        buffer: string;
        buflen: number;
        length: number;
        state: number[];
    };
    setState(state: any): void;
    end(raw?: boolean): string | Int32Array | undefined;
}
//# sourceMappingURL=md5.d.ts.map