(function(window) {
var TestSIP = (function() {
  "use string";
  return {};
}());


TestSIP.Helpers = {

  DEFAULT_SIP_CONFIGURATION_AFTER_START: {
    password: null,
    registerExpires: 600,
    register: false,
    connectionRecoveryMinInterval: 2,
    connectionRecoveryMaxInterval: 30,
    usePreloadedRoute: true,
    noAnswerTimeout: 60000,
    stunServers: ['stun:stun.l.google.com:19302'],
    traceSip: false,
    hackViaTcp: false,
    hackIpInContact: false,
    uri: 'sip:fakeUA@sip.js.net',
    registrarServer: 'sip:registrar.sip.js.net:6060;transport=tcp',
    wsServers: [{'ws_uri':'ws://localhost:12345','sip_uri':'<sip:localhost:12345;transport=ws;lr>','weight':0,'status':0,'scheme':'WS'}],
    displayName: 'Fake UA ð→€ł !!!',
    authorizationUser: 'fakeUA'
  },

  FAKE_UA_CONFIGURATION: {
    uri: 'f%61keUA@sip.js.net',
    wsServers:  'ws://localhost:12345',
    displayName: 'Fake UA ð→€ł !!!',
    register: false,
    usePreloadedRoute: true,
    registrarServer: 'registrar.sip.js.NET:6060;TRansport=TCP'
  },

  createFakeUA: function() {
    return new SIP.UA(this.FAKE_UA_CONFIGURATION);
  }

};


window.TestSIP = TestSIP;
}(window));


