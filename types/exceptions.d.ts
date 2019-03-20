import { SessionStatus, TypeStrings } from "./enums";

/**
 * An Exception is considered a condition that a resonable application may wish to catch.
 * An Error indicates serious problems that a reasonable application should not try to catch.
 */
export declare class Exception extends Error {
  constructor(message?: string);
}

export declare namespace Exceptions {
  /**
   * Transport error.
   */
  export class TransportError extends Exception {
    constructor(message?: string);
  }
}

/**
 * DEPRECATED
 */
declare class LegacyException extends Exception {
  type: TypeStrings;
  name: string;
  message: string;
  code: number;

  constructor(code: number, name: string, message: string);
}

export declare namespace Exceptions {
  export class ConfigurationError extends LegacyException {
    parameter: string;
    value: any;

    constructor(parameter: string, value?: any)
  }

  export class InvalidStateError extends LegacyException {
    status: SessionStatus;

    constructor(status: SessionStatus);
  }

  export class NotSupportedError extends LegacyException {
    constructor(message: string);
  }

  export class RenegotiationError extends LegacyException {
    constructor(message: string);
  }

  export class MethodParameterError extends LegacyException {
    method: string;
    parameter: string;
    value: any;

    constructor(method: string, parameter: string, value: any);
  }

  export class SessionDescriptionHandlerError extends LegacyException {
    error: string | undefined;
    method: string;

    constructor(method: string, error?: string, message?: string);
  }
}