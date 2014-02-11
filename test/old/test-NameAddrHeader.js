test('SIP.NameAddrHeader', function() {
  var name, uri;

  uri = new SIP.URI('sip', 'alice', 'sip.js.net');
  name = new SIP.NameAddrHeader(uri, 'Alice æßð');

  strictEqual(name.displayName, 'Alice æßð');
  strictEqual(name.toString(), '"Alice æßð" <sip:alice@sip.js.net>');

  name.displayName = null;
  strictEqual(name.toString(), '<sip:alice@sip.js.net>');

  name.displayName = 0;
  strictEqual(name.toString(), '"0" <sip:alice@sip.js.net>');

  name.displayName = "";
  strictEqual(name.toString(), '<sip:alice@sip.js.net>');

  deepEqual(name.parameters, {});

  name.setParam('Foo', null);
  strictEqual(name.hasParam('FOO'), true);

  name.setParam('Baz', 123);
  strictEqual(name.getParam('baz'), '123');
  strictEqual(name.toString(), '<sip:alice@sip.js.net>;foo;baz=123');

  strictEqual(name.deleteParam('bAz'), '123');

  name.clearParams();
  strictEqual(name.toString(), '<sip:alice@sip.js.net>');

  var name2 = name.clone();
  strictEqual(name2.toString(), name.toString());
  name2.displayName = '@ł€';
  strictEqual(name2.displayName, '@ł€');
  strictEqual(name.user, undefined);
});

