(function (SIP) {

var RegisterContext;

RegisterContext = function (ua) {
  var regId = 1,
    events = [
      'registered',
      'unregistered'
    ];

  this.registrar = ua.configuration.registrar_server;
  this.expires = ua.configuration.register_expires;

  // Extends ClientContext
  SIP.Utils.augment(this, SIP.ClientContext, [ua, 'REGISTER', this.registrar]);

  // Call-ID and CSeq values RFC3261 10.2
  this.call_id = SIP.Utils.createRandomToken(22);
  this.cseq = 80;

  this.to_uri = ua.configuration.uri;

  this.registrationTimer = null;

  // Set status
  this.registered = false;

  // Save into ua instance
  ua.registrationContext = this;

  // Contact header
  this.contact = ua.contact.toString();

  if(regId) {
    this.contact += ';reg-id='+ regId;
    this.contact += ';+sip.instance="<urn:uuid:'+ ua.configuration.instance_id+'>"';
  }

  this.logger = ua.getLogger('sip.registercontext');
  this.initMoreEvents(events);
};

RegisterContext.prototype = {
  register: function (options) {
    var extraHeaders, cause, self = this;
    options = options || {};
    extraHeaders = options.extraHeaders || [];
    extraHeaders.push('Contact: '+ this.contact + ';expires=' + this.expires);
    extraHeaders.push('Allow: '+ SIP.Utils.getAllowedMethods(this.ua));


    this.receiveResponse = function(response) {
      var contact, expires,
        contacts = response.getHeaders('contact').length;

      // Discard responses to older REGISTER/un-REGISTER requests.
      if(response.cseq !== this.cseq) {
        return;
      }

      // Clear registration timer
      if (this.registrationTimer !== null) {
        window.clearTimeout(this.registrationTimer);
        this.registrationTimer = null;
      }

      switch(true) {
        case /^1[0-9]{2}$/.test(response.status_code):
          // Ignore provisional responses.
          this.emit('progress', this, {
            code: response.status_code,
            response: response
          });
          break;
        case /^2[0-9]{2}$/.test(response.status_code):
          if(response.hasHeader('expires')) {
            expires = response.getHeader('expires');
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
          this.registrationTimer = window.setTimeout(function() {
            self.registrationTimer = null;
            self.register();
          }, (expires * 1000) - 3000);

          //Save gruu values
          if (contact.hasParam('temp-gruu')) {
            this.ua.contact.temp_gruu = contact.getParam('temp-gruu').replace(/"/g,'');
          }
          if (contact.hasParam('pub-gruu')) {
            this.ua.contact.pub_gruu = contact.getParam('pub-gruu').replace(/"/g,'');
          }

          this.registered = true;
          this.emit('accepted', this, {
            code: response.status_code,
            response: response
          });
          this.emit('registered', this, {
            response: response
          });
          break;
        // Interval too brief RFC3261 10.2.8
        case /^423$/.test(response.status_code):
          if(response.hasHeader('min-expires')) {
            // Increase our registration interval to the suggested minimum
            this.expires = response.getHeader('min-expires');
            // Attempt the registration again immediately
            this.register();
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

    /**
    * @private
    */
    this.onRequestTimeout = function() {
      this.registrationFailure(null, SIP.C.causes.REQUEST_TIMEOUT);
    };

    /**
    * @private
    */
    this.onTransportError = function() {
      this.registrationFailure(null, SIP.C.causes.CONNECTION_ERROR);
    };



    this.send({
      params: {
        'to_uri': this.to_uri,
        'call_id': this.call_id,
        'cseq': (this.cseq += 1)
      },
      extraHeaders: extraHeaders
    });
  },

  registrationFailure: function (response, cause) {
    this.emit('failed', this, {
      code: (response && response.status_code) || 0,
      response: response || null,
      cause: cause
    });

    if (this.registered) {
      this.registered = false;
      this.emit('unregistered', this, {
        code: (response && response.status_code) || 0,
        response: response || null,
        cause: cause
      });
    }
  },

  onTransportConnected: function() {
    this.register();
  },

  close: function() {
    this.registered_before = this.registered;
    this.unregister();
  },

  unregister: function () { console.log('no dice'); },
  unregistered: function () {},
  registered: function () {}
  

};


SIP.RegisterContext = RegisterContext;
}(SIP));
