module.exports = function (SIP) {
var ServerContext;

ServerContext = function (ua, request) {
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
};

ServerContext.prototype = new SIP.EventEmitter();

ServerContext.prototype.progress = function (options) {
  return replyHelper.call(this, options, 180, 100, 199, ['progress']);
};

ServerContext.prototype.accept = function (options) {
  return replyHelper.call(this, options, 200, 200, 299, ['accepted']);
};

ServerContext.prototype.reject = function (options) {
  return replyHelper.call(this, options, 480, 300, 699, ['rejected', 'failed']);
};

function replyHelper (options, defaultCode, minCode, maxCode, events) {
  options = options || {};
  var
    statusCode = options.statusCode || defaultCode,
    reasonPhrase = SIP.Utils.getReasonPhrase(statusCode, options.reasonPhrase),
    extraHeaders = (options.extraHeaders || []).slice(),
    body = options.body,
    response;

  if (statusCode < minCode || statusCode > maxCode) {
    throw new TypeError('Invalid statusCode: ' + statusCode);
  }
  response = this.request.reply(statusCode, reasonPhrase, extraHeaders, body);
  events.forEach(function (event) {
    this.emit(event, response, reasonPhrase);
  }, this);

  return this;
}

ServerContext.prototype.reply = function (options) {
  return replyHelper.call(this, options, 100, 0, 699, []);
};

ServerContext.prototype.onRequestTimeout = function () {
  this.emit('failed', null, SIP.C.causes.REQUEST_TIMEOUT);
};

ServerContext.prototype.onTransportError = function () {
  this.emit('failed', null, SIP.C.causes.CONNECTION_ERROR);
};

SIP.ServerContext = ServerContext;
};
