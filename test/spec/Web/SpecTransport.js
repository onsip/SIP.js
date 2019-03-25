/* eslint-disable strict, no-undef */

describe('Transport', function() {
  var connectedSpy, disconnectedSpy, messageSpy, onCloseOptions;
  onCloseOptions = {code: "1", reason: "test"};

  beforeEach(function(done) {
    this.uaConfig = {
      autostart: false
    };
    this.ua = new SIP.UA(this.uaConfig);
    this.ua.on('transportCreated', function (transport) {
      connectedSpy = jasmine.createSpy('connected');
      transport.on('connected', connectedSpy);

      disconnectedSpy = jasmine.createSpy('disconnected');
      transport.on('disconnected', disconnectedSpy);

      messageSpy = jasmine.createSpy('message');
      transport.on('messageSent', messageSpy);

      transport.connect().then(done);
    });
    this.ua.start();
  });

  describe('.connect', function () {
    it('emits a \'connected\' event', function () {
      expect(connectedSpy).toHaveBeenCalled();
    });
  });

  describe('.disconnect', function () {
    beforeEach(function(done) {
      this.ua.transport.disconnect().then(done);
    });

    it('closes the ws', function () {
      expect(this.ua.transport.ws.readyState).toBe(3);
    });
  });

  describe('.onClose', function () {
    describe('when the user closes the websocket', function () {
      beforeEach(function() {
        this.ua.transport.userClosed = true;
        this.ua.transport.onClose(onCloseOptions);
      });

      it('emits a \'disconnected\' event when user closed the ws', function () {
        expect(disconnectedSpy).toHaveBeenCalled();
      });
    });

    // this spec breaks OTHER specs?
    xdescribe('when the user does not close the websocket', function () {
      beforeEach(function() {
        this.ua.transport.userClosed = false;
        this.ua.transport.onClose(onCloseOptions);
      });

      it('attempts to reconnect', function () {
        spyOn(this.ua.transport, 'reconnect');
        expect(this.ua.transport.reconnect).toHaveBeenCalled();
      });
    });
  });

  describe('.message', function () {
    beforeEach(function(done) {
      this.ua.transport.send("yolo").then(done);
    });

    it('emits a \'message\' event', function () {
      expect(messageSpy).toHaveBeenCalled();
    });
  });

  describe('.isConnected', function () {
    it('is true when connected', function () {
      expect(this.ua.transport.isConnected()).toBeTruthy();
    });

    it('is false when not connected', function () {
      this.ua.transport.onClose(onCloseOptions);
      expect(this.ua.transport.isConnected()).toBeFalsy();
    });
  });

  describe('.getNextWsServer', function() {
    var can1, can2, can3, can4;

    beforeEach(function() {
      can1 = {status: 0, weight: 0};
      can2 = {status: 0, weight: 1};
      can3 = {status: 0, weight: 1};
      can4 = {status: 0, weight: 2};

      //Note: can't just set wsServers at this point
      this.ua.transport.configuration = {wsServers: [can1,can2,can3,can4]};
    });

    it('selects the candidate with the highest weight', function() {
      expect(this.ua.transport.getNextWsServer()).toBe(can4);
    });

    it('selects one of the candidates with the highest weight', function() {
      can4.weight = 0;

      spyOn(Math, 'random').and.returnValue(0.9);

      expect(this.ua.transport.getNextWsServer()).toBe(can3);

      Math.random.and.returnValue(0.4);

      expect(this.ua.transport.getNextWsServer()).toBe(can2);
    });

    it('does not select a candidate that has a transport error', function() {
      can4.isError = true;

      expect(this.ua.transport.getNextWsServer()).not.toBe(can4);
    });
  });

  describe('.loadConfig', function() {
    beforeEach(function() {
      this.ua.transport.configuration = {};
    });

    it('sets default settings for many parameters', function() {
      this.ua.transport.configuration = this.ua.transport.loadConfig({});

      expect(this.ua.transport.configuration.wsServers).toEqual([{scheme: 'WSS', sipUri: '<sip:edge.sip.onsip.com;transport=ws;lr>', isError: false, weight: 0, wsUri: 'wss://edge.sip.onsip.com'}]);

      expect(this.ua.transport.configuration.maxReconnectionAttempts).toBe(3);
      expect(this.ua.transport.configuration.reconnectionTimeout).toBe(4);
      expect(this.ua.transport.configuration.connectionTimeout).toBe(5);
      expect(this.ua.transport.configuration.keepAliveInterval).toBe(0);
      expect(this.ua.transport.configuration.keepAliveDebounce).toBe(10);
      expect(this.ua.transport.configuration.traceSip).toBe(false);
    });

    it('throws a configuration error when a mandatory parameter is missing', function() {
      spyOn(this.ua.transport, 'getConfigurationCheck').and.returnValue({mandatory: { fake: function (value) {return;} }});

      expect(function(){this.ua.transport.loadConfig({});}.bind(this)).toThrowError('Missing parameter: fake');
    });

    it('throws a configuration error if a mandatory parameter\'s passed-in value is invalid', function() {
      spyOn(this.ua.transport, 'getConfigurationCheck').and.returnValue({mandatory: { fake: function (value) {return;} }});

      expect(function(){this.ua.transport.loadConfig({fake: 'fake'});}.bind(this)).toThrowError('Invalid value "fake" for parameter \'fake\'');
    });

    it('sets a mandatory value successfully in settings', function() {
      spyOn(this.ua.transport, 'getConfigurationCheck').and.returnValue({mandatory: { fake: function (value) {return 'fake';} }});
      spyOn(this.ua.transport.logger, 'log');

      this.ua.transport.loadConfig({fake: 'fake'});

      expect(this.ua.transport.logger.log).toHaveBeenCalledWith('· fake: "fake"');
    });

    it('throws a ConfigurationError if an optional value is passed in which is invalid', function() {
      spyOn(this.ua.transport, 'getConfigurationCheck').and.returnValue({optional: { fake: function (value) {return;} }});

      expect(function(){this.ua.transport.loadConfig({fake: 'fake'});}.bind(this)).toThrowError('Invalid value "fake" for parameter \'fake\'');
    });

    it('sets an optional value successfully in settings', function() {
      spyOn(this.ua.transport, 'getConfigurationCheck').and.returnValue({optional: { fake: function (value) {return 'fake';} }});
      spyOn(this.ua.transport.logger, 'log');

      this.ua.transport.loadConfig({fake: 'fake'});

      expect(this.ua.transport.logger.log).toHaveBeenCalledWith('· fake: "fake"');
    });

    xit('makes sure the connection recovery max interval is greater than the min interval', function() {
      expect(function(){this.ua.transport.loadConfig({connectionRecoveryMaxInterval: 1, connectionRecoveryMinInterval: 2});}.bind(this)).toThrowError('Invalid value 1 for parameter "connectionRecoveryMaxInterval"');
    });

    //the setting of the configuration was checked with the default test
    it('sets all parameters as writable/configurable false', function() {
      this.ua.transport.configuration = this.ua.transport.loadConfig({});

      expect(this.ua.transport.configuration['keepAliveInterval']).toBeDefined();
      expect(Object.getOwnPropertyDescriptor(this.ua.transport.configuration, 'keepAliveInterval').writable).toBe(false);
      expect(Object.getOwnPropertyDescriptor(this.ua.transport.configuration, 'keepAliveInterval').configurable).toBe(false);
    });
  });

  describe('.configurationCheck', function() {
    var configCheck;

    beforeEach(function() {
      configCheck = this.ua.transport.getConfigurationCheck();
    });
    //I could've made another describe for optional, but they are all under that
    describe('.wsServers', function() {
      it('fails for types that are not string or array (of strings or objects', function() {
        expect(configCheck.optional.wsServers(7)).toBeUndefined();
      });

      it('fails for an empty array', function() {
        //NOTE: this is the only case that false is returned (instead of nothing)
        expect(configCheck.optional.wsServers([])).toBe(false);
      });

      it('fails if wsUri attribute is missing', function() {
        expect(configCheck.optional.wsServers([{sandwich: 'ham'}])).toBeUndefined();
      });

      it('fails if weight attribute is not a number', function() {
        expect(configCheck.optional.wsServers([{wsUri: 'ham', weight: 'scissors'}])).toBeUndefined()
      });

      it('fails if the wsUri is invalid', function() {
        expect(configCheck.optional.wsServers([{wsUri: 'ham'}])).toBeUndefined();
      });

      it('fails if the url scheme is not wss or ws', function() {
        expect(configCheck.optional.wsServers([{wsUri: 'ithoughtthiswasright://alice@example.com'}])).toBeUndefined();
      });

      it('returns correctly if none of the above is wrong', function() {
        expect(configCheck.optional.wsServers([{wsUri: 'wss://edge.sip.onsip.com'}])).toEqual([{wsUri: 'wss://edge.sip.onsip.com', sipUri:'<sip:edge.sip.onsip.com;transport=ws;lr>', weight: 0, scheme: 'WSS', isError: false}]);
        expect(configCheck.optional.wsServers("wss://edge.sip.onsip.com")).toEqual([{wsUri: 'wss://edge.sip.onsip.com', sipUri:'<sip:edge.sip.onsip.com;transport=ws;lr>', weight: 0, scheme: 'WSS', isError: false}]);
      });
    });

    describe('.traceSip', function() {
      it('fails for all types except boolean', function() {
        expect(configCheck.optional.traceSip()).toBeUndefined();
        expect(configCheck.optional.traceSip(7)).toBeUndefined();
        expect(configCheck.optional.traceSip('string')).toBeUndefined();
        expect(configCheck.optional.traceSip({even: 'objects'})).toBeUndefined();
        expect(configCheck.optional.traceSip(['arrays'])).toBeUndefined();
      });

      it('passes for boolean parameters', function() {
        expect(configCheck.optional.traceSip(true)).toBe(true);
        expect(configCheck.optional.traceSip(false)).toBe(false);
      });
    });

    describe('.maxReconnectionAttempts', function() {
      it('fails for anything but numbers', function() {
        expect(configCheck.optional.maxReconnectionAttempts(true)).toBeUndefined();
        expect(configCheck.optional.maxReconnectionAttempts('string')).toBeUndefined();
        expect(configCheck.optional.maxReconnectionAttempts(['arrays'])).toBeUndefined();
        expect(configCheck.optional.maxReconnectionAttempts({even: 'objects'})).toBeUndefined();
      });

      it('fails for negative numbers', function() {
        expect(configCheck.optional.maxReconnectionAttempts(-7)).toBeUndefined();
      });

      it('passes for positive numbers and 0', function() {
        expect(configCheck.optional.maxReconnectionAttempts(7)).toBe(7);
        expect(configCheck.optional.maxReconnectionAttempts(0)).toBe(0);
      });
    });

    describe('.reconnectionTimeout', function() {
      it('fails for anything but numbers', function() {
        expect(configCheck.optional.reconnectionTimeout(true)).toBeUndefined();
        expect(configCheck.optional.reconnectionTimeout('string')).toBeUndefined();
        expect(configCheck.optional.reconnectionTimeout(['arrays'])).toBeUndefined();
        expect(configCheck.optional.reconnectionTimeout({even: 'objects'})).toBeUndefined();
      });

      it('fails for negative numbers and 0', function() {
        expect(configCheck.optional.reconnectionTimeout(0)).toBeUndefined();
        expect(configCheck.optional.reconnectionTimeout(-7)).toBeUndefined();
      });

      it('passes for positive numbers', function() {
        expect(configCheck.optional.reconnectionTimeout(7)).toBe(7);
      });
    });

    describe('.connectionTimeout', function() {
      it('fails for anything but numbers', function() {
        expect(configCheck.optional.connectionTimeout(true)).toBeUndefined();
        expect(configCheck.optional.connectionTimeout('string')).toBeUndefined();
        expect(configCheck.optional.connectionTimeout(['arrays'])).toBeUndefined();
        expect(configCheck.optional.connectionTimeout({even: 'objects'})).toBeUndefined();
      });

      it('fails for negative numbers and 0', function() {
        expect(configCheck.optional.connectionTimeout(0)).toBeUndefined();
        expect(configCheck.optional.connectionTimeout(-7)).toBeUndefined();
      });

      it('passes for positive numbers', function() {
        expect(configCheck.optional.connectionTimeout(7)).toBe(7);
      });
    });

    describe('.keepAliveDebounce', function() {
      it('fails for anything but numbers', function() {
        expect(configCheck.optional.keepAliveDebounce(true)).toBeUndefined();
        expect(configCheck.optional.keepAliveDebounce('string')).toBeUndefined();
        expect(configCheck.optional.keepAliveDebounce(['arrays'])).toBeUndefined();
        expect(configCheck.optional.keepAliveDebounce({even: 'objects'})).toBeUndefined();
      });

      it('fails for negative numbers and 0', function() {
        expect(configCheck.optional.keepAliveDebounce(0)).toBeUndefined();
        expect(configCheck.optional.keepAliveDebounce(-7)).toBeUndefined();
      });

      it('passes for positive numbers', function() {
        expect(configCheck.optional.keepAliveDebounce(7)).toBe(7);
      });
    });

    describe('.keepAliveInterval', function() {
      it('fails for anything but numbers', function() {
        expect(configCheck.optional.keepAliveInterval(true)).toBeUndefined();
        expect(configCheck.optional.keepAliveInterval('string')).toBeUndefined();
        expect(configCheck.optional.keepAliveInterval(['arrays'])).toBeUndefined();
        expect(configCheck.optional.keepAliveInterval({even: 'objects'})).toBeUndefined();
      });

      it('fails for negative numbers', function() {
        expect(configCheck.optional.keepAliveInterval(-7)).toBeUndefined();
      });

      it('passes for positive numbers and 0', function() {
        expect(configCheck.optional.keepAliveInterval(0)).toBeUndefined();
        expect(configCheck.optional.keepAliveInterval(7)).toBe(7);
      });
    });
  });
});
