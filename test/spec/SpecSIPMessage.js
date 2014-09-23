describe('SIPMessage', function() {
  describe('OutgoingRequest', function() {
    var OutgoingRequest,
      method,
      ruri,
      ua,
      params,
      extraHeaders,
      body;

    beforeEach(function() {
      var getLogger = jasmine.createSpy('getLogger').and.returnValue('getLogger');
      ua = {
        getLogger : getLogger ,
        configuration : {
          usePreloadedRoute : false
        }
      };

      method = 'method';
      ruri = 'ruri';
      body = 'body';
      extraHeaders = 'extraHeaders';

      spyOn(SIP, 'NameAddrHeader');
      SIP.NameAddrHeader.parse = jasmine.createSpy('NameAddrHeaderParse').and.callFake(function(param) {
        return param.toString();
      });

      OutgoingRequest = new SIP.OutgoingRequest(method,ruri,ua,params,extraHeaders,body);

    });

    it('sets up instance variables', function() {
      OutgoingRequest = undefined;
      expect(OutgoingRequest).toBeUndefined();

      OutgoingRequest = new SIP.OutgoingRequest(method,ruri,ua,params,extraHeaders,body);
      expect(OutgoingRequest).toBeDefined();
      expect(OutgoingRequest.logger).toBe(ua.getLogger());
      expect(OutgoingRequest.ua).toBe(ua);
      expect(OutgoingRequest.headers).toBeDefined(); //might want to revisit this
      expect(OutgoingRequest.ruri).toBe(ruri);
      expect(OutgoingRequest.body).toBeDefined(); // and this
      expect(OutgoingRequest.extraHeaders).toBe(extraHeaders);
      expect(OutgoingRequest.to).toBeDefined();
      expect(OutgoingRequest.from).toBeDefined();
      expect(OutgoingRequest.call_id).toBeDefined();
      expect(OutgoingRequest.cseq).toBeDefined();
    });

    describe('.setHeader', function() {
      it('sets the headers headerized name property to an array of the value', function() {
        OutgoingRequest.headers = {};
        expect(OutgoingRequest.headers).toEqual({});
        var name = 'name';
        var value = 'value';
        OutgoingRequest.setHeader(name,value);
        expect(OutgoingRequest.headers[SIP.Utils.headerize(name)]).toEqual([value]);
      });

      it('sets the headers headerized name property to the array passed to it', function() {
        OutgoingRequest.headers = {};
        expect(OutgoingRequest.headers).toEqual({});
        var name = 'name';
        var value = ['value1','value2'];
        OutgoingRequest.setHeader(name,value);
        expect(OutgoingRequest.headers[SIP.Utils.headerize(name)]).toEqual(value);
      });
    });

    describe('.getHeader', function() {
      it('returns the header that exists', function() {
        OutgoingRequest.headers = {};
        expect(OutgoingRequest.headers).toEqual({});
        var name = 'name';
        var value = 'value';
        OutgoingRequest.setHeader(name,value);
        expect(OutgoingRequest.headers[SIP.Utils.headerize(name)]).toEqual([value]);
        expect(OutgoingRequest.getHeader(name)).toBe(value);
      });

      it('returns the header from extra headers if it is not in headers', function() {
        OutgoingRequest.extraHeaders = [];
        OutgoingRequest.extraHeaders.push('Event: ' + 'extraEvent');
        OutgoingRequest.extraHeaders.push('Allow: ' + 'extraAllow');

        expect(OutgoingRequest.getHeader('event')).toBe('extraEvent');
        expect(OutgoingRequest.getHeader('Allow')).toBe('extraAllow');
      });

      it('returns undefined if the header does not exist in headers or extraHeaders', function() {
        OutgoingRequest.extraHeaders = [];
        OutgoingRequest.extraHeaders.push('Event: ' + 'extraEvent');
        OutgoingRequest.extraHeaders.push('Allow: ' + 'extraAllow');

        expect(OutgoingRequest.getHeader('Contact')).toBe(undefined);
      });
    });

    describe('.getHeaders', function() {
      it('returns all of the headers in an array with the given name', function() {
        OutgoingRequest.headers = {};
        expect(OutgoingRequest.headers).toEqual({});
        var name = 'name';
        var value = ['value1','value2'];
        OutgoingRequest.setHeader(name,value);
        expect(OutgoingRequest.headers[SIP.Utils.headerize(name)]).toEqual(value);
        expect(OutgoingRequest.getHeaders(name)).toEqual(value);
      });

      it('returns all the headers in an array with the given name from extraHeaders if the header is not in headers', function() {
        OutgoingRequest.extraHeaders = [];
        OutgoingRequest.extraHeaders.push('Event: ' + 'extraEvent');

        expect(OutgoingRequest.getHeaders('event')).toEqual(['extraEvent']);
      });

      it('returns an empty array if the header is not found in headers and the header is not found in extraHeaders', function() {
        OutgoingRequest.extraHeaders = [];
        OutgoingRequest.extraHeaders.push('Event: ' + 'extraEvent');

        expect(OutgoingRequest.getHeaders('Contact')).toEqual([]);
      });
    });

    describe('.hasHeader', function() {
      it('returns true if the header exists in headers', function() {
        var name = 'name';
        var value = 'value';

        OutgoingRequest.setHeader(name, value);
        expect(OutgoingRequest.hasHeader(name)).toBe(true);
      });

      it('returns true if the header exists in extraHeaders', function() {
        OutgoingRequest.extraHeaders = [];
        OutgoingRequest.extraHeaders.push('Event: ' + 'extraEvent');

        expect(OutgoingRequest.hasHeader('event')).toBe(true);
      });

      it('returns false if the header does not exist in headers or extraHeaders', function() {
        OutgoingRequest.extraHeaders = [];
        OutgoingRequest.extraHeaders.push('Event: ' + 'extraEvent');

        expect(OutgoingRequest.hasHeader('Contact')).toBe(false);
      });
    });

    describe('.toString', function() {
      it('calculates the correct Content-lenght for a given body', function(){
        var body = 'a';

        var length = SIP.Utils.str_utf8_length(body);
        expect(length).toBe(1);

        body = 'ä';
        length = SIP.Utils.str_utf8_length(body);
        expect(length).toBe(2);

        body = 'test€';
        length = SIP.Utils.str_utf8_length(body);
        expect(length).toBe(7);

        body = 'test€fantasticääüüöööööö€€€';
        length = SIP.Utils.str_utf8_length(body);
        expect(length).toBe(45);
      });
    });
  });

  describe('IncomingRequest', function() {
    var IncomingRequest,
    ua, transaction;
    beforeEach(function(){
      var getLogger = jasmine.createSpy('getLogger').and.returnValue('logger');
      ua = {
        getLogger : getLogger ,
        configuration : {
          usePreloadedRoute : false
        },
        transport: {
          send: function () {}
        }
      };
      IncomingRequest = new SIP.IncomingRequest(ua);
      IncomingRequest.transport = ua.transport;
    });

    it('initialize the instance variables', function() {
      expect(IncomingRequest.data).toBeDefined();
      expect(IncomingRequest.headers).toBeDefined();
      expect(IncomingRequest.method).toBeDefined();
      expect(IncomingRequest.via).toBeDefined();
      expect(IncomingRequest.via_branch).toBeDefined();
      expect(IncomingRequest.call_id).toBeDefined();
      expect(IncomingRequest.cseq).toBeDefined();
      expect(IncomingRequest.from).toBeDefined();
      expect(IncomingRequest.from_tag).toBeDefined();
      expect(IncomingRequest.to).toBeDefined();
      expect(IncomingRequest.to_tag).toBeDefined();
      expect(IncomingRequest.body).toBeDefined();
      expect(IncomingRequest.logger).toBeDefined();
      expect(IncomingRequest.ua).toBeDefined();
      expect(IncomingRequest.headers).toBeDefined();
      expect(IncomingRequest.ruri).toBeDefined();
      expect(IncomingRequest.transport).toBeDefined();
      expect(IncomingRequest.server_transaction).toBeDefined();
    });

    describe('.addHeader', function() {
      it('creates the header in the headers object if it does not already exist', function() {
        expect(IncomingRequest.headers).toEqual({});
        var name = 'name';
        var value = 'value';
        IncomingRequest.addHeader(name,value);
        expect(IncomingRequest.headers[SIP.Utils.headerize(name)]).toEqual([{raw : value}]);
      });

      it('adds the header to the array in the headers object if it already exists', function() {
        expect(IncomingRequest.headers).toEqual({});
        var name = 'name';
        var value1 = 'value1';
        IncomingRequest.addHeader(name,value1);
        expect(IncomingRequest.headers[SIP.Utils.headerize(name)]).toEqual([{raw : value1}]);
        var value2 = 'value2';
        IncomingRequest.addHeader(name,value2);
        expect(IncomingRequest.headers[SIP.Utils.headerize(name)]).toEqual([{raw : value1},{raw : value2}]);
      });
    });

    describe('.getHeader', function() {
      it('returns undefined if the header does not exist', function() {
        expect(IncomingRequest.headers).toEqual({});
        var name = 'name';
        expect(IncomingRequest.getHeader(name)).toBeUndefined();
      });
      it('returns the value of the header that exists', function() {
        expect(IncomingRequest.headers).toEqual({});
        var name = 'name';
        var value = 'value';
        IncomingRequest.addHeader(name, value);
        expect(IncomingRequest.headers[SIP.Utils.headerize(name)]).toEqual([{raw : value}]);
      });
      it('returns the first header value if multiple values exist', function() {
        expect(IncomingRequest.headers).toEqual({});
        var name = 'name';
        var value1 = 'value1';
        var value2 = 'value2';
        IncomingRequest.addHeader(name, value1);
        IncomingRequest.addHeader(name, value2);
        expect(IncomingRequest.headers[SIP.Utils.headerize(name)]).toEqual([{raw : value1},{raw : value2}]);
        expect(IncomingRequest.getHeader(name)).toBe(value1);
        expect(IncomingRequest.getHeader(name)).not.toBe(value2);
      });
    });

    describe('.getHeaders', function() {
      it('returns an empty array if the header does not exist', function() {
        expect(IncomingRequest.headers).toEqual({});
        var name = 'name';
        expect(IncomingRequest.getHeaders(name).length).toEqual(0);
        expect(IncomingRequest.getHeaders(name)).toEqual([]);
      });
      it('returns an array with one value if there is only one value for the header provided', function() {
        expect(IncomingRequest.headers).toEqual({});
        var name = 'name';
        var value = 'value';
        IncomingRequest.addHeader(name, value);
        expect(IncomingRequest.headers[SIP.Utils.headerize(name)]).toEqual([{raw : value}]);
        expect(IncomingRequest.getHeaders(name).length).toEqual(1);
        expect(IncomingRequest.getHeaders(name)).toEqual([value]);
      });

      it('returns an array with all of the values if they exist for the header provided', function() {
        expect(IncomingRequest.headers).toEqual({});
        var name = 'name';
        var value1 = 'value1';
        IncomingRequest.addHeader(name,value1);
        var value2 = 'value2';
        IncomingRequest.addHeader(name,value2);
        expect(IncomingRequest.headers[SIP.Utils.headerize(name)]).toEqual([{raw : value1},{raw : value2}]);
        expect(IncomingRequest.getHeaders(name).length).toEqual(2);
        expect(IncomingRequest.getHeaders(name)).toEqual([value1, value2]);
      });
    });

    describe('.hasHeader', function() {
      it('returns true if the header exists', function() {
        expect(IncomingRequest.headers).toEqual({});
        var name = 'name';
        var value = 'value';
        IncomingRequest.addHeader(name,value);
        expect(IncomingRequest.headers[SIP.Utils.headerize(name)]).toEqual([{raw : value}]);
        expect(IncomingRequest.hasHeader(name)).toBe(true);
      });
      it('returns false if the header does not exist', function() {
        expect(IncomingRequest.headers).toEqual({});
        var name = 'name';
        expect(IncomingRequest.hasHeader(name)).toBe(false);
      });
    });

    describe('.parseHeader', function() {
      beforeEach(function() {
        IncomingRequest.logger = {};
        IncomingRequest.logger.log = jasmine.createSpy('log').and.returnValue('log');
        IncomingRequest.logger.warn = jasmine.createSpy('warn').and.returnValue('warn');
        spyOn(SIP.Grammar,'parse').and.callThrough();
      });

      it('returns undefined if the header does not exist in the headers object', function() {
        expect(IncomingRequest.headers).toEqual({});
        var name = 'name';
        expect(IncomingRequest.parseHeader(name)).toBeUndefined();
      });
      it('returns undefined if the idx is greater than the array for the header that exists', function() {
        expect(IncomingRequest.headers).toEqual({});
        var name = 'name';
        var value = 'value';
        IncomingRequest.addHeader(name,value);
        expect(IncomingRequest.headers[SIP.Utils.headerize(name)]).toEqual([{raw : value}]);
        var index = 1;
        expect(IncomingRequest.parseHeader(name,index)).toBeUndefined();
        expect(IncomingRequest.getHeaders(name).length).toBeGreaterThan(index-1);
      });

      it('returns the already parsed header if it exists', function() {
        expect(IncomingRequest.headers).toEqual({});
        var name = 'call-ID';
        var value = 'hnds3k17jhd1jank84hq';
        IncomingRequest.addHeader(name,value);
        expect(IncomingRequest.headers[SIP.Utils.headerize(name)]).toEqual([{raw : value}]);
        IncomingRequest.parseHeader(name,0);
        expect(SIP.Grammar.parse.calls.count()).toEqual(1);
        expect(IncomingRequest.logger.warn).not.toHaveBeenCalled();
        expect(IncomingRequest.headers[SIP.Utils.headerize(name)][0].parsed).toBeDefined();
        expect(IncomingRequest.parseHeader(name,0)).toBe(IncomingRequest.headers[SIP.Utils.headerize(name)][0].parsed);
        expect(SIP.Grammar.parse.calls.count()).toEqual(1);
      });

      it('returns a newly parsed header and creates a parsed property', function() {
        expect(IncomingRequest.headers).toEqual({});
        var name = 'call-ID';
        var value = 'hnds3k17jhd1jank84hq';
        IncomingRequest.addHeader(name,value);
        expect(IncomingRequest.headers[SIP.Utils.headerize(name)]).toEqual([{raw : value}]);
        expect(IncomingRequest.headers[SIP.Utils.headerize(name)][0].parsed).toBeUndefined();
        expect(IncomingRequest.parseHeader(name, 0)).toBe(value);
        expect(IncomingRequest.headers[SIP.Utils.headerize(name)][0].parsed).toBe(value);
      });
    });

    describe('.setHeader', function() {
      it('adds the header if it does not alredy exist', function() {
        expect(IncomingRequest.headers).toEqual({});
        var name = 'name';
        var value = 'value';
        IncomingRequest.setHeader(name,value);
        expect(IncomingRequest.headers[SIP.Utils.headerize(name)]).toEqual([{raw : value}]);
      });
      it('replaces a header that already exists', function() {
        expect(IncomingRequest.headers).toEqual({});
        var name = 'name';
        var value = 'value';
        IncomingRequest.setHeader(name,value);
        expect(IncomingRequest.headers[SIP.Utils.headerize(name)]).toEqual([{raw : value}]);
        var new_value = 'new_value';
        IncomingRequest.setHeader(name,new_value);
        expect(IncomingRequest.headers[SIP.Utils.headerize(name)]).not.toEqual([{raw : value}]);
        expect(IncomingRequest.headers[SIP.Utils.headerize(name)]).toEqual([{raw : new_value}]);
      });
    });

    describe('.toString', function() {
      it('returns the data instance variable', function() {
        var data = 'data';
        IncomingRequest.data = data;
        expect(IncomingRequest.toString()).toBe(data);
        expect(IncomingRequest.toString()).toBe(IncomingRequest.data);
      });
    });

    describe('.reply', function() {
      beforeEach(function() {
        IncomingRequest.addHeader('To','alice@example.com');
      });
      it('throws a TypeError if no code exists', function() {
        expect(function() {IncomingRequest.reply(null); }).toThrow(new TypeError('Invalid status_code: null'));
      });

      it('throws a TypeError if the code is less than 100 or greater than 699', function() {
        for (var i = 1; i < 100; i++) {
          expect(function() {IncomingRequest.reply(i);}).toThrow(new TypeError('Invalid status_code: '+ i));
        }
        for(i = 700; i < 1000; i++) {
          expect(function() {IncomingRequest.reply(i);}).toThrow(new TypeError('Invalid status_code: '+ i));
        }
      });

      it('throws a TypeError if a valid code is provided but reason is not a string', function() {
        for (var i = 100; i <700; i++) {
          expect(function() {IncomingRequest.reply(i,[5]);}).toThrow(new TypeError('Invalid reason_phrase: 5'));
        }
      });
    });

    describe('.reply_sl', function() {

    })
  });
  describe('IncomingResponse', function() {
    var IncomingResponse, ua;

    beforeEach(function(){
      var getLogger = jasmine.createSpy('getLogger').and.returnValue('logger');
      ua = {
        getLogger : getLogger ,
        configuration : {
          usePreloadedRoute : false
        }
      };
      IncomingResponse = new SIP.IncomingResponse(ua);
    });

    it('initialize the instance variables', function() {
      expect(IncomingResponse.data).toBeDefined();
      expect(IncomingResponse.headers).toBeDefined();
      expect(IncomingResponse.method).toBeDefined();
      expect(IncomingResponse.via).toBeDefined();
      expect(IncomingResponse.via_branch).toBeDefined();
      expect(IncomingResponse.call_id).toBeDefined();
      expect(IncomingResponse.cseq).toBeDefined();
      expect(IncomingResponse.from).toBeDefined();
      expect(IncomingResponse.from_tag).toBeDefined();
      expect(IncomingResponse.to).toBeDefined();
      expect(IncomingResponse.to_tag).toBeDefined();
      expect(IncomingResponse.body).toBeDefined();
      expect(IncomingResponse.logger).toBeDefined();
      expect(IncomingResponse.headers).toBeDefined();
      expect(IncomingResponse.status_code).toBeDefined();
      expect(IncomingResponse.reason_phrase).toBeDefined();
    });

    describe('.addHeader', function() {
      it('creates the header in the headers object if it does not already exist', function() {
        expect(IncomingResponse.headers).toEqual({});
        var name = 'name';
        var value = 'value';
        IncomingResponse.addHeader(name,value);
        expect(IncomingResponse.headers[SIP.Utils.headerize(name)]).toEqual([{raw : value}]);
      });

      it('adds the header to the array in the headers object if it already exists', function() {
        expect(IncomingResponse.headers).toEqual({});
        var name = 'name';
        var value1 = 'value1';
        IncomingResponse.addHeader(name,value1);
        expect(IncomingResponse.headers[SIP.Utils.headerize(name)]).toEqual([{raw : value1}]);
        var value2 = 'value2';
        IncomingResponse.addHeader(name,value2);
        expect(IncomingResponse.headers[SIP.Utils.headerize(name)]).toEqual([{raw : value1},{raw : value2}]);
      });
    });

    describe('.getHeader', function() {
      it('returns undefined if the header does not exist', function() {
        expect(IncomingResponse.headers).toEqual({});
        var name = 'name';
        expect(IncomingResponse.getHeader(name)).toBeUndefined();
      });
      it('returns the value of the header that exists', function() {
        expect(IncomingResponse.headers).toEqual({});
        var name = 'name';
        var value = 'value';
        IncomingResponse.addHeader(name, value);
        expect(IncomingResponse.headers[SIP.Utils.headerize(name)]).toEqual([{raw : value}]);
      });
      it('returns the first header value if multiple values exist', function() {
        expect(IncomingResponse.headers).toEqual({});
        var name = 'name';
        var value1 = 'value1';
        var value2 = 'value2';
        IncomingResponse.addHeader(name, value1);
        IncomingResponse.addHeader(name, value2);
        expect(IncomingResponse.headers[SIP.Utils.headerize(name)]).toEqual([{raw : value1},{raw : value2}]);
        expect(IncomingResponse.getHeader(name)).toBe(value1);
        expect(IncomingResponse.getHeader(name)).not.toBe(value2);
      });
    });

    describe('.getHeaders', function() {
      it('returns an empty array if the header does not exist', function() {
        expect(IncomingResponse.headers).toEqual({});
        var name = 'name';
        expect(IncomingResponse.getHeaders(name).length).toEqual(0);
        expect(IncomingResponse.getHeaders(name)).toEqual([]);
      });
      it('returns an array with one value if there is only one value for the header provided', function() {
        expect(IncomingResponse.headers).toEqual({});
        var name = 'name';
        var value = 'value';
        IncomingResponse.addHeader(name, value);
        expect(IncomingResponse.headers[SIP.Utils.headerize(name)]).toEqual([{raw : value}]);
        expect(IncomingResponse.getHeaders(name).length).toEqual(1);
        expect(IncomingResponse.getHeaders(name)).toEqual([value]);
      });

      it('returns an array with all of the values if they exist for the header provided', function() {
        expect(IncomingResponse.headers).toEqual({});
        var name = 'name';
        var value1 = 'value1';
        IncomingResponse.addHeader(name,value1);
        var value2 = 'value2';
        IncomingResponse.addHeader(name,value2);
        expect(IncomingResponse.headers[SIP.Utils.headerize(name)]).toEqual([{raw : value1},{raw : value2}]);
        expect(IncomingResponse.getHeaders(name).length).toEqual(2);
        expect(IncomingResponse.getHeaders(name)).toEqual([value1, value2]);
      });
    });

    describe('.hasHeader', function() {
      it('returns true if the header exists', function() {
        expect(IncomingResponse.headers).toEqual({});
        var name = 'name';
        var value = 'value';
        IncomingResponse.addHeader(name,value);
        expect(IncomingResponse.headers[SIP.Utils.headerize(name)]).toEqual([{raw : value}]);
        expect(IncomingResponse.hasHeader(name)).toBe(true);
      });
      it('returns false if the header does not exist', function() {
        expect(IncomingResponse.headers).toEqual({});
        var name = 'name';
        expect(IncomingResponse.hasHeader(name)).toBe(false);
      });
    });

    describe('.parseHeader', function() {
      beforeEach(function() {
        IncomingResponse.logger = {};
        IncomingResponse.logger.log = jasmine.createSpy('log').and.returnValue('log');
        IncomingResponse.logger.warn = jasmine.createSpy('warn').and.returnValue('warn');
        spyOn(SIP.Grammar,'parse').and.callThrough();
      });

      it('returns undefined if the header does not exist in the headers object', function() {
        expect(IncomingResponse.headers).toEqual({});
        var name = 'name';
        expect(IncomingResponse.parseHeader(name)).toBeUndefined();
      });
      it('returns undefined if the idx is greater than the array for the header that exists', function() {
        expect(IncomingResponse.headers).toEqual({});
        var name = 'name';
        var value = 'value';
        IncomingResponse.addHeader(name,value);
        expect(IncomingResponse.headers[SIP.Utils.headerize(name)]).toEqual([{raw : value}]);
        var index = 1;
        expect(IncomingResponse.parseHeader(name,index)).toBeUndefined();
        expect(IncomingResponse.getHeaders(name).length).toBeGreaterThan(index-1);
      });

      it('returns the already parsed header if it exists', function() {
        expect(IncomingResponse.headers).toEqual({});
        var name = 'call-ID';
        var value = 'hnds3k17jhd1jank84hq';
        IncomingResponse.addHeader(name,value);
        expect(IncomingResponse.headers[SIP.Utils.headerize(name)]).toEqual([{raw : value}]);
        IncomingResponse.parseHeader(name,0);
        expect(SIP.Grammar.parse.calls.count()).toEqual(1);
        expect(IncomingResponse.logger.warn).not.toHaveBeenCalled();
        expect(IncomingResponse.headers[SIP.Utils.headerize(name)][0].parsed).toBeDefined();
        expect(IncomingResponse.parseHeader(name,0)).toBe(IncomingResponse.headers[SIP.Utils.headerize(name)][0].parsed);
        expect(SIP.Grammar.parse.calls.count()).toEqual(1);
      });

      it('returns a newly parsed header and creates a parsed property', function() {
        expect(IncomingResponse.headers).toEqual({});
        var name = 'call-ID';
        var value = 'hnds3k17jhd1jank84hq';
        IncomingResponse.addHeader(name,value);
        expect(IncomingResponse.headers[SIP.Utils.headerize(name)]).toEqual([{raw : value}]);
        expect(IncomingResponse.headers[SIP.Utils.headerize(name)][0].parsed).toBeUndefined();
        expect(IncomingResponse.parseHeader(name, 0)).toBe(value);
        expect(IncomingResponse.headers[SIP.Utils.headerize(name)][0].parsed).toBe(value);
      });
    });

    describe('.setHeader', function() {
      it('adds the header if it does not alredy exist', function() {
        expect(IncomingResponse.headers).toEqual({});
        var name = 'name';
        var value = 'value';
        IncomingResponse.setHeader(name,value);
        expect(IncomingResponse.headers[SIP.Utils.headerize(name)]).toEqual([{raw : value}]);
      });
      it('replaces a header that already exists', function() {
        expect(IncomingResponse.headers).toEqual({});
        var name = 'name';
        var value = 'value';
        IncomingResponse.setHeader(name,value);
        expect(IncomingResponse.headers[SIP.Utils.headerize(name)]).toEqual([{raw : value}]);
        var new_value = 'new_value';
        IncomingResponse.setHeader(name,new_value);
        expect(IncomingResponse.headers[SIP.Utils.headerize(name)]).not.toEqual([{raw : value}]);
        expect(IncomingResponse.headers[SIP.Utils.headerize(name)]).toEqual([{raw : new_value}]);
      });
    });

    describe('.toString', function() {
      it('returns the data instance variable', function() {
        var data = 'data';
        IncomingResponse.data = data;
        expect(IncomingResponse.toString()).toBe(data);
        expect(IncomingResponse.toString()).toBe(IncomingResponse.data);
      });
    });
  });
});
