/* eslint-disable strict, no-undef */
describe('RegisterContext', function() {
  var RegisterContext;
  var ua;

  beforeEach(function() {
    var log = jasmine.createSpy('log').and.callFake(function() {
      return 'log';
    });
    const loggerFactory = new SIP.LoggerFactory();
    ua = {
      configuration : {
        displayName: 'displayName',
        registerOptions: {
          registrar : 'registrar',
          expires : 999,
          regId: 1
        },
        uri : new SIP.URI("sip", "uri", "domain"),
        viaHost: "viaHost",
      },
      contact : 'contact',
      on: function() {},
      getLogger : function() {
        return { log : log };
      },
      getLoggerFactory: () => loggerFactory,
      getSupportedResponseOptions: () => ["outbound"],
      normalizeTarget: function (target) { return target; },
      listeners: function () { return [1]; },
      transport: {
        on: function () {},
        send: function () {}
      }
  };
    ua.userAgentCore = new SIP.Core.UserAgentCore(SIP.makeUserAgentCoreConfigurationFromUA(ua));
    RegisterContext = new SIP.RegisterContext(ua, ua.configuration.registerOptions);


    RegisterContext.logger = jasmine.createSpy('logger').and.returnValue('logger');
    RegisterContext.logger.log = jasmine.createSpy('log').and.returnValue('log');
    RegisterContext.logger.warn = jasmine.createSpy('warn').and.returnValue('warn');
  });

  it('initialize instance variables', function() {
    RegisterContext = undefined;

    expect(RegisterContext).toBeUndefined();

    RegisterContext = new SIP.RegisterContext(ua, ua.configuration.registerOptions);

    expect(RegisterContext).toBeDefined();
    expect(RegisterContext.options).toBeDefined();
    expect(RegisterContext.options.registrar).toBeDefined();
    expect(RegisterContext.options.expires).toBe(ua.configuration.registerOptions.expires);
    expect(RegisterContext.registrationTimer).toBeUndefined();
    expect(RegisterContext.registered).toBeFalsy();
    expect(RegisterContext.contact).toBeDefined();
    expect(RegisterContext.logger).toBeDefined();
  });

  it('defaults options if none are provided', function() {
    RegisterContext = undefined;

    expect(RegisterContext).toBeUndefined();

    RegisterContext = new SIP.RegisterContext(ua, ua.configuration.registerOptions);

    expect(RegisterContext.options).toBeDefined();
    expect(RegisterContext.options.extraContactHeaderParams).toBeDefined();
    expect(RegisterContext.options.instanceId).toBeDefined();
    expect(RegisterContext.options.params).toBeDefined();
    expect(RegisterContext.options.params.toUri).toBe(ua.configuration.uri);
    expect(RegisterContext.options.params.toDisplayName).toBe(ua.configuration.displayName);
    expect(RegisterContext.options.regId).toBe(1);
  });

  describe('.register', function() {
    var options;
    beforeEach(function() {
      options = {};
      spyOn(RegisterContext, 'send').and.returnValue('send');
    });

    it('sets up the receiveResponse function', function() {
      RegisterContext.register(options);
      expect(RegisterContext.receiveResponse).toBeDefined();
    });

    it('sets up the onRequestTimeout function', function() {
      RegisterContext.register(options);
      expect(RegisterContext.onRequestTimeout).toBeDefined();
    });

    it('sets up the onTransportError function', function() {
      RegisterContext.register(options);
      expect(RegisterContext.onTransportError).toBeDefined();
    });

    it('sends params and the extra headers', function() {
      RegisterContext.register(options);
      expect(RegisterContext.send).toHaveBeenCalled();
    });

    it('retries with the min-expires header on 423', function() {
      RegisterContext.register(options);

      var response = new SIP.IncomingResponse(ua);
      response.statusCode = 423;
      response.cseq = RegisterContext.request.cseq;
      response.setHeader('min-expires', 555555);

      RegisterContext.receiveResponse(response);

      expect(RegisterContext.expires >= 555555).toBeTruthy();
    });

    it('fails registration on 423 with no min-expires header', function() {
      RegisterContext.register(options);

      spyOn(RegisterContext, 'registrationFailure').and.returnValue('registrationFailure');

      var response = new SIP.IncomingResponse(ua);
      response.statusCode = 423;
      response.cseq = RegisterContext.request.cseq;
      response.headers['min-expires'] = undefined;

      RegisterContext.receiveResponse(response);

      expect(RegisterContext.registrationFailure).toHaveBeenCalled();
    });

    it('sets its closeHeaders property if options.closeWithHeaders flag is true', function() {
      RegisterContext.register({
        closeWithHeaders: true,
        extraHeaders: [ 'X-Foo: foo', 'X-Bar: bar' ]
      });
      expect(RegisterContext.closeHeaders.length).toBe(2);
    });
  });

  describe('.registrationFailure', function() {
    var callback;
    beforeEach(function() {
      callback = jasmine.createSpy('callback');
    });
    it('emits failed with the response and cause provided to it', function() {
      RegisterContext.on('failed', callback);

      var response = 'response';
      var cause = 'cause';

      RegisterContext.registrationFailure(response,cause);
      expect(callback).toHaveBeenCalledWith(response, cause);
    });

    it('emits failed with undefined and the cause provided if no response is provided', function() {
      RegisterContext.on('failed', callback);

      var cause = 'cause';

      RegisterContext.registrationFailure(undefined,cause);
      expect(callback).toHaveBeenCalledWith(undefined, cause);
    });

    it('does not unregister', function() {
      spyOn(RegisterContext, 'unregistered').and.returnValue('unregistered');
      RegisterContext.registered = true;
      expect(RegisterContext.unregistered).not.toHaveBeenCalled();

      var response = 'response';
      var cause = 'cause';

      RegisterContext.registrationFailure(response,cause);

      expect(RegisterContext.unregistered).not.toHaveBeenCalled();
    });
  });

  describe('.onTransportDisconnected', function() {
    it('takes the registered variable and move it to registeredBefore variable', function() {
      expect(RegisterContext.registeredBefore).not.toEqual(RegisterContext.registered);
      RegisterContext.onTransportDisconnected();
      expect(RegisterContext.registeredBefore).toEqual(RegisterContext.registered);
    });

    it('clears the registration timer if it is set', function() {
      RegisterContext.registrationTimer = setTimeout(function() {return;},999999);
      expect(RegisterContext.registrationTimer).not.toEqual(undefined);
      RegisterContext.onTransportDisconnected();
    });

    it('calls unregistered if it is registered', function() {
      spyOn(RegisterContext, 'unregistered').and.returnValue('unregister');
      RegisterContext.registered = true;
      expect(RegisterContext.unregistered).not.toHaveBeenCalled();
      RegisterContext.onTransportDisconnected();
      expect(RegisterContext.unregistered).toHaveBeenCalledWith(undefined, SIP.C.causes.CONNECTION_ERROR);
    });
  });

  describe('.close', function() {
    beforeEach(function(){
      spyOn(RegisterContext, 'unregister').and.returnValue('unregister');
    });

    it('takes registered and move it to registeredBefore', function() {
      expect(RegisterContext.registered).not.toBe(RegisterContext.registeredBefore);
      RegisterContext.close();
      expect(RegisterContext.registered).toBe(RegisterContext.registeredBefore);
    });

    it('calls unregister with closeHeaders', function() {
      jasmine.addCustomEqualityTester(function objectEquality(a, b) {
        return a === b || JSON.stringify(a) === JSON.stringify(b);
      });
      RegisterContext.registered = true;
      expect(RegisterContext.unregister).not.toHaveBeenCalled();

      RegisterContext.closeHeaders = [ 'X-Foo: foo' ,'X-Bar: bar' ];
      var mockArgs = { all: false, extraHeaders: RegisterContext.closeHeaders };

      RegisterContext.close();
      expect(RegisterContext.unregister).toHaveBeenCalledWith(mockArgs);
    });

    it('will not call unregister if it was not registered', function() {
      RegisterContext.registered = false;
      expect(RegisterContext.unregister).not.toHaveBeenCalled();
      RegisterContext.close();
      expect(RegisterContext.unregister).not.toHaveBeenCalled();
    });
  });

  describe('.unregister', function() {
    beforeEach(function() {
      RegisterContext.send = jasmine.createSpy('send').and.returnValue('send');
    });
    it('will unregister if not registered before', function() {
      RegisterContext.registered = false;
      expect(RegisterContext.send).not.toHaveBeenCalled();
      RegisterContext.unregister();
      expect(RegisterContext.send).toHaveBeenCalled();
    });

    it('changes registered variable to false if it was true', function() {
      RegisterContext.registered = true;
      RegisterContext.unregister();
      expect(RegisterContext.registered).toBe(false);
    });

    it('clears the registration timer', function() {
      RegisterContext.registered = true;
      RegisterContext.registrationTimer = setTimeout(function() { return; }, 999999);
      RegisterContext.unregister();
      expect(RegisterContext.registrationTimer).toBe(undefined);
    });

    it('pushes extra headers Contact: *, Expires: 0 if options.all is truthy', function() {
      var options = { all : true };
      RegisterContext.registered = true;
      expect(RegisterContext.send).not.toHaveBeenCalled();
      RegisterContext.unregister(options);
      expect(RegisterContext.send).toHaveBeenCalledWith();
      expect(RegisterContext.request.extraHeaders).toEqual([ 'Contact: *', 'Expires: 0' ]);
    });

    it('even when unregistered, pushes extra headers Contact: *, Expires: 0 if options.all is truthy', function() {
      var options = { all : true };
      RegisterContext.registered = false;
      expect(RegisterContext.send).not.toHaveBeenCalled();
      RegisterContext.unregister(options);
      expect(RegisterContext.send).toHaveBeenCalledWith();
      expect(RegisterContext.request.extraHeaders).toEqual([ 'Contact: *', 'Expires: 0' ]);
    });

    xit('pushes extra headers Contact: <contact>, Expires: 0 if options.all is falsy', function() {
      var options = { all : false };
      RegisterContext.registered = true;
      expect(RegisterContext.send).not.toHaveBeenCalled();
      RegisterContext.unregister(options);
      expect(RegisterContext.send).toHaveBeenCalledWith();
      expect(RegisterContext.request.extraHeaders).toEqual([ 'Contact: '+RegisterContext.contact+';expires=0' ]);
    });

    it('calls send with the params callId, and cseq+=1', function() {
      RegisterContext.registered = true;
      expect(RegisterContext.send).not.toHaveBeenCalled();
      var cseqBefore = RegisterContext.request.cseq;
      RegisterContext.unregister();
      expect(RegisterContext.send).toHaveBeenCalledWith();
      expect(RegisterContext.request.callId).toBe(RegisterContext.options.params.callId);
      expect(RegisterContext.request.cseq).toBe(cseqBefore + 1);
    });

    it('defines receiveResponse', function() {
      RegisterContext.receiveResponse = undefined;
      RegisterContext.registered = true;
      expect(RegisterContext.receiveResponse).toBeUndefined();
      RegisterContext.unregister();
      expect(RegisterContext.receiveResponse).toBeDefined();
    });

    it('defines onRequestTimeout', function() {
      RegisterContext.onRequestTimeout = undefined;
      RegisterContext.registered = true;
      expect(RegisterContext.onRequestTimeout).toBeUndefined();
      RegisterContext.unregister();
      expect(RegisterContext.onRequestTimeout).toBeDefined();
    });

    xit('defines onTransportError', function() {
      RegisterContext.onTransportError = undefined;
      RegisterContext.registered = true;
      expect(RegisterContext.onTransportError).toBeUndefined();
      RegisterContext.unregister();
      expect(RegisterContext.onTransportError).toBeDefined();
    });
  });

  describe('.unregistered', function() {
    var callback;
    beforeEach(function() {
      callback = jasmine.createSpy('callback');
    });
    it('sets RegisterContext.registered to false if RegisterContext.registered is true', function() {
      RegisterContext.registered = true;
      expect(RegisterContext.registered).toBe(true);
      RegisterContext.unregistered();
      expect(RegisterContext.registered).toBe(false);
    });
    it('sets RegisterContext.registered to false if RegisterContext.registered is false', function() {
      RegisterContext.registered = false;
      expect(RegisterContext.registered).toBe(false);
      RegisterContext.unregistered();
      expect(RegisterContext.registered).toBe(false);
    });
    it('emits unregistered with the response and cause passed to it', function() {
      RegisterContext.on('unregistered', callback);
      var response = 'response';
      var cause = 'cause';
      expect(callback).not.toHaveBeenCalled();
      RegisterContext.unregistered(response,cause);
      expect(callback).toHaveBeenCalledWith(response, cause);
    });
    it('emits unregistered with a undefined response and a undefined cause if one is not provided', function() {
      RegisterContext.on('unregistered', callback);
      expect(callback).not.toHaveBeenCalled();
      RegisterContext.unregistered();
      expect(callback).toHaveBeenCalledWith(undefined, undefined);
    });
  });
});
