//(function (JsSIP) {
var ServerTransaction;

ServerTransaction = function (request, ua) {
  var events = [
    'progress',
    'accepted',
    'rejected',
    'failed'
  ];
  this.ua = ua;
  this.logger = ua.getLogger('jssip.serverTransaction');
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


ServerTransaction.prototype = new JsSIP.EventEmitter();

ServerTransaction.prototype.progress = function (options) {
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

ServerTransaction.prototype.accept = function (options) {
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

ServerTransaction.prototype.reject = function (options) {
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

ServerTransaction.prototype.reply = function (options) {
  options = options || {};
  var
    statusCode = options.statusCode,
    reasonPhrase = options.reasonPhrase,
    extraHeaders = options.extraHeaders || [],
    body = options.body;

  this.request.reply(statusCode, reasonPhrase, extraHeaders, body);

  return this;
};

ServerTransaction.prototype.onRequestTimeout = function () {
  this.emit('failed',
            /* Status code */ 0,
            /* Response */ null,
            JsSIP.C.causes.REQUEST_TIMEOUT);
};

ServerTransaction.prototype.onTransportError = function () {
  this.emit('failed',
            /* Status code */ 0,
            /* Response */ null,
            JsSIP.C.causes.CONNECTION_ERROR);
};

JsSIP.XServerTransaction = ServerTransaction;
//}(JsSIP));