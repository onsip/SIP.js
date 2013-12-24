describe('UA', function () {
  function itHas (objThunk, property, expected, toString) {
    var testName = 'has ' + property + ': ' + JSON.stringify(expected);
    it(testName, function () {
      var value = objThunk()[property];
      if (toString) {
        value = value.toString();
      }
      expect(value).toEqual(expected);
    });
  }

  describe('wrong configuration', function () {
    it('throws ConfigurationError', function () {
      function makeUa () {
        return new SIP.UA({'lalala': 'lololo'});
      }
      expect(makeUa).toThrow(new SIP.Exceptions.ConfigurationError());
    });
  });

  describe('no WS connection', function () {
    var ua;
    var TestSIP = {};
    TestSIP.Helpers = {
      DEFAULT_SIP_CONFIGURATION_AFTER_START: {
        password: null,
        register_expires: 600,
        register_min_expires: 120,
        register: false,
        connection_recovery_min_interval: 2,
        connection_recovery_max_interval: 30,
        use_preloaded_route: true,
        no_answer_timeout: 60000,
        stun_servers: ['stun:stun.l.google.com:19302'],
        trace_sip: false,
        hack_via_tcp: false,
        hack_ip_in_contact: false,
        uri: 'sip:fakeUA@sip.js.net',
        registrar_server: 'sip:registrar.sip.js.net:6060;transport=tcp',
        ws_servers: [{'ws_uri':'ws://localhost:12345','sip_uri':'<sip:localhost:12345;transport=ws;lr>','weight':0,'status':0,'scheme':'WS'}],
        display_name: 'Fake UA ð→€ł !!!',
        authorization_user: 'fakeUA'
      },

      FAKE_UA_CONFIGURATION: {
        uri: 'f%61keUA@sip.js.net',
        ws_servers:  'ws://localhost:12345',
        display_name: 'Fake UA ð→€ł !!!',
        register: false,
        use_preloaded_route: true,
        registrar_server: 'registrar.sip.js.NET:6060;TRansport=TCP'
      },

      createFakeUA: function() {
        return new SIP.UA(this.FAKE_UA_CONFIGURATION);
      }
    };

    beforeEach(function () {
      ua = TestSIP.Helpers.createFakeUA();
      expect(ua instanceof(SIP.UA)).toBeTruthy();
      ua.start();
    });

    describe('contact', function () {
      function itsToStringEquals (argArray, expectedThunk) {
        var argString = argArray == [] ? '' : JSON.stringify(argArray[0]);
        it('contact.toString(' + argString + ')', function () {
          expect(ua.contact.toString.apply(ua.contact, argArray)).toEqual(expectedThunk());
        });
      }

      itsToStringEquals([], function(){
        return '<sip:' + ua.contact.uri.user + '@' + ua.configuration.via_host + ';transport=ws>';
      });

      itsToStringEquals([{outbound: false, anonymous: false, foo: true}], function(){
        return '<sip:' + ua.contact.uri.user + '@' + ua.configuration.via_host + ';transport=ws>';
      });

      itsToStringEquals([{outbound: true}], function(){
        return '<sip:' + ua.contact.uri.user + '@' + ua.configuration.via_host + ';transport=ws;ob>';
      });

      itsToStringEquals([{anonymous: true}], function(){
        return '<sip:anonymous@anonymous.invalid;transport=ws>';
      });

      itsToStringEquals([{anonymous: true, outbound: true}], function(){
        return '<sip:anonymous@anonymous.invalid;transport=ws;ob>';
      });
    });

    describe('default parameters', function () {
      var itsConfigHas = itHas.bind(null, function () {return ua.configuration;});

      for (parameter in TestSIP.Helpers.DEFAULT_SIP_CONFIGURATION_AFTER_START) {
        var toString = ['uri', 'registrar_server'].indexOf(parameter) >= 0;
        itsConfigHas(parameter, TestSIP.Helpers.DEFAULT_SIP_CONFIGURATION_AFTER_START[parameter], toString);
      }
    });

    it('fails to send a valid message', function () {
      ua.message('test', 'FAIL WITH CONNECTION_ERROR PLEASE', {
        eventHandlers: {
          sending: function(e) {
            expect(false).toEqual(true);
          },
          failed: function(e) {
            expect(e.data.cause).toEqual(SIP.C.causes.CONNECTION_ERROR);
          }
        }
      });
    });

    it('fails to send a message to an invalid target', function () {
      function invalidMessage () {
        ua.message('sip:ibc@iñaki.ðđß', 'FAIL WITH INVALID_TARGET PLEASE');
      }
      expect(invalidMessage).toThrow(new SIP.Exceptions.TypeError());
    });
  });
});
