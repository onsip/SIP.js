(function(SIP) {

var MessageServerContext, MessageClientContext;

MessageServerContext = function(ua, request) {

  SIP.Utils.augment(this, SIP.ServerContext, [ua, request]);

  this.logger = ua.getLogger('sip.messageservercontext');

  this.body = request.body;
  this.content_type = request.getHeader('Content-Type') || 'text/plain';
};

SIP.MessageServerContext = MessageServerContext;


MessageClientContext = function(ua, target, body, contentType, options) {
  if (body === undefined) {
    throw new TypeError('Not enough arguments');
  }

  options = options || {};
  options.contentType = contentType || 'text/plain';
  options.body = body;

  SIP.Utils.augment(this, SIP.ClientContext, [ua, 'MESSAGE', target, options]);

  this.logger = ua.getLogger('sip.messageclientcontext');
};

MessageClientContext.prototype = {
  message: function() {
    return this.send();
  }
};

SIP.MessageClientContext = MessageClientContext;
}(SIP));