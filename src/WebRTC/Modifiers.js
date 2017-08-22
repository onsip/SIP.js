/**
 * @name SIP
 * @namespace
 */
"use strict";

module.exports = function(SIP) {
var Modifiers;

Modifiers = {
  stripTcpCandidates: function(sdp) {
    return SIP.Utils.Promise.resolve(sdp.replace(/^a=candidate:\d+ \d+ tcp .*?\r\n/img, ""));
  },

  stripTelephoneEvent: function(sdp) {
    return SIP.Utils.Promise.resolve(sdp.replace(/^a=rtpmap:\d+ telephone-event\/d+/img, ""));
  },

  cleanJitsiSdpImageattr: function(sdp) {
    return SIP.Utils.Promise.resolve(sdp.replace(/^(a=imageattr:.*?)(x|y)=\[0-/gm, "$1$2=[1:"));
  }
};

return Modifiers;
};
