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
    expect(name.display_name).toBe(displayName);
  });

  it('can create a string of itself', function() {
    //expect(name.toString()).toEqual('"Alice æßð" <sip:alice@sip.js.net>');
    expect(name.toString()).toEqual(toStringAll);
  });
  
  it('can set the display name to null', function () {
    name.display_name = null;
    expect(name.toString()).toEqual(toStringUri);
  });
  
  it('can set the display name to 0', function () {
    name.display_name = 0;
    expect(name.toString()).toEqual('"0" ' + toStringUri);
  });
  
  it('can set the display name to ""', function () {
    name.display_name = "";
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
      name2.display_name = newDisplayName;
      expect(name2.display_name).toEqual(newDisplayName);
    });

    it('has an undefined user', function () {
      expect(name.user).toBeUndefined();
    });
  });
});
