(function (SIP) {
var ServerContext;

ServerContext = function (ua, request) {
  var events = [
      'progress',
      'accepted',
      'rejected',
      'failed'
    ];
  this.ua = ua;
  this.logger = ua.getLogger('sip.servercontext');
  this.request = request;
  if (request.method === SIP.C.INVITE) {
    this.transaction = new SIP.Transactions.InviteServerTransaction(request, ua); 
  } else {
    this.transaction = new SIP.Transactions.NonInviteServerTransaction(request, ua);
  }

  this.data = {};

  this.local_identity = request.to;
  this.remote_identity = request.from;

  this.initEvents(events);
};

ServerContext.prototype = new SIP.EventEmitter();

ServerContext.prototype.progress = function (options) {
  options = options || {};
  var
    statusCode = options.statusCode || 180,
    reasonPhrase = options.reasonPhrase,
    extraHeaders = options.extraHeaders || [],
    body = options.body,
    response;

  if (statusCode < 100 || statusCode > 199) {
    throw new TypeError('Invalid statusCode: ' + statusCode);
  }
  response = this.request.reply(statusCode, reasonPhrase, extraHeaders, body);
  this.emit('progress', {
        code: statusCode,
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
  this.emit('accepted', {
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
  this.emit('rejected', {
    code: statusCode,
    response: null,
    cause: reasonPhrase
  });
  this.emit('failed', {
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
