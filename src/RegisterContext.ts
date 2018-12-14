"use strict";
module.exports = function (SIP) {

var RegisterContext;

RegisterContext = function (ua, options = {}) {
  this.options = {};

  this.logger = ua.getLogger('sip.registercontext');

  this.loadConfig(options);

  if (this.options.regId && !this.options.instanceId) {
    this.options.instanceId = SIP.Utils.newUUID();
  } else if (!this.options.regId && this.options.instanceId) {
    this.options.regId = 1;
  }

  this.options.params.to_uri = this.options.params.to_uri || ua.configuration.uri;
  this.options.params.to_displayName = this.options.params.to_displayName || ua.configuration.displayName;
  this.options.params.call_id = this.options.params.call_id || SIP.Utils.createRandomToken(22);
  this.options.params.cseq = this.options.params.cseq || Math.floor(Math.random() * 10000);

  /* If no 'registrarServer' is set use the 'uri' value without user portion. */
  if (!this.options.registrar) {
    let registrarServer = {};
    if (typeof ua.configuration.uri === 'object') {
      registrarServer = ua.configuration.uri.clone();
      registrarServer.user = null;
    } else {
      registrarServer = ua.configuration.uri;
    }
    this.options.registrar = registrarServer;
  }

  // Registration expires
  this.expires = this.options.expires;

  // Cseq
  this.cseq = this.options.params.cseq;

  // Contact header
  this.contact = ua.contact.toString();

  // Extends ClientContext
  SIP.Utils.augment(this, SIP.ClientContext, [ua, 'REGISTER', this.options.registrar, this.options]);

  this.registrationTimer = null;
  this.registrationExpiredTimer = null;

  // Set status
  this.registered = false;

  ua.on('transportCreated', function (transport) {
    transport.on('disconnected', this.onTransportDisconnected.bind(this));
  }.bind(this));
};

RegisterContext.prototype = Object.create({}, {
  /**
   * Configuration load.
   * @private
   * returns {Boolean}
   */
  loadConfig: {writable: true, value: function loadConfig(configuration) {
    let parameter, value, checkedValue;
    const settings = {
      expires: 600,
      extraContactHeaderParams: [],
      instanceId: null,
      params: {},
      regId: null,
      registrar: null,
    };

    const configCheck = this.getConfigurationCheck();

    // Check Mandatory parameters
    for(parameter in configCheck.mandatory) {
      if(!configuration.hasOwnProperty(parameter)) {
        throw new SIP.Exceptions.ConfigurationError(parameter);
      } else {
        value = configuration[parameter];
        checkedValue = configCheck.mandatory[parameter](value);
        if (checkedValue !== undefined) {
          settings[parameter] = checkedValue;
        } else {
          throw new SIP.Exceptions.ConfigurationError(parameter, value);
        }
      }
    }

    // Check Optional parameters
    for(parameter in configCheck.optional) {
      if(configuration.hasOwnProperty(parameter)) {
        value = configuration[parameter];

        // If the parameter value is an empty array, but shouldn't be, apply its default value.
        if (value instanceof Array && value.length === 0) { continue; }

        // If the parameter value is null, empty string, or undefined then apply its default value.
        if(value === null || value === '' || value === undefined) { continue; }
        // If it's a number with NaN value then also apply its default value.
        // NOTE: JS does not allow "value === NaN", the following does the work:
        else if(typeof(value) === 'number' && isNaN(value)) { continue; }

        checkedValue = configCheck.optional[parameter](value);
        if (checkedValue !== undefined) {
          settings[parameter] = checkedValue;
        } else {
          throw new SIP.Exceptions.ConfigurationError(parameter, value);
        }
      }
    }

    Object.assign(this.options, settings);

    this.logger.log('configuration parameters for RegisterContext after validation:');
    for(parameter in settings) {
      this.logger.log('· ' + parameter + ': ' + JSON.stringify(settings[parameter]));
    }

    return;

  }},

  getConfigurationCheck: {writable: true, value: function getConfigurationCheck () {
    return {
      mandatory: {
      },

      optional: {
        expires: function(expires) {
          if (SIP.Utils.isDecimal(expires)) {
            const value = Number(expires);
            if (value >= 0) {
              return value;
            }
          }
        },
        extraContactHeaderParams: function(extraContactHeaderParams) {
          if (extraContactHeaderParams instanceof Array) {
            return extraContactHeaderParams.filter((contactHeaderParam) => (typeof contactHeaderParam === 'string'));
          }
        },
        instanceId: function(instanceId) {
          if (typeof instanceId !== 'string') {
            return;
          }

          if ((/^uuid:/i.test(instanceId))) {
            instanceId = instanceId.substr(5);
          }

          if (SIP.Grammar.parse(instanceId, 'uuid') === -1) {
            return;
          } else {
            return instanceId;
          }
        },
        params: function(params) {
          if (typeof params === 'object') {
            return params;
          }
        },
        regId: function(regId) {
          if (SIP.Utils.isDecimal(regId)) {
            const value = Number(regId);
            if (value >= 0) {
              return value;
            }
          }
        },
        registrar: function(registrar) {
          if(typeof registrar !== 'string') {
            return;
          }

          if (!/^sip:/i.test(registrar)) {
            registrar = SIP.C.SIP + ':' + registrar;
          }
          const parsed = SIP.URI.parse(registrar);

          if(!parsed) {
            return;
          } else if(parsed.user) {
            return;
          } else {
            return parsed;
          }
        }
      }
    };
  }},

  /**
   * Helper Function to generate Contact Header
   * @private
   * returns {String}
   */
  generateContactHeader: {writable: true, value: function generateContactHeader(expires = 0) {
    let contact = this.contact;
    if (this.options.regId && this.options.instanceId) {
      contact += ';reg-id=' + this.options.regId;
      contact += ';+sip.instance="<urn:uuid:' + this.options.instanceId + '>"';
    }

    if (this.options.extraContactHeaderParams) {
      this.options.extraContactHeaderParams.forEach((header) => {
        contact += ';' + header;
      });
    }

    contact += ';expires=' + expires;

    return contact;
  }},

  register: {writable: true, value: function register (options = {}) {
    // Handle Options
    this.options = Object.assign(this.options || {}, options);
    const extraHeaders = (this.options.extraHeaders || []).slice();

    extraHeaders.push('Contact: ' + this.generateContactHeader(this.expires));
    extraHeaders.push('Allow: ' + SIP.UA.C.ALLOWED_METHODS.toString());

    // Save original extraHeaders to be used in .close
    this.closeHeaders = this.options.closeWithHeaders ?
      (this.options.extraHeaders || []).slice() : [];

    this.receiveResponse = function(response) {
      var contact, expires,
        contacts = response.getHeaders('contact').length,
        cause;

      // Discard responses to older REGISTER/un-REGISTER requests.
      if(response.cseq !== this.cseq) {
        return;
      }

      // Clear registration timer
      if (this.registrationTimer !== null) {
        clearTimeout(this.registrationTimer);
        this.registrationTimer = null;
      }

      switch(true) {
        case /^1[0-9]{2}$/.test(response.status_code):
          this.emit('progress', response);
          break;
        case /^2[0-9]{2}$/.test(response.status_code):
          this.emit('accepted', response);

          if(response.hasHeader('expires')) {
            expires = response.getHeader('expires');
          }

          if (this.registrationExpiredTimer !== null) {
            clearTimeout(this.registrationExpiredTimer);
            this.registrationExpiredTimer = null;
          }

          // Search the Contact pointing to us and update the expires value accordingly.
          if (!contacts) {
            this.logger.warn('no Contact header in response to REGISTER, response ignored');
            break;
          }

          while(contacts--) {
            contact = response.parseHeader('contact', contacts);
            if(contact.uri.user === this.ua.contact.uri.user) {
              expires = contact.getParam('expires');
              break;
            } else {
              contact = null;
            }
          }

          if (!contact) {
            this.logger.warn('no Contact header pointing to us, response ignored');
            break;
          }

          if(!expires) {
            expires = this.expires;
          }

          // Re-Register before the expiration interval has elapsed.
          // For that, decrease the expires value. ie: 3 seconds
          this.registrationTimer = setTimeout(() => {
            this.registrationTimer = null;
            this.register(this.options);
          }, (expires * 1000) - 3000);
          this.registrationExpiredTimer = setTimeout(() => {
            this.logger.warn('registration expired');
            if (this.registered) {
              this.unregistered(null, SIP.C.causes.EXPIRES);
            }
          }, expires * 1000);

          //Save gruu values
          if (contact.hasParam('temp-gruu')) {
            this.ua.contact.temp_gruu = SIP.URI.parse(contact.getParam('temp-gruu').replace(/"/g,''));
          }
          if (contact.hasParam('pub-gruu')) {
            this.ua.contact.pub_gruu = SIP.URI.parse(contact.getParam('pub-gruu').replace(/"/g,''));
          }

          this.registered = true;
          this.emit('registered', response || null);
          break;
        // Interval too brief RFC3261 10.2.8
        case /^423$/.test(response.status_code):
          if(response.hasHeader('min-expires')) {
            // Increase our registration interval to the suggested minimum
            this.expires = response.getHeader('min-expires');
            // Attempt the registration again immediately
            this.register(this.options);
          } else { //This response MUST contain a Min-Expires header field
            this.logger.warn('423 response received for REGISTER without Min-Expires');
            this.registrationFailure(response, SIP.C.causes.SIP_FAILURE_CODE);
          }
          break;
        default:
          cause = SIP.Utils.sipErrorCause(response.status_code);
          this.registrationFailure(response, cause);
      }
    };

    this.onRequestTimeout = function() {
      this.registrationFailure(null, SIP.C.causes.REQUEST_TIMEOUT);
    };

    this.onTransportError = function() {
      this.registrationFailure(null, SIP.C.causes.CONNECTION_ERROR);
    };

    this.cseq++;
    this.request.cseq = this.cseq;
    this.request.setHeader('cseq', this.cseq + ' REGISTER');
    this.request.extraHeaders = extraHeaders;
    this.send();
  }},

  registrationFailure: {writable: true, value: function registrationFailure  (response, cause) {
    this.emit('failed', response || null, cause || null);
  }},

  onTransportDisconnected: {writable: true, value: function onTransportDisconnected () {
    this.registered_before = this.registered;
    if (this.registrationTimer !== null) {
      clearTimeout(this.registrationTimer);
      this.registrationTimer = null;
    }

    if (this.registrationExpiredTimer !== null) {
      clearTimeout(this.registrationExpiredTimer);
      this.registrationExpiredTimer = null;
    }

    if(this.registered) {
      this.unregistered(null, SIP.C.causes.CONNECTION_ERROR);
    }
  }},

  close: {writable: true, value: function close () {
    var options = {
      all: false,
      extraHeaders: this.closeHeaders
    };

    this.registered_before = this.registered;
    if (this.registered) {
      this.unregister(options);
    }
  }},

  unregister: {writable: true, value: function unregister (options) {
    var extraHeaders;

    options = options || {};

    if(!this.registered && !options.all) {
      this.logger.warn('Already unregistered, but sending an unregister anyways.');
    }

    extraHeaders = (options.extraHeaders || []).slice();

    this.registered = false;

    // Clear the registration timer.
    if (this.registrationTimer !== null) {
      clearTimeout(this.registrationTimer);
      this.registrationTimer = null;
    }

    if(options.all) {
      extraHeaders.push('Contact: *');
      extraHeaders.push('Expires: 0');
    } else {
      extraHeaders.push('Contact: '+ this.generateContactHeader(0));
    }


    this.receiveResponse = function(response) {
      var cause;

      switch(true) {
        case /^1[0-9]{2}$/.test(response.status_code):
          this.emit('progress', response);
          break;
        case /^2[0-9]{2}$/.test(response.status_code):
          this.emit('accepted', response);
          if (this.registrationExpiredTimer !== null) {
            clearTimeout(this.registrationExpiredTimer);
            this.registrationExpiredTimer = null;
          }
          this.unregistered(response);
          break;
        default:
          cause = SIP.Utils.sipErrorCause(response.status_code);
          this.unregistered(response,cause);
      }
    };

    this.onRequestTimeout = function() {
      // Not actually unregistered...
      //this.unregistered(null, SIP.C.causes.REQUEST_TIMEOUT);
    };

    this.cseq++;
    this.request.cseq = this.cseq;
    this.request.setHeader('cseq', this.cseq + ' REGISTER');
    this.request.extraHeaders = extraHeaders;

    this.send();
  }},

  unregistered: {writable: true, value: function unregistered (response, cause) {
    this.registered = false;
    this.emit('unregistered', response || null, cause || null);
  }}

});


SIP.RegisterContext = RegisterContext;
};
