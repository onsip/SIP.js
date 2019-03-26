import * as pegGrammar from "./Grammar/dist/Grammar";

import { NameAddrHeader } from "./NameAddrHeader";
import { URI } from "./URI";

export namespace Grammar {
  export function parse(input: string, startRule: string): any {
    const options: any = {startRule};

    try {
      pegGrammar.parse(input, options);
    } catch (e) {
      options.data = -1;
    }
    return options.data;
  }

  /**
   * Parse the given string and returns a SIP.NameAddrHeader instance or undefined if
   * it is an invalid NameAddrHeader.
   * @public
   * @param {String} name_addr_header
   */
  export function nameAddrHeaderParse(nameAddrHeader: string): NameAddrHeader | undefined {
    const parsedNameAddrHeader: any = Grammar.parse(nameAddrHeader, "Name_Addr_Header");

    return parsedNameAddrHeader !== -1 ? (parsedNameAddrHeader as NameAddrHeader) : undefined;
  }

  /**
   * Parse the given string and returns a SIP.URI instance or undefined if
   * it is an invalid URI.
   * @public
   * @param {String} uri
   */
  export function URIParse(uri: string): URI | undefined {
    const parsedUri: any = Grammar.parse(uri, "SIP_URI");

    return parsedUri !== -1 ? (parsedUri as URI) : undefined;
  }
}
