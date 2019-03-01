import { TypeStrings } from "./enums";

export declare class Parameters {
  type: TypeStrings;
  parameters: {[name: string]: any};

  constructor(parameters: {[name: string]: any});

  setParam(key: string, value: any): void;
  getParam(key: string): any | undefined;
  hasParam(key: string): boolean;
  deleteParam(parameter: string): any;
  clearParams(): void
}

export declare class URI extends Parameters {
  scheme?: string;
  user?: string;
  host?: string;
  port?: number;
  aor: string;
  _normal: URI.Object;
  _raw: URI.Object;

  constructor(scheme: string, user: string, host: string, port: number | undefined, parameters?: any, headers?: any);

  setHeader(name: string, value: any): void;
  getHeader(name: string): string | undefined;
  hasHeader(name: string): boolean;
  deleteHeader(name: string): any;
  clearHeaders(): void;
  clone(): URI;
  toRaw(): string;
  toString(): string;
}

export declare namespace URI {
  export interface Object {
    scheme: string;
    user: string | undefined;
    host: string;
    port: number | undefined;
  }
}
