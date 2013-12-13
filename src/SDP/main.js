/**
 * @fileoverview SDP Parser
 *
 * https://github.com/clux/sdp-transform
 * 
 */

(function(SIP) {

  var parser = require('sdp-transform');

  SIP.Parser.parseSDP = parser.parse;
  SIP.Parser.writeSDP = parser.write;
  SIP.Parser.parseFmtpConfig = parser.parseFmtpConfig;
  SIP.Parser.parsePayloads = parser.parsePayloads;
  SIP.Parser.parseRemoteCandidates = parser.parseRemoteCandidates;

}(SIP));