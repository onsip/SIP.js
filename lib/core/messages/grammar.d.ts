import { NameAddrHeader } from "./name-addr-header";
import { URI } from "./uri";
/**
 * Grammar.
 * @internal
 */
export declare namespace Grammar {
    /**
     * Parse.
     * @param input -
     * @param startRule -
     */
    function parse(input: string, startRule: string): any;
    /**
     * Parse the given string and returns a SIP.NameAddrHeader instance or undefined if
     * it is an invalid NameAddrHeader.
     * @param name_addr_header -
     */
    function nameAddrHeaderParse(nameAddrHeader: string): NameAddrHeader | undefined;
    /**
     * Parse the given string and returns a SIP.URI instance or undefined if
     * it is an invalid URI.
     * @param uri -
     */
    function URIParse(uri: string): URI | undefined;
}
//# sourceMappingURL=grammar.d.ts.map