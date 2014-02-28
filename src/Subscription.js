
/**
 * @fileoverview SIP Subscriber (SIP-Specific Event Notifications RFC6665)
 */

/**
 * @augments SIP
 * @class Class creating a SIP Subscription.
 */
SIP.Subscription = function (ua, target, event, options) {
  var events;

  options = options || {};
  options.extraHeaders = options.extraHeaders || [];

  events = ['notify'];
  this.id = null;
  this.ua = ua;
  this.state = 'init';

  if (!event) {
    throw new TypeError('Event necessary to create a subscription.');
  } else {
    //TODO: check for valid events here probably make a list in SIP.C; or leave it up to app to check?
    //The check may need to/should probably occur on the other side,
    this.event = event;
  }

  if (!options.expires || options.expires < 3600) {
    this.expires = 3600; //1 hour (this is minimum by RFC 6665)
  } else if(typeof options.expires !== 'number'){
    ua.logger.warn('expires must be a number. Using default of 3600.');
    this.expires = 3600;
  } else {
    this.expires = options.expires;
  }

  options.extraHeaders.push('Event: ' + this.event);
  options.extraHeaders.push('Expires: ' + this.expires);

  if (options.body) {
    this.body = options.body;
  }

  this.contact = ua.contact.toString();

  options.extraHeaders.push('Contact: '+ this.contact);
  options.extraHeaders.push('Allow: '+ SIP.Utils.getAllowedMethods(ua));

  SIP.Utils.augment(this, SIP.ClientContext, [ua, SIP.C.SUBSCRIBE, target, options]);

  this.logger = ua.getLogger('sip.subscription');

  this.dialog = null;
  this.timers = {N: null, sub_duration: null};
  this.error_codes  = [404,405,410,416,480,481,482,483,484,485,489,501,604];

  this.initMoreEvents(events);
};

SIP.Subscription.prototype = {
  failed: function(response, cause) {
    var code = response ? response.status_code : null;

    return this.emit('failed', {
      response: response || null,
      cause: cause,
      code: code
    });
  },

  subscribe: function() {
    var sub = this;

    if (['notify_wait', 'pending', 'active', 'terminated'].indexOf(this.state) !== -1) {
      this.logger.error('subscription is already on');
      return;
    }

    window.clearTimeout(this.timers.sub_duration);
    window.clearTimeout(this.timers.N);
    this.timers.N = window.setTimeout(function(){sub.timer_fire();}, SIP.Timers.TIMER_N);

    this.send();

    this.state = 'notify_wait';

    return this;
  },

  receiveResponse: function(response) {
    var expires, sub = this;

    if (this.error_codes.indexOf(response.status_code) !== -1) {
      this.close();
      this.failed(response, null);
    } else if (/^2[0-9]{2}$/.test(response.status_code)){
      expires = response.getHeader('Expires');
      window.clearTimeout(this.timers.N);

      if (this.createConfirmedDialog(response,'UAC')) {
        this.id = this.dialog.id.toString();
        this.ua.subscriptions[this.id] = this;
        // UPDATE ROUTE SET TO BE BACKWARDS COMPATIBLE?
      }

      if (expires && expires <= this.expires) {
        this.timers.sub_duration = window.setTimeout(function(){sub.subscribe();}, expires * 1000);
      } else {
        this.close();

        if (!expires) {
          this.logger.warn('Expires header missing in a 200-class response to SUBSCRIBE');
          this.failed(response, SIP.C.EXPIRES_HEADER_MISSING);
        } else {
          this.logger.warn('Expires header in a 200-class response to SUBSCRIBE with a higher value than the one in the request');
          this.failed(response, SIP.C.INVALID_EXPIRES_HEADER);
        }
      }
    } //Used to just ignore provisional responses; now ignores everything except error_codes and 2xx
  },

  unsubscribe: function() {
    var extraHeaders = [], sub = this;

    this.state = 'terminated';

    extraHeaders.push('Event: ' + this.event);
    extraHeaders.push('Expires: 0');

    extraHeaders.push('Contact: '+ this.contact);
    extraHeaders.push('Allow: '+ SIP.Utils.getAllowedMethods(this.ua));

    this.request = new SIP.OutgoingRequest(this.method, this.request.to.uri.toString(), this.ua, null, extraHeaders);

    //MAYBE, may want to see state
    this.receiveResponse = function(){};

    window.clearTimeout(this.timers.sub_duration);
    window.clearTimeout(this.timers.N);
    this.timers.N = window.setTimeout(function(){sub.timer_fire();}, SIP.Timers.TIMER_N);

    this.send();
  },

  onRequestTimeout: function() {
    this.failed(null, SIP.C.causes.REQUEST_TIMEOUT);
  },

  onTransportError: function() {
    this.failed(null, SIP.C.causes.CONNECTION_ERROR);
  },

  /**
  * @private
  */
  timer_fire: function(){
    if (this.state === 'terminated') {
      this.close();
    } else if (this.state === 'pending' || this.state === 'notify_wait') {
      this.state = 'terminated';
      this.close();
    } else {
      this.subscribe();
    }
  },

  /**
  * @private
  */
  close: function() {
    this.terminateDialog();
    window.clearTimeout(this.timers.N);
    window.clearTimeout(this.timers.sub_duration);

    delete this.ua.subscriptions[this.id];
  },

  /**
  * @private
  */
  createConfirmedDialog: function(message, type) {
    var dialog;

    dialog = new SIP.Dialog(this, message, type);

    if(!dialog.error) {
      this.dialog = dialog;
      return true;
    }
    // Dialog not created due to an error
    else {
      return false;
    }
  },

  /**
  * @private
  */
  terminateDialog: function() {
    if(this.dialog) {
      this.dialog.terminate();
      delete this.dialog;
    }
  },

  /**
  * @private
  */
  receiveRequest: function(request) {
    var sub_state, sub = this;

    if (!this.matchEvent(request)) { //checks event and subscription_state headers
      request.reply(489);
      return;
    }

    sub_state = request.parseHeader('Subscription-State');

    request.reply(200, SIP.C.REASON_200);

    window.clearTimeout(this.timers.N);
    window.clearTimeout(this.timers.sub_duration);

    this.emit('notify', {
      request: request
    });

    switch (sub_state.state) {
      case 'active':
        this.state = 'active';

        if (sub_state.expires) {
          if (sub_state.expires < 3600) {
            sub_state.expires = 3600;
          } else if (sub_state.expires > this.expires) {
            sub_state.expires = this.expires;
          }
          this.timers.sub_duration = window.setTimeout(function(){sub.subscribe();}, (sub_state.expires * 1000));
        }
        break;
      case 'pending':
        if (this.state === 'notify_wait') {
          if (sub_state.expires) {
            if (sub_state.expires < 3600) {
              sub_state.expires = 3600;
            } else if (sub_state.expires > this.expires) {
              sub_state.expires = this.expires;
            }
            this.timers.sub_duration = window.setTimeout(function(){sub.subscribe();}, (sub_state.expires * 1000));
          }
        }
        this.state = 'pending';
        break;
      case 'terminated':
        if (sub_state.reason) {
          this.logger.log('terminating subscription with reason '+ sub_state.reason);
          switch (sub_state.reason) {
            case 'deactivated':
            case 'timeout':
              this.subscribe();
              return;
            case 'probation':
            case 'giveup':
              if(sub_state.params && sub_state.params['retry-after']) {
                this.timers.sub_duration = window.setTimeout(function(){sub.subscribe();}, sub_state.params['retry-after']);
              } else {
                this.subscribe();
              }
              return;
            case 'rejected':
            case 'noresource':
            case 'invariant':
              break;
          }
        }
        this.close();
        break;
    }
  },

  /**
  * @private
  */
  matchEvent: function(request) {
    var event;

    // Check mandatory header Event
    if (!request.hasHeader('Event')) {
      this.logger.warn('missing Event header');
      return false;
    }
    // Check mandatory header Subscription-State
    if (!request.hasHeader('Subscription-State')) {
      this.logger.warn('missing Subscription-State header');
      return false;
    }

    // Check whether the event in NOTIFY matches the event in SUBSCRIBE
    event = request.parseHeader('event').event;

    if (this.event !== event) {
      this.logger.warn('event match failed');
      request.reply(481, 'Event Match Failed');
      return false;
    } else {
      return true;
    }
  }
};
