var Modifiers = require('../../../src/WebRTC/Modifiers')(SIP);

describe('WebRTC/Modifiers', function () {
  var sdpWrapper;

  beforeEach(function () {
    sdpWrapper = SessionDescription.withTcpCandidatesAndTelephoneEvents;
  });

  it('should strip tcp candidates from sdp', function (done) {
    Modifiers.stripTcpCandidates(sdpWrapper).then(function (description) {
      expect(description.type).toBe('offer');
      expect(description.sdp).toContain('a=candidate:2608808550 1 udp 2113937151 192.168.1.33 53974 typ host generation 0');
      expect(description.sdp).not.toContain('a=candidate:2608808550 2 tcp 2113937151 192.168.1.33 53974 typ host generation 0');
      expect(description.sdp).toContain('a=candidate:478089246 1 udp 1685987071 127.0.0.1 58170 typ srflx raddr 127.0.0.1 rport 58170 generation 0 network-id 1');
      expect(description.sdp).toContain('a=candidate:1099745028 1 udp 25042687 127.0.0.1 56353 typ relay raddr 127.0.0.1 rport 50998 generation 0 network-id 1');

      done();
    });
  });

  it('should strip telephone events from sdp', function (done) {
    Modifiers.stripTelephoneEvent(sdpWrapper).then(function (description) {
      expect(description.type).toBe('offer');
      expect(description.sdp).not.toContain('a=rtpmap:126 telephone-event/8000');

      done();
    });
  });
})