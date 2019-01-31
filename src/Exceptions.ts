import {
  Exception as ExceptionDefinition,
  Exceptions as ExceptionsDefinition
} from "../types/exceptions";

import { SessionStatus, TypeStrings } from "./Enums";

// tslint:disable:max-classes-per-file
abstract class Exception extends Error implements ExceptionDefinition {
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
  export class ConfigurationError extends Exception implements ExceptionsDefinition.ConfigurationError {
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

  export class InvalidStateError extends Exception implements ExceptionsDefinition.InvalidStateError {
    public status: SessionStatus;

    constructor(status: SessionStatus) {
      super(2, "INVALID_STATE_ERROR", "Invalid status: " + status);
      this.type = TypeStrings.InvalidStateError;
      this.status = status;
    }
  }

  export class NotSupportedError extends Exception implements ExceptionsDefinition. NotSupportedError {
    constructor(message: string) {
      super(3, "NOT_SUPPORTED_ERROR", message);
      this.type = TypeStrings.NotSupportedError;
    }
  }

  // 4 was GetDescriptionError, which was deprecated and now removed

  export class RenegotiationError extends Exception implements ExceptionsDefinition.RenegotiationError {
    constructor(message: string) {
      super(5, "RENEGOTIATION_ERROR", message);
      this.type = TypeStrings.RenegotiationError;
    }
  }

  export class MethodParameterError extends Exception implements ExceptionsDefinition.MethodParameterError {
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

  export class TransportError extends Exception implements ExceptionsDefinition.TransportError {
    constructor(message: string) {
      super(7, "TRANSPORT_ERROR", message);
      this.type = TypeStrings.TransportError;
    }
  }

  export class SessionDescriptionHandlerError extends Exception
    implements ExceptionsDefinition.SessionDescriptionHandlerError {
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
