/**
 * @fileoverview Hacks - This file contains all of the things we
 * wish we didn't have to do, just for interop.  It is similar to
 * Utils, which provides actually useful and relevant functions for
 * a SIP library. Methods in this file are grouped by vendor, so
 * as to most easily track when particular hacks may not be necessary anymore.
 */

var Hacks = module.exports = {
  Firefox: {
    /* Condition to detect if hacks are applicable */
    isFirefox: function () {
      return typeof mozRTCPeerConnection !== 'undefined';
    },

    cannotHandleRelayCandidates: function (message) {
      if (this.isFirefox() && message.body) {
        message.body = message.body.replace(/relay/g, 'host generation 0');
      }
    },

    cannotHandleExtraWhitespace: function (message) {
      if (this.isFirefox() && message.body) {
        message.body = message.body.replace(/ \r\n/g, "\r\n");
      }
    },

    hasMissingCLineInSDP: function (sdp) {
      /*
       * This is a Firefox hack to insert valid sdp when getDescription is
       * called with the constraint offerToReceiveVideo = false.
       * We search for either a c-line at the top of the sdp above all
       * m-lines. If that does not exist then we search for a c-line
       * beneath each m-line. If it is missing a c-line, we insert
       * a fake c-line with the ip address 0.0.0.0. This is then valid
       * sdp and no media will be sent for that m-line.
       *
       * Valid SDP is:
       * m=
       * i=
       * c=
       */
      var insertAt, mlines;
      if (sdp.indexOf('c=') > sdp.indexOf('m=')) {

        // Find all m= lines
        mlines = sdp.match(/m=.*\r\n.*/g);
        for (var i=0; i<mlines.length; i++) {

          // If it has an i= line, check if the next line is the c= line
          if (mlines[i].toString().search(/i=.*/) >= 0) {
            insertAt = sdp.indexOf(mlines[i].toString())+mlines[i].toString().length;
            if (sdp.substr(insertAt,2)!=='c=') {
              sdp = sdp.substr(0,insertAt) + '\r\nc=IN IP 4 0.0.0.0' + sdp.substr(insertAt);
            }

          // else add the C line if it's missing
          } else if (mlines[i].toString().search(/c=.*/) < 0) {
            insertAt = sdp.indexOf(mlines[i].toString().match(/.*/))+mlines[i].toString().match(/.*/).toString().length;
            sdp = sdp.substr(0,insertAt) + '\r\nc=IN IP4 0.0.0.0' + sdp.substr(insertAt);
          }
        }
      }
      return sdp;
    }
  },

  Chrome: {
    needsExplicitlyInactiveSDP: function (sdp) {
      var sub, index;
      if (Hacks.Firefox.isFirefox()) { // Fix this in Firefox before sending
        index = sdp.indexOf('m=video 0');
        if (index !== -1) {
          sub = sdp.substr(index);
          sub = sub.replace(/\r\nc=IN IP4.*\r\n$/,
                            '\r\nc=IN IP4 0.0.0.0\r\na=inactive\r\n');
          return sdp.substr(0, index) + sub;
        }
      }
      return sdp;
    },

    getsConfusedAboutGUM: function (session) {
      if (session.mediaHandler) {
        session.mediaHandler.close();
      }
    }
  }
};
