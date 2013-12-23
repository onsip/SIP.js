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
  
  it("should have defined parameters", function() {
    expect(URI.parameters).toBeDefined();
  });
  
  it("should have defined headers", function() {
    expect(URI.parameters).toBeDefined();
  });

  it("should have the scheme", function() {
    expect(URI.scheme).toBe(scheme||SIP.C.SIP);
  });

  it("should have the user", function() {
    expect(URI.user).toBe(user);
  });
  
  it("should have the host", function() {
    expect(URI.host).toBe(host);
  });
  
  it("should have the port", function() {
    expect(URI.port).toBe(port);
  });

  describe("when setting the parameters", function() {
    beforeEach(function() {
      URI.parameters = {};
    });

    it("should not set a parameter with a null key", function() {
      URI.setParam(null,"value");
      expect(URI.parameters).toEqual({});
    });
    
    it("should set a parameter with a null value", function() {
      URI.setParam("key",null);
      expect(URI.parameters).toEqual({"key":null});
    });
    
    it("should set a parameter with a key and value", function() {
      URI.setParam("key","value");
      expect(URI.parameters).toEqual({"key":"value"});
    });
    
    it("should set a parameter and make the key lowercase", function() {
      URI.setParam("KEY","value");
      expect(URI.parameters).toEqual({"key":"value"});
    });
    
    it("should set a parameter and make the parameter lowercase", function() {
      URI.setParam("key","VALUE");
      expect(URI.parameters).toEqual({"key":"value"});
    });
  });
  
  describe("when getting the parameters", function() {
    beforeEach(function() {
      URI.parameters = {};
    });
    
    it("should not get a parameter for a null key", function() {
      URI.setParam("key","value");
      expect(URI.getParam(null)).toBeUndefined();
    });
    
    it("should get a parameter for a key", function() {
      URI.setParam("key","value");
      expect(URI.getParam("key")).toBe("value");
    });
    
    it("should get a parameter for a key that is uppercase", function() {
      URI.setParam("KEY","value");
      expect(URI.getParam("KEY")).toBe("value");
    });
    
  });
  
  describe("when checking for parameters", function() {
    beforeEach(function() {
      URI.parameters = {"key":"value"};
    });
    
    it("should be undefined for a null key", function() {
      expect(URI.hasParam(null)).toBeUndefined();
    });
    
    it("should be false for a parameter that does not exist", function() {
      expect(URI.hasParam("doesNotExist")).toBeFalsy();
    });
    
    it("should be true for a parameter that does exist", function() {
      expect(URI.hasParam("key")).toBeTruthy();
    });
    
    it("should be true for a parameter that does exist regardless of case", function() {
      expect(URI.hasParam("KEY")).toBeTruthy();
    });
  });
  
  describe("when deleting parameters", function() {
    beforeEach(function() {
      URI.parameters = {"key" : "value", "key2" : "value2"};
    });
    
    it("should delete the entry from the parameters list", function() {
      URI.deleteParam("key");
      expect(URI.hasParam("key")).toBeFalsy();
    });
    
    it("should return the value of the deleted key", function() {
      expect(URI.deleteParam("key")).toEqual("value");
    });
    
    it("should not delete a key that does not exist", function() {
      URI.deleteParam("does not exist");
      expect(URI.parameters).toEqual({"key" : "value", "key2" : "value2"});
    });
    
    it("should not return a value if the key does not exist", function() {
      expect(URI.deleteParam("does not exist")).toBeUndefined();
    });
  });
  
  describe("when clearing parameters", function() {
    beforeEach(function() {
      URI.parameters = {"key" : "value", "key2" : "value2"};
    });
    
    it("should empty the parameter list", function() {
      URI.clearParams();
      expect(URI.parameters).toEqual({});
    });
    
    it("should not make the parameter list undefined", function() {
      URI.clearParams();
      expect(URI.parameters).toBeDefined();
    });
  });
  
  describe("when setting headers", function() {
    it("should test something", function() {
      true;
    });
  });
  
  describe("when getting headers", function() {
    it("should test something", function() {
      true;
    });
  });
  
  describe("when checking for headers", function() {
    it("should test something", function() {
      true;
    });
  });
  
  describe("when deleting headers", function() {
    it("should test something", function() {
      true;
    });
  });
  
  describe("when clearing headers", function() {
    it("should test something", function() {
      true;
    });
  });
  
  it("should be able to clone itself", function() {
    var clonedURI = URI.clone();
    
    expect(clonedURI).toBeDefined();
    
    expect(clonedURI).toEqual(URI);
    
    expect(clonedURI.scheme).toEqual(URI.scheme);
    expect(clonedURI.user).toEqual(URI.user);
    expect(clonedURI.host).toEqual(URI.host);
    expect(clonedURI.port).toEqual(URI.port);
    expect(clonedURI.parameters).toEqual(URI.parameters);
    expect(clonedURI.headers).toEqual(URI.headers);
  });
  
  it("should be able to create a string of itself", function() {
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
  
  it("should not parse a URI from an invalid string", function() {
    var parsedURI = SIP.URI.parse(user+host);
    
    expect(parsedURI).toBeUndefined();
  });

  var toParse = 'SIP:%61liCE@versaTICA.Com:6060;TRansport=TCp;Foo=ABc;baz?X-Header-1=AaA1&X-Header-2=BbB&x-header-1=AAA2';

  describe('when calling URI.parse with "' + toParse + '"', function () {
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

    function itsMethod (testName, methodName, argArray, expected) {
      it(testName, function () {
        expect(uri[methodName].apply(uri, argArray)).toEqual(expected);
      });
    }

    itsMethod('parses non-null parameter foo', 'getParam', ['foo'], 'abc');
    itsMethod('parses null parameter baz', 'getParam', ['baz'], null);
    itsMethod('parses header list x-header-1', 'getHeader', ['x-header-1'], ['AaA1', 'AAA2']);
    itsMethod('parses header X-HEADER-2', 'getHeader', ['X-HEADER-2'], ['BbB']);
    itsMethod('doesn\'t parse missing header "nooo"', 'getHeader', ['nooo'], undefined);
    itsMethod('correctly toString()s itself', 'toString', [], 'sip:aliCE@versatica.com:6060;transport=tcp;foo=abc;baz?X-Header-1=AaA1&X-Header-1=AAA2&X-Header-2=BbB');

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
