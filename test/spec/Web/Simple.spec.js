describe('Web/Simple', function() {
  beforeEach(function() {
    spyOn(SIP, 'UA').and.callFake(function(configuration) {
      this.configuration = configuration;
      this.getLogger = function() {
        return console;
      };
      this.on = function() {};
    });
  });

  it('creates instance', function() {
    var simple = new SIP.Web.Simple({
      media: {
        remote: {
          audio: {}
        }
      },
      ua: {
        uri: 'bob@example.com',
        wsServers: ['wss://sip-ws.example.com'],
      }
    });
    expect(simple).toBeTruthy();

    var expected = {
      authorizationUser: undefined,
      displayName: undefined,
      password: undefined,
      register: true,
      sessionDescriptionHandlerFactoryOptions: {
      },
      uri: 'bob@example.com',
      userAgentString: undefined,

      transportOptions: {
        wsServers: ['wss://sip-ws.example.com'],
        traceSip: undefined
      }
    }

    // FIXME: phantomjs is detected as safari!
    var browserUa = navigator.userAgent.toLowerCase();
    if (browserUa.indexOf('safari') > -1 && browserUa.indexOf('chrome') < 0) {
      expected.sessionDescriptionHandlerFactoryOptions = {
        modifiers: [SIP.Web.Modifiers.stripG722],
      }
    }

    expect(simple.ua.configuration).toEqual(expected);
  });
});
