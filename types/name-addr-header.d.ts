import { URI } from "./uri";

export class NameAddrHeader {
  uri: URI;
  displayName: string;

  constructor(uri: URI, displayName: string, parameters: Array<{ key: string, value: string }>);
  static parse(name_addr_header: string): NameAddrHeader;

  setParam(key: string, value?: string): void;
  getParam(key: string): string;
  deleteParam(key: string): string;
  clearParams(): void;
}
