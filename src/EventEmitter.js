/**
 * @fileoverview EventEmitter
 */

/**
 * @augments SIP
 * @class Class creating an event emitter.
 */
module.exports = function (SIP) {
var
  EventEmitter,
  logger = new SIP.LoggerFactory().getLogger('sip.eventemitter'),
  C = {
    MAX_LISTENERS: 10
  };

EventEmitter = function(){};
EventEmitter.prototype = {
  /**
   * Initialize events dictionaries.
   * @param {Array} events
   */
  initEvents: function(events) {
    this.events = {};

    return this.initMoreEvents(events);
  },

  initMoreEvents: function(events) {
    var idx;

    if (!this.logger) {
      this.logger = logger;
    }

    this.maxListeners = C.MAX_LISTENERS;

    for (idx = 0; idx < events.length; idx++) {
      if (!this.events[events[idx]]) {
        this.logger.log('adding event '+ events[idx]);
        this.events[events[idx]] = [];
      } else {
        this.logger.log('skipping event '+ events[idx]+ ' - Event exists');
      }
    }

    return this;
  },

  /**
  * Check whether an event exists or not.
  * @param {String} event
  * @returns {Boolean}
  */
  checkEvent: function(event) {
    return !!(this.events && this.events[event]);
  },

  /**
  * Check whether an event exists and has at least one listener or not.
  * @param {String} event
  * @returns {Boolean}
  */
  checkListener: function(event) {
    return this.checkEvent(event) && this.events[event].length > 0;
  },

  /**
  * Add a listener to the end of the listeners array for the specified event.
  * @param {String} event
  * @param {Function} listener
  */
  on: function(event, listener, bindTarget) {
    if (listener === undefined) {
      return this;
    } else if (typeof listener !== 'function') {
      this.logger.error('listener must be a function');
      return this;
    } else if (!this.checkEvent(event)) {
      this.logger.error('unable to add a listener to a nonexistent event '+ event);
      throw new TypeError('Invalid or uninitialized event: ' + event);
    }

    var listenerObj = { listener: listener };
    if (bindTarget) {
      listenerObj.bindTarget = bindTarget;
    }

    if (this.events[event].length >= this.maxListeners) {
      this.logger.warn('max listeners exceeded for event '+ event);
      return this;
    }

    this.events[event].push(listenerObj);
    this.logger.log('new listener added to event '+ event);
    return this;
  },

  /**
  * Add a one time listener for the specified event.
  * The listener is invoked only the next time the event is fired, then it is removed.
  * @param {String} event
  * @param {Function} listener
  */
  once: function(event, listener, bindTarget) {
    var self = this;
    function listenOnce () {
      listener.apply(this, arguments);
      self.off(event, listenOnce, bindTarget);
    }

    return this.on(event, listenOnce, bindTarget);
  },

  /**
  * Remove a listener from the listener array for the specified event.
  * Note that the order of the array elements will change after removing the listener
  * @param {String} event
  * @param {Function} listener
  */
  off: function(event, listener, bindTarget) {
    var events, length,
      idx = 0;

    if (listener && typeof listener !== 'function') {
      this.logger.error('listener must be a function');
      return this;
    } else if (!event) {
      for (idx in this.events) {
        this.events[idx] = [];
      }
      return this;
    } else if (!this.checkEvent(event)) {
      this.logger.error('unable to remove a listener from a nonexistent event '+ event);
      throw new TypeError('Invalid or uninitialized event: ' + event);
    }

    events = this.events[event];
    length = events.length;

    while (idx < length) {
      if (events[idx] &&
          (!listener || events[idx].listener === listener) &&
          (!bindTarget || events[idx].bindTarget === bindTarget)) {
        events.splice(idx,1);
      } else {
        idx ++;
      }
    }

    return this;
  },

  /**
  * By default EventEmitter will print a warning
  * if more than C.MAX_LISTENERS listeners are added for a particular event.
  * This function allows that limit to be modified.
  * @param {Number} listeners
  */
  setMaxListeners: function(listeners) {
    if (typeof listeners !== 'number' || listeners < 0) {
      this.logger.error('listeners must be a positive number');
      return this;
    }

    this.maxListeners = listeners;
    return this;
  },

  /**
  * Execute each of the listeners in order with the supplied arguments.
  * @param {String} events
  * @param {Array} args
  */
  emit: function(event) {
    if (!this.checkEvent(event)) {
      this.logger.error('unable to emit a nonexistent event '+ event);
      throw new TypeError('Invalid or uninitialized event: ' + event);
    }

    this.logger.log('emitting event '+ event);

    // Fire event listeners
    var args = Array.prototype.slice.call(arguments, 1);
    this.events[event].map(function (listener) {
      return function () {
        listener.listener.apply(this, args);
      }.bind(listener.bindTarget || this);
    }, this).forEach(function (boundListener) {
      try {
        boundListener();
      } catch(err) {
        this.logger.error(err.stack);
      }
    }, this);

    return this;
  }
};

EventEmitter.C = C;

return EventEmitter;
};
