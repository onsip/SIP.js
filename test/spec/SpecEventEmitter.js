describe('EventEmitter', function () {
  var EventEmitter,
      setA = ['aaa', 'bbb', 'ccc'],
      setB = ['ddd', 'eee', 'fff'],
      setC = ['111', '222', '333', '444', '555', '666', '777', '888', '999', '000'],
      setD = setC.concat(setA).concat(setB);

  function expectAll(array, value, map) {
    map || (map = function (i) { return i; });

    for (var i in array) {
      expect(map(array[i])).toBe(value);
    }
  }

  beforeEach(function () {
    EventEmitter = new SIP.EventEmitter();
    EventEmitter.logger = {
      error: function () {},
      warn: function () {},
      log: function () {}
    };
  });

  it('starts with no events', function () {
    expect(EventEmitter.events).toBe(undefined);
  });

  it('checks for events with listeners', function () {
    EventEmitter.removeAllListeners();
    expect(EventEmitter.listeners('aaa').length).toBe(0);

    EventEmitter.on('aaa', function () {});

    expect(EventEmitter.listeners('aaa').length).toBe(1);

    EventEmitter.removeAllListeners();

    expect(EventEmitter.listeners('aaa').length).toBe(0);
  });

  /* ON */
  describe('.on', function () {
    var spy;

    beforeEach(function () {
      spy = jasmine.createSpy('callback');
    });

    it('only accepts functions', function () {
      function expectOnToThrow (eventName, listener) {
        expect(function () {
          EventEmitter.on(eventName, listener);
        }).toThrow();
      }

      EventEmitter.on('aaa', function () {});
      expectOnToThrow('bbb', 'Iamastring');
      expectOnToThrow('ccc', 'stuff', function () {});
      expectOnToThrow('ddd', 789);
      expectOnToThrow('eee', {
        call: function () {},
        apply: function () {}
      });

      expect(EventEmitter.listeners('aaa').length).toBe(1);

      expect(EventEmitter.listeners('bbb').length).toBe(0);
      expect(EventEmitter.listeners('ccc').length).toBe(0);
      expect(EventEmitter.listeners('ddd').length).toBe(0);
      expect(EventEmitter.listeners('eee').length).toBe(0);
    });

    it('calls the callback synchronously on emission', function () {
      EventEmitter.on('aaa', spy);
      expect(spy).not.toHaveBeenCalled();

      EventEmitter.emit('aaa');

      expect(spy).toHaveBeenCalled();
    });

    it('calls the callback over and over', function () {
      var i, n = 1000;
      EventEmitter.on('aaa', spy);
      for (i = 0; i < n; i++) {
        EventEmitter.emit('aaa');
      }
      expect(spy.calls.count()).toEqual(n);
    });

    it('binds to the emitter by default', function () {
      EventEmitter.on('aaa', function () {
        expect(this).toBe(EventEmitter);
      });
      EventEmitter.emit('aaa');
    });
  });

  /* ONCE */
  describe('.once', function () {
    var spy;
    beforeEach(function () {
      spy = jasmine.createSpy('callback');
    });

    it('adds a listener', function () {
      EventEmitter.once('aaa', spy);
      expect(EventEmitter.listeners('aaa').length).toBe(1);
    });

    it('calls the callback synchronously on emission', function () {
      EventEmitter.once('aaa', spy);
      expect(spy).not.toHaveBeenCalled();

      EventEmitter.emit('aaa');
      expect(spy).toHaveBeenCalled();
    });

    it('calls the callback just one time', function () {
      var i, n = 1000;
      EventEmitter.once('aaa', spy);
      for (i = 0; i < n; i++) {
        EventEmitter.emit('aaa');
      }
      expect(spy.calls.count()).toEqual(1);
    });

    it('binds to the emitter by default', function () {
      EventEmitter.once('aaa', function () {
        expect(this).toBe(EventEmitter);
      });
      EventEmitter.emit('aaa');
    });

    it('returns this', function () {
      expect(EventEmitter.
             on('aaa', function () {}).
             on('bbb', function () {}, {})
            ).toBe(EventEmitter);
    });

  });

  /* OFF */
  describe('.off', function () {
    var foo, bar, baz;

    beforeEach(function () {
      foo = jasmine.createSpy('foo');
      bar = jasmine.createSpy('bar');
      baz = jasmine.createSpy('baz');
    });

    it('removes the matching listener', function () {
      EventEmitter.on('aaa', foo);
      expect(EventEmitter.listeners('aaa').length).toBe(1);

      EventEmitter.off('aaa', foo);
      expect(EventEmitter.listeners('aaa').length).toBe(0);

      EventEmitter.on('aaa', foo);
      EventEmitter.on('aaa', foo);
      EventEmitter.off('aaa', bar);
      EventEmitter.off('aaa', baz);
      expect(EventEmitter.listeners('aaa').length).toBe(2);

      EventEmitter.off('aaa', foo);
      // remove twice since it was added twice above
      EventEmitter.off('aaa', foo);
      expect(EventEmitter.listeners('aaa').length).toBe(0);
    });

    it('removes once listeners', function () {
      EventEmitter.on('aaa', foo);
      expect(EventEmitter.listeners('aaa').length).toBe(1);

      EventEmitter.off('aaa', foo);
      expect(EventEmitter.listeners('aaa').length).toBe(0);

      EventEmitter.on('aaa', foo);
      EventEmitter.on('aaa', foo);
      EventEmitter.off('aaa', bar);
      EventEmitter.off('aaa', baz);
      expect(EventEmitter.listeners('aaa').length).toBe(2);

      EventEmitter.off('aaa', foo);
      // remove twice since it was added twice above
      EventEmitter.off('aaa', foo);
      expect(EventEmitter.listeners('aaa').length).toBe(0);

      EventEmitter.emit('aaa');
      expect(foo).not.toHaveBeenCalled();
      expect(bar).not.toHaveBeenCalled();
      expect(baz).not.toHaveBeenCalled();
    });

    it('can remove all listeners for an event', function () {
      var that = jasmine.createSpy('that');

      EventEmitter.on('aaa', foo);
      EventEmitter.on('aaa', bar);
      EventEmitter.on('aaa', baz);

      EventEmitter.on('aaa', foo, that);
      EventEmitter.on('aaa', bar, baz);

      EventEmitter.off('aaa');

      expect(EventEmitter.listeners('aaa').length).toBe(0);
    });

    it('does not affect other events', function () {
      var that = jasmine.createSpy('that');

      EventEmitter.on('bbb', baz);
      EventEmitter.on('ccc', bar, baz);

      EventEmitter.off('aaa');

      expect(EventEmitter.listeners('aaa').length).toBe(0);
      expect(EventEmitter.listeners('bbb').length).toBe(1);
      expect(EventEmitter.listeners('ccc').length).toBe(1);
    });

    it('can shut off an object entirely', function () {
      var that = jasmine.createSpy('that');

      EventEmitter.on('aaa', foo);
      EventEmitter.on('bbb', baz);
      EventEmitter.on('ccc', bar, that);
      EventEmitter.once('ddd', function () {});

      EventEmitter.off();

      expect(EventEmitter.listeners('aaa').length).toBe(0);
      expect(EventEmitter.listeners('bbb').length).toBe(0);
      expect(EventEmitter.listeners('ccc').length).toBe(0);
      expect(EventEmitter.listeners('ddd').length).toBe(0);
    });

    it('returns this', function () {
      EventEmitter.on('aaa', function () {});
      expect(EventEmitter.off('aaa')).toBe(EventEmitter);

      EventEmitter.on('aaa', foo);
      expect(EventEmitter.off('aaa', foo)).toBe(EventEmitter);

      expect(EventEmitter.off('bbb')).toBe(EventEmitter);
      expect(EventEmitter.off()).toBe(EventEmitter);
    });
  });

  /* EMIT */
  describe('.emit', function () {
    var foo, bar, that;
    function removeSelf () {
      EventEmitter.removeListener('aaa', removeSelf);
    }

    beforeEach(function () {
      foo = jasmine.createSpy('foo');
      bar = jasmine.createSpy('bar');
      that = jasmine.createSpy('that');

      EventEmitter.on('aaa', removeSelf);
      EventEmitter.on('aaa', foo);
      EventEmitter.on('aaa', bar, that);
    });

    it('handles no listeners gracefully', function () {
      function good() {
        EventEmitter.emit('bbb');
      };

      expect(good).not.toThrow();
    });

    it('calls the callbacks', function () {
      EventEmitter.emit('aaa');
      expect(foo).toHaveBeenCalled();
      expect(bar).toHaveBeenCalled();
    });

    it('binds to the parent object', function () {
      bar.and.callFake(function () {
        expect(this).toBe(EventEmitter);
      });
      EventEmitter.on('bbb', bar);
      EventEmitter.emit('bbb');
      expect(bar).toHaveBeenCalled();
    });

    it('ignores off listeners', function () {
      EventEmitter.removeListener('aaa', foo);
      EventEmitter.emit('aaa');
      expect(foo).not.toHaveBeenCalled();
      expect(bar).toHaveBeenCalled();
    });

    it('passes arguments to callback', function () {
      EventEmitter.emit('aaa', 'arg1', 123);
      expect(foo).toHaveBeenCalledWith('arg1', 123);
      expect(bar).toHaveBeenCalledWith('arg1', 123);

      EventEmitter.emit('aaa', 'arg', 'blarg', 'gizarg');
      expect(foo).toHaveBeenCalledWith('arg', 'blarg', 'gizarg');
      expect(bar).toHaveBeenCalledWith('arg', 'blarg', 'gizarg');
    });
  });
});
