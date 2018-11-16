
export class URI {
  scheme?: string;
  user?: string;
  host?: string;
  port?: number;

  constructor(scheme?: string, user?: string, host?: string, port?: number, parameters?: string[], headers?: string[]);
  static parse(uri: string): URI;

  setParam(key: string, value?: string): void;
  getParam(key: string): string;
  hasParam(key: string): string;
  deleteParam(key: string): string;
  clearParams(): void;
  setHeader(name: string, value: string): void;
  getHeader(name: string): string[];
  hasHeader(name: string): boolean;
  deleteHeader(name: string): string[];
  clearHeaders(): void;
  clone(): URI;
  toString(): string;
}
