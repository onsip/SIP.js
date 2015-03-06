"use strict";
module.exports = function (SIP) {
var ClientContext;

ClientContext = function (ua, method, target, options) {
  var originalTarget = target,
      events = [
        'progress',
        'accepted',
        'rejected',
        'failed',
        'cancel'
      ];

  // Validate arguments
  if (target === undefined) {
    throw new TypeError('Not enough arguments');
  }

  this.ua = ua;
  this.logger = ua.getLogger('sip.clientcontext');
  this.method = method;
  target = ua.normalizeTarget(target);
  if (!target) {
    throw new TypeError('Invalid target: ' + originalTarget);
  }

  /* Options
   * - extraHeaders
   * - params
   * - contentType
   * - body
   */
  var composedOptions = Object.create(options || Object.prototype);
  composedOptions.extraHeaders = (composedOptions.extraHeaders || []).slice();

  if (composedOptions.contentType) {
    this.contentType = composedOptions.contentType;
    composedOptions.extraHeaders.push('Content-Type: ' + this.contentType);
  }

  // Build the request
  this.request = new SIP.OutgoingRequest(this.method,
                                         target,
                                         this.ua,
                                         composedOptions.params,
                                         composedOptions.extraHeaders);
  if (composedOptions.body) {
    this.body = composedOptions.body;
    this.request.body = this.body;
  }

  /* Set other properties from the request */
  this.localIdentity = this.request.from;
  this.remoteIdentity = this.request.to;

  this.initEvents(events);
  this.data = {};
};
ClientContext.prototype = new SIP.EventEmitter();

ClientContext.prototype.send = function () {
  (new SIP.RequestSender(this, this.ua)).send();
  return this;
};

ClientContext.prototype.cancel = function (options) {
  options = options || {};

  var cancel_reason = SIP.Utils.getCancelReason(options.status_code, options.reason_phrase);
  this.request.cancel(cancel_reason);

  this.emit('cancel');
};

ClientContext.prototype.receiveResponse = function (response) {
  var cause = SIP.Utils.getReasonPhrase(response.status_code);

  switch(true) {
    case /^1[0-9]{2}$/.test(response.status_code):
      this.emit('progress', response, cause);
      break;

    case /^2[0-9]{2}$/.test(response.status_code):
      if(this.ua.applicants[this]) {
        delete this.ua.applicants[this];
      }
      this.emit('accepted', response, cause);
      break;

    default:
      if(this.ua.applicants[this]) {
        delete this.ua.applicants[this];
      }
      this.emit('rejected', response, cause);
      this.emit('failed', response, cause);
      break;
  }

};

ClientContext.prototype.onRequestTimeout = function () {
  this.emit('failed', null, SIP.C.causes.REQUEST_TIMEOUT);
};

ClientContext.prototype.onTransportError = function () {
  this.emit('failed', null, SIP.C.causes.CONNECTION_ERROR);
};

SIP.ClientContext = ClientContext;
};
