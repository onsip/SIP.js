(function (SIP) {
var ClientContext;

ClientContext = function (ua, method, target, options) {
  var params, extraHeaders,
      originalTarget = target,
      events = [
        'progress',
        'accepted',
        'rejected',
        'failed',
        'cancel'
      ];

  if (target === undefined) {
    throw new TypeError('Not enough arguments');
  }

  // Check target validity
  target = ua.normalizeTarget(target);
  if (!target) {
    throw new TypeError('Invalid target: ' + originalTarget);
  }

  this.ua = ua;
  this.logger = ua.getLogger('sip.clientcontext');
  this.method = method;

  params = options && options.params;
  extraHeaders = (options && options.extraHeaders) || [];

  if (options && options.body) {
    this.body = options.body;
  }
  if (options && options.contentType) {
    this.contentType = options.contentType;
    extraHeaders.push('Content-Type: ' + this.contentType);
  }

  this.request = new SIP.OutgoingRequest(this.method, target, this.ua, params, extraHeaders);

  this.localIdentity = this.request.from;
  this.remoteIdentity = this.request.to;

  if (this.body) {
    this.request.body = this.body;
  }

  this.data = {};

  this.initEvents(events);
};
ClientContext.prototype = new SIP.EventEmitter();

ClientContext.prototype.send = function () {
  (new SIP.RequestSender(this, this.ua)).send();
  return this;
};

ClientContext.prototype.cancel = function (options) {
  options = options || {};

  var
  status_code = options.status_code,
  reason_phrase = options.reason_phrase,
  cancel_reason;

  if (status_code && status_code < 200 || status_code > 699) {
    throw new TypeError('Invalid status_code: ' + status_code);
  } else if (status_code) {
    reason_phrase = reason_phrase || SIP.C.REASON_PHRASE[status_code] || '';
    cancel_reason = 'SIP ;cause=' + status_code + ' ;text="' + reason_phrase + '"';
  }
  this.request.cancel(cancel_reason);
  
  this.emit('cancel');
};

ClientContext.prototype.receiveResponse = function (response) {
  var cause;

  switch(true) {
    case /^1[0-9]{2}$/.test(response.status_code):
      this.emit('progress', {
        code: response.status_code,
        response: response
      });
      break;

    case /^2[0-9]{2}$/.test(response.status_code):
      if(this.ua.applicants[this]) {
        delete this.ua.applicants[this];
      }
      this.emit('accepted', {
        code: response.status_code,
        response: response
      });
      break;

    default:
      if(this.ua.applicants[this]) {
        delete this.ua.applicants[this];
      }
      cause = SIP.Utils.sipErrorCause(response.status_code);
      this.emit('rejected', {
        code: response && response.status_code,
        response: response,
        cause: cause
      });
      this.emit('failed', {
        code: response && response.status_code,
        response: response,
        cause: cause
      });
      break;
  }

};

ClientContext.prototype.onRequestTimeout = function () {
  this.emit('failed',
            /* Status code */ 0,
            /* Response */ null,
            SIP.C.causes.REQUEST_TIMEOUT);
};

ClientContext.prototype.onTransportError = function () {
  this.emit('failed',
            /* Status code */ 0,
            /* Response */ null,
            SIP.C.causes.CONNECTION_ERROR);
};

SIP.ClientContext = ClientContext;
}(SIP));
