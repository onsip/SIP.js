"use strict";
module.exports = function (SIP) {

var DTMF = require('./Session/DTMF')(SIP);
var SessionDescriptionHandlerObserver = require('./SessionDescriptionHandlerObserver');

var Session, InviteServerContext, InviteClientContext, ReferServerContext, ReferClientContext,
 C = {
    //Session states
    STATUS_NULL:                        0,
    STATUS_INVITE_SENT:                 1,
    STATUS_1XX_RECEIVED:                2,
    STATUS_INVITE_RECEIVED:             3,
    STATUS_WAITING_FOR_ANSWER:          4,
    STATUS_ANSWERED:                    5,
    STATUS_WAITING_FOR_PRACK:           6,
    STATUS_WAITING_FOR_ACK:             7,
    STATUS_CANCELED:                    8,
    STATUS_TERMINATED:                  9,
    STATUS_ANSWERED_WAITING_FOR_PRACK: 10,
    STATUS_EARLY_MEDIA:                11,
    STATUS_CONFIRMED:                  12
  };

/*
 * @param {function returning SIP.sessionDescriptionHandler} [sessionDescriptionHandlerFactory]
 *        (See the documentation for the sessionDescriptionHandlerFactory argument of the UA constructor.)
 */
Session = function (sessionDescriptionHandlerFactory) {
  this.status = C.STATUS_NULL;
  this.dialog = null;
  this.pendingReinvite = false;
  this.earlyDialogs = {};
  if (!sessionDescriptionHandlerFactory) {
    throw new SIP.Exceptions.SessionDescriptionHandlerMissing('A session description handler is required for the session to function');
  }
  this.sessionDescriptionHandlerFactory = sessionDescriptionHandlerFactory;

  this.hasOffer = false;
  this.hasAnswer = false;

  // Session Timers
  this.timers = {
    ackTimer: null,
    expiresTimer: null,
    invite2xxTimer: null,
    userNoAnswerTimer: null,
    rel1xxTimer: null,
    prackTimer: null
  };

  // Session info
  this.startTime = null;
  this.endTime = null;
  this.tones = null;

  // Hold state
  this.local_hold = false;

  // Flag to disable renegotiation. When set to true, it will not renegotiate
  // and will throw a RENEGOTIATION_ERROR
  this.disableRenegotiation = false;

  this.early_sdp = null;
  this.rel100 = SIP.C.supported.UNSUPPORTED;
};

Session.prototype = {
  dtmf: function(tones, options) {
    var tone, dtmfs = [],
        self = this,
        dtmfType = this.ua.configuration.dtmfType;

    options = options || {};

    if (tones === undefined) {
      throw new TypeError('Not enough arguments');
    }

    // Check Session Status
    if (this.status !== C.STATUS_CONFIRMED && this.status !== C.STATUS_WAITING_FOR_ACK) {
      throw new SIP.Exceptions.InvalidStateError(this.status);
    }

    // Check tones
    if ((typeof tones !== 'string' && typeof tones !== 'number') || !tones.toString().match(/^[0-9A-D#*,]+$/i)) {
      throw new TypeError('Invalid tones: '+ tones);
    }

    var sendDTMF = function () {
      var dtmf, timeout;

      if (self.status === C.STATUS_TERMINATED || !self.tones || self.tones.length === 0) {
        // Stop sending DTMF
        self.tones = null;
        return this;
      }

      dtmf = self.tones.shift();

      if (tone === ',') {
        timeout = 2000;
      } else {
        dtmf.on('failed', function(){self.tones = null;});
        dtmf.send(options);
        timeout = dtmf.duration + dtmf.interToneGap;
      }

      // Set timeout for the next tone
      SIP.Timers.setTimeout(sendDTMF, timeout);
    };

    if (dtmfType === SIP.C.dtmfType.RTP) {
      var sent = this.sessionDescriptionHandler.sendDtmf(tones, options);
      if (!sent) {
        this.logger.warn("Attempt to use dtmfType 'RTP' has failed, falling back to INFO packet method");
        dtmfType = SIP.C.dtmfType.INFO;
      }
    }
    if (dtmfType === SIP.C.dtmfType.INFO) {
      tones = tones.toString().split('');
      while (tones.length > 0) { dtmfs.push(new DTMF(this, tones.shift(), options)); }

      if (this.tones) {
        // Tones are already queued, just add to the queue
        this.tones =  this.tones.concat(dtmfs);
        return this;
      }
      this.tones = dtmfs;
      sendDTMF();
    }
    return this;
  },

  bye: function(options) {
    options = Object.create(options || Object.prototype);
    var statusCode = options.statusCode;

    // Check Session Status
    if (this.status === C.STATUS_TERMINATED) {
      this.logger.error('Error: Attempted to send BYE in a terminated session.');
      return this;
    }

    this.logger.log('terminating Session');

    if (statusCode && (statusCode < 200 || statusCode >= 700)) {
      throw new TypeError('Invalid statusCode: '+ statusCode);
    }

    options.receiveResponse = function () {};

    return this.
      sendRequest(SIP.C.BYE, options).
      terminated();
  },

  refer: function(target, options) {
    options = options || {};

    // Check Session Status
    if (this.status !== C.STATUS_CONFIRMED) {
      throw new SIP.Exceptions.InvalidStateError(this.status);
    }

    this.referContext = new SIP.ReferClientContext(this.ua, this, target, options);

    this.emit('referRequested', this.referContext);

    this.referContext.refer();
  },

  sendRequest: function(method,options) {
    options = options || {};
    var self = this;

    var request = new SIP.OutgoingRequest(
      method,
      this.dialog.remote_target,
      this.ua,
      {
        cseq: options.cseq || (this.dialog.local_seqnum += 1),
        call_id: this.dialog.id.call_id,
        from_uri: this.dialog.local_uri,
        from_tag: this.dialog.id.local_tag,
        to_uri: this.dialog.remote_uri,
        to_tag: this.dialog.id.remote_tag,
        route_set: this.dialog.route_set,
        statusCode: options.statusCode,
        reasonPhrase: options.reasonPhrase
      },
      options.extraHeaders || [],
      options.body
    );

    new SIP.RequestSender({
      request: request,
      onRequestTimeout: function() {
        self.onRequestTimeout();
      },
      onTransportError: function() {
        self.onTransportError();
      },
      receiveResponse: options.receiveResponse || function(response) {
        self.receiveNonInviteResponse(response);
      }
    }, this.ua).send();

    // Emit the request event
    this.emit(method.toLowerCase(), request);

    return this;
  },

  close: function() {
    var idx;

    if(this.status === C.STATUS_TERMINATED) {
      return this;
    }

    this.logger.log('closing INVITE session ' + this.id);

    // 1st Step. Terminate media.
    if (this.sessionDescriptionHandler){
      this.sessionDescriptionHandler.close();
    }

    // 2nd Step. Terminate signaling.

    // Clear session timers
    for(idx in this.timers) {
      SIP.Timers.clearTimeout(this.timers[idx]);
    }

    // Terminate dialogs

    // Terminate confirmed dialog
    if(this.dialog) {
      this.dialog.terminate();
      delete this.dialog;
    }

    // Terminate early dialogs
    for(idx in this.earlyDialogs) {
      this.earlyDialogs[idx].terminate();
      delete this.earlyDialogs[idx];
    }

    this.status = C.STATUS_TERMINATED;

    delete this.ua.sessions[this.id];
    return this;
  },

  createDialog: function(message, type, early) {
    var dialog, early_dialog,
      local_tag = message[(type === 'UAS') ? 'to_tag' : 'from_tag'],
      remote_tag = message[(type === 'UAS') ? 'from_tag' : 'to_tag'],
      id = message.call_id + local_tag + remote_tag;

    early_dialog = this.earlyDialogs[id];

    // Early Dialog
    if (early) {
      if (early_dialog) {
        return true;
      } else {
        early_dialog = new SIP.Dialog(this, message, type, SIP.Dialog.C.STATUS_EARLY);

        // Dialog has been successfully created.
        if(early_dialog.error) {
          this.logger.error(early_dialog.error);
          this.failed(message, SIP.C.causes.INTERNAL_ERROR);
          return false;
        } else {
          this.earlyDialogs[id] = early_dialog;
          return true;
        }
      }
    }
    // Confirmed Dialog
    else {
      // In case the dialog is in _early_ state, update it
      if (early_dialog) {
        early_dialog.update(message, type);
        this.dialog = early_dialog;
        delete this.earlyDialogs[id];
        for (var dia in this.earlyDialogs) {
          this.earlyDialogs[dia].terminate();
          delete this.earlyDialogs[dia];
        }
        return true;
      }

      // Otherwise, create a _confirmed_ dialog
      dialog = new SIP.Dialog(this, message, type);

      if(dialog.error) {
        this.logger.error(dialog.error);
        this.failed(message, SIP.C.causes.INTERNAL_ERROR);
        return false;
      } else {
        this.to_tag = message.to_tag;
        this.dialog = dialog;
        return true;
      }
    }
  },

  /**
   * Hold
   */
  hold: function(options, modifiers) {

    if (this.status !== C.STATUS_WAITING_FOR_ACK && this.status !== C.STATUS_CONFIRMED) {
      throw new SIP.Exceptions.InvalidStateError(this.status);
    }

    if (this.local_hold) {
      this.logger.log('Session is already on hold, cannot put it on hold again');
      return;
    }

    options = options || {};
    options.modifiers = modifiers || [];
    options.modifiers.push(this.sessionDescriptionHandler.holdModifier);

    this.local_hold = true;

    this.sendReinvite(options);
  },

  /**
   * Unhold
   */
  unhold: function(options, modifiers) {

    if (this.status !== C.STATUS_WAITING_FOR_ACK && this.status !== C.STATUS_CONFIRMED) {
      throw new SIP.Exceptions.InvalidStateError(this.status);
    }

    if (!this.local_hold) {
      this.logger.log('Session is not on hold, cannot unhold it');
      return;
    }

    options = options || {};

    if (modifiers) {
      options.modifiers = modifiers;
    }

    this.local_hold = false;

    this.sendReinvite(options);
  },

  reinvite: function(options, modifiers) {
    options = options || {};

    if (modifiers) {
      options.modifiers = modifiers;
    }

    return this.sendReinvite(options);
  },

  /**
   * In dialog INVITE Reception
   * @private
   */
  receiveReinvite: function(request) {
    var self = this,
        promise;
    // TODO: Should probably check state of the session

    self.emit('reinvite', this);

    // Invite w/o SDP
    if (request.getHeader('Content-Length') === '0' && !request.getHeader('Content-Type')) {
      promise = this.sessionDescriptionHandler.getDescription(this.sessionDescriptionHandlerOptions, this.modifiers);

    // Invite w/ SDP
    } else if (this.sessionDescriptionHandler.hasDescription(request.getHeader('Content-Type'))) {
      promise = this.sessionDescriptionHandler.setDescription(request.body, this.sessionDescriptionHandlerOptions, this.modifiers)
        .then(this.sessionDescriptionHandler.getDescription.bind(this.sessionDescriptionHandler, this.sessionDescriptionHandlerOptions, this.modifiers));

    // Bad Packet (should never get hit)
    } else {
      request.reply(415);
      this.emit('reinviteFailed', self);
      return;
    }

    this.receiveRequest = function(request) {
      if (request.method === SIP.C.ACK && this.status === C.STATUS_WAITING_FOR_ACK) {
        if (this.sessionDescriptionHandler.hasDescription(request.getHeader('Content-Type'))) {
          this.hasAnswer = true;
          this.sessionDescriptionHandler.setDescription(request.body, this.sessionDescriptionHandlerOptions, this.modifiers)
          .then(function() {
            SIP.Timers.clearTimeout(this.timers.ackTimer);
            SIP.Timers.clearTimeout(this.timers.invite2xxTimer);
            this.status = C.STATUS_CONFIRMED;

            this.emit('confirmed', request);
          }.bind(this));
        } else {
          SIP.Timers.clearTimeout(this.timers.ackTimer);
          SIP.Timers.clearTimeout(this.timers.invite2xxTimer);
          this.status = C.STATUS_CONFIRMED;

          this.emit('confirmed', request);
        }
      } else {
        SIP.Session.prototype.receiveRequest.apply(this, [request]);
      }
    }.bind(this);

    promise.catch(function onFailure (e) {
      var statusCode;
      if (e instanceof SIP.Exceptions.GetDescriptionError) {
        statusCode = 500;
      } else if (e instanceof SIP.Exceptions.RenegotiationError) {
        self.emit('renegotiationError', e);
        self.logger.warn(e);
        statusCode = 488;
      } else {
        self.logger.error(e);
        statusCode = 488;
      }
      request.reply(statusCode);
      self.emit('reinviteFailed', self);
    })
    .then(function(description) {
      var extraHeaders = ['Contact: ' + self.contact];
      request.reply(200, null, extraHeaders, description,
        function() {
          self.status = C.STATUS_WAITING_FOR_ACK;

          self.setACKTimer();
          self.emit('reinviteAccepted', self);
        });
    });
  },

  sendReinvite: function(options) {
    if (this.pendingReinvite) {
      this.logger.warn('Reinvite in progress. Please wait until complete, then try again.');
      return;
    }
    this.pendingReinvite = true;
    options = options || {};
    options.modifiers = options.modifiers || [];

    var
      self = this,
       extraHeaders = (options.extraHeaders || []).slice();

    extraHeaders.push('Contact: ' + this.contact);
    extraHeaders.push('Allow: '+ SIP.UA.C.ALLOWED_METHODS.toString());

    this.sessionDescriptionHandler.getDescription(options.sessionDescriptionHandlerOptions, options.modifiers)
    .then(function(description) {
      self.sendRequest(SIP.C.INVITE, {
        extraHeaders: extraHeaders,
        body: description,
        receiveResponse: self.receiveReinviteResponse.bind(self)
      });
    }).catch(function onFailure(e) {
      if (e instanceof SIP.Exceptions.RenegotiationError) {
        self.pendingReinvite = false;
        self.emit('renegotiationError', e);
        self.logger.warn('Renegotiation Error');
        self.logger.warn(e);
        return;
      }
      self.logger.error('sessionDescriptionHandler error');
      self.logger.error(e);
    });
  },

  receiveRequest: function (request) {
    switch (request.method) {
      case SIP.C.BYE:
        request.reply(200);
        if(this.status === C.STATUS_CONFIRMED) {
          this.emit('bye', request);
          this.terminated(request, SIP.C.causes.BYE);
        }
        break;
      case SIP.C.INVITE:
        if(this.status === C.STATUS_CONFIRMED) {
          this.logger.log('re-INVITE received');
          this.receiveReinvite(request);
        }
        break;
      case SIP.C.INFO:
        if(this.status === C.STATUS_CONFIRMED || this.status === C.STATUS_WAITING_FOR_ACK) {
          if (this.onInfo) {
            return this.onInfo(request);
          }

          var body, tone, duration,
              contentType = request.getHeader('content-type'),
              reg_tone = /^(Signal\s*?=\s*?)([0-9A-D#*]{1})(\s)?.*/,
              reg_duration = /^(Duration\s?=\s?)([0-9]{1,4})(\s)?.*/;

          if (contentType) {
            if (contentType.match(/^application\/dtmf-relay/i)) {
              if (request.body) {
                body = request.body.split('\r\n', 2);
                if (body.length === 2) {
                  if (reg_tone.test(body[0])) {
                    tone = body[0].replace(reg_tone,"$2");
                  }
                  if (reg_duration.test(body[1])) {
                    duration = parseInt(body[1].replace(reg_duration,"$2"), 10);
                  }
                }
              }

              new DTMF(this, tone, {duration: duration}).init_incoming(request);
            } else {
              request.reply(415, null, ["Accept: application/dtmf-relay"]);
            }
          }
        }
        break;
      case SIP.C.REFER:
        if(this.status ===  C.STATUS_CONFIRMED) {
          this.logger.log('REFER received');
          this.referContext = new SIP.ReferServerContext(this.ua, request);
          var hasReferListener = this.listeners('referRequested').length;
          if (hasReferListener) {
            this.emit('referRequested', this.referContext);
          } else {
            this.logger.log('No referRequested listeners, automatically accepting and following the refer');
            var options = {followRefer: true};
            if (this.passedOptions) {
              options.inviteOptions = this.passedOptions;
            }
            this.referContext.accept(options, this.modifiers);
          }
        }
        break;
      case SIP.C.NOTIFY:
        if ((this.referContext && this.referContext instanceof SIP.ReferClientContext) && request.hasHeader('event') && /^refer(;.*)?$/.test(request.getHeader('event'))) {
          this.referContext.receiveNotify(request);
          return;
        }
        request.reply(200, 'OK');
        this.emit('notify', request);
        break;
    }
  },

  /**
   * Reception of Response for in-dialog INVITE
   * @private
   */
  receiveReinviteResponse: function(response) {
    var self = this;

    if (this.status === C.STATUS_TERMINATED) {
      return;
    }

    switch(true) {
      case /^1[0-9]{2}$/.test(response.status_code):
        break;
      case /^2[0-9]{2}$/.test(response.status_code):
        this.status = C.STATUS_CONFIRMED;

        // 17.1.1.1 - For each final response that is received at the client transaction, the client transaction sends an ACK,
        this.emit("ack", response.transaction.sendACK());
        this.pendingReinvite = false;
        // TODO: All of these timers should move into the Transaction layer
        SIP.Timers.clearTimeout(self.timers.invite2xxTimer);
        if (!this.sessionDescriptionHandler.hasDescription(response.getHeader('Content-Type'))) {
          this.logger.error('2XX response received to re-invite but did not have a description');
          this.emit('reinviteFailed', self);
          this.emit('renegotiationError', new SIP.Exceptions.RenegotiationError('2XX response received to re-invite but did not have a description'));
          break;
        }

        this.sessionDescriptionHandler.setDescription(response.body, this.sessionDescriptionHandlerOptions, this.modifiers)
        .catch(function onFailure (e) {
          self.logger.error('Could not set the description in 2XX response');
          self.logger.error(e);
          self.emit('reinviteFailed', self);
          self.emit('renegotiationError', e);
          self.sendRequest(SIP.C.BYE, {
            extraHeaders: ['Reason: ' + SIP.Utils.getReasonHeaderValue(488, 'Not Acceptable Here')]
          });
        }).then(function() {
          self.emit('reinviteAccepted', self);
        });
        break;
      default:
        this.disableRenegotiation = true;
        this.pendingReinvite = false;
        this.logger.log('Received a non 1XX or 2XX response to a re-invite');
        this.emit('reinviteFailed', self);
        this.emit('renegotiationError', new SIP.Exceptions.RenegotiationError('Invalid response to a re-invite'));
    }
  },

  acceptAndTerminate: function(response, status_code, reason_phrase) {
    var extraHeaders = [];

    if (status_code) {
      extraHeaders.push('Reason: ' + SIP.Utils.getReasonHeaderValue(status_code, reason_phrase));
    }

    // An error on dialog creation will fire 'failed' event
    if (this.dialog || this.createDialog(response, 'UAC')) {
      this.emit("ack", response.transaction.sendACK());
      this.sendRequest(SIP.C.BYE, {
        extraHeaders: extraHeaders
      });
    }

    return this;
  },

  /**
   * RFC3261 13.3.1.4
   * Response retransmissions cannot be accomplished by transaction layer
   *  since it is destroyed when receiving the first 2xx answer
   */
  setInvite2xxTimer: function(request, description) {
    var self = this,
        timeout = SIP.Timers.T1;

    this.timers.invite2xxTimer = SIP.Timers.setTimeout(function invite2xxRetransmission() {
      if (self.status !== C.STATUS_WAITING_FOR_ACK) {
        return;
      }

      self.logger.log('no ACK received, attempting to retransmit OK');

      var extraHeaders = ['Contact: ' + self.contact];

      request.reply(200, null, extraHeaders, description);

      timeout = Math.min(timeout * 2, SIP.Timers.T2);

      self.timers.invite2xxTimer = SIP.Timers.setTimeout(invite2xxRetransmission, timeout);
    }, timeout);
  },

  /**
   * RFC3261 14.2
   * If a UAS generates a 2xx response and never receives an ACK,
   *  it SHOULD generate a BYE to terminate the dialog.
   */
  setACKTimer: function() {
    var self = this;

    this.timers.ackTimer = SIP.Timers.setTimeout(function() {
      if(self.status === C.STATUS_WAITING_FOR_ACK) {
        self.logger.log('no ACK received for an extended period of time, terminating the call');
        SIP.Timers.clearTimeout(self.timers.invite2xxTimer);
        self.sendRequest(SIP.C.BYE);
        self.terminated(null, SIP.C.causes.NO_ACK);
      }
    }, SIP.Timers.TIMER_H);
  },

  /*
   * @private
   */
  onTransportError: function() {
    if (this.status !== C.STATUS_CONFIRMED && this.status !== C.STATUS_TERMINATED) {
      this.failed(null, SIP.C.causes.CONNECTION_ERROR);
    }
  },

  onRequestTimeout: function() {
    if (this.status === C.STATUS_CONFIRMED) {
      this.terminated(null, SIP.C.causes.REQUEST_TIMEOUT);
    } else if (this.status !== C.STATUS_TERMINATED) {
      this.failed(null, SIP.C.causes.REQUEST_TIMEOUT);
      this.terminated(null, SIP.C.causes.REQUEST_TIMEOUT);
    }
  },

  onDialogError: function(response) {
    if (this.status === C.STATUS_CONFIRMED) {
      this.terminated(response, SIP.C.causes.DIALOG_ERROR);
    } else if (this.status !== C.STATUS_TERMINATED) {
      this.failed(response, SIP.C.causes.DIALOG_ERROR);
      this.terminated(response, SIP.C.causes.DIALOG_ERROR);
    }
  },

  /**
   * @private
   */

  failed: function(response, cause) {
    if (this.status === C.STATUS_TERMINATED) {
      return this;
    }
    this.emit('failed', response || null, cause || null);
    return this;
  },

  rejected: function(response, cause) {
    this.emit('rejected',
      response || null,
      cause || null
    );
    return this;
  },

  canceled: function() {
    this.emit('cancel');
    return this;
  },

  accepted: function(response, cause) {
    cause = SIP.Utils.getReasonPhrase(response && response.status_code, cause);

    this.startTime = new Date();

    if (this.replacee) {
      this.replacee.emit('replaced', this);
      this.replacee.terminate();
    }
    this.emit('accepted', response, cause);
    return this;
  },

  terminated: function(message, cause) {
    if (this.status === C.STATUS_TERMINATED) {
      return this;
    }

    this.endTime = new Date();

    this.close();
    this.emit('terminated',
      message || null,
      cause || null
    );
    return this;
  },

  connecting: function(request) {
    this.emit('connecting', { request: request });
    return this;
  }
};


Session.C = C;
SIP.Session = Session;


InviteServerContext = function(ua, request) {
  var expires,
    self = this,
    contentType = request.getHeader('Content-Type'),
    contentDisp = request.parseHeader('Content-Disposition');

  SIP.Utils.augment(this, SIP.ServerContext, [ua, request]);
  SIP.Utils.augment(this, SIP.Session, [ua.configuration.sessionDescriptionHandlerFactory]);

  if (contentDisp && contentDisp.type === 'render') {
    this.renderbody = request.body;
    this.rendertype = contentType;
  }

  this.status = C.STATUS_INVITE_RECEIVED;
  this.from_tag = request.from_tag;
  this.id = request.call_id + this.from_tag;
  this.request = request;
  this.contact = this.ua.contact.toString();

  this.receiveNonInviteResponse = function () {}; // intentional no-op

  this.logger = ua.getLogger('sip.inviteservercontext', this.id);

  //Save the session into the ua sessions collection.
  this.ua.sessions[this.id] = this;

  //Get the Expires header value if exists
  if(request.hasHeader('expires')) {
    expires = request.getHeader('expires') * 1000;
  }

  //Set 100rel if necessary
  function set100rel(h,c) {
    if (request.hasHeader(h) && request.getHeader(h).toLowerCase().indexOf('100rel') >= 0) {
      self.rel100 = c;
    }
  }
  set100rel('require', SIP.C.supported.REQUIRED);
  set100rel('supported', SIP.C.supported.SUPPORTED);

  /* Set the to_tag before
   * replying a response code that will create a dialog.
   */
  request.to_tag = SIP.Utils.newTag();

  // An error on dialog creation will fire 'failed' event
  if(!this.createDialog(request, 'UAS', true)) {
    request.reply(500, 'Missing Contact header field');
    return;
  }

  var options = {extraHeaders: ['Contact: ' + self.contact]};

  if (self.rel100 !== SIP.C.supported.REQUIRED) {
    self.progress(options);
  }
  self.status = C.STATUS_WAITING_FOR_ANSWER;

  // Set userNoAnswerTimer
  self.timers.userNoAnswerTimer = SIP.Timers.setTimeout(function() {
    request.reply(408);
    self.failed(request, SIP.C.causes.NO_ANSWER);
    self.terminated(request, SIP.C.causes.NO_ANSWER);
  }, self.ua.configuration.noAnswerTimeout);

  /* Set expiresTimer
   * RFC3261 13.3.1
   */
  if (expires) {
    self.timers.expiresTimer = SIP.Timers.setTimeout(function() {
      if(self.status === C.STATUS_WAITING_FOR_ANSWER) {
        request.reply(487);
        self.failed(request, SIP.C.causes.EXPIRES);
        self.terminated(request, SIP.C.causes.EXPIRES);
      }
    }, expires);
  }
};

InviteServerContext.prototype = {
  reject: function(options) {
    // Check Session Status
    if (this.status === C.STATUS_TERMINATED) {
      throw new SIP.Exceptions.InvalidStateError(this.status);
    }

    this.logger.log('rejecting RTCSession');

    SIP.ServerContext.prototype.reject.call(this, options);
    return this.terminated();
  },

  terminate: function(options) {
    options = options || {};

    var
    extraHeaders = (options.extraHeaders || []).slice(),
    body = options.body,
    dialog,
    self = this;

    if (this.status === C.STATUS_WAITING_FOR_ACK &&
       this.request.server_transaction.state !== SIP.Transactions.C.STATUS_TERMINATED) {
      dialog = this.dialog;

      this.receiveRequest = function(request) {
        if (request.method === SIP.C.ACK) {
          this.sendRequest(SIP.C.BYE, {
            extraHeaders: extraHeaders,
            body: body
          });
          dialog.terminate();
        }
      };

      this.request.server_transaction.on('stateChanged', function(){
        if (this.state === SIP.Transactions.C.STATUS_TERMINATED && this.dialog) {
          this.request = new SIP.OutgoingRequest(
            SIP.C.BYE,
            this.dialog.remote_target,
            this.ua,
            {
              'cseq': this.dialog.local_seqnum+=1,
              'call_id': this.dialog.id.call_id,
              'from_uri': this.dialog.local_uri,
              'from_tag': this.dialog.id.local_tag,
              'to_uri': this.dialog.remote_uri,
              'to_tag': this.dialog.id.remote_tag,
              'route_set': this.dialog.route_set
            },
            extraHeaders,
            body
          );

          new SIP.RequestSender(
            {
              request: this.request,
              onRequestTimeout: function() {
                self.onRequestTimeout();
              },
              onTransportError: function() {
                self.onTransportError();
              },
              receiveResponse: function() {
                return;
              }
            },
            this.ua
          ).send();
          dialog.terminate();
        }
      });

      this.emit('bye', this.request);
      this.terminated();

      // Restore the dialog into 'this' in order to be able to send the in-dialog BYE :-)
      this.dialog = dialog;

      // Restore the dialog into 'ua' so the ACK can reach 'this' session
      this.ua.dialogs[dialog.id.toString()] = dialog;

    } else if (this.status === C.STATUS_CONFIRMED) {
      this.bye(options);
    } else {
      this.reject(options);
    }

    return this;
  },

  /*
   * @param {Object} [options.sessionDescriptionHandlerOptions] gets passed to SIP.SessionDescriptionHandler.getDescription as options
   */
  progress: function (options) {
    options = options || {};
    var
      statusCode = options.statusCode || 180,
      reasonPhrase = options.reasonPhrase,
      extraHeaders = (options.extraHeaders || []).slice(),
      body = options.body,
      response;

    if (statusCode < 100 || statusCode > 199) {
      throw new TypeError('Invalid statusCode: ' + statusCode);
    }

    if (this.isCanceled || this.status === C.STATUS_TERMINATED) {
      return this;
    }

    function do100rel() {
      /* jshint validthis: true */
      statusCode = options.statusCode || 183;

      // Set status and add extra headers
      this.status = C.STATUS_WAITING_FOR_PRACK;
      extraHeaders.push('Contact: '+ this.contact);
      extraHeaders.push('Require: 100rel');
      extraHeaders.push('RSeq: ' + Math.floor(Math.random() * 10000));

      // Get the session description to add to preaccept with
      this.sessionDescriptionHandler.getDescription(options.sessionDescriptionHandlerOptions, options.modifiers)
      .then(
        function onSuccess (description) {
          if (this.isCanceled || this.status === C.STATUS_TERMINATED) {
            return;
          }

          this.early_sdp = description.body;
          this[this.hasOffer ? 'hasAnswer' : 'hasOffer'] = true;

          // Retransmit until we get a response or we time out (see prackTimer below)
          var timeout = SIP.Timers.T1;
          this.timers.rel1xxTimer = SIP.Timers.setTimeout(function rel1xxRetransmission() {
            this.request.reply(statusCode, null, extraHeaders, description);
            timeout *= 2;
            this.timers.rel1xxTimer = SIP.Timers.setTimeout(rel1xxRetransmission.bind(this), timeout);
          }.bind(this), timeout);

          // Timeout and reject INVITE if no response
          this.timers.prackTimer = SIP.Timers.setTimeout(function () {
            if (this.status !== C.STATUS_WAITING_FOR_PRACK) {
              return;
            }

            this.logger.log('no PRACK received, rejecting the call');
            SIP.Timers.clearTimeout(this.timers.rel1xxTimer);
            this.request.reply(504);
            this.terminated(null, SIP.C.causes.NO_PRACK);
          }.bind(this), SIP.Timers.T1 * 64);

          // Send the initial response
          response = this.request.reply(statusCode, reasonPhrase, extraHeaders, description);
          this.emit('progress', response, reasonPhrase);
        }.bind(this),

        function onFailure () {
          this.request.reply(480);
          this.failed(null, SIP.C.causes.WEBRTC_ERROR);
          this.terminated(null, SIP.C.causes.WEBRTC_ERROR);
        }.bind(this)
      );
    } // end do100rel

    function normalReply() {
      /* jshint validthis:true */
      response = this.request.reply(statusCode, reasonPhrase, extraHeaders, body);
      this.emit('progress', response, reasonPhrase);
    }

    if (options.statusCode !== 100 &&
        (this.rel100 === SIP.C.supported.REQUIRED ||
         (this.rel100 === SIP.C.supported.SUPPORTED && options.rel100) ||
         (this.rel100 === SIP.C.supported.SUPPORTED && (this.ua.configuration.rel100 === SIP.C.supported.REQUIRED)))) {
      this.sessionDescriptionHandler = this.setupSessionDescriptionHandler();
      this.emit('SessionDescriptionHandler-created', this.sessionDescriptionHandler);
      if (this.sessionDescriptionHandler.hasDescription(this.request.getHeader('Content-Type'))) {
        this.hasOffer = true;
        this.sessionDescriptionHandler.setDescription(this.request.body, options.sessionDescriptionHandlerOptions, options.modifiers)
        .then(do100rel.apply(this))
        .catch(function onFailure(e) {
          this.logger.warn('invalid description');
          this.logger.warn(e);
          this.failed(null, SIP.C.causes.WEBRTC_ERROR);
          this.terminated(null, SIP.C.causes.WEBRTC_ERROR);
        }.bind(this));
      } else {
        do100rel.apply(this);
      }
    } else {
      normalReply.apply(this);
    }
    return this;
  },

  /*
   * @param {Object} [options.sessionDescriptionHandlerOptions] gets passed to SIP.SessionDescriptionHandler.getDescription as options
   */
  accept: function(options) {
    options = options || {};

    this.onInfo = options.onInfo;

    var
      self = this,
      request = this.request,
      extraHeaders = (options.extraHeaders || []).slice(),
      descriptionCreationSucceeded = function(description) {
        var
          response,
          // run for reply success callback
          replySucceeded = function() {
            self.status = C.STATUS_WAITING_FOR_ACK;

            self.setInvite2xxTimer(request, description);
            self.setACKTimer();
          },

          // run for reply failure callback
          replyFailed = function() {
            self.failed(null, SIP.C.causes.CONNECTION_ERROR);
            self.terminated(null, SIP.C.causes.CONNECTION_ERROR);
          };

        extraHeaders.push('Contact: ' + self.contact);
        extraHeaders.push('Allow: ' + SIP.UA.C.ALLOWED_METHODS.toString());

        if(!self.hasOffer) {
          self.hasOffer = true;
        } else {
          self.hasAnswer = true;
        }
        response = request.reply(200, null, extraHeaders,
                      description,
                      replySucceeded,
                      replyFailed
                     );
        if (self.status !== C.STATUS_TERMINATED) { // Didn't fail
          self.accepted(response, SIP.Utils.getReasonPhrase(200));
        }
      },

      descriptionCreationFailed = function() {
        // TODO: This should check the actual error and make sure it is an
        //        "expected" error. Otherwise it should throw.
        if (self.status === C.STATUS_TERMINATED) {
          return;
        }
        self.request.reply(480);
        self.failed(null, SIP.C.causes.WEBRTC_ERROR);
        self.terminated(null, SIP.C.causes.WEBRTC_ERROR);
      };

    // Check Session Status
    if (this.status === C.STATUS_WAITING_FOR_PRACK) {
      this.status = C.STATUS_ANSWERED_WAITING_FOR_PRACK;
      return this;
    } else if (this.status === C.STATUS_WAITING_FOR_ANSWER) {
      this.status = C.STATUS_ANSWERED;
    } else if (this.status !== C.STATUS_EARLY_MEDIA) {
      throw new SIP.Exceptions.InvalidStateError(this.status);
    }

    // An error on dialog creation will fire 'failed' event
    if(!this.createDialog(request, 'UAS')) {
      request.reply(500, 'Missing Contact header field');
      return this;
    }

    SIP.Timers.clearTimeout(this.timers.userNoAnswerTimer);

    if (this.status === C.STATUS_EARLY_MEDIA) {
      descriptionCreationSucceeded({});
    } else {
      this.sessionDescriptionHandler = this.setupSessionDescriptionHandler();
      this.emit('SessionDescriptionHandler-created', this.sessionDescriptionHandler);
      if (this.request.getHeader('Content-Length') === '0' && !this.request.getHeader('Content-Type')) {
        this.sessionDescriptionHandler.getDescription(options.sessionDescriptionHandlerOptions, options.modifiers)
        .catch(descriptionCreationFailed)
        .then(descriptionCreationSucceeded);
      } else if (this.sessionDescriptionHandler.hasDescription(this.request.getHeader('Content-Type'))) {
        this.hasOffer = true;
        this.sessionDescriptionHandler.setDescription(this.request.body, options.sessionDescriptionHandlerOptions, options.modifiers)
        .then(function() {
          return this.sessionDescriptionHandler.getDescription(options.sessionDescriptionHandlerOptions, options.modifiers);
        }.bind(this))
        .catch(descriptionCreationFailed)
        .then(descriptionCreationSucceeded);
      } else {
        this.request.reply(415);
        // TODO: Events
        return;
      }
    }

    return this;
  },

  receiveRequest: function(request) {

    // ISC RECEIVE REQUEST

    function confirmSession() {
      /* jshint validthis:true */
      var contentType, contentDisp;

      SIP.Timers.clearTimeout(this.timers.ackTimer);
      SIP.Timers.clearTimeout(this.timers.invite2xxTimer);
      this.status = C.STATUS_CONFIRMED;

      contentType = request.getHeader('Content-Type');
      contentDisp = request.getHeader('Content-Disposition');

      if (contentDisp && contentDisp.type === 'render') {
        this.renderbody = request.body;
        this.rendertype = contentType;
      }

      this.emit('confirmed', request);
    }

    switch(request.method) {
    case SIP.C.CANCEL:
      /* RFC3261 15 States that a UAS may have accepted an invitation while a CANCEL
       * was in progress and that the UAC MAY continue with the session established by
       * any 2xx response, or MAY terminate with BYE. SIP does continue with the
       * established session. So the CANCEL is processed only if the session is not yet
       * established.
       */

      /*
       * Terminate the whole session in case the user didn't accept (or yet to send the answer) nor reject the
       *request opening the session.
       */
      if(this.status === C.STATUS_WAITING_FOR_ANSWER ||
         this.status === C.STATUS_WAITING_FOR_PRACK ||
         this.status === C.STATUS_ANSWERED_WAITING_FOR_PRACK ||
         this.status === C.STATUS_EARLY_MEDIA ||
         this.status === C.STATUS_ANSWERED) {

        this.status = C.STATUS_CANCELED;
        this.request.reply(487);
        this.canceled(request);
        this.rejected(request, SIP.C.causes.CANCELED);
        this.failed(request, SIP.C.causes.CANCELED);
        this.terminated(request, SIP.C.causes.CANCELED);
      }
      break;
    case SIP.C.ACK:
      if(this.status === C.STATUS_WAITING_FOR_ACK) {
        if(this.sessionDescriptionHandler.hasDescription(request.getHeader('Content-Type'))) {
          // ACK contains answer to an INVITE w/o SDP negotiation
          this.hasAnswer = true;
          this.sessionDescriptionHandler.setDescription(request.body, this.sessionDescriptionHandlerOptions, this.modifiers)
          .then(
            // TODO: Catch then .then
            confirmSession.bind(this),
            function onFailure (e) {
              this.logger.warn(e);
              this.terminate({
                statusCode: '488',
                reasonPhrase: 'Bad Media Description'
              });
              this.failed(request, SIP.C.causes.BAD_MEDIA_DESCRIPTION);
              this.terminated(request, SIP.C.causes.BAD_MEDIA_DESCRIPTION);
            }.bind(this)
          );
        } else {
          confirmSession.apply(this);
        }
      }
      break;
    case SIP.C.PRACK:
      if (this.status === C.STATUS_WAITING_FOR_PRACK || this.status === C.STATUS_ANSWERED_WAITING_FOR_PRACK) {
        if(!this.hasAnswer) {
          this.sessionDescriptionHandler = this.setupSessionDescriptionHandler();
          this.emit('SessionDescriptionHandler-created', this.sessionDescriptionHandler);
          if(this.sessionDescriptionHandler.hasDescription(request.getHeader('Content-Type'))) {
            this.hasAnswer = true;
            this.sessionDescriptionHandler.setDescription(request.body, this.sessionDescriptionHandlerOptions, this.modifiers)
            .then(
              function onSuccess () {
                SIP.Timers.clearTimeout(this.timers.rel1xxTimer);
                SIP.Timers.clearTimeout(this.timers.prackTimer);
                request.reply(200);
                if (this.status === C.STATUS_ANSWERED_WAITING_FOR_PRACK) {
                  this.status = C.STATUS_EARLY_MEDIA;
                  this.accept();
                }
                this.status = C.STATUS_EARLY_MEDIA;
              }.bind(this),
              function onFailure (e) {
                this.logger.warn(e);
                this.terminate({
                  statusCode: '488',
                  reasonPhrase: 'Bad Media Description'
                });
                this.failed(request, SIP.C.causes.BAD_MEDIA_DESCRIPTION);
                this.terminated(request, SIP.C.causes.BAD_MEDIA_DESCRIPTION);
              }.bind(this)
            );
          } else {
            this.terminate({
              statusCode: '488',
              reasonPhrase: 'Bad Media Description'
            });
            this.failed(request, SIP.C.causes.BAD_MEDIA_DESCRIPTION);
            this.terminated(request, SIP.C.causes.BAD_MEDIA_DESCRIPTION);
          }
        } else {
          SIP.Timers.clearTimeout(this.timers.rel1xxTimer);
          SIP.Timers.clearTimeout(this.timers.prackTimer);
          request.reply(200);

          if (this.status === C.STATUS_ANSWERED_WAITING_FOR_PRACK) {
            this.status = C.STATUS_EARLY_MEDIA;
            this.accept();
          }
          this.status = C.STATUS_EARLY_MEDIA;
        }
      } else if(this.status === C.STATUS_EARLY_MEDIA) {
        request.reply(200);
      }
      break;
    default:
      Session.prototype.receiveRequest.apply(this, [request]);
      break;
    }
  },

  // Internal Function to setup the handler consistently
  setupSessionDescriptionHandler: function() {
    if (this.sessionDescriptionHandler) {
      return this.sessionDescriptionHandler;
    }
    return this.sessionDescriptionHandlerFactory(this, new SessionDescriptionHandlerObserver(this), this.ua.configuration.sessionDescriptionHandlerFactoryOptions);
  },

  onTransportError: function() {
    if (this.status !== C.STATUS_CONFIRMED && this.status !== C.STATUS_TERMINATED) {
      this.failed(null, SIP.C.causes.CONNECTION_ERROR);
    }
  },

  onRequestTimeout: function() {
    if (this.status === C.STATUS_CONFIRMED) {
      this.terminated(null, SIP.C.causes.REQUEST_TIMEOUT);
    } else if (this.status !== C.STATUS_TERMINATED) {
      this.failed(null, SIP.C.causes.REQUEST_TIMEOUT);
      this.terminated(null, SIP.C.causes.REQUEST_TIMEOUT);
    }
  }

};

SIP.InviteServerContext = InviteServerContext;

InviteClientContext = function(ua, target, options, modifiers) {
  options = options || {};
  this.passedOptions = options; // Save for later to use with refer
  options.params = Object.create(options.params || Object.prototype);

  var extraHeaders = (options.extraHeaders || []).slice(),
    sessionDescriptionHandlerFactory = ua.configuration.sessionDescriptionHandlerFactory;

  this.sessionDescriptionHandlerFactoryOptions = ua.configuration.sessionDescriptionHandlerFactoryOptions || {};
  this.sessionDescriptionHandlerOptions = options.sessionDescriptionHandlerOptions || {};
  this.modifiers = modifiers;

  this.inviteWithoutSdp = options.inviteWithoutSdp || false;

  // Set anonymous property
  this.anonymous = options.anonymous || false;

  // Custom data to be sent either in INVITE or in ACK
  this.renderbody = options.renderbody || null;
  this.rendertype = options.rendertype || 'text/plain';

  // Session parameter initialization
  this.from_tag = SIP.Utils.newTag();
  options.params.from_tag = this.from_tag;

  /* Do not add ;ob in initial forming dialog requests if the registration over
   *  the current connection got a GRUU URI.
   */
  this.contact = ua.contact.toString({
    anonymous: this.anonymous,
    outbound: this.anonymous ? !ua.contact.temp_gruu : !ua.contact.pub_gruu
  });

  if (this.anonymous) {
    options.params.from_displayName = 'Anonymous';
    options.params.from_uri = 'sip:anonymous@anonymous.invalid';

    extraHeaders.push('P-Preferred-Identity: '+ ua.configuration.uri.toString());
    extraHeaders.push('Privacy: id');
  }
  extraHeaders.push('Contact: '+ this.contact);
  extraHeaders.push('Allow: '+ SIP.UA.C.ALLOWED_METHODS.toString());
  if (this.inviteWithoutSdp && this.renderbody) {
    extraHeaders.push('Content-Type: ' + this.rendertype);
    extraHeaders.push('Content-Disposition: render;handling=optional');
  }

  if (ua.configuration.rel100 === SIP.C.supported.REQUIRED) {
    extraHeaders.push('Require: 100rel');
  }
  if (ua.configuration.replaces === SIP.C.supported.REQUIRED) {
    extraHeaders.push('Require: replaces');
  }

  options.extraHeaders = extraHeaders;

  SIP.Utils.augment(this, SIP.ClientContext, [ua, SIP.C.INVITE, target, options]);
  SIP.Utils.augment(this, SIP.Session, [sessionDescriptionHandlerFactory]);

  // Check Session Status
  if (this.status !== C.STATUS_NULL) {
    throw new SIP.Exceptions.InvalidStateError(this.status);
  }

  // OutgoingSession specific parameters
  this.isCanceled = false;
  this.received_100 = false;

  this.method = SIP.C.INVITE;

  this.receiveNonInviteResponse = this.receiveResponse;
  this.receiveResponse = this.receiveInviteResponse;

  this.logger = ua.getLogger('sip.inviteclientcontext');

  ua.applicants[this] = this;

  this.id = this.request.call_id + this.from_tag;

  this.onInfo = options.onInfo;
};

InviteClientContext.prototype = {
  invite: function () {
    var self = this;

    //Save the session into the ua sessions collection.
    //Note: placing in constructor breaks call to request.cancel on close... User does not need this anyway
    this.ua.sessions[this.id] = this;

    if (this.inviteWithoutSdp) {
      //just send an invite with no sdp...
      this.request.body = self.renderbody;
      this.status = C.STATUS_INVITE_SENT;
      this.send();
    } else {
      //Initialize Media Session
      this.sessionDescriptionHandler = this.sessionDescriptionHandlerFactory(this, new SessionDescriptionHandlerObserver(this), this.sessionDescriptionHandlerFactoryOptions);
      this.emit('SessionDescriptionHandler-created', this.sessionDescriptionHandler);

      this.sessionDescriptionHandler.getDescription(this.sessionDescriptionHandlerOptions, this.modifiers)
      .then(
        function onSuccess(description) {
          if (self.isCanceled || self.status === C.STATUS_TERMINATED) {
            return;
          }
          self.hasOffer = true;
          self.request.body = description;
          self.status = C.STATUS_INVITE_SENT;
          self.send();
        },
        function onFailure() {
          if (self.status === C.STATUS_TERMINATED) {
            return;
          }
          self.failed(null, SIP.C.causes.WEBRTC_ERROR);
          self.terminated(null, SIP.C.causes.WEBRTC_ERROR);
        }
      );
    }

    return this;
  },

  receiveInviteResponse: function(response) {
    var cause,
      session = this,
      id = response.call_id + response.from_tag + response.to_tag,
      extraHeaders = [],
      options = {};

    if (this.status === C.STATUS_TERMINATED || response.method !== SIP.C.INVITE) {
      return;
    }

    if (this.dialog && (response.status_code >= 200 && response.status_code <= 299)) {
      if (id !== this.dialog.id.toString() ) {
        if (!this.createDialog(response, 'UAC', true)) {
          return;
        }
        this.emit("ack", response.transaction.sendACK({body: SIP.Utils.generateFakeSDP(response.body)}));
        this.earlyDialogs[id].sendRequest(this, SIP.C.BYE);

        /* NOTE: This fails because the forking proxy does not recognize that an unanswerable
         * leg (due to peerConnection limitations) has been answered first. If your forking
         * proxy does not hang up all unanswered branches on the first branch answered, remove this.
         */
        if(this.status !== C.STATUS_CONFIRMED) {
          this.failed(response, SIP.C.causes.WEBRTC_ERROR);
          this.terminated(response, SIP.C.causes.WEBRTC_ERROR);
        }
        return;
      } else if (this.status === C.STATUS_CONFIRMED) {
        this.emit("ack", response.transaction.sendACK());
        return;
      } else if (!this.hasAnswer) {
        // invite w/o sdp is waiting for callback
        //an invite with sdp must go on, and hasAnswer is true
        return;
      }
    }

    if (this.dialog && response.status_code < 200) {
      /*
        Early media has been set up with at least one other different branch,
        but a final 2xx response hasn't been received
      */
      if (this.dialog.pracked.indexOf(response.getHeader('rseq')) !== -1 ||
          (this.dialog.pracked[this.dialog.pracked.length-1] >= response.getHeader('rseq') && this.dialog.pracked.length > 0)) {
        return;
      }

      if (!this.earlyDialogs[id] && !this.createDialog(response, 'UAC', true)) {
        return;
      }

      if (this.earlyDialogs[id].pracked.indexOf(response.getHeader('rseq')) !== -1 ||
          (this.earlyDialogs[id].pracked[this.earlyDialogs[id].pracked.length-1] >= response.getHeader('rseq') && this.earlyDialogs[id].pracked.length > 0)) {
        return;
      }

      extraHeaders.push('RAck: ' + response.getHeader('rseq') + ' ' + response.getHeader('cseq'));
      this.earlyDialogs[id].pracked.push(response.getHeader('rseq'));

      this.earlyDialogs[id].sendRequest(this, SIP.C.PRACK, {
        extraHeaders: extraHeaders,
        body: SIP.Utils.generateFakeSDP(response.body)
      });
      return;
    }

    // Proceed to cancellation if the user requested.
    if(this.isCanceled) {
      if(response.status_code >= 100 && response.status_code < 200) {
        this.request.cancel(this.cancelReason, extraHeaders);
        this.canceled(null);
      } else if(response.status_code >= 200 && response.status_code < 299) {
        this.acceptAndTerminate(response);
        this.emit('bye', this.request);
      } else if (response.status_code >= 300) {
        cause = SIP.C.REASON_PHRASE[response.status_code] || SIP.C.causes.CANCELED;
        this.rejected(response, cause);
        this.failed(response, cause);
        this.terminated(response, cause);
      }
      return;
    }

    switch(true) {
      case /^100$/.test(response.status_code):
        this.received_100 = true;
        this.emit('progress', response);
        break;
      case (/^1[0-9]{2}$/.test(response.status_code)):
        // Do nothing with 1xx responses without To tag.
        if(!response.to_tag) {
          this.logger.warn('1xx response received without to tag');
          break;
        }

        // Create Early Dialog if 1XX comes with contact
        if(response.hasHeader('contact')) {
          // An error on dialog creation will fire 'failed' event
          if (!this.createDialog(response, 'UAC', true)) {
            break;
          }
        }

        this.status = C.STATUS_1XX_RECEIVED;

        if(response.hasHeader('require') &&
           response.getHeader('require').indexOf('100rel') !== -1) {

          // Do nothing if this.dialog is already confirmed
          if (this.dialog || !this.earlyDialogs[id]) {
            break;
          }

          if (this.earlyDialogs[id].pracked.indexOf(response.getHeader('rseq')) !== -1 ||
              (this.earlyDialogs[id].pracked[this.earlyDialogs[id].pracked.length-1] >= response.getHeader('rseq') && this.earlyDialogs[id].pracked.length > 0)) {
            return;
          }
          // TODO: This may be broken. It may have to be on the early dialog
          this.sessionDescriptionHandler = this.sessionDescriptionHandlerFactory(this, new SessionDescriptionHandlerObserver(this), this.sessionDescriptionHandlerFactoryOptions);
          this.emit('SessionDescriptionHandler-created', this.sessionDescriptionHandler);
          if (!this.sessionDescriptionHandler.hasDescription(response.getHeader('Content-Type'))) {
            extraHeaders.push('RAck: ' + response.getHeader('rseq') + ' ' + response.getHeader('cseq'));
            this.earlyDialogs[id].pracked.push(response.getHeader('rseq'));
            this.earlyDialogs[id].sendRequest(this, SIP.C.PRACK, {
              extraHeaders: extraHeaders
            });
            this.emit('progress', response);

          } else if (this.hasOffer) {
            if (!this.createDialog(response, 'UAC')) {
              break;
            }
            this.hasAnswer = true;
            this.dialog.pracked.push(response.getHeader('rseq'));

            this.sessionDescriptionHandler.setDescription(response.body, this.sessionDescriptionHandlerOptions, this.modifiers)
            .then(
              function onSuccess () {
                extraHeaders.push('RAck: ' + response.getHeader('rseq') + ' ' + response.getHeader('cseq'));

                session.sendRequest(SIP.C.PRACK, {
                  extraHeaders: extraHeaders,
                  receiveResponse: function() {}
                });
                session.status = C.STATUS_EARLY_MEDIA;
                session.emit('progress', response);
              },
              function onFailure (e) {
                session.logger.warn(e);
                session.acceptAndTerminate(response, 488, 'Not Acceptable Here');
                session.failed(response, SIP.C.causes.BAD_MEDIA_DESCRIPTION);
              }
            );
          } else {
            var earlyDialog = this.earlyDialogs[id];
            var earlyMedia = earlyDialog.sessionDescriptionHandler = this.sessionDescriptionHandlerFactory(this, new SessionDescriptionHandlerObserver(this), this.sessionDescriptionHandlerFactoryOptions);
            this.emit('SessionDescriptionHandler-created', earlyMedia);

            earlyDialog.pracked.push(response.getHeader('rseq'));

            earlyMedia.setDescription(response.body, session.sessionDescriptionHandlerOptions, session.modifers)
            .then(earlyMedia.getDescription.bind(earlyMedia, session.sessionDescriptionHandlerOptions, session.modifiers))
            .then(function onSuccess(description) {
              extraHeaders.push('RAck: ' + response.getHeader('rseq') + ' ' + response.getHeader('cseq'));
              earlyDialog.sendRequest(session, SIP.C.PRACK, {
                extraHeaders: extraHeaders,
                body: description
              });
              session.status = C.STATUS_EARLY_MEDIA;
              session.emit('progress', response);
            })
            .catch(function onFailure(e) {
              if (e instanceof SIP.Exceptions.GetDescriptionError) {
                earlyDialog.pracked.push(response.getHeader('rseq'));
                if (session.status === C.STATUS_TERMINATED) {
                  return;
                }
                session.failed(null, SIP.C.causes.WEBRTC_ERROR);
                session.terminated(null, SIP.C.causes.WEBRTC_ERROR);
              } else {
                earlyDialog.pracked.splice(earlyDialog.pracked.indexOf(response.getHeader('rseq')), 1);
                // Could not set remote description
                session.logger.warn('invalid description');
                session.logger.warn(e);
              }
            });
          }
        } else {
          this.emit('progress', response);
        }
        break;
      case /^2[0-9]{2}$/.test(response.status_code):
        var cseq = this.request.cseq + ' ' + this.request.method;
        if (cseq !== response.getHeader('cseq')) {
          break;
        }

        if (this.status === C.STATUS_EARLY_MEDIA && this.dialog) {
          this.status = C.STATUS_CONFIRMED;
          options = {};
          if (this.renderbody) {
            extraHeaders.push('Content-Type: ' + this.rendertype);
            options.extraHeaders = extraHeaders;
            options.body = this.renderbody;
          }
          this.emit("ack", response.transaction.sendACK(options));
          this.accepted(response);
          break;
        }
        // Do nothing if this.dialog is already confirmed
        if (this.dialog) {
          break;
        }

        // This is an invite without sdp
        if (!this.hasOffer) {
          if (this.earlyDialogs[id] && this.earlyDialogs[id].sessionDescriptionHandler) {
            //REVISIT
            this.hasOffer = true;
            this.hasAnswer = true;
            this.sessionDescriptionHandler = this.earlyDialogs[id].sessionDescriptionHandler;
            if (!this.createDialog(response, 'UAC')) {
              break;
            }
            this.status = C.STATUS_CONFIRMED;
            this.emit("ack", response.transaction.sendACK());

            this.accepted(response);
          } else {
            this.sessionDescriptionHandler = this.sessionDescriptionHandlerFactory(this, new SessionDescriptionHandlerObserver(this), this.sessionDescriptionHandlerFactoryOptions);
            this.emit('SessionDescriptionHandler-created', this.sessionDescriptionHandler);

            if(!this.sessionDescriptionHandler.hasDescription(response.getHeader('Content-Type'))) {
              this.acceptAndTerminate(response, 400, 'Missing session description');
              this.failed(response, SIP.C.causes.BAD_MEDIA_DESCRIPTION);
              break;
            }
            if (!this.createDialog(response, 'UAC')) {
              break;
            }
            this.hasOffer = true;
            this.sessionDescriptionHandler.setDescription(response.body, this.sessionDescriptionHandlerOptions, this.modifiers)
            .then(this.sessionDescriptionHandler.getDescription.bind(this.sessionDescriptionHandler, this.sessionDescriptionHandlerOptions, this.modifiers))
            .then(function onSuccess(description) {
              //var localMedia;
              if(session.isCanceled || session.status === C.STATUS_TERMINATED) {
                return;
              }

              session.status = C.STATUS_CONFIRMED;
              session.hasAnswer = true;

              session.emit("ack", response.transaction.sendACK({body: description}));
              session.accepted(response);
            })
            .catch(function onFailure(e) {
              if (e instanceof SIP.Exceptions.GetDescriptionError) {
                // TODO do something here
                session.logger.warn("there was a problem");
              } else {
                session.logger.warn('invalid description');
                session.logger.warn(e);
                session.acceptAndTerminate(response, 488, 'Invalid session description');
                session.failed(response, SIP.C.causes.BAD_MEDIA_DESCRIPTION);
              }
            });
          }
        } else if (this.hasAnswer){
          if (this.renderbody) {
            extraHeaders.push('Content-Type: ' + session.rendertype);
            options.extraHeaders = extraHeaders;
            options.body = this.renderbody;
          }
          this.emit("ack", response.transaction.sendACK(options));
        } else {
          if(!this.sessionDescriptionHandler.hasDescription(response.getHeader('Content-Type'))) {
            this.acceptAndTerminate(response, 400, 'Missing session description');
            this.failed(response, SIP.C.causes.BAD_MEDIA_DESCRIPTION);
            break;
          }
          if (!this.createDialog(response, 'UAC')) {
            break;
          }
          this.hasAnswer = true;
          this.sessionDescriptionHandler.setDescription(response.body, this.sessionDescriptionHandlerOptions, this.modifiers)
          .then(
            function onSuccess () {
              var options = {};
              session.status = C.STATUS_CONFIRMED;
              if (session.renderbody) {
                extraHeaders.push('Content-Type: ' + session.rendertype);
                options.extraHeaders = extraHeaders;
                options.body = session.renderbody;
              }
              session.emit("ack", response.transaction.sendACK(options));
              session.accepted(response);
            },
            function onFailure (e) {
              session.logger.warn(e);
              session.acceptAndTerminate(response, 488, 'Not Acceptable Here');
              session.failed(response, SIP.C.causes.BAD_MEDIA_DESCRIPTION);
            }
          );
        }
        break;
      default:
        cause = SIP.Utils.sipErrorCause(response.status_code);
        this.rejected(response, cause);
        this.failed(response, cause);
        this.terminated(response, cause);
    }
  },

  cancel: function(options) {
    options = options || {};

    options.extraHeaders = (options.extraHeaders || []).slice();

    // Check Session Status
    if (this.status === C.STATUS_TERMINATED || this.status === C.STATUS_CONFIRMED) {
      throw new SIP.Exceptions.InvalidStateError(this.status);
    }

    this.logger.log('canceling RTCSession');

    var cancel_reason = SIP.Utils.getCancelReason(options.status_code, options.reason_phrase);

    // Check Session Status
    if (this.status === C.STATUS_NULL ||
        (this.status === C.STATUS_INVITE_SENT && !this.received_100)) {
      this.isCanceled = true;
      this.cancelReason = cancel_reason;
    } else if (this.status === C.STATUS_INVITE_SENT ||
               this.status === C.STATUS_1XX_RECEIVED ||
               this.status === C.STATUS_EARLY_MEDIA) {
      this.request.cancel(cancel_reason, options.extraHeaders);
    }

    return this.canceled();
  },

  terminate: function(options) {
    if (this.status === C.STATUS_TERMINATED) {
      return this;
    }

    if (this.status === C.STATUS_WAITING_FOR_ACK || this.status === C.STATUS_CONFIRMED) {
      this.bye(options);
    } else {
      this.cancel(options);
    }

    return this;
  },

  receiveRequest: function(request) {
    // ICC RECEIVE REQUEST

    // Reject CANCELs
    if (request.method === SIP.C.CANCEL) {
      // TODO; make this a switch when it gets added
    }

    if (request.method === SIP.C.ACK && this.status === C.STATUS_WAITING_FOR_ACK) {

      SIP.Timers.clearTimeout(this.timers.ackTimer);
      SIP.Timers.clearTimeout(this.timers.invite2xxTimer);
      this.status = C.STATUS_CONFIRMED;

      this.accepted();
    }

    return Session.prototype.receiveRequest.apply(this, [request]);
  },

  onTransportError: function() {
    if (this.status !== C.STATUS_CONFIRMED && this.status !== C.STATUS_TERMINATED) {
      this.failed(null, SIP.C.causes.CONNECTION_ERROR);
    }
  },

  onRequestTimeout: function() {
    if (this.status === C.STATUS_CONFIRMED) {
      this.terminated(null, SIP.C.causes.REQUEST_TIMEOUT);
    } else if (this.status !== C.STATUS_TERMINATED) {
      this.failed(null, SIP.C.causes.REQUEST_TIMEOUT);
      this.terminated(null, SIP.C.causes.REQUEST_TIMEOUT);
    }
  }

};

SIP.InviteClientContext = InviteClientContext;

ReferClientContext = function(ua, applicant, target, options) {
  this.options = options || {};
  this.extraHeaders = (this.options.extraHeaders || []).slice();

  if (ua === undefined || applicant === undefined || target === undefined) {
    throw new TypeError('Not enough arguments');
  }

  SIP.Utils.augment(this, SIP.ClientContext, [ua, SIP.C.REFER, applicant.remoteIdentity.uri.toString(), options]);

  this.applicant = applicant;

  var withReplaces = target instanceof SIP.InviteServerContext ||
                     target instanceof SIP.InviteClientContext;
  if (withReplaces) {
    // Attended Transfer
    // All of these fields should be defined based on the check above
    this.target = '"' + target.remoteIdentity.friendlyName + '" ' +
        '<' + target.dialog.remote_target.toString() +
        '?Replaces=' + target.dialog.id.call_id +
        '%3Bto-tag%3D' + target.dialog.id.remote_tag +
        '%3Bfrom-tag%3D' + target.dialog.id.local_tag + '>';
  } else {
    // Blind Transfer
    // Refer-To: <sip:bob@example.com>
    try {
      this.target = SIP.Grammar.parse(target, 'Refer_To').uri || target;
    } catch (e) {
      this.logger.debug(".refer() cannot parse Refer_To from", target);
      this.logger.debug("...falling through to normalizeTarget()");
    }

    // Check target validity
    this.target = this.ua.normalizeTarget(this.target);
    if (!this.target) {
      throw new TypeError('Invalid target: ' + target);
    }
  }

  if (this.ua) {
    this.extraHeaders.push('Referred-By: <' + this.ua.configuration.uri + '>');
  }
  // TODO: Check that this is correct isc/icc
  this.extraHeaders.push('Contact: '+ applicant.contact);
  this.extraHeaders.push('Allow: '+ SIP.UA.C.ALLOWED_METHODS.toString());
  this.extraHeaders.push('Refer-To: '+ this.target);
};

ReferClientContext.prototype = {

  refer: function(options) {
    options = options || {};

    var extraHeaders = (this.extraHeaders || []).slice();
    if (options.extraHeaders) {
      extraHeaders.concat(options.extraHeaders);
    }

    this.applicant.sendRequest(SIP.C.REFER, {
      extraHeaders: this.extraHeaders,
      receiveResponse: function (response) {
        if (/^1[0-9]{2}$/.test(response.status_code) ) {
          this.emit('referRequestProgress', this);
        } else if (/^2[0-9]{2}$/.test(response.status_code) ) {
          this.emit('referRequestAccepted', this);
        } else if (/^[4-6][0-9]{2}$/.test(response.status_code)) {
          this.emit('referRequestRejected', this);
        }
        if (options.receiveResponse) {
          options.receiveResponse(response);
        }
      }.bind(this)
    });
    return this;
  },

  receiveNotify: function(request) {
    // If we can correctly handle this, then we need to send a 200 OK!
    if (request.hasHeader('Content-Type') && request.getHeader('Content-Type').search(/^message\/sipfrag/) !== -1) {
      var messageBody = SIP.Grammar.parse(request.body, 'sipfrag');
      if (messageBody === -1) {
        request.reply(489, 'Bad Event');
        return;
      }
      switch(true) {
        case (/^1[0-9]{2}$/.test(messageBody.status_code)):
          this.emit('referProgress', this);
          break;
        case (/^2[0-9]{2}$/.test(messageBody.status_code)):
          this.emit('referAccepted', this);
          if (!this.options.activeAfterTransfer && this.applicant.terminate) {
            this.applicant.terminate();
          }
          break;
        default:
          this.emit('referRejected', this);
          break;
      }
      request.reply(200);
      this.emit('notify', request);
      return;
    }
    request.reply(489, 'Bad Event');
  }
};

SIP.ReferClientContext = ReferClientContext;

ReferServerContext = function(ua, request) {
  SIP.Utils.augment(this, SIP.ServerContext, [ua, request]);

  this.ua = ua;

  this.status = C.STATUS_INVITE_RECEIVED;
  this.from_tag = request.from_tag;
  this.id = request.call_id + this.from_tag;
  this.request = request;
  this.contact = this.ua.contact.toString();

  this.logger = ua.getLogger('sip.referservercontext', this.id);

  // RFC 3515 2.4.1
  if (!this.request.hasHeader('refer-to')) {
    this.logger.warn('Invalid REFER packet. A refer-to header is required. Rejecting refer.');
    this.reject();
    return;
  }

  this.referTo = this.request.parseHeader('refer-to');

  // TODO: Must set expiration timer and send 202 if there is no response by then

  this.referredSession = this.ua.findSession(request);

  // Needed to send the NOTIFY's
  this.cseq = Math.floor(Math.random() * 10000);
  this.call_id = this.request.call_id;
  this.from_uri = this.request.to.uri;
  this.from_tag = this.request.to.parameters.tag;
  this.remote_target = this.request.headers.Contact[0].parsed.uri;
  this.to_uri = this.request.from.uri;
  this.to_tag = this.request.from_tag;
  this.route_set = this.request.getHeaders('record-route');

  this.receiveNonInviteResponse = function () {};

  if (this.request.hasHeader('referred-by')) {
    this.referredBy = this.request.getHeader('referred-by');
  }

  if (this.referTo.uri.hasHeader('replaces')) {
    this.replaces = this.referTo.uri.getHeader('replaces');
  }

  this.status = C.STATUS_WAITING_FOR_ANSWER;
};

ReferServerContext.prototype = {

  progress: function() {
    if (this.status !== C.STATUS_WAITING_FOR_ANSWER) {
      throw new SIP.Exceptions.InvalidStateError(this.status);
    }
    this.request.reply(100);
  },

  reject: function(options) {
    if (this.status  === C.STATUS_TERMINATED) {
      throw new SIP.Exceptions.InvalidStateError(this.status);
    }
    this.logger.log('Rejecting refer');
    this.status = C.STATUS_TERMINATED;
    SIP.ServerContext.prototype.reject.call(this, options);
    this.emit('referRequestRejected', this);
  },

  accept: function(options, modifiers) {
    options = options || {};

    if (this.status === C.STATUS_WAITING_FOR_ANSWER) {
      this.status = C.STATUS_ANSWERED;
    } else {
      throw new SIP.Exceptions.InvalidStateError(this.status);
    }

    this.request.reply(202, 'Accepted');
    this.emit('referRequestAccepted', this);

    if (options.followRefer) {
      this.logger.log('Accepted refer, attempting to automatically follow it');

      var target = this.referTo.uri;
      if (!target.scheme.match("^sips?$")) {
        this.logger.error('SIP.js can only automatically follow SIP refer target');
        this.reject();
        return;
      }

      var inviteOptions = options.inviteOptions || {};
      var extraHeaders = (inviteOptions.extraHeaders || []).slice();
      if (this.replaces) {
        // decodeURIComponent is a holdover from 2c086eb4. Not sure that it is actually necessary
        extraHeaders.push('Replaces: ' + decodeURIComponent(this.replaces));
      }

      if (this.referredBy) {
        extraHeaders.push('Referred-By: ' + this.referredBy);
      }

      inviteOptions.extraHeaders = extraHeaders;

      target.clearHeaders();

      this.targetSession = this.ua.invite(target, inviteOptions, modifiers);

      this.emit('referInviteSent', this);

      this.targetSession.once('progress', function() {
        this.sendNotify('SIP/2.0 100 Trying');
        this.emit('referProgress', this);
        if (this.referredSession) {
          this.referredSession.emit('referProgress', this);
        }
      }.bind(this));
      this.targetSession.once('accepted', function() {
        this.logger.log('Successfully followed the refer');
        this.sendNotify('SIP/2.0 200 OK');
        this.emit('referAccepted', this);
        if (this.referredSession) {
          this.referredSession.emit('referAccepted', this);
        }
      }.bind(this));

      var referFailed = function(response) {
        if (this.status === C.STATUS_TERMINATED) {
          return; // No throw here because it is possible this gets called multiple times
        }
        this.logger.log('Refer was not successful. Resuming session');
        if (response && response.status_code === 429) {
          this.logger.log('Alerting referrer that identity is required.');
          this.sendNotify('SIP/2.0 429 Provide Referrer Identity');
          return;
        }
        this.sendNotify('SIP/2.0 603 Declined');
        // Must change the status after sending the final Notify or it will not send due to check
        this.status = C.STATUS_TERMINATED;
        this.emit('referRejected', this);
        if (this.referredSession) {
          this.referredSession.emit('referRejected');
        }
      };

      this.targetSession.once('rejected', referFailed.bind(this));
      this.targetSession.once('failed', referFailed.bind(this));

    } else {
      this.logger.log('Accepted refer, but did not automatically follow it');
      this.sendNotify('SIP/2.0 200 OK');
      this.emit('referAccepted', this);
      if (this.referredSession) {
        this.referredSession.emit('referAccepted', this);
      }
    }
  },

  sendNotify: function(body) {
    if (this.status !== C.STATUS_ANSWERED) {
      throw new SIP.Exceptions.InvalidStateError(this.status);
    }
    if (SIP.Grammar.parse(body, 'sipfrag') === -1) {
      throw new Error('sipfrag body is required to send notify for refer');
    }

    var request = new SIP.OutgoingRequest(
      SIP.C.NOTIFY,
      this.remote_target,
      this.ua,
      {
        cseq: this.cseq += 1,  // randomly generated then incremented on each additional notify
        call_id: this.call_id, // refer call_id
        from_uri: this.from_uri,
        from_tag: this.from_tag,
        to_uri: this.to_uri,
        to_tag: this.to_tag,
        route_set: this.route_set
      },
      [
        'Event: refer',
        'Subscription-State: terminated',
        'Content-Type: message/sipfrag'
      ],
      body
    );

    new SIP.RequestSender({
      request: request,
      onRequestTimeout: function() {
        return;
      },
      onTransportError: function() {
        return;
      },
      receiveResponse: function() {
        return;
      }
    }, this.ua).send();
  }
};

SIP.ReferServerContext = ReferServerContext;

};
