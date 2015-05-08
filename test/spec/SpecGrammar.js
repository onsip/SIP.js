describe('Grammar', function () {
  function itHas (objThunk, property, value) {
    var testName = 'has ' + property + ': ' + JSON.stringify(value);
    it(testName, function () {
      expect(objThunk()[property]).toEqual(value);
    });
  }

  function itsMethodReturns (objThunk, methodName, methodArg, expected) {
    var testName = methodName + '("' + methodArg + '") is ' + JSON.stringify(expected);
    it(testName, function () {
      expect(objThunk()[methodName](methodArg)).toEqual(expected);
    });
  }

  var contactString = '"Iñaki @ł€" <SIP:+1234@ALIAX.net;Transport=WS>;+sip.Instance="abCD", sip:bob@biloxi.COM;headerParam, <sips:DOMAIN.com:5>';
  describe("Contacts parsed from '" + contactString + "'", function () {
    var contacts;

    beforeEach(function () {
      contacts = SIP.Grammar.parse(contactString, 'Contact');
      expect(contacts.length).toEqual(3);
    });

    describe('first contact', function () {
      var c1;

      beforeEach(function () {
        c1 = contacts[0].parsed;
      });

      it('is a NameAddrHeader', function () {
        expect(c1 instanceof(SIP.NameAddrHeader)).toBeTruthy();
      });

      it('has the display name', function () {
        expect(c1.displayName).toEqual('Iñaki @ł€');
      });

      it('has parameter +sip.instance set to "abCD"', function () {
        var paramName = '+sip.instance';
        expect(c1.hasParam(paramName)).toBeTruthy();
        expect(c1.getParam(paramName)).toEqual('"abCD"');
      });

      it('doesn\'t have parameter nooo', function () {
        var paramName = 'nooo';
        expect(c1.hasParam(paramName)).toBeFalsy();
        expect(c1.getParam(paramName)).toBeUndefined();
      });

      describe('its URI', function () {
        var uriThunk = function () { return c1.uri; };
        it('is a SIP.URI', function () {
          expect(uriThunk() instanceof(SIP.URI)).toBeTruthy();
        });

        var uriHas = itHas.bind(null, uriThunk);
        var uriReturns = itsMethodReturns.bind(null, uriThunk);

        uriHas('scheme', 'sip');
        uriHas('user', '+1234');
        uriHas('host', 'aliax.net');
        uriHas('port', undefined);

        uriReturns('getParam', 'transport', 'ws');
        uriReturns('getParam', 'foo', undefined);
        uriReturns('getHeader', 'X-Header', undefined);
      });

      it('can alter display name and URI parameters', function () {
        c1.displayName = '€€€';
        expect(c1.displayName).toEqual('€€€');
        c1.uri.user = '+999';
        expect(c1.uri.user).toEqual('+999');
        c1.setParam('+sip.instance', '"zxCV"');
        expect(c1.getParam('+SIP.instance')).toEqual('"zxCV"');
        c1.setParam('New-Param', null);
        expect(c1.hasParam('NEW-param')).toEqual(true);
        c1.uri.setParam('New-Param', null);
        expect(c1.toString()).toEqual('"€€€" <sip:+999@aliax.net;transport=ws;new-param>;+sip.instance="zxCV";new-param');
      });
    });

    describe('second contact', function () {
      var c2;

      beforeEach(function () {
        c2 = contacts[1].parsed;
      });

      var c2Thunk = function () { return c2; };
      var c2Has = itHas.bind(null, c2Thunk);
      var c2Returns = itsMethodReturns.bind(null, c2Thunk);

      c2Has('displayName', undefined);

      c2Returns('hasParam', 'HEADERPARAM', true);
      c2Returns('toString', null, '<sip:bob@biloxi.com>;headerparam');

      describe('its URI', function () {
        var uriThunk = function () { return c2.uri; };
        it('is a SIP.URI', function () {
          expect(uriThunk() instanceof(SIP.URI)).toBeTruthy();
        });

        var uriHas = itHas.bind(null, uriThunk);

        uriHas('scheme', 'sip');
        uriHas('user', 'bob');
        uriHas('host', 'biloxi.com');
        uriHas('port', undefined);

        itsMethodReturns(uriThunk, 'hasParam', 'headerParam', false);

        it('can alter display name', function () {
          c2.displayName = '@ł€ĸłæß';
          expect(c2.toString()).toEqual('"@ł€ĸłæß" <sip:bob@biloxi.com>;headerparam');
        });
      });
    });

    describe('third contact', function () {
      var c3;

      beforeEach(function () {
        c3 = contacts[2].parsed;
      });

      var c3Thunk = function () { return c3; };
      itHas(c3Thunk, 'displayName', undefined);
      itsMethodReturns(c3Thunk, 'toString', null, '<sips:domain.com:5>');

      describe('its URI', function () {
        var uriThunk = function () { return c3.uri; };
        it('is a SIP.URI', function () {
          expect(uriThunk() instanceof(SIP.URI)).toBeTruthy();
        });

        var uriHas = itHas.bind(null, uriThunk);

        uriHas('scheme', 'sips');
        uriHas('user', undefined);
        uriHas('host', 'domain.com');
        uriHas('port', 5);

        itsMethodReturns(uriThunk, 'hasParam', 'nooo', false);

        it('can set header params and uri params', function () {
          c3.uri.setParam('newUriParam', 'zxCV');
          c3.setParam('newHeaderParam', 'zxCV');
          expect(c3.toString()).toEqual('<sips:domain.com:5;newuriparam=zxcv>;newheaderparam=zxCV');
        });
      });
    });
  });

  var viaString = 'SIP /  3.0 \r\n / UDP [1:ab::FF]:6060 ;\r\n  BRanch=1234;Param1=Foo;paRAM2;param3=Bar';
  describe('Via parsed from "' + viaString + '"', function () {
    var via;

    beforeEach(function () {
      via = SIP.Grammar.parse(viaString, 'Via');
    });

    var viaHas = itHas.bind(null, function () { return via; });

    viaHas('protocol', 'SIP');
    viaHas('transport', 'UDP');
    viaHas('host', '[1:ab::FF]');
    viaHas('host_type', 'IPv6');
    viaHas('port', 6060);
    viaHas('branch', '1234');
    viaHas('params', {param1: 'Foo', param2: undefined, param3: 'Bar'});
  });

  var cseqString = '123456  CHICKEN';
  describe('CSeq parsed from "' + cseqString + '"', function () {
    var cseq;

    beforeEach(function () {
      cseq = SIP.Grammar.parse(cseqString, 'CSeq');
    });

    var cseqHas = itHas.bind(null, function () { return cseq; });

    cseqHas('value', 123456);
    cseqHas('method', 'CHICKEN');
  });

  var challengeString = 'Digest realm =  "[1:ABCD::abc]", nonce =  "31d0a89ed7781ce6877de5cb032bf114", qop="AUTH,autH-INt", algorithm =  md5  ,  stale =  TRUE , opaque = "00000188"';
  describe("challenge parsed from '" + challengeString + "'", function () {
    var challenge;

    beforeEach(function () {
      challenge = SIP.Grammar.parse(challengeString, 'challenge');
    });

    var challengeHas = itHas.bind(null, function () { return challenge; });

    challengeHas('realm', '[1:ABCD::abc]');
    challengeHas('nonce', '31d0a89ed7781ce6877de5cb032bf114');
    challengeHas('qop', ['auth', 'auth-int']);
    challengeHas('algorithm', 'MD5');
    challengeHas('stale', true);
    challengeHas('opaque', '00000188');
  });

  var eventString = 'Presence.winfo;Param1=QWe;paraM2';
  describe('Event parsed from "' + eventString + '"', function () {
    var evt;

    beforeEach(function () {
      evt = SIP.Grammar.parse(eventString, 'Event');
    });

    eventHas = itHas.bind(null, function () { return evt; });

    eventHas('event', 'presence.winfo');
    eventHas('params', {param1: 'QWe', param2: undefined});
  });

  describe('Content-Disposition', function () {
    ['session', 'render'].forEach(function (dispString) {
      itHas(
        SIP.Grammar.parse.bind(SIP.Grammar, dispString, 'Content_Disposition'),
        'type',
        dispString
      );
    })
  });

  var uuidString = "f6e15cd0-17ed-11e4-8c21-0800200c9a66";
  describe('parsing a UUID', function () {
    it('returns the input for correct UUIDs', function () {
      expect(SIP.Grammar.parse(uuidString, 'uuid')).toEqual(uuidString);
    });

    it('returns -1 for incorrect UUIDs', function () {
      expect(SIP.Grammar.parse("XXX bad UUID XXX", 'uuid')).toEqual(-1);
    });
  });

  describe('Replaces', function () {
    var goods = [
      '98732@sip.example.com\r\n' +
'          ;from-tag=r33th4x0r\r\n' +
'          ;to-tag=ff87ff',
      '12adf2f34456gs5;to-tag=12345;from-tag=54321;early-only', // early
      '12adf2f34456gs5;baz;to-tag=12345;early-only;from-tag=54321', //early
      '87134@171.161.34.23;to-tag=24796;from-tag=0',
      '87134@171.161.34.23;to-tag=24796;from-tag=0;foo=bar'
    ];

    var goodIds = [
      '98732@sip.example.com',
      '12adf2f34456gs5',
      '12adf2f34456gs5',
      '87134@171.161.34.23',
      '87134@171.161.34.23',
    ];

    var goodFroms = [
      'r33th4x0r',
      '54321',
      '54321',
      '0',
      '0'
    ];

    var goodTos = [
      'ff87ff',
      '12345',
      '12345',
      '24796',
      '24796'
    ];

    var bads = [
      '12adf2f34456gs5;to-tag1=12345;from-tag=54321;early-only',
      '12adf2f34456gs5;baz;to-tag=12345;from-tag=54321;',
      '87134@171.161.34.23;to-tag=24796;from-tag',
      '87134@171.161.34.23;to-tag;from-tag=0;foo=bar'
    ];

    it('parses the good examples', function () {
      for (var i = 0; i < goods.length; i++) {
        var parsed = SIP.Grammar.parse(goods[i], 'Replaces');
        expect(parsed).not.toEqual(-1);
        expect(parsed.call_id).toEqual(goodIds[i]);
        expect(parsed.replaces_from_tag).toEqual(goodFroms[i]);
        expect(parsed.replaces_to_tag).toEqual(goodTos[i]);
        expect(parsed.early_only || false).toEqual(i == 1 || i == 2);
      }
    });

    it('rejects the bad examples', function () {
      for (var i = 0; i < bads.length; i++) {
        expect(SIP.Grammar.parse(bads[i], 'Replaces')).toEqual(-1);
      }
    });
  });
});
