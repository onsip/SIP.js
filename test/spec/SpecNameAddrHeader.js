describe('NameAddrHeader', function() {
  var name;
  var name2;
  var uri;

  var scheme = 'sip';
  var user = 'alice';
  var host = 'sip.js.net';
  var displayName = 'Alice æßð';

  var toStringUri = '<' + scheme + ':' + user + '@' + host + '>';
  var toStringAll = '"' + displayName + '" ' + toStringUri;

  beforeEach(function() {
    uri = new SIP.URI(scheme, user, host);
    name = new SIP.NameAddrHeader(uri, displayName);
  });

  it('has the display name', function () {
    expect(name.displayName).toBe(displayName);
  });

  it('can create a string of itself', function() {
    expect(name.toString()).toEqual(toStringAll);
  });
  
  it('can set the display name to null', function () {
    name.displayName = null;
    expect(name.toString()).toEqual(toStringUri);
  });
  
  it('can set the display name to 0', function () {
    name.displayName = 0;
    expect(name.toString()).toEqual('"0" ' + toStringUri);
  });
  
  it('can set the display name to ""', function () {
    name.displayName = "";
    expect(name.toString()).toEqual(toStringUri);
  });

  it('has an empty parameters object', function () {
    expect(name.parameters).toEqual({});
  });

  describe('when setting parameter Foo to null', function () {
    beforeEach(function () {
      name.setParam('Foo', null);
    });

    it('has parameter FOO', function () {
      expect(name.hasParam('FOO')).toBe(true);
    });

    describe('when setting parameter Baz to 123', function () {
      beforeEach(function () {
        name.setParam('Baz', 123);
      });

      it('has parameter baz set to "123"', function () {
        expect(name.getParam('baz')).toEqual('123');
      });

      it('can create a string of itself', function () {
        expect(name.toString()).toEqual(toStringAll + ';foo;baz=123');
      });

      it('can delete parameter bAz', function () {
        expect(name.deleteParam('bAz')).toEqual('123');
      });

      it('can clear its parameters', function () {
        name.clearParams();
        expect(name.toString()).toEqual(toStringAll);
      });
    });
  });

  describe('when cloning itself', function () {
    beforeEach(function () {
      name2 = name.clone();
    });

    it('has the same string representation as its clone', function () {
      expect(name2.toString()).toEqual(name.toString());
    });

    it('can set the display name of the clone', function () {
      var newDisplayName= '@ł€';
      name2.displayName = newDisplayName;
      expect(name2.displayName).toEqual(newDisplayName);
    });

    it('has an undefined user', function () {
      expect(name.user).toBeUndefined();
    });
  });

  var toParse = '"Iñaki ðđøþ" <SIP:%61liCE@versaTICA.Com:6060;TRansport=TCp;Foo=ABc;baz?X-Header-1=AaA1&X-Header-2=BbB&x-header-1=AAA2>;QWE=QWE;ASd';

  describe("when calling NameAddrHeader.parse('" + toParse + "')", function () {
    var header;

    beforeEach(function () {
      header = SIP.NameAddrHeader.parse(toParse);
    });

    it('returns a SIP.NameAddrHeader', function () {
      expect(header instanceof(SIP.NameAddrHeader)).toBeTruthy();
    });

    it('parses the display name', function () {
      expect(header.displayName).toEqual('Iñaki ðđøþ');
    });

    function itsMethod (testName, methodName, methodArg, expected) {
      it(testName, function () {
        expect(header[methodName](methodArg)).toEqual(expected);
      });
    }

    itsMethod('has parameter "qwe"', 'hasParam', 'qwe', true);
    itsMethod('gets parameter "qwe" as "QWE"', 'getParam', 'qwe', 'QWE');
    itsMethod('has parameter "asd"', 'hasParam', 'asd', true);
    itsMethod('gets parameter "asd" as null', 'getParam', 'asd', null);
    itsMethod('doesn\'t have parameter "nooo"', 'hasParam', 'nooo', false);

    var newDispName = "Foo Bar";
    it('can set the display name to "' + newDispName + '"', function () {
      header.displayName = newDispName;
      expect(header.displayName).toEqual(newDispName);
    });

    newDispName = null;
    it('can set the display name to ' + newDispName, function () {
      header.displayName = newDispName;
      expect(header.displayName).toEqual(newDispName);
      expect(header.toString()).toEqual('<sip:aliCE@versatica.com:6060;transport=tcp;foo=abc;baz?X-Header-1=AaA1&X-Header-1=AAA2&X-Header-2=BbB>;qwe=QWE;asd');
    });

    describe('its URI:', function () {
      function itsUriParses (property, expected) {
        it('parses the ' + property, function () {
          expect(header.uri[property]).toEqual(expected);
        });
      }

      itsUriParses('scheme', 'sip');
      itsUriParses('user', 'aliCE');
      itsUriParses('host', 'versatica.com');
      itsUriParses('port', 6060);

      function itsUriMethod (methodName, methodArg, expected) {
        var testName = methodName + '("' + methodArg + '") is ' + JSON.stringify(expected);
        it(testName, function () {
          expect(header.uri[methodName](methodArg)).toEqual(expected);
        });
      }

      itsUriMethod('hasParam', 'transport', true);
      itsUriMethod('getParam', 'transport', 'tcp');
      itsUriMethod('hasParam', 'nooo', false);
      itsUriMethod('getParam', 'foo', 'abc');
      itsUriMethod('getParam', 'baz', null);
      itsUriMethod('getParam', 'noo', undefined);
      itsUriMethod('getHeader', 'x-header-1', ['AaA1', 'AAA2']);
      itsUriMethod('getHeader', 'X-HEADER-2', ['BbB']);
      itsUriMethod('getHeader', 'nooo', undefined);
    });
  });
});
