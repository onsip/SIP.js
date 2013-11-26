(function (SIP) {
var ServerContext;

ServerContext = function (request, ua) {
  var events = [
      'progress',
      'accepted',
      'rejected',
      'failed'
    ],
    methodLower = request.method.toLowerCase();
  this.ua = ua;
  this.logger = ua.getLogger('sip.servercontext');
  this.request = request;
  this.transaction = new SIP.Transactions.NonInviteServerTransaction(request, ua);

  this.data = {};

  this.initEvents(events);

  if (!ua.checkEvent(methodLower) ||
      ua.listeners(methodLower).length === 0) {
    // UA is not listening for this.  Reject immediately.
    request.reply(405, null, ['Allow: '+ SIP.Utils.getAllowedMethods(ua)]);
  } else {
    // Send a provisional response to stop retransmissions.
    request.reply(180, 'Trying');
    ua.emit(methodLower, ua, this);
  }
};

ServerContext.prototype = new SIP.EventEmitter();

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
        code: statusCode,
        response: null
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
        code: statusCode,
        response: null
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
    code: statusCode,
    response: null,
    cause: reasonPhrase
  });
  this.emit('failed', this, {
    code: statusCode,
    response: null,
    cause: reasonPhrase
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
            SIP.C.causes.REQUEST_TIMEOUT);
};

ServerContext.prototype.onTransportError = function () {
  this.emit('failed',
            /* Status code */ 0,
            /* Response */ null,
            SIP.C.causes.CONNECTION_ERROR);
};

SIP.ServerContext = ServerContext;
}(SIP));
