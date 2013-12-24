(function(window) {
var TestSIP = (function() {
  "use string";
  return {};
}());


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


window.TestSIP = TestSIP;
}(window));


