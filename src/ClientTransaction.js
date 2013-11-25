(function (JsSIP) {
var ClientTransaction;

ClientTransaction = function (method, target, options, ua) {
  var events = [
    'progress',
    'accepted',
    'rejected',
    'failed'
  ];
  this.ua = ua;
  this.logger = ua.getLogger('jssip.clienttransaction');
  this.method = method;
  this.target = target;
  this.options = options || {};

  this.data = {};

  this.initEvents(events);
};
ClientTransaction.prototype = new JsSIP.EventEmitter();

ClientTransaction.prototype.send = function () {
  var request_sender, extraHeaders, body,
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
  extraHeaders = this.options.extraHeaders || [];
  body = this.options.body;

  this.ua.applicants[this] = this;

  this.request = new JsSIP.OutgoingRequest(this.method, this.target, this.ua, null, extraHeaders);

  if (body) {
    this.request.body = body;
  }

  request_sender = new JsSIP.RequestSender(this, this.ua);
  request_sender.send();
};

ClientTransaction.prototype.receiveResponse = function (response) {
  var cause;

  switch(true) {
    case /^1[0-9]{2}$/.test(response.status_code):
      this.emit('progress', this, {
        code: response.status_code,
        response: response
      });
      break;

    case /^2[0-9]{2}$/.test(response.status_code):
      delete this.ua.applicants[this];
      this.emit('accepted', this, {
        code: response.status_code,
        response: response
      });
      break;

    default:
      delete this.ua.applicants[this];
      cause = JsSIP.Utils.sipErrorCause(response.status_code);
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

ClientTransaction.prototype.onRequestTimeout = function () {
  this.emit('failed',
            /* Status code */ 0,
            /* Response */ null,
            JsSIP.C.causes.REQUEST_TIMEOUT);
};

ClientTransaction.prototype.onTransportError = function () {
  this.emit('failed',
            /* Status code */ 0,
            /* Response */ null,
            JsSIP.C.causes.CONNECTION_ERROR);
};

JsSIP.XClientTransaction = ClientTransaction;
}(JsSIP));