/**
 * @name SIP
 * @namespace
 */
"use strict";

module.exports = function(SIP) {
var Modifiers;

function stripPayload(sdp, payload) {
  var i;
  var media_descs = [];
  var current_media_desc;

  var lines = sdp.split(/\r\n/);

  for (i = 0; i < lines.length;) {
    var line = lines[i];
    if (/^m=(?:audio|video)/.test(line)) {
      current_media_desc = {
        index: i,
        stripped: []
      };
      media_descs.push(current_media_desc);
    } else if (current_media_desc) {
      var rtpmap = /^a=rtpmap:(\d+) ([^/]+)\//.exec(line);
      if (rtpmap && payload === rtpmap[2]) {
        lines.splice(i, 1);
        current_media_desc.stripped.push(rtpmap[1]);
        continue; // Don't increment 'i'
      }
    }

    i++;
  }

  for (i = 0; i < media_descs.length; i++) {
    var mline = lines[media_descs[i].index].split(' ');

    // Ignore the first 3 parameters of the mline. The codec information is after that
    for (var j = 3; j < mline.length;) {
      if (media_descs[i].stripped.indexOf(mline[j]) !== -1) {
        mline.splice(j, 1);
        continue;
      }
      j++;
    }

    lines[media_descs[i].index] = mline.join(' ');
  }

  return lines.join('\r\n');
}

function stripMediaDescription(sdp, description) {
  const descriptionRegExp = new RegExp("m=" + description + ".*$", "gm");
  const groupRegExp = new RegExp("^a=group:.*$", "gm");

  if (descriptionRegExp.test(sdp)) {
    let midLineToRemove;
    sdp = sdp.split(/^m=/gm).filter((section) => {
      if (section.substr(0, description.length) === description) {
        midLineToRemove = section.match(/^a=mid:.*$/gm);
        if (midLineToRemove) {
          midLineToRemove = midLineToRemove[0].match(/:.+$/g)[0].substr(1);
        }
        return false;
      }
      return true;
    }).join('m=');
    let groupLine = sdp.match(groupRegExp);
    if (groupLine && groupLine.length === 1) {
      groupLine = groupLine[0];
      const groupRegExpReplace = new RegExp("\ *" + midLineToRemove + "[^\ ]*", "g");
      groupLine = groupLine.replace(groupRegExpReplace, "");
      sdp = sdp.split(groupRegExp).join(groupLine);
    }
  }
  return sdp;
}

Modifiers = {
  stripTcpCandidates: function(description) {
    description.sdp = description.sdp.replace(/^a=candidate:\d+ \d+ tcp .*?\r\n/img, "");
    return SIP.Utils.Promise.resolve(description);
  },

  stripTelephoneEvent: function(description) {
    description.sdp = stripPayload(description.sdp, 'telephone-event');
    return SIP.Utils.Promise.resolve(description);
  },

  cleanJitsiSdpImageattr: function(description) {
    description.sdp = description.sdp.replace(/^(a=imageattr:.*?)(x|y)=\[0-/gm, "$1$2=[1:");
    return SIP.Utils.Promise.resolve(description);
  },

  stripG722: function(description) {
    description.sdp = stripPayload(description.sdp, 'G722');
    return SIP.Utils.Promise.resolve(description);
  },

  stripRtpPayload: function(payload) {
    return function(description) {
      description.sdp = stripPayload(description.sdp, payload);
      return SIP.Utils.Promise.resolve(description);
    };
  },

  stripVideo: function(description) {
    description.sdp = stripMediaDescription(description.sdp, "video");
    return SIP.Utils.Promise.resolve(description);
  },

  addMidLines: function(description) {
    let sdp = description.sdp;
    if (sdp.search(/^a=mid.*$/gm) === -1) {
      const mlines = sdp.match(/^m=.*$/gm);
      sdp = sdp.split(/^m=.*$/gm);
      mlines.forEach((elem, idx) => {
        mlines[idx] = elem + '\na=mid:' + idx;
      });
      sdp.forEach((elem, idx) => {
        if (mlines[idx]) {
          sdp[idx] = elem + mlines[idx];
        }
      });
      sdp = sdp.join('');
      description.sdp = sdp;
    }
    return SIP.Utils.Promise.resolve(description);
  }
};

return Modifiers;
};
