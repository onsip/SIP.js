var extend = require('util')._extend;

extend(exports, require('./environment_browser'));

extend(exports, {
  WebSocket: require('ws'),
  Promise: global.Promise || require('promiscuous'),
  console: require('console'),
  timers: require('timers')
});
