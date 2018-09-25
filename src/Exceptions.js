"use strict";
/**
 * @fileoverview Exceptions
 */

/**
 * SIP Exceptions.
 * @augments SIP
 */
module.exports = {
  ConfigurationError: (function(){
    var exception = function(parameter, value) {
      this.code = 1;
      this.name = 'CONFIGURATION_ERROR';
      this.parameter = parameter;
      this.value = value;
      this.message = (!this.value)? 'Missing parameter: '+ this.parameter : 'Invalid value '+ JSON.stringify(this.value) +' for parameter "'+ this.parameter +'"';
    };
    exception.prototype = new Error();
    return exception;
  }()),

  InvalidStateError: (function(){
    var exception = function(status) {
      this.code = 2;
      this.name = 'INVALID_STATE_ERROR';
      this.status = status;
      this.message = 'Invalid status: ' + status;
    };
    exception.prototype = new Error();
    return exception;
  }()),

  NotSupportedError: (function(){
    var exception = function(message) {
      this.code = 3;
      this.name = 'NOT_SUPPORTED_ERROR';
      this.message = message;
    };
    exception.prototype = new Error();
    return exception;
  }()),

  // Deprecated
  GetDescriptionError: (function(){
    var exception = function(message) {
      this.code = 4;
      this.name = 'GET_DESCRIPTION_ERROR';
      this.message = message;
    };
    exception.prototype = new Error();
    return exception;
  }()),

  RenegotiationError: (function(){
    var exception = function(message) {
      this.code = 5;
      this.name = 'RENEGOTIATION_ERROR';
      this.message = message;
    };
    exception.prototype = new Error();
    return exception;
  }()),

  MethodParameterError: (function(){
    var exception = function(method, parameter, value) {
      this.code = 6;
      this.name = 'METHOD_PARAMETER_ERROR';
      this.method = method;
      this.parameter = parameter;
      this.value = value;
      this.message = (!this.value)? 'Missing parameter: '+ this.parameter : 'Invalid value '+ JSON.stringify(this.value) +' for parameter "'+ this.parameter +'"';
    };
    exception.prototype = new Error();
    return exception;
  }()),

  TransportError: (function(){
    var exception = function(message) {
      this.code = 7;
      this.name = 'TRANSPORT_ERROR';
      this.message = message;
    };
    exception.prototype = new Error();
    return exception;
  }()),

  SessionDescriptionHandlerError: (function(){
    var exception = function(method, error, message) {
      this.code = 8;
      this.name = 'SESSION_DESCRIPTION_HANDLER_ERROR';
      this.method = method;
      this.error = error;
      this.message = message || 'Error with Session Description Handler';
    };
    exception.prototype = new Error();
    return exception;
  }()),
};
