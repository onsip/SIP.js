/**
 * @name SIP
 * @namespace
 */
"use strict";

module.exports = function(SIP) {
var Modifiers;

Modifiers = {
  stripTcpCandidates: function(description) {
    description.sdp = description.sdp.replace(/^a=candidate:\d+ \d+ tcp .*?\r\n/img, "");
    return SIP.Utils.Promise.resolve(description);
  },

  stripTelephoneEvent: function(description) {
    description.sdp = description.sdp.replace(/^a=rtpmap:\d+ telephone-event\/\d+\r\n/img, "");
    return SIP.Utils.Promise.resolve(description);
  },

  cleanJitsiSdpImageattr: function(description) {
    description.sdp = description.sdp.replace(/^(a=imageattr:.*?)(x|y)=\[0-/gm, "$1$2=[1:");
    return SIP.Utils.Promise.resolve(description);
  },

  stripG722: function(description) {
    var parts = description.sdp.match(/^m=audio.*$/gm);
    if (parts) {
      var mline = parts[0];
      mline = mline.split(" ");
      // Ignore the first 3 parameters of the mline. The codec information is after that
      for (var i = 3; i < mline.length; i=i+1) {
        if (mline[i] === "9") {
          mline.splice(i, 1);
          var numberOfCodecs = parseInt(mline[1], 10);
          numberOfCodecs = numberOfCodecs - 1;
          mline[1] = numberOfCodecs.toString();
        }
      }
      mline = mline.join(" ");
      description.sdp = description.sdp.replace(/^m=audio.*$/gm, mline);
      description.sdp = description.sdp.replace(/^a=rtpmap:.*G722\/8000\r\n?/gm, "").replace();
    }
    return SIP.Utils.Promise.resolve(description);
  }
};

return Modifiers;
};
