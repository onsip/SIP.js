module.exports = function (IncomingMessage) {

/**
 * @augments IncomingResponse
 * @class Class for incoming SIP response.
 */
function IncomingResponse (ua) {
  this.logger = ua.getLogger('sip.sipmessage');
  this.headers = {};
  this.status_code = null;
  this.reason_phrase = null;
}
IncomingResponse.prototype = new IncomingMessage();

return IncomingResponse;
};
