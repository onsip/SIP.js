import { NameAddrHeader } from "./name-addr-header";
/**
 * Incoming message.
 * @public
 */
export declare class IncomingMessage {
    viaBranch: string;
    method: string;
    body: string;
    toTag: string;
    to: NameAddrHeader;
    fromTag: string;
    from: NameAddrHeader;
    callId: string;
    cseq: number;
    via: {
        host: string;
        port: number;
    };
    headers: {
        [name: string]: Array<{
            parsed?: any;
            raw: string;
        }>;
    };
    referTo: string | undefined;
    data: string;
    /**
     * Insert a header of the given name and value into the last position of the
     * header array.
     * @param name - header name
     * @param value - header value
     */
    addHeader(name: string, value: string): void;
    /**
     * Get the value of the given header name at the given position.
     * @param name - header name
     * @returns Returns the specified header, undefined if header doesn't exist.
     */
    getHeader(name: string): string | undefined;
    /**
     * Get the header/s of the given name.
     * @param name - header name
     * @returns Array - with all the headers of the specified name.
     */
    getHeaders(name: string): Array<string>;
    /**
     * Verify the existence of the given header.
     * @param name - header name
     * @returns true if header with given name exists, false otherwise
     */
    hasHeader(name: string): boolean;
    /**
     * Parse the given header on the given index.
     * @param name - header name
     * @param idx - header index
     * @returns Parsed header object, undefined if the
     *   header is not present or in case of a parsing error.
     */
    parseHeader(name: string, idx?: number): any | undefined;
    /**
     * Message Header attribute selector. Alias of parseHeader.
     * @param name - header name
     * @param idx - header index
     * @returns Parsed header object, undefined if the
     *   header is not present or in case of a parsing error.
     *
     * @example
     * message.s('via',3).port
     */
    s(name: string, idx?: number): any | undefined;
    /**
     * Replace the value of the given header by the value.
     * @param name - header name
     * @param value - header value
     */
    setHeader(name: string, value: string): void;
    toString(): string;
}
//# sourceMappingURL=incoming-message.d.ts.map