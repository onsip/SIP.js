describe('Utils.normalizeTarget', function() {
  it('fails to normalize "alice" on no domain', function () {
    expect(SIP.Utils.normalizeTarget('alice')).toBeUndefined();
  })

  describe('when the domain is "sip.js.net"', function () {
    var domain = 'sip.js.net';

    function test_ok (given_data, expected) {
      it('normalizes "' + given_data + '" to "' + expected + '"', function () {
        var uri = SIP.Utils.normalizeTarget(given_data, domain);
        expect(uri instanceof(SIP.URI)).toBeTruthy();
        expect(uri.toString()).toEqual(expected);
      });
    }

    function test_error (given_data) {
      it('fails to normalize ' + JSON.stringify(given_data), function () {
        var uri = SIP.Utils.normalizeTarget(given_data, domain);
        expect(uri).toBeUndefined();
      });
    }

    test_ok('%61lice', 'sip:alice@sip.js.net');
    test_ok('ALICE', 'sip:ALICE@sip.js.net');
    test_ok('alice@DOMAIN.com', 'sip:alice@domain.com');
    test_ok('iñaki', 'sip:i%C3%B1aki@sip.js.net');
    test_ok('€€€', 'sip:%E2%82%AC%E2%82%AC%E2%82%AC@sip.js.net');
    test_ok('iñaki@aliax.net', 'sip:i%C3%B1aki@aliax.net');
    test_ok('SIP:iñaki@aliax.net:7070', 'sip:i%C3%B1aki@aliax.net:7070');
    test_ok('SIPs:iñaki@aliax.net:7070', 'sip:i%C3%B1aki@aliax.net:7070');
    test_ok('ibc@gmail.com@aliax.net', 'sip:ibc%40gmail.com@aliax.net');
    test_ok('alice-1:passwd', 'sip:alice-1:passwd@sip.js.net');
    test_ok('SIP:alice-2:passwd', 'sip:alice-2:passwd@sip.js.net');
    test_ok('sips:alice-2:passwd', 'sip:alice-2:passwd@sip.js.net');
    test_ok('alice-3:passwd@domain.COM', 'sip:alice-3:passwd@domain.com');
    test_ok('SIP:alice-4:passwd@domain.COM', 'sip:alice-4:passwd@domain.com');
    test_ok('sip:+1234@aliax.net', 'sip:+1234@aliax.net');
    test_ok('+999', 'sip:+999@sip.js.net');
    test_ok('*999', 'sip:*999@sip.js.net');
    test_ok('#999/?:1234', 'sip:%23999/?:1234@sip.js.net');
    test_ok('tel:+12345678', 'sip:+12345678@sip.js.net');
    test_ok('tel:(+34)-944-43-89', 'sip:+349444389@sip.js.net');
    test_ok('+123.456.78-9', 'sip:+123456789@sip.js.net');
    test_ok('+ALICE-123.456.78-9', 'sip:+ALICE-123.456.78-9@sip.js.net');

    test_error(null);
    test_error(undefined);
    test_error(NaN);
    test_error(false);
    test_error(true);
    test_error('');
    test_error('ibc@iñaki.com');
    test_error('ibc@aliax.net;;;;;');
  });
});
