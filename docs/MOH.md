```ts
import { LoggerFactory } from "../../src/LoggerFactory";
import { SessionDescriptionHandler } from "../../src/Web/SessionDescriptionHandler";
import { SessionDescriptionHandlerObserver } from "../../src/Web/SessionDescriptionHandlerObserver";

function makeObserver(): SessionDescriptionHandlerObserver {
  const session = {
    emit: (s: string) => { return; }
  };
  return new SessionDescriptionHandlerObserver(session as any, undefined);
}

xdescribe("MoH", () => {
  let sdh1: SessionDescriptionHandler;
  let sdh2: SessionDescriptionHandler;
  let sdh3: SessionDescriptionHandler;
  let value = 0;

  beforeEach(() => {
    const log = new LoggerFactory();
    const logger = log.getLogger("sdh");
    const constraints = { audio: true, video: false };

    sdh1 = new SessionDescriptionHandler(logger, makeObserver(), { constraints });
    sdh2 = new SessionDescriptionHandler(logger, makeObserver(), { constraints });
    sdh3 = new SessionDescriptionHandler(logger, makeObserver(), { constraints });

    return sdh1.getDescription()
      .then((offer) => sdh2.setDescription(offer.body))
      .then(() => sdh2.getDescription())
      .then((answer) => sdh1.setDescription(answer.body));
  });
  afterEach(() => {
    sdh1.close();
    sdh2.close();
    sdh3.close();
  });

  it("foo", () => {
    return sdh1.getDescription()
      .then((offer) => sdh3.setDescription(offer.body))
      .then(() => sdh3.getDescription())
      .then((answer) => sdh1.setDescription(answer.body))
      .then(() => {
        value++;
        expect(value).toBeGreaterThan(0);
      });
  });
});
```

So, need to re-write actpass
in offer to opposite of whatever
we are before sending to MoH server
so we get an Answer that matches our
SSL state which we can give to remote
without "changing" directions.


Alice Invite Bob w SDP...

INVITE w SDP Alice -> Bob
Alice Offer actpass
Bob Answer active

On MOH ReINVITE wo SDP Alice -> Bob
Bob Offer Alice actpass
Alice Offer MoH Active
MoH Answer Passive
Alice Answer Bob passive

Oon MOH ReINVITE wo SDP Bob -> Alice
Alice Offer Bob actpass
Bob Offer MoH Passive
MoH Answer Passive
Bob Answer Alice Active

Alice Invite Bob wo SDP ...

INVITE wo SDP Alice -> Bob
Bob Offer actpass
Alice Answer active


ReINVITE wo SDP Alice -> Bob
Bob Offer actpass
Alice Answer active

ReINVITE w SDP Alice -> Bob
Alice Offer actpass
Bob Answer passive

Bob Invite Bob, Alice needs always Passive

INVITE wo SDP Bob -> Alice
Alice Offer actpass
Bob Answer active

ReINVITE wo SDP Alice -> Bob
Bob Offer actpass
Alice Answer active !!

ReINVITE w SDP Alice -> Bob
Alice Offer actpass
Bob Answer active



CASE 1

Invite w/o SDP to App

Ok with Offer from App, sent to MOH

v=0
o=- 7690094463955944787 3 IN IP4 199.7.175.76
s=-
t=0 0
a=group:BUNDLE 0
a=msid-semantic: WMS p55SZ0zMss9LLQ9wbwJs45OvrF73TvwrWz2a
m=audio 52940 RTP/AVP 111 103 104 9 0 8 106 105 13 110 112 113 126
c=IN IP4 199.7.175.76
a=candidate:505434299 1 udp 2122260223 192.168.1.6 54158 typ host generation 0 network-id 1 network-cost 10
a=candidate:3078610798 1 udp 1686052607 100.2.228.71 54158 typ srflx raddr 192.168.1.6 rport 54158 generation 0 network-id 1 network-cost 10
a=ice-ufrag:A6Lq
a=ice-pwd:f1k9eU9oTkKkEkwqpiZ2MgMp
a=ice-options:trickle
a=fingerprint:sha-256 4C:3A:82:86:F5:57:1C:98:72:FD:15:26:91:4C:64:AC:77:1B:0A:4E:58:CD:4E:AD:80:FA:C7:E7:60:AA:D3:59
a=setup:actpass
a=mid:0
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level
a=rtcp-fb:111 transport-cc
a=ssrc:2352014282 cname:TDKIEKLM8V/TzmiJ
a=ssrc:2352014282 msid:p55SZ0zMss9LLQ9wbwJs45OvrF73TvwrWz2a 0657a988-9485-47e2-a6d6-bf4839226aff
a=ssrc:2352014282 mslabel:p55SZ0zMss9LLQ9wbwJs45OvrF73TvwrWz2a
a=ssrc:2352014282 label:0657a988-9485-47e2-a6d6-bf4839226aff
a=rtpmap:111 opus/48000/2
a=rtpmap:103 ISAC/16000
a=rtpmap:104 ISAC/32000
a=rtpmap:9 G722/8000
a=rtpmap:0 PCMU/8000
a=rtpmap:8 PCMA/8000
a=rtpmap:106 CN/32000
a=rtpmap:105 CN/16000
a=rtpmap:13 CN/8000
a=rtpmap:110 telephone-event/48000
a=rtpmap:112 telephone-event/32000
a=rtpmap:113 telephone-event/16000
a=rtpmap:126 telephone-event/8000
a=fmtp:111 minptime=10;useinbandfec=1
a=sendrecv
a=rtcp:52941
a=rtcp-mux

Answer from MOH

v=0
o=F 1555623133 1555623134 IN IP4 199.7.175.154
s=F
c=IN IP4 199.7.175.76
t=0 0
a=msid-semantic: WMS 8l0GfCq5LUFOj3TwrMwZmlYWECS2MuHK
m=audio 0 UDP/TLS/RTP/SAVPF 19

Giving that back to App in ACK...

SessionDescriptionHandler.setLocalSessionDescription failed - InvalidAccessError: Failed to execute 'setRemoteDescription' on 'RTCPeerConnection': Failed to set remote answer sdp: The order of m-lines in answer doesn't match order in offer. Rejecting answer


CASE 2

Initial Offer to App

v=0
o=- 6585249872359678181 2 IN IP4 127.0.0.1
s=-
t=0 0
a=group:BUNDLE 0
a=msid-semantic: WMS w4nYV6AqBQn1GffGr0dsodt6y139JjkkUjpe
m=audio 61127 UDP/TLS/RTP/SAVPF 111 103 104 9 0 8 106 105 13 110 112 113 126
c=IN IP4 100.2.228.71
a=rtcp:9 IN IP4 0.0.0.0
a=candidate:505434299 1 udp 2122260223 192.168.1.6 61127 typ host generation 0 network-id 1 network-cost 10
a=candidate:3078610798 1 udp 1686052607 100.2.228.71 61127 typ srflx raddr 192.168.1.6 rport 61127 generation 0 network-id 1 network-cost 10
a=candidate:1352903755 1 tcp 1518280447 192.168.1.6 9 typ host tcptype active generation 0 network-id 1 network-cost 10
a=ice-ufrag:EtW9
a=ice-pwd:qvFin4Hw6EWz3SFraLXFr3qS
a=ice-options:trickle
a=fingerprint:sha-256 FB:49:98:E3:83:57:B7:00:1E:7C:29:AF:AF:0F:53:A0:42:9E:57:F6:EF:E4:AD:7F:DB:C8:17:83:5C:A2:96:94
a=setup:actpass
a=mid:0
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level
a=extmap:9 urn:ietf:params:rtp-hdrext:sdes:mid
a=extmap:13 urn:ietf:params:rtp-hdrext:sdes:rtp-stream-id
a=extmap:14 urn:ietf:params:rtp-hdrext:sdes:repaired-rtp-stream-id
a=msid:w4nYV6AqBQn1GffGr0dsodt6y139JjkkUjpe e85674eb-8635-46c9-9fe6-62a5d8321f6f
a=rtcp-mux
a=rtcp-fb:111 transport-cc
a=ssrc:2919621128 cname:Rzx4nDFmClV1wuhK
a=ssrc:2919621128 msid:w4nYV6AqBQn1GffGr0dsodt6y139JjkkUjpe e85674eb-8635-46c9-9fe6-62a5d8321f6f
a=ssrc:2919621128 mslabel:w4nYV6AqBQn1GffGr0dsodt6y139JjkkUjpe
a=ssrc:2919621128 label:e85674eb-8635-46c9-9fe6-62a5d8321f6f
a=rtpmap:111 opus/48000/2
a=rtpmap:103 ISAC/16000
a=rtpmap:104 ISAC/32000
a=rtpmap:9 G722/8000
a=rtpmap:0 PCMU/8000
a=rtpmap:8 PCMA/8000
a=rtpmap:106 CN/32000
a=rtpmap:105 CN/16000
a=rtpmap:13 CN/8000
a=rtpmap:110 telephone-event/48000
a=rtpmap:112 telephone-event/32000
a=rtpmap:113 telephone-event/16000
a=rtpmap:126 telephone-event/8000
a=fmtp:111 minptime=10;useinbandfec=1
a=sendrecv
a=candidate:aIadYxrM6ciNqqsN 1 UDP 16777215 199.7.175.76 56382 typ relay raddr 199.7.175.76 rport 56382
a=candidate:HEla46s2w8bh5N9k 1 UDP 16776959 2620:104:2032::204c 54798 typ relay raddr 2620:104:2032::204c rport 56382
a=candidate:aIadYxrM6ciNqqsN 2 UDP 16777214 199.7.175.76 56383 typ relay raddr 199.7.175.76 rport 56383
a=candidate:HEla46s2w8bh5N9k 2 UDP 16776958 2620:104:2032::204c 54799 typ relay raddr 2620:104:2032::204c rport 56383

Initial Answer from App

v=0
o=- 3114467356560198116 2 IN IP4 127.0.0.1
s=-
t=0 0
a=group:BUNDLE 0
a=msid-semantic: WMS AkI2APFueIQOVgzyUtQtHqp0k80LsJnopGek
m=audio 50716 UDP/TLS/RTP/SAVPF 111 103 104 9 0 8 106 105 13 110 112 113 126
c=IN IP4 100.2.228.71
a=rtcp:9 IN IP4 0.0.0.0
a=candidate:505434299 1 udp 2122260223 192.168.1.6 50716 typ host generation 0 network-id 1 network-cost 10
a=candidate:3078610798 1 udp 1686052607 100.2.228.71 50716 typ srflx raddr 192.168.1.6 rport 50716 generation 0 network-id 1 network-cost 10
a=ice-ufrag:aFhZ
a=ice-pwd:FzAJznDb+YlGnCF7d4vafFlk
a=ice-options:trickle
a=fingerprint:sha-256 21:53:BE:E9:CF:15:19:B0:DC:DA:38:81:F5:57:CA:A1:5A:A2:DD:80:42:BD:0A:3D:74:C1:20:8E:EF:ED:85:B5
a=setup:active
a=mid:0
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level
a=sendrecv
a=rtcp-mux
a=rtpmap:111 opus/48000/2
a=rtcp-fb:111 transport-cc
a=fmtp:111 minptime=10;useinbandfec=1
a=rtpmap:103 ISAC/16000
a=rtpmap:104 ISAC/32000
a=rtpmap:9 G722/8000
a=rtpmap:0 PCMU/8000
a=rtpmap:8 PCMA/8000
a=rtpmap:106 CN/32000
a=rtpmap:105 CN/16000
a=rtpmap:13 CN/8000
a=rtpmap:110 telephone-event/48000
a=rtpmap:112 telephone-event/32000
a=rtpmap:113 telephone-event/16000
a=rtpmap:126 telephone-event/8000
a=ssrc:1895789559 cname:g1CqTEsKU7365ApP
a=ssrc:1895789559 msid:AkI2APFueIQOVgzyUtQtHqp0k80LsJnopGek 885faa24-c3b7-4050-9a0c-43d519b5797a
a=ssrc:1895789559 mslabel:AkI2APFueIQOVgzyUtQtHqp0k80LsJnopGek
a=ssrc:1895789559 label:885faa24-c3b7-4050-9a0c-43d519b5797a

Session up....

Offer from MOH, put in INVITE to App

v=0
o=F 1555614657 1555614658 IN IP4 199.7.175.154
s=F
c=IN IP4 199.7.175.76
t=0 0
m=audio 56420 UDP/TLS/RTP/SAVPF 102 9 0 8 103 101
a=silenceSupp:off - - - -
a=rtpmap:102 opus/48000/2
a=rtpmap:9 G722/8000
a=rtpmap:0 PCMU/8000
a=rtpmap:8 PCMA/8000
a=rtpmap:103 telephone-event/48000
a=rtpmap:101 telephone-event/8000
a=fmtp:103 0-16
a=fmtp:101 0-16
a=sendrecv
a=rtcp:56421
a=rtcp-mux
a=setup:actpass
a=fingerprint:sha-1 A2:9E:6E:97:15:78:9D:01:F6:83:94:41:41:84:6D:64:CB:55:D1:6C
a=ptime:20
a=ice-ufrag:2fzveKsT
a=ice-pwd:T1vIPhfN2eBkrk7EwlezqPbiLb
a=candidate:aIadYxrM6ciNqqsN 1 UDP 2130706431 199.7.175.76 56420 typ host
a=candidate:HEla46s2w8bh5N9k 1 UDP 2130706175 2620:104:2032::204c 54828 typ host
a=candidate:aIadYxrM6ciNqqsN 2 UDP 2130706430 199.7.175.76 56421 typ host
a=candidate:HEla46s2w8bh5N9k 2 UDP 2130706174 2620:104:2032::204c 54829 typ host

App says....

SessionDescriptionHandler.setLocalSessionDescription failed - InvalidAccessError: Failed to execute 'setRemoteDescription' on 'RTCPeerConnection': Failed to set remote offer sdp: The order of m-lines in subsequent offer doesn't match order from previous offer/answer.





CallController[7a5cb121-65d5-4f61-95a6-d6aaddec7fd1].hold
log.ts:94 SessionSIP[800d3a6e-5a27-4437-8ad4-eea92f314482].setHold
log.ts:94 2019-04-19T11:27:14.991Z: INVITE dialog d7e1af68-dd38-1237-56b8-52540018c7f7eq7m6tkm98HtQcDKg6SrgBF sending INVITE request
log.ts:94 2019-04-19T11:27:14.993Z: Constructing INVITE client transaction with id z9hG4bK4079974.
log.ts:94 2019-04-19T11:27:14.994Z: sending WebSocket message:

INVITE sip:gw@gw1.new-york-1.pstn.jnctn.net;gr=gw1.new-york-1.pstn SIP/2.0
Route: <sip:199.7.173.180:443;transport=wss;r2=on;lr;ftag=HtQcDKg6SrgBF>
Route: <sip:199.7.173.180;r2=on;lr;ftag=HtQcDKg6SrgBF>
Route: <sip:199.7.173.100;lr;ftag=HtQcDKg6SrgBF;did=752.ba5ad39;ns=1;pr=3>
Route: <sip:199.7.173.101;lr;ftag=HtQcDKg6SrgBF;did=752.a0fa94a6>
Route: <sip:199.7.173.199;lr;ftag=HtQcDKg6SrgBF>
Via: SIP/2.0/TCP 1fvjm20egute.invalid;branch=z9hG4bK4079974
Max-Forwards: 70
To: <sip:17189138439@jnctn.net>;tag=HtQcDKg6SrgBF
From: "John Riordan" <sip:12129339193@jnctn.net>;tag=eq7m6tkm98
Call-ID: d7e1af68-dd38-1237-56b8-52540018c7f7
CSeq: 1 INVITE
Supported: 100rel, replaces, outbound
User-Agent: SIP.js/0.13.7 OnSIP_App/2.12.6/web
Content-Length: 0



log.ts:94 2019-04-19T11:27:15.036Z: received WebSocket text message:

SIP/2.0 100 Giving a try
Via: SIP/2.0/TCP 1fvjm20egute.invalid;received=100.2.228.71;rport=61511;branch=z9hG4bK4079974
To: <sip:17189138439@jnctn.net>;tag=HtQcDKg6SrgBF
From: "John Riordan" <sip:12129339193@jnctn.net>;tag=eq7m6tkm98
Call-ID: d7e1af68-dd38-1237-56b8-52540018c7f7
CSeq: 1 INVITE
Server: OpenSIPS (2.4.1 (x86_64/linux))
Content-Length: 0



log.ts:94 2019-04-19T11:27:15.038Z: State change to "Proceeding" on INVITE client transaction with id z9hG4bK4079974.
log.ts:94 2019-04-19T11:27:15.045Z: received WebSocket text message:

SIP/2.0 200 OK
Via: SIP/2.0/TCP 1fvjm20egute.invalid;rport=61511;received=100.2.228.71;branch=z9hG4bK4079974
Record-Route: <sip:199.7.173.199;lr;ftag=eq7m6tkm98>
Record-Route: <sip:199.7.173.101;lr;ftag=eq7m6tkm98;did=752.a0fa94a6>
Record-Route: <sip:199.7.173.100;lr;ftag=eq7m6tkm98;did=752.ba5ad39;nc=1;pr=3;pr=3>
Record-Route: <sip:199.7.173.180;r2=on;lr;ftag=eq7m6tkm98>
Record-Route: <sip:199.7.173.180:443;transport=wss;r2=on;lr;ftag=eq7m6tkm98>
From: "John Riordan" <sip:12129339193@jnctn.net>;tag=eq7m6tkm98
To: <sip:17189138439@jnctn.net>;tag=HtQcDKg6SrgBF
Call-ID: d7e1af68-dd38-1237-56b8-52540018c7f7
CSeq: 1 INVITE
Contact: <sip:gw@gw1.new-york-1.pstn.jnctn.net;gr=gw1.new-york-1.pstn>
Accept: application/sdp
Content-Type: application/sdp
Content-Length: 314
Allow: INVITE,ACK,BYE,CANCEL,OPTIONS,UPDATE,INFO,REFER
Supported: replaces

v=0
o=F 1555655350 1555655351 IN IP4 199.7.173.72
s=F
c=IN IP4 199.7.173.72
t=0 0
m=audio 53770 RTP/AVP 0 8 101 3
a=silenceSupp:off - - - -
a=rtpmap:0 PCMU/8000
a=rtpmap:8 PCMA/8000
a=rtpmap:101 telephone-event/8000
a=rtpmap:3 GSM/8000
a=fmtp:101 0-16
a=sendrecv
a=rtcp:53771
a=rtcp-mux
a=ptime:20


log.ts:94 2019-04-19T11:27:15.047Z: State change to "Accepted" on INVITE client transaction with id z9hG4bK4079974.
log.ts:94 2019-04-19T11:27:15.049Z: Constructing INVITE client transaction with id z9hG4bK6170074.
log.ts:94 2019-04-19T11:27:15.049Z: sending WebSocket message:

INVITE sip:moh@junctionnetworks.com SIP/2.0
Via: SIP/2.0/TCP 1fvjm20egute.invalid;branch=z9hG4bK6170074
Max-Forwards: 70
To: <sip:moh@junctionnetworks.com>
From: "John Riordan" <sip:john@junctionnetworks.com>;tag=cs6eg91696
Call-ID: p4n6r13so9l58pddqt55
CSeq: 1269 INVITE
Contact: <sip:ef5d9qt7@1fvjm20egute.invalid;transport=ws>
Supported: 100rel, replaces, outbound
User-Agent: SIP.js/0.13.7 OnSIP_App/2.12.6/web
Content-Type: application/sdp
Content-Length: 314

v=0
o=F 1555655350 1555655351 IN IP4 199.7.173.72
s=F
c=IN IP4 199.7.173.72
t=0 0
m=audio 53770 RTP/AVP 0 8 101 3
a=silenceSupp:off - - - -
a=rtpmap:0 PCMU/8000
a=rtpmap:8 PCMA/8000
a=rtpmap:101 telephone-event/8000
a=rtpmap:3 GSM/8000
a=fmtp:101 0-16
a=sendrecv
a=rtcp:53771
a=rtcp-mux
a=ptime:20


log.ts:94 2019-04-19T11:27:15.072Z: received WebSocket text message:

SIP/2.0 100 Giving a try
Via: SIP/2.0/TCP 1fvjm20egute.invalid;received=100.2.228.71;rport=61511;branch=z9hG4bK6170074
To: <sip:moh@junctionnetworks.com>
From: "John Riordan" <sip:john@junctionnetworks.com>;tag=cs6eg91696
Call-ID: p4n6r13so9l58pddqt55
CSeq: 1269 INVITE
Server: OpenSIPS (2.4.1 (x86_64/linux))
Content-Length: 0



log.ts:94 2019-04-19T11:27:15.073Z: State change to "Proceeding" on INVITE client transaction with id z9hG4bK6170074.
log.ts:94 2019-04-19T11:27:15.079Z: received WebSocket text message:

SIP/2.0 407 Proxy Authentication Required
Via: SIP/2.0/TCP 1fvjm20egute.invalid;rport=61511;received=100.2.228.71;branch=z9hG4bK6170074
To: <sip:moh@junctionnetworks.com>;tag=9d079adf30be9ee6222f98d845a8175e.91fe
From: "John Riordan" <sip:john@junctionnetworks.com>;tag=cs6eg91696
Call-ID: p4n6r13so9l58pddqt55
CSeq: 1269 INVITE
Proxy-Authenticate: Digest realm="jnctn.net", nonce="5cb9b0b100014fd129e1e54230c41e1bdb5be2c5586574c3", qop="auth"
Server: OpenSIPS (1.11.8-notls (x86_64/linux))
Content-Length: 0



log.ts:94 2019-04-19T11:27:15.081Z: State change to "Completed" on INVITE client transaction with id z9hG4bK6170074.
log.ts:94 2019-04-19T11:27:15.082Z: sending WebSocket message:

ACK sip:moh@junctionnetworks.com SIP/2.0
Via: SIP/2.0/TCP 1fvjm20egute.invalid;branch=z9hG4bK6170074
To: <sip:moh@junctionnetworks.com>;tag=9d079adf30be9ee6222f98d845a8175e.91fe
From: "John Riordan" <sip:john@junctionnetworks.com>;tag=cs6eg91696
Call-ID: p4n6r13so9l58pddqt55
CSeq: 1269 ACK
Max-Forwards: 70
Content-Length: 0



log.ts:94 2019-04-19T11:27:15.083Z: Constructing INVITE client transaction with id z9hG4bK7402323.
log.ts:94 2019-04-19T11:27:15.084Z: sending WebSocket message:

INVITE sip:moh@junctionnetworks.com SIP/2.0
Via: SIP/2.0/TCP 1fvjm20egute.invalid;branch=z9hG4bK7402323
Max-Forwards: 70
To: <sip:moh@junctionnetworks.com>
From: "John Riordan" <sip:john@junctionnetworks.com>;tag=cs6eg91696
Call-ID: p4n6r13so9l58pddqt55
CSeq: 1270 INVITE
Proxy-Authorization: Digest algorithm=MD5, username="junction_john", realm="jnctn.net", nonce="5cb9b0b100014fd129e1e54230c41e1bdb5be2c5586574c3", uri="sip:moh@junctionnetworks.com", response="fb82e3be21700ab9a827892c04716fab", qop=auth, cnonce="rpq991ngr2hp", nc=00000001
Contact: <sip:ef5d9qt7@1fvjm20egute.invalid;transport=ws>
Supported: 100rel, replaces, outbound
User-Agent: SIP.js/0.13.7 OnSIP_App/2.12.6/web
Content-Type: application/sdp
Content-Length: 314

v=0
o=F 1555655350 1555655351 IN IP4 199.7.173.72
s=F
c=IN IP4 199.7.173.72
t=0 0
m=audio 53770 RTP/AVP 0 8 101 3
a=silenceSupp:off - - - -
a=rtpmap:0 PCMU/8000
a=rtpmap:8 PCMA/8000
a=rtpmap:101 telephone-event/8000
a=rtpmap:3 GSM/8000
a=fmtp:101 0-16
a=sendrecv
a=rtcp:53771
a=rtcp-mux
a=ptime:20


log.ts:94 2019-04-19T11:27:15.090Z: Timer D expired for INVITE client transaction z9hG4bK6170074.
log.ts:94 2019-04-19T11:27:15.091Z: Destroyed INVITE client transaction with id z9hG4bK6170074.
log.ts:94 2019-04-19T11:27:15.092Z: State change to "Terminated" on INVITE client transaction with id z9hG4bK6170074.
log.ts:94 2019-04-19T11:27:15.099Z: received WebSocket text message:

SIP/2.0 100 Giving a try
Via: SIP/2.0/TCP 1fvjm20egute.invalid;received=100.2.228.71;rport=61511;branch=z9hG4bK7402323
To: <sip:moh@junctionnetworks.com>
From: "John Riordan" <sip:john@junctionnetworks.com>;tag=cs6eg91696
Call-ID: p4n6r13so9l58pddqt55
CSeq: 1270 INVITE
Server: OpenSIPS (2.4.1 (x86_64/linux))
Content-Length: 0



log.ts:94 2019-04-19T11:27:15.100Z: State change to "Proceeding" on INVITE client transaction with id z9hG4bK7402323.
log.ts:94 2019-04-19T11:27:15.155Z: received WebSocket text message:

SIP/2.0 200 OK
Via: SIP/2.0/TCP 1fvjm20egute.invalid;rport=61511;received=100.2.228.71;branch=z9hG4bK7402323
Record-Route: <sip:199.7.173.130;lr;ftag=cs6eg91696;did=7a6.f8d08727>
Record-Route: <sip:199.7.173.100;lr;ftag=cs6eg91696;nc=1;did=7a6.3a3a8d21;pr=3>
Record-Route: <sip:199.7.173.180;r2=on;lr;ftag=cs6eg91696>
Record-Route: <sip:199.7.173.180:443;transport=wss;r2=on;lr;ftag=cs6eg91696>
From: "John Riordan" <sip:john@junctionnetworks.com>;tag=cs6eg91696
To: <sip:moh@junctionnetworks.com>;tag=Um6t801B44QBa
Call-ID: p4n6r13so9l58pddqt55
CSeq: 1270 INVITE
Contact: <sip:dtlsgw0@app0-1.new-york-1.app.jnctn.net>
Accept: application/sdp
Allow: INVITE, ACK, BYE, CANCEL, OPTIONS, MESSAGE, INFO, UPDATE, REGISTER, REFER, PRACK, NOTIFY
Supported: precondition, 100rel, path, replaces
Content-Type: application/sdp
Content-Length: 750

v=0
o=F 1555649199 1555649200 IN IP4 199.7.173.155
s=F
c=IN IP4 199.7.173.72
t=0 0
m=audio 53904 UDP/TLS/RTP/SAVPF 0 101
a=silenceSupp:off - - - -
a=rtpmap:0 PCMU/8000
a=rtpmap:101 telephone-event/8000
a=fmtp:101 0-16
a=sendrecv
a=rtcp:53905
a=rtcp-mux
a=setup:actpass
a=fingerprint:sha-1 80:83:4E:98:41:C0:31:A6:21:1F:F5:66:A9:E0:D6:EC:5C:03:94:D9
a=ptime:20
a=ice-ufrag:uv7w5Zt6
a=ice-pwd:OVMUXYvzr82o97ztL6NsGm7nr9
a=candidate:cuTqtaglS3SOQlSh 1 UDP 2130706431 199.7.173.72 53904 typ host
a=candidate:M8O7nmReSRUC6zJi 1 UDP 2130706175 2620:104:2031::2048 55528 typ host
a=candidate:cuTqtaglS3SOQlSh 2 UDP 2130706430 199.7.173.72 53905 typ host
a=candidate:M8O7nmReSRUC6zJi 2 UDP 2130706174 2620:104:2031::2048 55529 typ host


log.ts:94 2019-04-19T11:27:15.157Z: State change to "Accepted" on INVITE client transaction with id z9hG4bK7402323.
log.ts:94 2019-04-19T11:27:15.158Z: INVITE dialog p4n6r13so9l58pddqt55cs6eg91696Um6t801B44QBa constructed
log.ts:94 2019-04-19T11:27:15.158Z: INVITE dialog p4n6r13so9l58pddqt55cs6eg91696Um6t801B44QBa sending ACK request
log.ts:94 2019-04-19T11:27:15.160Z: sending WebSocket message:

ACK sip:dtlsgw0@app0-1.new-york-1.app.jnctn.net SIP/2.0
Route: <sip:199.7.173.180:443;transport=wss;r2=on;lr;ftag=cs6eg91696>
Route: <sip:199.7.173.180;r2=on;lr;ftag=cs6eg91696>
Route: <sip:199.7.173.100;lr;ftag=cs6eg91696;nc=1;did=7a6.3a3a8d21;pr=3>
Route: <sip:199.7.173.130;lr;ftag=cs6eg91696;did=7a6.f8d08727>
Via: SIP/2.0/TCP 1fvjm20egute.invalid;branch=z9hG4bK7676983
Max-Forwards: 70
To: <sip:moh@junctionnetworks.com>;tag=Um6t801B44QBa
From: "John Riordan" <sip:john@junctionnetworks.com>;tag=cs6eg91696
Call-ID: p4n6r13so9l58pddqt55
CSeq: 1270 ACK
Supported: 100rel, replaces, outbound
User-Agent: SIP.js/0.13.7 OnSIP_App/2.12.6/web
Content-Length: 0



log.ts:94 2019-04-19T11:27:15.160Z: INVITE dialog d7e1af68-dd38-1237-56b8-52540018c7f7eq7m6tkm98HtQcDKg6SrgBF sending ACK request
log.ts:94 2019-04-19T11:27:15.162Z: sending WebSocket message:

ACK sip:gw@gw1.new-york-1.pstn.jnctn.net;gr=gw1.new-york-1.pstn SIP/2.0
Route: <sip:199.7.173.180:443;transport=wss;r2=on;lr;ftag=HtQcDKg6SrgBF>
Route: <sip:199.7.173.180;r2=on;lr;ftag=HtQcDKg6SrgBF>
Route: <sip:199.7.173.100;lr;ftag=HtQcDKg6SrgBF;did=752.ba5ad39;ns=1;pr=3>
Route: <sip:199.7.173.101;lr;ftag=HtQcDKg6SrgBF;did=752.a0fa94a6>
Route: <sip:199.7.173.199;lr;ftag=HtQcDKg6SrgBF>
Via: SIP/2.0/TCP 1fvjm20egute.invalid;branch=z9hG4bK3995584
Max-Forwards: 70
To: <sip:17189138439@jnctn.net>;tag=HtQcDKg6SrgBF
From: "John Riordan" <sip:12129339193@jnctn.net>;tag=eq7m6tkm98
Call-ID: d7e1af68-dd38-1237-56b8-52540018c7f7
CSeq: 1 ACK
Supported: 100rel, replaces, outbound
User-Agent: SIP.js/0.13.7 OnSIP_App/2.12.6/web
Content-Type: application/sdp
Content-Length: 750

v=0
o=F 1555649199 1555649200 IN IP4 199.7.173.155
s=F
c=IN IP4 199.7.173.72
t=0 0
m=audio 53904 UDP/TLS/RTP/SAVPF 0 101
a=silenceSupp:off - - - -
a=rtpmap:0 PCMU/8000
a=rtpmap:101 telephone-event/8000
a=fmtp:101 0-16
a=sendrecv
a=rtcp:53905
a=rtcp-mux
a=setup:actpass
a=fingerprint:sha-1 80:83:4E:98:41:C0:31:A6:21:1F:F5:66:A9:E0:D6:EC:5C:03:94:D9
a=ptime:20
a=ice-ufrag:uv7w5Zt6
a=ice-pwd:OVMUXYvzr82o97ztL6NsGm7nr9
a=candidate:cuTqtaglS3SOQlSh 1 UDP 2130706431 199.7.173.72 53904 typ host
a=candidate:M8O7nmReSRUC6zJi 1 UDP 2130706175 2620:104:2031::2048 55528 typ host
a=candidate:cuTqtaglS3SOQlSh 2 UDP 2130706430 199.7.173.72 53905 typ host
a=candidate:M8O7nmReSRUC6zJi 2 UDP 2130706174 2620:104:2031::2048 55529 typ host

















- constructor()
2019-05-25T20:17:30.183Z sip.invitecontext.sessionDescriptionHandler.log SessionDescriptionHandlerOptions: {"constraints":{},"peerConnectionOptions":{"iceCheckingTimeout":5000,"rtcConfiguration":{"iceServers":[{"urls":"stun:stun.l.google.com:19302"}]}}}
- initPeerConnection()
2019-05-25T20:17:30.183Z sip.invitecontext.sessionDescriptionHandler.log initPeerConnection
2019-05-25T20:17:30.184Z sip.invitecontext.sessionDescriptionHandler.log New peer connection created

...

!!!
2019-05-25T20:17:30.192Z sip.invitecontext.sessionDescriptionHandler.log track added

??? setDescription() ???
...

- getDescription()
- acquire()
2019-05-25T20:17:30.200Z sip.invitecontext.sessionDescriptionHandler.log acquiring local media

2019-05-25T20:17:30.210Z sip.invitecontext.sessionDescriptionHandler.log acquired local media streams

createOfferOrAnswer()
2019-05-25T20:17:30.214Z sip.invitecontext.sessionDescriptionHandler.log createAnswer
2019-05-25T20:17:30.218Z sip.invitecontext.sessionDescriptionHandler.log Setting local sdp.
2019-05-25T20:17:30.218Z sip.invitecontext.sessionDescriptionHandler.log sdp is v=0
pc.setLocalDescription()




