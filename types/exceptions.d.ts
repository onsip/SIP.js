import { SessionStatus, TypeStrings } from "./enums";

export declare class Exception {
  type: TypeStrings;
  name: string;
  message: string;
  code: number;

  constructor(code: number, name: string, message: string);
}

export declare namespace Exceptions {
  export class ConfigurationError extends Exception {
    parameter: string;
    value: any;

    constructor(parameter: string, value?: any)
  }

  export class InvalidStateError extends Exception {
    status: SessionStatus;

    constructor(status: SessionStatus);
  }

  export class NotSupportedError extends Exception {
    constructor(message: string);
  }

  export class RenegotiationError extends Exception {
    constructor(message: string);
  }

  export class MethodParameterError extends Exception {
    method: string;
    parameter: string;
    value: any;

    constructor(method: string, parameter: string, value: any);
  }

  export class TransportError extends Exception {
    constructor(message: string);
  }

  export class SessionDescriptionHandlerError extends Exception {
    error: string | undefined;
    method: string;

    constructor(method: string, error?: string, message?: string);
  }
}