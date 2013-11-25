//(function (JsSIP) {
var ServerContext;

ServerContext = function (request, ua) {
  var events = [
    'progress',
    'accepted',
    'rejected',
    'failed'
  ];
  this.ua = ua;
  this.logger = ua.getLogger('sip.serverTransaction');
  this.request = request;
  this.transaction = new JsSIP.Transactions.NonInviteServerTransaction(request, ua);

  this.data = {};

  if (!ua.checkEvent(request.method.toLowerCase()) || this.ua.listeners(request.method.toLowerCase()).length === 0) {
    // UA is not listening for this.  Reject immediately.
    request.reply(405, null, ['Allow: '+ JsSIP.Utils.getAllowedMethods(ua)]);
  } else {
    // Send a provisional response to stop retransmissions.
    request.reply(180, 'Trying');
    this.ua.emit(request.method.toLowerCase(), this.ua, this);
  }
};


ServerContext.prototype = new JsSIP.EventEmitter();

ServerContext.prototype.progress = function (options) {
  options = options || {};
  var
    statusCode = options.statusCode || 180,
    reasonPhrase = options.reasonPhrase,
    extraHeaders = options.extraHeaders || [],
    body = options.body;

  if (statusCode < 100 || statusCode > 199) {
    throw new TypeError('Invalid statusCode: ' + statusCode);
  }
  this.request.reply(statusCode, reasonPhrase, extraHeaders, body);
  this.emit('progress', this, {
        code: response.status_code,
        response: response
      });

  return this;
};

ServerContext.prototype.accept = function (options) {
  options = options || {};
  var
    statusCode = options.statusCode || 200,
    reasonPhrase = options.reasonPhrase,
    extraHeaders = options.extraHeaders || [],
    body = options.body;

  if (statusCode < 200 || statusCode > 299) {
    throw new TypeError('Invalid statusCode: ' + statusCode);
  }
  this.request.reply(statusCode, reasonPhrase, extraHeaders, body);
  this.emit('accepted', this, {
        code: response.status_code,
        response: response
      });

  return this;
};

ServerContext.prototype.reject = function (options) {
  options = options || {};
  var
    statusCode = options.statusCode || 480,
    reasonPhrase = options.reasonPhrase,
    extraHeaders = options.extraHeaders || [],
    body = options.body;

  if (statusCode < 300 || statusCode > 699) {
    throw new TypeError('Invalid statusCode: ' + statusCode);
  }
  this.request.reply(statusCode, reasonPhrase, extraHeaders, body);
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

  return this;
};

ServerContext.prototype.reply = function (options) {
  options = options || {};
  var
    statusCode = options.statusCode,
    reasonPhrase = options.reasonPhrase,
    extraHeaders = options.extraHeaders || [],
    body = options.body;

  this.request.reply(statusCode, reasonPhrase, extraHeaders, body);

  return this;
};

ServerContext.prototype.onRequestTimeout = function () {
  this.emit('failed',
            /* Status code */ 0,
            /* Response */ null,
            JsSIP.C.causes.REQUEST_TIMEOUT);
};

ServerContext.prototype.onTransportError = function () {
  this.emit('failed',
            /* Status code */ 0,
            /* Response */ null,
            JsSIP.C.causes.CONNECTION_ERROR);
};

JsSIP.ServerContext = ServerContext;
//}(JsSIP));