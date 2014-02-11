test('UA wrong configuration', function() {
  throws(
    function() {
      new SIP.UA({'lalala': 'lololo'});
    },
    SIP.Exceptions.ConfigurationError
  );
});


test('UA no WS connection', function() {
  var ua = TestSIP.Helpers.createFakeUA();
  ok(ua instanceof(SIP.UA));

  ua.start();

  strictEqual(ua.contact.toString(), '<sip:' + ua.contact.uri.user + '@' + ua.configuration.viaHost + ';transport=ws>');
  strictEqual(ua.contact.toString({outbound: false, anonymous: false, foo: true}), '<sip:' + ua.contact.uri.user + '@' + ua.configuration.viaHost + ';transport=ws>');
  strictEqual(ua.contact.toString({outbound: true}), '<sip:' + ua.contact.uri.user + '@' + ua.configuration.viaHost + ';transport=ws;ob>');
  strictEqual(ua.contact.toString({anonymous: true}), '<sip:anonymous@anonymous.invalid;transport=ws>');
  strictEqual(ua.contact.toString({anonymous: true, outbound: true}), '<sip:anonymous@anonymous.invalid;transport=ws;ob>');

  for (parameter in TestSIP.Helpers.DEFAULT_SIP_CONFIGURATION_AFTER_START) {
    switch(parameter) {
      case 'uri':
      case 'registrarServer':
        deepEqual(ua.configuration[parameter].toString(), TestSIP.Helpers.DEFAULT_SIP_CONFIGURATION_AFTER_START[parameter], 'testing parameter ' + parameter);
        break;
      default:
        deepEqual(ua.configuration[parameter], TestSIP.Helpers.DEFAULT_SIP_CONFIGURATION_AFTER_START[parameter], 'testing parameter ' + parameter);
    }
  }

  ua.message('test', 'FAIL WITH CONNECTION_ERROR PLEASE', {
    eventHandlers: {
      sending: function(e) {
        var ruri = e.data.request.ruri;
        ok(ruri instanceof SIP.URI);
        strictEqual(e.data.request.ruri.toString(), 'sip:test@' + ua.configuration.uri.host);
      },
      failed: function(e) {
        strictEqual(e.data.cause, SIP.C.causes.CONNECTION_ERROR);
      }
    }
  });

  throws(
    function() {
      ua.sendMessage('sip:ibc@iñaki.ðđß', 'FAIL WITH INVALID_TARGET PLEASE');
    },
    SIP.Exceptions.TypeError
  );
});

