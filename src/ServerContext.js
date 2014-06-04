module.exports = function (SIP) {
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

  if (request.body) {
    this.body = request.body;
  }
  if (request.hasHeader('Content-Type')) {
    this.contentType = request.getHeader('Content-Type');
  }
  this.method = request.method;

  this.data = {};

  this.localIdentity = request.to;
  this.remoteIdentity = request.from;

  this.initEvents(events);
};

ServerContext.prototype = new SIP.EventEmitter();

ServerContext.prototype.progress = function (options) {
  options = options || {};
  var
    statusCode = options.statusCode || 180,
    reasonPhrase = options.reasonPhrase || SIP.C.REASON_PHRASE[statusCode],
    extraHeaders = options.extraHeaders || [],
    body = options.body,
    response;

  if (statusCode < 100 || statusCode > 199) {
    throw new TypeError('Invalid statusCode: ' + statusCode);
  }
  response = this.request.reply(statusCode, reasonPhrase, extraHeaders, body);
  this.emit('progress', response, reasonPhrase);

  return this;
};

ServerContext.prototype.accept = function (options) {
  options = options || {};
  var
    statusCode = options.statusCode || 200,
    reasonPhrase = options.reasonPhrase || SIP.C.REASON_PHRASE[statusCode],
    extraHeaders = options.extraHeaders || [],
    body = options.body,
    response;

  if (statusCode < 200 || statusCode > 299) {
    throw new TypeError('Invalid statusCode: ' + statusCode);
  }
  response = this.request.reply(statusCode, reasonPhrase, extraHeaders, body);
  this.emit('accepted', response, reasonPhrase);

  return this;
};

ServerContext.prototype.reject = function (options) {
  options = options || {};
  var
    statusCode = options.statusCode || 480,
    reasonPhrase = options.reasonPhrase || SIP.C.REASON_PHRASE[statusCode],
    extraHeaders = options.extraHeaders || [],
    body = options.body,
    response;

  if (statusCode < 300 || statusCode > 699) {
    throw new TypeError('Invalid statusCode: ' + statusCode);
  }
  response = this.request.reply(statusCode, reasonPhrase, extraHeaders, body);
  this.emit('rejected', response, reasonPhrase);
  this.emit('failed', response, reasonPhrase);

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
  this.emit('failed', null, SIP.C.causes.REQUEST_TIMEOUT);
};

ServerContext.prototype.onTransportError = function () {
  this.emit('failed', null, SIP.C.causes.CONNECTION_ERROR);
};

SIP.ServerContext = ServerContext;
};
