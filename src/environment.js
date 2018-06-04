"use strict";
var extend = require('util')._extend;

extend(exports, require('./environment_browser'));

extend(exports, {
  Promise: exports.Promise || require('promiscuous'),
  console: require('console'),
  timers: require('timers')
});
