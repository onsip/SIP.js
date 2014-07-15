describe('EventEmitter', function () {
  var EventEmitter;

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
    EventEmitter.events = {};
    expect(EventEmitter.checkListener('aaa')).toBe(false);

    EventEmitter.events = {
      'aaa': []
    };

    expect(EventEmitter.checkListener('aaa')).toBe(false);

    EventEmitter.events = {
      'aaa': [function () {}]
    };

    expect(EventEmitter.checkListener('aaa')).toBe(true);

    EventEmitter.events = {};

    expect(EventEmitter.checkListener('aaa')).toBe(false);
  });

  /* Deprecated JsSIP functions */
  it('has no method addListener', function () {
    expect(EventEmitter.addListener).not.toBeDefined();
  });

  it('has no method removeListener', function () {
    expect(EventEmitter.removeListener).not.toBeDefined();
  });

  it('has no method removeAllListener', function () {
    expect(EventEmitter.removeAllListener).not.toBeDefined();
  });

  it('has no method listeners', function () {
    expect(EventEmitter.listeners).not.toBeDefined();
  });

  /* ON */
  describe('.on', function () {
    var spy;

    beforeEach(function () {
      spy = jasmine.createSpy('callback');
    });

    it('only accepts functions', function () {
      EventEmitter.on('aaa', function () {});
      EventEmitter.on('bbb', 'Iamastring');
      EventEmitter.on('ccc', 'stuff', function () {});
      EventEmitter.on('ddd', 789);
      EventEmitter.on('eee', {
        call: function () {},
        apply: function () {}
      });

      expect(EventEmitter.checkListener('aaa')).toBe(true);

      expect(EventEmitter.checkListener('bbb')).toBe(false);
      expect(EventEmitter.checkListener('ccc')).toBe(false);
      expect(EventEmitter.checkListener('ddd')).toBe(false);
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

    it('binds to third argument', function () {
      var that = jasmine.createSpy('foo');

      EventEmitter.on('aaa', function () {
        expect(this.identity).toBe(that.identity);
      }, that);
      EventEmitter.emit('aaa');
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
      expect(EventEmitter.checkListener('aaa')).toBe(true);
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

    it('binds to third argument', function () {
      var that = jasmine.createSpy('foo');

      EventEmitter.once('aaa', function () {
        expect(this.identity).toBe(that.identity);
      }, that);
      EventEmitter.emit('aaa');
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

    it('refuses unknown events', function () {
      function bad() {
        EventEmitter.off('zed');
      }

      function badTwo() {
        EventEmitter.off('zed', function () {});
      }

      function badThree() {
        EventEmitter.off('zed', function () {}, foo);
      }

      expect(bad).toThrow();
      expect(badTwo).toThrow();
      expect(badThree).toThrow();
    });

    it('removes the matching listener', function () {
      EventEmitter.on('aaa', foo);
      expect(EventEmitter.checkListener('aaa')).toBe(true);

      EventEmitter.off('aaa', foo);
      expect(EventEmitter.checkListener('aaa')).toBe(false);

      EventEmitter.on('aaa', foo);
      EventEmitter.on('aaa', foo);
      EventEmitter.off('aaa', bar);
      EventEmitter.off('aaa', baz);
      expect(EventEmitter.checkListener('aaa')).toBe(true);
      expect(EventEmitter.events.aaa.length).toBe(2);

      EventEmitter.off('aaa', foo);
      expect(EventEmitter.checkListener('aaa')).toBe(false);
    });

    it('removes once listeners', function () {
      EventEmitter.on('aaa', foo);
      expect(EventEmitter.checkListener('aaa')).toBe(true);

      EventEmitter.off('aaa', foo);
      expect(EventEmitter.checkListener('aaa')).toBe(false);

      EventEmitter.on('aaa', foo);
      EventEmitter.on('aaa', foo);
      EventEmitter.off('aaa', bar);
      EventEmitter.off('aaa', baz);
      expect(EventEmitter.checkListener('aaa')).toBe(true);
      expect(EventEmitter.events.aaa.length).toBe(2);

      EventEmitter.off('aaa', foo);
      expect(EventEmitter.checkListener('aaa')).toBe(false);

      EventEmitter.emit('aaa');
      expect(foo).not.toHaveBeenCalled();
      expect(bar).not.toHaveBeenCalled();
      expect(baz).not.toHaveBeenCalled();
    });

    it('tries to match third argument', function () {
      var that = jasmine.createSpy('that');
      EventEmitter.on('aaa', foo, that);

      EventEmitter.off('aaa', foo, that);
      expect(EventEmitter.checkListener('aaa')).toBe(false);

      EventEmitter.on('aaa', foo);
      EventEmitter.off('aaa', foo, that);
      expect(EventEmitter.checkListener('aaa')).toBe(true);

      EventEmitter.off('aaa', foo);
      expect(EventEmitter.checkListener('aaa')).toBe(false);

      EventEmitter.on('aaa', foo, that);
      EventEmitter.off('aaa', foo);
      expect(EventEmitter.checkListener('aaa')).toBe(false);

      EventEmitter.on('aaa', foo, that);
      EventEmitter.off('aaa', foo, bar);
      expect(EventEmitter.checkListener('aaa')).toBe(true);
    });

    it('can remove all listeners for an event', function () {
      var that = jasmine.createSpy('that');

      EventEmitter.on('aaa', foo);
      EventEmitter.on('aaa', bar);
      EventEmitter.on('aaa', baz);

      EventEmitter.on('aaa', foo, that);
      EventEmitter.on('aaa', bar, baz);

      EventEmitter.off('aaa');

      expect(EventEmitter.checkListener('aaa')).toBe(false);
    });

    it('does not affect other events', function () {
      var that = jasmine.createSpy('that');

      EventEmitter.on('bbb', baz);
      EventEmitter.on('ccc', bar, baz);

      EventEmitter.off('aaa');

      expect(EventEmitter.checkListener('aaa')).toBe(false);
      expect(EventEmitter.checkListener('bbb')).toBe(true);
      expect(EventEmitter.checkListener('ccc')).toBe(true);
    });

    it('can shut off an object entirely', function () {
      var that = jasmine.createSpy('that');

      EventEmitter.on('aaa', foo);
      EventEmitter.on('bbb', baz);
      EventEmitter.on('ccc', bar, that);
      EventEmitter.once('ddd', function () {});

      EventEmitter.off();

      expect(EventEmitter.checkListener('aaa')).toBe(false);
      expect(EventEmitter.checkListener('bbb')).toBe(false);
      expect(EventEmitter.checkListener('ccc')).toBe(false);
      expect(EventEmitter.checkListener('ddd')).toBe(false);
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

  /* Max Listeners */
  it('prevents too many listeners', function () {
    var i, n = 1000;

    for (i = 0; i < n; i++) {
      EventEmitter.on('aaa', function () {});
    }

    expect(EventEmitter.checkListener('aaa')).toBe(true);
    expect(EventEmitter.events.aaa.length).toBe(SIP.EventEmitter.C.MAX_LISTENERS);
  });

  it('can have configurable max listeners', function () {
    var i, n = 1000;
    EventEmitter.
      setMaxListeners(723);

    for (i = 0; i < n; i++) {
      EventEmitter.on('aaa', function () {});
    }

    expect(EventEmitter.checkListener('aaa')).toBe(true);
    expect(EventEmitter.events.aaa.length).toBe(723);
  });

  it('returns this from setMaxListeners', function () {
    expect(EventEmitter.setMaxListeners(100)).toBe(EventEmitter);
  });

  /* EMIT */
  describe('.emit', function () {
    var foo, bar, that;
    function removeSelf () {
      EventEmitter.off('aaa', removeSelf);
    }

    beforeEach(function () {
      foo = jasmine.createSpy('foo');
      bar = jasmine.createSpy('bar');
      that = jasmine.createSpy('that');

      EventEmitter.on('aaa', removeSelf);
      EventEmitter.on('aaa', foo);
      EventEmitter.on('aaa', bar, that);
    });

    it('refuses to emit bad events', function () {
      function bad() {
        EventEmitter.emit('zed');
      };

      expect(bad).toThrow();
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

    it('binds to the third argument', function () {
      bar.and.callFake(function () {
        expect(this).toBe(that);
      });
      EventEmitter.on('bbb', bar, that);
      EventEmitter.emit('bbb');
      expect(bar).toHaveBeenCalled();
    });

    it('ignores off listeners', function () {
      EventEmitter.off('aaa', foo);
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
