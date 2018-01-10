/** Some valid SDP strings to pretend that browsers generated for SIP.js */
Messages = {};
Messages.Invite = {
  nosdp: 'INVITE sip:alice@example.com;transport=ws SIP/2.0\r\n' +
    'Via: SIP/2.0/WSS u3legsua5tov.invalid;branch=z9hG4bK4798355\r\n' +
    'Max-Forwards: 65\r\n' +
    'To: <sip:alice@example.com>\r\n' +
    'From: <sip:bob@example.com>;tag=lug30cg783\r\n' +
    'Call-ID: 2e0tofg49n9qvhjlrr63\r\n' +
    'CSeq: 7773 INVITE\r\n' +
    'Contact: <sip:h9po1ojc@u3legsua5tov.invalid;transport=ws;ob>\r\n' +
    'Allow: ACK,CANCEL,BYE,OPTIONS,INVITE,MESSAGE\r\n' +
    'Content-Type: application/sdp\r\n' +
    'Supported: outbound\r\n' +
    'User-Agent: SIP.js 0.5.0-devel\r\n' +
    'Content-Length: 0\r\n' +
    '\r\n',

  normal: 'INVITE sip:alice@example.com;transport=ws SIP/2.0\r\n' +
    'Via: SIP/2.0/WSS u3legsua5tov.invalid;branch=z9hG4bK4798355\r\n' +
    'Max-Forwards: 65\r\n' +
    'To: <sip:alice@example.com>\r\n' +
    'From: <sip:bob@example.com>;tag=lug30cg783\r\n' +
    'Call-ID: 2e0tofg49n9qvhjlrr63\r\n' +
    'CSeq: 7773 INVITE\r\n' +
    'Contact: <sip:h9po1ojc@u3legsua5tov.invalid;transport=ws;ob>\r\n' +
    'Allow: ACK,CANCEL,BYE,OPTIONS,INVITE,MESSAGE\r\n' +
    'Content-Type: application/sdp\r\n' +
    'Supported: outbound\r\n' +
    'User-Agent: SIP.js 0.5.0-devel\r\n' +
    'Content-Length: 1440\r\n' +
    '\r\n' +
    'v=0\r\n' +
    'o=- 5677966312555193038 2 IN IP4 127.0.0.1\r\n' +
    's=-\r\n' +
    't=0 0\r\n' +
    'a=group:BUNDLE audio\r\n' +
    'a=msid-semantic: WMS iAR3IFaSOkZ5FIEfztgAwWF9xUvbq02PCVKC\r\n' +
    'm=audio 53026 RTP/SAVPF 111 103 104 0 8 106 105 13 126\r\n' +
    'c=IN IP4 199.7.173.162\r\n' +
    'a=rtcp:53027 IN IP4 199.7.173.162\r\n' +
    'a=candidate:2608808550 1 udp 2113937151 192.168.1.33 53974 typ host generation 0\r\n' +
    'a=candidate:2608808550 2 udp 2113937151 192.168.1.33 53974 typ host generation 0\r\n' +
    'a=ice-ufrag:yTSZ59T6XRf4f7+q\r\n' +
    'a=ice-pwd:Qzco0YfB/GOFF9n3y1GAJyLK\r\n' +
    'a=ice-options:google-ice\r\n' +
    'a=fingerprint:sha-256 C8:36:3F:5B:EC:DD:D7:DB:BD:08:4A:18:68:B2:2A:57:19:29:C6:DF:00:52:3D:5D:33:A8:D6:50:48:22:B2:7F\r\n' +
    'a=setup:actpass\r\n' +
    'a=mid:audio\r\n' +
    'a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r\n' +
    'a=sendrecv\r\n' +
    'a=rtcp-mux\r\n' +
    'a=crypto:0 AES_CM_128_HMAC_SHA1_32 inline:E0WyVK7CYWDzeiO6TFpPP6gJSC/XndKHRb8ciA9y\r\n' +
    'a=crypto:1 AES_CM_128_HMAC_SHA1_80 inline:e71T3NtgK8PtmYvtNrbgi2fJL6e9xKhPPsXK7G3E\r\n' +
    'a=rtpmap:111 opus/48000/2\r\n' +
    'a=fmtp:111 minptime=10\r\n' +
    'a=rtpmap:103 ISAC/16000\r\n' +
    'a=rtpmap:104 ISAC/32000\r\n' +
    'a=rtpmap:0 PCMU/8000\r\n' +
    'a=rtpmap:8 PCMA/8000\r\n' +
    'a=rtpmap:106 CN/32000\r\n' +
    'a=rtpmap:105 CN/16000\r\n' +
    'a=rtpmap:13 CN/8000\r\n' +
    'a=rtpmap:126 telephone-event/8000\r\n' +
    'a=maxptime:60\r\n' +
    'a=ssrc:3254389050 cname:7x2CRZjJC+fBSDDl\r\n' +
    'a=ssrc:3254389050 msid:iAR3IFaSOkZ5FIEfztgAwWF9xUvbq02PCVKC aa5e18ed-eb5f-4475-8383-6d6b5abae41d\r\n' +
    'a=ssrc:3254389050 mslabel:iAR3IFaSOkZ5FIEfztgAwWF9xUvbq02PCVKC\r\n' +
    'a=ssrc:3254389050 label:aa5e18ed-eb5f-4475-8383-6d6b5abae41d\r\n' +
    '\r\n',

  rel100sup: 'INVITE sip:alice@example.com;transport=ws SIP/2.0\r\n' +
    'Via: SIP/2.0/WSS u3legsua5tov.invalid;branch=z9hG4bK4798355\r\n' +
    'Max-Forwards: 65\r\n' +
    'To: <sip:alice@example.com>\r\n' +
    'From: <sip:bob@example.com>;tag=lug30cg783\r\n' +
    'Call-ID: 2e0tofg49n9qvhjlrr63\r\n' +
    'CSeq: 7773 INVITE\r\n' +
    'Contact: <sip:h9po1ojc@u3legsua5tov.invalid;transport=ws;ob>\r\n' +
    'Allow: ACK,CANCEL,BYE,OPTIONS,INVITE,MESSAGE\r\n' +
    'Supported: 100rel,outbound\r\n' +
    'Content-Type: application/sdp\r\n' +
    'User-Agent: SIP.js 0.5.0-devel\r\n' +
    'Content-Length: 1440\r\n' +
    '\r\n' +
    'v=0\r\n' +
    'o=- 5677966312555193038 2 IN IP4 127.0.0.1\r\n' +
    's=-\r\n' +
    't=0 0\r\n' +
    'a=group:BUNDLE audio\r\n' +
    'a=msid-semantic: WMS iAR3IFaSOkZ5FIEfztgAwWF9xUvbq02PCVKC\r\n' +
    'm=audio 53026 RTP/SAVPF 111 103 104 0 8 106 105 13 126\r\n' +
    'c=IN IP4 199.7.173.162\r\n' +
    'a=rtcp:53027 IN IP4 199.7.173.162\r\n' +
    'a=candidate:2608808550 1 udp 2113937151 192.168.1.33 53974 typ host generation 0\r\n' +
    'a=candidate:2608808550 2 udp 2113937151 192.168.1.33 53974 typ host generation 0\r\n' +
    'a=ice-ufrag:yTSZ59T6XRf4f7+q\r\n' +
    'a=ice-pwd:Qzco0YfB/GOFF9n3y1GAJyLK\r\n' +
    'a=ice-options:google-ice\r\n' +
    'a=fingerprint:sha-256 C8:36:3F:5B:EC:DD:D7:DB:BD:08:4A:18:68:B2:2A:57:19:29:C6:DF:00:52:3D:5D:33:A8:D6:50:48:22:B2:7F\r\n' +
    'a=setup:actpass\r\n' +
    'a=mid:audio\r\n' +
    'a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r\n' +
    'a=sendrecv\r\n' +
    'a=rtcp-mux\r\n' +
    'a=crypto:0 AES_CM_128_HMAC_SHA1_32 inline:E0WyVK7CYWDzeiO6TFpPP6gJSC/XndKHRb8ciA9y\r\n' +
    'a=crypto:1 AES_CM_128_HMAC_SHA1_80 inline:e71T3NtgK8PtmYvtNrbgi2fJL6e9xKhPPsXK7G3E\r\n' +
    'a=rtpmap:111 opus/48000/2\r\n' +
    'a=fmtp:111 minptime=10\r\n' +
    'a=rtpmap:103 ISAC/16000\r\n' +
    'a=rtpmap:104 ISAC/32000\r\n' +
    'a=rtpmap:0 PCMU/8000\r\n' +
    'a=rtpmap:8 PCMA/8000\r\n' +
    'a=rtpmap:106 CN/32000\r\n' +
    'a=rtpmap:105 CN/16000\r\n' +
    'a=rtpmap:13 CN/8000\r\n' +
    'a=rtpmap:126 telephone-event/8000\r\n' +
    'a=maxptime:60\r\n' +
    'a=ssrc:3254389050 cname:7x2CRZjJC+fBSDDl\r\n' +
    'a=ssrc:3254389050 msid:iAR3IFaSOkZ5FIEfztgAwWF9xUvbq02PCVKC aa5e18ed-eb5f-4475-8383-6d6b5abae41d\r\n' +
    'a=ssrc:3254389050 mslabel:iAR3IFaSOkZ5FIEfztgAwWF9xUvbq02PCVKC\r\n' +
    'a=ssrc:3254389050 label:aa5e18ed-eb5f-4475-8383-6d6b5abae41d\r\n' +
    '\r\n',

  rel100req: 'INVITE sip:alice@example.com;transport=ws SIP/2.0\r\n' +
    'Via: SIP/2.0/WSS u3legsua5tov.invalid;branch=z9hG4bK4798355\r\n' +
    'Max-Forwards: 65\r\n' +
    'To: <sip:alice@example.com>\r\n' +
    'From: <sip:bob@example.com>;tag=lug30cg783\r\n' +
    'Call-ID: 2e0tofg49n9qvhjlrr63\r\n' +
    'CSeq: 7773 INVITE\r\n' +
    'Contact: <sip:h9po1ojc@u3legsua5tov.invalid;transport=ws;ob>\r\n' +
    'Allow: ACK,CANCEL,BYE,OPTIONS,INVITE,MESSAGE\r\n' +
    'Content-Type: application/sdp\r\n' +
    'Require: 100rel\r\n' +
    'Supported: outbound\r\n' +
    'User-Agent: SIP.js 0.5.0-devel\r\n' +
    'Content-Length: 1440\r\n' +
    '\r\n' +
    'v=0\r\n' +
    'o=- 5677966312555193038 2 IN IP4 127.0.0.1\r\n' +
    's=-\r\n' +
    't=0 0\r\n' +
    'a=group:BUNDLE audio\r\n' +
    'a=msid-semantic: WMS iAR3IFaSOkZ5FIEfztgAwWF9xUvbq02PCVKC\r\n' +
    'm=audio 53026 RTP/SAVPF 111 103 104 0 8 106 105 13 126\r\n' +
    'c=IN IP4 199.7.173.162\r\n' +
    'a=rtcp:53027 IN IP4 199.7.173.162\r\n' +
    'a=candidate:2608808550 1 udp 2113937151 192.168.1.33 53974 typ host generation 0\r\n' +
    'a=candidate:2608808550 2 udp 2113937151 192.168.1.33 53974 typ host generation 0\r\n' +
    'a=ice-ufrag:yTSZ59T6XRf4f7+q\r\n' +
    'a=ice-pwd:Qzco0YfB/GOFF9n3y1GAJyLK\r\n' +
    'a=ice-options:google-ice\r\n' +
    'a=fingerprint:sha-256 C8:36:3F:5B:EC:DD:D7:DB:BD:08:4A:18:68:B2:2A:57:19:29:C6:DF:00:52:3D:5D:33:A8:D6:50:48:22:B2:7F\r\n' +
    'a=setup:actpass\r\n' +
    'a=mid:audio\r\n' +
    'a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r\n' +
    'a=sendrecv\r\n' +
    'a=rtcp-mux\r\n' +
    'a=crypto:0 AES_CM_128_HMAC_SHA1_32 inline:E0WyVK7CYWDzeiO6TFpPP6gJSC/XndKHRb8ciA9y\r\n' +
    'a=crypto:1 AES_CM_128_HMAC_SHA1_80 inline:e71T3NtgK8PtmYvtNrbgi2fJL6e9xKhPPsXK7G3E\r\n' +
    'a=rtpmap:111 opus/48000/2\r\n' +
    'a=fmtp:111 minptime=10\r\n' +
    'a=rtpmap:103 ISAC/16000\r\n' +
    'a=rtpmap:104 ISAC/32000\r\n' +
    'a=rtpmap:0 PCMU/8000\r\n' +
    'a=rtpmap:8 PCMA/8000\r\n' +
    'a=rtpmap:106 CN/32000\r\n' +
    'a=rtpmap:105 CN/16000\r\n' +
    'a=rtpmap:13 CN/8000\r\n' +
    'a=rtpmap:126 telephone-event/8000\r\n' +
    'a=maxptime:60\r\n' +
    'a=ssrc:3254389050 cname:7x2CRZjJC+fBSDDl\r\n' +
    'a=ssrc:3254389050 msid:iAR3IFaSOkZ5FIEfztgAwWF9xUvbq02PCVKC aa5e18ed-eb5f-4475-8383-6d6b5abae41d\r\n' +
    'a=ssrc:3254389050 mslabel:iAR3IFaSOkZ5FIEfztgAwWF9xUvbq02PCVKC\r\n' +
    'a=ssrc:3254389050 label:aa5e18ed-eb5f-4475-8383-6d6b5abae41d\r\n' +
    '\r\n',

  replaces: 'INVITE sip:alice@example.com;transport=ws SIP/2.0\r\n' +
    'Replaces: or1ek18v4gti27r1vt91;to-tag=dt0sj4e5ek;from-tag=qviijql90r\r\n' +
    'Via: SIP/2.0/WSS u3legsua5tov.invalid;branch=z9hG4bK4798355\r\n' +
    'Max-Forwards: 65\r\n' +
    'To: <sip:alice@example.com>\r\n' +
    'From: <sip:bob@example.com>;tag=lug30cg783\r\n' +
    'Call-ID: 2e0tofg49n9qvhjlrr63\r\n' +
    'CSeq: 7773 INVITE\r\n' +
    'Contact: <sip:h9po1ojc@u3legsua5tov.invalid;transport=ws;ob>\r\n' +
    'Allow: ACK,CANCEL,BYE,OPTIONS,INVITE,MESSAGE\r\n' +
    'Content-Type: application/sdp\r\n' +
    'Supported: outbound\r\n' +
    'User-Agent: SIP.js 0.5.0-devel\r\n' +
    'Content-Length: 0\r\n' +
    '\r\n',

  rps: {
    rock: 'INVITE sip:alice@example.com SIP/2.0\r\n' +
      'Via: SIP/2.0/WSS u3legsua5tov.invalid;branch=z9hG4bK4798355\r\n' +
      'Max-Forwards: 65\r\n' +
      'To: <sip:alice@example.com>\r\n' +
      'From: <sip:bob@example.com>;tag=lug30cg783\r\n' +
      'Call-ID: 2e0tofg49n9qvhjlrr63\r\n' +
      'CSeq: 7773 INVITE\r\n' +
      'Contact: <sip:h9po1ojc@u3legsua5tov.invalid;transport=ws;ob>\r\n' +
      'Allow: ACK,CANCEL,BYE,OPTIONS,INVITE,MESSAGE\r\n' +
      'Content-Type: application/sdp\r\n' +
      'Supported: outbound\r\n' +
      'User-Agent: SIP.js 0.5.0-devel\r\n' +
      'Content-Length: 4\r\n' +
      '\r\n' +
      'rock\r\n' +
      '\r\n',

    cancel: 'CANCEL sip:alice@example.com SIP/2.0\r\n' +
      'Via: SIP/2.0/WSS nn6bh156cpod.invalid;branch=z9hG4bK4798355\r\n' +
      'To: <sip:alice@example.com>\r\n' +
      'From: <sip:bob@example.com>;tag=lug30cg783\r\n' +
      'Call-ID: 2e0tofg49n9qvhjlrr63\r\n' +
      'CSeq: 7773 CANCEL\r\n' +
      'Content-Length: 0\r\n' +
      '\r\n',

    ack: function (tag) {
      return 'ACK sip:alice@example.com SIP/2.0\r\n' +
        'Via: SIP/2.0/WSS nn6bh156cpod.invalid;branch=z9hG4bK4798355\r\n' +
        'Max-Forwards: 66\r\n' +
        'To: <sip:alice@example.com>;tag=' + tag + '\r\n' +
        'From: <sip:bob@example.com>;tag=lug30cg783\r\n' +
        'Call-ID: 2e0tofg49n9qvhjlrr63\r\n' +
        'CSeq: 7773 ACK\r\n' +
        'Contact: <sip:h9po1ojc@u3legsua5tov.invalid;transport=ws;ob>\r\n' +
        'Allow: INVITE, ACK, BYE, CANCEL, OPTIONS, MESSAGE, INFO, UPDATE, REGISTER, REFER, PRACK, NOTIFY\r\n' +
        'Content-Length: 0\r\n' +
        '\r\n';
    },


    bye: function (tag) {
      return 'BYE sip:alice@example.com SIP/2.0\r\n' +
        'Via: SIP/2.0/WSS nn6bh156cpod.invalid;branch=z9hG4bK4798355\r\n' +
        'Max-Forwards: 66\r\n' +
        'To: <sip:alice@example.com>;tag=' + tag + '\r\n' +
        'From: <sip:bob@example.com>;tag=lug30cg783\r\n' +
        'Call-ID: 2e0tofg49n9qvhjlrr63\r\n' +
        'CSeq: 7774 BYE\r\n' +
        'Contact: <sip:h9po1ojc@u3legsua5tov.invalid;transport=ws;ob>\r\n' +
        'Allow: INVITE, ACK, BYE, CANCEL, OPTIONS, MESSAGE, INFO, UPDATE, REGISTER, REFER, PRACK, NOTIFY\r\n' +
        'Content-Length: 0\r\n' +
        '\r\n';
    },
  }
};

SessionDescription = {};

SessionDescription.withTcpCandidatesAndTelephoneEvents = {
  type: 'offer',
  sdp: '\r\n' +
    'v=0\r\n' +
    'o=- 5677966312555193038 2 IN IP4 127.0.0.1\r\n' +
    's=-\r\n' +
    't=0 0\r\n' +
    'a=group:BUNDLE audio\r\n' +
    'a=msid-semantic: WMS iAR3IFaSOkZ5FIEfztgAwWF9xUvbq02PCVKC\r\n' +
    'm=audio 53026 RTP/SAVPF 111 103 104 0 8 106 105 13 126\r\n' +
    'c=IN IP4 199.7.173.162\r\n' +
    'a=rtcp:53027 IN IP4 199.7.173.162\r\n' +
    'a=candidate:2608808550 1 udp 2113937151 192.168.1.33 53974 typ host generation 0\r\n' +
    'a=candidate:2608808550 2 tcp 2113937151 192.168.1.33 53974 typ host generation 0\r\n' +
    'a=candidate:478089246 1 udp 1685987071 127.0.0.1 58170 typ srflx raddr 127.0.0.1 rport 58170 generation 0 network-id 1\r\n' +
    'a=candidate:1099745028 1 udp 25042687 127.0.0.1 56353 typ relay raddr 127.0.0.1 rport 50998 generation 0 network-id 1\r\n' +
    'a=ice-ufrag:yTSZ59T6XRf4f7+q\r\n' +
    'a=ice-pwd:Qzco0YfB/GOFF9n3y1GAJyLK\r\n' +
    'a=ice-options:google-ice\r\n' +
    'a=fingerprint:sha-256 C8:36:3F:5B:EC:DD:D7:DB:BD:08:4A:18:68:B2:2A:57:19:29:C6:DF:00:52:3D:5D:33:A8:D6:50:48:22:B2:7F\r\n' +
    'a=setup:actpass\r\n' +
    'a=mid:audio\r\n' +
    'a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r\n' +
    'a=sendrecv\r\n' +
    'a=rtcp-mux\r\n' +
    'a=crypto:0 AES_CM_128_HMAC_SHA1_32 inline:E0WyVK7CYWDzeiO6TFpPP6gJSC/XndKHRb8ciA9y\r\n' +
    'a=crypto:1 AES_CM_128_HMAC_SHA1_80 inline:e71T3NtgK8PtmYvtNrbgi2fJL6e9xKhPPsXK7G3E\r\n' +
    'a=rtpmap:111 opus/48000/2\r\n' +
    'a=fmtp:111 minptime=10\r\n' +
    'a=rtpmap:103 ISAC/16000\r\n' +
    'a=rtpmap:104 ISAC/32000\r\n' +
    'a=rtpmap:0 PCMU/8000\r\n' +
    'a=rtpmap:8 PCMA/8000\r\n' +
    'a=rtpmap:106 CN/32000\r\n' +
    'a=rtpmap:105 CN/16000\r\n' +
    'a=rtpmap:13 CN/8000\r\n' +
    'a=rtpmap:126 telephone-event/8000\r\n' +
    'a=maxptime:60\r\n' +
    'a=ssrc:3254389050 cname:7x2CRZjJC+fBSDDl\r\n' +
    'a=ssrc:3254389050 msid:iAR3IFaSOkZ5FIEfztgAwWF9xUvbq02PCVKC aa5e18ed-eb5f-4475-8383-6d6b5abae41d\r\n' +
    'a=ssrc:3254389050 mslabel:iAR3IFaSOkZ5FIEfztgAwWF9xUvbq02PCVKC\r\n' +
    'a=ssrc:3254389050 label:aa5e18ed-eb5f-4475-8383-6d6b5abae41d\r\n' +
    '\r\n'
};