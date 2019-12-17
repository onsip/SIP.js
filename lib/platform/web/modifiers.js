"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var stripPayload = function (sdp, payload) {
    var mediaDescs = [];
    var lines = sdp.split(/\r\n/);
    var currentMediaDesc;
    for (var i = 0; i < lines.length;) {
        var line = lines[i];
        if (/^m=(?:audio|video)/.test(line)) {
            currentMediaDesc = {
                index: i,
                stripped: []
            };
            mediaDescs.push(currentMediaDesc);
        }
        else if (currentMediaDesc) {
            var rtpmap = /^a=rtpmap:(\d+) ([^/]+)\//.exec(line);
            if (rtpmap && payload === rtpmap[2]) {
                lines.splice(i, 1);
                currentMediaDesc.stripped.push(rtpmap[1]);
                continue; // Don't increment 'i'
            }
        }
        i++;
    }
    for (var _i = 0, mediaDescs_1 = mediaDescs; _i < mediaDescs_1.length; _i++) {
        var mediaDesc = mediaDescs_1[_i];
        var mline = lines[mediaDesc.index].split(" ");
        // Ignore the first 3 parameters of the mline. The codec information is after that
        for (var j = 3; j < mline.length;) {
            if (mediaDesc.stripped.indexOf(mline[j]) !== -1) {
                mline.splice(j, 1);
                continue;
            }
            j++;
        }
        lines[mediaDesc.index] = mline.join(" ");
    }
    return lines.join("\r\n");
};
var stripMediaDescription = function (sdp, description) {
    var descriptionRegExp = new RegExp("m=" + description + ".*$", "gm");
    var groupRegExp = new RegExp("^a=group:.*$", "gm");
    if (descriptionRegExp.test(sdp)) {
        var midLineToRemove_1;
        sdp = sdp.split(/^m=/gm).filter(function (section) {
            if (section.substr(0, description.length) === description) {
                midLineToRemove_1 = section.match(/^a=mid:.*$/gm);
                if (midLineToRemove_1) {
                    var step = midLineToRemove_1[0].match(/:.+$/g);
                    if (step) {
                        midLineToRemove_1 = step[0].substr(1);
                    }
                }
                return false;
            }
            return true;
        }).join("m=");
        var groupLine = sdp.match(groupRegExp);
        if (groupLine && groupLine.length === 1) {
            var groupLinePortion = groupLine[0];
            var groupRegExpReplace = new RegExp("\ *" + midLineToRemove_1 + "[^\ ]*", "g");
            groupLinePortion = groupLinePortion.replace(groupRegExpReplace, "");
            sdp = sdp.split(groupRegExp).join(groupLinePortion);
        }
    }
    return sdp;
};
/**
 * Modifier.
 * @public
 */
function stripTcpCandidates(description) {
    description.sdp = (description.sdp || "").replace(/^a=candidate:\d+ \d+ tcp .*?\r\n/img, "");
    return Promise.resolve(description);
}
exports.stripTcpCandidates = stripTcpCandidates;
/**
 * Modifier.
 * @public
 */
function stripTelephoneEvent(description) {
    description.sdp = stripPayload(description.sdp || "", "telephone-event");
    return Promise.resolve(description);
}
exports.stripTelephoneEvent = stripTelephoneEvent;
/**
 * Modifier.
 * @public
 */
function cleanJitsiSdpImageattr(description) {
    description.sdp = (description.sdp || "").replace(/^(a=imageattr:.*?)(x|y)=\[0-/gm, "$1$2=[1:");
    return Promise.resolve(description);
}
exports.cleanJitsiSdpImageattr = cleanJitsiSdpImageattr;
/**
 * Modifier.
 * @public
 */
function stripG722(description) {
    description.sdp = stripPayload(description.sdp || "", "G722");
    return Promise.resolve(description);
}
exports.stripG722 = stripG722;
/**
 * Modifier.
 * @public
 */
function stripRtpPayload(payload) {
    return function (description) {
        description.sdp = stripPayload(description.sdp || "", payload);
        return Promise.resolve(description);
    };
}
exports.stripRtpPayload = stripRtpPayload;
/**
 * Modifier.
 * @public
 */
function stripVideo(description) {
    description.sdp = stripMediaDescription(description.sdp || "", "video");
    return Promise.resolve(description);
}
exports.stripVideo = stripVideo;
/**
 * Modifier.
 * @public
 */
function addMidLines(description) {
    var sdp = description.sdp || "";
    if (sdp.search(/^a=mid.*$/gm) === -1) {
        var mlines_1 = sdp.match(/^m=.*$/gm);
        var sdpArray_1 = sdp.split(/^m=.*$/gm);
        if (mlines_1) {
            mlines_1.forEach(function (elem, idx) {
                mlines_1[idx] = elem + "\na=mid:" + idx;
            });
        }
        sdpArray_1.forEach(function (elem, idx) {
            if (mlines_1 && mlines_1[idx]) {
                sdpArray_1[idx] = elem + mlines_1[idx];
            }
        });
        sdp = sdpArray_1.join("");
        description.sdp = sdp;
    }
    return Promise.resolve(description);
}
exports.addMidLines = addMidLines;
