(function (SIP) {
var ClientContext;

ClientContext = function (ua, method, target) {
  var events = [
    'progress',
    'accepted',
    'rejected',
    'failed'
  ];
  this.ua = ua;
  this.logger = ua.getLogger('sip.clientcontext');
  this.method = method;
  this.target = target;

  this.data = {};

  this.initEvents(events);
};
ClientContext.prototype = new SIP.EventEmitter();

ClientContext.prototype.send = function (options) {
  var request_sender, params, extraHeaders,
    originalTarget = this.target;

  if (this.target === undefined) {
    throw new TypeError('Not enough arguments');
  }

  // Check target validity
  this.target = this.ua.normalizeTarget(this.target);
  if (!this.target) {
    throw new TypeError('Invalid target: '+ originalTarget);
  }

  // Get call options
  params = options.params;
  extraHeaders = options.extraHeaders || [];

  this.request = new SIP.OutgoingRequest(this.method, this.target, this.ua, params, extraHeaders);

  this.local_identity = this.request.from;
  this.remote_identity = this.request.to;

  if (options.body) {
    this.request.body = options.body;
  }

  //I'd throw an if around this if we decide to call send in INVITE (maybe just the send line)
  request_sender = new SIP.RequestSender(this, this.ua);
  request_sender.send();
  return this;
};

ClientContext.prototype.receiveResponse = function (response) {
  var cause;

  switch(true) {
    case /^1[0-9]{2}$/.test(response.status_code):
      this.emit('progress', this, {
        code: response.status_code,
        response: response
      });
      break;

    case /^2[0-9]{2}$/.test(response.status_code):
      if(this.ua.applicants[this]) {
        delete this.ua.applicants[this];
      }
      this.emit('accepted', this, {
        code: response.status_code,
        response: response
      });
      break;

    default:
      if(this.ua.applicants[this]) {
        delete this.ua.applicants[this];
      }
      cause = SIP.Utils.sipErrorCause(response.status_code);
      this.emit('rejected', this, {
        code: response && response.status_code,
        response: response,
        cause: cause
      });
      this.emit('failed', this, {
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
