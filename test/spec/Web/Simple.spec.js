describe('Web/Simple', function() {
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
      authorizationUser: 'bob',
      displayName: '',
      password: undefined,
      register: true
    }

    // FIXME: phantomjs is detected as safari!
    var browserUa = navigator.userAgent.toLowerCase();
    if (browserUa.indexOf('safari') > -1 && browserUa.indexOf('chrome') < 0) {
      expected.sessionDescriptionHandlerFactoryOptions = {
        modifiers: [SIP.Web.Modifiers.stripG722],
      }
    }

    expect(simple.ua.configuration).toBeDefined();
    // expect(simple.ua.configuration).toContain(expected);
    // expect(simple.ua.configuration.transportOptions.wsServers).toEqual(['wss://sip-ws.example.com']);
  });
});
