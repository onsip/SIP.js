/**
 * @fileoverview Hacks - This file contains all of the things we
 * wish we didn't have to do, just for interop.  It is similar to
 * Utils, which provides actually useful and relevant functions for
 * a SIP library. Methods in this file are grouped by vendor, so
 * as to most easily track when particular hacks may not be necessary anymore.
 */

(function (SIP) {

var Hacks;

Hacks = {

  Firefox: {
    /* Condition to detect if hacks are applicable */
    isFirefox: function () {
      return window.mozRTCPeerConnection !== undefined;
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
    }
  }
};


SIP.Hacks = Hacks;
}(SIP));