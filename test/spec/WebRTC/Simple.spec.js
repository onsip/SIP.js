describe('WebRTC/Simple', function() {
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
    var simple = new SIP.WebRTC.Simple({
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
    expect(simple.ua.configuration).toEqual({
      authorizationUser: undefined,
      displayName: undefined,
      password: undefined,
      register: true,
      sessionDescriptionHandlerFactoryOptions: {
        // FIXME: phantomjs is detected as safari!
        modifiers: [SIP.WebRTC.Modifiers.stripG722]
      },
      traceSip: undefined,
      uri: 'bob@example.com',
      userAgentString: undefined,
      wsServers: ['wss://sip-ws.example.com'],
    });
  });
});
