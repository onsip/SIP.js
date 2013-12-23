describe('Grammar', function () {
  function itHas (objThunk, property, value) {
    var quote = (typeof value === 'string') ? '"' : ''
    it('has ' + property + ': ' + quote + value + quote, function () {
      expect(objThunk()[property]).toEqual(value);
    });
  }

  function itsMethodReturns (objThunk, methodName, methodArg, expected) {
    var quote = (typeof expected === 'string') ? '"' : '';
    var testName = methodName + '("' + methodArg + '") is ' + quote + expected + quote;
    it(testName, function () {
      expect(objThunk()[methodName].call(objThunk(), methodArg)).toEqual(expected);
    });
  }

  var contactString = '"Iñaki @ł€" <SIP:+1234@ALIAX.net;Transport=WS>;+sip.Instance="abCD", sip:bob@biloxi.COM;headerParam, <sip:DOMAIN.com:5>';
  describe('Contacts parsed from ' + contactString, function () {
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
        expect(c1.display_name).toEqual('Iñaki @ł€');
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
        c1.display_name = '€€€';
        expect(c1.display_name).toEqual('€€€');
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

      c2Has('display_name', undefined);

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
          c2.display_name = '@ł€ĸłæß';
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
      itHas(c3Thunk, 'display_name', undefined);
      itsMethodReturns(c3Thunk, 'toString', null, '<sip:domain.com:5>');

      describe('its URI', function () {
        var uriThunk = function () { return c3.uri; };
        it('is a SIP.URI', function () {
          expect(uriThunk() instanceof(SIP.URI)).toBeTruthy();
        });

        var uriHas = itHas.bind(null, uriThunk);

        uriHas('scheme', 'sip');
        uriHas('user', undefined);
        uriHas('host', 'domain.com');
        uriHas('port', 5);

        itsMethodReturns(uriThunk, 'hasParam', 'nooo', false);

        it('can set header params and uri params', function () {
          c3.uri.setParam('newUriParam', 'zxCV');
          c3.setParam('newHeaderParam', 'zxCV');
          expect(c3.toString()).toEqual('<sip:domain.com:5;newuriparam=zxcv>;newheaderparam=zxCV');
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

  var eventString = 'Presence;Param1=QWe;paraM2';
  describe('Event parsed from "' + eventString + '"', function () {
    var evt;

    beforeEach(function () {
      evt = SIP.Grammar.parse(eventString, 'Event');
    });

    eventHas = itHas.bind(null, function () { return evt; });

    eventHas('event', 'presence');
    eventHas('params', {param1: 'QWe', param2: undefined});
  });
});
