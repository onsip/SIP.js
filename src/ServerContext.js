"use strict";
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
  var composedOptions = Object.create(options || Object.prototype);
  composedOptions.statusCode || (composedOptions.statusCode = 180);
  composedOptions.minCode = 100;
  composedOptions.maxCode = 199;
  composedOptions.events = ['progress'];
  return this.reply(composedOptions);
};

ServerContext.prototype.accept = function (options) {
  var composedOptions = Object.create(options || Object.prototype);
  composedOptions.statusCode || (composedOptions.statusCode = 200);
  composedOptions.minCode = 200;
  composedOptions.maxCode = 299;
  composedOptions.events = ['accepted'];
  return this.reply(composedOptions);
};

ServerContext.prototype.reject = function (options) {
  var composedOptions = Object.create(options || Object.prototype);
  composedOptions.statusCode || (composedOptions.statusCode = 480);
  composedOptions.minCode = 300;
  composedOptions.maxCode = 699;
  composedOptions.events = ['rejected', 'failed'];
  return this.reply(composedOptions);
};

ServerContext.prototype.reply = function (options) {
  /* jshint validthis:true */
  options = options || {};
  var
    statusCode = options.statusCode || 100,
    minCode = options.minCode || 100,
    maxCode = options.maxCode || 699,
    reasonPhrase = SIP.Utils.getReasonPhrase(statusCode, options.reasonPhrase),
    extraHeaders = options.extraHeaders || [],
    body = options.body,
    events = options.events || [],
    response;

  if (statusCode < minCode || statusCode > maxCode) {
    throw new TypeError('Invalid statusCode: ' + statusCode);
  }
  response = this.request.reply(statusCode, reasonPhrase, extraHeaders, body);
  events.forEach(function (event) {
    this.emit(event, response, reasonPhrase);
  }, this);

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
