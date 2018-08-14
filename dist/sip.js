/*!
 * 
 *  SIP version 0.11.3
 *  Copyright (c) 2014-2018 Junction Networks, Inc <http://www.onsip.com>
 *  Homepage: https://sipjs.com
 *  License: https://sipjs.com/license/
 * 
 * 
 *  ~~~SIP.js contains substantial portions of JsSIP under the following license~~~
 *  Homepage: http://jssip.net
 *  Copyright (c) 2012-2013 José Luis Millán - Versatica <http://www.versatica.com>
 * 
 *  Permission is hereby granted, free of charge, to any person obtaining
 *  a copy of this software and associated documentation files (the
 *  "Software"), to deal in the Software without restriction, including
 *  without limitation the rights to use, copy, modify, merge, publish,
 *  distribute, sublicense, and/or sell copies of the Software, and to
 *  permit persons to whom the Software is furnished to do so, subject to
 *  the following conditions:
 * 
 *  The above copyright notice and this permission notice shall be
 *  included in all copies or substantial portions of the Software.
 * 
 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 *  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 *  MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 *  NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 *  LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 *  OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 *  WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 * 
 *  ~~~ end JsSIP license ~~~
 * 
 * 
 * 
 * 
 */
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["SIP"] = factory();
	else
		root["SIP"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


module.exports = __webpack_require__(1)(__webpack_require__(40));

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * @name SIP
 * @namespace
 */


module.exports = function (environment) {

  var pkg = __webpack_require__(2),
      version = pkg.version,
      title = pkg.title;

  var SIP = Object.defineProperties({}, {
    version: {
      get: function get() {
        return version;
      }
    },
    name: {
      get: function get() {
        return title;
      }
    }
  });

  __webpack_require__(3)(SIP, environment);
  SIP.LoggerFactory = __webpack_require__(4)(environment.console);
  SIP.EventEmitter = __webpack_require__(5)();
  SIP.C = __webpack_require__(7)(SIP.name, SIP.version);
  SIP.Exceptions = __webpack_require__(8);
  SIP.Timers = __webpack_require__(9)(environment.timers);
  SIP.Transport = __webpack_require__(10)(SIP);
  __webpack_require__(11)(SIP);
  __webpack_require__(12)(SIP);
  __webpack_require__(13)(SIP);
  __webpack_require__(14)(SIP);
  __webpack_require__(15)(SIP);
  __webpack_require__(16)(SIP);
  __webpack_require__(18)(SIP);
  __webpack_require__(19)(SIP);
  SIP.SessionDescriptionHandler = __webpack_require__(20)(SIP.EventEmitter);
  __webpack_require__(21)(SIP);
  __webpack_require__(22)(SIP);
  __webpack_require__(23)(SIP);
  __webpack_require__(25)(SIP);
  __webpack_require__(26)(SIP);
  __webpack_require__(27)(SIP, environment);
  __webpack_require__(32)(SIP);
  SIP.DigestAuthentication = __webpack_require__(33)(SIP.Utils);
  SIP.Grammar = __webpack_require__(36)(SIP);
  SIP.Web = {
    Modifiers: __webpack_require__(38)(SIP),
    Simple: __webpack_require__(39)(SIP)
  };

  return SIP;
};

/***/ }),
/* 2 */
/***/ (function(module) {

module.exports = {"name":"sip.js","title":"SIP.js","description":"A simple, intuitive, and powerful JavaScript signaling library","version":"0.11.3","main":"dist/sip.js","browser":{"./src/environment.js":"./src/environment_browser.js"},"homepage":"https://sipjs.com","author":"OnSIP <developer@onsip.com> (https://sipjs.com/aboutus/)","contributors":[{"url":"https://github.com/onsip/SIP.js/blob/master/THANKS.md"}],"repository":{"type":"git","url":"https://github.com/onsip/SIP.js.git"},"keywords":["sip","websocket","webrtc","library","javascript"],"devDependencies":{"babel-core":"^6.26.0","babel-loader":"^7.1.2","babel-preset-env":"^1.6.1","eslint":"^4.9.0","jasmine-core":"^3.1.0","karma":"^2.0.2","karma-chrome-launcher":"^2.2.0","karma-cli":"^1.0.1","karma-jasmine":"^1.1.0","karma-jasmine-html-reporter":"^1.2.0","karma-mocha-reporter":"^2.2.5","karma-webpack":"^3.0.0","pegjs":"^0.10.0","pegjs-loader":"^0.5.4","uglifyjs-webpack-plugin":"^1.2.5","webpack":"^4.16.0","webpack-cli":"^3.0.8"},"engines":{"node":">=6.0"},"license":"MIT","scripts":{"prebuild":"eslint src/*.js src/**/*.js","build-dev":"webpack --progress --env.buildType dev","build-prod":"webpack --progress --env.buildType prod","copy-dist-files":"cp dist/sip.js dist/sip-$npm_package_version.js && cp dist/sip.min.js  dist/sip-$npm_package_version.min.js","build":"npm run build-dev && npm run build-prod && npm run copy-dist-files","browserTest":"sleep 2 && open http://0.0.0.0:9876/debug.html & karma start --reporters kjhtml --no-single-run","commandLineTest":"karma start --reporters mocha --browsers ChromeHeadless --single-run","buildAndTest":"npm run build && npm run commandLineTest","buildAndBrowserTest":"npm run build && npm run browserTest"},"dependencies":{"crypto-js":"^3.1.9-1"},"optionalDependencies":{"promiscuous":"^0.6.0"}};

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/**
 * @fileoverview Utils
 */

module.exports = function (SIP, environment) {
  var Utils;

  Utils = {

    Promise: environment.Promise,

    defer: function defer() {
      var deferred = {};
      deferred.promise = new Utils.Promise(function (resolve, reject) {
        deferred.resolve = resolve;
        deferred.reject = reject;
      });
      return deferred;
    },

    reducePromises: function reducePromises(arr, val) {
      return arr.reduce(function (acc, fn) {
        acc = acc.then(fn);
        return acc;
      }, SIP.Utils.Promise.resolve(val));
    },

    augment: function augment(object, constructor, args, override) {
      var idx, proto;

      // Add public properties from constructor's prototype onto object
      proto = constructor.prototype;
      for (idx in proto) {
        if (override || object[idx] === undefined) {
          object[idx] = proto[idx];
        }
      }

      // Construct the object as though it were just created by constructor
      constructor.apply(object, args);
    },

    defaultOptions: function defaultOptions(_defaultOptions, overridingOptions) {
      _defaultOptions = _defaultOptions || {};
      overridingOptions = overridingOptions || {};
      return Object.assign({}, _defaultOptions, overridingOptions);
    },

    optionsOverride: function optionsOverride(options, winner, loser, isDeprecated, logger, defaultValue) {
      if (isDeprecated && options[loser]) {
        logger.warn(loser + ' is deprecated, please use ' + winner + ' instead');
      }

      if (options[winner] && options[loser]) {
        logger.warn(winner + ' overriding ' + loser);
      }

      options[winner] = options[winner] || options[loser] || defaultValue;
    },

    str_utf8_length: function str_utf8_length(string) {
      return encodeURIComponent(string).replace(/%[A-F\d]{2}/g, 'U').length;
    },

    generateFakeSDP: function generateFakeSDP(body) {
      if (!body) {
        return;
      }

      var start = body.indexOf('o=');
      var end = body.indexOf('\r\n', start);

      return 'v=0\r\n' + body.slice(start, end) + '\r\ns=-\r\nt=0 0\r\nc=IN IP4 0.0.0.0';
    },

    isFunction: function isFunction(fn) {
      if (fn !== undefined) {
        return Object.prototype.toString.call(fn) === '[object Function]';
      } else {
        return false;
      }
    },

    isDecimal: function isDecimal(num) {
      return !isNaN(num) && parseFloat(num) === parseInt(num, 10);
    },

    createRandomToken: function createRandomToken(size, base) {
      var i,
          r,
          token = '';

      base = base || 32;

      for (i = 0; i < size; i++) {
        r = Math.random() * base | 0;
        token += r.toString(base);
      }

      return token;
    },

    newTag: function newTag() {
      return SIP.Utils.createRandomToken(SIP.UA.C.TAG_LENGTH);
    },

    // http://stackoverflow.com/users/109538/broofa
    newUUID: function newUUID() {
      var UUID = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0,
            v = c === 'x' ? r : r & 0x3 | 0x8;
        return v.toString(16);
      });

      return UUID;
    },

    hostType: function hostType(host) {
      if (!host) {
        return;
      } else {
        host = SIP.Grammar.parse(host, 'host');
        if (host !== -1) {
          return host.host_type;
        }
      }
    },

    /**
    * Normalize SIP URI.
    * NOTE: It does not allow a SIP URI without username.
    * Accepts 'sip', 'sips' and 'tel' URIs and convert them into 'sip'.
    * Detects the domain part (if given) and properly hex-escapes the user portion.
    * If the user portion has only 'tel' number symbols the user portion is clean of 'tel' visual separators.
    * @private
    * @param {String} target
    * @param {String} [domain]
    */
    normalizeTarget: function normalizeTarget(target, domain) {
      var uri, target_array, target_user, target_domain;

      // If no target is given then raise an error.
      if (!target) {
        return;
        // If a SIP.URI instance is given then return it.
      } else if (target instanceof SIP.URI) {
        return target;

        // If a string is given split it by '@':
        // - Last fragment is the desired domain.
        // - Otherwise append the given domain argument.
      } else if (typeof target === 'string') {
        target_array = target.split('@');

        switch (target_array.length) {
          case 1:
            if (!domain) {
              return;
            }
            target_user = target;
            target_domain = domain;
            break;
          case 2:
            target_user = target_array[0];
            target_domain = target_array[1];
            break;
          default:
            target_user = target_array.slice(0, target_array.length - 1).join('@');
            target_domain = target_array[target_array.length - 1];
        }

        // Remove the URI scheme (if present).
        target_user = target_user.replace(/^(sips?|tel):/i, '');

        // Remove 'tel' visual separators if the user portion just contains 'tel' number symbols.
        if (/^[\-\.\(\)]*\+?[0-9\-\.\(\)]+$/.test(target_user)) {
          target_user = target_user.replace(/[\-\.\(\)]/g, '');
        }

        // Build the complete SIP URI.
        target = SIP.C.SIP + ':' + SIP.Utils.escapeUser(target_user) + '@' + target_domain;
        // Finally parse the resulting URI.
        uri = SIP.URI.parse(target);

        return uri;
      } else {
        return;
      }
    },

    /**
    * Hex-escape a SIP URI user.
    * @private
    * @param {String} user
    */
    escapeUser: function escapeUser(user) {
      // Don't hex-escape ':' (%3A), '+' (%2B), '?' (%3F"), '/' (%2F).
      return encodeURIComponent(decodeURIComponent(user)).replace(/%3A/ig, ':').replace(/%2B/ig, '+').replace(/%3F/ig, '?').replace(/%2F/ig, '/');
    },

    headerize: function headerize(string) {
      var exceptions = {
        'Call-Id': 'Call-ID',
        'Cseq': 'CSeq',
        'Min-Se': 'Min-SE',
        'Rack': 'RAck',
        'Rseq': 'RSeq',
        'Www-Authenticate': 'WWW-Authenticate'
      },
          name = string.toLowerCase().replace(/_/g, '-').split('-'),
          hname = '',
          parts = name.length,
          part;

      for (part = 0; part < parts; part++) {
        if (part !== 0) {
          hname += '-';
        }
        hname += name[part].charAt(0).toUpperCase() + name[part].substring(1);
      }
      if (exceptions[hname]) {
        hname = exceptions[hname];
      }
      return hname;
    },

    sipErrorCause: function sipErrorCause(status_code) {
      var cause;

      for (cause in SIP.C.SIP_ERROR_CAUSES) {
        if (SIP.C.SIP_ERROR_CAUSES[cause].indexOf(status_code) !== -1) {
          return SIP.C.causes[cause];
        }
      }

      return SIP.C.causes.SIP_FAILURE_CODE;
    },

    getReasonPhrase: function getReasonPhrase(code, specific) {
      return specific || SIP.C.REASON_PHRASE[code] || '';
    },

    getReasonHeaderValue: function getReasonHeaderValue(code, reason) {
      reason = SIP.Utils.getReasonPhrase(code, reason);
      return 'SIP;cause=' + code + ';text="' + reason + '"';
    },

    getCancelReason: function getCancelReason(code, reason) {
      if (code && code < 200 || code > 699) {
        throw new TypeError('Invalid status_code: ' + code);
      } else if (code) {
        return SIP.Utils.getReasonHeaderValue(code, reason);
      }
    },

    buildStatusLine: function buildStatusLine(code, reason) {
      code = code || null;
      reason = reason || null;

      // Validate code and reason values
      if (!code || code < 100 || code > 699) {
        throw new TypeError('Invalid status_code: ' + code);
      } else if (reason && typeof reason !== 'string' && !(reason instanceof String)) {
        throw new TypeError('Invalid reason_phrase: ' + reason);
      }

      reason = Utils.getReasonPhrase(code, reason);

      return 'SIP/2.0 ' + code + ' ' + reason + '\r\n';
    },

    /**
    * Generate a random Test-Net IP (http://tools.ietf.org/html/rfc5735)
    * @private
    */
    getRandomTestNetIP: function getRandomTestNetIP() {
      function getOctet(from, to) {
        return Math.floor(Math.random() * (to - from + 1) + from);
      }
      return '192.0.2.' + getOctet(1, 254);
    }
  };

  SIP.Utils = Utils;
};

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var levels = {
  'error': 0,
  'warn': 1,
  'log': 2,
  'debug': 3
};

module.exports = function (console) {

  var LoggerFactory = function LoggerFactory() {
    var logger,
        level = 2,
        builtinEnabled = true,
        connector = null;

    this.loggers = {};

    logger = this.getLogger('sip.loggerfactory');

    Object.defineProperties(this, {
      builtinEnabled: {
        get: function get() {
          return builtinEnabled;
        },
        set: function set(value) {
          if (typeof value === 'boolean') {
            builtinEnabled = value;
          } else {
            logger.error('invalid "builtinEnabled" parameter value: ' + JSON.stringify(value));
          }
        }
      },

      level: {
        get: function get() {
          return level;
        },
        set: function set(value) {
          if (value >= 0 && value <= 3) {
            level = value;
          } else if (value > 3) {
            level = 3;
          } else if (levels.hasOwnProperty(value)) {
            level = levels[value];
          } else {
            logger.error('invalid "level" parameter value: ' + JSON.stringify(value));
          }
        }
      },

      connector: {
        get: function get() {
          return connector;
        },
        set: function set(value) {
          if (value === null || value === "" || value === undefined) {
            connector = null;
          } else if (typeof value === 'function') {
            connector = value;
          } else {
            logger.error('invalid "connector" parameter value: ' + JSON.stringify(value));
          }
        }
      }
    });
  };

  LoggerFactory.prototype.print = function (target, category, label, content) {
    if (typeof content === 'string') {
      var prefix = [new Date(), category];
      if (label) {
        prefix.push(label);
      }
      content = prefix.concat(content).join(' | ');
    }
    target.call(console, content);
  };

  function Logger(logger, category, label) {
    this.logger = logger;
    this.category = category;
    this.label = label;
  }

  Object.keys(levels).forEach(function (targetName) {
    Logger.prototype[targetName] = function (content) {
      this.logger[targetName](this.category, this.label, content);
    };

    LoggerFactory.prototype[targetName] = function (category, label, content) {
      if (this.level >= levels[targetName]) {
        if (this.builtinEnabled) {
          this.print(console[targetName], category, label, content);
        }

        if (this.connector) {
          this.connector(targetName, category, label, content);
        }
      }
    };
  });

  LoggerFactory.prototype.getLogger = function (category, label) {
    var logger;

    if (label && this.level === 3) {
      return new Logger(this, category, label);
    } else if (this.loggers[category]) {
      return this.loggers[category];
    } else {
      logger = new Logger(this, category);
      this.loggers[category] = logger;
      return logger;
    }
  };

  return LoggerFactory;
};

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var NodeEventEmitter = __webpack_require__(6).EventEmitter;

module.exports = function () {

  // Don't use `new SIP.EventEmitter()` for inheriting.
  // Use Object.create(SIP.EventEmitter.prototoype);
  function EventEmitter() {
    NodeEventEmitter.call(this);
  }

  EventEmitter.prototype = Object.create(NodeEventEmitter.prototype, {
    constructor: {
      value: EventEmitter,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });

  return EventEmitter;
};

/***/ }),
/* 6 */
/***/ (function(module, exports) {

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        // At least give some kind of context to the user
        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
        err.context = er;
        throw err;
      }
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}


/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/**
 * @fileoverview SIP Constants
 */

/**
 * SIP Constants.
 * @augments SIP
 */

module.exports = function (name, version) {
  return {
    USER_AGENT: name + '/' + version,

    // SIP scheme
    SIP: 'sip',
    SIPS: 'sips',

    // End and Failure causes
    causes: {
      // Generic error causes
      CONNECTION_ERROR: 'Connection Error',
      REQUEST_TIMEOUT: 'Request Timeout',
      SIP_FAILURE_CODE: 'SIP Failure Code',
      INTERNAL_ERROR: 'Internal Error',

      // SIP error causes
      BUSY: 'Busy',
      REJECTED: 'Rejected',
      REDIRECTED: 'Redirected',
      UNAVAILABLE: 'Unavailable',
      NOT_FOUND: 'Not Found',
      ADDRESS_INCOMPLETE: 'Address Incomplete',
      INCOMPATIBLE_SDP: 'Incompatible SDP',
      AUTHENTICATION_ERROR: 'Authentication Error',
      DIALOG_ERROR: 'Dialog Error',

      // Session error causes
      WEBRTC_NOT_SUPPORTED: 'WebRTC Not Supported',
      WEBRTC_ERROR: 'WebRTC Error',
      CANCELED: 'Canceled',
      NO_ANSWER: 'No Answer',
      EXPIRES: 'Expires',
      NO_ACK: 'No ACK',
      NO_PRACK: 'No PRACK',
      USER_DENIED_MEDIA_ACCESS: 'User Denied Media Access',
      BAD_MEDIA_DESCRIPTION: 'Bad Media Description',
      RTP_TIMEOUT: 'RTP Timeout'
    },

    supported: {
      UNSUPPORTED: 'none',
      SUPPORTED: 'supported',
      REQUIRED: 'required'
    },

    SIP_ERROR_CAUSES: {
      REDIRECTED: [300, 301, 302, 305, 380],
      BUSY: [486, 600],
      REJECTED: [403, 603],
      NOT_FOUND: [404, 604],
      UNAVAILABLE: [480, 410, 408, 430],
      ADDRESS_INCOMPLETE: [484],
      INCOMPATIBLE_SDP: [488, 606],
      AUTHENTICATION_ERROR: [401, 407]
    },

    // SIP Methods
    ACK: 'ACK',
    BYE: 'BYE',
    CANCEL: 'CANCEL',
    INFO: 'INFO',
    INVITE: 'INVITE',
    MESSAGE: 'MESSAGE',
    NOTIFY: 'NOTIFY',
    OPTIONS: 'OPTIONS',
    REGISTER: 'REGISTER',
    UPDATE: 'UPDATE',
    SUBSCRIBE: 'SUBSCRIBE',
    PUBLISH: 'PUBLISH',
    REFER: 'REFER',
    PRACK: 'PRACK',

    /* SIP Response Reasons
     * DOC: http://www.iana.org/assignments/sip-parameters
     * Copied from https://github.com/versatica/OverSIP/blob/master/lib/oversip/sip/constants.rb#L7
     */
    REASON_PHRASE: {
      100: 'Trying',
      180: 'Ringing',
      181: 'Call Is Being Forwarded',
      182: 'Queued',
      183: 'Session Progress',
      199: 'Early Dialog Terminated', // draft-ietf-sipcore-199
      200: 'OK',
      202: 'Accepted', // RFC 3265
      204: 'No Notification', //RFC 5839
      300: 'Multiple Choices',
      301: 'Moved Permanently',
      302: 'Moved Temporarily',
      305: 'Use Proxy',
      380: 'Alternative Service',
      400: 'Bad Request',
      401: 'Unauthorized',
      402: 'Payment Required',
      403: 'Forbidden',
      404: 'Not Found',
      405: 'Method Not Allowed',
      406: 'Not Acceptable',
      407: 'Proxy Authentication Required',
      408: 'Request Timeout',
      410: 'Gone',
      412: 'Conditional Request Failed', // RFC 3903
      413: 'Request Entity Too Large',
      414: 'Request-URI Too Long',
      415: 'Unsupported Media Type',
      416: 'Unsupported URI Scheme',
      417: 'Unknown Resource-Priority', // RFC 4412
      420: 'Bad Extension',
      421: 'Extension Required',
      422: 'Session Interval Too Small', // RFC 4028
      423: 'Interval Too Brief',
      428: 'Use Identity Header', // RFC 4474
      429: 'Provide Referrer Identity', // RFC 3892
      430: 'Flow Failed', // RFC 5626
      433: 'Anonymity Disallowed', // RFC 5079
      436: 'Bad Identity-Info', // RFC 4474
      437: 'Unsupported Certificate', // RFC 4744
      438: 'Invalid Identity Header', // RFC 4744
      439: 'First Hop Lacks Outbound Support', // RFC 5626
      440: 'Max-Breadth Exceeded', // RFC 5393
      469: 'Bad Info Package', // draft-ietf-sipcore-info-events
      470: 'Consent Needed', // RFC 5360
      478: 'Unresolvable Destination', // Custom code copied from Kamailio.
      480: 'Temporarily Unavailable',
      481: 'Call/Transaction Does Not Exist',
      482: 'Loop Detected',
      483: 'Too Many Hops',
      484: 'Address Incomplete',
      485: 'Ambiguous',
      486: 'Busy Here',
      487: 'Request Terminated',
      488: 'Not Acceptable Here',
      489: 'Bad Event', // RFC 3265
      491: 'Request Pending',
      493: 'Undecipherable',
      494: 'Security Agreement Required', // RFC 3329
      500: 'Internal Server Error',
      501: 'Not Implemented',
      502: 'Bad Gateway',
      503: 'Service Unavailable',
      504: 'Server Time-out',
      505: 'Version Not Supported',
      513: 'Message Too Large',
      580: 'Precondition Failure', // RFC 3312
      600: 'Busy Everywhere',
      603: 'Decline',
      604: 'Does Not Exist Anywhere',
      606: 'Not Acceptable'
    },

    /* SIP Option Tags
     * DOC: http://www.iana.org/assignments/sip-parameters/sip-parameters.xhtml#sip-parameters-4
     */
    OPTION_TAGS: {
      '100rel': true, // RFC 3262
      199: true, // RFC 6228
      answermode: true, // RFC 5373
      'early-session': true, // RFC 3959
      eventlist: true, // RFC 4662
      explicitsub: true, // RFC-ietf-sipcore-refer-explicit-subscription-03
      'from-change': true, // RFC 4916
      'geolocation-http': true, // RFC 6442
      'geolocation-sip': true, // RFC 6442
      gin: true, // RFC 6140
      gruu: true, // RFC 5627
      histinfo: true, // RFC 7044
      ice: true, // RFC 5768
      join: true, // RFC 3911
      'multiple-refer': true, // RFC 5368
      norefersub: true, // RFC 4488
      nosub: true, // RFC-ietf-sipcore-refer-explicit-subscription-03
      outbound: true, // RFC 5626
      path: true, // RFC 3327
      policy: true, // RFC 6794
      precondition: true, // RFC 3312
      pref: true, // RFC 3840
      privacy: true, // RFC 3323
      'recipient-list-invite': true, // RFC 5366
      'recipient-list-message': true, // RFC 5365
      'recipient-list-subscribe': true, // RFC 5367
      replaces: true, // RFC 3891
      'resource-priority': true, // RFC 4412
      'sdp-anat': true, // RFC 4092
      'sec-agree': true, // RFC 3329
      tdialog: true, // RFC 4538
      timer: true, // RFC 4028
      uui: true // RFC 7433
    },

    dtmfType: {
      INFO: 'info',
      RTP: 'rtp'
    }
  };
};

/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/**
 * @fileoverview Exceptions
 */

/**
 * SIP Exceptions.
 * @augments SIP
 */

module.exports = {
  ConfigurationError: function () {
    var exception = function exception(parameter, value) {
      this.code = 1;
      this.name = 'CONFIGURATION_ERROR';
      this.parameter = parameter;
      this.value = value;
      this.message = !this.value ? 'Missing parameter: ' + this.parameter : 'Invalid value ' + JSON.stringify(this.value) + ' for parameter "' + this.parameter + '"';
    };
    exception.prototype = new Error();
    return exception;
  }(),

  InvalidStateError: function () {
    var exception = function exception(status) {
      this.code = 2;
      this.name = 'INVALID_STATE_ERROR';
      this.status = status;
      this.message = 'Invalid status: ' + status;
    };
    exception.prototype = new Error();
    return exception;
  }(),

  NotSupportedError: function () {
    var exception = function exception(message) {
      this.code = 3;
      this.name = 'NOT_SUPPORTED_ERROR';
      this.message = message;
    };
    exception.prototype = new Error();
    return exception;
  }(),

  GetDescriptionError: function () {
    var exception = function exception(message) {
      this.code = 4;
      this.name = 'GET_DESCRIPTION_ERROR';
      this.message = message;
    };
    exception.prototype = new Error();
    return exception;
  }(),

  RenegotiationError: function () {
    var exception = function exception(message) {
      this.code = 5;
      this.name = 'RENEGOTIATION_ERROR';
      this.message = message;
    };
    exception.prototype = new Error();
    return exception;
  }(),

  MethodParameterError: function () {
    var exception = function exception(method, parameter, value) {
      this.code = 6;
      this.name = 'METHOD_PARAMETER_ERROR';
      this.method = method;
      this.parameter = parameter;
      this.value = value;
      this.message = !this.value ? 'Missing parameter: ' + this.parameter : 'Invalid value ' + JSON.stringify(this.value) + ' for parameter "' + this.parameter + '"';
    };
    exception.prototype = new Error();
    return exception;
  }(),

  TransportError: function () {
    var exception = function exception(message) {
      this.code = 7;
      this.name = 'TRANSPORT_ERROR';
      this.message = message;
    };
    exception.prototype = new Error();
    return exception;
  }()
};

/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/**
 * @fileoverview SIP TIMERS
 */

/**
 * @augments SIP
 */

var T1 = 500,
    T2 = 4000,
    T4 = 5000;
module.exports = function (timers) {
  var Timers = {
    T1: T1,
    T2: T2,
    T4: T4,
    TIMER_B: 64 * T1,
    TIMER_D: 0 * T1,
    TIMER_F: 64 * T1,
    TIMER_H: 64 * T1,
    TIMER_I: 0 * T1,
    TIMER_J: 0 * T1,
    TIMER_K: 0 * T4,
    TIMER_L: 64 * T1,
    TIMER_M: 64 * T1,
    TIMER_N: 64 * T1,
    PROVISIONAL_RESPONSE_INTERVAL: 60000 // See RFC 3261 Section 13.3.1.1
  };

  ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'].forEach(function (name) {
    // can't just use timers[name].bind(timers) since it bypasses jasmine's
    // clock-mocking
    Timers[name] = function () {
      return timers[name].apply(timers, arguments);
    };
  });

  return Timers;
};

/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/* eslint-disable */
/**
 * @fileoverview Transport
 */

/* Transport
 * @class Abstract transport layer parent class
 * @param {Logger} logger
 * @param {Object} [options]
 */

module.exports = function (SIP) {
  var Transport = function Transport(logger, options) {};

  Transport.prototype = Object.create(SIP.EventEmitter.prototype, {

    /**
    * Returns the promise designated by the child layer then emits a connected event. Automatically emits an event upon resolution, unless overrideEvent is set. If you override the event in this fashion, you should emit it in your implementation of connectPromise
    * @param {Object} [options]
    * @returns {Promise}
    */
    connect: { writable: true, value: function connect(options) {
        options = options || {};
        return this.connectPromise(options).then(function (data) {
          !data.overrideEvent && this.emit('connected');
        }.bind(this));
      } },

    /**
    * Called by connect, must return a promise
    * promise must resolve to an object. object supports 1 parameter: overrideEvent - Boolean
    * @abstract
    * @private
    * @param {Object} [options]
    * @returns {Promise}
    */
    connectPromise: { writable: true, value: function connectPromise(options) {} },

    /**
    * Returns true if the transport is connected
    * @abstract
    * @returns {Boolean}
    */
    isConnected: { writable: true, value: function isConnected() {} },

    /**
    * Sends a message then emits a 'messageSent' event. Automatically emits an event upon resolution, unless data.overrideEvent is set. If you override the event in this fashion, you should emit it in your implementation of sendPromise
    * @param {SIP.OutgoingRequest|String} msg
    * @param {Object} options
    * @returns {Promise}
    */
    send: { writable: true, value: function send(msg, options) {
        options = options || {};
        return this.sendPromise(msg).then(function (data) {
          !data.overrideEvent && this.emit('messageSent', data.msg);
        }.bind(this));
      } },

    /**
    * Called by send, must return a promise
    * promise must resolve to an object. object supports 2 parameters: msg - string (mandatory) and overrideEvent - Boolean (optional)
    * @abstract
    * @private
    * @param {SIP.OutgoingRequest|String} msg
    * @param {Object} [options]
    * @returns {Promise}
    */
    sendPromise: { writable: true, value: function sendPromise(msg, options) {} },

    /**
    * To be called when a message is received
    * @abstract
    * @param {Event} e
    */
    onMessage: { writable: true, value: function onMessage(e) {} },

    /**
    * Returns the promise designated by the child layer then emits a disconnected event. Automatically emits an event upon resolution, unless overrideEvent is set. If you override the event in this fashion, you should emit it in your implementation of disconnectPromise
    * @param {Object} [options]
    * @returns {Promise}
    */
    disconnect: { writable: true, value: function disconnect(options) {
        options = options || {};
        return this.disconnectPromise(options).then(function (data) {
          !data.overrideEvent && this.emit('disconnected');
        }.bind(this));
      } },

    /**
    * Called by disconnect, must return a promise
    * promise must resolve to an object. object supports 1 parameter: overrideEvent - Boolean
    * @abstract
    * @private
    * @param {Object} [options]
    * @returns {Promise}
    */
    disconnectPromise: { writable: true, value: function disconnectPromise(options) {} },

    afterConnected: { writable: true, value: function afterConnected(callback) {
        if (this.isConnected()) {
          callback();
        } else {
          this.once('connected', callback);
        }
      } },

    /**
     * Returns a promise which resolves once the UA is connected. DEPRECATION WARNING: just use afterConnected()
     * @returns {Promise}
     */
    waitForConnected: { writable: true, value: function waitForConnected() {
        console.warn("DEPRECATION WARNING Transport.waitForConnected(): use afterConnected() instead");
        return new SIP.Utils.Promise(function (resolve) {
          this.afterConnected(resolve);
        }.bind(this));
      } }
  });

  return Transport;
};

/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/**
 * @fileoverview SIP Message Parser
 */

/**
 * Extract and parse every header of a SIP message.
 * @augments SIP
 * @namespace
 */

module.exports = function (SIP) {
  var Parser;

  function getHeader(data, headerStart) {
    var
    // 'start' position of the header.
    start = headerStart,

    // 'end' position of the header.
    end = 0,

    // 'partial end' position of the header.
    partialEnd = 0;

    //End of message.
    if (data.substring(start, start + 2).match(/(^\r\n)/)) {
      return -2;
    }

    while (end === 0) {
      // Partial End of Header.
      partialEnd = data.indexOf('\r\n', start);

      // 'indexOf' returns -1 if the value to be found never occurs.
      if (partialEnd === -1) {
        return partialEnd;
      }

      if (!data.substring(partialEnd + 2, partialEnd + 4).match(/(^\r\n)/) && data.charAt(partialEnd + 2).match(/(^\s+)/)) {
        // Not the end of the message. Continue from the next position.
        start = partialEnd + 2;
      } else {
        end = partialEnd;
      }
    }

    return end;
  }

  function parseHeader(message, data, headerStart, headerEnd) {
    var header,
        idx,
        length,
        parsed,
        hcolonIndex = data.indexOf(':', headerStart),
        headerName = data.substring(headerStart, hcolonIndex).trim(),
        headerValue = data.substring(hcolonIndex + 1, headerEnd).trim();

    // If header-field is well-known, parse it.
    switch (headerName.toLowerCase()) {
      case 'via':
      case 'v':
        message.addHeader('via', headerValue);
        if (message.getHeaders('via').length === 1) {
          parsed = message.parseHeader('Via');
          if (parsed) {
            message.via = parsed;
            message.via_branch = parsed.branch;
          }
        } else {
          parsed = 0;
        }
        break;
      case 'from':
      case 'f':
        message.setHeader('from', headerValue);
        parsed = message.parseHeader('from');
        if (parsed) {
          message.from = parsed;
          message.from_tag = parsed.getParam('tag');
        }
        break;
      case 'to':
      case 't':
        message.setHeader('to', headerValue);
        parsed = message.parseHeader('to');
        if (parsed) {
          message.to = parsed;
          message.to_tag = parsed.getParam('tag');
        }
        break;
      case 'record-route':
        parsed = SIP.Grammar.parse(headerValue, 'Record_Route');

        if (parsed === -1) {
          parsed = undefined;
          break;
        }

        length = parsed.length;
        for (idx = 0; idx < length; idx++) {
          header = parsed[idx];
          message.addHeader('record-route', headerValue.substring(header.position, header.offset));
          message.headers['Record-Route'][message.getHeaders('record-route').length - 1].parsed = header.parsed;
        }
        break;
      case 'call-id':
      case 'i':
        message.setHeader('call-id', headerValue);
        parsed = message.parseHeader('call-id');
        if (parsed) {
          message.call_id = headerValue;
        }
        break;
      case 'contact':
      case 'm':
        parsed = SIP.Grammar.parse(headerValue, 'Contact');

        if (parsed === -1) {
          parsed = undefined;
          break;
        }

        length = parsed.length;
        for (idx = 0; idx < length; idx++) {
          header = parsed[idx];
          message.addHeader('contact', headerValue.substring(header.position, header.offset));
          message.headers['Contact'][message.getHeaders('contact').length - 1].parsed = header.parsed;
        }
        break;
      case 'content-length':
      case 'l':
        message.setHeader('content-length', headerValue);
        parsed = message.parseHeader('content-length');
        break;
      case 'content-type':
      case 'c':
        message.setHeader('content-type', headerValue);
        parsed = message.parseHeader('content-type');
        break;
      case 'cseq':
        message.setHeader('cseq', headerValue);
        parsed = message.parseHeader('cseq');
        if (parsed) {
          message.cseq = parsed.value;
        }
        if (message instanceof SIP.IncomingResponse) {
          message.method = parsed.method;
        }
        break;
      case 'max-forwards':
        message.setHeader('max-forwards', headerValue);
        parsed = message.parseHeader('max-forwards');
        break;
      case 'www-authenticate':
        message.setHeader('www-authenticate', headerValue);
        parsed = message.parseHeader('www-authenticate');
        break;
      case 'proxy-authenticate':
        message.setHeader('proxy-authenticate', headerValue);
        parsed = message.parseHeader('proxy-authenticate');
        break;
      case 'refer-to':
      case 'r':
        message.setHeader('refer-to', headerValue);
        parsed = message.parseHeader('refer-to');
        if (parsed) {
          message.refer_to = parsed;
        }
        break;
      default:
        // Do not parse this header.
        message.setHeader(headerName, headerValue);
        parsed = 0;
    }

    if (parsed === undefined) {
      return {
        error: 'error parsing header "' + headerName + '"'
      };
    } else {
      return true;
    }
  }

  /** Parse SIP Message
   * @function
   * @param {String} message SIP message.
   * @param {Object} logger object.
   * @returns {SIP.IncomingRequest|SIP.IncomingResponse|undefined}
   */
  Parser = {};
  Parser.parseMessage = function (data, ua) {
    var message,
        firstLine,
        contentLength,
        bodyStart,
        parsed,
        headerStart = 0,
        headerEnd = data.indexOf('\r\n'),
        logger = ua.getLogger('sip.parser');

    if (headerEnd === -1) {
      logger.warn('no CRLF found, not a SIP message, discarded');
      return;
    }

    // Parse first line. Check if it is a Request or a Reply.
    firstLine = data.substring(0, headerEnd);
    parsed = SIP.Grammar.parse(firstLine, 'Request_Response');

    if (parsed === -1) {
      logger.warn('error parsing first line of SIP message: "' + firstLine + '"');
      return;
    } else if (!parsed.status_code) {
      message = new SIP.IncomingRequest(ua);
      message.method = parsed.method;
      message.ruri = parsed.uri;
    } else {
      message = new SIP.IncomingResponse(ua);
      message.status_code = parsed.status_code;
      message.reason_phrase = parsed.reason_phrase;
    }

    message.data = data;
    headerStart = headerEnd + 2;

    /* Loop over every line in data. Detect the end of each header and parse
    * it or simply add to the headers collection.
    */
    while (true) {
      headerEnd = getHeader(data, headerStart);

      // The SIP message has normally finished.
      if (headerEnd === -2) {
        bodyStart = headerStart + 2;
        break;
      }
      // data.indexOf returned -1 due to a malformed message.
      else if (headerEnd === -1) {
          logger.error('malformed message');
          return;
        }

      parsed = parseHeader(message, data, headerStart, headerEnd);

      if (parsed !== true) {
        logger.error(parsed.error);
        return;
      }

      headerStart = headerEnd + 2;
    }

    /* RFC3261 18.3.
     * If there are additional bytes in the transport packet
     * beyond the end of the body, they MUST be discarded.
     */
    if (message.hasHeader('content-length')) {
      contentLength = message.getHeader('content-length');
      message.body = data.substr(bodyStart, contentLength);
    } else {
      message.body = data.substring(bodyStart);
    }

    return message;
  };

  SIP.Parser = Parser;
};

/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/**
 * @fileoverview SIP Message
 */

module.exports = function (SIP) {
  var OutgoingRequest, IncomingMessage, IncomingRequest, IncomingResponse;

  function getSupportedHeader(request) {
    var allowUnregistered = request.ua.configuration.hackAllowUnregisteredOptionTags;
    var optionTags = [];
    var optionTagSet = {};

    if (request.method === SIP.C.REGISTER) {
      optionTags.push('path', 'gruu');
    } else if (request.method === SIP.C.INVITE && (request.ua.contact.pub_gruu || request.ua.contact.temp_gruu)) {
      optionTags.push('gruu');
    }

    if (request.ua.configuration.rel100 === SIP.C.supported.SUPPORTED) {
      optionTags.push('100rel');
    }
    if (request.ua.configuration.replaces === SIP.C.supported.SUPPORTED) {
      optionTags.push('replaces');
    }

    optionTags.push('outbound');

    optionTags = optionTags.concat(request.ua.configuration.extraSupported);

    optionTags = optionTags.filter(function (optionTag) {
      var registered = SIP.C.OPTION_TAGS[optionTag];
      var unique = !optionTagSet[optionTag];
      optionTagSet[optionTag] = true;
      return (registered || allowUnregistered) && unique;
    });

    return 'Supported: ' + optionTags.join(', ') + '\r\n';
  }

  /**
   * @augments SIP
   * @class Class for outgoing SIP request.
   * @param {String} method request method
   * @param {String} ruri request uri
   * @param {SIP.UA} ua
   * @param {Object} params parameters that will have priority over ua.configuration parameters:
   * <br>
   *  - cseq, call_id, from_tag, from_uri, from_displayName, to_uri, to_tag, route_set
   * @param {Object} [headers] extra headers
   * @param {String} [body]
   */
  OutgoingRequest = function OutgoingRequest(method, ruri, ua, params, extraHeaders, body) {
    var to, from, call_id, cseq, to_uri, from_uri;

    params = params || {};

    // Mandatory parameters check
    if (!method || !ruri || !ua) {
      return null;
    }

    this.logger = ua.getLogger('sip.sipmessage');
    this.ua = ua;
    this.headers = {};
    this.method = method;
    this.ruri = ruri;
    this.body = body;
    this.extraHeaders = (extraHeaders || []).slice();
    this.statusCode = params.status_code;
    this.reasonPhrase = params.reason_phrase;

    // Fill the Common SIP Request Headers

    // Route
    if (params.route_set) {
      this.setHeader('route', params.route_set);
    } else if (ua.configuration.usePreloadedRoute) {
      this.setHeader('route', ua.transport.server.sip_uri);
    }

    // Via
    // Empty Via header. Will be filled by the client transaction.
    this.setHeader('via', '');

    // Max-Forwards
    this.setHeader('max-forwards', SIP.UA.C.MAX_FORWARDS);

    // To
    to_uri = params.to_uri || ruri;
    to = params.to_displayName || params.to_displayName === 0 ? '"' + params.to_displayName + '" ' : '';
    to += '<' + (to_uri && to_uri.toRaw ? to_uri.toRaw() : to_uri) + '>';
    to += params.to_tag ? ';tag=' + params.to_tag : '';
    this.to = new SIP.NameAddrHeader.parse(to);
    this.setHeader('to', to);

    // From
    from_uri = params.from_uri || ua.configuration.uri;
    if (params.from_displayName || params.from_displayName === 0) {
      from = '"' + params.from_displayName + '" ';
    } else if (ua.configuration.displayName) {
      from = '"' + ua.configuration.displayName + '" ';
    } else {
      from = '';
    }
    from += '<' + (from_uri && from_uri.toRaw ? from_uri.toRaw() : from_uri) + '>;tag=';
    from += params.from_tag || SIP.Utils.newTag();
    this.from = new SIP.NameAddrHeader.parse(from);
    this.setHeader('from', from);

    // Call-ID
    call_id = params.call_id || ua.configuration.sipjsId + SIP.Utils.createRandomToken(15);
    this.call_id = call_id;
    this.setHeader('call-id', call_id);

    // CSeq
    cseq = params.cseq || Math.floor(Math.random() * 10000);
    this.cseq = cseq;
    this.setHeader('cseq', cseq + ' ' + method);
  };

  OutgoingRequest.prototype = {
    /**
     * Replace the the given header by the given value.
     * @param {String} name header name
     * @param {String | Array} value header value
     */
    setHeader: function setHeader(name, value) {
      this.headers[SIP.Utils.headerize(name)] = value instanceof Array ? value : [value];
    },

    /**
     * Get the value of the given header name at the given position.
     * @param {String} name header name
     * @returns {String|undefined} Returns the specified header, undefined if header doesn't exist.
     */
    getHeader: function getHeader(name) {
      var regexp,
          idx,
          length = this.extraHeaders.length,
          header = this.headers[SIP.Utils.headerize(name)];

      if (header) {
        if (header[0]) {
          return header[0];
        }
      } else {
        regexp = new RegExp('^\\s*' + name + '\\s*:', 'i');
        for (idx = 0; idx < length; idx++) {
          header = this.extraHeaders[idx];
          if (regexp.test(header)) {
            return header.substring(header.indexOf(':') + 1).trim();
          }
        }
      }

      return;
    },

    /**
     * Get the header/s of the given name.
     * @param {String} name header name
     * @returns {Array} Array with all the headers of the specified name.
     */
    getHeaders: function getHeaders(name) {
      var idx,
          length,
          regexp,
          header = this.headers[SIP.Utils.headerize(name)],
          result = [];

      if (header) {
        length = header.length;
        for (idx = 0; idx < length; idx++) {
          result.push(header[idx]);
        }
        return result;
      } else {
        length = this.extraHeaders.length;
        regexp = new RegExp('^\\s*' + name + '\\s*:', 'i');
        for (idx = 0; idx < length; idx++) {
          header = this.extraHeaders[idx];
          if (regexp.test(header)) {
            result.push(header.substring(header.indexOf(':') + 1).trim());
          }
        }
        return result;
      }
    },

    /**
     * Verify the existence of the given header.
     * @param {String} name header name
     * @returns {boolean} true if header with given name exists, false otherwise
     */
    hasHeader: function hasHeader(name) {
      var regexp,
          idx,
          length = this.extraHeaders.length;

      if (this.headers[SIP.Utils.headerize(name)]) {
        return true;
      } else {
        regexp = new RegExp('^\\s*' + name + '\\s*:', 'i');
        for (idx = 0; idx < length; idx++) {
          if (regexp.test(this.extraHeaders[idx])) {
            return true;
          }
        }
      }

      return false;
    },

    toString: function toString() {
      var msg = '',
          header,
          length,
          idx;

      msg += this.method + ' ' + (this.ruri.toRaw ? this.ruri.toRaw() : this.ruri) + ' SIP/2.0\r\n';

      for (header in this.headers) {
        length = this.headers[header].length;
        for (idx = 0; idx < length; idx++) {
          msg += header + ': ' + this.headers[header][idx] + '\r\n';
        }
      }

      length = this.extraHeaders.length;
      for (idx = 0; idx < length; idx++) {
        msg += this.extraHeaders[idx].trim() + '\r\n';
      }

      msg += getSupportedHeader(this);
      msg += 'User-Agent: ' + this.ua.configuration.userAgentString + '\r\n';

      if (this.body) {
        if (typeof this.body === 'string') {
          length = SIP.Utils.str_utf8_length(this.body);
          msg += 'Content-Length: ' + length + '\r\n\r\n';
          msg += this.body;
        } else {
          if (this.body.body && this.body.contentType) {
            length = SIP.Utils.str_utf8_length(this.body.body);
            msg += 'Content-Type: ' + this.body.contentType + '\r\n';
            msg += 'Content-Length: ' + length + '\r\n\r\n';
            msg += this.body.body;
          } else {
            msg += 'Content-Length: ' + 0 + '\r\n\r\n';
          }
        }
      } else {
        msg += 'Content-Length: ' + 0 + '\r\n\r\n';
      }

      return msg;
    }
  };

  /**
   * @augments SIP
   * @class Class for incoming SIP message.
   */
  IncomingMessage = function IncomingMessage() {
    this.data = null;
    this.headers = null;
    this.method = null;
    this.via = null;
    this.via_branch = null;
    this.call_id = null;
    this.cseq = null;
    this.from = null;
    this.from_tag = null;
    this.to = null;
    this.to_tag = null;
    this.body = null;
  };

  IncomingMessage.prototype = {
    /**
    * Insert a header of the given name and value into the last position of the
    * header array.
    * @param {String} name header name
    * @param {String} value header value
    */
    addHeader: function addHeader(name, value) {
      var header = { raw: value };

      name = SIP.Utils.headerize(name);

      if (this.headers[name]) {
        this.headers[name].push(header);
      } else {
        this.headers[name] = [header];
      }
    },

    /**
     * Get the value of the given header name at the given position.
     * @param {String} name header name
     * @returns {String|undefined} Returns the specified header, null if header doesn't exist.
     */
    getHeader: function getHeader(name) {
      var header = this.headers[SIP.Utils.headerize(name)];

      if (header) {
        if (header[0]) {
          return header[0].raw;
        }
      } else {
        return;
      }
    },

    /**
     * Get the header/s of the given name.
     * @param {String} name header name
     * @returns {Array} Array with all the headers of the specified name.
     */
    getHeaders: function getHeaders(name) {
      var idx,
          length,
          header = this.headers[SIP.Utils.headerize(name)],
          result = [];

      if (!header) {
        return [];
      }

      length = header.length;
      for (idx = 0; idx < length; idx++) {
        result.push(header[idx].raw);
      }

      return result;
    },

    /**
     * Verify the existence of the given header.
     * @param {String} name header name
     * @returns {boolean} true if header with given name exists, false otherwise
     */
    hasHeader: function hasHeader(name) {
      return this.headers[SIP.Utils.headerize(name)] ? true : false;
    },

    /**
    * Parse the given header on the given index.
    * @param {String} name header name
    * @param {Number} [idx=0] header index
    * @returns {Object|undefined} Parsed header object, undefined if the header is not present or in case of a parsing error.
    */
    parseHeader: function parseHeader(name, idx) {
      var header, value, parsed;

      name = SIP.Utils.headerize(name);

      idx = idx || 0;

      if (!this.headers[name]) {
        this.logger.log('header "' + name + '" not present');
        return;
      } else if (idx >= this.headers[name].length) {
        this.logger.log('not so many "' + name + '" headers present');
        return;
      }

      header = this.headers[name][idx];
      value = header.raw;

      if (header.parsed) {
        return header.parsed;
      }

      //substitute '-' by '_' for grammar rule matching.
      parsed = SIP.Grammar.parse(value, name.replace(/-/g, '_'));

      if (parsed === -1) {
        this.headers[name].splice(idx, 1); //delete from headers
        this.logger.warn('error parsing "' + name + '" header field with value "' + value + '"');
        return;
      } else {
        header.parsed = parsed;
        return parsed;
      }
    },

    /**
     * Message Header attribute selector. Alias of parseHeader.
     * @param {String} name header name
     * @param {Number} [idx=0] header index
     * @returns {Object|undefined} Parsed header object, undefined if the header is not present or in case of a parsing error.
     *
     * @example
     * message.s('via',3).port
     */
    s: function s(name, idx) {
      return this.parseHeader(name, idx);
    },

    /**
    * Replace the value of the given header by the value.
    * @param {String} name header name
    * @param {String} value header value
    */
    setHeader: function setHeader(name, value) {
      var header = { raw: value };
      this.headers[SIP.Utils.headerize(name)] = [header];
    },

    toString: function toString() {
      return this.data;
    }
  };

  /**
   * @augments IncomingMessage
   * @class Class for incoming SIP request.
   */
  IncomingRequest = function IncomingRequest(ua) {
    this.logger = ua.getLogger('sip.sipmessage');
    this.ua = ua;
    this.headers = {};
    this.ruri = null;
    this.transport = null;
    this.server_transaction = null;
  };
  IncomingRequest.prototype = new IncomingMessage();

  /**
  * Stateful reply.
  * @param {Number} code status code
  * @param {String} reason reason phrase
  * @param {Object} headers extra headers
  * @param {String} body body
  * @param {Function} [onSuccess] onSuccess callback
  * @param {Function} [onFailure] onFailure callback
  */
  // TODO: Get rid of callbacks and make promise based
  IncomingRequest.prototype.reply = function (code, reason, extraHeaders, body, onSuccess, onFailure) {
    var rr,
        vias,
        length,
        idx,
        response,
        to = this.getHeader('To'),
        r = 0,
        v = 0;

    response = SIP.Utils.buildStatusLine(code, reason);
    extraHeaders = (extraHeaders || []).slice();

    if (this.method === SIP.C.INVITE && code > 100 && code <= 200) {
      rr = this.getHeaders('record-route');
      length = rr.length;

      for (r; r < length; r++) {
        response += 'Record-Route: ' + rr[r] + '\r\n';
      }
    }

    vias = this.getHeaders('via');
    length = vias.length;

    for (v; v < length; v++) {
      response += 'Via: ' + vias[v] + '\r\n';
    }

    if (!this.to_tag && code > 100) {
      to += ';tag=' + SIP.Utils.newTag();
    } else if (this.to_tag && !this.s('to').hasParam('tag')) {
      to += ';tag=' + this.to_tag;
    }

    response += 'To: ' + to + '\r\n';
    response += 'From: ' + this.getHeader('From') + '\r\n';
    response += 'Call-ID: ' + this.call_id + '\r\n';
    response += 'CSeq: ' + this.cseq + ' ' + this.method + '\r\n';

    length = extraHeaders.length;
    for (idx = 0; idx < length; idx++) {
      response += extraHeaders[idx].trim() + '\r\n';
    }

    response += getSupportedHeader(this);
    response += 'User-Agent: ' + this.ua.configuration.userAgentString + '\r\n';

    if (body) {
      if (typeof body === 'string') {
        length = SIP.Utils.str_utf8_length(body);
        response += 'Content-Type: application/sdp\r\n';
        response += 'Content-Length: ' + length + '\r\n\r\n';
        response += body;
      } else {
        if (body.body && body.contentType) {
          length = SIP.Utils.str_utf8_length(body.body);
          response += 'Content-Type: ' + body.contentType + '\r\n';
          response += 'Content-Length: ' + length + '\r\n\r\n';
          response += body.body;
        } else {
          response += 'Content-Length: ' + 0 + '\r\n\r\n';
        }
      }
    } else {
      response += 'Content-Length: ' + 0 + '\r\n\r\n';
    }

    this.server_transaction.receiveResponse(code, response).then(onSuccess, onFailure);

    return response;
  };

  /**
  * Stateless reply.
  * @param {Number} code status code
  * @param {String} reason reason phrase
  */
  IncomingRequest.prototype.reply_sl = function (code, reason) {
    var to,
        response,
        v = 0,
        vias = this.getHeaders('via'),
        length = vias.length;

    response = SIP.Utils.buildStatusLine(code, reason);

    for (v; v < length; v++) {
      response += 'Via: ' + vias[v] + '\r\n';
    }

    to = this.getHeader('To');

    if (!this.to_tag && code > 100) {
      to += ';tag=' + SIP.Utils.newTag();
    } else if (this.to_tag && !this.s('to').hasParam('tag')) {
      to += ';tag=' + this.to_tag;
    }

    response += 'To: ' + to + '\r\n';
    response += 'From: ' + this.getHeader('From') + '\r\n';
    response += 'Call-ID: ' + this.call_id + '\r\n';
    response += 'CSeq: ' + this.cseq + ' ' + this.method + '\r\n';
    response += 'User-Agent: ' + this.ua.configuration.userAgentString + '\r\n';
    response += 'Content-Length: ' + 0 + '\r\n\r\n';

    this.transport.send(response);
  };

  /**
   * @augments IncomingMessage
   * @class Class for incoming SIP response.
   */
  IncomingResponse = function IncomingResponse(ua) {
    this.logger = ua.getLogger('sip.sipmessage');
    this.headers = {};
    this.status_code = null;
    this.reason_phrase = null;
  };
  IncomingResponse.prototype = new IncomingMessage();

  SIP.OutgoingRequest = OutgoingRequest;
  SIP.IncomingRequest = IncomingRequest;
  SIP.IncomingResponse = IncomingResponse;
};

/***/ }),
/* 13 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/**
 * @fileoverview SIP URI
 */

/**
 * @augments SIP
 * @class Class creating a SIP URI.
 *
 * @param {String} [scheme]
 * @param {String} [user]
 * @param {String} host
 * @param {String} [port]
 * @param {Object} [parameters]
 * @param {Object} [headers]
 *
 */

module.exports = function (SIP) {
  var URI;

  URI = function URI(scheme, user, host, port, parameters, headers) {
    var param, header, raw, normal;

    // Checks
    if (!host) {
      throw new TypeError('missing or invalid "host" parameter');
    }

    // Initialize parameters
    scheme = scheme || SIP.C.SIP;
    this.parameters = {};
    this.headers = {};

    for (param in parameters) {
      this.setParam(param, parameters[param]);
    }

    for (header in headers) {
      this.setHeader(header, headers[header]);
    }

    // Raw URI
    raw = {
      scheme: scheme,
      user: user,
      host: host,
      port: port
    };

    // Normalized URI
    normal = {
      scheme: scheme.toLowerCase(),
      user: user,
      host: host.toLowerCase(),
      port: port
    };

    Object.defineProperties(this, {
      _normal: {
        get: function get() {
          return normal;
        }
      },

      _raw: {
        get: function get() {
          return raw;
        }
      },

      scheme: {
        get: function get() {
          return normal.scheme;
        },
        set: function set(value) {
          raw.scheme = value;
          normal.scheme = value.toLowerCase();
        }
      },

      user: {
        get: function get() {
          return normal.user;
        },
        set: function set(value) {
          normal.user = raw.user = value;
        }
      },

      host: {
        get: function get() {
          return normal.host;
        },
        set: function set(value) {
          raw.host = value;
          normal.host = value.toLowerCase();
        }
      },

      aor: {
        get: function get() {
          return normal.user + '@' + normal.host;
        }
      },

      port: {
        get: function get() {
          return normal.port;
        },
        set: function set(value) {
          normal.port = raw.port = value === 0 ? value : parseInt(value, 10) || null;
        }
      }
    });
  };

  URI.prototype = {
    setParam: function setParam(key, value) {
      if (key) {
        this.parameters[key.toLowerCase()] = typeof value === 'undefined' || value === null ? null : value.toString().toLowerCase();
      }
    },

    getParam: function getParam(key) {
      if (key) {
        return this.parameters[key.toLowerCase()];
      }
    },

    hasParam: function hasParam(key) {
      if (key) {
        return this.parameters.hasOwnProperty(key.toLowerCase()) && true || false;
      }
    },

    deleteParam: function deleteParam(parameter) {
      var value;
      parameter = parameter.toLowerCase();
      if (this.parameters.hasOwnProperty(parameter)) {
        value = this.parameters[parameter];
        delete this.parameters[parameter];
        return value;
      }
    },

    clearParams: function clearParams() {
      this.parameters = {};
    },

    setHeader: function setHeader(name, value) {
      this.headers[SIP.Utils.headerize(name)] = value instanceof Array ? value : [value];
    },

    getHeader: function getHeader(name) {
      if (name) {
        return this.headers[SIP.Utils.headerize(name)];
      }
    },

    hasHeader: function hasHeader(name) {
      if (name) {
        return this.headers.hasOwnProperty(SIP.Utils.headerize(name)) && true || false;
      }
    },

    deleteHeader: function deleteHeader(header) {
      var value;
      header = SIP.Utils.headerize(header);
      if (this.headers.hasOwnProperty(header)) {
        value = this.headers[header];
        delete this.headers[header];
        return value;
      }
    },

    clearHeaders: function clearHeaders() {
      this.headers = {};
    },

    clone: function clone() {
      return new URI(this._raw.scheme, this._raw.user, this._raw.host, this._raw.port, JSON.parse(JSON.stringify(this.parameters)), JSON.parse(JSON.stringify(this.headers)));
    },

    toRaw: function toRaw() {
      return this._toString(this._raw);
    },

    toString: function toString() {
      return this._toString(this._normal);
    },

    _toString: function _toString(uri) {
      var header,
          parameter,
          idx,
          uriString,
          headers = [];

      uriString = uri.scheme + ':';
      // add slashes if it's not a sip(s) URI
      if (!uri.scheme.toLowerCase().match("^sips?$")) {
        uriString += "//";
      }
      if (uri.user) {
        uriString += SIP.Utils.escapeUser(uri.user) + '@';
      }
      uriString += uri.host;
      if (uri.port || uri.port === 0) {
        uriString += ':' + uri.port;
      }

      for (parameter in this.parameters) {
        uriString += ';' + parameter;

        if (this.parameters[parameter] !== null) {
          uriString += '=' + this.parameters[parameter];
        }
      }

      for (header in this.headers) {
        for (idx in this.headers[header]) {
          headers.push(header + '=' + this.headers[header][idx]);
        }
      }

      if (headers.length > 0) {
        uriString += '?' + headers.join('&');
      }

      return uriString;
    }
  };

  /**
    * Parse the given string and returns a SIP.URI instance or undefined if
    * it is an invalid URI.
    * @public
    * @param {String} uri
    */
  URI.parse = function (uri) {
    uri = SIP.Grammar.parse(uri, 'SIP_URI');

    if (uri !== -1) {
      return uri;
    } else {
      return undefined;
    }
  };

  SIP.URI = URI;
};

/***/ }),
/* 14 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/**
 * @fileoverview SIP NameAddrHeader
 */

/**
 * @augments SIP
 * @class Class creating a Name Address SIP header.
 *
 * @param {SIP.URI} uri
 * @param {String} [displayName]
 * @param {Object} [parameters]
 *
 */

module.exports = function (SIP) {
  var NameAddrHeader;

  NameAddrHeader = function NameAddrHeader(uri, displayName, parameters) {
    var param;

    // Checks
    if (!uri || !(uri instanceof SIP.URI)) {
      throw new TypeError('missing or invalid "uri" parameter');
    }

    // Initialize parameters
    this.uri = uri;
    this.parameters = {};

    for (param in parameters) {
      this.setParam(param, parameters[param]);
    }

    Object.defineProperties(this, {
      friendlyName: {
        get: function get() {
          return this.displayName || uri.aor;
        }
      },

      displayName: {
        get: function get() {
          return displayName;
        },
        set: function set(value) {
          displayName = value === 0 ? '0' : value;
        }
      }
    });
  };
  NameAddrHeader.prototype = {
    setParam: function setParam(key, value) {
      if (key) {
        this.parameters[key.toLowerCase()] = typeof value === 'undefined' || value === null ? null : value.toString();
      }
    },
    getParam: SIP.URI.prototype.getParam,
    hasParam: SIP.URI.prototype.hasParam,
    deleteParam: SIP.URI.prototype.deleteParam,
    clearParams: SIP.URI.prototype.clearParams,

    clone: function clone() {
      return new NameAddrHeader(this.uri.clone(), this.displayName, JSON.parse(JSON.stringify(this.parameters)));
    },

    toString: function toString() {
      var body, parameter;

      body = this.displayName || this.displayName === 0 ? '"' + this.displayName + '" ' : '';
      body += '<' + this.uri.toString() + '>';

      for (parameter in this.parameters) {
        body += ';' + parameter;

        if (this.parameters[parameter] !== null) {
          body += '=' + this.parameters[parameter];
        }
      }

      return body;
    }
  };

  /**
    * Parse the given string and returns a SIP.NameAddrHeader instance or undefined if
    * it is an invalid NameAddrHeader.
    * @public
    * @param {String} name_addr_header
    */
  NameAddrHeader.parse = function (name_addr_header) {
    name_addr_header = SIP.Grammar.parse(name_addr_header, 'Name_Addr_Header');

    if (name_addr_header !== -1) {
      return name_addr_header;
    } else {
      return undefined;
    }
  };

  SIP.NameAddrHeader = NameAddrHeader;
};

/***/ }),
/* 15 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/**
 * @fileoverview SIP Transactions
 */

/**
 * SIP Transactions module.
 * @augments SIP
 */

module.exports = function (SIP) {
  var C = {
    // Transaction states
    STATUS_TRYING: 1,
    STATUS_PROCEEDING: 2,
    STATUS_CALLING: 3,
    STATUS_ACCEPTED: 4,
    STATUS_COMPLETED: 5,
    STATUS_TERMINATED: 6,
    STATUS_CONFIRMED: 7,

    // Transaction types
    NON_INVITE_CLIENT: 'nict',
    NON_INVITE_SERVER: 'nist',
    INVITE_CLIENT: 'ict',
    INVITE_SERVER: 'ist'
  };

  function buildViaHeader(request_sender, transport, id) {
    var via;
    via = 'SIP/2.0/' + (request_sender.ua.configuration.hackViaTcp ? 'TCP' : transport.server.scheme);
    via += ' ' + request_sender.ua.configuration.viaHost + ';branch=' + id;
    if (request_sender.ua.configuration.forceRport) {
      via += ';rport';
    }
    return via;
  }

  /**
  * @augments SIP.Transactions
  * @class Non Invite Client Transaction
  * @param {SIP.RequestSender} request_sender
  * @param {SIP.OutgoingRequest} request
  * @param {SIP.Transport} transport
  */
  var NonInviteClientTransaction = function NonInviteClientTransaction(request_sender, request, transport) {
    var via;

    this.type = C.NON_INVITE_CLIENT;
    this.transport = transport;
    this.id = 'z9hG4bK' + Math.floor(Math.random() * 10000000);
    this.request_sender = request_sender;
    this.request = request;

    this.logger = request_sender.ua.getLogger('sip.transaction.nict', this.id);

    via = buildViaHeader(request_sender, transport, this.id);
    this.request.setHeader('via', via);

    this.request_sender.ua.newTransaction(this);
  };
  NonInviteClientTransaction.prototype = Object.create(SIP.EventEmitter.prototype);

  NonInviteClientTransaction.prototype.stateChanged = function (state) {
    this.state = state;
    this.emit('stateChanged');
  };

  NonInviteClientTransaction.prototype.send = function () {
    var tr = this;

    this.stateChanged(C.STATUS_TRYING);
    this.F = SIP.Timers.setTimeout(tr.timer_F.bind(tr), SIP.Timers.TIMER_F);

    this.transport.send(this.request).catch(function () {
      this.onTransportError();
    }.bind(this));
  };

  NonInviteClientTransaction.prototype.onTransportError = function () {
    this.logger.log('transport error occurred, deleting non-INVITE client transaction ' + this.id);
    SIP.Timers.clearTimeout(this.F);
    SIP.Timers.clearTimeout(this.K);
    this.stateChanged(C.STATUS_TERMINATED);
    this.request_sender.ua.destroyTransaction(this);
    this.request_sender.onTransportError();
  };

  NonInviteClientTransaction.prototype.timer_F = function () {
    this.logger.debug('Timer F expired for non-INVITE client transaction ' + this.id);
    this.stateChanged(C.STATUS_TERMINATED);
    this.request_sender.ua.destroyTransaction(this);
    this.request_sender.onRequestTimeout();
  };

  NonInviteClientTransaction.prototype.timer_K = function () {
    this.stateChanged(C.STATUS_TERMINATED);
    this.request_sender.ua.destroyTransaction(this);
  };

  NonInviteClientTransaction.prototype.receiveResponse = function (response) {
    var tr = this,
        status_code = response.status_code;

    if (status_code < 200) {
      switch (this.state) {
        case C.STATUS_TRYING:
        case C.STATUS_PROCEEDING:
          this.stateChanged(C.STATUS_PROCEEDING);
          this.request_sender.receiveResponse(response);
          break;
      }
    } else {
      switch (this.state) {
        case C.STATUS_TRYING:
        case C.STATUS_PROCEEDING:
          this.stateChanged(C.STATUS_COMPLETED);
          SIP.Timers.clearTimeout(this.F);

          if (status_code === 408) {
            this.request_sender.onRequestTimeout();
          } else {
            this.request_sender.receiveResponse(response);
          }

          this.K = SIP.Timers.setTimeout(tr.timer_K.bind(tr), SIP.Timers.TIMER_K);
          break;
        case C.STATUS_COMPLETED:
          break;
      }
    }
  };

  /**
  * @augments SIP.Transactions
  * @class Invite Client Transaction
  * @param {SIP.RequestSender} request_sender
  * @param {SIP.OutgoingRequest} request
  * @param {SIP.Transport} transport
  */
  var InviteClientTransaction = function InviteClientTransaction(request_sender, request, transport) {
    var via,
        tr = this;

    this.type = C.INVITE_CLIENT;
    this.transport = transport;
    this.id = 'z9hG4bK' + Math.floor(Math.random() * 10000000);
    this.request_sender = request_sender;
    this.request = request;

    this.logger = request_sender.ua.getLogger('sip.transaction.ict', this.id);

    via = buildViaHeader(request_sender, transport, this.id);
    this.request.setHeader('via', via);

    this.request_sender.ua.newTransaction(this);

    // Add the cancel property to the request.
    //Will be called from the request instance, not the transaction itself.
    this.request.cancel = function (reason, extraHeaders) {
      extraHeaders = (extraHeaders || []).slice();
      var length = extraHeaders.length;
      var extraHeadersString = null;
      for (var idx = 0; idx < length; idx++) {
        extraHeadersString = (extraHeadersString || '') + extraHeaders[idx].trim() + '\r\n';
      }

      tr.cancel_request(tr, reason, extraHeadersString);
    };
  };
  InviteClientTransaction.prototype = Object.create(SIP.EventEmitter.prototype);

  InviteClientTransaction.prototype.stateChanged = function (state) {
    this.state = state;
    this.emit('stateChanged');
  };

  InviteClientTransaction.prototype.send = function () {
    var tr = this;
    this.stateChanged(C.STATUS_CALLING);
    this.B = SIP.Timers.setTimeout(tr.timer_B.bind(tr), SIP.Timers.TIMER_B);

    this.transport.send(this.request).catch(function () {
      this.onTransportError();
    }.bind(this));
  };

  InviteClientTransaction.prototype.onTransportError = function () {
    this.logger.log('transport error occurred, deleting INVITE client transaction ' + this.id);
    SIP.Timers.clearTimeout(this.B);
    SIP.Timers.clearTimeout(this.D);
    SIP.Timers.clearTimeout(this.M);
    this.stateChanged(C.STATUS_TERMINATED);
    this.request_sender.ua.destroyTransaction(this);

    if (this.state !== C.STATUS_ACCEPTED) {
      this.request_sender.onTransportError();
    }
  };

  // RFC 6026 7.2
  InviteClientTransaction.prototype.timer_M = function () {
    this.logger.debug('Timer M expired for INVITE client transaction ' + this.id);

    if (this.state === C.STATUS_ACCEPTED) {
      SIP.Timers.clearTimeout(this.B);
      this.stateChanged(C.STATUS_TERMINATED);
      this.request_sender.ua.destroyTransaction(this);
    }
  };

  // RFC 3261 17.1.1
  InviteClientTransaction.prototype.timer_B = function () {
    this.logger.debug('Timer B expired for INVITE client transaction ' + this.id);
    if (this.state === C.STATUS_CALLING) {
      this.stateChanged(C.STATUS_TERMINATED);
      this.request_sender.ua.destroyTransaction(this);
      this.request_sender.onRequestTimeout();
    }
  };

  InviteClientTransaction.prototype.timer_D = function () {
    this.logger.debug('Timer D expired for INVITE client transaction ' + this.id);
    SIP.Timers.clearTimeout(this.B);
    this.stateChanged(C.STATUS_TERMINATED);
    this.request_sender.ua.destroyTransaction(this);
  };

  InviteClientTransaction.prototype.sendACK = function (options) {
    // TODO: Move PRACK stuff into the transaction layer. That is really where it should be

    var self = this,
        ruri;
    options = options || {};

    if (this.response.getHeader('contact')) {
      ruri = this.response.parseHeader('contact').uri;
    } else {
      ruri = this.request.ruri;
    }
    var ack = new SIP.OutgoingRequest("ACK", ruri, this.request.ua, {
      cseq: this.response.cseq,
      call_id: this.response.call_id,
      from_uri: this.response.from.uri,
      from_tag: this.response.from_tag,
      to_uri: this.response.to.uri,
      to_tag: this.response.to_tag,
      route_set: this.response.getHeaders('record-route').reverse()
    }, options.extraHeaders || [], options.body);

    this.ackSender = new SIP.RequestSender({
      request: ack,
      onRequestTimeout: this.request_sender.applicant.applicant ? this.request_sender.applicant.applicant.onRequestTimeout : function () {
        self.logger.warn("ACK Request timed out");
      },
      onTransportError: this.request_sender.applicant.applicant ? this.request_sender.applicant.applicant.onRequestTransportError : function () {
        self.logger.warn("ACK Request had a transport error");
      },
      receiveResponse: options.receiveResponse || function () {
        self.logger.warn("Received a response to an ACK which was unexpected. Dropping Response.");
      }
    }, this.request.ua).send();

    return ack;
  };

  InviteClientTransaction.prototype.cancel_request = function (tr, reason, extraHeaders) {
    var request = tr.request;

    this.cancel = SIP.C.CANCEL + ' ' + request.ruri + ' SIP/2.0\r\n';
    this.cancel += 'Via: ' + request.headers['Via'].toString() + '\r\n';

    if (this.request.headers['Route']) {
      this.cancel += 'Route: ' + request.headers['Route'].toString() + '\r\n';
    }

    this.cancel += 'To: ' + request.headers['To'].toString() + '\r\n';
    this.cancel += 'From: ' + request.headers['From'].toString() + '\r\n';
    this.cancel += 'Call-ID: ' + request.headers['Call-ID'].toString() + '\r\n';
    this.cancel += 'Max-Forwards: ' + SIP.UA.C.MAX_FORWARDS + '\r\n';
    this.cancel += 'CSeq: ' + request.headers['CSeq'].toString().split(' ')[0] + ' CANCEL\r\n';

    if (reason) {
      this.cancel += 'Reason: ' + reason + '\r\n';
    }

    if (extraHeaders) {
      this.cancel += extraHeaders;
    }

    this.cancel += 'Content-Length: 0\r\n\r\n';

    // Send only if a provisional response (>100) has been received.
    if (this.state === C.STATUS_PROCEEDING) {
      this.transport.send(this.cancel);
    }
  };

  InviteClientTransaction.prototype.receiveResponse = function (response) {
    var tr = this,
        status_code = response.status_code;

    // This may create a circular dependency...
    response.transaction = this;

    if (this.response && this.response.status_code === response.status_code && this.response.cseq === response.cseq) {
      this.logger.debug("ICT Received a retransmission for cseq: " + response.cseq);
      if (this.ackSender) {
        this.ackSender.send();
      }
      return;
    }
    this.response = response;

    if (status_code >= 100 && status_code <= 199) {
      switch (this.state) {
        case C.STATUS_CALLING:
          this.stateChanged(C.STATUS_PROCEEDING);
          this.request_sender.receiveResponse(response);
          if (this.cancel) {
            this.transport.send(this.cancel);
          }
          break;
        case C.STATUS_PROCEEDING:
          this.request_sender.receiveResponse(response);
          break;
      }
    } else if (status_code >= 200 && status_code <= 299) {
      switch (this.state) {
        case C.STATUS_CALLING:
        case C.STATUS_PROCEEDING:
          this.stateChanged(C.STATUS_ACCEPTED);
          this.M = SIP.Timers.setTimeout(tr.timer_M.bind(tr), SIP.Timers.TIMER_M);
          this.request_sender.receiveResponse(response);
          break;
        case C.STATUS_ACCEPTED:
          this.request_sender.receiveResponse(response);
          break;
      }
    } else if (status_code >= 300 && status_code <= 699) {
      switch (this.state) {
        case C.STATUS_CALLING:
        case C.STATUS_PROCEEDING:
          this.stateChanged(C.STATUS_COMPLETED);
          this.sendACK();
          this.request_sender.receiveResponse(response);
          break;
        case C.STATUS_COMPLETED:
          this.sendACK();
          break;
      }
    }
  };

  /**
   * @augments SIP.Transactions
   * @class ACK Client Transaction
   * @param {SIP.RequestSender} request_sender
   * @param {SIP.OutgoingRequest} request
   * @param {SIP.Transport} transport
   */
  var AckClientTransaction = function AckClientTransaction(request_sender, request, transport) {
    var via;

    this.transport = transport;
    this.id = 'z9hG4bK' + Math.floor(Math.random() * 10000000);
    this.request_sender = request_sender;
    this.request = request;

    this.logger = request_sender.ua.getLogger('sip.transaction.nict', this.id);

    via = buildViaHeader(request_sender, transport, this.id);
    this.request.setHeader('via', via);
  };
  AckClientTransaction.prototype = Object.create(SIP.EventEmitter.prototype);

  AckClientTransaction.prototype.send = function () {
    this.transport.send(this.request).catch(function () {
      this.onTransportError();
    }.bind(this));
  };

  AckClientTransaction.prototype.onTransportError = function () {
    this.logger.log('transport error occurred, for an ACK client transaction ' + this.id);
    this.request_sender.onTransportError();
  };

  /**
  * @augments SIP.Transactions
  * @class Non Invite Server Transaction
  * @param {SIP.IncomingRequest} request
  * @param {SIP.UA} ua
  */
  var NonInviteServerTransaction = function NonInviteServerTransaction(request, ua) {
    this.type = C.NON_INVITE_SERVER;
    this.id = request.via_branch;
    this.request = request;
    this.transport = ua.transport;
    this.ua = ua;
    this.last_response = '';
    request.server_transaction = this;

    this.logger = ua.getLogger('sip.transaction.nist', this.id);

    this.state = C.STATUS_TRYING;

    ua.newTransaction(this);
  };
  NonInviteServerTransaction.prototype = Object.create(SIP.EventEmitter.prototype);

  NonInviteServerTransaction.prototype.stateChanged = function (state) {
    this.state = state;
    this.emit('stateChanged');
  };

  NonInviteServerTransaction.prototype.timer_J = function () {
    this.logger.debug('Timer J expired for non-INVITE server transaction ' + this.id);
    this.stateChanged(C.STATUS_TERMINATED);
    this.ua.destroyTransaction(this);
  };

  NonInviteServerTransaction.prototype.onTransportError = function () {
    if (!this.transportError) {
      this.transportError = true;

      this.logger.log('transport error occurred, deleting non-INVITE server transaction ' + this.id);

      SIP.Timers.clearTimeout(this.J);
      this.stateChanged(C.STATUS_TERMINATED);
      this.ua.destroyTransaction(this);
    }
  };

  NonInviteServerTransaction.prototype.receiveResponse = function (status_code, response) {
    var tr = this;
    var deferred = SIP.Utils.defer();

    if (status_code === 100) {
      /* RFC 4320 4.1
       * 'A SIP element MUST NOT
       * send any provisional response with a
       * Status-Code other than 100 to a non-INVITE request.'
       */
      switch (this.state) {
        case C.STATUS_TRYING:
          this.stateChanged(C.STATUS_PROCEEDING);
          this.transport.send(response).catch(function () {
            this.onTransportError();
          }.bind(this));
          break;
        case C.STATUS_PROCEEDING:
          this.last_response = response;
          this.transport.send(response).then(function () {
            deferred.resolve();
          }).catch(function () {
            this.onTransportError();
            deferred.reject();
          }.bind(this));
          break;
      }
    } else if (status_code >= 200 && status_code <= 699) {
      switch (this.state) {
        case C.STATUS_TRYING:
        case C.STATUS_PROCEEDING:
          this.stateChanged(C.STATUS_COMPLETED);
          this.last_response = response;
          this.J = SIP.Timers.setTimeout(tr.timer_J.bind(tr), SIP.Timers.TIMER_J);
          this.transport.send(response).then(function () {
            deferred.resolve();
          }).catch(function () {
            this.onTransportError();
            deferred.reject();
          }.bind(this));
          break;
        case C.STATUS_COMPLETED:
          break;
      }
    }

    return deferred.promise;
  };

  /**
  * @augments SIP.Transactions
  * @class Invite Server Transaction
  * @param {SIP.IncomingRequest} request
  * @param {SIP.UA} ua
  */
  var InviteServerTransaction = function InviteServerTransaction(request, ua) {
    this.type = C.INVITE_SERVER;
    this.id = request.via_branch;
    this.request = request;
    this.transport = ua.transport;
    this.ua = ua;
    this.last_response = '';
    request.server_transaction = this;

    this.logger = ua.getLogger('sip.transaction.ist', this.id);

    this.state = C.STATUS_PROCEEDING;

    ua.newTransaction(this);

    this.resendProvisionalTimer = null;

    request.reply(100);
  };
  InviteServerTransaction.prototype = Object.create(SIP.EventEmitter.prototype);

  InviteServerTransaction.prototype.stateChanged = function (state) {
    this.state = state;
    this.emit('stateChanged');
  };

  InviteServerTransaction.prototype.timer_H = function () {
    this.logger.debug('Timer H expired for INVITE server transaction ' + this.id);

    if (this.state === C.STATUS_COMPLETED) {
      this.logger.warn('transactions', 'ACK for INVITE server transaction was never received, call will be terminated');
    }

    this.stateChanged(C.STATUS_TERMINATED);
    this.ua.destroyTransaction(this);
  };

  InviteServerTransaction.prototype.timer_I = function () {
    this.stateChanged(C.STATUS_TERMINATED);
    this.ua.destroyTransaction(this);
  };

  // RFC 6026 7.1
  InviteServerTransaction.prototype.timer_L = function () {
    this.logger.debug('Timer L expired for INVITE server transaction ' + this.id);

    if (this.state === C.STATUS_ACCEPTED) {
      this.stateChanged(C.STATUS_TERMINATED);
      this.ua.destroyTransaction(this);
    }
  };

  InviteServerTransaction.prototype.onTransportError = function () {
    if (!this.transportError) {
      this.transportError = true;

      this.logger.log('transport error occurred, deleting INVITE server transaction ' + this.id);

      if (this.resendProvisionalTimer !== null) {
        SIP.Timers.clearInterval(this.resendProvisionalTimer);
        this.resendProvisionalTimer = null;
      }

      SIP.Timers.clearTimeout(this.L);
      SIP.Timers.clearTimeout(this.H);
      SIP.Timers.clearTimeout(this.I);

      this.stateChanged(C.STATUS_TERMINATED);
      this.ua.destroyTransaction(this);
    }
  };

  InviteServerTransaction.prototype.resend_provisional = function () {
    this.transport.send(this.request).catch(function () {
      this.onTransportError();
    }.bind(this));
  };

  // INVITE Server Transaction RFC 3261 17.2.1
  InviteServerTransaction.prototype.receiveResponse = function (status_code, response) {
    var tr = this;
    var deferred = SIP.Utils.defer();

    if (status_code >= 100 && status_code <= 199) {
      switch (this.state) {
        case C.STATUS_PROCEEDING:
          this.transport.send(response).catch(function () {
            this.onTransportError();
          }.bind(this));
          this.last_response = response;
          break;
      }
    }

    if (status_code > 100 && status_code <= 199 && this.state === C.STATUS_PROCEEDING) {
      // Trigger the resendProvisionalTimer only for the first non 100 provisional response.
      if (this.resendProvisionalTimer === null) {
        this.resendProvisionalTimer = SIP.Timers.setInterval(tr.resend_provisional.bind(tr), SIP.Timers.PROVISIONAL_RESPONSE_INTERVAL);
      }
    } else if (status_code >= 200 && status_code <= 299) {
      switch (this.state) {
        case C.STATUS_PROCEEDING:
          this.stateChanged(C.STATUS_ACCEPTED);
          this.last_response = response;
          this.L = SIP.Timers.setTimeout(tr.timer_L.bind(tr), SIP.Timers.TIMER_L);

          if (this.resendProvisionalTimer !== null) {
            SIP.Timers.clearInterval(this.resendProvisionalTimer);
            this.resendProvisionalTimer = null;
          }
        /* falls through */
        case C.STATUS_ACCEPTED:
          // Note that this point will be reached for proceeding tr.state also.
          this.transport.send(response).then(function () {
            deferred.resolve();
          }).catch(function (error) {
            this.logger.error(error);
            this.onTransportError();
            deferred.reject();
          }.bind(this));
          break;
      }
    } else if (status_code >= 300 && status_code <= 699) {
      switch (this.state) {
        case C.STATUS_PROCEEDING:
          if (this.resendProvisionalTimer !== null) {
            SIP.Timers.clearInterval(this.resendProvisionalTimer);
            this.resendProvisionalTimer = null;
          }
          this.transport.send(response).then(function () {
            this.stateChanged(C.STATUS_COMPLETED);
            this.H = SIP.Timers.setTimeout(tr.timer_H.bind(tr), SIP.Timers.TIMER_H);
            deferred.resolve();
          }.bind(this)).catch(function (error) {
            this.logger.error(error);
            this.onTransportError();
            deferred.reject();
          }.bind(this));
          break;
      }
    }

    return deferred.promise;
  };

  /**
   * @function
   * @param {SIP.UA} ua
   * @param {SIP.IncomingRequest} request
   *
   * @return {boolean}
   * INVITE:
   *  _true_ if retransmission
   *  _false_ new request
   *
   * ACK:
   *  _true_  ACK to non2xx response
   *  _false_ ACK must be passed to TU (accepted state)
   *          ACK to 2xx response
   *
   * CANCEL:
   *  _true_  no matching invite transaction
   *  _false_ matching invite transaction and no final response sent
   *
   * OTHER:
   *  _true_  retransmission
   *  _false_ new request
   */
  var checkTransaction = function checkTransaction(ua, request) {
    var tr;

    switch (request.method) {
      case SIP.C.INVITE:
        tr = ua.transactions.ist[request.via_branch];
        if (tr) {
          switch (tr.state) {
            case C.STATUS_PROCEEDING:
              tr.transport.send(tr.last_response);
              break;

            // RFC 6026 7.1 Invite retransmission
            //received while in C.STATUS_ACCEPTED state. Absorb it.
            case C.STATUS_ACCEPTED:
              break;
          }
          return true;
        }
        break;
      case SIP.C.ACK:
        tr = ua.transactions.ist[request.via_branch];

        // RFC 6026 7.1
        if (tr) {
          if (tr.state === C.STATUS_ACCEPTED) {
            return false;
          } else if (tr.state === C.STATUS_COMPLETED) {
            tr.stateChanged(C.STATUS_CONFIRMED);
            tr.I = SIP.Timers.setTimeout(tr.timer_I.bind(tr), SIP.Timers.TIMER_I);
            return true;
          }
        }

        // ACK to 2XX Response.
        else {
            return false;
          }
        break;
      case SIP.C.CANCEL:
        tr = ua.transactions.ist[request.via_branch];
        if (tr) {
          request.reply_sl(200);
          if (tr.state === C.STATUS_PROCEEDING) {
            return false;
          } else {
            return true;
          }
        } else {
          request.reply_sl(481);
          return true;
        }
      default:

        // Non-INVITE Server Transaction RFC 3261 17.2.2
        tr = ua.transactions.nist[request.via_branch];
        if (tr) {
          switch (tr.state) {
            case C.STATUS_TRYING:
              break;
            case C.STATUS_PROCEEDING:
            case C.STATUS_COMPLETED:
              tr.transport.send(tr.last_response);
              break;
          }
          return true;
        }
        break;
    }
  };

  SIP.Transactions = {
    C: C,
    checkTransaction: checkTransaction,
    NonInviteClientTransaction: NonInviteClientTransaction,
    InviteClientTransaction: InviteClientTransaction,
    AckClientTransaction: AckClientTransaction,
    NonInviteServerTransaction: NonInviteServerTransaction,
    InviteServerTransaction: InviteServerTransaction
  };
};

/***/ }),
/* 16 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/**
 * @fileoverview SIP Dialog
 */

/**
 * @augments SIP
 * @class Class creating a SIP dialog.
 * @param {SIP.RTCSession} owner
 * @param {SIP.IncomingRequest|SIP.IncomingResponse} message
 * @param {Enum} type UAC / UAS
 * @param {Enum} state SIP.Dialog.C.STATUS_EARLY / SIP.Dialog.C.STATUS_CONFIRMED
 */

module.exports = function (SIP) {

  var RequestSender = __webpack_require__(17)(SIP);

  var Dialog,
      C = {
    // Dialog states
    STATUS_EARLY: 1,
    STATUS_CONFIRMED: 2
  };

  // RFC 3261 12.1
  Dialog = function Dialog(owner, message, type, state) {
    var contact;

    this.uac_pending_reply = false;
    this.uas_pending_reply = false;

    if (!message.hasHeader('contact')) {
      return {
        error: 'unable to create a Dialog without Contact header field'
      };
    }

    if (message instanceof SIP.IncomingResponse) {
      state = message.status_code < 200 ? C.STATUS_EARLY : C.STATUS_CONFIRMED;
    } else {
      // Create confirmed dialog if state is not defined
      state = state || C.STATUS_CONFIRMED;
    }

    contact = message.parseHeader('contact');

    // RFC 3261 12.1.1
    if (type === 'UAS') {
      this.id = {
        call_id: message.call_id,
        local_tag: message.to_tag,
        remote_tag: message.from_tag,
        toString: function toString() {
          return this.call_id + this.local_tag + this.remote_tag;
        }
      };
      this.state = state;
      this.remote_seqnum = message.cseq;
      this.local_uri = message.parseHeader('to').uri;
      this.remote_uri = message.parseHeader('from').uri;
      this.remote_target = contact.uri;
      this.route_set = message.getHeaders('record-route');
      this.invite_seqnum = message.cseq;
      this.local_seqnum = message.cseq;
    }
    // RFC 3261 12.1.2
    else if (type === 'UAC') {
        this.id = {
          call_id: message.call_id,
          local_tag: message.from_tag,
          remote_tag: message.to_tag,
          toString: function toString() {
            return this.call_id + this.local_tag + this.remote_tag;
          }
        };
        this.state = state;
        this.invite_seqnum = message.cseq;
        this.local_seqnum = message.cseq;
        this.local_uri = message.parseHeader('from').uri;
        this.pracked = [];
        this.remote_uri = message.parseHeader('to').uri;
        this.remote_target = contact.uri;
        this.route_set = message.getHeaders('record-route').reverse();
      }

    this.logger = owner.ua.getLogger('sip.dialog', this.id.toString());
    this.owner = owner;
    owner.ua.dialogs[this.id.toString()] = this;
    this.logger.log('new ' + type + ' dialog created with status ' + (this.state === C.STATUS_EARLY ? 'EARLY' : 'CONFIRMED'));
    owner.emit('dialog', this);
  };

  Dialog.prototype = {
    /**
     * @param {SIP.IncomingMessage} message
     * @param {Enum} UAC/UAS
     */
    update: function update(message, type) {
      this.state = C.STATUS_CONFIRMED;

      this.logger.log('dialog ' + this.id.toString() + '  changed to CONFIRMED state');

      if (type === 'UAC') {
        // RFC 3261 13.2.2.4
        this.route_set = message.getHeaders('record-route').reverse();
      }
    },

    terminate: function terminate() {
      this.logger.log('dialog ' + this.id.toString() + ' deleted');
      if (this.sessionDescriptionHandler && this.state !== C.STATUS_CONFIRMED) {
        // TODO: This should call .close() on the handler when implemented
        this.sessionDescriptionHandler.close();
      }
      delete this.owner.ua.dialogs[this.id.toString()];
    },

    /**
    * @param {String} method request method
    * @param {Object} extraHeaders extra headers
    * @returns {SIP.OutgoingRequest}
    */

    // RFC 3261 12.2.1.1
    createRequest: function createRequest(method, extraHeaders, body) {
      var cseq, request;
      extraHeaders = (extraHeaders || []).slice();

      if (!this.local_seqnum) {
        this.local_seqnum = Math.floor(Math.random() * 10000);
      }

      cseq = method === SIP.C.CANCEL || method === SIP.C.ACK ? this.invite_seqnum : this.local_seqnum += 1;

      request = new SIP.OutgoingRequest(method, this.remote_target, this.owner.ua, {
        'cseq': cseq,
        'call_id': this.id.call_id,
        'from_uri': this.local_uri,
        'from_tag': this.id.local_tag,
        'to_uri': this.remote_uri,
        'to_tag': this.id.remote_tag,
        'route_set': this.route_set
      }, extraHeaders, body);

      request.dialog = this;

      return request;
    },

    /**
    * @param {SIP.IncomingRequest} request
    * @returns {Boolean}
    */

    // RFC 3261 12.2.2
    checkInDialogRequest: function checkInDialogRequest(request) {
      var self = this;

      if (!this.remote_seqnum) {
        this.remote_seqnum = request.cseq;
      } else if (request.cseq < this.remote_seqnum) {
        //Do not try to reply to an ACK request.
        if (request.method !== SIP.C.ACK) {
          request.reply(500);
        }
        if (request.cseq === this.invite_seqnum) {
          return true;
        }
        return false;
      }

      switch (request.method) {
        // RFC3261 14.2 Modifying an Existing Session -UAS BEHAVIOR-
        case SIP.C.INVITE:
          if (this.uac_pending_reply === true) {
            request.reply(491);
          } else if (this.uas_pending_reply === true && request.cseq > this.remote_seqnum) {
            var retryAfter = (Math.random() * 10 | 0) + 1;
            request.reply(500, null, ['Retry-After:' + retryAfter]);
            this.remote_seqnum = request.cseq;
            return false;
          } else {
            this.uas_pending_reply = true;
            request.server_transaction.on('stateChanged', function stateChanged() {
              if (this.state === SIP.Transactions.C.STATUS_ACCEPTED || this.state === SIP.Transactions.C.STATUS_COMPLETED || this.state === SIP.Transactions.C.STATUS_TERMINATED) {

                this.removeListener('stateChanged', stateChanged);
                self.uas_pending_reply = false;
              }
            });
          }

          // RFC3261 12.2.2 Replace the dialog`s remote target URI if the request is accepted
          if (request.hasHeader('contact')) {
            request.server_transaction.on('stateChanged', function () {
              if (this.state === SIP.Transactions.C.STATUS_ACCEPTED) {
                self.remote_target = request.parseHeader('contact').uri;
              }
            });
          }
          break;
        case SIP.C.NOTIFY:
          // RFC6665 3.2 Replace the dialog`s remote target URI if the request is accepted
          if (request.hasHeader('contact')) {
            request.server_transaction.on('stateChanged', function () {
              if (this.state === SIP.Transactions.C.STATUS_COMPLETED) {
                self.remote_target = request.parseHeader('contact').uri;
              }
            });
          }
          break;
      }

      if (request.cseq > this.remote_seqnum) {
        this.remote_seqnum = request.cseq;
      }

      return true;
    },

    sendRequest: function sendRequest(applicant, method, options) {
      options = options || {};

      var extraHeaders = (options.extraHeaders || []).slice();

      var body = null;
      if (options.body) {
        if (options.body.body) {
          body = options.body;
        } else {
          body = {};
          body.body = options.body;
          if (options.contentType) {
            body.contentType = options.contentType;
          }
        }
      }

      var request = this.createRequest(method, extraHeaders, body),
          request_sender = new RequestSender(this, applicant, request);

      request_sender.send();

      return request;
    },

    /**
    * @param {SIP.IncomingRequest} request
    */
    receiveRequest: function receiveRequest(request) {
      //Check in-dialog request
      if (!this.checkInDialogRequest(request)) {
        return;
      }

      this.owner.receiveRequest(request);
    }
  };

  Dialog.C = C;
  SIP.Dialog = Dialog;
};

/***/ }),
/* 17 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * @fileoverview In-Dialog Request Sender
 */

/**
 * @augments SIP.Dialog
 * @class Class creating an In-dialog request sender.
 * @param {SIP.Dialog} dialog
 * @param {Object} applicant
 * @param {SIP.OutgoingRequest} request
 */
/**
 * @fileoverview in-Dialog Request Sender
 */

module.exports = function (SIP) {
  var RequestSender;

  RequestSender = function RequestSender(dialog, applicant, request) {

    this.dialog = dialog;
    this.applicant = applicant;
    this.request = request;

    // RFC3261 14.1 Modifying an Existing Session. UAC Behavior.
    this.reattempt = false;
    this.reattemptTimer = null;
  };

  RequestSender.prototype = {
    send: function send() {
      var self = this,
          request_sender = new SIP.RequestSender(this, this.dialog.owner.ua);

      request_sender.send();

      // RFC3261 14.2 Modifying an Existing Session -UAC BEHAVIOR-
      if (this.request.method === SIP.C.INVITE && request_sender.clientTransaction.state !== SIP.Transactions.C.STATUS_TERMINATED) {
        this.dialog.uac_pending_reply = true;
        request_sender.clientTransaction.on('stateChanged', function stateChanged() {
          if (this.state === SIP.Transactions.C.STATUS_ACCEPTED || this.state === SIP.Transactions.C.STATUS_COMPLETED || this.state === SIP.Transactions.C.STATUS_TERMINATED) {

            this.removeListener('stateChanged', stateChanged);
            self.dialog.uac_pending_reply = false;
          }
        });
      }
    },

    onRequestTimeout: function onRequestTimeout() {
      this.applicant.onRequestTimeout();
    },

    onTransportError: function onTransportError() {
      this.applicant.onTransportError();
    },

    receiveResponse: function receiveResponse(response) {
      var self = this;

      // RFC3261 12.2.1.2 408 or 481 is received for a request within a dialog.
      if (response.status_code === 408 || response.status_code === 481) {
        this.applicant.onDialogError(response);
      } else if (response.method === SIP.C.INVITE && response.status_code === 491) {
        if (this.reattempt) {
          this.applicant.receiveResponse(response);
        } else {
          this.request.cseq.value = this.dialog.local_seqnum += 1;
          this.reattemptTimer = SIP.Timers.setTimeout(function () {
            if (self.applicant.owner.status !== SIP.Session.C.STATUS_TERMINATED) {
              self.reattempt = true;
              self.request_sender.send();
            }
          }, this.getReattemptTimeout());
        }
      } else {
        this.applicant.receiveResponse(response);
      }
    }
  };

  return RequestSender;
};

/***/ }),
/* 18 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * @fileoverview Request Sender
 */

/**
 * @augments SIP
 * @class Class creating a request sender.
 * @param {Object} applicant
 * @param {SIP.UA} ua
 */

module.exports = function (SIP) {
  var RequestSender;

  RequestSender = function RequestSender(applicant, ua) {
    this.logger = ua.getLogger('sip.requestsender');
    this.ua = ua;
    this.applicant = applicant;
    this.method = applicant.request.method;
    this.request = applicant.request;
    this.credentials = null;
    this.challenged = false;
    this.staled = false;

    // If ua is in closing process or even closed just allow sending Bye and ACK
    if (ua.status === SIP.UA.C.STATUS_USER_CLOSED && (this.method !== SIP.C.BYE || this.method !== SIP.C.ACK)) {
      this.onTransportError();
    }
  };

  /**
  * Create the client transaction and send the message.
  */
  RequestSender.prototype = {
    send: function send() {
      switch (this.method) {
        case "INVITE":
          this.clientTransaction = new SIP.Transactions.InviteClientTransaction(this, this.request, this.ua.transport);
          break;
        case "ACK":
          this.clientTransaction = new SIP.Transactions.AckClientTransaction(this, this.request, this.ua.transport);
          break;
        default:
          this.clientTransaction = new SIP.Transactions.NonInviteClientTransaction(this, this.request, this.ua.transport);
      }
      this.clientTransaction.send();

      return this.clientTransaction;
    },

    /**
    * Callback fired when receiving a request timeout error from the client transaction.
    * To be re-defined by the applicant.
    * @event
    */
    onRequestTimeout: function onRequestTimeout() {
      this.applicant.onRequestTimeout();
    },

    /**
    * Callback fired when receiving a transport error from the client transaction.
    * To be re-defined by the applicant.
    * @event
    */
    onTransportError: function onTransportError() {
      this.applicant.onTransportError();
    },

    /**
    * Called from client transaction when receiving a correct response to the request.
    * Authenticate request if needed or pass the response back to the applicant.
    * @param {SIP.IncomingResponse} response
    */
    receiveResponse: function receiveResponse(response) {
      var cseq,
          challenge,
          authorization_header_name,
          status_code = response.status_code;

      /*
      * Authentication
      * Authenticate once. _challenged_ flag used to avoid infinite authentications.
      */
      if (status_code === 401 || status_code === 407) {

        // Get and parse the appropriate WWW-Authenticate or Proxy-Authenticate header.
        if (response.status_code === 401) {
          challenge = response.parseHeader('www-authenticate');
          authorization_header_name = 'authorization';
        } else {
          challenge = response.parseHeader('proxy-authenticate');
          authorization_header_name = 'proxy-authorization';
        }

        // Verify it seems a valid challenge.
        if (!challenge) {
          this.logger.warn(response.status_code + ' with wrong or missing challenge, cannot authenticate');
          this.applicant.receiveResponse(response);
          return;
        }

        if (!this.challenged || !this.staled && challenge.stale === true) {
          if (!this.credentials) {
            this.credentials = this.ua.configuration.authenticationFactory(this.ua);
          }

          // Verify that the challenge is really valid.
          if (!this.credentials.authenticate(this.request, challenge)) {
            this.applicant.receiveResponse(response);
            return;
          }
          this.challenged = true;

          if (challenge.stale) {
            this.staled = true;
          }

          if (response.method === SIP.C.REGISTER) {
            cseq = this.applicant.cseq += 1;
          } else if (this.request.dialog) {
            cseq = this.request.dialog.local_seqnum += 1;
          } else {
            cseq = this.request.cseq + 1;
            this.request.cseq = cseq;
          }
          this.request.setHeader('cseq', cseq + ' ' + this.method);

          this.request.setHeader(authorization_header_name, this.credentials.toString());
          this.send();
        } else {
          this.applicant.receiveResponse(response);
        }
      } else {
        this.applicant.receiveResponse(response);
      }
    }
  };

  SIP.RequestSender = RequestSender;
};

/***/ }),
/* 19 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


module.exports = function (SIP) {

  var RegisterContext;

  RegisterContext = function RegisterContext(ua) {
    var params = {},
        regId = 1;

    this.registrar = ua.configuration.registrarServer;
    this.expires = ua.configuration.registerExpires;

    // Contact header
    this.contact = ua.contact.toString();

    if (regId) {
      this.contact += ';reg-id=' + regId;
      this.contact += ';+sip.instance="<urn:uuid:' + ua.configuration.instanceId + '>"';
    }

    // Call-ID and CSeq values RFC3261 10.2
    this.call_id = SIP.Utils.createRandomToken(22);
    this.cseq = Math.floor(Math.random() * 10000);

    this.to_uri = ua.configuration.uri;

    params.to_uri = this.to_uri;
    params.to_displayName = ua.configuration.displayName;
    params.call_id = this.call_id;
    params.cseq = this.cseq;

    // Extends ClientContext
    SIP.Utils.augment(this, SIP.ClientContext, [ua, 'REGISTER', this.registrar, { params: params }]);

    this.registrationTimer = null;
    this.registrationExpiredTimer = null;

    // Set status
    this.registered = false;

    this.logger = ua.getLogger('sip.registercontext');
    ua.on('transportCreated', function (transport) {
      transport.on('disconnected', this.onTransportDisconnected.bind(this));
    }.bind(this));
  };

  RegisterContext.prototype = Object.create({}, {
    register: { writable: true, value: function register(options) {
        var self = this,
            extraHeaders;

        // Handle Options
        this.options = options || {};
        extraHeaders = (this.options.extraHeaders || []).slice();
        extraHeaders.push('Contact: ' + this.contact + ';expires=' + this.expires);
        extraHeaders.push('Allow: ' + SIP.UA.C.ALLOWED_METHODS.toString());

        // Save original extraHeaders to be used in .close
        this.closeHeaders = this.options.closeWithHeaders ? (this.options.extraHeaders || []).slice() : [];

        this.receiveResponse = function (response) {
          var contact,
              expires,
              contacts = response.getHeaders('contact').length,
              cause;

          // Discard responses to older REGISTER/un-REGISTER requests.
          if (response.cseq !== this.cseq) {
            return;
          }

          // Clear registration timer
          if (this.registrationTimer !== null) {
            SIP.Timers.clearTimeout(this.registrationTimer);
            this.registrationTimer = null;
          }

          switch (true) {
            case /^1[0-9]{2}$/.test(response.status_code):
              this.emit('progress', response);
              break;
            case /^2[0-9]{2}$/.test(response.status_code):
              this.emit('accepted', response);

              if (response.hasHeader('expires')) {
                expires = response.getHeader('expires');
              }

              if (this.registrationExpiredTimer !== null) {
                SIP.Timers.clearTimeout(this.registrationExpiredTimer);
                this.registrationExpiredTimer = null;
              }

              // Search the Contact pointing to us and update the expires value accordingly.
              if (!contacts) {
                this.logger.warn('no Contact header in response to REGISTER, response ignored');
                break;
              }

              while (contacts--) {
                contact = response.parseHeader('contact', contacts);
                if (contact.uri.user === this.ua.contact.uri.user) {
                  expires = contact.getParam('expires');
                  break;
                } else {
                  contact = null;
                }
              }

              if (!contact) {
                this.logger.warn('no Contact header pointing to us, response ignored');
                break;
              }

              if (!expires) {
                expires = this.expires;
              }

              // Re-Register before the expiration interval has elapsed.
              // For that, decrease the expires value. ie: 3 seconds
              this.registrationTimer = SIP.Timers.setTimeout(function () {
                self.registrationTimer = null;
                self.register(self.options);
              }, expires * 1000 - 3000);
              this.registrationExpiredTimer = SIP.Timers.setTimeout(function () {
                self.logger.warn('registration expired');
                if (self.registered) {
                  self.unregistered(null, SIP.C.causes.EXPIRES);
                }
              }, expires * 1000);

              //Save gruu values
              if (contact.hasParam('temp-gruu')) {
                this.ua.contact.temp_gruu = SIP.URI.parse(contact.getParam('temp-gruu').replace(/"/g, ''));
              }
              if (contact.hasParam('pub-gruu')) {
                this.ua.contact.pub_gruu = SIP.URI.parse(contact.getParam('pub-gruu').replace(/"/g, ''));
              }

              this.registered = true;
              this.emit('registered', response || null);
              break;
            // Interval too brief RFC3261 10.2.8
            case /^423$/.test(response.status_code):
              if (response.hasHeader('min-expires')) {
                // Increase our registration interval to the suggested minimum
                this.expires = response.getHeader('min-expires');
                // Attempt the registration again immediately
                this.register(this.options);
              } else {
                //This response MUST contain a Min-Expires header field
                this.logger.warn('423 response received for REGISTER without Min-Expires');
                this.registrationFailure(response, SIP.C.causes.SIP_FAILURE_CODE);
              }
              break;
            default:
              cause = SIP.Utils.sipErrorCause(response.status_code);
              this.registrationFailure(response, cause);
          }
        };

        this.onRequestTimeout = function () {
          this.registrationFailure(null, SIP.C.causes.REQUEST_TIMEOUT);
        };

        this.onTransportError = function () {
          this.registrationFailure(null, SIP.C.causes.CONNECTION_ERROR);
        };

        this.cseq++;
        this.request.cseq = this.cseq;
        this.request.setHeader('cseq', this.cseq + ' REGISTER');
        this.request.extraHeaders = extraHeaders;
        this.send();
      } },

    registrationFailure: { writable: true, value: function registrationFailure(response, cause) {
        this.emit('failed', response || null, cause || null);
      } },

    onTransportDisconnected: { writable: true, value: function onTransportDisconnected() {
        this.registered_before = this.registered;
        if (this.registrationTimer !== null) {
          SIP.Timers.clearTimeout(this.registrationTimer);
          this.registrationTimer = null;
        }

        if (this.registrationExpiredTimer !== null) {
          SIP.Timers.clearTimeout(this.registrationExpiredTimer);
          this.registrationExpiredTimer = null;
        }

        if (this.registered) {
          this.unregistered(null, SIP.C.causes.CONNECTION_ERROR);
        }
      } },

    onTransportConnected: { writable: true, value: function onTransportConnected() {
        this.register(this.options);
      } },

    close: { writable: true, value: function close() {
        var options = {
          all: false,
          extraHeaders: this.closeHeaders
        };

        this.registered_before = this.registered;
        if (this.registered) {
          this.unregister(options);
        }
      } },

    unregister: { writable: true, value: function unregister(options) {
        var extraHeaders;

        options = options || {};

        if (!this.registered && !options.all) {
          this.logger.warn('Already unregistered, but sending an unregister anyways.');
        }

        extraHeaders = (options.extraHeaders || []).slice();

        this.registered = false;

        // Clear the registration timer.
        if (this.registrationTimer !== null) {
          SIP.Timers.clearTimeout(this.registrationTimer);
          this.registrationTimer = null;
        }

        if (options.all) {
          extraHeaders.push('Contact: *');
          extraHeaders.push('Expires: 0');
        } else {
          extraHeaders.push('Contact: ' + this.contact + ';expires=0');
        }

        this.receiveResponse = function (response) {
          var cause;

          switch (true) {
            case /^1[0-9]{2}$/.test(response.status_code):
              this.emit('progress', response);
              break;
            case /^2[0-9]{2}$/.test(response.status_code):
              this.emit('accepted', response);
              if (this.registrationExpiredTimer !== null) {
                SIP.Timers.clearTimeout(this.registrationExpiredTimer);
                this.registrationExpiredTimer = null;
              }
              this.unregistered(response);
              break;
            default:
              cause = SIP.Utils.sipErrorCause(response.status_code);
              this.unregistered(response, cause);
          }
        };

        this.onRequestTimeout = function () {
          // Not actually unregistered...
          //this.unregistered(null, SIP.C.causes.REQUEST_TIMEOUT);
        };

        this.cseq++;
        this.request.cseq = this.cseq;
        this.request.setHeader('cseq', this.cseq + ' REGISTER');
        this.request.extraHeaders = extraHeaders;

        this.send();
      } },

    unregistered: { writable: true, value: function unregistered(response, cause) {
        this.registered = false;
        this.emit('unregistered', response || null, cause || null);
      } }

  });

  SIP.RegisterContext = RegisterContext;
};

/***/ }),
/* 20 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/* eslint-disable */
/**
 * @fileoverview SessionDescriptionHandler
 */

/* SessionDescriptionHandler
 * @class PeerConnection helper Class.
 * @param {SIP.Session} session
 * @param {Object} [options]
 */

module.exports = function (EventEmitter) {
  var SessionDescriptionHandler = function SessionDescriptionHandler() {};

  SessionDescriptionHandler.prototype = Object.create(EventEmitter.prototype, {

    /**
     * Destructor
     */
    close: { value: function close() {} },

    /**
     * Gets the local description from the underlying media implementation
     * @param {Object} [options] Options object to be used by getDescription
     * @param {Array} [modifiers] Array with one time use description modifiers
     * @returns {Promise} Promise that resolves with the local description to be used for the session
     */
    getDescription: { value: function getDescription(options, modifiers) {} },

    /**
     * Check if the Session Description Handler can handle the Content-Type described by a SIP Message
     * @param {String} contentType The content type that is in the SIP Message
     * @returns {boolean}
     */
    hasDescription: { value: function hasSessionDescription(contentType) {} },

    /**
     * The modifier that should be used when the session would like to place the call on hold
     * @param {String} [sdp] The description that will be modified
     * @returns {Promise} Promise that resolves with modified SDP
     */
    holdModifier: { value: function holdModifier(sdp) {} },

    /**
     * Set the remote description to the underlying media implementation
     * @param {String} sessionDescription The description provided by a SIP message to be set on the media implementation
     * @param {Object} [options] Options object to be used by setDescription
     * @param {Array} [modifiers] Array with one time use description modifiers
     * @returns {Promise} Promise that resolves once the description is set
     */
    setDescription: { value: function setDescription(sessionDescription, options, modifiers) {} },

    /**
     * Send DTMF via RTP (RFC 4733)
     * @param {String} tones A string containing DTMF digits
     * @param {Object} [options] Options object to be used by sendDtmf
     * @returns {boolean} true if DTMF send is successful, false otherwise
     */
    sendDtmf: { value: function sendDtmf(tones, options) {} },

    /**
    * Get the direction of the session description
    * @returns {String} direction of the description
    */
    getDirection: { value: function getDirection() {} }
  });

  return SessionDescriptionHandler;
};

/***/ }),
/* 21 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


module.exports = function (SIP) {
  var ClientContext;

  ClientContext = function ClientContext(ua, method, target, options) {
    var originalTarget = target;

    // Validate arguments
    if (target === undefined) {
      throw new TypeError('Not enough arguments');
    }

    this.ua = ua;
    this.logger = ua.getLogger('sip.clientcontext');
    this.method = method;
    target = ua.normalizeTarget(target);
    if (!target) {
      throw new TypeError('Invalid target: ' + originalTarget);
    }

    /* Options
     * - extraHeaders
     * - params
     * - contentType
     * - body
     */
    options = Object.create(options || Object.prototype);
    options.extraHeaders = (options.extraHeaders || []).slice();

    // Build the request
    this.request = new SIP.OutgoingRequest(this.method, target, this.ua, options.params, options.extraHeaders);
    if (options.body) {
      this.body = {};
      this.body.body = options.body;
      if (options.contentType) {
        this.body.contentType = options.contentType;
      }
      this.request.body = this.body;
    }

    /* Set other properties from the request */
    this.localIdentity = this.request.from;
    this.remoteIdentity = this.request.to;

    this.data = {};
  };
  ClientContext.prototype = Object.create(SIP.EventEmitter.prototype);

  ClientContext.prototype.send = function () {
    new SIP.RequestSender(this, this.ua).send();
    return this;
  };

  ClientContext.prototype.cancel = function (options) {
    options = options || {};

    options.extraHeaders = (options.extraHeaders || []).slice();

    var cancel_reason = SIP.Utils.getCancelReason(options.status_code, options.reason_phrase);
    this.request.cancel(cancel_reason, options.extraHeaders);

    this.emit('cancel');
  };

  ClientContext.prototype.receiveResponse = function (response) {
    var cause = SIP.Utils.getReasonPhrase(response.status_code);

    switch (true) {
      case /^1[0-9]{2}$/.test(response.status_code):
        this.emit('progress', response, cause);
        break;

      case /^2[0-9]{2}$/.test(response.status_code):
        if (this.ua.applicants[this]) {
          delete this.ua.applicants[this];
        }
        this.emit('accepted', response, cause);
        break;

      default:
        if (this.ua.applicants[this]) {
          delete this.ua.applicants[this];
        }
        this.emit('rejected', response, cause);
        this.emit('failed', response, cause);
        break;
    }
  };

  ClientContext.prototype.onRequestTimeout = function () {
    this.emit('failed', null, SIP.C.causes.REQUEST_TIMEOUT);
  };

  ClientContext.prototype.onTransportError = function () {
    this.emit('failed', null, SIP.C.causes.CONNECTION_ERROR);
  };

  SIP.ClientContext = ClientContext;
};

/***/ }),
/* 22 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


module.exports = function (SIP) {
  var ServerContext;

  ServerContext = function ServerContext(ua, request) {
    this.ua = ua;
    this.logger = ua.getLogger('sip.servercontext');
    this.request = request;
    if (request.method === SIP.C.INVITE) {
      this.transaction = new SIP.Transactions.InviteServerTransaction(request, ua);
    } else {
      this.transaction = new SIP.Transactions.NonInviteServerTransaction(request, ua);
    }

    if (request.body) {
      this.body = request.body;
    }
    if (request.hasHeader('Content-Type')) {
      this.contentType = request.getHeader('Content-Type');
    }
    this.method = request.method;

    this.data = {};

    this.localIdentity = request.to;
    this.remoteIdentity = request.from;
    if (request.hasHeader('P-Asserted-Identity')) {
      this.assertedIdentity = new SIP.NameAddrHeader.parse(request.getHeader('P-Asserted-Identity'));
    }
  };

  ServerContext.prototype = Object.create(SIP.EventEmitter.prototype);

  ServerContext.prototype.progress = function (options) {
    options = Object.create(options || Object.prototype);
    options.statusCode || (options.statusCode = 180);
    options.minCode = 100;
    options.maxCode = 199;
    options.events = ['progress'];
    return this.reply(options);
  };

  ServerContext.prototype.accept = function (options) {
    options = Object.create(options || Object.prototype);
    options.statusCode || (options.statusCode = 200);
    options.minCode = 200;
    options.maxCode = 299;
    options.events = ['accepted'];
    return this.reply(options);
  };

  ServerContext.prototype.reject = function (options) {
    options = Object.create(options || Object.prototype);
    options.statusCode || (options.statusCode = 480);
    options.minCode = 300;
    options.maxCode = 699;
    options.events = ['rejected', 'failed'];
    return this.reply(options);
  };

  ServerContext.prototype.reply = function (options) {
    options = options || {}; // This is okay, so long as we treat options as read-only in this method
    var statusCode = options.statusCode || 100,
        minCode = options.minCode || 100,
        maxCode = options.maxCode || 699,
        reasonPhrase = SIP.Utils.getReasonPhrase(statusCode, options.reasonPhrase),
        extraHeaders = options.extraHeaders || [],
        body = options.body,
        events = options.events || [],
        response;

    if (statusCode < minCode || statusCode > maxCode) {
      throw new TypeError('Invalid statusCode: ' + statusCode);
    }
    response = this.request.reply(statusCode, reasonPhrase, extraHeaders, body);
    events.forEach(function (event) {
      this.emit(event, response, reasonPhrase);
    }, this);

    return this;
  };

  ServerContext.prototype.onRequestTimeout = function () {
    this.emit('failed', null, SIP.C.causes.REQUEST_TIMEOUT);
  };

  ServerContext.prototype.onTransportError = function () {
    this.emit('failed', null, SIP.C.causes.CONNECTION_ERROR);
  };

  SIP.ServerContext = ServerContext;
};

/***/ }),
/* 23 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


module.exports = function (SIP) {

  var DTMF = __webpack_require__(24)(SIP);

  var Session,
      InviteServerContext,
      InviteClientContext,
      ReferServerContext,
      ReferClientContext,
      C = {
    //Session states
    STATUS_NULL: 0,
    STATUS_INVITE_SENT: 1,
    STATUS_1XX_RECEIVED: 2,
    STATUS_INVITE_RECEIVED: 3,
    STATUS_WAITING_FOR_ANSWER: 4,
    STATUS_ANSWERED: 5,
    STATUS_WAITING_FOR_PRACK: 6,
    STATUS_WAITING_FOR_ACK: 7,
    STATUS_CANCELED: 8,
    STATUS_TERMINATED: 9,
    STATUS_ANSWERED_WAITING_FOR_PRACK: 10,
    STATUS_EARLY_MEDIA: 11,
    STATUS_CONFIRMED: 12
  };

  /*
   * @param {function returning SIP.sessionDescriptionHandler} [sessionDescriptionHandlerFactory]
   *        (See the documentation for the sessionDescriptionHandlerFactory argument of the UA constructor.)
   */
  Session = function Session(sessionDescriptionHandlerFactory) {
    this.status = C.STATUS_NULL;
    this.dialog = null;
    this.pendingReinvite = false;
    this.earlyDialogs = {};
    if (!sessionDescriptionHandlerFactory) {
      throw new SIP.Exceptions.SessionDescriptionHandlerMissing('A session description handler is required for the session to function');
    }
    this.sessionDescriptionHandlerFactory = sessionDescriptionHandlerFactory;

    this.hasOffer = false;
    this.hasAnswer = false;

    // Session Timers
    this.timers = {
      ackTimer: null,
      expiresTimer: null,
      invite2xxTimer: null,
      userNoAnswerTimer: null,
      rel1xxTimer: null,
      prackTimer: null
    };

    // Session info
    this.startTime = null;
    this.endTime = null;
    this.tones = null;

    // Hold state
    this.local_hold = false;

    this.early_sdp = null;
    this.rel100 = SIP.C.supported.UNSUPPORTED;
  };

  Session.prototype = {
    dtmf: function dtmf(tones, options) {
      var tone,
          dtmfs = [],
          self = this,
          dtmfType = this.ua.configuration.dtmfType;

      options = options || {};

      if (tones === undefined) {
        throw new TypeError('Not enough arguments');
      }

      // Check Session Status
      if (this.status !== C.STATUS_CONFIRMED && this.status !== C.STATUS_WAITING_FOR_ACK) {
        throw new SIP.Exceptions.InvalidStateError(this.status);
      }

      // Check tones
      if (typeof tones !== 'string' && typeof tones !== 'number' || !tones.toString().match(/^[0-9A-D#*,]+$/i)) {
        throw new TypeError('Invalid tones: ' + tones);
      }

      var sendDTMF = function sendDTMF() {
        var dtmf, timeout;

        if (self.status === C.STATUS_TERMINATED || !self.tones || self.tones.length === 0) {
          // Stop sending DTMF
          self.tones = null;
          return this;
        }

        dtmf = self.tones.shift();

        if (tone === ',') {
          timeout = 2000;
        } else {
          dtmf.on('failed', function () {
            self.tones = null;
          });
          dtmf.send(options);
          timeout = dtmf.duration + dtmf.interToneGap;
        }

        // Set timeout for the next tone
        SIP.Timers.setTimeout(sendDTMF, timeout);
      };

      tones = tones.toString();
      if (dtmfType === SIP.C.dtmfType.RTP) {
        var sent = this.sessionDescriptionHandler.sendDtmf(tones, options);
        if (!sent) {
          this.logger.warn("Attempt to use dtmfType 'RTP' has failed, falling back to INFO packet method");
          dtmfType = SIP.C.dtmfType.INFO;
        }
      }
      if (dtmfType === SIP.C.dtmfType.INFO) {
        tones = tones.split('');
        while (tones.length > 0) {
          dtmfs.push(new DTMF(this, tones.shift(), options));
        }

        if (this.tones) {
          // Tones are already queued, just add to the queue
          this.tones = this.tones.concat(dtmfs);
          return this;
        }
        this.tones = dtmfs;
        sendDTMF();
      }
      return this;
    },

    bye: function bye(options) {
      options = Object.create(options || Object.prototype);
      var statusCode = options.statusCode;

      // Check Session Status
      if (this.status === C.STATUS_TERMINATED) {
        this.logger.error('Error: Attempted to send BYE in a terminated session.');
        return this;
      }

      this.logger.log('terminating Session');

      if (statusCode && (statusCode < 200 || statusCode >= 700)) {
        throw new TypeError('Invalid statusCode: ' + statusCode);
      }

      options.receiveResponse = function () {};

      return this.sendRequest(SIP.C.BYE, options).terminated();
    },

    refer: function refer(target, options) {
      options = options || {};

      // Check Session Status
      if (this.status !== C.STATUS_CONFIRMED) {
        throw new SIP.Exceptions.InvalidStateError(this.status);
      }

      this.referContext = new SIP.ReferClientContext(this.ua, this, target, options);

      this.emit('referRequested', this.referContext);

      this.referContext.refer(options);
    },

    sendRequest: function sendRequest(method, options) {
      options = options || {};
      var self = this;

      var request = new SIP.OutgoingRequest(method, this.dialog.remote_target, this.ua, {
        cseq: options.cseq || (this.dialog.local_seqnum += 1),
        call_id: this.dialog.id.call_id,
        from_uri: this.dialog.local_uri,
        from_tag: this.dialog.id.local_tag,
        to_uri: this.dialog.remote_uri,
        to_tag: this.dialog.id.remote_tag,
        route_set: this.dialog.route_set,
        statusCode: options.statusCode,
        reasonPhrase: options.reasonPhrase
      }, options.extraHeaders || [], options.body);

      new SIP.RequestSender({
        request: request,
        onRequestTimeout: function onRequestTimeout() {
          self.onRequestTimeout();
        },
        onTransportError: function onTransportError() {
          self.onTransportError();
        },
        receiveResponse: options.receiveResponse || function (response) {
          self.receiveNonInviteResponse(response);
        }
      }, this.ua).send();

      // Emit the request event
      this.emit(method.toLowerCase(), request);

      return this;
    },

    close: function close() {
      var idx;

      if (this.status === C.STATUS_TERMINATED) {
        return this;
      }

      this.logger.log('closing INVITE session ' + this.id);

      // 1st Step. Terminate media.
      if (this.sessionDescriptionHandler) {
        this.sessionDescriptionHandler.close();
      }

      // 2nd Step. Terminate signaling.

      // Clear session timers
      for (idx in this.timers) {
        SIP.Timers.clearTimeout(this.timers[idx]);
      }

      // Terminate dialogs

      // Terminate confirmed dialog
      if (this.dialog) {
        this.dialog.terminate();
        delete this.dialog;
      }

      // Terminate early dialogs
      for (idx in this.earlyDialogs) {
        this.earlyDialogs[idx].terminate();
        delete this.earlyDialogs[idx];
      }

      this.status = C.STATUS_TERMINATED;
      this.ua.transport.removeListener("transportError", this.errorListener);

      delete this.ua.sessions[this.id];

      return this;
    },

    createDialog: function createDialog(message, type, early) {
      var dialog,
          early_dialog,
          local_tag = message[type === 'UAS' ? 'to_tag' : 'from_tag'],
          remote_tag = message[type === 'UAS' ? 'from_tag' : 'to_tag'],
          id = message.call_id + local_tag + remote_tag;

      early_dialog = this.earlyDialogs[id];

      // Early Dialog
      if (early) {
        if (early_dialog) {
          return true;
        } else {
          early_dialog = new SIP.Dialog(this, message, type, SIP.Dialog.C.STATUS_EARLY);

          // Dialog has been successfully created.
          if (early_dialog.error) {
            this.logger.error(early_dialog.error);
            this.failed(message, SIP.C.causes.INTERNAL_ERROR);
            return false;
          } else {
            this.earlyDialogs[id] = early_dialog;
            return true;
          }
        }
      }
      // Confirmed Dialog
      else {
          // In case the dialog is in _early_ state, update it
          if (early_dialog) {
            early_dialog.update(message, type);
            this.dialog = early_dialog;
            delete this.earlyDialogs[id];
            for (var dia in this.earlyDialogs) {
              this.earlyDialogs[dia].terminate();
              delete this.earlyDialogs[dia];
            }
            return true;
          }

          // Otherwise, create a _confirmed_ dialog
          dialog = new SIP.Dialog(this, message, type);

          if (dialog.error) {
            this.logger.error(dialog.error);
            this.failed(message, SIP.C.causes.INTERNAL_ERROR);
            return false;
          } else {
            this.to_tag = message.to_tag;
            this.dialog = dialog;
            return true;
          }
        }
    },

    /**
     * Hold
     */
    hold: function hold(options, modifiers) {

      if (this.status !== C.STATUS_WAITING_FOR_ACK && this.status !== C.STATUS_CONFIRMED) {
        throw new SIP.Exceptions.InvalidStateError(this.status);
      }

      if (this.local_hold) {
        this.logger.log('Session is already on hold, cannot put it on hold again');
        return;
      }

      options = options || {};
      options.modifiers = modifiers || [];
      options.modifiers.push(this.sessionDescriptionHandler.holdModifier);

      this.local_hold = true;

      this.sendReinvite(options);
    },

    /**
     * Unhold
     */
    unhold: function unhold(options, modifiers) {

      if (this.status !== C.STATUS_WAITING_FOR_ACK && this.status !== C.STATUS_CONFIRMED) {
        throw new SIP.Exceptions.InvalidStateError(this.status);
      }

      if (!this.local_hold) {
        this.logger.log('Session is not on hold, cannot unhold it');
        return;
      }

      options = options || {};

      if (modifiers) {
        options.modifiers = modifiers;
      }

      this.local_hold = false;

      this.sendReinvite(options);
    },

    reinvite: function reinvite(options, modifiers) {
      options = options || {};

      if (modifiers) {
        options.modifiers = modifiers;
      }

      return this.sendReinvite(options);
    },

    /**
     * In dialog INVITE Reception
     * @private
     */
    receiveReinvite: function receiveReinvite(request) {
      var self = this,
          promise;
      // TODO: Should probably check state of the session

      self.emit('reinvite', this);

      if (request.hasHeader('P-Asserted-Identity')) {
        this.assertedIdentity = new SIP.NameAddrHeader.parse(request.getHeader('P-Asserted-Identity'));
      }

      // Invite w/o SDP
      if (request.getHeader('Content-Length') === '0' && !request.getHeader('Content-Type')) {
        promise = this.sessionDescriptionHandler.getDescription(this.sessionDescriptionHandlerOptions, this.modifiers);

        // Invite w/ SDP
      } else if (this.sessionDescriptionHandler.hasDescription(request.getHeader('Content-Type'))) {
        promise = this.sessionDescriptionHandler.setDescription(request.body, this.sessionDescriptionHandlerOptions, this.modifiers).then(this.sessionDescriptionHandler.getDescription.bind(this.sessionDescriptionHandler, this.sessionDescriptionHandlerOptions, this.modifiers));

        // Bad Packet (should never get hit)
      } else {
        request.reply(415);
        this.emit('reinviteFailed', self);
        return;
      }

      this.receiveRequest = function (request) {
        if (request.method === SIP.C.ACK && this.status === C.STATUS_WAITING_FOR_ACK) {
          if (this.sessionDescriptionHandler.hasDescription(request.getHeader('Content-Type'))) {
            this.hasAnswer = true;
            this.sessionDescriptionHandler.setDescription(request.body, this.sessionDescriptionHandlerOptions, this.modifiers).then(function () {
              SIP.Timers.clearTimeout(this.timers.ackTimer);
              SIP.Timers.clearTimeout(this.timers.invite2xxTimer);
              this.status = C.STATUS_CONFIRMED;

              this.emit('confirmed', request);
            }.bind(this));
          } else {
            SIP.Timers.clearTimeout(this.timers.ackTimer);
            SIP.Timers.clearTimeout(this.timers.invite2xxTimer);
            this.status = C.STATUS_CONFIRMED;

            this.emit('confirmed', request);
          }
        } else {
          SIP.Session.prototype.receiveRequest.apply(this, [request]);
        }
      }.bind(this);

      promise.catch(function onFailure(e) {
        var statusCode;
        if (e instanceof SIP.Exceptions.GetDescriptionError) {
          statusCode = 500;
        } else if (e instanceof SIP.Exceptions.RenegotiationError) {
          self.emit('renegotiationError', e);
          self.logger.warn(e);
          statusCode = 488;
        } else {
          self.logger.error(e);
          statusCode = 488;
        }
        request.reply(statusCode);
        self.emit('reinviteFailed', self);
      }).then(function (description) {
        var extraHeaders = ['Contact: ' + self.contact];
        request.reply(200, null, extraHeaders, description, function () {
          self.status = C.STATUS_WAITING_FOR_ACK;

          self.setACKTimer();
          self.emit('reinviteAccepted', self);
        });
      });
    },

    sendReinvite: function sendReinvite(options) {
      if (this.pendingReinvite) {
        this.logger.warn('Reinvite in progress. Please wait until complete, then try again.');
        return;
      }
      this.pendingReinvite = true;
      options = options || {};
      options.modifiers = options.modifiers || [];

      var self = this,
          extraHeaders = (options.extraHeaders || []).slice();

      extraHeaders.push('Contact: ' + this.contact);
      extraHeaders.push('Allow: ' + SIP.UA.C.ALLOWED_METHODS.toString());

      this.sessionDescriptionHandler.getDescription(options.sessionDescriptionHandlerOptions, options.modifiers).then(function (description) {
        self.sendRequest(SIP.C.INVITE, {
          extraHeaders: extraHeaders,
          body: description,
          receiveResponse: self.receiveReinviteResponse.bind(self)
        });
      }).catch(function onFailure(e) {
        if (e instanceof SIP.Exceptions.RenegotiationError) {
          self.pendingReinvite = false;
          self.emit('renegotiationError', e);
          self.logger.warn('Renegotiation Error');
          self.logger.warn(e);
          return;
        }
        self.logger.error('sessionDescriptionHandler error');
        self.logger.error(e);
      });
    },

    receiveRequest: function receiveRequest(request) {
      switch (request.method) {
        case SIP.C.BYE:
          request.reply(200);
          if (this.status === C.STATUS_CONFIRMED) {
            this.emit('bye', request);
            this.terminated(request, SIP.C.causes.BYE);
          }
          break;
        case SIP.C.INVITE:
          if (this.status === C.STATUS_CONFIRMED) {
            this.logger.log('re-INVITE received');
            this.receiveReinvite(request);
          }
          break;
        case SIP.C.INFO:
          if (this.status === C.STATUS_CONFIRMED || this.status === C.STATUS_WAITING_FOR_ACK) {
            if (this.onInfo) {
              return this.onInfo(request);
            }

            var body,
                tone,
                duration,
                contentType = request.getHeader('content-type'),
                reg_tone = /^(Signal\s*?=\s*?)([0-9A-D#*]{1})(\s)?.*/,
                reg_duration = /^(Duration\s?=\s?)([0-9]{1,4})(\s)?.*/;

            if (contentType) {
              if (contentType.match(/^application\/dtmf-relay/i)) {
                if (request.body) {
                  body = request.body.split('\r\n', 2);
                  if (body.length === 2) {
                    if (reg_tone.test(body[0])) {
                      tone = body[0].replace(reg_tone, "$2");
                    }
                    if (reg_duration.test(body[1])) {
                      duration = parseInt(body[1].replace(reg_duration, "$2"), 10);
                    }
                  }
                }

                new DTMF(this, tone, { duration: duration }).init_incoming(request);
              } else {
                request.reply(415, null, ["Accept: application/dtmf-relay"]);
              }
            }
          }
          break;
        case SIP.C.REFER:
          if (this.status === C.STATUS_CONFIRMED) {
            this.logger.log('REFER received');
            this.referContext = new SIP.ReferServerContext(this.ua, request);
            var hasReferListener = this.listeners('referRequested').length;
            if (hasReferListener) {
              this.emit('referRequested', this.referContext);
            } else {
              this.logger.log('No referRequested listeners, automatically accepting and following the refer');
              var options = { followRefer: true };
              if (this.passedOptions) {
                options.inviteOptions = this.passedOptions;
              }
              this.referContext.accept(options, this.modifiers);
            }
          }
          break;
        case SIP.C.NOTIFY:
          if (this.referContext && this.referContext instanceof SIP.ReferClientContext && request.hasHeader('event') && /^refer(;.*)?$/.test(request.getHeader('event'))) {
            this.referContext.receiveNotify(request);
            return;
          }
          request.reply(200, 'OK');
          this.emit('notify', request);
          break;
      }
    },

    /**
     * Reception of Response for in-dialog INVITE
     * @private
     */
    receiveReinviteResponse: function receiveReinviteResponse(response) {
      var self = this;

      if (this.status === C.STATUS_TERMINATED) {
        return;
      }

      switch (true) {
        case /^1[0-9]{2}$/.test(response.status_code):
          break;
        case /^2[0-9]{2}$/.test(response.status_code):
          this.status = C.STATUS_CONFIRMED;

          // 17.1.1.1 - For each final response that is received at the client transaction, the client transaction sends an ACK,
          this.emit("ack", response.transaction.sendACK());
          this.pendingReinvite = false;
          // TODO: All of these timers should move into the Transaction layer
          SIP.Timers.clearTimeout(self.timers.invite2xxTimer);
          if (!this.sessionDescriptionHandler.hasDescription(response.getHeader('Content-Type'))) {
            this.logger.error('2XX response received to re-invite but did not have a description');
            this.emit('reinviteFailed', self);
            this.emit('renegotiationError', new SIP.Exceptions.RenegotiationError('2XX response received to re-invite but did not have a description'));
            break;
          }

          this.sessionDescriptionHandler.setDescription(response.body, this.sessionDescriptionHandlerOptions, this.modifiers).catch(function onFailure(e) {
            self.logger.error('Could not set the description in 2XX response');
            self.logger.error(e);
            self.emit('reinviteFailed', self);
            self.emit('renegotiationError', e);
            self.sendRequest(SIP.C.BYE, {
              extraHeaders: ['Reason: ' + SIP.Utils.getReasonHeaderValue(488, 'Not Acceptable Here')]
            });
            self.terminated(null, SIP.C.causes.INCOMPATIBLE_SDP);
          }).then(function () {
            self.emit('reinviteAccepted', self);
          });
          break;
        default:
          this.pendingReinvite = false;
          this.logger.log('Received a non 1XX or 2XX response to a re-invite');
          this.emit('reinviteFailed', self);
          this.emit('renegotiationError', new SIP.Exceptions.RenegotiationError('Invalid response to a re-invite'));
      }
    },

    acceptAndTerminate: function acceptAndTerminate(response, status_code, reason_phrase) {
      var extraHeaders = [];

      if (status_code) {
        extraHeaders.push('Reason: ' + SIP.Utils.getReasonHeaderValue(status_code, reason_phrase));
      }

      // An error on dialog creation will fire 'failed' event
      if (this.dialog || this.createDialog(response, 'UAC')) {
        this.emit("ack", response.transaction.sendACK());
        this.sendRequest(SIP.C.BYE, {
          extraHeaders: extraHeaders
        });
      }

      return this;
    },

    /**
     * RFC3261 13.3.1.4
     * Response retransmissions cannot be accomplished by transaction layer
     *  since it is destroyed when receiving the first 2xx answer
     */
    setInvite2xxTimer: function setInvite2xxTimer(request, description) {
      var self = this,
          timeout = SIP.Timers.T1;

      this.timers.invite2xxTimer = SIP.Timers.setTimeout(function invite2xxRetransmission() {
        if (self.status !== C.STATUS_WAITING_FOR_ACK) {
          return;
        }

        self.logger.log('no ACK received, attempting to retransmit OK');

        var extraHeaders = ['Contact: ' + self.contact];

        request.reply(200, null, extraHeaders, description);

        timeout = Math.min(timeout * 2, SIP.Timers.T2);

        self.timers.invite2xxTimer = SIP.Timers.setTimeout(invite2xxRetransmission, timeout);
      }, timeout);
    },

    /**
     * RFC3261 14.2
     * If a UAS generates a 2xx response and never receives an ACK,
     *  it SHOULD generate a BYE to terminate the dialog.
     */
    setACKTimer: function setACKTimer() {
      var self = this;

      this.timers.ackTimer = SIP.Timers.setTimeout(function () {
        if (self.status === C.STATUS_WAITING_FOR_ACK) {
          self.logger.log('no ACK received for an extended period of time, terminating the call');
          SIP.Timers.clearTimeout(self.timers.invite2xxTimer);
          self.sendRequest(SIP.C.BYE);
          self.terminated(null, SIP.C.causes.NO_ACK);
        }
      }, SIP.Timers.TIMER_H);
    },

    /*
     * @private
     */
    onTransportError: function onTransportError() {
      if (this.status !== C.STATUS_CONFIRMED && this.status !== C.STATUS_TERMINATED) {
        this.failed(null, SIP.C.causes.CONNECTION_ERROR);
      }
    },

    onRequestTimeout: function onRequestTimeout() {
      if (this.status === C.STATUS_CONFIRMED) {
        this.terminated(null, SIP.C.causes.REQUEST_TIMEOUT);
      } else if (this.status !== C.STATUS_TERMINATED) {
        this.failed(null, SIP.C.causes.REQUEST_TIMEOUT);
        this.terminated(null, SIP.C.causes.REQUEST_TIMEOUT);
      }
    },

    onDialogError: function onDialogError(response) {
      if (this.status === C.STATUS_CONFIRMED) {
        this.terminated(response, SIP.C.causes.DIALOG_ERROR);
      } else if (this.status !== C.STATUS_TERMINATED) {
        this.failed(response, SIP.C.causes.DIALOG_ERROR);
        this.terminated(response, SIP.C.causes.DIALOG_ERROR);
      }
    },

    /**
     * @private
     */

    failed: function failed(response, cause) {
      if (this.status === C.STATUS_TERMINATED) {
        return this;
      }
      this.emit('failed', response || null, cause || null);
      return this;
    },

    rejected: function rejected(response, cause) {
      this.emit('rejected', response || null, cause || null);
      return this;
    },

    canceled: function canceled() {
      if (this.sessionDescriptionHandler) {
        this.sessionDescriptionHandler.close();
      }
      this.emit('cancel');
      return this;
    },

    accepted: function accepted(response, cause) {
      cause = SIP.Utils.getReasonPhrase(response && response.status_code, cause);

      this.startTime = new Date();

      if (this.replacee) {
        this.replacee.emit('replaced', this);
        this.replacee.terminate();
      }
      this.emit('accepted', response, cause);
      return this;
    },

    terminated: function terminated(message, cause) {
      if (this.status === C.STATUS_TERMINATED) {
        return this;
      }

      this.endTime = new Date();

      this.close();
      this.emit('terminated', message || null, cause || null);
      return this;
    },

    connecting: function connecting(request) {
      this.emit('connecting', { request: request });
      return this;
    }
  };

  Session.C = C;
  SIP.Session = Session;

  InviteServerContext = function InviteServerContext(ua, request) {
    var expires,
        self = this,
        contentType = request.getHeader('Content-Type'),
        contentDisp = request.parseHeader('Content-Disposition');

    SIP.Utils.augment(this, SIP.ServerContext, [ua, request]);
    SIP.Utils.augment(this, SIP.Session, [ua.configuration.sessionDescriptionHandlerFactory]);

    if (contentDisp && contentDisp.type === 'render') {
      this.renderbody = request.body;
      this.rendertype = contentType;
    }

    this.status = C.STATUS_INVITE_RECEIVED;
    this.from_tag = request.from_tag;
    this.id = request.call_id + this.from_tag;
    this.request = request;
    this.contact = this.ua.contact.toString();

    this.receiveNonInviteResponse = function () {}; // intentional no-op

    this.logger = ua.getLogger('sip.inviteservercontext', this.id);

    //Save the session into the ua sessions collection.
    this.ua.sessions[this.id] = this;

    //Get the Expires header value if exists
    if (request.hasHeader('expires')) {
      expires = request.getHeader('expires') * 1000;
    }

    //Set 100rel if necessary
    function set100rel(h, c) {
      if (request.hasHeader(h) && request.getHeader(h).toLowerCase().indexOf('100rel') >= 0) {
        self.rel100 = c;
      }
    }
    set100rel('require', SIP.C.supported.REQUIRED);
    set100rel('supported', SIP.C.supported.SUPPORTED);

    /* Set the to_tag before
     * replying a response code that will create a dialog.
     */
    request.to_tag = SIP.Utils.newTag();

    // An error on dialog creation will fire 'failed' event
    if (!this.createDialog(request, 'UAS', true)) {
      request.reply(500, 'Missing Contact header field');
      return;
    }

    var options = { extraHeaders: ['Contact: ' + self.contact] };

    if (self.rel100 !== SIP.C.supported.REQUIRED) {
      self.progress(options);
    }
    self.status = C.STATUS_WAITING_FOR_ANSWER;

    // Set userNoAnswerTimer
    self.timers.userNoAnswerTimer = SIP.Timers.setTimeout(function () {
      request.reply(408);
      self.failed(request, SIP.C.causes.NO_ANSWER);
      self.terminated(request, SIP.C.causes.NO_ANSWER);
    }, self.ua.configuration.noAnswerTimeout);

    /* Set expiresTimer
     * RFC3261 13.3.1
     */
    if (expires) {
      self.timers.expiresTimer = SIP.Timers.setTimeout(function () {
        if (self.status === C.STATUS_WAITING_FOR_ANSWER) {
          request.reply(487);
          self.failed(request, SIP.C.causes.EXPIRES);
          self.terminated(request, SIP.C.causes.EXPIRES);
        }
      }, expires);
    }

    this.errorListener = this.onTransportError.bind(this);
    ua.transport.on('transportError', this.errorListener);
  };

  InviteServerContext.prototype = Object.create({}, {
    reject: { writable: true, value: function value(options) {
        // Check Session Status
        if (this.status === C.STATUS_TERMINATED) {
          throw new SIP.Exceptions.InvalidStateError(this.status);
        }

        this.logger.log('rejecting RTCSession');

        SIP.ServerContext.prototype.reject.call(this, options);
        return this.terminated();
      } },

    terminate: { writable: true, value: function value(options) {
        options = options || {};

        var extraHeaders = (options.extraHeaders || []).slice(),
            body = options.body,
            dialog,
            self = this;

        if (this.status === C.STATUS_WAITING_FOR_ACK && this.request.server_transaction.state !== SIP.Transactions.C.STATUS_TERMINATED) {
          dialog = this.dialog;

          this.receiveRequest = function (request) {
            if (request.method === SIP.C.ACK) {
              this.sendRequest(SIP.C.BYE, {
                extraHeaders: extraHeaders,
                body: body
              });
              dialog.terminate();
            }
          };

          this.request.server_transaction.on('stateChanged', function () {
            if (this.state === SIP.Transactions.C.STATUS_TERMINATED && this.dialog) {
              this.request = new SIP.OutgoingRequest(SIP.C.BYE, this.dialog.remote_target, this.ua, {
                'cseq': this.dialog.local_seqnum += 1,
                'call_id': this.dialog.id.call_id,
                'from_uri': this.dialog.local_uri,
                'from_tag': this.dialog.id.local_tag,
                'to_uri': this.dialog.remote_uri,
                'to_tag': this.dialog.id.remote_tag,
                'route_set': this.dialog.route_set
              }, extraHeaders, body);

              new SIP.RequestSender({
                request: this.request,
                onRequestTimeout: function onRequestTimeout() {
                  self.onRequestTimeout();
                },
                onTransportError: function onTransportError() {
                  self.onTransportError();
                },
                receiveResponse: function receiveResponse() {
                  return;
                }
              }, this.ua).send();
              dialog.terminate();
            }
          });

          this.emit('bye', this.request);
          this.terminated();

          // Restore the dialog into 'this' in order to be able to send the in-dialog BYE :-)
          this.dialog = dialog;

          // Restore the dialog into 'ua' so the ACK can reach 'this' session
          this.ua.dialogs[dialog.id.toString()] = dialog;
        } else if (this.status === C.STATUS_CONFIRMED) {
          this.bye(options);
        } else {
          this.reject(options);
        }

        return this;
      } },

    /*
     * @param {Object} [options.sessionDescriptionHandlerOptions] gets passed to SIP.SessionDescriptionHandler.getDescription as options
     */
    progress: { writable: true, value: function value(options) {
        options = options || {};
        var statusCode = options.statusCode || 180,
            reasonPhrase = options.reasonPhrase,
            extraHeaders = (options.extraHeaders || []).slice(),
            body = options.body,
            response;

        if (statusCode < 100 || statusCode > 199) {
          throw new TypeError('Invalid statusCode: ' + statusCode);
        }

        if (this.isCanceled || this.status === C.STATUS_TERMINATED) {
          return this;
        }

        function do100rel() {
          /* jshint validthis: true */
          statusCode = options.statusCode || 183;

          // Set status and add extra headers
          this.status = C.STATUS_WAITING_FOR_PRACK;
          extraHeaders.push('Contact: ' + this.contact);
          extraHeaders.push('Require: 100rel');
          extraHeaders.push('RSeq: ' + Math.floor(Math.random() * 10000));

          // Get the session description to add to preaccept with
          this.sessionDescriptionHandler.getDescription(options.sessionDescriptionHandlerOptions, options.modifiers).then(function onSuccess(description) {
            if (this.isCanceled || this.status === C.STATUS_TERMINATED) {
              return;
            }

            this.early_sdp = description.body;
            this[this.hasOffer ? 'hasAnswer' : 'hasOffer'] = true;

            // Retransmit until we get a response or we time out (see prackTimer below)
            var timeout = SIP.Timers.T1;
            this.timers.rel1xxTimer = SIP.Timers.setTimeout(function rel1xxRetransmission() {
              this.request.reply(statusCode, null, extraHeaders, description);
              timeout *= 2;
              this.timers.rel1xxTimer = SIP.Timers.setTimeout(rel1xxRetransmission.bind(this), timeout);
            }.bind(this), timeout);

            // Timeout and reject INVITE if no response
            this.timers.prackTimer = SIP.Timers.setTimeout(function () {
              if (this.status !== C.STATUS_WAITING_FOR_PRACK) {
                return;
              }

              this.logger.log('no PRACK received, rejecting the call');
              SIP.Timers.clearTimeout(this.timers.rel1xxTimer);
              this.request.reply(504);
              this.terminated(null, SIP.C.causes.NO_PRACK);
            }.bind(this), SIP.Timers.T1 * 64);

            // Send the initial response
            response = this.request.reply(statusCode, reasonPhrase, extraHeaders, description);
            this.emit('progress', response, reasonPhrase);
          }.bind(this), function onFailure() {
            this.request.reply(480);
            this.failed(null, SIP.C.causes.WEBRTC_ERROR);
            this.terminated(null, SIP.C.causes.WEBRTC_ERROR);
          }.bind(this));
        } // end do100rel

        function normalReply() {
          /* jshint validthis:true */
          response = this.request.reply(statusCode, reasonPhrase, extraHeaders, body);
          this.emit('progress', response, reasonPhrase);
        }

        if (options.statusCode !== 100 && (this.rel100 === SIP.C.supported.REQUIRED || this.rel100 === SIP.C.supported.SUPPORTED && options.rel100 || this.rel100 === SIP.C.supported.SUPPORTED && this.ua.configuration.rel100 === SIP.C.supported.REQUIRED)) {
          this.sessionDescriptionHandler = this.setupSessionDescriptionHandler();
          this.emit('SessionDescriptionHandler-created', this.sessionDescriptionHandler);
          if (this.sessionDescriptionHandler.hasDescription(this.request.getHeader('Content-Type'))) {
            this.hasOffer = true;
            this.sessionDescriptionHandler.setDescription(this.request.body, options.sessionDescriptionHandlerOptions, options.modifiers).then(do100rel.apply(this)).catch(function onFailure(e) {
              this.logger.warn('invalid description');
              this.logger.warn(e);
              this.failed(null, SIP.C.causes.WEBRTC_ERROR);
              this.terminated(null, SIP.C.causes.WEBRTC_ERROR);
            }.bind(this));
          } else {
            do100rel.apply(this);
          }
        } else {
          normalReply.apply(this);
        }
        return this;
      } },

    /*
     * @param {Object} [options.sessionDescriptionHandlerOptions] gets passed to SIP.SessionDescriptionHandler.getDescription as options
     */
    accept: { writable: true, value: function value(options) {
        options = options || {};

        this.onInfo = options.onInfo;

        var self = this,
            request = this.request,
            extraHeaders = (options.extraHeaders || []).slice(),
            descriptionCreationSucceeded = function descriptionCreationSucceeded(description) {
          var response,

          // run for reply success callback
          replySucceeded = function replySucceeded() {
            self.status = C.STATUS_WAITING_FOR_ACK;

            self.setInvite2xxTimer(request, description);
            self.setACKTimer();
          },


          // run for reply failure callback
          replyFailed = function replyFailed() {
            self.failed(null, SIP.C.causes.CONNECTION_ERROR);
            self.terminated(null, SIP.C.causes.CONNECTION_ERROR);
          };

          extraHeaders.push('Contact: ' + self.contact);
          extraHeaders.push('Allow: ' + SIP.UA.C.ALLOWED_METHODS.toString());

          if (!self.hasOffer) {
            self.hasOffer = true;
          } else {
            self.hasAnswer = true;
          }
          response = request.reply(200, null, extraHeaders, description, replySucceeded, replyFailed);
          if (self.status !== C.STATUS_TERMINATED) {
            // Didn't fail
            self.accepted(response, SIP.Utils.getReasonPhrase(200));
          }
        },
            descriptionCreationFailed = function descriptionCreationFailed() {
          // TODO: This should check the actual error and make sure it is an
          //        "expected" error. Otherwise it should throw.
          if (self.status === C.STATUS_TERMINATED) {
            return;
          }
          self.request.reply(480);
          self.failed(null, SIP.C.causes.WEBRTC_ERROR);
          self.terminated(null, SIP.C.causes.WEBRTC_ERROR);
        };

        // Check Session Status
        if (this.status === C.STATUS_WAITING_FOR_PRACK) {
          this.status = C.STATUS_ANSWERED_WAITING_FOR_PRACK;
          return this;
        } else if (this.status === C.STATUS_WAITING_FOR_ANSWER) {
          this.status = C.STATUS_ANSWERED;
        } else if (this.status !== C.STATUS_EARLY_MEDIA) {
          throw new SIP.Exceptions.InvalidStateError(this.status);
        }

        // An error on dialog creation will fire 'failed' event
        if (!this.createDialog(request, 'UAS')) {
          request.reply(500, 'Missing Contact header field');
          return this;
        }

        SIP.Timers.clearTimeout(this.timers.userNoAnswerTimer);

        if (this.status === C.STATUS_EARLY_MEDIA) {
          descriptionCreationSucceeded({});
        } else {
          this.sessionDescriptionHandler = this.setupSessionDescriptionHandler();
          this.emit('SessionDescriptionHandler-created', this.sessionDescriptionHandler);
          if (this.request.getHeader('Content-Length') === '0' && !this.request.getHeader('Content-Type')) {
            this.sessionDescriptionHandler.getDescription(options.sessionDescriptionHandlerOptions, options.modifiers).catch(descriptionCreationFailed).then(descriptionCreationSucceeded);
          } else if (this.sessionDescriptionHandler.hasDescription(this.request.getHeader('Content-Type'))) {
            this.hasOffer = true;
            this.sessionDescriptionHandler.setDescription(this.request.body, options.sessionDescriptionHandlerOptions, options.modifiers).then(function () {
              return this.sessionDescriptionHandler.getDescription(options.sessionDescriptionHandlerOptions, options.modifiers);
            }.bind(this)).catch(descriptionCreationFailed).then(descriptionCreationSucceeded);
          } else {
            this.request.reply(415);
            // TODO: Events
            return;
          }
        }

        return this;
      } },

    receiveRequest: { writable: true, value: function value(request) {

        // ISC RECEIVE REQUEST

        function confirmSession() {
          /* jshint validthis:true */
          var contentType, contentDisp;

          SIP.Timers.clearTimeout(this.timers.ackTimer);
          SIP.Timers.clearTimeout(this.timers.invite2xxTimer);
          this.status = C.STATUS_CONFIRMED;

          contentType = request.getHeader('Content-Type');
          contentDisp = request.getHeader('Content-Disposition');

          if (contentDisp && contentDisp.type === 'render') {
            this.renderbody = request.body;
            this.rendertype = contentType;
          }

          this.emit('confirmed', request);
        }

        switch (request.method) {
          case SIP.C.CANCEL:
            /* RFC3261 15 States that a UAS may have accepted an invitation while a CANCEL
             * was in progress and that the UAC MAY continue with the session established by
             * any 2xx response, or MAY terminate with BYE. SIP does continue with the
             * established session. So the CANCEL is processed only if the session is not yet
             * established.
             */

            /*
             * Terminate the whole session in case the user didn't accept (or yet to send the answer) nor reject the
             *request opening the session.
             */
            if (this.status === C.STATUS_WAITING_FOR_ANSWER || this.status === C.STATUS_WAITING_FOR_PRACK || this.status === C.STATUS_ANSWERED_WAITING_FOR_PRACK || this.status === C.STATUS_EARLY_MEDIA || this.status === C.STATUS_ANSWERED) {

              this.status = C.STATUS_CANCELED;
              this.request.reply(487);
              this.canceled(request);
              this.rejected(request, SIP.C.causes.CANCELED);
              this.failed(request, SIP.C.causes.CANCELED);
              this.terminated(request, SIP.C.causes.CANCELED);
            }
            break;
          case SIP.C.ACK:
            if (this.status === C.STATUS_WAITING_FOR_ACK) {
              if (this.sessionDescriptionHandler.hasDescription(request.getHeader('Content-Type'))) {
                // ACK contains answer to an INVITE w/o SDP negotiation
                this.hasAnswer = true;
                this.sessionDescriptionHandler.setDescription(request.body, this.sessionDescriptionHandlerOptions, this.modifiers).then(
                // TODO: Catch then .then
                confirmSession.bind(this), function onFailure(e) {
                  this.logger.warn(e);
                  this.terminate({
                    statusCode: '488',
                    reasonPhrase: 'Bad Media Description'
                  });
                  this.failed(request, SIP.C.causes.BAD_MEDIA_DESCRIPTION);
                  this.terminated(request, SIP.C.causes.BAD_MEDIA_DESCRIPTION);
                }.bind(this));
              } else {
                confirmSession.apply(this);
              }
            }
            break;
          case SIP.C.PRACK:
            if (this.status === C.STATUS_WAITING_FOR_PRACK || this.status === C.STATUS_ANSWERED_WAITING_FOR_PRACK) {
              if (!this.hasAnswer) {
                this.sessionDescriptionHandler = this.setupSessionDescriptionHandler();
                this.emit('SessionDescriptionHandler-created', this.sessionDescriptionHandler);
                if (this.sessionDescriptionHandler.hasDescription(request.getHeader('Content-Type'))) {
                  this.hasAnswer = true;
                  this.sessionDescriptionHandler.setDescription(request.body, this.sessionDescriptionHandlerOptions, this.modifiers).then(function onSuccess() {
                    SIP.Timers.clearTimeout(this.timers.rel1xxTimer);
                    SIP.Timers.clearTimeout(this.timers.prackTimer);
                    request.reply(200);
                    if (this.status === C.STATUS_ANSWERED_WAITING_FOR_PRACK) {
                      this.status = C.STATUS_EARLY_MEDIA;
                      this.accept();
                    }
                    this.status = C.STATUS_EARLY_MEDIA;
                  }.bind(this), function onFailure(e) {
                    this.logger.warn(e);
                    this.terminate({
                      statusCode: '488',
                      reasonPhrase: 'Bad Media Description'
                    });
                    this.failed(request, SIP.C.causes.BAD_MEDIA_DESCRIPTION);
                    this.terminated(request, SIP.C.causes.BAD_MEDIA_DESCRIPTION);
                  }.bind(this));
                } else {
                  this.terminate({
                    statusCode: '488',
                    reasonPhrase: 'Bad Media Description'
                  });
                  this.failed(request, SIP.C.causes.BAD_MEDIA_DESCRIPTION);
                  this.terminated(request, SIP.C.causes.BAD_MEDIA_DESCRIPTION);
                }
              } else {
                SIP.Timers.clearTimeout(this.timers.rel1xxTimer);
                SIP.Timers.clearTimeout(this.timers.prackTimer);
                request.reply(200);

                if (this.status === C.STATUS_ANSWERED_WAITING_FOR_PRACK) {
                  this.status = C.STATUS_EARLY_MEDIA;
                  this.accept();
                }
                this.status = C.STATUS_EARLY_MEDIA;
              }
            } else if (this.status === C.STATUS_EARLY_MEDIA) {
              request.reply(200);
            }
            break;
          default:
            Session.prototype.receiveRequest.apply(this, [request]);
            break;
        }
      } },

    // Internal Function to setup the handler consistently
    setupSessionDescriptionHandler: { writable: true, value: function value() {
        if (this.sessionDescriptionHandler) {
          return this.sessionDescriptionHandler;
        }
        return this.sessionDescriptionHandlerFactory(this, this.ua.configuration.sessionDescriptionHandlerFactoryOptions);
      } },

    onTransportError: { writable: true, value: function value() {
        if (this.status !== C.STATUS_CONFIRMED && this.status !== C.STATUS_TERMINATED) {
          this.failed(null, SIP.C.causes.CONNECTION_ERROR);
        }
      } },

    onRequestTimeout: { writable: true, value: function value() {
        if (this.status === C.STATUS_CONFIRMED) {
          this.terminated(null, SIP.C.causes.REQUEST_TIMEOUT);
        } else if (this.status !== C.STATUS_TERMINATED) {
          this.failed(null, SIP.C.causes.REQUEST_TIMEOUT);
          this.terminated(null, SIP.C.causes.REQUEST_TIMEOUT);
        }
      } }

  });

  SIP.InviteServerContext = InviteServerContext;

  InviteClientContext = function InviteClientContext(ua, target, options, modifiers) {
    options = options || {};
    this.passedOptions = options; // Save for later to use with refer
    options.params = Object.create(options.params || Object.prototype);

    var extraHeaders = (options.extraHeaders || []).slice(),
        sessionDescriptionHandlerFactory = ua.configuration.sessionDescriptionHandlerFactory;

    this.sessionDescriptionHandlerFactoryOptions = ua.configuration.sessionDescriptionHandlerFactoryOptions || {};
    this.sessionDescriptionHandlerOptions = options.sessionDescriptionHandlerOptions || {};
    this.modifiers = modifiers;

    this.inviteWithoutSdp = options.inviteWithoutSdp || false;

    // Set anonymous property
    this.anonymous = options.anonymous || false;

    // Custom data to be sent either in INVITE or in ACK
    this.renderbody = options.renderbody || null;
    this.rendertype = options.rendertype || 'text/plain';

    // Session parameter initialization
    this.from_tag = SIP.Utils.newTag();
    options.params.from_tag = this.from_tag;

    /* Do not add ;ob in initial forming dialog requests if the registration over
     *  the current connection got a GRUU URI.
     */
    this.contact = ua.contact.toString({
      anonymous: this.anonymous,
      outbound: this.anonymous ? !ua.contact.temp_gruu : !ua.contact.pub_gruu
    });

    if (this.anonymous) {
      options.params.from_displayName = 'Anonymous';
      options.params.from_uri = 'sip:anonymous@anonymous.invalid';

      extraHeaders.push('P-Preferred-Identity: ' + ua.configuration.uri.toString());
      extraHeaders.push('Privacy: id');
    }
    extraHeaders.push('Contact: ' + this.contact);
    extraHeaders.push('Allow: ' + SIP.UA.C.ALLOWED_METHODS.toString());
    if (this.inviteWithoutSdp && this.renderbody) {
      extraHeaders.push('Content-Type: ' + this.rendertype);
      extraHeaders.push('Content-Disposition: render;handling=optional');
    }

    if (ua.configuration.rel100 === SIP.C.supported.REQUIRED) {
      extraHeaders.push('Require: 100rel');
    }
    if (ua.configuration.replaces === SIP.C.supported.REQUIRED) {
      extraHeaders.push('Require: replaces');
    }

    options.extraHeaders = extraHeaders;

    SIP.Utils.augment(this, SIP.ClientContext, [ua, SIP.C.INVITE, target, options]);
    SIP.Utils.augment(this, SIP.Session, [sessionDescriptionHandlerFactory]);

    // Check Session Status
    if (this.status !== C.STATUS_NULL) {
      throw new SIP.Exceptions.InvalidStateError(this.status);
    }

    // OutgoingSession specific parameters
    this.isCanceled = false;
    this.received_100 = false;

    this.method = SIP.C.INVITE;

    this.receiveNonInviteResponse = this.receiveResponse;
    this.receiveResponse = this.receiveInviteResponse;

    this.logger = ua.getLogger('sip.inviteclientcontext');

    ua.applicants[this] = this;

    this.id = this.request.call_id + this.from_tag;

    this.onInfo = options.onInfo;

    this.errorListener = this.onTransportError.bind(this);
    ua.transport.on('transportError', this.errorListener);
  };

  InviteClientContext.prototype = Object.create({}, {
    invite: { writable: true, value: function value() {
        var self = this;

        //Save the session into the ua sessions collection.
        //Note: placing in constructor breaks call to request.cancel on close... User does not need this anyway
        this.ua.sessions[this.id] = this;

        // This should allow the function to return so that listeners can be set up for these events
        SIP.Utils.Promise.resolve().then(function () {
          if (this.inviteWithoutSdp) {
            //just send an invite with no sdp...
            this.request.body = self.renderbody;
            this.status = C.STATUS_INVITE_SENT;
            this.send();
          } else {
            //Initialize Media Session
            this.sessionDescriptionHandler = this.sessionDescriptionHandlerFactory(this, this.sessionDescriptionHandlerFactoryOptions);
            this.emit('SessionDescriptionHandler-created', this.sessionDescriptionHandler);

            this.sessionDescriptionHandler.getDescription(this.sessionDescriptionHandlerOptions, this.modifiers).then(function onSuccess(description) {
              if (self.isCanceled || self.status === C.STATUS_TERMINATED) {
                return;
              }
              self.hasOffer = true;
              self.request.body = description;
              self.status = C.STATUS_INVITE_SENT;
              self.send();
            }, function onFailure() {
              if (self.status === C.STATUS_TERMINATED) {
                return;
              }
              self.failed(null, SIP.C.causes.WEBRTC_ERROR);
              self.terminated(null, SIP.C.causes.WEBRTC_ERROR);
            });
          }
        }.bind(this));
        return this;
      } },

    receiveInviteResponse: { writable: true, value: function value(response) {
        var cause,
            session = this,
            id = response.call_id + response.from_tag + response.to_tag,
            extraHeaders = [],
            options = {};

        if (this.status === C.STATUS_TERMINATED || response.method !== SIP.C.INVITE) {
          return;
        }

        if (this.dialog && response.status_code >= 200 && response.status_code <= 299) {
          if (id !== this.dialog.id.toString()) {
            if (!this.createDialog(response, 'UAC', true)) {
              return;
            }
            this.emit("ack", response.transaction.sendACK({ body: SIP.Utils.generateFakeSDP(response.body) }));
            this.earlyDialogs[id].sendRequest(this, SIP.C.BYE);

            /* NOTE: This fails because the forking proxy does not recognize that an unanswerable
             * leg (due to peerConnection limitations) has been answered first. If your forking
             * proxy does not hang up all unanswered branches on the first branch answered, remove this.
             */
            if (this.status !== C.STATUS_CONFIRMED) {
              this.failed(response, SIP.C.causes.WEBRTC_ERROR);
              this.terminated(response, SIP.C.causes.WEBRTC_ERROR);
            }
            return;
          } else if (this.status === C.STATUS_CONFIRMED) {
            this.emit("ack", response.transaction.sendACK());
            return;
          } else if (!this.hasAnswer) {
            // invite w/o sdp is waiting for callback
            //an invite with sdp must go on, and hasAnswer is true
            return;
          }
        }

        if (this.dialog && response.status_code < 200) {
          /*
            Early media has been set up with at least one other different branch,
            but a final 2xx response hasn't been received
          */
          if (this.dialog.pracked.indexOf(response.getHeader('rseq')) !== -1 || this.dialog.pracked[this.dialog.pracked.length - 1] >= response.getHeader('rseq') && this.dialog.pracked.length > 0) {
            return;
          }

          if (!this.earlyDialogs[id] && !this.createDialog(response, 'UAC', true)) {
            return;
          }

          if (this.earlyDialogs[id].pracked.indexOf(response.getHeader('rseq')) !== -1 || this.earlyDialogs[id].pracked[this.earlyDialogs[id].pracked.length - 1] >= response.getHeader('rseq') && this.earlyDialogs[id].pracked.length > 0) {
            return;
          }

          extraHeaders.push('RAck: ' + response.getHeader('rseq') + ' ' + response.getHeader('cseq'));
          this.earlyDialogs[id].pracked.push(response.getHeader('rseq'));

          this.earlyDialogs[id].sendRequest(this, SIP.C.PRACK, {
            extraHeaders: extraHeaders,
            body: SIP.Utils.generateFakeSDP(response.body)
          });
          return;
        }

        // Proceed to cancellation if the user requested.
        if (this.isCanceled) {
          if (response.status_code >= 100 && response.status_code < 200) {
            this.request.cancel(this.cancelReason, extraHeaders);
            this.canceled(null);
          } else if (response.status_code >= 200 && response.status_code < 299) {
            this.acceptAndTerminate(response);
            this.emit('bye', this.request);
          } else if (response.status_code >= 300) {
            cause = SIP.C.REASON_PHRASE[response.status_code] || SIP.C.causes.CANCELED;
            this.rejected(response, cause);
            this.failed(response, cause);
            this.terminated(response, cause);
          }
          return;
        }

        switch (true) {
          case /^100$/.test(response.status_code):
            this.received_100 = true;
            this.emit('progress', response);
            break;
          case /^1[0-9]{2}$/.test(response.status_code):
            // Do nothing with 1xx responses without To tag.
            if (!response.to_tag) {
              this.logger.warn('1xx response received without to tag');
              break;
            }

            // Create Early Dialog if 1XX comes with contact
            if (response.hasHeader('contact')) {
              // An error on dialog creation will fire 'failed' event
              if (!this.createDialog(response, 'UAC', true)) {
                break;
              }
            }

            this.status = C.STATUS_1XX_RECEIVED;

            if (response.hasHeader('P-Asserted-Identity')) {
              this.assertedIdentity = new SIP.NameAddrHeader.parse(response.getHeader('P-Asserted-Identity'));
            }

            if (response.hasHeader('require') && response.getHeader('require').indexOf('100rel') !== -1) {

              // Do nothing if this.dialog is already confirmed
              if (this.dialog || !this.earlyDialogs[id]) {
                break;
              }

              if (this.earlyDialogs[id].pracked.indexOf(response.getHeader('rseq')) !== -1 || this.earlyDialogs[id].pracked[this.earlyDialogs[id].pracked.length - 1] >= response.getHeader('rseq') && this.earlyDialogs[id].pracked.length > 0) {
                return;
              }
              // TODO: This may be broken. It may have to be on the early dialog
              this.sessionDescriptionHandler = this.sessionDescriptionHandlerFactory(this, this.sessionDescriptionHandlerFactoryOptions);
              this.emit('SessionDescriptionHandler-created', this.sessionDescriptionHandler);
              if (!this.sessionDescriptionHandler.hasDescription(response.getHeader('Content-Type'))) {
                extraHeaders.push('RAck: ' + response.getHeader('rseq') + ' ' + response.getHeader('cseq'));
                this.earlyDialogs[id].pracked.push(response.getHeader('rseq'));
                this.earlyDialogs[id].sendRequest(this, SIP.C.PRACK, {
                  extraHeaders: extraHeaders
                });
                this.emit('progress', response);
              } else if (this.hasOffer) {
                if (!this.createDialog(response, 'UAC')) {
                  break;
                }
                this.hasAnswer = true;
                this.dialog.pracked.push(response.getHeader('rseq'));

                this.sessionDescriptionHandler.setDescription(response.body, this.sessionDescriptionHandlerOptions, this.modifiers).then(function onSuccess() {
                  extraHeaders.push('RAck: ' + response.getHeader('rseq') + ' ' + response.getHeader('cseq'));

                  session.sendRequest(SIP.C.PRACK, {
                    extraHeaders: extraHeaders,
                    receiveResponse: function receiveResponse() {}
                  });
                  session.status = C.STATUS_EARLY_MEDIA;
                  session.emit('progress', response);
                }, function onFailure(e) {
                  session.logger.warn(e);
                  session.acceptAndTerminate(response, 488, 'Not Acceptable Here');
                  session.failed(response, SIP.C.causes.BAD_MEDIA_DESCRIPTION);
                });
              } else {
                var earlyDialog = this.earlyDialogs[id];
                var earlyMedia = earlyDialog.sessionDescriptionHandler = this.sessionDescriptionHandlerFactory(this, this.sessionDescriptionHandlerFactoryOptions);
                this.emit('SessionDescriptionHandler-created', earlyMedia);

                earlyDialog.pracked.push(response.getHeader('rseq'));

                earlyMedia.setDescription(response.body, session.sessionDescriptionHandlerOptions, session.modifers).then(earlyMedia.getDescription.bind(earlyMedia, session.sessionDescriptionHandlerOptions, session.modifiers)).then(function onSuccess(description) {
                  extraHeaders.push('RAck: ' + response.getHeader('rseq') + ' ' + response.getHeader('cseq'));
                  earlyDialog.sendRequest(session, SIP.C.PRACK, {
                    extraHeaders: extraHeaders,
                    body: description
                  });
                  session.status = C.STATUS_EARLY_MEDIA;
                  session.emit('progress', response);
                }).catch(function onFailure(e) {
                  if (e instanceof SIP.Exceptions.GetDescriptionError) {
                    earlyDialog.pracked.push(response.getHeader('rseq'));
                    if (session.status === C.STATUS_TERMINATED) {
                      return;
                    }
                    session.failed(null, SIP.C.causes.WEBRTC_ERROR);
                    session.terminated(null, SIP.C.causes.WEBRTC_ERROR);
                  } else {
                    earlyDialog.pracked.splice(earlyDialog.pracked.indexOf(response.getHeader('rseq')), 1);
                    // Could not set remote description
                    session.logger.warn('invalid description');
                    session.logger.warn(e);
                  }
                });
              }
            } else {
              this.emit('progress', response);
            }
            break;
          case /^2[0-9]{2}$/.test(response.status_code):
            var cseq = this.request.cseq + ' ' + this.request.method;
            if (cseq !== response.getHeader('cseq')) {
              break;
            }

            if (response.hasHeader('P-Asserted-Identity')) {
              this.assertedIdentity = new SIP.NameAddrHeader.parse(response.getHeader('P-Asserted-Identity'));
            }

            if (this.status === C.STATUS_EARLY_MEDIA && this.dialog) {
              this.status = C.STATUS_CONFIRMED;
              options = {};
              if (this.renderbody) {
                extraHeaders.push('Content-Type: ' + this.rendertype);
                options.extraHeaders = extraHeaders;
                options.body = this.renderbody;
              }
              this.emit("ack", response.transaction.sendACK(options));
              this.accepted(response);
              break;
            }
            // Do nothing if this.dialog is already confirmed
            if (this.dialog) {
              break;
            }

            // This is an invite without sdp
            if (!this.hasOffer) {
              if (this.earlyDialogs[id] && this.earlyDialogs[id].sessionDescriptionHandler) {
                //REVISIT
                this.hasOffer = true;
                this.hasAnswer = true;
                this.sessionDescriptionHandler = this.earlyDialogs[id].sessionDescriptionHandler;
                if (!this.createDialog(response, 'UAC')) {
                  break;
                }
                this.status = C.STATUS_CONFIRMED;
                this.emit("ack", response.transaction.sendACK());

                this.accepted(response);
              } else {
                this.sessionDescriptionHandler = this.sessionDescriptionHandlerFactory(this, this.sessionDescriptionHandlerFactoryOptions);
                this.emit('SessionDescriptionHandler-created', this.sessionDescriptionHandler);

                if (!this.sessionDescriptionHandler.hasDescription(response.getHeader('Content-Type'))) {
                  this.acceptAndTerminate(response, 400, 'Missing session description');
                  this.failed(response, SIP.C.causes.BAD_MEDIA_DESCRIPTION);
                  break;
                }
                if (!this.createDialog(response, 'UAC')) {
                  break;
                }
                this.hasOffer = true;
                this.sessionDescriptionHandler.setDescription(response.body, this.sessionDescriptionHandlerOptions, this.modifiers).then(this.sessionDescriptionHandler.getDescription.bind(this.sessionDescriptionHandler, this.sessionDescriptionHandlerOptions, this.modifiers)).then(function onSuccess(description) {
                  //var localMedia;
                  if (session.isCanceled || session.status === C.STATUS_TERMINATED) {
                    return;
                  }

                  session.status = C.STATUS_CONFIRMED;
                  session.hasAnswer = true;

                  session.emit("ack", response.transaction.sendACK({ body: description }));
                  session.accepted(response);
                }).catch(function onFailure(e) {
                  if (e instanceof SIP.Exceptions.GetDescriptionError) {
                    // TODO do something here
                    session.logger.warn("there was a problem");
                  } else {
                    session.logger.warn('invalid description');
                    session.logger.warn(e);
                    session.acceptAndTerminate(response, 488, 'Invalid session description');
                    session.failed(response, SIP.C.causes.BAD_MEDIA_DESCRIPTION);
                  }
                });
              }
            } else if (this.hasAnswer) {
              if (this.renderbody) {
                extraHeaders.push('Content-Type: ' + session.rendertype);
                options.extraHeaders = extraHeaders;
                options.body = this.renderbody;
              }
              this.emit("ack", response.transaction.sendACK(options));
            } else {
              if (!this.sessionDescriptionHandler.hasDescription(response.getHeader('Content-Type'))) {
                this.acceptAndTerminate(response, 400, 'Missing session description');
                this.failed(response, SIP.C.causes.BAD_MEDIA_DESCRIPTION);
                break;
              }
              if (!this.createDialog(response, 'UAC')) {
                break;
              }
              this.hasAnswer = true;
              this.sessionDescriptionHandler.setDescription(response.body, this.sessionDescriptionHandlerOptions, this.modifiers).then(function onSuccess() {
                var options = {};
                session.status = C.STATUS_CONFIRMED;
                if (session.renderbody) {
                  extraHeaders.push('Content-Type: ' + session.rendertype);
                  options.extraHeaders = extraHeaders;
                  options.body = session.renderbody;
                }
                session.emit("ack", response.transaction.sendACK(options));
                session.accepted(response);
              }, function onFailure(e) {
                session.logger.warn(e);
                session.acceptAndTerminate(response, 488, 'Not Acceptable Here');
                session.failed(response, SIP.C.causes.BAD_MEDIA_DESCRIPTION);
              });
            }
            break;
          default:
            cause = SIP.Utils.sipErrorCause(response.status_code);
            this.rejected(response, cause);
            this.failed(response, cause);
            this.terminated(response, cause);
        }
      } },

    cancel: { writable: true, value: function value(options) {
        options = options || {};

        options.extraHeaders = (options.extraHeaders || []).slice();

        // Check Session Status
        if (this.status === C.STATUS_TERMINATED || this.status === C.STATUS_CONFIRMED) {
          throw new SIP.Exceptions.InvalidStateError(this.status);
        }

        this.logger.log('canceling RTCSession');

        var cancel_reason = SIP.Utils.getCancelReason(options.status_code, options.reason_phrase);

        // Check Session Status
        if (this.status === C.STATUS_NULL || this.status === C.STATUS_INVITE_SENT && !this.received_100) {
          this.isCanceled = true;
          this.cancelReason = cancel_reason;
        } else if (this.status === C.STATUS_INVITE_SENT || this.status === C.STATUS_1XX_RECEIVED || this.status === C.STATUS_EARLY_MEDIA) {
          this.request.cancel(cancel_reason, options.extraHeaders);
        }

        return this.canceled();
      } },

    terminate: { writable: true, value: function value(options) {
        if (this.status === C.STATUS_TERMINATED) {
          return this;
        }

        if (this.status === C.STATUS_WAITING_FOR_ACK || this.status === C.STATUS_CONFIRMED) {
          this.bye(options);
        } else {
          this.cancel(options);
        }

        return this;
      } },

    receiveRequest: { writable: true, value: function value(request) {
        // ICC RECEIVE REQUEST

        // Reject CANCELs
        if (request.method === SIP.C.CANCEL) {
          // TODO; make this a switch when it gets added
        }

        if (request.method === SIP.C.ACK && this.status === C.STATUS_WAITING_FOR_ACK) {

          SIP.Timers.clearTimeout(this.timers.ackTimer);
          SIP.Timers.clearTimeout(this.timers.invite2xxTimer);
          this.status = C.STATUS_CONFIRMED;

          this.accepted();
        }

        return Session.prototype.receiveRequest.apply(this, [request]);
      } },

    onTransportError: { writable: true, value: function value() {
        if (this.status !== C.STATUS_CONFIRMED && this.status !== C.STATUS_TERMINATED) {
          this.failed(null, SIP.C.causes.CONNECTION_ERROR);
        }
      } },

    onRequestTimeout: { writable: true, value: function value() {
        if (this.status === C.STATUS_CONFIRMED) {
          this.terminated(null, SIP.C.causes.REQUEST_TIMEOUT);
        } else if (this.status !== C.STATUS_TERMINATED) {
          this.failed(null, SIP.C.causes.REQUEST_TIMEOUT);
          this.terminated(null, SIP.C.causes.REQUEST_TIMEOUT);
        }
      } }

  });

  SIP.InviteClientContext = InviteClientContext;

  ReferClientContext = function ReferClientContext(ua, applicant, target, options) {
    this.options = options || {};
    this.extraHeaders = (this.options.extraHeaders || []).slice();

    if (ua === undefined || applicant === undefined || target === undefined) {
      throw new TypeError('Not enough arguments');
    }

    SIP.Utils.augment(this, SIP.ClientContext, [ua, SIP.C.REFER, applicant.remoteIdentity.uri.toString(), options]);

    this.applicant = applicant;

    var withReplaces = target instanceof SIP.InviteServerContext || target instanceof SIP.InviteClientContext;
    if (withReplaces) {
      // Attended Transfer
      // All of these fields should be defined based on the check above
      this.target = '"' + target.remoteIdentity.friendlyName + '" ' + '<' + target.dialog.remote_target.toString() + '?Replaces=' + target.dialog.id.call_id + '%3Bto-tag%3D' + target.dialog.id.remote_tag + '%3Bfrom-tag%3D' + target.dialog.id.local_tag + '>';
    } else {
      // Blind Transfer
      // Refer-To: <sip:bob@example.com>
      try {
        this.target = SIP.Grammar.parse(target, 'Refer_To').uri || target;
      } catch (e) {
        this.logger.debug(".refer() cannot parse Refer_To from", target);
        this.logger.debug("...falling through to normalizeTarget()");
      }

      // Check target validity
      this.target = this.ua.normalizeTarget(this.target);
      if (!this.target) {
        throw new TypeError('Invalid target: ' + target);
      }
    }

    if (this.ua) {
      this.extraHeaders.push('Referred-By: <' + this.ua.configuration.uri + '>');
    }
    // TODO: Check that this is correct isc/icc
    this.extraHeaders.push('Contact: ' + applicant.contact);
    this.extraHeaders.push('Allow: ' + SIP.UA.C.ALLOWED_METHODS.toString());
    this.extraHeaders.push('Refer-To: ' + this.target);

    this.errorListener = this.onTransportError.bind(this);
    ua.transport.on('transportError', this.errorListener);
  };

  ReferClientContext.prototype = Object.create({}, {

    refer: { writable: true, value: function value(options) {
        options = options || {};

        var extraHeaders = (this.extraHeaders || []).slice();
        if (options.extraHeaders) {
          extraHeaders.concat(options.extraHeaders);
        }

        this.applicant.sendRequest(SIP.C.REFER, {
          extraHeaders: this.extraHeaders,
          receiveResponse: function (response) {
            if (/^1[0-9]{2}$/.test(response.status_code)) {
              this.emit('referRequestProgress', this);
            } else if (/^2[0-9]{2}$/.test(response.status_code)) {
              this.emit('referRequestAccepted', this);
            } else if (/^[4-6][0-9]{2}$/.test(response.status_code)) {
              this.emit('referRequestRejected', this);
            }
            if (options.receiveResponse) {
              options.receiveResponse(response);
            }
          }.bind(this)
        });
        return this;
      } },

    receiveNotify: { writable: true, value: function value(request) {
        // If we can correctly handle this, then we need to send a 200 OK!
        if (request.hasHeader('Content-Type') && request.getHeader('Content-Type').search(/^message\/sipfrag/) !== -1) {
          var messageBody = SIP.Grammar.parse(request.body, 'sipfrag');
          if (messageBody === -1) {
            request.reply(489, 'Bad Event');
            return;
          }
          switch (true) {
            case /^1[0-9]{2}$/.test(messageBody.status_code):
              this.emit('referProgress', this);
              break;
            case /^2[0-9]{2}$/.test(messageBody.status_code):
              this.emit('referAccepted', this);
              if (!this.options.activeAfterTransfer && this.applicant.terminate) {
                this.applicant.terminate();
              }
              break;
            default:
              this.emit('referRejected', this);
              break;
          }
          request.reply(200);
          this.emit('notify', request);
          return;
        }
        request.reply(489, 'Bad Event');
      } }
  });

  SIP.ReferClientContext = ReferClientContext;

  ReferServerContext = function ReferServerContext(ua, request) {
    SIP.Utils.augment(this, SIP.ServerContext, [ua, request]);

    this.ua = ua;

    this.status = C.STATUS_INVITE_RECEIVED;
    this.from_tag = request.from_tag;
    this.id = request.call_id + this.from_tag;
    this.request = request;
    this.contact = this.ua.contact.toString();

    this.logger = ua.getLogger('sip.referservercontext', this.id);

    // RFC 3515 2.4.1
    if (!this.request.hasHeader('refer-to')) {
      this.logger.warn('Invalid REFER packet. A refer-to header is required. Rejecting refer.');
      this.reject();
      return;
    }

    this.referTo = this.request.parseHeader('refer-to');

    // TODO: Must set expiration timer and send 202 if there is no response by then

    this.referredSession = this.ua.findSession(request);

    // Needed to send the NOTIFY's
    this.cseq = Math.floor(Math.random() * 10000);
    this.call_id = this.request.call_id;
    this.from_uri = this.request.to.uri;
    this.from_tag = this.request.to.parameters.tag;
    this.remote_target = this.request.headers.Contact[0].parsed.uri;
    this.to_uri = this.request.from.uri;
    this.to_tag = this.request.from_tag;
    this.route_set = this.request.getHeaders('record-route');

    this.receiveNonInviteResponse = function () {};

    if (this.request.hasHeader('referred-by')) {
      this.referredBy = this.request.getHeader('referred-by');
    }

    if (this.referTo.uri.hasHeader('replaces')) {
      this.replaces = this.referTo.uri.getHeader('replaces');
    }

    this.errorListener = this.onTransportError.bind(this);
    ua.transport.on('transportError', this.errorListener);

    this.status = C.STATUS_WAITING_FOR_ANSWER;
  };

  ReferServerContext.prototype = Object.create({}, {

    progress: { writable: true, value: function value() {
        if (this.status !== C.STATUS_WAITING_FOR_ANSWER) {
          throw new SIP.Exceptions.InvalidStateError(this.status);
        }
        this.request.reply(100);
      } },

    reject: { writable: true, value: function value(options) {
        if (this.status === C.STATUS_TERMINATED) {
          throw new SIP.Exceptions.InvalidStateError(this.status);
        }
        this.logger.log('Rejecting refer');
        this.status = C.STATUS_TERMINATED;
        SIP.ServerContext.prototype.reject.call(this, options);
        this.emit('referRequestRejected', this);
      } },

    accept: { writable: true, value: function value(options, modifiers) {
        options = options || {};

        if (this.status === C.STATUS_WAITING_FOR_ANSWER) {
          this.status = C.STATUS_ANSWERED;
        } else {
          throw new SIP.Exceptions.InvalidStateError(this.status);
        }

        this.request.reply(202, 'Accepted');
        this.emit('referRequestAccepted', this);

        if (options.followRefer) {
          this.logger.log('Accepted refer, attempting to automatically follow it');

          var target = this.referTo.uri;
          if (!target.scheme.match("^sips?$")) {
            this.logger.error('SIP.js can only automatically follow SIP refer target');
            this.reject();
            return;
          }

          var inviteOptions = options.inviteOptions || {};
          var extraHeaders = (inviteOptions.extraHeaders || []).slice();
          if (this.replaces) {
            // decodeURIComponent is a holdover from 2c086eb4. Not sure that it is actually necessary
            extraHeaders.push('Replaces: ' + decodeURIComponent(this.replaces));
          }

          if (this.referredBy) {
            extraHeaders.push('Referred-By: ' + this.referredBy);
          }

          inviteOptions.extraHeaders = extraHeaders;

          target.clearHeaders();

          this.targetSession = this.ua.invite(target, inviteOptions, modifiers);

          this.emit('referInviteSent', this);

          this.targetSession.once('progress', function () {
            this.sendNotify('SIP/2.0 100 Trying');
            this.emit('referProgress', this);
            if (this.referredSession) {
              this.referredSession.emit('referProgress', this);
            }
          }.bind(this));
          this.targetSession.once('accepted', function () {
            this.logger.log('Successfully followed the refer');
            this.sendNotify('SIP/2.0 200 OK');
            this.emit('referAccepted', this);
            if (this.referredSession) {
              this.referredSession.emit('referAccepted', this);
            }
          }.bind(this));

          var referFailed = function referFailed(response) {
            if (this.status === C.STATUS_TERMINATED) {
              return; // No throw here because it is possible this gets called multiple times
            }
            this.logger.log('Refer was not successful. Resuming session');
            if (response && response.status_code === 429) {
              this.logger.log('Alerting referrer that identity is required.');
              this.sendNotify('SIP/2.0 429 Provide Referrer Identity');
              return;
            }
            this.sendNotify('SIP/2.0 603 Declined');
            // Must change the status after sending the final Notify or it will not send due to check
            this.status = C.STATUS_TERMINATED;
            this.emit('referRejected', this);
            if (this.referredSession) {
              this.referredSession.emit('referRejected');
            }
          };

          this.targetSession.once('rejected', referFailed.bind(this));
          this.targetSession.once('failed', referFailed.bind(this));
        } else {
          this.logger.log('Accepted refer, but did not automatically follow it');
          this.sendNotify('SIP/2.0 200 OK');
          this.emit('referAccepted', this);
          if (this.referredSession) {
            this.referredSession.emit('referAccepted', this);
          }
        }
      } },

    sendNotify: { writable: true, value: function value(body) {
        if (this.status !== C.STATUS_ANSWERED) {
          throw new SIP.Exceptions.InvalidStateError(this.status);
        }
        if (SIP.Grammar.parse(body, 'sipfrag') === -1) {
          throw new Error('sipfrag body is required to send notify for refer');
        }

        var request = new SIP.OutgoingRequest(SIP.C.NOTIFY, this.remote_target, this.ua, {
          cseq: this.cseq += 1, // randomly generated then incremented on each additional notify
          call_id: this.call_id, // refer call_id
          from_uri: this.from_uri,
          from_tag: this.from_tag,
          to_uri: this.to_uri,
          to_tag: this.to_tag,
          route_set: this.route_set
        }, ['Event: refer', 'Subscription-State: terminated', 'Content-Type: message/sipfrag'], body);

        new SIP.RequestSender({
          request: request,
          onRequestTimeout: function onRequestTimeout() {
            return;
          },
          onTransportError: function onTransportError() {
            return;
          },
          receiveResponse: function receiveResponse() {
            return;
          }
        }, this.ua).send();
      } }
  });

  SIP.ReferServerContext = ReferServerContext;
};

/***/ }),
/* 24 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/**
 * @fileoverview DTMF
 */

/**
 * @class DTMF
 * @param {SIP.Session} session
 */

module.exports = function (SIP) {

  var _DTMF,
      C = {
    MIN_DURATION: 70,
    MAX_DURATION: 6000,
    DEFAULT_DURATION: 100,
    MIN_INTER_TONE_GAP: 50,
    DEFAULT_INTER_TONE_GAP: 500
  };

  _DTMF = function DTMF(session, tone, options) {
    var duration, interToneGap;

    if (tone === undefined) {
      throw new TypeError('Not enough arguments');
    }

    this.logger = session.ua.getLogger('sip.invitecontext.dtmf', session.id);
    this.owner = session;
    this.direction = null;

    options = options || {};
    duration = options.duration || null;
    interToneGap = options.interToneGap || null;

    // Check tone type
    if (typeof tone === 'string') {
      tone = tone.toUpperCase();
    } else if (typeof tone === 'number') {
      tone = tone.toString();
    } else {
      throw new TypeError('Invalid tone: ' + tone);
    }

    // Check tone value
    if (!tone.match(/^[0-9A-D#*]$/)) {
      throw new TypeError('Invalid tone: ' + tone);
    } else {
      this.tone = tone;
    }

    // Check duration
    if (duration && !SIP.Utils.isDecimal(duration)) {
      throw new TypeError('Invalid tone duration: ' + duration);
    } else if (!duration) {
      duration = _DTMF.C.DEFAULT_DURATION;
    } else if (duration < _DTMF.C.MIN_DURATION) {
      this.logger.warn('"duration" value is lower than the minimum allowed, setting it to ' + _DTMF.C.MIN_DURATION + ' milliseconds');
      duration = _DTMF.C.MIN_DURATION;
    } else if (duration > _DTMF.C.MAX_DURATION) {
      this.logger.warn('"duration" value is greater than the maximum allowed, setting it to ' + _DTMF.C.MAX_DURATION + ' milliseconds');
      duration = _DTMF.C.MAX_DURATION;
    } else {
      duration = Math.abs(duration);
    }
    this.duration = duration;

    // Check interToneGap
    if (interToneGap && !SIP.Utils.isDecimal(interToneGap)) {
      throw new TypeError('Invalid interToneGap: ' + interToneGap);
    } else if (!interToneGap) {
      interToneGap = _DTMF.C.DEFAULT_INTER_TONE_GAP;
    } else if (interToneGap < _DTMF.C.MIN_INTER_TONE_GAP) {
      this.logger.warn('"interToneGap" value is lower than the minimum allowed, setting it to ' + _DTMF.C.MIN_INTER_TONE_GAP + ' milliseconds');
      interToneGap = _DTMF.C.MIN_INTER_TONE_GAP;
    } else {
      interToneGap = Math.abs(interToneGap);
    }
    this.interToneGap = interToneGap;
  };
  _DTMF.prototype = Object.create(SIP.EventEmitter.prototype);

  _DTMF.prototype.send = function (options) {
    var extraHeaders,
        body = {};

    this.direction = 'outgoing';

    // Check RTCSession Status
    if (this.owner.status !== SIP.Session.C.STATUS_CONFIRMED && this.owner.status !== SIP.Session.C.STATUS_WAITING_FOR_ACK) {
      throw new SIP.Exceptions.InvalidStateError(this.owner.status);
    }

    // Get DTMF options
    options = options || {};
    extraHeaders = options.extraHeaders ? options.extraHeaders.slice() : [];

    body.contentType = 'application/dtmf-relay';

    body.body = "Signal= " + this.tone + "\r\n";
    body.body += "Duration= " + this.duration;

    this.request = this.owner.dialog.sendRequest(this, SIP.C.INFO, {
      extraHeaders: extraHeaders,
      body: body
    });

    this.owner.emit('dtmf', this.request, this);
  };

  /**
   * @private
   */
  _DTMF.prototype.receiveResponse = function (response) {
    var cause;

    switch (true) {
      case /^1[0-9]{2}$/.test(response.status_code):
        // Ignore provisional responses.
        break;

      case /^2[0-9]{2}$/.test(response.status_code):
        this.emit('succeeded', {
          originator: 'remote',
          response: response
        });
        break;

      default:
        cause = SIP.Utils.sipErrorCause(response.status_code);
        this.emit('failed', response, cause);
        break;
    }
  };

  /**
   * @private
   */
  _DTMF.prototype.onRequestTimeout = function () {
    this.emit('failed', null, SIP.C.causes.REQUEST_TIMEOUT);
    this.owner.onRequestTimeout();
  };

  /**
   * @private
   */
  _DTMF.prototype.onTransportError = function () {
    this.emit('failed', null, SIP.C.causes.CONNECTION_ERROR);
    this.owner.onTransportError();
  };

  /**
   * @private
   */
  _DTMF.prototype.onDialogError = function (response) {
    this.emit('failed', response, SIP.C.causes.DIALOG_ERROR);
    this.owner.onDialogError(response);
  };

  /**
   * @private
   */
  _DTMF.prototype.init_incoming = function (request) {
    this.direction = 'incoming';
    this.request = request;

    request.reply(200);

    if (!this.tone || !this.duration) {
      this.logger.warn('invalid INFO DTMF received, discarded');
    } else {
      this.owner.emit('dtmf', request, this);
    }
  };

  _DTMF.C = C;
  return _DTMF;
};

/***/ }),
/* 25 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * @fileoverview SIP Subscriber (SIP-Specific Event Notifications RFC6665)
 */

/**
 * @augments SIP
 * @class Class creating a SIP Subscription.
 */

module.exports = function (SIP) {
  SIP.Subscription = function (ua, target, event, options) {
    options = Object.create(options || Object.prototype);
    this.extraHeaders = options.extraHeaders = (options.extraHeaders || []).slice();

    this.id = null;
    this.state = 'init';

    if (!event) {
      throw new TypeError('Event necessary to create a subscription.');
    } else {
      //TODO: check for valid events here probably make a list in SIP.C; or leave it up to app to check?
      //The check may need to/should probably occur on the other side,
      this.event = event;
    }

    if (typeof options.expires !== 'number') {
      ua.logger.warn('expires must be a number. Using default of 3600.');
      this.expires = 3600;
    } else {
      this.expires = options.expires;
    }
    this.requestedExpires = this.expires;

    options.extraHeaders.push('Event: ' + this.event);
    options.extraHeaders.push('Expires: ' + this.expires);

    if (options.body) {
      this.body = options.body;
    }

    this.contact = ua.contact.toString();

    options.extraHeaders.push('Contact: ' + this.contact);
    options.extraHeaders.push('Allow: ' + SIP.UA.C.ALLOWED_METHODS.toString());

    SIP.Utils.augment(this, SIP.ClientContext, [ua, SIP.C.SUBSCRIBE, target, options]);

    this.logger = ua.getLogger('sip.subscription');

    this.dialog = null;
    this.timers = { N: null, sub_duration: null };
    this.errorCodes = [404, 405, 410, 416, 480, 481, 482, 483, 484, 485, 489, 501, 604];
  };

  SIP.Subscription.prototype = {
    subscribe: function subscribe() {
      var sub = this;

      //these states point to an existing subscription, no subscribe is necessary
      if (this.state === 'active') {
        this.refresh();
        return this;
      } else if (this.state === 'notify_wait') {
        return this;
      }

      SIP.Timers.clearTimeout(this.timers.sub_duration);
      SIP.Timers.clearTimeout(this.timers.N);
      this.timers.N = SIP.Timers.setTimeout(sub.timer_fire.bind(sub), SIP.Timers.TIMER_N);

      this.ua.earlySubscriptions[this.request.call_id + this.request.from.parameters.tag + this.event] = this;

      this.send();

      this.state = 'notify_wait';

      return this;
    },

    refresh: function refresh() {
      if (this.state === 'terminated' || this.state === 'pending' || this.state === 'notify_wait') {
        return;
      }

      this.dialog.sendRequest(this, SIP.C.SUBSCRIBE, {
        extraHeaders: this.extraHeaders,
        body: this.body
      });
    },

    receiveResponse: function receiveResponse(response) {
      var expires,
          sub = this,
          cause = SIP.Utils.getReasonPhrase(response.status_code);

      if (this.state === 'notify_wait' && response.status_code >= 300 || this.state !== 'notify_wait' && this.errorCodes.indexOf(response.status_code) !== -1) {
        this.failed(response, null);
      } else if (/^2[0-9]{2}$/.test(response.status_code)) {
        this.emit('accepted', response, cause);
        //As we don't support RFC 5839 or other extensions where the NOTIFY is optional, timer N will not be cleared
        //SIP.Timers.clearTimeout(this.timers.N);

        expires = response.getHeader('Expires');

        if (expires && expires <= this.requestedExpires) {
          // Preserve new expires value for subsequent requests
          this.expires = expires;
          this.timers.sub_duration = SIP.Timers.setTimeout(sub.refresh.bind(sub), expires * 900);
        } else {
          if (!expires) {
            this.logger.warn('Expires header missing in a 200-class response to SUBSCRIBE');
            this.failed(response, SIP.C.EXPIRES_HEADER_MISSING);
          } else {
            this.logger.warn('Expires header in a 200-class response to SUBSCRIBE with a higher value than the one in the request');
            this.failed(response, SIP.C.INVALID_EXPIRES_HEADER);
          }
        }
      } else if (response.statusCode > 300) {
        this.emit('failed', response, cause);
        this.emit('rejected', response, cause);
      }
    },

    unsubscribe: function unsubscribe() {
      var extraHeaders = [],
          sub = this;

      this.state = 'terminated';

      extraHeaders.push('Event: ' + this.event);
      extraHeaders.push('Expires: 0');

      extraHeaders.push('Contact: ' + this.contact);
      extraHeaders.push('Allow: ' + SIP.UA.C.ALLOWED_METHODS.toString());

      //makes sure expires isn't set, and other typical resubscribe behavior
      this.receiveResponse = function () {};

      this.dialog.sendRequest(this, this.method, {
        extraHeaders: extraHeaders,
        body: this.body
      });

      SIP.Timers.clearTimeout(this.timers.sub_duration);
      SIP.Timers.clearTimeout(this.timers.N);
      this.timers.N = SIP.Timers.setTimeout(sub.timer_fire.bind(sub), SIP.Timers.TIMER_N);
    },

    /**
    * @private
    */
    timer_fire: function timer_fire() {
      if (this.state === 'terminated') {
        this.terminateDialog();
        SIP.Timers.clearTimeout(this.timers.N);
        SIP.Timers.clearTimeout(this.timers.sub_duration);

        delete this.ua.subscriptions[this.id];
      } else if (this.state === 'notify_wait' || this.state === 'pending') {
        this.close();
      } else {
        this.refresh();
      }
    },

    /**
    * @private
    */
    close: function close() {
      if (this.state === 'notify_wait') {
        this.state = 'terminated';
        SIP.Timers.clearTimeout(this.timers.N);
        SIP.Timers.clearTimeout(this.timers.sub_duration);
        this.receiveResponse = function () {};

        delete this.ua.earlySubscriptions[this.request.call_id + this.request.from.parameters.tag + this.event];
      } else if (this.state !== 'terminated') {
        this.unsubscribe();
      }
    },

    /**
    * @private
    */
    createConfirmedDialog: function createConfirmedDialog(message, type) {
      var dialog;

      this.terminateDialog();
      dialog = new SIP.Dialog(this, message, type);
      dialog.invite_seqnum = this.request.cseq;
      dialog.local_seqnum = this.request.cseq;

      if (!dialog.error) {
        this.dialog = dialog;
        return true;
      }
      // Dialog not created due to an error
      else {
          return false;
        }
    },

    /**
    * @private
    */
    terminateDialog: function terminateDialog() {
      if (this.dialog) {
        delete this.ua.subscriptions[this.id];
        this.dialog.terminate();
        delete this.dialog;
      }
    },

    /**
    * @private
    */
    receiveRequest: function receiveRequest(request) {
      var sub_state,
          sub = this;

      function setExpiresTimeout() {
        if (sub_state.expires) {
          SIP.Timers.clearTimeout(sub.timers.sub_duration);
          sub_state.expires = Math.min(sub.expires, Math.max(sub_state.expires, 0));
          sub.timers.sub_duration = SIP.Timers.setTimeout(sub.refresh.bind(sub), sub_state.expires * 900);
        }
      }

      if (!this.matchEvent(request)) {
        //checks event and subscription_state headers
        request.reply(489);
        return;
      }

      if (!this.dialog) {
        if (this.createConfirmedDialog(request, 'UAS')) {
          this.id = this.dialog.id.toString();
          delete this.ua.earlySubscriptions[this.request.call_id + this.request.from.parameters.tag + this.event];
          this.ua.subscriptions[this.id] = this;
          // UPDATE ROUTE SET TO BE BACKWARDS COMPATIBLE?
        }
      }

      sub_state = request.parseHeader('Subscription-State');

      request.reply(200, SIP.C.REASON_200);

      SIP.Timers.clearTimeout(this.timers.N);

      this.emit('notify', { request: request });

      // if we've set state to terminated, no further processing should take place
      // and we are only interested in cleaning up after the appropriate NOTIFY
      if (this.state === 'terminated') {
        if (sub_state.state === 'terminated') {
          this.terminateDialog();
          SIP.Timers.clearTimeout(this.timers.N);
          SIP.Timers.clearTimeout(this.timers.sub_duration);

          delete this.ua.subscriptions[this.id];
        }
        return;
      }

      switch (sub_state.state) {
        case 'active':
          this.state = 'active';
          setExpiresTimeout();
          break;
        case 'pending':
          if (this.state === 'notify_wait') {
            setExpiresTimeout();
          }
          this.state = 'pending';
          break;
        case 'terminated':
          SIP.Timers.clearTimeout(this.timers.sub_duration);
          if (sub_state.reason) {
            this.logger.log('terminating subscription with reason ' + sub_state.reason);
            switch (sub_state.reason) {
              case 'deactivated':
              case 'timeout':
                this.subscribe();
                return;
              case 'probation':
              case 'giveup':
                if (sub_state.params && sub_state.params['retry-after']) {
                  this.timers.sub_duration = SIP.Timers.setTimeout(sub.subscribe.bind(sub), sub_state.params['retry-after']);
                } else {
                  this.subscribe();
                }
                return;
              case 'rejected':
              case 'noresource':
              case 'invariant':
                break;
            }
          }
          this.close();
          break;
      }
    },

    failed: function failed(response, cause) {
      this.close();
      this.emit('failed', response, cause);
      this.emit('rejected', response, cause);
      return this;
    },

    onDialogError: function onDialogError(response) {
      this.failed(response, SIP.C.causes.DIALOG_ERROR);
    },

    /**
    * @private
    */
    matchEvent: function matchEvent(request) {
      var event;

      // Check mandatory header Event
      if (!request.hasHeader('Event')) {
        this.logger.warn('missing Event header');
        return false;
      }
      // Check mandatory header Subscription-State
      if (!request.hasHeader('Subscription-State')) {
        this.logger.warn('missing Subscription-State header');
        return false;
      }

      // Check whether the event in NOTIFY matches the event in SUBSCRIBE
      event = request.parseHeader('event').event;

      if (this.event !== event) {
        this.logger.warn('event match failed');
        request.reply(481, 'Event Match Failed');
        return false;
      } else {
        return true;
      }
    }
  };
};

/***/ }),
/* 26 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * @fileoverview SIP Publish (SIP Extension for Event State Publication RFC3903)
 */

/**
 * @augments SIP
 * @class Class creating a SIP PublishContext.
 */

module.exports = function (SIP) {

  var PublishContext;

  PublishContext = function PublishContext(ua, target, event, options) {
    this.options = options = options || {};
    this.options.extraHeaders = (options.extraHeaders || []).slice();
    this.options.contentType = options.contentType || 'text/plain';

    if (typeof options.expires !== 'number' || options.expires % 1 !== 0) {
      this.options.expires = 3600;
    } else {
      this.options.expires = Number(options.expires);
    }

    if (typeof options.unpublishOnClose !== "boolean") {
      this.options.unpublishOnClose = true;
    } else {
      this.options.unpublishOnClose = options.unpublishOnClose;
    }

    if (target === undefined || target === null || target === '') {
      throw new SIP.Exceptions.MethodParameterError('Publish', 'Target', target);
    } else {
      this.target = ua.normalizeTarget(target);
    }

    if (event === undefined || event === null || event === '') {
      throw new SIP.Exceptions.MethodParameterError('Publish', 'Event', event);
    } else {
      this.event = event;
    }

    // Call parent constructor
    SIP.ClientContext.call(this, ua, SIP.C.PUBLISH, this.target, this.options);

    this.logger = this.ua.getLogger('sip.publish');

    this.pubRequestBody = null;
    this.pubRequestExpires = this.options.expires;
    this.pubRequestEtag = null;

    this.publish_refresh_timer = null;

    ua.on('transportCreated', function (transport) {
      transport.on('transportError', this.onTransportError.bind(this));
    }.bind(this));
  };

  // Extend ClientContext
  PublishContext.prototype = Object.create(SIP.ClientContext.prototype);

  // Restore the class constructor
  PublishContext.prototype.constructor = PublishContext;

  /**
   * Publish
   *
   * @param {string} Event body to publish, optional
   *
   */
  PublishContext.prototype.publish = function (body) {
    // Clean up before the run
    this.request = null;
    SIP.Timers.clearTimeout(this.publish_refresh_timer);

    if (body !== undefined && body !== null && body !== '') {
      // is Inital or Modify request
      this.options.body = body;
      this.pubRequestBody = this.options.body;

      if (this.pubRequestExpires === 0) {
        // This is Initial request after unpublish
        this.pubRequestExpires = this.options.expires;
        this.pubRequestEtag = null;
      }

      if (!this.ua.publishers[this.target.toString() + ':' + this.event]) {
        this.ua.publishers[this.target.toString() + ':' + this.event] = this;
      }
    } else {
      // This is Refresh request
      this.pubRequestBody = null;

      if (this.pubRequestEtag === null) {
        //Request not valid
        throw new SIP.Exceptions.MethodParameterError('Publish', 'Body', body);
      }

      if (this.pubRequestExpires === 0) {
        //Request not valid
        throw new SIP.Exceptions.MethodParameterError('Publish', 'Expire', this.pubRequestExpires);
      }
    }

    this.sendPublishRequest();
  };

  /**
   * Unpublish
   *
   */
  PublishContext.prototype.unpublish = function () {
    // Clean up before the run
    this.request = null;
    SIP.Timers.clearTimeout(this.publish_refresh_timer);

    this.pubRequestBody = null;
    this.pubRequestExpires = 0;

    if (this.pubRequestEtag !== null) {
      this.sendPublishRequest();
    }
  };

  /**
   * Close
   *
   */
  PublishContext.prototype.close = function () {
    // Send unpublish, if requested
    if (this.options.unpublishOnClose) {
      this.unpublish();
    } else {
      this.request = null;
      SIP.Timers.clearTimeout(this.publish_refresh_timer);

      this.pubRequestBody = null;
      this.pubRequestExpires = 0;
      this.pubRequestEtag = null;
    }

    if (this.ua.publishers[this.target.toString() + ':' + this.event]) {
      delete this.ua.publishers[this.target.toString() + ':' + this.event];
    }
  };

  /**
   * @private
   *
   */
  PublishContext.prototype.sendPublishRequest = function () {
    var reqOptions;

    reqOptions = Object.create(this.options || Object.prototype);
    reqOptions.extraHeaders = (this.options.extraHeaders || []).slice();

    reqOptions.extraHeaders.push('Event: ' + this.event);
    reqOptions.extraHeaders.push('Expires: ' + this.pubRequestExpires);

    if (this.pubRequestEtag !== null) {
      reqOptions.extraHeaders.push('SIP-If-Match: ' + this.pubRequestEtag);
    }

    this.request = new SIP.OutgoingRequest(SIP.C.PUBLISH, this.target, this.ua, this.options.params, reqOptions.extraHeaders);

    if (this.pubRequestBody !== null) {
      this.request.body = {};
      this.request.body.body = this.pubRequestBody;
      this.request.body.contentType = this.options.contentType;
    }

    this.send();
  };

  /**
   * @private
   *
   */
  PublishContext.prototype.receiveResponse = function (response) {
    var expires,
        minExpires,
        cause = SIP.Utils.getReasonPhrase(response.status_code);

    switch (true) {
      case /^1[0-9]{2}$/.test(response.status_code):
        this.emit('progress', response, cause);
        break;

      case /^2[0-9]{2}$/.test(response.status_code):
        // Set SIP-Etag
        if (response.hasHeader('SIP-ETag')) {
          this.pubRequestEtag = response.getHeader('SIP-ETag');
        } else {
          this.logger.warn('SIP-ETag header missing in a 200-class response to PUBLISH');
        }

        // Update Expire
        if (response.hasHeader('Expires')) {
          expires = Number(response.getHeader('Expires'));
          if (typeof expires === 'number' && expires >= 0 && expires <= this.pubRequestExpires) {
            this.pubRequestExpires = expires;
          } else {
            this.logger.warn('Bad Expires header in a 200-class response to PUBLISH');
          }
        } else {
          this.logger.warn('Expires header missing in a 200-class response to PUBLISH');
        }

        if (this.pubRequestExpires !== 0) {
          // Schedule refresh
          this.publish_refresh_timer = SIP.Timers.setTimeout(this.publish.bind(this), this.pubRequestExpires * 900);
          this.emit('published', response, cause);
        } else {
          this.emit('unpublished', response, cause);
        }

        break;

      case /^412$/.test(response.status_code):
        // 412 code means no matching ETag - possibly the PUBLISH expired
        // Resubmit as new request, if the current request is not a "remove"

        if (this.pubRequestEtag !== null && this.pubRequestExpires !== 0) {
          this.logger.warn('412 response to PUBLISH, recovering');
          this.pubRequestEtag = null;
          this.emit('progress', response, cause);
          this.publish(this.options.body);
        } else {
          this.logger.warn('412 response to PUBLISH, recovery failed');
          this.pubRequestExpires = 0;
          this.emit('failed', response, cause);
          this.emit('unpublished', response, cause);
        }

        break;

      case /^423$/.test(response.status_code):
        // 423 code means we need to adjust the Expires interval up
        if (this.pubRequestExpires !== 0 && response.hasHeader('Min-Expires')) {
          minExpires = Number(response.getHeader('Min-Expires'));
          if (typeof minExpires === 'number' || minExpires > this.pubRequestExpires) {
            this.logger.warn('423 code in response to PUBLISH, adjusting the Expires value and trying to recover');
            this.pubRequestExpires = minExpires;
            this.emit('progress', response, cause);
            this.publish(this.options.body);
          } else {
            this.logger.warn('Bad 423 response Min-Expires header received for PUBLISH');
            this.pubRequestExpires = 0;
            this.emit('failed', response, cause);
            this.emit('unpublished', response, cause);
          }
        } else {
          this.logger.warn('423 response to PUBLISH, recovery failed');
          this.pubRequestExpires = 0;
          this.emit('failed', response, cause);
          this.emit('unpublished', response, cause);
        }

        break;

      default:
        this.pubRequestExpires = 0;
        this.emit('failed', response, cause);
        this.emit('unpublished', response, cause);

        break;
    }

    // Do the cleanup
    if (this.pubRequestExpires === 0) {
      SIP.Timers.clearTimeout(this.publish_refresh_timer);

      this.pubRequestBody = null;
      this.pubRequestEtag = null;
    }
  };

  PublishContext.prototype.onRequestTimeout = function () {
    SIP.ClientContext.prototype.onRequestTimeout.call(this);
    this.emit('unpublished', null, SIP.C.causes.REQUEST_TIMEOUT);
  };

  PublishContext.prototype.onTransportError = function () {
    SIP.ClientContext.prototype.onTransportError.call(this);
    this.emit('unpublished', null, SIP.C.causes.CONNECTION_ERROR);
  };

  SIP.PublishContext = PublishContext;
};

/***/ }),
/* 27 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(global) {
/**
 * @augments SIP
 * @class Class creating a SIP User Agent.
 * @param {function returning SIP.sessionDescriptionHandler} [configuration.sessionDescriptionHandlerFactory]
 *        A function will be invoked by each of the UA's Sessions to build the sessionDescriptionHandler for that Session.
 *        If no (or a falsy) value is provided, each Session will use a default (WebRTC) sessionDescriptionHandler.
 *
 * @param {Object} [configuration.media] gets passed to SIP.sessionDescriptionHandler.getDescription as mediaHint
 */

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

module.exports = function (SIP, environment) {
  var UA,
      C = {
    // UA status codes
    STATUS_INIT: 0,
    STATUS_STARTING: 1,
    STATUS_READY: 2,
    STATUS_USER_CLOSED: 3,
    STATUS_NOT_READY: 4,

    // UA error codes
    CONFIGURATION_ERROR: 1,
    NETWORK_ERROR: 2,

    ALLOWED_METHODS: ['ACK', 'CANCEL', 'INVITE', 'MESSAGE', 'BYE', 'OPTIONS', 'INFO', 'NOTIFY', 'REFER'],

    ACCEPTED_BODY_TYPES: ['application/sdp', 'application/dtmf-relay'],

    MAX_FORWARDS: 70,
    TAG_LENGTH: 10
  };

  UA = function UA(configuration) {
    var self = this;

    // Helper function for forwarding events
    function selfEmit(type) {
      //registrationFailed handler is invoked with two arguments. Allow event handlers to be invoked with a variable no. of arguments
      return self.emit.bind(self, type);
    }

    // Set Accepted Body Types
    C.ACCEPTED_BODY_TYPES = C.ACCEPTED_BODY_TYPES.toString();

    this.log = new SIP.LoggerFactory();
    this.logger = this.getLogger('sip.ua');

    this.cache = {
      credentials: {}
    };

    this.configuration = {};
    this.dialogs = {};

    //User actions outside any session/dialog (MESSAGE)
    this.applicants = {};

    this.data = {};
    this.sessions = {};
    this.subscriptions = {};
    this.earlySubscriptions = {};
    this.publishers = {};
    this.transport = null;
    this.contact = null;
    this.status = C.STATUS_INIT;
    this.error = null;
    this.transactions = {
      nist: {},
      nict: {},
      ist: {},
      ict: {}
    };

    Object.defineProperties(this, {
      transactionsCount: {
        get: function get() {
          var type,
              transactions = ['nist', 'nict', 'ist', 'ict'],
              count = 0;

          for (type in transactions) {
            count += Object.keys(this.transactions[transactions[type]]).length;
          }

          return count;
        }
      },

      nictTransactionsCount: {
        get: function get() {
          return Object.keys(this.transactions['nict']).length;
        }
      },

      nistTransactionsCount: {
        get: function get() {
          return Object.keys(this.transactions['nist']).length;
        }
      },

      ictTransactionsCount: {
        get: function get() {
          return Object.keys(this.transactions['ict']).length;
        }
      },

      istTransactionsCount: {
        get: function get() {
          return Object.keys(this.transactions['ist']).length;
        }
      }
    });

    /**
     * Load configuration
     *
     * @throws {SIP.Exceptions.ConfigurationError}
     * @throws {TypeError}
     */

    if (configuration === undefined) {
      configuration = {};
    } else if (typeof configuration === 'string' || configuration instanceof String) {
      configuration = {
        uri: configuration
      };
    }

    // Apply log configuration if present
    if (configuration.log) {
      if (configuration.log.hasOwnProperty('builtinEnabled')) {
        this.log.builtinEnabled = configuration.log.builtinEnabled;
      }

      if (configuration.log.hasOwnProperty('level')) {
        this.log.level = configuration.log.level;
      }

      if (configuration.log.hasOwnProperty('connector')) {
        this.log.connector = configuration.log.connector;
      }
    }

    try {
      this.loadConfig(configuration);
    } catch (e) {
      this.status = C.STATUS_NOT_READY;
      this.error = C.CONFIGURATION_ERROR;
      throw e;
    }

    // Initialize registerContext
    this.registerContext = new SIP.RegisterContext(this);
    this.registerContext.on('failed', selfEmit('registrationFailed'));
    this.registerContext.on('registered', selfEmit('registered'));
    this.registerContext.on('unregistered', selfEmit('unregistered'));

    if (this.configuration.autostart) {
      this.start();
    }
  };
  UA.prototype = Object.create(SIP.EventEmitter.prototype);

  //=================
  //  High Level API
  //=================

  UA.prototype.register = function (options) {
    this.configuration.register = true;
    this.registerContext.register(options);

    return this;
  };

  /**
   * Unregister.
   *
   * @param {Boolean} [all] unregister all user bindings.
   *
   */
  UA.prototype.unregister = function (options) {
    this.configuration.register = false;

    var context = this.registerContext;
    this.transport.afterConnected(context.unregister.bind(context, options));

    return this;
  };

  UA.prototype.isRegistered = function () {
    return this.registerContext.registered;
  };

  /**
   * Make an outgoing call.
   *
   * @param {String} target
   * @param {Object} views
   * @param {Object} [options.media] gets passed to SIP.sessionDescriptionHandler.getDescription as mediaHint
   *
   * @throws {TypeError}
   *
   */
  UA.prototype.invite = function (target, options, modifiers) {
    var context = new SIP.InviteClientContext(this, target, options, modifiers);
    // Delay sending actual invite until the next 'tick' if we are already
    // connected, so that API consumers can register to events fired by the
    // the session.
    this.transport.afterConnected(function () {
      context.invite();
      this.emit('inviteSent', context);
    }.bind(this));
    return context;
  };

  UA.prototype.subscribe = function (target, event, options) {
    var sub = new SIP.Subscription(this, target, event, options);

    this.transport.afterConnected(sub.subscribe.bind(sub));
    return sub;
  };

  /**
   * Send PUBLISH Event State Publication (RFC3903)
   *
   * @param {String} target
   * @param {String} event
   * @param {String} body
   * @param {Object} [options]
   *
   * @throws {SIP.Exceptions.MethodParameterError}
   *
   */
  UA.prototype.publish = function (target, event, body, options) {
    var pub = new SIP.PublishContext(this, target, event, options);

    this.transport.afterConnected(pub.publish.bind(pub, body));
    return pub;
  };

  /**
   * Send a message.
   *
   * @param {String} target
   * @param {String} body
   * @param {Object} [options]
   *
   * @throws {TypeError}
   *
   */
  UA.prototype.message = function (target, body, options) {
    if (body === undefined) {
      throw new TypeError('Not enough arguments');
    }

    // There is no Message module, so it is okay that the UA handles defaults here.
    options = Object.create(options || Object.prototype);
    options.contentType || (options.contentType = 'text/plain');
    options.body = body;

    return this.request(SIP.C.MESSAGE, target, options);
  };

  UA.prototype.request = function (method, target, options) {
    var req = new SIP.ClientContext(this, method, target, options);

    this.transport.afterConnected(req.send.bind(req));
    return req;
  };

  /**
   * Gracefully close.
   *
   */
  UA.prototype.stop = function () {
    var session,
        subscription,
        applicant,
        publisher,
        ua = this;

    function transactionsListener() {
      if (ua.nistTransactionsCount === 0 && ua.nictTransactionsCount === 0) {
        ua.removeListener('transactionDestroyed', transactionsListener);
        ua.transport.disconnect();
      }
    }

    this.logger.log('user requested closure...');

    if (this.status === C.STATUS_USER_CLOSED) {
      this.logger.warn('UA already closed');
      return this;
    }

    // Close registerContext
    this.logger.log('closing registerContext');
    this.registerContext.close();

    // Run  _terminate_ on every Session
    for (session in this.sessions) {
      this.logger.log('closing session ' + session);
      this.sessions[session].terminate();
    }

    //Run _close_ on every confirmed Subscription
    for (subscription in this.subscriptions) {
      this.logger.log('unsubscribing from subscription ' + subscription);
      this.subscriptions[subscription].close();
    }

    //Run _close_ on every early Subscription
    for (subscription in this.earlySubscriptions) {
      this.logger.log('unsubscribing from early subscription ' + subscription);
      this.earlySubscriptions[subscription].close();
    }

    //Run _close_ on every Publisher
    for (publisher in this.publishers) {
      this.logger.log('unpublish ' + publisher);
      this.publishers[publisher].close();
    }

    // Run  _close_ on every applicant
    for (applicant in this.applicants) {
      this.applicants[applicant].close();
    }

    this.status = C.STATUS_USER_CLOSED;

    /*
     * If the remaining transactions are all INVITE transactions, there is no need to
     * wait anymore because every session has already been closed by this method.
     * - locally originated sessions where terminated (CANCEL or BYE)
     * - remotely originated sessions where rejected (4XX) or terminated (BYE)
     * Remaining INVITE transactions belong tho sessions that where answered. This are in
     * 'accepted' state due to timers 'L' and 'M' defined in [RFC 6026]
     */
    if (this.nistTransactionsCount === 0 && this.nictTransactionsCount === 0) {
      this.transport.disconnect();
    } else {
      this.on('transactionDestroyed', transactionsListener);
    }

    if (typeof environment.removeEventListener === 'function') {
      // Google Chrome Packaged Apps don't allow 'unload' listeners:
      // unload is not available in packaged apps
      if (!(global.chrome && global.chrome.app && global.chrome.app.runtime)) {
        environment.removeEventListener('unload', this.environListener);
      }
    }

    return this;
  };

  /**
   * Connect to the WS server if status = STATUS_INIT.
   * Resume UA after being closed.
   *
   */
  UA.prototype.start = function () {
    // var server;

    this.logger.log('user requested startup...');
    if (this.status === C.STATUS_INIT) {
      this.status = C.STATUS_STARTING;
      if (!this.configuration.transportConstructor) {
        throw new SIP.Exceptions.TransportError("Transport constructor not set");
      }
      this.transport = new this.configuration.transportConstructor(this.getLogger('sip.transport'), this.configuration.transportOptions);
      this.setTransportListeners();
      this.emit('transportCreated', this.transport);
      this.transport.connect();
    } else if (this.status === C.STATUS_USER_CLOSED) {
      this.logger.log('resuming');
      this.status = C.STATUS_READY;
      this.transport.connect();
    } else if (this.status === C.STATUS_STARTING) {
      this.logger.log('UA is in STARTING status, not opening new connection');
    } else if (this.status === C.STATUS_READY) {
      this.logger.log('UA is in READY status, not resuming');
    } else {
      this.logger.error('Connection is down. Auto-Recovery system is trying to connect');
    }

    if (this.configuration.autostop && typeof environment.addEventListener === 'function') {
      // Google Chrome Packaged Apps don't allow 'unload' listeners:
      // unload is not available in packaged apps
      if (!(global.chrome && global.chrome.app && global.chrome.app.runtime)) {
        this.environListener = this.stop.bind(this);
        environment.addEventListener('unload', this.environListener);
      }
    }

    return this;
  };

  /**
   * Normalize a string into a valid SIP request URI
   *
   * @param {String} target
   *
   * @returns {SIP.URI|undefined}
   */
  UA.prototype.normalizeTarget = function (target) {
    return SIP.Utils.normalizeTarget(target, this.configuration.hostportParams);
  };

  //===============================
  //  Private (For internal use)
  //===============================

  UA.prototype.saveCredentials = function (credentials) {
    this.cache.credentials[credentials.realm] = this.cache.credentials[credentials.realm] || {};
    this.cache.credentials[credentials.realm][credentials.uri] = credentials;

    return this;
  };

  UA.prototype.getCredentials = function (request) {
    var realm, credentials;

    realm = request.ruri.host;

    if (this.cache.credentials[realm] && this.cache.credentials[realm][request.ruri]) {
      credentials = this.cache.credentials[realm][request.ruri];
      credentials.method = request.method;
    }

    return credentials;
  };

  UA.prototype.getLogger = function (category, label) {
    return this.log.getLogger(category, label);
  };

  //==============================
  // Event Handlers
  //==============================


  UA.prototype.onTransportError = function () {
    if (this.status === C.STATUS_USER_CLOSED) {
      return;
    }

    if (!this.error || this.error !== C.NETWORK_ERROR) {
      this.status = C.STATUS_NOT_READY;
      this.error = C.NETWORK_ERROR;
    }
  };

  /**
   * Helper function. Sets transport listeners
   * @private
   */
  UA.prototype.setTransportListeners = function () {
    this.transport.on('connected', this.onTransportConnected.bind(this));
    this.transport.on('message', this.onTransportReceiveMsg.bind(this));
    this.transport.on('transportError', this.onTransportError.bind(this));
  };

  /**
   * Transport connection event.
   * @private
   * @event
   * @param {SIP.Transport} transport.
   */
  UA.prototype.onTransportConnected = function () {
    if (this.configuration.register) {
      this.configuration.authenticationFactory.initialize().then(function () {
        this.registerContext.onTransportConnected();
      }.bind(this));
    }
  };

  /**
   * Transport message receipt event.
   * @private
   * @event
   * @param {String} message
   */

  UA.prototype.onTransportReceiveMsg = function (message) {
    var transaction;
    message = SIP.Parser.parseMessage(message, this);

    if (this.status === SIP.UA.C.STATUS_USER_CLOSED && message instanceof SIP.IncomingRequest) {
      this.logger.warn('UA received message when status = USER_CLOSED - aborting');
      return;
    }
    // Do some sanity check
    if (SIP.sanityCheck(message, this, this.transport)) {
      if (message instanceof SIP.IncomingRequest) {
        message.transport = this.transport;
        this.receiveRequest(message);
      } else if (message instanceof SIP.IncomingResponse) {
        /* Unike stated in 18.1.2, if a response does not match
        * any transaction, it is discarded here and no passed to the core
        * in order to be discarded there.
        */
        switch (message.method) {
          case SIP.C.INVITE:
            transaction = this.transactions.ict[message.via_branch];
            if (transaction) {
              transaction.receiveResponse(message);
            }
            break;
          case SIP.C.ACK:
            // Just in case ;-)
            break;
          default:
            transaction = this.transactions.nict[message.via_branch];
            if (transaction) {
              transaction.receiveResponse(message);
            }
            break;
        }
      }
    }
  };

  /**
   * new Transaction
   * @private
   * @param {SIP.Transaction} transaction.
   */
  UA.prototype.newTransaction = function (transaction) {
    this.transactions[transaction.type][transaction.id] = transaction;
    this.emit('newTransaction', { transaction: transaction });
  };

  /**
   * destroy Transaction
   * @private
   * @param {SIP.Transaction} transaction.
   */
  UA.prototype.destroyTransaction = function (transaction) {
    delete this.transactions[transaction.type][transaction.id];
    this.emit('transactionDestroyed', {
      transaction: transaction
    });
  };

  //=========================
  // receiveRequest
  //=========================

  /**
   * Request reception
   * @private
   * @param {SIP.IncomingRequest} request.
   */
  UA.prototype.receiveRequest = function (request) {
    var dialog,
        session,
        message,
        earlySubscription,
        method = request.method,
        replaces,
        replacedDialog,
        self = this;

    function ruriMatches(uri) {
      return uri && uri.user === request.ruri.user;
    }

    // Check that request URI points to us
    if (!(ruriMatches(this.configuration.uri) || ruriMatches(this.contact.uri) || ruriMatches(this.contact.pub_gruu) || ruriMatches(this.contact.temp_gruu))) {
      this.logger.warn('Request-URI does not point to us');
      if (request.method !== SIP.C.ACK) {
        request.reply_sl(404);
      }
      return;
    }

    // Check request URI scheme
    if (request.ruri.scheme === SIP.C.SIPS) {
      request.reply_sl(416);
      return;
    }

    // Check transaction
    if (SIP.Transactions.checkTransaction(this, request)) {
      return;
    }

    /* RFC3261 12.2.2
     * Requests that do not change in any way the state of a dialog may be
     * received within a dialog (for example, an OPTIONS request).
     * They are processed as if they had been received outside the dialog.
     */
    if (method === SIP.C.OPTIONS) {
      new SIP.Transactions.NonInviteServerTransaction(request, this);
      request.reply(200, null, ['Allow: ' + SIP.UA.C.ALLOWED_METHODS.toString(), 'Accept: ' + C.ACCEPTED_BODY_TYPES]);
    } else if (method === SIP.C.MESSAGE) {
      message = new SIP.ServerContext(this, request);
      message.body = request.body;
      message.content_type = request.getHeader('Content-Type') || 'text/plain';

      request.reply(200, null);
      this.emit('message', message);
    } else if (method !== SIP.C.INVITE && method !== SIP.C.ACK) {
      // Let those methods pass through to normal processing for now.
      new SIP.ServerContext(this, request);
    }

    // Initial Request
    if (!request.to_tag) {
      switch (method) {
        case SIP.C.INVITE:
          replaces = this.configuration.replaces !== SIP.C.supported.UNSUPPORTED && request.parseHeader('replaces');

          if (replaces) {
            replacedDialog = this.dialogs[replaces.call_id + replaces.replaces_to_tag + replaces.replaces_from_tag];

            if (!replacedDialog) {
              //Replaced header without a matching dialog, reject
              request.reply_sl(481, null);
              return;
            } else if (replacedDialog.owner.status === SIP.Session.C.STATUS_TERMINATED) {
              request.reply_sl(603, null);
              return;
            } else if (replacedDialog.state === SIP.Dialog.C.STATUS_CONFIRMED && replaces.early_only) {
              request.reply_sl(486, null);
              return;
            }
          }

          session = new SIP.InviteServerContext(this, request);
          session.replacee = replacedDialog && replacedDialog.owner;
          self.emit('invite', session);
          break;
        case SIP.C.BYE:
          // Out of dialog BYE received
          request.reply(481);
          break;
        case SIP.C.CANCEL:
          session = this.findSession(request);
          if (session) {
            session.receiveRequest(request);
          } else {
            this.logger.warn('received CANCEL request for a non existent session');
          }
          break;
        case SIP.C.ACK:
          /* Absorb it.
           * ACK request without a corresponding Invite Transaction
           * and without To tag.
           */
          break;
        case SIP.C.NOTIFY:
          if (this.configuration.allowLegacyNotifications && this.listeners('notify').length > 0) {
            request.reply(200, null);
            self.emit('notify', { request: request });
          } else {
            request.reply(481, 'Subscription does not exist');
          }
          break;
        case SIP.C.REFER:
          this.logger.log('Received an out of dialog refer');
          if (this.configuration.allowOutOfDialogRefers) {
            this.logger.log('Allow out of dialog refers is enabled on the UA');
            var referContext = new SIP.ReferServerContext(this, request);
            var hasReferListener = this.listeners('outOfDialogReferRequested').length;
            if (hasReferListener) {
              this.emit('outOfDialogReferRequested', referContext);
            } else {
              this.logger.log('No outOfDialogReferRequest listeners, automatically accepting and following the out of dialog refer');
              referContext.accept({ followRefer: true });
            }
            break;
          }
          request.reply(405);
          break;
        default:
          request.reply(405);
          break;
      }
    }
    // In-dialog request
    else {
        dialog = this.findDialog(request);

        if (dialog) {
          if (method === SIP.C.INVITE) {
            new SIP.Transactions.InviteServerTransaction(request, this);
          }
          dialog.receiveRequest(request);
        } else if (method === SIP.C.NOTIFY) {
          session = this.findSession(request);
          earlySubscription = this.findEarlySubscription(request);
          if (session) {
            session.receiveRequest(request);
          } else if (earlySubscription) {
            earlySubscription.receiveRequest(request);
          } else {
            this.logger.warn('received NOTIFY request for a non existent session or subscription');
            request.reply(481, 'Subscription does not exist');
          }
        }
        /* RFC3261 12.2.2
         * Request with to tag, but no matching dialog found.
         * Exception: ACK for an Invite request for which a dialog has not
         * been created.
         */
        else {
            if (method !== SIP.C.ACK) {
              request.reply(481);
            }
          }
      }
  };

  //=================
  // Utils
  //=================

  /**
   * Get the session to which the request belongs to, if any.
   * @private
   * @param {SIP.IncomingRequest} request.
   * @returns {SIP.OutgoingSession|SIP.IncomingSession|null}
   */
  UA.prototype.findSession = function (request) {
    return this.sessions[request.call_id + request.from_tag] || this.sessions[request.call_id + request.to_tag] || null;
  };

  /**
   * Get the dialog to which the request belongs to, if any.
   * @private
   * @param {SIP.IncomingRequest}
   * @returns {SIP.Dialog|null}
   */
  UA.prototype.findDialog = function (request) {
    return this.dialogs[request.call_id + request.from_tag + request.to_tag] || this.dialogs[request.call_id + request.to_tag + request.from_tag] || null;
  };

  /**
   * Get the subscription which has not been confirmed to which the request belongs to, if any
   * @private
   * @param {SIP.IncomingRequest}
   * @returns {SIP.Subscription|null}
   */
  UA.prototype.findEarlySubscription = function (request) {
    return this.earlySubscriptions[request.call_id + request.to_tag + request.getHeader('event')] || null;
  };

  function checkAuthenticationFactory(authenticationFactory) {
    if (!(authenticationFactory instanceof Function)) {
      return;
    }
    if (!authenticationFactory.initialize) {
      authenticationFactory.initialize = function initialize() {
        return SIP.Utils.Promise.resolve();
      };
    }
    return authenticationFactory;
  }

  /**
   * Configuration load.
   * @private
   * returns {Boolean}
   */
  UA.prototype.loadConfig = function (configuration) {
    // Settings and default values
    var parameter,
        value,
        checked_value,
        hostportParams,
        registrarServer,
        settings = {
      /* Host address
      * Value to be set in Via sent_by and host part of Contact FQDN
      */
      viaHost: SIP.Utils.createRandomToken(12) + '.invalid',

      uri: new SIP.URI('sip', 'anonymous.' + SIP.Utils.createRandomToken(6), 'anonymous.invalid', null, null),

      //Custom Configuration Settings
      custom: {},

      //Display name
      displayName: '',

      // Password
      password: null,

      // Registration parameters
      registerExpires: 600,
      register: true,
      registrarServer: null,

      // Transport related parameters
      transportConstructor: __webpack_require__(29)(SIP),
      transportOptions: {},

      //string to be inserted into User-Agent request header
      userAgentString: SIP.C.USER_AGENT,

      // Session parameters
      noAnswerTimeout: 60,

      // Hacks
      hackViaTcp: false,
      hackIpInContact: false,
      hackWssInTransport: false,
      hackAllowUnregisteredOptionTags: false,

      // Session Description Handler Options
      sessionDescriptionHandlerFactoryOptions: {
        constraints: {},
        peerConnectionOptions: {}
      },

      contactName: SIP.Utils.createRandomToken(8), // user name in user part
      contactTransport: 'ws',
      forceRport: false,

      //autostarting
      autostart: true,
      autostop: true,

      //Reliable Provisional Responses
      rel100: SIP.C.supported.UNSUPPORTED,

      // DTMF type: 'info' or 'rtp' (RFC 4733)
      // RTP Payload Spec: https://tools.ietf.org/html/rfc4733
      // WebRTC Audio Spec: https://tools.ietf.org/html/rfc7874
      dtmfType: SIP.C.dtmfType.INFO,

      // Replaces header (RFC 3891)
      // http://tools.ietf.org/html/rfc3891
      replaces: SIP.C.supported.UNSUPPORTED,

      sessionDescriptionHandlerFactory: __webpack_require__(30)(SIP).defaultFactory,

      authenticationFactory: checkAuthenticationFactory(function authenticationFactory(ua) {
        return new SIP.DigestAuthentication(ua);
      }),

      allowLegacyNotifications: false,

      allowOutOfDialogRefers: false
    };

    // Pre-Configuration
    function aliasUnderscored(parameter, logger) {
      var underscored = parameter.replace(/([a-z][A-Z])/g, function (m) {
        return m[0] + '_' + m[1].toLowerCase();
      });

      if (parameter === underscored) {
        return;
      }

      var hasParameter = configuration.hasOwnProperty(parameter);
      if (configuration.hasOwnProperty(underscored)) {
        logger.warn(underscored + ' is deprecated, please use ' + parameter);
        if (hasParameter) {
          logger.warn(parameter + ' overriding ' + underscored);
        }
      }

      configuration[parameter] = hasParameter ? configuration[parameter] : configuration[underscored];
    }

    var configCheck = this.getConfigurationCheck();

    // Check Mandatory parameters
    for (parameter in configCheck.mandatory) {
      aliasUnderscored(parameter, this.logger);
      if (!configuration.hasOwnProperty(parameter)) {
        throw new SIP.Exceptions.ConfigurationError(parameter);
      } else {
        value = configuration[parameter];
        checked_value = configCheck.mandatory[parameter](value);
        if (checked_value !== undefined) {
          settings[parameter] = checked_value;
        } else {
          throw new SIP.Exceptions.ConfigurationError(parameter, value);
        }
      }
    }

    // Check Optional parameters
    for (parameter in configCheck.optional) {
      aliasUnderscored(parameter, this.logger);
      if (configuration.hasOwnProperty(parameter)) {
        value = configuration[parameter];

        // If the parameter value is an empty array, but shouldn't be, apply its default value.
        if (value instanceof Array && value.length === 0) {
          continue;
        }

        // If the parameter value is null, empty string, or undefined then apply its default value.
        if (value === null || value === "" || value === undefined) {
          continue;
        }
        // If it's a number with NaN value then also apply its default value.
        // NOTE: JS does not allow "value === NaN", the following does the work:
        else if (typeof value === 'number' && isNaN(value)) {
            continue;
          }

        checked_value = configCheck.optional[parameter](value);
        if (checked_value !== undefined) {
          settings[parameter] = checked_value;
        } else {
          throw new SIP.Exceptions.ConfigurationError(parameter, value);
        }
      }
    }

    // Post Configuration Process

    // Allow passing 0 number as displayName.
    if (settings.displayName === 0) {
      settings.displayName = '0';
    }

    // Instance-id for GRUU
    if (!settings.instanceId) {
      settings.instanceId = SIP.Utils.newUUID();
    }

    // sipjsId instance parameter. Static random tag of length 5
    settings.sipjsId = SIP.Utils.createRandomToken(5);

    // String containing settings.uri without scheme and user.
    hostportParams = settings.uri.clone();
    hostportParams.user = null;
    settings.hostportParams = hostportParams.toRaw().replace(/^sip:/i, '');

    /* Check whether authorizationUser is explicitly defined.
     * Take 'settings.uri.user' value if not.
     */
    if (!settings.authorizationUser) {
      settings.authorizationUser = settings.uri.user;
    }

    /* If no 'registrarServer' is set use the 'uri' value without user portion. */
    if (!settings.registrarServer) {
      registrarServer = settings.uri.clone();
      registrarServer.user = null;
      settings.registrarServer = registrarServer;
    }

    // User noAnswerTimeout
    settings.noAnswerTimeout = settings.noAnswerTimeout * 1000;

    // Via Host
    if (settings.hackIpInContact) {
      if (typeof settings.hackIpInContact === 'boolean') {
        settings.viaHost = SIP.Utils.getRandomTestNetIP();
      } else if (typeof settings.hackIpInContact === 'string') {
        settings.viaHost = settings.hackIpInContact;
      }
    }

    // Contact transport parameter
    if (settings.hackWssInTransport) {
      settings.contactTransport = 'wss';
    }

    this.contact = {
      pub_gruu: null,
      temp_gruu: null,
      uri: new SIP.URI('sip', settings.contactName, settings.viaHost, null, { transport: settings.contactTransport }),
      toString: function toString(options) {
        options = options || {};

        var anonymous = options.anonymous || null,
            outbound = options.outbound || null,
            contact = '<';

        if (anonymous) {
          contact += (this.temp_gruu || 'sip:anonymous@anonymous.invalid;transport=' + settings.contactTransport).toString();
        } else {
          contact += (this.pub_gruu || this.uri).toString();
        }

        if (outbound) {
          contact += ';ob';
        }

        contact += '>';

        return contact;
      }
    };

    var skeleton = {};
    // Fill the value of the configuration_skeleton
    for (parameter in settings) {
      skeleton[parameter] = settings[parameter];
    }

    Object.assign(this.configuration, skeleton);

    this.logger.log('configuration parameters after validation:');
    for (parameter in settings) {
      switch (parameter) {
        case 'uri':
        case 'registrarServer':
        case 'sessionDescriptionHandlerFactory':
          this.logger.log('· ' + parameter + ': ' + settings[parameter]);
          break;
        case 'password':
          this.logger.log('· ' + parameter + ': ' + 'NOT SHOWN');
          break;
        case 'transportConstructor':
          this.logger.log('· ' + parameter + ': ' + settings[parameter].name);
          break;
        default:
          this.logger.log('· ' + parameter + ': ' + JSON.stringify(settings[parameter]));
      }
    }

    return;
  };

  /**
   * Configuration checker.
   * @private
   * @return {Boolean}
   */
  UA.prototype.getConfigurationCheck = function () {
    return {
      mandatory: {},

      optional: {

        uri: function uri(_uri) {
          var parsed;

          if (!/^sip:/i.test(_uri)) {
            _uri = SIP.C.SIP + ':' + _uri;
          }
          parsed = SIP.URI.parse(_uri);

          if (!parsed) {
            return;
          } else if (!parsed.user) {
            return;
          } else {
            return parsed;
          }
        },

        transportConstructor: function transportConstructor(_transportConstructor) {
          if (_transportConstructor instanceof Function) {
            return _transportConstructor;
          }
        },

        transportOptions: function transportOptions(_transportOptions) {
          if ((typeof _transportOptions === 'undefined' ? 'undefined' : _typeof(_transportOptions)) === 'object') {
            return _transportOptions;
          }
        },

        authorizationUser: function authorizationUser(_authorizationUser) {
          if (SIP.Grammar.parse('"' + _authorizationUser + '"', 'quoted_string') === -1) {
            return;
          } else {
            return _authorizationUser;
          }
        },

        displayName: function displayName(_displayName) {
          if (SIP.Grammar.parse('"' + _displayName + '"', 'displayName') === -1) {
            return;
          } else {
            return _displayName;
          }
        },

        dtmfType: function dtmfType(_dtmfType) {
          switch (_dtmfType) {
            case SIP.C.dtmfType.RTP:
              return SIP.C.dtmfType.RTP;
            case SIP.C.dtmfType.INFO:
            // Fall through
            default:
              return SIP.C.dtmfType.INFO;
          }
        },

        hackViaTcp: function hackViaTcp(_hackViaTcp) {
          if (typeof _hackViaTcp === 'boolean') {
            return _hackViaTcp;
          }
        },

        hackIpInContact: function hackIpInContact(_hackIpInContact) {
          if (typeof _hackIpInContact === 'boolean') {
            return _hackIpInContact;
          } else if (typeof _hackIpInContact === 'string' && SIP.Grammar.parse(_hackIpInContact, 'host') !== -1) {
            return _hackIpInContact;
          }
        },

        hackWssInTransport: function hackWssInTransport(_hackWssInTransport) {
          if (typeof _hackWssInTransport === 'boolean') {
            return _hackWssInTransport;
          }
        },

        hackAllowUnregisteredOptionTags: function hackAllowUnregisteredOptionTags(_hackAllowUnregisteredOptionTags) {
          if (typeof _hackAllowUnregisteredOptionTags === 'boolean') {
            return _hackAllowUnregisteredOptionTags;
          }
        },

        contactTransport: function contactTransport(_contactTransport) {
          if (typeof _contactTransport === 'string') {
            return _contactTransport;
          }
        },

        forceRport: function forceRport(_forceRport) {
          if (typeof _forceRport === 'boolean') {
            return _forceRport;
          }
        },

        instanceId: function instanceId(_instanceId) {
          if (typeof _instanceId !== 'string') {
            return;
          }

          if (/^uuid:/i.test(_instanceId)) {
            _instanceId = _instanceId.substr(5);
          }

          if (SIP.Grammar.parse(_instanceId, 'uuid') === -1) {
            return;
          } else {
            return _instanceId;
          }
        },

        noAnswerTimeout: function noAnswerTimeout(_noAnswerTimeout) {
          var value;
          if (SIP.Utils.isDecimal(_noAnswerTimeout)) {
            value = Number(_noAnswerTimeout);
            if (value > 0) {
              return value;
            }
          }
        },

        password: function password(_password) {
          return String(_password);
        },

        rel100: function rel100(_rel) {
          if (_rel === SIP.C.supported.REQUIRED) {
            return SIP.C.supported.REQUIRED;
          } else if (_rel === SIP.C.supported.SUPPORTED) {
            return SIP.C.supported.SUPPORTED;
          } else {
            return SIP.C.supported.UNSUPPORTED;
          }
        },

        replaces: function replaces(_replaces) {
          if (_replaces === SIP.C.supported.REQUIRED) {
            return SIP.C.supported.REQUIRED;
          } else if (_replaces === SIP.C.supported.SUPPORTED) {
            return SIP.C.supported.SUPPORTED;
          } else {
            return SIP.C.supported.UNSUPPORTED;
          }
        },

        register: function register(_register) {
          if (typeof _register === 'boolean') {
            return _register;
          }
        },

        registerExpires: function registerExpires(_registerExpires) {
          var value;
          if (SIP.Utils.isDecimal(_registerExpires)) {
            value = Number(_registerExpires);
            if (value > 0) {
              return value;
            }
          }
        },

        registrarServer: function registrarServer(_registrarServer) {
          var parsed;

          if (typeof _registrarServer !== 'string') {
            return;
          }

          if (!/^sip:/i.test(_registrarServer)) {
            _registrarServer = SIP.C.SIP + ':' + _registrarServer;
          }
          parsed = SIP.URI.parse(_registrarServer);

          if (!parsed) {
            return;
          } else if (parsed.user) {
            return;
          } else {
            return parsed;
          }
        },

        userAgentString: function userAgentString(_userAgentString) {
          if (typeof _userAgentString === 'string') {
            return _userAgentString;
          }
        },

        autostart: function autostart(_autostart) {
          if (typeof _autostart === 'boolean') {
            return _autostart;
          }
        },

        autostop: function autostop(_autostop) {
          if (typeof _autostop === 'boolean') {
            return _autostop;
          }
        },

        sessionDescriptionHandlerFactory: function sessionDescriptionHandlerFactory(_sessionDescriptionHandlerFactory) {
          if (_sessionDescriptionHandlerFactory instanceof Function) {
            return _sessionDescriptionHandlerFactory;
          }
        },

        sessionDescriptionHandlerFactoryOptions: function sessionDescriptionHandlerFactoryOptions(options) {
          if ((typeof options === 'undefined' ? 'undefined' : _typeof(options)) === 'object') {
            return options;
          }
        },

        authenticationFactory: checkAuthenticationFactory,

        allowLegacyNotifications: function allowLegacyNotifications(_allowLegacyNotifications) {
          if (typeof _allowLegacyNotifications === 'boolean') {
            return _allowLegacyNotifications;
          }
        },

        custom: function custom(_custom) {
          if ((typeof _custom === 'undefined' ? 'undefined' : _typeof(_custom)) === 'object') {
            return _custom;
          }
        },

        contactName: function contactName(_contactName) {
          if (typeof _contactName === 'string') {
            return _contactName;
          }
        }
      }
    };
  };

  UA.C = C;
  SIP.UA = UA;
};
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(28)))

/***/ }),
/* 28 */
/***/ (function(module, exports) {

var g;

// This works in non-strict mode
g = (function() {
	return this;
})();

try {
	// This works if eval is allowed (see CSP)
	g = g || Function("return this")() || (1, eval)("this");
} catch (e) {
	// This works if the window reference is available
	if (typeof window === "object") g = window;
}

// g can still be undefined, but nothing to do about it...
// We return undefined, instead of nothing here, so it's
// easier to handle this case. if(!global) { ...}

module.exports = g;


/***/ }),
/* 29 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(global) {
/**
 * @fileoverview Transport
 */

/**
 * @augments SIP
 * @class Transport
 * @param {Object} options
 */

module.exports = function (SIP) {
  var Transport,
      C = {
    // Transport status codes
    STATUS_CONNECTING: 0,
    STATUS_OPEN: 1,
    STATUS_CLOSING: 2,
    STATUS_CLOSED: 3
  };

  var WebSocket = (global.window || global).WebSocket;

  /**
   * Compute an amount of time in seconds to wait before sending another
   * keep-alive.
   * @returns {Number}
   */
  function computeKeepAliveTimeout(upperBound) {
    var lowerBound = upperBound * 0.8;
    return 1000 * (Math.random() * (upperBound - lowerBound) + lowerBound);
  }

  Transport = function Transport(logger, options) {
    options = SIP.Utils.defaultOptions({}, options);
    this.logger = logger;

    this.ws = null;
    this.server = null;

    this.connectionPromise = null;
    this.connectDeferredResolve = null;
    this.connectionTimeout = null;

    this.disconnectionPromise = null;
    this.disconnectDeferredResolve = null;

    this.boundOnOpen = null;
    this.boundOnMessage = null;
    this.boundOnClose = null;

    this.reconnectionAttempts = 0;
    this.reconnectTimer = null;

    // Keep alive
    this.keepAliveInterval = null;
    this.keepAliveDebounceTimeout = null;

    this.status = C.STATUS_CONNECTING;

    this.configuration = {};

    this.loadConfig(options);
  };

  Transport.prototype = Object.create(SIP.Transport.prototype, {

    /**
    *
    * @returns {Boolean}
    */
    isConnected: { writable: true, value: function isConnected() {
        return this.status === C.STATUS_OPEN;
      } },

    /**
     * Send a message.
     * @param {SIP.OutgoingRequest|String} msg
     * @param {Object} [options]
     * @returns {Promise}
     */
    sendPromise: { writable: true, value: function sendPromise(msg, options) {
        options = options || {};
        if (!this.statusAssert(C.STATUS_OPEN, options.force)) {
          this.onError('unable to send message - WebSocket not open');
          return SIP.Utils.Promise.reject();
        }

        var message = msg.toString();

        if (this.ws) {
          if (this.configuration.traceSip === true) {
            this.logger.log('sending WebSocket message:\n\n' + message + '\n');
          }
          this.ws.send(message);
          return SIP.Utils.Promise.resolve({ msg: message });
        } else {
          this.onError('unable to send message - WebSocket does not exist');
          return SIP.Utils.Promise.reject();
        }
      } },

    /**
    * Disconnect socket.
    */
    disconnectPromise: { writable: true, value: function disconnectPromise(options) {
        if (this.disconnectionPromise) {
          return this.disconnectionPromise;
        }
        options = options || {};
        if (!this.statusTransition(C.STATUS_CLOSING, options.force)) {
          return SIP.Utils.Promise.reject('Failed status transition - attempted to disconnect a socket that was not open');
        }
        this.disconnectionPromise = new SIP.Utils.Promise(function (resolve, reject) {
          this.disconnectDeferredResolve = resolve;

          if (this.reconnectTimer) {
            SIP.Timers.clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
          }

          if (this.ws) {
            this.stopSendingKeepAlives();

            this.logger.log('closing WebSocket ' + this.server.ws_uri);
            this.ws.close(options.code, options.reason);
          } else {
            reject('Attempted to disconnect but the websocket doesn\'t exist');
          }
        }.bind(this));

        return this.disconnectionPromise;
      } },

    /**
    * Connect socket.
    */
    connectPromise: { writable: true, value: function connectPromise(options) {
        if (this.connectionPromise) {
          return this.connectionPromise;
        }
        options = options || {};
        this.server = this.server || this.getNextWsServer(options.force);

        this.connectionPromise = new SIP.Utils.Promise(function (resolve, reject) {

          if ((this.status === C.STATUS_OPEN || this.status === C.STATUS_CLOSING) && !options.force) {
            this.logger.warn('WebSocket ' + this.server.ws_uri + ' is already connected');
            reject('Failed status check - attempted to open a connection but already open/closing');
            return;
          }

          this.connectDeferredResolve = resolve;

          this.status = C.STATUS_CONNECTING;
          this.logger.log('connecting to WebSocket ' + this.server.ws_uri);
          this.disposeWs();
          try {
            this.ws = new WebSocket(this.server.ws_uri, 'sip');
          } catch (e) {
            this.ws = null;
            this.status = C.STATUS_CLOSED; // force status to closed in error case
            this.onError('error connecting to WebSocket ' + this.server.ws_uri + ':' + e);
            reject('Failed to create a websocket');
            return;
          }

          if (!this.ws) {
            reject('Unexpected instance websocket not set');
            return;
          }

          this.connectionTimeout = SIP.Timers.setTimeout(function () {
            this.onError('took too long to connect - exceeded time set in configuration.connectionTimeout: ' + this.configuration.connectionTimeout + 's');
          }.bind(this), this.configuration.connectionTimeout * 1000);

          this.boundOnOpen = this.onOpen.bind(this);
          this.boundOnMessage = this.onMessage.bind(this);
          this.boundOnClose = this.onClose.bind(this);
          this.ws.addEventListener('open', this.boundOnOpen);
          this.ws.addEventListener('message', this.boundOnMessage);
          this.ws.addEventListener('close', this.boundOnClose);
        }.bind(this));

        return this.connectionPromise;
      } },

    // Transport Event Handlers

    /**
    * @event
    * @param {event} e
    */
    onOpen: { writable: true, value: function onOpen() {
        this.status = C.STATUS_OPEN; // quietly force status to open
        this.emit('connected');
        SIP.Timers.clearTimeout(this.connectionTimeout);

        this.logger.log('WebSocket ' + this.server.ws_uri + ' connected');

        // Clear reconnectTimer since we are not disconnected
        if (this.reconnectTimer !== null) {
          SIP.Timers.clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
        // Reset reconnectionAttempts
        this.reconnectionAttempts = 0;

        // Reset disconnection promise so we can disconnect from a fresh state
        this.disconnectionPromise = null;
        this.disconnectDeferredResolve = null;

        // Start sending keep-alives
        this.startSendingKeepAlives();

        if (this.connectDeferredResolve) {
          this.connectDeferredResolve({ overrideEvent: true });
        } else {
          this.logger.warn('Unexpected websocket.onOpen with no connectDeferredResolve');
        }
      } },

    /**
    * @event
    * @param {event} e
    */
    onClose: { writable: true, value: function onClose(e) {
        this.logger.log('WebSocket disconnected (code: ' + e.code + (e.reason ? '| reason: ' + e.reason : '') + ')');
        this.emit('disconnected', { code: e.code, reason: e.reason });

        if (this.status !== C.STATUS_CLOSING) {
          this.logger.warn('WebSocket abrupt disconnection');
          this.emit('transportError');
        }

        this.stopSendingKeepAlives();

        // Clean up connection variables so we can connect again from a fresh state
        SIP.Timers.clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
        this.connectionPromise = null;
        this.connectDeferredResolve = null;

        // Check whether the user requested to close.
        if (this.disconnectDeferredResolve) {
          this.disconnectDeferredResolve({ overrideEvent: true });
          this.statusTransition(C.STATUS_CLOSED);
          this.disconnectDeferredResolve = null;
          return;
        }
        this.status = C.STATUS_CLOSED; // quietly force status to closed
        this.reconnect();
      } },

    /**
    * Removes event listeners and clears the instance ws
    * @private
    * @param {event} e
    */
    disposeWs: { writable: true, value: function disposeWs() {
        if (this.ws) {
          this.ws.removeEventListener('open', this.boundOnOpen);
          this.ws.removeEventListener('message', this.boundOnMessage);
          this.ws.removeEventListener('close', this.boundOnClose);
          this.boundOnOpen = null;
          this.boundOnMessage = null;
          this.boundOnClose = null;
          this.ws = null;
        }
      } },

    /**
    * @event
    * @param {event} e
    */
    onMessage: { writable: true, value: function onMessage(e) {
        var data = e.data;
        // CRLF Keep Alive response from server. Clear our keep alive timeout.
        if (data === '\r\n') {
          this.clearKeepAliveTimeout();

          if (this.configuration.traceSip === true) {
            this.logger.log('received WebSocket message with CRLF Keep Alive response');
          }
          return;
        } else if (!data) {
          this.logger.warn('received empty message, message discarded');
          return;
        }

        // WebSocket binary message.
        else if (typeof data !== 'string') {
            try {
              data = String.fromCharCode.apply(null, new Uint8Array(data));
            } catch (err) {
              this.logger.warn('received WebSocket binary message failed to be converted into string, message discarded');
              return;
            }

            if (this.configuration.traceSip === true) {
              this.logger.log('received WebSocket binary message:\n\n' + data + '\n');
            }
          }

          // WebSocket text message.
          else {
              if (this.configuration.traceSip === true) {
                this.logger.log('received WebSocket text message:\n\n' + data + '\n');
              }
            }

        this.emit('message', data);
      } },

    /**
    * @event
    * @param {event} e
    */
    onError: { writable: true, value: function onError(e) {
        this.logger.warn('Transport error: ' + e);
        this.emit('transportError');
      } },

    /**
    * Reconnection attempt logic.
    * @private
    */
    reconnect: { writable: true, value: function reconnect() {
        if (this.reconnectionAttempts > 0) {
          this.logger.log('Reconnection attempt ' + this.reconnectionAttempts + ' failed');
        }

        if (this.noAvailableServers()) {
          this.logger.warn('no available ws servers left - going to closed state');
          this.status = C.STATUS_CLOSED;
          this.resetServerErrorStatus();
          return;
        }

        if (this.isConnected()) {
          this.logger.warn('attempted to reconnect while connected - forcing disconnect');
          this.disconnect({ force: true });
        }

        this.reconnectionAttempts += 1;

        if (this.reconnectionAttempts > this.configuration.maxReconnectionAttempts) {
          this.logger.warn('maximum reconnection attempts for WebSocket ' + this.server.ws_uri);
          this.logger.log('transport ' + this.server.ws_uri + ' failed | connection state set to \'error\'');
          this.server.isError = true;
          this.emit('transportError');
          this.server = this.getNextWsServer();
          this.reconnectionAttempts = 0;
          this.reconnect();
        } else {
          this.logger.log('trying to reconnect to WebSocket ' + this.server.ws_uri + ' (reconnection attempt ' + this.reconnectionAttempts + ')');
          this.reconnectTimer = SIP.Timers.setTimeout(function () {
            this.connect();
            this.reconnectTimer = null;
          }.bind(this), this.reconnectionAttempts === 1 ? 0 : this.configuration.reconnectionTimeout * 1000);
        }
      } },

    /**
    * Resets the error state of all servers in the configuration
    */
    resetServerErrorStatus: { writable: true, value: function resetServerErrorStatus() {
        var idx,
            length = this.configuration.wsServers.length;
        for (idx = 0; idx < length; idx++) {
          this.configuration.wsServers[idx].isError = false;
        }
      } },

    /**
    * Retrieve the next server to which connect.
    * @private
    * @param {Boolean} force allows bypass of server error status checking
    * @returns {Object} wsServer
    */
    getNextWsServer: { writable: true, value: function getNextWsServer(force) {
        if (this.noAvailableServers()) {
          this.logger.warn('attempted to get next ws server but there are no available ws servers left');
          return;
        }
        // Order servers by weight
        var idx,
            length,
            wsServer,
            candidates = [];

        length = this.configuration.wsServers.length;
        for (idx = 0; idx < length; idx++) {
          wsServer = this.configuration.wsServers[idx];

          if (wsServer.isError && !force) {
            continue;
          } else if (candidates.length === 0) {
            candidates.push(wsServer);
          } else if (wsServer.weight > candidates[0].weight) {
            candidates = [wsServer];
          } else if (wsServer.weight === candidates[0].weight) {
            candidates.push(wsServer);
          }
        }

        idx = Math.floor(Math.random() * candidates.length);

        return candidates[idx];
      } },

    /**
    * Checks all configuration servers, returns true if all of them have isError: true and false otherwise
    * @private
    * @returns {Boolean}
    */
    noAvailableServers: { writable: true, value: function noAvailableServers() {
        var server;
        for (server in this.configuration.wsServers) {
          if (!this.configuration.wsServers[server].isError) {
            return false;
          }
        }
        return true;
      } },

    //==============================
    // KeepAlive Stuff
    //==============================

    /**
     * Send a keep-alive (a double-CRLF sequence).
     * @private
     * @returns {Boolean}
     */
    sendKeepAlive: { writable: true, value: function sendKeepAlive() {
        if (this.keepAliveDebounceTimeout) {
          // We already have an outstanding keep alive, do not send another.
          return;
        }

        this.keepAliveDebounceTimeout = SIP.Timers.setTimeout(function () {
          this.emit('keepAliveDebounceTimeout');
          this.clearKeepAliveTimeout();
        }.bind(this), this.configuration.keepAliveDebounce * 1000);

        return this.send('\r\n\r\n');
      } },

    clearKeepAliveTimeout: { writable: true, value: function clearKeepAliveTimeout() {
        SIP.Timers.clearTimeout(this.keepAliveDebounceTimeout);
        this.keepAliveDebounceTimeout = null;
      } },

    /**
     * Start sending keep-alives.
     * @private
     */
    startSendingKeepAlives: { writable: true, value: function startSendingKeepAlives() {
        if (this.configuration.keepAliveInterval && !this.keepAliveInterval) {
          this.keepAliveInterval = SIP.Timers.setInterval(function () {
            this.sendKeepAlive();
            this.startSendingKeepAlives();
          }.bind(this), computeKeepAliveTimeout(this.configuration.keepAliveInterval));
        }
      } },

    /**
     * Stop sending keep-alives.
     * @private
     */
    stopSendingKeepAlives: { writable: true, value: function stopSendingKeepAlives() {
        SIP.Timers.clearInterval(this.keepAliveInterval);
        SIP.Timers.clearTimeout(this.keepAliveDebounceTimeout);
        this.keepAliveInterval = null;
        this.keepAliveDebounceTimeout = null;
      } },

    //==============================
    // Status Stuff
    //==============================

    /**
    * Checks given status against instance current status. Returns true if they match
    * @private
    * @param {Number} status
    * @param {Boolean} [force]
    * @returns {Boolean}
    */
    statusAssert: { writable: true, value: function statusAssert(status, force) {
        if (status === this.status) {
          return true;
        } else {
          if (force) {
            this.logger.warn('Attempted to assert ' + Object.keys(C)[this.status] + ' as ' + Object.keys(C)[status] + '- continuing with option: \'force\'');
            return true;
          } else {
            this.logger.warn('Tried to assert ' + Object.keys(C)[status] + ' but is currently ' + Object.keys(C)[this.status]);
            return false;
          }
        }
      } },

    /**
    * Transitions the status. Checks for legal transition via assertion beforehand
    * @private
    * @param {Number} status
    * @param {Boolean} [force]
    * @returns {Boolean}
    */
    statusTransition: { writable: true, value: function statusTransition(status, force) {
        this.logger.log('Attempting to transition status from ' + Object.keys(C)[this.status] + ' to ' + Object.keys(C)[status]);
        if (status === C.STATUS_OPEN && this.statusAssert(C.STATUS_CONNECTING, force) || status === C.STATUS_CLOSING && this.statusAssert(C.STATUS_OPEN, force) || status === C.STATUS_CLOSED && this.statusAssert(C.STATUS_CLOSING, force)) {
          this.status = status;
          return true;
        } else {
          this.logger.warn('Status transition failed - result: no-op - reason: either gave an nonexistent status or attempted illegal transition');
          return false;
        }
      } },

    //==============================
    // Configuration Handling
    //==============================

    /**
     * Configuration load.
     * @private
     * returns {Boolean}
     */
    loadConfig: { writable: true, value: function loadConfig(configuration) {
        var parameter,
            value,
            checked_value,
            settings = {
          wsServers: [{
            scheme: 'WSS',
            sip_uri: '<sip:edge.sip.onsip.com;transport=ws;lr>',
            weight: 0,
            ws_uri: 'wss://edge.sip.onsip.com',
            isError: false
          }],

          connectionTimeout: 5,

          maxReconnectionAttempts: 3,
          reconnectionTimeout: 4,

          keepAliveInterval: 0,
          keepAliveDebounce: 10,

          // Logging
          traceSip: false
        };

        // Pre-Configuration
        function aliasUnderscored(parameter, logger) {
          var underscored = parameter.replace(/([a-z][A-Z])/g, function (m) {
            return m[0] + '_' + m[1].toLowerCase();
          });

          if (parameter === underscored) {
            return;
          }

          var hasParameter = configuration.hasOwnProperty(parameter);
          if (configuration.hasOwnProperty(underscored)) {
            logger.warn(underscored + ' is deprecated, please use ' + parameter);
            if (hasParameter) {
              logger.warn(parameter + ' overriding ' + underscored);
            }
          }

          configuration[parameter] = hasParameter ? configuration[parameter] : configuration[underscored];
        }

        var configCheck = this.getConfigurationCheck();

        // Check Mandatory parameters
        for (parameter in configCheck.mandatory) {
          aliasUnderscored(parameter, this.logger);
          if (!configuration.hasOwnProperty(parameter)) {
            throw new SIP.Exceptions.ConfigurationError(parameter);
          } else {
            value = configuration[parameter];
            checked_value = configCheck.mandatory[parameter](value);
            if (checked_value !== undefined) {
              settings[parameter] = checked_value;
            } else {
              throw new SIP.Exceptions.ConfigurationError(parameter, value);
            }
          }
        }

        // Check Optional parameters
        for (parameter in configCheck.optional) {
          aliasUnderscored(parameter, this.logger);
          if (configuration.hasOwnProperty(parameter)) {
            value = configuration[parameter];

            // If the parameter value is an empty array, but shouldn't be, apply its default value.
            if (value instanceof Array && value.length === 0) {
              continue;
            }

            // If the parameter value is null, empty string, or undefined then apply its default value.
            if (value === null || value === '' || value === undefined) {
              continue;
            }
            // If it's a number with NaN value then also apply its default value.
            // NOTE: JS does not allow "value === NaN", the following does the work:
            else if (typeof value === 'number' && isNaN(value)) {
                continue;
              }

            checked_value = configCheck.optional[parameter](value);
            if (checked_value !== undefined) {
              settings[parameter] = checked_value;
            } else {
              throw new SIP.Exceptions.ConfigurationError(parameter, value);
            }
          }
        }

        var skeleton = {};
        // Fill the value of the configuration_skeleton
        for (parameter in settings) {
          skeleton[parameter] = {
            value: settings[parameter]
          };
        }

        Object.defineProperties(this.configuration, skeleton);

        this.logger.log('configuration parameters after validation:');
        for (parameter in settings) {
          this.logger.log('· ' + parameter + ': ' + JSON.stringify(settings[parameter]));
        }

        return;
      } },

    /**
     * Configuration checker.
     * @private
     * @return {Boolean}
     */
    getConfigurationCheck: { writable: true, value: function getConfigurationCheck() {
        return {
          mandatory: {},

          optional: {

            //Note: this function used to call 'this.logger.error' but calling 'this' with anything here is invalid
            wsServers: function wsServers(_wsServers) {
              var idx, length, url;

              /* Allow defining wsServers parameter as:
               *  String: "host"
               *  Array of Strings: ["host1", "host2"]
               *  Array of Objects: [{ws_uri:"host1", weight:1}, {ws_uri:"host2", weight:0}]
               *  Array of Objects and Strings: [{ws_uri:"host1"}, "host2"]
               */
              if (typeof _wsServers === 'string') {
                _wsServers = [{ ws_uri: _wsServers }];
              } else if (_wsServers instanceof Array) {
                length = _wsServers.length;
                for (idx = 0; idx < length; idx++) {
                  if (typeof _wsServers[idx] === 'string') {
                    _wsServers[idx] = { ws_uri: _wsServers[idx] };
                  }
                }
              } else {
                return;
              }

              if (_wsServers.length === 0) {
                return false;
              }

              length = _wsServers.length;
              for (idx = 0; idx < length; idx++) {
                if (!_wsServers[idx].ws_uri) {
                  return;
                }
                if (_wsServers[idx].weight && !Number(_wsServers[idx].weight)) {
                  return;
                }

                url = SIP.Grammar.parse(_wsServers[idx].ws_uri, 'absoluteURI');

                if (url === -1) {
                  return;
                } else if (['wss', 'ws', 'udp'].indexOf(url.scheme) < 0) {
                  return;
                } else {
                  _wsServers[idx].sip_uri = '<sip:' + url.host + (url.port ? ':' + url.port : '') + ';transport=' + url.scheme.replace(/^wss$/i, 'ws') + ';lr>';

                  if (!_wsServers[idx].weight) {
                    _wsServers[idx].weight = 0;
                  }

                  _wsServers[idx].isError = false;
                  _wsServers[idx].scheme = url.scheme.toUpperCase();
                }
              }
              return _wsServers;
            },

            keepAliveInterval: function keepAliveInterval(_keepAliveInterval) {
              var value;
              if (SIP.Utils.isDecimal(_keepAliveInterval)) {
                value = Number(_keepAliveInterval);
                if (value > 0) {
                  return value;
                }
              }
            },

            keepAliveDebounce: function keepAliveDebounce(_keepAliveDebounce) {
              var value;
              if (SIP.Utils.isDecimal(_keepAliveDebounce)) {
                value = Number(_keepAliveDebounce);
                if (value > 0) {
                  return value;
                }
              }
            },

            traceSip: function traceSip(_traceSip) {
              if (typeof _traceSip === 'boolean') {
                return _traceSip;
              }
            },

            connectionTimeout: function connectionTimeout(_connectionTimeout) {
              var value;
              if (SIP.Utils.isDecimal(_connectionTimeout)) {
                value = Number(_connectionTimeout);
                if (value > 0) {
                  return value;
                }
              }
            },

            maxReconnectionAttempts: function maxReconnectionAttempts(_maxReconnectionAttempts) {
              var value;
              if (SIP.Utils.isDecimal(_maxReconnectionAttempts)) {
                value = Number(_maxReconnectionAttempts);
                if (value >= 0) {
                  return value;
                }
              }
            },

            reconnectionTimeout: function reconnectionTimeout(_reconnectionTimeout) {
              var value;
              if (SIP.Utils.isDecimal(_reconnectionTimeout)) {
                value = Number(_reconnectionTimeout);
                if (value > 0) {
                  return value;
                }
              }
            }

          }
        };
      } }
  });

  Transport.C = C;
  SIP.Web.Transport = Transport;
  return Transport;
};
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(28)))

/***/ }),
/* 30 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(global) {
/**
 * @fileoverview SessionDescriptionHandler
 */

/* SessionDescriptionHandler
 * @class PeerConnection helper Class.
 * @param {SIP.Session} session
 * @param {Object} [options]
 */

module.exports = function (SIP) {

  // Constructor
  var SessionDescriptionHandler = function SessionDescriptionHandler(logger, observer, options) {
    // TODO: Validate the options
    this.options = options || {};

    this.logger = logger;
    this.observer = observer;
    this.dtmfSender = null;

    this.shouldAcquireMedia = true;

    this.CONTENT_TYPE = 'application/sdp';

    this.C = {};
    this.C.DIRECTION = {
      NULL: null,
      SENDRECV: "sendrecv",
      SENDONLY: "sendonly",
      RECVONLY: "recvonly",
      INACTIVE: "inactive"
    };

    this.logger.log('SessionDescriptionHandlerOptions: ' + JSON.stringify(this.options));

    this.direction = this.C.DIRECTION.NULL;

    this.modifiers = this.options.modifiers || [];
    if (!Array.isArray(this.modifiers)) {
      this.modifiers = [this.modifiers];
    }

    var environment = global.window || global;
    this.WebRTC = {
      MediaStream: environment.MediaStream,
      getUserMedia: environment.navigator.mediaDevices.getUserMedia.bind(environment.navigator.mediaDevices),
      RTCPeerConnection: environment.RTCPeerConnection
    };

    this.iceGatheringDeferred = null;
    this.iceGatheringTimeout = false;
    this.iceGatheringTimer = null;

    this.initPeerConnection(this.options.peerConnectionOptions);

    this.constraints = this.checkAndDefaultConstraints(this.options.constraints);
  };

  /**
   * @param {SIP.Session} session
   * @param {Object} [options]
   */

  SessionDescriptionHandler.defaultFactory = function defaultFactory(session, options) {
    var logger = session.ua.getLogger('sip.invitecontext.sessionDescriptionHandler', session.id);
    var SessionDescriptionHandlerObserver = __webpack_require__(31);
    var observer = new SessionDescriptionHandlerObserver(session, options);
    return new SessionDescriptionHandler(logger, observer, options);
  };

  SessionDescriptionHandler.prototype = Object.create(SIP.SessionDescriptionHandler.prototype, {
    // Functions the sesssion can use

    /**
     * Destructor
     */
    close: { writable: true, value: function value() {
        this.logger.log('closing PeerConnection');
        // have to check signalingState since this.close() gets called multiple times
        if (this.peerConnection && this.peerConnection.signalingState !== 'closed') {
          if (this.peerConnection.getSenders) {
            this.peerConnection.getSenders().forEach(function (sender) {
              if (sender.track) {
                sender.track.stop();
              }
            });
          } else {
            this.logger.warn('Using getLocalStreams which is deprecated');
            this.peerConnection.getLocalStreams().forEach(function (stream) {
              stream.getTracks().forEach(function (track) {
                track.stop();
              });
            });
          }
          if (this.peerConnection.getReceivers) {
            this.peerConnection.getReceivers().forEach(function (receiver) {
              if (receiver.track) {
                receiver.track.stop();
              }
            });
          } else {
            this.logger.warn('Using getRemoteStreams which is deprecated');
            this.peerConnection.getRemoteStreams().forEach(function (stream) {
              stream.getTracks().forEach(function (track) {
                track.stop();
              });
            });
          }
          this.resetIceGatheringComplete();
          this.peerConnection.close();
        }
      } },

    /**
     * Gets the local description from the underlying media implementation
     * @param {Object} [options] Options object to be used by getDescription
     * @param {MediaStreamConstraints} [options.constraints] MediaStreamConstraints https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamConstraints
     * @param {Object} [options.peerConnectionOptions] If this is set it will recreate the peer connection with the new options
     * @param {Array} [modifiers] Array with one time use description modifiers
     * @returns {Promise} Promise that resolves with the local description to be used for the session
     */
    getDescription: { writable: true, value: function value(options, modifiers) {
        options = options || {};
        if (options.peerConnectionOptions) {
          this.initPeerConnection(options.peerConnectionOptions);
        }

        // Merge passed constraints with saved constraints and save
        var newConstraints = Object.assign({}, this.constraints, options.constraints);
        newConstraints = this.checkAndDefaultConstraints(newConstraints);
        if (JSON.stringify(newConstraints) !== JSON.stringify(this.constraints)) {
          this.constraints = newConstraints;
          this.shouldAcquireMedia = true;
        }

        modifiers = modifiers || [];
        if (!Array.isArray(modifiers)) {
          modifiers = [modifiers];
        }
        modifiers = modifiers.concat(this.modifiers);

        return SIP.Utils.Promise.resolve().then(function () {
          if (this.shouldAcquireMedia) {
            return this.acquire(this.constraints).then(function () {
              this.shouldAcquireMedia = false;
            }.bind(this));
          }
        }.bind(this)).then(function () {
          return this.createOfferOrAnswer(options.RTCOfferOptions, modifiers);
        }.bind(this)).then(function (description) {
          this.emit('getDescription', description);
          return {
            body: description.sdp,
            contentType: this.CONTENT_TYPE
          };
        }.bind(this));
      } },

    /**
     * Check if the Session Description Handler can handle the Content-Type described by a SIP Message
     * @param {String} contentType The content type that is in the SIP Message
     * @returns {boolean}
     */
    hasDescription: { writable: true, value: function hasDescription(contentType) {
        return contentType === this.CONTENT_TYPE;
      } },

    /**
     * The modifier that should be used when the session would like to place the call on hold
     * @param {String} [sdp] The description that will be modified
     * @returns {Promise} Promise that resolves with modified SDP
     */
    holdModifier: { writable: true, value: function holdModifier(description) {
        if (!/a=(sendrecv|sendonly|recvonly|inactive)/.test(description.sdp)) {
          description.sdp = description.sdp.replace(/(m=[^\r]*\r\n)/g, '$1a=sendonly\r\n');
        } else {
          description.sdp = description.sdp.replace(/a=sendrecv\r\n/g, 'a=sendonly\r\n');
          description.sdp = description.sdp.replace(/a=recvonly\r\n/g, 'a=inactive\r\n');
        }
        return SIP.Utils.Promise.resolve(description);
      } },

    /**
     * Set the remote description to the underlying media implementation
     * @param {String} sessionDescription The description provided by a SIP message to be set on the media implementation
     * @param {Object} [options] Options object to be used by getDescription
     * @param {MediaStreamConstraints} [options.constraints] MediaStreamConstraints https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamConstraints
     * @param {Object} [options.peerConnectionOptions] If this is set it will recreate the peer connection with the new options
     * @param {Array} [modifiers] Array with one time use description modifiers
     * @returns {Promise} Promise that resolves once the description is set
     */
    setDescription: { writable: true, value: function setDescription(sessionDescription, options, modifiers) {
        var self = this;

        options = options || {};
        if (options.peerConnectionOptions) {
          this.initPeerConnection(options.peerConnectionOptions);
        }

        modifiers = modifiers || [];
        if (!Array.isArray(modifiers)) {
          modifiers = [modifiers];
        }
        modifiers = modifiers.concat(this.modifiers);

        var description = {
          type: this.hasOffer('local') ? 'answer' : 'offer',
          sdp: sessionDescription
        };

        return SIP.Utils.Promise.resolve().then(function () {
          // Media should be acquired in getDescription unless we need to do it sooner for some reason (FF61+)
          if (this.shouldAcquireMedia && this.options.alwaysAcquireMediaFirst) {
            return this.acquire(this.constraints).then(function () {
              this.shouldAcquireMedia = false;
            }.bind(this));
          }
        }.bind(this)).then(function () {
          return SIP.Utils.reducePromises(modifiers, description);
        }).catch(function modifierError(e) {
          self.logger.error("The modifiers did not resolve successfully");
          self.logger.error(e);
          throw e;
        }).then(function (modifiedDescription) {
          self.emit('setDescription', modifiedDescription);
          return self.peerConnection.setRemoteDescription(modifiedDescription);
        }).catch(function setRemoteDescriptionError(e) {
          self.logger.error(e);
          self.emit('peerConnection-setRemoteDescriptionFailed', e);
          throw e;
        }).then(function setRemoteDescriptionSuccess() {
          if (self.peerConnection.getReceivers) {
            self.emit('setRemoteDescription', self.peerConnection.getReceivers());
          } else {
            self.emit('setRemoteDescription', self.peerConnection.getRemoteStreams());
          }
          self.emit('confirmed', self);
        });
      } },

    /**
     * Send DTMF via RTP (RFC 4733)
     * @param {String} tones A string containing DTMF digits
     * @param {Object} [options] Options object to be used by sendDtmf
     * @returns {boolean} true if DTMF send is successful, false otherwise
     */
    sendDtmf: { writable: true, value: function sendDtmf(tones, options) {
        if (!this.dtmfSender && this.hasBrowserGetSenderSupport()) {
          var senders = this.peerConnection.getSenders();
          if (senders.length > 0) {
            this.dtmfSender = senders[0].dtmf;
          }
        }
        if (!this.dtmfSender && this.hasBrowserTrackSupport()) {
          var streams = this.peerConnection.getLocalStreams();
          if (streams.length > 0) {
            var audioTracks = streams[0].getAudioTracks();
            if (audioTracks.length > 0) {
              this.dtmfSender = this.peerConnection.createDTMFSender(audioTracks[0]);
            }
          }
        }
        if (!this.dtmfSender) {
          return false;
        }
        try {
          this.dtmfSender.insertDTMF(tones, options.duration, options.interToneGap);
        } catch (e) {
          if (e.type === "InvalidStateError" || e.type === "InvalidCharacterError") {
            this.logger.error(e);
            return false;
          } else {
            throw e;
          }
        }
        this.logger.log('DTMF sent via RTP: ' + tones.toString());
        return true;
      } },

    getDirection: { writable: true, value: function getDirection() {
        return this.direction;
      } },

    // Internal functions
    createOfferOrAnswer: { writable: true, value: function createOfferOrAnswer(RTCOfferOptions, modifiers) {
        var self = this;
        var methodName;
        var pc = this.peerConnection;

        RTCOfferOptions = RTCOfferOptions || {};

        methodName = self.hasOffer('remote') ? 'createAnswer' : 'createOffer';

        return pc[methodName](RTCOfferOptions).catch(function methodError(e) {
          self.emit('peerConnection-' + methodName + 'Failed', e);
          throw e;
        }).then(function (sdp) {
          return SIP.Utils.reducePromises(modifiers, self.createRTCSessionDescriptionInit(sdp));
        }).then(function (sdp) {
          self.resetIceGatheringComplete();
          return pc.setLocalDescription(sdp);
        }).catch(function localDescError(e) {
          self.emit('peerConnection-SetLocalDescriptionFailed', e);
          throw e;
        }).then(function onSetLocalDescriptionSuccess() {
          return self.waitForIceGatheringComplete();
        }).then(function readySuccess() {
          var localDescription = self.createRTCSessionDescriptionInit(self.peerConnection.localDescription);
          return SIP.Utils.reducePromises(modifiers, localDescription);
        }).then(function (localDescription) {
          self.setDirection(localDescription.sdp);
          return localDescription;
        }).catch(function createOfferOrAnswerError(e) {
          self.logger.error(e);
          // TODO: Not sure if this is correct
          throw new SIP.Exceptions.GetDescriptionError(e);
        });
      } },

    // Creates an RTCSessionDescriptionInit from an RTCSessionDescription
    createRTCSessionDescriptionInit: { writable: true, value: function createRTCSessionDescriptionInit(RTCSessionDescription) {
        return {
          type: RTCSessionDescription.type,
          sdp: RTCSessionDescription.sdp
        };
      } },

    addDefaultIceCheckingTimeout: { writable: true, value: function addDefaultIceCheckingTimeout(peerConnectionOptions) {
        if (peerConnectionOptions.iceCheckingTimeout === undefined) {
          peerConnectionOptions.iceCheckingTimeout = 5000;
        }
        return peerConnectionOptions;
      } },

    addDefaultIceServers: { writable: true, value: function addDefaultIceServers(rtcConfiguration) {
        if (!rtcConfiguration.iceServers) {
          rtcConfiguration.iceServers = [{ urls: 'stun:stun.l.google.com:19302' }];
        }
        return rtcConfiguration;
      } },

    checkAndDefaultConstraints: { writable: true, value: function checkAndDefaultConstraints(constraints) {
        var defaultConstraints = { audio: true, video: !this.options.alwaysAcquireMediaFirst };

        constraints = constraints || defaultConstraints;
        // Empty object check
        if (Object.keys(constraints).length === 0 && constraints.constructor === Object) {
          return defaultConstraints;
        }
        return constraints;
      } },

    hasBrowserTrackSupport: { writable: true, value: function hasBrowserTrackSupport() {
        return Boolean(this.peerConnection.addTrack);
      } },

    hasBrowserGetSenderSupport: { writable: true, value: function hasBrowserGetSenderSupport() {
        return Boolean(this.peerConnection.getSenders);
      } },

    initPeerConnection: { writable: true, value: function initPeerConnection(options) {
        var self = this;
        options = options || {};
        options = this.addDefaultIceCheckingTimeout(options);
        options.rtcConfiguration = options.rtcConfiguration || {};
        options.rtcConfiguration = this.addDefaultIceServers(options.rtcConfiguration);

        this.logger.log('initPeerConnection');

        if (this.peerConnection) {
          this.logger.log('Already have a peer connection for this session. Tearing down.');
          this.resetIceGatheringComplete();
          this.peerConnection.close();
        }

        this.peerConnection = new this.WebRTC.RTCPeerConnection(options.rtcConfiguration);

        this.logger.log('New peer connection created');

        if ('ontrack' in this.peerConnection) {
          this.peerConnection.addEventListener('track', function (e) {
            self.logger.log('track added');
            self.observer.trackAdded();
            self.emit('addTrack', e);
          });
        } else {
          this.logger.warn('Using onaddstream which is deprecated');
          this.peerConnection.onaddstream = function (e) {
            self.logger.log('stream added');
            self.emit('addStream', e);
          };
        }

        this.peerConnection.onicecandidate = function (e) {
          self.emit('iceCandidate', e);
          if (e.candidate) {
            self.logger.log('ICE candidate received: ' + (e.candidate.candidate === null ? null : e.candidate.candidate.trim()));
          }
        };

        this.peerConnection.onicegatheringstatechange = function () {
          self.logger.log('RTCIceGatheringState changed: ' + this.iceGatheringState);
          switch (this.iceGatheringState) {
            case 'gathering':
              self.emit('iceGathering', this);
              if (!self.iceGatheringTimer && options.iceCheckingTimeout) {
                self.iceGatheringTimeout = false;
                self.iceGatheringTimer = SIP.Timers.setTimeout(function () {
                  self.logger.log('RTCIceChecking Timeout Triggered after ' + options.iceCheckingTimeout + ' milliseconds');
                  self.iceGatheringTimeout = true;
                  self.triggerIceGatheringComplete();
                }, options.iceCheckingTimeout);
              }
              break;
            case 'complete':
              self.triggerIceGatheringComplete();
              break;
          }
        };

        this.peerConnection.oniceconnectionstatechange = function () {
          //need e for commented out case
          var stateEvent;

          switch (this.iceConnectionState) {
            case 'new':
              stateEvent = 'iceConnection';
              break;
            case 'checking':
              stateEvent = 'iceConnectionChecking';
              break;
            case 'connected':
              stateEvent = 'iceConnectionConnected';
              break;
            case 'completed':
              stateEvent = 'iceConnectionCompleted';
              break;
            case 'failed':
              stateEvent = 'iceConnectionFailed';
              break;
            case 'disconnected':
              stateEvent = 'iceConnectionDisconnected';
              break;
            case 'closed':
              stateEvent = 'iceConnectionClosed';
              break;
            default:
              self.logger.warn('Unknown iceConnection state:', this.iceConnectionState);
              return;
          }
          self.emit(stateEvent, this);
        };
      } },

    acquire: { writable: true, value: function acquire(constraints) {
        // Default audio & video to true
        constraints = this.checkAndDefaultConstraints(constraints);

        return new SIP.Utils.Promise(function (resolve, reject) {
          /*
           * Make the call asynchronous, so that ICCs have a chance
           * to define callbacks to `userMediaRequest`
           */
          this.logger.log('acquiring local media');
          this.emit('userMediaRequest', constraints);

          if (constraints.audio || constraints.video) {
            this.WebRTC.getUserMedia(constraints).then(function (streams) {
              this.observer.trackAdded();
              this.emit('userMedia', streams);
              resolve(streams);
            }.bind(this)).catch(function (e) {
              this.emit('userMediaFailed', e);
              reject(e);
            }.bind(this));
          } else {
            // Local streams were explicitly excluded.
            resolve([]);
          }
        }.bind(this)).catch(function acquireFailed(err) {
          this.logger.error('unable to acquire streams');
          this.logger.error(err);
          return SIP.Utils.Promise.reject(err);
        }.bind(this)).then(function acquireSucceeded(streams) {
          this.logger.log('acquired local media streams');
          try {
            // Remove old tracks
            if (this.peerConnection.removeTrack) {
              this.peerConnection.getSenders().forEach(function (sender) {
                this.peerConnection.removeTrack(sender);
              }, this);
            }
            return streams;
          } catch (e) {
            return SIP.Utils.Promise.reject(e);
          }
        }.bind(this)).catch(function removeStreamsFailed(err) {
          this.logger.error('error removing streams');
          this.logger.error(err);
          return SIP.Utils.Promise.reject(err);
        }.bind(this)).then(function addStreams(streams) {
          try {
            streams = [].concat(streams);
            streams.forEach(function (stream) {
              if (this.peerConnection.addTrack) {
                stream.getTracks().forEach(function (track) {
                  this.peerConnection.addTrack(track, stream);
                }, this);
              } else {
                // Chrome 59 does not support addTrack
                this.peerConnection.addStream(stream);
              }
            }, this);
          } catch (e) {
            return SIP.Utils.Promise.reject(e);
          }
          return SIP.Utils.Promise.resolve();
        }.bind(this)).catch(function addStreamsFailed(err) {
          this.logger.error('error adding stream');
          this.logger.error(err);
          return SIP.Utils.Promise.reject(err);
        }.bind(this));
      } },

    hasOffer: { writable: true, value: function hasOffer(where) {
        var offerState = 'have-' + where + '-offer';
        return this.peerConnection.signalingState === offerState;
      } },

    // ICE gathering state handling

    isIceGatheringComplete: { writable: true, value: function isIceGatheringComplete() {
        return this.peerConnection.iceGatheringState === 'complete' || this.iceGatheringTimeout;
      } },

    resetIceGatheringComplete: { writable: true, value: function resetIceGatheringComplete() {
        this.iceGatheringTimeout = false;

        if (this.iceGatheringTimer) {
          SIP.Timers.clearTimeout(this.iceGatheringTimer);
          this.iceGatheringTimer = null;
        }

        if (this.iceGatheringDeferred) {
          this.iceGatheringDeferred.reject();
          this.iceGatheringDeferred = null;
        }
      } },

    setDirection: { writable: true, value: function setDirection(sdp) {
        var match = sdp.match(/a=(sendrecv|sendonly|recvonly|inactive)/);
        if (match === null) {
          this.direction = this.C.DIRECTION.NULL;
          this.observer.directionChanged();
          return;
        }
        var direction = match[1];
        switch (direction) {
          case this.C.DIRECTION.SENDRECV:
          case this.C.DIRECTION.SENDONLY:
          case this.C.DIRECTION.RECVONLY:
          case this.C.DIRECTION.INACTIVE:
            this.direction = direction;
            break;
          default:
            this.direction = this.C.DIRECTION.NULL;
            break;
        }
        this.observer.directionChanged();
      } },

    triggerIceGatheringComplete: { writable: true, value: function triggerIceGatheringComplete() {
        if (this.isIceGatheringComplete()) {
          this.emit('iceGatheringComplete', this);

          if (this.iceGatheringTimer) {
            SIP.Timers.clearTimeout(this.iceGatheringTimer);
            this.iceGatheringTimer = null;
          }

          if (this.iceGatheringDeferred) {
            this.iceGatheringDeferred.resolve();
            this.iceGatheringDeferred = null;
          }
        }
      } },

    waitForIceGatheringComplete: { writable: true, value: function waitForIceGatheringComplete() {
        if (this.isIceGatheringComplete()) {
          return SIP.Utils.Promise.resolve();
        } else if (!this.isIceGatheringDeferred) {
          this.iceGatheringDeferred = SIP.Utils.defer();
        }
        return this.iceGatheringDeferred.promise;
      } }
  });

  return SessionDescriptionHandler;
};
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(28)))

/***/ }),
/* 31 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/**
 * @fileoverview SessionDescriptionHandlerObserver
 */

/* SessionDescriptionHandlerObserver
 * @class SessionDescriptionHandler Observer Class.
 * @param {SIP.Session} session
 * @param {Object} [options]
 */

// Constructor

var SessionDescriptionHandlerObserver = function SessionDescriptionHandlerObserver(session, options) {
  this.session = session || {};
  this.options = options || {};
};

SessionDescriptionHandlerObserver.prototype = {
  trackAdded: function trackAdded() {
    this.session.emit('trackAdded');
  },

  directionChanged: function directionChanged() {
    this.session.emit('directionChanged');
  }
};

module.exports = SessionDescriptionHandlerObserver;

/***/ }),
/* 32 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/**
 * @fileoverview Incoming SIP Message Sanity Check
 */

/**
 * SIP message sanity check.
 * @augments SIP
 * @function
 * @param {SIP.IncomingMessage} message
 * @param {SIP.UA} ua
 * @param {SIP.Transport} transport
 * @returns {Boolean}
 */

module.exports = function (SIP) {
  var sanityCheck,
      requests = [],
      responses = [],
      all = [];

  // Reply
  function reply(status_code, message, transport) {
    var to,
        response = SIP.Utils.buildStatusLine(status_code),
        vias = message.getHeaders('via'),
        length = vias.length,
        idx = 0;

    for (idx; idx < length; idx++) {
      response += "Via: " + vias[idx] + "\r\n";
    }

    to = message.getHeader('To');

    if (!message.to_tag) {
      to += ';tag=' + SIP.Utils.newTag();
    }

    response += "To: " + to + "\r\n";
    response += "From: " + message.getHeader('From') + "\r\n";
    response += "Call-ID: " + message.call_id + "\r\n";
    response += "CSeq: " + message.cseq + " " + message.method + "\r\n";
    response += "\r\n";

    transport.send(response);
  }

  /*
   * Sanity Check for incoming Messages
   *
   * Requests:
   *  - _rfc3261_8_2_2_1_ Receive a Request with a non supported URI scheme
   *  - _rfc3261_16_3_4_ Receive a Request already sent by us
   *   Does not look at via sent-by but at sipjsId, which is inserted as
   *   a prefix in all initial requests generated by the ua
   *  - _rfc3261_18_3_request_ Body Content-Length
   *  - _rfc3261_8_2_2_2_ Merged Requests
   *
   * Responses:
   *  - _rfc3261_8_1_3_3_ Multiple Via headers
   *  - _rfc3261_18_1_2_ sent-by mismatch
   *  - _rfc3261_18_3_response_ Body Content-Length
   *
   * All:
   *  - Minimum headers in a SIP message
   */

  // Sanity Check functions for requests
  function rfc3261_8_2_2_1(message, ua, transport) {
    if (!message.ruri || message.ruri.scheme !== 'sip') {
      reply(416, message, transport);
      return false;
    }
  }

  function rfc3261_16_3_4(message, ua, transport) {
    if (!message.to_tag) {
      if (message.call_id.substr(0, 5) === ua.configuration.sipjsId) {
        reply(482, message, transport);
        return false;
      }
    }
  }

  function rfc3261_18_3_request(message, ua, transport) {
    var len = SIP.Utils.str_utf8_length(message.body),
        contentLength = message.getHeader('content-length');

    if (len < contentLength) {
      reply(400, message, transport);
      return false;
    }
  }

  function rfc3261_8_2_2_2(message, ua, transport) {
    var tr,
        idx,
        fromTag = message.from_tag,
        call_id = message.call_id,
        cseq = message.cseq;

    if (!message.to_tag) {
      if (message.method === SIP.C.INVITE) {
        tr = ua.transactions.ist[message.via_branch];
        if (tr) {
          return;
        } else {
          for (idx in ua.transactions.ist) {
            tr = ua.transactions.ist[idx];
            if (tr.request.from_tag === fromTag && tr.request.call_id === call_id && tr.request.cseq === cseq) {
              reply(482, message, transport);
              return false;
            }
          }
        }
      } else {
        tr = ua.transactions.nist[message.via_branch];
        if (tr) {
          return;
        } else {
          for (idx in ua.transactions.nist) {
            tr = ua.transactions.nist[idx];
            if (tr.request.from_tag === fromTag && tr.request.call_id === call_id && tr.request.cseq === cseq) {
              reply(482, message, transport);
              return false;
            }
          }
        }
      }
    }
  }

  // Sanity Check functions for responses
  function rfc3261_8_1_3_3(message, ua) {
    if (message.getHeaders('via').length > 1) {
      ua.getLogger('sip.sanitycheck').warn('More than one Via header field present in the response. Dropping the response');
      return false;
    }
  }

  function rfc3261_18_1_2(message, ua) {
    var viaHost = ua.configuration.viaHost;
    if (message.via.host !== viaHost || message.via.port !== undefined) {
      ua.getLogger('sip.sanitycheck').warn('Via sent-by in the response does not match UA Via host value. Dropping the response');
      return false;
    }
  }

  function rfc3261_18_3_response(message, ua) {
    var len = SIP.Utils.str_utf8_length(message.body),
        contentLength = message.getHeader('content-length');

    if (len < contentLength) {
      ua.getLogger('sip.sanitycheck').warn('Message body length is lower than the value in Content-Length header field. Dropping the response');
      return false;
    }
  }

  // Sanity Check functions for requests and responses
  function minimumHeaders(message, ua) {
    var mandatoryHeaders = ['from', 'to', 'call_id', 'cseq', 'via'],
        idx = mandatoryHeaders.length;

    while (idx--) {
      if (!message.hasHeader(mandatoryHeaders[idx])) {
        ua.getLogger('sip.sanitycheck').warn('Missing mandatory header field : ' + mandatoryHeaders[idx] + '. Dropping the response');
        return false;
      }
    }
  }

  requests.push(rfc3261_8_2_2_1);
  requests.push(rfc3261_16_3_4);
  requests.push(rfc3261_18_3_request);
  requests.push(rfc3261_8_2_2_2);

  responses.push(rfc3261_8_1_3_3);
  responses.push(rfc3261_18_1_2);
  responses.push(rfc3261_18_3_response);

  all.push(minimumHeaders);

  sanityCheck = function sanityCheck(message, ua, transport) {
    var len, pass;

    len = all.length;
    while (len--) {
      pass = all[len](message, ua, transport);
      if (pass === false) {
        return false;
      }
    }

    if (message instanceof SIP.IncomingRequest) {
      len = requests.length;
      while (len--) {
        pass = requests[len](message, ua, transport);
        if (pass === false) {
          return false;
        }
      }
    } else if (message instanceof SIP.IncomingResponse) {
      len = responses.length;
      while (len--) {
        pass = responses[len](message, ua, transport);
        if (pass === false) {
          return false;
        }
      }
    }

    //Everything is OK
    return true;
  };

  SIP.sanityCheck = sanityCheck;
};

/***/ }),
/* 33 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var md5 = __webpack_require__(34);

/**
 * @fileoverview SIP Digest Authentication
 */

/**
 * SIP Digest Authentication.
 * @augments SIP.
 * @function Digest Authentication
 * @param {SIP.UA} ua
 */
module.exports = function (Utils) {
  var DigestAuthentication;

  DigestAuthentication = function DigestAuthentication(ua) {
    this.logger = ua.getLogger('sipjs.digestauthentication');
    this.username = ua.configuration.authorizationUser;
    this.password = ua.configuration.password;
    this.cnonce = null;
    this.nc = 0;
    this.ncHex = '00000000';
    this.response = null;
  };

  /**
  * Performs Digest authentication given a SIP request and the challenge
  * received in a response to that request.
  * Returns true if credentials were successfully generated, false otherwise.
  *
  * @param {SIP.OutgoingRequest} request
  * @param {Object} challenge
  */
  DigestAuthentication.prototype.authenticate = function (request, challenge) {
    // Inspect and validate the challenge.

    this.algorithm = challenge.algorithm;
    this.realm = challenge.realm;
    this.nonce = challenge.nonce;
    this.opaque = challenge.opaque;
    this.stale = challenge.stale;

    if (this.algorithm) {
      if (this.algorithm !== 'MD5') {
        this.logger.warn('challenge with Digest algorithm different than "MD5", authentication aborted');
        return false;
      }
    } else {
      this.algorithm = 'MD5';
    }

    if (!this.realm) {
      this.logger.warn('challenge without Digest realm, authentication aborted');
      return false;
    }

    if (!this.nonce) {
      this.logger.warn('challenge without Digest nonce, authentication aborted');
      return false;
    }

    // 'qop' can contain a list of values (Array). Let's choose just one.
    if (challenge.qop) {
      if (challenge.qop.indexOf('auth') > -1) {
        this.qop = 'auth';
      } else if (challenge.qop.indexOf('auth-int') > -1) {
        this.qop = 'auth-int';
      } else {
        // Otherwise 'qop' is present but does not contain 'auth' or 'auth-int', so abort here.
        this.logger.warn('challenge without Digest qop different than "auth" or "auth-int", authentication aborted');
        return false;
      }
    } else {
      this.qop = null;
    }

    // Fill other attributes.

    this.method = request.method;
    this.uri = request.ruri;
    this.cnonce = Utils.createRandomToken(12);
    this.nc += 1;
    this.updateNcHex();

    // nc-value = 8LHEX. Max value = 'FFFFFFFF'.
    if (this.nc === 4294967296) {
      this.nc = 1;
      this.ncHex = '00000001';
    }

    // Calculate the Digest "response" value.
    this.calculateResponse();

    return true;
  };

  /**
  * Generate Digest 'response' value.
  * @private
  */
  DigestAuthentication.prototype.calculateResponse = function () {
    var ha1, ha2;

    // HA1 = MD5(A1) = MD5(username:realm:password)
    ha1 = md5(this.username + ":" + this.realm + ":" + this.password);

    if (this.qop === 'auth') {
      // HA2 = MD5(A2) = MD5(method:digestURI)
      ha2 = md5(this.method + ":" + this.uri);
      // response = MD5(HA1:nonce:nonceCount:credentialsNonce:qop:HA2)
      this.response = md5(ha1 + ":" + this.nonce + ":" + this.ncHex + ":" + this.cnonce + ":auth:" + ha2);
    } else if (this.qop === 'auth-int') {
      // HA2 = MD5(A2) = MD5(method:digestURI:MD5(entityBody))
      ha2 = md5(this.method + ":" + this.uri + ":" + md5(this.body ? this.body : ""));
      // response = MD5(HA1:nonce:nonceCount:credentialsNonce:qop:HA2)
      this.response = md5(ha1 + ":" + this.nonce + ":" + this.ncHex + ":" + this.cnonce + ":auth-int:" + ha2);
    } else if (this.qop === null) {
      // HA2 = MD5(A2) = MD5(method:digestURI)
      ha2 = md5(this.method + ":" + this.uri);
      // response = MD5(HA1:nonce:HA2)
      this.response = md5(ha1 + ":" + this.nonce + ":" + ha2);
    }
  };

  /**
  * Return the Proxy-Authorization or WWW-Authorization header value.
  */
  DigestAuthentication.prototype.toString = function () {
    var auth_params = [];

    if (!this.response) {
      throw new Error('response field does not exist, cannot generate Authorization header');
    }

    auth_params.push('algorithm=' + this.algorithm);
    auth_params.push('username="' + this.username + '"');
    auth_params.push('realm="' + this.realm + '"');
    auth_params.push('nonce="' + this.nonce + '"');
    auth_params.push('uri="' + this.uri + '"');
    auth_params.push('response="' + this.response + '"');
    if (this.opaque) {
      auth_params.push('opaque="' + this.opaque + '"');
    }
    if (this.qop) {
      auth_params.push('qop=' + this.qop);
      auth_params.push('cnonce="' + this.cnonce + '"');
      auth_params.push('nc=' + this.ncHex);
    }

    return 'Digest ' + auth_params.join(', ');
  };

  /**
  * Generate the 'nc' value as required by Digest in this.ncHex by reading this.nc.
  * @private
  */
  DigestAuthentication.prototype.updateNcHex = function () {
    var hex = Number(this.nc).toString(16);
    this.ncHex = '00000000'.substr(0, 8 - hex.length) + hex;
  };

  return DigestAuthentication;
};

/***/ }),
/* 34 */
/***/ (function(module, exports, __webpack_require__) {

;(function (root, factory) {
	if (true) {
		// CommonJS
		module.exports = exports = factory(__webpack_require__(35));
	}
	else {}
}(this, function (CryptoJS) {

	(function (Math) {
	    // Shortcuts
	    var C = CryptoJS;
	    var C_lib = C.lib;
	    var WordArray = C_lib.WordArray;
	    var Hasher = C_lib.Hasher;
	    var C_algo = C.algo;

	    // Constants table
	    var T = [];

	    // Compute constants
	    (function () {
	        for (var i = 0; i < 64; i++) {
	            T[i] = (Math.abs(Math.sin(i + 1)) * 0x100000000) | 0;
	        }
	    }());

	    /**
	     * MD5 hash algorithm.
	     */
	    var MD5 = C_algo.MD5 = Hasher.extend({
	        _doReset: function () {
	            this._hash = new WordArray.init([
	                0x67452301, 0xefcdab89,
	                0x98badcfe, 0x10325476
	            ]);
	        },

	        _doProcessBlock: function (M, offset) {
	            // Swap endian
	            for (var i = 0; i < 16; i++) {
	                // Shortcuts
	                var offset_i = offset + i;
	                var M_offset_i = M[offset_i];

	                M[offset_i] = (
	                    (((M_offset_i << 8)  | (M_offset_i >>> 24)) & 0x00ff00ff) |
	                    (((M_offset_i << 24) | (M_offset_i >>> 8))  & 0xff00ff00)
	                );
	            }

	            // Shortcuts
	            var H = this._hash.words;

	            var M_offset_0  = M[offset + 0];
	            var M_offset_1  = M[offset + 1];
	            var M_offset_2  = M[offset + 2];
	            var M_offset_3  = M[offset + 3];
	            var M_offset_4  = M[offset + 4];
	            var M_offset_5  = M[offset + 5];
	            var M_offset_6  = M[offset + 6];
	            var M_offset_7  = M[offset + 7];
	            var M_offset_8  = M[offset + 8];
	            var M_offset_9  = M[offset + 9];
	            var M_offset_10 = M[offset + 10];
	            var M_offset_11 = M[offset + 11];
	            var M_offset_12 = M[offset + 12];
	            var M_offset_13 = M[offset + 13];
	            var M_offset_14 = M[offset + 14];
	            var M_offset_15 = M[offset + 15];

	            // Working varialbes
	            var a = H[0];
	            var b = H[1];
	            var c = H[2];
	            var d = H[3];

	            // Computation
	            a = FF(a, b, c, d, M_offset_0,  7,  T[0]);
	            d = FF(d, a, b, c, M_offset_1,  12, T[1]);
	            c = FF(c, d, a, b, M_offset_2,  17, T[2]);
	            b = FF(b, c, d, a, M_offset_3,  22, T[3]);
	            a = FF(a, b, c, d, M_offset_4,  7,  T[4]);
	            d = FF(d, a, b, c, M_offset_5,  12, T[5]);
	            c = FF(c, d, a, b, M_offset_6,  17, T[6]);
	            b = FF(b, c, d, a, M_offset_7,  22, T[7]);
	            a = FF(a, b, c, d, M_offset_8,  7,  T[8]);
	            d = FF(d, a, b, c, M_offset_9,  12, T[9]);
	            c = FF(c, d, a, b, M_offset_10, 17, T[10]);
	            b = FF(b, c, d, a, M_offset_11, 22, T[11]);
	            a = FF(a, b, c, d, M_offset_12, 7,  T[12]);
	            d = FF(d, a, b, c, M_offset_13, 12, T[13]);
	            c = FF(c, d, a, b, M_offset_14, 17, T[14]);
	            b = FF(b, c, d, a, M_offset_15, 22, T[15]);

	            a = GG(a, b, c, d, M_offset_1,  5,  T[16]);
	            d = GG(d, a, b, c, M_offset_6,  9,  T[17]);
	            c = GG(c, d, a, b, M_offset_11, 14, T[18]);
	            b = GG(b, c, d, a, M_offset_0,  20, T[19]);
	            a = GG(a, b, c, d, M_offset_5,  5,  T[20]);
	            d = GG(d, a, b, c, M_offset_10, 9,  T[21]);
	            c = GG(c, d, a, b, M_offset_15, 14, T[22]);
	            b = GG(b, c, d, a, M_offset_4,  20, T[23]);
	            a = GG(a, b, c, d, M_offset_9,  5,  T[24]);
	            d = GG(d, a, b, c, M_offset_14, 9,  T[25]);
	            c = GG(c, d, a, b, M_offset_3,  14, T[26]);
	            b = GG(b, c, d, a, M_offset_8,  20, T[27]);
	            a = GG(a, b, c, d, M_offset_13, 5,  T[28]);
	            d = GG(d, a, b, c, M_offset_2,  9,  T[29]);
	            c = GG(c, d, a, b, M_offset_7,  14, T[30]);
	            b = GG(b, c, d, a, M_offset_12, 20, T[31]);

	            a = HH(a, b, c, d, M_offset_5,  4,  T[32]);
	            d = HH(d, a, b, c, M_offset_8,  11, T[33]);
	            c = HH(c, d, a, b, M_offset_11, 16, T[34]);
	            b = HH(b, c, d, a, M_offset_14, 23, T[35]);
	            a = HH(a, b, c, d, M_offset_1,  4,  T[36]);
	            d = HH(d, a, b, c, M_offset_4,  11, T[37]);
	            c = HH(c, d, a, b, M_offset_7,  16, T[38]);
	            b = HH(b, c, d, a, M_offset_10, 23, T[39]);
	            a = HH(a, b, c, d, M_offset_13, 4,  T[40]);
	            d = HH(d, a, b, c, M_offset_0,  11, T[41]);
	            c = HH(c, d, a, b, M_offset_3,  16, T[42]);
	            b = HH(b, c, d, a, M_offset_6,  23, T[43]);
	            a = HH(a, b, c, d, M_offset_9,  4,  T[44]);
	            d = HH(d, a, b, c, M_offset_12, 11, T[45]);
	            c = HH(c, d, a, b, M_offset_15, 16, T[46]);
	            b = HH(b, c, d, a, M_offset_2,  23, T[47]);

	            a = II(a, b, c, d, M_offset_0,  6,  T[48]);
	            d = II(d, a, b, c, M_offset_7,  10, T[49]);
	            c = II(c, d, a, b, M_offset_14, 15, T[50]);
	            b = II(b, c, d, a, M_offset_5,  21, T[51]);
	            a = II(a, b, c, d, M_offset_12, 6,  T[52]);
	            d = II(d, a, b, c, M_offset_3,  10, T[53]);
	            c = II(c, d, a, b, M_offset_10, 15, T[54]);
	            b = II(b, c, d, a, M_offset_1,  21, T[55]);
	            a = II(a, b, c, d, M_offset_8,  6,  T[56]);
	            d = II(d, a, b, c, M_offset_15, 10, T[57]);
	            c = II(c, d, a, b, M_offset_6,  15, T[58]);
	            b = II(b, c, d, a, M_offset_13, 21, T[59]);
	            a = II(a, b, c, d, M_offset_4,  6,  T[60]);
	            d = II(d, a, b, c, M_offset_11, 10, T[61]);
	            c = II(c, d, a, b, M_offset_2,  15, T[62]);
	            b = II(b, c, d, a, M_offset_9,  21, T[63]);

	            // Intermediate hash value
	            H[0] = (H[0] + a) | 0;
	            H[1] = (H[1] + b) | 0;
	            H[2] = (H[2] + c) | 0;
	            H[3] = (H[3] + d) | 0;
	        },

	        _doFinalize: function () {
	            // Shortcuts
	            var data = this._data;
	            var dataWords = data.words;

	            var nBitsTotal = this._nDataBytes * 8;
	            var nBitsLeft = data.sigBytes * 8;

	            // Add padding
	            dataWords[nBitsLeft >>> 5] |= 0x80 << (24 - nBitsLeft % 32);

	            var nBitsTotalH = Math.floor(nBitsTotal / 0x100000000);
	            var nBitsTotalL = nBitsTotal;
	            dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 15] = (
	                (((nBitsTotalH << 8)  | (nBitsTotalH >>> 24)) & 0x00ff00ff) |
	                (((nBitsTotalH << 24) | (nBitsTotalH >>> 8))  & 0xff00ff00)
	            );
	            dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 14] = (
	                (((nBitsTotalL << 8)  | (nBitsTotalL >>> 24)) & 0x00ff00ff) |
	                (((nBitsTotalL << 24) | (nBitsTotalL >>> 8))  & 0xff00ff00)
	            );

	            data.sigBytes = (dataWords.length + 1) * 4;

	            // Hash final blocks
	            this._process();

	            // Shortcuts
	            var hash = this._hash;
	            var H = hash.words;

	            // Swap endian
	            for (var i = 0; i < 4; i++) {
	                // Shortcut
	                var H_i = H[i];

	                H[i] = (((H_i << 8)  | (H_i >>> 24)) & 0x00ff00ff) |
	                       (((H_i << 24) | (H_i >>> 8))  & 0xff00ff00);
	            }

	            // Return final computed hash
	            return hash;
	        },

	        clone: function () {
	            var clone = Hasher.clone.call(this);
	            clone._hash = this._hash.clone();

	            return clone;
	        }
	    });

	    function FF(a, b, c, d, x, s, t) {
	        var n = a + ((b & c) | (~b & d)) + x + t;
	        return ((n << s) | (n >>> (32 - s))) + b;
	    }

	    function GG(a, b, c, d, x, s, t) {
	        var n = a + ((b & d) | (c & ~d)) + x + t;
	        return ((n << s) | (n >>> (32 - s))) + b;
	    }

	    function HH(a, b, c, d, x, s, t) {
	        var n = a + (b ^ c ^ d) + x + t;
	        return ((n << s) | (n >>> (32 - s))) + b;
	    }

	    function II(a, b, c, d, x, s, t) {
	        var n = a + (c ^ (b | ~d)) + x + t;
	        return ((n << s) | (n >>> (32 - s))) + b;
	    }

	    /**
	     * Shortcut function to the hasher's object interface.
	     *
	     * @param {WordArray|string} message The message to hash.
	     *
	     * @return {WordArray} The hash.
	     *
	     * @static
	     *
	     * @example
	     *
	     *     var hash = CryptoJS.MD5('message');
	     *     var hash = CryptoJS.MD5(wordArray);
	     */
	    C.MD5 = Hasher._createHelper(MD5);

	    /**
	     * Shortcut function to the HMAC's object interface.
	     *
	     * @param {WordArray|string} message The message to hash.
	     * @param {WordArray|string} key The secret key.
	     *
	     * @return {WordArray} The HMAC.
	     *
	     * @static
	     *
	     * @example
	     *
	     *     var hmac = CryptoJS.HmacMD5(message, key);
	     */
	    C.HmacMD5 = Hasher._createHmacHelper(MD5);
	}(Math));


	return CryptoJS.MD5;

}));

/***/ }),
/* 35 */
/***/ (function(module, exports, __webpack_require__) {

;(function (root, factory) {
	if (true) {
		// CommonJS
		module.exports = exports = factory();
	}
	else {}
}(this, function () {

	/**
	 * CryptoJS core components.
	 */
	var CryptoJS = CryptoJS || (function (Math, undefined) {
	    /*
	     * Local polyfil of Object.create
	     */
	    var create = Object.create || (function () {
	        function F() {};

	        return function (obj) {
	            var subtype;

	            F.prototype = obj;

	            subtype = new F();

	            F.prototype = null;

	            return subtype;
	        };
	    }())

	    /**
	     * CryptoJS namespace.
	     */
	    var C = {};

	    /**
	     * Library namespace.
	     */
	    var C_lib = C.lib = {};

	    /**
	     * Base object for prototypal inheritance.
	     */
	    var Base = C_lib.Base = (function () {


	        return {
	            /**
	             * Creates a new object that inherits from this object.
	             *
	             * @param {Object} overrides Properties to copy into the new object.
	             *
	             * @return {Object} The new object.
	             *
	             * @static
	             *
	             * @example
	             *
	             *     var MyType = CryptoJS.lib.Base.extend({
	             *         field: 'value',
	             *
	             *         method: function () {
	             *         }
	             *     });
	             */
	            extend: function (overrides) {
	                // Spawn
	                var subtype = create(this);

	                // Augment
	                if (overrides) {
	                    subtype.mixIn(overrides);
	                }

	                // Create default initializer
	                if (!subtype.hasOwnProperty('init') || this.init === subtype.init) {
	                    subtype.init = function () {
	                        subtype.$super.init.apply(this, arguments);
	                    };
	                }

	                // Initializer's prototype is the subtype object
	                subtype.init.prototype = subtype;

	                // Reference supertype
	                subtype.$super = this;

	                return subtype;
	            },

	            /**
	             * Extends this object and runs the init method.
	             * Arguments to create() will be passed to init().
	             *
	             * @return {Object} The new object.
	             *
	             * @static
	             *
	             * @example
	             *
	             *     var instance = MyType.create();
	             */
	            create: function () {
	                var instance = this.extend();
	                instance.init.apply(instance, arguments);

	                return instance;
	            },

	            /**
	             * Initializes a newly created object.
	             * Override this method to add some logic when your objects are created.
	             *
	             * @example
	             *
	             *     var MyType = CryptoJS.lib.Base.extend({
	             *         init: function () {
	             *             // ...
	             *         }
	             *     });
	             */
	            init: function () {
	            },

	            /**
	             * Copies properties into this object.
	             *
	             * @param {Object} properties The properties to mix in.
	             *
	             * @example
	             *
	             *     MyType.mixIn({
	             *         field: 'value'
	             *     });
	             */
	            mixIn: function (properties) {
	                for (var propertyName in properties) {
	                    if (properties.hasOwnProperty(propertyName)) {
	                        this[propertyName] = properties[propertyName];
	                    }
	                }

	                // IE won't copy toString using the loop above
	                if (properties.hasOwnProperty('toString')) {
	                    this.toString = properties.toString;
	                }
	            },

	            /**
	             * Creates a copy of this object.
	             *
	             * @return {Object} The clone.
	             *
	             * @example
	             *
	             *     var clone = instance.clone();
	             */
	            clone: function () {
	                return this.init.prototype.extend(this);
	            }
	        };
	    }());

	    /**
	     * An array of 32-bit words.
	     *
	     * @property {Array} words The array of 32-bit words.
	     * @property {number} sigBytes The number of significant bytes in this word array.
	     */
	    var WordArray = C_lib.WordArray = Base.extend({
	        /**
	         * Initializes a newly created word array.
	         *
	         * @param {Array} words (Optional) An array of 32-bit words.
	         * @param {number} sigBytes (Optional) The number of significant bytes in the words.
	         *
	         * @example
	         *
	         *     var wordArray = CryptoJS.lib.WordArray.create();
	         *     var wordArray = CryptoJS.lib.WordArray.create([0x00010203, 0x04050607]);
	         *     var wordArray = CryptoJS.lib.WordArray.create([0x00010203, 0x04050607], 6);
	         */
	        init: function (words, sigBytes) {
	            words = this.words = words || [];

	            if (sigBytes != undefined) {
	                this.sigBytes = sigBytes;
	            } else {
	                this.sigBytes = words.length * 4;
	            }
	        },

	        /**
	         * Converts this word array to a string.
	         *
	         * @param {Encoder} encoder (Optional) The encoding strategy to use. Default: CryptoJS.enc.Hex
	         *
	         * @return {string} The stringified word array.
	         *
	         * @example
	         *
	         *     var string = wordArray + '';
	         *     var string = wordArray.toString();
	         *     var string = wordArray.toString(CryptoJS.enc.Utf8);
	         */
	        toString: function (encoder) {
	            return (encoder || Hex).stringify(this);
	        },

	        /**
	         * Concatenates a word array to this word array.
	         *
	         * @param {WordArray} wordArray The word array to append.
	         *
	         * @return {WordArray} This word array.
	         *
	         * @example
	         *
	         *     wordArray1.concat(wordArray2);
	         */
	        concat: function (wordArray) {
	            // Shortcuts
	            var thisWords = this.words;
	            var thatWords = wordArray.words;
	            var thisSigBytes = this.sigBytes;
	            var thatSigBytes = wordArray.sigBytes;

	            // Clamp excess bits
	            this.clamp();

	            // Concat
	            if (thisSigBytes % 4) {
	                // Copy one byte at a time
	                for (var i = 0; i < thatSigBytes; i++) {
	                    var thatByte = (thatWords[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
	                    thisWords[(thisSigBytes + i) >>> 2] |= thatByte << (24 - ((thisSigBytes + i) % 4) * 8);
	                }
	            } else {
	                // Copy one word at a time
	                for (var i = 0; i < thatSigBytes; i += 4) {
	                    thisWords[(thisSigBytes + i) >>> 2] = thatWords[i >>> 2];
	                }
	            }
	            this.sigBytes += thatSigBytes;

	            // Chainable
	            return this;
	        },

	        /**
	         * Removes insignificant bits.
	         *
	         * @example
	         *
	         *     wordArray.clamp();
	         */
	        clamp: function () {
	            // Shortcuts
	            var words = this.words;
	            var sigBytes = this.sigBytes;

	            // Clamp
	            words[sigBytes >>> 2] &= 0xffffffff << (32 - (sigBytes % 4) * 8);
	            words.length = Math.ceil(sigBytes / 4);
	        },

	        /**
	         * Creates a copy of this word array.
	         *
	         * @return {WordArray} The clone.
	         *
	         * @example
	         *
	         *     var clone = wordArray.clone();
	         */
	        clone: function () {
	            var clone = Base.clone.call(this);
	            clone.words = this.words.slice(0);

	            return clone;
	        },

	        /**
	         * Creates a word array filled with random bytes.
	         *
	         * @param {number} nBytes The number of random bytes to generate.
	         *
	         * @return {WordArray} The random word array.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var wordArray = CryptoJS.lib.WordArray.random(16);
	         */
	        random: function (nBytes) {
	            var words = [];

	            var r = (function (m_w) {
	                var m_w = m_w;
	                var m_z = 0x3ade68b1;
	                var mask = 0xffffffff;

	                return function () {
	                    m_z = (0x9069 * (m_z & 0xFFFF) + (m_z >> 0x10)) & mask;
	                    m_w = (0x4650 * (m_w & 0xFFFF) + (m_w >> 0x10)) & mask;
	                    var result = ((m_z << 0x10) + m_w) & mask;
	                    result /= 0x100000000;
	                    result += 0.5;
	                    return result * (Math.random() > .5 ? 1 : -1);
	                }
	            });

	            for (var i = 0, rcache; i < nBytes; i += 4) {
	                var _r = r((rcache || Math.random()) * 0x100000000);

	                rcache = _r() * 0x3ade67b7;
	                words.push((_r() * 0x100000000) | 0);
	            }

	            return new WordArray.init(words, nBytes);
	        }
	    });

	    /**
	     * Encoder namespace.
	     */
	    var C_enc = C.enc = {};

	    /**
	     * Hex encoding strategy.
	     */
	    var Hex = C_enc.Hex = {
	        /**
	         * Converts a word array to a hex string.
	         *
	         * @param {WordArray} wordArray The word array.
	         *
	         * @return {string} The hex string.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var hexString = CryptoJS.enc.Hex.stringify(wordArray);
	         */
	        stringify: function (wordArray) {
	            // Shortcuts
	            var words = wordArray.words;
	            var sigBytes = wordArray.sigBytes;

	            // Convert
	            var hexChars = [];
	            for (var i = 0; i < sigBytes; i++) {
	                var bite = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
	                hexChars.push((bite >>> 4).toString(16));
	                hexChars.push((bite & 0x0f).toString(16));
	            }

	            return hexChars.join('');
	        },

	        /**
	         * Converts a hex string to a word array.
	         *
	         * @param {string} hexStr The hex string.
	         *
	         * @return {WordArray} The word array.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var wordArray = CryptoJS.enc.Hex.parse(hexString);
	         */
	        parse: function (hexStr) {
	            // Shortcut
	            var hexStrLength = hexStr.length;

	            // Convert
	            var words = [];
	            for (var i = 0; i < hexStrLength; i += 2) {
	                words[i >>> 3] |= parseInt(hexStr.substr(i, 2), 16) << (24 - (i % 8) * 4);
	            }

	            return new WordArray.init(words, hexStrLength / 2);
	        }
	    };

	    /**
	     * Latin1 encoding strategy.
	     */
	    var Latin1 = C_enc.Latin1 = {
	        /**
	         * Converts a word array to a Latin1 string.
	         *
	         * @param {WordArray} wordArray The word array.
	         *
	         * @return {string} The Latin1 string.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var latin1String = CryptoJS.enc.Latin1.stringify(wordArray);
	         */
	        stringify: function (wordArray) {
	            // Shortcuts
	            var words = wordArray.words;
	            var sigBytes = wordArray.sigBytes;

	            // Convert
	            var latin1Chars = [];
	            for (var i = 0; i < sigBytes; i++) {
	                var bite = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
	                latin1Chars.push(String.fromCharCode(bite));
	            }

	            return latin1Chars.join('');
	        },

	        /**
	         * Converts a Latin1 string to a word array.
	         *
	         * @param {string} latin1Str The Latin1 string.
	         *
	         * @return {WordArray} The word array.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var wordArray = CryptoJS.enc.Latin1.parse(latin1String);
	         */
	        parse: function (latin1Str) {
	            // Shortcut
	            var latin1StrLength = latin1Str.length;

	            // Convert
	            var words = [];
	            for (var i = 0; i < latin1StrLength; i++) {
	                words[i >>> 2] |= (latin1Str.charCodeAt(i) & 0xff) << (24 - (i % 4) * 8);
	            }

	            return new WordArray.init(words, latin1StrLength);
	        }
	    };

	    /**
	     * UTF-8 encoding strategy.
	     */
	    var Utf8 = C_enc.Utf8 = {
	        /**
	         * Converts a word array to a UTF-8 string.
	         *
	         * @param {WordArray} wordArray The word array.
	         *
	         * @return {string} The UTF-8 string.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var utf8String = CryptoJS.enc.Utf8.stringify(wordArray);
	         */
	        stringify: function (wordArray) {
	            try {
	                return decodeURIComponent(escape(Latin1.stringify(wordArray)));
	            } catch (e) {
	                throw new Error('Malformed UTF-8 data');
	            }
	        },

	        /**
	         * Converts a UTF-8 string to a word array.
	         *
	         * @param {string} utf8Str The UTF-8 string.
	         *
	         * @return {WordArray} The word array.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var wordArray = CryptoJS.enc.Utf8.parse(utf8String);
	         */
	        parse: function (utf8Str) {
	            return Latin1.parse(unescape(encodeURIComponent(utf8Str)));
	        }
	    };

	    /**
	     * Abstract buffered block algorithm template.
	     *
	     * The property blockSize must be implemented in a concrete subtype.
	     *
	     * @property {number} _minBufferSize The number of blocks that should be kept unprocessed in the buffer. Default: 0
	     */
	    var BufferedBlockAlgorithm = C_lib.BufferedBlockAlgorithm = Base.extend({
	        /**
	         * Resets this block algorithm's data buffer to its initial state.
	         *
	         * @example
	         *
	         *     bufferedBlockAlgorithm.reset();
	         */
	        reset: function () {
	            // Initial values
	            this._data = new WordArray.init();
	            this._nDataBytes = 0;
	        },

	        /**
	         * Adds new data to this block algorithm's buffer.
	         *
	         * @param {WordArray|string} data The data to append. Strings are converted to a WordArray using UTF-8.
	         *
	         * @example
	         *
	         *     bufferedBlockAlgorithm._append('data');
	         *     bufferedBlockAlgorithm._append(wordArray);
	         */
	        _append: function (data) {
	            // Convert string to WordArray, else assume WordArray already
	            if (typeof data == 'string') {
	                data = Utf8.parse(data);
	            }

	            // Append
	            this._data.concat(data);
	            this._nDataBytes += data.sigBytes;
	        },

	        /**
	         * Processes available data blocks.
	         *
	         * This method invokes _doProcessBlock(offset), which must be implemented by a concrete subtype.
	         *
	         * @param {boolean} doFlush Whether all blocks and partial blocks should be processed.
	         *
	         * @return {WordArray} The processed data.
	         *
	         * @example
	         *
	         *     var processedData = bufferedBlockAlgorithm._process();
	         *     var processedData = bufferedBlockAlgorithm._process(!!'flush');
	         */
	        _process: function (doFlush) {
	            // Shortcuts
	            var data = this._data;
	            var dataWords = data.words;
	            var dataSigBytes = data.sigBytes;
	            var blockSize = this.blockSize;
	            var blockSizeBytes = blockSize * 4;

	            // Count blocks ready
	            var nBlocksReady = dataSigBytes / blockSizeBytes;
	            if (doFlush) {
	                // Round up to include partial blocks
	                nBlocksReady = Math.ceil(nBlocksReady);
	            } else {
	                // Round down to include only full blocks,
	                // less the number of blocks that must remain in the buffer
	                nBlocksReady = Math.max((nBlocksReady | 0) - this._minBufferSize, 0);
	            }

	            // Count words ready
	            var nWordsReady = nBlocksReady * blockSize;

	            // Count bytes ready
	            var nBytesReady = Math.min(nWordsReady * 4, dataSigBytes);

	            // Process blocks
	            if (nWordsReady) {
	                for (var offset = 0; offset < nWordsReady; offset += blockSize) {
	                    // Perform concrete-algorithm logic
	                    this._doProcessBlock(dataWords, offset);
	                }

	                // Remove processed words
	                var processedWords = dataWords.splice(0, nWordsReady);
	                data.sigBytes -= nBytesReady;
	            }

	            // Return processed words
	            return new WordArray.init(processedWords, nBytesReady);
	        },

	        /**
	         * Creates a copy of this object.
	         *
	         * @return {Object} The clone.
	         *
	         * @example
	         *
	         *     var clone = bufferedBlockAlgorithm.clone();
	         */
	        clone: function () {
	            var clone = Base.clone.call(this);
	            clone._data = this._data.clone();

	            return clone;
	        },

	        _minBufferSize: 0
	    });

	    /**
	     * Abstract hasher template.
	     *
	     * @property {number} blockSize The number of 32-bit words this hasher operates on. Default: 16 (512 bits)
	     */
	    var Hasher = C_lib.Hasher = BufferedBlockAlgorithm.extend({
	        /**
	         * Configuration options.
	         */
	        cfg: Base.extend(),

	        /**
	         * Initializes a newly created hasher.
	         *
	         * @param {Object} cfg (Optional) The configuration options to use for this hash computation.
	         *
	         * @example
	         *
	         *     var hasher = CryptoJS.algo.SHA256.create();
	         */
	        init: function (cfg) {
	            // Apply config defaults
	            this.cfg = this.cfg.extend(cfg);

	            // Set initial values
	            this.reset();
	        },

	        /**
	         * Resets this hasher to its initial state.
	         *
	         * @example
	         *
	         *     hasher.reset();
	         */
	        reset: function () {
	            // Reset data buffer
	            BufferedBlockAlgorithm.reset.call(this);

	            // Perform concrete-hasher logic
	            this._doReset();
	        },

	        /**
	         * Updates this hasher with a message.
	         *
	         * @param {WordArray|string} messageUpdate The message to append.
	         *
	         * @return {Hasher} This hasher.
	         *
	         * @example
	         *
	         *     hasher.update('message');
	         *     hasher.update(wordArray);
	         */
	        update: function (messageUpdate) {
	            // Append
	            this._append(messageUpdate);

	            // Update the hash
	            this._process();

	            // Chainable
	            return this;
	        },

	        /**
	         * Finalizes the hash computation.
	         * Note that the finalize operation is effectively a destructive, read-once operation.
	         *
	         * @param {WordArray|string} messageUpdate (Optional) A final message update.
	         *
	         * @return {WordArray} The hash.
	         *
	         * @example
	         *
	         *     var hash = hasher.finalize();
	         *     var hash = hasher.finalize('message');
	         *     var hash = hasher.finalize(wordArray);
	         */
	        finalize: function (messageUpdate) {
	            // Final message update
	            if (messageUpdate) {
	                this._append(messageUpdate);
	            }

	            // Perform concrete-hasher logic
	            var hash = this._doFinalize();

	            return hash;
	        },

	        blockSize: 512/32,

	        /**
	         * Creates a shortcut function to a hasher's object interface.
	         *
	         * @param {Hasher} hasher The hasher to create a helper for.
	         *
	         * @return {Function} The shortcut function.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var SHA256 = CryptoJS.lib.Hasher._createHelper(CryptoJS.algo.SHA256);
	         */
	        _createHelper: function (hasher) {
	            return function (message, cfg) {
	                return new hasher.init(cfg).finalize(message);
	            };
	        },

	        /**
	         * Creates a shortcut function to the HMAC's object interface.
	         *
	         * @param {Hasher} hasher The hasher to use in this HMAC helper.
	         *
	         * @return {Function} The shortcut function.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var HmacSHA256 = CryptoJS.lib.Hasher._createHmacHelper(CryptoJS.algo.SHA256);
	         */
	        _createHmacHelper: function (hasher) {
	            return function (message, key) {
	                return new C_algo.HMAC.init(hasher, key).finalize(message);
	            };
	        }
	    });

	    /**
	     * Algorithm namespace.
	     */
	    var C_algo = C.algo = {};

	    return C;
	}(Math));


	return CryptoJS;

}));

/***/ }),
/* 36 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var Grammar = __webpack_require__(37);

module.exports = function (SIP) {

  return {
    parse: function parseCustom(input, startRule) {
      var options = { startRule: startRule, SIP: SIP };
      try {
        Grammar.parse(input, options);
      } catch (e) {
        options.data = -1;
      }
      return options.data;
    }
  };
};

/***/ }),
/* 37 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/*
 * Generated by PEG.js 0.10.0.
 *
 * http://pegjs.org/
 */



function peg$subclass(child, parent) {
  function ctor() { this.constructor = child; }
  ctor.prototype = parent.prototype;
  child.prototype = new ctor();
}

function peg$SyntaxError(message, expected, found, location) {
  this.message  = message;
  this.expected = expected;
  this.found    = found;
  this.location = location;
  this.name     = "SyntaxError";

  if (typeof Error.captureStackTrace === "function") {
    Error.captureStackTrace(this, peg$SyntaxError);
  }
}

peg$subclass(peg$SyntaxError, Error);

peg$SyntaxError.buildMessage = function(expected, found) {
  var DESCRIBE_EXPECTATION_FNS = {
        literal: function(expectation) {
          return "\"" + literalEscape(expectation.text) + "\"";
        },

        "class": function(expectation) {
          var escapedParts = "",
              i;

          for (i = 0; i < expectation.parts.length; i++) {
            escapedParts += expectation.parts[i] instanceof Array
              ? classEscape(expectation.parts[i][0]) + "-" + classEscape(expectation.parts[i][1])
              : classEscape(expectation.parts[i]);
          }

          return "[" + (expectation.inverted ? "^" : "") + escapedParts + "]";
        },

        any: function(expectation) {
          return "any character";
        },

        end: function(expectation) {
          return "end of input";
        },

        other: function(expectation) {
          return expectation.description;
        }
      };

  function hex(ch) {
    return ch.charCodeAt(0).toString(16).toUpperCase();
  }

  function literalEscape(s) {
    return s
      .replace(/\\/g, '\\\\')
      .replace(/"/g,  '\\"')
      .replace(/\0/g, '\\0')
      .replace(/\t/g, '\\t')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/[\x00-\x0F]/g,          function(ch) { return '\\x0' + hex(ch); })
      .replace(/[\x10-\x1F\x7F-\x9F]/g, function(ch) { return '\\x'  + hex(ch); });
  }

  function classEscape(s) {
    return s
      .replace(/\\/g, '\\\\')
      .replace(/\]/g, '\\]')
      .replace(/\^/g, '\\^')
      .replace(/-/g,  '\\-')
      .replace(/\0/g, '\\0')
      .replace(/\t/g, '\\t')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/[\x00-\x0F]/g,          function(ch) { return '\\x0' + hex(ch); })
      .replace(/[\x10-\x1F\x7F-\x9F]/g, function(ch) { return '\\x'  + hex(ch); });
  }

  function describeExpectation(expectation) {
    return DESCRIBE_EXPECTATION_FNS[expectation.type](expectation);
  }

  function describeExpected(expected) {
    var descriptions = new Array(expected.length),
        i, j;

    for (i = 0; i < expected.length; i++) {
      descriptions[i] = describeExpectation(expected[i]);
    }

    descriptions.sort();

    if (descriptions.length > 0) {
      for (i = 1, j = 1; i < descriptions.length; i++) {
        if (descriptions[i - 1] !== descriptions[i]) {
          descriptions[j] = descriptions[i];
          j++;
        }
      }
      descriptions.length = j;
    }

    switch (descriptions.length) {
      case 1:
        return descriptions[0];

      case 2:
        return descriptions[0] + " or " + descriptions[1];

      default:
        return descriptions.slice(0, -1).join(", ")
          + ", or "
          + descriptions[descriptions.length - 1];
    }
  }

  function describeFound(found) {
    return found ? "\"" + literalEscape(found) + "\"" : "end of input";
  }

  return "Expected " + describeExpected(expected) + " but " + describeFound(found) + " found.";
};

function peg$parse(input, options) {
  options = options !== void 0 ? options : {};

  var peg$FAILED = {},

      peg$startRuleIndices = { Contact: 119, Name_Addr_Header: 156, Record_Route: 176, Request_Response: 81, SIP_URI: 45, Subscription_State: 186, Supported: 191, Require: 182, Via: 194, absoluteURI: 84, Call_ID: 118, Content_Disposition: 130, Content_Length: 135, Content_Type: 136, CSeq: 146, displayName: 122, Event: 149, From: 151, host: 52, Max_Forwards: 154, Min_SE: 213, Proxy_Authenticate: 157, quoted_string: 40, Refer_To: 178, Replaces: 179, Session_Expires: 210, stun_URI: 217, To: 192, turn_URI: 223, uuid: 226, WWW_Authenticate: 209, challenge: 158, sipfrag: 230, Referred_By: 231 },
      peg$startRuleIndex   = 119,

      peg$consts = [
        "\r\n",
        peg$literalExpectation("\r\n", false),
        /^[0-9]/,
        peg$classExpectation([["0", "9"]], false, false),
        /^[a-zA-Z]/,
        peg$classExpectation([["a", "z"], ["A", "Z"]], false, false),
        /^[0-9a-fA-F]/,
        peg$classExpectation([["0", "9"], ["a", "f"], ["A", "F"]], false, false),
        /^[\0-\xFF]/,
        peg$classExpectation([["\0", "\xFF"]], false, false),
        /^["]/,
        peg$classExpectation(["\""], false, false),
        " ",
        peg$literalExpectation(" ", false),
        "\t",
        peg$literalExpectation("\t", false),
        /^[a-zA-Z0-9]/,
        peg$classExpectation([["a", "z"], ["A", "Z"], ["0", "9"]], false, false),
        ";",
        peg$literalExpectation(";", false),
        "/",
        peg$literalExpectation("/", false),
        "?",
        peg$literalExpectation("?", false),
        ":",
        peg$literalExpectation(":", false),
        "@",
        peg$literalExpectation("@", false),
        "&",
        peg$literalExpectation("&", false),
        "=",
        peg$literalExpectation("=", false),
        "+",
        peg$literalExpectation("+", false),
        "$",
        peg$literalExpectation("$", false),
        ",",
        peg$literalExpectation(",", false),
        "-",
        peg$literalExpectation("-", false),
        "_",
        peg$literalExpectation("_", false),
        ".",
        peg$literalExpectation(".", false),
        "!",
        peg$literalExpectation("!", false),
        "~",
        peg$literalExpectation("~", false),
        "*",
        peg$literalExpectation("*", false),
        "'",
        peg$literalExpectation("'", false),
        "(",
        peg$literalExpectation("(", false),
        ")",
        peg$literalExpectation(")", false),
        "%",
        peg$literalExpectation("%", false),
        function() {return " "; },
        function() {return ':'; },
        /^[!-~]/,
        peg$classExpectation([["!", "~"]], false, false),
        /^[\x80-\uFFFF]/,
        peg$classExpectation([["\x80", "\uFFFF"]], false, false),
        /^[\x80-\xBF]/,
        peg$classExpectation([["\x80", "\xBF"]], false, false),
        /^[a-f]/,
        peg$classExpectation([["a", "f"]], false, false),
        "`",
        peg$literalExpectation("`", false),
        "<",
        peg$literalExpectation("<", false),
        ">",
        peg$literalExpectation(">", false),
        "\\",
        peg$literalExpectation("\\", false),
        "[",
        peg$literalExpectation("[", false),
        "]",
        peg$literalExpectation("]", false),
        "{",
        peg$literalExpectation("{", false),
        "}",
        peg$literalExpectation("}", false),
        function() {return "*"; },
        function() {return "/"; },
        function() {return "="; },
        function() {return "("; },
        function() {return ")"; },
        function() {return ">"; },
        function() {return "<"; },
        function() {return ","; },
        function() {return ";"; },
        function() {return ":"; },
        function() {return "\""; },
        /^[!-']/,
        peg$classExpectation([["!", "'"]], false, false),
        /^[*-[]/,
        peg$classExpectation([["*", "["]], false, false),
        /^[\]-~]/,
        peg$classExpectation([["]", "~"]], false, false),
        function(contents) {
                                return contents; },
        /^[#-[]/,
        peg$classExpectation([["#", "["]], false, false),
        /^[\0-\t]/,
        peg$classExpectation([["\0", "\t"]], false, false),
        /^[\x0B-\f]/,
        peg$classExpectation([["\x0B", "\f"]], false, false),
        /^[\x0E-\x7F]/,
        peg$classExpectation([["\x0E", "\x7F"]], false, false),
        function() {
                                options.data.uri = new options.SIP.URI(options.data.scheme, options.data.user, options.data.host, options.data.port);
                                delete options.data.scheme;
                                delete options.data.user;
                                delete options.data.host;
                                delete options.data.host_type;
                                delete options.data.port;
                              },
        function() {
                                options.data.uri = new options.SIP.URI(options.data.scheme, options.data.user, options.data.host, options.data.port, options.data.uri_params, options.data.uri_headers);
                                delete options.data.scheme;
                                delete options.data.user;
                                delete options.data.host;
                                delete options.data.host_type;
                                delete options.data.port;
                                delete options.data.uri_params;

                                if (options.startRule === 'SIP_URI') { options.data = options.data.uri;}
                              },
        "sips",
        peg$literalExpectation("sips", true),
        "sip",
        peg$literalExpectation("sip", true),
        function(uri_scheme) {
                            options.data.scheme = uri_scheme; },
        function() {
                            options.data.user = decodeURIComponent(text().slice(0, -1));},
        function() {
                            options.data.password = text(); },
        function() {
                            options.data.host = text();
                            return options.data.host; },
        function() {
                          options.data.host_type = 'domain';
                          return text(); },
        /^[a-zA-Z0-9_\-]/,
        peg$classExpectation([["a", "z"], ["A", "Z"], ["0", "9"], "_", "-"], false, false),
        /^[a-zA-Z0-9\-]/,
        peg$classExpectation([["a", "z"], ["A", "Z"], ["0", "9"], "-"], false, false),
        function() {
                            options.data.host_type = 'IPv6';
                            return text(); },
        "::",
        peg$literalExpectation("::", false),
        function() {
                          options.data.host_type = 'IPv6';
                          return text(); },
        function() {
                            options.data.host_type = 'IPv4';
                            return text(); },
        "25",
        peg$literalExpectation("25", false),
        /^[0-5]/,
        peg$classExpectation([["0", "5"]], false, false),
        "2",
        peg$literalExpectation("2", false),
        /^[0-4]/,
        peg$classExpectation([["0", "4"]], false, false),
        "1",
        peg$literalExpectation("1", false),
        /^[1-9]/,
        peg$classExpectation([["1", "9"]], false, false),
        function(port) {
                            port = parseInt(port.join(''));
                            options.data.port = port;
                            return port; },
        "transport=",
        peg$literalExpectation("transport=", true),
        "udp",
        peg$literalExpectation("udp", true),
        "tcp",
        peg$literalExpectation("tcp", true),
        "sctp",
        peg$literalExpectation("sctp", true),
        "tls",
        peg$literalExpectation("tls", true),
        function(transport) {
                              if(!options.data.uri_params) options.data.uri_params={};
                              options.data.uri_params['transport'] = transport.toLowerCase(); },
        "user=",
        peg$literalExpectation("user=", true),
        "phone",
        peg$literalExpectation("phone", true),
        "ip",
        peg$literalExpectation("ip", true),
        function(user) {
                              if(!options.data.uri_params) options.data.uri_params={};
                              options.data.uri_params['user'] = user.toLowerCase(); },
        "method=",
        peg$literalExpectation("method=", true),
        function(method) {
                              if(!options.data.uri_params) options.data.uri_params={};
                              options.data.uri_params['method'] = method; },
        "ttl=",
        peg$literalExpectation("ttl=", true),
        function(ttl) {
                              if(!options.data.params) options.data.params={};
                              options.data.params['ttl'] = ttl; },
        "maddr=",
        peg$literalExpectation("maddr=", true),
        function(maddr) {
                              if(!options.data.uri_params) options.data.uri_params={};
                              options.data.uri_params['maddr'] = maddr; },
        "lr",
        peg$literalExpectation("lr", true),
        function() {
                              if(!options.data.uri_params) options.data.uri_params={};
                              options.data.uri_params['lr'] = undefined; },
        function(param, value) {
                              if(!options.data.uri_params) options.data.uri_params = {};
                              if (value === null){
                                value = undefined;
                              }
                              else {
                                value = value[1];
                              }
                              options.data.uri_params[param.toLowerCase()] = value && value.toLowerCase();},
        function(hname, hvalue) {
                              hname = hname.join('').toLowerCase();
                              hvalue = hvalue.join('');
                              if(!options.data.uri_headers) options.data.uri_headers = {};
                              if (!options.data.uri_headers[hname]) {
                                options.data.uri_headers[hname] = [hvalue];
                              } else {
                                options.data.uri_headers[hname].push(hvalue);
                              }},
        function() {
                              // lots of tests fail if this isn't guarded...
                              if (options.startRule === 'Refer_To') {
                                options.data.uri = new options.SIP.URI(options.data.scheme, options.data.user, options.data.host, options.data.port, options.data.uri_params, options.data.uri_headers);
                                delete options.data.scheme;
                                delete options.data.user;
                                delete options.data.host;
                                delete options.data.host_type;
                                delete options.data.port;
                                delete options.data.uri_params;
                              }
                            },
        "//",
        peg$literalExpectation("//", false),
        function() {
                            options.data.scheme= text(); },
        peg$literalExpectation("SIP", true),
        function() {
                            options.data.sip_version = text(); },
        "INVITE",
        peg$literalExpectation("INVITE", false),
        "ACK",
        peg$literalExpectation("ACK", false),
        "VXACH",
        peg$literalExpectation("VXACH", false),
        "OPTIONS",
        peg$literalExpectation("OPTIONS", false),
        "BYE",
        peg$literalExpectation("BYE", false),
        "CANCEL",
        peg$literalExpectation("CANCEL", false),
        "REGISTER",
        peg$literalExpectation("REGISTER", false),
        "SUBSCRIBE",
        peg$literalExpectation("SUBSCRIBE", false),
        "NOTIFY",
        peg$literalExpectation("NOTIFY", false),
        "REFER",
        peg$literalExpectation("REFER", false),
        "PUBLISH",
        peg$literalExpectation("PUBLISH", false),
        function() {

                            options.data.method = text();
                            return options.data.method; },
        function(status_code) {
                          options.data.status_code = parseInt(status_code.join('')); },
        function() {
                          options.data.reason_phrase = text(); },
        function() {
                      options.data = text(); },
        function() {
                                var idx, length;
                                length = options.data.multi_header.length;
                                for (idx = 0; idx < length; idx++) {
                                  if (options.data.multi_header[idx].parsed === null) {
                                    options.data = null;
                                    break;
                                  }
                                }
                                if (options.data !== null) {
                                  options.data = options.data.multi_header;
                                } else {
                                  options.data = -1;
                                }},
        function() {
                                var header;
                                if(!options.data.multi_header) options.data.multi_header = [];
                                try {
                                  header = new options.SIP.NameAddrHeader(options.data.uri, options.data.displayName, options.data.params);
                                  delete options.data.uri;
                                  delete options.data.displayName;
                                  delete options.data.params;
                                } catch(e) {
                                  header = null;
                                }
                                options.data.multi_header.push( { 'position': peg$currPos,
                                                          'offset': location().start.offset,
                                                          'parsed': header
                                                        });},
        function(displayName) {
                                displayName = text().trim();
                                if (displayName[0] === '\"') {
                                  displayName = displayName.substring(1, displayName.length-1);
                                }
                                options.data.displayName = displayName; },
        "q",
        peg$literalExpectation("q", true),
        function(q) {
                                if(!options.data.params) options.data.params = {};
                                options.data.params['q'] = q; },
        "expires",
        peg$literalExpectation("expires", true),
        function(expires) {
                                if(!options.data.params) options.data.params = {};
                                options.data.params['expires'] = expires; },
        function(delta_seconds) {
                                return parseInt(delta_seconds.join('')); },
        "0",
        peg$literalExpectation("0", false),
        function() {
                                return parseFloat(text()); },
        function(param, value) {
                                if(!options.data.params) options.data.params = {};
                                if (value === null){
                                  value = undefined;
                                }
                                else {
                                  value = value[1];
                                }
                                options.data.params[param.toLowerCase()] = value;},
        "render",
        peg$literalExpectation("render", true),
        "session",
        peg$literalExpectation("session", true),
        "icon",
        peg$literalExpectation("icon", true),
        "alert",
        peg$literalExpectation("alert", true),
        function() {
                                    if (options.startRule === 'Content_Disposition') {
                                      options.data.type = text().toLowerCase();
                                    }
                                  },
        "handling",
        peg$literalExpectation("handling", true),
        "optional",
        peg$literalExpectation("optional", true),
        "required",
        peg$literalExpectation("required", true),
        function(length) {
                                options.data = parseInt(length.join('')); },
        function() {
                                options.data = text(); },
        "text",
        peg$literalExpectation("text", true),
        "image",
        peg$literalExpectation("image", true),
        "audio",
        peg$literalExpectation("audio", true),
        "video",
        peg$literalExpectation("video", true),
        "application",
        peg$literalExpectation("application", true),
        "message",
        peg$literalExpectation("message", true),
        "multipart",
        peg$literalExpectation("multipart", true),
        "x-",
        peg$literalExpectation("x-", true),
        function(cseq_value) {
                          options.data.value=parseInt(cseq_value.join('')); },
        function(expires) {options.data = expires; },
        function(event_type) {
                               options.data.event = event_type.toLowerCase(); },
        function() {
                        var tag = options.data.tag;
                          options.data = new options.SIP.NameAddrHeader(options.data.uri, options.data.displayName, options.data.params);
                          if (tag) {options.data.setParam('tag',tag)}
                        },
        "tag",
        peg$literalExpectation("tag", true),
        function(tag) {options.data.tag = tag; },
        function(forwards) {
                          options.data = parseInt(forwards.join('')); },
        function(min_expires) {options.data = min_expires; },
        function() {
                                options.data = new options.SIP.NameAddrHeader(options.data.uri, options.data.displayName, options.data.params);
                              },
        "digest",
        peg$literalExpectation("Digest", true),
        "realm",
        peg$literalExpectation("realm", true),
        function(realm) { options.data.realm = realm; },
        "domain",
        peg$literalExpectation("domain", true),
        "nonce",
        peg$literalExpectation("nonce", true),
        function(nonce) { options.data.nonce=nonce; },
        "opaque",
        peg$literalExpectation("opaque", true),
        function(opaque) { options.data.opaque=opaque; },
        "stale",
        peg$literalExpectation("stale", true),
        "true",
        peg$literalExpectation("true", true),
        function() { options.data.stale=true; },
        "false",
        peg$literalExpectation("false", true),
        function() { options.data.stale=false; },
        "algorithm",
        peg$literalExpectation("algorithm", true),
        "md5",
        peg$literalExpectation("MD5", true),
        "md5-sess",
        peg$literalExpectation("MD5-sess", true),
        function(algorithm) {
                              options.data.algorithm=algorithm.toUpperCase(); },
        "qop",
        peg$literalExpectation("qop", true),
        "auth-int",
        peg$literalExpectation("auth-int", true),
        "auth",
        peg$literalExpectation("auth", true),
        function(qop_value) {
                                options.data.qop || (options.data.qop=[]);
                                options.data.qop.push(qop_value.toLowerCase()); },
        function(rack_value) {
                          options.data.value=parseInt(rack_value.join('')); },
        function() {
                          var idx, length;
                          length = options.data.multi_header.length;
                          for (idx = 0; idx < length; idx++) {
                            if (options.data.multi_header[idx].parsed === null) {
                              options.data = null;
                              break;
                            }
                          }
                          if (options.data !== null) {
                            options.data = options.data.multi_header;
                          } else {
                            options.data = -1;
                          }},
        function() {
                          var header;
                          if(!options.data.multi_header) options.data.multi_header = [];
                          try {
                            header = new options.SIP.NameAddrHeader(options.data.uri, options.data.displayName, options.data.params);
                            delete options.data.uri;
                            delete options.data.displayName;
                            delete options.data.params;
                          } catch(e) {
                            header = null;
                          }
                          options.data.multi_header.push( { 'position': peg$currPos,
                                                    'offset': location().start.offset,
                                                    'parsed': header
                                                  });},
        function() {
                      options.data = new options.SIP.NameAddrHeader(options.data.uri, options.data.displayName, options.data.params);
                    },
        function() {
                              if (!(options.data.replaces_from_tag && options.data.replaces_to_tag)) {
                                options.data = -1;
                              }
                            },
        function() {
                              options.data = {
                                call_id: options.data
                              };
                            },
        "from-tag",
        peg$literalExpectation("from-tag", true),
        function(from_tag) {
                              options.data.replaces_from_tag = from_tag;
                            },
        "to-tag",
        peg$literalExpectation("to-tag", true),
        function(to_tag) {
                              options.data.replaces_to_tag = to_tag;
                            },
        "early-only",
        peg$literalExpectation("early-only", true),
        function() {
                              options.data.early_only = true;
                            },
        function(head, r) {return r;},
        function(head, tail) { return list(head, tail); },
        function(value) {
                        if (options.startRule === 'Require') {
                          options.data = value || [];
                        }
                      },
        function(rseq_value) {
                          options.data.value=parseInt(rseq_value.join('')); },
        "active",
        peg$literalExpectation("active", true),
        "pending",
        peg$literalExpectation("pending", true),
        "terminated",
        peg$literalExpectation("terminated", true),
        function() {
                                options.data.state = text(); },
        "reason",
        peg$literalExpectation("reason", true),
        function(reason) {
                                if (typeof reason !== 'undefined') options.data.reason = reason; },
        function(expires) {
                                if (typeof expires !== 'undefined') options.data.expires = expires; },
        "retry_after",
        peg$literalExpectation("retry_after", true),
        function(retry_after) {
                                if (typeof retry_after !== 'undefined') options.data.retry_after = retry_after; },
        "deactivated",
        peg$literalExpectation("deactivated", true),
        "probation",
        peg$literalExpectation("probation", true),
        "rejected",
        peg$literalExpectation("rejected", true),
        "timeout",
        peg$literalExpectation("timeout", true),
        "giveup",
        peg$literalExpectation("giveup", true),
        "noresource",
        peg$literalExpectation("noresource", true),
        "invariant",
        peg$literalExpectation("invariant", true),
        function(value) {
                        if (options.startRule === 'Supported') {
                          options.data = value || [];
                        }
                      },
        function() {
                      var tag = options.data.tag;
                        options.data = new options.SIP.NameAddrHeader(options.data.uri, options.data.displayName, options.data.params);
                        if (tag) {options.data.setParam('tag',tag)}
                      },
        "ttl",
        peg$literalExpectation("ttl", true),
        function(via_ttl_value) {
                              options.data.ttl = via_ttl_value; },
        "maddr",
        peg$literalExpectation("maddr", true),
        function(via_maddr) {
                              options.data.maddr = via_maddr; },
        "received",
        peg$literalExpectation("received", true),
        function(via_received) {
                              options.data.received = via_received; },
        "branch",
        peg$literalExpectation("branch", true),
        function(via_branch) {
                              options.data.branch = via_branch; },
        "rport",
        peg$literalExpectation("rport", true),
        function() {
                              if(typeof response_port !== 'undefined')
                                options.data.rport = response_port.join(''); },
        function(via_protocol) {
                              options.data.protocol = via_protocol; },
        peg$literalExpectation("UDP", true),
        peg$literalExpectation("TCP", true),
        peg$literalExpectation("TLS", true),
        peg$literalExpectation("SCTP", true),
        function(via_transport) {
                              options.data.transport = via_transport; },
        function() {
                              options.data.host = text(); },
        function(via_sent_by_port) {
                              options.data.port = parseInt(via_sent_by_port.join('')); },
        function(ttl) {
                              return parseInt(ttl.join('')); },
        function(deltaSeconds) {
                              if (options.startRule === 'Session_Expires') {
                                options.data.deltaSeconds = deltaSeconds;
                              }
                            },
        "refresher",
        peg$literalExpectation("refresher", false),
        "uas",
        peg$literalExpectation("uas", false),
        "uac",
        peg$literalExpectation("uac", false),
        function(endpoint) {
                              if (options.startRule === 'Session_Expires') {
                                options.data.refresher = endpoint;
                              }
                            },
        function(deltaSeconds) {
                              if (options.startRule === 'Min_SE') {
                                options.data = deltaSeconds;
                              }
                            },
        "stuns",
        peg$literalExpectation("stuns", true),
        "stun",
        peg$literalExpectation("stun", true),
        function(scheme) {
                              options.data.scheme = scheme; },
        function(host) {
                              options.data.host = host; },
        "?transport=",
        peg$literalExpectation("?transport=", false),
        "turns",
        peg$literalExpectation("turns", true),
        "turn",
        peg$literalExpectation("turn", true),
        function() {
                              options.data.transport = transport; },
        function() {
                          options.data = text(); },
        "Referred-By",
        peg$literalExpectation("Referred-By", false),
        "b",
        peg$literalExpectation("b", false),
        "cid",
        peg$literalExpectation("cid", false)
      ],

      peg$bytecode = [
        peg$decode("2 \"\"6 7!"),
        peg$decode("4\"\"\"5!7#"),
        peg$decode("4$\"\"5!7%"),
        peg$decode("4&\"\"5!7'"),
        peg$decode(";'.# &;("),
        peg$decode("4(\"\"5!7)"),
        peg$decode("4*\"\"5!7+"),
        peg$decode("2,\"\"6,7-"),
        peg$decode("2.\"\"6.7/"),
        peg$decode("40\"\"5!71"),
        peg$decode("22\"\"6273.\x89 &24\"\"6475.} &26\"\"6677.q &28\"\"6879.e &2:\"\"6:7;.Y &2<\"\"6<7=.M &2>\"\"6>7?.A &2@\"\"6@7A.5 &2B\"\"6B7C.) &2D\"\"6D7E"),
        peg$decode(";).# &;,"),
        peg$decode("2F\"\"6F7G.} &2H\"\"6H7I.q &2J\"\"6J7K.e &2L\"\"6L7M.Y &2N\"\"6N7O.M &2P\"\"6P7Q.A &2R\"\"6R7S.5 &2T\"\"6T7U.) &2V\"\"6V7W"),
        peg$decode("%%2X\"\"6X7Y/5#;#/,$;#/#$+#)(#'#(\"'#&'#/\"!&,)"),
        peg$decode("%%$;$0#*;$&/,#; /#$+\")(\"'#&'#.\" &\"/=#$;$/&#0#*;$&&&#/'$8\":Z\" )(\"'#&'#"),
        peg$decode(";..\" &\""),
        peg$decode("%$;'.# &;(0)*;'.# &;(&/?#28\"\"6879/0$;//'$8#:[# )(#'#(\"'#&'#"),
        peg$decode("%%$;2/&#0#*;2&&&#/g#$%$;.0#*;.&/,#;2/#$+\")(\"'#&'#0=*%$;.0#*;.&/,#;2/#$+\")(\"'#&'#&/#$+\")(\"'#&'#/\"!&,)"),
        peg$decode("4\\\"\"5!7].# &;3"),
        peg$decode("4^\"\"5!7_"),
        peg$decode("4`\"\"5!7a"),
        peg$decode(";!.) &4b\"\"5!7c"),
        peg$decode("%$;).\x95 &2F\"\"6F7G.\x89 &2J\"\"6J7K.} &2L\"\"6L7M.q &2X\"\"6X7Y.e &2P\"\"6P7Q.Y &2H\"\"6H7I.M &2@\"\"6@7A.A &2d\"\"6d7e.5 &2R\"\"6R7S.) &2N\"\"6N7O/\x9E#0\x9B*;).\x95 &2F\"\"6F7G.\x89 &2J\"\"6J7K.} &2L\"\"6L7M.q &2X\"\"6X7Y.e &2P\"\"6P7Q.Y &2H\"\"6H7I.M &2@\"\"6@7A.A &2d\"\"6d7e.5 &2R\"\"6R7S.) &2N\"\"6N7O&&&#/\"!&,)"),
        peg$decode("%$;).\x89 &2F\"\"6F7G.} &2L\"\"6L7M.q &2X\"\"6X7Y.e &2P\"\"6P7Q.Y &2H\"\"6H7I.M &2@\"\"6@7A.A &2d\"\"6d7e.5 &2R\"\"6R7S.) &2N\"\"6N7O/\x92#0\x8F*;).\x89 &2F\"\"6F7G.} &2L\"\"6L7M.q &2X\"\"6X7Y.e &2P\"\"6P7Q.Y &2H\"\"6H7I.M &2@\"\"6@7A.A &2d\"\"6d7e.5 &2R\"\"6R7S.) &2N\"\"6N7O&&&#/\"!&,)"),
        peg$decode("2T\"\"6T7U.\xE3 &2V\"\"6V7W.\xD7 &2f\"\"6f7g.\xCB &2h\"\"6h7i.\xBF &2:\"\"6:7;.\xB3 &2D\"\"6D7E.\xA7 &22\"\"6273.\x9B &28\"\"6879.\x8F &2j\"\"6j7k.\x83 &;&.} &24\"\"6475.q &2l\"\"6l7m.e &2n\"\"6n7o.Y &26\"\"6677.M &2>\"\"6>7?.A &2p\"\"6p7q.5 &2r\"\"6r7s.) &;'.# &;("),
        peg$decode("%$;).\u012B &2F\"\"6F7G.\u011F &2J\"\"6J7K.\u0113 &2L\"\"6L7M.\u0107 &2X\"\"6X7Y.\xFB &2P\"\"6P7Q.\xEF &2H\"\"6H7I.\xE3 &2@\"\"6@7A.\xD7 &2d\"\"6d7e.\xCB &2R\"\"6R7S.\xBF &2N\"\"6N7O.\xB3 &2T\"\"6T7U.\xA7 &2V\"\"6V7W.\x9B &2f\"\"6f7g.\x8F &2h\"\"6h7i.\x83 &28\"\"6879.w &2j\"\"6j7k.k &;&.e &24\"\"6475.Y &2l\"\"6l7m.M &2n\"\"6n7o.A &26\"\"6677.5 &2p\"\"6p7q.) &2r\"\"6r7s/\u0134#0\u0131*;).\u012B &2F\"\"6F7G.\u011F &2J\"\"6J7K.\u0113 &2L\"\"6L7M.\u0107 &2X\"\"6X7Y.\xFB &2P\"\"6P7Q.\xEF &2H\"\"6H7I.\xE3 &2@\"\"6@7A.\xD7 &2d\"\"6d7e.\xCB &2R\"\"6R7S.\xBF &2N\"\"6N7O.\xB3 &2T\"\"6T7U.\xA7 &2V\"\"6V7W.\x9B &2f\"\"6f7g.\x8F &2h\"\"6h7i.\x83 &28\"\"6879.w &2j\"\"6j7k.k &;&.e &24\"\"6475.Y &2l\"\"6l7m.M &2n\"\"6n7o.A &26\"\"6677.5 &2p\"\"6p7q.) &2r\"\"6r7s&&&#/\"!&,)"),
        peg$decode("%;//?#2P\"\"6P7Q/0$;//'$8#:t# )(#'#(\"'#&'#"),
        peg$decode("%;//?#24\"\"6475/0$;//'$8#:u# )(#'#(\"'#&'#"),
        peg$decode("%;//?#2>\"\"6>7?/0$;//'$8#:v# )(#'#(\"'#&'#"),
        peg$decode("%;//?#2T\"\"6T7U/0$;//'$8#:w# )(#'#(\"'#&'#"),
        peg$decode("%;//?#2V\"\"6V7W/0$;//'$8#:x# )(#'#(\"'#&'#"),
        peg$decode("%2h\"\"6h7i/0#;//'$8\":y\" )(\"'#&'#"),
        peg$decode("%;//6#2f\"\"6f7g/'$8\":z\" )(\"'#&'#"),
        peg$decode("%;//?#2D\"\"6D7E/0$;//'$8#:{# )(#'#(\"'#&'#"),
        peg$decode("%;//?#22\"\"6273/0$;//'$8#:|# )(#'#(\"'#&'#"),
        peg$decode("%;//?#28\"\"6879/0$;//'$8#:}# )(#'#(\"'#&'#"),
        peg$decode("%;//0#;&/'$8\":~\" )(\"'#&'#"),
        peg$decode("%;&/0#;//'$8\":~\" )(\"'#&'#"),
        peg$decode("%;=/T#$;G.) &;K.# &;F0/*;G.) &;K.# &;F&/,$;>/#$+#)(#'#(\"'#&'#"),
        peg$decode("4\x7F\"\"5!7\x80.A &4\x81\"\"5!7\x82.5 &4\x83\"\"5!7\x84.) &;3.# &;."),
        peg$decode("%%;//Q#;&/H$$;J.# &;K0)*;J.# &;K&/,$;&/#$+$)($'#(#'#(\"'#&'#/\"!&,)"),
        peg$decode("%;//]#;&/T$%$;J.# &;K0)*;J.# &;K&/\"!&,)/1$;&/($8$:\x85$!!)($'#(#'#(\"'#&'#"),
        peg$decode(";..G &2L\"\"6L7M.; &4\x86\"\"5!7\x87./ &4\x83\"\"5!7\x84.# &;3"),
        peg$decode("%2j\"\"6j7k/J#4\x88\"\"5!7\x89.5 &4\x8A\"\"5!7\x8B.) &4\x8C\"\"5!7\x8D/#$+\")(\"'#&'#"),
        peg$decode("%;N/M#28\"\"6879/>$;O.\" &\"/0$;S/'$8$:\x8E$ )($'#(#'#(\"'#&'#"),
        peg$decode("%;N/d#28\"\"6879/U$;O.\" &\"/G$;S/>$;_/5$;l.\" &\"/'$8&:\x8F& )(&'#(%'#($'#(#'#(\"'#&'#"),
        peg$decode("%3\x90\"\"5$7\x91.) &3\x92\"\"5#7\x93/' 8!:\x94!! )"),
        peg$decode("%;P/]#%28\"\"6879/,#;R/#$+\")(\"'#&'#.\" &\"/6$2:\"\"6:7;/'$8#:\x95# )(#'#(\"'#&'#"),
        peg$decode("$;+.) &;-.# &;Q/2#0/*;+.) &;-.# &;Q&&&#"),
        peg$decode("2<\"\"6<7=.q &2>\"\"6>7?.e &2@\"\"6@7A.Y &2B\"\"6B7C.M &2D\"\"6D7E.A &22\"\"6273.5 &26\"\"6677.) &24\"\"6475"),
        peg$decode("%$;+._ &;-.Y &2<\"\"6<7=.M &2>\"\"6>7?.A &2@\"\"6@7A.5 &2B\"\"6B7C.) &2D\"\"6D7E0e*;+._ &;-.Y &2<\"\"6<7=.M &2>\"\"6>7?.A &2@\"\"6@7A.5 &2B\"\"6B7C.) &2D\"\"6D7E&/& 8!:\x96! )"),
        peg$decode("%;T/J#%28\"\"6879/,#;^/#$+\")(\"'#&'#.\" &\"/#$+\")(\"'#&'#"),
        peg$decode("%;U.) &;\\.# &;X/& 8!:\x97! )"),
        peg$decode("%$%;V/2#2J\"\"6J7K/#$+\")(\"'#&'#0<*%;V/2#2J\"\"6J7K/#$+\")(\"'#&'#&/D#;W/;$2J\"\"6J7K.\" &\"/'$8#:\x98# )(#'#(\"'#&'#"),
        peg$decode("$4\x99\"\"5!7\x9A/,#0)*4\x99\"\"5!7\x9A&&&#"),
        peg$decode("%4$\"\"5!7%/?#$4\x9B\"\"5!7\x9C0)*4\x9B\"\"5!7\x9C&/#$+\")(\"'#&'#"),
        peg$decode("%2l\"\"6l7m/?#;Y/6$2n\"\"6n7o/'$8#:\x9D# )(#'#(\"'#&'#"),
        peg$decode("%%;Z/\xB3#28\"\"6879/\xA4$;Z/\x9B$28\"\"6879/\x8C$;Z/\x83$28\"\"6879/t$;Z/k$28\"\"6879/\\$;Z/S$28\"\"6879/D$;Z/;$28\"\"6879/,$;[/#$+-)(-'#(,'#(+'#(*'#()'#(('#(''#(&'#(%'#($'#(#'#(\"'#&'#.\u0790 &%2\x9E\"\"6\x9E7\x9F/\xA4#;Z/\x9B$28\"\"6879/\x8C$;Z/\x83$28\"\"6879/t$;Z/k$28\"\"6879/\\$;Z/S$28\"\"6879/D$;Z/;$28\"\"6879/,$;[/#$+,)(,'#(+'#(*'#()'#(('#(''#(&'#(%'#($'#(#'#(\"'#&'#.\u06F9 &%2\x9E\"\"6\x9E7\x9F/\x8C#;Z/\x83$28\"\"6879/t$;Z/k$28\"\"6879/\\$;Z/S$28\"\"6879/D$;Z/;$28\"\"6879/,$;[/#$+*)(*'#()'#(('#(''#(&'#(%'#($'#(#'#(\"'#&'#.\u067A &%2\x9E\"\"6\x9E7\x9F/t#;Z/k$28\"\"6879/\\$;Z/S$28\"\"6879/D$;Z/;$28\"\"6879/,$;[/#$+()(('#(''#(&'#(%'#($'#(#'#(\"'#&'#.\u0613 &%2\x9E\"\"6\x9E7\x9F/\\#;Z/S$28\"\"6879/D$;Z/;$28\"\"6879/,$;[/#$+&)(&'#(%'#($'#(#'#(\"'#&'#.\u05C4 &%2\x9E\"\"6\x9E7\x9F/D#;Z/;$28\"\"6879/,$;[/#$+$)($'#(#'#(\"'#&'#.\u058D &%2\x9E\"\"6\x9E7\x9F/,#;[/#$+\")(\"'#&'#.\u056E &%2\x9E\"\"6\x9E7\x9F/,#;Z/#$+\")(\"'#&'#.\u054F &%;Z/\x9B#2\x9E\"\"6\x9E7\x9F/\x8C$;Z/\x83$28\"\"6879/t$;Z/k$28\"\"6879/\\$;Z/S$28\"\"6879/D$;Z/;$28\"\"6879/,$;[/#$++)(+'#(*'#()'#(('#(''#(&'#(%'#($'#(#'#(\"'#&'#.\u04C7 &%;Z/\xAA#%28\"\"6879/,#;Z/#$+\")(\"'#&'#.\" &\"/\x83$2\x9E\"\"6\x9E7\x9F/t$;Z/k$28\"\"6879/\\$;Z/S$28\"\"6879/D$;Z/;$28\"\"6879/,$;[/#$+*)(*'#()'#(('#(''#(&'#(%'#($'#(#'#(\"'#&'#.\u0430 &%;Z/\xB9#%28\"\"6879/,#;Z/#$+\")(\"'#&'#.\" &\"/\x92$%28\"\"6879/,#;Z/#$+\")(\"'#&'#.\" &\"/k$2\x9E\"\"6\x9E7\x9F/\\$;Z/S$28\"\"6879/D$;Z/;$28\"\"6879/,$;[/#$+))()'#(('#(''#(&'#(%'#($'#(#'#(\"'#&'#.\u038A &%;Z/\xC8#%28\"\"6879/,#;Z/#$+\")(\"'#&'#.\" &\"/\xA1$%28\"\"6879/,#;Z/#$+\")(\"'#&'#.\" &\"/z$%28\"\"6879/,#;Z/#$+\")(\"'#&'#.\" &\"/S$2\x9E\"\"6\x9E7\x9F/D$;Z/;$28\"\"6879/,$;[/#$+()(('#(''#(&'#(%'#($'#(#'#(\"'#&'#.\u02D5 &%;Z/\xD7#%28\"\"6879/,#;Z/#$+\")(\"'#&'#.\" &\"/\xB0$%28\"\"6879/,#;Z/#$+\")(\"'#&'#.\" &\"/\x89$%28\"\"6879/,#;Z/#$+\")(\"'#&'#.\" &\"/b$%28\"\"6879/,#;Z/#$+\")(\"'#&'#.\" &\"/;$2\x9E\"\"6\x9E7\x9F/,$;[/#$+')(''#(&'#(%'#($'#(#'#(\"'#&'#.\u0211 &%;Z/\xFE#%28\"\"6879/,#;Z/#$+\")(\"'#&'#.\" &\"/\xD7$%28\"\"6879/,#;Z/#$+\")(\"'#&'#.\" &\"/\xB0$%28\"\"6879/,#;Z/#$+\")(\"'#&'#.\" &\"/\x89$%28\"\"6879/,#;Z/#$+\")(\"'#&'#.\" &\"/b$%28\"\"6879/,#;Z/#$+\")(\"'#&'#.\" &\"/;$2\x9E\"\"6\x9E7\x9F/,$;Z/#$+()(('#(''#(&'#(%'#($'#(#'#(\"'#&'#.\u0126 &%;Z/\u011C#%28\"\"6879/,#;Z/#$+\")(\"'#&'#.\" &\"/\xF5$%28\"\"6879/,#;Z/#$+\")(\"'#&'#.\" &\"/\xCE$%28\"\"6879/,#;Z/#$+\")(\"'#&'#.\" &\"/\xA7$%28\"\"6879/,#;Z/#$+\")(\"'#&'#.\" &\"/\x80$%28\"\"6879/,#;Z/#$+\")(\"'#&'#.\" &\"/Y$%28\"\"6879/,#;Z/#$+\")(\"'#&'#.\" &\"/2$2\x9E\"\"6\x9E7\x9F/#$+()(('#(''#(&'#(%'#($'#(#'#(\"'#&'#/& 8!:\xA0! )"),
        peg$decode("%;#/M#;#.\" &\"/?$;#.\" &\"/1$;#.\" &\"/#$+$)($'#(#'#(\"'#&'#"),
        peg$decode("%;Z/;#28\"\"6879/,$;Z/#$+#)(#'#(\"'#&'#.# &;\\"),
        peg$decode("%;]/o#2J\"\"6J7K/`$;]/W$2J\"\"6J7K/H$;]/?$2J\"\"6J7K/0$;]/'$8':\xA1' )(''#(&'#(%'#($'#(#'#(\"'#&'#"),
        peg$decode("%2\xA2\"\"6\xA27\xA3/2#4\xA4\"\"5!7\xA5/#$+\")(\"'#&'#.\x98 &%2\xA6\"\"6\xA67\xA7/;#4\xA8\"\"5!7\xA9/,$;!/#$+#)(#'#(\"'#&'#.j &%2\xAA\"\"6\xAA7\xAB/5#;!/,$;!/#$+#)(#'#(\"'#&'#.B &%4\xAC\"\"5!7\xAD/,#;!/#$+\")(\"'#&'#.# &;!"),
        peg$decode("%%;!.\" &\"/[#;!.\" &\"/M$;!.\" &\"/?$;!.\" &\"/1$;!.\" &\"/#$+%)(%'#($'#(#'#(\"'#&'#/' 8!:\xAE!! )"),
        peg$decode("$%22\"\"6273/,#;`/#$+\")(\"'#&'#0<*%22\"\"6273/,#;`/#$+\")(\"'#&'#&"),
        peg$decode(";a.A &;b.; &;c.5 &;d./ &;e.) &;f.# &;g"),
        peg$decode("%3\xAF\"\"5*7\xB0/a#3\xB1\"\"5#7\xB2.G &3\xB3\"\"5#7\xB4.; &3\xB5\"\"5$7\xB6./ &3\xB7\"\"5#7\xB8.# &;6/($8\":\xB9\"! )(\"'#&'#"),
        peg$decode("%3\xBA\"\"5%7\xBB/I#3\xBC\"\"5%7\xBD./ &3\xBE\"\"5\"7\xBF.# &;6/($8\":\xC0\"! )(\"'#&'#"),
        peg$decode("%3\xC1\"\"5'7\xC2/1#;\x90/($8\":\xC3\"! )(\"'#&'#"),
        peg$decode("%3\xC4\"\"5$7\xC5/1#;\xF0/($8\":\xC6\"! )(\"'#&'#"),
        peg$decode("%3\xC7\"\"5&7\xC8/1#;T/($8\":\xC9\"! )(\"'#&'#"),
        peg$decode("%3\xCA\"\"5\"7\xCB/N#%2>\"\"6>7?/,#;6/#$+\")(\"'#&'#.\" &\"/'$8\":\xCC\" )(\"'#&'#"),
        peg$decode("%;h/P#%2>\"\"6>7?/,#;i/#$+\")(\"'#&'#.\" &\"/)$8\":\xCD\"\"! )(\"'#&'#"),
        peg$decode("%$;j/&#0#*;j&&&#/\"!&,)"),
        peg$decode("%$;j/&#0#*;j&&&#/\"!&,)"),
        peg$decode(";k.) &;+.# &;-"),
        peg$decode("2l\"\"6l7m.e &2n\"\"6n7o.Y &24\"\"6475.M &28\"\"6879.A &2<\"\"6<7=.5 &2@\"\"6@7A.) &2B\"\"6B7C"),
        peg$decode("%26\"\"6677/n#;m/e$$%2<\"\"6<7=/,#;m/#$+\")(\"'#&'#0<*%2<\"\"6<7=/,#;m/#$+\")(\"'#&'#&/#$+#)(#'#(\"'#&'#"),
        peg$decode("%;n/A#2>\"\"6>7?/2$;o/)$8#:\xCE#\"\" )(#'#(\"'#&'#"),
        peg$decode("$;p.) &;+.# &;-/2#0/*;p.) &;+.# &;-&&&#"),
        peg$decode("$;p.) &;+.# &;-0/*;p.) &;+.# &;-&"),
        peg$decode("2l\"\"6l7m.e &2n\"\"6n7o.Y &24\"\"6475.M &26\"\"6677.A &28\"\"6879.5 &2@\"\"6@7A.) &2B\"\"6B7C"),
        peg$decode(";\x91.# &;r"),
        peg$decode("%;\x90/G#;'/>$;s/5$;'/,$;\x84/#$+%)(%'#($'#(#'#(\"'#&'#"),
        peg$decode(";M.# &;t"),
        peg$decode("%;\x7F/E#28\"\"6879/6$;u.# &;x/'$8#:\xCF# )(#'#(\"'#&'#"),
        peg$decode("%;v.# &;w/J#%26\"\"6677/,#;\x83/#$+\")(\"'#&'#.\" &\"/#$+\")(\"'#&'#"),
        peg$decode("%2\xD0\"\"6\xD07\xD1/:#;\x80/1$;w.\" &\"/#$+#)(#'#(\"'#&'#"),
        peg$decode("%24\"\"6475/,#;{/#$+\")(\"'#&'#"),
        peg$decode("%;z/3#$;y0#*;y&/#$+\")(\"'#&'#"),
        peg$decode(";*.) &;+.# &;-"),
        peg$decode(";+.\x8F &;-.\x89 &22\"\"6273.} &26\"\"6677.q &28\"\"6879.e &2:\"\"6:7;.Y &2<\"\"6<7=.M &2>\"\"6>7?.A &2@\"\"6@7A.5 &2B\"\"6B7C.) &2D\"\"6D7E"),
        peg$decode("%;|/e#$%24\"\"6475/,#;|/#$+\")(\"'#&'#0<*%24\"\"6475/,#;|/#$+\")(\"'#&'#&/#$+\")(\"'#&'#"),
        peg$decode("%$;~0#*;~&/e#$%22\"\"6273/,#;}/#$+\")(\"'#&'#0<*%22\"\"6273/,#;}/#$+\")(\"'#&'#&/#$+\")(\"'#&'#"),
        peg$decode("$;~0#*;~&"),
        peg$decode(";+.w &;-.q &28\"\"6879.e &2:\"\"6:7;.Y &2<\"\"6<7=.M &2>\"\"6>7?.A &2@\"\"6@7A.5 &2B\"\"6B7C.) &2D\"\"6D7E"),
        peg$decode("%%;\"/\x87#$;\".G &;!.A &2@\"\"6@7A.5 &2F\"\"6F7G.) &2J\"\"6J7K0M*;\".G &;!.A &2@\"\"6@7A.5 &2F\"\"6F7G.) &2J\"\"6J7K&/#$+\")(\"'#&'#/& 8!:\xD2! )"),
        peg$decode(";\x81.# &;\x82"),
        peg$decode("%%;O/2#2:\"\"6:7;/#$+\")(\"'#&'#.\" &\"/,#;S/#$+\")(\"'#&'#.\" &\""),
        peg$decode("$;+.\x83 &;-.} &2B\"\"6B7C.q &2D\"\"6D7E.e &22\"\"6273.Y &28\"\"6879.M &2:\"\"6:7;.A &2<\"\"6<7=.5 &2>\"\"6>7?.) &2@\"\"6@7A/\x8C#0\x89*;+.\x83 &;-.} &2B\"\"6B7C.q &2D\"\"6D7E.e &22\"\"6273.Y &28\"\"6879.M &2:\"\"6:7;.A &2<\"\"6<7=.5 &2>\"\"6>7?.) &2@\"\"6@7A&&&#"),
        peg$decode("$;y0#*;y&"),
        peg$decode("%3\x92\"\"5#7\xD3/q#24\"\"6475/b$$;!/&#0#*;!&&&#/L$2J\"\"6J7K/=$$;!/&#0#*;!&&&#/'$8%:\xD4% )(%'#($'#(#'#(\"'#&'#"),
        peg$decode("2\xD5\"\"6\xD57\xD6"),
        peg$decode("2\xD7\"\"6\xD77\xD8"),
        peg$decode("2\xD9\"\"6\xD97\xDA"),
        peg$decode("2\xDB\"\"6\xDB7\xDC"),
        peg$decode("2\xDD\"\"6\xDD7\xDE"),
        peg$decode("2\xDF\"\"6\xDF7\xE0"),
        peg$decode("2\xE1\"\"6\xE17\xE2"),
        peg$decode("2\xE3\"\"6\xE37\xE4"),
        peg$decode("2\xE5\"\"6\xE57\xE6"),
        peg$decode("2\xE7\"\"6\xE77\xE8"),
        peg$decode("2\xE9\"\"6\xE97\xEA"),
        peg$decode("%;\x85.Y &;\x86.S &;\x88.M &;\x89.G &;\x8A.A &;\x8B.; &;\x8C.5 &;\x8F./ &;\x8D.) &;\x8E.# &;6/& 8!:\xEB! )"),
        peg$decode("%;\x84/G#;'/>$;\x92/5$;'/,$;\x94/#$+%)(%'#($'#(#'#(\"'#&'#"),
        peg$decode("%;\x93/' 8!:\xEC!! )"),
        peg$decode("%;!/5#;!/,$;!/#$+#)(#'#(\"'#&'#"),
        peg$decode("%$;*.A &;+.; &;-.5 &;3./ &;4.) &;'.# &;(0G*;*.A &;+.; &;-.5 &;3./ &;4.) &;'.# &;(&/& 8!:\xED! )"),
        peg$decode("%;\xB6/Y#$%;A/,#;\xB6/#$+\")(\"'#&'#06*%;A/,#;\xB6/#$+\")(\"'#&'#&/#$+\")(\"'#&'#"),
        peg$decode("%;9/N#%2:\"\"6:7;/,#;9/#$+\")(\"'#&'#.\" &\"/'$8\":\xEE\" )(\"'#&'#"),
        peg$decode("%;:.c &%;\x98/Y#$%;A/,#;\x98/#$+\")(\"'#&'#06*%;A/,#;\x98/#$+\")(\"'#&'#&/#$+\")(\"'#&'#/& 8!:\xEF! )"),
        peg$decode("%;L.# &;\x99/]#$%;B/,#;\x9B/#$+\")(\"'#&'#06*%;B/,#;\x9B/#$+\")(\"'#&'#&/'$8\":\xF0\" )(\"'#&'#"),
        peg$decode("%;\x9A.\" &\"/>#;@/5$;M/,$;?/#$+$)($'#(#'#(\"'#&'#"),
        peg$decode("%%;6/Y#$%;./,#;6/#$+\")(\"'#&'#06*%;./,#;6/#$+\")(\"'#&'#&/#$+\")(\"'#&'#.# &;H/' 8!:\xF1!! )"),
        peg$decode(";\x9C.) &;\x9D.# &;\xA0"),
        peg$decode("%3\xF2\"\"5!7\xF3/:#;</1$;\x9F/($8#:\xF4#! )(#'#(\"'#&'#"),
        peg$decode("%3\xF5\"\"5'7\xF6/:#;</1$;\x9E/($8#:\xF7#! )(#'#(\"'#&'#"),
        peg$decode("%$;!/&#0#*;!&&&#/' 8!:\xF8!! )"),
        peg$decode("%2\xF9\"\"6\xF97\xFA/o#%2J\"\"6J7K/M#;!.\" &\"/?$;!.\" &\"/1$;!.\" &\"/#$+$)($'#(#'#(\"'#&'#.\" &\"/'$8\":\xFB\" )(\"'#&'#"),
        peg$decode("%;6/J#%;</,#;\xA1/#$+\")(\"'#&'#.\" &\"/)$8\":\xFC\"\"! )(\"'#&'#"),
        peg$decode(";6.) &;T.# &;H"),
        peg$decode("%;\xA3/Y#$%;B/,#;\xA4/#$+\")(\"'#&'#06*%;B/,#;\xA4/#$+\")(\"'#&'#&/#$+\")(\"'#&'#"),
        peg$decode("%3\xFD\"\"5&7\xFE.G &3\xFF\"\"5'7\u0100.; &3\u0101\"\"5$7\u0102./ &3\u0103\"\"5%7\u0104.# &;6/& 8!:\u0105! )"),
        peg$decode(";\xA5.# &;\xA0"),
        peg$decode("%3\u0106\"\"5(7\u0107/M#;</D$3\u0108\"\"5(7\u0109./ &3\u010A\"\"5(7\u010B.# &;6/#$+#)(#'#(\"'#&'#"),
        peg$decode("%;6/Y#$%;A/,#;6/#$+\")(\"'#&'#06*%;A/,#;6/#$+\")(\"'#&'#&/#$+\")(\"'#&'#"),
        peg$decode("%$;!/&#0#*;!&&&#/' 8!:\u010C!! )"),
        peg$decode("%;\xA9/& 8!:\u010D! )"),
        peg$decode("%;\xAA/k#;;/b$;\xAF/Y$$%;B/,#;\xB0/#$+\")(\"'#&'#06*%;B/,#;\xB0/#$+\")(\"'#&'#&/#$+$)($'#(#'#(\"'#&'#"),
        peg$decode(";\xAB.# &;\xAC"),
        peg$decode("3\u010E\"\"5$7\u010F.S &3\u0110\"\"5%7\u0111.G &3\u0112\"\"5%7\u0113.; &3\u0114\"\"5%7\u0115./ &3\u0116\"\"5+7\u0117.# &;\xAD"),
        peg$decode("3\u0118\"\"5'7\u0119./ &3\u011A\"\"5)7\u011B.# &;\xAD"),
        peg$decode(";6.# &;\xAE"),
        peg$decode("%3\u011C\"\"5\"7\u011D/,#;6/#$+\")(\"'#&'#"),
        peg$decode(";\xAD.# &;6"),
        peg$decode("%;6/5#;</,$;\xB1/#$+#)(#'#(\"'#&'#"),
        peg$decode(";6.# &;H"),
        peg$decode("%;\xB3/5#;./,$;\x90/#$+#)(#'#(\"'#&'#"),
        peg$decode("%$;!/&#0#*;!&&&#/' 8!:\u011E!! )"),
        peg$decode("%;\x9E/' 8!:\u011F!! )"),
        peg$decode("%;\xB6/^#$%;B/,#;\xA0/#$+\")(\"'#&'#06*%;B/,#;\xA0/#$+\")(\"'#&'#&/($8\":\u0120\"!!)(\"'#&'#"),
        peg$decode("%%;7/e#$%2J\"\"6J7K/,#;7/#$+\")(\"'#&'#0<*%2J\"\"6J7K/,#;7/#$+\")(\"'#&'#&/#$+\")(\"'#&'#/\"!&,)"),
        peg$decode("%;L.# &;\x99/]#$%;B/,#;\xB8/#$+\")(\"'#&'#06*%;B/,#;\xB8/#$+\")(\"'#&'#&/'$8\":\u0121\" )(\"'#&'#"),
        peg$decode(";\xB9.# &;\xA0"),
        peg$decode("%3\u0122\"\"5#7\u0123/:#;</1$;6/($8#:\u0124#! )(#'#(\"'#&'#"),
        peg$decode("%$;!/&#0#*;!&&&#/' 8!:\u0125!! )"),
        peg$decode("%;\x9E/' 8!:\u0126!! )"),
        peg$decode("%$;\x9A0#*;\x9A&/x#;@/o$;M/f$;?/]$$%;B/,#;\xA0/#$+\")(\"'#&'#06*%;B/,#;\xA0/#$+\")(\"'#&'#&/'$8%:\u0127% )(%'#($'#(#'#(\"'#&'#"),
        peg$decode(";\xBE"),
        peg$decode("%3\u0128\"\"5&7\u0129/k#;./b$;\xC1/Y$$%;A/,#;\xC1/#$+\")(\"'#&'#06*%;A/,#;\xC1/#$+\")(\"'#&'#&/#$+$)($'#(#'#(\"'#&'#.# &;\xBF"),
        peg$decode("%;6/k#;./b$;\xC0/Y$$%;A/,#;\xC0/#$+\")(\"'#&'#06*%;A/,#;\xC0/#$+\")(\"'#&'#&/#$+$)($'#(#'#(\"'#&'#"),
        peg$decode("%;6/;#;</2$;6.# &;H/#$+#)(#'#(\"'#&'#"),
        peg$decode(";\xC2.G &;\xC4.A &;\xC6.; &;\xC8.5 &;\xC9./ &;\xCA.) &;\xCB.# &;\xC0"),
        peg$decode("%3\u012A\"\"5%7\u012B/5#;</,$;\xC3/#$+#)(#'#(\"'#&'#"),
        peg$decode("%;I/' 8!:\u012C!! )"),
        peg$decode("%3\u012D\"\"5&7\u012E/\x97#;</\x8E$;D/\x85$;\xC5/|$$%$;'/&#0#*;'&&&#/,#;\xC5/#$+\")(\"'#&'#0C*%$;'/&#0#*;'&&&#/,#;\xC5/#$+\")(\"'#&'#&/,$;E/#$+&)(&'#(%'#($'#(#'#(\"'#&'#"),
        peg$decode(";t.# &;w"),
        peg$decode("%3\u012F\"\"5%7\u0130/5#;</,$;\xC7/#$+#)(#'#(\"'#&'#"),
        peg$decode("%;I/' 8!:\u0131!! )"),
        peg$decode("%3\u0132\"\"5&7\u0133/:#;</1$;I/($8#:\u0134#! )(#'#(\"'#&'#"),
        peg$decode("%3\u0135\"\"5%7\u0136/]#;</T$%3\u0137\"\"5$7\u0138/& 8!:\u0139! ).4 &%3\u013A\"\"5%7\u013B/& 8!:\u013C! )/#$+#)(#'#(\"'#&'#"),
        peg$decode("%3\u013D\"\"5)7\u013E/R#;</I$3\u013F\"\"5#7\u0140./ &3\u0141\"\"5(7\u0142.# &;6/($8#:\u0143#! )(#'#(\"'#&'#"),
        peg$decode("%3\u0144\"\"5#7\u0145/\x93#;</\x8A$;D/\x81$%;\xCC/e#$%2D\"\"6D7E/,#;\xCC/#$+\")(\"'#&'#0<*%2D\"\"6D7E/,#;\xCC/#$+\")(\"'#&'#&/#$+\")(\"'#&'#/,$;E/#$+%)(%'#($'#(#'#(\"'#&'#"),
        peg$decode("%3\u0146\"\"5(7\u0147./ &3\u0148\"\"5$7\u0149.# &;6/' 8!:\u014A!! )"),
        peg$decode("%;6/Y#$%;A/,#;6/#$+\")(\"'#&'#06*%;A/,#;6/#$+\")(\"'#&'#&/#$+\")(\"'#&'#"),
        peg$decode("%;\xCF/G#;./>$;\xCF/5$;./,$;\x90/#$+%)(%'#($'#(#'#(\"'#&'#"),
        peg$decode("%$;!/&#0#*;!&&&#/' 8!:\u014B!! )"),
        peg$decode("%;\xD1/]#$%;A/,#;\xD1/#$+\")(\"'#&'#06*%;A/,#;\xD1/#$+\")(\"'#&'#&/'$8\":\u014C\" )(\"'#&'#"),
        peg$decode("%;\x99/]#$%;B/,#;\xA0/#$+\")(\"'#&'#06*%;B/,#;\xA0/#$+\")(\"'#&'#&/'$8\":\u014D\" )(\"'#&'#"),
        peg$decode("%;L.O &;\x99.I &%;@.\" &\"/:#;t/1$;?.\" &\"/#$+#)(#'#(\"'#&'#/]#$%;B/,#;\xA0/#$+\")(\"'#&'#06*%;B/,#;\xA0/#$+\")(\"'#&'#&/'$8\":\u014E\" )(\"'#&'#"),
        peg$decode("%;\xD4/]#$%;B/,#;\xD5/#$+\")(\"'#&'#06*%;B/,#;\xD5/#$+\")(\"'#&'#&/'$8\":\u014F\" )(\"'#&'#"),
        peg$decode("%;\x96/& 8!:\u0150! )"),
        peg$decode("%3\u0151\"\"5(7\u0152/:#;</1$;6/($8#:\u0153#! )(#'#(\"'#&'#.g &%3\u0154\"\"5&7\u0155/:#;</1$;6/($8#:\u0156#! )(#'#(\"'#&'#.: &%3\u0157\"\"5*7\u0158/& 8!:\u0159! ).# &;\xA0"),
        peg$decode("%%;6/k#$%;A/2#;6/)$8\":\u015A\"\"$ )(\"'#&'#0<*%;A/2#;6/)$8\":\u015A\"\"$ )(\"'#&'#&/)$8\":\u015B\"\"! )(\"'#&'#.\" &\"/' 8!:\u015C!! )"),
        peg$decode("%;\xD8/Y#$%;A/,#;\xD8/#$+\")(\"'#&'#06*%;A/,#;\xD8/#$+\")(\"'#&'#&/#$+\")(\"'#&'#"),
        peg$decode("%;\x99/Y#$%;B/,#;\xA0/#$+\")(\"'#&'#06*%;B/,#;\xA0/#$+\")(\"'#&'#&/#$+\")(\"'#&'#"),
        peg$decode("%$;!/&#0#*;!&&&#/' 8!:\u015D!! )"),
        peg$decode("%;\xDB/Y#$%;B/,#;\xDC/#$+\")(\"'#&'#06*%;B/,#;\xDC/#$+\")(\"'#&'#&/#$+\")(\"'#&'#"),
        peg$decode("%3\u015E\"\"5&7\u015F.; &3\u0160\"\"5'7\u0161./ &3\u0162\"\"5*7\u0163.# &;6/& 8!:\u0164! )"),
        peg$decode("%3\u0165\"\"5&7\u0166/:#;</1$;\xDD/($8#:\u0167#! )(#'#(\"'#&'#.} &%3\xF5\"\"5'7\xF6/:#;</1$;\x9E/($8#:\u0168#! )(#'#(\"'#&'#.P &%3\u0169\"\"5+7\u016A/:#;</1$;\x9E/($8#:\u016B#! )(#'#(\"'#&'#.# &;\xA0"),
        peg$decode("3\u016C\"\"5+7\u016D.k &3\u016E\"\"5)7\u016F._ &3\u0170\"\"5(7\u0171.S &3\u0172\"\"5'7\u0173.G &3\u0174\"\"5&7\u0175.; &3\u0176\"\"5*7\u0177./ &3\u0178\"\"5)7\u0179.# &;6"),
        peg$decode(";1.\" &\""),
        peg$decode("%%;6/k#$%;A/2#;6/)$8\":\u015A\"\"$ )(\"'#&'#0<*%;A/2#;6/)$8\":\u015A\"\"$ )(\"'#&'#&/)$8\":\u015B\"\"! )(\"'#&'#.\" &\"/' 8!:\u017A!! )"),
        peg$decode("%;L.# &;\x99/]#$%;B/,#;\xE1/#$+\")(\"'#&'#06*%;B/,#;\xE1/#$+\")(\"'#&'#&/'$8\":\u017B\" )(\"'#&'#"),
        peg$decode(";\xB9.# &;\xA0"),
        peg$decode("%;\xE3/Y#$%;A/,#;\xE3/#$+\")(\"'#&'#06*%;A/,#;\xE3/#$+\")(\"'#&'#&/#$+\")(\"'#&'#"),
        peg$decode("%;\xEA/k#;./b$;\xED/Y$$%;B/,#;\xE4/#$+\")(\"'#&'#06*%;B/,#;\xE4/#$+\")(\"'#&'#&/#$+$)($'#(#'#(\"'#&'#"),
        peg$decode(";\xE5.; &;\xE6.5 &;\xE7./ &;\xE8.) &;\xE9.# &;\xA0"),
        peg$decode("%3\u017C\"\"5#7\u017D/:#;</1$;\xF0/($8#:\u017E#! )(#'#(\"'#&'#"),
        peg$decode("%3\u017F\"\"5%7\u0180/:#;</1$;T/($8#:\u0181#! )(#'#(\"'#&'#"),
        peg$decode("%3\u0182\"\"5(7\u0183/@#;</7$;\\.# &;Y/($8#:\u0184#! )(#'#(\"'#&'#"),
        peg$decode("%3\u0185\"\"5&7\u0186/:#;</1$;6/($8#:\u0187#! )(#'#(\"'#&'#"),
        peg$decode("%3\u0188\"\"5%7\u0189/O#%;</3#$;!0#*;!&/#$+\")(\"'#&'#.\" &\"/'$8\":\u018A\" )(\"'#&'#"),
        peg$decode("%;\xEB/G#;;/>$;6/5$;;/,$;\xEC/#$+%)(%'#($'#(#'#(\"'#&'#"),
        peg$decode("%3\x92\"\"5#7\xD3.# &;6/' 8!:\u018B!! )"),
        peg$decode("%3\xB1\"\"5#7\u018C.G &3\xB3\"\"5#7\u018D.; &3\xB7\"\"5#7\u018E./ &3\xB5\"\"5$7\u018F.# &;6/' 8!:\u0190!! )"),
        peg$decode("%;\xEE/D#%;C/,#;\xEF/#$+\")(\"'#&'#.\" &\"/#$+\")(\"'#&'#"),
        peg$decode("%;U.) &;\\.# &;X/& 8!:\u0191! )"),
        peg$decode("%%;!.\" &\"/[#;!.\" &\"/M$;!.\" &\"/?$;!.\" &\"/1$;!.\" &\"/#$+%)(%'#($'#(#'#(\"'#&'#/' 8!:\u0192!! )"),
        peg$decode("%%;!/?#;!.\" &\"/1$;!.\" &\"/#$+#)(#'#(\"'#&'#/' 8!:\u0193!! )"),
        peg$decode(";\xBE"),
        peg$decode("%;\x9E/^#$%;B/,#;\xF3/#$+\")(\"'#&'#06*%;B/,#;\xF3/#$+\")(\"'#&'#&/($8\":\u0194\"!!)(\"'#&'#"),
        peg$decode(";\xF4.# &;\xA0"),
        peg$decode("%2\u0195\"\"6\u01957\u0196/L#;</C$2\u0197\"\"6\u01977\u0198.) &2\u0199\"\"6\u01997\u019A/($8#:\u019B#! )(#'#(\"'#&'#"),
        peg$decode("%;\x9E/^#$%;B/,#;\xA0/#$+\")(\"'#&'#06*%;B/,#;\xA0/#$+\")(\"'#&'#&/($8\":\u019C\"!!)(\"'#&'#"),
        peg$decode("%;6/5#;0/,$;\xF7/#$+#)(#'#(\"'#&'#"),
        peg$decode("$;2.) &;4.# &;.0/*;2.) &;4.# &;.&"),
        peg$decode("$;%0#*;%&"),
        peg$decode("%;\xFA/;#28\"\"6879/,$;\xFB/#$+#)(#'#(\"'#&'#"),
        peg$decode("%3\u019D\"\"5%7\u019E.) &3\u019F\"\"5$7\u01A0/' 8!:\u01A1!! )"),
        peg$decode("%;\xFC/J#%28\"\"6879/,#;^/#$+\")(\"'#&'#.\" &\"/#$+\")(\"'#&'#"),
        peg$decode("%;\\.) &;X.# &;\x82/' 8!:\u01A2!! )"),
        peg$decode(";\".S &;!.M &2F\"\"6F7G.A &2J\"\"6J7K.5 &2H\"\"6H7I.) &2N\"\"6N7O"),
        peg$decode("2L\"\"6L7M.\x95 &2B\"\"6B7C.\x89 &2<\"\"6<7=.} &2R\"\"6R7S.q &2T\"\"6T7U.e &2V\"\"6V7W.Y &2P\"\"6P7Q.M &2@\"\"6@7A.A &2D\"\"6D7E.5 &22\"\"6273.) &2>\"\"6>7?"),
        peg$decode("%;\u0100/b#28\"\"6879/S$;\xFB/J$%2\u01A3\"\"6\u01A37\u01A4/,#;\xEC/#$+\")(\"'#&'#.\" &\"/#$+$)($'#(#'#(\"'#&'#"),
        peg$decode("%3\u01A5\"\"5%7\u01A6.) &3\u01A7\"\"5$7\u01A8/' 8!:\u01A1!! )"),
        peg$decode("%;\xEC/O#3\xB1\"\"5#7\xB2.6 &3\xB3\"\"5#7\xB4.* &$;+0#*;+&/'$8\":\u01A9\" )(\"'#&'#"),
        peg$decode("%;\u0104/\x87#2F\"\"6F7G/x$;\u0103/o$2F\"\"6F7G/`$;\u0103/W$2F\"\"6F7G/H$;\u0103/?$2F\"\"6F7G/0$;\u0105/'$8):\u01AA) )()'#(('#(''#(&'#(%'#($'#(#'#(\"'#&'#"),
        peg$decode("%;#/>#;#/5$;#/,$;#/#$+$)($'#(#'#(\"'#&'#"),
        peg$decode("%;\u0103/,#;\u0103/#$+\")(\"'#&'#"),
        peg$decode("%;\u0103/5#;\u0103/,$;\u0103/#$+#)(#'#(\"'#&'#"),
        peg$decode("%;\x84/U#;'/L$;\x92/C$;'/:$;\x90/1$; .\" &\"/#$+&)(&'#(%'#($'#(#'#(\"'#&'#"),
        peg$decode("%2\u01AB\"\"6\u01AB7\u01AC.) &2\u01AD\"\"6\u01AD7\u01AE/w#;0/n$;\u0108/e$$%;B/2#;\u0109.# &;\xA0/#$+\")(\"'#&'#0<*%;B/2#;\u0109.# &;\xA0/#$+\")(\"'#&'#&/#$+$)($'#(#'#(\"'#&'#"),
        peg$decode(";\x99.# &;L"),
        peg$decode("%2\u01AF\"\"6\u01AF7\u01B0/5#;</,$;\u010A/#$+#)(#'#(\"'#&'#"),
        peg$decode("%;D/S#;,/J$2:\"\"6:7;/;$;,.# &;T/,$;E/#$+%)(%'#($'#(#'#(\"'#&'#")
      ],

      peg$currPos          = 0,
      peg$savedPos         = 0,
      peg$posDetailsCache  = [{ line: 1, column: 1 }],
      peg$maxFailPos       = 0,
      peg$maxFailExpected  = [],
      peg$silentFails      = 0,

      peg$result;

  if ("startRule" in options) {
    if (!(options.startRule in peg$startRuleIndices)) {
      throw new Error("Can't start parsing from rule \"" + options.startRule + "\".");
    }

    peg$startRuleIndex = peg$startRuleIndices[options.startRule];
  }

  function text() {
    return input.substring(peg$savedPos, peg$currPos);
  }

  function location() {
    return peg$computeLocation(peg$savedPos, peg$currPos);
  }

  function expected(description, location) {
    location = location !== void 0 ? location : peg$computeLocation(peg$savedPos, peg$currPos)

    throw peg$buildStructuredError(
      [peg$otherExpectation(description)],
      input.substring(peg$savedPos, peg$currPos),
      location
    );
  }

  function error(message, location) {
    location = location !== void 0 ? location : peg$computeLocation(peg$savedPos, peg$currPos)

    throw peg$buildSimpleError(message, location);
  }

  function peg$literalExpectation(text, ignoreCase) {
    return { type: "literal", text: text, ignoreCase: ignoreCase };
  }

  function peg$classExpectation(parts, inverted, ignoreCase) {
    return { type: "class", parts: parts, inverted: inverted, ignoreCase: ignoreCase };
  }

  function peg$anyExpectation() {
    return { type: "any" };
  }

  function peg$endExpectation() {
    return { type: "end" };
  }

  function peg$otherExpectation(description) {
    return { type: "other", description: description };
  }

  function peg$computePosDetails(pos) {
    var details = peg$posDetailsCache[pos], p;

    if (details) {
      return details;
    } else {
      p = pos - 1;
      while (!peg$posDetailsCache[p]) {
        p--;
      }

      details = peg$posDetailsCache[p];
      details = {
        line:   details.line,
        column: details.column
      };

      while (p < pos) {
        if (input.charCodeAt(p) === 10) {
          details.line++;
          details.column = 1;
        } else {
          details.column++;
        }

        p++;
      }

      peg$posDetailsCache[pos] = details;
      return details;
    }
  }

  function peg$computeLocation(startPos, endPos) {
    var startPosDetails = peg$computePosDetails(startPos),
        endPosDetails   = peg$computePosDetails(endPos);

    return {
      start: {
        offset: startPos,
        line:   startPosDetails.line,
        column: startPosDetails.column
      },
      end: {
        offset: endPos,
        line:   endPosDetails.line,
        column: endPosDetails.column
      }
    };
  }

  function peg$fail(expected) {
    if (peg$currPos < peg$maxFailPos) { return; }

    if (peg$currPos > peg$maxFailPos) {
      peg$maxFailPos = peg$currPos;
      peg$maxFailExpected = [];
    }

    peg$maxFailExpected.push(expected);
  }

  function peg$buildSimpleError(message, location) {
    return new peg$SyntaxError(message, null, null, location);
  }

  function peg$buildStructuredError(expected, found, location) {
    return new peg$SyntaxError(
      peg$SyntaxError.buildMessage(expected, found),
      expected,
      found,
      location
    );
  }

  function peg$decode(s) {
    var bc = new Array(s.length), i;

    for (i = 0; i < s.length; i++) {
      bc[i] = s.charCodeAt(i) - 32;
    }

    return bc;
  }

  function peg$parseRule(index) {
    var bc    = peg$bytecode[index],
        ip    = 0,
        ips   = [],
        end   = bc.length,
        ends  = [],
        stack = [],
        params, i;

    while (true) {
      while (ip < end) {
        switch (bc[ip]) {
          case 0:
            stack.push(peg$consts[bc[ip + 1]]);
            ip += 2;
            break;

          case 1:
            stack.push(void 0);
            ip++;
            break;

          case 2:
            stack.push(null);
            ip++;
            break;

          case 3:
            stack.push(peg$FAILED);
            ip++;
            break;

          case 4:
            stack.push([]);
            ip++;
            break;

          case 5:
            stack.push(peg$currPos);
            ip++;
            break;

          case 6:
            stack.pop();
            ip++;
            break;

          case 7:
            peg$currPos = stack.pop();
            ip++;
            break;

          case 8:
            stack.length -= bc[ip + 1];
            ip += 2;
            break;

          case 9:
            stack.splice(-2, 1);
            ip++;
            break;

          case 10:
            stack[stack.length - 2].push(stack.pop());
            ip++;
            break;

          case 11:
            stack.push(stack.splice(stack.length - bc[ip + 1], bc[ip + 1]));
            ip += 2;
            break;

          case 12:
            stack.push(input.substring(stack.pop(), peg$currPos));
            ip++;
            break;

          case 13:
            ends.push(end);
            ips.push(ip + 3 + bc[ip + 1] + bc[ip + 2]);

            if (stack[stack.length - 1]) {
              end = ip + 3 + bc[ip + 1];
              ip += 3;
            } else {
              end = ip + 3 + bc[ip + 1] + bc[ip + 2];
              ip += 3 + bc[ip + 1];
            }

            break;

          case 14:
            ends.push(end);
            ips.push(ip + 3 + bc[ip + 1] + bc[ip + 2]);

            if (stack[stack.length - 1] === peg$FAILED) {
              end = ip + 3 + bc[ip + 1];
              ip += 3;
            } else {
              end = ip + 3 + bc[ip + 1] + bc[ip + 2];
              ip += 3 + bc[ip + 1];
            }

            break;

          case 15:
            ends.push(end);
            ips.push(ip + 3 + bc[ip + 1] + bc[ip + 2]);

            if (stack[stack.length - 1] !== peg$FAILED) {
              end = ip + 3 + bc[ip + 1];
              ip += 3;
            } else {
              end = ip + 3 + bc[ip + 1] + bc[ip + 2];
              ip += 3 + bc[ip + 1];
            }

            break;

          case 16:
            if (stack[stack.length - 1] !== peg$FAILED) {
              ends.push(end);
              ips.push(ip);

              end = ip + 2 + bc[ip + 1];
              ip += 2;
            } else {
              ip += 2 + bc[ip + 1];
            }

            break;

          case 17:
            ends.push(end);
            ips.push(ip + 3 + bc[ip + 1] + bc[ip + 2]);

            if (input.length > peg$currPos) {
              end = ip + 3 + bc[ip + 1];
              ip += 3;
            } else {
              end = ip + 3 + bc[ip + 1] + bc[ip + 2];
              ip += 3 + bc[ip + 1];
            }

            break;

          case 18:
            ends.push(end);
            ips.push(ip + 4 + bc[ip + 2] + bc[ip + 3]);

            if (input.substr(peg$currPos, peg$consts[bc[ip + 1]].length) === peg$consts[bc[ip + 1]]) {
              end = ip + 4 + bc[ip + 2];
              ip += 4;
            } else {
              end = ip + 4 + bc[ip + 2] + bc[ip + 3];
              ip += 4 + bc[ip + 2];
            }

            break;

          case 19:
            ends.push(end);
            ips.push(ip + 4 + bc[ip + 2] + bc[ip + 3]);

            if (input.substr(peg$currPos, peg$consts[bc[ip + 1]].length).toLowerCase() === peg$consts[bc[ip + 1]]) {
              end = ip + 4 + bc[ip + 2];
              ip += 4;
            } else {
              end = ip + 4 + bc[ip + 2] + bc[ip + 3];
              ip += 4 + bc[ip + 2];
            }

            break;

          case 20:
            ends.push(end);
            ips.push(ip + 4 + bc[ip + 2] + bc[ip + 3]);

            if (peg$consts[bc[ip + 1]].test(input.charAt(peg$currPos))) {
              end = ip + 4 + bc[ip + 2];
              ip += 4;
            } else {
              end = ip + 4 + bc[ip + 2] + bc[ip + 3];
              ip += 4 + bc[ip + 2];
            }

            break;

          case 21:
            stack.push(input.substr(peg$currPos, bc[ip + 1]));
            peg$currPos += bc[ip + 1];
            ip += 2;
            break;

          case 22:
            stack.push(peg$consts[bc[ip + 1]]);
            peg$currPos += peg$consts[bc[ip + 1]].length;
            ip += 2;
            break;

          case 23:
            stack.push(peg$FAILED);
            if (peg$silentFails === 0) {
              peg$fail(peg$consts[bc[ip + 1]]);
            }
            ip += 2;
            break;

          case 24:
            peg$savedPos = stack[stack.length - 1 - bc[ip + 1]];
            ip += 2;
            break;

          case 25:
            peg$savedPos = peg$currPos;
            ip++;
            break;

          case 26:
            params = bc.slice(ip + 4, ip + 4 + bc[ip + 3]);
            for (i = 0; i < bc[ip + 3]; i++) {
              params[i] = stack[stack.length - 1 - params[i]];
            }

            stack.splice(
              stack.length - bc[ip + 2],
              bc[ip + 2],
              peg$consts[bc[ip + 1]].apply(null, params)
            );

            ip += 4 + bc[ip + 3];
            break;

          case 27:
            stack.push(peg$parseRule(bc[ip + 1]));
            ip += 2;
            break;

          case 28:
            peg$silentFails++;
            ip++;
            break;

          case 29:
            peg$silentFails--;
            ip++;
            break;

          default:
            throw new Error("Invalid opcode: " + bc[ip] + ".");
        }
      }

      if (ends.length > 0) {
        end = ends.pop();
        ip = ips.pop();
      } else {
        break;
      }
    }

    return stack[0];
  }


    options.data = {}; // Object to which header attributes will be assigned during parsing

    function list (head, tail) {
      return [head].concat(tail);
    }


  peg$result = peg$parseRule(peg$startRuleIndex);

  if (peg$result !== peg$FAILED && peg$currPos === input.length) {
    return peg$result;
  } else {
    if (peg$result !== peg$FAILED && peg$currPos < input.length) {
      peg$fail(peg$endExpectation());
    }

    throw peg$buildStructuredError(
      peg$maxFailExpected,
      peg$maxFailPos < input.length ? input.charAt(peg$maxFailPos) : null,
      peg$maxFailPos < input.length
        ? peg$computeLocation(peg$maxFailPos, peg$maxFailPos + 1)
        : peg$computeLocation(peg$maxFailPos, peg$maxFailPos)
    );
  }
}

module.exports = {
  SyntaxError: peg$SyntaxError,
  parse:       peg$parse
};


/***/ }),
/* 38 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * @name SIP
 * @namespace
 */


module.exports = function (SIP) {
  var Modifiers;

  function stripPayload(sdp, payload) {
    var i;
    var media_descs = [];
    var current_media_desc;

    var lines = sdp.split(/\r\n/);

    for (i = 0; i < lines.length;) {
      var line = lines[i];
      if (/^m=(?:audio|video)/.test(line)) {
        current_media_desc = {
          index: i,
          stripped: []
        };
        media_descs.push(current_media_desc);
      } else if (current_media_desc) {
        var rtpmap = /^a=rtpmap:(\d+) ([^/]+)\//.exec(line);
        if (rtpmap && payload === rtpmap[2]) {
          lines.splice(i, 1);
          current_media_desc.stripped.push(rtpmap[1]);
          continue; // Don't increment 'i'
        }
      }

      i++;
    }

    for (i = 0; i < media_descs.length; i++) {
      var mline = lines[media_descs[i].index].split(' ');

      // Ignore the first 3 parameters of the mline. The codec information is after that
      for (var j = 3; j < mline.length;) {
        if (media_descs[i].stripped.indexOf(mline[j]) !== -1) {
          mline.splice(j, 1);
          continue;
        }
        j++;
      }

      lines[media_descs[i].index] = mline.join(' ');
    }

    return lines.join('\r\n');
  }

  Modifiers = {
    stripTcpCandidates: function stripTcpCandidates(description) {
      description.sdp = description.sdp.replace(/^a=candidate:\d+ \d+ tcp .*?\r\n/img, "");
      return SIP.Utils.Promise.resolve(description);
    },

    stripTelephoneEvent: function stripTelephoneEvent(description) {
      description.sdp = stripPayload(description.sdp, 'telephone-event');
      return SIP.Utils.Promise.resolve(description);
    },

    cleanJitsiSdpImageattr: function cleanJitsiSdpImageattr(description) {
      description.sdp = description.sdp.replace(/^(a=imageattr:.*?)(x|y)=\[0-/gm, "$1$2=[1:");
      return SIP.Utils.Promise.resolve(description);
    },

    stripG722: function stripG722(description) {
      description.sdp = stripPayload(description.sdp, 'G722');
      return SIP.Utils.Promise.resolve(description);
    },

    stripRtpPayload: function stripRtpPayload(payload) {
      return function (description) {
        description.sdp = stripPayload(description.sdp, payload);
        return SIP.Utils.Promise.resolve(description);
      };
    }
  };

  return Modifiers;
};

/***/ }),
/* 39 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(global) {
/**
 * @fileoverview Simple
 */

/* Simple
 * @class Simple
 */

module.exports = function (SIP) {

  var C = {
    STATUS_NULL: 0,
    STATUS_NEW: 1,
    STATUS_CONNECTING: 2,
    STATUS_CONNECTED: 3,
    STATUS_COMPLETED: 4
  };

  /*
   * @param {Object} options
   */
  var Simple = function Simple(options) {
    /*
     *  {
     *    media: {
     *      remote: {
     *        audio: <DOM element>,
     *        video: <DOM element>
     *      },
     *      local: {
     *        video: <DOM element>
     *      }
     *    },
     *    ua: {
     *       <UA Configuration Options>
     *    }
     *  }
     */

    if (options.media.remote.video) {
      this.video = true;
    } else {
      this.video = false;
    }

    if (options.media.remote.audio) {
      this.audio = true;
    } else {
      this.audio = false;
    }

    if (!this.audio && !this.video) {
      // Need to do at least audio or video
      // Error
      throw new Error('At least one remote audio or video element is required for Simple.');
    }

    this.options = options;

    // https://stackoverflow.com/questions/7944460/detect-safari-browser
    var browserUa = global.navigator.userAgent.toLowerCase();
    var isSafari = false;
    var isFirefox = false;
    if (browserUa.indexOf('safari') > -1 && browserUa.indexOf('chrome') < 0) {
      isSafari = true;
    } else if (browserUa.indexOf('firefox') > -1 && browserUa.indexOf('chrome') < 0) {
      isFirefox = true;
    }
    var sessionDescriptionHandlerFactoryOptions = {};
    if (isSafari) {
      sessionDescriptionHandlerFactoryOptions.modifiers = [SIP.Web.Modifiers.stripG722];
    }

    if (isFirefox) {
      sessionDescriptionHandlerFactoryOptions.alwaysAcquireMediaFirst = true;
    }

    if (!this.options.ua.uri) {
      this.anonymous = true;
    }

    this.ua = new SIP.UA({
      // User Configurable Options
      uri: this.options.ua.uri,
      authorizationUser: this.options.ua.authorizationUser,
      password: this.options.ua.password,
      displayName: this.options.ua.displayName,
      // Undocumented "Advanced" Options
      userAgentString: this.options.ua.userAgentString,
      // Fixed Options
      register: true,
      sessionDescriptionHandlerFactoryOptions: sessionDescriptionHandlerFactoryOptions,
      transportOptions: {
        traceSip: this.options.ua.traceSip,
        wsServers: this.options.ua.wsServers
      }
    });

    this.state = C.STATUS_NULL;

    this.logger = this.ua.getLogger('sip.simple');

    this.ua.on('registered', function () {
      this.emit('registered', this.ua);
    }.bind(this));

    this.ua.on('unregistered', function () {
      this.emit('unregistered', this.ua);
    }.bind(this));

    this.ua.on('failed', function () {
      this.emit('unregistered', this.ua);
    }.bind(this));

    this.ua.on('invite', function (session) {
      // If there is already an active session reject the incoming session
      if (this.state !== C.STATUS_NULL && this.state !== C.STATUS_COMPLETED) {
        this.logger.warn('Rejecting incoming call. Simple only supports 1 call at a time');
        session.reject();
        return;
      }
      this.session = session;
      this.setupSession();
      this.emit('ringing', this.session);
    }.bind(this));

    this.ua.on('message', function (message) {
      this.emit('message', message);
    }.bind(this));

    return this;
  };

  Simple.prototype = Object.create(SIP.EventEmitter.prototype);
  Simple.C = C;

  // Public

  Simple.prototype.call = function (destination) {
    if (!this.ua || !this.checkRegistration()) {
      this.logger.warn('A registered UA is required for calling');
      return;
    }
    if (this.state !== C.STATUS_NULL && this.state !== C.STATUS_COMPLETED) {
      this.logger.warn('Cannot make more than a single call with Simple');
      return;
    }
    // Safari hack, because you cannot call .play() from a non user action
    if (this.options.media.remote.audio) {
      this.options.media.remote.audio.autoplay = true;
    }
    if (this.options.media.remote.video) {
      this.options.media.remote.video.autoplay = true;
    }
    if (this.options.media.local && this.options.media.local.video) {
      this.options.media.local.video.autoplay = true;
      this.options.media.local.video.volume = 0;
    }
    this.session = this.ua.invite(destination, {
      sessionDescriptionHandlerOptions: {
        constraints: {
          audio: this.audio,
          video: this.video
        }
      }
    });
    this.setupSession();

    return this.session;
  };

  Simple.prototype.answer = function () {
    if (this.state !== C.STATUS_NEW && this.state !== C.STATUS_CONNECTING) {
      this.logger.warn('No call to answer');
      return;
    }
    // Safari hack, because you cannot call .play() from a non user action
    if (this.options.media.remote.audio) {
      this.options.media.remote.audio.autoplay = true;
    }
    if (this.options.media.remote.video) {
      this.options.media.remote.video.autoplay = true;
    }
    return this.session.accept({
      sessionDescriptionHandlerOptions: {
        constraints: {
          audio: this.audio,
          video: this.video
        }
      }
    });
    // emit call is active
  };

  Simple.prototype.reject = function () {
    if (this.state !== C.STATUS_NEW && this.state !== C.STATUS_CONNECTING) {
      this.logger.warn('Call is already answered');
      return;
    }
    return this.session.reject();
  };

  Simple.prototype.hangup = function () {
    if (this.state !== C.STATUS_CONNECTED && this.state !== C.STATUS_CONNECTING && this.state !== C.STATUS_NEW) {
      this.logger.warn('No active call to hang up on');
      return;
    }
    if (this.state !== C.STATUS_CONNECTED) {
      return this.session.cancel();
    } else {
      return this.session.bye();
    }
  };

  Simple.prototype.hold = function () {
    if (this.state !== C.STATUS_CONNECTED || this.session.local_hold) {
      this.logger.warn('Cannot put call on hold');
      return;
    }
    this.mute();
    this.logger.log('Placing session on hold');
    return this.session.hold();
  };

  Simple.prototype.unhold = function () {
    if (this.state !== C.STATUS_CONNECTED || !this.session.local_hold) {
      this.logger.warn('Cannot unhold a call that is not on hold');
      return;
    }
    this.unmute();
    this.logger.log('Placing call off hold');
    return this.session.unhold();
  };

  Simple.prototype.mute = function () {
    if (this.state !== C.STATUS_CONNECTED) {
      this.logger.warn('An acitve call is required to mute audio');
      return;
    }
    this.logger.log('Muting Audio');
    this.toggleMute(true);
    this.emit('mute', this);
  };

  Simple.prototype.unmute = function () {
    if (this.state !== C.STATUS_CONNECTED) {
      this.logger.warn('An active call is required to unmute audio');
      return;
    }
    this.logger.log('Unmuting Audio');
    this.toggleMute(false);
    this.emit('unmute', this);
  };

  Simple.prototype.sendDTMF = function (tone) {
    if (this.state !== C.STATUS_CONNECTED) {
      this.logger.warn('An active call is required to send a DTMF tone');
      return;
    }
    this.logger.log('Sending DTMF tone: ' + tone);
    this.session.dtmf(tone);
  };

  Simple.prototype.message = function (destination, message) {
    if (!this.ua || !this.checkRegistration()) {
      this.logger.warn('A registered UA is required to send a message');
      return;
    }
    if (!destination || !message) {
      this.logger.warn('A destination and message are required to send a message');
      return;
    }
    this.ua.message(destination, message);
  };

  // Private Helpers

  Simple.prototype.checkRegistration = function () {
    return this.anonymous || this.ua && this.ua.isRegistered();
  };

  Simple.prototype.setupRemoteMedia = function () {
    // If there is a video track, it will attach the video and audio to the same element
    var pc = this.session.sessionDescriptionHandler.peerConnection;
    var remoteStream;

    if (pc.getReceivers) {
      remoteStream = new global.window.MediaStream();
      pc.getReceivers().forEach(function (receiver) {
        var track = receiver.track;
        if (track) {
          remoteStream.addTrack(track);
        }
      });
    } else {
      remoteStream = pc.getRemoteStreams()[0];
    }
    if (this.video) {
      this.options.media.remote.video.srcObject = remoteStream;
      this.options.media.remote.video.play().catch(function () {
        this.logger.log('play was rejected');
      }.bind(this));
    } else if (this.audio) {
      this.options.media.remote.audio.srcObject = remoteStream;
      this.options.media.remote.audio.play().catch(function () {
        this.logger.log('play was rejected');
      }.bind(this));
    }
  };

  Simple.prototype.setupLocalMedia = function () {
    if (this.video && this.options.media.local && this.options.media.local.video) {
      var pc = this.session.sessionDescriptionHandler.peerConnection;
      var localStream;
      if (pc.getSenders) {
        localStream = new global.window.MediaStream();
        pc.getSenders().forEach(function (sender) {
          var track = sender.track;
          if (track && track.kind === 'video') {
            localStream.addTrack(track);
          }
        });
      } else {
        localStream = pc.getLocalStreams()[0];
      }
      this.options.media.local.video.srcObject = localStream;
      this.options.media.local.video.volume = 0;
      this.options.media.local.video.play();
    }
  };

  Simple.prototype.cleanupMedia = function () {
    if (this.video) {
      this.options.media.remote.video.srcObject = null;
      this.options.media.remote.video.pause();
      if (this.options.media.local && this.options.media.local.video) {
        this.options.media.local.video.srcObject = null;
        this.options.media.local.video.pause();
      }
    }
    if (this.audio) {
      this.options.media.remote.audio.srcObject = null;
      this.options.media.remote.audio.pause();
    }
  };

  Simple.prototype.setupSession = function () {
    this.state = C.STATUS_NEW;
    this.emit('new', this.session);

    this.session.on('progress', this.onProgress.bind(this));
    this.session.on('accepted', this.onAccepted.bind(this));
    this.session.on('rejected', this.onEnded.bind(this));
    this.session.on('failed', this.onFailed.bind(this));
    this.session.on('terminated', this.onEnded.bind(this));
  };

  Simple.prototype.destroyMedia = function () {
    this.session.sessionDescriptionHandler.close();
  };

  Simple.prototype.toggleMute = function (mute) {
    var pc = this.session.sessionDescriptionHandler.peerConnection;
    if (pc.getSenders) {
      pc.getSenders().forEach(function (sender) {
        if (sender.track) {
          sender.track.enabled = !mute;
        }
      });
    } else {
      pc.getLocalStreams().forEach(function (stream) {
        stream.getAudioTracks().forEach(function (track) {
          track.enabled = !mute;
        });
        stream.getVideoTracks().forEach(function (track) {
          track.enabled = !mute;
        });
      });
    }
  };

  Simple.prototype.onAccepted = function () {
    this.state = C.STATUS_CONNECTED;
    this.emit('connected', this.session);

    this.setupLocalMedia();
    this.setupRemoteMedia();
    this.session.sessionDescriptionHandler.on('addTrack', function () {
      this.logger.log('A track has been added, triggering new remoteMedia setup');
      this.setupRemoteMedia();
    }.bind(this));

    this.session.sessionDescriptionHandler.on('addStream', function () {
      this.logger.log('A stream has been added, trigger new remoteMedia setup');
      this.setupRemoteMedia();
    }.bind(this));

    this.session.on('hold', function () {
      this.emit('hold', this.session);
    }.bind(this));
    this.session.on('unhold', function () {
      this.emit('unhold', this.session);
    }.bind(this));
    this.session.on('dtmf', function (tone) {
      this.emit('dtmf', tone);
    }.bind(this));
    this.session.on('bye', this.onEnded.bind(this));
  };

  Simple.prototype.onProgress = function () {
    this.state = C.STATUS_CONNECTING;
    this.emit('connecting', this.session);
  };

  Simple.prototype.onFailed = function () {
    this.onEnded();
  };

  Simple.prototype.onEnded = function () {
    this.state = C.STATUS_COMPLETED;
    this.emit('ended', this.session);
    this.cleanupMedia();
  };

  return Simple;
};
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(28)))

/***/ }),
/* 40 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(global) {

var toplevel = global.window || global;

function getPrefixedProperty(object, name) {
  if (object == null) {
    return;
  }
  var capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);
  var prefixedNames = [name, 'webkit' + capitalizedName, 'moz' + capitalizedName];
  for (var i in prefixedNames) {
    var property = object[prefixedNames[i]];
    if (property) {
      return property.bind(object);
    }
  }
}

module.exports = {
  WebSocket: toplevel.WebSocket,
  Transport: __webpack_require__(10),
  open: toplevel.open,
  Promise: toplevel.Promise,
  timers: toplevel,

  // Console is not defined in ECMAScript, so just in case...
  console: toplevel.console || {
    debug: function debug() {},
    log: function log() {},
    warn: function warn() {},
    error: function error() {}
  },

  addEventListener: getPrefixedProperty(toplevel, 'addEventListener'),
  removeEventListener: getPrefixedProperty(toplevel, 'removeEventListener')
};
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(28)))

/***/ })
/******/ ]);
});