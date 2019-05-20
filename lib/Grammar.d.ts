import { NameAddrHeader } from "./NameAddrHeader";
import { URI } from "./URI";
export declare namespace Grammar {
    function parse(input: string, startRule: string): any;
    /**
     * Parse the given string and returns a SIP.NameAddrHeader instance or undefined if
     * it is an invalid NameAddrHeader.
     * @public
     * @param {String} name_addr_header
     */
    function nameAddrHeaderParse(nameAddrHeader: string): NameAddrHeader | undefined;
    /**
     * Parse the given string and returns a SIP.URI instance or undefined if
     * it is an invalid URI.
     * @public
     * @param {String} uri
     */
    function URIParse(uri: string): URI | undefined;
}
