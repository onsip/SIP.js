/* TODO remove once Cordova is released with
   https://github.com/apache/cordova-lib/pull/71
*/
// This file contains the "title" and "version" of package.json. This allows
// src/SIP.js to require('../package.json'), but still be used as a Cordova
// module.  cordova.require doesn't support json files, but plugin.xml tells
// Cordova that package.json is actually this file, so src/SIP.js still has
// access to the fields it needs.
module.exports = {
  title: "SIP.js",
  version: "0.6.2"
};
