import { NameAddrHeader } from "./name-addr-header";
import { URI } from "./uri";

export declare namespace Grammar {
  export function parse(input: string, startRule: string): any;
  export function nameAddrHeaderParse(nameAddrHeader: string): NameAddrHeader | undefined;
  export function URIParse(uri: string): URI | undefined
}