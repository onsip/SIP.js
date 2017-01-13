"use strict";
/**
 * @fileoverview Hacks - This file contains all of the things we
 * wish we didn't have to do, just for interop.  It is similar to
 * Utils, which provides actually useful and relevant functions for
 * a SIP library. Methods in this file are grouped by vendor, so
 * as to most easily track when particular hacks may not be necessary anymore.
 */

var transform = require('sdp-transform');


module.exports = function (SIP) {

//keep to quiet jshint, and remain consistent with other files
SIP = SIP;




var Hacks = {
  AllBrowsers: {
    maskDtls: function (sdp) {
      if (sdp) {
        sdp = sdp.replace(/ UDP\/TLS\/RTP\/SAVP/gmi, " RTP/SAVP");
      }
      return sdp;
    },
    unmaskDtls: function (sdp) {
      /**
       * Chrome does not handle DTLS correctly (Canaray does, but not production)
       * keeping Chrome as SDES until DTLS is fixed (comment out 'is_opera' condition)
       *
       * UPDATE: May 21, 2014
       * Chrome 35 now properly defaults to DTLS.  Only Opera remains using SDES
       *
       * UPDATE: 2014-09-24
       * Opera now supports DTLS by default as well.
       *
       **/
      return sdp.replace(/ RTP\/SAVP/gmi, " UDP/TLS/RTP/SAVP");
    },

    filterCodecs: function (sdp,type,codecs) {
        /**
        filterCodecs will allow you to limit the codec options in the SDP and prioritize
        **/
        var res = transform.parse(sdp);
        if (typeof codecs !== 'undefined' && codecs !== null)
        {
          if (typeof codecs ==="boolean" || codecs ==="false"){
            codecs ="";
          }
          codecs = codecs.split(" ");

          for (var i = res.media.length -1 ; i >= 0 ; i--) {
            if (res.media[i].type !== type)
            {
              continue;
            }
            else if(codecs.length === 0 || codecs[0]==="")
            {
              res.media.splice(i, 1);
              continue;
            }
            if (typeof res.media[i].payloads === "number")
            {
              res.media[i].payloads = res.media[i].payloads.toString();
            }
            var payloadlist = res.media[i].payloads.split(" ");
            for (var j = payloadlist.length -1 ; j >= 0 ; j--) {
              if (codecs.indexOf(payloadlist[j]) === -1)
              {
                payloadlist.splice(j, 1);
              }
            }
            var neworder = [];
            for (j=0 ; j< codecs.length; j++) {
              if (payloadlist.indexOf(codecs[j]) > -1)
              {
                neworder.push(codecs[j]);
              }
            }
            res.media[i].payloads = neworder.join(" ");
            if (Array.isArray(res.media[i].rtp))
            {
              for (j = res.media[i].rtp.length -1 ; j >= 0 ; j--) {
                if (codecs.indexOf(res.media[i].rtp[j].payload.toString()) === -1)
                {
                  res.media[i].rtp.splice(j, 1);
                }
              }
            }
            if (Array.isArray(res.media[i].rtcpFb))
            {
              for (j = res.media[i].rtcpFb.length -1 ; j >= 0 ; j--) {
                if (codecs.indexOf(res.media[i].rtcpFb[j].payload.toString()) === -1)
                {
                  res.media[i].rtcpFb.splice(j, 1);
                }
              }
            }
            if (Array.isArray(res.media[i].fmtp))
            {
              for (j = res.media[i].fmtp.length -1 ; j >= 0 ; j--) {
                if (codecs.indexOf(res.media[i].fmtp[j].payload.toString()) === -1)
                {
                  res.media[i].fmtp.splice(j, 1);
                }
              }
            }

          }
        }
        sdp = transform.write(res).split('\r\n');

        /* Hack to force a=group:BUNDLE audio before a=msid-semantic: WMS srKdjU81RbAWmXRR6L1n57RZT7Thl96tMYmL */
        var bundle=0;
        var semantic=0;
        for (var x=0 ; x< sdp.length; x++) {
            if (sdp[x].startsWith("a=msid-semantic"))
            {
              semantic= x;
            }
            if (sdp[x].startsWith("a=group:BUNDLE"))
            {
              bundle= x;
            }
        }
        if (bundle-1===semantic)
        {
            var b = sdp[bundle];
            sdp[bundle] = sdp[semantic];
            sdp[semantic] = b;
        }
        /* end hack */

        sdp = sdp.join('\r\n');





        return sdp;

    }
  },
  Firefox: {
    /* Condition to detect if hacks are applicable */
    isFirefox: function () {
      return typeof mozRTCPeerConnection !== 'undefined';
    },

    cannotHandleExtraWhitespace: function (sdp) {
      if (this.isFirefox() && sdp) {
        sdp = sdp.replace(/ \r\n/g, "\r\n");
      }
      return sdp;
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
              sdp = sdp.substr(0,insertAt) + '\r\nc=IN IP4 0.0.0.0' + sdp.substr(insertAt);
            }

          // else add the C line if it's missing
          } else if (mlines[i].toString().search(/c=.*/) < 0) {
            insertAt = sdp.indexOf(mlines[i].toString().match(/.*/))+mlines[i].toString().match(/.*/).toString().length;
            sdp = sdp.substr(0,insertAt) + '\r\nc=IN IP4 0.0.0.0' + sdp.substr(insertAt);
          }
        }
      }
      return sdp;
    },
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
return Hacks;
};
