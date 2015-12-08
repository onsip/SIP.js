describe("URI", function() {
  var URI;
  var scheme;
  var user;
  var host;
  var port;

  beforeEach(function() {
    scheme = null;
    user = 'alice';
    host = 'test.com';
    port = 5060;
    URI = new SIP.URI(scheme, user, host, port);
  });
  
  it("defines parameters", function() {
    expect(URI.parameters).toBeDefined();
  });
  
  it("defines headers", function() {
    expect(URI.parameters).toBeDefined();
  });

  it("sets the scheme", function() {
    expect(URI.scheme).toBe(scheme||SIP.C.SIP);
  });

  it("sets the user", function() {
    expect(URI.user).toBe(user);
  });
  
  it("sets the host", function() {
    expect(URI.host).toBe(host);
  });
  
  it("sets the port", function() {
    expect(URI.port).toBe(port);
  });

  describe(".setParam", function() {
    beforeEach(function() {
      URI.parameters = {};
    });

    it("does not set a parameter with a null key", function() {
      URI.setParam(null,"value");
      expect(URI.parameters).toEqual({});
    });
    
    it("sets a parameter with a null value", function() {
      URI.setParam("key",null);
      expect(URI.parameters).toEqual({"key":null});
    });
    
    it("sets a parameter with a key and value", function() {
      URI.setParam("key","value");
      expect(URI.parameters).toEqual({"key":"value"});
    });
    
    it("sets a parameter and make the key lowercase", function() {
      URI.setParam("KEY","value");
      expect(URI.parameters).toEqual({"key":"value"});
    });
    
    it("sets a parameter and make the parameter lowercase", function() {
      URI.setParam("key","VALUE");
      expect(URI.parameters).toEqual({"key":"value"});
    });
  });
  
  describe(".getParam", function() {
    beforeEach(function() {
      URI.parameters = {};
    });
    
    it("does not get a parameter for a null key", function() {
      URI.setParam("key","value");
      expect(URI.getParam(null)).toBeUndefined();
    });
    
    it("gets a parameter for a key", function() {
      URI.setParam("key","value");
      expect(URI.getParam("key")).toBe("value");
    });
    
    it("gets a parameter for a key that is uppercase", function() {
      URI.setParam("KEY","value");
      expect(URI.getParam("KEY")).toBe("value");
    });
    
  });
  
  describe(".hasParam", function() {
    beforeEach(function() {
      URI.parameters = {"key":"value"};
    });
    
    it("is undefined for a null key", function() {
      expect(URI.hasParam(null)).toBeUndefined();
    });
    
    it("is false for a parameter that does not exist", function() {
      expect(URI.hasParam("doesNotExist")).toBeFalsy();
    });
    
    it("is true for a parameter that does exist", function() {
      expect(URI.hasParam("key")).toBeTruthy();
    });
    
    it("is true for a parameter that does exist regardless of case", function() {
      expect(URI.hasParam("KEY")).toBeTruthy();
    });
  });
  
  describe(".deleteParam", function() {
    beforeEach(function() {
      URI.parameters = {"key" : "value", "key2" : "value2"};
    });
    
    it("deletes the entry from the parameters list", function() {
      URI.deleteParam("key");
      expect(URI.hasParam("key")).toBeFalsy();
    });
    
    it("returns the value of the deleted key", function() {
      expect(URI.deleteParam("key")).toEqual("value");
    });
    
    it("does not delete a key that does not exist", function() {
      URI.deleteParam("does not exist");
      expect(URI.parameters).toEqual({"key" : "value", "key2" : "value2"});
    });
    
    it("does not return a value if the key does not exist", function() {
      expect(URI.deleteParam("does not exist")).toBeUndefined();
    });
  });
  
  describe(".clearParams", function() {
    beforeEach(function() {
      URI.parameters = {"key" : "value", "key2" : "value2"};
    });
    
    it("empties the parameter list", function() {
      URI.clearParams();
      expect(URI.parameters).toEqual({});
    });
    
    it("does not make the parameter list undefined", function() {
      URI.clearParams();
      expect(URI.parameters).toBeDefined();
    });
  });
  
  describe(".setHeader", function() {
    it("adds the header if it does not exist", function() {
      expect(URI.headers).toEqual({});
      var name = 'name';
      var value = 'value';
      URI.setHeader(name, value);
      expect(URI.headers).toEqual({Name : [value]});
    });
    
    it("replaces the header if it already exists", function() {
      expect(URI.headers).toEqual({});
      var name = 'name';
      var value1 = 'value1';
      URI.setHeader(name, value1);
      expect(URI.headers).toEqual({Name : [value1]});
      var value2 = 'value2';
      URI.setHeader(name, value2);
      expect(URI.headers).not.toEqual({Name : [value1]});
      expect(URI.headers).toEqual({Name : [value2]});
    });
  });
  
  describe(".getHeader", function() {
    it("returns undefined if the header does not exist", function() {
      expect(URI.headers).toEqual({});
      expect(URI.getHeader('anything')).toBeUndefined();
    });
    
    it('returns an array of the header that it found', function() {
      expect(URI.headers).toEqual({});
      var name = 'name';
      var value = 'value';
      URI.setHeader(name, value);
      expect(URI.headers).toEqual({Name : [value]});
      expect(URI.getHeader(name)).toEqual([value]);
    });
  });
  
  describe(".hasHeader", function() {
    it("returns true if the header exists", function() {
      expect(URI.headers).toEqual({});
      var name = 'name';
      var value = 'value';
      URI.setHeader(name, value);
      expect(URI.headers).toEqual({Name : [value]});
      expect(URI.hasHeader(name)).toBe(true);
    });
    it('returns false if the header does not exist', function() {
      expect(URI.headers).toEqual({});
      expect(URI.hasHeader('anything')).toBe(false);
    });
  });
  
  describe(".deleteHeader", function() {
    it("deletes the given header from the headers list", function() {
      expect(URI.headers).toEqual({});
      var name1 = 'name1';
      var value1 = 'value1';
      var name2 = 'name2';
      var value2 = 'value2';
      URI.setHeader(name1,value1);
      URI.setHeader(name2,value2);
      expect(URI.headers).toEqual({Name1 : [value1], Name2 : [value2]});
      URI.deleteHeader(name1);
      expect(URI.headers).not.toEqual({Name1 : [value1], Name2 : [value2]})
      expect(URI.headers).toEqual({Name2 : [value2]});
    });
    
    it("returns the deleted value", function() {
      expect(URI.headers).toEqual({});
      var name1 = 'name1';
      var value1 = 'value1';
      var name2 = 'name2';
      var value2 = 'value2';
      URI.setHeader(name1,value1);
      URI.setHeader(name2,value2);
      expect(URI.headers).toEqual({Name1 : [value1], Name2 : [value2]});
      expect(URI.deleteHeader(name1)).toEqual([value1]);
      expect(URI.headers).not.toEqual({Name1 : [value1], Name2 : [value2]})
      expect(URI.headers).toEqual({Name2 : [value2]});
    });
    
    it('does not delete anything if it cannot find the header', function() {
      expect(URI.headers).toEqual({});
      var name1 = 'name1';
      var value1 = 'value1';
      var name2 = 'name2';
      var value2 = 'value2';
      URI.setHeader(name1,value1);
      URI.setHeader(name2,value2);
      expect(URI.headers).toEqual({Name1 : [value1], Name2 : [value2]});
      expect(URI.deleteHeader('name3')).toBeUndefined();
      expect(URI.headers).toEqual({Name1 : [value1], Name2 : [value2]});
    });
  });
  
  describe(".clearHeaders", function() {
    it("should remove all the headers from the headers variable", function() {
      expect(URI.headers).toEqual({});
      var name1 = 'name1';
      var value1 = 'value1';
      var name2 = 'name2';
      var value2 = 'value2';
      URI.setHeader(name1,value1);
      URI.setHeader(name2,value2);
      expect(URI.headers).toEqual({Name1 : [value1], Name2 : [value2]});
      URI.clearHeaders();
      expect(URI.headers).toEqual({});
    });
  });
  
  it(".clone: be able to clone itself", function() {
    var clonedURI = URI.clone();
    
    expect(clonedURI).toBeDefined();
    
    expect(clonedURI).toEqual(URI);
    
    expect(clonedURI.scheme).toEqual(URI.scheme);
    expect(clonedURI.user).toEqual(URI.user);
    expect(clonedURI.host).toEqual(URI.host);
    expect(clonedURI.port).toEqual(URI.port);
    expect(clonedURI.parameters).toEqual(URI.parameters);
    expect(clonedURI.headers).toEqual(URI.headers);

    expect(clonedURI._raw.scheme).toEqual(URI._raw.scheme);
    expect(clonedURI._raw.user).toEqual(URI._raw.user);
    expect(clonedURI._raw.host).toEqual(URI._raw.host);
    expect(clonedURI._raw.port).toEqual(URI._raw.port);
  });
  
  it(".toString: be able to create a string of itself", function() {
    expect(typeof URI.toString()).toEqual("string");
  });
  
  it("should parse a URI from a valid string", function() {
    var parsedURI = SIP.URI.parse("sip:"+user+"@"+host);
    
    expect(parsedURI).toBeDefined();
    
    expect(parsedURI).toEqual(URI);
    
    expect(parsedURI.user).toEqual(user);
    expect(parsedURI.user).toEqual(URI.user);
    
    expect(parsedURI.host).toEqual(host);
    expect(parsedURI.host).toEqual(URI.host);
  });
  
  it(".parse does not parse a URI from an invalid string", function() {
    var parsedURI = SIP.URI.parse(user+host);
    
    expect(parsedURI).toBeUndefined();
  });

  var toParse = 'SIP:%61liCE@versaTICA.Com:6060;TRansport=TCp;Foo=ABc;baz?X-Header-1=AaA1&X-Header-2=BbB&x-header-1=AAA2';

  describe('URI.parse with "' + toParse + '"', function () {
    var uri;

    beforeEach(function () {
      uri = SIP.URI.parse(toParse);
    });

    it('produces a SIP.URI', function () {
      expect(uri instanceof(SIP.URI)).toBeTruthy();
    });

    function itParses (property, expected) {
      it('parses the ' + property, function () {
        expect(uri[property]).toEqual(expected);
      });
    }

    itParses('scheme', 'sip');
    itParses('user', 'aliCE');
    itParses('host', 'versatica.com');
    itParses('port', 6060);

    it('parses non-null parameter "transport"', function () {
      expect(uri.hasParam('transport')).toEqual(true);
      expect(uri.getParam('transport')).toEqual('tcp');
    });

    it('doesn\'t parse missing parameter "nooo"', function () {
      expect(uri.hasParam('nooo')).toEqual(false);
      expect(uri.getParam('nooo')).toEqual(undefined);
    });

    function itsMethod (testName, methodName, methodArg, expected) {
      it(testName, function () {
        expect(uri[methodName](methodArg)).toEqual(expected);
      });
    }

    itsMethod('parses non-null parameter foo', 'getParam', 'foo', 'abc');
    itsMethod('parses null parameter baz', 'getParam', 'baz', null);
    itsMethod('parses header list x-header-1', 'getHeader', 'x-header-1', ['AaA1', 'AAA2']);
    itsMethod('parses header X-HEADER-2', 'getHeader', 'X-HEADER-2', ['BbB']);
    itsMethod('doesn\'t parse missing header "nooo"', 'getHeader', 'nooo', undefined);
    itsMethod('correctly toString()s itself', 'toString', undefined, 'sip:aliCE@versatica.com:6060;transport=tcp;foo=abc;baz?X-Header-1=AaA1&X-Header-1=AAA2&X-Header-2=BbB');
    itsMethod('correctly toRaw()s itself', 'toRaw', undefined, 'SIP:aliCE@versaTICA.Com:6060;transport=tcp;foo=abc;baz?X-Header-1=AaA1&X-Header-1=AAA2&X-Header-2=BbB');

    var newUser = 'Iñaki:PASSWD';
    describe('when setting the user to "' + newUser + '"', function () {
      beforeEach(function () {
        uri.user = newUser;
      });

      it('sets the user correctly', function () {
        expect(uri.user).toEqual(newUser);
      });

      it('can delete parameter "foo" and delete header "x-header-1"', function () {
        expect(uri.deleteParam('foo')).toEqual('abc');
        expect(uri.deleteHeader('x-header-1')).toEqual(['AaA1', 'AAA2']);
        expect(uri.toString()).toEqual('sip:I%C3%B1aki:PASSWD@versatica.com:6060;transport=tcp;baz?X-Header-2=BbB');
      });

      it('can clear parameters and headers, and nullify the port', function () {
        uri.clearParams();
        uri.clearHeaders();
        uri.port = null;
        expect(uri.toString()).toEqual('sip:I%C3%B1aki:PASSWD@versatica.com');
      });
    });
  });
});
