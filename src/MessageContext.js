(function(SIP) {

var MessageServerContext, MessageClientContext;

MessageServerContext = function(ua, request) {

  SIP.Utils.augment(this, SIP.ServerContext, [ua, request]);

  this.logger = ua.getLogger('sip.messageserver');
};

SIP.MessageServerContext = MessageServerContext;


MessageClientContext = function(ua, target, body, contentType) {
  if (body === undefined) {
    throw new TypeError('Not enough arguments');
  }

  SIP.Utils.augment(this, SIP.ClientContext, [ua, 'MESSAGE', target]);

  this.logger = ua.getLogger('sip.messageclient');
  this.body = body;
  this.contentType = contentType || 'text/plain';
};

MessageClientContext.prototype = {
  message: function(options) {
    var extraHeaders;

    // Get call options
    options = options || {};
    extraHeaders = options.extraHeaders || [];

    extraHeaders.push('Content-Type: '+ this.contentType);
    options.extraHeaders = extraHeaders;
    options.body = this.body;
    this.ua.applicants[this] = this;

    return this.send(options);
  }
};

SIP.MessageClientContext = MessageClientContext;
}(SIP));