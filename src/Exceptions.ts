import { Exception } from "./core";
import { SessionStatus, TypeStrings } from "./Enums";

// tslint:disable:max-classes-per-file

export namespace Exceptions {

  /**
   * Indicates the session description handler has closed.
   * Occurs when getDescription() or setDescription() are called after close() has been called.
   * Occurs when close() is called while getDescription() or setDescription() are in progress.
   */
  export class ClosedSessionDescriptionHandlerError extends Exception {
    constructor() {
      super("The session description handler has closed.");
    }
  }

  /**
   * Indicates the session terminated before the action completed.
   */
  export class TerminatedSessionError extends Exception {
    constructor() {
      super("The session has terminated.");
    }
  }

  /**
   * Unsupported session description content type.
   */
  export class UnsupportedSessionDescriptionContentTypeError extends Exception {
    constructor(message?: string) {
      super(message ? message : "Unsupported session description content type.");
    }
  }
}

/**
 * DEPRECATED: The original implementation of exceptions in this library attempted to
 * deal with the lack of type checking in JavaScript by adding a "type" attribute
 * to objects and using that to discriminate. On top of that it layered allcoated
 * "code" numbers and constant "name" strings. All of that is unnecessary when using
 * TypeScript, inheriting from Error and properly setting up the prototype chain...
 */
abstract class LegacyException extends Exception {
  public type!: TypeStrings;
  public name: string;
  public message: string;
  public code: number;

  constructor(code: number, name: string, message: string) {
    super(message);
    this.code = code;
    this.name = name;
    this.message = message;
  }
}

export namespace Exceptions {
  export class ConfigurationError extends LegacyException {
    public parameter: string;
    public value: any;

    constructor(parameter: string, value?: any) {
      super(1, "CONFIGURATION_ERROR", (!value) ? "Missing parameter: " + parameter :
        "Invalid value " + JSON.stringify(value) + " for parameter '" + parameter + "'");
      this.type = TypeStrings.ConfigurationError;
      this.parameter = parameter;
      this.value = value;
    }
  }

  export class InvalidStateError extends LegacyException {
    public status: SessionStatus;

    constructor(status: SessionStatus) {
      super(2, "INVALID_STATE_ERROR", "Invalid status: " + status);
      this.type = TypeStrings.InvalidStateError;
      this.status = status;
    }
  }

  export class NotSupportedError extends LegacyException {
    constructor(message: string) {
      super(3, "NOT_SUPPORTED_ERROR", message);
      this.type = TypeStrings.NotSupportedError;
    }
  }

  // 4 was GetDescriptionError, which was deprecated and now removed

  export class RenegotiationError extends LegacyException {
    constructor(message: string) {
      super(5, "RENEGOTIATION_ERROR", message);
      this.type = TypeStrings.RenegotiationError;
    }
  }

  export class MethodParameterError extends LegacyException {
    public method: string;
    public parameter: string;
    public value: any;

    constructor(method: string, parameter: string, value: any) {
      super(6, "METHOD_PARAMETER_ERROR", (!value) ?
        "Missing parameter: " + parameter :
        "Invalid value " + JSON.stringify(value) + " for parameter '" + parameter + "'");
      this.type = TypeStrings.MethodParameterError;
      this.method = method;
      this.parameter = parameter;
      this.value = value;
    }
  }

  // 7 was TransportError, which was replaced

  export class SessionDescriptionHandlerError extends LegacyException {
    public error: string | undefined;
    public method: string;

    constructor(method: string, error?: string, message?: string) {
      super(8, "SESSION_DESCRIPTION_HANDLER_ERROR", message || "Error with Session Description Handler");
      this.type = TypeStrings.SessionDescriptionHandlerError;
      this.method = method;
      this.error = error;
    }
  }
}
